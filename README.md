# Multimodal RAG with Node.js, Vertex AI, and Pinecone

This project demonstrates how to build a backend for a **Multimodal Retrieval-Augmented Generation (RAG)** system using:

- **Node.js** and **Express** for the backend
- **Google Vertex AI** for generating text, image, and video embeddings
- **Pinecone** for storing and querying vector representations

---

## 📦 Features

- Upload and vectorize content via `/upload`:
  - Supports **text**, **images**, and **videos**
  - Video is split into segments and each segment is vectorized individually (by Vertex AI)
- Store vectors with metadata in Pinecone
- Search via `/search` endpoint using a natural language query
  - Returns top 3 most relevant items with metadata

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/ym-empat/multimodal-rag-nodejs.git
cd multimodal-rag-nodejs
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file from `.env.example`
```env
PORT=3000

GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

PINECONE_API_KEY=example_api_key
PINECONE_INDEX_NAME=example_index
```

### 4. Run the server
```bash
node app.js
```

---

## 🧪 API Endpoints

### `POST /upload`

Upload content to be vectorized and stored in Pinecone.

#### Supported inputs:
- `content` field in `multipart/form-data`
  - If it's **text** → processed as text
  - If it's an **image** → embedded using Vertex AI
  - If it's a **video** → embedded using Vertex AI

---

### `POST /search`

Query Pinecone using a natural language string.

#### JSON Body:
```json
{
  "query": "How do I change the theme color?"
}
```

Returns metadata for the top 3 most similar results.

---

## 📁 Project Structure

```
.
├── app.js                # Main Express server
├── vertex.js             # Vertex AI embedding logic
├── pinecone.js           # Pinecone vector storage & search
├── .env                  # Environment variables
└── README.md
```

---

## 🧠 Technologies Used

- **Node.js + Express**
- **Google Vertex AI**
- **Pinecone Vector DB**

---

## 📌 Coming Soon

- Conversational RAG using **LangChain** + **OpenAI**

---

## 📄 License

MIT — feel free to use and adapt.

---

## 🤝 Contributing

Feel free to open issues or submit pull requests if you’d like to collaborate or extend the project.