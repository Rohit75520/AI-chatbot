const text = "Hello *world*! 📋 **Overview**: This is a #test. 🦠 Causes: \n- 🤒 Symptoms. తెలుగులో గది పరీక్ష 🩺";
let cleanText = text.replace(/[^\p{L}\p{M}\p{N}\s.,?!'":;()]/gu, ' ');
cleanText = cleanText.replace(/\s+/g, ' ').trim();
console.log(cleanText);
