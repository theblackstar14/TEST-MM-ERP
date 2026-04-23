/* global React, Icon, ERP_DATA, html2pdf */
const { useState, useEffect, useRef, useMemo } = React;
const { fmtPEN, EMISOR, projects } = ERP_DATA;

// Persistencia correlativo OC
const OC_KEY = 'mm.oc.correlativo';
function nextCorrelativo() {
  try { return (parseInt(localStorage.getItem(OC_KEY) || '3', 10)) + 1; }
  catch { return 4; }
}
function saveCorrelativo(n) {
  try { localStorage.setItem(OC_KEY, String(n)); } catch {}
}
function formatOCNum(correlativo) {
  return `2026 - ${String(correlativo).padStart(4, '0')}`;
}

// Unidades SUNAT
const UNIDADES_SUNAT = [
  { codigo: 'UND', nombre: 'Unidad' },
  { codigo: 'M2',  nombre: 'Metro²' },
  { codigo: 'ML',  nombre: 'Metro lineal' },
  { codigo: 'M3',  nombre: 'Metro³' },
  { codigo: 'KG',  nombre: 'Kilogramo' },
  { codigo: 'TON', nombre: 'Tonelada' },
  { codigo: 'BLS', nombre: 'Bolsa' },
  { codigo: 'CJ',  nombre: 'Caja' },
  { codigo: 'GLN', nombre: 'Galón' },
  { codigo: 'LT',  nombre: 'Litro' },
  { codigo: 'H',   nombre: 'Hora' },
  { codigo: 'DIA', nombre: 'Día' },
  { codigo: 'ZZ',  nombre: 'Servicio' },
];

const PROVEEDORES_COMUNES = [
  { name: 'UNACEM S.A.A.',                    ruc: '20100030595', dir: 'Av. Atocongo 2440, Villa María del Triunfo · Lima' },
  { name: 'Aceros Arequipa S.A.',             ruc: '20100128218', dir: 'Calle Mariscal La Mar 991, Miraflores · Lima' },
  { name: 'CENTRO CERÁMICO LAS FLORES S.A.C', ruc: '20466776336', dir: 'AV. CARLOS IZAGUIRRE 255 URB. PANAMERICANA NORTE INDEPENDENCIA' },
  { name: 'Unimaq S.A.C.',                    ruc: '20504645046', dir: 'Av. La Molina 3655, Ate · Lima' },
  { name: 'Promart Maestro',                  ruc: '20536557858', dir: 'Av. Javier Prado 2501, San Borja · Lima' },
  { name: 'Philips Peruana S.A.',             ruc: '20100023082', dir: 'Calle Las Camelias 877 Of. 901, San Isidro · Lima' },
  { name: 'Indeco S.A.',                      ruc: '20100074298', dir: 'Carretera Central Km 12.5, Santa Anita · Lima' },
  { name: 'Sodimac Perú',                     ruc: '20536557858', dir: 'Av. Angamos 1805, Surquillo · Lima' },
];

const GESTORES = [
  { email: 'victor.moreno@mmhighmetrik.com',  nombre: 'Victor Moreno' },
  { email: 'mario.garcia@mmhighmetrik.com',   nombre: 'Mario A. García Calderón' },
  { email: 'rodrigo.paredes@mmhighmetrik.com', nombre: 'Rodrigo Paredes' },
  { email: 'luisa.farfan@mmhighmetrik.com',   nombre: 'Luisa Farfán' },
];

const TEST_OC_DATA = {
  fechaEmision: '2026-01-23',
  moneda: 'PEN',
  medioPago: 'Transferencia Bancaria',
  formaPago: 'Al contado',
  cotizacion: '3007-0000259632',
  proveedor: {
    razonSocial: 'CENTRO CERÁMICO LAS FLORES S.A.C',
    ruc: '20466776336',
    direccion: 'AV. CARLOS IZAGUIRRE 255 URB. PANAMERICANA NORTE INDEPENDENCIA',
  },
  lugarEntrega: 'LIMA',
  concepto: 'BIEN',
  codigoProyecto: 'PG0005',
  proyectoInterno: projects[0]?.id || '',
  items: [
    { descripcion: 'PORCELANATO CELIMA CONCRETO CEMENTO GRIS MATE 60 X 60 CAJA DE 1.44 MT2-C.EXTRA (NAC)', unidad: 'M2', cantidad: '93.60', precioUnit: '43.29807' },
    { descripcion: 'PORCELANATO CELIMA CEMENTO MATE BLANCO 60 X 60 CAJA DE 1.44 MT2-C.EXTRA (NAC)',       unidad: 'M2', cantidad: '60.48', precioUnit: '40.90145' },
    { descripcion: 'GRES PORCELANICO CELIMA CATANIA PDRA RECTIFICADO 60X60 CAJA DE 1.44 M2 C. EXT',        unidad: 'M2', cantidad: '56.16', precioUnit: '39.9031' },
  ],
  gestorEmail: 'victor.moreno@mmhighmetrik.com',
  terminos: '- Terminos y condiciones de a cuerdo a cotizacion adjunta.\n- El precio está expresado en soles.',
};

