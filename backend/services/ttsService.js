/**
 * ttsService.js
 * -------------
 * Node.js text-to-speech using the `gtts` npm module.
 */

import * as googleTTS from 'google-tts-api';
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

    try {
        // google-tts-api handles string splitting for long strings automatically
        const results = await googleTTS.getAllAudioBase64(cleanText, {
            lang: langCode,
            slow: false,
            host: 'https://translate.google.com',
        });

        // The API returns an array of objects: { base64: string }
        // We decode these Base64 audio strings securely into Buffer chunks and concat them
        const buffers = results.map(res => Buffer.from(res.base64, 'base64'));
        return Buffer.concat(buffers);
    } catch (error) {
        console.error("google-tts-api Logic error:", error);
        throw new Error("Failed to generate speech audio.");
    }
}
