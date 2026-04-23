/* global React, Icon, ERP_DATA, MiniStat */
const { useState, useMemo } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

// =================== COMPARADOR VERSIONES ===================
function ComparadorPage() {
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

window.ComparadorPage = ComparadorPage;
