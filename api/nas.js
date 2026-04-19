// Vercel serverless proxy → Synology NAS WebDAV
// Evita CORS: el browser llama /api/nas, este handler llama al NAS con Basic Auth

const NAS_URL  = process.env.NAS_URL;   // ej: https://mmhighmetrik.synology.me:5006
const NAS_USER = process.env.NAS_USER;
const NAS_PASS = process.env.NAS_PASS;

// ── Parser WebDAV PROPFIND XML ───────────────────────────────────
function parseWebDAV(xml, basePath) {
  const responses = xml.match(/<[Dd]:response[\s\S]*?<\/[Dd]:response>/g) || [];
  const items = [];

  for (const resp of responses) {
    const hrefMatch  = resp.match(/<[Dd]:href[^>]*>([\s\S]*?)<\/[Dd]:href>/);
    const nameMatch  = resp.match(/<[Dd]:displayname[^>]*>([\s\S]*?)<\/[Dd]:displayname>/);
    const sizeMatch  = resp.match(/<[Dd]:getcontentlength[^>]*>([\s\S]*?)<\/[Dd]:getcontentlength>/);
    const dateMatch  = resp.match(/<[Dd]:getlastmodified[^>]*>([\s\S]*?)<\/[Dd]:getlastmodified>/);
    const typeMatch  = resp.match(/<[Dd]:getcontenttype[^>]*>([\s\S]*?)<\/[Dd]:getcontenttype>/);
    const isFolder   = /<[Dd]:collection\s*\/>/.test(resp);

    const href = hrefMatch ? decodeURIComponent(hrefMatch[1].trim()) : '';

    // Saltar la entrada raíz (misma ruta que la solicitada)
    const normalBase = basePath.replace(/\/$/, '');
    const normalHref = href.replace(/\/$/, '');
    if (normalHref === normalBase) continue;

    const name = nameMatch
      ? nameMatch[1].trim()
      : href.split('/').filter(Boolean).pop() || '';

    if (!name) continue;

    items.push({
      name,
      href,
      isFolder,
      size:     sizeMatch ? parseInt(sizeMatch[1], 10) : 0,
      modified: dateMatch ? new Date(dateMatch[1].trim()).toLocaleDateString('es-PE') : '—',
      mime:     typeMatch ? typeMatch[1].trim() : '',
      ext:      isFolder ? 'folder' : name.split('.').pop().toLowerCase(),
    });
  }

  // Carpetas primero, luego archivos, ambos alfabético
  return items.sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.name.localeCompare(b.name, 'es');
  });
}

// ── Handler ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS — permitir peticiones del frontend en Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!NAS_URL || !NAS_USER || !NAS_PASS) {
    return res.status(500).json({ error: 'NAS env vars not configured' });
  }

  const path   = req.query.path || '/Proyectos';
  const action = req.query.action || 'list';   // list | download

  const auth = Buffer.from(`${NAS_USER}:${NAS_PASS}`).toString('base64');
  const url  = `${NAS_URL.replace(/\/$/, '')}${path}`;

  try {
    if (action === 'download') {
      // Proxy de descarga — devuelve stream al browser
      const upstream = await fetch(url, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (!upstream.ok) return res.status(upstream.status).json({ error: 'NAS error' });

      const ct = upstream.headers.get('content-type') || 'application/octet-stream';
      const cd = upstream.headers.get('content-disposition') || `attachment; filename="${path.split('/').pop()}"`;
      res.setHeader('Content-Type', ct);
      res.setHeader('Content-Disposition', cd);

      const buf = await upstream.arrayBuffer();
      res.send(Buffer.from(buf));
      return;
    }

    // action === 'list' → PROPFIND
    const upstream = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        Authorization: `Basic ${auth}`,
        Depth: '1',
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:getcontenttype/>
    <d:getcontentlength/>
    <d:getlastmodified/>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`,
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `NAS responded ${upstream.status}`,
        hint: upstream.status === 401 ? 'Credenciales incorrectas' : 'Verifica URL y permisos',
      });
    }

    const xml   = await upstream.text();
    const items = parseWebDAV(xml, path);
    res.json({ ok: true, path, items });

  } catch (err) {
    res.status(500).json({ error: err.message, hint: 'Verifica NAS_URL y conectividad' });
  }
}
