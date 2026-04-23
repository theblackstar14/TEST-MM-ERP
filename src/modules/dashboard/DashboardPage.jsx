/* global React, Icon, ERP_DATA, echarts */
const { useState, useMemo, useEffect, useRef, useCallback } = React;
const { fmtPEN, fmtInt, fmtPct, fmtCompact } = ERP_DATA;

const getCssVar = (name) => {
  try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined; }
  catch { return undefined; }
};

// Generic wrapper: enter + exit animation para drill-downs.
// Mantiene children montados durante el cierre usando snapshot.
function AnimatedDrill({ show, children }) {
  const [rendered, setRendered] = useState(show);
  const [closing, setClosing] = useState(false);
  const lastChildren = useRef(children);

  if (show && children) lastChildren.current = children;

  useEffect(() => {
    if (show) {
      setRendered(true);
      setClosing(false);
    } else if (rendered) {
      setClosing(true);
      const t = setTimeout(() => { setRendered(false); setClosing(false); }, 260);
      return () => clearTimeout(t);
    }
  }, [show, rendered]);

  if (!rendered) return null;
  return (
    <div className={'drill-wrap ' + (closing ? 'closing' : 'opening')}>
      {show ? children : lastChildren.current}
    </div>
  );
}

// =================== DASHBOARD PRINCIPAL ===================
function DashboardPage({ onDrillProject }) {
  const { projects, cashflow, bids } = ERP_DATA;
  const [healthDrill, setHealthDrill] = useState(null);
  const [portfolioDrill, setPortfolioDrill] = useState(false);
  const [bidsDrill, setBidsDrill] = useState(false);
  const [forecastDrill, setForecastDrill] = useState(false);
  const [cashflowMode, setCashflowMode] = useState('mes'); // 'dia' | 'mes' | 'año' | 'total'
  const [cashflowDrill, setCashflowDrill] = useState(null); // { mode, periodKey, tab }

  const clearOtherDrills = () => { setPortfolioDrill(false); setBidsDrill(false); setHealthDrill(null); setForecastDrill(false); };

  // Ref estable — evita re-init de ECharts cuando el padre re-renderiza
  // (p.ej. al abrir/cerrar Copilot IA).
  const handleCashflowClick = useCallback((payload) => {
    setPortfolioDrill(false);
    setBidsDrill(false);
    setHealthDrill(null);
    setForecastDrill(false);
    setCashflowDrill(payload);
    setTimeout(() => {
      const el = document.getElementById('cashflow-drill');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }, []);

  // Calculate CPI/SPI logic
  const projectsWithHealth = useMemo(() => {
    return projects.map(p => {
      if (p.status === 'Licitación') return { ...p, cpi: 1, spi: 1, health: 'healthy' };
      const ev = p.budget * p.progressFisico;
      const ac = p.spent;
      const cpi = ac > 0 ? ev / ac : 1;
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      const totalDays = (end - start) / (1000 * 60 * 60 * 24);
      const daysPassed = (new Date('2026-04-18') - start) / (1000 * 60 * 60 * 24);
      const plannedProgress = Math.min(1, Math.max(0, daysPassed / totalDays));
      const pv = p.budget * plannedProgress;
      const spi = pv > 0 ? ev / pv : 1;
      let health = 'healthy';
      if (cpi < 0.85 || spi < 0.85) health = 'critical';
      else if (cpi < 0.95 || spi < 0.95) health = 'observation';
      return { ...p, cpi, spi, health };
    });
  }, [projects]);

  const stats = {
    critical: projectsWithHealth.filter(p => p.health === 'critical'),
    observation: projectsWithHealth.filter(p => p.health === 'observation'),
    healthy: projectsWithHealth.filter(p => p.health === 'healthy'),
  };

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent  = projects.reduce((s, p) => s + p.spent, 0);
  const avgProgress = projects.reduce((s, p) => s + p.progressFisico, 0) / projects.length;
  
  const activeBids = bids.filter(b => b.stage !== 'Adjudicada');
  const totalBidsAmount = activeBids.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="ws-inner">
      <div className="page-h">
        <div>
          <h1>Dashboard Operativo</h1>
          <div className="sub muted">Gestión de proyectos, finanzas y alertas críticas de obra</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <button className="tb-btn"><span className="ico">{Icon.calendar({ size: 13 })}</span>Abril 2026</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI
          lbl="Cartera total"
          val={fmtPEN(totalBudget)}
          sub="12 proyectos activos"
          trend="+4.2%" trendKind="pos"
          onClick={() => { const v = !portfolioDrill; clearOtherDrills(); setPortfolioDrill(v); }}
          active={portfolioDrill}
        />
        <div className="kpi" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px 8px', fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Salud (CPI/SPI)</div>
          <div style={{ display: 'flex', flex: 1 }}>
            <HealthSection label="Crítico" count={stats.critical.length} color="var(--danger)" bg="var(--danger-soft)" active={healthDrill === 'critical'} onClick={() => { const v = healthDrill === 'critical' ? null : 'critical'; clearOtherDrills(); setHealthDrill(v); }} />
            <HealthSection label="Observación" count={stats.observation.length} color="var(--warn-ink)" bg="var(--warn-soft)" active={healthDrill === 'observation'} onClick={() => { const v = healthDrill === 'observation' ? null : 'observation'; clearOtherDrills(); setHealthDrill(v); }} />
            <HealthSection label="Saludable" count={stats.healthy.length} color="var(--ok)" bg="var(--ok-soft)" active={healthDrill === 'healthy'} onClick={() => { const v = healthDrill === 'healthy' ? null : 'healthy'; clearOtherDrills(); setHealthDrill(v); }} />
          </div>
        </div>
        <KPI
          lbl="Avance físico prom."
          val={fmtPct(avgProgress * 100)}
          sub="Proyección Q2 · 78.4%"
          trend="Forecast"
          trendKind="pos"
          progress={avgProgress * 100}
          onClick={() => { const v = !forecastDrill; clearOtherDrills(); setForecastDrill(v); }}
          active={forecastDrill}
        />
        <KPI
          lbl="Licitaciones en curso"
          val={fmtPEN(totalBidsAmount)}
          sub={`${activeBids.length} procesos activos`}
          trend="En revisión"
          onClick={() => { const v = !bidsDrill; clearOtherDrills(); setBidsDrill(v); }}
          active={bidsDrill}
        />
      </div>

      {/* Cartera Drill-down */}
      <AnimatedDrill show={portfolioDrill}>
        <div className="card" style={{ marginBottom: 14, borderLeft: '4px solid var(--accent)' }}>
          <div className="card-h">
            <h3>Composición de Cartera Total</h3>
            <button className="tb-icon-btn" onClick={() => setPortfolioDrill(false)}>{Icon.x({ size: 12 })}</button>
          </div>
          <div className="card-b tight">
            <table>
              <thead>
                <tr><th>Proyecto / Fuente</th><th>Cliente</th><th className="num-c">Presupuesto PEN</th><th style={{ width: 140 }}>Distribución</th></tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className="row-hover">
                    <td><div style={{ fontWeight: 600 }}>{p.name}</div><div className="text-xs muted">{p.id}</div></td>
                    <td>{p.client}</td>
                    <td className="num-c mono">{fmtPEN(p.budget)}</td>
                    <td><div className="pbar" style={{ height: 6 }}><span style={{ width: (p.budget / totalBudget * 100) + '%', background: 'var(--accent)' }} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedDrill>

      {/* Licitaciones Drill-down */}
      <AnimatedDrill show={bidsDrill}>
        <div className="card" style={{ marginBottom: 14, borderLeft: '4px solid #7C3AED' }}>
          <div className="card-h">
            <h3>Pipeline de Licitaciones en curso</h3>
            <div className="hstack" style={{ gap: 8 }}>
              <span className="chip blue">{Icon.sparkle({ size: 10 })} IA Probability</span>
              <button className="tb-icon-btn" onClick={() => setBidsDrill(false)}>{Icon.x({ size: 12 })}</button>
            </div>
          </div>
          <div className="card-b tight">
            <table>
              <thead>
                <tr><th>Oportunidad</th><th>Cliente</th><th className="num-c">Monto PEN</th><th>Etapa</th><th style={{ width: 180 }}>Probabilidad</th></tr>
              </thead>
              <tbody>
                {activeBids.map(b => (
                  <tr key={b.id} className="row-hover">
                    <td><div style={{ fontWeight: 600 }}>{b.name}</div><div className="text-xs muted">{b.id}</div></td>
                    <td>{b.client}</td>
                    <td className="num-c mono">{fmtPEN(b.amount)}</td>
                    <td><span className="chip">{b.stage}</span></td>
                    <td><div className="hstack" style={{ gap: 10 }}><div className="pbar" style={{ flex: 1, height: 6 }}><span style={{ width: b.probability + '%', background: b.probability > 70 ? 'var(--ok)' : b.probability > 40 ? 'var(--warn)' : 'var(--danger)' }} /></div><span className="mono text-xs" style={{ fontWeight: 700, width: 35 }}>{b.probability}%</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedDrill>

      {/* Forecast Drill-down (ex "KPIs Operativos" modal, ahora inline) */}
      <AnimatedDrill show={forecastDrill}>
        <ForecastDrillDown onClose={() => setForecastDrill(false)} />
      </AnimatedDrill>

      {/* Health Drill-down */}
      <AnimatedDrill show={!!healthDrill}>
        {healthDrill && (
        <div className="card" style={{ marginBottom: 14, borderLeft: `4px solid ${healthDrill === 'critical' ? 'var(--danger)' : healthDrill === 'observation' ? 'var(--warn)' : 'var(--ok)'}` }}>
          <div className="card-h">
            <h3>Proyectos en estado: <span style={{ textTransform: 'capitalize' }}>{healthDrill}</span></h3>
            <button className="tb-icon-btn" onClick={() => setHealthDrill(null)}>{Icon.x({ size: 12 })}</button>
          </div>
          <div className="card-b tight">
            <table>
              <thead>
                <tr><th>Proyecto</th><th className="num-c">CPI</th><th className="num-c">SPI</th><th>Desviación</th><th>Responsable</th></tr>
              </thead>
              <tbody>
                {stats[healthDrill].map(p => (
                  <tr key={p.id} className="row-hover" onClick={() => onDrillProject(p.id)} style={{ cursor: 'pointer' }}>
                    <td><div style={{ fontWeight: 600 }}>{p.id}</div><div className="text-xs muted">{p.name}</div></td>
                    <td className="num-c mono">{p.cpi.toFixed(2)}</td>
                    <td className="num-c mono">{p.spi.toFixed(2)}</td>
                    <td><span className={'chip ' + (Math.abs(p.deviation) > 5 ? 'red' : 'green')}>{fmtPct(p.deviation)}</span></td>
                    <td>{p.manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </AnimatedDrill>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-h">
            <div className="hstack" style={{ gap: 10 }}>
              <h3>Flujo de Caja Consolidado</h3>
              <span className="chip blue" style={{ fontSize: 9 }}>{Icon.sparkle({ size: 9 })} Click para desglosar</span>
            </div>
            <div className="hstack" style={{ gap: 10 }}>
              <div className="tw-seg" style={{ height: 26 }}>
                {['dia', 'mes', 'año', 'total'].map(m => (
                  <button
                    key={m}
                    className={cashflowMode === m ? 'on' : ''}
                    disabled={m === 'dia'}
                    onClick={() => { if (m !== 'dia') { setCashflowMode(m); setCashflowDrill(null); } }}
                    title={m === 'dia' ? 'Requiere datos diarios (pendiente backend)' : ''}
                    style={{ fontSize: 10, padding: '0 10px', textTransform: 'capitalize', opacity: m === 'dia' ? 0.4 : 1, cursor: m === 'dia' ? 'not-allowed' : 'pointer' }}
                  >{m === 'dia' ? 'Día' : m === 'mes' ? 'Mes' : m === 'año' ? 'Año' : 'Total'}</button>
                ))}
              </div>
              <span className="hint">{cashflowMode === 'total' ? 'Acumulado' : cashflowMode === 'año' ? 'Por año' : 'Monto S/ por mes'}</span>
            </div>
          </div>
          <div className="card-b" style={{ height: 240 }}>
            <CashflowChart data={cashflow} mode={cashflowMode} onPointClick={handleCashflowClick} />
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Alertas de IA</h3><span className="chip blue">{Icon.sparkle({ size: 10 })} IA</span></div>
          <div className="card-b vstack" style={{ gap: 10 }}>
            <AlertItem kind="danger" t="OB-2025-021: Sobrecosto" d="Retroexcavadora superó tarifa base en +11%." />
            <AlertItem kind="warn" t="SEACE: 3 matches" d="Nuevas obras viales en Lima que calzan con perfil." />
            <AlertItem kind="info" t="OC-2026-010" d="Sodimac: materiales listos para despacho." />
          </div>
        </div>
      </div>

      {/* Cashflow Drill-down (click en punto del chart) */}
      <AnimatedDrill show={!!cashflowDrill}>
        <div id="cashflow-drill">
          {cashflowDrill && (
            <CashflowDrill
              drill={cashflowDrill}
              onChangeTab={(t) => setCashflowDrill(d => ({ ...d, tab: t }))}
              onClose={() => setCashflowDrill(null)}
            />
          )}
        </div>
      </AnimatedDrill>

      <div className="card">
        <div className="card-h">
          <h3>Estado de Proyectos</h3>
          <div className="hstack" style={{ gap: 8 }}>
            <div className="tb-search-wrap" style={{ width: 200, height: 28 }}>
              <span className="ico">{Icon.filter({ size: 12 })}</span>
              <input placeholder="Filtrar..." style={{ fontSize: 11 }} />
            </div>
          </div>
        </div>
        <div className="card-b tight">
          <table>
            <thead>
              <tr><th style={{ width: 100 }}>ID</th><th>Nombre del Proyecto</th><th style={{ width: 140 }}>Cliente</th><th style={{ width: 100 }}>Estado</th><th style={{ width: 120 }}>Presupuesto</th><th style={{ width: 140 }}>Avance físico</th><th style={{ width: 30 }}></th></tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="row-hover" style={{ cursor: 'pointer' }} onClick={() => onDrillProject(p.id)}>
                  <td className="mono text-xs muted">{p.id}</td>
                  <td><div style={{ fontWeight: 600 }}>{p.name}</div></td>
                  <td style={{ fontSize: 12 }}>{p.client}</td>
                  <td><span className={'chip ' + (p.status === 'En ejecución' ? 'blue' : 'amber')}>{p.status}</span></td>
                  <td className="num">{fmtPEN(p.budget)}</td>
                  <td><div className="hstack" style={{ gap: 8 }}><div className="pbar" style={{ flex: 1, height: 5 }}><span style={{ width: (p.progressFisico * 100) + '%', background: 'var(--accent)' }} /></div><span className="mono text-xs">{fmtPct(p.progressFisico * 100)}</span></div></td>
                  <td>{Icon.right({ size: 12 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// =================== FORECAST DRILL-DOWN (line Q1-Q4 + gauge) ===================
function ForecastDrillDown({ onClose }) {
  const lineRef = useRef(null);
  const gaugeRef = useRef(null);

  useEffect(() => {
    const charts = [];
    const accent = getCssVar('--accent') || '#3B5BDB';
    const danger = getCssVar('--danger') || '#D1453B';
    const ok = getCssVar('--ok') || '#2F7D5C';
    const warn = getCssVar('--warn') || '#F59F00';
    const line = getCssVar('--line') || '#E4E4DF';
    const ink3 = getCssVar('--ink-3') || '#6B6B68';
    const bgElev = getCssVar('--bg-elev') || '#FFFFFF';

    if (lineRef.current) {
      const c = echarts.init(lineRef.current);
      c.setOption({
        tooltip: {
          trigger: 'axis',
          backgroundColor: bgElev,
          borderColor: line,
          borderWidth: 1,
          textStyle: { fontSize: 11 },
          valueFormatter: (v) => v + '%',
        },
        legend: {
          data: ['Avance proyectado', 'Plan maestro'],
          bottom: 0,
          textStyle: { fontSize: 11, color: ink3 },
          itemWidth: 14, itemHeight: 8,
        },
        grid: { top: 16, right: 20, bottom: 36, left: 44 },
        xAxis: {
          type: 'category', boundaryGap: false,
          data: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027'],
          axisLine: { lineStyle: { color: line } },
          axisTick: { show: false },
          axisLabel: { fontSize: 10, color: ink3, fontFamily: 'JetBrains Mono' },
        },
        yAxis: {
          type: 'value', max: 100,
          axisLabel: { formatter: '{value}%', fontSize: 10, color: ink3, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: line, type: 'dashed' } },
        },
        series: [
          {
            name: 'Avance proyectado', type: 'line', smooth: true,
            data: [25, 62.5, 85, 98, 100],
            color: accent, lineStyle: { width: 2.5 }, symbol: 'circle', symbolSize: 6,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(59,91,219,0.22)' },
                { offset: 1, color: 'rgba(59,91,219,0)' },
              ]),
            },
          },
          {
            name: 'Plan maestro', type: 'line', smooth: true,
            data: [28, 70, 90, 100, 100],
            color: ink3, lineStyle: { width: 1.8, type: 'dashed' }, symbol: 'circle', symbolSize: 4,
          },
        ],
      });
      charts.push(c);
    }

    if (gaugeRef.current) {
      const c = echarts.init(gaugeRef.current);
      c.setOption({
        series: [{
          type: 'gauge',
          startAngle: 210, endAngle: -30,
          progress: { show: true, width: 10, roundCap: true, itemStyle: { color: ok } },
          axisLine: { lineStyle: { width: 10, color: [[1, line]] } },
          axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
          pointer: { show: false }, anchor: { show: false }, title: { show: false },
          detail: {
            valueAnimation: true, offsetCenter: [0, '-5%'],
            fontSize: 32, fontWeight: 700, formatter: '{value}%',
            color: ok, fontFamily: 'Inter',
          },
          data: [{ value: 92 }],
        }],
      });
      charts.push(c);
    }

    const onResize = () => charts.forEach(c => c.resize());
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); charts.forEach(c => c.dispose()); };
  }, []);

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
      <div className="card-h">
        <h3>Forecast Q2 · Proyección de avance y cierre</h3>
        <div className="hstack" style={{ gap: 8 }}>
          <span className="chip blue">{Icon.sparkle({ size: 10 })} Análisis predictivo MM·AI</span>
          <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 12 })}</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 0 }}>
        <div style={{ padding: 14, borderRight: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Curva de proyección anual</div>
          <div ref={lineRef} style={{ width: '100%', height: 260 }} />
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Probabilidad cierre Q2</div>
          <div ref={gaugeRef} style={{ width: '100%', height: 180 }} />
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.5, padding: '0 8px' }}>
            Cumplimiento proyectado del <b style={{ color: 'var(--ink)' }}>92%</b> al cierre del segundo trimestre según ritmo de valorización actual.
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthSection({ label, count, color, bg, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, border: 'none', background: active ? bg : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0', cursor: 'pointer', transition: 'background .2s', borderRight: label !== 'Saludable' ? '1px solid var(--line)' : 'none' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: color }}>{count}</div>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </button>
  );
}

function KPI({ lbl, val, sub, trend, trendKind, progress, onClick, active }) {
  return (
    <div className={'kpi' + (active ? ' active' : '')} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="lbl"><span>{lbl}</span>{trend && <span className={'trend ' + trendKind}>{trend}</span>}</div>
      <div className="val">{val}</div>
      {sub && <div className="sub">{sub}</div>}
      {progress != null && <div className="pbar" style={{ height: 4, marginTop: 8 }}><span style={{ width: progress + '%', background: 'var(--accent)' }} /></div>}
    </div>
  );
}

function AlertItem({ kind, t, d }) {
  const c = kind === 'danger' ? 'var(--danger)' : kind === 'warn' ? 'var(--warn)' : 'var(--accent)';
  return (
    <div className="hstack" style={{ gap: 10, padding: '4px 0' }}>
      <div style={{ width: 3, height: 28, background: c, borderRadius: 2 }} />
      <div style={{ minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{t}</div><div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d}</div></div>
    </div>
  );
}

function CashflowChart({ data, mode = 'mes', onPointClick }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const accent = getCssVar('--accent') || '#3B5BDB';
    const danger = getCssVar('--danger') || '#D1453B';
    const line = getCssVar('--line') || '#E4E4DF';
    const ink3 = getCssVar('--ink-3') || '#6B6B68';
    const bgElev = getCssVar('--bg-elev') || '#FFFFFF';

    const c = echarts.init(ref.current);

    let option;
    if (mode === 'total') {
      const totalIng = data.reduce((s, d) => s + d.ingresos, 0);
      const totalEg = data.reduce((s, d) => s + d.egresos, 0);
      option = {
        tooltip: {
          trigger: 'item', backgroundColor: bgElev, borderColor: line, borderWidth: 1,
          textStyle: { fontSize: 11 },
          formatter: (p) => `${p.name}<br/><b>${fmtCompact(p.value)}</b>`,
        },
        grid: { top: 28, right: 90, bottom: 18, left: 12, containLabel: true },
        xAxis: {
          type: 'value',
          axisLabel: { formatter: (v) => fmtCompact(v).replace('S/ ', ''), color: ink3, fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: line, type: 'dashed' } },
        },
        yAxis: {
          type: 'category', data: ['Egresos', 'Ingresos'],
          axisLabel: { color: ink3, fontSize: 12, fontWeight: 600 },
          axisLine: { lineStyle: { color: line } }, axisTick: { show: false },
        },
        series: [{
          type: 'bar', cursor: 'pointer',
          data: [
            { value: totalEg, itemStyle: { color: danger, borderRadius: [0, 4, 4, 0] } },
            { value: totalIng, itemStyle: { color: accent, borderRadius: [0, 4, 4, 0] } },
          ],
          barWidth: 28,
          label: {
            show: true, position: 'right',
            formatter: (p) => fmtCompact(p.value),
            fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700,
            color: ink3,
          },
        }],
      };
    } else {
      let chartData = data;
      if (mode === 'año') {
        const years = {};
        data.forEach(d => {
          const k = String(d.year);
          if (!years[k]) years[k] = { month: k, year: d.year, ingresos: 0, egresos: 0 };
          years[k].ingresos += d.ingresos;
          years[k].egresos += d.egresos;
        });
        chartData = Object.values(years);
      }
      option = {
        tooltip: {
          trigger: 'axis', backgroundColor: bgElev, borderColor: line, borderWidth: 1,
          textStyle: { fontSize: 11 }, valueFormatter: (v) => fmtCompact(v),
          axisPointer: { type: 'line', lineStyle: { color: accent, type: 'dashed' } },
        },
        legend: {
          data: ['Ingresos', 'Egresos'], top: 2, right: 8,
          icon: 'roundRect', itemWidth: 14, itemHeight: 8,
          textStyle: { fontSize: 11, color: ink3 },
        },
        grid: { top: 36, right: 24, bottom: 24, left: 12, containLabel: true },
        xAxis: {
          type: 'category', boundaryGap: mode === 'año',
          data: chartData.map(d => d.month),
          axisLine: { lineStyle: { color: line } }, axisTick: { show: false },
          axisLabel: { fontSize: 10, color: ink3, fontFamily: 'JetBrains Mono', hideOverlap: true, margin: 12 },
        },
        yAxis: {
          type: 'value',
          axisLabel: { fontSize: 10, color: ink3, fontFamily: 'JetBrains Mono', formatter: (v) => fmtCompact(v).replace('S/ ', '') },
          splitLine: { lineStyle: { color: line, type: 'dashed' } },
        },
        series: [
          {
            name: 'Ingresos', type: mode === 'año' ? 'bar' : 'line', smooth: true,
            data: chartData.map(d => d.ingresos), color: accent, cursor: 'pointer',
            lineStyle: { width: 2.5 }, symbol: 'circle', symbolSize: 8,
            barWidth: 28, itemStyle: mode === 'año' ? { color: accent, borderRadius: [4, 4, 0, 0] } : undefined,
            areaStyle: mode === 'año' ? undefined : {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(59,91,219,0.22)' },
                { offset: 1, color: 'rgba(59,91,219,0)' },
              ]),
            },
            emphasis: { scale: 1.4, focus: 'series' },
          },
          {
            name: 'Egresos', type: mode === 'año' ? 'bar' : 'line', smooth: true,
            data: chartData.map(d => d.egresos), color: danger, cursor: 'pointer',
            lineStyle: { width: 2.5, type: 'dashed' }, symbol: 'circle', symbolSize: 7,
            barWidth: 28, itemStyle: mode === 'año' ? { color: danger, borderRadius: [4, 4, 0, 0] } : undefined,
            emphasis: { scale: 1.4, focus: 'series' },
          },
        ],
      };
    }

    c.setOption(option, true);

    const onClick = (params) => {
      if (!onPointClick) return;
      if (mode === 'total') {
        onPointClick({ mode: 'total', periodKey: 'all', tab: params.dataIndex === 0 ? 'egresos' : 'ingresos' });
      } else {
        const tab = params.seriesName === 'Egresos' ? 'egresos' : 'ingresos';
        onPointClick({ mode, periodKey: params.name, tab });
      }
    };
    c.on('click', onClick);

    const onResize = () => c.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); c.dispose(); };
  }, [data, mode, onPointClick]);

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 220 }} />;
}

