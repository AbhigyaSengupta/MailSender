import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';

dotenv.config();

const app = express();

// --- 1. Directory Safety Check ---
// This ensures the 'uploads' folder exists to store the CSV temporarily
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log("📁 Created missing 'uploads/' directory.");
}

const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json());

// --- 2. Redis Connection ---
const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
};

const emailQueue = new Queue('hr-emails', { connection: redisOptions });

// --- 3. API Route to Process CSV ---
app.post('/api/upload', upload.single('csvFile'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const contacts = [];
    console.log(`📂 File received: ${req.file.originalname}`);

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            // DEBUG: See exactly what the computer sees in your terminal
            console.log("🔍 Row detected:", JSON.stringify(row));

            // Flexible header detection (ignores case and hidden spaces)
            const emailKey = Object.keys(row).find(key => key.toLowerCase().trim() === 'email');
            const nameKey = Object.keys(row).find(key => key.toLowerCase().trim() === 'name');

            if (emailKey && row[emailKey]) {
                contacts.push({
                    email: row[emailKey].trim(),
                    name: nameKey ? row[nameKey].trim() : 'Hiring Manager'
                });
            }
        })
        .on('end', async () => {
            console.log(`📊 Total valid contacts parsed: ${contacts.length}`);

            if (contacts.length === 0) {
                console.error("❌ No valid emails found! Ensure you used 'Save As CSV' in Excel.");
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: "Invalid CSV format or missing 'email' column." });
            }

            try {
                // Add to Redis Queue
                for (const contact of contacts) {
                    await emailQueue.add('send-mern-pitch', contact);
                    console.log(`📥 Added to Queue: ${contact.email}`);
                }

                res.json({ message: `Successfully queued ${contacts.length} emails!`, count: contacts.length });
            } catch (err) {
                console.error("❌ Redis Error:", err);
                res.status(500).json({ error: "Could not add to queue." });
            } finally {
                // Always delete the temp file after processing
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            }
        });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));