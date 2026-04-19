/* global React, Icon, ERP_DATA */
const { useState, useMemo } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

function Presupuesto() {
  const { partidas } = ERP_DATA;
  const [expanded, setExpanded] = useState(new Set(['01', '02', '02.01', '02.02', '03', '03.01']));
  const [selected, setSelected] = useState('02.01.02');
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(() => {
    const m = {};
    partidas.forEach(p => { m[p.id] = { qty: p.qty, unitPrice: p.unitPrice }; });
    return m;
  });

  const visible = useMemo(() => {
    return partidas.filter(p => {
      if (!p.parent) return true;
      let cur = p.parent;
      while (cur) {
        if (!expanded.has(cur)) return false;
        const parent = partidas.find(x => x.id === cur);
        cur = parent?.parent;
      }
      return true;
    });
  }, [expanded]);

  const total = partidas.filter(p => p.level === 1).reduce((s, p) => s + p.budget, 0);
  const totalReal = partidas.filter(p => p.level === 1).reduce((s, p) => s + p.real, 0);

  const toggleExpand = (id) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  const hasChildren = (id) => partidas.some(p => p.parent === id);

  return (
    <div className="ws-inner wide" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono text-xs" style={{ color: 'var(--ink-3)' }}>OB-2025-021</span>
              <span className="chip blue"><span className="dot" />v4 Vigente</span>
              <span className="chip">En ejecución</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Presupuesto — Remodelación oficinas San Isidro</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tb-btn"><span className="ico">{Icon.history({ size: 13 })}</span>Ver versiones</button>
            <button className="tb-btn"><span className="ico">{Icon.download({ size: 13 })}</span>Exportar</button>
            <button className="tb-btn primary"><span className="ico">{Icon.plus({ size: 13 })}</span>Nueva partida</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
          <Stat label="Total presupuesto" value={fmtPEN(total)} />
          <Stat label="Ejecutado" value={fmtPEN(totalReal)} delta={fmtPct((totalReal / total - 1) * 100)} deltaKind={totalReal > total ? 'neg' : 'pos'} />
          <Stat label="Partidas" value={fmtInt(partidas.length)} sub="8 grupos · 31 items" />
          <Stat label="Margen proyectado" value="18.4%" delta="−0.6pp" deltaKind="neg" />
          <div style={{ flex: 1 }} />
          <div className="tb-search-wrap" style={{ maxWidth: 260 }}>
            <span className="ico">{Icon.search({ size: 14 })}</span>
            <input placeholder="Buscar partida o código…" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-elev)' }}>
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th style={{ width: 90 }}>Código</th>
                <th>Descripción</th>
                <th style={{ width: 50 }}>Ud.</th>
                <th style={{ width: 80 }} className="num-c">Cantidad</th>
                <th style={{ width: 90 }} className="num-c">P. unit. S/</th>
                <th style={{ width: 110 }} className="num-c">Presupuesto</th>
                <th style={{ width: 110 }} className="num-c">Real</th>
                <th style={{ width: 90 }} className="num-c">Desv.</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const isGroup = p.level === 1;
                const isSubgroup = p.level === 2 && hasChildren(p.id);
                const isLeaf = !hasChildren(p.id);
                const isSelected = selected === p.id;
                const dev = p.budget ? ((p.real / p.budget) - 1) * 100 : 0;
                const ai = p.ai;
                const v = values[p.id] || {};
                return (
                  <tr
                    key={p.id}
                    className="row-hover"
                    onClick={() => setSelected(p.id)}
                    style={{
                      background: isSelected ? 'var(--accent-soft)' : isGroup ? 'var(--bg-sunken)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ paddingLeft: (p.level - 1) * 14 + 6, width: 30 }}>
                      {hasChildren(p.id) ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpand(p.id); }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', padding: 2, cursor: 'pointer' }}
                        >
                          {expanded.has(p.id) ? Icon.down({ size: 12 }) : Icon.right({ size: 12 })}
                        </button>
                      ) : <span style={{ display: 'inline-block', width: 14 }} />}
                    </td>
                    <td style={{ paddingLeft: (p.level - 1) * 14 + 8 }}>
                      <span className="mono text-xs" style={{ color: isGroup ? 'var(--ink)' : 'var(--ink-3)', fontWeight: isGroup ? 600 : 500 }}>{p.code}</span>
                    </td>
                    <td style={{ fontWeight: isGroup ? 600 : isSubgroup ? 500 : 400, color: isGroup ? 'var(--ink)' : 'var(--ink-2)', textTransform: isGroup ? 'none' : 'none', letterSpacing: isGroup ? '-0.005em' : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{p.name}</span>
                        {ai && (
                          <span className={'ai-hint ' + (p.aiKind || 'insight')}>
                            {Icon.sparkle({ size: 10 })}{ai}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{p.unit || '—'}</td>
                    <td className="num-c" onClick={(e) => { if (isLeaf) { e.stopPropagation(); setEditing(p.id + ':qty'); } }} style={{ cursor: isLeaf ? 'text' : 'default', position: 'relative' }}>
                      {editing === p.id + ':qty' ? (
                        <input
                          autoFocus
                          defaultValue={v.qty}
                          onBlur={(e) => { setValues({ ...values, [p.id]: { ...v, qty: parseFloat(e.target.value) || 0 } }); setEditing(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                          style={{ width: '100%', border: '2px solid var(--accent)', borderRadius: 3, padding: '2px 4px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--bg-elev)', outline: 'none' }}
                        />
                      ) : (
                        v.qty != null ? v.qty.toLocaleString('es-PE', { minimumFractionDigits: v.qty % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }) : ''
                      )}
                    </td>
                    <td className="num-c" onClick={(e) => { if (isLeaf) { e.stopPropagation(); setEditing(p.id + ':up'); } }} style={{ cursor: isLeaf ? 'text' : 'default' }}>
                      {editing === p.id + ':up' ? (
                        <input
                          autoFocus
                          defaultValue={v.unitPrice}
                          onBlur={(e) => { setValues({ ...values, [p.id]: { ...v, unitPrice: parseFloat(e.target.value) || 0 } }); setEditing(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                          style={{ width: '100%', border: '2px solid var(--accent)', borderRadius: 3, padding: '2px 4px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--bg-elev)', outline: 'none' }}
                        />
                      ) : (
                        v.unitPrice != null ? v.unitPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
                      )}
                    </td>
                    <td className="num-c" style={{ fontWeight: isGroup ? 600 : 400, color: isGroup ? 'var(--ink)' : 'var(--ink-2)' }}>
                      {fmtPEN(p.budget).replace('S/ ', '')}
                    </td>
                    <td className="num-c" style={{ color: isGroup ? 'var(--ink)' : 'var(--ink-3)' }}>
                      {fmtPEN(p.real).replace('S/ ', '')}
                    </td>
                    <td className="num-c">
                      {p.budget > 0 && (
                        <span style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          color: dev > 5 ? 'var(--danger)' : dev > 0 ? 'var(--warn-ink)' : 'var(--ok)',
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: dev > 5 ? 'var(--danger-soft)' : dev > 0 ? 'var(--warn-soft)' : 'var(--ok-soft)',
                        }}>{fmtPct(dev)}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--ink-4)' }}>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--ink-4)', padding: 4, cursor: 'pointer' }}>{Icon.more({ size: 12 })}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right panel: selected partida detail */}
        <PartidaDetail partidaId={selected} values={values} />
      </div>
    </div>
  );
}

function Stat({ label, value, delta, deltaKind = 'pos', sub }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div>
        {delta && <span className={'delta ' + deltaKind} style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 10, padding: '1px 5px', borderRadius: 3, background: deltaKind === 'pos' ? 'var(--ok-soft)' : deltaKind === 'neg' ? 'var(--danger-soft)' : 'var(--warn-soft)', color: deltaKind === 'pos' ? 'var(--ok)' : deltaKind === 'neg' ? 'var(--danger)' : 'var(--warn-ink)' }}>{delta}</span>}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function PartidaDetail({ partidaId, values }) {
  const p = ERP_DATA.partidas.find(x => x.id === partidaId);
  if (!p) return null;
  const v = values[p.id] || {};
  const hasAi = !!p.ai;

  // Mock APU (analysis of unit price)
  const apu = [
    { cat: 'Mano de obra', items: [
      { name: 'Operario', unit: 'hh', qty: 0.4, rate: 24.80, total: 9.92 },
      { name: 'Peón', unit: 'hh', qty: 0.8, rate: 18.30, total: 14.64 },
    ]},
    { cat: 'Materiales', items: [
      { name: 'Combustible diesel B5', unit: 'gal', qty: 0.12, rate: 14.50, total: 1.74 },
    ]},
    { cat: 'Equipos', items: [
      { name: 'Retroexcavadora 420F · alquiler', unit: 'hm', qty: 0.05, rate: 185, total: 9.25 },
      { name: 'Herramientas manuales', unit: '%MO', qty: 0.03, rate: 24.56, total: 0.74 },
    ]},
  ];
  const apuTotal = apu.flatMap(c => c.items).reduce((s, i) => s + i.total, 0);

  return (
    <div style={{ width: 380, borderLeft: '1px solid var(--line)', background: 'var(--bg-sunken)', overflow: 'auto', flexShrink: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="mono text-xs" style={{ color: 'var(--accent)', fontWeight: 600 }}>{p.code}</span>
          <span className="chip">Nivel {p.level}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 }}>{p.name}</div>
        {p.unit && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, fontFamily: 'var(--mono)' }}>Unidad: {p.unit}</div>}
      </div>

      {hasAi && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
          <div className={'ai-hint ' + (p.aiKind || 'insight')} style={{ padding: '8px 10px', fontSize: 12, alignItems: 'flex-start' }}>
            {Icon.sparkle({ size: 12 })}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Copiloto detectó:</div>
              <div style={{ fontWeight: 400, lineHeight: 1.5 }}>{p.ai}</div>
            </div>
          </div>
        </div>
      )}

      {v.unitPrice != null && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>Análisis de precio unitario (APU)</div>
          {apu.map((c, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>{c.cat}</div>
              {c.items.map((it, j) => (
                <div key={j} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 56px 56px', gap: 6, fontSize: 11, padding: '3px 0', color: 'var(--ink-2)' }}>
                  <div style={{ color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                  <div className="mono" style={{ color: 'var(--ink-3)', textAlign: 'right' }}>{it.qty}</div>
                  <div className="mono" style={{ textAlign: 'right' }}>{it.rate.toFixed(2)}</div>
                  <div className="mono" style={{ textAlign: 'right', fontWeight: 500 }}>{it.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>Total APU</span>
            <span className="mono" style={{ fontWeight: 700 }}>S/ {apuTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>Ejecución</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: 'var(--ink-3)' }}>Presupuestado</span>
              <span className="mono" style={{ fontWeight: 500 }}>{fmtPEN(p.budget)}</span>
            </div>
            <div className="pbar"><span style={{ width: '100%', background: 'var(--line-strong)' }} /></div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: 'var(--ink-3)' }}>Ejecutado real</span>
              <span className="mono" style={{ fontWeight: 500 }}>{fmtPEN(p.real)}</span>
            </div>
            <div className="pbar"><span style={{ width: Math.min(p.real / p.budget * 100, 100) + '%', background: p.real > p.budget ? 'var(--danger)' : 'var(--accent)' }} /></div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: 'var(--ink-3)' }}>Comprometido (OC)</span>
              <span className="mono" style={{ fontWeight: 500 }}>{fmtPEN(p.real * 1.12)}</span>
            </div>
            <div className="pbar"><span style={{ width: Math.min(p.real * 1.12 / p.budget * 100, 100) + '%', background: 'var(--warn)' }} /></div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>Documentos vinculados</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['OC-2025-081 Cemento UNACEM.pdf', 'V07 Valorización Feb.pdf'].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, borderRadius: 4, background: 'var(--bg-elev)', border: '1px solid var(--line)' }}>
              <span style={{ color: 'var(--danger)' }}>{Icon.pdf({ size: 14 })}</span>
              <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
              <span style={{ color: 'var(--ink-4)' }}>{Icon.link({ size: 11 })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.PresupuestoPage = Presupuesto;
