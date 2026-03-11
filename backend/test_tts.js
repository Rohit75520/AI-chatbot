import * as googleTTS from 'google-tts-api';
import fs from 'fs';

async function test() {
    try {
        const url = googleTTS.getAudioUrl('నమస్కారం ఎలా ఉన్నారు. ఇది ఒక పరీక్ష.', {
            lang: 'te',
            slow: false,
            host: 'https://translate.google.com',
        });
        console.log(url);
    } catch(e) {
        console.error(e);
    }
}
test();
