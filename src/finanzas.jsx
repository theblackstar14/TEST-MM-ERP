/* global React, Icon, ERP_DATA */
const { useState, useEffect } = React;
const { fmtPEN, fmtInt, fmtPct, cashflow: CF, projects } = ERP_DATA;

// ── TEST data ──────────────────────────────────────────────────────
const MOV_TEST = {
  tipo: 'Egreso',
  subtipo: 'Materiales',
  destino: 'OB-2025-021',
  destinoLabel: 'OB-2025-021 — Belcorp Lima',
  comprobante: 'F001-00893',
  monto: '18240.00',
  fecha: '18/04/2026',
  estado: 'Pagada',
  descripcion: 'Cemento Portland Tipo I · 240 bls · UNACEM S.A.A.',
};

const SUBTIPOS = {
  Ingreso: ['Valorización', 'Adelanto directo', 'Devolución', 'Otro ingreso'],
  Egreso: ['Materiales', 'Mano de obra / Planilla', 'Subcontrato', 'Equipos y alquileres', 'Gastos de oficina', 'Tributos / SUNAT', 'Otro egreso'],
};

const DESTINOS = [
  { value: 'OB-2025-021', label: 'OB-2025-021 — Belcorp Lima' },
  { value: 'OB-2025-018', label: 'OB-2025-018 — Ransa Callao' },
  { value: 'OB-2025-012', label: 'OB-2025-012 — Alicorp Huachipa' },
  { value: 'OFICINA',     label: 'Gastos de oficina (empresa)' },
  { value: 'PLANILLA',    label: 'Planilla administrativa' },
];

