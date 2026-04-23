/* global React, Icon, ERP_DATA */
const { useState, useMemo, useEffect } = React;
const {
  sunatEmitidos, sunatComunicaciones, sunatConciliaciones,
  EMISOR, fmtPEN, fmtCompact,
} = ERP_DATA;

// Series configurables (persistidas en localStorage)
const DEFAULT_SERIES = [
  { tipoDoc: '01', tipoNombre: 'Factura',              serie: 'F001', correlativoActual: 362 },
  { tipoDoc: '03', tipoNombre: 'Boleta de Venta',      serie: 'B001', correlativoActual: 48 },
  { tipoDoc: 'R1', tipoNombre: 'Recibo por Honorarios', serie: 'E001', correlativoActual: 128 },
  { tipoDoc: '07', tipoNombre: 'Nota de Crédito',      serie: 'FC01', correlativoActual: 12 },
  { tipoDoc: '08', tipoNombre: 'Nota de Débito',       serie: 'FD01', correlativoActual: 4 },
  { tipoDoc: '09', tipoNombre: 'Guía de Remisión',     serie: 'T001', correlativoActual: 85 },
];

const SUNAT_CONFIG_KEY = 'mm.sunat.series';

function loadSeries() {
  try {
    const saved = JSON.parse(localStorage.getItem(SUNAT_CONFIG_KEY) || 'null');
    if (Array.isArray(saved)) return saved;
  } catch {}
  return DEFAULT_SERIES;
}

function saveSeries(s) {
  try { localStorage.setItem(SUNAT_CONFIG_KEY, JSON.stringify(s)); } catch {}
}

// Configuración SUNAT (mock — para el estado "configurado")
const SUNAT_ACCOUNT_CONFIG = {
  usuarioSOL: 'MOGARCIA',
  claveSOL: '••••••••••',
  modo: 'PRODUCCIÓN',
  certDigital: 'mmhighmetrik_cert.pfx',
  certExpira: '2027-02-15',
  certDiasRestantes: 303,
  pseProveedor: 'Nubefact',
  ultimoPlePresentado: '2026-03-31',
  emitidosMes: 12,
  rechazadosMes: 1,
};

