/* global React, Icon, ERP_DATA, echarts */
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const { fmtPEN, fmtInt, fmtPct, fmtCompact, projects, cashflow, sunatConciliaciones } = ERP_DATA;

// Componentes compartidos (definidos en DashboardPage.jsx, expuestos en window)
const SharedCashflowDrill = window.CashflowDrill;
const SharedCategoryModal = window.CashflowCategoryModal;
const SharedAnimatedDrill = window.AnimatedDrill;
const SharedSunatPage = window.SunatPage;

const getCssVar = (name) => {
  try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined; }
  catch { return undefined; }
};

// ── Constantes de configuración ──────────────────────────────────
const SUBTIPOS = {
  Ingreso:  ['Valorización', 'Adelanto directo', 'Devolución', 'Otro ingreso'],
  Egreso:   ['Materiales', 'Mano de obra / Planilla', 'Subcontrato', 'Equipos y alquileres', 'Gastos de oficina', 'Tributos / SUNAT', 'Otro egreso'],
  Bancario: ['Transferencia entre cuentas', 'Comisión bancaria', 'ITF', 'Interés ganado', 'Cargo mantenimiento', 'Depósito detracciones', 'Otro bancario'],
};

// Cuentas bancarias propias
const CUENTAS_BANCARIAS = [
  { id: 'BCP-SOL',   banco: 'BCP',          tipo: 'Corriente',     moneda: 'PEN', numero: '194-2345678-0-01',     alias: 'BCP Soles · Principal' },
  { id: 'BCP-USD',   banco: 'BCP',          tipo: 'Corriente',     moneda: 'USD', numero: '194-2345678-1-02',     alias: 'BCP Dólares' },
  { id: 'BCP-DET',   banco: 'Banco Nación', tipo: 'Detracciones',  moneda: 'PEN', numero: 'DET-00045678',         alias: 'Detracciones · Banco Nación' },
  { id: 'IBK-SOL',   banco: 'Interbank',    tipo: 'Corriente',     moneda: 'PEN', numero: '200-3005678900',       alias: 'Interbank Soles' },
  { id: 'BBVA-SOL',  banco: 'BBVA',         tipo: 'Ahorros obras', moneda: 'PEN', numero: '0011-0345-0200456123', alias: 'BBVA · Ahorros obras' },
  { id: 'CAJA-LIM',  banco: 'Caja chica',   tipo: 'Efectivo',      moneda: 'PEN', numero: '—',                    alias: 'Caja chica · Oficina Lima' },
];

// Documentos origen — catálogos mock para el select agrupado
const COTIZACIONES_APROBADAS = [
  { id: 'COT-2026-045', proveedor: 'Promart Maestro',       ruc: '20536557858', monto: 8400,  proyecto: 'OB-2025-021', item: 'Herramientas menores y EPP' },
  { id: 'COT-2026-042', proveedor: 'Ferretería Mi Casa',    ruc: '20512349991', monto: 3240,  proyecto: 'OB-2025-018', item: 'Pintura esmalte · 20 gal' },
  { id: 'COT-2026-038', proveedor: 'Aceros Chilca',         ruc: '20518822176', monto: 18600, proyecto: 'OB-2025-021', item: 'Perfiles metálicos 4"' },
];

const ORDENES_SERVICIO = [
  { id: 'OS-2026-008', proveedor: 'Electroinsa SAC', ruc: '20523411882', monto: 42800, proyecto: 'OB-2025-021', item: 'Instalaciones eléctricas piso 3' },
  { id: 'OS-2026-005', proveedor: 'Topomatic Peru',  ruc: '20512344551', monto: 12400, proyecto: 'OB-2025-018', item: 'Topografía levantamiento final' },
];

const CONTRATOS_VIGENTES = [
  { id: 'CTR-2025-012', proveedor: 'Climatización Andina', ruc: '20600112233', monto: 180000, proyecto: 'OB-2025-021', item: 'Instalación HVAC completo' },
  { id: 'CTR-2025-008', proveedor: 'Sanimetal SAC',        ruc: '20547812345', monto: 96400,  proyecto: 'OB-2025-021', item: 'Instalaciones sanitarias' },
];

const REQUERIMIENTOS_INTERNOS = [
  { id: 'REQ-2026-042', desc: 'Tuberías PVC SAP 4" · 180 m', proyecto: 'OB-2025-021', monto: 0 },
  { id: 'REQ-2026-041', desc: 'Concreto premezclado f\'c=210 · 24 m³', proyecto: 'OB-2025-018', monto: 0 },
];

// Valorizaciones derivadas del cashflow (para select ingresos)
function getValorizaciones() {
  return cashflow
    .flatMap(m => m.detalleIng.filter(e => e.tipo === 'Valorización').map(v => ({
      id: (v.concepto.match(/V\d+/) || ['V?'])[0],
      cliente: v.contraparte,
      proyecto: v.proyecto,
      monto: v.monto,
      status: v.status,
    })))
    .filter((v, i, arr) => arr.findIndex(x => x.id === v.id && x.cliente === v.cliente) === i);
}

const DESTINOS_ADMIN = [
  { value: 'OFICINA',  label: 'Gastos de oficina (empresa)' },
  { value: 'PLANILLA', label: 'Planilla administrativa' },
];

function getDestinos() {
  const active = projects.filter(p => p.status === 'En ejecución');
  return [
    ...active.map(p => ({
      value: p.id,
      label: `${p.id} — ${p.name.split('—')[0].trim()}`,
    })),
    ...DESTINOS_ADMIN,
  ];
}

// ── Flatten de movimientos desde cashflow ────────────────────────
function flattenTransactions(monthsData, projectFilter = 'ALL') {
  const rows = [];
  monthsData.forEach(m => {
    m.detalleIng.forEach(e => {
      if (projectFilter !== 'ALL' && e.proyecto !== projectFilter) return;
      rows.push({
        fecha: e.fecha, tipo: 'Ingreso', subtipo: e.tipo,
        comprobante: e.comprobante, concepto: e.concepto,
        proyecto: e.proyecto, contraparte: e.contraparte,
        monto: e.monto, estado: e.status, _month: m.month,
      });
    });
    m.detalleEg.forEach(e => {
      if (projectFilter !== 'ALL' && e.proyecto !== projectFilter) return;
      rows.push({
        fecha: e.fecha, tipo: 'Egreso', subtipo: e.categoria,
        comprobante: e.comprobante, concepto: e.concepto,
        proyecto: e.proyecto, contraparte: e.contraparte,
        monto: -e.monto, estado: e.status, _month: m.month,
      });
    });
  });
  rows.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return rows;
}

// ── Catálogos peruanos ───────────────────────────────────────────
const TIPOS_COMPROBANTE = [
  { value: 'Factura',       prefix: 'F001-', format: 'F001-XXXXXXXX' },
  { value: 'Boleta',        prefix: 'B001-', format: 'B001-XXXXXXXX' },
  { value: 'Recibo Honorarios', prefix: 'E001-', format: 'E001-XXXXXXXX' },
  { value: 'Nota Crédito',  prefix: 'FC01-', format: 'FC01-XXXXXXXX' },
  { value: 'Nota Débito',   prefix: 'FD01-', format: 'FD01-XXXXXXXX' },
  { value: 'Planilla',      prefix: 'PL-',   format: 'PL-YYYY-MM' },
  { value: 'Detracción',    prefix: 'DET-',  format: 'DET-XXXXXXXX' },
  { value: 'Otro',          prefix: '',      format: 'Libre' },
];

const METODOS_PAGO = ['Transferencia', 'Efectivo', 'Cheque', 'Tarjeta crédito', 'Tarjeta débito', 'Depósito cuenta detracciones'];

const DETRACCION_PCT = [
  { value: 4,  label: '4% · Construcción / Servicios' },
  { value: 10, label: '10% · Fabricación por encargo' },
  { value: 12, label: '12% · Arrendamiento bienes' },
  { value: 15, label: '15% · Otros servicios' },
];

// Contrapartes derivadas de data (autocomplete)
const CONTRAPARTES_DATA = (() => {
  const map = new Map();
  cashflow.forEach(m => {
    m.detalleEg.forEach(e => {
      if (e.contraparte && !['Varios', 'Planilla interna', 'SUNAT'].includes(e.contraparte)) {
        map.set(e.contraparte, { nombre: e.contraparte, tipo: 'Proveedor' });
      }
    });
    m.detalleIng.forEach(e => {
      if (e.contraparte) {
        map.set(e.contraparte, { nombre: e.contraparte, tipo: 'Cliente' });
      }
    });
  });
  return Array.from(map.values());
})();

const RUC_KNOWN = {
  'UNACEM S.A.A.': '20100030595',
  'Aceros Arequipa': '20100128218',
  'Philips Perú': '20100023082',
  'Indeco Perú': '20100074298',
  'Sodimac Perú': '20536557858',
  'Celima': '20100166221',
  'Climatización Andina': '20600112233',
  'Vainsa Perú': '20512345001',
  'Corporación Belcorp S.A.': '20100055237',
  'Logística Andina SAC': '20548877412',
  'Grupo Retail Perú': '20566123841',
};

// OCs abiertas — usadas para vincular egresos
const OCS_ABIERTAS = [
  { id: 'OC-2026-015', proveedor: 'Aceros Arequipa S.A.', ruc: '20100128218', monto: 24820, proyecto: 'OB-2025-021', item: 'Acero corrugado fy=4200 · 4.2 ton' },
  { id: 'OC-2026-014', proveedor: 'UNACEM S.A.A.',        ruc: '20100030595', monto: 36480, proyecto: 'OB-2025-018', item: 'Cemento Portland Tipo I · 480 bls' },
  { id: 'OC-2026-011', proveedor: 'Unimaq S.A.C.',        ruc: '20504645046', monto: 27750, proyecto: 'OB-2025-018', item: 'Alquiler retroexcavadora 420F · 15 días' },
  { id: 'OC-2026-010', proveedor: 'Sodimac Perú',         ruc: '20536557858', monto: 6840,  proyecto: 'OB-2025-024', item: 'Pintura látex · 80 galones' },
];

// Data de TEST por tipo (full peruano)
const MOV_TEST_EGRESO = {
  tipo: 'Egreso',
  subtipo: 'Materiales',
  destino: 'OB-2025-021',
  partida: '03.01.02',
  tipoComp: 'Factura',
  comprobante: 'F004-28412',
  tipoDoc: 'RUC',
  docIdentificador: '20100030595',
  contraparte: 'UNACEM S.A.A.',
  moneda: 'PEN',
  subtotal: '18240.00',
  aplicaIGV: true,
  aplicaDetraccion: true,
  detraccionPct: '4',
  aplicaRetencion: false,
  retencionPct: '3',
  fechaEmision: '2026-04-18',
  fechaVencimiento: '2026-05-18',
  estado: 'Pagada',
  metodoPago: 'Transferencia',
  nOperacion: 'TRF-BCP-0014829',
  docOrigenTipo: 'OC',
  docOrigenId: 'OC-2026-014',
  cuentaOrigen: '',
  cuentaDestino: '',
  descripcion: 'Cemento Portland Tipo I · 240 bls · entrega obra Belcorp almacén N1',
  archivoPDF: 'F004-28412-UNACEM.pdf',
  archivoXML: 'F004-28412.xml',
};

