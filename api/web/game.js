/**
 * Serverless function to serve game.html
 * This ensures the file is accessible at /web/game.html
 */

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Read the game.html file from dist/web/
    const filePath = path.join(process.cwd(), 'dist', 'web', 'game.html');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.send(fileContent);
  } catch (error) {
    console.error('Error serving game.html:', error);
    res.status(404).send('File not found');
  }
};

