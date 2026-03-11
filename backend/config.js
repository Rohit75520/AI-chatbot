/**
 * config.js
 * ---------
 * Loads environment variables from .env file and exposes them.
 * All service modules import from here.
 */

import dotenv from 'dotenv';
dotenv.config();

// ── Database ────────────────────────────────────────────────────────────────
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
export const DB_NAME = process.env.DB_NAME || "health_chatbot";

// ── Ollama ───────────────────────────────────────────────────────────────────
export const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

// ── Language support ─────────────────────────────────────────────────────────
// Maps user-friendly language names → Google Translate language codes
const SUPPORTED_LANGUAGES = {
    "english":   "en",
    "hindi":     "hi",
    "telugu":    "te",
    "tamil":     "ta",
    "kannada":   "kn",
    "malayalam": "ml",
    "bengali":   "bn",
    "marathi":   "mr",
    "gujarati":  "gu",
    "punjabi":   "pa",
    "urdu":      "ur",
};

/**
 * Return the BCP-47 language code for the given language name.
 * Falls back to 'en' (English) if the language is not recognized.
 */
export function getLangCode(language) {
    if (!language) return "en";
    return SUPPORTED_LANGUAGES[language.toLowerCase()] || "en";
}

export { SUPPORTED_LANGUAGES };
