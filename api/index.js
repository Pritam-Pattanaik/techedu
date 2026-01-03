import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';

// Remove dotenv (Vercel injects env vars; local dev should rely on .env file loading via script)

const app = express();
const port = 3000;

// -- LAZY DB INITIALIZATION --
let prismaInstance = null;

function getDb() {
    if (prismaInstance) return prismaInstance;

    console.log('[LazyDB] Initializing Prisma Client...');

    // Validate DATABASE_URL
    let dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || typeof dbUrl !== 'string') {
        console.warn('[LazyDB] DATABASE_URL missing or invalid type. Using placeholder.');
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

    // Final check: If URL became empty or too short, revert to placeholder to pass validation
    if (dbUrl.length < 10) {
        console.warn('[LazyDB] DATABASE_URL too short after sanitization. Using placeholder.');
        dbUrl = 'postgresql://user:pass@localhost:5432/db';
    }

    // CRITICAL: Patch the environment variable itself
    // Prisma Engine might validate env("DATABASE_URL") from schema independently of constructor args
    process.env.DATABASE_URL = dbUrl;

    // Attempt to connect
    try {
        console.log(`[LazyDB] Connecting with URL length: ${dbUrl.length}`);
        prismaInstance = new PrismaClient({
            datasources: {
                db: {
                    url: dbUrl,
                },
            },
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
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        db_configured: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
    });
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
    try {
        const db = getDb(); // Lazy Init
        const tables = await db.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        res.json({ success: true, tables });
    } catch (error) {
        console.error('DB Test Failed:', error);
        res.status(500).json({ error: error.message, details: error.toString() });
    }
});

// Get all courses (Exclude syllabusData for performance)
app.get('/api/courses', async (req, res) => {
    try {
        const db = getDb();
        const courses = await db.course.findMany({
            orderBy: { id: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                image: true,
                registrations: true,
                syllabusName: true
            }
        });



        // Provide clear hint if it's a connection error
        if (err.message.includes('Can\'t reach database') || err.message.includes('Authentication failed')) {
            return res.status(500).json({
                error: 'Database Connection Failed',
                hint: 'Check Vercel Environment Variables: DATABASE_URL might be missing or invalid.',
                details: err.message
            });
        }
        res.status(500).json({ error: err.message });
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

// Admin Login Check
app.post('/api/login', async (req, res) => {
    const { password } = req.body;
    try {
        const db = getDb();
        let config = await db.config.findUnique({ where: { key: 'admin_password' } });

        // Lazy initialization for first-time login
        if (!config) {
            config = await db.config.create({
                data: { key: 'admin_password', value: 'admin123' }
            });
        }

        if (config.value === password) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message, details: 'Login failed' });
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
        const db = getDb();
        const asset = await db.config.findUnique({ where: { key } });
        if (!asset || !asset.data) return res.status(404).send('Asset not found');

        res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
        res.send(asset.data);
    } catch (err) {
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
