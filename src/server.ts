import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();

app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload',
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const angularApp = new AngularNodeAppEngine();

const KNOWN_ROUTES = new Set([
  '/',
  '/home',
  '/about',
  '/contact',
]);

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    lastModified: true,
    etag: true,
  })
);

app.use((req, res, next) => {
  if (req.path.startsWith('/assets/') && !req.path.endsWith('.html')) {
    res.status(404).type('text/plain').send('Asset not found');
  } else {
    next();
  }
});

app.use('/**', (req, res, next) => {
  const urlPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const isKnownRoute =
    KNOWN_ROUTES.has(urlPath) ||
    urlPath.startsWith('/assets/') ||
    urlPath.startsWith('/health');

  if (!isKnownRoute) {
    res.status(404);
  }

  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4006;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
