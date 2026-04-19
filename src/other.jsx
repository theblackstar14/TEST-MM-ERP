/* global React, Icon, ERP_DATA */
const { useState } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

// =================== GANTT ===================
function GanttPage() {
  const { gantt } = ERP_DATA;
  const totalDays = 180;
  const dayW = 6;
  const rowH = 32;
  const groups = [...new Set(gantt.map(t => t.group))];
  const [today] = useState(92);

  const groupColors = {
    'Preliminares': '#9A9A96',
    'Estructuras': 'var(--accent)',
    'Arquitectura': '#7C3AED',
    'Instalaciones': 'var(--warn)',
    'Cierre': 'var(--ok)',
  };

  return (
    <div className="ws-inner wide" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="hstack" style={{ gap: 8, marginBottom: 4 }}>
              <span className="mono text-xs muted">OB-2025-021</span>
              <span className="chip">En ejecución · 62% físico</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Cronograma — Remodelación oficinas San Isidro</h1>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button className="tb-btn"><span className="ico">{Icon.calendar({ size: 13 })}</span>Agosto 2025 – Mayo 2026</button>
            <button className="tb-btn"><span className="ico">{Icon.download({ size: 13 })}</span>Exportar</button>
          </div>
        </div>
        <div className="hstack" style={{ gap: 16, marginTop: 14, fontSize: 11 }}>
          {Object.entries(groupColors).map(([g, c]) => (
            <div key={g} className="hstack" style={{ gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              <span className="muted" style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div className="hstack" style={{ gap: 6 }}>
            <div style={{ width: 2, height: 14, background: 'var(--danger)' }} />
            <span className="muted" style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hoy</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--bg-elev)' }}>
        <div style={{ width: 260, borderRight: '1px solid var(--line)', overflow: 'auto', flexShrink: 0 }}>
          <div style={{ height: 38, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--bg-sunken)', fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Tarea</div>
          {gantt.map((t, i) => (
            <div key={t.id} style={{ height: rowH, padding: '0 14px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--line)', gap: 8 }}>
              <span style={{ width: 3, height: 16, background: groupColors[t.group], borderRadius: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>{t.dur}d · {(t.progress * 100).toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <div style={{ width: totalDays * dayW, position: 'relative' }}>
            <div style={{ height: 38, borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)', position: 'sticky', top: 0, zIndex: 2, display: 'flex' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ width: 30 * dayW, borderRight: '1px solid var(--line)', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {['Ago 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dic 25', 'Ene 26'][i]}
                </div>
              ))}
            </div>
            {/* grid */}
            {Array.from({ length: totalDays / 30 }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', top: 38, bottom: 0, left: i * 30 * dayW, width: 1, background: 'var(--line)' }} />
            ))}
            {/* weekends subtle bands */}
            {Array.from({ length: Math.floor(totalDays / 7) }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', top: 38, bottom: 0, left: (i * 7 + 5) * dayW, width: dayW * 2, background: 'var(--bg-sunken)', opacity: 0.4 }} />
            ))}
            {/* today line */}
            <div style={{ position: 'absolute', top: 38, bottom: 0, left: today * dayW, width: 2, background: 'var(--danger)', zIndex: 3 }} />
            <div style={{ position: 'absolute', top: 40, left: today * dayW + 4, fontSize: 10, color: 'var(--danger)', fontFamily: 'var(--mono)', fontWeight: 600 }}>HOY</div>

            {/* bars */}
            {gantt.map((t, i) => (
              <div key={t.id} style={{ position: 'absolute', top: 38 + i * rowH + 6, left: t.start * dayW, width: t.dur * dayW, height: rowH - 12 }}>
                <div style={{ position: 'absolute', inset: 0, background: groupColors[t.group], opacity: 0.25, borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: (t.progress * 100) + '%', background: groupColors[t.group], borderRadius: 3 }} />
                <div style={{ position: 'absolute', inset: 0, padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 10, color: t.progress > 0.5 ? '#fff' : 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {t.dur}d
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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

// =================== DOCUMENTOS (NAS) ===================
function DocsPage() {
  const { docsTree } = ERP_DATA;
  const [selected,   setSelected]   = useState(docsTree[2]);
  const [grid,       setGrid]       = useState(true);
  const [activeTab,  setActiveTab]  = useState('local'); // 'local' | 'nas'

  return (
    <div className="ws-inner wide" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
          <div>
            <div className="hstack" style={{ gap: 8, marginBottom: 4 }}>
              <span className="mono text-xs muted">OB-2025-021 / Documentos</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Repositorio de obra</h1>
            <div className="sub muted" style={{ marginTop: 4 }}>NAS estructurado por fase · control de versiones · acceso por rol</div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button className="tb-btn">{Icon.upload({ size: 13 })} Subir</button>
            <button className="tb-btn primary">{Icon.plus({ size: 13 })} Nueva carpeta</button>
          </div>
        </div>

        {/* Tabs locales vs NAS */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { k: 'local', l: 'Estructura local' },
            { k: 'nas',   l: '🔴 NAS Synology · Proyectos en vivo' },
          ].map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k)} style={{
              padding: '8px 16px', fontSize: 12, fontWeight: 500,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: '2px solid ' + (activeTab === t.k ? 'var(--accent)' : 'transparent'),
              color: activeTab === t.k ? 'var(--ink)' : 'var(--ink-3)',
              marginBottom: -1, transition: 'color .15s, border-color .15s',
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'nas' ? (
        <NASBrowser />
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ width: 260, background: 'var(--bg-elev)', borderRight: '1px solid var(--line)', overflow: 'auto', padding: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8, padding: '0 4px' }}>Carpetas del proyecto</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {docsTree.map(f => (
                <button key={f.name} onClick={() => setSelected(f)} className={'sb-item' + (selected.name === f.name ? ' active' : '')}>
                  <span style={{ color: kindColor('folder') }}>{Icon.folder({ size: 14 })}</span>
                  <span className="label">{f.name}</span>
                  <span className="badge">{f.children ? f.children.length : 0}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-sunken)', borderRadius: 6, fontSize: 11, color: 'var(--ink-3)' }}>
              <div className="mono" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Almacenamiento</div>
              <div className="pbar" style={{ marginBottom: 6 }}><span style={{ width: '42%', background: 'var(--accent)' }} /></div>
              <div className="mono">8.2 GB de 20 GB</div>
            </div>
          </div>

          {/* Files */}
          <div style={{ flex: 1, background: 'var(--bg)', overflow: 'auto', padding: 20 }}>
            <div className="hstack between" style={{ marginBottom: 14 }}>
              <div className="hstack">
                <span className="mono text-xs muted">Obra / Documentos /</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{selected.name}</span>
                <span className="chip">{selected.children.length} archivos</span>
              </div>
              <div className="hstack" style={{ gap: 4 }}>
                <button className={'tb-btn '+(grid?'primary':'')} style={{ height:26, fontSize:11 }} onClick={() => setGrid(true)}>Grilla</button>
                <button className={'tb-btn '+(!grid?'primary':'')} style={{ height:26, fontSize:11 }} onClick={() => setGrid(false)}>Lista</button>
              </div>
            </div>

            {grid ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {selected.children.map(c => {
                  const ext = c.name.split('.').pop().toLowerCase();
                  return (
                    <div key={c.name} className="card" style={{ padding: 12, cursor: 'pointer', transition: 'all .15s' }}>
                      <div style={{ height: 88, background: kindBg(ext), borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, position: 'relative' }}>
                        <span style={{ color: kindColor(ext), transform: 'scale(2)' }}>{Icon[ext] ? Icon[ext]({ size: 20 }) : Icon.file({ size: 20 })}</span>
                        <span className="mono" style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 600, color: kindColor(ext), textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ext}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.35, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.name}</div>
                      <div className="mono text-xs muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{fmtSize(c.size)}</span><span>{c.modified}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card">
                <table>
                  <thead><tr>
                    <th>Nombre</th><th style={{width:80}}>Tipo</th>
                    <th style={{width:100}} className="num-c">Tamaño</th>
                    <th style={{width:120}}>Modificado</th><th style={{width:40}}></th>
                  </tr></thead>
                  <tbody>
                    {selected.children.map(c => {
                      const ext = c.name.split('.').pop().toLowerCase();
                      return (
                        <tr key={c.name} className="row-hover" style={{ cursor: 'pointer' }}>
                          <td><div className="hstack"><span style={{color:kindColor(ext)}}>{Icon[ext]?Icon[ext]({size:14}):Icon.file({size:14})}</span><span style={{fontWeight:500}}>{c.name}</span></div></td>
                          <td><span className="mono text-xs" style={{textTransform:'uppercase',color:kindColor(ext),fontWeight:600}}>{ext}</span></td>
                          <td className="num-c">{fmtSize(c.size)}</td>
                          <td className="mono text-xs muted">{c.modified}</td>
                          <td>{Icon.more({size:12})}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =================== PROJECT DETAIL (tabbed prototype) ===================

const TEAM = [
  { name: 'Ing. Carla Mendoza',      role: 'Jefa de obra',       ini: 'CM', color: '#3B5BDB' },
  { name: 'Arq. Pedro Quispe',       role: 'Residente',          ini: 'PQ', color: '#2F7D5C' },
  { name: 'Téc. Rosa Vílchez',       role: 'Control de costos',  ini: 'RV', color: '#7C3AED' },
  { name: 'CPC. Jorge Bustamante',   role: 'Administrador',      ini: 'JB', color: '#D1453B' },
];

const HITOS = [
  { d: '22 Abr', t: 'Entrega losa nivel 2',       k: 'warn',  done: false },
  { d: '05 May', t: 'Fin instalaciones IIEE',      k: 'blue',  done: false },
  { d: '18 May', t: 'Valorización V09',            k: 'blue',  done: false },
  { d: '30 May', t: 'Entrega obra final',          k: 'green', done: false },
  { d: '14 Mar', t: 'Losa nivel 1 completada',     k: 'green', done: true  },
  { d: '28 Feb', t: 'Valorización V08 aprobada',   k: 'green', done: true  },
];

const IA_INSIGHTS = [
  { kind: 'alert',   title: 'Sobrecosto en Movimiento de tierras',        body: 'Retroexcavadora ejecutada a S/ 22.90/m³ vs S/ 18.50/m³ cotizado. Desviación +11.1%. Revisar partida 02.01.02.' },
  { kind: 'warn',    title: 'Valorización V08 pendiente de cobro',        body: 'Vencida hace 2 días. Cliente Logística Andina SAC — S/ 156,000 sin facturar. Riesgo de flujo de caja en Mayo.' },
  { kind: 'insight', title: 'Oportunidad consolidación de compra',        body: 'Luminarias LED (OC-2026-012 + OB-2025-018): combinar órdenes reduce costo S/ 4,200 (−10.4%).' },
  { kind: 'insight', title: 'Avance físico por encima del cronograma',    body: 'Arquitectura al 30% cuando el plan es 22%. Tendencia positiva; anticipar siguiente valorización.' },
];

const SCURVE_PLAN   = [0,3,8,15,24,34,45,55,64,72,80,87,92,96,98,100];
const SCURVE_REAL   = [0,4,9,17,26,36,46,55,63,70,76,80,null,null,null,null];

function SCurveChart() {
  const w = 480, h = 160, padL = 36, padB = 24, padT = 10, padR = 10;
  const iW = w - padL - padR, iH = h - padT - padB;
  const pts = (arr) => arr.map((v, i) => v == null ? null : [
    padL + (i / (arr.length - 1)) * iW,
    padT + iH - (v / 100) * iH,
  ]);
  const toPath = (pts) => pts.filter(Boolean).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const planPts = pts(SCURVE_PLAN);
  const realPts = pts(SCURVE_REAL).filter(Boolean);
  const months = ['Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr'];
  const todayX = padL + (11 / (SCURVE_PLAN.length - 1)) * iW;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {[0,25,50,75,100].map((v, i) => (
        <line key={i} x1={padL} x2={w - padR} y1={padT + iH - (v/100)*iH} y2={padT + iH - (v/100)*iH}
          stroke="var(--line)" strokeDasharray={i === 0 || i === 4 ? '0' : '2,3'} />
      ))}
      {[0,25,50,75,100].map((v, i) => (
        <text key={i} x={padL - 4} y={padT + iH - (v/100)*iH + 3} fontSize="8" textAnchor="end" fill="var(--ink-4)" fontFamily="var(--mono)">{v}%</text>
      ))}
      {months.map((m, i) => (
        <text key={m} x={padL + (i / (months.length - 1)) * iW} y={h - 6} fontSize="8" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--mono)">{m}</text>
      ))}
      {/* Plan line */}
      <path d={toPath(planPts)} fill="none" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="4,3" />
      {/* Real area */}
      <path d={`${toPath(realPts)} L${realPts[realPts.length-1][0]},${padT+iH} L${padL},${padT+iH} Z`}
        fill="var(--accent)" opacity="0.08" />
      <path d={toPath(realPts)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Today */}
      <line x1={todayX} x2={todayX} y1={padT} y2={padT + iH} stroke="var(--danger)" strokeWidth="1.5" />
      <text x={todayX + 3} y={padT + 10} fontSize="8" fill="var(--danger)" fontFamily="var(--mono)" fontWeight="600">HOY</text>
      {/* Dot at last real point */}
      {realPts.length > 0 && (
        <circle cx={realPts[realPts.length-1][0]} cy={realPts[realPts.length-1][1]} r="3.5" fill="var(--accent)" />
      )}
      {/* Legend */}
      <g transform={`translate(${padL + 8}, ${padT + 4})`} fontSize="9" fontFamily="var(--sans)">
        <line x1="0" x2="14" y1="5" y2="5" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="4,3" />
        <text x="18" y="8" fill="var(--ink-3)">Plan</text>
        <line x1="52" x2="66" y1="5" y2="5" stroke="var(--accent)" strokeWidth="2" />
        <text x="70" y="8" fill="var(--ink-2)">Real</text>
      </g>
    </svg>
  );
}

function IAInsightItem({ kind, title, body, index }) {
  const cfg = {
    alert:   { bg: 'var(--danger-soft)', fg: 'var(--danger-ink)', icon: Icon.warn },
    warn:    { bg: 'var(--warn-soft)',   fg: 'var(--warn-ink)',   icon: Icon.info },
    insight: { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)', icon: Icon.sparkle },
  }[kind];
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex', gap: 10, padding: 12,
        background: cfg.bg, borderRadius: 8,
        animationDelay: `${index * 0.06}s`,
      }}
    >
      <div style={{ color: cfg.fg, flexShrink: 0, marginTop: 1 }}>{cfg.icon({ size: 14 })}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 12, color: cfg.fg, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

function ProjectDetail({ projectId, onBack }) {
  const { useState: _useState } = React;
  const p = ERP_DATA.projects.find(x => x.id === projectId) || ERP_DATA.projects[0];
  const { cashflow, partidas } = ERP_DATA;
  const roots = partidas.filter(x => x.level === 1);
  const [tab, setTab] = _useState('resumen');

  const pctF  = p.progressFisico  * 100;
  const pctFi = p.progressFinanciero * 100;
  const saldo = p.budget - p.spent;
  const days  = Math.max(0, Math.round((new Date(p.endDate) - new Date('2026-04-18')) / 86400000));
  const riskCfg = { high: { c: 'var(--danger)', label: 'Alto', chip: 'red' }, medium: { c: 'var(--warn)', label: 'Medio', chip: 'amber' }, low: { c: 'var(--ok)', label: 'Bajo', chip: 'green' } }[p.risk];

  const TABS = [
    { key: 'resumen',  label: 'Resumen'      },
    { key: 'partidas', label: 'Partidas'     },
    { key: 'equipo',   label: 'Equipo'       },
    { key: 'finanzas', label: 'Finanzas'     },
    { key: 'ia',       label: '✦ Análisis IA' },
  ];

  const KPIS = [
    { lbl: 'Presupuesto vigente', val: fmtPEN(p.budget),                     color: 'var(--ink)',      sub: 'Contrato + adicionales' },
    { lbl: 'Monto ejecutado',     val: fmtPEN(p.spent),                      color: 'var(--accent)',   sub: ((p.spent / p.budget)*100).toFixed(1) + '% del total' },
    { lbl: 'Saldo disponible',    val: fmtPEN(saldo),                         color: saldo < 0 ? 'var(--danger)' : 'var(--ok)', sub: 'Por ejecutar' },
    { lbl: 'Avance físico',       val: pctF.toFixed(0) + '%',                 color: 'var(--accent)',   sub: null, progress: pctF,  pColor: 'var(--accent)' },
    { lbl: 'Avance financiero',   val: pctFi.toFixed(0) + '%',                color: 'var(--warn-ink)', sub: null, progress: pctFi, pColor: 'var(--warn)' },
    { lbl: 'Días restantes',      val: p.status === 'Licitación' ? '—' : days + 'd',
      color: days < 30 ? 'var(--danger)' : days < 90 ? 'var(--warn-ink)' : 'var(--ink)',
      sub: p.endDate },
  ];

  return (
    <div className="ws-inner animate-fade-in">

      {/* ── Back + breadcrumb ── */}
      <div className="hstack" style={{ marginBottom: 16, gap: 6 }}>
        <button className="tb-btn" onClick={onBack}>
          {Icon.left({ size: 13 })} Proyectos
        </button>
        <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.id}</span>
      </div>

      {/* ── Header ── */}
      <div className="page-h" style={{ marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hstack" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>{p.id}</span>
            <span className={'chip ' + (p.status === 'En ejecución' ? 'blue' : 'amber')}>
              <span className="dot" />{p.status}
            </span>
            <span className={'chip ' + riskCfg.chip}>Riesgo {riskCfg.label}</span>
            {p.deviation > 5 && (
              <span className="chip red">Desviación +{p.deviation}%</span>
            )}
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{p.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{p.client}</span>
            <span style={{ color: 'var(--ink-4)' }}>·</span>
            <span>{p.location}</span>
          </div>
        </div>
        <div className="hstack" style={{ gap: 6, flexShrink: 0 }}>
          <button className="tb-btn">{Icon.download({ size: 13 })} Exportar</button>
          <button className="tb-btn">{Icon.gantt({ size: 13 })} Cronograma</button>
          <button className="tb-btn primary" onClick={() => setTab('ia')}>
            {Icon.sparkle({ size: 13 })} Análisis IA
          </button>
        </div>
      </div>

      {/* ── 6 KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {KPIS.map((k, i) => (
          <div
            key={k.lbl}
            className="card animate-fade-in"
            style={{ padding: '12px 14px', animationDelay: `${i * 0.04}s` }}
          >
            <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{k.lbl}</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: k.color, lineHeight: 1.1 }}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>{k.sub}</div>}
            {k.progress != null && (
              <div className="pbar" style={{ height: 4, marginTop: 8 }}>
                <span className="animate-bar-grow" style={{ width: k.progress + '%', background: k.pColor, animationDelay: `${0.2 + i * 0.04}s` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 500,
              border: 'none', background: 'none', cursor: 'pointer',
              color: tab === t.key ? 'var(--accent-ink)' : 'var(--ink-3)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'color .15s, border-color .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div key={tab} className="animate-fade-in">

        {/* ─ RESUMEN ─ */}
        {tab === 'resumen' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="vstack" style={{ gap: 14 }}>
              {/* S-curve */}
              <div className="card">
                <div className="card-h">
                  <h3>Curva S — avance acumulado</h3>
                  <span className="hint">Ago 2025 – May 2026</span>
                </div>
                <div className="card-b"><SCurveChart /></div>
              </div>

              {/* Hitos */}
              <div className="card">
                <div className="card-h">
                  <h3>Hitos del proyecto</h3>
                  <span className="chip blue">{HITOS.filter(h => !h.done).length} pendientes</span>
                </div>
                <div className="card-b" style={{ padding: 0 }}>
                  {HITOS.map((h, i) => {
                    const dotC = h.done ? 'var(--ok)' : h.k === 'warn' ? 'var(--warn)' : h.k === 'green' ? 'var(--ok)' : 'var(--accent)';
                    return (
                      <div
                        key={h.t}
                        className="animate-fade-in"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px',
                          borderBottom: i < HITOS.length - 1 ? '1px solid var(--line)' : 'none',
                          opacity: h.done ? 0.6 : 1,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: h.done ? 'var(--ok)' : dotC,
                          boxShadow: h.done ? 'none' : `0 0 6px ${dotC}88`,
                        }} />
                        <span style={{ width: 52, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, flexShrink: 0 }}>{h.d}</span>
                        <span style={{ fontSize: 12, flex: 1, textDecoration: h.done ? 'line-through' : 'none', color: h.done ? 'var(--ink-4)' : 'var(--ink)' }}>{h.t}</span>
                        {h.done
                          ? <span className="chip green" style={{ fontSize: 9 }}>{Icon.check({ size: 10 })} Listo</span>
                          : <span className={'chip ' + (h.k === 'warn' ? 'amber' : h.k === 'green' ? 'green' : 'blue')} style={{ fontSize: 9 }}>Pendiente</span>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="vstack" style={{ gap: 14 }}>
              {/* Equipo */}
              <div className="card">
                <div className="card-h"><h3>Equipo asignado</h3><span className="hint">{TEAM.length} personas</span></div>
                <div className="card-b vstack" style={{ gap: 10 }}>
                  {TEAM.map((m, i) => (
                    <div key={m.name} className="hstack animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: m.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--mono)',
                      }}>{m.ini}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertas rápidas */}
              <div className="card">
                <div className="card-h">
                  <h3>Alertas activas</h3>
                  <span className="chip blue"><span style={{ color: 'var(--accent)' }}>{Icon.sparkle({ size: 10 })}</span>IA</span>
                </div>
                <div className="card-b vstack" style={{ gap: 8 }}>
                  {IA_INSIGHTS.slice(0, 2).map((ins, i) => (
                    <IAInsightItem key={i} {...ins} index={i} />
                  ))}
                  <button
                    className="tb-btn"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}
                    onClick={() => setTab('ia')}
                  >
                    Ver análisis completo {Icon.right({ size: 11 })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─ PARTIDAS ─ */}
        {tab === 'partidas' && (
          <div className="card">
            <div className="card-h">
              <h3>Partidas — ejecución vs presupuesto</h3>
              <span className="hint">Nivel superior · {roots.length} partidas</span>
            </div>
            <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {roots.map((r, i) => {
                const pctReal = (r.real / r.budget) * 100;
                const bc = pctReal > 100 ? 'var(--danger)' : pctReal > 80 ? 'var(--warn)' : 'var(--accent)';
                return (
                  <div key={r.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="hstack between" style={{ marginBottom: 6 }}>
                      <div className="hstack">
                        <span className="mono text-xs muted">{r.code}</span>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{r.name.replace(/^[A-Z ]+— /, '')}</span>
                        {r.ai && <span className={'ai-hint ' + r.aiKind}>{r.ai}</span>}
                      </div>
                      <div className="hstack">
                        <span className="mono text-xs muted">{fmtPEN(r.real).replace('S/ ','S/')} / {fmtPEN(r.budget).replace('S/ ','S/')}</span>
                        <span className={'chip ' + (pctReal > 100 ? 'red' : pctReal > 80 ? 'amber' : pctReal > 0 ? 'blue' : '')}>{pctReal.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="pbar" style={{ height: 8 }}>
                      <span className="animate-bar-grow" style={{ width: Math.min(pctReal, 100) + '%', background: bc, animationDelay: `${0.1 + i * 0.04}s` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─ EQUIPO ─ */}
        {tab === 'equipo' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {[
              ...TEAM,
              { name: 'Ing. Carlos Salcedo', role: 'Supervisor SSOMA',    ini: 'CS', color: '#F59F00' },
              { name: 'Ing. Diana Chávez',   role: 'Control de calidad',  ini: 'DC', color: '#0EA5B7' },
            ].map((m, i) => (
              <div key={m.name} className="card animate-card-in" style={{ padding: 16, animationDelay: `${i * 0.06}s` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: m.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--mono)', flexShrink: 0,
                  }}>{m.ini}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{m.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="chip" style={{ fontSize: 9 }}>Activo</span>
                  <span className="chip blue" style={{ fontSize: 9 }}>{p.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─ FINANZAS ─ */}
        {tab === 'finanzas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
            <div className="card">
              <div className="card-h"><h3>Flujo de caja — {p.name.split('—')[0].trim()}</h3><span className="hint">Últimos 8 meses · PEN</span></div>
              <div className="card-b"><CashflowChart /></div>
            </div>
            <div className="card">
              <div className="card-h"><h3>Valorizaciones</h3><span className="hint">V01 – V08</span></div>
              <div className="card-b tight">
                <table>
                  <thead>
                    <tr>
                      <th>Valoriz.</th>
                      <th>Período</th>
                      <th className="num-c">Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { v: 'V08', mes: 'Mar 2026', monto: 98400,  ok: false },
                      { v: 'V07', mes: 'Feb 2026', monto: 87200,  ok: true },
                      { v: 'V06', mes: 'Ene 2026', monto: 102400, ok: true },
                      { v: 'V05', mes: 'Dic 2025', monto: 0,      ok: true },
                      { v: 'V04', mes: 'Nov 2025', monto: 112400, ok: true },
                    ].map(r => (
                      <tr key={r.v} className="row-hover">
                        <td className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{r.v}</td>
                        <td style={{ fontSize: 11 }}>{r.mes}</td>
                        <td className="num-c" style={{ fontSize: 11 }}>{r.monto > 0 ? fmtPEN(r.monto) : '—'}</td>
                        <td>
                          <span className={'chip ' + (r.ok ? 'green' : 'amber')} style={{ fontSize: 9 }}>
                            {r.ok ? 'Cobrada' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─ ANÁLISIS IA ─ */}
        {tab === 'ia' && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
            <div className="vstack" style={{ gap: 14 }}>
              {/* Score */}
              <div className="card animate-fade-in">
                <div className="card-h">
                  <h3>Diagnóstico general</h3>
                  <span className="chip blue">{Icon.sparkle({ size: 10 })} IA · Actualizado hoy</span>
                </div>
                <div className="card-b">
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}>
                    {/* Risk gauge */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 6px',
                        background: `conic-gradient(${riskCfg.c} 0% 60%, var(--line) 60%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}>
                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--bg-elev)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: riskCfg.c, fontFamily: 'var(--mono)' }}>60</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score riesgo</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Proyecto con riesgo <span style={{ color: riskCfg.c }}>MEDIO</span></div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                        El proyecto avanza por encima del cronograma físico (+8pp) pero presenta sobrecostos en partidas de movimiento de tierras y riesgo de flujo de caja por valorización pendiente.
                      </div>
                    </div>
                  </div>
                  {/* Dimension bars */}
                  {[
                    { lbl: 'Avance físico',   val: 85, color: 'var(--ok)' },
                    { lbl: 'Control de costos', val: 52, color: 'var(--warn)' },
                    { lbl: 'Flujo de caja',   val: 48, color: 'var(--warn)' },
                    { lbl: 'Cumplimiento SSOMA', val: 90, color: 'var(--ok)' },
                  ].map((d, i) => (
                    <div key={d.lbl} className="animate-fade-in" style={{ marginBottom: 10, animationDelay: `${i * 0.06}s` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                        <span style={{ color: 'var(--ink-2)' }}>{d.lbl}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: d.color }}>{d.val}%</span>
                      </div>
                      <div className="pbar" style={{ height: 6 }}>
                        <span className="animate-bar-grow" style={{ width: d.val + '%', background: d.color, animationDelay: `${0.15 + i * 0.06}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="card-h"><h3>Insights y alertas</h3><span className="hint">{IA_INSIGHTS.length} detectados</span></div>
                <div className="card-b vstack" style={{ gap: 8 }}>
                  {IA_INSIGHTS.map((ins, i) => (
                    <IAInsightItem key={i} {...ins} index={i} />
                  ))}
                </div>
              </div>
            </div>

            <div className="vstack" style={{ gap: 14 }}>
              {/* Recomendaciones */}
              <div className="card animate-fade-in" style={{ animationDelay: '0.08s' }}>
                <div className="card-h"><h3>Acciones recomendadas</h3></div>
                <div className="card-b vstack" style={{ gap: 10 }}>
                  {[
                    { n: 1, text: 'Facturar valorización V08 antes del 20 de abril para no comprometer caja de mayo.', urgent: true },
                    { n: 2, text: 'Consolidar OC luminarias LED con OB-2025-018 para reducir costo unitario.', urgent: false },
                    { n: 3, text: 'Solicitar sustento a proveedor de retroexcavadora por diferencia de tarifa.', urgent: true },
                    { n: 4, text: 'Anticipar valorización V09 — avance físico supera meta prevista.', urgent: false },
                  ].map((rec, i) => (
                    <div
                      key={rec.n}
                      className="animate-fade-in"
                      style={{
                        display: 'flex', gap: 10, padding: 10,
                        background: rec.urgent ? 'var(--danger-soft)' : 'var(--bg-sunken)',
                        borderRadius: 6, animationDelay: `${i * 0.06}s`,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: rec.urgent ? 'var(--danger)' : 'var(--accent)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
                      }}>{rec.n}</div>
                      <span style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>{rec.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribución costos */}
              <div className="card animate-fade-in" style={{ animationDelay: '0.16s' }}>
                <div className="card-h"><h3>Distribución de costos</h3><span className="hint">IA clasificó partidas</span></div>
                <div className="card-b vstack" style={{ gap: 8 }}>
                  {[
                    { cat: 'Mano de obra',  pct: 38, color: 'var(--accent)' },
                    { cat: 'Materiales',    pct: 32, color: 'var(--warn)' },
                    { cat: 'Equipos',       pct: 18, color: '#7C3AED' },
                    { cat: 'Subcontratos',  pct: 12, color: 'var(--ok)' },
                  ].map((c, i) => (
                    <div key={c.cat} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block' }} />
                          {c.cat}
                        </span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: c.color }}>{c.pct}%</span>
                      </div>
                      <div className="pbar" style={{ height: 5 }}>
                        <span className="animate-bar-grow" style={{ width: c.pct + '%', background: c.color, animationDelay: `${0.2 + i * 0.05}s` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function KPIBlock({ lbl, val, sub, progress, color }) {
  return (
    <div className="kpi" style={{ cursor: 'default' }}>
      <div className="lbl"><span>{lbl}</span></div>
      <div className="val">{val}</div>
      {sub && <div className="sub">{sub}</div>}
      {progress != null && (
        <div className="pbar" style={{ height: 6, marginTop: 12 }}>
          <span style={{ width: Math.min(progress, 100) + '%', background: color || 'var(--accent)' }} />
        </div>
      )}
    </div>
  );
}

// Stub page for anything not built
function StubPage({ title, desc, icon }) {
  return (
    <div className="ws-inner">
      <div className="page-h">
        <div>
          <h1>{title}</h1>
          <div className="sub muted">{desc}</div>
        </div>
      </div>
      <div className="card" style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon ? icon({ size: 28 }) : Icon.cog({ size: 28 })}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title} — módulo en integración</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 420, margin: '0 auto' }}>
          Interfaz conectada al ERP. Datos de prueba disponibles; vista completa estará lista en la siguiente iteración de diseño.
        </div>
      </div>
    </div>
  );
}

window.GanttPage = GanttPage;
window.DocsPage = DocsPage;
window.ProjectDetail = ProjectDetail;
window.StubPage = StubPage;
