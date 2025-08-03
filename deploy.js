import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// API Proxy to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // Keep /api prefix
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Backend service unavailable' });
  }
}));

// Serve static files from Next.js build
app.use(express.static(path.join(__dirname, '.next/static')));
app.use(express.static(path.join(__dirname, 'public')));

// Handle all other routes with Next.js
app.get('*', (req, res) => {
  // In production, you would serve the built Next.js app
  // This is a simplified example - use a proper static file server
  res.sendFile(path.join(__dirname, '.next/server/pages/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`📡 Proxying API requests to: ${BACKEND_URL}`);
});
