// netlify/functions/delete-pair.js (or api/delete-pair.js for local Node server)
// Handles deletion of answered/skipped pairs from JSON files

const fs = require('fs').promises;
const path = require('path');

// Handler for Netlify Functions
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { filename, index } = JSON.parse(event.body);
    if (!filename || index === undefined) {
      return { statusCode: 400, body: 'Missing filename or index' };
    }

    // Safety: only allow json/*.json files
    if (!filename.endsWith('.json') || filename.includes('..')) {
      return { statusCode: 403, body: 'Invalid filename' };
    }

    const filePath = path.join(__dirname, '../../json', filename);
    let data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    if (!Array.isArray(data) || index < 0 || index >= data.length) {
      return { statusCode: 400, body: 'Invalid index' };
    }

    // Remove the pair at the given index
    data.splice(index, 1);

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, remaining: data.length })
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
