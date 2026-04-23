/* global React, Icon */

// ── Helpers compartidos docs ─────────────────────────────────────
const kindColor = (k) => ({ pdf:'var(--danger)', xlsx:'var(--ok)', dwg:'var(--accent)', folder:'var(--warn)' }[k] || 'var(--ink-3)');
const kindBg    = (k) => ({ pdf:'var(--danger-soft)', xlsx:'var(--ok-soft)', dwg:'var(--accent-soft)', folder:'var(--warn-soft)' }[k] || 'var(--bg-sunken)');
const fmtSize   = (s) => !s ? '—' : s > 1e6 ? (s/1e6).toFixed(1)+' MB' : s > 1e3 ? (s/1e3).toFixed(0)+' KB' : s+' B';

// ── NAS Proyectos tab (datos reales via /api/nas) ────────────────
function NASBrowser() {
  const { useState: _us, useEffect: _ue } = React;
  const [path,    setPath]    = _us('/Proyectos');
  const [items,   setItems]   = _us([]);
  const [loading, setLoading] = _us(false);
  const [error,   setError]   = _us(null);
  const [grid,    setGrid]    = _us(true);
  const [crumbs,  setCrumbs]  = _us([{ label: 'Proyectos', path: '/Proyectos' }]);

  const load = (p) => {
    setLoading(true);
    setError(null);
    fetch(`/api/nas?path=${encodeURIComponent(p)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error + (d.hint ? ' — ' + d.hint : ''));
        setItems(d.items);
        setPath(p);
        // Reconstruir migas
        const parts = p.replace(/^\/Proyectos\/?/, '').split('/').filter(Boolean);
        setCrumbs([
          { label: 'Proyectos', path: '/Proyectos' },
          ...parts.map((part, i) => ({
            label: part,
            path: '/Proyectos/' + parts.slice(0, i + 1).join('/'),
          })),
        ]);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  _ue(() => { load('/Proyectos'); }, []);

  const openItem = (item) => {
    if (item.isFolder) {
      load(item.href.replace(/\/$/, ''));
    } else {
      window.open(`/api/nas?action=download&path=${encodeURIComponent(item.href)}`, '_blank');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elev)', flexShrink: 0 }}>
        {/* Migas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, fontSize: 12, flexWrap: 'wrap' }}>
          {crumbs.map((c, i) => (
            <React.Fragment key={c.path}>
              {i > 0 && <span style={{ color: 'var(--ink-4)' }}>/</span>}
              <button
                onClick={() => load(c.path)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
                  fontWeight: i === crumbs.length - 1 ? 600 : 400,
                  color: i === crumbs.length - 1 ? 'var(--ink)' : 'var(--accent)',
                  fontSize: 12,
                }}
              >{c.label}</button>
            </React.Fragment>
          ))}
        </div>

        {/* Badge NAS live */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--ok-ink)', background: 'var(--ok-soft)', padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--mono)', fontWeight: 600 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)', animation: 'ocSpin 2s linear infinite' /* reuse spinner color pulse */ }} />
          NAS · LIVE
        </div>

        <button onClick={() => load(path)} className="tb-icon-btn" title="Refrescar">
          {Icon.history({ size: 13 })}
        </button>
        <button className={'tb-btn '+(grid?'primary':'')} style={{ height:26, fontSize:11 }} onClick={() => setGrid(true)}>Grilla</button>
        <button className={'tb-btn '+(!grid?'primary':'')} style={{ height:26, fontSize:11 }} onClick={() => setGrid(false)}>Lista</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20, background: 'var(--bg)' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12, color: 'var(--ink-3)' }}>
            <div className="oc-spinner" style={{ width: 36, height: 36, borderTopColor: 'var(--accent)', borderLeftColor: 'rgba(59,91,219,0.2)' }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>Conectando al NAS…</span>
          </div>
        )}

        {error && (
          <div style={{ padding: 20, background: 'var(--danger-soft)', borderRadius: 8, color: 'var(--danger-ink)', fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Error al conectar con el NAS</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{error}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-3)' }}>
              Verifica que el NAS esté encendido, el WebDAV activo y las variables de entorno configuradas en Vercel.
            </div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-4)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Carpeta vacía</div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          grid ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {items.map((item, i) => (
                <div
                  key={item.href}
                  className="card animate-card-in"
                  style={{ padding: 12, cursor: 'pointer', animationDelay: `${i*0.04}s` }}
                  onClick={() => openItem(item)}
                >
                  <div style={{ height: 76, background: kindBg(item.ext), borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' }}>
                    <span style={{ color: kindColor(item.ext), transform: 'scale(1.8)' }}>
                      {Icon[item.ext] ? Icon[item.ext]({ size: 20 }) : item.isFolder ? Icon.folder({ size: 20 }) : Icon.file({ size: 20 })}
                    </span>
                    <span className="mono" style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: 700, color: kindColor(item.ext), textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {item.isFolder ? 'DIR' : item.ext}
                    </span>
                    {!item.isFolder && (
                      <div style={{ position: 'absolute', bottom: 6, right: 6, opacity: 0, transition: 'opacity .15s' }} className="nas-dl-icon">
                        {Icon.download({ size: 11 })}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.isFolder ? '—' : fmtSize(item.size)}</span>
                    <span>{item.modified}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <table>
                <thead><tr>
                  <th>Nombre</th>
                  <th style={{ width: 70 }}>Tipo</th>
                  <th style={{ width: 90 }} className="num-c">Tamaño</th>
                  <th style={{ width: 110 }}>Modificado</th>
                  <th style={{ width: 36 }}></th>
                </tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.href} className="row-hover" style={{ cursor: 'pointer' }} onClick={() => openItem(item)}>
                      <td>
                        <div className="hstack">
                          <span style={{ color: kindColor(item.ext) }}>
                            {Icon[item.ext] ? Icon[item.ext]({ size: 14 }) : item.isFolder ? Icon.folder({ size: 14 }) : Icon.file({ size: 14 })}
                          </span>
                          <span style={{ fontWeight: item.isFolder ? 600 : 400 }}>{item.name}</span>
                        </div>
                      </td>
                      <td><span className="mono text-xs" style={{ textTransform: 'uppercase', color: kindColor(item.ext), fontWeight: 600 }}>{item.isFolder ? 'DIR' : item.ext}</span></td>
                      <td className="num-c">{item.isFolder ? '—' : fmtSize(item.size)}</td>
                      <td className="mono text-xs muted">{item.modified}</td>
                      <td style={{ color: 'var(--ink-4)' }}>{item.isFolder ? Icon.right({ size: 12 }) : Icon.download({ size: 12 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

window.NASBrowser = NASBrowser;
window.kindColor = kindColor;
window.kindBg = kindBg;
window.fmtSize = fmtSize;
