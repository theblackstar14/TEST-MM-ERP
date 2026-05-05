/* global React, Icon, ERP_DATA */
const { useState, useMemo, useEffect } = React;
const {
  fmtPEN, fmtInt, fmtCompact,
  parametrosCC: PARAMS_CC_SEED,
  feriadosPeru2026,
  trabajadores: TRABS_SEED,
  asistencia: ASIST_SEED,
  periodosPlanilla: PER_SEED,
  subsidiosPlanilla: SUB_SEED,
  liquidacionesPlanilla: LIQ_SEED,
  calcularBoletaCC,
  generarAsientoPlanilla,
  projects: PROYECTOS,
  asientosContables,
} = ERP_DATA;

// ════ Helpers ════
const TODAY_PL = new Date('2026-04-23');
const TODAY_PL_STR = TODAY_PL.toISOString().slice(0, 10);
const FERIADOS_SET = new Set(feriadosPeru2026);

const CAT_COLOR = { operario: '#3B5BDB', oficial: '#2F7D5C', peon: '#B45309' };
const CAT_LABEL = { operario: 'Operario', oficial: 'Oficial', peon: 'Peón' };

const ASIST_TIPOS = {
  normal:        { lbl: 'Normal',         color: '#16A34A', bg: '#DCFCE7', short: 'P' },
  tardanza:      { lbl: 'Tardanza',       color: '#B45309', bg: '#FEF3C7', short: 'T' },
  falta_inj:     { lbl: 'Falta injust.',  color: '#DC2626', bg: '#FEE2E2', short: 'F' },
  falta_just:    { lbl: 'Falta justif.',  color: '#7C3AED', bg: '#EDE9FE', short: 'J' },
  descanso_med:  { lbl: 'Descanso méd.',  color: '#0891B2', bg: '#CFFAFE', short: 'DM' },
  feriado_trab:  { lbl: 'Feriado trab.',  color: '#EA580C', bg: '#FFEDD5', short: 'FT' },
  vacaciones:    { lbl: 'Vacaciones',     color: '#6366F1', bg: '#E0E7FF', short: 'V' },
  dominical:     { lbl: 'Dominical',      color: '#71717A', bg: '#F4F4F5', short: 'D' },
};

const findProyecto = (id) => PROYECTOS.find(p => p.id === id);
const fmtDateShort = (iso) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};
const diaSemana = (iso) => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][new Date(iso + 'T12:00:00').getDay()];
const semanaDias = (lunesISO) => {
  const out = [];
  const d = new Date(lunesISO + 'T12:00:00');
  for (let i = 0; i < 6; i++) {
    out.push(new Date(d.getTime() + i * 86400000).toISOString().slice(0, 10));
  }
  return out;
};

