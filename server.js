// server.js - Simple Express server for local testing
// Run with: node server.js
// Then visit http://localhost:3000

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// DELETE endpoint
app.post('/api/delete-pair', (req, res) => {
  try {
    const { filename, index } = req.body;
    if (!filename || index === undefined) {
      return res.status(400).json({ error: 'Missing filename or index' });
    }

    // Safety check
    if (!filename.endsWith('.json') || filename.includes('..')) {
      return res.status(403).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(__dirname, 'json', filename);
    let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!Array.isArray(data) || index < 0 || index >= data.length) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    // Remove pair
    data.splice(index, 1);

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true, remaining: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
