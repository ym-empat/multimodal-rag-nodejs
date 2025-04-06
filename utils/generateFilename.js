const path = require('path');

function generateTimestampFilename(originalName) {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  return `${timestamp}${ext}`;
}

module.exports = { generateTimestampFilename };