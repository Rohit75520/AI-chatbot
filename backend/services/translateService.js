/**
 * translateService.js
 * -------------------
 * Native JS translation port using @vitalets/google-translate-api
 */

import translate from 'translate';
import { getLangCode } from '../config.js';

// Configure translate to use the free Google engine
translate.engine = 'google';

export async function translateText(text, targetLanguage) {
    if (!text || !text.trim()) {
        throw new Error("Text is required for translation.");
    }

    const langCode = getLangCode(targetLanguage);

    try {
        const translatedText = await translate(text, { to: langCode });

        return {
            original_text: text,
            translated_text: translatedText,
            target_language: targetLanguage,
            target_language_code: langCode,
            detected_source_language: "auto" // 'translate' lib abstracts this away
        };
    } catch (error) {
        console.error("Translation Error:", error);
        throw new Error("Translation failed. Ensure you have an internet connection.");
    }
}