const MOV_TEST_INGRESO = {
  tipo: 'Ingreso',
  subtipo: 'Valorización',
  destino: 'OB-2025-021',
  partida: '',
  tipoComp: 'Factura',
  comprobante: 'F001-00348',
  tipoDoc: 'RUC',
  docIdentificador: '20100055237',
  contraparte: 'Corporación Belcorp S.A.',
  moneda: 'PEN',
  subtotal: '61016.95',
  aplicaIGV: true,
  aplicaDetraccion: false,
  detraccionPct: '4',
  aplicaRetencion: false,
  retencionPct: '3',
  fechaEmision: '2026-03-29',
  fechaVencimiento: '2026-04-28',
  estado: 'Por cobrar',
  metodoPago: '',
  nOperacion: '',
  docOrigenTipo: 'V',
  docOrigenId: 'V07',
  cuentaOrigen: '',
  cuentaDestino: '',
  descripcion: 'Valorización mensual Marzo 2026 · avance físico 62%',
  archivoPDF: 'V07-Marzo2026.pdf',
  archivoXML: '',
};

const MOV_TEST_BANCARIO = {
  tipo: 'Bancario',
  subtipo: 'Transferencia entre cuentas',
  destino: 'OFICINA',
  partida: '',
  tipoComp: 'N° operación',
  comprobante: '',
  tipoDoc: 'RUC',
  docIdentificador: '',
  contraparte: '',
  moneda: 'PEN',
  subtotal: '120000.00',
  aplicaIGV: false,
  aplicaDetraccion: false,
  detraccionPct: '4',
  aplicaRetencion: false,
  retencionPct: '3',
  fechaEmision: '2026-04-22',
  fechaVencimiento: '',
  estado: 'Completada',
  metodoPago: '',
  nOperacion: 'TRF-IBK-088422716',
  docOrigenTipo: '',
  docOrigenId: '',
  cuentaOrigen: 'BCP-SOL',
  cuentaDestino: 'IBK-SOL',
  descripcion: 'Redistribución fondos para pagos de planilla próximo viernes',
  archivoPDF: '',
  archivoXML: '',
};