// =================== SUNAT PAGE ===================
function SunatPage() {
  const [subTab, setSubTab] = useState('emitidos');
  const [cpeOpen, setCpeOpen] = useState(null);
  const [showNewCpe, setShowNewCpe] = useState(false);
  const [showSeriesConfig, setShowSeriesConfig] = useState(false);
  const [series, setSeries] = useState(() => loadSeries());

  const updateSeries = (next) => { setSeries(next); saveSeries(next); };

  return (
    <div className="vstack" style={{ gap: 12 }}>
      {/* Header con sub-tabs segmented + acciones */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div className="hstack between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="hstack" style={{ gap: 12 }}>
            <div>
              <div className="hstack" style={{ gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  SUNAT · Facturación electrónica
                </span>
                <span className="chip green" style={{ fontSize: 9 }}>
                  ● PRODUCCIÓN · OSE Nubefact
                </span>
              </div>
              <div className="text-xs muted">
                RUC {EMISOR.ruc} · {EMISOR.razonSocial} · Certificado válido hasta {SUNAT_ACCOUNT_CONFIG.certExpira} ({SUNAT_ACCOUNT_CONFIG.certDiasRestantes} días)
              </div>
            </div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button className="tb-btn" onClick={() => setShowSeriesConfig(true)}>{Icon.cog({ size: 13 })} Series</button>
            <button className="tb-btn primary" onClick={() => setShowNewCpe(true)}>{Icon.plus({ size: 13 })} Emitir comprobante</button>
          </div>
        </div>

        <div className="hstack" style={{ gap: 0, marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div className="tw-seg" style={{ height: 30 }}>
            {[
              { id: 'emitidos',       label: 'Emitidos',       count: sunatEmitidos.length },
              { id: 'recibidos',      label: 'Recibidos',      count: sunatConciliaciones.length },
              { id: 'comunicaciones', label: 'Comunicaciones', count: sunatComunicaciones.length },
              { id: 'importar',       label: 'Importar histórico' },
            ].map(t => (
              <button
                key={t.id}
                className={subTab === t.id ? 'on' : ''}
                onClick={() => setSubTab(t.id)}
                style={{ fontSize: 11, padding: '0 12px' }}
              >
                {t.label}
                {t.count != null && <span style={{ marginLeft: 6, opacity: 0.7, fontFamily: 'var(--mono)', fontSize: 10 }}>· {t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subTab === 'emitidos' && <EmitidosView onViewCpe={setCpeOpen} />}
      {subTab === 'recibidos' && <RecibidosView />}
      {subTab === 'comunicaciones' && <ComunicacionesView />}
      {subTab === 'importar' && <ImportarHistoricoView />}

      {cpeOpen && <CPEViewerModal cpe={cpeOpen} onClose={() => setCpeOpen(null)} />}
      {showNewCpe && (
        <NuevoCPEModal
          series={series}
          onSeriesUpdate={updateSeries}
          onClose={() => setShowNewCpe(false)}
        />
      )}
      {showSeriesConfig && (
        <SeriesConfigModal
          series={series}
          onSave={(next) => { updateSeries(next); setShowSeriesConfig(false); }}
          onClose={() => setShowSeriesConfig(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMITIDOS VIEW
// ═══════════════════════════════════════════════════════════════
function EmitidosView({ onViewCpe }) {
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    let list = sunatEmitidos;
    if (filterTipo !== 'all') list = list.filter(c => c.tipoDoc === filterTipo);
    if (filterEstado !== 'all') list = list.filter(c => c.estadoSunat === filterEstado);
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(c =>
        c.docCompleto.toLowerCase().includes(ql) ||
        c.cliente.razonSocial.toLowerCase().includes(ql) ||
        c.cliente.numDoc.includes(ql)
      );
    }
    return [...list].sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
  }, [filterTipo, filterEstado, q]);

  // Stats del mes actual (Abr '26)
  const mesActual = '2026-04';
  const emitidosMes = sunatEmitidos.filter(c => c.fechaEmision.startsWith(mesActual));
  const totalMes = emitidosMes.reduce((s, c) => s + c.totales.total, 0);
  const igvMes = emitidosMes.reduce((s, c) => s + (c.totales.igv || 0), 0);
  const ncMes = emitidosMes.filter(c => c.tipoDoc === '07').length;
  const rechazadosMes = sunatEmitidos.filter(c => c.estadoSunat === 'Rechazado').length;

  return (
    <div className="vstack" style={{ gap: 14 }}>
      {/* Stats del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <MiniStat lbl="Emitido abril" val={fmtCompact(totalMes)} sub={`${emitidosMes.length} comprobantes`} color="var(--accent)" />
        <MiniStat lbl="IGV acumulado" val={fmtCompact(igvMes)} sub="Mes actual" color="var(--warn-ink)" />
        <MiniStat lbl="Notas crédito" val={String(ncMes)} sub="anulaciones mes" color="#7C3AED" />
        <MiniStat lbl="Rechazados" val={String(rechazadosMes)} sub="requieren acción" color="var(--danger)" />
      </div>

      {/* Filtros + tabla */}
      <div className="card">
        <div className="card-h">
          <div className="hstack" style={{ gap: 10 }}>
            <h3>Comprobantes emitidos</h3>
            <span className="mono text-xs muted">{filtered.length} de {sunatEmitidos.length}</span>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <div className="tb-search-wrap" style={{ width: 220, height: 28, maxWidth: 'none' }}>
              <span className="ico">{Icon.search({ size: 12 })}</span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Serie, cliente, RUC..." style={{ fontSize: 11 }} />
            </div>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="fin-input" style={{ height: 28, fontSize: 11 }}>
              <option value="all">Todos los tipos</option>
              <option value="01">Facturas</option>
              <option value="03">Boletas</option>
              <option value="R1">Recibos Honorarios</option>
              <option value="07">Notas de crédito</option>
              <option value="08">Notas de débito</option>
            </select>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="fin-input" style={{ height: 28, fontSize: 11 }}>
              <option value="all">Todos los estados</option>
              <option value="Aceptado">Aceptado</option>
              <option value="Observado">Observado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Anulado">Anulado</option>
            </select>
            <button className="tb-btn" style={{ height: 28, fontSize: 11 }}>{Icon.download({ size: 11 })} XML mes</button>
          </div>
        </div>
        <div className="card-b tight" style={{ maxHeight: 560, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 120 }}>Comprobante</th>
                <th style={{ width: 90 }}>Tipo</th>
                <th>Cliente</th>
                <th style={{ width: 130 }}>Doc</th>
                <th style={{ width: 90 }}>Fecha</th>
                <th className="num-c" style={{ width: 110 }}>Total</th>
                <th style={{ width: 120 }}>Estado SUNAT</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>
                  Sin resultados con estos filtros
                </td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="row-hover" style={{ cursor: 'pointer' }} onClick={() => onViewCpe(c)}>
                  <td><span className="mono text-xs" style={{ fontWeight: 700 }}>{c.docCompleto}</span></td>
                  <td><TipoBadge tipoDoc={c.tipoDoc} tipoNombre={c.tipoNombre} /></td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{c.cliente.razonSocial}</div>
                    {c.importadoHistorico && <span className="chip" style={{ fontSize: 9, background: 'var(--warn-soft)', color: 'var(--warn-ink)' }}>Histórico</span>}
                  </td>
                  <td className="mono text-xs muted">{c.cliente.tipoDoc} {c.cliente.numDoc}</td>
                  <td className="mono text-xs">{c.fechaEmision.slice(5)}</td>
                  <td className="num-c mono" style={{ fontWeight: 600 }}>
                    {c.moneda === 'PEN' ? 'S/ ' : '$ '}{c.totales.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                  <td><EstadoChip estado={c.estadoSunat} obsMsg={c.obsMsg} /></td>
                  <td style={{ color: 'var(--ink-4)' }}>{Icon.right({ size: 12 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TipoBadge({ tipoDoc, tipoNombre }) {
  const colors = {
    '01': { bg: 'var(--accent-soft)', ink: 'var(--accent-ink)' },
    '03': { bg: 'var(--ok-soft)',     ink: 'var(--ok-ink)' },
    'R1': { bg: '#EBE6FA',            ink: '#4526B8' },
    '07': { bg: 'var(--danger-soft)', ink: 'var(--danger-ink)' },
    '08': { bg: 'var(--warn-soft)',   ink: 'var(--warn-ink)' },
    '09': { bg: 'var(--bg-sunken)',   ink: 'var(--ink-2)' },
  };
  const c = colors[tipoDoc] || colors['09'];
  return (
    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: c.bg, color: c.ink }}>
      {tipoNombre}
    </span>
  );
}

function EstadoChip({ estado, obsMsg }) {
  const cfg = {
    Aceptado:  { cls: 'green', ico: '●' },
    Observado: { cls: 'amber', ico: '⚠' },
    Rechazado: { cls: 'red',   ico: '✕' },
    Pendiente: { cls: 'amber', ico: '◐' },
    Anulado:   { cls: '',      ico: '—' },
  }[estado] || { cls: '', ico: '—' };
  return (
    <div className="hstack" style={{ gap: 4 }}>
      <span className={'chip ' + cfg.cls} style={{ fontSize: 10 }}>{cfg.ico} {estado}</span>
      {obsMsg && <span title={obsMsg} style={{ color: 'var(--ink-3)', cursor: 'help' }}>{Icon.info({ size: 11 })}</span>}
    </div>
  );
}

function MiniStat({ lbl, val, sub, color }) {
  return (
    <div style={{ padding: '10px 14px', borderLeft: `3px solid ${color}`, background: 'var(--bg-elev)', borderRadius: 6, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 3 }}>{lbl}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RECIBIDOS VIEW (antes Conciliación)
// ═══════════════════════════════════════════════════════════════
function RecibidosView() {
  const conciliadas = sunatConciliaciones.filter(r => r.estado === 'Conciliada').length;
  const observacion = sunatConciliaciones.filter(r => r.estado === 'Observación').length;
  const sinConc = sunatConciliaciones.filter(r => r.estado === 'Sin conciliar').length;
  const total = sunatConciliaciones.length;

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <MiniStat lbl="Conciliadas" val={String(conciliadas)} sub={`${Math.round(conciliadas/total*100)}% del total`} color="var(--ok)" />
        <MiniStat lbl="Con observación" val={String(observacion)} sub="revisar" color="var(--warn)" />
        <MiniStat lbl="Sin conciliar" val={String(sinConc)} sub="acción requerida" color="var(--danger)" />
      </div>

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Comprobantes recibidos · conciliación SUNAT</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>Importación XML CPE · {total} documentos</div>
          </div>
          <button className="tb-btn">{Icon.upload({ size: 12 })} Importar CPEs</button>
        </div>
        <div className="card-b tight">
          <table>
            <thead>
              <tr>
                <th style={{ width: 110 }}>Comprobante</th>
                <th>Proveedor</th>
                <th style={{ width: 130 }}>RUC</th>
                <th className="num-c" style={{ width: 120 }}>Monto</th>
                <th style={{ width: 130 }}>OC asociada</th>
                <th style={{ width: 90 }}>Fecha</th>
                <th style={{ width: 160 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sunatConciliaciones.map((r, i) => (
                <tr key={i} className="row-hover">
                  <td className="mono text-xs" style={{ fontWeight: 600 }}>{r.doc}</td>
                  <td>{r.proveedor}</td>
                  <td className="mono text-xs muted">{r.ruc}</td>
                  <td className="num-c mono">{r.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                  <td>{r.oc ? <span className="mono text-xs" style={{ color: 'var(--accent)' }}>{r.oc}</span> : <span className="muted text-xs">—</span>}</td>
                  <td className="mono text-xs muted">{r.fecha.slice(5)}</td>
                  <td>
                    <div className="hstack" style={{ gap: 6 }}>
                      <span className={'chip ' + (r.estado === 'Conciliada' ? 'green' : r.estado === 'Sin conciliar' ? 'red' : 'amber')}>{r.estado}</span>
                      {r.obsMsg && <span title={r.obsMsg} style={{ color: 'var(--ink-3)', cursor: 'help' }}>{Icon.info({ size: 11 })}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMUNICACIONES VIEW — log de envíos SUNAT
// ═══════════════════════════════════════════════════════════════
function ComunicacionesView() {
  const errors = sunatComunicaciones.filter(l => l.nivel === 'error').length;
  const warns = sunatComunicaciones.filter(l => l.nivel === 'warn').length;

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <MiniStat lbl="Total eventos" val={String(sunatComunicaciones.length)} sub="últimos 30 días" color="var(--accent)" />
        <MiniStat lbl="Aceptados" val={String(sunatComunicaciones.filter(l => l.nivel === 'info' && l.accion === 'RESPUESTA').length)} sub="respuestas OK" color="var(--ok)" />
        <MiniStat lbl="Observaciones" val={String(warns)} sub="revisar" color="var(--warn)" />
        <MiniStat lbl="Errores" val={String(errors)} sub="acción inmediata" color="var(--danger)" />
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Log de comunicaciones con SUNAT</h3>
          <div className="hstack" style={{ gap: 6 }}>
            <span className="chip green" style={{ fontSize: 10 }}>● OSE Nubefact</span>
            <button className="tb-btn" style={{ height: 26, fontSize: 11 }}>{Icon.download({ size: 11 })} Export</button>
          </div>
        </div>
        <div className="card-b tight" style={{ maxHeight: 480, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 140 }}>Fecha/hora</th>
                <th style={{ width: 100 }}>Acción</th>
                <th style={{ width: 90 }}>Código</th>
                <th>Mensaje</th>
                <th style={{ width: 120 }}>CPE vinculado</th>
              </tr>
            </thead>
            <tbody>
              {sunatComunicaciones.map(l => {
                const cpe = sunatEmitidos.find(c => c.id === l.cpeId);
                const color = l.nivel === 'error' ? 'var(--danger)' : l.nivel === 'warn' ? 'var(--warn)' : 'var(--ink-3)';
                return (
                  <tr key={l.id} className="row-hover">
                    <td className="mono text-xs" style={{ color: 'var(--ink-3)' }}>
                      {new Date(l.fecha).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className="chip mono" style={{ fontSize: 10, color }}>{l.accion}</span>
                    </td>
                    <td className="mono text-xs" style={{ color, fontWeight: 600 }}>{l.codigo}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-2)' }}>{l.mensaje}</td>
                    <td className="mono text-xs">
                      {cpe
                        ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{cpe.docCompleto}</span>
                        : <span className="muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// IMPORTAR HISTÓRICO
// ═══════════════════════════════════════════════════════════════
function ImportarHistoricoView() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [hovering, setHovering] = useState(false);

  const simulateImport = () => {
    setImporting(true);
    setResult(null);
    setTimeout(() => {
      setImporting(false);
      setResult({
        total: 147,
        importados: 142,
        duplicados: 3,
        errores: 2,
        periodo: 'Ene 2024 — Mar 2026',
      });
    }, 2400);
  };

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-h">
          <div>
            <h3>Importar comprobantes históricos</h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>
              Sube los XMLs firmados de tu proveedor previo (Nubefact, Defontana, Efact, Siigo, Bsale...) o exporta desde tu Clave SOL
            </div>
          </div>
        </div>
        <div className="card-b">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <SourceCard icon="upload" title="XML masivo (.zip)" desc="Arrastra ZIP con XMLs firmados UBL 2.1" recommended />
            <SourceCard icon="cloud" title="Conectar Clave SOL" desc="Consulta SUNAT · requiere certificado digital" soon />
            <SourceCard icon="xlsx" title="Excel + XMLs" desc="Migración asistida (plantilla + archivos)" />
            <SourceCard icon="link" title="API proveedor previo" desc="Nubefact · Efact · Defontana · Siigo" soon />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setHovering(true); }}
            onDragLeave={() => setHovering(false)}
            onDrop={e => { e.preventDefault(); setHovering(false); simulateImport(); }}
            onClick={simulateImport}
            style={{
              border: '2px dashed ' + (hovering ? 'var(--accent)' : 'var(--line)'),
              borderRadius: 10, padding: '40px 24px', textAlign: 'center',
              background: hovering ? 'var(--accent-soft)' : 'var(--bg-sunken)',
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {importing ? (
              <div>
                <div className="oc-spinner" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Importando CPEs históricos…</div>
                <div className="text-xs muted">Validando firmas XAdES · extrayendo datos · verificando duplicados</div>
              </div>
            ) : result ? (
              <div>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--ok)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  {Icon.check({ size: 24 })}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Importación completada</div>
                <div className="hstack" style={{ gap: 18, justifyContent: 'center', fontSize: 11 }}>
                  <span><b style={{ fontSize: 13, color: 'var(--ok)' }}>{result.importados}</b> importados</span>
                  <span><b style={{ fontSize: 13, color: 'var(--warn-ink)' }}>{result.duplicados}</b> duplicados</span>
                  <span><b style={{ fontSize: 13, color: 'var(--danger)' }}>{result.errores}</b> errores</span>
                </div>
                <div className="text-xs muted" style={{ marginTop: 8 }}>
                  Período: {result.periodo} · Total procesado: {result.total}
                </div>
                <button className="tb-btn" style={{ marginTop: 16, fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setResult(null); }}>
                  Importar más archivos
                </button>
              </div>
            ) : (
              <div>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  {Icon.upload({ size: 24 })}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Arrastra archivos aquí o haz click</div>
                <div className="text-xs muted">Soporta .zip (múltiples XMLs) · XMLs individuales · máximo 200 MB</div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 10, fontFamily: 'var(--mono)' }}>
                  (demo · importación simulada — cuando conectes backend se parsearán de verdad)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info card — qué se puede importar */}
      <div className="card" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
        <div className="card-b">
          <div className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>{Icon.info({ size: 16 })}</div>
            <div style={{ fontSize: 12, color: 'var(--accent-ink)', lineHeight: 1.5 }}>
              <b>¿Qué se puede importar?</b><br />
              • <b>XMLs UBL 2.1</b> firmados con XAdES · formato SUNAT estándar<br />
              • <b>Consulta SUNAT directa</b>: últimos 12 meses vía webservice (requiere certificado digital + Clave SOL)<br />
              • <b>Proveedores previos</b>: Nubefact, Defontana, Efact, Siigo Perú, Bsale, Contasis · cada uno tiene su export<br />
              <br />
              <b>Los CPEs importados aparecerán etiquetados "Histórico"</b> en la lista de Emitidos y se pueden visualizar, consultar e incluir en reportes igual que los emitidos en el sistema.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceCard({ icon, title, desc, recommended, soon }) {
  return (
    <div className="card" style={{ padding: 14, background: recommended ? 'var(--bg-elev)' : 'var(--bg-sunken)', cursor: soon ? 'not-allowed' : 'pointer', opacity: soon ? 0.6 : 1, borderLeft: recommended ? '3px solid var(--accent)' : '1px solid var(--line)' }}>
      <div className="hstack between" style={{ alignItems: 'flex-start' }}>
        <div className="hstack" style={{ gap: 10, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {Icon[icon]({ size: 15 })}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="hstack" style={{ gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
              {recommended && <span className="chip blue" style={{ fontSize: 9 }}>Recomendado</span>}
              {soon && <span className="chip" style={{ fontSize: 9 }}>Próximamente</span>}
            </div>
            <div className="text-xs muted" style={{ marginTop: 2 }}>{desc}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CPE VIEWER MODAL — representación impresa estilo SUNAT
// ═══════════════════════════════════════════════════════════════
function CPEViewerModal({ cpe, onClose }) {
  const [closing, setClosing] = useState(false);
  const close = () => { if (closing) return; setClosing(true); setTimeout(onClose, 220); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const estColor = cpe.estadoSunat === 'Aceptado' ? 'var(--ok)' : cpe.estadoSunat === 'Rechazado' ? 'var(--danger)' : cpe.estadoSunat === 'Observado' ? 'var(--warn)' : 'var(--ink-3)';
  const isFactura = cpe.tipoDoc === '01';
  const isBoleta = cpe.tipoDoc === '03';
  const isRHE = cpe.tipoDoc === 'R1';
  const isNC = cpe.tipoDoc === '07';

  return (
    <div className={'modal-overlay' + (closing ? ' closing' : '')} onClick={close}>
      <div
        className={'modal-box animate-fade-in' + (closing ? ' closing' : '')}
        style={{ width: 920, maxWidth: '96vw', padding: 0, overflow: 'hidden', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar (meta + acciones) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)', flexShrink: 0 }}>
          <div className="hstack" style={{ gap: 12 }}>
            <TipoBadge tipoDoc={cpe.tipoDoc} tipoNombre={cpe.tipoNombre} />
            <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{cpe.docCompleto}</span>
            <EstadoChip estado={cpe.estadoSunat} obsMsg={cpe.obsMsg} />
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button className="tb-btn" style={{ height: 28, fontSize: 11 }}>{Icon.download({ size: 11 })} PDF</button>
            <button className="tb-btn" style={{ height: 28, fontSize: 11 }}>{Icon.download({ size: 11 })} XML</button>
            <button className="tb-btn" style={{ height: 28, fontSize: 11 }}>{Icon.file({ size: 11 })} CDR</button>
            <button className="tb-icon-btn" onClick={close}>{Icon.x({ size: 14 })}</button>
          </div>
        </div>

        {/* Hoja SUNAT (scroll content) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#F8F7F3' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', background: '#FFFFFF', border: '1px solid #D8D8D2', padding: '28px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative' }}>
            {/* Marca "ANULADO" o "HISTÓRICO" diagonal si aplica */}
            {cpe.estadoSunat === 'Anulado' && (
              <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, textAlign: 'center', transform: 'rotate(-15deg)', color: 'rgba(209,69,59,0.18)', fontSize: 80, fontWeight: 900, letterSpacing: 8, pointerEvents: 'none' }}>
                ANULADO
              </div>
            )}
            {cpe.importadoHistorico && (
              <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, color: 'var(--warn-ink)', background: 'var(--warn-soft)', padding: '2px 8px', borderRadius: 3, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>
                IMPORTADO
              </div>
            )}

            {/* Header empresa + recuadro comprobante */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, paddingBottom: 14, borderBottom: '1px solid #D8D8D2' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 6, background: '#0F1115', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, letterSpacing: '-0.02em' }}>MM</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: '#1C1C1C' }}>{EMISOR.nombreComercial}</div>
                    <div style={{ fontSize: 9, color: '#6B6B68', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingeniería y Construcción</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#3D3D3A', marginBottom: 2 }}>{EMISOR.razonSocial}</div>
                <div style={{ fontSize: 10, color: '#6B6B68' }}>{EMISOR.direccion}</div>
                <div style={{ fontSize: 10, color: '#6B6B68' }}>{EMISOR.distrito} · {EMISOR.provincia} · {EMISOR.departamento}</div>
                <div style={{ fontSize: 10, color: '#6B6B68', marginTop: 4 }}>
                  <span className="mono">{EMISOR.email}</span> · <span className="mono">{EMISOR.telefono}</span>
                </div>
              </div>
              <div style={{ border: '1.5px solid #1C1C1C', borderRadius: 4, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#6B6B68', fontFamily: 'var(--mono)', letterSpacing: '0.08em', marginBottom: 4 }}>RUC {EMISOR.ruc}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1C1C1C', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {cpe.tipoNombre}<br />ELECTRÓNICA
                </div>
                <div style={{ marginTop: 8, padding: '6px 8px', background: '#1C1C1C', color: '#fff', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', borderRadius: 3 }}>
                  {cpe.docCompleto}
                </div>
              </div>
            </div>

            {/* Datos emisión + receptor */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid #D8D8D2' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 11 }}>
                <div>
                  <DatoSunat label="Fecha de emisión" value={cpe.fechaEmision} mono />
                  <DatoSunat label="Moneda" value={cpe.moneda === 'PEN' ? 'SOLES' : 'DÓLARES AMERICANOS'} />
                  {cpe.referencia && (
                    <DatoSunat label="Referencia" value={`${cpe.referencia.tipo} · ${cpe.referencia.id}`} mono />
                  )}
                </div>
                <div>
                  <DatoSunat label="Señor(es)" value={cpe.cliente.razonSocial} bold />
                  <DatoSunat label={cpe.cliente.tipoDoc} value={cpe.cliente.numDoc} mono />
                  <DatoSunat label="Dirección" value={cpe.cliente.direccion} />
                </div>
              </div>
            </div>

            {/* Ítems */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid #D8D8D2' }}>
              <table style={{ fontSize: 10, width: '100%' }}>
                <thead>
                  <tr style={{ background: '#EFEFEB', color: '#1C1C1C' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 40 }}>#</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descripción</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 44 }}>Und</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 60 }}>Cant.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 90 }}>P. Unit.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 100 }}>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {cpe.items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px dashed #E4E4DF' }}>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'var(--mono)' }}>{i + 1}</td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontSize: 11, color: '#1C1C1C' }}>{it.desc}</div>
                        <div style={{ fontSize: 9, color: '#6B6B68', marginTop: 1, fontFamily: 'var(--mono)' }}>cod: {it.cod}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'var(--mono)' }}>{it.und}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{it.cant.toLocaleString('es-PE')}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{it.pUnit.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>{it.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales + importe en letras */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid #D8D8D2', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20 }}>
              <div>
                <div style={{ fontSize: 9, color: '#6B6B68', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>
                  SON:
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1C1C1C', textTransform: 'uppercase', lineHeight: 1.4 }}>
                  {cpe.importeEnLetras}
                </div>
                {cpe.leyendas && cpe.leyendas.map((l, i) => (
                  <div key={i} style={{ fontSize: 9, marginTop: 8, padding: '4px 8px', background: '#FDF0D4', color: '#7A4E00', fontFamily: 'var(--mono)', display: 'inline-block', borderRadius: 3, fontWeight: 600, letterSpacing: '0.03em' }}>
                    ⚠ {l}
                  </div>
                ))}
                {cpe.docRelacionado && (
                  <div style={{ fontSize: 10, color: '#6B6B68', marginTop: 8 }}>
                    <b>Documento que modifica:</b> <span className="mono">{cpe.docRelacionado}</span> · <b>Motivo:</b> {cpe.motivoNC}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>
                <TotalRow label="Op. gravada" val={cpe.totales.gravado} />
                {cpe.totales.exonerado > 0 && <TotalRow label="Op. exonerada" val={cpe.totales.exonerado} />}
                {cpe.totales.inafecto > 0 && <TotalRow label="Op. inafecta" val={cpe.totales.inafecto} />}
                <TotalRow label="IGV 18%" val={cpe.totales.igv} />
                <div style={{ borderTop: '2px solid #1C1C1C', marginTop: 4, paddingTop: 6 }}>
                  <TotalRow label="IMPORTE TOTAL" val={cpe.totales.total} bold />
                </div>
                {cpe.totales.detraccion && (
                  <div style={{ marginTop: 8, padding: '6px 8px', background: '#F8F7F3', border: '1px dashed #D1453B', borderRadius: 3 }}>
                    <div style={{ fontSize: 9, color: '#7A1F18', fontWeight: 600, marginBottom: 2 }}>DETRACCIÓN SPOT {cpe.totales.detraccion.pct}%</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1C1C1C' }}>S/ {cpe.totales.detraccion.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                  </div>
                )}
                {cpe.totales.retencion && (
                  <div style={{ marginTop: 6, padding: '6px 8px', background: '#F8F7F3', border: '1px dashed #7C3AED', borderRadius: 3 }}>
                    <div style={{ fontSize: 9, color: '#4526B8', fontWeight: 600, marginBottom: 2 }}>RETENCIÓN 8% (4ta categoría)</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1C1C1C' }}>S/ {cpe.totales.retencion.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                  </div>
                )}
              </div>
            </div>

            {/* QR + firma + representación impresa */}
            <div style={{ paddingTop: 14, display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16, alignItems: 'start' }}>
              <SunatQR seed={cpe.hashFirma + cpe.docCompleto} />
              <div>
                <div style={{ fontSize: 9, color: '#6B6B68', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>
                  Código de autorización SUNAT
                </div>
                <div className="mono" style={{ fontSize: 10, color: '#1C1C1C', fontWeight: 600, wordBreak: 'break-all', marginBottom: 6 }}>
                  {cpe.hashFirma || '—'}
                </div>
                {cpe.ticketSunat && (
                  <>
                    <div style={{ fontSize: 9, color: '#6B6B68', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>
                      Ticket envío
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: '#3D3D3A', marginBottom: 10 }}>{cpe.ticketSunat}</div>
                  </>
                )}
                <div style={{ fontSize: 10, color: '#6B6B68', lineHeight: 1.4, fontStyle: 'italic', borderTop: '1px solid #E4E4DF', paddingTop: 8 }}>
                  Representación impresa de la {cpe.tipoNombre.toUpperCase()} ELECTRÓNICA.
                  Consulte en <span style={{ color: '#3B5BDB', textDecoration: 'underline' }}>www.sunat.gob.pe</span> con el código de autorización y ruc del emisor.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del modal */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elev)', flexShrink: 0 }}>
          <div className="text-xs muted">
            {cpe.estadoSunat === 'Aceptado' && <span style={{ color: 'var(--ok)' }}>● Aceptado por SUNAT · {cpe.fechaEnvio ? new Date(cpe.fechaEnvio).toLocaleString('es-PE') : '—'}</span>}
            {cpe.estadoSunat === 'Observado' && <span style={{ color: 'var(--warn-ink)' }}>⚠ {cpe.obsMsg}</span>}
            {cpe.estadoSunat === 'Rechazado' && <span style={{ color: 'var(--danger)' }}>✕ {cpe.obsMsg}</span>}
            {cpe.estadoSunat === 'Pendiente' && <span style={{ color: 'var(--warn-ink)' }}>◐ Esperando respuesta SUNAT</span>}
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            {cpe.estadoSunat === 'Aceptado' && cpe.tipoDoc !== '07' && (
              <button className="tb-btn" style={{ color: 'var(--danger)' }}>Comunicación de baja</button>
            )}
            <button className="tb-btn">{Icon.upload({ size: 13 })} Enviar por email</button>
            <button className="tb-btn primary" onClick={close}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatoSunat({ label, value, mono, bold }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <span style={{ fontSize: 9, color: '#6B6B68', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
        {label}:
      </span>{' '}
      <span style={{ fontSize: 11, color: '#1C1C1C', fontWeight: bold ? 700 : 500, fontFamily: mono ? 'var(--mono)' : 'var(--sans)' }}>
        {value}
      </span>
    </div>
  );
}

function TotalRow({ label, val, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ fontWeight: bold ? 700 : 500, color: '#3D3D3A', fontSize: bold ? 11 : 10 }}>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: '#1C1C1C', fontSize: bold ? 12 : 11 }}>
        S/ {val.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QR MOCK — patrón visual tipo SUNAT (no escaneable, determinístico)
// ═══════════════════════════════════════════════════════════════
function SunatQR({ seed }) {
  const size = 21; // celdas
  const cell = 4; // px
  const total = size * cell;

  // Hash determinístico simple
  const pattern = useMemo(() => {
    const grid = Array(size).fill(null).map(() => Array(size).fill(false));
    // Hash del seed
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    const rng = (i, j) => {
      const v = Math.abs((h ^ (i * 131 + j * 17 + i * j)) >>> 0);
      return (v % 100) < 48;
    };

    // Llenar celdas pseudorandom
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        grid[i][j] = rng(i, j);
      }
    }

    // Finder patterns (3 esquinas) — 7x7
    const drawFinder = (startI, startJ) => {
      for (let di = 0; di < 7; di++) {
        for (let dj = 0; dj < 7; dj++) {
          const outer = di === 0 || di === 6 || dj === 0 || dj === 6;
          const inner = di >= 2 && di <= 4 && dj >= 2 && dj <= 4;
          grid[startI + di][startJ + dj] = outer || inner;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Quiet zone around finders (1 celda blanca)
    for (let i = 0; i < 8; i++) {
      if (i < size) { grid[7][i] = false; grid[i][7] = false; }
      if (size - 8 >= 0) { grid[7][size - 1 - i] = false; grid[i][size - 8] = false; }
      if (size - 8 >= 0 && i < 8) { grid[size - 8][i] = false; grid[size - 1 - i][7] = false; }
    }

    return grid;
  }, [seed]);

  return (
    <div style={{ width: total, height: total, border: '1px solid #D8D8D2', padding: 0, background: '#fff' }}>
      <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`} style={{ display: 'block' }}>
        {pattern.flatMap((row, i) =>
          row.map((on, j) => on
            ? <rect key={`${i}-${j}`} x={j * cell} y={i * cell} width={cell} height={cell} fill="#1C1C1C" />
            : null
          )
        )}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NUEVO CPE MODAL — emitir comprobante electrónico
// ═══════════════════════════════════════════════════════════════
function NuevoCPEModal({ series, onSeriesUpdate, onClose }) {
  const [tipoDoc, setTipoDoc] = useState('01');
  const [cliente, setCliente] = useState({ razonSocial: '', tipoDoc: 'RUC', numDoc: '', direccion: '' });
  const [items, setItems] = useState([{ cod: '', desc: '', und: 'ZZ', cant: 1, pUnit: 0, afectIGV: '10' }]);
  const [moneda, setMoneda] = useState('PEN');
  const [detraccion, setDetraccion] = useState(false);

  const currentSerie = series.find(s => s.tipoDoc === tipoDoc);
  const nextCorrelativo = String((currentSerie?.correlativoActual || 0) + 1).padStart(5, '0');
  const docCompleto = currentSerie ? `${currentSerie.serie}-${nextCorrelativo}` : '—';

  const setItem = (idx, key, val) => setItems(it => it.map((x, i) => i === idx ? { ...x, [key]: val } : x));
  const addItem = () => setItems(it => [...it, { cod: '', desc: '', und: 'ZZ', cant: 1, pUnit: 0, afectIGV: '10' }]);
  const delItem = (idx) => setItems(it => it.length > 1 ? it.filter((_, i) => i !== idx) : it);

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.cant) || 0) * (parseFloat(it.pUnit) || 0), 0);
  const igv = tipoDoc === 'R1' ? 0 : subtotal * 0.18;
  const detrMonto = detraccion ? (subtotal + igv) * 0.04 : 0;
  const total = subtotal + igv;
  const validDoc = cliente.tipoDoc === 'RUC' ? /^\d{11}$/.test(cliente.numDoc) : /^\d{8}$/.test(cliente.numDoc);
  const validItems = items.every(it => it.desc && it.cant > 0 && it.pUnit >= 0);
  const isValid = cliente.razonSocial.trim() && validDoc && validItems && subtotal > 0;

  const handleEmit = () => {
    if (!isValid) return;
    // Incrementar correlativo
    const nextSeries = series.map(s => s.tipoDoc === tipoDoc ? { ...s, correlativoActual: s.correlativoActual + 1 } : s);
    onSeriesUpdate(nextSeries);
    onClose();
    // TODO: backend real push al sunatEmitidos
  };

  const fillTest = () => {
    setCliente({ razonSocial: 'Corporación Belcorp S.A.', tipoDoc: 'RUC', numDoc: '20100055237', direccion: 'Av. República de Panamá 3591, San Isidro' });
    setItems([{ cod: 'SERV-VAL', desc: 'Valorización V08 Abril 2026 · Oficinas San Isidro', und: 'ZZ', cant: 1, pUnit: 56000, afectIGV: '10' }]);
    setDetraccion(true);
  };

  const tiposDisponibles = [
    { d: '01', label: 'Factura', icon: 'file' },
    { d: '03', label: 'Boleta', icon: 'file' },
    { d: 'R1', label: 'RHE', icon: 'file' },
    { d: '07', label: 'N. crédito', icon: 'file' },
    { d: '08', label: 'N. débito', icon: 'file' },
    { d: '09', label: 'Guía remisión', icon: 'file' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 780, maxWidth: '96vw', padding: 0, overflow: 'hidden', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elev)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Emitir comprobante electrónico</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
              {docCompleto} · {new Date().toLocaleDateString('es-PE')} · SUNAT {SUNAT_ACCOUNT_CONFIG.modo}
            </div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button onClick={fillTest} style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px dashed var(--warn)', background: 'var(--warn-soft)', color: 'var(--warn-ink)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--mono)' }}>⚡ TEST</button>
            <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          {/* Tipo doc grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 18 }}>
            {tiposDisponibles.map(t => (
              <button
                key={t.d}
                onClick={() => setTipoDoc(t.d)}
                style={{
                  padding: '10px 6px', borderRadius: 6, cursor: 'pointer',
                  border: '1.5px solid ' + (tipoDoc === t.d ? 'var(--accent)' : 'var(--line)'),
                  background: tipoDoc === t.d ? 'var(--accent-soft)' : 'var(--bg-elev)',
                  color: tipoDoc === t.d ? 'var(--accent-ink)' : 'var(--ink-2)',
                  fontSize: 11, fontWeight: 600, transition: 'all .15s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Receptor */}
          <div style={{ marginBottom: 16 }}>
            <SectionTitle>Adquiriente / Receptor</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 2fr', gap: 10, marginBottom: 10 }}>
              <div>
                <FLabel>Tipo doc</FLabel>
                <select value={cliente.tipoDoc} onChange={e => setCliente({ ...cliente, tipoDoc: e.target.value })} className="fin-input">
                  <option>RUC</option><option>DNI</option><option>CE</option>
                </select>
              </div>
              <div>
                <FLabel>N° documento</FLabel>
                <input value={cliente.numDoc} onChange={e => setCliente({ ...cliente, numDoc: e.target.value.replace(/\D/g, '') })} maxLength={cliente.tipoDoc === 'RUC' ? 11 : 8} placeholder={cliente.tipoDoc === 'RUC' ? '20XXXXXXXXX' : '12345678'} className="fin-input mono" />
              </div>
              <div>
                <FLabel>Razón social / Nombre</FLabel>
                <input value={cliente.razonSocial} onChange={e => setCliente({ ...cliente, razonSocial: e.target.value })} placeholder="Corporación XYZ S.A." className="fin-input" />
              </div>
            </div>
            <div>
              <FLabel>Dirección fiscal</FLabel>
              <input value={cliente.direccion} onChange={e => setCliente({ ...cliente, direccion: e.target.value })} placeholder="Av. ..." className="fin-input" />
            </div>
          </div>

          {/* Ítems */}
          <div style={{ marginBottom: 16 }}>
            <div className="hstack between" style={{ marginBottom: 6 }}>
              <SectionTitle noMargin>Ítems del comprobante</SectionTitle>
              <button className="tb-btn" onClick={addItem} style={{ height: 24, fontSize: 11 }}>{Icon.plus({ size: 11 })}Agregar ítem</button>
            </div>
            <div className="vstack" style={{ gap: 8 }}>
              {items.map((it, i) => (
                <div key={i} style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', gap: 8, marginBottom: 8 }}>
                    <input value={it.cod} onChange={e => setItem(i, 'cod', e.target.value)} placeholder="Cod" className="fin-input mono" style={{ fontSize: 11 }} />
                    <input value={it.desc} onChange={e => setItem(i, 'desc', e.target.value)} placeholder="Descripción del ítem (servicio, producto...)" className="fin-input" style={{ fontSize: 11 }} />
                    <input value={it.und} onChange={e => setItem(i, 'und', e.target.value)} placeholder="ZZ" className="fin-input mono" style={{ fontSize: 11 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 120px 1fr 120px 30px', gap: 8, alignItems: 'end' }}>
                    <div>
                      <FLabel>Cant.</FLabel>
                      <input type="number" min="0" step="0.01" value={it.cant} onChange={e => setItem(i, 'cant', e.target.value)} className="fin-input mono" style={{ fontSize: 11 }} />
                    </div>
                    <div>
                      <FLabel>P. Unit S/</FLabel>
                      <input type="number" min="0" step="0.01" value={it.pUnit} onChange={e => setItem(i, 'pUnit', e.target.value)} className="fin-input mono" style={{ fontSize: 11 }} />
                    </div>
                    <div>
                      <FLabel>Afectación IGV</FLabel>
                      <select value={it.afectIGV} onChange={e => setItem(i, 'afectIGV', e.target.value)} className="fin-input" style={{ fontSize: 11 }}>
                        <option value="10">10 · Gravado (18%)</option>
                        <option value="20">20 · Exonerado</option>
                        <option value="30">30 · Inafecto</option>
                        <option value="40">40 · Exportación</option>
                      </select>
                    </div>
                    <div>
                      <FLabel>Total línea</FLabel>
                      <div className="fin-input mono" style={{ background: 'var(--bg)', cursor: 'default', fontSize: 11, fontWeight: 600 }}>
                        {((parseFloat(it.cant) || 0) * (parseFloat(it.pUnit) || 0)).toFixed(2)}
                      </div>
                    </div>
                    <button onClick={() => delItem(i)} className="tb-icon-btn" style={{ height: 30, width: 30 }} title="Quitar ítem">{Icon.x({ size: 12 })}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div style={{ marginBottom: 16 }}>
            <SectionTitle>Opciones adicionales</SectionTitle>
            <div className="hstack" style={{ gap: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: detraccion ? 'var(--accent-soft)' : 'var(--bg-elev)' }}>
                <input type="checkbox" checked={detraccion} onChange={e => setDetraccion(e.target.checked)} />
                <span>Sujeto a detracción SPOT 4% · construcción</span>
              </label>
              <select value={moneda} onChange={e => setMoneda(e.target.value)} className="fin-input">
                <option value="PEN">S/ PEN</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elev)' }}>
          <div className="hstack" style={{ gap: 20 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subtotal</div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>S/ {subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>IGV 18%</div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>S/ {igv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
            </div>
            {detraccion && (
              <div>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detracción</div>
                <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>-S/ {detrMonto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <button className="tb-btn" onClick={onClose}>Cancelar</button>
            <button
              className="tb-btn primary"
              disabled={!isValid}
              onClick={handleEmit}
              style={{ opacity: isValid ? 1 : 0.45, cursor: isValid ? 'pointer' : 'not-allowed' }}
            >
              {Icon.check({ size: 13 })} Emitir y enviar a SUNAT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, noMargin }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: noMargin ? 0 : 8, paddingBottom: 4, borderBottom: '1px solid var(--line)' }}>
      {children}
    </div>
  );
}

function FLabel({ children }) {
  return <label style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, display: 'block', marginBottom: 3 }}>{children}</label>;
}

// ═══════════════════════════════════════════════════════════════
// SERIES CONFIG MODAL
// ═══════════════════════════════════════════════════════════════
function SeriesConfigModal({ series, onSave, onClose }) {
  const [editing, setEditing] = useState(series.map(s => ({ ...s })));

  const updateSerie = (i, field, val) => {
    setEditing(es => es.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const addSerie = () => {
    setEditing(es => [...es, { tipoDoc: '01', tipoNombre: 'Factura', serie: 'F002', correlativoActual: 0 }]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 680, maxWidth: '96vw', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Configuración de series</div>
            <div className="text-xs muted" style={{ marginTop: 2 }}>
              Series correlativas SUNAT por tipo de comprobante · se incrementan automáticamente al emitir
            </div>
          </div>
          <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
        </div>

        <div style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="vstack" style={{ gap: 8 }}>
            {editing.map((s, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 140px 30px', gap: 10, alignItems: 'end' }}>
                  <div>
                    <FLabel>Tipo SUNAT</FLabel>
                    <select value={s.tipoDoc} onChange={e => {
                      const map = { '01': 'Factura', '03': 'Boleta de Venta', 'R1': 'Recibo por Honorarios', '07': 'Nota de Crédito', '08': 'Nota de Débito', '09': 'Guía de Remisión' };
                      updateSerie(i, 'tipoDoc', e.target.value);
                      updateSerie(i, 'tipoNombre', map[e.target.value]);
                    }} className="fin-input">
                      <option value="01">01 · Factura</option>
                      <option value="03">03 · Boleta</option>
                      <option value="R1">R1 · RHE</option>
                      <option value="07">07 · N. crédito</option>
                      <option value="08">08 · N. débito</option>
                      <option value="09">09 · Guía remisión</option>
                    </select>
                  </div>
                  <div>
                    <FLabel>Nombre</FLabel>
                    <input value={s.tipoNombre} onChange={e => updateSerie(i, 'tipoNombre', e.target.value)} className="fin-input" />
                  </div>
                  <div>
                    <FLabel>Serie</FLabel>
                    <input value={s.serie} onChange={e => updateSerie(i, 'serie', e.target.value.toUpperCase())} className="fin-input mono" maxLength={4} />
                  </div>
                  <div>
                    <FLabel>Correlativo actual</FLabel>
                    <input type="number" min="0" value={s.correlativoActual} onChange={e => updateSerie(i, 'correlativoActual', parseInt(e.target.value) || 0)} className="fin-input mono" />
                  </div>
                  <button onClick={() => setEditing(es => es.filter((_, idx) => idx !== i))} className="tb-icon-btn" style={{ height: 30, width: 30 }}>{Icon.x({ size: 12 })}</button>
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                  Próximo: <b style={{ color: 'var(--accent)' }}>{s.serie}-{String(s.correlativoActual + 1).padStart(5, '0')}</b>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addSerie} className="tb-btn" style={{ marginTop: 12, width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
            {Icon.plus({ size: 13 })} Agregar serie
          </button>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elev)' }}>
          <span className="text-xs muted">
            {editing.length} {editing.length === 1 ? 'serie configurada' : 'series configuradas'}
          </span>
          <div className="hstack" style={{ gap: 8 }}>
            <button className="tb-btn" onClick={onClose}>Cancelar</button>
            <button className="tb-btn primary" onClick={() => onSave(editing)}>
              {Icon.check({ size: 13 })} Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SunatPage = SunatPage;
