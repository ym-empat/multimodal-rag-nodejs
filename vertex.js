const { GoogleAuth } = require('google-auth-library');

const location = process.env.GCP_LOCATION || 'us-central1';
const dimension = 1408;

const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
});

async function getClient() {
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/multimodalembedding@001:predict`;

    return [client, url];
}

async function embedText(text) {
    [client, url] = await getClient();

    const res = await client.request({
        method: 'POST',
        url,
        body: JSON.stringify({
            instances: [
                {
                    text
                }
            ],
            parameters: {
                dimension
            }
        })
    });

    return res.data.predictions[0].textEmbedding;
}

async function embedImage(image) {
    [client, url] = await getClient();

    const res = await client.request({
        method: 'POST',
        url,
        body: JSON.stringify({
            instances: [
                {
                    image: {
                        bytesBase64Encoded: image.buffer.toString('base64')
                    }
                }
            ],
            parameters: {
                dimension
            }
        })
    });

    return res.data.predictions[0].imageEmbedding;
}

async function embedVideo(video) {
    [client, url] = await getClient();

    const res = await client.request({
        method: 'POST',
        url,
        body: JSON.stringify({
            instances: [
                {
                    video: {
                        bytesBase64Encoded: video.buffer.toString('base64'),
                        videoSegmentConfig: {
                            intervalSec: 15
                        }
                    }
                }
            ],
            parameters: {
                dimension
            }
        })
    });

    return res.data.predictions[0].videoEmbeddings;
}

module.exports = {
    embedText,
    embedImage,
    embedVideo
};