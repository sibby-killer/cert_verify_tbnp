import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamic handler loader — clears the module cache on each request so that
 * code changes are picked up without restarting the dev server.
 */
async function loadHandler(modulePath) {
  // Bust ESM cache by appending a timestamp query (works with Node 18+)
  const url = `${modulePath}?t=${Date.now()}`;
  const mod = await import(url);
  return mod.default;
}

const ROUTES = [
  // Auth
  ['/api/v1/auth/login',    './api/v1/auth/login.js'],
  ['/api/v1/auth/logout',   './api/v1/auth/logout.js'],
  ['/api/v1/auth/refresh',  './api/v1/auth/refresh.js'],
  ['/api/v1/auth/setup',    './api/v1/auth/setup.js'],

  // Admin — ordered: specific before wildcard
  ['/api/v1/admin/dashboard',               './api/v1/admin/dashboard.js'],
  ['/api/v1/admin/certificates/issue',      './api/v1/admin/certificates/issue.js'],
  ['/api/v1/admin/certificates',            './api/v1/admin/certificates/index.js'],
  ['/api/v1/admin/students/eligible',       './api/v1/admin/students/eligible.js'],  // must be before :id
  ['/api/v1/admin/students',                './api/v1/admin/students/index.js'],
  ['/api/v1/admin/courses',                 './api/v1/admin/courses/index.js'],
  ['/api/v1/admin/reports',                 './api/v1/admin/reports/index.js'],
  ['/api/v1/admin/users',                   './api/v1/admin/users/index.js'],
  ['/api/v1/admin/logs',                    './api/v1/admin/logs.js'],
  ['/api/v1/admin/settings',               './api/v1/admin/settings.js'],

  // Public
  ['/api/v1/verify',  './api/v1/verify.js'],
  ['/api/v1/report',  './api/v1/report.js'],
  ['/api/v1/health',  './api/v1/health.js'],
];

// Dynamic-param routes (must come after static routes above)
const DYNAMIC_ROUTES = [
  [/^\/api\/v1\/admin\/certificates\/([^/]+)\/revoke$/, './api/v1/admin/certificates/[id]/revoke.js', 'id'],
  [/^\/api\/v1\/admin\/students\/([^/]+)$/,             './api/v1/admin/students/[id].js',            'id'],
  [/^\/api\/v1\/admin\/courses\/([^/]+)$/,              './api/v1/admin/courses/[id].js',             'id'],
  [/^\/api\/v1\/admin\/reports\/([^/]+)$/,              './api/v1/admin/reports/[id].js',             'id'],
  [/^\/api\/v1\/admin\/users\/([^/]+)$/,                './api/v1/admin/users/[id].js',               'id'],
];

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Static routes
  for (const [route, file] of ROUTES) {
    app.all(route, async (req, res) => {
      const handler = await loadHandler(path.resolve(__dirname, file));
      await handler(req, res);
    });
  }

  // Dynamic-param routes
  app.all('/api/v1/admin/*', async (req, res, next) => {
    for (const [pattern, file, param] of DYNAMIC_ROUTES) {
      const match = req.path.match(pattern);
      if (match) {
        req.query[param] = match[1]; // expose :id as req.query.id
        const handler = await loadHandler(path.resolve(__dirname, file));
        return handler(req, res);
      }
    }
    next();
  });

  // Vite frontend
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
    console.log(`Frontend:    http://localhost:${port}`);
    console.log(`Health API:  http://localhost:${port}/api/v1/health\n`);
  });
}

startServer();
