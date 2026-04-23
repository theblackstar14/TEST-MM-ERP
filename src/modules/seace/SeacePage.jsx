/* global React, Icon, ERP_DATA */
const { useState, useEffect } = React;

// =================== SEACE (scraper) ===================
const API = window.SEACE_API || "";

function SeacePage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [licitaciones, setLicitaciones] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingDet, setLoadingDet] = useState(false);

  const ts = () => new Date().toLocaleTimeString('es-PE');
  const pushLog = (lvl, msg) => setLog(l => [...l, { t: ts(), lvl, msg }]);

  const mapItem = (r) => ({
    id: r.nomenclatura,
    nidProceso: r.nidProceso,
    nidConvocatoria: r.nidConvocatoria,
    entidad: r.entidad,
    obj: r.descripcion || r.objeto,
    objeto: r.objeto,
    fecha: r.fecha_publicacion,
    etapa: r.etapa,
    monto: 0,
    cierre: '—',
    region: '—',
    score: 0,
    match: 'media',
  });

  const startScrape = async () => {
    setRunning(true);
    setProgress(10);
    setLog([{ t: ts(), lvl: 'info', msg: 'Conectando a API SEACE…' }]);
    try {
      setProgress(30);
      pushLog('info', `GET ${API}/api/v1/procesos`);
      const r = await fetch(`${API}/api/v1/procesos`);
      setProgress(70);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      const items = (json.data || []).map(mapItem);
      setLicitaciones(items);
      setSelected(items[0]?.nidProceso || null);
      setProgress(100);
      pushLog('ok', `${items.length} procesos cargados${json.cached ? ' (cache)' : ''}`);
      pushLog('info', 'Scraper finalizado');
    } catch (e) {
      pushLog('warn', 'Error: ' + e.message);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => { startScrape(); }, []);

  useEffect(() => {
    if (!selected) { setDetalle(null); return; }
    const item = licitaciones.find(l => l.nidProceso === selected);
    if (!item) return;
    setLoadingDet(true);
    setDetalle(null);
    const url = `${API}/api/v1/procesos/${selected}?nomenclatura=${encodeURIComponent(item.id)}`;
    fetch(url)
      .then(r => r.json())
      .then(j => { setDetalle(j.data || null); pushLog('ok', `Detalle ${item.id}${j.cached ? ' (cache)' : ''}`); })
      .catch(e => pushLog('warn', 'Detalle err: ' + e.message))
      .finally(() => setLoadingDet(false));
  }, [selected]);

  const sel = licitaciones.find(l => l.nidProceso === selected) || licitaciones[0];

  return (
    <div className="ws-inner wide" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div className="hstack between">
          <div>
            <div className="hstack" style={{ gap: 8, marginBottom: 4 }}>
              <span className="mono text-xs" style={{ color: 'var(--accent)' }}>SEACE</span>
              <span className="chip green"><span className="dot" />Conectado · OSCE</span>
              <span className="chip"><span className="mono text-xs">v4.2.1</span></span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Importador SEACE · Licitaciones del Estado</h1>
            <div className="sub muted" style={{ marginTop: 4 }}>Scraper automatizado sobre el portal SEACE-OSCE · clasificación IA por viabilidad</div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button className="tb-btn"><span className="ico">{Icon.cog({ size: 13 })}</span>Configurar filtros</button>
            <button className="tb-btn"><span className="ico">{Icon.clock({ size: 13 })}</span>Programar</button>
            <button className="tb-btn primary" onClick={startScrape} disabled={running}>
              <span className="ico">{Icon.sparkle({ size: 13 })}</span>
              {running ? 'Ejecutando scraper…' : 'Ejecutar scraper'}
            </button>
          </div>
        </div>
        {running && (
          <div style={{ marginTop: 12 }}>
            <div className="pbar" style={{ height: 4 }}><span style={{ width: progress + '%', background: 'var(--accent)', transition: 'width .3s' }} /></div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 14 }}>
          <QuickStat l="Procesos cargados" v={String(licitaciones.length)} d="vía API SEACE" />
          <QuickStat l="Seleccionado" v={sel?.id || '—'} d={sel?.entidad?.slice(0, 28) || ''} color="var(--accent)" />
          <QuickStat l="Etapa actual" v={sel?.etapa || '—'} d="" />
          <QuickStat l="Documentos" v={String(detalle?.documentos?.length || 0)} d={detalle ? 'cargados' : 'sin cargar'} color="var(--ok)" />
          <QuickStat l="Última ejecución" v={log[log.length-1]?.t || '—'} d={running ? 'corriendo…' : 'idle'} />
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1.4, overflow: 'auto', background: 'var(--bg-elev)', borderRight: '1px solid var(--line)' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 180 }}>Nomenclatura</th>
                <th>Entidad / Descripción</th>
                <th style={{ width: 90 }}>Objeto</th>
                <th style={{ width: 100 }} className="num-c">Monto</th>
                <th style={{ width: 110 }}>Publicación</th>
                <th style={{ width: 130 }}>Etapa</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {licitaciones.length === 0 && !running && (
                <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>Sin datos. Ejecuta el scraper.</td></tr>
              )}
              {licitaciones.map(l => (
                <tr key={l.nidProceso} className="row-hover" onClick={() => setSelected(l.nidProceso)} style={{ cursor: 'pointer', background: selected === l.nidProceso ? 'var(--accent-soft)' : 'transparent' }}>
                  <td><span className="mono text-xs" style={{ color: 'var(--accent)', fontWeight: 600 }}>{l.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{l.entidad}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 360 }}>{l.obj}</div>
                  </td>
                  <td><span className="mono text-xs muted">{l.objeto || '—'}</span></td>
                  <td className="num-c" style={{ fontWeight: 500 }}>—</td>
                  <td className="mono text-xs muted">{l.fecha || '—'}</td>
                  <td><span className="chip">{l.etapa || '—'}</span></td>
                  <td>{Icon.right({ size: 12 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: detail + scraper console */}
        <div style={{ width: 420, display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-sunken)' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)', overflow: 'auto' }}>
            {!sel && <div className="muted" style={{ padding: 20 }}>Selecciona un proceso</div>}
            {sel && (
              <>
                <div className="hstack" style={{ gap: 6, marginBottom: 6 }}>
                  <span className="mono text-xs" style={{ color: 'var(--accent)', fontWeight: 600 }}>{sel.id}</span>
                  {loadingDet && <span className="chip">⏳ cargando…</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{sel.entidad}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 10 }}>{sel.obj}</div>

                {detalle && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                      <SeaceField l="N° Convocatoria" v={detalle.nConvocatoria || '—'} />
                      <SeaceField l="Tipo" v={detalle.tipoCompra || '—'} />
                      <SeaceField l="Versión SEACE" v={detalle.versionSeace || '—'} />
                      <SeaceField l="Publicación" v={detalle.fechaPublicacion || '—'} />
                      <SeaceField l="Dirección" v={detalle.direccion || '—'} />
                      <SeaceField l="Teléfono" v={detalle.telefono || '—'} />
                    </div>

                    {detalle.cronograma?.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>Cronograma</div>
                        <table style={{ fontSize: 11 }}>
                          <thead><tr><th>Etapa</th><th>Inicio</th><th>Fin</th></tr></thead>
                          <tbody>
                            {detalle.cronograma.map((c, i) => (
                              <tr key={i}><td style={{ fontSize: 11 }}>{c.etapa}</td><td className="mono text-xs muted">{c.inicio}</td><td className="mono text-xs muted">{c.fin}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {detalle.documentos?.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>Documentos</div>
                        {detalle.documentos.map((d, i) => (
                          <div key={i} style={{ padding: 8, background: 'var(--bg-sunken)', borderRadius: 4, marginBottom: 6, fontSize: 11 }}>
                            <div style={{ fontWeight: 500 }}>{d.documento}</div>
                            <div className="muted" style={{ fontSize: 10, marginBottom: 4 }}>{d.etapa} · {d.fecha}</div>
                            {(d.descargas || []).map((dl, j) => (
                              <a key={j}
                                href={`${API}/api/v1/procesos/${sel.nidProceso}/documentos/${encodeURIComponent(dl.filename)}?nomenclatura=${encodeURIComponent(sel.id)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-block', fontSize: 11, color: 'var(--accent)', textDecoration: 'none', marginRight: 8 }}>
                                📄 {dl.filename}
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 14, fontFamily: 'var(--mono)', fontSize: 11, background: '#0A0C10', color: '#8FA3F0', minHeight: 0 }}>
            <div style={{ fontSize: 9, color: '#5C5C58', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>Consola del scraper · en vivo</div>
            {log.map((l, i) => {
              const c = l.lvl === 'ok' ? '#4FA87E' : l.lvl === 'warn' ? '#F5B438' : l.lvl === 'ai' ? '#B9C6F4' : '#8FA3F0';
              return (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4, lineHeight: 1.5 }}>
                  <span style={{ color: '#5C5C58', flexShrink: 0 }}>{l.t}</span>
                  <span style={{ color: c, flexShrink: 0, width: 40 }}>[{l.lvl}]</span>
                  <span style={{ color: l.lvl === 'warn' ? '#F7C666' : l.lvl === 'ok' ? '#7BC69E' : l.lvl === 'ai' ? '#C5CEEA' : '#C5C5C0' }}>{l.msg}</span>
                </div>
              );
            })}
            {running && <div style={{ color: '#8FA3F0' }}>▍</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ l, v, d, color }) {
  return (
    <div style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>{l}</div>
      <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: color || 'var(--ink)' }}>{v}</div>
      {d && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{d}</div>}
    </div>
  );
}
function SeaceField({ l, v }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 3 }}>{l}</div>
      <div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div>
    </div>
  );
}

window.SeacePage = SeacePage;
