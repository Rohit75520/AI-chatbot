async function runTests() {
    const baseUrl = "http://localhost:8000";
    const results = {};

    console.log("Starting API Verification Tests...");

    try {
        // 1. GET /health
        console.log("Testing GET /health...");
        let res = await fetch(`${baseUrl}/health`);
        results["1. GET /health"] = { status: res.status, data: await res.json() };

        // 2. GET /languages
        console.log("Testing GET /languages...");
        res = await fetch(`${baseUrl}/languages`);
        results["2. GET /languages"] = { status: res.status, data: await res.json() };

        // 3. POST /translate
        console.log("Testing POST /translate...");
        res = await fetch(`${baseUrl}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "Hello, please rest well.", target_language: "hindi" })
        });
        results["3. POST /translate"] = { status: res.status, data: await res.json() };

        // 4. POST /tts
        console.log("Testing POST /tts...");
        res = await fetch(`${baseUrl}/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "Testing audio", language: "english" })
        });
        results["4. POST /tts"] = {
            status: res.status,
            contentType: res.headers.get("content-type"),
            isBuffer: res.ok
        };

        // 5. POST /chat
        console.log("Testing POST /chat (This may take a moment for Ollama)...");
        res = await fetch(`${baseUrl}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: "auto-test-001", message: "I have a mild fever.", language: "english" })
        });
        results["5. POST /chat"] = { status: res.status, data: await res.json() };

        // 6. POST /chat/disease
        console.log("Testing POST /chat/disease (This may take a moment for Ollama)...");
        res = await fetch(`${baseUrl}/chat/disease`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: "auto-test-001", disease_name: "flu", language: "english" })
        });
        results["6. POST /chat/disease"] = { status: res.status, data: await res.json() };

        // 7. GET /history/:chat_id
        console.log("Testing GET /history...");
        res = await fetch(`${baseUrl}/history/auto-test-001`);
        let historyData = await res.json();
        results["7. GET /history/:chat_id"] = {
            status: res.status,
            messageCount: historyData.messages ? historyData.messages.length : 0
        };

        // 8. GET /sessions
        console.log("Testing GET /sessions...");
        res = await fetch(`${baseUrl}/sessions`);
        let sessionsData = await res.json();
        results["8. GET /sessions"] = {
            status: res.status,
            sessionCount: sessionsData.sessions ? sessionsData.sessions.length : 0
        };

        // 9. DELETE /history/:chat_id
        console.log("Testing DELETE /history...");
        res = await fetch(`${baseUrl}/history/auto-test-001`, { method: "DELETE" });
        results["9. DELETE /history/:chat_id"] = { status: res.status, data: await res.json() };

        console.log("\n================ TEST RESULTS ================\n");
        console.log(JSON.stringify(results, null, 2));

    } catch (e) {
        console.error("Test execution failed:", e);
    }
}

runTests();
