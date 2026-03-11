# AI Health Assistant — FastAPI Backend

An AI-driven **multi-language health awareness chatbot** backend built with **Node.js (Express)**, **Ollama (llama3)**, **MongoDB**, **@vitalets/google-translate-api**, and **gTTS**.

Users can ask about any disease in **any supported language** and receive a detailed, structured health awareness response — with optional translation and text-to-speech.

---

## 🌍 Supported Languages

| Language   | Code |
|------------|------|
| English    | `en` |
| Hindi      | `hi` |
| Telugu     | `te` |
| Tamil      | `ta` |
| Kannada    | `kn` |
| Malayalam  | `ml` |
| Bengali    | `bn` |
| Marathi    | `mr` |
| Gujarati   | `gu` |
| Punjabi    | `pa` |
| Urdu       | `ur` |

---

## 🗂️ Project Structure

```
backend/
├── main.py               ← FastAPI app, CORS, all routes
├── config.py             ← Env variables + language code map
├── models.py             ← All Pydantic schemas
├── database.py           ← MongoDB connection + CRUD helpers using pymongo
├── ollama_service.py     ← Ollama AI integration (llama3)
├── disease_service.py    ← Structured disease awareness prompts
├── translate_service.py  ← deep-translator (Google Translate)
├── tts_service.py        ← gTTS text-to-speech (MP3 stream)
├── requirements.txt      ← Python dependencies
├── .env.example          ← Environment variable template
└── README.md             ← This file
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.10+
- MongoDB server running locally (or Atlas connection URI)
- [Ollama](https://ollama.ai) installed and running

### 2. Install Ollama model
```bash
ollama serve            # Start Ollama (keep this terminal open)
ollama pull llama3      # Download llama3 model (first time only)
```

### 3. Set up Python environment
```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
copy .env.example .env
# Edit .env and verify the MONGO_URI string
```

### 5. Start the server
```bash
uvicorn main:app --reload --port 8000
```

- **Swagger UI** → http://localhost:8000/docs
- **ReDoc** → http://localhost:8000/redoc

---

## 📡 API Endpoints

### System

| Method | Endpoint      | Description                     |
|--------|---------------|---------------------------------|
| GET    | `/health`     | Server health check             |
| GET    | `/languages`  | List all supported languages    |

### Chat

| Method | Endpoint         | Description                              |
|--------|------------------|------------------------------------------|
| POST   | `/chat`          | Send a health question, get AI reply     |
| POST   | `/chat/disease`  | Get structured disease awareness info    |

### Language

| Method | Endpoint      | Description                          |
|--------|---------------|--------------------------------------|
| POST   | `/translate`  | Translate text to any language       |
| POST   | `/tts`        | Convert text to MP3 audio (stream)   |

### History

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/history/{chat_id}`  | Get all messages for a session      |
| GET    | `/sessions`           | List all chat sessions              |
| DELETE | `/history/{chat_id}`  | Delete a chat session               |

---

## 📥 Request / Response Examples

### POST `/chat`
```json
// Request
{
  "message": "What is diabetes?",
  "language": "english",
  "chat_id": "user-session-001"
}

// Response
{
  "reply": "📋 Overview\nDiabetes is a chronic condition...",
  "language": "english",
  "chat_id": "user-session-001",
  "timestamp": "2026-03-10T17:00:00"
}
```

### POST `/chat/disease`
```json
// Request
{
  "disease_name": "malaria",
  "language": "hindi",
  "chat_id": "user-session-001"
}
```

### POST `/translate`
```json
// Request
{ "text": "Drink more water every day.", "target_language": "telugu" }

// Response
{
  "original_text": "Drink more water every day.",
  "translated_text": "ప్రతిరోజూ ఎక్కువ నీళ్ళు తాగండి.",
  "target_language": "telugu",
  "lang_code": "te"
}
```

### POST `/tts`
```json
// Request
{ "text": "నీళ్ళు ఎక్కువగా తాగండి", "language": "telugu" }
// Response: audio/mpeg stream (MP3 data)
```

### GET `/history/{chat_id}`
```json
// Response
{
  "chat_id": "user-session-001",
  "messages": [
    { "id": 1, "role": "user", "message": "What is diabetes?", "language": "english", "timestamp": "2026-03-10T17:00:00" },
    { "id": 2, "role": "assistant", "message": "📋 Overview...", "language": "english", "timestamp": "2026-03-10T17:00:05" }
  ]
}
```

---

## 🗄️ Database Structure (MongoDB)

Uses a single non-relational collection inside the `health_chatbot` database.

**Collection: `chat_history`**
```json
{
  "_id": ObjectId("65cd98a1b41..."),
  "chat_id": "user-session-001",
  "role": "assistant",
  "message": "📋 Overview...",
  "language": "english",
  "timestamp": ISODate("2026-03-10T17:00:05Z")
}
```

An index on `chat_id` is **created automatically** when the server starts.

---

## 🔧 Environment Variables

| Variable       | Default                     | Description              |
|----------------|-----------------------------|--------------------------|
| `MONGO_URI`    | `mongodb://localhost:27017` | MongoDB connection URL   |
| `DB_NAME`      | `health_chatbot`            | Database name            |
| `OLLAMA_HOST`  | `http://localhost:11434`    | Ollama server URL        |
| `OLLAMA_MODEL` | `llama3`                    | Ollama model to use      |

---

## ⚠️ Important Notes

- This backend provides **health awareness information only**.
- It does **not** replace professional medical advice.
- Always recommend consulting a qualified doctor for personal health concerns.