// ── MovimientoSuccess (versión peruana con desglose completo) ────
function MovimientoSuccess({ data, onClose, movId }) {
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDone(true), 1400); return () => clearTimeout(t); }, []);

  const isIngreso = data.tipo === 'Ingreso';
  const isBancario = data.tipo === 'Bancario';
  const isTransf = isBancario && data.subtipo === 'Transferencia entre cuentas';
  const color = isIngreso ? 'var(--ok)' : isBancario ? 'var(--accent)' : 'var(--danger)';

  const subtotal = parseFloat(data.subtotal) || 0;
  const igv = (!isBancario && data.aplicaIGV) ? subtotal * 0.18 : 0;
  const detrac = (!isBancario && data.aplicaDetraccion) ? (subtotal + igv) * (parseFloat(data.detraccionPct) / 100) : 0;
  const retenc = (!isBancario && data.aplicaRetencion) ? (subtotal + igv) * (parseFloat(data.retencionPct) / 100) : 0;
  const total = isBancario ? subtotal : (subtotal + igv - detrac - retenc);

  const cuentaOrigen = CUENTAS_BANCARIAS.find(c => c.id === data.cuentaOrigen);
  const cuentaDestino = CUENTAS_BANCARIAS.find(c => c.id === data.cuentaDestino);

  const docOrigenLabel = data.docOrigenTipo && data.docOrigenId
    ? ({ OC: 'OC', COT: 'Cotización', OS: 'Orden servicio', CTR: 'Contrato', V: 'Valorización', REQ: 'Requerimiento' }[data.docOrigenTipo] || 'Doc') + ': ' + data.docOrigenId
    : null;

  return (
    <div style={{ padding: '28px 24px', textAlign: 'center' }}>
      {!done ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="oc-spinner" /></div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="60" height="60" viewBox="0 0 72 72">
              <circle className="oc-check-circle" cx="36" cy="36" r="28"
                stroke={color} strokeWidth="3" fill="none"
                strokeDasharray="176" strokeDashoffset="176" />
              <polyline className="oc-check-path" points="22,37 31,47 50,26"
                fill="none" stroke={color} strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="44" strokeDashoffset="44" />
            </svg>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Movimiento registrado</div>
          <div className="mono text-xs muted" style={{ marginBottom: 18 }}>
            {movId} · {data.fechaEmision}
          </div>

          <div style={{ background: 'var(--bg-sunken)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 16 }}>
            {/* Encabezado de datos generales */}
            {isBancario ? (
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left' }}>
                <div style={{ gridColumn: '1 / -1' }}><div className="oc-lbl">Tipo</div><div className="oc-val" style={{ color }}>{data.tipo} · {data.subtipo}</div></div>
                {cuentaOrigen && <div><div className="oc-lbl">{isTransf ? 'Cuenta origen' : 'Cuenta'}</div><div className="oc-val" style={{ fontSize: 11 }}>{cuentaOrigen.alias}<br /><span className="mono muted text-xs">{cuentaOrigen.numero}</span></div></div>}
                {isTransf && cuentaDestino && <div><div className="oc-lbl">Cuenta destino</div><div className="oc-val" style={{ fontSize: 11 }}>{cuentaDestino.alias}<br /><span className="mono muted text-xs">{cuentaDestino.numero}</span></div></div>}
                {data.nOperacion && <div><div className="oc-lbl">{data.tipoComp || 'N° operación'}</div><div className="oc-val mono" style={{ fontSize: 11 }}>{data.nOperacion}</div></div>}
                <div><div className="oc-lbl">Estado</div><div className="oc-val">{data.estado}</div></div>
              </div>
            ) : (
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left' }}>
                <div><div className="oc-lbl">Tipo</div><div className="oc-val" style={{ color }}>{data.tipo} · {data.subtipo}</div></div>
                <div><div className="oc-lbl">Proyecto</div><div className="oc-val">{data.destino}</div></div>
                <div><div className="oc-lbl">{isIngreso ? 'Cliente' : 'Proveedor'}</div><div className="oc-val" style={{ fontSize: 12 }}>{data.contraparte}</div></div>
                <div><div className="oc-lbl">{data.tipoDoc}</div><div className="oc-val mono">{data.docIdentificador}</div></div>
                <div><div className="oc-lbl">Comprobante</div><div className="oc-val mono">{data.tipoComp} · {data.comprobante}</div></div>
                <div><div className="oc-lbl">Estado</div><div className="oc-val">{data.estado}</div></div>
              </div>
            )}

            {/* Breakdown contable — distinto para Bancario */}
            <div style={{ padding: '12px 14px', background: 'var(--bg-elev)', textAlign: 'left' }}>
              {isBancario ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Monto {isTransf ? 'transferido' : 'operación'}</span>
                  <span className="mono" style={{ fontSize: 20, fontWeight: 800, color }}>
                    {data.moneda === 'PEN' ? 'S/ ' : '$ '}{total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <>
                  <BreakdownRow label="Subtotal" val={subtotal} />
                  {data.aplicaIGV && <BreakdownRow label="IGV 18%" val={igv} />}
                  {data.aplicaDetraccion && <BreakdownRow label={`Detracción ${data.detraccionPct}%`} val={-detrac} />}
                  {data.aplicaRetencion && <BreakdownRow label={`Retención ${data.retencionPct}%`} val={-retenc} />}
                  <div style={{ borderTop: '1px dashed var(--line)', marginTop: 6, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Total {isIngreso ? 'a cobrar' : 'a pagar'}</span>
                    <span className="mono" style={{ fontSize: 18, fontWeight: 800, color }}>
                      {isIngreso ? '+' : '-'}{total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>

            {(!isBancario && data.metodoPago && (data.estado === 'Pagada' || data.estado === 'Cobrada')) && (
              <div style={{ padding: '10px 14px', background: 'var(--ok-soft)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left', borderTop: '1px solid var(--line)' }}>
                <div><div className="oc-lbl">Método pago</div><div className="oc-val" style={{ fontSize: 12 }}>{data.metodoPago}</div></div>
                {data.nOperacion && <div><div className="oc-lbl">N° operación</div><div className="oc-val mono" style={{ fontSize: 11 }}>{data.nOperacion}</div></div>}
              </div>
            )}

            {docOrigenLabel && (
              <div style={{ padding: '10px 14px', background: 'var(--accent-soft)', textAlign: 'left', borderTop: '1px solid var(--line)' }}>
                <div className="oc-lbl">Documento origen</div>
                <div className="oc-val mono" style={{ fontSize: 12, color: 'var(--accent-ink)' }}>{docOrigenLabel}</div>
              </div>
            )}

            {data.partida && (
              <div style={{ padding: '10px 14px', background: 'var(--bg-sunken)', textAlign: 'left', borderTop: '1px solid var(--line)' }}>
                <div className="oc-lbl">Partida presupuestal</div>
                <div className="oc-val mono" style={{ fontSize: 12 }}>{data.partida}</div>
              </div>
            )}
          </div>

          {data.descripcion && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 16, fontStyle: 'italic', textAlign: 'left' }}>"{data.descripcion}"</div>
          )}

          {(data.archivoPDF || data.archivoXML) && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {data.archivoPDF && <span className="chip green" style={{ fontSize: 10 }}>{Icon.check({ size: 10 })} {data.archivoPDF}</span>}
              {data.archivoXML && <span className="chip blue" style={{ fontSize: 10 }}>{Icon.check({ size: 10 })} {data.archivoXML}</span>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tb-btn" style={{ flex: 1, justifyContent: 'center', padding: '9px 0' }} onClick={onClose}>Cerrar</button>
            <button className="tb-btn primary" style={{ flex: 1, justifyContent: 'center', padding: '9px 0' }} onClick={onClose}>
              {Icon.check({ size: 13 })} Ver en movimientos
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function BreakdownRow({ label, val }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span className="mono" style={{ color: val < 0 ? 'var(--danger)' : 'var(--ink-2)' }}>
        {val < 0 ? '-' : ''}{Math.abs(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

// ── NuevoMovimientoModal (FULL PERUANO) ──────────────────────────
function NuevoMovimientoModal({ onClose, onSubmit }) {
  const destinos = useMemo(() => getDestinos(), []);
  const [tipo, setTipo] = useState('Egreso');
  const [showPartida, setShowPartida] = useState(false);
  const [form, setForm] = useState(() => ({
    subtipo: 'Materiales',
    destino: destinos[0].value,
    partida: '',
    tipoComp: 'Factura',
    comprobante: 'F001-',
    tipoDoc: 'RUC',
    docIdentificador: '',
    contraparte: '',
    moneda: 'PEN',
    subtotal: '',
    aplicaIGV: true,
    aplicaDetraccion: false,
    detraccionPct: '4',
    aplicaRetencion: false,
    retencionPct: '3',
    fechaEmision: new Date().toISOString().slice(0, 10),
    fechaVencimiento: '',
    estado: 'Pendiente',
    metodoPago: '',
    nOperacion: '',
    // Documento origen (reemplaza OC vinculada)
    docOrigenTipo: '',  // 'OC' | 'COT' | 'OS' | 'CTR' | 'V' | 'REQ' | 'ADL' | ''
    docOrigenId: '',
    // Bancario
    cuentaOrigen: '',
    cuentaDestino: '',
    descripcion: '',
    archivoPDF: '',
    archivoXML: '',
  }));

  const movId = useMemo(() => 'MOV-2026-' + String(Math.floor(Math.random() * 9000) + 1000), []);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTipo = (t) => {
    setTipo(t);
    setForm(f => ({
      ...f,
      subtipo: SUBTIPOS[t][0],
      estado: t === 'Ingreso' ? 'Por cobrar' : t === 'Egreso' ? 'Pendiente' : 'Completada',
      tipoComp: 'Factura',
      comprobante: 'F001-',
      docOrigenTipo: '',
      docOrigenId: '',
      cuentaOrigen: t === 'Bancario' ? CUENTAS_BANCARIAS[0].id : '',
      cuentaDestino: '',
      aplicaIGV: t !== 'Bancario',
      aplicaDetraccion: false,
      aplicaRetencion: false,
    }));
  };

  const handleTipoComp = (v) => {
    const meta = TIPOS_COMPROBANTE.find(x => x.value === v);
    setForm(f => ({
      ...f,
      tipoComp: v,
      comprobante: meta ? meta.prefix : '',
      tipoDoc: v === 'Recibo Honorarios' ? 'DNI' : 'RUC',
    }));
  };

  const handleContraparte = (name) => {
    set('contraparte', name);
    if (RUC_KNOWN[name]) set('docIdentificador', RUC_KNOWN[name]);
  };

  // Busca el documento en los catálogos según tipo + id
  const findDocOrigen = (tipoDoc, id) => {
    if (tipoDoc === 'OC')  return OCS_ABIERTAS.find(x => x.id === id);
    if (tipoDoc === 'COT') return COTIZACIONES_APROBADAS.find(x => x.id === id);
    if (tipoDoc === 'OS')  return ORDENES_SERVICIO.find(x => x.id === id);
    if (tipoDoc === 'CTR') return CONTRATOS_VIGENTES.find(x => x.id === id);
    return null;
  };

  // Select change del documento origen (formato: "TIPO:ID")
  const handleDocOrigenSelect = (combined) => {
    if (!combined) {
      setForm(f => ({ ...f, docOrigenTipo: '', docOrigenId: '' }));
      return;
    }
    const [tipoDoc, id] = combined.split(':');
    const doc = findDocOrigen(tipoDoc, id);
    if (!doc) {
      setForm(f => ({ ...f, docOrigenTipo: tipoDoc, docOrigenId: id }));
      return;
    }
    // Auto-fill para tipos que traen proveedor + RUC + monto + proyecto + item
    setForm(f => ({
      ...f,
      docOrigenTipo: tipoDoc,
      docOrigenId: id,
      contraparte: doc.proveedor || f.contraparte,
      docIdentificador: doc.ruc || f.docIdentificador,
      destino: doc.proyecto || f.destino,
      subtotal: doc.monto ? doc.monto.toFixed(2) : f.subtotal,
      descripcion: doc.item || f.descripcion,
    }));
  };

  const handleValorizacionSelect = (v) => {
    if (!v) { setForm(f => ({ ...f, docOrigenTipo: '', docOrigenId: '' })); return; }
    // v format: "V##:Cliente:monto:proyecto"
    const [id, cliente, monto, proyecto] = v.split('|');
    setForm(f => ({
      ...f,
      docOrigenTipo: 'V',
      docOrigenId: id,
      contraparte: cliente,
      destino: proyecto,
      subtotal: monto,
    }));
  };

  const handleFechaEmision = (v) => {
    setForm(f => {
      // Vencimiento auto = emisión + 30 días si no hay manual
      const next = { ...f, fechaEmision: v };
      if (!f.fechaVencimiento && v) {
        const d = new Date(v);
        d.setDate(d.getDate() + 30);
        next.fechaVencimiento = d.toISOString().slice(0, 10);
      }
      return next;
    });
  };

  const fillTest = () => {
    const data = tipo === 'Ingreso' ? MOV_TEST_INGRESO : tipo === 'Bancario' ? MOV_TEST_BANCARIO : MOV_TEST_EGRESO;
    setTipo(data.tipo);
    setForm({ ...data });
    if (data.partida) setShowPartida(true);
  };

  // Cálculos
  const subtotal = parseFloat(form.subtotal) || 0;
  const igv = form.aplicaIGV ? subtotal * 0.18 : 0;
  const detrac = form.aplicaDetraccion ? (subtotal + igv) * (parseFloat(form.detraccionPct) / 100) : 0;
  const retenc = form.aplicaRetencion ? (subtotal + igv) * (parseFloat(form.retencionPct) / 100) : 0;
  const total = subtotal + igv - detrac - retenc;

  const isIngreso = tipo === 'Ingreso';
  const isBancario = tipo === 'Bancario';
  const isTransferencia = isBancario && form.subtipo === 'Transferencia entre cuentas';

  // Validaciones adaptativas
  const validDocPersonal = isBancario ? true : (form.tipoDoc === 'RUC' ? /^\d{11}$/.test(form.docIdentificador) : form.tipoDoc === 'DNI' ? /^\d{8}$/.test(form.docIdentificador) : form.docIdentificador.length >= 8);
  const validAmount = subtotal > 0;
  const validBasicStd = form.contraparte.trim() && form.comprobante.trim() && form.fechaEmision;
  const validBasicBanc = form.cuentaOrigen && form.fechaEmision && (!isTransferencia || (form.cuentaDestino && form.cuentaDestino !== form.cuentaOrigen));
  const isValid = validAmount && (isBancario ? validBasicBanc : (validDocPersonal && validBasicStd));

  const estadoOpts = isBancario
    ? ['Completada', 'En proceso', 'Rechazada']
    : isIngreso
    ? ['Por cobrar', 'Cobrada', 'Vencida', 'Anulada']
    : ['Pendiente', 'Pagada', 'Anulada'];
  const showPagoSection = !isBancario && ['Pagada', 'Cobrada'].includes(form.estado);
  const partidasDisponibles = ERP_DATA.partidas.filter(p => p.level >= 2);

  const accent = isIngreso ? 'var(--ok)' : isBancario ? 'var(--accent)' : 'var(--danger)';
  const accentBg = isIngreso ? 'var(--ok-soft)' : isBancario ? 'var(--accent-soft)' : 'var(--danger-soft)';

  const handleSubmit = () => {
    if (!isValid) return;
    const d = destinos.find(x => x.value === form.destino);
    onSubmit(movId, {
      tipo, ...form,
      destinoLabel: d ? d.label : form.destino,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 720, maxWidth: '96vw', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>Nuevo movimiento financiero</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--mono)' }}>
              {movId} · {new Date().toLocaleDateString('es-PE')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={fillTest}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1.5px dashed var(--warn)',
                background: 'var(--warn-soft)', color: 'var(--warn-ink)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--mono)', letterSpacing: '0.04em',
              }}
            >⚡ TEST</button>
            <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
          </div>
        </div>

        {/* Body scrollable */}
        <div style={{ padding: '16px 20px', maxHeight: 'calc(90vh - 140px)', overflowY: 'auto', background: 'var(--bg)' }}>
          {/* Tipo toggle (3) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { t: 'Ingreso',  label: '↑ Ingreso',  c: 'var(--ok)',       sb: 'var(--ok-soft)' },
              { t: 'Egreso',   label: '↓ Egreso',   c: 'var(--danger)',   sb: 'var(--danger-soft)' },
              { t: 'Bancario', label: '⇄ Bancario', c: 'var(--accent)',   sb: 'var(--accent-soft)' },
            ].map(({ t, label, c, sb }) => (
              <button
                key={t}
                onClick={() => handleTipo(t)}
                style={{
                  padding: '12px 0',
                  borderRadius: 8,
                  border: '2px solid ' + (tipo === t ? c : 'var(--line)'),
                  background: tipo === t ? sb : 'var(--bg-elev)',
                  color: tipo === t ? c : 'var(--ink-3)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                }}
              >{label}</button>
            ))}
          </div>

          {/* ═══ BANCARIO (Transferencias, comisiones, ITF...) ═══ */}
          {isBancario && (
            <>
              <Section title="Operación bancaria">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Subtipo">
                    <select value={form.subtipo} onChange={e => set('subtipo', e.target.value)} className="fin-input">
                      {SUBTIPOS.Bancario.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Estado">
                    <select value={form.estado} onChange={e => set('estado', e.target.value)} className="fin-input">
                      {estadoOpts.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
              </Section>

              <Section title={isTransferencia ? 'Cuentas (origen → destino)' : 'Cuenta afectada'}>
                <div style={{ display: 'grid', gridTemplateColumns: isTransferencia ? '1fr 1fr' : '1fr', gap: 12 }}>
                  <Field label={isTransferencia ? 'Cuenta origen' : 'Cuenta'}>
                    <select value={form.cuentaOrigen} onChange={e => set('cuentaOrigen', e.target.value)} className="fin-input">
                      <option value="">Seleccionar cuenta...</option>
                      {CUENTAS_BANCARIAS.map(c => <option key={c.id} value={c.id}>{c.alias} · {c.moneda} · {c.numero}</option>)}
                    </select>
                  </Field>
                  {isTransferencia && (
                    <Field label="Cuenta destino" error={form.cuentaDestino && form.cuentaDestino === form.cuentaOrigen} hint={form.cuentaDestino === form.cuentaOrigen ? 'Debe ser distinta' : null}>
                      <select value={form.cuentaDestino} onChange={e => set('cuentaDestino', e.target.value)} className="fin-input">
                        <option value="">Seleccionar cuenta destino...</option>
                        {CUENTAS_BANCARIAS.filter(c => c.id !== form.cuentaOrigen).map(c => <option key={c.id} value={c.id}>{c.alias} · {c.moneda} · {c.numero}</option>)}
                      </select>
                    </Field>
                  )}
                </div>
              </Section>

              <Section title="Monto y fecha">
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 12 }}>
                  <Field label="Moneda">
                    <select value={form.moneda} onChange={e => set('moneda', e.target.value)} className="fin-input">
                      <option value="PEN">S/ PEN</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </Field>
                  <Field label="Monto">
                    <input type="number" min="0" step="0.01" value={form.subtotal} onChange={e => set('subtotal', e.target.value)} placeholder="0.00" className="fin-input mono" />
                  </Field>
                  <Field label="Fecha operación">
                    <input type="date" value={form.fechaEmision} onChange={e => handleFechaEmision(e.target.value)} className="fin-input" />
                  </Field>
                  <Field label={<span style={{ color: 'var(--ink)' }}>Total</span>}>
                    <div className="fin-input mono" style={{ background: accentBg, color: accent, fontWeight: 700, fontSize: 14, cursor: 'default', borderColor: accent }}>
                      {form.moneda === 'PEN' ? 'S/ ' : '$ '}{subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title="Referencia bancaria">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                  <Field label="Tipo identificador" hint="N° operación, voucher, lote">
                    <select value={form.tipoComp} onChange={e => set('tipoComp', e.target.value)} className="fin-input">
                      <option>N° operación</option>
                      <option>Voucher</option>
                      <option>Lote</option>
                      <option>Folio</option>
                    </select>
                  </Field>
                  <Field label="N° / Código">
                    <input value={form.nOperacion} onChange={e => set('nOperacion', e.target.value)} placeholder="TRF-BCP-0000000 / BOLETA-XXX..." className="fin-input mono" />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {/* ═══ INGRESO / EGRESO (Factura, boleta, RH, etc) ═══ */}
          {!isBancario && (<>
          <Section title="Clasificación">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Proyecto / Destino">
                <select value={form.destino} onChange={e => set('destino', e.target.value)} className="fin-input">
                  {destinos.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </Field>
              <Field label="Subtipo">
                <select value={form.subtipo} onChange={e => set('subtipo', e.target.value)} className="fin-input">
                  {SUBTIPOS[tipo].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Tipo de comprobante">
                <select value={form.tipoComp} onChange={e => handleTipoComp(e.target.value)} className="fin-input">
                  {TIPOS_COMPROBANTE.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                </select>
              </Field>
              <Field label="N° Comprobante" hint={TIPOS_COMPROBANTE.find(t => t.value === form.tipoComp)?.format}>
                <input value={form.comprobante} onChange={e => set('comprobante', e.target.value)} className="fin-input mono" />
              </Field>
            </div>
          </Section>

          <Section title={isIngreso ? 'Cliente' : 'Proveedor'}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 2fr', gap: 12 }}>
              <Field label="Tipo doc">
                <select value={form.tipoDoc} onChange={e => set('tipoDoc', e.target.value)} className="fin-input">
                  <option>RUC</option>
                  <option>DNI</option>
                  <option>CE</option>
                </select>
              </Field>
              <Field label={`N° ${form.tipoDoc}`} hint={form.tipoDoc === 'RUC' ? '11 dígitos' : '8 dígitos'} error={form.docIdentificador && !validDocPersonal}>
                <input
                  value={form.docIdentificador}
                  onChange={e => set('docIdentificador', e.target.value.replace(/\D/g, ''))}
                  placeholder={form.tipoDoc === 'RUC' ? '20XXXXXXXXX' : '12345678'}
                  className="fin-input mono"
                  maxLength={form.tipoDoc === 'RUC' ? 11 : 8}
                />
              </Field>
              <Field label={`Nombre / Razón social`}>
                <input
                  value={form.contraparte}
                  onChange={e => handleContraparte(e.target.value)}
                  placeholder="Buscar o escribir nombre..."
                  className="fin-input"
                  list="contrapartes-list"
                />
                <datalist id="contrapartes-list">
                  {CONTRAPARTES_DATA.map(c => <option key={c.nombre} value={c.nombre}>{c.tipo}</option>)}
                </datalist>
              </Field>
            </div>
          </Section>

          <Section title="Montos">
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 12 }}>
              <Field label="Moneda">
                <select value={form.moneda} onChange={e => set('moneda', e.target.value)} className="fin-input">
                  <option value="PEN">S/ PEN</option>
                  <option value="USD">$ USD</option>
                </select>
              </Field>
              <Field label="Subtotal">
                <input type="number" min="0" step="0.01" value={form.subtotal} onChange={e => set('subtotal', e.target.value)} placeholder="0.00" className="fin-input mono" />
              </Field>
              <Field label={`IGV ${form.aplicaIGV ? '18%' : '(excluido)'}`}>
                <div className="fin-input mono" style={{ background: form.aplicaIGV ? 'var(--bg-sunken)' : 'var(--bg)', cursor: 'default', color: 'var(--ink-3)' }}>
                  {igv > 0 ? igv.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00'}
                </div>
              </Field>
              <Field label={<span style={{ color: 'var(--ink)' }}>Total {isIngreso ? 'a cobrar' : 'a pagar'}</span>}>
                <div className="fin-input mono" style={{ background: accentBg, color: accent, fontWeight: 700, fontSize: 14, cursor: 'default', borderColor: accent }}>
                  {form.moneda === 'PEN' ? 'S/ ' : '$ '}{total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
              <Toggle
                checked={form.aplicaIGV}
                onChange={v => set('aplicaIGV', v)}
                label="Afecto a IGV (18%)"
              />
              <div />
              <Toggle
                checked={form.aplicaDetraccion}
                onChange={v => set('aplicaDetraccion', v)}
                label={`Aplica detracción${form.aplicaDetraccion && detrac > 0 ? ` · -S/ ${detrac.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : ''}`}
              />
              {form.aplicaDetraccion && (
                <select value={form.detraccionPct} onChange={e => set('detraccionPct', e.target.value)} className="fin-input">
                  {DETRACCION_PCT.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              )}
              <Toggle
                checked={form.aplicaRetencion}
                onChange={v => set('aplicaRetencion', v)}
                label={`Aplica retención${form.aplicaRetencion && retenc > 0 ? ` · -S/ ${retenc.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : ''}`}
              />
              {form.aplicaRetencion && (
                <select value={form.retencionPct} onChange={e => set('retencionPct', e.target.value)} className="fin-input">
                  <option value="3">3% · Régimen retención IGV</option>
                  <option value="8">8% · Honorarios (4ta categoría)</option>
                </select>
              )}
            </div>
          </Section>

          <Section title="Fechas y estado">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Fecha emisión">
                <input type="date" value={form.fechaEmision} onChange={e => handleFechaEmision(e.target.value)} className="fin-input" />
              </Field>
              <Field label="Fecha vencimiento">
                <input type="date" value={form.fechaVencimiento} onChange={e => set('fechaVencimiento', e.target.value)} className="fin-input" />
              </Field>
              <Field label="Estado">
                <select value={form.estado} onChange={e => set('estado', e.target.value)} className="fin-input">
                  {estadoOpts.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {showPagoSection && (
            <Section title={isIngreso ? 'Datos de cobro' : 'Datos de pago'}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Método">
                  <select value={form.metodoPago} onChange={e => set('metodoPago', e.target.value)} className="fin-input">
                    <option value="">Seleccionar...</option>
                    {METODOS_PAGO.map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="N° operación / referencia bancaria">
                  <input value={form.nOperacion} onChange={e => set('nOperacion', e.target.value)} placeholder="TRF-BCP-0000000" className="fin-input mono" />
                </Field>
              </div>
            </Section>
          )}

          <Section title="Documento origen (opcional)">
            {isIngreso ? (
              <Field label="Valorización / Adelanto" hint="Auto-llena cliente + proyecto + monto">
                <select
                  value={form.docOrigenTipo === 'V' ? `V|${form.docOrigenId}` : ''}
                  onChange={e => handleValorizacionSelect(e.target.value)}
                  className="fin-input"
                >
                  <option value="">— Sin documento previo —</option>
                  <optgroup label="Valorizaciones">
                    {getValorizaciones().map((v, i) => (
                      <option key={i} value={`${v.id}|${v.cliente}|${v.monto}|${v.proyecto}`}>
                        {v.id} · {v.cliente.slice(0, 28)} · S/ {v.monto.toLocaleString('es-PE')}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </Field>
            ) : (
              <Field label="Documento origen" hint="Auto-llena proveedor, RUC, monto y descripción">
                <select
                  value={form.docOrigenTipo ? `${form.docOrigenTipo}:${form.docOrigenId}` : ''}
                  onChange={e => handleDocOrigenSelect(e.target.value)}
                  className="fin-input"
                >
                  <option value="">— Sin documento previo —</option>
                  <optgroup label="Órdenes de compra abiertas">
                    {OCS_ABIERTAS.map(oc => (
                      <option key={oc.id} value={`OC:${oc.id}`}>
                        {oc.id} · {oc.proveedor.slice(0, 22)} · S/ {oc.monto.toLocaleString('es-PE')}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cotizaciones aprobadas">
                    {COTIZACIONES_APROBADAS.map(c => (
                      <option key={c.id} value={`COT:${c.id}`}>
                        {c.id} · {c.proveedor.slice(0, 22)} · S/ {c.monto.toLocaleString('es-PE')}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Órdenes de servicio">
                    {ORDENES_SERVICIO.map(os => (
                      <option key={os.id} value={`OS:${os.id}`}>
                        {os.id} · {os.proveedor.slice(0, 22)} · S/ {os.monto.toLocaleString('es-PE')}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Contratos vigentes">
                    {CONTRATOS_VIGENTES.map(ctr => (
                      <option key={ctr.id} value={`CTR:${ctr.id}`}>
                        {ctr.id} · {ctr.proveedor.slice(0, 22)} · S/ {ctr.monto.toLocaleString('es-PE')}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Requerimientos internos">
                    {REQUERIMIENTOS_INTERNOS.map(r => (
                      <option key={r.id} value={`REQ:${r.id}`}>
                        {r.id} · {r.desc.slice(0, 34)} · {r.proyecto}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </Field>
            )}
            <div style={{ marginTop: 10 }}>
              {!showPartida ? (
                <button
                  onClick={() => setShowPartida(true)}
                  style={{
                    padding: '5px 10px', fontSize: 11, fontWeight: 500,
                    background: 'transparent', border: '1px dashed var(--line)',
                    borderRadius: 6, color: 'var(--ink-3)', cursor: 'pointer',
                  }}
                >+ Imputar a partida presupuestal</button>
              ) : (
                <Field label="Partida presupuestal">
                  <div className="hstack" style={{ gap: 8 }}>
                    <select value={form.partida} onChange={e => set('partida', e.target.value)} className="fin-input" style={{ flex: 1 }}>
                      <option value="">— Sin imputar —</option>
                      {partidasDisponibles.map(p => <option key={p.id} value={p.code}>{p.code} · {p.name.slice(0, 40)}</option>)}
                    </select>
                    <button onClick={() => { set('partida', ''); setShowPartida(false); }} className="tb-icon-btn" title="Quitar partida">{Icon.x({ size: 12 })}</button>
                  </div>
                </Field>
              )}
            </div>
          </Section>
          </>)}

          <Section title="Descripción y adjuntos">
            <Field label="Concepto / Descripción">
              <textarea
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Detalle del movimiento, referencias, observaciones..."
                rows={2}
                className="fin-input"
                style={{ resize: 'vertical', fontFamily: 'var(--sans)' }}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <AttachBox
                label="Comprobante PDF"
                filename={form.archivoPDF}
                onPick={() => set('archivoPDF', form.archivoPDF ? '' : 'comprobante.pdf')}
                hint="PDF del CPE"
              />
              <AttachBox
                label="XML SUNAT (opcional)"
                filename={form.archivoXML}
                onPick={() => set('archivoXML', form.archivoXML ? '' : 'comprobante.xml')}
                hint="XML firmado CPE"
              />
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
          <div className="text-xs muted">
            {isValid
              ? <>Total: <strong className="mono" style={{ color: accent }}>{form.moneda === 'PEN' ? 'S/ ' : '$ '}{(isBancario ? subtotal : total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong></>
              : isBancario
                ? <span style={{ color: 'var(--warn-ink)' }}>⚠ Completa cuenta{isTransferencia ? 's (origen + destino distintas)' : ''}, monto y fecha</span>
                : <span style={{ color: 'var(--warn-ink)' }}>⚠ Completa contraparte, {form.tipoDoc}, comprobante y monto</span>}
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <button className="tb-btn" onClick={onClose}>Cancelar</button>
            <button
              className="tb-btn primary"
              disabled={!isValid}
              onClick={handleSubmit}
              style={{
                background: accent, borderColor: accent,
                opacity: isValid ? 1 : 0.45,
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
            >
              {Icon.check({ size: 13 })} {isIngreso ? 'Registrar ingreso' : isBancario ? 'Registrar operación' : 'Registrar egreso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents del modal ─────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--line)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, error, children }) {
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

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--ink-2)', padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: checked ? 'var(--accent-soft)' : 'var(--bg-elev)' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ margin: 0, cursor: 'pointer' }}
      />
      <span style={{ color: checked ? 'var(--accent-ink)' : 'var(--ink-2)', fontWeight: checked ? 600 : 400 }}>{label}</span>
    </label>
  );
}

function AttachBox({ label, filename, onPick, hint }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>
      <div
        onClick={onPick}
        style={{
          border: '1.5px dashed ' + (filename ? 'var(--ok)' : 'var(--line)'),
          borderRadius: 8, padding: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          background: filename ? 'var(--ok-soft)' : 'var(--bg-sunken)',
          cursor: 'pointer', transition: 'all .15s',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: filename ? 'var(--ok)' : 'var(--accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: filename ? '#fff' : 'var(--accent)', flexShrink: 0,
        }}>
          {filename ? Icon.check({ size: 13 }) : Icon.upload({ size: 13 })}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {filename
            ? <>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ok-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{filename}</div>
                <div style={{ fontSize: 9, color: 'var(--ok-ink)', opacity: 0.75 }}>Adjuntado · click para quitar</div>
              </>
            : <>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-2)' }}>Click o arrastra archivo</div>
                <div style={{ fontSize: 9, color: 'var(--ink-4)' }}>{hint}</div>
              </>}
        </div>
      </div>
    </div>
  );
}

// =================== FINANZAS PAGE ===================
function FinanzasPage() {
  const [tab, setTab] = useState('resumen');
  const [project, setProject] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(null);
  const [cashflowDrill, setCashflowDrill] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(null); // { category, entries, tab, periodLabel, tabTotal }

  // Filtrado de cashflow por proyecto
  const filteredCashflow = useMemo(() => {
    if (project === 'ALL') return cashflow;
    return cashflow.map(m => ({
      ...m,
      detalleIng: m.detalleIng.filter(e => e.proyecto === project),
      detalleEg: m.detalleEg.filter(e => e.proyecto === project),
      ingresos: m.detalleIng.filter(e => e.proyecto === project).reduce((s, e) => s + e.monto, 0),
      egresos: m.detalleEg.filter(e => e.proyecto === project).reduce((s, e) => s + e.monto, 0),
    }));
  }, [project]);

  // KPIs derivados
  const currentMonth = filteredCashflow[filteredCashflow.length - 1];
  const prevMonth = filteredCashflow[filteredCashflow.length - 2];

  const ingresosMes = currentMonth?.ingresos || 0;
  const egresosMes = currentMonth?.egresos || 0;
  const saldoMes = ingresosMes - egresosMes;
  const prevSaldo = (prevMonth?.ingresos || 0) - (prevMonth?.egresos || 0);
  const deltaSaldo = prevSaldo !== 0 ? ((saldoMes - prevSaldo) / Math.abs(prevSaldo)) * 100 : 0;

  const todasIngresos = filteredCashflow.flatMap(m => m.detalleIng);
  const porCobrarItems = todasIngresos.filter(e => e.status === 'Por cobrar' || e.status === 'Vencida');
  const porCobrarTotal = porCobrarItems.reduce((s, e) => s + e.monto, 0);
  const porCobrarVencidas = todasIngresos.filter(e => e.status === 'Vencida').length;

  const transactions = useMemo(() => flattenTransactions(cashflow, project), [project]);

  // Composición por concepto del mes actual (egresos)
  const composicion = useMemo(() => {
    if (!currentMonth) return [];
    const byCat = {};
    currentMonth.detalleEg.forEach(e => {
      byCat[e.categoria] = (byCat[e.categoria] || 0) + e.monto;
    });
    return Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  }, [currentMonth]);
  const composicionTotal = composicion.reduce((s, [, v]) => s + v, 0);

  const handleCashflowClick = useCallback((payload) => {
    setCashflowDrill(payload);
    setTimeout(() => {
      const el = document.getElementById('fin-cashflow-drill');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }, []);

  const handleComposicionClick = (categoria) => {
    // Abrir modal category con entries de esa categoría del mes actual
    if (!currentMonth) return;
    const entries = currentMonth.detalleEg.filter(e => e.categoria === categoria);
    setCategoryOpen({
      category: categoria,
      tab: 'egresos',
      periodLabel: currentMonth.month,
      tabTotal: currentMonth.egresos,
      entries,
      accentColor: '#D1453B',
    });
  };

  const handleSubmit = (movId, data) => {
    setShowModal(false);
    setSuccess({ movId, data });
  };

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>
      <div className="page-h">
        <div>
          <h1>Finanzas / Contabilidad</h1>
          <div className="sub muted">Flujo de caja consolidado · conciliación SUNAT · reportería por proyecto</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <select value={project} onChange={e => setProject(e.target.value)} className="fin-input" style={{ minWidth: 220, height: 30, fontSize: 12 }}>
            <option value="ALL">Todos los proyectos</option>
            {projects.filter(p => p.status === 'En ejecución').map(p => <option key={p.id} value={p.id}>{p.id} — {p.name.split('—')[0].trim()}</option>)}
          </select>
          <button className="tb-btn"><span className="ico">{Icon.download({ size: 13 })}</span>Exportar</button>
          <button className="tb-btn primary" onClick={() => setShowModal(true)}><span className="ico">{Icon.plus({ size: 13 })}</span>Registrar movimiento</button>
        </div>
      </div>

      <div className="kpi-grid">
        <FinStat
          lbl={`Ingresos ${currentMonth?.month || ''}`}
          val={fmtCompact(ingresosMes)}
          sub={`${currentMonth?.detalleIng.length || 0} movimientos`}
          color="var(--ok)"
        />
        <FinStat
          lbl={`Egresos ${currentMonth?.month || ''}`}
          val={fmtCompact(egresosMes)}
          sub={`${currentMonth?.detalleEg.length || 0} movimientos`}
          color="var(--danger)"
        />
        <FinStat
          lbl="Saldo mes"
          val={fmtCompact(saldoMes)}
          delta={(deltaSaldo >= 0 ? '+' : '') + deltaSaldo.toFixed(1) + '%'}
          deltaKind={deltaSaldo >= 0 ? 'pos' : 'neg'}
          sub="vs mes anterior"
        />
        <FinStat
          lbl="Por cobrar"
          val={fmtCompact(porCobrarTotal)}
          sub={porCobrarVencidas > 0 ? `${porCobrarVencidas} vencida${porCobrarVencidas > 1 ? 's' : ''} · ${porCobrarItems.length - porCobrarVencidas} al día` : `${porCobrarItems.length} facturas al día`}
          color={porCobrarVencidas > 0 ? 'var(--warn-ink)' : 'var(--ink)'}
        />
      </div>

      <div className="hstack" style={{ gap: 2, marginBottom: 14 }}>
        {[
          { id: 'resumen',      label: 'Resumen' },
          { id: 'flujo',        label: 'Flujo de caja' },
          { id: 'movimientos',  label: 'Movimientos' },
          { id: 'sunat',        label: 'SUNAT' },
          { id: 'reportes',     label: 'Reportes' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'),
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
              cursor: 'pointer',
              letterSpacing: '-0.005em',
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'resumen' && <ResumenView onNewMovimiento={() => setShowModal(true)} />}

      {tab === 'flujo' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="card">
              <div className="card-h">
                <div className="hstack" style={{ gap: 10 }}>
                  <h3>Flujo de caja {project === 'ALL' ? 'consolidado' : project}</h3>
                  <span className="chip blue" style={{ fontSize: 9 }}>{Icon.sparkle({ size: 9 })} Click para drill-down</span>
                </div>
                <span className="hint">{filteredCashflow.length} meses · PEN</span>
              </div>
              <div className="card-b" style={{ height: 280 }}>
                <BigCashflow data={filteredCashflow} onPointClick={handleCashflowClick} />
              </div>
            </div>
            <div className="card">
              <div className="card-h">
                <h3>Composición — {currentMonth?.month}</h3>
                <span className="hint">Click para detalle</span>
              </div>
              <div className="card-b">
                {composicion.map(([cat, val], i) => {
                  const pct = (val / composicionTotal) * 100;
                  const colors = ['var(--danger)', 'var(--warn)', '#7C3AED', 'var(--ok)', '#D97757', '#0EA5B7', 'var(--ink-3)'];
                  return (
                    <button
                      key={cat}
                      onClick={() => handleComposicionClick(cat)}
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: '6px 0', cursor: 'pointer', textAlign: 'left', transition: 'background .12s', borderRadius: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="hstack between" style={{ marginBottom: 4, padding: '0 4px' }}>
                        <div className="hstack"><span style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length] }} /><span style={{ fontSize: 12 }}>{cat}</span></div>
                        <div className="hstack" style={{ gap: 6 }}>
                          <span className="mono text-xs muted">{pct.toFixed(0)}%</span>
                          <span className="mono text-xs" style={{ color: 'var(--ink-2)', fontWeight: 600, width: 62, textAlign: 'right' }}>{fmtCompact(val)}</span>
                        </div>
                      </div>
                      <div className="pbar" style={{ height: 6, margin: '0 4px' }}><span style={{ width: pct + '%', background: colors[i % colors.length] }} /></div>
                    </button>
                  );
                })}
                {composicion.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-4)', fontSize: 12 }}>Sin egresos en este período</div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-h">
              <div className="hstack" style={{ gap: 10 }}>
                <h3>Flujo Clientes → Proyectos → Categorías de gasto</h3>
                <span className="chip blue" style={{ fontSize: 9 }}>{Icon.sparkle({ size: 9 })} Acumulado 9 meses</span>
              </div>
              <span className="hint">Sankey · valores en S/</span>
            </div>
            <div className="card-b" style={{ height: 420 }}>
              <SankeyFlow data={filteredCashflow} />
            </div>
          </div>

          {/* Drill cashflow (click en punto del chart) */}
          {SharedAnimatedDrill && (
            <SharedAnimatedDrill show={!!cashflowDrill}>
              <div id="fin-cashflow-drill">
                {cashflowDrill && SharedCashflowDrill && (
                  <SharedCashflowDrill
                    drill={cashflowDrill}
                    onChangeTab={(t) => setCashflowDrill(d => ({ ...d, tab: t }))}
                    onClose={() => setCashflowDrill(null)}
                  />
                )}
              </div>
            </SharedAnimatedDrill>
          )}
        </>
      )}

      {tab === 'movimientos' && (
        <MovimientosView transactions={transactions} />
      )}

      {tab === 'sunat' && SharedSunatPage && <SharedSunatPage />}
      {tab === 'reportes' && <ReportesView />}

      {showModal && <NuevoMovimientoModal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}
      {success && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <MovimientoSuccess data={success.data} movId={success.movId} onClose={() => setSuccess(null)} />
          </div>
        </div>
      )}

      {/* Modal categoría (reutiliza del dashboard) */}
      {categoryOpen && SharedCategoryModal && (
        <SharedCategoryModal
          category={categoryOpen.category}
          tab={categoryOpen.tab}
          periodLabel={categoryOpen.periodLabel}
          accentColor={categoryOpen.accentColor}
          tabTotal={categoryOpen.tabTotal}
          entries={categoryOpen.entries}
          onClose={() => setCategoryOpen(null)}
        />
      )}
    </div>
  );
}

// ── KPI card stat ────────────────────────────────────────────────
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

// ── Big cashflow chart (ECharts bars + acumulado line) ───────────
function BigCashflow({ data, onPointClick }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    const accent = getCssVar('--accent') || '#3B5BDB';
    const danger = getCssVar('--danger') || '#D1453B';
    const ok = getCssVar('--ok') || '#2F7D5C';
    const line = getCssVar('--line') || '#E4E4DF';
    const ink3 = getCssVar('--ink-3') || '#6B6B68';
    const bgElev = getCssVar('--bg-elev') || '#FFFFFF';

    const c = echarts.init(ref.current);
    c.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: bgElev, borderColor: line, borderWidth: 1,
        textStyle: { fontSize: 11 },
        valueFormatter: (v) => fmtCompact(v),
      },
      legend: {
        data: ['Ingresos', 'Egresos', 'Saldo acumulado'],
        top: 2, right: 8,
        icon: 'roundRect', itemWidth: 14, itemHeight: 8,
        textStyle: { fontSize: 11, color: ink3 },
      },
      grid: { top: 36, right: 16, bottom: 28, left: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(d => d.month),
        axisLine: { lineStyle: { color: line } },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: ink3, fontFamily: 'JetBrains Mono', margin: 12 },
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: { fontSize: 10, color: ink3, fontFamily: 'JetBrains Mono', formatter: (v) => fmtCompact(v).replace('S/ ', '') },
          splitLine: { lineStyle: { color: line, type: 'dashed' } },
        },
      ],
      series: [
        {
          name: 'Ingresos', type: 'bar',
          data: data.map(d => d.ingresos),
          itemStyle: { color: accent, borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 22, barGap: '10%', cursor: 'pointer',
          emphasis: { focus: 'series', itemStyle: { shadowBlur: 8, shadowColor: 'rgba(59,91,219,0.3)' } },
        },
        {
          name: 'Egresos', type: 'bar',
          data: data.map(d => d.egresos),
          itemStyle: { color: danger, borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 22, cursor: 'pointer',
          emphasis: { focus: 'series', itemStyle: { shadowBlur: 8, shadowColor: 'rgba(209,69,59,0.3)' } },
        },
        {
          name: 'Saldo acumulado', type: 'line', smooth: true,
          data: data.map(d => d.acumulado),
          color: ok, lineStyle: { width: 2.5, type: [6, 4] }, symbol: 'circle', symbolSize: 7,
          z: 3,
        },
      ],
    });

    c.on('click', (params) => {
      if (!onPointClick) return;
      if (params.seriesName === 'Saldo acumulado') return;
      const tab = params.seriesName === 'Egresos' ? 'egresos' : 'ingresos';
      onPointClick({ mode: 'mes', periodKey: params.name, tab });
    });

    const onResize = () => c.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); c.dispose(); };
  }, [data, onPointClick]);

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 220 }} />;
}

// ── Sankey flow: Clientes → Proyectos → Categorías ───────────────
function SankeyFlow({ data }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const line = getCssVar('--line') || '#E4E4DF';
    const ink = getCssVar('--ink') || '#1C1C1C';
    const ink3 = getCssVar('--ink-3') || '#6B6B68';
    const bgElev = getCssVar('--bg-elev') || '#FFFFFF';

    // Construir nodos + links
    // Clientes (de ingresos) → Proyectos → Categorías (de egresos)
    // Para el flujo visual: Cliente paga Proyecto, Proyecto gasta en Categorías.
    // Valor link = monto.

    const clienteToProyecto = {};   // { cliente -> { proyecto -> monto } }
    const proyectoToCategoria = {}; // { proyecto -> { categoria -> monto } }

    data.forEach(m => {
      m.detalleIng.forEach(e => {
        const cli = e.contraparte;
        const pro = e.proyecto;
        if (!clienteToProyecto[cli]) clienteToProyecto[cli] = {};
        clienteToProyecto[cli][pro] = (clienteToProyecto[cli][pro] || 0) + e.monto;
      });
      m.detalleEg.forEach(e => {
        const pro = e.proyecto;
        const cat = e.categoria;
        if (!proyectoToCategoria[pro]) proyectoToCategoria[pro] = {};
        proyectoToCategoria[pro][cat] = (proyectoToCategoria[pro][cat] || 0) + e.monto;
      });
    });

    // Solo incluir proyectos que tengan tanto ingresos como egresos (para flujo limpio)
    const proyectosActivos = new Set();
    Object.values(clienteToProyecto).forEach(o => Object.keys(o).forEach(p => proyectosActivos.add(p)));
    Object.keys(proyectoToCategoria).forEach(p => proyectosActivos.add(p));

    // Paleta de colores
    const clienteColors = ['#3B5BDB', '#5B3BDB', '#0D9488', '#7C3AED'];
    const proyectoColors = ['#F59F00', '#D97757', '#0EA5B7', '#6B84E8', '#8FA3F0'];
    const categoriaColors = {
      'Materiales': '#D1453B',
      'Planilla': '#F59F00',
      'Subcontrato': '#7C3AED',
      'Equipos': '#0EA5B7',
      'Oficina': '#9A9A96',
      'Tributos': '#D97757',
    };

    const nodes = [];
    const nodeSet = new Set();
    const addNode = (name, color) => {
      if (nodeSet.has(name)) return;
      nodeSet.add(name);
      nodes.push({ name, itemStyle: { color, borderColor: color } });
    };

    let ci = 0;
    Object.keys(clienteToProyecto).forEach(cli => {
      addNode(cli, clienteColors[ci % clienteColors.length]);
      ci++;
    });

    let pi = 0;
    Array.from(proyectosActivos).sort().forEach(p => {
      addNode(p, proyectoColors[pi % proyectoColors.length]);
      pi++;
    });

    Object.keys(proyectoToCategoria).forEach(p => {
      Object.keys(proyectoToCategoria[p]).forEach(cat => {
        addNode(cat, categoriaColors[cat] || '#9A9A96');
      });
    });

    const links = [];
    Object.entries(clienteToProyecto).forEach(([cli, obj]) => {
      Object.entries(obj).forEach(([pro, val]) => {
        links.push({ source: cli, target: pro, value: val });
      });
    });
    Object.entries(proyectoToCategoria).forEach(([pro, obj]) => {
      Object.entries(obj).forEach(([cat, val]) => {
        links.push({ source: pro, target: cat, value: val });
      });
    });

    const c = echarts.init(ref.current);
    c.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: bgElev, borderColor: line, borderWidth: 1,
        textStyle: { fontSize: 11 },
        formatter: (p) => {
          if (p.dataType === 'edge') return `${p.data.source} → ${p.data.target}<br/><b>${fmtCompact(p.data.value)}</b>`;
          return `<b>${p.name}</b><br/>${fmtCompact(p.value)}`;
        },
      },
      series: [{
        type: 'sankey',
        left: 20, right: 120, top: 16, bottom: 16,
        nodeWidth: 14, nodeGap: 10,
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'source', curveness: 0.55, opacity: 0.35 },
        label: { fontSize: 11, color: ink, fontFamily: 'Inter', fontWeight: 500 },
        data: nodes,
        links: links,
      }],
    });

    const onResize = () => c.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); c.dispose(); };
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 380 }} />;
}

// ── Movimientos view (tabla real) ────────────────────────────────
function MovimientosView({ transactions }) {
  const txs = transactions || [];
  const [filter, setFilter] = useState('all'); // all | ingresos | egresos
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    let list = txs;
    if (filter !== 'all') list = list.filter(t => (filter === 'ingresos' ? t.tipo === 'Ingreso' : t.tipo === 'Egreso'));
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(t =>
        (t.concepto || '').toLowerCase().includes(ql) ||
        (t.contraparte || '').toLowerCase().includes(ql) ||
        (t.comprobante || '').toLowerCase().includes(ql) ||
        (t.proyecto || '').toLowerCase().includes(ql)
      );
    }
    return list;
  }, [txs, filter, q]);

  const estadoChip = (estado) => {
    const ok = ['Pagada', 'Cobrada'].includes(estado);
    const warn = ['Pendiente', 'Por cobrar'].includes(estado);
    const danger = ['Vencida'].includes(estado);
    return 'chip ' + (ok ? 'green' : warn ? 'amber' : danger ? 'red' : '');
  };

  return (
    <div className="card">
      <div className="card-h">
        <div className="hstack" style={{ gap: 10 }}>
          <h3>Movimientos</h3>
          <span className="mono text-xs muted">{filtered.length} de {txs.length}</span>
        </div>
        <div className="hstack" style={{ gap: 8 }}>
          <div className="tb-search-wrap" style={{ width: 240, height: 28, maxWidth: 'none' }}>
            <span className="ico">{Icon.search({ size: 12 })}</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar concepto, proveedor..." style={{ fontSize: 11 }} />
          </div>
          <div className="tw-seg" style={{ height: 28 }}>
            <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')} style={{ fontSize: 11, padding: '0 10px' }}>Todos</button>
            <button className={filter === 'ingresos' ? 'on' : ''} onClick={() => setFilter('ingresos')} style={{ fontSize: 11, padding: '0 10px' }}>Ingresos</button>
            <button className={filter === 'egresos' ? 'on' : ''} onClick={() => setFilter('egresos')} style={{ fontSize: 11, padding: '0 10px' }}>Egresos</button>
          </div>
          <button className="tb-btn" style={{ height: 28, fontSize: 11 }}>{Icon.download({ size: 11 })}CSV</button>
        </div>
      </div>
      <div className="card-b tight" style={{ maxHeight: 560, overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Fecha</th>
              <th style={{ width: 80 }}>Tipo</th>
              <th style={{ width: 140 }}>Comprobante</th>
              <th>Concepto</th>
              <th style={{ width: 180 }}>Contraparte</th>
              <th style={{ width: 120 }}>Proyecto</th>
              <th className="num-c" style={{ width: 130 }}>Monto S/</th>
              <th style={{ width: 110 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>
                {q ? `Sin resultados para "${q}"` : 'Sin movimientos'}
              </td></tr>
            )}
            {filtered.map((t, i) => (
              <tr key={i} className="row-hover" style={{ cursor: 'pointer' }}>
                <td className="mono text-xs">{(t.fecha || '').slice(5)}</td>
                <td><span className={'chip ' + (t.tipo === 'Ingreso' ? 'green' : 'red')}>{t.tipo}</span></td>
                <td className="mono text-xs" style={{ color: 'var(--ink-2)' }}>{t.comprobante}</td>
                <td><div style={{ fontWeight: 500 }}>{t.concepto}</div><div className="text-xs muted">{t.subtipo}</div></td>
                <td style={{ fontSize: 12 }}>{t.contraparte}</td>
                <td className="mono text-xs muted">{t.proyecto}</td>
                <td className="num-c mono" style={{ color: t.monto > 0 ? 'var(--ok)' : 'var(--danger)', fontWeight: 600 }}>
                  {t.monto > 0 ? '+' : ''}{(t.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td><span className={estadoChip(t.estado)}>{t.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Conciliación SUNAT ───────────────────────────────────────────
function ConciliacionView() {
  const rows = sunatConciliaciones;
  const conciliadas = rows.filter(r => r.estado === 'Conciliada').length;
  const observacion = rows.filter(r => r.estado === 'Observación').length;
  const sinConc = rows.filter(r => r.estado === 'Sin conciliar').length;
  const total = rows.length;

  return (
    <div className="card">
      <div className="card-h"><h3>Conciliación de comprobantes · SUNAT</h3><span className="hint">Importación XML CPE · {rows.length} documentos</span></div>
      <div className="card-b">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
          <StatusBox lbl="Conciliadas" val={String(conciliadas)} color="var(--ok)" pct={Math.round(conciliadas / total * 100)} />
          <StatusBox lbl="Con observación" val={String(observacion)} color="var(--warn)" pct={Math.round(observacion / total * 100)} />
          <StatusBox lbl="Sin conciliar" val={String(sinConc)} color="var(--danger)" pct={Math.round(sinConc / total * 100)} />
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 110 }}>Comprobante</th>
              <th>Proveedor</th>
              <th style={{ width: 130 }}>RUC</th>
              <th className="num-c" style={{ width: 110 }}>Monto</th>
              <th style={{ width: 120 }}>OC asociada</th>
              <th style={{ width: 90 }}>Fecha</th>
              <th style={{ width: 160 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="row-hover">
                <td className="mono text-xs">{r.doc}</td>
                <td>{r.proveedor}</td>
                <td className="mono text-xs muted">{r.ruc}</td>
                <td className="num-c mono">{r.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                <td>
                  {r.oc
                    ? <span className="mono text-xs" style={{ color: 'var(--accent)' }}>{r.oc}</span>
                    : <span className="muted text-xs">—</span>}
                </td>
                <td className="mono text-xs muted">{r.fecha.slice(5)}</td>
                <td>
                  <div className="hstack" style={{ gap: 6 }}>
                    <span className={'chip ' + (r.estado === 'Conciliada' ? 'green' : r.estado === 'Sin conciliar' ? 'red' : 'amber')}>{r.estado}</span>
                    {r.obsMsg && <span title={r.obsMsg} style={{ color: 'var(--ink-3)', cursor: 'help' }}>{Icon.info({ size: 12 })}</span>}
                  </div>
                </td>
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

// ── Reportes stub ────────────────────────────────────────────────
function ReportesView() {
  return (
    <div className="card">
      <div className="card-h"><h3>Reportes disponibles</h3><span className="hint">Export PDF/Excel · pendiente backend</span></div>
      <div className="card-b" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { t: 'Estado de resultados', d: 'Por proyecto · acumulado año', i: 'trend' },
          { t: 'Flujo de efectivo proyectado', d: 'Próximos 6 meses', i: 'trend' },
          { t: 'Ejecución presupuestal', d: 'PvsR · todas las obras', i: 'budget' },
          { t: 'Cuentas por cobrar', d: 'Antigüedad 30/60/90+', i: 'money' },
          { t: 'Detracciones SUNAT', d: 'Detalle mensual', i: 'file' },
          { t: 'Utilidad por proyecto', d: 'Margen bruto y neto', i: 'trend' },
        ].map(r => {
          const IconFn = Icon[r.i] || Icon.file;
          return (
            <div key={r.t} className="card" style={{ padding: 14, cursor: 'pointer', background: 'var(--bg-sunken)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {IconFn({ size: 14 })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{r.t}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RESUMEN VIEW — dashboard financiero completo (mockup layout)
// ═══════════════════════════════════════════════════════════════
function ResumenView({ onNewMovimiento }) {
  const {
    cuentasBancariasBalances, gastosOficina, valorizacionesPipeline,
    garantias, cashflowForecast, cashflow,
  } = ERP_DATA;

  // ── Derived KPIs ──
  const currentMonth = cashflow[cashflow.length - 1];
  const prevMonth = cashflow[cashflow.length - 2];
  const ingresosMes = currentMonth.ingresos;
  const egresosMes = currentMonth.egresos;
  const utilidad = ingresosMes - egresosMes;
  const margenNeto = ingresosMes > 0 ? (utilidad / ingresosMes) * 100 : 0;
  const deltaIng = prevMonth.ingresos > 0 ? ((ingresosMes - prevMonth.ingresos) / prevMonth.ingresos) * 100 : 0;

  const allIng = cashflow.flatMap(m => m.detalleIng);
  const allEg = cashflow.flatMap(m => m.detalleEg);
  const porCobrarItems = allIng.filter(e => e.status === 'Por cobrar' || e.status === 'Vencida');
  const porCobrar = porCobrarItems.reduce((s, e) => s + e.monto, 0);
  const vencidasCount = allIng.filter(e => e.status === 'Vencida').length;
  const porPagarItems = allEg.filter(e => e.status === 'Pendiente');
  const porPagar = porPagarItems.reduce((s, e) => s + e.monto, 0);

  const posicionCaja = cuentasBancariasBalances.reduce((s, c) => s + c.saldoActual, 0);
  const garantiasActivas = garantias.reduce((s, g) => s + g.monto, 0);
  const garantiasUrgentes = garantias.filter(g => g.dueDays <= 30).length;

  return (
    <div className="vstack" style={{ gap: 14 }}>
      {/* KPIs row (7) */}
      <div className="finanzas-kpis-7">
        <ResumenKPI lbl="Ingresos del mes" val={fmtCompact(ingresosMes)} sub={`${(deltaIng >= 0 ? '+' : '') + deltaIng.toFixed(1)}% vs mes ant.`} color="var(--ok)" />
        <ResumenKPI lbl="Gastos del mes" val={fmtCompact(egresosMes)} sub="Planilla + subcontr." color="var(--danger)" />
        <ResumenKPI lbl="Margen neto" val={margenNeto.toFixed(1) + '%'} sub={`${fmtCompact(utilidad)} utilidad`} color="var(--ok)" />
        <ResumenKPI lbl="Por cobrar" val={fmtCompact(porCobrar)} sub={vencidasCount > 0 ? `${vencidasCount} fact. vencidas` : 'Al día'} color="var(--danger)" />
        <ResumenKPI lbl="Por pagar" val={fmtCompact(porPagar)} sub="Próx. 30 días" color="var(--warn-ink)" />
        <ResumenKPI lbl="Posición de caja" val={fmtCompact(posicionCaja)} sub="Ctas + caja chica" color="var(--accent)" />
        <ResumenKPI lbl="Garantías activas" val={fmtCompact(garantiasActivas)} sub={`${garantias.length} cartas fianza`} color="#7C3AED" />
      </div>

      {/* TESORERÍA */}
      <SectionHeader title="TESORERÍA — Posición de caja en tiempo real" color="#F59F00" />
      <div className="finanzas-treasury-grid">
        {cuentasBancariasBalances.map(c => <CuentaCard key={c.id} c={c} />)}
        <CuentaPlaceholder />
      </div>

      {/* 3 columnas: Gastos oficina | Valorizaciones | Flujo caja mini */}
      <div className="finanzas-3-col">
        <GastosOficinaCard data={gastosOficina} />
        <ValorizacionesCard data={valorizacionesPipeline} onNew={onNewMovimiento} />
        <FlujoCajaMiniCard data={cashflowForecast} />
      </div>

      {/* GARANTÍAS */}
      <SectionHeader title="GARANTÍAS — Cartas fianza activas" color="var(--danger)" />
      <div className="card" style={{ borderTop: '3px solid var(--danger)' }}>
        <div className="card-h">
          <div className="hstack" style={{ gap: 10 }}>
            <h3>{garantias.length} cartas fianza</h3>
            <span className="chip" style={{ fontSize: 10 }}>Total {fmtCompact(garantiasActivas)}</span>
          </div>
          {garantiasUrgentes > 0 && (
            <span className="chip red" style={{ fontSize: 10 }}>{garantiasUrgentes} vencen en ≤ 30 días</span>
          )}
        </div>
        <div className="card-b tight">
          <table>
            <thead>
              <tr>
                <th>Tipo / Obra</th>
                <th style={{ width: 100 }}>Banco</th>
                <th style={{ width: 100 }}>Vence</th>
                <th className="num-c" style={{ width: 140 }}>Monto</th>
                <th style={{ width: 110 }}>Fecha venc.</th>
              </tr>
            </thead>
            <tbody>
              {garantias.map(g => {
                const urg = g.dueDays <= 15 ? 'red' : g.dueDays <= 30 ? 'amber' : g.dueDays <= 90 ? '' : 'green';
                const border = g.dueDays <= 15 ? 'var(--danger)' : g.dueDays <= 30 ? 'var(--warn)' : 'var(--ok)';
                return (
                  <tr key={g.id} className="row-hover" style={{ cursor: 'pointer' }}>
                    <td style={{ borderLeft: `3px solid ${border}` }}>
                      <div style={{ fontWeight: 600 }}>{g.tipo}</div>
                      <div className="text-xs muted">{g.obra}</div>
                    </td>
                    <td><span className="chip mono" style={{ fontSize: 10 }}>{g.banco}</span></td>
                    <td><span className={'chip ' + urg} style={{ fontSize: 10 }}>{g.dueDays <= 30 ? '▲ ' : ''}{g.dueDays}d</span></td>
                    <td className="num-c mono" style={{ fontWeight: 700 }}>S/ {g.monto.toLocaleString('es-PE')}</td>
                    <td className="mono text-xs muted">{g.fechaVenc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUENTAS POR COBRAR Y PAGAR */}
      <SectionHeader title="CUENTAS POR COBRAR Y PAGAR" color="var(--accent)" />
      <div className="finanzas-2-col">
        <PorCobrarCard items={porCobrarItems} total={porCobrar} />
        <PorPagarCard items={porPagarItems} total={porPagar} />
      </div>
    </div>
  );
}

// ── Section header ──
function SectionHeader({ title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  );
}

// ── KPI compacto para fila de 7 ──
function ResumenKPI({ lbl, val, sub, color }) {
  return (
    <div style={{ padding: '10px 12px', borderTop: `2px solid ${color}`, background: 'var(--bg-elev)', borderRadius: 6, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lbl}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  );
}

// ── Cuenta bancaria card ──
function CuentaCard({ c }) {
  const isCaja = c.tipo === 'Efectivo';
  const pctCaja = isCaja && c.saldoAutorizado ? (c.saldoActual / c.saldoAutorizado) * 100 : null;
  return (
    <div className="card" style={{ padding: 0, borderTop: `3px solid ${c.borderColor}` }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: c.borderColor + '22', color: c.borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, fontFamily: 'var(--mono)', flexShrink: 0 }}>
          {c.banco.slice(0, 4).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.alias}</div>
          <div className="mono text-xs muted">{c.tipo === 'Efectivo' ? `Responsable: ${c.responsable}` : `N° ${c.numero} · ${c.moneda === 'PEN' ? 'S/.' : '$'}`}</div>
        </div>
        {c.subtitle && <span style={{ color: c.borderColor, fontSize: 14 }}>+</span>}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: c.borderColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {c.moneda === 'PEN' ? 'S/. ' : '$ '}{c.saldoActual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs muted" style={{ marginTop: 4 }}>
          {isCaja ? `de S/ ${c.saldoAutorizado.toLocaleString('es-PE')} autorizados` : c.subtitle || 'Saldo disponible'}
        </div>

        {pctCaja != null && (
          <>
            <div className="pbar" style={{ marginTop: 10, height: 6 }}>
              <span style={{ width: pctCaja + '%', background: c.borderColor }} />
            </div>
            <div className="hstack between" style={{ marginTop: 8 }}>
              <span className="chip green" style={{ fontSize: 10 }}>✓ Nivel normal</span>
              <span className="mono text-xs muted">{pctCaja.toFixed(0)}% disp</span>
            </div>
            <button className="tb-btn" style={{ width: '100%', marginTop: 8, justifyContent: 'center', fontSize: 11 }}>
              Solicitar reposición
            </button>
          </>
        )}

        {!isCaja && (
          <div className="hstack between" style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', fontWeight: 500 }}>Ingresos mes</div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ok)' }}>+{fmtCompact(c.ingresosMes)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', fontWeight: 500 }}>Egresos mes</div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>-{fmtCompact(c.egresosMes)}</div>
            </div>
          </div>
        )}

        {c.ultimoMovimiento && !isCaja && (
          <div className="text-xs muted" style={{ marginTop: 6, fontSize: 10, fontFamily: 'var(--mono)' }}>
            Últ. movimiento: hoy {new Date(c.ultimoMovimiento).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Placeholder "Agregar cuenta" ──
function CuentaPlaceholder() {
  return (
    <div className="card" style={{ padding: 0, border: '1.5px dashed var(--line)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 220 }}>
      <div style={{ textAlign: 'center', padding: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--ink-3)', fontSize: 22 }}>+</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 3 }}>Agregar cuenta</div>
        <div className="text-xs muted">banco o efectivo</div>
      </div>
    </div>
  );
}

// ── Gastos oficina card ──
function GastosOficinaCard({ data }) {
  return (
    <div className="card" style={{ borderTop: '3px solid var(--warn)' }}>
      <div className="card-h" style={{ borderBottom: 'none', paddingBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--warn-ink)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>GASTOS DE OFICINA</div>
          <h3 style={{ margin: 0, fontSize: 13 }}>{data.mes}</h3>
        </div>
        <button className="tb-btn" style={{ height: 26, fontSize: 11 }}>{Icon.plus({ size: 11 })}Agregar</button>
      </div>
      <div className="card-b">
        <div style={{ marginBottom: 10 }}>
          <div className="hstack between" style={{ marginBottom: 4 }}>
            <span className="text-xs muted">Presupuesto: <span className="mono">S/. {data.presupuestoMensual.toLocaleString('es-PE')}</span></span>
            <span className="mono text-xs" style={{ fontWeight: 700, color: 'var(--warn-ink)' }}>{data.pctEjecutado}%</span>
          </div>
          <div className="pbar" style={{ height: 7 }}>
            <span style={{ width: data.pctEjecutado + '%', background: 'var(--warn)' }} />
          </div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            <span className="mono" style={{ fontWeight: 600 }}>Ejecutado: S/. {data.ejecutado.toLocaleString('es-PE')}</span>
          </div>
        </div>

        <div className="vstack" style={{ gap: 8, marginTop: 14 }}>
          {data.items.map(it => (
            <div key={it.id} className="hstack between" style={{ fontSize: 12 }}>
              <div className="hstack" style={{ gap: 8, minWidth: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: it.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.categoria}</div>
                  <div className="text-xs muted" style={{ fontSize: 10 }}>{it.subtitle}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="mono" style={{ fontWeight: 700, fontSize: 12 }}>S/. {it.monto.toLocaleString('es-PE')}</div>
                <div className="mono text-xs muted">{it.pct}%</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 6, marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span className="muted">Total gastado: <span className="mono" style={{ color: 'var(--ink)' }}>S/. {data.ejecutado.toLocaleString('es-PE')}</span></span>
          <span className="muted">Saldo: <span className="mono" style={{ color: 'var(--ok)', fontWeight: 600 }}>S/. {data.saldo.toLocaleString('es-PE')}</span></span>
        </div>
      </div>
    </div>
  );
}

// ── Valorizaciones card ──
function ValorizacionesCard({ data, onNew }) {
  const total = data.filter(v => v.estado !== 'Cobrada').reduce((s, v) => s + v.monto, 0);
  const estadoChip = (e) => {
    if (e === 'Cobrada')   return { cls: 'green', ico: '✓' };
    if (e === 'Facturada') return { cls: 'blue',  ico: '' };
    if (e === 'Aprobada')  return { cls: 'blue',  ico: '' };
    if (e === 'Enviada')   return { cls: 'amber', ico: '' };
    if (e === 'Vencida')   return { cls: 'red',   ico: '' };
    return { cls: '', ico: '' };
  };

  return (
    <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
      <div className="card-h" style={{ borderBottom: 'none', paddingBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>VALORIZACIONES</div>
          <h3 style={{ margin: 0, fontSize: 13 }}>Estado de cobro</h3>
        </div>
        <button className="tb-btn primary" style={{ height: 26, fontSize: 11 }} onClick={onNew}>
          {Icon.plus({ size: 11 })}Nueva
        </button>
      </div>
      <div className="card-b">
        <div className="hstack between" style={{ marginBottom: 10, padding: '8px 10px', background: 'var(--accent-soft)', borderRadius: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--accent-ink)', fontWeight: 500 }}>Valorizaciones activas</span>
          <span className="mono" style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent-ink)' }}>Total por cobrar: S/. {total.toLocaleString('es-PE')}</span>
        </div>
        <div className="vstack" style={{ gap: 8 }}>
          {data.map(v => {
            const chip = estadoChip(v.estado);
            return (
              <div key={v.id} style={{ padding: '8px 10px', background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
                <div className="hstack between" style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Val. N°{v.numVal} — {v.obra}</span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>S/. {v.monto.toLocaleString('es-PE')}</span>
                </div>
                <div className="hstack between" style={{ fontSize: 10 }}>
                  <span className="muted">{v.cliente}</span>
                  <div className="hstack" style={{ gap: 6 }}>
                    {v.dueDays != null && v.estado !== 'Cobrada' && (
                      <span className={'chip ' + (v.dueDays < 0 ? 'red' : v.dueDays <= 15 ? 'amber' : '')} style={{ fontSize: 9 }}>
                        {v.dueDays < 0 ? `${Math.abs(v.dueDays)} días venc` : `Vence en ${v.dueDays}d`}
                      </span>
                    )}
                    <span className={'chip ' + chip.cls} style={{ fontSize: 9 }}>{chip.ico} {v.estado}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Flujo caja mini card (real + proyectado) ──
function FlujoCajaMiniCard({ data }) {
  const ref = useRef(null);
  const cajaActual = data[2]?.value || 0;
  const cajaProyectado = data[data.length - 1]?.value || 0;
  const deltaPct = cajaActual > 0 ? ((cajaProyectado - cajaActual) / cajaActual) * 100 : 0;

  useEffect(() => {
    if (!ref.current) return;
    const accent = getCssVar('--accent') || '#3B5BDB';
    const warn = getCssVar('--warn') || '#F59F00';
    const line = getCssVar('--line') || '#E4E4DF';
    const ink3 = getCssVar('--ink-3') || '#6B6B68';
    const bgElev = getCssVar('--bg-elev') || '#FFFFFF';

    const c = echarts.init(ref.current);
    c.setOption({
      tooltip: {
        trigger: 'axis', backgroundColor: bgElev, borderColor: line, borderWidth: 1,
        textStyle: { fontSize: 11 }, valueFormatter: (v) => fmtCompact(v),
      },
      grid: { top: 16, right: 16, bottom: 28, left: 8, containLabel: true },
      xAxis: {
        type: 'category', data: data.map(d => d.month),
        axisLine: { lineStyle: { color: line } }, axisTick: { show: false },
        axisLabel: { fontSize: 10, color: ink3, fontFamily: 'JetBrains Mono' },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 9, color: ink3, fontFamily: 'JetBrains Mono', formatter: (v) => fmtCompact(v).replace('S/ ', '') },
        splitLine: { lineStyle: { color: line, type: 'dashed' } },
      },
      series: [{
        type: 'bar', data: data.map(d => ({ value: d.value, itemStyle: { color: d.type === 'real' ? accent : warn, borderRadius: [3, 3, 0, 0] } })),
        barMaxWidth: 26,
        label: { show: true, position: 'top', formatter: (p) => (p.value / 1e6).toFixed(1) + 'M', fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, color: ink3 },
      }],
    });
    const onResize = () => c.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); c.dispose(); };
  }, [data]);

  return (
    <div className="card" style={{ borderTop: '3px solid #0EA5B7' }}>
      <div className="card-h" style={{ borderBottom: 'none', paddingBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: '#0EA5B7', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>FLUJO DE CAJA</div>
          <h3 style={{ margin: 0, fontSize: 13 }}>Real + Proyectado</h3>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <span className="chip blue" style={{ fontSize: 9 }}>Real</span>
          <span className="chip amber" style={{ fontSize: 9 }}>Proyectado</span>
        </div>
      </div>
      <div className="card-b" style={{ paddingTop: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>Real + proyectado · 6 meses</div>
        <div ref={ref} style={{ width: '100%', height: 180 }} />
        <div className="hstack between" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)', fontSize: 11 }}>
          <span className="muted">Caja actual: <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{fmtCompact(cajaActual)}</span></span>
          <span className="muted">Proy. Set: <span className="mono" style={{ color: 'var(--ok)', fontWeight: 600 }}>{fmtCompact(cajaProyectado)}</span> <span className="chip green" style={{ fontSize: 9 }}>▲ {deltaPct.toFixed(0)}%</span></span>
        </div>
      </div>
    </div>
  );
}

// ── Por cobrar card ──
function PorCobrarCard({ items, total }) {
  const sorted = [...items].sort((a, b) => {
    if (a.status === 'Vencida' && b.status !== 'Vencida') return -1;
    if (b.status === 'Vencida' && a.status !== 'Vencida') return 1;
    return b.monto - a.monto;
  }).slice(0, 5);

  return (
    <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
      <div className="card-h" style={{ borderBottom: 'none', paddingBottom: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13 }}>Por cobrar</h3>
          <div className="text-xs muted" style={{ marginTop: 2 }}>S/. {total.toLocaleString('es-PE')} pendientes</div>
        </div>
        <span className="chip blue" style={{ fontSize: 10 }}>{items.length} facturas</span>
      </div>
      <div className="card-b tight">
        <table>
          <tbody>
            {sorted.map((e, i) => {
              const urg = e.status === 'Vencida' ? 'red' : 'blue';
              return (
                <tr key={i} className="row-hover">
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{e.contraparte}</div>
                    <div className="text-xs muted">{e.concepto.slice(0, 38)}</div>
                  </td>
                  <td style={{ width: 70, textAlign: 'right' }}>
                    <span className={'chip ' + urg} style={{ fontSize: 10 }}>
                      {e.status === 'Vencida' ? 'venc.' : '30d'}
                    </span>
                  </td>
                  <td className="num-c mono" style={{ fontWeight: 700, color: 'var(--accent)', width: 110 }}>
                    S/. {e.monto.toLocaleString('es-PE')}
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

// ── Por pagar card ──
function PorPagarCard({ items, total }) {
  const sorted = [...items].sort((a, b) => b.monto - a.monto).slice(0, 5);

  return (
    <div className="card" style={{ borderTop: '3px solid var(--danger)' }}>
      <div className="card-h" style={{ borderBottom: 'none', paddingBottom: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13 }}>Por pagar</h3>
          <div className="text-xs muted" style={{ marginTop: 2 }}>S/. {total.toLocaleString('es-PE')} próx. 30 días</div>
        </div>
        <span className="chip red" style={{ fontSize: 10 }}>{items.length} pend.</span>
      </div>
      <div className="card-b tight">
        <table>
          <tbody>
            {sorted.map((e, i) => (
              <tr key={i} className="row-hover">
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{e.contraparte}</div>
                  <div className="text-xs muted">{e.concepto.slice(0, 38)}</div>
                </td>
                <td style={{ width: 70, textAlign: 'right' }}>
                  <span className="chip amber" style={{ fontSize: 10 }}>30d</span>
                </td>
                <td className="num-c mono" style={{ fontWeight: 700, color: 'var(--danger)', width: 110 }}>
                  S/. {e.monto.toLocaleString('es-PE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.FinanzasPage = FinanzasPage;
