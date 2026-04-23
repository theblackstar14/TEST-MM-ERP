/* global React, Icon, ERP_DATA, NASBrowser, kindColor, kindBg, fmtSize */
const { useState } = React;

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

window.DocsPage = DocsPage;
