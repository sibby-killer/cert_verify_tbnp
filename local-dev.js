import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Backend Routes (Mock Vercel /api)
  app.all('/api/admin/*', async (req, res) => {
    const { default: handler } = await import('./api/admin.js');
    await handler(req, res);
  });

  app.all('/api/verify', async (req, res) => {
    const { default: handler } = await import('./api/verify.js');
    await handler(req, res);
  });

  app.all('/api/test', async (req, res) => {
    const { default: handler } = await import('./api/test.js');
    await handler(req, res);
  });

  // 2. Vite Frontend
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: path.join(__dirname, 'client'),
  });

  app.use(vite.middlewares);

  app.use('*', async (req, res) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'client/index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      res.status(500).end(e.message);
    }
  });

  const port = 3000;
  app.listen(port, () => {
    console.log(`\n🚀 Local Dev Server Ready!\n`);
    console.log(`Frontend: http://localhost:${port}`);
    console.log(`Backend API: http://localhost:${port}/api/test\n`);
  });
}

startServer();
