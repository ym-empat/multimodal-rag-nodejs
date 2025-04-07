const { Pinecone } = require('@pinecone-database/pinecone');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const indexName = process.env.PINECONE_INDEX_NAME;

const index = pinecone.index(indexName);

async function upsertToIndex({ vectors, type, filename, content, mimeType }) {
    const pineconeVectors = vectors.map((v, i) => {
        const id = `${Date.now()}_${i}`;
        const metadata = {
            type,
        };

        // Add filename to metadata if present
        if (filename) metadata.filename = filename;

        // Add content to metadata if present
        if (content) metadata.content = content;

        // Add mimeType to metadata if present
        if (mimeType) metadata.mimeType = mimeType;
    
        // Add video segment metadata if present
        if (v.startOffsetSec !== undefined) metadata.startOffsetSec = v.startOffsetSec;
        if (v.endOffsetSec !== undefined) metadata.endOffsetSec = v.endOffsetSec;
    
        return {
            id,
            values: v.embedding || v, // if it's a raw array or wrapped in { embedding: [...] }
            metadata,
        };
    });

    console.log(pineconeVectors);

    await index.namespace('ns1').upsert(pineconeVectors);
}

async function search(vector, topK) {
    const response = await index.namespace('ns1').query({
        topK,
        vector,
        includeMetadata: true,
    });

    const results = response.matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
    }));

    return results;
}

module.exports = {
    upsertToIndex,
    search
};