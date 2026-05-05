/* global React, Icon, ERP_DATA, CashflowChart */
const { useState } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

const TEAM = [
  { name: 'Ing. Mario Garcia',        role: 'Jefa de obra',       ini: 'MG', color: '#3B5BDB' },
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
      <path d={toPath(planPts)} fill="none" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="4,3" />
      <path d={`${toPath(realPts)} L${realPts[realPts.length-1][0]},${padT+iH} L${padL},${padT+iH} Z`} fill="var(--accent)" opacity="0.08" />
      <path d={toPath(realPts)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={todayX} x2={todayX} y1={padT} y2={padT + iH} stroke="var(--danger)" strokeWidth="1.5" />
      <text x={todayX + 3} y={padT + 10} fontSize="8" fill="var(--danger)" fontFamily="var(--mono)" fontWeight="600">HOY</text>
      {realPts.length > 0 && ( <circle cx={realPts[realPts.length-1][0]} cy={realPts[realPts.length-1][1]} r="3.5" fill="var(--accent)" /> )}
      <g transform={`translate(${padL + 8}, ${padT + 4})`} fontSize="9" fontFamily="var(--sans)">
        <line x1="0" x2="14" y1="5" y2="5" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="4,3" />
        <text x="18" y="8" fill="var(--ink-3)">Plan</text>
        <line x1="52" x2="66" y1="5" y2="5" stroke="var(--accent)" strokeWidth="2" />
        <text x="70" y="8" fill="var(--ink-2)">Real</text>
      </g>
    </svg>
  );
}

// ── Gantt Compact para Detail ───────────────────────────────────
// ───── Hook: carga + parsea ganttFile del proyecto · si existe ─────
function useProjectGanttData(project) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    if (!project.ganttFile || !window.GanttParser) {
      setData(null);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    fetch(project.ganttFile)
      .then(r => r.text())
      .then(xml => {
        const parsed = window.GanttParser.parseMSProjectXML(xml);
        setData(parsed);
        setLoading(false);
      })
      .catch(err => {
        setErrorMsg('Error cargando cronograma · ' + err.message);
        setLoading(false);
      });
  }, [project.id, project.ganttFile]);

  return { data, loading, errorMsg };
}

// ───── Detecta nivel raíz real (skip wrappers L0/L1 con 1 sola task) ─────
function detectBaseLevel(tasks) {
  // Cuenta tareas por nivel
  const counts = {};
  tasks.forEach(t => { counts[t.outlineLevel] = (counts[t.outlineLevel] || 0) + 1; });
  // Buscar primer nivel con ≥ 2 tareas · ese es el nivel "capítulo real"
  const sortedLevels = Object.keys(counts).map(Number).sort((a, b) => a - b);
  for (const lvl of sortedLevels) {
    if (counts[lvl] >= 2) return lvl;
  }
  return 1;
}

// ───── Extrae TODAS las partidas desde tasks del MS Project XML ─────
function extractPartidasFromTasks(tasks, totalBudget) {
  if (!tasks || tasks.length === 0) return [];
  const baseLevel = detectBaseLevel(tasks);
  const outline = tasks.filter(t => t.outlineLevel >= baseLevel && t.name);

  return outline.map((t, idx) => {
    const relLevel = t.outlineLevel - baseLevel + 1;
    const code = t.outlineNumber || String(idx + 1);
    const parentCode = relLevel > 1 ? code.split('.').slice(0, -1).join('.') : null;
    const durationDays = Math.round((t.durationHours || 0) / 8);
    // MS Project XML stores Cost × 100 (centavos para decimales)
    const budget = (t.cost || 0) / 100;
    const real = (t.actualCost || 0) / 100;
    return {
      id: code,
      level: relLevel,
      code,
      name: t.name || '',
      unit: '',
      qty: null,
      unitPrice: null,
      budget,
      real,
      parent: parentCode,
      ai: null,
      durationDays,
      isSummary: !!t.summary,
      startDate: t.start || t.startDate || null,
      finishDate: t.finish || t.finishDate || null,
    };
  });
}

// ───── Hook: avances de partidas (localStorage por proyecto, con histórico) ─────
function useAvanceData(projectId) {
  const key = `erp.partidas-avance.${projectId}`;
  const [avances, setAvances] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  });
  const persist = (next) => {
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    setAvances(next);
  };
  const updateAvance = (code, payload) => {
    const prev = avances[code] || { avancePct: 0, realCost: 0, history: [] };
    const entry = {
      avancePct: payload.avancePct,
      realCost: payload.realCost,
      history: [
        ...(prev.history || []),
        { ts: new Date().toISOString(), avancePct: payload.avancePct, realCost: payload.realCost, nota: payload.nota || '' }
      ],
    };
    persist({ ...avances, [code]: entry });
  };
  const resetAvance = (code) => {
    const next = { ...avances }; delete next[code]; persist(next);
  };
  return { avances, updateAvance, resetAvance };
}

// ───── Roll-up · capítulos = promedio ponderado por budget ─────
function computeAvanceRollup(partidas, avances) {
  const childMap = {};
  for (const p of partidas) {
    if (p.parent) (childMap[p.parent] ||= []).push(p.code);
  }
  const byCode = {}; partidas.forEach(p => { byCode[p.code] = p; });
  const cache = {};
  const compute = (code) => {
    if (cache[code]) return cache[code];
    const partida = byCode[code]; if (!partida) return { avancePct: 0, realCost: 0, budget: 0 };
    const kids = childMap[code];
    if (!kids || kids.length === 0) {
      const a = avances[code] || {};
      cache[code] = { avancePct: a.avancePct || 0, realCost: a.realCost || 0, budget: partida.budget || 0, isLeaf: true };
      return cache[code];
    }
    let totalBudget = 0, weightedPct = 0, totalReal = 0;
    for (const kc of kids) {
      const k = compute(kc);
      totalBudget += k.budget; weightedPct += k.avancePct * k.budget; totalReal += k.realCost;
    }
    const pct = totalBudget > 0 ? weightedPct / totalBudget : 0;
    cache[code] = { avancePct: pct, realCost: totalReal, budget: totalBudget, isLeaf: false };
    return cache[code];
  };
  partidas.forEach(p => compute(p.code));
  return cache;
}