// =================== CASHFLOW DRILL-DOWN ===================
function CashflowDrill({ drill, onChangeTab, onClose }) {
  const { mode, periodKey, tab } = drill;
  const { cashflow } = ERP_DATA;
  const donutRef = useRef(null);
  const [categoryOpen, setCategoryOpen] = useState(null);

  const monthsInScope = useMemo(() => {
    if (mode === 'mes') return cashflow.filter(d => d.month === periodKey);
    if (mode === 'año') return cashflow.filter(d => String(d.year) === periodKey);
    return cashflow;
  }, [mode, periodKey, cashflow]);

  const entries = useMemo(() => {
    const key = tab === 'ingresos' ? 'detalleIng' : 'detalleEg';
    return monthsInScope.flatMap(m => (m[key] || []).map(e => ({ ...e, _month: m.month })));
  }, [monthsInScope, tab]);

  const total = entries.reduce((s, e) => s + e.monto, 0);
  const catKey = tab === 'ingresos' ? 'tipo' : 'categoria';
  const byCat = useMemo(() => {
    const agg = {};
    entries.forEach(e => { agg[e[catKey]] = (agg[e[catKey]] || 0) + e.monto; });
    return Object.entries(agg).sort((a, b) => b[1] - a[1]);
  }, [entries, catKey]);

  const periodLabel = mode === 'mes'
    ? periodKey
    : mode === 'año'
    ? 'Año ' + periodKey
    : 'Consolidado total (8 meses)';

  const accentColor = tab === 'ingresos' ? '#3B5BDB' : '#D1453B';
  const paletteIng = ['#3B5BDB', '#5B84F0', '#8FA3F0', '#B9C6F4'];
  const paletteEg = ['#D1453B', '#F59F00', '#7C3AED', '#0EA5B7', '#D97757', '#2F7D5C', '#9A9A96'];
  const palette = tab === 'ingresos' ? paletteIng : paletteEg;

  useEffect(() => {
    if (!donutRef.current || byCat.length === 0) return;
    const c = echarts.init(donutRef.current);
    const bgElev = getCssVar('--bg-elev') || '#FFFFFF';
    const ink3 = getCssVar('--ink-3') || '#6B6B68';
    c.setOption({
      tooltip: {
        trigger: 'item', backgroundColor: bgElev, borderColor: getCssVar('--line'), borderWidth: 1,
        textStyle: { fontSize: 11 },
        formatter: (p) => `<b>${p.name}</b><br/>${fmtCompact(p.value)} · ${p.percent}%`,
      },
      graphic: [
        { type: 'text', left: 'center', top: '38%', style: { text: 'Total', fontSize: 10, fill: ink3, fontFamily: 'JetBrains Mono', textAlign: 'center' } },
        { type: 'text', left: 'center', top: '48%', style: { text: fmtCompact(total), fontSize: 18, fontWeight: 700, fill: accentColor, fontFamily: 'Inter', textAlign: 'center' } },
      ],
      series: [{
        type: 'pie', radius: ['58%', '82%'], avoidLabelOverlap: true,
        cursor: 'pointer',
        itemStyle: { borderColor: bgElev, borderWidth: 2 },
        label: { show: false }, labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 6, itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.18)' } },
        data: byCat.map(([name, value], i) => ({
          name, value, itemStyle: { color: palette[i % palette.length] },
        })),
      }],
    });
    c.on('click', (params) => { if (params && params.name) setCategoryOpen(params.name); });
    const onResize = () => c.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); c.dispose(); };
  }, [byCat, tab, total]);

  return (
    <div className="card" style={{ borderLeft: `4px solid ${accentColor}` }}>
      <div className="card-h">
        <div className="hstack" style={{ gap: 10 }}>
          <h3>Flujo · {periodLabel}</h3>
          <span className="mono text-xs muted">{entries.length} movimientos</span>
        </div>
        <div className="hstack" style={{ gap: 8 }}>
          <div className="tw-seg" style={{ height: 28 }}>
            <button
              className={tab === 'ingresos' ? 'on' : ''}
              onClick={() => onChangeTab('ingresos')}
              style={{ fontSize: 11, padding: '0 12px', background: tab === 'ingresos' ? '#3B5BDB' : undefined, color: tab === 'ingresos' ? '#fff' : undefined }}
            >↑ Ingresos</button>
            <button
              className={tab === 'egresos' ? 'on' : ''}
              onClick={() => onChangeTab('egresos')}
              style={{ fontSize: 11, padding: '0 12px', background: tab === 'egresos' ? '#D1453B' : undefined, color: tab === 'egresos' ? '#fff' : undefined }}
            >↓ Egresos</button>
          </div>
          <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 12 })}</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 0 }}>
        <div style={{ borderRight: '1px solid var(--line)', maxHeight: 420, overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>{tab === 'ingresos' ? 'Cliente' : 'Proveedor'}</th>
                <th style={{ width: 110 }}>Proyecto</th>
                <th style={{ width: 110 }}>Comprobante</th>
                <th style={{ width: 74 }}>Fecha</th>
                <th className="num-c" style={{ width: 110 }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 28, color: 'var(--ink-4)' }}>Sin movimientos en este período</td></tr>
              )}
              {entries.map((e, i) => (
                <tr key={i} className="row-hover">
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{e.concepto}</div>
                    <div className="text-xs muted" style={{ marginTop: 1 }}>{e[catKey]}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{e.contraparte}</td>
                  <td><span className="mono text-xs" style={{ color: 'var(--ink-3)' }}>{e.proyecto}</span></td>
                  <td className="mono text-xs muted">{e.comprobante}</td>
                  <td className="mono text-xs muted">{e.fecha.slice(5)}</td>
                  <td className="num-c mono" style={{ fontWeight: 700, color: accentColor }}>{fmtPEN(e.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="hstack between">
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              Desglose por {tab === 'ingresos' ? 'tipo' : 'categoría'}
            </div>
            <span className="chip blue" style={{ fontSize: 9 }}>{Icon.sparkle({ size: 9 })} Click para detalle</span>
          </div>
          <div ref={donutRef} style={{ width: '100%', height: 180, cursor: 'pointer' }} />
          <div className="vstack" style={{ gap: 4 }}>
            {byCat.map(([name, value], i) => (
              <button
                key={name}
                onClick={() => setCategoryOpen(name)}
                className="hstack"
                style={{
                  gap: 8, fontSize: 11, padding: '4px 6px', background: 'transparent',
                  border: '1px solid transparent', borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                  transition: 'background .12s, border-color .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: palette[i % palette.length], flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                <span className="mono" style={{ color: 'var(--ink-3)', width: 36, textAlign: 'right' }}>{((value / total) * 100).toFixed(0)}%</span>
                <span className="mono" style={{ fontWeight: 600, width: 62, textAlign: 'right', color: 'var(--ink)' }}>{fmtCompact(value)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {categoryOpen && (
        <CashflowCategoryModal
          category={categoryOpen}
          tab={tab}
          periodLabel={periodLabel}
          accentColor={accentColor}
          tabTotal={total}
          entries={entries.filter(e => e[catKey] === categoryOpen)}
          onClose={() => setCategoryOpen(null)}
        />
      )}
    </div>
  );
}

// =================== CASHFLOW CATEGORY MODAL (deep drill) ===================
function CashflowCategoryModal({ category, tab, periodLabel, accentColor, tabTotal, entries, onClose: onCloseProp }) {
  const [q, setQ] = useState('');
  const [groupBy, setGroupBy] = useState('ninguno');
  const [sortBy, setSortBy] = useState('fecha-desc');
  const [expanded, setExpanded] = useState({});
  const [closing, setClosing] = useState(false);

  const onClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onCloseProp, 220);
  };

  const total = entries.reduce((s, e) => s + e.monto, 0);
  const pct = tabTotal > 0 ? (total / tabTotal) * 100 : 0;
  const avg = entries.length > 0 ? total / entries.length : 0;

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = entries;
    if (ql) {
      list = list.filter(e =>
        (e.concepto || '').toLowerCase().includes(ql) ||
        (e.contraparte || '').toLowerCase().includes(ql) ||
        (e.proyecto || '').toLowerCase().includes(ql) ||
        (e.comprobante || '').toLowerCase().includes(ql)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'monto-desc') return b.monto - a.monto;
      if (sortBy === 'monto-asc') return a.monto - b.monto;
      return (b.fecha || '').localeCompare(a.fecha || '');
    });
    return list;
  }, [entries, q, sortBy]);

  const grouped = useMemo(() => {
    if (groupBy === 'ninguno') return [{ key: 'all', label: null, items: filtered }];
    const key = groupBy === 'proyecto' ? 'proyecto' : 'contraparte';
    const groups = {};
    filtered.forEach(e => {
      const k = e[key] || '—';
      if (!groups[k]) groups[k] = { key: k, label: k, items: [] };
      groups[k].items.push(e);
    });
    return Object.values(groups).sort((a, b) => {
      const ta = a.items.reduce((s, e) => s + e.monto, 0);
      const tb = b.items.reduce((s, e) => s + e.monto, 0);
      return tb - ta;
    });
  }, [filtered, groupBy]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={'modal-overlay' + (closing ? ' closing' : '')} onClick={onClose}>
      <div
        className={'modal-box animate-fade-in' + (closing ? ' closing' : '')}
        style={{ width: 860, maxWidth: '96vw', padding: 0, overflow: 'hidden', borderLeft: `4px solid ${accentColor}` }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--line)' }}>
          <div className="hstack between" style={{ marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {tab === 'ingresos' ? 'Tipo de ingreso' : 'Categoría de egreso'} · {periodLabel}
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{category}</h2>
            </div>
            <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 14 })}</button>
          </div>
          <div className="hstack" style={{ gap: 28 }}>
            <StatBlock label="Total" val={fmtPEN(total)} color={accentColor} />
            <StatBlock label={`% del ${tab}`} val={pct.toFixed(1) + '%'} />
            <StatBlock label="Movimientos" val={String(entries.length)} />
            <StatBlock label="Ticket promedio" val={fmtCompact(avg)} />
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)' }}>
          <div className="hstack" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div className="tb-search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 'none' }}>
              <span className="ico">{Icon.search({ size: 13 })}</span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar concepto, proyecto, contraparte, comprobante…" />
            </div>
            <div className="tw-seg" style={{ height: 30 }}>
              <button className={groupBy === 'ninguno' ? 'on' : ''} onClick={() => setGroupBy('ninguno')} style={{ fontSize: 11, padding: '0 10px' }}>Sin agrupar</button>
              <button className={groupBy === 'proyecto' ? 'on' : ''} onClick={() => setGroupBy('proyecto')} style={{ fontSize: 11, padding: '0 10px' }}>Proyecto</button>
              <button className={groupBy === 'contraparte' ? 'on' : ''} onClick={() => setGroupBy('contraparte')} style={{ fontSize: 11, padding: '0 10px' }}>{tab === 'ingresos' ? 'Cliente' : 'Proveedor'}</button>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ height: 30, border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', padding: '0 8px', fontSize: 11, color: 'var(--ink-2)' }}
            >
              <option value="fecha-desc">↓ Fecha reciente</option>
              <option value="monto-desc">↓ Mayor monto</option>
              <option value="monto-asc">↑ Menor monto</option>
            </select>
          </div>
        </div>

        <div style={{ maxHeight: '54vh', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 12 }}>
              {q ? `Sin resultados para "${q}"` : 'Sin movimientos'}
            </div>
          )}
          {grouped.map(g => {
            const isUngrouped = g.label === null;
            const many = g.items.length > 10;
            const isExpanded = !!expanded[g.key];
            const visible = many && !isExpanded ? g.items.slice(0, 5) : g.items;
            const gTotal = g.items.reduce((s, e) => s + e.monto, 0);
            return (
              <div key={g.key}>
                {!isUngrouped && (
                  <div style={{ padding: '8px 22px', background: 'var(--bg-elev)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 2 }}>
                    <div className="hstack" style={{ gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{g.label}</span>
                      <span className="chip" style={{ fontSize: 10 }}>{g.items.length} mov.</span>
                    </div>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>{fmtPEN(gTotal)}</span>
                  </div>
                )}
                {visible.map((e, i) => (
                  <EntryRow key={g.key + '-' + i} entry={e} tab={tab} accentColor={accentColor} />
                ))}
                {many && !isExpanded && (
                  <button
                    onClick={() => setExpanded(p => ({ ...p, [g.key]: true }))}
                    style={{ width: '100%', padding: '10px 22px', fontSize: 11, fontWeight: 600, background: 'transparent', border: 'none', color: accentColor, cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--line)' }}
                  >
                    Ver {g.items.length - 5} movimientos más →
                  </button>
                )}
                {many && isExpanded && (
                  <button
                    onClick={() => setExpanded(p => ({ ...p, [g.key]: false }))}
                    style={{ width: '100%', padding: '10px 22px', fontSize: 11, fontWeight: 600, background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--line)' }}
                  >
                    ↑ Colapsar grupo
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elev)' }}>
          <span className="text-xs muted">
            Mostrando {filtered.length} de {entries.length} movimientos
          </span>
          <div className="hstack" style={{ gap: 8 }}>
            <button className="tb-btn" title="Pendiente backend">{Icon.download({ size: 13 })} Exportar CSV</button>
            <button className="tb-btn primary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, val, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--ink)', letterSpacing: '-0.01em' }}>{val}</div>
    </div>
  );
}

function EntryRow({ entry, tab, accentColor }) {
  return (
    <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.concepto}</div>
        <div className="hstack" style={{ gap: 6, fontSize: 11, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
          <span>{entry.contraparte}</span>
          <span style={{ color: 'var(--ink-4)' }}>·</span>
          <span className="mono" style={{ padding: '1px 6px', borderRadius: 3, background: 'var(--bg-sunken)', fontSize: 10, color: 'var(--ink-2)' }}>{entry.proyecto}</span>
          <span style={{ color: 'var(--ink-4)' }}>·</span>
          <span className="mono" style={{ fontSize: 10 }}>{entry.comprobante}</span>
          <span style={{ color: 'var(--ink-4)' }}>·</span>
          <span className="mono" style={{ fontSize: 10 }}>{entry.fecha}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: accentColor }}>{fmtPEN(entry.monto)}</div>
      </div>
    </div>
  );
}

window.DashboardPage = DashboardPage;
window.CashflowChart = CashflowChart;
window.CashflowDrill = CashflowDrill;
window.CashflowCategoryModal = CashflowCategoryModal;
window.AnimatedDrill = AnimatedDrill;
