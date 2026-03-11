/**
 * database.js
 * -----------
 * All MongoDB database logic using Mongoose.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MONGO_URI, DB_NAME } from './config.js';

// ── Schema definition ────────────────────────────────────────────────────────

const chatHistorySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    chat_id: { type: String, required: true, index: true },
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    message: { type: String, required: true },
    language: { type: String, default: 'english' },
    timestamp: { type: Date, default: Date.now }
}, {
    collection: 'chat_history' // Explicitly match the collection used by Python
});

export const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

const sessionMetaSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    chat_id: { type: String, required: true, unique: true },
    title: { type: String, required: true }
}, {
    collection: 'session_meta'
});

export const SessionMeta = mongoose.model('SessionMeta', sessionMetaSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    collection: 'users'
});

export const User = mongoose.model('User', userSchema);

// ── Connection helper ────────────────────────────────────────────────────────

export async function initDb() {
    try {
        const uri = `${MONGO_URI}/${DB_NAME}`;
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ MongoDB connected and initialised successfully via Mongoose.");
        await initDemoUser();
    } catch (error) {
        console.error(`⚠️ MongoDB connection warning: ${error.message}`);
    }
}

async function initDemoUser() {
    try {
        const existingInfo = await User.findOne({ username: 'demo' });
        if (!existingInfo) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);
            await new User({ username: 'demo', password: hashedPassword }).save();
            console.log("✅ Created default 'demo' user for testing.");
        }
    } catch (e) {
        console.error("Failed to seed demo user", e);
    }
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export async function saveChat(userId, chatId, role, message, language = "english") {
    const doc = new ChatHistory({
        user_id: userId,
        chat_id: chatId,
        role: role,
        message: message,
        language: language
    });
    await doc.save();
}

export async function getChatHistory(userId, chatId) {
    // Sort oldest first
    const docs = await ChatHistory.find({ user_id: userId, chat_id: chatId }).sort({ _id: 1 });

    return docs.map((doc, idx) => ({
        id: idx + 1,
        chat_id: doc.chat_id,
        role: doc.role,
        message: doc.message,
        language: doc.language || 'english',
        timestamp: doc.timestamp.toISOString().split('.')[0] // formatting roughly like python
    }));
}

export async function getAllSessions(userId) {
    const pipeline = [
        {
            $match: { user_id: new mongoose.Types.ObjectId(userId) }
        },
        {
            $group: {
                _id: "$chat_id",
                message_count: { $sum: 1 },
                last_active: { $max: "$timestamp" }
            }
        },
        {
            $sort: { last_active: -1 }
        }
    ];

    const docs = await ChatHistory.aggregate(pipeline);

    const metaDocs = await SessionMeta.find({ chat_id: { $in: docs.map(d => d._id) } });
    const metaMap = metaDocs.reduce((acc, doc) => {
        acc[doc.chat_id] = doc.title;
        return acc;
    }, {});

    return docs.map(doc => ({
        chat_id: doc._id,
        title: metaMap[doc._id] || null, // Custom title or null
        message_count: doc.message_count,
        last_active: doc.last_active.toISOString().split('.')[0]
    }));
}

export async function updateSessionTitle(userId, chatId, newTitle) {
    await SessionMeta.findOneAndUpdate(
        { user_id: userId, chat_id: chatId },
        { title: newTitle },
        { upsert: true, new: true }
    );
}

export async function deleteSession(userId, chatId) {
    await SessionMeta.deleteOne({ user_id: userId, chat_id: chatId });
    const result = await ChatHistory.deleteMany({ user_id: userId, chat_id: chatId });
    return result.deletedCount;
}
