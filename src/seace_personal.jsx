/* global React, Icon, ERP_DATA */
const { useState, useEffect } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

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
                      <Field l="N° Convocatoria" v={detalle.nConvocatoria || '—'} />
                      <Field l="Tipo" v={detalle.tipoCompra || '—'} />
                      <Field l="Versión SEACE" v={detalle.versionSeace || '—'} />
                      <Field l="Publicación" v={detalle.fechaPublicacion || '—'} />
                      <Field l="Dirección" v={detalle.direccion || '—'} />
                      <Field l="Teléfono" v={detalle.telefono || '—'} />
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
function Field({ l, v }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 3 }}>{l}</div>
      <div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div>
    </div>
  );
}

// =================== PERSONAL ===================
function PersonalPage() {
  const [tab, setTab] = useState('planilla');
  const personal = [
    { id: 'T-0142', name: 'José Huamán Ccopa', role: 'Operario', category: 'Oficial', proj: 'OB-2025-021', hrs: 176, rate: 24.80, total: 4364.80, att: 1.0 },
    { id: 'T-0141', name: 'Marco Sotomayor', role: 'Maestro de obra', category: 'Maestro', proj: 'OB-2025-021', hrs: 176, rate: 42.50, total: 7480.00, att: 1.0 },
    { id: 'T-0140', name: 'Luis Quispe Mamani', role: 'Peón', category: 'Peón', proj: 'OB-2025-021', hrs: 168, rate: 18.30, total: 3074.40, att: 0.95 },
    { id: 'T-0138', name: 'Carlos Ramírez Vega', role: 'Operario', category: 'Oficial', proj: 'OB-2025-018', hrs: 176, rate: 24.80, total: 4364.80, att: 1.0 },
    { id: 'T-0137', name: 'Pedro Flores Inga', role: 'Electricista', category: 'Oficial', proj: 'OB-2025-021', hrs: 172, rate: 28.40, total: 4884.80, att: 0.98 },
    { id: 'T-0136', name: 'Javier Torres Lizana', role: 'Gasfitero', category: 'Oficial', proj: 'OB-2025-024', hrs: 176, rate: 26.20, total: 4611.20, att: 1.0 },
    { id: 'T-0135', name: 'Andrés Vilca Huanca', role: 'Peón', category: 'Peón', proj: 'OB-2025-018', hrs: 156, rate: 18.30, total: 2854.80, att: 0.89 },
    { id: 'T-0134', name: 'Rosa Vílchez Salas', role: 'Control de costos', category: 'Administrativo', proj: 'OB-2025-021', hrs: 176, rate: 38.00, total: 6688.00, att: 1.0 },
    { id: 'T-0133', name: 'Carmen Paredes Torre', role: 'Almacenera', category: 'Administrativo', proj: 'OB-2025-018', hrs: 176, rate: 22.50, total: 3960.00, att: 1.0 },
    { id: 'T-0132', name: 'Miguel Ángel Soto', role: 'Operador retroexcavadora', category: 'Especializado', proj: 'OB-2025-018', hrs: 160, rate: 45.00, total: 7200.00, att: 0.91 },
  ];
  const totalMano = personal.reduce((s, p) => s + p.total, 0);
  const byProj = {};
  personal.forEach(p => { byProj[p.proj] = (byProj[p.proj] || 0) + p.total; });

  const initials = (n) => n.split(' ').slice(0, 2).map(w => w[0]).join('');
  const avatarBg = (i) => {
    const palette = ['linear-gradient(135deg, #3B5BDB, #6B84E8)', 'linear-gradient(135deg, #F59F00, #D97757)', 'linear-gradient(135deg, #2F7D5C, #4FA87E)', 'linear-gradient(135deg, #7C3AED, #A78BFA)', 'linear-gradient(135deg, #D1453B, #F08C84)'];
    return palette[i % palette.length];
  };

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>
      <div className="page-h">
        <div>
          <h1>Personal</h1>
          <div className="sub muted">Mano de obra asignada · planilla semanal · costos por trabajador y por obra</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <button className="tb-btn"><span className="ico">{Icon.download({ size: 13 })}</span>Exportar planilla</button>
          <button className="tb-btn primary"><span className="ico">{Icon.plus({ size: 13 })}</span>Asignar personal</button>
        </div>
      </div>

      <div className="kpi-grid">
        <FinStat2 lbl="Personal activo" val={personal.length.toString()} sub="en 3 obras" />
        <FinStat2 lbl="Horas semana" val={personal.reduce((s, p) => s + p.hrs, 0).toLocaleString('es-PE')} sub="horas trabajadas" />
        <FinStat2 lbl="Costo MO semanal" val={'S/ ' + (totalMano / 1000).toFixed(1) + 'K'} sub="incl. benef. sociales" />
        <FinStat2 lbl="Asistencia promedio" val={(personal.reduce((s, p) => s + p.att, 0) / personal.length * 100).toFixed(1) + '%'} delta="+1.2pp" deltaKind="pos" />
      </div>

      <div className="hstack" style={{ gap: 2, marginBottom: 14 }}>
        {[
          { k: 'planilla', l: 'Planilla · semana actual' },
          { k: 'asignacion', l: 'Asignación por obra' },
          { k: 'asistencia', l: 'Asistencia' },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, background: 'transparent', border: 'none', borderBottom: '2px solid ' + (tab === t.k ? 'var(--accent)' : 'transparent'), color: tab === t.k ? 'var(--ink)' : 'var(--ink-3)', cursor: 'pointer' }}
          >{t.l}</button>
        ))}
      </div>

      {tab === 'planilla' && (
        <div className="card">
          <div className="card-h"><h3>Planilla — semana 15 (07-13 Abr 2026)</h3><span className="hint">{personal.length} trabajadores</span></div>
          <div className="card-b tight">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Código</th>
                  <th>Trabajador</th>
                  <th style={{ width: 140 }}>Categoría</th>
                  <th style={{ width: 120 }}>Obra</th>
                  <th style={{ width: 70 }} className="num-c">Horas</th>
                  <th style={{ width: 90 }} className="num-c">S/ hora</th>
                  <th style={{ width: 90 }}>Asistencia</th>
                  <th style={{ width: 110 }} className="num-c">Total S/</th>
                </tr>
              </thead>
              <tbody>
                {personal.map((p, i) => (
                  <tr key={p.id} className="row-hover" style={{ cursor: 'pointer' }}>
                    <td className="mono text-xs muted">{p.id}</td>
                    <td>
                      <div className="hstack">
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: avatarBg(i), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)' }}>{initials(p.name)}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{p.role}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="chip">{p.category}</span></td>
                    <td className="mono text-xs muted">{p.proj}</td>
                    <td className="num-c">{p.hrs}</td>
                    <td className="num-c">{p.rate.toFixed(2)}</td>
                    <td>
                      <div className="hstack" style={{ gap: 6 }}>
                        <div style={{ width: 36, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                          <div style={{ width: (p.att * 100) + '%', height: '100%', background: p.att === 1 ? 'var(--ok)' : p.att > 0.9 ? 'var(--warn)' : 'var(--danger)', borderRadius: 2 }} />
                        </div>
                        <span className="mono text-xs">{(p.att * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="num-c" style={{ fontWeight: 600 }}>{p.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--bg-sunken)', fontWeight: 600 }}>
                  <td colSpan="4" style={{ padding: '10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink)', fontFamily: 'var(--mono)' }}>Total planilla</td>
                  <td className="num-c">{personal.reduce((s, p) => s + p.hrs, 0)}</td>
                  <td></td>
                  <td></td>
                  <td className="num-c" style={{ fontSize: 13 }}>{totalMano.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'asignacion' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {Object.entries(byProj).map(([proj, total]) => {
            const people = personal.filter(p => p.proj === proj);
            return (
              <div key={proj} className="card" style={{ padding: 16 }}>
                <div className="hstack between" style={{ marginBottom: 12 }}>
                  <div>
                    <div className="mono text-xs muted">{proj}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{people.length} trabajadores</div>
                  </div>
                  <div className="num-c" style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--mono)' }}>S/ {(total / 1000).toFixed(1)}K</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {people.map((p, i) => (
                    <div key={p.id} className="hstack" style={{ gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: avatarBg(i + 3), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, fontFamily: 'var(--mono)' }}>{initials(p.name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{p.role}</div>
                      </div>
                      <span className="mono text-xs muted">{p.total.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'asistencia' && <AsistenciaHeatmap personal={personal} />}
    </div>
  );
}

function AsistenciaHeatmap({ personal }) {
  const days = ['Lun 07', 'Mar 08', 'Mié 09', 'Jue 10', 'Vie 11', 'Sáb 12', 'Dom 13'];
  return (
    <div className="card">
      <div className="card-h"><h3>Asistencia · semana 15</h3><span className="hint">P=presente · T=tardanza · F=falta · D=descanso</span></div>
      <div className="card-b tight" style={{ overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 260 }}>Trabajador</th>
              {days.map(d => <th key={d} style={{ width: 70, textAlign: 'center' }}>{d}</th>)}
              <th style={{ width: 90, textAlign: 'center' }}>Σ</th>
            </tr>
          </thead>
          <tbody>
            {personal.map((p, i) => {
              const status = days.map((_, j) => {
                if (j === 6) return 'D';
                if (p.att < 0.9 && j === 2) return 'F';
                if (p.att < 1 && j === 4) return 'T';
                return 'P';
              });
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{p.role} · {p.proj}</div>
                  </td>
                  {status.map((s, j) => {
                    const bg = s === 'P' ? 'var(--ok-soft)' : s === 'T' ? 'var(--warn-soft)' : s === 'F' ? 'var(--danger-soft)' : 'var(--bg-sunken)';
                    const fg = s === 'P' ? 'var(--ok-ink)' : s === 'T' ? 'var(--warn-ink)' : s === 'F' ? 'var(--danger-ink)' : 'var(--ink-3)';
                    return (
                      <td key={j} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: bg, color: fg, fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)' }}>{s}</div>
                      </td>
                    );
                  })}
                  <td className="num-c" style={{ fontWeight: 600 }}>{status.filter(s => s === 'P').length}/6</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.SeacePage = SeacePage;
window.PersonalPage = PersonalPage;
