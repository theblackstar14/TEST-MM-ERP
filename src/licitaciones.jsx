/* global React, Icon, ERP_DATA */
const { useState, useMemo } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

// =================== LICITACIONES (Kanban) ===================
function Licitaciones() {
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
        <MiniStat lbl="Pipeline total" val={'S/ ' + (totalPipeline / 1000).toFixed(0) + 'K'} sub={filtered.length + ' oportunidades'} />
        <MiniStat lbl="Ponderado (x prob.)" val={'S/ ' + (weighted / 1000).toFixed(0) + 'K'} sub="probabilidad × monto" />
        <MiniStat lbl="Adjudicadas abril" val={adjudicadas.length.toString()} sub={'S/ ' + (adjudicadas.reduce((s, b) => s + b.amount, 0) / 1000).toFixed(0) + 'K'} />
        <MiniStat lbl="Tasa de conversión" val="38%" sub="últimos 12 meses" />
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

function MiniStat({ lbl, val, sub }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>{lbl}</div>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// =================== COMPARADOR VERSIONES ===================
function Comparador() {
  const { versions, partidas } = ERP_DATA;
  const [left, setLeft] = useState('v1');
  const [right, setRight] = useState('v4');
  const vL = versions.find(v => v.id === left);
  const vR = versions.find(v => v.id === right);

  // Mock: generate slight deltas between versions
  const mkVals = (mult) => partidas.filter(p => p.level <= 2).map(p => ({ ...p, val: Math.round(p.budget * mult * (0.95 + Math.random() * 0.1)) }));
  const leftVals = useMemo(() => mkVals(vL.total / (vR.total || vL.total)), [left]);
  const rightVals = useMemo(() => mkVals(1), [right]);

  const rows = partidas.filter(p => p.level <= 2).map(p => {
    const l = leftVals.find(x => x.id === p.id);
    const r = rightVals.find(x => x.id === p.id);
    const delta = r.val - l.val;
    const pct = l.val ? (delta / l.val) * 100 : 0;
    return { ...p, l: l.val, r: r.val, delta, pct };
  });

  const totalL = rows.filter(p => p.level === 1).reduce((s, p) => s + p.l, 0);
  const totalR = rows.filter(p => p.level === 1).reduce((s, p) => s + p.r, 0);

  return (
    <div className="ws-inner wide" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Comparador de versiones</h1>
            <div className="sub muted">OB-2025-021 · histórico completo del presupuesto</div>
          </div>
          <div className="hstack" style={{ gap: 12 }}>
            <div className="vstack" style={{ gap: 3 }}>
              <label style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Versión A</label>
              <select value={left} onChange={e => setLeft(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 200 }}>
                {versions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ color: 'var(--ink-4)', paddingBottom: 6 }}>{Icon.arrowR({ size: 16 })}</div>
            <div className="vstack" style={{ gap: 3 }}>
              <label style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Versión B</label>
              <select value={right} onChange={e => setRight(e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 200 }}>
                {versions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 18, marginTop: 16 }}>
          <VersionCard v={vL} label="A" total={totalL} />
          <VersionCard v={vR} label="B" total={totalR} />
          <MiniStat lbl="Δ Total" val={fmtPEN(totalR - totalL).replace('S/ ', 'S/ ')} sub={fmtPct((totalR / totalL - 1) * 100) + ' vs A'} />
          <MiniStat lbl="Partidas modificadas" val="14" sub="de 31 partidas" />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-elev)' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Código</th>
              <th>Descripción</th>
              <th style={{ width: 140 }} className="num-c">{vL.label.split(' — ')[0]} · S/</th>
              <th style={{ width: 140 }} className="num-c">{vR.label.split(' — ')[0]} · S/</th>
              <th style={{ width: 220 }}>Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const isGroup = p.level === 1;
              const maxDelta = Math.max(...rows.map(r => Math.abs(r.delta)));
              const barW = Math.abs(p.delta) / maxDelta * 100;
              return (
                <tr key={p.id} className="row-hover" style={{ background: isGroup ? 'var(--bg-sunken)' : 'transparent' }}>
                  <td style={{ paddingLeft: (p.level - 1) * 14 + 10 }}>
                    <span className="mono text-xs" style={{ color: isGroup ? 'var(--ink)' : 'var(--ink-3)', fontWeight: isGroup ? 600 : 500 }}>{p.code}</span>
                  </td>
                  <td style={{ fontWeight: isGroup ? 600 : 400 }}>{p.name}</td>
                  <td className="num-c">{p.l.toLocaleString('es-PE')}</td>
                  <td className="num-c" style={{ fontWeight: 500 }}>{p.r.toLocaleString('es-PE')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 18, position: 'relative', background: 'var(--bg-sunken)', borderRadius: 2 }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'var(--line-strong)' }} />
                        <div style={{
                          position: 'absolute',
                          top: 1, bottom: 1,
                          ...(p.delta >= 0 ? { left: '50%', width: (barW / 2) + '%' } : { right: '50%', width: (barW / 2) + '%' }),
                          background: p.delta > 0 ? 'var(--danger)' : p.delta < 0 ? 'var(--ok)' : 'var(--line)',
                          borderRadius: 2,
                          opacity: 0.85,
                        }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 600, width: 70, textAlign: 'right', color: p.delta > 0 ? 'var(--danger)' : p.delta < 0 ? 'var(--ok)' : 'var(--ink-3)' }}>
                        {p.delta >= 0 ? '+' : ''}{p.delta.toLocaleString('es-PE')}
                      </span>
                      <span className="mono" style={{ fontSize: 10, width: 50, textAlign: 'right', color: 'var(--ink-3)' }}>{p.pct >= 0 ? '+' : ''}{p.pct.toFixed(1)}%</span>
                    </div>
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

function VersionCard({ v, label, total }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span className="chip blue">{label}</span>
        <span className="mono text-xs muted">{v.date}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{v.label}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>{v.author}</div>
      <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--mono)' }}>{fmtPEN(total)}</div>
    </div>
  );
}

window.LicitacionesPage = Licitaciones;
window.ComparadorPage = Comparador;
