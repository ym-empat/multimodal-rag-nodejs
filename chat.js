const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const { VertexAI } = require('@google-cloud/vertexai');

const { embedText, embedImage, embedVideo } = require('./vertex');
const { search } = require('./pinecone');

dotenv.config();

const project = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION || 'us-central1';

const vertexAI = new VertexAI({ project, location });

const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
    generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.4,
    },
});

async function processInput(input) {
    if (typeof input === 'string') {
        const vector = await embedText(input);
        return { vector, type: 'text', original: input };
    }
    
    if (!input?.mimetype || !input.buffer) {
        throw new Error('Invalid file input');
    }
    
    const mime = input.mimetype;
    if (mime.startsWith('image/')) {
        const vector = await embedImage(input);
        return { vector, type: 'image', buffer: input.buffer, mime };
    }
    
    if (mime.startsWith('video/')) {
        const vectors = await embedVideo(input, 60);
        return { vector: vectors[0].embedding, type: 'video', buffer: input.buffer, mime };
    }
    
    throw new Error('Unsupported media type');
}

function buildUserPrompt({ type, original, buffer, mime }) {
    const parts = [];
    
    if (type === 'text') {

        parts.push({ text: `User prompted: ${original}` });

    } else {

        parts.push({
            text: 'Analyze this media and compare it with what you found'
        });
        
        parts.push({
            inlineData: {
                mimeType: mime,
                data: buffer.toString('base64')
            },
        });

    }
    
    return parts;
}

function buildContextParts(item) {
    const parts = [];
    
    if (item.metadata.type === 'text' && item.metadata.content) {

        parts.push({ text: `This is the most relevant description found: ${item.metadata.content}` });

    } else if (item.metadata.filename) {

        const filePath = path.join(__dirname, 'uploads', item.metadata.filename);

        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath)
            
            parts.push({ text: 'This is the most relevant media found based on the input.' });

            parts.push({
                inlineData: {
                    mimeType: item.metadata.mimeType,
                    data: buffer.toString('base64'),
                },
            });
        }

    }
    
    return parts;
}

async function chat(input) {
    const query = await processInput(input);
    
    const results = await search(query.vector, 3);
    
    const contextItem = results[0];
    
    const systemPrompt = {
        role: 'user',
        parts: [
            {
                text: "You are a multimodal assistant. Based on the user's input (either text or media), explain why the most relevant retrieved media is related to it. If the user provides a text prompt, explain how the retrieved media matches it. If the user provides a media input, explain how it is semantically related to the retrieved media. Be descriptive and accurate.",
            },
        ],
    };
    
    const userPrompt = {
        role: 'user',
        parts: buildUserPrompt(query),
    };
    
    const contextPrompt = {
        role: 'user',
        parts: buildContextParts(contextItem),
    };

    const result = await model.generateContent({
        contents: [systemPrompt, userPrompt, contextPrompt],
    });

    const response = await result.response;

    return {
        context: contextItem,
        answer: response.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated.'
    };
}

module.exports = {
    chat,
};