// TEST 2 — OC grande con 25 ítems variados para probar multi-página + header repetido
const TEST_OC_DATA_BIG = {
  fechaEmision: '2026-04-22',
  moneda: 'PEN',
  medioPago: 'Transferencia Bancaria',
  formaPago: 'Crédito 30 días',
  cotizacion: 'COT-2026-SODIMAC-00483',
  proveedor: {
    razonSocial: 'Sodimac Perú S.A.',
    ruc: '20536557858',
    direccion: 'Av. Angamos Este 1805, Surquillo · Lima',
  },
  lugarEntrega: 'Av. República de Panamá 3591, San Isidro · Obra Belcorp (almacén N1)',
  concepto: 'BIEN',
  codigoProyecto: 'PG0021',
  proyectoInterno: projects[0]?.id || '',
  items: [
    { descripcion: 'CEMENTO PORTLAND TIPO I · BOLSA 42.5 KG · MARCA UNACEM',                             unidad: 'BLS', cantidad: '480',    precioUnit: '25.50' },
    { descripcion: 'ACERO CORRUGADO ASTM A615 GRADO 60 · 1/2" × 9 M · ACEROS AREQUIPA',                   unidad: 'UND', cantidad: '240',    precioUnit: '48.90' },
    { descripcion: 'ACERO CORRUGADO ASTM A615 GRADO 60 · 3/8" × 9 M · ACEROS AREQUIPA',                   unidad: 'UND', cantidad: '180',    precioUnit: '28.40' },
    { descripcion: 'ALAMBRE NEGRO RECOCIDO N° 16 · ROLLO 40 KG',                                          unidad: 'KG',  cantidad: '120',    precioUnit: '5.80' },
    { descripcion: 'CLAVOS PARA MADERA 2 1/2" · CAJA 25 KG',                                              unidad: 'CJ',  cantidad: '8',      precioUnit: '135.00' },
    { descripcion: 'LADRILLO KING KONG 18 HUECOS · 9×14×24 CM · LADRILLERA REX',                          unidad: 'UND', cantidad: '8400',   precioUnit: '1.28' },
    { descripcion: 'TUBO PVC-SAP CLASE 10 · 4" × 5 M · PAVCO',                                            unidad: 'UND', cantidad: '45',     precioUnit: '58.40' },
    { descripcion: 'TUBO PVC-SAP CLASE 10 · 2" × 5 M · PAVCO',                                            unidad: 'UND', cantidad: '60',     precioUnit: '22.50' },
    { descripcion: 'CODO PVC 90° 4" · PAVCO',                                                             unidad: 'UND', cantidad: '30',     precioUnit: '8.90' },
    { descripcion: 'CODO PVC 90° 2" · PAVCO',                                                             unidad: 'UND', cantidad: '80',     precioUnit: '3.20' },
    { descripcion: 'CABLE NH-80 2.5 MM² · ROJO/NEGRO/AZUL · INDECO · ROLLO 100 M',                        unidad: 'UND', cantidad: '12',     precioUnit: '185.00' },
    { descripcion: 'CABLE NH-80 4 MM² · VERDE AMARILLO · INDECO · ROLLO 100 M',                           unidad: 'UND', cantidad: '6',      precioUnit: '298.00' },
    { descripcion: 'TOMACORRIENTE DOBLE UNIVERSAL 16A · MARCA BTICINO LÍNEA MAGIC',                       unidad: 'UND', cantidad: '120',    precioUnit: '12.80' },
    { descripcion: 'INTERRUPTOR SIMPLE 10A · BTICINO LÍNEA MAGIC',                                        unidad: 'UND', cantidad: '80',     precioUnit: '9.50' },
    { descripcion: 'LUMINARIA LED PANEL 60×60 · 40W 6500K · PHILIPS',                                     unidad: 'UND', cantidad: '184',    precioUnit: '218.00' },
    { descripcion: 'PINTURA LÁTEX INTERIOR BLANCO MATE · GALÓN 4L · CPP',                                 unidad: 'GLN', cantidad: '85',     precioUnit: '68.50' },
    { descripcion: 'PINTURA ESMALTE SINTÉTICO BLANCO BRILLANTE · GALÓN 4L · CPP',                         unidad: 'GLN', cantidad: '24',     precioUnit: '92.00' },
    { descripcion: 'PORCELANATO CELIMA CONCRETO GRIS MATE 60×60 · CAJA 1.44 M2',                          unidad: 'M2',  cantidad: '186.40', precioUnit: '43.29' },
    { descripcion: 'CERÁMICA CELIMA BLANCO SATINADO 30×60 · CAJA 1.53 M2 (BAÑOS)',                        unidad: 'M2',  cantidad: '94.60',  precioUnit: '32.80' },
    { descripcion: 'PEGAMENTO CELIMA FLEXIBLE BLANCO · SACO 25 KG',                                       unidad: 'BLS', cantidad: '64',     precioUnit: '38.50' },
    { descripcion: 'FRAGUA ANTIHONGOS COLOR BLANCO · 5 KG',                                               unidad: 'KG',  cantidad: '60',     precioUnit: '18.90' },
    { descripcion: 'DRYWALL ETERNIT 1/2" ST · PLANCHA 1.22×2.44 M · REGULAR',                             unidad: 'UND', cantidad: '85',     precioUnit: '42.80' },
    { descripcion: 'PARANTE METÁLICO GALVANIZADO 1 5/8" × 2.44 M · ETERNIT',                              unidad: 'UND', cantidad: '180',    precioUnit: '14.50' },
    { descripcion: 'TORNILLO AUTOPERFORANTE DRYWALL 1" · BOLSA 500 UND',                                  unidad: 'UND', cantidad: '24',     precioUnit: '28.00' },
    { descripcion: 'SILICONA TRANSPARENTE TUBO 280 ML · PARA BAÑOS Y COCINAS',                            unidad: 'UND', cantidad: '48',     precioUnit: '14.80' },
  ],
  gestorEmail: 'mario.garcia@mmhighmetrik.com',
  terminos: '- Entregar en obra OB-2025-021, coordinar recepción con residente.\n- Precios expresados en soles INCLUIDO IGV 18%.\n- Sujeto a detracción SPOT 4% construcción.\n- Plazo de entrega: 15 días calendario desde emisión de esta OC.\n- Cualquier faltante o defecto será reportado dentro de 48 horas de recepción.',
};

