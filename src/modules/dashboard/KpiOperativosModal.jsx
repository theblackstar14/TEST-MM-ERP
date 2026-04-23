/* global React, echarts, Icon, ERP_DATA */
const { useState, useEffect, useRef, useMemo } = React;

/**
 * Componente: KpiOperativosModal
 * Dashboard avanzado centrado en Proyecciones Trimestrales (Q1-Q4) y Salud Operativa.
 */
function KpiOperativosModal({ open, onClose }) {
  if (!open) return null;

  const { projects } = ERP_DATA;
  const activeProjects = projects.filter(p => p.status === 'En ejecución');
  
  // --- Estado de Filtros ---
  const [selectedProjectId, setSelectedProjectId] = useState('all'); 
  const [timeRange, setTimeRange] = useState('quarterly'); // '30d' | 'quarterly'

  // --- Lógica de Datos Dinámicos ---
  const kpiData = useMemo(() => {
    const isGlobal = selectedProjectId === 'all';
    
    // 1. Métricas con enfoque en Proyección
    let metrics = [];
    if (isGlobal) {
      const avgPhysical = activeProjects.reduce((s, p) => s + p.progressFisico, 0) / activeProjects.length;
      const totalBudget = activeProjects.reduce((s, p) => s + p.budget, 0);
      const totalSpent = activeProjects.reduce((s, p) => s + p.spent, 0);
      const cpi = (totalBudget * avgPhysical) / totalSpent;

      metrics = [
        { name: 'Proyección Cierre Q2', val: '78.4', unit: '%', status: 'ok', desc: 'Estimado global Jun 2026' },
        { name: 'Eficiencia (CPI)', val: cpi.toFixed(2), unit: '', status: cpi < 0.9 ? 'warn' : 'ok', desc: 'Desempeño de costo' },
        { name: 'Variación Proyectada', val: '3.2', unit: '%', status: 'ok', desc: 'Desvío final estimado' },
        { name: 'Q3 Forecast', val: 'S/ 4.2M', unit: '', status: 'ok', desc: 'Volumen de obra proyectado' },
        { name: 'Proyectos en Riesgo', val: activeProjects.filter(p => p.risk === 'high').length, unit: '', status: 'danger', desc: 'Requieren intervención' },
        { name: 'SPI (Plazo) Prom.', val: '0.92', unit: '', status: 'ok', desc: 'Schedule Performance' },
      ];
    } else {
      const p = activeProjects.find(x => x.id === selectedProjectId);
      const cpi = (p.budget * p.progressFisico) / p.spent;
      metrics = [
        { name: 'Proyección Final', val: '100', unit: '%', status: 'ok', desc: 'Cierre estimado en fecha' },
        { name: 'Gasto Proyectado', val: (p.budget * 1.05 / 1000).toFixed(0), unit: 'K', status: 'warn', desc: 'Inversión total al cierre' },
        { name: 'Margen Q2', val: '18.2', unit: '%', status: 'ok', desc: 'Utilidad neta proyectada' },
        { name: 'Hitos Pendientes', val: `${p.hitosTotal - p.hitos}`, unit: '', status: 'warn', desc: 'Para cumplir Q2' },
        { name: 'CPI (Costo)', val: cpi.toFixed(2), unit: '', status: cpi < 0.9 ? 'danger' : 'ok', desc: 'Indice actual' },
        { name: 'Días p/ Cierre Q2', val: '74', unit: 'd', status: 'ok', desc: 'Al 30 de Junio' },
      ];
    }

    // 2. Evolución Trimestral (Mock)
    const dates = ['Q1 2026', 'Q2 2026 (Actual)', 'Q3 2026', 'Q4 2026', 'Q1 2027'];
    const physical = [25, 62.5, 85, 98, 100];
    const planned = [28, 70, 90, 100, 100];

    return { metrics, evolution: { dates, physical, planned }, isGlobal };
  }, [selectedProjectId, activeProjects]);

  // --- ECharts Logic ---
  const lineRef = useRef(null);
  const sankeyRef = useRef(null);
  const gaugeRef = useRef(null);

  useEffect(() => {
    const charts = [];

    // A) Evolución Trimestral
    if (lineRef.current) {
      const chart = echarts.init(lineRef.current);
      chart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 0, shadowBlur: 10 },
        legend: { data: ['Avance Real/Proyectado', 'Plan Maestros'], bottom: 0 },
        grid: { top: '10%', left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: kpiData.evolution.dates },
        yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
        series: [
          { name: 'Avance Real/Proyectado', type: 'line', smooth: true, data: kpiData.evolution.physical, lineStyle: { width: 4 }, color: '#3B5BDB', areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(59, 91, 219, 0.2)' }, { offset: 1, color: 'rgba(59, 91, 219, 0)' }]) } },
          { name: 'Plan Maestros', type: 'line', smooth: true, data: kpiData.evolution.planned, lineStyle: { width: 2, type: 'dashed' }, color: '#9A9A96' }
        ]
      });
      charts.push(chart);
    }

    // B) Sankey
    if (sankeyRef.current && kpiData.isGlobal) {
      const chart = echarts.init(sankeyRef.current);
      const totalB = activeProjects.reduce((s, p) => s + p.budget, 0);
      chart.setOption({
        series: [{
          type: 'sankey',
          layout: 'none',
          emphasis: { focus: 'adjacency' },
          data: [
            { name: 'Presupuesto Total', itemStyle: { color: '#1C1C1C' } },
            { name: 'Costo Directo', itemStyle: { color: '#F59F00' } },
            { name: 'Gastos Generales', itemStyle: { color: '#3B5BDB' } },
            { name: 'Utilidad Meta', itemStyle: { color: '#2F7D5C' } },
            ...activeProjects.map(p => ({ name: p.id, itemStyle: { color: '#eee' } }))
          ],
          links: [
            { source: 'Presupuesto Total', target: 'Costo Directo', value: totalB * 0.75 },
            { source: 'Presupuesto Total', target: 'Gastos Generales', value: totalB * 0.10 },
            { source: 'Presupuesto Total', target: 'Utilidad Meta', value: totalB * 0.15 },
            ...activeProjects.map(p => ({ source: 'Costo Directo', target: p.id, value: p.budget * 0.75 }))
          ],
          lineStyle: { color: 'gradient', curveness: 0.5 }
        }]
      });
      charts.push(chart);
    }

    // C) Gauge
    if (gaugeRef.current) {
      const chart = echarts.init(gaugeRef.current);
      chart.setOption({
        series: [{
          type: 'gauge',
          startAngle: 200, endAngle: -20,
          progress: { show: true, width: 8 },
          axisLine: { lineStyle: { width: 8 } },
          axisTick: { show: false }, splitLine: { show: false },
          axisLabel: { show: false }, pointer: { show: false },
          anchor: { show: false }, title: { show: false },
          detail: { valueAnimation: true, offsetCenter: [0, '0%'], fontSize: 24, fontWeight: '800', formatter: '{value}%', color: 'inherit' },
          data: [{ value: 92 }],
          color: [[0.3, '#D1453B'], [0.7, '#F59F00'], [1, '#2F7D5C']]
        }]
      });
      charts.push(chart);
    }

    const resizeHandler = () => charts.forEach(c => c.resize());
    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('resize', resizeHandler);
      charts.forEach(c => c.dispose());
    };
  }, [open, kpiData, activeProjects]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1001 }}>
      <div className="modal-box" style={{ width: '1200px', maxWidth: '96vw', padding: 0, overflow: 'hidden', background: '#fff' }} onClick={e => e.stopPropagation()}>
        
        {/* --- Header --- */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#fff' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Proyecciones Operativas (Forecast Q1-Q4)
            </h2>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Análisis predictivo de cierre y salud operativa de ingeniería</div>
          </div>

          <div className="hstack" style={{ gap: 12 }}>
            <div className="vstack" style={{ gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Filtro de Obra</label>
              <select 
                value={selectedProjectId} 
                onChange={e => setSelectedProjectId(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--line)', background: 'var(--bg-sunken)', fontSize: 12, fontWeight: 600, minWidth: 220 }}
              >
                <option value="all">🌐 Consolidado Proyectado (Activas)</option>
                <optgroup label="Seguimiento por Obra">
                  {activeProjects.map(p => <option key={p.id} value={p.id}>{p.id} · {p.name.split('—')[0]}</option>)}
                </optgroup>
              </select>
            </div>
            <button className="tb-icon-btn" onClick={onClose} style={{ marginTop: 18 }}>{Icon.x({ size: 18 })}</button>
          </div>
        </div>

        {/* --- Dashboard Content --- */}
        <div style={{ padding: '24px', background: 'var(--bg)', maxHeight: '82vh', overflowY: 'auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 20 }}>
            {kpiData.metrics.map(k => (
              <div key={k.name} className="card animate-fade-in" style={{ padding: '16px', border: 'none', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, bottom: 0, background: `var(--${k.status})` }} />
                <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{k.name}</div>
                <div className="hstack" style={{ alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 800 }}>{k.val}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{k.unit}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 6 }}>{k.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="card" style={{ padding: 0 }}>
              <div className="card-h">
                <h3>Curva de Proyección Anual (Q1-Q4)</h3>
                <div className="hstack" style={{ gap: 8 }}>
                  <span className="chip blue">Forecast Real</span>
                  <span className="chip">Línea Base</span>
                </div>
              </div>
              <div ref={lineRef} style={{ width: '100%', height: '350px', padding: '10px' }} />
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-h"><h3>Probabilidad de Cierre Q2</h3></div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div ref={gaugeRef} style={{ width: '100%', height: '200px' }} />
                <div style={{ textAlign: 'center', padding: '0 20px 20px' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    Se proyecta un cumplimiento del <b>92%</b> para el cierre del segundo trimestre basándose en el ritmo de valorización actual.
                  </div>
                </div>
              </div>
            </div>

            {kpiData.isGlobal && (
              <div className="card" style={{ gridColumn: 'span 3' }}>
                <div className="card-h"><h3>Distribución de Inversión Proyectada</h3></div>
                <div ref={sankeyRef} style={{ width: '100%', height: '300px' }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {Icon.sparkle({ size: 14 })} Análisis predictivo MM·AI · Datos de Supabase Real-time
          </div>
          <button className="tb-btn primary" onClick={onClose}>Cerrar Forecast</button>
        </div>
      </div>
    </div>
  );
}

window.KpiOperativosModal = KpiOperativosModal;
