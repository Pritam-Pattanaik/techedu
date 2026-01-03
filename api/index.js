import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';
import { sql } from '../lib/db.js';
import bcrypt from 'bcryptjs';

import dotenv from 'dotenv';

// Load environment variables locally
dotenv.config();

// Remove dotenv (Vercel injects env vars; local dev should rely on .env file loading via script)

const app = express();
const port = 3000;

// -- LAZY DB INITIALIZATION --
let prismaInstance = null;

// Helper to mask secrets in logs
const maskUrl = (url) => {
    if (!url) return 'undefined';
    try {
        // Use regex to avoid URL parser errors on partial strings
        return url.replace(/(:[^:@]+@)/, ':****@');
    } catch {
        return 'invalid-url-format';
    }
};

function getDb() {
    if (prismaInstance) return prismaInstance;

    console.log('[LazyDB] Initializing Prisma Client...');

    // Validate DATABASE_URL
    let dbUrl = process.env.DATABASE_URL;

    // Log the received URL (masked) for debugging
    console.log(`[LazyDB] Raw DATABASE_URL: ${maskUrl(dbUrl)}`);

    if (!dbUrl || typeof dbUrl !== 'string') {
        console.warn('[LazyDB] DATABASE_URL missing or invalid type. Using placeholder.');
        // Don't use a placeholder that might timeout silently. Fail fast if desired, or use a clearly invalid one.
        // But for Vercel build steps, we sometimes need a dummy. 
        // Better strategy: Throw if we are in a context that requires real DB access.
        // For now, keep fallback but log heavily.
        dbUrl = 'postgresql://user:pass@localhost:5432/db';
    }

    // Sanitize
    dbUrl = dbUrl.trim();
    // Remove surrounding quotes - robust regex for multiple quote types
    dbUrl = dbUrl.replace(/^["']+|["']+$/g, '');

    // Protocol fixes
    if (dbUrl.startsWith('postgres://')) {
        dbUrl = dbUrl.replace('postgres://', 'postgresql://');
    }
    if (dbUrl.startsWith('neondb://')) {
        dbUrl = dbUrl.replace('neondb://', 'postgresql://');
    }

    // Fix: Prepend protocol if missing entirely (e.g. user pasted raw connection string)
    if (!dbUrl.includes('://')) {
        console.log('[LazyDB] 🔧 Protocol missing, appending postgresql://');
        dbUrl = `postgresql://${dbUrl}`;
    }

    // CRITICAL for Vercel: Ensure SSL usage is enforced if remote
    if (dbUrl.includes('vercel-storage.com') || dbUrl.includes('neon.tech') || dbUrl.includes('supabase.co')) {
        if (!dbUrl.includes('sslmode=')) {
            // Append sslmode=require based on existing query params
            const separator = dbUrl.includes('?') ? '&' : '?';
            dbUrl = `${dbUrl}${separator}sslmode=require`;
        }
    }

    console.log(`[LazyDB] Final Sanitized URL: ${maskUrl(dbUrl)}`);

    // CRITICAL: Patch the environment variable itself
    // Prisma Engine might validate env("DATABASE_URL") from schema independently of constructor args
    process.env.DATABASE_URL = dbUrl;

    // Attempt to connect
    try {
        prismaInstance = new PrismaClient({
            datasources: {
                db: {
                    url: dbUrl,
                },
            },
            // Add logging for detailed query info if needed (optional)
            // log: ['error', 'warn'], 
        });
        return prismaInstance;
    } catch (e) {
        console.error('[LazyDB] Initialization Failed:', e);
        throw e;
    }
}

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Middleware
app.use(cors());
app.use(express.json());

// File Upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// API Routes

// Health check (NO DB DEPENDENCY)
// Health check (Try to verify DB connection)
app.get('/api/health', async (req, res) => {
    let dbStatus = 'unknown';
    try {
        const db = getDb();
        // Lightweight check
        await db.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e) {
        dbStatus = 'disconnected';
        console.error('[Health] DB Check Failed:', e.message);
    }

    res.json({
        status: 'ok',
        db_status: dbStatus,
        env_check: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
    });
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
    try {
        // Test connection
        const result = await sql`SELECT NOW()`;

        return res.json({
            status: 'success',
            message: 'Neon DB connected!',
            timestamp: result[0].now
        });

    } catch (error) {
        console.error('DB Test Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message,
            details: error.toString()
        });
    }
});

// Get all courses (Exclude syllabusData for performance)
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await sql`
            SELECT id, title, description, image, registrations, syllabus_name as "syllabusName" 
            FROM courses
            ORDER BY id ASC
        `;

        const coursesWithUrl = courses.map(c => ({
            ...c,
            syllabusUrl: c.syllabusName
                ? `/api/courses/${c.id}/syllabus`
                : null
        }));
        res.json(coursesWithUrl);
    } catch (err) {
        console.error('[API] /courses failed:', err);
        return res.status(500).json({
            error: 'Failed to fetch courses',
            details: err.message
        });
    }
});

