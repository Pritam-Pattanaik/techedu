import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// File Upload Config (Memory Storage for DB)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize Database
const initDB = async () => {
    try {
        const existingConfig = await prisma.config.findUnique({ where: { key: 'admin_password' } });
        if (!existingConfig) {
            await prisma.config.create({
                data: { key: 'admin_password', value: 'admin123' }
            });
            console.log('Admin password initialized');
        }
        console.log('Database connected via Prisma');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

initDB();

// API Routes

// Get all courses (Exclude syllabusData for performance)
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
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

        // Dynamically construct URL for frontend compatibility
        const coursesWithUrl = courses.map(c => ({
            ...c,
            syllabusUrl: c.syllabusName
                ? `http://localhost:${port}/api/courses/${c.id}/syllabus`
                : null
        }));
        res.json(coursesWithUrl);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Download Syllabus
app.get('/api/courses/:id/syllabus', async (req, res) => {
    const { id } = req.params;
    try {
        const course = await prisma.course.findUnique({
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

        const newCourse = await prisma.course.create({ data: courseData });

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

        const updatedCourse = await prisma.course.update({
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
        await prisma.course.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all leads
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit a lead
app.post('/api/leads', async (req, res) => {
    const { name, email, phone, courseTitle, courseId } = req.body;
    try {
        const newLead = await prisma.lead.create({
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
        const config = await prisma.config.findUnique({ where: { key: 'admin_password' } });
        if (config && config.value === password) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Admin Password
app.post('/api/config/password', async (req, res) => {
    const { password } = req.body;
    try {
        await prisma.config.upsert({
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
        await prisma.config.upsert({
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
        const asset = await prisma.config.findUnique({ where: { key } });
        if (!asset || !asset.data) return res.status(404).send('Asset not found');

        res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
        res.send(asset.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static files in production
const __dirname = dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
}

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

export default app;
