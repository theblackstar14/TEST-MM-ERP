// ERP NAS Backend · MMHIGHMETRIK
// Proxy WebDAV para conectar el frontend al NAS Synology DS425+

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from 'webdav';
import { readFileSync } from 'fs';
import path from 'path';

// ─── Config ────────────────────────────────────────────────────
let config;
try {
  config = JSON.parse(readFileSync('./config.json', 'utf8'));
} catch (e) {
  console.error('❌ Falta config.json — copia config.example.json y completa credenciales');
  process.exit(1);
}

const { nas, server } = config;

// ─── Self-signed cert handling (Synology HTTPS LAN) ────────────
if (nas.tlsInsecure || nas.url.startsWith('https://')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('⚠ TLS verification disabled (self-signed cert OK en LAN)');
}

// ─── Cliente WebDAV ────────────────────────────────────────────
const client = createClient(nas.url, {
  username: nas.user,
  password: nas.pass,
});

// ─── Helpers ───────────────────────────────────────────────────
function sanitizePath(p) {
  if (!p) return '/';
  let n = path.posix.normalize(p);
  if (n.includes('..')) throw new Error('Path traversal no permitido');
  if (!n.startsWith('/')) n = '/' + n;
  return n;
}

function fullPath(p) {
  const clean = sanitizePath(p);
  // rootPath = "/Proyectos", clean = "/OB-2026-009/01_Contratos"
  return (nas.rootPath || '') + clean;
}

const MIME = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.dwg': 'application/octet-stream',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip': 'application/zip',
};
const mimeOf = (ext) => MIME[ext.toLowerCase()] || 'application/octet-stream';

function logRequest(req, action) {
  const t = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${t}] ${action} ${req.method} ${req.url}`);
}

// ─── Express app ───────────────────────────────────────────────
const app = express();
app.use(cors({ origin: server.corsOrigin || '*' }));
app.use(express.json({ limit: '5mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (server.uploadLimitMB || 500) * 1024 * 1024 },
});

// ─── Endpoints ─────────────────────────────────────────────────

// Health
app.get('/api/health', async (req, res) => {
  logRequest(req, 'HEALTH');
  try {
    await client.getDirectoryContents(nas.rootPath || '/');
    res.json({
      ok: true,
      nas: nas.url,
      rootPath: nas.rootPath,
      uploadLimitMB: server.uploadLimitMB,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// List directory
app.get('/api/files/list', async (req, res) => {
  logRequest(req, 'LIST');
  try {
    const target = fullPath(req.query.path || '/');
    const items = await client.getDirectoryContents(target);
    const result = items.map(c => ({
      name: c.basename,
      path: c.filename.startsWith(nas.rootPath) ? c.filename.slice(nas.rootPath.length) || '/' : c.filename,
      type: c.type, // 'directory' | 'file'
      size: c.size || 0,
      lastModified: c.lastmod,
      mime: c.mime || '',
    }));
    // Carpetas primero, luego archivos, ambos alfabéticos
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name, 'es-PE', { numeric: true });
    });
    res.json({ items: result, path: req.query.path || '/' });
  } catch (e) {
    console.error('LIST error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Upload
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  logRequest(req, 'UPLOAD');
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const targetDir = sanitizePath(req.body.path || '/');
    const filename = req.file.originalname;
    const remotePath = fullPath(targetDir.endsWith('/') ? targetDir + filename : targetDir + '/' + filename);
    await client.putFileContents(remotePath, req.file.buffer, { overwrite: true });
    res.json({ ok: true, name: filename, size: req.file.size, path: targetDir + '/' + filename });
  } catch (e) {
    console.error('UPLOAD error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Download (forced attachment)
app.get('/api/files/download', async (req, res) => {
  logRequest(req, 'DOWNLOAD');
  try {
    const remotePath = fullPath(req.query.path);
    const buffer = await client.getFileContents(remotePath);
    const filename = path.basename(remotePath);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('DOWNLOAD error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Preview (inline · PDFs/imgs)
app.get('/api/files/preview', async (req, res) => {
  logRequest(req, 'PREVIEW');
  try {
    const remotePath = fullPath(req.query.path);
    const buffer = await client.getFileContents(remotePath);
    const ext = path.extname(remotePath);
    res.setHeader('Content-Type', mimeOf(ext));
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('PREVIEW error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Mkdir
app.post('/api/files/mkdir', async (req, res) => {
  logRequest(req, 'MKDIR');
  try {
    const { path: parent, name } = req.body;
    if (!name) return res.status(400).json({ error: 'name requerido' });
    const remotePath = fullPath((parent || '/').replace(/\/$/, '') + '/' + name);
    await client.createDirectory(remotePath);
    res.json({ ok: true, path: remotePath });
  } catch (e) {
    console.error('MKDIR error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Move/Rename
app.post('/api/files/move', async (req, res) => {
  logRequest(req, 'MOVE');
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ error: 'from y to requeridos' });
    await client.moveFile(fullPath(from), fullPath(to));
    res.json({ ok: true, from, to });
  } catch (e) {
    console.error('MOVE error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Delete
app.delete('/api/files/delete', async (req, res) => {
  logRequest(req, 'DELETE');
  try {
    const remotePath = fullPath(req.query.path);
    await client.deleteFile(remotePath);
    res.json({ ok: true, path: req.query.path });
  } catch (e) {
    console.error('DELETE error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// ─── Startup ───────────────────────────────────────────────────
const port = server.port || 3001;
const host = server.host || '0.0.0.0';

app.listen(port, host, async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ ERP NAS Backend v1.0 corriendo`);
  console.log(`   → http://localhost:${port}`);
  console.log(`   → CORS: ${server.corsOrigin}`);
  console.log(`   → Upload max: ${server.uploadLimitMB}MB`);
  console.log('');
  console.log(`🔌 Conectando NAS ${nas.url} ...`);
  try {
    const items = await client.getDirectoryContents(nas.rootPath || '/');
    console.log(`✅ NAS conectado · root="${nas.rootPath}" · ${items.length} items detectados`);
    items.slice(0, 5).forEach(i => console.log(`   - ${i.basename}/`));
  } catch (e) {
    console.error(`❌ Error conectando NAS: ${e.message}`);
    console.error(`   Verifica: IP correcta, WebDAV activo, usuario/password, firewall`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