// Download Syllabus
app.get('/api/courses/:id/syllabus', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        const course = await db.course.findUnique({
            where: { id: parseInt(id) },
            select: { syllabusData: true, syllabusType: true, syllabusName: true }
        });

        if (!course || !course.syllabusData) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.setHeader('Content-Type', course.syllabusType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${course.syllabusName || 'syllabus.pdf'}"`);
        res.send(course.syllabusData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a course
app.post('/api/courses', upload.single('syllabus'), async (req, res) => {
    const { title, description, image } = req.body;

    try {
        const courseData = {
            title,
            description,
            image
        };

        if (req.file) {
            courseData.syllabusData = req.file.buffer;
            courseData.syllabusType = req.file.mimetype;
            courseData.syllabusName = req.file.originalname;
        }

        const db = getDb();
        const newCourse = await db.course.create({ data: courseData });

        // Don't send back binary data
        const { syllabusData, ...safeCourse } = newCourse;
        res.json(safeCourse);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update a course
app.put('/api/courses/:id', upload.single('syllabus'), async (req, res) => {
    const { id } = req.params;
    const { title, description, image } = req.body;

    try {
        const updateData = { title, description, image };

        if (req.file) {
            updateData.syllabusData = req.file.buffer;
            updateData.syllabusType = req.file.mimetype;
            updateData.syllabusName = req.file.originalname;
        }

        const db = getDb();
        const updatedCourse = await db.course.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        const { syllabusData, ...safeCourse } = updatedCourse;
        res.json(safeCourse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a course
app.delete('/api/courses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        await db.course.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all leads
app.get('/api/leads', async (req, res) => {
    try {
        const db = getDb();
        const leads = await db.lead.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a lead
app.post('/api/leads', async (req, res) => {
    const { name, email, phone, courseTitle, courseId } = req.body;
    try {
        const db = getDb();
        const newLead = await db.lead.create({
            data: {
                name,
                email,
                phone,
                courseTitle,
                courseId: parseInt(courseId) || null
            }
        });
        res.json(newLead);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Endpoint (Updated for Neon + Users table + Auto-Seed)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Query user from Neon DB
        let users = await sql`
            SELECT * FROM users 
            WHERE email = ${email}
            LIMIT 1
        `;

        // --- FIRST RUN AUTO-SEED ---
        // If NO users exist in the DB at all, and the user is trying to login with default credentials,
        // we create the admin. This mimics the original behavior of lazy-config-creation.
        if (users.length === 0) {
            const allUsersCount = await sql`SELECT count(*) FROM users`;
            if (parseInt(allUsersCount[0].count) === 0 && email === 'admin@techedu.com' && password === 'admin123') {
                console.log('[Auth] First run detected. Creating admin user.');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await sql`
                    INSERT INTO users (email, password, name, role)
                    VALUES (${email}, ${hashedPassword}, 'Admin User', 'admin')
                `;
                // Re-fetch
                users = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
            }
        }
        // ---------------------------

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user data (exclude password)
        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Server error. Check DB connection.',
            details: error.message
        });
    }
});

// Update Admin Password
app.post('/api/config/password', async (req, res) => {
    const { password } = req.body;
    try {
        const db = getDb();
        await db.config.upsert({
            where: { key: 'admin_password' },
            update: { value: password },
            create: { key: 'admin_password', value: password }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Asset (Logo/Favicon)
app.post('/api/config/assets', upload.single('file'), async (req, res) => {
    const { key } = req.body; // 'site_logo' or 'site_favicon'
    if (!req.file || !key) return res.status(400).json({ error: 'Missing file or key' });

    try {
        const db = getDb();
        await db.config.upsert({
            where: { key },
            update: {
                data: req.file.buffer,
                mimeType: req.file.mimetype
            },
            create: {
                key,
                data: req.file.buffer,
                mimeType: req.file.mimetype
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve Asset
app.get('/api/assets/:key', async (req, res) => {
    const { key } = req.params;
    try {
        const result = await sql`
            SELECT data, mime_type as "mimeType" FROM config 
            WHERE key = ${key}
            LIMIT 1
        `;

        if (result.length === 0 || !result[0].data) {
            return res.status(404).send('Asset not found');
        }

        const asset = result[0];
        res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
        res.send(asset.data);

    } catch (err) {
        console.error('Asset error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Serve static files in production
// Static file serving is handled by Vercel for frontend
// No need for express.static here in serverless mode

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

export default app;
