/**
 * index.js
 * --------
 * Express application entry point for the AI Health Assistant backend.
 * Replaces main.py.
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Databases and Config
import { initDb, saveChat, getChatHistory, getAllSessions, deleteSession, updateSessionTitle, User } from './database.js';
import { SUPPORTED_LANGUAGES } from './config.js';

// Services
import { getAiResponse } from './services/ollamaService.js';
import { getDiseaseAwareness } from './services/diseaseService.js';
import { translateText } from './services/translateService.js';
import { textToSpeech } from './services/ttsService.js';

const app = express();
app.use(cors());
app.use(express.json());
// Add urlencoded just in case requests come in form form-data
app.use(express.urlencoded({ extended: true }));

// Initialize DB on startup
initDb();

const JWT_SECRET = process.env.JWT_SECRET || "arogyai_super_secret_key_123";

// ── Authentication Middleware ──────────────────────────────────────────────────

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ detail: "Access Token Required" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ detail: "Invalid Token" });
        req.user = user;
        next();
    });
}

// ── Auth Routes ──────────────────────────────────────────────────────────────

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ detail: "Username and password required" });

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(409).json({ detail: "Username already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ detail: "Username and password required" });

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ detail: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ detail: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── GET /health ───────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
    res.json({ status: "ok", message: "AI Express Health Assistant is running" });
});

// ── GET /languages ────────────────────────────────────────────────────────────

app.get('/languages', (req, res) => {
    const langs = Object.entries(SUPPORTED_LANGUAGES).map(([name, code]) => ({
        name, code
    }));
    res.json({ supported_languages: langs });
});

// ── POST /chat ────────────────────────────────────────────────────────────────

app.post('/chat', verifyToken, async (req, res) => {
    try {
        const { chat_id, message, language = "english" } = req.body;
        const userId = req.user.userId;
        if (!chat_id || !message) return res.status(400).json({ detail: "chat_id and message are required" });

        // Save user message
        await saveChat(userId, chat_id, "user", message, language);

        // Get AI response
        const reply = await getAiResponse(userId, message, chat_id, language);

        // Save AI reply
        await saveChat(userId, chat_id, "assistant", reply, language);

        res.json({
            reply: reply,
            language: language,
            chat_id: chat_id,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── POST /chat/disease ────────────────────────────────────────────────────────

app.post('/chat/disease', async (req, res) => {
    try {
        const { chat_id, disease_name, language = "english" } = req.body;
        if (!chat_id || !disease_name) return res.status(400).json({ detail: "chat_id and disease_name are required" });

        await saveChat(chat_id, "user", `Tell me about ${disease_name}`, language);

        const reply = await getDiseaseAwareness(disease_name, chat_id, language);

        await saveChat(chat_id, "assistant", reply, language);

        res.json({
            reply: reply,
            language: language,
            chat_id: chat_id,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── POST /translate ───────────────────────────────────────────────────────────

app.post('/translate', async (req, res) => {
    try {
        const { text, target_language } = req.body;
        if (!text || !target_language) return res.status(400).json({ detail: "text and target_language are required" });

        const result = await translateText(text, target_language);
        res.json(result);
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── POST /tts ─────────────────────────────────────────────────────────────────

app.post('/tts', async (req, res) => {
    try {
        const { text, language = "english" } = req.body;
        if (!text) return res.status(400).json({ detail: "text is required" });

        const audioBuffer = await textToSpeech(text, language);

        res.set('Content-Type', 'audio/mpeg');
        res.set('Content-Disposition', 'inline; filename="speech.mp3"');
        res.send(audioBuffer);
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── GET /history/:chat_id ────────────────────────────────────────────────────

app.get('/history/:chat_id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const rows = await getChatHistory(userId, req.params.chat_id);
        res.json({ chat_id: req.params.chat_id, messages: rows });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── GET /sessions ─────────────────────────────────────────────────────────────

app.get('/sessions', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const sessions = await getAllSessions(userId);
        res.json({ sessions });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── PUT /sessions/:chat_id/title ─────────────────────────────────────────────

app.put('/sessions/:chat_id/title', verifyToken, async (req, res) => {
    try {
        const { title } = req.body;
        const userId = req.user.userId;
        if (!title) return res.status(400).json({ detail: "Title is required" });
        await updateSessionTitle(userId, req.params.chat_id, title);
        res.json({ message: "Title updated successfully", chat_id: req.params.chat_id, title });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── DELETE /history/:chat_id ─────────────────────────────────────────────────

app.delete('/history/:chat_id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const deleted = await deleteSession(userId, req.params.chat_id);
        res.json({ message: `Deleted ${deleted} message(s) for session '${req.params.chat_id}'` });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// ── Server Start ──────────────────────────────────────────────────────────────

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`🚀 Express server running on http://localhost:${PORT}`);
});