// ════ Main ════
function PersonalPage() {
  const [tab, setTab] = useState('dashboard');
  const [trabajadores, setTrabajadores] = useState(TRABS_SEED);
  const [asistencia, setAsistencia] = useState(ASIST_SEED);
  const [periodos, setPeriodos] = useState(PER_SEED);
  const [subsidios, setSubsidios] = useState(SUB_SEED);
  const [params] = useState(PARAMS_CC_SEED);

  const tabs = [
    { id: 'dashboard',   lbl: 'Dashboard',     icon: 'dash' },
    { id: 'trabajadores',lbl: 'Trabajadores',  icon: 'team' },
    { id: 'asistencia',  lbl: 'Asistencia',    icon: 'calendar' },
    { id: 'planilla',    lbl: 'Planilla',      icon: 'money' },
    { id: 'subsidios',   lbl: 'Subsidios',     icon: 'info' },
    { id: 'liquidaciones', lbl: 'Liquidaciones', icon: 'file' },
    { id: 'reportes',    lbl: 'Reportes',      icon: 'trend' },
    { id: 'config',      lbl: 'Configuración', icon: 'cog' },
  ];

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>
      <div className="page-h">
        <div>
          <h1>Personal · Planilla Construcción Civil</h1>
          <div className="sub muted">
            Régimen especial D.S. 011-79-TR · Convenio FTCCP-CAPECO {params.vigenciaInicio.slice(0, 4)}-{params.vigenciaFin.slice(0, 4)}
          </div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <span className="chip blue" style={{ fontSize: 10 }}>
            {trabajadores.filter(t => t.estado === 'activo').length} trabajadores activos
          </span>
        </div>
      </div>

      <div className="hstack" style={{ gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 16, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '9px 14px', fontSize: 12, fontWeight: 500,
              background: 'transparent', border: 'none',
              borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'),
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}>
            {Icon[t.icon]({ size: 13 })} {t.lbl}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <PlDashboard trabajadores={trabajadores} asistencia={asistencia} periodos={periodos} subsidios={subsidios} params={params} />}
      {tab === 'trabajadores' && <PlTrabajadores trabajadores={trabajadores} setTrabajadores={setTrabajadores} />}
      {tab === 'asistencia' && <PlAsistencia trabajadores={trabajadores} asistencia={asistencia} setAsistencia={setAsistencia} />}
      {tab === 'planilla' && <PlPlanilla trabajadores={trabajadores} asistencia={asistencia} periodos={periodos} setPeriodos={setPeriodos} params={params} />}
      {tab === 'subsidios' && <PlSubsidios subsidios={subsidios} setSubsidios={setSubsidios} trabajadores={trabajadores} />}
      {tab === 'liquidaciones' && <PlLiquidaciones trabajadores={trabajadores} setTrabajadores={setTrabajadores} params={params} />}
      {tab === 'reportes' && <PlReportes trabajadores={trabajadores} periodos={periodos} asistencia={asistencia} params={params} />}
      {tab === 'config' && <PlConfig params={params} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. DASHBOARD
// ════════════════════════════════════════════════════════════════
function PlDashboard({ trabajadores, asistencia, periodos, subsidios, params }) {
  const activos = trabajadores.filter(t => t.estado === 'activo');
  const periodoActual = periodos.find(p => p.estado === 'abierto') || periodos[periodos.length - 1];

  const asistSem = asistencia.filter(a => a.fecha >= periodoActual.fechaInicio && a.fecha <= periodoActual.fechaFin);
  const nominaActual = activos.reduce((acc, t) => {
    const asistT = asistSem.filter(a => a.trabajadorId === t.id);
    if (asistT.length === 0) return acc;
    const b = calcularBoletaCC(t, asistT, params);
    return { bruto: acc.bruto + b.totalIngresos, costo: acc.costo + b.costoTotal };
  }, { bruto: 0, costo: 0 });

  const faltasInjSem = asistSem.filter(a => a.tipo === 'falta_inj').length;
  const dmActivos = subsidios.filter(s => s.estado === 'tramitado').length;

  const alertSCTR = activos.filter(t => {
    if (!t.sctrVigenciaFin) return true;
    const dias = (new Date(t.sctrVigenciaFin) - TODAY_PL) / 86400000;
    return dias < 30;
  });
  const alertContrato = activos.filter(t => {
    if (!t.contratoFechaFin) return false;
    const dias = (new Date(t.contratoFechaFin) - TODAY_PL) / 86400000;
    return dias > 0 && dias < 30;
  });

  const porCat = ['operario', 'oficial', 'peon'].map(c => ({
    categoria: c,
    count: activos.filter(t => t.categoria === c).length,
    color: CAT_COLOR[c],
  }));

  const porObra = {};
  activos.forEach(t => { porObra[t.obraId] = (porObra[t.obraId] || 0) + 1; });

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <PlKPI lbl="Nómina semana actual" val={fmtPEN(nominaActual.bruto)} sub={`Costo total: ${fmtPEN(nominaActual.costo)}`} color="var(--accent)" />
        <PlKPI lbl="Trabajadores activos" val={activos.length} sub={`Por categoría: ${porCat.map(c => c.count).join(' / ')}`} />
        <PlKPI lbl="Faltas inj. semana" val={faltasInjSem} sub="Descontables" color={faltasInjSem > 0 ? 'var(--danger)' : 'var(--ok)'} />
        <PlKPI lbl="DM activos" val={dmActivos} sub="Subsidios EsSalud" />
      </div>

      {(alertSCTR.length > 0 || alertContrato.length > 0) && (
        <div className="card" style={{ padding: 14, background: 'var(--warn-soft)', borderColor: 'var(--warn)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn-ink)', marginBottom: 8 }}>⚠ Alertas legales</div>
          {alertSCTR.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--warn-ink)', marginBottom: 4 }}>
              <b>SCTR por vencer ({alertSCTR.length}):</b> {alertSCTR.map(t => t.nombre.split(' ')[0]).join(', ')}
            </div>
          )}
          {alertContrato.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--warn-ink)' }}>
              <b>Contratos por vencer ({alertContrato.length}):</b> {alertContrato.map(t => t.nombre.split(' ')[0]).join(', ')}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <div className="card-h"><h3>Distribución por categoría</h3></div>
          <div className="card-b">
            {porCat.map(c => (
              <div key={c.categoria} style={{ marginBottom: 10 }}>
                <div className="hstack between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{CAT_LABEL[c.categoria]}</span>
                  <span className="mono" style={{ fontSize: 11 }}>{c.count} · {fmtPEN(params.jornales[c.categoria])}/día</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-sunken)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (c.count / activos.length * 100) + '%', background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Trabajadores por obra</h3></div>
          <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(porObra).sort((a, b) => b[1] - a[1]).map(([obra, n]) => {
              const p = findProyecto(obra);
              return (
                <div key={obra} className="hstack between" style={{ padding: '6px 10px', background: 'var(--bg-sunken)', borderRadius: 6 }}>
                  <div>
                    <div className="mono text-xs muted">{obra}</div>
                    <div style={{ fontSize: 11 }}>{p ? p.name.slice(0, 50) : '—'}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlKPI({ lbl, val, sub, color }) {
  return (
    <div className="kpi">
      <div className="lbl">{lbl}</div>
      <div className="val" style={{ color: color || 'var(--ink)' }}>{val}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. TRABAJADORES
// ════════════════════════════════════════════════════════════════
function PlTrabajadores({ trabajadores, setTrabajadores }) {
  const [q, setQ] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterObra, setFilterObra] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return trabajadores.filter(t => {
      if (filterCat !== 'all' && t.categoria !== filterCat) return false;
      if (filterObra !== 'all' && t.obraId !== filterObra) return false;
      if (q) {
        const ql = q.toLowerCase();
        return t.nombre.toLowerCase().includes(ql) || t.dni.includes(q) || t.id.toLowerCase().includes(ql);
      }
      return true;
    });
  }, [trabajadores, q, filterCat, filterObra]);

  const obras = Array.from(new Set(trabajadores.map(t => t.obraId)));

  return (
    <div>
      <div className="card" style={{ padding: '10px 14px', marginBottom: 12 }}>
        <div className="hstack" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}>{Icon.search({ size: 12 })}</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nombre, DNI, ID..."
              style={{ width: '100%', padding: '6px 10px 6px 28px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <select value={filterObra} onChange={e => setFilterObra(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12 }}>
            <option value="all">Todas obras</option>
            {obras.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', lbl: 'Todas', count: trabajadores.length, color: '#0F1115' },
            { id: 'operario', lbl: 'Operario', count: trabajadores.filter(t => t.categoria === 'operario').length, color: CAT_COLOR.operario },
            { id: 'oficial', lbl: 'Oficial', count: trabajadores.filter(t => t.categoria === 'oficial').length, color: CAT_COLOR.oficial },
            { id: 'peon', lbl: 'Peón', count: trabajadores.filter(t => t.categoria === 'peon').length, color: CAT_COLOR.peon },
          ].map(c => {
            const active = filterCat === c.id;
            return (
              <button key={c.id} onClick={() => setFilterCat(c.id)}
                style={{
                  padding: '4px 12px', borderRadius: 14, fontSize: 11, fontWeight: 600,
                  border: '1px solid ' + (active ? c.color : 'var(--line)'),
                  background: active ? c.color : 'var(--bg-elev)',
                  color: active ? '#fff' : 'var(--ink-2)', cursor: 'pointer',
                }}>
                {c.lbl} <span style={{ opacity: 0.75, fontFamily: 'var(--mono)', fontSize: 10 }}>{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.map(t => <PlTrabCard key={t.id} t={t} onClick={() => setSelected(t)} />)}
      </div>
      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>Sin resultados</div>}

      {selected && <PlTrabDetail trab={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PlTrabCard({ t, onClick }) {
  const proy = findProyecto(t.obraId);
  const sctrDias = t.sctrVigenciaFin ? Math.floor((new Date(t.sctrVigenciaFin) - TODAY_PL) / 86400000) : -1;
  const sctrAlert = sctrDias < 30;
  const initials = t.nombre.split(' ').slice(0, 2).map(w => w[0]).join('');

  return (
    <div className="card" onClick={onClick}
      style={{ padding: 12, cursor: 'pointer', borderLeft: `3px solid ${CAT_COLOR[t.categoria]}` }}>
      <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: CAT_COLOR[t.categoria], color: '#fff',
          display: 'grid', placeItems: 'center',
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)',
          flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</div>
          <div className="mono text-xs muted">DNI {t.dni} · {t.id}</div>
        </div>
      </div>
      <div className="hstack" style={{ gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span className="chip" style={{ background: CAT_COLOR[t.categoria] + '22', color: CAT_COLOR[t.categoria], fontSize: 10 }}>
          {CAT_LABEL[t.categoria]}
        </span>
        <span className="chip blue" style={{ fontSize: 10 }}>{t.regimenPensionario.toUpperCase()}</span>
        {t.bonifAltura && <span className="chip amber" style={{ fontSize: 10 }}>↑ Altura</span>}
        {t.bonifNocturno && <span className="chip" style={{ fontSize: 10, background: '#1F2937', color: '#fff' }}>🌙 Noche</span>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', borderTop: '1px solid var(--line)', paddingTop: 8 }}>
        <div>📍 {proy ? proy.id + ' · ' + proy.client.split(' ')[0] : t.obraId}</div>
        <div style={{ marginTop: 2 }}>
          SCTR: <span style={{ color: sctrAlert ? 'var(--danger)' : 'var(--ok)', fontWeight: 600 }}>
            {sctrDias > 0 ? `vence en ${sctrDias}d` : 'VENCIDO'}
          </span>
          {' · '}{t.hijosEdadEscolar} hijo(s) escolar
        </div>
      </div>
    </div>
  );
}

function PlTrabDetail({ trab, onClose }) {
  const proy = findProyecto(trab.obraId);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 480, maxWidth: '95vw', height: '100vh', background: 'var(--bg-elev)', overflow: 'auto', padding: 20, borderLeft: `4px solid ${CAT_COLOR[trab.categoria]}` }}>
        <div className="hstack between" style={{ marginBottom: 14 }}>
          <div>
            <div className="mono text-xs muted">{trab.id} · DNI {trab.dni}</div>
            <h2 style={{ margin: '4px 0', fontSize: 18 }}>{trab.nombre}</h2>
          </div>
          <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
        </div>

        <div className="vstack" style={{ gap: 14 }}>
          <Section titulo="Información laboral">
            <KV k="Categoría" v={CAT_LABEL[trab.categoria]} />
            <KV k="Obra asignada" v={proy ? `${proy.id} · ${proy.name.slice(0, 40)}` : trab.obraId} />
            <KV k="Tipo contrato" v={trab.tipoContrato.replace(/_/g, ' ')} />
            <KV k="Fecha ingreso" v={trab.fechaIngreso} />
            <KV k="Contrato hasta" v={trab.contratoFechaFin || '—'} />
          </Section>
          <Section titulo="Régimen pensionario y aportes">
            <KV k="Sistema" v={trab.regimenPensionario.toUpperCase()} />
            <KV k="T-Registro" v={trab.inscritoTRegistro ? '✓ Inscrito' : '✗ No inscrito'} />
            <KV k="SCTR vigencia" v={trab.sctrVigenciaFin || '—'} />
            <KV k="Examen médico" v={trab.examenMedicoVigente ? '✓ Vigente' : '⚠ Vencido'} />
          </Section>
          <Section titulo="Beneficios y bonificaciones">
            <KV k="Hijos en edad escolar" v={trab.hijosEdadEscolar} />
            <KV k="Bonif. altura (5%)" v={trab.bonifAltura ? '✓' : '—'} />
            <KV k="Bonif. agua (20%)" v={trab.bonifAgua ? '✓' : '—'} />
            <KV k="Bonif. nocturno (25%)" v={trab.bonifNocturno ? '✓' : '—'} />
          </Section>
          <Section titulo="Contacto">
            <KV k="Teléfono" v={trab.telefono} />
          </Section>
        </div>
      </div>
    </div>
  );
}

const Section = ({ titulo, children }) => (
  <div className="card">
    <div className="card-h"><h3>{titulo}</h3></div>
    <div className="card-b" style={{ fontSize: 12, lineHeight: 1.8 }}>{children}</div>
  </div>
);
const KV = ({ k, v }) => (
  <div className="hstack between">
    <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>{k}</span>
    <span style={{ fontWeight: 500, fontFamily: typeof v === 'string' && /^\d/.test(v) ? 'var(--mono)' : 'var(--sans)' }}>{v}</span>
  </div>
);

// ════════════════════════════════════════════════════════════════
// 3. ASISTENCIA · calendario semanal × trabajador
// ════════════════════════════════════════════════════════════════
function PlAsistencia({ trabajadores, asistencia, setAsistencia }) {
  const [lunesISO, setLunesISO] = useState('2026-04-20');
  const [filterObra, setFilterObra] = useState('all');
  const dias = semanaDias(lunesISO);

  const semanaShift = (delta) => {
    const d = new Date(lunesISO + 'T12:00:00');
    d.setDate(d.getDate() + delta * 7);
    setLunesISO(d.toISOString().slice(0, 10));
  };

  const trabsVisibles = trabajadores.filter(t =>
    t.estado === 'activo' && (filterObra === 'all' || t.obraId === filterObra)
  );

  const cellAt = (trabId, fecha) => asistencia.find(a => a.trabajadorId === trabId && a.fecha === fecha);

  const cycleTipo = (trabId, fecha) => {
    const order = ['normal', 'tardanza', 'falta_inj', 'falta_just', 'descanso_med', 'feriado_trab', 'vacaciones', null];
    setAsistencia(prev => {
      const idx = prev.findIndex(a => a.trabajadorId === trabId && a.fecha === fecha);
      const cur = idx >= 0 ? prev[idx].tipo : null;
      const next = order[(order.indexOf(cur) + 1) % order.length];
      const trab = trabajadores.find(t => t.id === trabId);
      if (next === null) return prev.filter((_, i) => i !== idx);
      const nuevo = { trabajadorId: trabId, obraId: trab.obraId, fecha, tipo: next, horasExtras25: 0, horasExtras35: 0, minutosTardanza: next === 'tardanza' ? 25 : 0 };
      if (idx >= 0) { const cp = [...prev]; cp[idx] = { ...cp[idx], ...nuevo }; return cp; }
      return [...prev, nuevo];
    });
  };

  const fillSemanaNormal = () => {
    setAsistencia(prev => {
      const cp = [...prev];
      trabsVisibles.forEach(t => {
        dias.forEach(d => {
          if (FERIADOS_SET.has(d)) return;
          const idx = cp.findIndex(a => a.trabajadorId === t.id && a.fecha === d);
          if (idx === -1) cp.push({ trabajadorId: t.id, obraId: t.obraId, fecha: d, tipo: 'normal', horasExtras25: 0, horasExtras35: 0, minutosTardanza: 0 });
        });
      });
      return cp;
    });
  };

  const obras = Array.from(new Set(trabajadores.map(t => t.obraId)));

  return (
    <div>
      <div className="card" style={{ padding: '10px 14px', marginBottom: 12 }}>
        <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="tb-btn" onClick={() => semanaShift(-1)}>{Icon.left({ size: 12 })} Anterior</button>
          <div style={{ fontSize: 13, fontWeight: 700, padding: '0 12px', display: 'flex', alignItems: 'center' }}>
            Semana del {fmtDateShort(dias[0])} al {fmtDateShort(dias[5])}
          </div>
          <button className="tb-btn" onClick={() => semanaShift(1)}>Siguiente {Icon.right({ size: 12 })}</button>
          <select value={filterObra} onChange={e => setFilterObra(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, marginLeft: 12 }}>
            <option value="all">Todas obras ({trabajadores.filter(t => t.estado === 'activo').length})</option>
            {obras.map(o => <option key={o} value={o}>{o} ({trabajadores.filter(t => t.estado === 'activo' && t.obraId === o).length})</option>)}
          </select>
          <button className="tb-btn primary" onClick={fillSemanaNormal} style={{ marginLeft: 'auto' }}>
            ✓ Marcar todos normales
          </button>
        </div>
      </div>

      <div className="hstack" style={{ gap: 6, marginBottom: 10, flexWrap: 'wrap', fontSize: 10 }}>
        <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Click celda → cicla:</span>
        {Object.entries(ASIST_TIPOS).filter(([k]) => k !== 'dominical').map(([k, v]) => (
          <span key={k} className="chip" style={{ fontSize: 9, background: v.bg, color: v.color, fontWeight: 700 }}>{v.short} {v.lbl}</span>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ background: 'var(--bg-sunken)' }}>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', minWidth: 220 }}>Trabajador</th>
              {dias.map(d => {
                const isFer = FERIADOS_SET.has(d);
                return (
                  <th key={d} style={{ padding: '8px 6px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: isFer ? 'var(--danger)' : 'var(--ink-3)', minWidth: 70 }}>
                    <div>{diaSemana(d)}</div>
                    <div className="mono" style={{ fontSize: 9, opacity: 0.7 }}>{fmtDateShort(d)}{isFer && ' ⚐'}</div>
                  </th>
                );
              })}
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Días</th>
            </tr>
          </thead>
          <tbody>
            {trabsVisibles.map(t => {
              const diasNormales = dias.filter(d => {
                const c = cellAt(t.id, d);
                return c && (c.tipo === 'normal' || c.tipo === 'tardanza');
              }).length;
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{t.nombre}</div>
                    <div className="mono text-xs muted">{CAT_LABEL[t.categoria]} · {t.obraId}</div>
                  </td>
                  {dias.map(d => {
                    const c = cellAt(t.id, d);
                    const tipo = c ? c.tipo : null;
                    const cfg = tipo ? ASIST_TIPOS[tipo] : null;
                    return (
                      <td key={d} onClick={() => cycleTipo(t.id, d)}
                        style={{
                          padding: '6px 4px', textAlign: 'center', cursor: 'pointer',
                          background: cfg ? cfg.bg : 'transparent',
                          color: cfg ? cfg.color : 'var(--ink-4)',
                          fontWeight: 700, fontSize: 11, fontFamily: 'var(--mono)',
                          borderRight: '1px solid var(--line)',
                        }}>
                        {cfg ? cfg.short : '—'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}>{diasNormales}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. PLANILLA · generar, ver boletas, cerrar
// ════════════════════════════════════════════════════════════════
function PlPlanilla({ trabajadores, asistencia, periodos, setPeriodos, params }) {
  const [periodoId, setPeriodoId] = useState(periodos[periodos.length - 1].id);
  const [boletaSel, setBoletaSel] = useState(null);

  const periodo = periodos.find(p => p.id === periodoId);
  const asistPeriodo = asistencia.filter(a => a.fecha >= periodo.fechaInicio && a.fecha <= periodo.fechaFin);

  const boletas = useMemo(() => {
    return trabajadores.filter(t => t.estado === 'activo').map(t => {
      const asistT = asistPeriodo.filter(a => a.trabajadorId === t.id);
      if (asistT.length === 0) return null;
      return calcularBoletaCC(t, asistT, params);
    }).filter(Boolean);
  }, [trabajadores, asistPeriodo, params]);

  const tot = boletas.reduce((acc, b) => ({
    bruto: acc.bruto + b.totalIngresos,
    desc: acc.desc + b.totalDescuentos,
    aport: acc.aport + b.totalAportes,
    neto: acc.neto + b.neto,
    costo: acc.costo + b.costoTotal,
  }), { bruto: 0, desc: 0, aport: 0, neto: 0, costo: 0 });

  const cerrarPlanilla = () => {
    if (!confirm(`¿Cerrar planilla ${periodoId}? Se generará el asiento contable y no podrá editarse después.`)) return;
    const asiento = generarAsientoPlanilla(boletas, periodoId, periodo.fechaFin);
    asientosContables.push(asiento);
    setPeriodos(prev => prev.map(p => p.id === periodoId ? { ...p, estado: 'cerrado', asientoId: asiento.id, fechaCierre: new Date().toISOString().slice(0, 10) } : p));
    alert(`Planilla cerrada · Asiento ${asiento.id} generado en Contabilidad → Libro Diario (pendiente revisión).`);
  };

  return (
    <div>
      <div className="card" style={{ padding: '10px 14px', marginBottom: 12 }}>
        <div className="hstack" style={{ gap: 10, flexWrap: 'wrap' }}>
          <select value={periodoId} onChange={e => setPeriodoId(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 220 }}>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.id} · {p.fechaInicio} → {p.fechaFin} · {p.estado}</option>)}
          </select>
          <span className={'chip ' + (periodo.estado === 'pagado' ? 'green' : periodo.estado === 'cerrado' ? 'blue' : 'amber')} style={{ fontSize: 10 }}>
            {periodo.estado.toUpperCase()}
          </span>
          {periodo.asientoId && <span className="mono text-xs muted">Asiento {periodo.asientoId}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="tb-btn">{Icon.download({ size: 12 })} Exportar Excel</button>
            {periodo.estado === 'abierto' && (
              <button className="tb-btn primary" onClick={cerrarPlanilla}>
                {Icon.check({ size: 12 })} Cerrar y contabilizar
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
        <PlKPI lbl="Total bruto" val={fmtPEN(tot.bruto)} sub={`${boletas.length} boletas`} />
        <PlKPI lbl="Descuentos" val={fmtPEN(tot.desc)} sub="ONP/AFP/Renta" color="var(--danger)" />
        <PlKPI lbl="Neto a pagar" val={fmtPEN(tot.neto)} color="var(--ok)" />
        <PlKPI lbl="Aportes empleador" val={fmtPEN(tot.aport)} sub="EsSalud + SCTR + Sencico + ConaFoVicer" />
        <PlKPI lbl="Costo total" val={fmtPEN(tot.costo)} color="var(--accent)" sub="Bruto + aportes" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ background: 'var(--bg-sunken)' }}>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Trabajador</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Días</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Jornal</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>BUC</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Bonif</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Bruto</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Desc</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Neto</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}></th>
            </tr>
          </thead>
          <tbody>
            {boletas.map(b => {
              const t = trabajadores.find(x => x.id === b.trabajadorId);
              const bonif = b.ingresos.bonifAltura + b.ingresos.bonifAgua + b.ingresos.bonifNocturno + b.ingresos.asignEscolar + b.ingresos.movilidad + b.ingresos.horasExtras25 + b.ingresos.horasExtras35;
              return (
                <tr key={b.trabajadorId} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{t.nombre}</div>
                    <div className="mono text-xs muted">{CAT_LABEL[t.categoria]} · {t.obraId}</div>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'var(--mono)' }}>{b.diasNormales}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmtPEN(b.ingresos.jornalBruto)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmtPEN(b.ingresos.bucMonto)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmtPEN(bonif)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmtPEN(b.totalIngresos)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--danger)' }}>−{fmtPEN(b.totalDescuentos)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--ok)' }}>{fmtPEN(b.neto)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button className="tb-btn" style={{ height: 22, fontSize: 10, padding: '0 8px' }} onClick={() => setBoletaSel(b)}>Ver boleta</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {boletaSel && (
        <PlBoletaModal boleta={boletaSel} trab={trabajadores.find(t => t.id === boletaSel.trabajadorId)} periodo={periodo} params={params} onClose={() => setBoletaSel(null)} />
      )}
    </div>
  );
}

function PlBoletaModal({ boleta, trab, periodo, params, onClose }) {
  const proy = findProyecto(trab.obraId);
  const Row = ({ k, v, neg, bold, big, color }) => (
    <div className="hstack between" style={{ padding: '5px 0', borderBottom: bold ? '2px solid var(--line)' : '1px solid var(--line)', marginTop: bold ? 6 : 0 }}>
      <span style={{ fontSize: bold ? 12 : 11, fontWeight: bold ? 700 : 400, color: color || 'var(--ink-2)' }}>{k}</span>
      <span className="mono" style={{ fontSize: big ? 14 : 11, fontWeight: bold ? 700 : 500, color: neg ? 'var(--danger)' : color || 'var(--ink)' }}>
        {neg ? '−' : ''}{typeof v === 'number' ? fmtPEN(v) : v}
      </span>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 600, maxWidth: '95vw', maxHeight: '92vh', overflow: 'auto', background: 'var(--bg-elev)', borderRadius: 10, padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="mono text-xs muted">BOLETA DE PAGO · {periodo.id}</div>
            <h2 style={{ margin: '4px 0', fontSize: 16 }}>{trab.nombre}</h2>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              DNI {trab.dni} · {CAT_LABEL[trab.categoria]} · {proy ? proy.id : trab.obraId}
            </div>
          </div>
          <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
        </div>

        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ok)', marginBottom: 6, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>INGRESOS</div>
            <Row k="Jornal básico" v={boleta.ingresos.jornalBruto} />
            <Row k="BUC" v={boleta.ingresos.bucMonto} />
            <Row k="Dominical" v={boleta.ingresos.dominical} />
            <Row k="Asignación escolar" v={boleta.ingresos.asignEscolar} />
            <Row k="Movilidad" v={boleta.ingresos.movilidad} />
            <Row k="CTS (15%)" v={boleta.ingresos.cts} />
            {boleta.ingresos.bonifAltura > 0 && <Row k="Bonif. altura" v={boleta.ingresos.bonifAltura} />}
            {boleta.ingresos.bonifAgua > 0 && <Row k="Bonif. agua" v={boleta.ingresos.bonifAgua} />}
            {boleta.ingresos.bonifNocturno > 0 && <Row k="Bonif. nocturno" v={boleta.ingresos.bonifNocturno} />}
            {boleta.ingresos.horasExtras25 > 0 && <Row k="HE 25%" v={boleta.ingresos.horasExtras25} />}
            {boleta.ingresos.horasExtras35 > 0 && <Row k="HE 35%" v={boleta.ingresos.horasExtras35} />}
            {boleta.ingresos.feriadoTrab > 0 && <Row k="Feriado trab." v={boleta.ingresos.feriadoTrab} />}
            <Row k="Total ingresos" v={boleta.totalIngresos} bold />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 6, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>DESCUENTOS</div>
            {boleta.descuentos.onp > 0 && <Row k="ONP (13%)" v={boleta.descuentos.onp} neg />}
            {boleta.descuentos.afpFondo > 0 && <Row k="AFP fondo" v={boleta.descuentos.afpFondo} neg />}
            {boleta.descuentos.afpComision > 0 && <Row k="AFP comisión" v={boleta.descuentos.afpComision} neg />}
            {boleta.descuentos.afpPrima > 0 && <Row k="AFP prima seguro" v={boleta.descuentos.afpPrima} neg />}
            {boleta.descuentos.renta5ta > 0 && <Row k="Renta 5ta" v={boleta.descuentos.renta5ta} neg />}
            {boleta.descuentos.tardanza > 0 && <Row k="Tardanzas" v={boleta.descuentos.tardanza} neg />}
            {boleta.descuentos.faltasInj > 0 && <Row k="Faltas injust." v={boleta.descuentos.faltasInj} neg />}
            <Row k="Total descuentos" v={boleta.totalDescuentos} bold neg />

            <div style={{ marginTop: 14, padding: 10, background: 'var(--ok-soft)', borderRadius: 6 }}>
              <div className="hstack between">
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ok)' }}>NETO A PAGAR</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ok)' }}>{fmtPEN(boleta.neto)}</span>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: 10, background: 'var(--bg-sunken)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>APORTES EMPLEADOR (no afecta neto)</div>
              <Row k="EsSalud (9%)" v={boleta.aportes.essalud} />
              <Row k="SCTR Salud" v={boleta.aportes.sctrSalud} />
              <Row k="SCTR Pensión" v={boleta.aportes.sctrPension} />
              <Row k="Sencico" v={boleta.aportes.sencico} />
              <Row k="ConaFoVicer" v={boleta.aportes.conafovicer} />
              <Row k="Costo total empresa" v={boleta.costoTotal} bold color="var(--accent)" />
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="tb-btn" onClick={() => window.print()}>{Icon.download({ size: 12 })} Imprimir</button>
          <button className="tb-btn primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. SUBSIDIOS · EsSalud
// ════════════════════════════════════════════════════════════════
function PlSubsidios({ subsidios, setSubsidios, trabajadores }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="hstack" style={{ marginBottom: 12, gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          Empleador paga días 1-20 · EsSalud reembolsa días 21+ (enfermedad/maternidad/accidente)
        </div>
        <button className="tb-btn primary" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(true)}>
          {Icon.plus({ size: 12 })} Nuevo subsidio
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ background: 'var(--bg-sunken)' }}>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>ID</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Trabajador</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Tipo</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Periodo</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Días</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Diagnóstico</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Pagador</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {subsidios.length === 0 && <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--ink-4)' }}>Sin subsidios registrados</td></tr>}
            {subsidios.map(s => {
              const t = trabajadores.find(x => x.id === s.trabajadorId);
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 11 }}>{s.id}</td>
                  <td style={{ padding: '8px 10px' }}>{t?.nombre || s.trabajadorId}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span className="chip blue" style={{ fontSize: 10 }}>{s.tipo}</span>
                  </td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 11 }}>{s.fechaInicio} → {s.fechaFin}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}>{s.diasCubiertos}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11 }}>{s.diagnostico}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span className={'chip ' + (s.cubrePagador === 'empleador' ? 'amber' : 'green')} style={{ fontSize: 10 }}>
                      {s.cubrePagador === 'empleador' ? 'Empleador (1-20)' : 'EsSalud (21+)'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span className={'chip ' + (s.estado === 'cobrado' ? 'green' : 'amber')} style={{ fontSize: 10 }}>{s.estado}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && <PlSubsidioForm trabajadores={trabajadores} onSave={(s) => { setSubsidios(prev => [...prev, s]); setShowForm(false); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function PlSubsidioForm({ trabajadores, onSave, onClose }) {
  const [form, setForm] = useState({
    trabajadorId: trabajadores[0].id,
    tipo: 'enfermedad', fechaInicio: '', fechaFin: '',
    diagnostico: '', certificadoMedico: '',
  });
  const dias = form.fechaInicio && form.fechaFin
    ? Math.max(0, Math.floor((new Date(form.fechaFin) - new Date(form.fechaInicio)) / 86400000) + 1)
    : 0;
  const cubrePagador = dias <= 20 ? 'empleador' : 'essalud';

  const submit = () => {
    if (!form.fechaInicio || !form.fechaFin || !form.diagnostico) return alert('Completa fechas y diagnóstico');
    onSave({
      id: 'SUB-' + Date.now().toString().slice(-6),
      ...form, diasCubiertos: dias, cubrePagador, estado: 'tramitado', importeReembolsable: 0,
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '95vw', background: 'var(--bg-elev)', borderRadius: 10, padding: 20 }}>
        <h3 style={{ margin: '0 0 14px' }}>Registrar subsidio EsSalud</h3>
        <div className="vstack" style={{ gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Trabajador</label>
            <select value={form.trabajadorId} onChange={e => setForm({ ...form, trabajadorId: e.target.value })}
              style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}>
              {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Tipo</label>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
              style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}>
              <option value="enfermedad">Enfermedad</option>
              <option value="maternidad">Maternidad</option>
              <option value="accidente_sctr">Accidente (SCTR)</option>
            </select>
          </div>
          <div className="hstack" style={{ gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Fecha inicio</label>
              <input type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Fecha fin</label>
              <input type="date" value={form.fechaFin} onChange={e => setForm({ ...form, fechaFin: e.target.value })}
                style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Diagnóstico</label>
            <input value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })} placeholder="ej. Lumbalgia mecánica · CIE-10 M54.5"
              style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Certificado médico (CITT)</label>
            <input value={form.certificadoMedico} onChange={e => setForm({ ...form, certificadoMedico: e.target.value })} placeholder="ej. CITT-2026-08841"
              style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }} />
          </div>

          {dias > 0 && (
            <div style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, fontSize: 12 }}>
              <div className="hstack between"><span>Días totales:</span> <span className="mono"><b>{dias}</b></span></div>
              <div className="hstack between"><span>Cubre:</span> <span className={'chip ' + (cubrePagador === 'empleador' ? 'amber' : 'green')} style={{ fontSize: 10 }}>{cubrePagador === 'empleador' ? 'Empleador (1-20)' : 'EsSalud (21+)'}</span></div>
            </div>
          )}

          <div className="hstack" style={{ gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
            <button className="tb-btn" onClick={onClose}>Cancelar</button>
            <button className="tb-btn primary" onClick={submit}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. LIQUIDACIONES
// ════════════════════════════════════════════════════════════════
function PlLiquidaciones({ trabajadores, setTrabajadores, params }) {
  const [showForm, setShowForm] = useState(null);
  const cesados = trabajadores.filter(t => t.estado === 'cesado');

  const calcular = (trab, fechaCese) => {
    const ingreso = new Date(trab.fechaIngreso);
    const cese = new Date(fechaCese);
    const diasTrab = (cese - ingreso) / 86400000;
    const añosTrab = diasTrab / 365;
    const jornal = params.jornales[trab.categoria];

    const vacTruncas = (diasTrab / 365) * 30 * jornal * (1 + params.buc[trab.categoria]);
    const gratifTrunca = (diasTrab / 365) * 80 * jornal;
    const ctsTrunca = 0;
    const indemnizDespArb = añosTrab * 15 * jornal;

    return {
      vacTruncas: +vacTruncas.toFixed(2),
      gratifTrunca: +gratifTrunca.toFixed(2),
      ctsTrunca: +ctsTrunca.toFixed(2),
      indemnizDespArb: +indemnizDespArb.toFixed(2),
      añosTrab: +añosTrab.toFixed(2),
    };
  };

  return (
    <div>
      <div className="hstack" style={{ marginBottom: 12, gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {cesados.length} trabajadores cesados · {trabajadores.filter(t => t.estado === 'activo').length} activos
        </div>
        <button className="tb-btn primary" style={{ marginLeft: 'auto' }} onClick={() => setShowForm({ trabajadorId: trabajadores.find(t => t.estado === 'activo').id, motivo: 'renuncia', fecha: TODAY_PL_STR })}>
          {Icon.plus({ size: 12 })} Calcular liquidación
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        {cesados.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-4)', fontSize: 12, padding: 40 }}>
            Sin ceses registrados aún · usa "Calcular liquidación" para simular un cese y ver el cálculo de beneficios truncos.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr><th>Trabajador</th><th>Fecha cese</th><th>Motivo</th><th>Total liquidado</th></tr></thead>
            <tbody>{cesados.map(t => <tr key={t.id}><td>{t.nombre}</td><td>—</td><td>—</td><td>—</td></tr>)}</tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 540, maxWidth: '95vw', background: 'var(--bg-elev)', borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px' }}>Liquidación de beneficios</h3>
            <div className="vstack" style={{ gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Trabajador</label>
                <select value={showForm.trabajadorId} onChange={e => setShowForm({ ...showForm, trabajadorId: e.target.value })}
                  style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}>
                  {trabajadores.filter(t => t.estado === 'activo').map(t => <option key={t.id} value={t.id}>{t.nombre} · {CAT_LABEL[t.categoria]}</option>)}
                </select>
              </div>
              <div className="hstack" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Motivo</label>
                  <select value={showForm.motivo} onChange={e => setShowForm({ ...showForm, motivo: e.target.value })}
                    style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}>
                    <option value="renuncia">Renuncia</option>
                    <option value="vencim_contrato">Vencim. contrato</option>
                    <option value="despido">Despido arbitrario</option>
                    <option value="cese">Cese mutuo</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)' }}>Fecha de cese</label>
                  <input type="date" value={showForm.fecha} onChange={e => setShowForm({ ...showForm, fecha: e.target.value })}
                    style={{ width: '100%', padding: 7, border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }} />
                </div>
              </div>

              {(() => {
                const trab = trabajadores.find(t => t.id === showForm.trabajadorId);
                const c = calcular(trab, showForm.fecha);
                const incluyeIndemniz = showForm.motivo === 'despido';
                const total = c.vacTruncas + c.gratifTrunca + c.ctsTrunca + (incluyeIndemniz ? c.indemnizDespArb : 0);
                return (
                  <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-sunken)', borderRadius: 6, fontSize: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>Tiempo de servicio: <b>{c.añosTrab} años</b></div>
                    <div className="hstack between" style={{ padding: '4px 0' }}><span>Vacaciones truncas (proporcional)</span> <span className="mono">{fmtPEN(c.vacTruncas)}</span></div>
                    <div className="hstack between" style={{ padding: '4px 0' }}><span>Gratificaciones truncas (Fiestas + Navidad)</span> <span className="mono">{fmtPEN(c.gratifTrunca)}</span></div>
                    <div className="hstack between" style={{ padding: '4px 0' }}><span>CTS trunca (incluida en planilla semanal)</span> <span className="mono">{fmtPEN(c.ctsTrunca)}</span></div>
                    {incluyeIndemniz && (
                      <div className="hstack between" style={{ padding: '4px 0', color: 'var(--danger)' }}>
                        <span>Indemnización despido arbitrario (15 jornales/año)</span>
                        <span className="mono">{fmtPEN(c.indemnizDespArb)}</span>
                      </div>
                    )}
                    <div className="hstack between" style={{ padding: '8px 0', borderTop: '2px solid var(--line)', marginTop: 6, fontWeight: 700 }}>
                      <span>TOTAL LIQUIDACIÓN</span>
                      <span className="mono" style={{ fontSize: 16, color: 'var(--ok)' }}>{fmtPEN(total)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="hstack" style={{ gap: 6, justifyContent: 'flex-end' }}>
                <button className="tb-btn" onClick={() => setShowForm(null)}>Cerrar</button>
                <button className="tb-btn primary" onClick={() => {
                  setTrabajadores(prev => prev.map(t => t.id === showForm.trabajadorId ? { ...t, estado: 'cesado', fechaCese: showForm.fecha } : t));
                  setShowForm(null);
                  alert('Liquidación calculada y trabajador marcado como cesado.');
                }}>Confirmar cese</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 7. REPORTES
// ════════════════════════════════════════════════════════════════
function PlReportes({ trabajadores, periodos, asistencia, params }) {
  const costoPorObra = useMemo(() => {
    const map = {};
    periodos.filter(p => p.estado !== 'abierto').forEach(p => {
      const asistP = asistencia.filter(a => a.fecha >= p.fechaInicio && a.fecha <= p.fechaFin);
      trabajadores.forEach(t => {
        const asistT = asistP.filter(a => a.trabajadorId === t.id);
        if (asistT.length === 0) return;
        const b = calcularBoletaCC(t, asistT, params);
        if (!map[t.obraId]) map[t.obraId] = { bruto: 0, costo: 0 };
        map[t.obraId].bruto += b.totalIngresos;
        map[t.obraId].costo += b.costoTotal;
      });
    });
    return map;
  }, [trabajadores, periodos, asistencia, params]);

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-h"><h3>Costo de mano de obra por proyecto</h3></div>
        <div className="card-b" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ background: 'var(--bg-sunken)' }}>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Obra</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Cliente</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Bruto</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Costo total</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>% sobre presupuesto</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(costoPorObra).map(([obraId, c]) => {
                const proy = findProyecto(obraId);
                const pct = proy ? (c.costo / proy.budget * 100) : 0;
                return (
                  <tr key={obraId} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>{obraId}</td>
                    <td style={{ padding: '8px 10px' }}>{proy ? proy.client : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{fmtPEN(c.bruto)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700 }}>{fmtPEN(c.costo)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)' }}>
                      {proy ? <span style={{ color: pct > 25 ? 'var(--danger)' : 'var(--ink)' }}>{pct.toFixed(1)}%</span> : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h3>Reportes disponibles</h3></div>
        <div className="card-b" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { t: 'PLAME mensual', d: 'Planilla electrónica SUNAT · TXT', i: 'file', tag: 'SUNAT' },
            { t: 'Kardex de personal', d: 'Historial trabajador completo', i: 'history', tag: 'Reporte' },
            { t: 'Resumen semanal gerencia', d: 'Una hoja con totales', i: 'trend', tag: 'Reporte' },
            { t: 'Aportes pendientes', d: 'EsSalud, AFP, ONP, SCTR', i: 'money', tag: 'SUNAT' },
            { t: 'Asistencia × obra', d: 'Heatmap mes completo', i: 'calendar', tag: 'Reporte' },
            { t: 'Costo MO acumulado año', d: 'Por proyecto', i: 'budget', tag: 'Gerencia' },
          ].map(r => (
            <div key={r.t} className="card" style={{ padding: 14, cursor: 'pointer', background: 'var(--bg-sunken)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon[r.i]({ size: 14 })}</div>
                <span className="chip blue" style={{ fontSize: 9 }}>{r.tag}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{r.t}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 8. CONFIGURACIÓN · parámetros vigentes
// ════════════════════════════════════════════════════════════════
function PlConfig({ params }) {
  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-h">
          <h3>Convenio FTCCP-CAPECO vigente</h3>
          <div className="hint">{params.vigenciaInicio} → {params.vigenciaFin}</div>
        </div>
        <div className="card-b">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {['operario', 'oficial', 'peon'].map(c => (
              <div key={c} style={{ padding: 14, background: 'var(--bg-sunken)', borderRadius: 8, borderLeft: `3px solid ${CAT_COLOR[c]}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: CAT_COLOR[c], textTransform: 'uppercase', marginBottom: 4 }}>{CAT_LABEL[c]}</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{fmtPEN(params.jornales[c])}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>jornal básico día</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>BUC: {(params.buc[c] * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <div className="card-h"><h3>Bonificaciones</h3></div>
          <div className="card-b">
            {Object.entries(params.bonificaciones).map(([k, v]) => (
              <div key={k} className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 12 }}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                <span className="mono" style={{ fontWeight: 600 }}>{(v * 100).toFixed(0)}%</span>
              </div>
            ))}
            <div className="hstack between" style={{ padding: '5px 0' }}>
              <span style={{ fontSize: 12 }}>Movilidad</span>
              <span className="mono" style={{ fontWeight: 600 }}>{params.pasajesPorDia} × {fmtPEN(params.pasajeUrbano)}/día</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>Asignación escolar</span>
              <span className="mono" style={{ fontWeight: 600 }}>{params.asignEscolarJornales} jornales/año/hijo</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0' }}>
              <span style={{ fontSize: 12 }}>CTS construcción civil</span>
              <span className="mono" style={{ fontWeight: 600 }}>{(params.cts * 100).toFixed(0)}% en planilla</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Aportes empleador</h3></div>
          <div className="card-b">
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>EsSalud</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesEmpleador.essalud * 100).toFixed(2)}%</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>SCTR Salud</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesEmpleador.sctrSalud * 100).toFixed(2)}%</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>SCTR Pensión</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesEmpleador.sctrPension * 100).toFixed(2)}%</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>SENCICO</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesEmpleador.sencico * 100).toFixed(2)}%</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0' }}>
              <span style={{ fontSize: 12 }}>ConaFoVicer</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesEmpleador.conafovicer * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Aportes trabajador</h3></div>
          <div className="card-b">
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>ONP</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesTrabajador.onp * 100).toFixed(0)}%</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>AFP fondo (cuenta)</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesTrabajador.afpFondo * 100).toFixed(0)}%</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>AFP comisión</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesTrabajador.afpComision * 100).toFixed(2)}%</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0' }}>
              <span style={{ fontSize: 12 }}>AFP prima seguro</span><span className="mono" style={{ fontWeight: 600 }}>{(params.aportesTrabajador.afpPrimaSeguro * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Renta 5ta categoría</h3></div>
          <div className="card-b">
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>UIT 2026</span>
              <span className="mono" style={{ fontWeight: 600 }}>{fmtPEN(params.uit)}</span>
            </div>
            <div className="hstack between" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 12 }}>Exento</span>
              <span className="mono" style={{ fontWeight: 600 }}>7 UIT = {fmtPEN(params.uit * 7)}</span>
            </div>
            {params.rentaQuintaTramos.map((t, i) => (
              <div key={i} className="hstack between" style={{ padding: '5px 0' }}>
                <span style={{ fontSize: 11 }}>Hasta {t.hasta === Infinity ? '+45 UIT' : t.hasta + ' UIT'}</span>
                <span className="mono" style={{ fontWeight: 600 }}>{(t.tasa * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h3>Feriados oficiales 2026</h3></div>
        <div className="card-b" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {feriadosPeru2026.map(f => (
            <span key={f} className="chip" style={{ fontSize: 11, background: 'var(--danger-soft)', color: 'var(--danger)' }}>{fmtDateShort(f)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

window.PersonalPage = PersonalPage;
