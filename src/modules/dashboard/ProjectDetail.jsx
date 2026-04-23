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
function GanttView({ project }) {
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
  };

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
              <span style={{ width: 3, height: 14, background: groupColors[t.group], borderRadius: 1, marginRight: 8 }} />
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
                <div style={{ position: 'absolute', inset: 0, background: groupColors[t.group], opacity: 0.15, borderRadius: 4 }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: (t.progress * 100) + '%', background: groupColors[t.group], borderRadius: 4 }} />
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
  const { cashflow, partidas } = ERP_DATA;
  const roots = partidas.filter(x => x.level === 1);
  const [tab, setTab] = _useState('resumen');

  // MOCK LOGIC FOR UTILITY (Margen Proyectado)
  const contractualBudget = p.budget;
  const currentSpent = p.spent;
  // Estimated cost to finish (Spent + expected expenses from quotes/pending work)
  const estRemainingCost = (p.budget * (1 - p.progressFisico)) * 1.05; // +5% buffer
  const totalProjectedCost = currentSpent + estRemainingCost;
  const projectedUtility = contractualBudget - totalProjectedCost;
  const utilityMargin = (projectedUtility / contractualBudget) * 100;

  const pctF  = p.progressFisico  * 100;
  const pctFi = p.progressFinanciero * 100;
  const saldo = p.budget - p.spent;
  const days  = Math.max(0, Math.round((new Date(p.endDate) - new Date('2026-04-18')) / 86400000));
  const riskCfg = { high: { c: 'var(--danger)', label: 'Alto', chip: 'red' }, medium: { c: 'var(--warn)', label: 'Medio', chip: 'amber' }, low: { c: 'var(--ok)', label: 'Bajo', chip: 'green' } }[p.risk];

  const TABS = [
    { key: 'resumen',  label: 'Resumen'      },
    { key: 'partidas', label: 'Partidas'     },
    { key: 'cronograma', label: 'Cronograma'   },
    { key: 'equipo',   label: 'Equipo'       },
    { key: 'finanzas', label: 'Finanzas'     },
    { key: 'ia',       label: '✦ Análisis IA' },
  ];

  const KPIS = [
    { lbl: 'Presupuesto contractual', val: fmtPEN(p.budget), color: 'var(--ink)', sub: 'Monto de contrato' },
    { lbl: 'Ejecutado real', val: fmtPEN(p.spent), color: 'var(--accent)', sub: ((p.spent / p.budget)*100).toFixed(1) + '% gastado' },
    { lbl: 'Utilidad proyectada', val: fmtPEN(projectedUtility), color: projectedUtility < 0 ? 'var(--danger)' : 'var(--ok)', sub: `Margen: ${utilityMargin.toFixed(1)}%`, trend: utilityMargin > 15 ? 'Saludable' : 'Riesgo' },
    { lbl: 'Avance físico', val: pctF.toFixed(0) + '%', color: 'var(--accent)', progress: pctF, pColor: 'var(--accent)' },
    { lbl: 'Avance financiero', val: pctFi.toFixed(0) + '%', color: 'var(--warn-ink)', progress: pctFi, pColor: 'var(--warn)' },
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
          <button className="tb-btn primary" onClick={() => setTab('finanzas')}>{Icon.money({ size: 13 })} Control Financiero</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {KPIS.map((k, i) => (
          <div key={k.lbl} className="card animate-fade-in" style={{ padding: '12px 14px', animationDelay: `${i * 0.04}s` }}>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{k.lbl}</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: k.color, lineHeight: 1.1 }}>{k.val}</div>
            {k.sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>{k.sub}</div>}
            {k.progress != null && ( <div className="pbar" style={{ height: 4, marginTop: 8 }}><span className="animate-bar-grow" style={{ width: k.progress + '%', background: k.pColor, animationDelay: `${0.2 + i * 0.04}s` }} /></div> )}
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
          <div className="card">
            <div className="card-h"><h3>Partidas — ejecución vs presupuesto</h3><span className="hint">Nivel superior · {roots.length} partidas</span></div>
            <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {roots.map((r, i) => {
                const pctReal = (r.real / r.budget) * 100;
                const bc = pctReal > 100 ? 'var(--danger)' : pctReal > 80 ? 'var(--warn)' : 'var(--accent)';
                return (
                  <div key={r.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="hstack between" style={{ marginBottom: 6 }}>
                      <div className="hstack"><span className="mono text-xs muted">{r.code}</span><span style={{ fontSize: 12, fontWeight: 500 }}>{r.name.replace(/^[A-Z ]+— /, '')}</span>{r.ai && <span className={'ai-hint ' + r.aiKind}>{r.ai}</span>}</div>
                      <div className="hstack"><span className="mono text-xs muted">{fmtPEN(r.real).replace('S/ ','S/')} / {fmtPEN(r.budget).replace('S/ ','S/')}</span><span className={'chip ' + (pctReal > 100 ? 'red' : pctReal > 80 ? 'amber' : pctReal > 0 ? 'blue' : '')}>{pctReal.toFixed(0)}%</span></div>
                    </div>
                    <div className="pbar" style={{ height: 8 }}><span className="animate-bar-grow" style={{ width: Math.min(pctReal, 100) + '%', background: bc, animationDelay: `${0.1 + i * 0.04}s` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'cronograma' && <GanttView project={p} />}

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {[...TEAM, { name: 'Ing. Carlos Salcedo', role: 'Supervisor SSOMA', ini: 'CS', color: '#F59F00' }, { name: 'Ing. Diana Chávez', role: 'Control de calidad', ini: 'DC', color: '#0EA5B7' }].map((m, i) => (
              <div key={m.name} className="card animate-card-in" style={{ padding: 16, animationDelay: `${i * 0.06}s` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}><div style={{ width: 44, height: 44, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--mono)', flexShrink: 0 }}>{m.ini}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div><div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{m.role}</div></div></div>
                <div style={{ display: 'flex', gap: 6 }}><span className="chip" style={{ fontSize: 9 }}>Activo</span><span className="chip blue" style={{ fontSize: 9 }}>{p.id}</span></div>
              </div>
            ))}
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
    </div>
  );
}

window.ProjectDetail = ProjectDetail;
