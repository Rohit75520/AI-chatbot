/**
 * ttsService.js
 * -------------
 * Node.js text-to-speech using the `gtts` npm module.
 */

import gTTS from 'gtts';
import { getLangCode } from '../config.js';

export async function textToSpeech(text, language) {
    if (!text || !text.trim()) {
        throw new Error("Text is required for TTS.");
    }

    // Aggressive Whitelist: Keep only Letters (\p{L}), Combining Marks for abugidas (\p{M}), Numbers (\p{N}), Whitespace (\s), and basic punctuation.
    // This perfectly strips all Markdown (*, -, #) and all Emojis without explicitly naming them.
    let cleanText = text.replace(/[^\p{L}\p{M}\p{N}\s.,?!'":;()]/gu, ' ');

    // Cleanup double spaces left by removed characters
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    if (!cleanText) {
        throw new Error("Text resulted in empty string after cleanup.");
    }

    const langCode = getLangCode(language);

    return new Promise((resolve, reject) => {
        try {
            const gtts = new gTTS(cleanText, langCode);
            // We want to stream it just like the python version,
            // but for Express, we can actually just pipe the stream directly,
            // or we can buffer it first into memory if we want raw bytes.
            // gtts stream logic:
            const stream = gtts.stream();
            const chunks = [];

            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', err => {
                console.error("gTTS stream error:", err);
                reject(new Error("Failed to generate speech audio."));
            });

        } catch (error) {
            console.error("TTS Logic error:", error);
            reject(new Error("Failed to start TTS engine."));
        }
    });
}