// ── MovimientoSuccess ──────────────────────────────────────────────
function MovimientoSuccess({ data, onClose }) {
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDone(true), 1600); return () => clearTimeout(t); }, []);

  const isIngreso = data.tipo === 'Ingreso';
  const color = isIngreso ? 'var(--ok)' : 'var(--danger)';
  const movId = 'MOV-' + Math.floor(Math.random() * 9000 + 1000);

  return (
    <div style={{ padding: '32px 28px', textAlign: 'center', minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {!done ? (
        <div className="oc-spinner" />
      ) : (
        <>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ marginBottom: 18 }}>
            <circle className="oc-check-circle" cx="36" cy="36" r="28"
              stroke={color} strokeWidth="3" fill="none"
              strokeDasharray="176" strokeDashoffset="176" />
            <polyline className="oc-check-path" points="22,37 31,47 50,26"
              fill="none" stroke={color} strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="44" strokeDashoffset="44" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Movimiento registrado</div>
          <div className="mono text-xs muted" style={{ marginBottom: 22 }}>{movId} · {data.fecha}</div>

          <div style={{ width: '100%', background: 'var(--bg-sunken)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 20 }}>
            <div className="oc-row-top" style={{ borderBottom: '1px solid var(--line)' }}>
              <div><div className="oc-lbl">Tipo</div><div className="oc-val" style={{ color }}>{data.tipo} · {data.subtipo}</div></div>
              <div><div className="oc-lbl">Destino</div><div className="oc-val">{data.destinoLabel}</div></div>
            </div>
            <div className="oc-row-bottom">
              <div><div className="oc-lbl">Comprobante</div><div className="oc-val mono">{data.comprobante}</div></div>
              <div><div className="oc-lbl">Estado</div><div className="oc-val">{data.estado}</div></div>
              <div>
                <div className="oc-lbl">Monto S/</div>
                <div className="oc-val mono" style={{ color, fontSize: 16, fontWeight: 700 }}>
                  {isIngreso ? '+' : '-'}{parseFloat(data.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {data.descripcion && (
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 20, fontStyle: 'italic' }}>"{data.descripcion}"</div>
          )}

          <button className="tb-btn primary" style={{ width: '100%', padding: '10px 0', fontSize: 13 }} onClick={onClose}>
            Aceptar
          </button>
        </>
      )}
    </div>
  );
}

// ── NuevoMovimientoModal ───────────────────────────────────────────
function NuevoMovimientoModal({ onClose, onSubmit }) {
  const [tipo, setTipo] = useState('Egreso');
  const [form, setForm] = useState({
    subtipo: 'Materiales',
    destino: 'OB-2025-021',
    destinoLabel: 'OB-2025-021 — Belcorp Lima',
    comprobante: '',
    monto: '',
    fecha: '',
    estado: 'Pendiente',
    descripcion: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTipo = (t) => {
    setTipo(t);
    set('subtipo', SUBTIPOS[t][0]);
  };

  const handleDestino = (v) => {
    const d = DESTINOS.find(x => x.value === v);
    setForm(f => ({ ...f, destino: v, destinoLabel: d ? d.label : v }));
  };

  const handleTest = () => {
    setTipo(MOV_TEST.tipo);
    setForm({
      subtipo: MOV_TEST.subtipo,
      destino: MOV_TEST.destino,
      destinoLabel: MOV_TEST.destinoLabel,
      comprobante: MOV_TEST.comprobante,
      monto: MOV_TEST.monto,
      fecha: MOV_TEST.fecha,
      estado: MOV_TEST.estado,
      descripcion: MOV_TEST.descripcion,
    });
  };

  const handleSubmit = () => {
    onSubmit({ tipo, ...form });
  };

  const isIngreso = tipo === 'Ingreso';
  const estadoOpts = isIngreso
    ? ['Por cobrar', 'Cobrada', 'Vencida']
    : ['Pendiente', 'Pagada'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Registrar movimiento</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleTest} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px dashed var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer' }}>
              TEST
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Ingreso / Egreso toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {['Ingreso', 'Egreso'].map(t => (
            <button
              key={t}
              onClick={() => handleTipo(t)}
              className="mov-toggle"
              style={{
                padding: '10px 0',
                borderRadius: 8,
                border: '2px solid ' + (tipo === t ? (t === 'Ingreso' ? 'var(--ok)' : 'var(--danger)') : 'var(--line)'),
                background: tipo === t ? (t === 'Ingreso' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)') : 'var(--bg-sunken)',
                color: tipo === t ? (t === 'Ingreso' ? 'var(--ok)' : 'var(--danger)') : 'var(--ink-3)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{t === 'Ingreso' ? '↑ Ingreso' : '↓ Egreso'}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Subtipo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Subtipo</label>
            <select value={form.subtipo} onChange={e => set('subtipo', e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, color: 'var(--ink)' }}>
              {SUBTIPOS[tipo].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Destino */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Destino / Proyecto</label>
            <select value={form.destino} onChange={e => handleDestino(e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, color: 'var(--ink)' }}>
              {DESTINOS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* Comprobante */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>N° Comprobante</label>
            <input value={form.comprobante} onChange={e => set('comprobante', e.target.value)} placeholder="F001-00000" style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, color: 'var(--ink)', outline: 'none' }} />
          </div>

          {/* Monto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Monto S/</label>
            <input value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="0.00" type="number" min="0" style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, color: 'var(--ink)', outline: 'none' }} />
          </div>

          {/* Fecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Fecha</label>
            <input value={form.fecha} onChange={e => set('fecha', e.target.value)} placeholder="dd/mm/aaaa" style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, color: 'var(--ink)', outline: 'none' }} />
          </div>

          {/* Estado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, color: 'var(--ink)' }}>
              {estadoOpts.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Descripción full width */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Descripción / Concepto</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Detalle del movimiento..." rows={2}
            style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, color: 'var(--ink)', resize: 'vertical', fontFamily: 'var(--sans)', outline: 'none' }} />
        </div>

        {/* Archivo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Adjuntar comprobante (PDF / imagen)</label>
          <div style={{ padding: '12px 14px', border: '1px dashed var(--line)', borderRadius: 6, background: 'var(--bg-sunken)', fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer', textAlign: 'center' }}>
            {Icon.upload({ size: 13 })} Haz clic o arrastra el archivo
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--bg-sunken)', color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit}
            style={{ flex: 2, padding: '9px 0', borderRadius: 7, border: 'none', background: isIngreso ? 'var(--ok)' : 'var(--danger)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {isIngreso ? '↑ Registrar ingreso' : '↓ Registrar egreso'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== FINANZAS ===================
function FinanzasPage() {
  const { cashflow } = ERP_DATA;
  const [tab, setTab] = useState('flujo');
  const [project, setProject] = useState('OB-2025-021');
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(null);

  const totalIngresos = cashflow.reduce((s, c) => s + c.ingresos, 0);
  const totalEgresos = cashflow.reduce((s, c) => s + c.egresos, 0);
  const saldo = totalIngresos - totalEgresos;

  const transactions = [
    { date: '14 Abr 26', type: 'Ingreso', doc: 'F001-00482', concept: 'Valorización V08 · Belcorp', proj: 'OB-2025-021', amount: 124000, status: 'Cobrada' },
    { date: '12 Abr 26', type: 'Egreso', doc: 'F-Unacem-88412', concept: 'Cemento Portland Tipo I · 240 bls', proj: 'OB-2025-021', amount: -18240, status: 'Pagada' },
    { date: '11 Abr 26', type: 'Egreso', doc: 'B-Unimaq-2019', concept: 'Alquiler retroexcavadora 420F · abril', proj: 'OB-2025-018', amount: -24800, status: 'Pagada' },
    { date: '10 Abr 26', type: 'Ingreso', doc: 'F001-00481', concept: 'Adelanto directo Ransa', proj: 'OB-2025-018', amount: 220000, status: 'Cobrada' },
    { date: '09 Abr 26', type: 'Egreso', doc: 'F-Ac.Arequipa-554', concept: 'Acero corrugado fy=4200 · 2.1 ton', proj: 'OB-2025-021', amount: -12420, status: 'Pendiente' },
    { date: '08 Abr 26', type: 'Egreso', doc: 'Planilla Mar\'26', concept: 'Remuneraciones obra · marzo', proj: 'OB-2025-021', amount: -86400, status: 'Pagada' },
    { date: '07 Abr 26', type: 'Ingreso', doc: 'F001-00479', concept: 'Cierre valorización V07', proj: 'OB-2025-012', amount: 48200, status: 'Por cobrar' },
    { date: '05 Abr 26', type: 'Egreso', doc: 'F-Philips-8812', concept: 'Luminarias LED 18W · 84 und', proj: 'OB-2025-021', amount: -18312, status: 'Pagada' },
    { date: '04 Abr 26', type: 'Egreso', doc: 'Detracciones SUNAT', concept: 'Retención 4% — servicios construcción', proj: '—', amount: -9820, status: 'Pagada' },
    { date: '02 Abr 26', type: 'Ingreso', doc: 'F001-00478', concept: 'Adelanto materiales · Alicorp', proj: 'OB-2025-012', amount: 62000, status: 'Cobrada' },
  ];

  const handleSubmit = (data) => {
    setShowModal(false);
    setSuccess(data);
  };

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>
      <div className="page-h">
        <div>
          <h1>Finanzas / Contabilidad</h1>
          <div className="sub muted">Flujo de caja consolidado · conciliación de comprobantes · reportería por proyecto</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <select value={project} onChange={e => setProject(e.target.value)} style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 220, color: 'var(--ink)' }}>
            <option value="ALL">Todos los proyectos</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name.split('—')[0].trim()}</option>)}
          </select>
          <button className="tb-btn"><span className="ico">{Icon.download({ size: 13 })}</span>Exportar</button>
          <button className="tb-btn primary" onClick={() => setShowModal(true)}><span className="ico">{Icon.plus({ size: 13 })}</span>Registrar movimiento</button>
        </div>
      </div>

      <div className="kpi-grid">
        <FinStat lbl="Ingresos abril" val={fmtPEN(841000)} sub="8 valorizaciones cobradas" color="var(--ok)" />
        <FinStat lbl="Egresos abril" val={fmtPEN(-512400)} sub="materiales + MO + servicios" color="var(--danger)" />
        <FinStat lbl="Saldo del mes" val={fmtPEN(328600)} delta="+12.4%" deltaKind="pos" />
        <FinStat lbl="Por cobrar" val={fmtPEN(186000)} sub="3 facturas vencidas · 2 al día" color="var(--warn-ink)" />
      </div>

      <div className="hstack" style={{ gap: 2, marginBottom: 14 }}>
        {['flujo', 'movimientos', 'conciliación', 'reportes'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid ' + (tab === t ? 'var(--accent)' : 'transparent'),
              color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              letterSpacing: '-0.005em',
            }}
          >{t}</button>
        ))}
      </div>

      {tab === 'flujo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <div className="card">
            <div className="card-h"><h3>Flujo de caja — OB-2025-021</h3><span className="hint">8 meses · PEN</span></div>
            <div className="card-b"><BigCashflow /></div>
          </div>
          <div className="card">
            <div className="card-h"><h3>Composición por concepto</h3><span className="hint">abril 2026</span></div>
            <div className="card-b">
              {[
                { n: 'Materiales', v: 218400, c: 'var(--accent)' },
                { n: 'Mano de obra', v: 168200, c: 'var(--warn)' },
                { n: 'Subcontratos', v: 84600, c: '#7C3AED' },
                { n: 'Equipos y alquileres', v: 48200, c: 'var(--ok)' },
                { n: 'Gastos generales', v: 28400, c: '#D97757' },
                { n: 'Tributos y detracciones', v: 18600, c: '#0EA5B7' },
              ].map((c, i) => {
                const tot = 566400;
                const pct = (c.v / tot) * 100;
                return (
                  <div key={c.n} style={{ marginBottom: 12 }}>
                    <div className="hstack between" style={{ marginBottom: 4 }}>
                      <div className="hstack"><span style={{ width: 10, height: 10, borderRadius: 2, background: c.c }} /><span style={{ fontSize: 12 }}>{c.n}</span></div>
                      <span className="mono text-xs" style={{ color: 'var(--ink-2)' }}>{fmtPEN(c.v).replace('S/ ', '')}</span>
                    </div>
                    <div className="pbar" style={{ height: 6 }}><span style={{ width: pct + '%', background: c.c }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'movimientos' && (
        <div className="card">
          <div className="card-h">
            <h3>Movimientos del mes</h3>
            <div className="hstack" style={{ gap: 6 }}>
              <span className="chip">{transactions.length} movimientos</span>
              <button className="tb-btn" style={{ height: 26, fontSize: 11 }}>{Icon.filter({ size: 11 })}Filtros</button>
            </div>
          </div>
          <div className="card-b tight">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Fecha</th>
                  <th style={{ width: 80 }}>Tipo</th>
                  <th style={{ width: 140 }}>Comprobante</th>
                  <th>Concepto</th>
                  <th style={{ width: 120 }}>Proyecto</th>
                  <th style={{ width: 120 }} className="num-c">Monto S/</th>
                  <th style={{ width: 110 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i} className="row-hover" style={{ cursor: 'pointer' }}>
                    <td className="mono text-xs">{t.date}</td>
                    <td>
                      <span className={'chip ' + (t.type === 'Ingreso' ? 'green' : 'red')}>{t.type}</span>
                    </td>
                    <td className="mono text-xs" style={{ color: 'var(--ink-2)' }}>{t.doc}</td>
                    <td>{t.concept}</td>
                    <td className="mono text-xs muted">{t.proj}</td>
                    <td className="num-c" style={{ color: t.amount > 0 ? 'var(--ok)' : 'var(--ink)', fontWeight: 500 }}>
                      {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={'chip ' + (t.status === 'Pagada' || t.status === 'Cobrada' ? 'green' : t.status === 'Pendiente' ? 'amber' : 'blue')}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'conciliación' && <ConciliacionView />}
      {tab === 'reportes' && <ReportesView />}

      {showModal && <NuevoMovimientoModal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}
      {success && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <MovimientoSuccess data={success} onClose={() => setSuccess(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function FinStat({ lbl, val, sub, delta, deltaKind, color }) {
  return (
    <div className="kpi" style={{ cursor: 'default' }}>
      <div className="lbl">
        <span>{lbl}</span>
        {delta && <span className={'delta ' + deltaKind}>{delta}</span>}
      </div>
      <div className="val" style={{ color: color || 'var(--ink)' }}>{val}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function BigCashflow() {
  const { cashflow } = ERP_DATA;
  const w = 800, h = 260, pad = 36;
  const max = Math.max(...cashflow.map(c => Math.max(c.ingresos, c.egresos)));
  const bw = (w - pad * 2) / cashflow.length;
  const acumPts = cashflow.map((c, i) => {
    const x = pad + bw * i + bw / 2;
    const maxAcum = Math.max(...cashflow.map(x => x.acumulado));
    const y = h - pad - ((c.acumulado / maxAcum) * (h - pad * 2));
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + (h - pad * 2) * t} y2={pad + (h - pad * 2) * t} stroke="var(--line)" strokeDasharray={i === 0 || i === 4 ? '0' : '2,3'} />
      ))}
      {cashflow.map((c, i) => {
        const x = pad + bw * i + bw * 0.15;
        const bw2 = bw * 0.32;
        const hIng = ((h - pad * 2) * c.ingresos) / max;
        const hEg = ((h - pad * 2) * c.egresos) / max;
        return (
          <g key={i}>
            <rect x={x} y={h - pad - hIng} width={bw2} height={hIng} fill="var(--accent)" rx="1" />
            <rect x={x + bw2 + 3} y={h - pad - hEg} width={bw2} height={hEg} fill="var(--warn)" rx="1" />
            <text x={x + bw2 + 1} y={h - 12} fontSize="10" textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--mono)">{c.month}</text>
            <text x={x + bw2 / 2} y={h - pad - hIng - 4} fontSize="9" textAnchor="middle" fill="var(--accent)" fontFamily="var(--mono)" fontWeight="600">{(c.ingresos / 1000).toFixed(0)}</text>
          </g>
        );
      })}
      <polyline points={acumPts} fill="none" stroke="var(--ok)" strokeWidth="2" strokeDasharray="4,3" />
      {cashflow.map((c, i) => {
        const x = pad + bw * i + bw / 2;
        const maxAcum = Math.max(...cashflow.map(x => x.acumulado));
        const y = h - pad - ((c.acumulado / maxAcum) * (h - pad * 2));
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--ok)" stroke="var(--bg-elev)" strokeWidth="2" />;
      })}
      <g transform={`translate(${pad + 6}, 10)`} fontSize="11" fontFamily="var(--sans)">
        <rect x="0" y="0" width="10" height="10" fill="var(--accent)" rx="1" />
        <text x="14" y="9" fill="var(--ink-2)">Ingresos</text>
        <rect x="80" y="0" width="10" height="10" fill="var(--warn)" rx="1" />
        <text x="94" y="9" fill="var(--ink-2)">Egresos</text>
        <line x1="160" y1="5" x2="180" y2="5" stroke="var(--ok)" strokeWidth="2" strokeDasharray="4,3" />
        <text x="184" y="9" fill="var(--ink-2)">Saldo acumulado</text>
      </g>
    </svg>
  );
}

function ConciliacionView() {
  return (
    <div className="card">
      <div className="card-h"><h3>Conciliación de comprobantes · SUNAT</h3><span className="hint">Importación XML CPE</span></div>
      <div className="card-b">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
          <StatusBox lbl="Conciliadas" val="184" color="var(--ok)" pct={86} />
          <StatusBox lbl="Con observación" val="21" color="var(--warn)" pct={10} />
          <StatusBox lbl="Sin conciliar" val="9" color="var(--danger)" pct={4} />
        </div>
        <table>
          <thead>
            <tr>
              <th>Comprobante SUNAT</th>
              <th>Proveedor</th>
              <th style={{ width: 120 }} className="num-c">Monto</th>
              <th>Match con OC</th>
              <th style={{ width: 120 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {[
              { d: 'F001-00892', p: 'Aceros Arequipa S.A.', m: 12420, oc: 'OC-2025-082', s: 'Conciliada' },
              { d: 'F002-00144', p: 'UNACEM S.A.A.', m: 18240, oc: 'OC-2025-081', s: 'Conciliada' },
              { d: 'B001-00228', p: 'Unimaq S.A.C.', m: 24800, oc: 'OC-2026-002', s: 'Observación · monto' },
              { d: 'F001-04218', p: 'Promart Maestro', m: 3842, oc: null, s: 'Sin conciliar' },
              { d: 'F003-00098', p: 'Philips Peruana S.A.', m: 18312, oc: 'OC-2026-012', s: 'Conciliada' },
            ].map((r, i) => (
              <tr key={i} className="row-hover">
                <td className="mono text-xs">{r.d}</td>
                <td>{r.p}</td>
                <td className="num-c">{r.m.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                <td>
                  {r.oc ? <span className="mono text-xs" style={{ color: 'var(--accent)' }}>{r.oc}</span> : <span className="muted text-xs">—</span>}
                </td>
                <td><span className={'chip ' + (r.s === 'Conciliada' ? 'green' : r.s === 'Sin conciliar' ? 'red' : 'amber')}>{r.s}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBox({ lbl, val, color, pct }) {
  return (
    <div style={{ padding: 16, background: 'var(--bg-sunken)', borderRadius: 8, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>{lbl}</div>
      <div className="hstack between" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: color }}>{val}</div>
        <div className="mono text-xs muted">{pct}%</div>
      </div>
      <div className="pbar"><span style={{ width: pct + '%', background: color }} /></div>
    </div>
  );
}

function ReportesView() {
  return (
    <div className="card">
      <div className="card-h"><h3>Reportes disponibles</h3></div>
      <div className="card-b" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { t: 'Estado de resultados', d: 'Por proyecto · acumulado año', i: 'trend' },
          { t: 'Flujo de efectivo proyectado', d: 'Próximos 6 meses', i: 'trend' },
          { t: 'Ejecución presupuestal', d: 'PvsR · todas las obras', i: 'budget' },
          { t: 'Cuentas por cobrar', d: 'Antigüedad 30/60/90+', i: 'money' },
          { t: 'Detracciones SUNAT', d: 'Detalle mensual', i: 'file' },
          { t: 'Utilidad por proyecto', d: 'Margen bruto y neto', i: 'trend' },
        ].map(r => (
          <div key={r.t} className="card" style={{ padding: 14, cursor: 'pointer', background: 'var(--bg-sunken)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{Icon[r.i]({ size: 14 })}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{r.t}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.FinanzasPage = FinanzasPage;
