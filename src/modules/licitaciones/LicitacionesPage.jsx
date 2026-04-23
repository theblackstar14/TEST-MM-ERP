/* global React, Icon, ERP_DATA */
const { useState, useMemo } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

// =================== LICITACIONES (Kanban) ===================
function LicitacionesPage() {
  const { bids } = ERP_DATA;
  const stages = [
    { id: 'Prospecto', color: 'var(--ink-3)' },
    { id: 'Calificación', color: 'var(--accent)' },
    { id: 'Propuesta', color: '#7C3AED' },
    { id: 'Negociación', color: 'var(--warn)' },
    { id: 'Adjudicada', color: 'var(--ok)' },
  ];
  const [drag, setDrag] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [filter, setFilter] = useState('all');

  const currentStage = (b) => overrides[b.id] || b.stage;
  const filtered = bids.filter(b => filter === 'all' ? true : b.owner === filter);

  const owners = [...new Set(bids.map(b => b.owner))];

  const totalPipeline = filtered.reduce((s, b) => s + b.amount, 0);
  const weighted = filtered.reduce((s, b) => s + b.amount * b.probability / 100, 0);
  const adjudicadas = filtered.filter(b => currentStage(b) === 'Adjudicada');

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>
      <div className="page-h">
        <div>
          <h1>Licitaciones</h1>
          <div className="sub">Pipeline de oportunidades · tablero kanban con movimientos en vivo</div>
        </div>
        <div className="hstack" style={{ gap: 8 }}>
          <button className="tb-btn"><span className="ico">{Icon.filter({ size: 13 })}</span>Filtros</button>
          <button className="tb-btn primary"><span className="ico">{Icon.plus({ size: 13 })}</span>Nueva licitación</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <LicMiniStat lbl="Pipeline total" val={'S/ ' + (totalPipeline / 1000).toFixed(0) + 'K'} sub={filtered.length + ' oportunidades'} />
        <LicMiniStat lbl="Ponderado (x prob.)" val={'S/ ' + (weighted / 1000).toFixed(0) + 'K'} sub="probabilidad × monto" />
        <LicMiniStat lbl="Adjudicadas abril" val={adjudicadas.length.toString()} sub={'S/ ' + (adjudicadas.reduce((s, b) => s + b.amount, 0) / 1000).toFixed(0) + 'K'} />
        <LicMiniStat lbl="Tasa de conversión" val="38%" sub="últimos 12 meses" />
      </div>

      <div className="hstack" style={{ marginBottom: 14, gap: 6 }}>
        <span className="text-xs muted" style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Responsable:</span>
        <button className={'tb-btn ' + (filter === 'all' ? 'primary' : '')} style={{ height: 26, fontSize: 11 }} onClick={() => setFilter('all')}>Todos</button>
        {owners.map(o => (
          <button key={o} className={'tb-btn ' + (filter === o ? 'primary' : '')} style={{ height: 26, fontSize: 11 }} onClick={() => setFilter(o)}>{o}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 12 }}>
        {stages.map(s => {
          const cards = filtered.filter(b => currentStage(b) === s.id);
          const total = cards.reduce((a, c) => a + c.amount, 0);
          return (
            <div
              key={s.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (drag) { setOverrides({ ...overrides, [drag]: s.id }); setDrag(null); } }}
              style={{ background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, padding: 10, minHeight: 300 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '2px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.id}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>{cards.length}</span>
                </div>
                <span className="mono text-xs muted">S/ {(total / 1000).toFixed(0)}K</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.map(b => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={() => setDrag(b.id)}
                    onDragEnd={() => setDrag(null)}
                    style={{
                      background: 'var(--bg-elev)',
                      border: '1px solid var(--line)',
                      borderRadius: 6,
                      padding: 10,
                      cursor: 'grab',
                      opacity: drag === b.id ? 0.5 : 1,
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="mono text-xs" style={{ color: 'var(--ink-3)', fontWeight: 500 }}>{b.id}</span>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--warn))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, fontFamily: 'var(--mono)' }}>{b.owner}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, lineHeight: 1.35 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>{b.client}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                      <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>{fmtPEN(b.amount).replace('S/ ', 'S/ ')}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 36, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                          <div style={{ width: b.probability + '%', height: '100%', background: s.color, borderRadius: 2 }} />
                        </div>
                        <span className="mono text-xs muted">{b.probability}%</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                      <span>{Icon.calendar({ size: 10 })}</span>
                      <span>{b.deadline}</span>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', fontStyle: 'italic' }}>arrastra aquí</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, padding: 12, background: 'var(--accent-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
        <span style={{ color: 'var(--accent)' }}>{Icon.sparkle({ size: 14 })}</span>
        <span style={{ color: 'var(--accent-ink)' }}>
          <strong>Copiloto:</strong> las oportunidades en <em>Propuesta</em> tienen 3 días para el cierre. Recomiendo priorizar LIC-2026-005 (S/ 780K, 65% prob.) — histórico de Interbank favorece propuestas rápidas.
        </span>
      </div>
    </div>
  );
}

function LicMiniStat({ lbl, val, sub }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>{lbl}</div>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

window.LicitacionesPage = LicitacionesPage;
window.LicMiniStat = LicMiniStat;