// ── OC Success screen ────────────────────────────────────────────
function OCSuccess({ ocId, data, onClose }) {
  const [done, setDone] = useState(false);
  const total = (parseFloat(data.cantidad) * parseFloat(data.precioUnit)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

// ═══════════════════════════════════════════════════════════════
// NUEVA OC MODAL — form que genera la OC formato PDF MM
// ═══════════════════════════════════════════════════════════════
function NuevaOCModal({ onClose, onSubmit }) {
  const correlativo = useMemo(() => nextCorrelativo(), []);
  const ocNum = formatOCNum(correlativo);

  const [form, setForm] = useState({
    fechaEmision: new Date().toISOString().slice(0, 10),
    moneda: 'PEN',
    medioPago: 'Transferencia Bancaria',
    formaPago: 'Al contado',
    cotizacion: '',
    proveedor: { razonSocial: '', ruc: '', direccion: '' },
    lugarEntrega: 'LIMA',
    concepto: 'BIEN',
    codigoProyecto: '',
    proyectoInterno: projects[0]?.id || '',
    items: [{ descripcion: '', unidad: 'UND', cantidad: '', precioUnit: '' }],
    gestorEmail: GESTORES[0].email,
    terminos: '- Terminos y condiciones de a cuerdo a cotizacion adjunta.\n- El precio está expresado en soles.',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setProveedor = (k, v) => setForm(f => ({ ...f, proveedor: { ...f.proveedor, [k]: v } }));
  const setItem = (idx, k, v) => setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [k]: v } : it) }));
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { descripcion: '', unidad: 'UND', cantidad: '', precioUnit: '' }] }));
  const delItem = (idx) => setForm(f => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== idx) : f.items }));

  const selectProveedor = (name) => {
    const p = PROVEEDORES_COMUNES.find(x => x.name === name);
    if (!p) { setProveedor('razonSocial', name); return; }
    setForm(f => ({ ...f, proveedor: { razonSocial: p.name, ruc: p.ruc, direccion: p.dir } }));
  };

  const fillTest = () => setForm({ ...TEST_OC_DATA });
  const fillTestBig = () => setForm({ ...TEST_OC_DATA_BIG });

  // Totales
  const lineTotals = form.items.map(it => (parseFloat(it.cantidad) || 0) * (parseFloat(it.precioUnit) || 0));
  const total = lineTotals.reduce((s, n) => s + n, 0);

  const validProv = form.proveedor.razonSocial.trim() && /^\d{11}$/.test(form.proveedor.ruc);
  const validItems = form.items.every(it => it.descripcion.trim() && parseFloat(it.cantidad) > 0 && parseFloat(it.precioUnit) >= 0);
  const isValid = validProv && validItems && total > 0 && form.fechaEmision;

  const handleSubmit = () => {
    if (!isValid) return;
    saveCorrelativo(correlativo);
    const gestor = GESTORES.find(g => g.email === form.gestorEmail) || GESTORES[0];
    onSubmit(ocNum, {
      ...form,
      correlativo,
      ocNum,
      gestorNombre: gestor.nombre,
      creadoPor: gestor.email,
      totalGeneral: total,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 820, maxWidth: '96vw', padding: 0, overflow: 'hidden', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>Nueva Orden de Compra</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--mono)' }}>
              N° {ocNum} · {new Date().toLocaleDateString('es-PE')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={fillTest} style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px dashed var(--warn)', background: 'var(--warn-soft)', color: 'var(--warn-ink)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--mono)' }}>⚡ TEST</button>
            <button onClick={fillTestBig} title="OC grande · 25 ítems para probar multi-página" style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px dashed #7C3AED', background: '#EBE6FA', color: '#4526B8', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--mono)' }}>⚡⚡ TEST 2</button>
            <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
          </div>
        </div>

        {/* Body scroll */}
        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          {/* Datos comerciales */}
          <OCSection title="Datos comerciales">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <OCField label="Fecha emisión">
                <input type="date" value={form.fechaEmision} onChange={e => set('fechaEmision', e.target.value)} className="fin-input" />
              </OCField>
              <OCField label="Moneda">
                <select value={form.moneda} onChange={e => set('moneda', e.target.value)} className="fin-input">
                  <option value="PEN">Soles (S/)</option>
                  <option value="USD">Dólares ($)</option>
                </select>
              </OCField>
              <OCField label="Medio de pago">
                <select value={form.medioPago} onChange={e => set('medioPago', e.target.value)} className="fin-input">
                  <option>Transferencia Bancaria</option>
                  <option>Cheque</option>
                  <option>Efectivo</option>
                  <option>Tarjeta crédito</option>
                  <option>Letra de cambio</option>
                </select>
              </OCField>
              <OCField label="Forma de pago">
                <select value={form.formaPago} onChange={e => set('formaPago', e.target.value)} className="fin-input">
                  <option>Al contado</option>
                  <option>Crédito 7 días</option>
                  <option>Crédito 15 días</option>
                  <option>Crédito 30 días</option>
                  <option>Crédito 45 días</option>
                  <option>Crédito 60 días</option>
                </select>
              </OCField>
              <OCField label="Cotización (ref.)" hint="opcional">
                <input value={form.cotizacion} onChange={e => set('cotizacion', e.target.value)} placeholder="3007-0000259632" className="fin-input mono" />
              </OCField>
              <OCField label="Concepto">
                <select value={form.concepto} onChange={e => set('concepto', e.target.value)} className="fin-input">
                  <option>BIEN</option>
                  <option>SERVICIO</option>
                </select>
              </OCField>
            </div>
          </OCSection>

          {/* Proveedor */}
          <OCSection title="Proveedor">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
              <OCField label="Razón social" hint="Puedes elegir un proveedor frecuente o escribir uno nuevo">
                <input
                  value={form.proveedor.razonSocial}
                  onChange={e => selectProveedor(e.target.value)}
                  placeholder="Buscar o escribir nombre..."
                  className="fin-input"
                  list="proveedores-list"
                />
                <datalist id="proveedores-list">
                  {PROVEEDORES_COMUNES.map(p => <option key={p.ruc} value={p.name}>{p.ruc}</option>)}
                </datalist>
              </OCField>
              <OCField label="RUC" error={form.proveedor.ruc && !/^\d{11}$/.test(form.proveedor.ruc)} hint="11 dígitos">
                <input
                  value={form.proveedor.ruc}
                  onChange={e => setProveedor('ruc', e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  placeholder="20XXXXXXXXX"
                  className="fin-input mono"
                />
              </OCField>
            </div>
            <OCField label="Dirección">
              <input value={form.proveedor.direccion} onChange={e => setProveedor('direccion', e.target.value)} placeholder="Av. / Jr. / Calle ..." className="fin-input" />
            </OCField>
          </OCSection>

          {/* Entrega + proyecto */}
          <OCSection title="Entrega y proyecto">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <OCField label="Lugar de entrega">
                <input value={form.lugarEntrega} onChange={e => set('lugarEntrega', e.target.value)} placeholder="LIMA / dirección obra" className="fin-input" />
              </OCField>
              <OCField label="Código proyecto" hint="ej. PG0005">
                <input value={form.codigoProyecto} onChange={e => set('codigoProyecto', e.target.value.toUpperCase())} placeholder="PG0005" className="fin-input mono" />
              </OCField>
              <OCField label="Proyecto interno" hint="mapeo ERP">
                <select value={form.proyectoInterno} onChange={e => set('proyectoInterno', e.target.value)} className="fin-input">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name.split('—')[0].trim().slice(0, 34)}</option>)}
                </select>
              </OCField>
            </div>
          </OCSection>

          {/* Items */}
          <OCSection title="Ítems de la orden" actionBtn={
            <button className="tb-btn" onClick={addItem} style={{ height: 24, fontSize: 11 }}>{Icon.plus({ size: 11 })}Agregar ítem</button>
          }>
            <div className="vstack" style={{ gap: 8 }}>
              {form.items.map((it, i) => (
                <div key={i} style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>{(i + 1).toFixed(2).padStart(4, '0')}</span>
                    <input value={it.descripcion} onChange={e => setItem(i, 'descripcion', e.target.value)} placeholder="Descripción del ítem (producto o servicio)..." className="fin-input" style={{ fontSize: 11 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr 30px', gap: 8, alignItems: 'end' }}>
                    <OCField label="Unidad">
                      <select value={it.unidad} onChange={e => setItem(i, 'unidad', e.target.value)} className="fin-input" style={{ fontSize: 11 }}>
                        {UNIDADES_SUNAT.map(u => <option key={u.codigo} value={u.codigo}>{u.codigo} · {u.nombre}</option>)}
                      </select>
                    </OCField>
                    <OCField label="Cantidad">
                      <input type="number" min="0" step="0.01" value={it.cantidad} onChange={e => setItem(i, 'cantidad', e.target.value)} placeholder="0.00" className="fin-input mono" style={{ fontSize: 11 }} />
                    </OCField>
                    <OCField label={`Precio unit. ${form.moneda === 'PEN' ? 'S/' : '$'}`}>
                      <input type="number" min="0" step="0.00001" value={it.precioUnit} onChange={e => setItem(i, 'precioUnit', e.target.value)} placeholder="0.00" className="fin-input mono" style={{ fontSize: 11 }} />
                    </OCField>
                    <OCField label="Total línea">
                      <div className="fin-input mono" style={{ background: 'var(--bg)', cursor: 'default', fontSize: 11, fontWeight: 700, color: lineTotals[i] > 0 ? 'var(--ok-ink)' : 'var(--ink-4)' }}>
                        {form.moneda === 'PEN' ? 'S/ ' : '$ '}{lineTotals[i].toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </OCField>
                    <button onClick={() => delItem(i)} className="tb-icon-btn" style={{ height: 30, width: 30 }} title="Quitar ítem" disabled={form.items.length <= 1}>{Icon.x({ size: 12 })}</button>
                  </div>
                </div>
              ))}
            </div>
          </OCSection>

          {/* Gestor + términos */}
          <OCSection title="Gestión y términos">
            <OCField label="Creado por / Gestión">
              <select value={form.gestorEmail} onChange={e => set('gestorEmail', e.target.value)} className="fin-input">
                {GESTORES.map(g => <option key={g.email} value={g.email}>{g.nombre} · {g.email}</option>)}
              </select>
            </OCField>
            <div style={{ marginTop: 10 }}>
              <OCField label="Términos y condiciones (se mostrarán al pie)">
                <textarea
                  value={form.terminos}
                  onChange={e => set('terminos', e.target.value)}
                  rows={3}
                  className="fin-input"
                  style={{ resize: 'vertical', fontFamily: 'var(--sans)' }}
                />
              </OCField>
            </div>
          </OCSection>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elev)' }}>
          <div className="hstack" style={{ gap: 20 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ítems</div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{form.items.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total (INC. IGV)</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>
                {form.moneda === 'PEN' ? 'S/ ' : '$ '}{total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {!isValid && (
              <span style={{ fontSize: 11, color: 'var(--warn-ink)' }}>⚠ Completa proveedor, RUC válido y al menos 1 ítem con cantidad+precio</span>
            )}
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <button className="tb-btn" onClick={onClose}>Cancelar</button>
            <button
              className="tb-btn primary"
              disabled={!isValid}
              onClick={handleSubmit}
              style={{ opacity: isValid ? 1 : 0.45, cursor: isValid ? 'pointer' : 'not-allowed' }}
            >
              {Icon.check({ size: 13 })} Emitir OC y ver preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OCSection({ title, actionBtn, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="hstack between" style={{ marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {title}
        </span>
        {actionBtn}
      </div>
      {children}
    </div>
  );
}

function OCField({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="hstack between">
        <label style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</label>
        {hint && <span className="mono" style={{ fontSize: 9, color: error ? 'var(--danger)' : 'var(--ink-4)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OC PREVIEW MODAL — vista documento A4 replica del PDF MM
// ═══════════════════════════════════════════════════════════════
function OCPreviewModal({ data, onClose }) {
  const sheetRef = useRef(null);
  const [printing, setPrinting] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  // Genera un iframe aislado con SOLO la hoja A4 + CSS limpio, luego
  // dispara window.print() nativo. Produce PDF text-based (no imagen).
  const handlePrint = () => {
    if (!sheetRef.current || printing) return;
    setPrinting(true);

    const sheetHTML = sheetRef.current.outerHTML;

    // Extraer CSS del stylesheet local del ERP
    let cssText = '';
    try {
      cssText = Array.from(document.styleSheets)
        .filter(s => !s.href || s.href.includes(window.location.origin))
        .map(s => {
          try {
            return Array.from(s.cssRules).map(r => r.cssText).join('\n');
          } catch { return ''; }
        })
        .join('\n');
    } catch (e) { /* fallback abajo */ }

    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OC ${data.ocNum}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    ${cssText}
    /* Overrides específicos para iframe de impresión */
    html, body { margin: 0 !important; padding: 0 !important; background: #FFFFFF !important; }
    body > * { visibility: visible !important; display: block !important; }
    /* Estrategia print: @page maneja márgenes de cada página (breathing room
       uniforme en páginas 2+). El sheet NO tiene padding propio en print. */
    .oc-print-sheet {
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
    }
    @page { size: A4; margin: 14mm 16mm 12mm 16mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      /* Thead repetido en página 2+ con padding extra arriba para no pegarse al borde */
      .oc-items-table thead th { padding-top: 3mm; padding-bottom: 2mm; }
    }
  </style>
</head>
<body>
  ${sheetHTML}
</body>
</html>`;

    // Crear iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:-9999px;bottom:-9999px;width:0;height:0;border:0;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(fullHTML);
    doc.close();

    // Esperar carga de fonts/styles + imprimir
    const triggerPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) { console.error('Print error:', e); }
      // Limpia iframe después (2s de margen por si el diálogo sigue abierto)
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        setPrinting(false);
      }, 2000);
    };

    iframe.onload = () => setTimeout(triggerPrint, 400);
    // Fallback si onload no dispara
    setTimeout(() => { if (iframe.parentNode) triggerPrint(); }, 1200);
  };

  const items = data.items || [];
  const total = data.totalGeneral || 0;
  const monedaSym = data.moneda === 'PEN' ? 'S/' : '$';

  return (
    <div className="modal-overlay oc-preview-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 920, maxWidth: '96vw', padding: 0, overflow: 'hidden', maxHeight: '96vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Top bar de acciones (NO se imprime) */}
        <div className="oc-preview-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)', flexShrink: 0 }}>
          <div className="hstack" style={{ gap: 12 }}>
            <span className="chip green" style={{ fontSize: 10 }}>{Icon.check({ size: 10 })} Emitida</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>ORDEN DE COMPRA N° {data.ocNum}</span>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button
              className="tb-btn primary"
              onClick={handlePrint}
              disabled={printing}
              style={{ height: 28, fontSize: 11 }}
            >
              {printing ? '...' : <>{Icon.download({ size: 11 })} Imprimir / Guardar PDF</>}
            </button>
            <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 14 })}</button>
          </div>
        </div>

        {/* Hoja A4 (se imprime) — overflow auto permite scroll si viewport < 210mm */}
        <div className="oc-preview-scroll" style={{ flex: 1 }}>
          <div ref={sheetRef} className="oc-print-sheet">
            {/* Header: logo + título */}
            <div className="oc-header">
              <div className="oc-logo-wrap">
                {logoOk
                  ? <img src={EMISOR.logoUrl} alt="MM" className="oc-logo" onError={() => setLogoOk(false)} />
                  : (
                    <div className="oc-logo-fallback" style={{ display: 'flex' }}>
                      <div className="oc-logo-mm">MM</div>
                      <div className="oc-logo-sub">HIGH METRIK ENGINEERS</div>
                    </div>
                  )
                }
              </div>
              <div className="oc-header-right">
                <div className="oc-header-row">
                  <span className="oc-header-lbl">Fecha de emision</span>
                  <span className="oc-header-val">{new Date(data.fechaEmision).toLocaleDateString('es-PE')}</span>
                </div>
              </div>
            </div>

            {/* Título principal */}
            <div className="oc-title">ORDEN DE COMPRA N° {data.ocNum}</div>

            {/* Facturar a + Moneda/Medio/Forma/Cotización */}
            <div className="oc-section-title">Facturar a</div>
            <div className="oc-two-col">
              <table className="oc-kv">
                <tbody>
                  <tr><td className="oc-kv-label">Nombre de</td><td>:</td><td>{EMISOR.razonSocial}</td></tr>
                  <tr><td className="oc-kv-label">Dirección</td><td>:</td><td>{EMISOR.direccion.toUpperCase()}, {EMISOR.distrito.toUpperCase()} - {EMISOR.departamento.toUpperCase()}</td></tr>
                  <tr><td className="oc-kv-label">RUC</td><td>:</td><td>{EMISOR.ruc}</td></tr>
                  <tr><td className="oc-kv-label">Teléfono</td><td>:</td><td>{EMISOR.telefono2}</td></tr>
                </tbody>
              </table>
              <table className="oc-kv">
                <tbody>
                  <tr><td className="oc-kv-label-bold">Moneda</td><td>{data.moneda === 'PEN' ? 'Soles' : 'Dólares'}</td></tr>
                  <tr><td className="oc-kv-label-bold">Medio de pago</td><td>{data.medioPago}</td></tr>
                  <tr><td className="oc-kv-label-bold">Forma de pago</td><td>{data.formaPago}</td></tr>
                  {data.cotizacion && <tr><td className="oc-kv-label-bold">Cotización</td><td>{data.cotizacion}</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="oc-hr" />

            {/* Proveedor + Lugar de entrega */}
            <div className="oc-section-title">Proveedor</div>
            <div className="oc-two-col">
              <table className="oc-kv">
                <tbody>
                  <tr><td className="oc-kv-label">Nombre</td><td>:</td><td>{data.proveedor.razonSocial}</td></tr>
                  <tr><td className="oc-kv-label">Dirección</td><td>:</td><td>{data.proveedor.direccion}</td></tr>
                  <tr><td className="oc-kv-label">RUC</td><td>:</td><td>{data.proveedor.ruc}</td></tr>
                </tbody>
              </table>
              <table className="oc-kv" style={{ alignSelf: 'flex-end' }}>
                <tbody>
                  <tr><td className="oc-kv-label-bold">Lugar de entrega</td><td>{data.lugarEntrega}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Concepto */}
            <div className="oc-concepto-row">
              <span className="oc-concepto-lbl">Concepto</span>
              <span className="oc-concepto-colon">:</span>
              <span className="oc-concepto-val">{data.concepto}</span>
            </div>

            {/* Tabla ítems */}
            <table className="oc-items-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Item</th>
                  <th>Descripción</th>
                  <th style={{ width: 60 }}>Unid.</th>
                  <th style={{ width: 70 }}>Cant.</th>
                  <th style={{ width: 90 }}>Precio Unitario</th>
                  <th style={{ width: 110 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const cant = parseFloat(it.cantidad) || 0;
                  const pu = parseFloat(it.precioUnit) || 0;
                  const tot = cant * pu;
                  return (
                    <tr key={i}>
                      <td className="oc-cell-center mono">{(i + 1).toFixed(2).padStart(4, '0')}</td>
                      <td className="oc-cell-desc">{it.descripcion}</td>
                      <td className="oc-cell-center">{it.unidad}</td>
                      <td className="oc-cell-right mono">{cant.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="oc-cell-right mono">{monedaSym}&nbsp;{pu.toLocaleString('es-PE', { minimumFractionDigits: 5 })}</td>
                      <td className="oc-cell-right mono">{monedaSym}&nbsp;{tot.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totales FUERA de <tfoot> — evita que se repita en cada página con multi-página */}
            <table className="oc-items-total-table">
              <tbody>
                <tr>
                  <td colSpan="4" className="oc-cell-label">PROYECTO: <b>{data.codigoProyecto || '—'}</b></td>
                  <td className="oc-cell-right oc-cell-label" style={{ width: 90 }}><b>TOTAL (INC. IGV)</b></td>
                  <td className="oc-cell-right oc-cell-total mono" style={{ width: 110 }}>{monedaSym}&nbsp;{total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            {/* Generales + Firma */}
            <div className="oc-generales-block">
              <div>
                <div className="oc-generales-title">Generales</div>
                <div className="oc-generales-body">{data.terminos}</div>
              </div>
              <div className="oc-firma-wrap">
                <div className="oc-firma-box">
                  <span className="oc-firma-label">FIRMA</span>
                </div>
                <div className="oc-firma-caption">
                  {EMISOR.razonSocial}<br />
                  <b>MARIO A. GARCÍA CALDERÓN</b><br />
                  SUB GERENTE
                </div>
              </div>
            </div>

            {/* Texto legal */}
            <div className="oc-legal">
              Estimado proveedor no olvidar adjuntar los sustentos necesarios (orden de servicio/compra debidamente firmada y guía de remisión) para poder presentar su factura en nuestra oficina {EMISOR.direccion}, {EMISOR.distrito} - {EMISOR.departamento} y no estar sujetos a demora en su pago. Una vez confirmada la recepción de la Orden de Compra se dará por aceptada la misma sino recibimos ninguna observación luego de 24 horas. Si la cantidad o especificaciones del producto no corresponde a lo solicitado, el producto no será recibido y/o será devuelto al proveedor sin cargo alguno para la empresa. Al entregar la mercadería, indicar en las Guías de Remisión el número de Orden de Compra correspondiente. El proveedor es responsable de entregar la factura en Mesa de Partes de caso contrario no se procederá a registrar la factura para el respectivo pago. Si la venta del producto o prestación del servicio se encuentra afecta a detracción, deberá indicarse el importe afecto a esta y los datos de la cuenta corriente bancaria donde se debe realizar el depósito. El proveedor acepta que, durante el plazo del servicio y/o adquisición del producto, y por un período de tres años posterior al mismo, conservará los registros y libros contables correspondientes relacionados con los servicios en virtud de las prácticas contables generalmente aceptadas y que permitirá a {EMISOR.razonSocial} a inspeccionar los Registros, políticas y procedimientos aplicables a los servicios, previo aviso por escrito con razonable antelación, en cualquier momento. Este derecho de Auditoría incluirá a todos los subcontratistas. En conexión con cualquier auditoría, el proveedor acuerda que ofrecerá una colaboración razonable a {EMISOR.razonSocial}, y acepta que cuando una auditoría indique algún error o pago excesivo, o cualquier otro incumplimiento del presente Contrato, el proveedor corregirá dichos errores de inmediato y hará un pleno reembolso a {EMISOR.razonSocial} de todo pago excesivo.
            </div>

            {/* Wrapper que mantiene Creado por + Footer empresa juntos (no se separan entre páginas) */}
            <div className="oc-bottom-group">
              <div className="oc-creado-row">
                <div className="oc-creado-block">
                  <span className="oc-creado-lbl">Creado por</span>
                  <span className="oc-creado-val oc-creado-email">{data.creadoPor}</span>
                </div>
                <div className="oc-creado-block oc-creado-block-right">
                  <span className="oc-creado-lbl">Gestion:</span>
                  <span className="oc-creado-val">{data.gestorNombre}</span>
                </div>
              </div>

              <div className="oc-footer-empresa">
                {EMISOR.direccion} - {EMISOR.distrito} - {EMISOR.departamento}<br />
                Telf. {EMISOR.telefono}<br />
                e-mail: {EMISOR.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OC EMITTING — pantalla intermedia (spinner → check → preview)
// ═══════════════════════════════════════════════════════════════
function OCEmitting({ ocNum, onComplete }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDone(true), 1400);
    const t2 = setTimeout(onComplete, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ width: 380, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--ok-soft)', filter: 'blur(14px)', opacity: done ? 0.9 : 0.4, transition: 'opacity .6s' }} />
            {!done ? (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="oc-spinner" />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ok)' }}>
                  {Icon.cart({ size: 18 })}
                </div>
              </div>
            ) : (
              <svg width="72" height="72" viewBox="0 0 100 100" style={{ position: 'relative', zIndex: 1 }}>
                <circle className="oc-check-circle" cx="50" cy="50" r="42" fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinecap="round" />
                <path className="oc-check-path" d="M32 50L45 63L68 35" fill="none" stroke="var(--ok)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, letterSpacing: '-0.01em' }}>
            {done ? 'Orden de compra emitida' : 'Procesando OC…'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
            N° {ocNum}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {done ? 'Abriendo vista previa del documento...' : 'Validando datos y generando correlativo'}
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== COMPRAS ===================
function ComprasPage() {
  const [tab, setTab] = useState('ordenes');
  const [showModal, setShowModal] = useState(false);
  const [phase, setPhase] = useState(null);         // null | 'emitting' | 'preview'
  const [emittedData, setEmittedData] = useState(null);

  const handleSubmit = (ocNum, data) => {
    setShowModal(false);
    setEmittedData(data);
    setPhase('emitting');
  };
  const handleEmittingComplete = () => setPhase('preview');
  const handleSuccessClose = () => { setPhase(null); setEmittedData(null); };

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
      {phase === 'emitting' && emittedData && <OCEmitting ocNum={emittedData.ocNum} onComplete={handleEmittingComplete} />}
      {phase === 'preview' && emittedData && <OCPreviewModal data={emittedData} onClose={handleSuccessClose} />}

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
