const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const { embedText, embedImage, embedVideo } = require('./vertex');
const { upsertToIndex, search } = require('./pinecone');
const { generateTimestampFilename } = require('./utils/generateFilename');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Multer setup (store files in memory)
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'OK' });
});

app.post('/upload', upload.single('content'), async (req, res) => {
    const file = req.file;
    const text = req.body.content;

    try {
        if(file) {
            const mime = file.mimetype;
            const filename = generateTimestampFilename(file.originalname);
            const storagePath = path.join(__dirname, 'uploads', filename);

            fs.writeFileSync(storagePath, file.buffer);

            if (mime.startsWith('image/')) {
                
                console.log('embedding image');
                const vector = await embedImage(file);
                await upsertToIndex({ vectors: [vector], type: 'image', filename });
            
            } else if (mime.startsWith('video/')) {
            
                console.log('embedding video');
                const vectors = await embedVideo(file);
                await upsertToIndex({ vectors, type: 'video', filename });
        
            } else {
                return res.status(400).json({ error: 'Unsupported file type' });
            }
        } else if (text) {
            
            console.log('text');
            const vector = await embedText(text);
            await upsertToIndex({ vectors: [vector], type: 'text', content: text });
       
        }

        res.status(200).json({ message: 'OK' });
    } catch (err) {
        console.error(err);

        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/search/text', async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing "query" field in JSON body' });
    }

    try {
        
        const vector = await embedText(query);
        const results = await search(vector, 3);
        res.status(200).json({ results });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});