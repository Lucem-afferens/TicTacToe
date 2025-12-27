/**
 * Serverless function to serve static assets (CSS, JS, images)
 * This ensures assets are accessible at /web/assets/...
 */

const fs = require('fs');
const path = require('path');

// MIME types for different file extensions
const mimeTypes = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.html': 'text/html'
};

module.exports = async (req, res) => {
  try {
    // Get the file path from the request
    // URL will be like /web/assets/css/main.css
    // We need to extract /assets/css/main.css
    const urlPath = req.url.replace('/web', '');
    const filePath = path.join(process.cwd(), 'dist', 'web', urlPath);
    
    // Security check - ensure the path is within dist/web/
    const normalizedPath = path.normalize(filePath);
    const distWebPath = path.join(process.cwd(), 'dist', 'web');
    
    if (!normalizedPath.startsWith(distWebPath)) {
      return res.status(403).send('Forbidden');
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    // Get file extension for MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Read and serve the file
    const fileContent = fs.readFileSync(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Type', mimeType);
    
    // Cache headers for static assets
    if (ext === '.css' || ext === '.js' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.svg') {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    
    res.send(fileContent);
  } catch (error) {
    console.error('Error serving asset:', error);
    res.status(500).send('Internal server error');
  }
};

