/**
 * Serverless function to serve static assets (CSS, JS, images)
 * This ensures assets are accessible at /web/assets/...
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// MIME types for different file extensions
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.html': 'text/html; charset=utf-8'
};

module.exports = async (req, res) => {
  try {
    // Get the file path from the request
    // URL from rewrite: /web/assets/css/main.css -> /api/web/assets.js?path=css/main.css
    let assetPath = req.query.path || '';
    
    // If path is not in query, try to extract from URL
    if (!assetPath && req.url) {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      assetPath = urlObj.searchParams.get('path') || '';
      
      // If still not found, try to extract from URL path
      if (!assetPath) {
        const urlPath = req.url.split('?')[0];
        if (urlPath.includes('/assets/')) {
          assetPath = urlPath.split('/assets/')[1];
        }
      }
    }
    
    if (!assetPath) {
      return res.status(400).send('Missing path parameter');
    }
    
    // Ensure path starts with assets/
    if (!assetPath.startsWith('assets/')) {
      assetPath = 'assets/' + assetPath;
    }
    
    const filePath = path.join(process.cwd(), 'dist', 'web', assetPath);
    
    // Security check - ensure the path is within dist/web/
    const normalizedPath = path.normalize(filePath);
    const distWebPath = path.join(process.cwd(), 'dist', 'web');
    
    if (!normalizedPath.startsWith(distWebPath)) {
      return res.status(403).send('Forbidden');
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).send('File not found: ' + assetPath);
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
    res.status(500).send('Internal server error: ' + error.message);
  }
};
