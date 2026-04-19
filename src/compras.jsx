/* global React, Icon, ERP_DATA */
const { useState, useEffect, useRef } = React;
const { fmtPEN } = ERP_DATA;

// ── Datos de prueba para TEST ────────────────────────────────────
const TEST_DATA = {
  proyecto:    'OB-2025-021',
  proveedor:   'UNACEM S.A.A.',
  ruc:         '20100030595',
  item:        'Cemento Portland Tipo I · 600 bolsas',
  unidad:      'bls',
  cantidad:    '600',
  precioUnit:  '76.00',
  fechaEnt:    '2026-04-25',
  condPago:    '30 días',
  obs:         'Entrega en obra OB-2025-021 — Almacén nivel 1. Coordinar con residente.',
  archivo:     'OC-UNACEM-cemento-abril2026.pdf',
};

// ── OC Success screen ────────────────────────────────────────────
function OCSuccess({ ocId, data, onClose }) {
  const [done, setDone] = useState(false);
  const total = (parseFloat(data.cantidad) * parseFloat(data.precioUnit)).toLocaleString('es-PE', { minimumFractionDigits: 2 });

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="oc-success card"
        style={{ padding: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
          {/* Icono animado */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Glow */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'var(--ok-soft)',
                filter: 'blur(12px)',
                opacity: done ? 0.9 : 0.4,
                transition: 'opacity .6s',
              }} />

              {!done ? (
                /* Spinner */
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="oc-spinner" />
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ok)',
                  }}>
                    {Icon.cart({ size: 18 })}
                  </div>
                </div>
              ) : (
                /* Checkmark SVG */
                <svg width="72" height="72" viewBox="0 0 100 100" style={{ position: 'relative', zIndex: 1 }}>
                  <circle
                    className="oc-check-circle"
                    cx="50" cy="50" r="42"
                    fill="none" stroke="var(--ok)"
                    strokeWidth="2.5" strokeLinecap="round"
                  />
                  <path
                    className="oc-check-path"
                    d="M32 50L45 63L68 35"
                    fill="none" stroke="var(--ok)"
                    strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Título */}
          <div style={{
            fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
            color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em',
            marginBottom: 4, transition: 'opacity .4s',
          }}>
            {done ? 'OC Emitida' : 'Procesando OC…'}
          </div>
          <div style={{
            fontSize: 11, color: done ? 'var(--ok-ink)' : 'var(--ink-3)',
            fontFamily: 'var(--mono)', fontWeight: 600,
            transition: 'color .4s',
          }}>
            {done ? `ID: ${ocId}` : 'Registrando en sistema…'}
          </div>
        </div>

        {/* Transfer rows */}
        <div style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 14 }}>
            {/* FROM — proyecto */}
            <div
              className="oc-row-top"
              style={{
                border: '1px solid var(--line)', background: 'var(--bg-sunken)',
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                {Icon.project({ size: 10 })} Proyecto origen
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff' }}>OB</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)' }}>{data.proyecto}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>Partida · {data.item.split('·')[0].trim()}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink)', opacity: done ? 1 : 0.5, transition: 'opacity .4s' }}>
                  S/ {total}
                </div>
              </div>
            </div>

            {/* Divider con icono */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2, margin: '-1px 0' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: done ? 'var(--ok)' : 'var(--accent)',
                border: '2px solid var(--bg-elev)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .5s',
              }}>
                {done
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                }
              </div>
            </div>

            {/* TO — proveedor */}
            <div
              className="oc-row-bottom"
              style={{
                border: '1px solid var(--line)', background: 'var(--bg-sunken)',
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                {Icon.team({ size: 10 })} Proveedor
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff' }}>PR</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)', opacity: done ? 1 : 0.55, transition: 'opacity .4s' }}>{data.proveedor}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>RUC {data.ruc}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={'chip ' + (done ? 'green' : 'blue')} style={{ fontSize: 9, transition: 'all .5s' }}>
                    {done ? 'Emitida' : 'Procesando'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-3)', marginBottom: 14 }}>
            <span>Pago: {data.condPago}</span>
            <span style={{ fontFamily: 'var(--mono)' }}>ETA: {data.fechaEnt}</span>
            {data.archivo && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {Icon.file({ size: 10 })} {data.archivo}
              </span>
            )}
          </div>

          {/* Botón cerrar */}
          <button
            className="tb-btn primary"
            style={{ width: '100%', justifyContent: 'center', height: 36, fontSize: 12, opacity: done ? 1 : 0.5, pointerEvents: done ? 'auto' : 'none', transition: 'opacity .4s' }}
            onClick={onClose}
          >
            {done ? <>{Icon.check({ size: 13 })} Ver en tabla de OC</> : 'Procesando…'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Nueva OC ───────────────────────────────────────────────
function NuevaOCModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    proyecto: '', proveedor: '', ruc: '', item: '',
    unidad: '', cantidad: '', precioUnit: '',
    fechaEnt: '', condPago: '30 días', obs: '', archivo: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = form.cantidad && form.precioUnit
    ? (parseFloat(form.cantidad) * parseFloat(form.precioUnit)).toLocaleString('es-PE', { minimumFractionDigits: 2 })
    : '—';

  const fillTest = () => setForm({ ...TEST_DATA });

  const inputStyle = {
    width: '100%', background: 'var(--bg-sunken)',
    border: '1px solid var(--line)', borderRadius: 6,
    padding: '7px 10px', fontSize: 12, color: 'var(--ink)', outline: 'none',
    transition: 'border-color .15s', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, display: 'block', marginBottom: 4 };

  const ocId = 'OC-2026-' + String(Math.floor(Math.random() * 900) + 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>Nueva Orden de Compra</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--mono)' }}>
              {ocId} · {new Date().toLocaleDateString('es-PE')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* TEST button */}
            <button
              onClick={fillTest}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1.5px dashed var(--warn)',
                background: 'var(--warn-soft)', color: 'var(--warn-ink)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--mono)', letterSpacing: '0.04em',
                transition: 'all .15s',
              }}
            >
              ⚡ TEST
            </button>
            <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Fila 1: proyecto + proveedor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Proyecto</label>
              <select value={form.proyecto} onChange={e => set('proyecto', e.target.value)} style={inputStyle}>
                <option value="">Seleccionar…</option>
                {['OB-2025-021','OB-2025-018','OB-2025-024','OB-2025-012'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Proveedor</label>
              <input value={form.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Nombre del proveedor" style={inputStyle} />
            </div>
          </div>

          {/* Fila 2: RUC + condición de pago */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>RUC proveedor</label>
              <input value={form.ruc} onChange={e => set('ruc', e.target.value)} placeholder="20XXXXXXXXX" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Condición de pago</label>
              <select value={form.condPago} onChange={e => set('condPago', e.target.value)} style={inputStyle}>
                {['Contado','7 días','15 días','30 días','45 días','60 días'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Item */}
          <div>
            <label style={labelStyle}>Descripción del ítem</label>
            <input value={form.item} onChange={e => set('item', e.target.value)} placeholder="Ej: Cemento Portland Tipo I · 480 bls" style={inputStyle} />
          </div>

          {/* Fila 3: cantidad + unidad + precio + total */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Cantidad</label>
              <input type="number" value={form.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unidad</label>
              <input value={form.unidad} onChange={e => set('unidad', e.target.value)} placeholder="bls" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Precio unit. S/</label>
              <input type="number" value={form.precioUnit} onChange={e => set('precioUnit', e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Total S/</label>
              <div style={{ ...inputStyle, background: 'var(--bg)', color: total !== '—' ? 'var(--ok-ink)' : 'var(--ink-4)', fontWeight: total !== '—' ? 700 : 400, fontFamily: 'var(--mono)', cursor: 'default' }}>
                {total !== '—' ? 'S/ ' + total : '—'}
              </div>
            </div>
          </div>

          {/* Fecha entrega */}
          <div>
            <label style={labelStyle}>Fecha de entrega requerida</label>
            <input type="date" value={form.fechaEnt} onChange={e => set('fechaEnt', e.target.value)} style={inputStyle} />
          </div>

          {/* Observaciones */}
          <div>
            <label style={labelStyle}>Observaciones</label>
            <textarea
              value={form.obs}
              onChange={e => set('obs', e.target.value)}
              placeholder="Instrucciones de entrega, condiciones especiales…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Adjuntar documento */}
          <div>
            <label style={labelStyle}>Adjuntar documento</label>
            <div
              style={{
                border: '1.5px dashed var(--line)', borderRadius: 8,
                padding: '14px', display: 'flex', alignItems: 'center', gap: 10,
                background: form.archivo ? 'var(--ok-soft)' : 'var(--bg-sunken)',
                cursor: 'pointer', transition: 'all .15s',
              }}
              onClick={() => { if (!form.archivo) set('archivo', 'cotizacion-proveedor.pdf'); }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: form.archivo ? 'var(--ok)' : 'var(--accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: form.archivo ? '#fff' : 'var(--accent)', flexShrink: 0,
              }}>
                {form.archivo ? Icon.check({ size: 14 }) : Icon.upload({ size: 14 })}
              </div>
              <div>
                {form.archivo
                  ? <><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ok-ink)' }}>{form.archivo}</div>
                      <div style={{ fontSize: 10, color: 'var(--ok-ink)', opacity: 0.7 }}>Documento adjuntado · click para cambiar</div></>
                  : <><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>Arrastra o haz click para adjuntar</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>PDF, Excel, Word · máx. 10 MB</div></>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--line)' }}>
          <button className="tb-btn" onClick={onClose}>Cancelar</button>
          <button
            className="tb-btn primary"
            style={{ opacity: (!form.proyecto || !form.proveedor || !form.item || !form.cantidad) ? 0.45 : 1, transition: 'opacity .2s' }}
            disabled={!form.proyecto || !form.proveedor || !form.item || !form.cantidad}
            onClick={() => onSubmit(ocId, form)}
          >
            {Icon.check({ size: 13 })} Emitir OC
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== COMPRAS ===================
function ComprasPage() {
  const [tab, setTab] = useState('ordenes');
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess]     = useState(null); // { ocId, data }

  const handleSubmit = (ocId, data) => {
    setShowModal(false);
    setSuccess({ ocId, data });
  };
  const handleSuccessClose = () => setSuccess(null);

  const ordenes = [
    { id: 'OC-2026-015', prov: 'Aceros Arequipa S.A.', item: 'Acero corrugado fy=4200 kg/cm² · 4.2 ton', proj: 'OB-2025-021', amount: 24820,  date: '12 Abr 26', status: 'Aprobada',       eta: '18 Abr' },
    { id: 'OC-2026-014', prov: 'UNACEM S.A.A.',         item: 'Cemento Portland Tipo I · 480 bls',          proj: 'OB-2025-018', amount: 36480,  date: '11 Abr 26', status: 'Aprobada',       eta: '16 Abr' },
    { id: 'OC-2026-013', prov: 'Promart Maestro',        item: 'Herramientas menores y EPP',                 proj: 'OB-2025-012', amount: 4820,   date: '10 Abr 26', status: 'Entregada',      eta: '—' },
    { id: 'OC-2026-012', prov: 'Philips Peruana S.A.',   item: 'Luminarias LED 18W · 184 und',               proj: 'OB-2025-021', amount: 40112,  date: '08 Abr 26', status: 'Entregada',      eta: '—' },
    { id: 'OC-2026-011', prov: 'Unimaq S.A.C.',          item: 'Alquiler retroexcavadora 420F · 15 días',    proj: 'OB-2025-018', amount: 27750,  date: '05 Abr 26', status: 'En tránsito',    eta: '14 Abr' },
    { id: 'OC-2026-010', prov: 'Sodimac Perú',           item: 'Pintura látex · 80 galones',                 proj: 'OB-2025-024', amount: 6840,   date: '03 Abr 26', status: 'Pendiente aprob.',eta: '—' },
    { id: 'OC-2026-009', prov: 'Celima Trebol',          item: 'Cerámica porcelanato 60x60 · 420 m²',       proj: 'OB-2025-024', amount: 18480,  date: '02 Abr 26', status: 'Entregada',      eta: '—' },
    { id: 'OC-2026-008', prov: 'Indeco S.A.',            item: 'Cable NH-80 2.5mm² · 4000 m',               proj: 'OB-2025-021', amount: 12640,  date: '28 Mar 26', status: 'Entregada',      eta: '—' },
  ];
  const requerimientos = [
    { id: 'REQ-2026-042', desc: "Tuberías PVC SAP 4\" · 180 m",                  proj: 'OB-2025-021', solicitante: 'Ing. Pedro Quispe',    date: '14 Abr', urgency: 'media', status: 'Cotizando' },
    { id: 'REQ-2026-041', desc: "Concreto premezclado f'c=210 · 24 m³",          proj: 'OB-2025-018', solicitante: 'Ing. Rodrigo Paredes', date: '13 Abr', urgency: 'alta',  status: 'Aprobado · esperando OC' },
    { id: 'REQ-2026-040', desc: 'Vidrio templado 10mm · 18 paños',               proj: 'OB-2025-024', solicitante: 'Ing. Luisa Farfán',   date: '12 Abr', urgency: 'baja',  status: 'Pendiente aprob.' },
    { id: 'REQ-2026-039', desc: 'Interruptores termomagnéticos · 24 und',        proj: 'OB-2025-021', solicitante: 'Téc. Rosa Vílchez',   date: '11 Abr', urgency: 'media', status: 'Cotizando' },
  ];
  const proveedores = [
    { name: 'UNACEM S.A.A.',         ruc: '20100030595', cat: 'Cemento y áridos',     rating: 4.8, ocs: 18, totalYear: 284000, lead: 2 },
    { name: 'Aceros Arequipa S.A.',  ruc: '20100128218', cat: 'Acero y perfiles',     rating: 4.7, ocs: 14, totalYear: 412000, lead: 3 },
    { name: 'Unimaq S.A.C.',         ruc: '20504645046', cat: 'Maquinaria y equipos', rating: 4.2, ocs: 22, totalYear: 186000, lead: 1 },
    { name: 'Promart Maestro',       ruc: '20536557858', cat: 'Ferretería y EPP',     rating: 4.4, ocs: 38, totalYear: 42800,  lead: 1 },
    { name: 'Philips Peruana S.A.',  ruc: '20100023082', cat: 'Iluminación',          rating: 4.6, ocs: 6,  totalYear: 98200,  lead: 5 },
    { name: 'Indeco S.A.',           ruc: '20100074298', cat: 'Cables y conductores', rating: 4.5, ocs: 9,  totalYear: 64800,  lead: 4 },
  ];

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>

      {/* Modals */}
      {showModal && <NuevaOCModal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}
      {success   && <OCSuccess ocId={success.ocId} data={success.data} onClose={handleSuccessClose} />}

      <div className="page-h">
        <div>
          <h1>Compras y logística</h1>
          <div className="sub muted">Requerimientos · órdenes de compra · control de proveedores · abastecimiento por obra</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <button className="tb-btn">{Icon.download({ size: 13 })} Exportar</button>
          <button className="tb-btn primary" onClick={() => setShowModal(true)}>
            {Icon.plus({ size: 13 })} Nueva OC
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <FinStat2 lbl="OC abril · monto" val={'S/ ' + (ordenes.reduce((s,o) => s+o.amount,0)/1000).toFixed(1)+'K'} sub={ordenes.length + ' órdenes emitidas'} />
        <FinStat2 lbl="Requerimientos pendientes" val={requerimientos.length.toString()} sub="2 urgentes" />
        <FinStat2 lbl="Lead time promedio" val="3.2 días" sub="mejora −0.4d vs mar" delta="-11%" deltaKind="pos" />
        <FinStat2 lbl="Proveedores activos" val={proveedores.length.toString()} sub="6 con calificación 4.5+" />
      </div>

      <div className="hstack" style={{ gap: 2, marginBottom: 14 }}>
        {[
          { k: 'ordenes',        l: 'Órdenes de compra' },
          { k: 'requerimientos', l: 'Requerimientos' },
          { k: 'proveedores',    l: 'Proveedores' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: 500,
            background: 'transparent', border: 'none',
            borderBottom: '2px solid ' + (tab === t.k ? 'var(--accent)' : 'transparent'),
            color: tab === t.k ? 'var(--ink)' : 'var(--ink-3)', cursor: 'pointer',
          }}>{t.l}</button>
        ))}
      </div>

      {tab === 'ordenes' && (
        <div className="card">
          <div className="card-h"><h3>Órdenes de compra</h3><span className="hint">abril 2026</span></div>
          <div className="card-b tight">
            <table>
              <thead><tr>
                <th style={{ width: 130 }}>Nº OC</th>
                <th style={{ width: 200 }}>Proveedor</th>
                <th>Ítem principal</th>
                <th style={{ width: 120 }}>Proyecto</th>
                <th style={{ width: 100 }}>Emitida</th>
                <th style={{ width: 110 }} className="num-c">Monto S/</th>
                <th style={{ width: 90 }}>ETA</th>
                <th style={{ width: 140 }}>Estado</th>
              </tr></thead>
              <tbody>
                {ordenes.map(o => (
                  <tr key={o.id} className="row-hover" style={{ cursor: 'pointer' }}>
                    <td><span className="mono text-xs" style={{ color: 'var(--accent)', fontWeight: 600 }}>{o.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{o.prov}</td>
                    <td style={{ color: 'var(--ink-2)' }}>{o.item}</td>
                    <td className="mono text-xs muted">{o.proj}</td>
                    <td className="mono text-xs muted">{o.date}</td>
                    <td className="num-c" style={{ fontWeight: 500 }}>{o.amount.toLocaleString('es-PE',{minimumFractionDigits:2})}</td>
                    <td className="mono text-xs">{o.eta}</td>
                    <td><span className={'chip '+(o.status==='Entregada'?'green':o.status==='Aprobada'?'blue':o.status==='En tránsito'?'amber':'')}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'requerimientos' && (
        <div className="card">
          <div className="card-h"><h3>Requerimientos de materiales</h3><span className="hint">pipeline abastecimiento</span></div>
          <div className="card-b tight">
            <table>
              <thead><tr>
                <th style={{ width: 130 }}>Nº REQ</th>
                <th>Descripción</th>
                <th style={{ width: 120 }}>Proyecto</th>
                <th style={{ width: 180 }}>Solicitante</th>
                <th style={{ width: 80 }}>Fecha</th>
                <th style={{ width: 90 }}>Urgencia</th>
                <th style={{ width: 200 }}>Estado</th>
              </tr></thead>
              <tbody>
                {requerimientos.map(r => (
                  <tr key={r.id} className="row-hover">
                    <td><span className="mono text-xs" style={{ color: 'var(--accent)', fontWeight: 600 }}>{r.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.desc}</td>
                    <td className="mono text-xs muted">{r.proj}</td>
                    <td>{r.solicitante}</td>
                    <td className="mono text-xs muted">{r.date}</td>
                    <td><span className={'chip '+(r.urgency==='alta'?'red':r.urgency==='media'?'amber':'')}>{r.urgency}</span></td>
                    <td><span className="chip blue">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'proveedores' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {proveedores.map(p => (
            <div key={p.ruc} className="card" style={{ padding: 16 }}>
              <div className="hstack between" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em' }}>{p.name}</div>
                  <div className="mono text-xs muted">RUC {p.ruc}</div>
                </div>
                <span className="chip blue">{p.cat}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <ProvStat l="Rating" v={'★ '+p.rating} />
                <ProvStat l="OC año"  v={p.ocs.toString()} />
                <ProvStat l="Volumen" v={'S/ '+(p.totalYear/1000).toFixed(0)+'K'} />
                <ProvStat l="Lead"    v={p.lead+'d'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FinStat2({ lbl, val, sub, delta, deltaKind }) {
  return (
    <div className="kpi" style={{ cursor: 'default' }}>
      <div className="lbl"><span>{lbl}</span>{delta && <span className={'delta '+deltaKind}>{delta}</span>}</div>
      <div className="val">{val}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
function ProvStat({ l, v }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 2 }}>{l}</div>
      <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
    </div>
  );
}

window.ComprasPage = ComprasPage;