// ───── Modal · editar avance partida (% físico + costo real, sincronizables) ─────
function EditAvanceModal({ partida, current, onSave, onClose, onReset }) {
  const [pct, setPct] = React.useState(current?.avancePct ?? 0);
  const [real, setReal] = React.useState(current?.realCost ?? 0);
  const [nota, setNota] = React.useState('');
  const [sync, setSync] = React.useState(true);
  const budget = partida.budget || 0;

  const onPctChange = (v) => {
    const c = Math.max(0, Math.min(100, parseFloat(v) || 0));
    setPct(c); if (sync) setReal(+(budget * c / 100).toFixed(2));
  };
  const onRealChange = (v) => {
    const n = Math.max(0, parseFloat(v) || 0);
    setReal(n); if (sync && budget > 0) setPct(+(n / budget * 100).toFixed(2));
  };
  const submit = (e) => { e.preventDefault(); onSave({ avancePct: +pct, realCost: +real, nota }); onClose(); };
  const saldo = budget - real;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="card" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div className="card-h" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-xs muted mono" style={{ marginBottom: 2 }}>{partida.code} · L{partida.level}</div>
            <h3 style={{ margin: 0 }}>Editar avance</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>{partida.name}</div>
          </div>
          <button type="button" className="tb-icon-btn" onClick={onClose} title="Cerrar">×</button>
        </div>
        <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-sunken)' }}>
              <div className="text-xs muted">Presupuesto</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{fmtPEN(budget)}</div>
            </div>
            <div style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-sunken)' }}>
              <div className="text-xs muted">Real ejecutado</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: 'var(--accent)' }}>{fmtPEN(real)}</div>
            </div>
            <div style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-sunken)' }}>
              <div className="text-xs muted">Saldo</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: saldo < 0 ? 'var(--danger)' : 'var(--ink)' }}>{fmtPEN(saldo)}</div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-2)' }}>
            <input type="checkbox" checked={sync} onChange={e => setSync(e.target.checked)} />
            Sincronizar % con costo (real = presupuesto × %)
          </label>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>% Avance físico</label>
            <input type="number" min="0" max="100" step="0.5" value={pct} onChange={e => onPctChange(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: '10px 12px', fontSize: 16, fontFamily: 'var(--mono)', fontWeight: 600, border: '1px solid var(--line)', borderRadius: 6, outline: 'none' }} />
            <div className="pbar" style={{ height: 6, marginTop: 8 }}><span style={{ width: pct + '%', background: 'var(--accent)', height: '100%', display: 'block', borderRadius: 3 }} /></div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Costo real ejecutado (S/)</label>
            <input type="number" min="0" step="0.01" value={real} onChange={e => onRealChange(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: '10px 12px', fontSize: 16, fontFamily: 'var(--mono)', fontWeight: 600, border: '1px solid var(--line)', borderRadius: 6, outline: 'none' }} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nota / observación (opcional)</label>
            <input type="text" value={nota} onChange={e => setNota(e.target.value)} placeholder="Ej. Vaciado losa nivel 2 completado"
              style={{ width: '100%', marginTop: 4, padding: '8px 12px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 6, outline: 'none' }} />
          </div>

          {current?.history?.length > 0 && (
            <div>
              <div className="hstack between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Histórico ({current.history.length})</span>
                {onReset && <button type="button" className="tb-btn" onClick={() => { if (confirm('¿Eliminar todo el histórico de esta partida?')) { onReset(); onClose(); } }} style={{ fontSize: 10, color: 'var(--danger)' }}>Limpiar</button>}
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 6 }}>
                {current.history.slice().reverse().map((h, i) => (
                  <div key={i} style={{ padding: '6px 10px', borderBottom: i < current.history.length - 1 ? '1px solid var(--line)' : 'none', fontSize: 11, display: 'grid', gridTemplateColumns: '90px 60px 110px 1fr', gap: 8, alignItems: 'center' }}>
                    <span className="mono text-xs muted">{new Date(h.ts).toLocaleDateString('es-PE')}</span>
                    <span className="mono" style={{ textAlign: 'right' }}>{(h.avancePct || 0).toFixed(1)}%</span>
                    <span className="mono" style={{ textAlign: 'right', color: 'var(--accent)' }}>{fmtPEN(h.realCost || 0)}</span>
                    <span style={{ fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={h.nota}>{h.nota || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button" className="tb-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="tb-btn primary">Guardar medición</button>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VALORIZACIONES · hook + modal generar + print view
// ═══════════════════════════════════════════════════════════════

// ───── Hook · valorizaciones emitidas por proyecto ─────
function useValorizacionesData(projectId) {
  const key = `erp.valorizaciones.${projectId}`;
  const [list, setList] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });
  const persist = (next) => {
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    setList(next);
  };
  const addValorizacion = (val) => {
    const next = [...list, val];
    persist(next);
    return val;
  };
  const removeValorizacion = (numero) => {
    persist(list.filter(v => v.numero !== numero));
  };
  return { valorizaciones: list, addValorizacion, removeValorizacion };
}

// ───── Calcula filas de valorización (capítulos + subcapítulos, montos S/ por período) ─────
function buildValorizacionRows(partidas, avances, fechaDesde, fechaHasta) {
  // Para cada partida hoja: calcular S/ ejecutado en período según histórico
  // Acumulado anterior = sum realCost de history con ts < fechaDesde
  // Actual = sum diff entre last entry ≤ fechaHasta y last entry < fechaDesde
  const desde = new Date(fechaDesde + 'T00:00:00');
  const hasta = new Date(fechaHasta + 'T23:59:59');

  const leafSet = new Set();
  const parents = new Set(partidas.map(x => x.parent).filter(Boolean));
  partidas.forEach(p => { if (!parents.has(p.code)) leafSet.add(p.code); });

  // Real ejecutado por leaf en cada momento
  const leafSnapshot = (code) => {
    const h = (avances[code]?.history) || [];
    let prev = 0; // S/ acumulado al inicio del período
    let curr = 0; // S/ acumulado al final del período
    for (const entry of h) {
      const t = new Date(entry.ts);
      if (t < desde) prev = entry.realCost || 0;
      if (t <= hasta) curr = entry.realCost || 0;
    }
    return { prev, curr, periodo: Math.max(0, curr - prev) };
  };

  // Roll-up por capítulo (level 1) y subcapítulo (level 2)
  const childrenLeaves = (code) => {
    const result = [];
    const visit = (c) => {
      const kids = partidas.filter(p => p.parent === c);
      if (kids.length === 0) {
        if (leafSet.has(c)) result.push(c);
      } else {
        kids.forEach(k => visit(k.code));
      }
    };
    visit(code);
    return result;
  };

  const aggregate = (code) => {
    const leaves = childrenLeaves(code);
    let prev = 0, curr = 0, periodo = 0, budget = 0;
    leaves.forEach(c => {
      const s = leafSnapshot(c);
      prev += s.prev; curr += s.curr; periodo += s.periodo;
      const part = partidas.find(p => p.code === c);
      budget += part?.budget || 0;
    });
    return { prev, curr, periodo, budget };
  };

  // Filas: todos los niveles, ordenados jerárquicamente (capítulo → sub → sub-sub → hoja)
  const rows = [];
  const visit = (code) => {
    const part = partidas.find(p => p.code === code);
    if (!part) return;
    const isLeaf = leafSet.has(code);
    const agg = isLeaf ? leafSnapshot(code) : aggregate(code);
    const budget = part.budget || (isLeaf ? 0 : agg.budget);
    rows.push({
      kind: part.level === 1 ? 'capitulo' : (isLeaf ? 'hoja' : 'subpartida'),
      level: part.level,
      code: part.code,
      name: part.name,
      isLeaf,
      budget,
      prev: agg.prev || 0,
      curr: agg.curr || 0,
      periodo: agg.periodo || 0,
    });
    // recurse hijos en orden
    const kids = partidas.filter(x => x.parent === code).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    kids.forEach(k => visit(k.code));
  };
  const lvl1 = partidas.filter(p => p.level === 1).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  lvl1.forEach(c => visit(c.code));

  // Totales (suma solo capítulos · evita doble conteo)
  const totalCD = lvl1.reduce((s, c) => {
    const a = aggregate(c.code);
    return { budget: s.budget + a.budget, prev: s.prev + a.prev, curr: s.curr + a.curr, periodo: s.periodo + a.periodo };
  }, { budget: 0, prev: 0, curr: 0, periodo: 0 });

  return { rows, totalCD };
}

// ───── Modal · generar nueva valorización ─────
function GenerarValorizacionModal({ project, partidas, avances, valorizaciones, onGenerate, onClose }) {
  const proximoNumero = valorizaciones.length + 1;
  const ultima = valorizaciones[valorizaciones.length - 1];
  const defaultDesde = ultima ? ultima.fechaHasta : (project.startDate || '2026-04-01');
  const today = new Date().toISOString().slice(0, 10);

  const [numero, setNumero] = React.useState(proximoNumero);
  const [fechaDesde, setFechaDesde] = React.useState(defaultDesde);
  const [fechaHasta, setFechaHasta] = React.useState(today);
  const [observaciones, setObservaciones] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    const { rows, totalCD } = buildValorizacionRows(partidas, avances, fechaDesde, fechaHasta);
    const igv = totalCD.periodo * 0.18;
    const totalGeneral = totalCD.periodo + igv;
    const snapshot = {
      numero,
      fechaDesde,
      fechaHasta,
      generadaEn: new Date().toISOString(),
      observaciones,
      project: { id: project.id, name: project.name, client: project.client, location: project.location },
      rows,
      totales: { ...totalCD, igv, totalGeneral },
    };
    onGenerate(snapshot);
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="card" style={{ width: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div className="card-h">
          <div>
            <h3 style={{ margin: 0 }}>Generar valorización</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>{project.name}</div>
          </div>
          <button type="button" className="tb-icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>N° de valorización</label>
            <input type="number" min="1" value={numero} onChange={e => setNumero(parseInt(e.target.value) || 1)}
              style={{ width: '100%', marginTop: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 700, border: '1px solid var(--line)', borderRadius: 6, outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Desde</label>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--mono)', border: '1px solid var(--line)', borderRadius: 6, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--mono)', border: '1px solid var(--line)', borderRadius: 6, outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Observaciones (opcional)</label>
            <input type="text" value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Ej. Valorización quincenal mayo"
              style={{ width: '100%', marginTop: 4, padding: '8px 12px', fontSize: 12, border: '1px solid var(--line)', borderRadius: 6, outline: 'none' }} />
          </div>
          <div style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            {Icon.info({ size: 12 })} Se calculará automáticamente el avance del período <strong>{fechaDesde}</strong> → <strong>{fechaHasta}</strong> a partir del histórico de mediciones registradas en partidas.
          </div>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button" className="tb-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="tb-btn primary">Generar e imprimir</button>
        </div>
      </form>
    </div>
  );
}

// ───── Vista imprimible · layout idéntico al PDF de referencia ─────
function ValorizacionPrintView({ valorizacion, onClose }) {
  const v = valorizacion;
  const fmtMoney = (n) => (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPctVal = (parcial, periodo) => parcial > 0 ? ((periodo / parcial) * 100).toFixed(2) + '%' : '0.00%';
  const fechaFmt = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getFullYear()).slice(-2);
  };

  const printDoc = () => window.print();

  // Acumulado anterior totales
  const accAnt = v.rows.filter(r => r.kind === 'capitulo').reduce((s, r) => s + r.prev, 0);
  const accAct = v.rows.filter(r => r.kind === 'capitulo').reduce((s, r) => s + r.curr, 0);
  const periodo = v.totales.periodo;
  const totalCD = v.totales.budget;
  const igvAnt = accAnt * 0.18;
  const igvAct = periodo * 0.18;
  const igvAccAct = accAct * 0.18;
  const saldo = totalCD - accAct;
  const igvSaldo = saldo * 0.18;
  const totalGen = totalCD + totalCD * 0.18;
  const totalGenAnt = accAnt + igvAnt;
  const totalGenAct = periodo + igvAct;
  const totalGenAccAct = accAct + igvAccAct;
  const totalGenSaldo = saldo + igvSaldo;
  const pctAvanceAnt = totalCD > 0 ? (accAnt / totalCD * 100).toFixed(2) : '0.00';
  const pctAvanceAct = totalCD > 0 ? (periodo / totalCD * 100).toFixed(2) : '0.00';
  const pctAvanceAccAct = totalCD > 0 ? (accAct / totalCD * 100).toFixed(2) : '0.00';
  const pctSaldo = totalCD > 0 ? (saldo / totalCD * 100).toFixed(2) : '0.00';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, overflow: 'auto', padding: 20 }} className="val-print-modal">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .val-print-modal, .val-print-modal * { visibility: visible !important; }
          .val-print-modal { position: absolute !important; inset: 0 !important; background: white !important; padding: 0 !important; }
          .val-print-toolbar { display: none !important; }
          .val-print-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
        .val-print-page { background: white; color: #000; font-family: Arial, sans-serif; font-size: 9px; padding: 18mm 14mm; max-width: 1200px; margin: 0 auto 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
        .val-tbl { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .val-tbl th, .val-tbl td { border: 1px solid #000; padding: 3px 5px; font-size: 8.5px; }
        .val-tbl thead th { background: #f0f0f0; text-align: center; font-weight: 700; }
        .val-tbl .num { text-align: right; font-family: Arial, sans-serif; }
        .val-tbl .ctr { text-align: center; }
        .val-row-cap td { font-weight: 700; background: #fafafa; }
        .val-row-tot td { font-weight: 700; background: #f0f0f0; }
      `}</style>
      <div className="val-print-toolbar" onClick={e => e.stopPropagation()} style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 8, background: 'rgba(0,0,0,0.85)', borderRadius: 6, marginBottom: 12 }}>
        <button className="tb-btn primary" onClick={printDoc}>{Icon.download ? Icon.download({ size: 13 }) : '⬇'} Imprimir / Guardar PDF</button>
        <button className="tb-btn" onClick={onClose}>Cerrar</button>
      </div>
      <div onClick={e => e.stopPropagation()} className="val-print-page">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>VALORIZACIÓN N°{v.numero}</div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{fechaFmt(v.fechaDesde)} - {fechaFmt(v.fechaHasta)}</div>
          </div>
          <img src="assets/logo.png" alt="MM HIGH METRIK" style={{ width: 110, height: 'auto', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        <table style={{ marginBottom: 6, fontSize: 9 }}>
          <tbody>
            <tr><td style={{ fontWeight: 700, paddingRight: 10, width: 90 }}>SERVICIO:</td><td>"{v.project.name}"</td></tr>
            <tr><td style={{ fontWeight: 700, paddingRight: 10 }}>FECHA :</td><td>{fechaFmt(v.fechaDesde)} - {fechaFmt(v.fechaHasta)}</td></tr>
            <tr><td style={{ fontWeight: 700, paddingRight: 10 }}>UBICACIÓN:</td><td>{v.project.location || '—'}</td></tr>
            <tr><td style={{ fontWeight: 700, paddingRight: 10 }}>CONTRATISTA:</td><td>MM HIGH METRIK ENGINEERS</td></tr>
          </tbody>
        </table>

        <table className="val-tbl">
          <thead>
            <tr>
              <th rowSpan="2" style={{ width: 50 }}>Item</th>
              <th rowSpan="2">DESCRIPCIÓN</th>
              <th rowSpan="2" style={{ width: 60 }}>Parcial S/.</th>
              <th colSpan="1">Acumulado Anterior</th>
              <th colSpan="1">Actual</th>
              <th colSpan="1">Acumulado Actual</th>
              <th colSpan="1">Saldo del Servicio</th>
              <th rowSpan="2" style={{ width: 50 }}>% Avance</th>
            </tr>
            <tr>
              <th>S/.</th>
              <th>S/.</th>
              <th>S/.</th>
              <th>S/.</th>
            </tr>
          </thead>
          <tbody>
            {v.rows.map(r => {
              const saldoRow = r.budget - r.curr;
              const pctRow = r.budget > 0 ? ((r.curr / r.budget) * 100).toFixed(2) + '%' : '0.00%';
              const lvl = r.level || 1;
              const indentPx = (lvl - 1) * 10;
              const isCap = r.kind === 'capitulo';
              const fontWeight = isCap ? 700 : (lvl === 2 ? 600 : 400);
              const bg = isCap ? '#fafafa' : (lvl === 2 ? '#fcfcfc' : 'transparent');
              return (
                <tr key={r.code} style={{ background: bg }}>
                  <td className="ctr" style={{ paddingLeft: 5 + indentPx, fontFamily: 'Arial', fontSize: 8, fontWeight: lvl <= 2 ? 700 : 500 }}>{r.code}</td>
                  <td style={{ textTransform: isCap ? 'uppercase' : 'none', fontWeight, paddingLeft: 5 + indentPx, fontSize: lvl <= 2 ? 8.5 : 8 }}>{r.name}</td>
                  <td className="num" style={{ fontWeight }}>{fmtMoney(r.budget)}</td>
                  <td className="num">{r.prev > 0 ? fmtMoney(r.prev) : ''}</td>
                  <td className="num">{r.periodo > 0 ? fmtMoney(r.periodo) : ''}</td>
                  <td className="num">{r.curr > 0 ? fmtMoney(r.curr) : ''}</td>
                  <td className="num">{fmtMoney(saldoRow)}</td>
                  <td className="num">{pctRow}</td>
                </tr>
              );
            })}
            <tr className="val-row-tot">
              <td colSpan="2">TOTAL COSTO DIRECTO S/.</td>
              <td className="num">{fmtMoney(totalCD)}</td>
              <td className="num">{pctAvanceAnt}% &nbsp; {fmtMoney(accAnt)}</td>
              <td className="num">{pctAvanceAct}% &nbsp; {fmtMoney(periodo)}</td>
              <td className="num">{pctAvanceAccAct}% &nbsp; {fmtMoney(accAct)}</td>
              <td className="num">{pctSaldo}% &nbsp; {fmtMoney(saldo)}</td>
              <td className="num">{pctAvanceAccAct}%</td>
            </tr>
            <tr className="val-row-tot">
              <td>I.G.V.</td>
              <td className="ctr">18%</td>
              <td className="num">{fmtMoney(totalCD * 0.18)}</td>
              <td className="num">{fmtMoney(igvAnt)}</td>
              <td className="num">{fmtMoney(igvAct)}</td>
              <td className="num">{fmtMoney(igvAccAct)}</td>
              <td className="num">{fmtMoney(igvSaldo)}</td>
              <td></td>
            </tr>
            <tr className="val-row-tot">
              <td colSpan="2">TOTAL GENERAL:</td>
              <td className="num">{fmtMoney(totalGen)}</td>
              <td className="num">{fmtMoney(totalGenAnt)}</td>
              <td className="num">{pctAvanceAct}% &nbsp; {fmtMoney(totalGenAct)}</td>
              <td className="num">{pctAvanceAccAct}% &nbsp; {fmtMoney(totalGenAccAct)}</td>
              <td className="num">{pctSaldo}% &nbsp; {fmtMoney(totalGenSaldo)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {v.observaciones && (
          <div style={{ marginTop: 14, fontSize: 9 }}>
            <strong>Observaciones:</strong> {v.observaciones}
          </div>
        )}

        {/* Firma */}
        <div style={{ marginTop: 80, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 280, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FIRMA</div>
            <div style={{ marginTop: 4, fontSize: 8, color: '#888' }}>(MM HIGH METRIK ENGINEERS S.A.C.)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───── Tab Valorizaciones · histórico + reimprimir ─────
function ValorizacionesTab({ valorizaciones, onView, onDelete, onNew }) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Valorizaciones emitidas</h3>
          <div className="text-xs muted" style={{ marginTop: 2 }}>{valorizaciones.length} valorización{valorizaciones.length === 1 ? '' : 'es'} registrada{valorizaciones.length === 1 ? '' : 's'}</div>
        </div>
        <button className="tb-btn primary" onClick={onNew}>{Icon.plus ? Icon.plus({ size: 12 }) : '+'} Nueva valorización</button>
      </div>
      <div className="card-b" style={{ padding: 0 }}>
        {valorizaciones.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Aún no hay valorizaciones</div>
            <div className="text-xs muted">Click en "Nueva valorización" para generar la primera</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ background: 'var(--bg-sunken)' }}>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>N°</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Período</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Monto período</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>+ IGV</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>% Avance</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Generada</th>
                <th style={{ padding: '8px 12px', width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {valorizaciones.slice().reverse().map(v => {
                const pct = v.totales.budget > 0 ? ((v.totales.periodo / v.totales.budget) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={v.numero} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontWeight: 700 }}>V{String(v.numero).padStart(2, '0')}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 10 }}>{v.fechaDesde} → {v.fechaHasta}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmtPEN(v.totales.periodo)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>{fmtPEN(v.totales.totalGeneral)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 600 }}>{pct}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{new Date(v.generadaEn).toLocaleString('es-PE')}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        <button className="tb-btn" onClick={() => onView(v)} style={{ fontSize: 10 }}>Ver / Imprimir</button>
                        <button className="tb-btn" onClick={() => { if (confirm(`¿Eliminar Valorización N°${v.numero}?`)) onDelete(v.numero); }} style={{ fontSize: 10, color: 'var(--danger)' }}>{Icon.trash ? Icon.trash({ size: 11 }) : '×'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PERSONAL DE OBRA · Mano de Obra (CAPECO Construcción Civil)
// ═══════════════════════════════════════════════════════════════

const JORNALES_CAPECO = { Capataz: 95, Operario: 89, Oficial: 71, Peón: 63 };
const ESPECIALIDADES = ['Albañilería', 'Fierrería', 'Encofrado', 'Carpintería', 'Gasfitería', 'Electricidad', 'Soldadura', 'Pintura', 'Acabados', 'General'];

// ───── Seed demo · 25 trabajadores realistas Lurín ─────
function generateTrabajadoresDemo(projectId) {
  if (projectId !== 'OB-2026-009') return [];
  const data = [
    { dni: '70123456', fechaNacimiento: '15/06/1972', nombres: 'Mario Alberto',  apellidos: 'Quispe Mamani',         categoria: 'Capataz',  especialidad: 'General',      jornal: 95, ingreso: '2026-03-20', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '987654321' },
    { dni: '45678123', fechaNacimiento: '08/03/1985', nombres: 'Juan Carlos',    apellidos: 'Vargas Ríos',           categoria: 'Operario', especialidad: 'Albañilería', jornal: 89, ingreso: '2026-03-22', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '976543210' },
    { dni: '46123789', fechaNacimiento: '22/11/1980', nombres: 'Pedro Antonio',  apellidos: 'Huamaní Sánchez',       categoria: 'Operario', especialidad: 'Albañilería', jornal: 89, ingreso: '2026-03-22', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '965432109' },
    { dni: '47891234', fechaNacimiento: '05/07/1978', nombres: 'Luis Fernando',  apellidos: 'Mendoza Cárdenas',      categoria: 'Operario', especialidad: 'Fierrería',    jornal: 89, ingreso: '2026-03-23', estado: 'Activo',     sctrVigencia: '2026-11-30', regimen: 'Eventual por obra', telefono: '954321098' },
    { dni: '48912345', fechaNacimiento: '14/02/1983', nombres: 'José Antonio',   apellidos: 'Quispe Tito',           categoria: 'Operario', especialidad: 'Fierrería',    jornal: 89, ingreso: '2026-03-23', estado: 'Activo',     sctrVigencia: '2026-12-15', regimen: 'Eventual por obra', telefono: '943210987' },
    { dni: '49123456', fechaNacimiento: '30/09/1976', nombres: 'Roberto Eulogio', apellidos: 'Ccama Apaza',          categoria: 'Operario', especialidad: 'Encofrado',   jornal: 89, ingreso: '2026-03-25', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '932109876' },
    { dni: '40234567', fechaNacimiento: '11/05/1981', nombres: 'Walter Hugo',    apellidos: 'Huanca Mamani',         categoria: 'Operario', especialidad: 'Gasfitería',  jornal: 89, ingreso: '2026-04-05', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '921098765' },
    { dni: '41345678', fechaNacimiento: '18/12/1974', nombres: 'Carlos Alberto', apellidos: 'Espinoza Yauri',        categoria: 'Operario', especialidad: 'Electricidad',jornal: 89, ingreso: '2026-04-05', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Planilla',          telefono: '910987654' },
    { dni: '42456789', fechaNacimiento: '03/04/1987', nombres: 'Andrés Felipe',  apellidos: 'Choque Vilca',          categoria: 'Operario', especialidad: 'Carpintería', jornal: 89, ingreso: '2026-03-28', estado: 'Permiso',    sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '909876543' },
    { dni: '43567890', fechaNacimiento: '27/08/1989', nombres: 'Ramón Eusebio',  apellidos: 'Chávez Rivas',          categoria: 'Oficial',  especialidad: 'Albañilería', jornal: 71, ingreso: '2026-03-22', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '908765432' },
    { dni: '44678901', fechaNacimiento: '12/01/1991', nombres: 'Daniel Esteban', apellidos: 'Quispe Mamani',         categoria: 'Oficial',  especialidad: 'Albañilería', jornal: 71, ingreso: '2026-03-25', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '907654321' },
    { dni: '45789012', fechaNacimiento: '06/06/1988', nombres: 'Edwin Gregorio', apellidos: 'Apaza Quispe',          categoria: 'Oficial',  especialidad: 'Fierrería',    jornal: 71, ingreso: '2026-03-23', estado: 'Activo',     sctrVigencia: '2026-05-15', regimen: 'Eventual por obra', telefono: '906543210' },
    { dni: '46890123', fechaNacimiento: '19/10/1992', nombres: 'Marcos Cipriano', apellidos: 'Huamán Pari',          categoria: 'Oficial',  especialidad: 'Fierrería',    jornal: 71, ingreso: '2026-04-02', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '905432109' },
    { dni: '47901234', fechaNacimiento: '24/03/1990', nombres: 'Víctor Manuel',  apellidos: 'Cruz Aguilar',          categoria: 'Oficial',  especialidad: 'Encofrado',   jornal: 71, ingreso: '2026-03-25', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '904321098' },
    { dni: '48012345', fechaNacimiento: '07/07/1986', nombres: 'Felipe Santiago', apellidos: 'Yapuchura Maldonado',  categoria: 'Oficial',  especialidad: 'Electricidad',jornal: 71, ingreso: '2026-04-05', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '903210987' },
    { dni: '49123450', fechaNacimiento: '20/11/1995', nombres: 'José Miguel',    apellidos: 'Pérez Castro',          categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-03-22', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '902109876' },
    { dni: '40234561', fechaNacimiento: '13/05/1993', nombres: 'Luis Alberto',   apellidos: 'Sánchez Mamani',        categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-03-22', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '901098765' },
    { dni: '41345672', fechaNacimiento: '28/02/1997', nombres: 'Manuel Jesús',   apellidos: 'Vargas Cusi',           categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-03-25', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '900987654' },
    { dni: '42456783', fechaNacimiento: '01/09/1994', nombres: 'Carlos Eduardo', apellidos: 'Quispe Sánchez',        categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-03-25', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '989876543' },
    { dni: '43567894', fechaNacimiento: '17/06/1996', nombres: 'Pedro Pablo',    apellidos: 'Mamani Quispe',         categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-03-28', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '978765432' },
    { dni: '44678905', fechaNacimiento: '09/12/1992', nombres: 'Antonio Rafael', apellidos: 'Cruz Aguilar',          categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-03-28', estado: 'Vacaciones', sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '967654321' },
    { dni: '45789016', fechaNacimiento: '04/04/1998', nombres: 'Rubén Darío',    apellidos: 'Castillo Huanca',       categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-04-02', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '956543210' },
    { dni: '46890127', fechaNacimiento: '23/10/1991', nombres: 'Eduardo Cipriano', apellidos: 'Cárdenas Vilca',     categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-04-02', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '945432109' },
    { dni: '47901238', fechaNacimiento: '15/01/2000', nombres: 'Sergio Andrés',  apellidos: 'Maldonado Choque',      categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-04-08', estado: 'Activo',     sctrVigencia: '2026-12-31', regimen: 'Eventual por obra', telefono: '934321098' },
    { dni: '48012349', fechaNacimiento: '02/08/1999', nombres: 'Wilfredo Gabriel', apellidos: 'Aguilar Yapuchura',  categoria: 'Peón',     especialidad: 'General',      jornal: 63, ingreso: '2026-04-08', estado: 'Cesado',     sctrVigencia: '2026-04-30', regimen: 'Eventual por obra', telefono: '923210987' },
  ];
  return data.map((t, i) => ({ ...t, id: 'T' + String(i + 1).padStart(3, '0') }));
}

// ───── Hook · trabajadores con seed + CRUD ─────
function useTrabajadoresData(projectId) {
  const key = `erp.trabajadores.${projectId}`;
  const [trabajadores, setTrabajadores] = React.useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Auto-migración · si todos los registros carecen de fechaNacimiento, re-sembrar
        if (parsed.length > 0 && !parsed.some(t => t.fechaNacimiento)) {
          const seed = generateTrabajadoresDemo(projectId);
          if (seed.length > 0) {
            localStorage.setItem(key, JSON.stringify(seed));
            return seed;
          }
        }
        return parsed;
      }
      const seed = generateTrabajadoresDemo(projectId);
      if (seed.length > 0) localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    } catch { return []; }
  });
  const persist = (next) => { try { localStorage.setItem(key, JSON.stringify(next)); } catch {} setTrabajadores(next); };
  const addTrabajador = (t) => persist([...trabajadores, { ...t, id: 'T' + Date.now() }]);
  const updateTrabajador = (id, patch) => persist(trabajadores.map(x => x.id === id ? { ...x, ...patch } : x));
  const removeTrabajador = (id) => persist(trabajadores.filter(x => x.id !== id));
  const resetSeed = () => { try { localStorage.removeItem(key); } catch {} setTrabajadores(generateTrabajadoresDemo(projectId)); };
  return { trabajadores, addTrabajador, updateTrabajador, removeTrabajador, resetSeed };
}

// ───── Modal · alta/edición trabajador ─────
function EditTrabajadorModal({ trabajador, onSave, onClose, onDelete }) {
  const isNew = !trabajador.id;
  const [form, setForm] = React.useState(() => ({
    dni: '', nombres: '', apellidos: '', fechaNacimiento: '',
    categoria: 'Operario', especialidad: 'Albañilería',
    jornal: JORNALES_CAPECO['Operario'],
    ingreso: new Date().toISOString().slice(0, 10),
    estado: 'Activo',
    sctrVigencia: '',
    regimen: 'Eventual por obra',
    telefono: '',
    ...trabajador,
  }));
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setCategoria = (cat) => setForm(prev => ({ ...prev, categoria: cat, jornal: JORNALES_CAPECO[cat] || prev.jornal }));
  const submit = (e) => { e.preventDefault(); onSave(form); onClose(); };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="card" style={{ width: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div className="card-h">
          <div>
            <h3 style={{ margin: 0 }}>{isNew ? 'Nuevo trabajador' : 'Editar trabajador'}</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>{isNew ? 'Mano de obra · CAPECO Construcción Civil' : `${form.nombres} ${form.apellidos}`}</div>
          </div>
          <button type="button" className="tb-icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
            <Field label="DNI" required><input type="text" maxLength="8" value={form.dni} onChange={e => set('dni', e.target.value.replace(/\D/g, ''))} required style={inputStyle} /></Field>
            <Field label="Teléfono"><input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} style={inputStyle} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Nombres" required><input type="text" value={form.nombres} onChange={e => set('nombres', e.target.value)} required style={inputStyle} /></Field>
            <Field label="Apellidos" required><input type="text" value={form.apellidos} onChange={e => set('apellidos', e.target.value)} required style={inputStyle} /></Field>
          </div>
          <Field label="Fecha de nacimiento (DD/MM/AAAA)"><input type="text" placeholder="15/06/1985" value={form.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} style={inputStyle} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Field label="Categoría">
              <select value={form.categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
                {Object.keys(JORNALES_CAPECO).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Especialidad">
              <select value={form.especialidad} onChange={e => set('especialidad', e.target.value)} style={inputStyle}>
                {ESPECIALIDADES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Jornal S/">
              <input type="number" min="0" step="0.01" value={form.jornal} onChange={e => set('jornal', parseFloat(e.target.value) || 0)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Field label="Fecha ingreso"><input type="date" value={form.ingreso} onChange={e => set('ingreso', e.target.value)} style={inputStyle} /></Field>
            <Field label="Estado">
              <select value={form.estado} onChange={e => set('estado', e.target.value)} style={inputStyle}>
                {['Activo', 'Permiso', 'Vacaciones', 'Cesado'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="SCTR vence"><input type="date" value={form.sctrVigencia} onChange={e => set('sctrVigencia', e.target.value)} style={inputStyle} /></Field>
          </div>
          <Field label="Régimen">
            <select value={form.regimen} onChange={e => set('regimen', e.target.value)} style={inputStyle}>
              {['Eventual por obra', 'Planilla', 'Recibo por honorarios', 'Servicio terceros'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', gap: 6 }}>
          {!isNew && onDelete && <button type="button" className="tb-btn" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm(`¿Eliminar ${form.nombres} ${form.apellidos}?`)) { onDelete(); onClose(); } }}>Eliminar</button>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button type="button" className="tb-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="tb-btn primary">{isNew ? 'Agregar' : 'Guardar'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', border: '1px solid var(--line)', borderRadius: 6, outline: 'none', background: 'var(--bg-elev)' };
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 3 }}>
        {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// ───── Print view · LISTA DE PERSONAL (carta oficial peruana) ─────
function PersonalListPrintView({ trabajadores, project, onClose }) {
  const printDoc = () => window.print();
  const cargoLabel = (t) => {
    if (t.categoria === 'Capataz') return 'MAESTRO ENCARGADO';
    return t.categoria.toUpperCase();
  };
  const today = new Date();
  const fechaHoy = String(today.getDate()).padStart(2, '0') + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + today.getFullYear();

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, overflow: 'auto', padding: 20 }} className="personal-print-modal">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .personal-print-modal, .personal-print-modal * { visibility: visible !important; }
          .personal-print-modal { position: absolute !important; inset: 0 !important; background: white !important; padding: 0 !important; }
          .personal-print-toolbar { display: none !important; }
          .personal-print-page { box-shadow: none !important; margin: 0 !important; }
          .personal-tbl tr { page-break-inside: avoid; }
          .personal-tbl thead { display: table-header-group; }
          @page { size: A4 portrait; margin: 10mm; }
        }
        .personal-print-page { background: white; color: #000; font-family: 'Calibri', 'Arial', sans-serif; width: 190mm; min-height: 277mm; margin: 0 auto 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); padding: 8mm 10mm; box-sizing: border-box; display: flex; flex-direction: column; }
        .personal-tbl { width: 100%; border-collapse: collapse; margin-top: 6mm; }
        .personal-tbl th, .personal-tbl td { border: 1px solid #333; padding: 4px 6px; font-size: 9px; }
        .personal-tbl thead th { background: #2c2c2c; color: white; text-align: center; font-weight: 700; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.04em; padding: 6px; }
        .personal-tbl td { vertical-align: middle; }
        .personal-tbl tbody tr:nth-child(even) { background: #f9f9f9; }
        .doc-divider { border: none; border-top: 1.5px solid #2c2c2c; margin: 0; }
        .doc-divider-thin { border: none; border-top: 0.5px solid #999; margin: 0; }
      `}</style>
      <div className="personal-print-toolbar" onClick={e => e.stopPropagation()} style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 8, background: 'rgba(0,0,0,0.85)', borderRadius: 6, marginBottom: 12 }}>
        <button className="tb-btn primary" onClick={printDoc}>{Icon.download ? Icon.download({ size: 13 }) : '⬇'} Imprimir / Guardar PDF</button>
        <button className="tb-btn" onClick={onClose}>Cerrar</button>
      </div>

      <div onClick={e => e.stopPropagation()} className="personal-print-page">
        {/* Encabezado · tabla layout para print-safety */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm' }}>
          <tbody>
            <tr>
              <td style={{ width: '30mm', verticalAlign: 'top', padding: 0 }}>
                <img src="assets/logo.png" alt="MM HIGH METRIK" style={{ width: '28mm', height: 'auto', maxWidth: '28mm', maxHeight: '20mm', objectFit: 'contain', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
              </td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', padding: 0 }}>
                <div style={{ fontSize: '11pt', fontWeight: 700, letterSpacing: '0.03em', color: '#1a1a1a', lineHeight: 1.2 }}>MM HIGH METRIK ENGINEERS S.A.C.</div>
                <div style={{ fontSize: '8.5pt', color: '#555', marginTop: 2 }}>RUC: 20610639764</div>
                <div style={{ fontSize: '8.5pt', color: '#555' }}>Construcción civil · Edificaciones</div>
                <div style={{ fontSize: '8pt', color: '#777', marginTop: 1 }}>Av. República de Colombia 625 Of. 501 · San Isidro, Lima</div>
              </td>
            </tr>
          </tbody>
        </table>

        <hr className="doc-divider" />

        {/* Título oficial */}
        <div style={{ textAlign: 'center', margin: '5mm 0 3mm' }}>
          <h1 style={{ fontSize: '13pt', fontWeight: 700, margin: 0, letterSpacing: '0.05em', color: '#1a1a1a' }}>LISTA DE PERSONAL</h1>
          <div style={{ fontSize: '8pt', color: '#888', marginTop: 2, fontStyle: 'italic' }}>Mano de obra · Construcción civil</div>
        </div>

        {/* Datos del documento · tabla layout */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '3mm', fontSize: '9pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '1mm 0', width: '50%' }}>
                <span style={{ fontWeight: 700, color: '#444' }}>Proyecto: </span>
                <span style={{ color: '#1a1a1a' }}>{project?.id || '—'}</span>
              </td>
              <td style={{ padding: '1mm 0', textAlign: 'right' }}>
                <span style={{ fontWeight: 700, color: '#444' }}>Fecha: </span>
                <span style={{ color: '#1a1a1a' }}>{fechaHoy}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: '1mm 0' }}>
                <span style={{ fontWeight: 700, color: '#444' }}>Obra: </span>
                <span style={{ color: '#1a1a1a' }}>{project?.name || '—'}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: '1mm 0' }}>
                <span style={{ fontWeight: 700, color: '#444' }}>Ubicación: </span>
                <span style={{ color: '#1a1a1a' }}>{project?.location || '—'}</span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '1mm 0' }}>
                <span style={{ fontWeight: 700, color: '#444' }}>Total trabajadores: </span>
                <span style={{ color: '#1a1a1a' }}>{trabajadores.length}</span>
              </td>
              <td style={{ padding: '1mm 0', textAlign: 'right' }}>
                <span style={{ fontWeight: 700, color: '#444' }}>Activos: </span>
                <span style={{ color: '#1a1a1a' }}>{trabajadores.filter(t => t.estado === 'Activo').length}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tabla */}
        <table className="personal-tbl">
          <thead>
            <tr>
              <th style={{ width: '7%' }}>N°</th>
              <th style={{ width: '24%' }}>Nombres</th>
              <th style={{ width: '26%' }}>Apellidos</th>
              <th style={{ width: '14%' }}>Fecha Nacimiento</th>
              <th style={{ width: '13%' }}>DNI</th>
              <th style={{ width: '16%' }}>Cargo</th>
            </tr>
          </thead>
          <tbody>
            {trabajadores.map((t, i) => (
              <tr key={t.id}>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                <td style={{ textTransform: 'uppercase' }}>{t.nombres}</td>
                <td style={{ textTransform: 'uppercase' }}>{t.apellidos}</td>
                <td style={{ textAlign: 'center' }}>{t.fechaNacimiento || '—'}</td>
                <td style={{ textAlign: 'center', fontFamily: 'Courier New, monospace' }}>{t.dni}</td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{cargoLabel(t)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Espaciador flexible empuja firma al fondo */}
        <div style={{ flex: 1, minHeight: '8mm' }} />

        {/* Bloque firma + contacto · tabla layout */}
        <hr className="doc-divider-thin" style={{ marginTop: '6mm' }} />
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8mm' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'center', padding: '14mm 0 0' }}>
                <div style={{ width: '70%', margin: '0 auto', borderTop: '1px solid #1a1a1a', paddingTop: 4, fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>FIRMA Y SELLO</div>
                <div style={{ fontSize: '8pt', color: '#777', marginTop: 2 }}>MM HIGH METRIK ENGINEERS S.A.C.</div>
              </td>
              <td style={{ width: '50%', verticalAlign: 'top', fontSize: '8pt', color: '#444', lineHeight: 1.6, padding: 0 }}>
                <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacto</div>
                <div>☎ (+51) 955 137 140</div>
                <div>✉ mmhighmetrik@gmail.com</div>
                <div>✉ mario.garcia@mmhighmetrik.com</div>
                <div>🌐 www.mmhighmetrik.com</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───── Panel principal · KPIs + filtros + tabla + descarga CSV ─────
function TrabajadoresPanel({ trabajadores, onAdd, onEdit, onDelete, onResetSeed, project }) {
  const [q, setQ] = React.useState('');
  const [fCat, setFCat] = React.useState('todos');
  const [fEstado, setFEstado] = React.useState('todos');
  const [showPrint, setShowPrint] = React.useState(false);

  const today = new Date('2026-05-05');
  const sctrStatus = (vigencia) => {
    if (!vigencia) return { state: 'sin', label: 'Sin SCTR', color: 'var(--danger)' };
    const v = new Date(vigencia);
    const days = Math.round((v - today) / 86400000);
    if (days < 0) return { state: 'vencido', label: 'Vencido', color: 'var(--danger)' };
    if (days <= 30) return { state: 'porvencer', label: `${days}d`, color: 'var(--warn-ink)' };
    return { state: 'vigente', label: 'Vigente', color: 'var(--ok)' };
  };

  const visible = trabajadores.filter(t => {
    if (fCat !== 'todos' && t.categoria !== fCat) return false;
    if (fEstado !== 'todos' && t.estado !== fEstado) return false;
    if (q) {
      const ql = q.toLowerCase();
      const blob = `${t.dni} ${t.nombres} ${t.apellidos} ${t.especialidad}`.toLowerCase();
      if (!blob.includes(ql)) return false;
    }
    return true;
  });

  const activos = trabajadores.filter(t => t.estado === 'Activo');
  const jornalDia = activos.reduce((s, t) => s + (t.jornal || 0), 0);
  const proyectadoMes = jornalDia * 26;
  const sctrVigentes = trabajadores.filter(t => sctrStatus(t.sctrVigencia).state === 'vigente').length;
  const pctSctr = trabajadores.length > 0 ? (sctrVigentes / trabajadores.length * 100) : 100;
  const sctrAlertas = trabajadores.filter(t => ['vencido', 'porvencer', 'sin'].includes(sctrStatus(t.sctrVigencia).state)).length;

  // Distribución por categoría
  const byCat = ['Capataz', 'Operario', 'Oficial', 'Peón'].map(c => ({ cat: c, count: trabajadores.filter(t => t.categoria === c).length }));

  const downloadCSV = () => {
    const headers = ['DNI', 'Nombres', 'Apellidos', 'Fecha Nacimiento', 'Categoría', 'Especialidad', 'Jornal S/', 'Fecha Ingreso', 'Estado', 'SCTR Vence', 'Régimen', 'Teléfono'];
    const rows = trabajadores.map(t => [t.dni, t.nombres, t.apellidos, t.fechaNacimiento || '', t.categoria, t.especialidad, t.jornal, t.ingreso, t.estado, t.sctrVigencia, t.regimen, t.telefono || '']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trabajadores_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="vstack" style={{ gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
        <KpiMini lbl="Trabajadores activos" val={activos.length} sub={`de ${trabajadores.length} totales`} color="var(--accent)" />
        <KpiMini lbl="Jornal/día" val={fmtPEN(jornalDia)} sub="Suma jornales activos" color="var(--ink)" />
        <KpiMini lbl="Proyectado mes" val={fmtPEN(proyectadoMes)} sub="× 26 días" color="var(--ink-2)" />
        <KpiMini lbl="SCTR vigente" val={pctSctr.toFixed(0) + '%'} sub={`${sctrVigentes}/${trabajadores.length} con SCTR`} color={pctSctr === 100 ? 'var(--ok)' : 'var(--warn-ink)'} progress={pctSctr} pColor={pctSctr === 100 ? 'var(--ok)' : 'var(--warn)'} />
        <KpiMini lbl="Alertas SCTR" val={sctrAlertas} sub={sctrAlertas === 0 ? 'Todo en regla' : 'Vencidos / por vencer'} color={sctrAlertas === 0 ? 'var(--ok)' : 'var(--danger)'} />
      </div>

      {/* Distribución chips */}
      <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
        {byCat.map(c => (
          <span key={c.cat} className="chip" style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', background: c.cat === 'Capataz' ? 'rgba(124,58,237,.1)' : c.cat === 'Operario' ? 'rgba(59,91,219,.1)' : c.cat === 'Oficial' ? 'rgba(245,159,0,.1)' : 'rgba(107,132,232,.1)' }}>
            <strong>{c.cat}:</strong> &nbsp;{c.count}
          </span>
        ))}
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-h" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3>Personal de obra</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>
              {visible.length} de {trabajadores.length} trabajadores · Mano de obra construcción civil
            </div>
          </div>
          <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', pointerEvents: 'none' }}>{Icon.search ? Icon.search({ size: 12 }) : '🔍'}</span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar DNI, nombre..." style={{ padding: '6px 10px 6px 26px', fontSize: 11, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', minWidth: 200, outline: 'none' }} />
            </div>
            <select value={fCat} onChange={e => setFCat(e.target.value)} style={{ padding: '6px 10px', fontSize: 11, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)' }}>
              <option value="todos">Todas categorías</option>
              {Object.keys(JORNALES_CAPECO).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={fEstado} onChange={e => setFEstado(e.target.value)} style={{ padding: '6px 10px', fontSize: 11, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)' }}>
              <option value="todos">Todos estados</option>
              {['Activo', 'Permiso', 'Vacaciones', 'Cesado'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="tb-btn" onClick={() => setShowPrint(true)} title="Generar lista de personal en PDF">{Icon.file ? Icon.file({ size: 12 }) : '📄'} Descargar lista</button>
            <button className="tb-btn" onClick={downloadCSV} title="Exportar como CSV (Excel)" style={{ fontSize: 10 }}>{Icon.download ? Icon.download({ size: 11 }) : '⬇'} CSV</button>
            <button className="tb-btn" onClick={() => alert('Registro de tareo · próximamente')} title="Registrar asistencia diaria">{Icon.check ? Icon.check({ size: 12 }) : '✓'} Tareo diario</button>
            <button className="tb-btn primary" onClick={onAdd}>{Icon.plus ? Icon.plus({ size: 12 }) : '+'} Nuevo trabajador</button>
          </div>
        </div>
        <div className="card-b" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ background: 'var(--bg-sunken)', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={thStyle}>DNI</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Nombre</th>
                <th style={thStyle}>Categoría</th>
                <th style={thStyle}>Especialidad</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Jornal</th>
                <th style={thStyle}>Ingreso</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>SCTR</th>
                <th style={{ ...thStyle, width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 30, textAlign: 'center', color: 'var(--ink-4)' }}>Sin trabajadores que coincidan</td></tr>
              )}
              {visible.map(t => {
                const sctr = sctrStatus(t.sctrVigencia);
                const estadoColor = t.estado === 'Activo' ? 'var(--ok)' : t.estado === 'Permiso' ? 'var(--warn-ink)' : t.estado === 'Vacaciones' ? 'var(--accent)' : 'var(--ink-4)';
                const catColor = t.categoria === 'Capataz' ? 'var(--purple)' : t.categoria === 'Operario' ? 'var(--accent)' : t.categoria === 'Oficial' ? 'var(--warn-ink)' : 'var(--ink-3)';
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer' }} onClick={() => onEdit(t)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 10 }}>{t.dni}</td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: 11.5 }}>{t.nombres} {t.apellidos}</div>
                      {t.telefono && <div className="text-xs muted" style={{ fontSize: 10 }}>{t.telefono}</div>}
                    </td>
                    <td style={{ ...tdStyle }}><span style={{ fontWeight: 600, color: catColor, fontSize: 10.5 }}>{t.categoria}</span></td>
                    <td style={tdStyle}>{t.especialidad}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>S/ {(t.jornal || 0).toFixed(2)}</td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 10 }}>{t.ingreso}</td>
                    <td style={tdStyle}><span className="chip" style={{ fontSize: 9.5, padding: '2px 8px', background: estadoColor + '22', color: estadoColor, fontWeight: 600 }}>{t.estado}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 10, fontWeight: 600, color: sctr.color }}>● {sctr.label}</span></td>
                    <td style={tdStyle}><button className="tb-icon-btn" onClick={(e) => { e.stopPropagation(); onEdit(t); }} title="Editar">{Icon.edit ? Icon.edit({ size: 12 }) : '✎'}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showPrint && <PersonalListPrintView trabajadores={trabajadores} project={project} onClose={() => setShowPrint(false)} />}
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'center', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', letterSpacing: '0.04em' };
const tdStyle = { padding: '6px 10px', textAlign: 'center', fontSize: 11 };

function KpiMini({ lbl, val, sub, color, progress, pColor }) {
  return (
    <div className="card" style={{ padding: '10px 12px', minWidth: 0, overflow: 'hidden' }}>
      <div style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lbl}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</div>
      {sub && <div style={{ fontSize: 9.5, color: 'var(--ink-3)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub}>{sub}</div>}
      {progress != null && <div className="pbar" style={{ height: 4, marginTop: 6 }}><span style={{ width: progress + '%', background: pColor }} /></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CURVA S · Plan lineal + Real histórico + EVM
// ═══════════════════════════════════════════════════════════════

function buildCurvaSData(partidas, avances, today) {
  const parents = new Set(partidas.map(x => x.parent).filter(Boolean));
  const leaves = partidas.filter(p => !parents.has(p.code) && p.startDate && p.finishDate && (p.budget || 0) > 0);
  if (leaves.length === 0) return { buckets: [], plan: [], planAcum: [], real: [], realAcum: [], hoy: today, leaves: [] };

  // Range global
  let minDate = new Date(leaves[0].startDate);
  let maxDate = new Date(leaves[0].finishDate);
  leaves.forEach(p => {
    const s = new Date(p.startDate);
    const f = new Date(p.finishDate);
    if (s < minDate) minDate = s;
    if (f > maxDate) maxDate = f;
  });

  // Buckets mensuales
  const buckets = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const endCursor = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  let i = 1;
  while (cursor <= endCursor) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const start = new Date(y, m, 1);
    const finish = new Date(y, m + 1, 0, 23, 59, 59);
    buckets.push({
      key: `${y}-${String(m + 1).padStart(2, '0')}`,
      idx: i++,
      start, finish, year: y, month: m,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Plan: distribución lineal del budget de cada hoja por días
  const plan = buckets.map(() => 0);
  for (const p of leaves) {
    const s = new Date(p.startDate);
    const f = new Date(p.finishDate);
    const dias = Math.max(1, Math.round((f - s) / 86400000) + 1);
    const costoPorDia = (p.budget || 0) / dias;
    buckets.forEach((b, idx) => {
      const bs = b.start > s ? b.start : s;
      const bf = b.finish < f ? b.finish : f;
      if (bs <= bf) {
        const d = Math.round((bf - bs) / 86400000) + 1;
        plan[idx] += d * costoPorDia;
      }
    });
  }
  const planAcum = [];
  { let acc = 0; plan.forEach(v => { acc += v; planAcum.push(acc); }); }

  // Real: diff de history snapshots por bucket
  const real = buckets.map(() => 0);
  for (const p of leaves) {
    const h = (avances[p.code]?.history) || [];
    if (h.length === 0) continue;
    let prevAtEnd = 0;
    buckets.forEach((b, idx) => {
      let atEnd = prevAtEnd;
      for (const e of h) {
        const t = new Date(e.ts);
        if (t <= b.finish) atEnd = e.realCost || 0;
      }
      real[idx] += Math.max(0, atEnd - prevAtEnd);
      prevAtEnd = atEnd;
    });
  }
  const realAcum = [];
  { let acc = 0; real.forEach(v => { acc += v; realAcum.push(acc); }); }

  // EVM al fecha de corte (today)
  const hoyIdx = buckets.findIndex(b => today >= b.start && today <= b.finish);
  const cortIdx = hoyIdx >= 0 ? hoyIdx : (today < buckets[0].start ? -1 : buckets.length - 1);
  const PV = cortIdx >= 0 ? planAcum[cortIdx] : 0;
  const AC = cortIdx >= 0 ? realAcum[cortIdx] : 0;
  let EV = 0;
  for (const p of leaves) {
    const pct = (avances[p.code]?.avancePct) || 0;
    EV += (p.budget || 0) * pct / 100;
  }
  const BAC = leaves.reduce((s, p) => s + (p.budget || 0), 0);
  const SPI = PV > 0 ? EV / PV : 0;
  const CPI = AC > 0 ? EV / AC : 0;
  const SV = EV - PV;
  const CV = EV - AC;
  const EAC = (CPI > 0) ? BAC / CPI : BAC;

  return { buckets, plan, planAcum, real, realAcum, hoy: today, leaves, EVM: { PV, AC, EV, SPI, CPI, SV, CV, BAC, EAC, cortIdx } };
}

// ───── Curva S · Panel principal ─────
function CurvaSPanel({ project, partidas, avances, onExport, onExpand }) {
  const [labelMode, setLabelMode] = React.useState('fecha'); // 'mes' | 'fecha'
  const [capFilter, setCapFilter] = React.useState('total');
  const today = new Date('2026-05-05');

  const partidasFiltered = React.useMemo(() => {
    if (capFilter === 'total') return partidas;
    // Capítulo + sus descendientes
    const includeCodes = new Set([capFilter]);
    const collect = (parent) => {
      partidas.filter(p => p.parent === parent).forEach(c => { includeCodes.add(c.code); collect(c.code); });
    };
    collect(capFilter);
    return partidas.filter(p => includeCodes.has(p.code));
  }, [partidas, capFilter]);

  const data = React.useMemo(() => buildCurvaSData(partidasFiltered, avances, today), [partidasFiltered, avances]);

  const capitulos = React.useMemo(() => partidas.filter(p => p.level === 1).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [partidas]);

  if (data.buckets.length === 0) {
    return <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
      <div style={{ fontSize: 14, marginBottom: 8 }}>Sin datos suficientes para construir Curva S</div>
      <div className="text-xs muted">Las partidas del cronograma necesitan fechas de inicio/fin y costo</div>
    </div>;
  }

  const hayEjecucion = data.realAcum.some(v => v > 0);
  const labelOf = (b) => labelMode === 'mes' ? `Mes ${b.idx}` : new Date(b.year, b.month, 1).toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }).replace('.', '');

  return (
    <div className="vstack" style={{ gap: 14 }}>
      {/* Header con toggles + export */}
      <div className="card">
        <div className="card-h" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3>Curva S · Avance acumulado</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>
              {data.buckets.length} meses · Fecha de corte: {today.toLocaleDateString('es-PE')}
              {!hayEjecucion && <span style={{ color: 'var(--warn-ink)', marginLeft: 8 }}>· Sin ejecución registrada</span>}
            </div>
          </div>
          <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
              <button onClick={() => setLabelMode('fecha')} style={{ padding: '6px 10px', fontSize: 11, border: 'none', background: labelMode === 'fecha' ? 'var(--accent)' : 'var(--bg-elev)', color: labelMode === 'fecha' ? 'white' : 'var(--ink-2)', cursor: 'pointer' }}>Fechas</button>
              <button onClick={() => setLabelMode('mes')} style={{ padding: '6px 10px', fontSize: 11, border: 'none', background: labelMode === 'mes' ? 'var(--accent)' : 'var(--bg-elev)', color: labelMode === 'mes' ? 'white' : 'var(--ink-2)', cursor: 'pointer', borderLeft: '1px solid var(--line)' }}>Mes N</button>
            </div>
            <select value={capFilter} onChange={e => setCapFilter(e.target.value)} style={{ padding: '6px 10px', fontSize: 11, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)' }}>
              <option value="total">Total proyecto</option>
              {capitulos.map(c => <option key={c.code} value={c.code}>{c.code} · {c.name.length > 40 ? c.name.slice(0, 40) + '…' : c.name}</option>)}
            </select>
            <button className="tb-btn" onClick={() => onExpand(data, labelOf, today)} title="Vista expandida fullscreen">{Icon.expand ? Icon.expand({ size: 12 }) : '⛶'} Vista expandida</button>
            <button className="tb-btn" onClick={() => exportCurvaSAsPNG(`curva-s-${project.id}-${new Date().toISOString().slice(0, 10)}.png`)} title="Descargar como imagen PNG">{Icon.image ? Icon.image({ size: 12 }) : '🖼'} PNG</button>
            <button className="tb-btn primary" onClick={() => onExport(data, labelOf, today)} title="Vista PDF">{Icon.download ? Icon.download({ size: 12 }) : '⬇'} PDF</button>
          </div>
        </div>
        <div className="card-b">
          <CurvaSChart data={data} labelOf={labelOf} />
        </div>
      </div>

      {/* Chips EVM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8 }}>
        <KpiMini lbl="BAC · Presupuesto" val={fmtPEN(data.EVM.BAC)} sub="Cost @ completion meta" color="var(--ink)" />
        <KpiMini lbl="PV · Plan al corte" val={fmtPEN(data.EVM.PV)} sub={`${data.EVM.BAC > 0 ? (data.EVM.PV / data.EVM.BAC * 100).toFixed(1) : '0'}% del BAC`} color="var(--ink-2)" />
        <KpiMini lbl="EV · Earned Value" val={fmtPEN(data.EVM.EV)} sub={`${data.EVM.BAC > 0 ? (data.EVM.EV / data.EVM.BAC * 100).toFixed(1) : '0'}% completado`} color="var(--accent)" />
        <KpiMini lbl="AC · Costo Real" val={fmtPEN(data.EVM.AC)} sub="Ejecutado a la fecha" color="var(--warn-ink)" />
        <KpiMini lbl="SPI · Cronograma" val={hayEjecucion ? data.EVM.SPI.toFixed(2) : '—'} sub={hayEjecucion ? (data.EVM.SV >= 0 ? `Adelanto ${fmtPEN(Math.abs(data.EVM.SV))}` : `Atraso ${fmtPEN(Math.abs(data.EVM.SV))}`) : 'Sin ejecución'} color={!hayEjecucion ? 'var(--ink-4)' : data.EVM.SPI >= 1 ? 'var(--ok)' : 'var(--danger)'} />
        <KpiMini lbl="CPI · Costo" val={hayEjecucion && data.EVM.AC > 0 ? data.EVM.CPI.toFixed(2) : '—'} sub={hayEjecucion && data.EVM.AC > 0 ? (data.EVM.CV >= 0 ? `Ahorro ${fmtPEN(Math.abs(data.EVM.CV))}` : `Sobrecosto ${fmtPEN(Math.abs(data.EVM.CV))}`) : 'Sin ejecución'} color={!(hayEjecucion && data.EVM.AC > 0) ? 'var(--ink-4)' : data.EVM.CPI >= 1 ? 'var(--ok)' : 'var(--danger)'} />
      </div>

      {/* Tabla mensual */}
      <div className="card">
        <div className="card-h"><h3>Detalle mensual</h3><span className="text-xs muted">{data.buckets.length} períodos</span></div>
        <div className="card-b" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
            <thead style={{ background: 'var(--bg-sunken)' }}>
              <tr>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', position: 'sticky', left: 0, background: 'var(--bg-sunken)', zIndex: 1, minWidth: 200 }}>Concepto</th>
                {data.buckets.map(b => (
                  <th key={b.key} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: b.start <= today && today <= b.finish ? 'var(--accent)' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 100 }}>{labelOf(b)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { lbl: 'Valor Planificado', arr: data.plan, color: 'var(--ink-2)' },
                { lbl: 'Valor Planificado Acumulado', arr: data.planAcum, color: 'var(--ink)', bold: true },
                { lbl: 'Costo Real', arr: data.real, color: 'var(--warn-ink)', muted: !hayEjecucion },
                { lbl: 'Costo Real Acumulado', arr: data.realAcum, color: 'var(--accent)', bold: true, muted: !hayEjecucion },
              ].map(row => (
                <tr key={row.lbl} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '6px 10px', fontWeight: row.bold ? 700 : 500, color: row.muted ? 'var(--ink-4)' : row.color, position: 'sticky', left: 0, background: 'var(--bg-elev)', zIndex: 1 }}>{row.lbl}</td>
                  {row.arr.map((v, i) => (
                    <td key={i} style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: row.muted ? 'var(--ink-4)' : (v > 0 ? row.color : 'var(--ink-4)'), fontWeight: row.bold ? 600 : 400 }}>
                      {v > 0 ? fmtPEN(v) : 'S/ -'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───── Gráfico SVG · 2 líneas + hoy (colores hardcoded para export) ─────
function CurvaSChart({ data, labelOf, height, exportMode }) {
  const W = 1100, H = height || 320, padL = 64, padR = 20, padT = 14, padB = 36;
  const iW = W - padL - padR, iH = H - padT - padB;
  const N = data.buckets.length;
  if (N === 0) return null;
  const maxVal = Math.max(...data.planAcum, ...data.realAcum, 1);
  const xOf = (i) => padL + (i / Math.max(1, N - 1)) * iW;
  const yOf = (v) => padT + iH - (v / maxVal) * iH;

  const planPath = data.planAcum.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
  const realPath = data.realAcum.filter(v => v > 0).length > 0
    ? data.realAcum.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')
    : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => maxVal * f);
  const fmtAxisY = (v) => v >= 1e6 ? 'S/ ' + (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? 'S/ ' + (v / 1e3).toFixed(0) + 'K' : 'S/ ' + v.toFixed(0);

  const hoyIdx = data.EVM.cortIdx;
  const hoyX = hoyIdx >= 0 ? xOf(hoyIdx + 0.5) : -1;

  // Colores hardcoded · funcionan en export PNG/SVG standalone
  const C = {
    grid: '#E5E5E5', axisInk: '#999', textInk: '#555',
    plan: '#D9534F', real: '#3B5BDB', hoy: '#D9534F',
  };

  return (
    <svg className="curvas-chart-svg" viewBox={`0 0 ${W} ${H}`} width="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', background: exportMode ? 'white' : 'transparent' }}>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={yOf(v)} y2={yOf(v)} stroke={C.grid} strokeDasharray={i === 0 ? '0' : '2,3'} />
          <text x={padL - 6} y={yOf(v) + 3} fontSize="9" textAnchor="end" fill={C.axisInk} fontFamily="ui-monospace, Consolas, monospace">{fmtAxisY(v)}</text>
        </g>
      ))}

      {data.buckets.map((b, i) => (
        <text key={b.key} x={xOf(i)} y={H - 14} fontSize="9" textAnchor="middle" fill={C.axisInk} fontFamily="ui-monospace, Consolas, monospace">{labelOf(b)}</text>
      ))}

      <path d={`${planPath} L${xOf(N - 1)},${padT + iH} L${padL},${padT + iH} Z`} fill={C.plan} opacity="0.06" />
      <path d={planPath} fill="none" stroke={C.plan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {realPath && (
        <>
          <path d={realPath} fill="none" stroke={C.real} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {data.realAcum.map((v, i) => v > 0 && i === data.realAcum.length - 1 - data.realAcum.slice().reverse().findIndex(x => x > 0) ? <circle key={i} cx={xOf(i)} cy={yOf(v)} r="4" fill={C.real} /> : null)}
        </>
      )}

      {hoyX > 0 && (
        <>
          <line x1={hoyX} x2={hoyX} y1={padT} y2={padT + iH} stroke={C.hoy} strokeWidth="1.5" strokeDasharray="3,3" />
          <text x={hoyX + 4} y={padT + 12} fontSize="9" fill={C.hoy} fontFamily="ui-monospace, Consolas, monospace" fontWeight="700">HOY</text>
        </>
      )}

      <g transform={`translate(${padL + 8}, ${padT + 4})`} fontSize="10" fontFamily="Arial, sans-serif">
        <line x1="0" x2="16" y1="6" y2="6" stroke={C.plan} strokeWidth="2" />
        <text x="20" y="10" fill={C.textInk} fontWeight="600">Valor Planificado Acumulado</text>
        <line x1="180" x2="196" y1="6" y2="6" stroke={C.real} strokeWidth="2.5" />
        <text x="200" y="10" fill={C.textInk} fontWeight="600">Costo Real Acumulado</text>
      </g>
    </svg>
  );
}

// ───── Vista expandida fullscreen · gráfico grande + tabla compacta ─────
function CurvaSExpandedView({ data, project, labelOf, today, onClose, onExportPNG }) {
  const fmtMoney = (n) => 'S/ ' + (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hayEjecucion = data.realAcum.some(v => v > 0);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, padding: 24, overflow: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 1600, margin: '0 auto', background: 'white', borderRadius: 8, padding: 24, color: '#1a1a1a' }}>
        <div className="hstack between" style={{ marginBottom: 16 }}>
          <div>
            <div className="text-xs muted" style={{ fontFamily: 'var(--mono)' }}>{project.id}</div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Curva S · {project.name}</h2>
            <div className="text-xs muted" style={{ marginTop: 4 }}>Fecha de corte: {today.toLocaleDateString('es-PE')}{!hayEjecucion && ' · Sin ejecución registrada'}</div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button className="tb-btn primary" onClick={onExportPNG}>{Icon.download ? Icon.download({ size: 13 }) : '⬇'} Descargar PNG</button>
            <button className="tb-btn" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        {/* Gráfico grande */}
        <div style={{ background: 'white', padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
          <CurvaSChart data={data} labelOf={labelOf} height={500} exportMode />
        </div>

        {/* Chips EVM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginTop: 16 }}>
          <KpiMini lbl="BAC" val={fmtPEN(data.EVM.BAC)} sub="Presupuesto total" color="#1a1a1a" />
          <KpiMini lbl="PV al corte" val={fmtPEN(data.EVM.PV)} sub={`${data.EVM.BAC > 0 ? (data.EVM.PV / data.EVM.BAC * 100).toFixed(1) : '0'}% planificado`} color="#666" />
          <KpiMini lbl="EV ganado" val={fmtPEN(data.EVM.EV)} sub={`${data.EVM.BAC > 0 ? (data.EVM.EV / data.EVM.BAC * 100).toFixed(1) : '0'}% completado`} color="#3B5BDB" />
          <KpiMini lbl="AC real" val={fmtPEN(data.EVM.AC)} sub="Ejecutado" color="#D97757" />
          <KpiMini lbl="SPI" val={hayEjecucion ? data.EVM.SPI.toFixed(2) : '—'} sub={hayEjecucion ? (data.EVM.SV >= 0 ? 'Adelantado' : 'Atrasado') : 'Sin datos'} color={!hayEjecucion ? '#999' : data.EVM.SPI >= 1 ? '#0F8050' : '#D9534F'} />
          <KpiMini lbl="CPI" val={hayEjecucion && data.EVM.AC > 0 ? data.EVM.CPI.toFixed(2) : '—'} sub={hayEjecucion && data.EVM.AC > 0 ? (data.EVM.CV >= 0 ? 'Bajo presupuesto' : 'Sobrecosto') : 'Sin datos'} color={!(hayEjecucion && data.EVM.AC > 0) ? '#999' : data.EVM.CPI >= 1 ? '#0F8050' : '#D9534F'} />
        </div>

        {/* Tabla compacta */}
        <div style={{ marginTop: 16, overflowX: 'auto', border: '1px solid #ddd', borderRadius: 6 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666', minWidth: 200, position: 'sticky', left: 0, background: '#f5f5f5' }}>Concepto</th>
                {data.buckets.map(b => <th key={b.key} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666', minWidth: 100 }}>{labelOf(b)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { lbl: 'Valor Planificado', arr: data.plan },
                { lbl: 'Plan Acumulado', arr: data.planAcum, bold: true },
                { lbl: 'Costo Real', arr: data.real },
                { lbl: 'Real Acumulado', arr: data.realAcum, bold: true },
              ].map(row => (
                <tr key={row.lbl} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 10px', fontWeight: row.bold ? 700 : 500, position: 'sticky', left: 0, background: 'white' }}>{row.lbl}</td>
                  {row.arr.map((v, i) => <td key={i} style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 10, fontWeight: row.bold ? 600 : 400, color: v > 0 ? '#1a1a1a' : '#999' }}>{v > 0 ? fmtMoney(v) : 'S/ -'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ───── Export · SVG → canvas → PNG download ─────
function exportCurvaSAsPNG(filename) {
  const svg = document.querySelector('.curvas-chart-svg');
  if (!svg) { alert('No se encontró el gráfico'); return; }
  const serializer = new XMLSerializer();
  const svgClone = svg.cloneNode(true);
  // Asegurar dimensiones explícitas
  const viewBox = svgClone.getAttribute('viewBox') || '0 0 1100 320';
  const [, , vbW, vbH] = viewBox.split(' ').map(Number);
  svgClone.setAttribute('width', vbW);
  svgClone.setAttribute('height', vbH);
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const svgStr = serializer.serializeToString(svgClone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const scale = 2; // 2x resolución para nitidez
    const canvas = document.createElement('canvas');
    canvas.width = vbW * scale;
    canvas.height = vbH * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(b => {
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u;
      a.download = filename || `curva-s-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(u);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => { alert('Error generando PNG'); URL.revokeObjectURL(url); };
  img.src = url;
}

// ───── Vista exportable · estilo PDF Pezantes ─────
function CurvaSPrintView({ data, project, labelOf, today, onClose }) {
  const printDoc = () => window.print();
  const fmtMoney = (n) => 'S/ ' + (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fechaCorte = today.toLocaleDateString('es-PE');
  const yearStart = data.buckets[0]?.year || new Date().getFullYear();

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, overflow: 'auto', padding: 20 }} className="curvas-print-modal">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .curvas-print-modal, .curvas-print-modal * { visibility: visible !important; }
          .curvas-print-modal { position: absolute !important; inset: 0 !important; background: white !important; padding: 0 !important; overflow: visible !important; }
          .curvas-print-toolbar { display: none !important; }
          .curvas-print-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4 landscape; margin: 8mm; }
        }
        .curvas-print-page { background: white; color: #000; font-family: 'Calibri', 'Arial', sans-serif; width: 281mm; min-height: 194mm; margin: 0 auto 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); padding: 6mm 8mm; box-sizing: border-box; }
        .cs-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .cs-tbl td, .cs-tbl th { border: 1px solid #444; padding: 2px 3px; font-size: 7px; word-break: break-word; }
        .cs-tbl thead th { background: #1a1a1a; color: white; font-weight: 700; text-align: center; padding: 4px 2px; font-size: 7.5px; letter-spacing: 0.02em; }
        .cs-banner { background: #1a1a1a; color: white; text-align: center; padding: 6px; font-weight: 700; font-size: 12pt; letter-spacing: 0.05em; }
        .cs-info-tbl td { padding: 3px 6px; font-size: 8pt; border: 1px solid #444; }
      `}</style>
      <div className="curvas-print-toolbar" onClick={e => e.stopPropagation()} style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 8, background: 'rgba(0,0,0,0.85)', borderRadius: 6, marginBottom: 12 }}>
        <button className="tb-btn primary" onClick={printDoc}>{Icon.download ? Icon.download({ size: 13 }) : '⬇'} Imprimir / Guardar PDF</button>
        <button className="tb-btn" onClick={onClose}>Cerrar</button>
      </div>

      <div onClick={e => e.stopPropagation()} className="curvas-print-page">
        {/* Header · banner negro + logo a la derecha */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3mm' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle', padding: 0 }}>
                <div className="cs-banner">CURVA S</div>
                <div className="cs-banner" style={{ fontSize: '8.5pt', padding: '4px 8px', borderTop: '1px solid #444' }}>{project.name.toUpperCase()}</div>
              </td>
              <td style={{ width: '40mm', verticalAlign: 'middle', padding: '0 0 0 6mm', textAlign: 'right' }}>
                <img src="assets/logo.png" alt="MM HIGH METRIK" style={{ width: '36mm', maxWidth: '36mm', maxHeight: '20mm', height: 'auto', objectFit: 'contain', display: 'inline-block' }} onError={(e) => { e.target.style.display = 'none'; }} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Datos del proyecto */}
        <table className="cs-info-tbl" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2mm' }}>
          <tbody>
            <tr>
              <td style={{ width: '14%', fontWeight: 700, background: '#f5f5f5', textAlign: 'right' }}>Proyecto:</td>
              <td colSpan="5">{project.name}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, background: '#f5f5f5', textAlign: 'right' }}>ID:</td>
              <td colSpan="5">{project.id}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, background: '#f5f5f5', textAlign: 'right' }}>Fecha de Inicio</td>
              <td>{project.startDate}</td>
              <td style={{ fontWeight: 700, background: '#f5f5f5', textAlign: 'right' }}>Fecha Fin</td>
              <td>{project.endDate}</td>
              <td style={{ fontWeight: 700, background: '#f5f5f5', textAlign: 'right' }}>Fecha de Corte</td>
              <td>{fechaCorte}</td>
            </tr>
          </tbody>
        </table>

        {/* Tabla de meses · table-layout fixed para cellule iguales */}
        <table className="cs-tbl" style={{ marginTop: '3mm' }}>
          <colgroup>
            <col style={{ width: '34mm' }} />
            {data.buckets.map((b, i) => <col key={i} />)}
          </colgroup>
          <thead>
            <tr><th colSpan={data.buckets.length + 1} style={{ background: '#444' }}>Año {yearStart}</th></tr>
            <tr>
              <th style={{ textAlign: 'left' }}>&nbsp;</th>
              {data.buckets.map(b => <th key={b.key}>{labelOf(b)}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ background: '#f5f5f5', fontWeight: 700, textAlign: 'right' }}>Valor Planificado</td>
              {data.plan.map((v, i) => <td key={i} style={{ textAlign: 'right' }}>{fmtMoney(v)}</td>)}
            </tr>
            <tr>
              <td style={{ background: '#f5f5f5', fontWeight: 700, textAlign: 'right' }}>Plan Acumulado</td>
              {data.planAcum.map((v, i) => <td key={i} style={{ textAlign: 'right' }}>{fmtMoney(v)}</td>)}
            </tr>
            <tr>
              <td style={{ background: '#f5f5f5', fontWeight: 700, textAlign: 'right' }}>Costo Real</td>
              {data.real.map((v, i) => <td key={i} style={{ textAlign: 'right' }}>{v > 0 ? fmtMoney(v) : 'S/ -'}</td>)}
            </tr>
            <tr>
              <td style={{ background: '#f5f5f5', fontWeight: 700, textAlign: 'right' }}>Real Acumulado</td>
              {data.realAcum.map((v, i) => <td key={i} style={{ textAlign: 'right' }}>{v > 0 ? fmtMoney(v) : 'S/ -'}</td>)}
            </tr>
          </tbody>
        </table>

        {/* Gráfico */}
        <div style={{ marginTop: '4mm', padding: '3mm', border: '1px solid #444', height: '100mm' }}>
          <CurvaSChart data={data} labelOf={labelOf} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENTOS · Conexión NAS Synology vía backend WebDAV
// ═══════════════════════════════════════════════════════════════

const NAS_API = (typeof window !== 'undefined' && window.NAS_API_URL) || 'http://localhost:3001/api';

// ═══════════════════════════════════════════════════════════════
// MOCK NAS · failsafe demo si backend cae · datos realistas
// ═══════════════════════════════════════════════════════════════
const MOCK_FS = {
  '/OB-2026-009': [
    { name: '00_Generales', type: 'directory' },
    { name: '01_Contratos', type: 'directory' },
    { name: '02_Planos', type: 'directory' },
    { name: '03_Cronograma', type: 'directory' },
    { name: '04_Presupuestos', type: 'directory' },
    { name: '05_Valorizaciones', type: 'directory' },
    { name: '06_Fotografias', type: 'directory' },
    { name: '07_Personal', type: 'directory' },
    { name: '08_Calidad', type: 'directory' },
    { name: '09_SSOMA', type: 'directory' },
    { name: '10_Actas', type: 'directory' },
    { name: '11_RFI_RDI', type: 'directory' },
    { name: '12_Adicionales', type: 'directory' },
  ],
  '/OB-2026-009/00_Generales': [
    { name: 'Acta_Inicio_Obra.pdf', type: 'file', size: 845_120 },
    { name: 'Resolucion_Adjudicacion_2026.pdf', type: 'file', size: 1_234_567 },
    { name: 'Bases_Integradas_Licitacion.pdf', type: 'file', size: 4_823_456 },
    { name: 'Carta_Fianza_Fiel_Cumplimiento.pdf', type: 'file', size: 567_823 },
  ],
  '/OB-2026-009/01_Contratos': [
    { name: 'Contrato_Principal_OB-2026-009.pdf', type: 'file', size: 2_450_120 },
    { name: 'Adenda_01_Ampliacion_Plazo.pdf', type: 'file', size: 845_321 },
    { name: 'Garantia_Fiel_Cumplimiento.pdf', type: 'file', size: 723_456 },
    { name: 'Poliza_CAR_Construccion.pdf', type: 'file', size: 1_234_567 },
  ],
  '/OB-2026-009/02_Planos': [
    { name: 'Arquitectura', type: 'directory' },
    { name: 'Estructuras', type: 'directory' },
    { name: 'IIEE', type: 'directory' },
    { name: 'IISS', type: 'directory' },
    { name: 'Plano_Ubicacion_Lurin.pdf', type: 'file', size: 3_456_789 },
    { name: 'Plano_Localizacion_Cementerio.pdf', type: 'file', size: 4_567_890 },
  ],
  '/OB-2026-009/02_Planos/Arquitectura': [
    { name: 'A-01_Planta_General.dwg', type: 'file', size: 12_456_789 },
    { name: 'A-02_Planta_Crematorio.dwg', type: 'file', size: 8_234_567 },
    { name: 'A-03_Planta_Velatorio.dwg', type: 'file', size: 7_891_234 },
    { name: 'A-04_Planta_Columbario.dwg', type: 'file', size: 6_543_210 },
    { name: 'A-05_Cortes_Elevaciones.dwg', type: 'file', size: 9_876_543 },
    { name: 'A-06_Detalles_Constructivos.pdf', type: 'file', size: 5_432_109 },
  ],
  '/OB-2026-009/02_Planos/Estructuras': [
    { name: 'E-01_Cimentacion.dwg', type: 'file', size: 11_234_567 },
    { name: 'E-02_Columnas_Vigas.dwg', type: 'file', size: 9_876_543 },
    { name: 'E-03_Losas_Crematorio.dwg', type: 'file', size: 8_765_432 },
    { name: 'E-04_Detalles_Acero.pdf', type: 'file', size: 4_567_890 },
    { name: 'Memoria_Calculo_Estructural.pdf', type: 'file', size: 3_456_789 },
  ],
  '/OB-2026-009/02_Planos/IIEE': [
    { name: 'IE-01_Diagrama_Unifilar.dwg', type: 'file', size: 4_123_456 },
    { name: 'IE-02_Distribucion_Tomacorrientes.dwg', type: 'file', size: 5_234_567 },
    { name: 'IE-03_Iluminacion.dwg', type: 'file', size: 4_567_890 },
  ],
  '/OB-2026-009/02_Planos/IISS': [
    { name: 'IS-01_Agua_Fria.dwg', type: 'file', size: 3_456_789 },
    { name: 'IS-02_Desague.dwg', type: 'file', size: 4_123_456 },
    { name: 'IS-03_Detalles_Sanitarios.pdf', type: 'file', size: 2_345_678 },
  ],
  '/OB-2026-009/03_Cronograma': [
    { name: 'gantt-crematorio-rev03.xml', type: 'file', size: 234_567 },
    { name: 'Cronograma_Original_Rev01.pdf', type: 'file', size: 1_234_567 },
    { name: 'Cronograma_Actualizado_Rev03.pdf', type: 'file', size: 1_345_678 },
  ],
  '/OB-2026-009/04_Presupuestos': [
    { name: 'Presupuesto_Oferta_Adjudicada.xlsx', type: 'file', size: 567_890 },
    { name: 'Analisis_Precios_Unitarios.xlsx', type: 'file', size: 1_234_567 },
    { name: 'Lista_Insumos_Generales.xlsx', type: 'file', size: 345_678 },
  ],
  '/OB-2026-009/05_Valorizaciones': [
    { name: 'V01', type: 'directory' },
    { name: 'V02', type: 'directory' },
  ],
  '/OB-2026-009/05_Valorizaciones/V01': [
    { name: 'Valorizacion_N01_Marzo_2026.pdf', type: 'file', size: 1_234_567 },
    { name: 'Detalle_Metrados_V01.xlsx', type: 'file', size: 567_890 },
    { name: 'Acta_Conformidad_V01.pdf', type: 'file', size: 234_567 },
  ],
  '/OB-2026-009/05_Valorizaciones/V02': [
    { name: 'Valorizacion_N02_Abril_2026.pdf', type: 'file', size: 1_345_678 },
    { name: 'Detalle_Metrados_V02.xlsx', type: 'file', size: 678_901 },
  ],
  '/OB-2026-009/06_Fotografias': [
    { name: '2026-03-Marzo', type: 'directory' },
    { name: '2026-04-Abril', type: 'directory' },
  ],
  '/OB-2026-009/06_Fotografias/2026-03-Marzo': [
    { name: 'IMG_001_Inicio_Obra.jpg', type: 'file', size: 4_234_567 },
    { name: 'IMG_002_Trazo_Replanteo.jpg', type: 'file', size: 3_876_543 },
    { name: 'IMG_003_Excavacion.jpg', type: 'file', size: 5_123_456 },
    { name: 'IMG_004_Concreto_Cimientos.jpg', type: 'file', size: 4_567_890 },
  ],
  '/OB-2026-009/06_Fotografias/2026-04-Abril': [
    { name: 'IMG_005_Columnas.jpg', type: 'file', size: 4_345_678 },
    { name: 'IMG_006_Encofrado_Losa.jpg', type: 'file', size: 5_234_567 },
    { name: 'IMG_007_Vaciado_Losa.jpg', type: 'file', size: 4_876_543 },
    { name: 'IMG_008_Avance_Velatorio.jpg', type: 'file', size: 5_456_789 },
  ],
  '/OB-2026-009/07_Personal': [
    { name: 'Lista_Personal_Obra.pdf', type: 'file', size: 234_567 },
    { name: 'Planilla_Trabajadores_Abril.xlsx', type: 'file', size: 567_890 },
    { name: 'SCTR_Renovaciones.pdf', type: 'file', size: 345_678 },
  ],
  '/OB-2026-009/08_Calidad': [
    { name: 'Plan_Calidad_Obra.pdf', type: 'file', size: 1_234_567 },
    { name: 'Protocolo_Vaciado_Concreto.pdf', type: 'file', size: 567_890 },
    { name: 'Ensayos_Resistencia_Concreto.pdf', type: 'file', size: 678_901 },
  ],
  '/OB-2026-009/09_SSOMA': [
    { name: 'Plan_SSOMA.pdf', type: 'file', size: 1_456_789 },
    { name: 'IPERC_Identificacion_Riesgos.xlsx', type: 'file', size: 345_678 },
    { name: 'ATS_Marzo_2026.xlsx', type: 'file', size: 234_567 },
    { name: 'Charla_5min_Diaria.pdf', type: 'file', size: 123_456 },
  ],
  '/OB-2026-009/10_Actas': [
    { name: 'Acta_Reunion_Semanal_Sem01.pdf', type: 'file', size: 234_567 },
    { name: 'Acta_Reunion_Semanal_Sem02.pdf', type: 'file', size: 256_789 },
    { name: 'Acta_Reunion_Semanal_Sem03.pdf', type: 'file', size: 245_678 },
  ],
  '/OB-2026-009/11_RFI_RDI': [
    { name: 'RFI-001_Consulta_Acero.pdf', type: 'file', size: 156_789 },
    { name: 'RFI-002_Modificacion_Plano_A-03.pdf', type: 'file', size: 234_567 },
    { name: 'RDI-001_Compatibilidad_Planos.pdf', type: 'file', size: 178_901 },
  ],
  '/OB-2026-009/12_Adicionales': [],
};

const NOW_ISO = new Date('2026-05-04T10:30:00').toISOString();
function mockListAt(path) {
  const base = (MOCK_FS[path] || []).map((it, i) => ({
    name: it.name,
    path: path + '/' + it.name,
    type: it.type,
    size: it.size || 0,
    lastModified: new Date(Date.now() - (i * 86400000 * 3)).toISOString(),
    mime: '',
  }));
  return base;
}

const MockNasApi = {
  isMock: true,
  async health() { return { ok: true, nas: 'mock://demo', rootPath: '/Proyectos', uploadLimitMB: 500, mock: true }; },
  async list(path) {
    await new Promise(r => setTimeout(r, 80));
    return { items: mockListAt(path), path };
  },
  async upload() { await new Promise(r => setTimeout(r, 600)); return { ok: true, mock: true }; },
  downloadUrl(p) { return '#mock-download-' + encodeURIComponent(p); },
  previewUrl(p) { return '#mock-preview-' + encodeURIComponent(p); },
  async mkdir() { return { ok: true, mock: true }; },
  async move() { return { ok: true, mock: true }; },
  async delete() { return { ok: true, mock: true }; },
};

// ───── API client ─────
const NasApi = {
  async health() {
    const r = await fetch(`${NAS_API}/health`);
    return r.ok ? r.json() : { ok: false, error: r.statusText };
  },
  async list(path) {
    const r = await fetch(`${NAS_API}/files/list?path=${encodeURIComponent(path || '/')}`);
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },
  async upload(path, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${NAS_API}/files/upload`);
      if (xhr.upload && onProgress) xhr.upload.onprogress = (e) => onProgress(e.loaded / e.total);
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(xhr.responseText));
      xhr.onerror = () => reject(new Error('Network error'));
      const fd = new FormData();
      fd.append('path', path);
      fd.append('file', file);
      xhr.send(fd);
    });
  },
  downloadUrl(path) { return `${NAS_API}/files/download?path=${encodeURIComponent(path)}`; },
  previewUrl(path) { return `${NAS_API}/files/preview?path=${encodeURIComponent(path)}`; },
  async mkdir(parent, name) {
    const r = await fetch(`${NAS_API}/files/mkdir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: parent, name }) });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },
  async move(from, to) {
    const r = await fetch(`${NAS_API}/files/move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to }) });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },
  async delete(path) {
    const r = await fetch(`${NAS_API}/files/delete?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },
};

// ───── Helper: format file size ─────
function fmtSize(bytes) {
  if (!bytes || bytes < 1024) return (bytes || 0) + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function fileIconOf(item) {
  if (item.type === 'directory') return '📁';
  const ext = item.name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return '📕';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return '📊';
  if (['docx', 'doc'].includes(ext)) return '📝';
  if (['dwg', 'dxf'].includes(ext)) return '📐';
  if (['mp4', 'mov', 'webm'].includes(ext)) return '🎥';
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
  return '📄';
}

function isPreviewable(item) {
  if (item.type !== 'file') return false;
  const ext = item.name.split('.').pop().toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'txt'].includes(ext);
}

// ───── Modal preview · PDFs e imágenes ─────
function FilePreviewModal({ item, onClose }) {
  if (!item) return null;
  const ext = item.name.split('.').pop().toLowerCase();
  const isPdf = ext === 'pdf';
  const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const url = NasApi.previewUrl(item.path);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-elev)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
          <div className="text-xs muted" style={{ marginTop: 2 }}>{fmtSize(item.size)} · {item.path}</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <a className="tb-btn" href={NasApi.downloadUrl(item.path)} target="_blank" rel="noreferrer">{Icon.download ? Icon.download({ size: 12 }) : '⬇'} Descargar</a>
          <button className="tb-btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ flex: 1, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 16 }}>
        {isPdf && <iframe src={url} style={{ width: '100%', height: '100%', border: 'none', background: 'white' }} title={item.name} />}
        {isImg && <img src={url} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
        {!isPdf && !isImg && (
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>{fileIconOf(item)}</div>
            <div>Preview no disponible para .{ext}</div>
            <a className="tb-btn primary" href={NasApi.downloadUrl(item.path)} target="_blank" rel="noreferrer" style={{ marginTop: 12, display: 'inline-block' }}>Descargar archivo</a>
          </div>
        )}
      </div>
    </div>
  );
}

// ───── Modal · crear carpeta ─────
function MkdirModal({ parentPath, onCreate, onClose }) {
  const [name, setName] = React.useState('');
  const submit = (e) => { e.preventDefault(); if (name.trim()) { onCreate(name.trim()); onClose(); } };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="card" style={{ width: 380 }}>
        <div className="card-h">
          <div>
            <h3 style={{ margin: 0 }}>Nueva carpeta</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>en {parentPath}</div>
          </div>
          <button type="button" className="tb-icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="card-b">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de carpeta" style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid var(--line)', borderRadius: 6, outline: 'none' }} />
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button" className="tb-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="tb-btn primary">Crear</button>
        </div>
      </form>
    </div>
  );
}

// ───── Panel principal Documentos ─────
function DocumentosPanel({ project }) {
  const initialPath = `/${project.id}`;
  const [path, setPath] = React.useState(initialPath);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [health, setHealth] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [preview, setPreview] = React.useState(null);
  const [showMkdir, setShowMkdir] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(null);
  const [useMock, setUseMock] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // API actual · NAS real o mock fallback
  const Api = useMock ? MockNasApi : NasApi;

  // Health check al montar · auto-fallback a mock si falla
  React.useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled && health === null) {
        // Si timeout 5s sin respuesta del backend → activar mock
        console.warn('NAS backend timeout · activando modo demo');
        setUseMock(true);
        setHealth({ ok: true, mock: true, nas: 'mock://demo' });
      }
    }, 5000);

    NasApi.health()
      .then(r => {
        if (cancelled) return;
        clearTimeout(timeout);
        if (r.ok) {
          setHealth(r);
        } else {
          // Backend respondió error → mock
          setUseMock(true);
          setHealth({ ok: true, mock: true, nas: 'mock://demo' });
        }
      })
      .catch(e => {
        if (cancelled) return;
        clearTimeout(timeout);
        // Connection refused o similar → mock
        setUseMock(true);
        setHealth({ ok: true, mock: true, nas: 'mock://demo' });
      });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  const reload = React.useCallback(() => {
    setLoading(true); setError('');
    Api.list(path)
      .then(r => { setItems(r.items); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [path, Api]);

  React.useEffect(() => { if (health?.ok) reload(); }, [path, health, reload, useMock]);

  const retryRealNas = () => {
    setUseMock(false);
    setHealth(null);
    NasApi.health()
      .then(r => { if (r.ok) setHealth(r); else { setUseMock(true); setHealth({ ok: true, mock: true }); } })
      .catch(() => { setUseMock(true); setHealth({ ok: true, mock: true }); });
  };

  const enterFolder = (item) => setPath(item.path);
  const goUp = () => { const parts = path.split('/').filter(Boolean); parts.pop(); setPath('/' + parts.join('/')); };
  const goRoot = () => setPath(initialPath);
  const breadcrumbs = path.split('/').filter(Boolean);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      await Api.upload(path, file, (p) => setUploadProgress(p));
      setUploadProgress(null);
      if (useMock) { alert('✓ Archivo subido (modo demo · no se guarda)'); }
      reload();
    } catch (err) {
      setUploadProgress(null);
      alert('Error subiendo: ' + err.message);
    }
    e.target.value = '';
  };

  const onMkdir = async (name) => {
    try { await Api.mkdir(path, name); reload(); }
    catch (err) { alert('Error creando carpeta: ' + err.message); }
  };

  const onDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.name}"?${item.type === 'directory' ? '\n\n⚠ Eliminará todo el contenido de la carpeta.' : ''}`)) return;
    try { await Api.delete(item.path); reload(); }
    catch (err) { alert('Error eliminando: ' + err.message); }
  };

  const onClickItem = (item) => {
    if (item.type === 'directory') enterFolder(item);
    else if (isPreviewable(item) && !useMock) setPreview(item);
    else if (useMock) { alert('Modo demo · click en NAS real abrirá preview o descarga'); }
    else window.open(Api.downloadUrl(item.path), '_blank');
  };

  const visibleItems = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items;
  const folders = visibleItems.filter(i => i.type === 'directory');
  const files = visibleItems.filter(i => i.type === 'file');
  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);

  // Estado conexión inicial
  if (health === null) {
    return <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--ink-3)' }}>Verificando conexión NAS...</div>;
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      {/* Header con breadcrumbs + acciones */}
      <div className="card">
        <div className="card-h" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="hstack" style={{ gap: 4, flexWrap: 'wrap', fontSize: 13 }}>
              <button onClick={goRoot} className="tb-btn" style={{ fontSize: 11 }}>📁 {project.id}</button>
              {breadcrumbs.slice(1).map((seg, i) => {
                const partial = '/' + breadcrumbs.slice(0, i + 2).join('/');
                return (
                  <React.Fragment key={i}>
                    <span style={{ color: 'var(--ink-4)' }}>/</span>
                    <button onClick={() => setPath(partial)} className="tb-btn" style={{ fontSize: 11 }}>{seg}</button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="text-xs muted" style={{ marginTop: 4 }}>
              {useMock ? (
                <>
                  <span style={{ color: 'var(--warn-ink)', fontWeight: 600 }}>● Modo demo</span>
                  <span style={{ marginLeft: 6 }}>· datos simulados · </span>
                  <button onClick={retryRealNas} style={{ border: 'none', background: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}>Reconectar NAS</button>
                </>
              ) : (
                <>
                  <span style={{ color: 'var(--ok)' }}>● Conectado</span> · NAS {health.nas}
                </>
              )}
              {' · '}{folders.length} carpetas, {files.length} archivos · {fmtSize(totalSize)}
            </div>
          </div>
          <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ padding: '6px 10px', fontSize: 11, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', minWidth: 180 }} />
            {breadcrumbs.length > 1 && <button className="tb-btn" onClick={goUp} title="Subir nivel">↑ Subir</button>}
            <button className="tb-btn" onClick={reload} title="Recargar">↻</button>
            <button className="tb-btn" onClick={() => setShowMkdir(true)}>{Icon.plus ? Icon.plus({ size: 12 }) : '+'} Carpeta</button>
            <input ref={fileInputRef} type="file" onChange={onUpload} style={{ display: 'none' }} />
            <button className="tb-btn primary" onClick={() => fileInputRef.current?.click()}>{Icon.upload ? Icon.upload({ size: 12 }) : '⬆'} Subir archivo</button>
          </div>
        </div>

        {uploadProgress != null && (
          <div style={{ padding: '8px 16px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)' }}>
            <div className="hstack between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11 }}>Subiendo archivo... {(uploadProgress * 100).toFixed(0)}%</span>
            </div>
            <div className="pbar" style={{ height: 4 }}><span style={{ width: (uploadProgress * 100) + '%', background: 'var(--accent)' }} /></div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 16px', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 12, borderTop: '1px solid var(--line)' }}>
            ⚠ {error}
          </div>
        )}

        <div className="card-b" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Cargando...</div>
          ) : visibleItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>
              {search ? `Sin resultados para "${search}"` : 'Carpeta vacía · Sube tu primer archivo o crea una subcarpeta'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ background: 'var(--bg-sunken)' }}>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', width: 36 }}></th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nombre</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', width: 100 }}>Tamaño</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', width: 160 }}>Modificado</th>
                  <th style={{ padding: '8px 12px', width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.path} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                      onClick={() => onClickItem(item)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 18 }}>{fileIconOf(item)}</td>
                    <td style={{ padding: '8px 12px', fontWeight: item.type === 'directory' ? 600 : 500 }}>{item.name}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                      {item.type === 'directory' ? '—' : fmtSize(item.size)}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                      {item.lastModified ? new Date(item.lastModified).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                      <div className="hstack" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        {item.type === 'file' && (
                          <a className="tb-btn" href={NasApi.downloadUrl(item.path)} target="_blank" rel="noreferrer" title="Descargar" style={{ fontSize: 10 }}>{Icon.download ? Icon.download({ size: 11 }) : '⬇'}</a>
                        )}
                        <button className="tb-btn" onClick={() => onDelete(item)} title="Eliminar" style={{ fontSize: 10, color: 'var(--danger)' }}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {preview && <FilePreviewModal item={preview} onClose={() => setPreview(null)} />}
      {showMkdir && <MkdirModal parentPath={path} onCreate={onMkdir} onClose={() => setShowMkdir(false)} />}
    </div>
  );
}

// ───── Tree view de partidas extraídas del XML ─────
function PartidasTreeView({ partidas, totalDuration, rollup, avances, onEditPartida }) {
  const [expanded, setExpanded] = React.useState(() => new Set(partidas.filter(p => p.level <= 2).map(p => p.code)));
  const [q, setQ] = React.useState('');

  const toggle = (code) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };
  const expandAll = () => setExpanded(new Set(partidas.map(p => p.code)));
  const collapseAll = () => setExpanded(new Set(partidas.filter(p => p.level === 1).map(p => p.code)));

  // Tree visible · oculta hijos cuyos padres están collapsed
  const visible = React.useMemo(() => {
    const result = [];
    const ql = q.trim().toLowerCase();
    for (const p of partidas) {
      if (ql && !(p.name.toLowerCase().includes(ql) || p.code.includes(ql))) continue;
      // Si query activo, mostrar todos los matches; sino respetar expanded
      if (!ql) {
        // Verifica que todos los ancestros estén expanded
        if (p.level > 1) {
          let ancestorCode = p.parent;
          let ok = true;
          while (ancestorCode) {
            if (!expanded.has(ancestorCode)) { ok = false; break; }
            const ancestor = partidas.find(x => x.code === ancestorCode);
            ancestorCode = ancestor ? ancestor.parent : null;
          }
          if (!ok) continue;
        }
      }
      result.push(p);
    }
    return result;
  }, [partidas, expanded, q]);

  const hasChildren = (code) => partidas.some(p => p.parent === code);

  const totalDurDays = partidas.filter(p => p.level === 1).reduce((s, p) => s + (p.durationDays || 0), 0);
  const totalCost = partidas.filter(p => p.level === 1).reduce((s, p) => s + (p.budget || 0), 0);
  const totalReal = partidas.filter(p => p.level === 1).reduce((s, p) => s + ((rollup?.[p.code]?.realCost) || 0), 0);

  return (
    <div className="card">
      <div className="card-h" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3>Partidas del proyecto</h3>
          <div className="text-xs muted" style={{ marginTop: 2 }}>
            {partidas.length} partidas · {partidas.filter(p => p.level === 1).length} capítulos · Costo <strong style={{ color: 'var(--ink)' }}>{fmtPEN(totalCost)}</strong> · Real <strong style={{ color: 'var(--accent)' }}>{fmtPEN(totalReal)}</strong> ({totalCost > 0 ? ((totalReal / totalCost) * 100).toFixed(1) : '0.0'}%)
          </div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', pointerEvents: 'none' }}>{Icon.search({ size: 12 })}</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar partida o código..."
              style={{ padding: '6px 10px 6px 26px', fontSize: 11, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', minWidth: 220, outline: 'none' }} />
          </div>
          <button className="tb-btn" onClick={expandAll} style={{ fontSize: 11 }}>Expandir todo</button>
          <button className="tb-btn" onClick={collapseAll} style={{ fontSize: 11 }}>Colapsar todo</button>
        </div>
      </div>
      <div className="card-b" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead style={{ background: 'var(--bg-sunken)', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 110 }}>Código</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Descripción</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 120 }}>Presup.</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 130 }}>Avance</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 120 }}>Real</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 120 }}>Saldo</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 70 }}>Dur.</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: 'var(--ink-4)' }}>Sin partidas que coincidan</td></tr>
            )}
            {visible.map(p => {
              const isExp = expanded.has(p.code);
              const hasKids = hasChildren(p.code);
              const indent = (p.level - 1) * 16;
              const fontSize = p.level === 1 ? 12 : p.level === 2 ? 11.5 : 11;
              const fontWeight = p.level === 1 ? 700 : p.level === 2 ? 600 : 500;
              const bg = p.level === 1 ? 'var(--bg-sunken)' : p.level === 2 ? 'rgba(0,0,0,0.015)' : 'transparent';
              const color = p.level === 1 ? 'var(--ink)' : p.level === 2 ? 'var(--ink)' : 'var(--ink-2)';
              const r = rollup?.[p.code] || { avancePct: 0, realCost: 0, isLeaf: !hasKids };
              const isEditableLeaf = !hasKids && (p.budget || 0) > 0;
              const saldoVal = (p.budget || 0) - (r.realCost || 0);
              const pctClamped = Math.max(0, Math.min(100, r.avancePct || 0));
              const pctColor = pctClamped >= 100 ? 'var(--ok)' : pctClamped > 0 ? 'var(--accent)' : 'var(--ink-4)';
              const handleRowClick = () => {
                if (isEditableLeaf && onEditPartida) onEditPartida(p);
                else if (hasKids) toggle(p.code);
              };
              return (
                <tr key={p.code} style={{ borderBottom: '1px solid var(--line)', background: bg, cursor: (hasKids || isEditableLeaf) ? 'pointer' : 'default' }}
                    onClick={handleRowClick}
                    onMouseEnter={e => { if (isEditableLeaf) e.currentTarget.style.background = 'rgba(59,91,219,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = bg; }}
                    title={isEditableLeaf ? 'Click para registrar avance' : ''}>
                  <td style={{ padding: '6px 12px 6px ' + (12 + indent) + 'px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>
                    {hasKids && <span style={{ marginRight: 4, fontSize: 9, transform: isExp ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform .12s' }}>▶</span>}
                    {!hasKids && <span style={{ marginRight: 4, opacity: 0.3 }}>·</span>}
                    {p.code}
                  </td>
                  <td style={{ padding: '6px 12px', fontSize, fontWeight, color, textTransform: p.level === 1 ? 'uppercase' : 'none', letterSpacing: p.level === 1 ? '0.02em' : '0' }}>
                    {p.name}
                    {isEditableLeaf && avances?.[p.code] && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--accent)' }}>● editado</span>}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: p.budget > 0 ? 'var(--ink)' : 'var(--ink-4)', fontWeight: p.level <= 2 ? 600 : 500 }}>
                    {p.budget > 0 ? fmtPEN(p.budget) : '—'}
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    {p.budget > 0 ? (
                      <div className="hstack" style={{ gap: 6 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--bg-sunken)', borderRadius: 3, overflow: 'hidden', minWidth: 50 }}>
                          <div style={{ width: pctClamped + '%', height: '100%', background: pctColor, transition: 'width .25s' }} />
                        </div>
                        <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: pctColor, minWidth: 36, textAlign: 'right' }}>{pctClamped.toFixed(0)}%</span>
                      </div>
                    ) : <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>—</span>}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: r.realCost > 0 ? 'var(--accent)' : 'var(--ink-4)', fontWeight: p.level <= 2 ? 600 : 500 }}>
                    {r.realCost > 0 ? fmtPEN(r.realCost) : '—'}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: saldoVal < 0 ? 'var(--danger)' : 'var(--ink-3)', fontWeight: p.level <= 2 ? 600 : 500 }}>
                    {p.budget > 0 ? fmtPEN(saldoVal) : '—'}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                    {p.durationDays > 0 ? p.durationDays + 'd' : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GanttView({ project, ganttData, ganttLoading, ganttError }) {
  const { gantt } = ERP_DATA;
  const dayW = 8;
  const rowH = 34;
  const totalDays = 120;
  const today = 45;

  const groupColors = {
    'Preliminares': '#9A9A96',
    'Estructuras': 'var(--accent)',
    'Arquitectura': '#7C3AED',
    'Instalaciones': 'var(--warn)',
    'Cierre': 'var(--ok)',
    'default': 'var(--accent)',
  };

  // Modo real · usar GanttViewer global (mismo que módulo Cronograma)
  if (project.ganttFile && window.GanttViewer) {
    const cotizacionAdapter = {
      id: project.id,
      codigo: project.id,
      nombre: project.name,
      cliente: project.client,
      fechaInicio: project.startDate,
      fechaFin: project.endDate,
      duracionDias: Math.round((new Date(project.endDate) - new Date(project.startDate)) / 86400000),
      montoTotal: project.budget,
      tieneGantt: true,
      ganttSource: project.ganttFile,
      revision: 'rev03',
      status: 'En ejecución',
      sizeKB: 0,
    };
    return (
      <div style={{ marginTop: -8 }}>
        <window.GanttViewer
          cotizacion={cotizacionAdapter}
          data={ganttData}
          loading={ganttLoading}
          errorMsg={ganttError}
          onBack={null}
        />
      </div>
    );
  }

  // Si proyecto tiene ganttFile pero no parseado · loading/error
  if (project.ganttFile) {
    if (ganttLoading) {
      return <div className="card" style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>Cargando cronograma · {project.ganttFile}...</div>;
    }
    if (ganttError) {
      return <div className="card" style={{ padding: 20, color: 'var(--danger)', fontSize: 12 }}>⚠ {ganttError}</div>;
    }
  }

  // Fallback obsoleto · proyectos sin ganttFile (mock data)
  const baseLevel = ganttData?.tasks ? detectBaseLevel(ganttData.tasks) : 1;
  const realTasks = ganttData?.tasks?.filter(t => t.outlineLevel === baseLevel && t.name).slice(0, 40) || null;

  // Modo real · proyecto con MS Project XML
  if (realTasks && realTasks.length > 0) {
    const projectStart = ganttData.project?.startDate ? new Date(ganttData.project.startDate) : new Date(project.startDate);
    const projectEnd = ganttData.project?.finishDate ? new Date(ganttData.project.finishDate) : new Date(project.endDate);
    const totalProjectDays = Math.max(1, Math.round((projectEnd - projectStart) / 86400000));
    const todayDate = new Date('2026-04-26');
    const todayDayIdx = Math.max(0, Math.min(totalProjectDays, Math.round((todayDate - projectStart) / 86400000)));
    const dayWReal = Math.max(2, Math.min(8, 1200 / totalProjectDays));

    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 520, overflow: 'hidden' }}>
        <div className="card-h">
          <div>
            <h3>Cronograma de Ejecución · MS Project</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>
              {ganttData.tasks.length} tareas · {totalProjectDays} días · {project.ganttFile.split('/').pop()}
            </div>
          </div>
          <div className="hstack" style={{ gap: 12, fontSize: 11 }}>
            <span className="hstack"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} /> Avance</span>
            <span className="hstack"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--line-strong)' }} /> Plan</span>
            <span className="hstack"><span style={{ width: 2, height: 12, background: 'var(--danger)' }} /> Hoy</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: 280, borderRight: '1px solid var(--line)', background: 'var(--bg-sunken)', overflowY: 'auto' }}>
            {realTasks.map(t => (
              <div key={t.id} style={{ height: rowH, padding: '0 12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
                <span className="mono text-xs muted" style={{ width: 28, flexShrink: 0 }}>{t.outlineNumber}</span>
                <span className="truncate" title={t.name}>{t.name}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            <div style={{ width: totalProjectDays * dayWReal, position: 'relative', minWidth: '100%' }}>
              <div style={{ height: 30, background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)', display: 'flex', position: 'sticky', top: 0, zIndex: 5 }}>
                {Array.from({ length: Math.ceil(totalProjectDays / 30) }).map((_, m) => (
                  <div key={m} style={{ width: 30 * dayWReal, borderRight: '1px solid var(--line)', padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--ink-4)', textTransform: 'uppercase' }}>
                    Mes {m + 1}
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: todayDayIdx * dayWReal, width: 2, background: 'var(--danger)', zIndex: 4, opacity: 0.6 }} />
              {realTasks.map((t, i) => {
                const start = t.startDate ? Math.round((new Date(t.startDate) - projectStart) / 86400000) : 0;
                const dur = ((t.durationHours || 0) / 8) || 1;
                const progress = (t.percentComplete || 0) / 100;
                const color = t.critical ? 'var(--danger)' : 'var(--accent)';
                return (
                  <div key={t.id} style={{ position: 'absolute', top: 30 + i * rowH + 8, left: start * dayWReal, width: Math.max(2, dur * dayWReal), height: rowH - 16 }}>
                    <div style={{ position: 'absolute', inset: 0, background: color, opacity: 0.15, borderRadius: 4 }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: (progress * 100) + '%', background: color, borderRadius: 4 }} />
                    <div style={{ position: 'absolute', right: -42, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--ink-4)' }}>
                      {(progress * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modo mock · fallback proyectos sin ganttFile
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 450, overflow: 'hidden' }}>
      <div className="card-h">
        <h3>Cronograma de Ejecución</h3>
        <div className="hstack" style={{ gap: 12, fontSize: 11 }}>
          <span className="hstack"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} /> En curso</span>
          <span className="hstack"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--line-strong)' }} /> Planificado</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 220, borderRight: '1px solid var(--line)', background: 'var(--bg-sunken)', overflowY: 'auto' }}>
          {gantt.map(t => (
            <div key={t.id} style={{ height: rowH, padding: '0 12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--line)', fontSize: 11 }}>
              <span style={{ width: 3, height: 14, background: groupColors[t.group] || groupColors.default, borderRadius: 1, marginRight: 8 }} />
              <span className="truncate" title={t.name}>{t.name}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <div style={{ width: totalDays * dayW, height: '100%', position: 'relative' }}>
            <div style={{ height: 30, background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)', display: 'flex', position: 'sticky', top: 0, zIndex: 5 }}>
              {[0, 30, 60, 90].map(d => (
                <div key={d} style={{ width: 30 * dayW, borderRight: '1px solid var(--line)', padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--ink-4)', textTransform: 'uppercase' }}>
                  Mes {d/30 + 1}
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: today * dayW, width: 2, background: 'var(--danger)', zIndex: 4, opacity: 0.6 }} />
            {gantt.map((t, i) => (
              <div key={t.id} style={{ position: 'absolute', top: 30 + i * rowH + 8, left: t.start * dayW, width: t.dur * dayW, height: rowH - 16 }}>
                <div style={{ position: 'absolute', inset: 0, background: groupColors[t.group] || groupColors.default, opacity: 0.15, borderRadius: 4 }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: (t.progress * 100) + '%', background: groupColors[t.group] || groupColors.default, borderRadius: 4 }} />
                <div style={{ position: 'absolute', right: -45, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--ink-4)' }}>
                  {(t.progress * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IAInsightItem({ kind, title, body, index }) {
  const cfg = {
    alert:   { bg: 'var(--danger-soft)', fg: 'var(--danger-ink)', icon: Icon.warn },
    warn:    { bg: 'var(--warn-soft)',   fg: 'var(--warn-ink)',   icon: Icon.info },
    insight: { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)', icon: Icon.sparkle },
  }[kind];
  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 10, padding: 12, background: cfg.bg, borderRadius: 8, animationDelay: `${index * 0.06}s` }}>
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
  const { cashflow, partidas: partidasMock } = ERP_DATA;

  // Carga gantt + extrae partidas si proyecto tiene ganttFile
  const { data: ganttData, loading: ganttLoading, errorMsg: ganttError } = useProjectGanttData(p);
  const partidasFromGantt = React.useMemo(() => {
    if (!ganttData?.tasks?.length) return null;
    return extractPartidasFromTasks(ganttData.tasks, p.budget);
  }, [ganttData, p.budget]);

  // Si proyecto tiene ganttFile · usa partidas extraídas · sino fallback a mock
  const partidas = partidasFromGantt || partidasMock;
  const roots = partidas.filter(x => x.level === 1);
  const [tab, setTab] = _useState('resumen');

  // ── Avance editable + roll-up ───────────────────────────────
  const { avances, updateAvance, resetAvance } = useAvanceData(p.id);
  const rollup = React.useMemo(() => computeAvanceRollup(partidas, avances), [partidas, avances]);
  const [editingPartida, setEditingPartida] = _useState(null);
  const useGanttKpis = !!partidasFromGantt;

  // ── Valorizaciones ───────────────────────────────────────────
  const { valorizaciones, addValorizacion, removeValorizacion } = useValorizacionesData(p.id);
  const [showGenerarVal, setShowGenerarVal] = _useState(false);
  const [viewingVal, setViewingVal] = _useState(null);

  // ── Trabajadores · personal de obra ──────────────────────────
  const { trabajadores, addTrabajador, updateTrabajador, removeTrabajador, resetSeed: resetSeedTrab } = useTrabajadoresData(p.id);
  const [editingTrab, setEditingTrab] = _useState(null);

  // ── Curva S · estado de export + expanded ───────────────────
  const [curvaSExport, setCurvaSExport] = _useState(null);
  const [curvaSExpanded, setCurvaSExpanded] = _useState(null);

  // Leaves = partidas sin hijos
  const leafSet = React.useMemo(() => {
    const parents = new Set(partidas.map(x => x.parent).filter(Boolean));
    return partidas.filter(x => !parents.has(x.code));
  }, [partidas]);

  const bacReal = leafSet.reduce((s, x) => s + (x.budget || 0), 0); // BAC = Σ presupuesto hojas (= costoDirecto XML)
  const ejecutadoCalc = leafSet.reduce((s, x) => s + ((avances[x.code]?.realCost) || 0), 0); // AC
  const earnedValue = leafSet.reduce((s, x) => s + (x.budget || 0) * ((avances[x.code]?.avancePct || 0) / 100), 0); // EV
  const avanceFisicoCalc = bacReal > 0 ? (earnedValue / bacReal) * 100 : 0;
  const avanceFinancieroCalc = bacReal > 0 ? (ejecutadoCalc / bacReal) * 100 : 0;
  // EAC del CD (mismo régimen que XML · con IGV si igvEnXml)
  const eacCalc = (earnedValue > 0 && ejecutadoCalc > 0) ? bacReal * (ejecutadoCalc / earnedValue) : bacReal;

  // Utilidad correcta · contrato sector público Peru
  // Utilidad meta = pctUtilidad × CD sin IGV (lo presupuestado en oferta)
  // Utilidad real = utilidad meta ± ahorro/sobrecosto (deviación CD vs ejecutado)
  const cdSinIGV = p.costoDirectoSinIGV || (p.igvEnXml ? bacReal / 1.18 : bacReal);
  const utilidadMeta = cdSinIGV * (p.pctUtilidad || 0);
  const ggMeta = cdSinIGV * (p.pctGG || 0);
  const desvCDconIGV = bacReal - eacCalc; // positivo = ahorro · negativo = sobrecosto
  const desvCDsinIGV = p.igvEnXml ? desvCDconIGV / 1.18 : desvCDconIGV;
  const utilProyCalc = utilidadMeta + desvCDsinIGV;
  const utilMarginCalc = p.budget > 0 ? (utilProyCalc / p.budget) * 100 : 0;

  // Mock fallback (proyectos sin ganttFile)
  const contractualBudget = p.budget;
  const currentSpent = p.spent;
  const estRemainingCost = (p.budget * (1 - p.progressFisico)) * 1.05;
  const totalProjectedCost = currentSpent + estRemainingCost;
  const projectedUtility = contractualBudget - totalProjectedCost;
  const utilityMargin = (projectedUtility / contractualBudget) * 100;

  // Valores efectivos · usa cálculos reales si hay gantt + avances, sino mock
  const pctF  = useGanttKpis ? avanceFisicoCalc     : p.progressFisico  * 100;
  const pctFi = useGanttKpis ? avanceFinancieroCalc : p.progressFinanciero * 100;
  const ejecutadoVal = useGanttKpis ? ejecutadoCalc : p.spent;
  const utilidadVal  = useGanttKpis ? utilProyCalc  : projectedUtility;
  const utilMarginVal = useGanttKpis ? utilMarginCalc : utilityMargin;
  const saldo = p.budget - ejecutadoVal;
  const days  = Math.max(0, Math.round((new Date(p.endDate) - new Date('2026-04-18')) / 86400000));
  const riskCfg = { high: { c: 'var(--danger)', label: 'Alto', chip: 'red' }, medium: { c: 'var(--warn)', label: 'Medio', chip: 'amber' }, low: { c: 'var(--ok)', label: 'Bajo', chip: 'green' } }[p.risk];

  const TABS = [
    { key: 'resumen',  label: 'Resumen'      },
    { key: 'partidas', label: 'Partidas'     },
    { key: 'cronograma', label: 'Cronograma'   },
    { key: 'curva-s',  label: 'Curva S'      },
    { key: 'documentos', label: 'Documentos'  },
    { key: 'valorizaciones', label: 'Valorizaciones' + (valorizaciones.length > 0 ? ` (${valorizaciones.length})` : '') },
    { key: 'equipo',   label: 'Equipo'       },
    { key: 'finanzas', label: 'Finanzas'     },
    { key: 'ia',       label: '✦ Análisis IA' },
  ];

  const fmtCompact = (n) => {
    const a = Math.abs(n || 0);
    if (a >= 1e6) return 'S/ ' + (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return 'S/ ' + (n / 1e3).toFixed(1) + 'K';
    return fmtPEN(n);
  };
  const subContractual = useGanttKpis && p.costoDirecto
    ? `+ GG+U 20% + IGV 18%`
    : 'Monto contrato';

  const KPIS = [
    { lbl: 'Contrato', val: fmtCompact(p.budget), color: 'var(--ink)', sub: subContractual, fullVal: fmtPEN(p.budget) },
    { lbl: 'Costo directo', val: fmtCompact(useGanttKpis ? bacReal : (p.costoDirecto || 0)), color: 'var(--ink-2)', sub: useGanttKpis && p.igvEnXml ? `s/IGV ${fmtCompact(cdSinIGV)}` : 'Oferta XML', fullVal: fmtPEN(useGanttKpis ? bacReal : (p.costoDirecto || 0)) },
    { lbl: 'Ejecutado real', val: fmtCompact(ejecutadoVal), color: 'var(--accent)', sub: (bacReal > 0 ? ((ejecutadoVal / bacReal)*100).toFixed(1) : '0') + '% del CD', fullVal: fmtPEN(ejecutadoVal) },
    { lbl: 'Utilidad proyectada', val: fmtCompact(utilidadVal), color: utilidadVal < 0 ? 'var(--danger)' : 'var(--ok)', sub: `Margen ${utilMarginVal.toFixed(1)}%`, fullVal: fmtPEN(utilidadVal), trend: utilMarginVal > 5 ? 'Saludable' : 'Riesgo' },
    { lbl: 'Avance físico', val: pctF.toFixed(1) + '%', color: 'var(--accent)', progress: pctF, pColor: 'var(--accent)' },
    { lbl: 'Avance financiero', val: pctFi.toFixed(1) + '%', color: 'var(--warn-ink)', progress: pctFi, pColor: 'var(--warn)' },
    { lbl: 'Días restantes', val: p.status === 'Licitación' ? '—' : days + 'd', color: days < 30 ? 'var(--danger)' : days < 90 ? 'var(--warn-ink)' : 'var(--ink)', sub: p.endDate },
  ];

  return (
    <div className="ws-inner animate-fade-in">
      <div className="hstack" style={{ marginBottom: 16, gap: 6 }}>
        <button className="tb-btn" onClick={onBack}>{Icon.left({ size: 13 })} Proyectos</button>
        <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.id}</span>
      </div>

      <div className="page-h" style={{ marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hstack" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>{p.id}</span>
            <span className={'chip ' + (p.status === 'En ejecución' ? 'blue' : 'amber')}><span className="dot" />{p.status}</span>
            <span className={'chip ' + riskCfg.chip}>Riesgo {riskCfg.label}</span>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{p.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{p.client}</span><span style={{ color: 'var(--ink-4)' }}>·</span><span>{p.location}</span>
          </div>
        </div>
        <div className="hstack" style={{ gap: 6, flexShrink: 0 }}>
          <button className="tb-btn" onClick={() => setShowGenerarVal(true)}>{Icon.file ? Icon.file({ size: 13 }) : '📄'} Generar valorización</button>
          <button className="tb-btn primary" onClick={() => setTab('finanzas')}>{Icon.money({ size: 13 })} Control Financiero</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, marginBottom: 20 }}>
        {KPIS.map((k, i) => (
          <div key={k.lbl} className="card animate-fade-in" style={{ padding: '10px 12px', animationDelay: `${i * 0.04}s`, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={k.lbl}>{k.lbl}</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: k.color, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={k.fullVal || k.val}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 9.5, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={k.sub}>{k.sub}</div>}
            {k.progress != null && ( <div className="pbar" style={{ height: 4, marginTop: 6 }}><span className="animate-bar-grow" style={{ width: k.progress + '%', background: k.pColor, animationDelay: `${0.2 + i * 0.04}s` }} /></div> )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', color: tab === t.key ? 'var(--accent-ink)' : 'var(--ink-3)', borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, transition: 'color .15s, border-color .15s' }} >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-in">
        {tab === 'resumen' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="vstack" style={{ gap: 14 }}>
              <div className="card">
                <div className="card-h"><h3>Curva S — avance acumulado</h3><span className="hint">Ago 2025 – May 2026</span></div>
                <div className="card-b"><SCurveChart /></div>
              </div>
              <div className="card">
                <div className="card-h"><h3>Hitos del proyecto</h3><span className="chip blue">{HITOS.filter(h => !h.done).length} pendientes</span></div>
                <div className="card-b" style={{ padding: 0 }}>
                  {HITOS.map((h, i) => {
                    const dotC = h.done ? 'var(--ok)' : h.k === 'warn' ? 'var(--warn)' : h.k === 'green' ? 'var(--ok)' : 'var(--accent)';
                    return (
                      <div key={h.t} className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < HITOS.length - 1 ? '1px solid var(--line)' : 'none', opacity: h.done ? 0.6 : 1, animationDelay: `${i * 0.05}s` }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: h.done ? 'var(--ok)' : dotC, boxShadow: h.done ? 'none' : `0 0 6px ${dotC}88` }} />
                        <span style={{ width: 52, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, flexShrink: 0 }}>{h.d}</span>
                        <span style={{ fontSize: 12, flex: 1, textDecoration: h.done ? 'line-through' : 'none', color: h.done ? 'var(--ink-4)' : 'var(--ink)' }}>{h.t}</span>
                        {h.done ? <span className="chip green" style={{ fontSize: 9 }}>{Icon.check({ size: 10 })} Listo</span> : <span className={'chip ' + (h.k === 'warn' ? 'amber' : h.k === 'green' ? 'green' : 'blue')} style={{ fontSize: 9 }}>Pendiente</span> }
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="vstack" style={{ gap: 14 }}>
              <div className="card"><div className="card-h"><h3>Equipo asignado</h3><span className="hint">{TEAM.length} personas</span></div><div className="card-b vstack" style={{ gap: 10 }}>{TEAM.map((m, i) => ( <div key={m.name} className="hstack animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}><div style={{ width: 34, height: 34, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--mono)' }}>{m.ini}</div><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{m.name}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.role}</div></div></div> ))}</div></div>
              <div className="card"><div className="card-h"><h3>Alertas activas</h3><span className="chip blue">{Icon.sparkle({ size: 10 })} IA</span></div><div className="card-b vstack" style={{ gap: 8 }}>{IA_INSIGHTS.slice(0, 2).map((ins, i) => ( <IAInsightItem key={i} {...ins} index={i} /> ))}<button className="tb-btn" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }} onClick={() => setTab('ia')}>Ver análisis completo {Icon.right({ size: 11 })}</button></div></div>
            </div>
          </div>
        )}

        {tab === 'partidas' && (
          <PartidasTreeView
            partidas={partidas}
            totalDuration={p.endDate && p.startDate ? Math.round((new Date(p.endDate) - new Date(p.startDate)) / 86400000) : 0}
            rollup={rollup}
            avances={avances}
            onEditPartida={(partida) => setEditingPartida(partida)}
          />
        )}

        {tab === 'cronograma' && <GanttView project={p} ganttData={ganttData} ganttLoading={ganttLoading} ganttError={ganttError} />}

        {tab === 'curva-s' && (
          <CurvaSPanel
            project={p}
            partidas={partidas}
            avances={avances}
            onExport={(data, labelOf, today) => setCurvaSExport({ data, labelOf, today })}
            onExpand={(data, labelOf, today) => setCurvaSExpanded({ data, labelOf, today })}
          />
        )}

        {tab === 'documentos' && <DocumentosPanel project={p} />}

        {tab === 'valorizaciones' && (
          <ValorizacionesTab
            valorizaciones={valorizaciones}
            onView={(v) => setViewingVal(v)}
            onDelete={(num) => removeValorizacion(num)}
            onNew={() => setShowGenerarVal(true)}
          />
        )}

        {tab === 'finanzas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="vstack" style={{ gap: 14 }}>
              <div className="card">
                <div className="card-h"><h3>Análisis de Utilidad Proyectada</h3><span className="chip blue">{Icon.sparkle({ size: 10 })} Basado en Cotizaciones</span></div>
                <div className="card-b">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div className="vstack" style={{ gap: 4 }}>
                      <span className="muted text-xs uppercase mono">Presupuesto Contractual</span>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{fmtPEN(contractualBudget)}</span>
                    </div>
                    <div style={{ fontSize: 20, color: 'var(--line-strong)' }}>−</div>
                    <div className="vstack" style={{ gap: 4 }}>
                      <span className="muted text-xs uppercase mono">Costo Proyectado (EAC)</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>{fmtPEN(totalProjectedCost)}</span>
                    </div>
                    <div style={{ fontSize: 20, color: 'var(--line-strong)' }}>=</div>
                    <div className="vstack" style={{ gap: 4, alignItems: 'flex-end' }}>
                      <span className="muted text-xs uppercase mono">Utilidad Estimada</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ok)' }}>{fmtPEN(projectedUtility)}</span>
                    </div>
                  </div>

                  <div className="vstack" style={{ gap: 12 }}>
                    <div className="hstack between">
                      <span style={{ fontSize: 12 }}>Gastado Real (Pagado + Pendiente pago)</span>
                      <span className="mono" style={{ fontWeight: 600 }}>{fmtPEN(currentSpent)}</span>
                    </div>
                    <div className="pbar" style={{ height: 8 }}><span style={{ width: (currentSpent/totalProjectedCost*100) + '%', background: 'var(--accent)' }} /></div>
                    
                    <div className="hstack between">
                      <span style={{ fontSize: 12 }}>Estimado a Terminar (Cotizaciones y OC)</span>
                      <span className="mono" style={{ fontWeight: 600 }}>{fmtPEN(estRemainingCost)}</span>
                    </div>
                    <div className="pbar" style={{ height: 8 }}><span style={{ width: (estRemainingCost/totalProjectedCost*100) + '%', background: 'var(--warn)' }} /></div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-h"><h3>Flujo de caja — Histórico</h3></div>
                <div className="card-b"><CashflowChart data={cashflow} /></div>
              </div>
            </div>
            <div className="vstack" style={{ gap: 14 }}>
              <div className="card">
                <div className="card-h"><h3>Resumen de Márgenes</h3></div>
                <div className="card-b vstack" style={{ gap: 16 }}>
                  <div>
                    <div className="hstack between" style={{ marginBottom: 6 }}><span className="text-xs">Margen Bruto Meta</span><span className="strong">20.0%</span></div>
                    <div className="pbar"><span style={{ width: '20%', background: 'var(--line-strong)' }} /></div>
                  </div>
                  <div>
                    <div className="hstack between" style={{ marginBottom: 6 }}><span className="text-xs">Margen Proyectado Hoy</span><span className="strong" style={{ color: utilityMargin < 20 ? 'var(--warn-ink)' : 'var(--ok)' }}>{utilityMargin.toFixed(1)}%</span></div>
                    <div className="pbar"><span style={{ width: utilityMargin + '%', background: utilityMargin < 20 ? 'var(--warn)' : 'var(--ok)' }} /></div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4 }}>
                    {Icon.info({ size: 12 })} La desviación del <b>1.6%</b> respecto a la meta se debe principalmente al alza en el costo de la partida "Movimiento de Tierras".
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'equipo' && (
          <div className="vstack" style={{ gap: 24 }}>
            {/* Sección 1 · Equipo profesional */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Equipo profesional</h3>
                <span className="text-xs muted">Staff técnico y administrativo</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {[...TEAM, { name: 'Ing. Carlos Salcedo', role: 'Supervisor SSOMA', ini: 'CS', color: '#F59F00' }, { name: 'Ing. Diana Chávez', role: 'Control de calidad', ini: 'DC', color: '#0EA5B7' }].map((m, i) => (
                  <div key={m.name} className="card animate-card-in" style={{ padding: 16, animationDelay: `${i * 0.06}s` }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}><div style={{ width: 44, height: 44, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--mono)', flexShrink: 0 }}>{m.ini}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div><div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{m.role}</div></div></div>
                    <div style={{ display: 'flex', gap: 6 }}><span className="chip" style={{ fontSize: 9 }}>Activo</span><span className="chip blue" style={{ fontSize: 9 }}>{p.id}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección 2 · Personal de obra */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Personal de obra · Mano de obra</h3>
                <span className="text-xs muted">Construcción civil · CAPECO</span>
              </div>
              <TrabajadoresPanel
                trabajadores={trabajadores}
                project={p}
                onAdd={() => setEditingTrab({})}
                onEdit={(t) => setEditingTrab(t)}
                onDelete={(id) => removeTrabajador(id)}
                onResetSeed={resetSeedTrab}
              />
            </div>
          </div>
        )}

        {tab === 'ia' && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
            <div className="vstack" style={{ gap: 14 }}>
              <div className="card animate-fade-in"><div className="card-h"><h3>Diagnóstico general</h3><span className="chip blue">{Icon.sparkle({ size: 10 })} IA</span></div><div className="card-b"><div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}><div style={{ textAlign: 'center', flexShrink: 0 }}><div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 6px', background: `conic-gradient(${riskCfg.c} 0% 60%, var(--line) 60%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}><div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--bg-elev)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}><span style={{ fontSize: 14, fontWeight: 700, color: riskCfg.c, fontFamily: 'var(--mono)' }}>60</span></div></div><div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score riesgo</div></div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Proyecto con riesgo <span style={{ color: riskCfg.c }}>MEDIO</span></div><div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>Análisis proyectado indica que el margen podría caer si no se controla el costo de equipos en mayo.</div></div></div>{[ { lbl: 'Avance físico', val: 85, color: 'var(--ok)' }, { lbl: 'Control de costos', val: 52, color: 'var(--warn)' }, { lbl: 'Flujo de caja', val: 48, color: 'var(--warn)' }, { lbl: 'Cumplimiento SSOMA', val: 90, color: 'var(--ok)' }, ].map((d, i) => ( <div key={d.lbl} className="animate-fade-in" style={{ marginBottom: 10, animationDelay: `${i * 0.06}s` }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}><span style={{ color: 'var(--ink-2)' }}>{d.lbl}</span><span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: d.color }}>{d.val}%</span></div><div className="pbar" style={{ height: 6 }}><span className="animate-bar-grow" style={{ width: d.val + '%', background: d.color, animationDelay: `${0.15 + i * 0.06}s` }} /></div></div> ))}</div></div>
              <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}><div className="card-h"><h3>Insights y alertas</h3></div><div className="card-b vstack" style={{ gap: 8 }}>{IA_INSIGHTS.map((ins, i) => ( <IAInsightItem key={i} {...ins} index={i} /> ))}</div></div>
            </div>
            <div className="vstack" style={{ gap: 14 }}>
              <div className="card animate-fade-in" style={{ animationDelay: '0.08s' }}><div className="card-h"><h3>Acciones recomendadas</h3></div><div className="card-b vstack" style={{ gap: 10 }}>{[ { n: 1, text: 'Revisar cotizaciones de acabados para recuperar margen perdido en tierras.', urgent: true }, { n: 2, text: 'Consolidar OC luminarias LED con OB-2025-018.', urgent: false } ].map((rec, i) => ( <div key={rec.n} className="animate-fade-in" style={{ display: 'flex', gap: 10, padding: 10, background: rec.urgent ? 'var(--danger-soft)' : 'var(--bg-sunken)', borderRadius: 6, animationDelay: `${i * 0.06}s` }}><div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: rec.urgent ? 'var(--danger)' : 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)' }}>{rec.n}</div><span style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>{rec.text}</span></div> ))}</div></div>
            </div>
          </div>
        )}
      </div>

      {editingPartida && (
        <EditAvanceModal
          partida={editingPartida}
          current={avances[editingPartida.code]}
          onSave={(payload) => updateAvance(editingPartida.code, payload)}
          onClose={() => setEditingPartida(null)}
          onReset={() => resetAvance(editingPartida.code)}
        />
      )}

      {showGenerarVal && (
        <GenerarValorizacionModal
          project={p}
          partidas={partidas}
          avances={avances}
          valorizaciones={valorizaciones}
          onGenerate={(snap) => {
            const saved = addValorizacion(snap);
            setShowGenerarVal(false);
            setViewingVal(saved);
            setTab('valorizaciones');
          }}
          onClose={() => setShowGenerarVal(false)}
        />
      )}

      {editingTrab && (
        <EditTrabajadorModal
          trabajador={editingTrab}
          onSave={(form) => {
            if (editingTrab.id) updateTrabajador(editingTrab.id, form);
            else addTrabajador(form);
          }}
          onClose={() => setEditingTrab(null)}
          onDelete={editingTrab.id ? () => removeTrabajador(editingTrab.id) : null}
        />
      )}

      {curvaSExport && (
        <CurvaSPrintView
          data={curvaSExport.data}
          project={p}
          labelOf={curvaSExport.labelOf}
          today={curvaSExport.today}
          onClose={() => setCurvaSExport(null)}
        />
      )}

      {curvaSExpanded && (
        <CurvaSExpandedView
          data={curvaSExpanded.data}
          project={p}
          labelOf={curvaSExpanded.labelOf}
          today={curvaSExpanded.today}
          onExportPNG={() => exportCurvaSAsPNG(`curva-s-${p.id}-${new Date().toISOString().slice(0, 10)}.png`)}
          onClose={() => setCurvaSExpanded(null)}
        />
      )}

      {viewingVal && (
        <ValorizacionPrintView
          valorizacion={viewingVal}
          onClose={() => setViewingVal(null)}
        />
      )}
    </div>
  );
}

window.ProjectDetail = ProjectDetail;
