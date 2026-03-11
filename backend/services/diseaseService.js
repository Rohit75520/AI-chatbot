/**
 * diseaseService.js
 * -----------------
 * Generates structured awareness prompts for the AI.
 */

import { getAiResponse } from './ollamaService.js';

function buildDiseasePrompt(diseaseName, language) {
    return `
Please give me a complete health awareness overview about "${diseaseName}".

Structure your response with these sections:
1. 📋 What is ${diseaseName}?
2. 🦠 Causes
3. 🤒 Common Symptoms
4. ⚠️ Risk Factors
5. 🛡️ Prevention Tips
6. 💊 Treatment Overview (general — not prescriptions)
7. 🏥 When to See a Doctor

Use simple, easy-to-understand language so that even someone with no medical background can follow along.
`.trim();
}

export async function getDiseaseAwareness(diseaseName, chatId, language = "english") {
    const prompt = buildDiseasePrompt(diseaseName, language);
    return await getAiResponse(prompt, chatId, language);
}
