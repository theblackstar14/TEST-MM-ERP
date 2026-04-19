/* global React, Icon, ERP_DATA */
const { useState, useMemo } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

// Small sparkline
function Spark({ data, color = 'var(--accent)', h = 32 }) {
  const w = 120;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity="0.08" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function KPI({ lbl, val, cur, delta, deltaKind = 'pos', spark, sparkColor, active, onClick }) {
  return (
    <div className={'kpi' + (active ? ' active' : '')} onClick={onClick}>
      <div className="lbl">
        <span>{lbl}</span>
        {delta != null && <span className={'delta ' + deltaKind}>{delta}</span>}
      </div>
      <div className="val">
        {cur && <span className="cur">{cur}</span>}
        {val}
      </div>
      {spark && <div className="spark"><Spark data={spark} color={sparkColor} /></div>}
    </div>
  );
}

function Dashboard({ onDrillProject }) {
  const { projects } = ERP_DATA;
  const active = projects.filter(p => p.status === 'En ejecución');
  const totalBudget = active.reduce((s, p) => s + p.budget, 0);
  const totalSpent = active.reduce((s, p) => s + p.spent, 0);
  const avgProgress = active.reduce((s, p) => s + p.progressFisico, 0) / active.length;
  const deviation = ((totalSpent / (totalBudget * avgProgress)) - 1) * 100;
  const [selectedKpi, setSelectedKpi] = useState('cost');

  return (
    <div className="ws-inner">
      <div className="page-h">
        <div>
          <h1>Dashboard ejecutivo</h1>
          <div className="sub">Vista consolidada de obras en ejecución · MMHIGHMETRIK Engineers</div>
        </div>
        <div className="meta">
          <span>Período · Abril 2026</span>
          <span className="dot" />
          <span>Actualizado hace 4 min</span>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI
          lbl="Costo total activo"
          cur="S/"
          val={(totalBudget / 1000).toFixed(0) + 'K'}
          delta="+1.3%"
          deltaKind="pos"
          spark={[12, 18, 16, 24, 28, 32, 30, 38]}
          active={selectedKpi === 'cost'}
          onClick={() => setSelectedKpi('cost')}
        />
        <KPI
          lbl="Avance físico prom."
          val={(avgProgress * 100).toFixed(1) + '%'}
          delta="+3.2%"
          deltaKind="pos"
          spark={[8, 12, 18, 22, 30, 38, 48, 65]}
          sparkColor="var(--ok)"
          active={selectedKpi === 'progress'}
          onClick={() => setSelectedKpi('progress')}
        />
        <KPI
          lbl="Desviación presup."
          val={fmtPct(deviation)}
          delta="2 obras"
          deltaKind="warn"
          spark={[2, -1, 1, 3, -2, 4, 6, 3.2]}
          sparkColor="var(--warn)"
          active={selectedKpi === 'dev'}
          onClick={() => setSelectedKpi('dev')}
        />
        <KPI
          lbl="Margen bruto proy."
          val="18.4%"
          delta="−0.6pp"
          deltaKind="neg"
          spark={[22, 21, 19, 20, 19, 18.8, 18.6, 18.4]}
          sparkColor="var(--danger)"
          active={selectedKpi === 'margin'}
          onClick={() => setSelectedKpi('margin')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div className="card">
          <div className="card-h">
            <h3>Obras en ejecución · drill-down</h3>
            <div className="hstack" style={{ gap: 6 }}>
              <span className="hint">{active.length} activas</span>
              <button className="tb-btn" style={{ height: 26, fontSize: 11 }}>{Icon.filter({ size: 12 })}Filtros</button>
            </div>
          </div>
          <div className="card-b tight">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Código</th>
                  <th>Obra</th>
                  <th className="num-c">Presupuesto</th>
                  <th className="num-c">Ejecutado</th>
                  <th style={{ width: 160 }}>Avance físico / financiero</th>
                  <th style={{ width: 100 }} className="num-c">Desv.</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {active.map(p => (
                  <tr key={p.id} className="row-hover" style={{ cursor: 'pointer' }} onClick={() => onDrillProject(p.id)}>
                    <td><span className="mono text-xs" style={{ color: 'var(--ink-3)' }}>{p.id}</span></td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.client}</div>
                    </td>
                    <td className="num-c">{fmtPEN(p.budget)}</td>
                    <td className="num-c">{fmtPEN(p.spent)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div className="pbar"><span style={{ width: (p.progressFisico * 100) + '%', background: 'var(--accent)' }} /></div>
                        <div className="pbar"><span style={{ width: (p.progressFinanciero * 100) + '%', background: 'var(--warn)' }} /></div>
                        <div className="mono text-xs" style={{ color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>F {(p.progressFisico * 100).toFixed(0)}%</span>
                          <span>$ {(p.progressFinanciero * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="num-c">
                      <span className={'chip ' + (Math.abs(p.deviation) < 2 ? 'green' : p.deviation > 5 ? 'red' : p.deviation < -2 ? 'amber' : '')}>
                        {fmtPct(p.deviation)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink-4)' }}>{Icon.right({ size: 13 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="vstack" style={{ gap: 14 }}>
          <div className="card">
            <div className="card-h">
              <h3>Alertas del copiloto</h3>
              <span className="chip blue"><span style={{ color: 'var(--accent)' }}>{Icon.sparkle({ size: 10 })}</span>3 nuevas</span>
            </div>
            <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AlertItem kind="alert" title="Sobrecosto en Movimiento de tierras" body="OB-2025-021 — desviación +11.1%. Retroexcavadora cotizada S/ 18.50/m³, ejecutada S/ 22.90/m³." />
              <AlertItem kind="warn" title="Valorización V08 vencida hace 2 días" body="OB-2025-018 · cliente Logística Andina SAC — pendiente facturación S/ 156,000" />
              <AlertItem kind="insight" title="Oportunidad consolidación compra" body="Luminarias LED: combinar OC-2026-012 y OB-2025-018 reduce S/ 4,200 (−10.4%)." />
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Pipeline licitaciones</h3><span className="hint">9 activas</span></div>
            <div className="card-b" style={{ padding: 0 }}>
              <PipelineMini />
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <div className="card-h"><h3>Flujo de caja consolidado</h3><span className="hint">Últimos 8 meses · PEN</span></div>
          <div className="card-b"><CashflowChart /></div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Distribución de costos por partida</h3><span className="hint">OB-2025-021 · vigente</span></div>
          <div className="card-b"><CostBreakdown /></div>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ kind, title, body }) {
  const icon = kind === 'alert' ? Icon.warn : kind === 'warn' ? Icon.info : Icon.sparkle;
  const bg = kind === 'alert' ? 'var(--danger-soft)' : kind === 'warn' ? 'var(--warn-soft)' : 'var(--accent-soft)';
  const fg = kind === 'alert' ? 'var(--danger-ink)' : kind === 'warn' ? 'var(--warn-ink)' : 'var(--accent-ink)';
  return (
    <div style={{ display: 'flex', gap: 10, padding: 10, background: bg, borderRadius: 6 }}>
      <div style={{ color: fg, flexShrink: 0, marginTop: 1 }}>{icon({ size: 14 })}</div>
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 600, color: fg, marginBottom: 2 }}>{title}</div>
        <div style={{ color: 'var(--ink-2)', lineHeight: 1.45 }}>{body}</div>
      </div>
    </div>
  );
}

function PipelineMini() {
  const { bids } = ERP_DATA;
  const stages = ['Prospecto', 'Calificación', 'Propuesta', 'Negociación', 'Adjudicada'];
  const byStage = stages.map(s => bids.filter(b => b.stage === s));
  const totalByStage = byStage.map(arr => arr.reduce((s, b) => s + b.amount, 0));
  const maxTotal = Math.max(...totalByStage);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {stages.map((s, i) => (
        <div key={s} style={{ padding: '10px 14px', borderBottom: i < stages.length - 1 ? '1px solid var(--line)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 80, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s}</div>
          <div style={{ flex: 1, height: 18, background: 'var(--bg-sunken)', borderRadius: 3, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (totalByStage[i] / maxTotal * 100) + '%', background: i === 4 ? 'var(--ok)' : 'var(--accent)', opacity: 0.85, borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 10, color: '#fff', fontFamily: 'var(--mono)', fontWeight: 600 }}>{byStage[i].length}</div>
          </div>
          <div className="mono" style={{ width: 70, textAlign: 'right', fontSize: 11, color: 'var(--ink-2)' }}>{(totalByStage[i] / 1000).toFixed(0)}K</div>
        </div>
      ))}
    </div>
  );
}

function CashflowChart() {
  const { cashflow } = ERP_DATA;
  const w = 520, h = 180, pad = 28;
  const max = Math.max(...cashflow.map(c => Math.max(c.ingresos, c.egresos)));
  const bw = (w - pad * 2) / cashflow.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + (h - pad * 2) * t} y2={pad + (h - pad * 2) * t} stroke="var(--line)" strokeDasharray={i === 0 || i === 4 ? '0' : '2,3'} />
      ))}
      {cashflow.map((c, i) => {
        const x = pad + bw * i + bw * 0.1;
        const bw2 = bw * 0.35;
        const hIng = ((h - pad * 2) * c.ingresos) / max;
        const hEg = ((h - pad * 2) * c.egresos) / max;
        return (
          <g key={i}>
            <rect x={x} y={h - pad - hIng} width={bw2} height={hIng} fill="var(--accent)" rx="1" />
            <rect x={x + bw2 + 2} y={h - pad - hEg} width={bw2} height={hEg} fill="var(--warn)" rx="1" />
            <text x={x + bw2 + 1} y={h - 8} fontSize="9" textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--mono)">{c.month}</text>
          </g>
        );
      })}
      <g fontSize="9" fill="var(--ink-3)" fontFamily="var(--mono)">
        <text x={pad - 4} y={pad + 3} textAnchor="end">{(max / 1000).toFixed(0)}K</text>
        <text x={pad - 4} y={h - pad + 3} textAnchor="end">0</text>
      </g>
      <g transform={`translate(${pad + 6}, 10)`} fontSize="10" fontFamily="var(--sans)">
        <rect x="0" y="0" width="10" height="10" fill="var(--accent)" rx="1" />
        <text x="14" y="9" fill="var(--ink-2)">Ingresos</text>
        <rect x="70" y="0" width="10" height="10" fill="var(--warn)" rx="1" />
        <text x="84" y="9" fill="var(--ink-2)">Egresos</text>
      </g>
    </svg>
  );
}

function CostBreakdown() {
  const { partidas } = ERP_DATA;
  const roots = partidas.filter(p => p.level === 1);
  const total = roots.reduce((s, p) => s + p.budget, 0);
  const colors = ['var(--accent)', 'var(--warn)', '#2F7D5C', '#7C3AED', '#D1453B', '#0EA5B7', '#D97757', '#6B84E8'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {roots.map((p, i) => {
        const pct = (p.budget / total) * 100;
        const real = (p.real / p.budget) * 100;
        return (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 80px 60px', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{p.code}</span>
            <div>
              <div style={{ fontSize: 12, marginBottom: 3, color: 'var(--ink-2)' }}>{p.name.replace(/^[A-Z ]+— /, '')}</div>
              <div className="pbar" style={{ height: 6 }}>
                <span style={{ width: pct + '%', background: colors[i % colors.length] }} />
                <span className="p2" style={{ width: Math.min(pct * (real / 100), 100) + '%', background: colors[i % colors.length], opacity: 0.4 }} />
              </div>
            </div>
            <div className="num-c mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{fmtPEN(p.budget).replace('S/ ', '')}</div>
            <div className="num-c mono" style={{ fontSize: 11, color: real > 100 ? 'var(--danger)' : real > 80 ? 'var(--warn-ink)' : 'var(--ink-3)' }}>{real.toFixed(0)}%</div>
          </div>
        );
      })}
    </div>
  );
}

window.DashboardPage = Dashboard;
