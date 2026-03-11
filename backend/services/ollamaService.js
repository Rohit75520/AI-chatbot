/**
 * ollamaService.js
 * ----------------
 * Communication with Ollama local server using native fetch.
 */

import { OLLAMA_HOST, OLLAMA_MODEL } from '../config.js';
import { getChatHistory } from '../database.js';
import { translateText } from './translateService.js';

const HEALTH_SYSTEM_PROMPT = `
You are ArogyaAI, an expert multilingual health awareness assistant.

Your responsibilities:
1. Provide extremely concise, straight-to-the-point health information.
2. ALWAYS respond in ENGLISH, regardless of the user's input language.
3. CRITICAL: DO NOT WRITE PARAGRAPHS. You must ONLY output brief, punchy key-points. If you write a paragraph or a long explanation, you have FAILED.
4. SPEAK SIMPLY at a 5th-grade reading level.
5. BE HIGHLY STRUCTURED: Use short bullet points and bold section headers.
6. Limit explanations per section to 1-2 short sentences maximum.
7. BOUNDARY RULE: You are a healthcare assistant. You MUST answer ANY question related to diseases, symptoms, medicine, fitness, diet, hygiene, or general wellness. ONLY if the question is 100% unrelated to health (e.g., coding, math, geography), you should reply EXACTLY with: "I am a health care chatbot please ask me health care related questions"

Format your response strictly using these short sections (omit irrelevant ones):
- 📋 **Overview**: (1 brief sentence ONLY)
- 🦠 **Causes**: (2-3 short bullets ONLY)
- 🤒 **Symptoms**: (2-3 short bullets ONLY)
- 🛡️ **Prevention**: (2-3 short bullets ONLY)
- 🏥 **Action**: (1 sentence on when to see a doctor ONLY)
`;

export async function getAiResponse(userId, userMessage, chatId, language = "english") {
    // 1 — Load existing conversation for context
    const historyRows = await getChatHistory(userId, chatId);

    // 2 — Build message list for Ollama
    const messages = [{ role: "system", content: HEALTH_SYSTEM_PROMPT }];

    for (const row of historyRows) {
        messages.push({
            role: row.role,
            content: row.message
        });
    }

    messages.push({
        role: "user",
        content: `[User's input language: ${language}]\n${userMessage}`
    });

    const payload = {
        model: OLLAMA_MODEL,
        messages: messages,
        stream: true // Enable streaming to prevent socket timeouts on long generations
    };

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ollama HTTP error ${response.status}: ${errText}`);
        }

        // Native Node fetch streaming implementation
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullContent = "";
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let newlineIndex;

            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);

                if (line) {
                    try {
                        const json = JSON.parse(line);
                        if (json.message && json.message.content) {
                            fullContent += json.message.content;
                        }
                    } catch (e) {
                         // Ignore incomplete JSON
                    }
                }
            }
        }

        // Translate the final English response into the requested language
        if (language.toLowerCase() !== "english") {
            try {
                const translationResult = await translateText(fullContent, language);
                fullContent = translationResult.translated_text;
            } catch (translationError) {
                console.error("Translation fallback failed:", translationError);
                fullContent += "\n\n*(Note: Translation service temporarily unavailable. Displaying original English response.)*";
            }
        }

        return fullContent;

    } catch (error) {
        console.error("Ollama error:", error);
        return `❌ Unexpected error contacting Ollama: ${error.message}`;
    }
}
