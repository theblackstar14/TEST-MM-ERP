/* global React, Icon, ERP_DATA, CotizacionParser */
const { useState, useMemo, useRef, useEffect } = React;
const { fmtPEN, fmtInt, fmtPct } = ERP_DATA;

const STORAGE_KEY = 'mm.cotizaciones.v1';

// ═══════════════════════════════════════════════════════════════
// Persistencia localStorage
// ═══════════════════════════════════════════════════════════════
function loadCotizaciones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function saveCotizaciones(arr) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) { }
}

// ═══════════════════════════════════════════════════════════════
// Página principal · 3 vistas: lista / detalle / comparador
// ═══════════════════════════════════════════════════════════════
function ComparadorPage() {
  const [cotizaciones, setCotizaciones] = useState(() => loadCotizaciones());
  const [view, setView] = useState('list'); // list | detail | compare
  const [activeCotKey, setActiveCotKey] = useState(null);
  const [compareLeft, setCompareLeft] = useState(null);
  const [compareRight, setCompareRight] = useState(null);

  useEffect(() => { saveCotizaciones(cotizaciones); }, [cotizaciones]);

  const keyOf = (cot) => cot.codigo_interno || ((cot.cliente || '') + '|' + (cot.proyecto || ''));

  const activeCot = useMemo(
    () => cotizaciones.find(c => keyOf(c) === activeCotKey),
    [cotizaciones, activeCotKey]
  );

  const addParsed = (versionesNuevas, filename) => {
    const marcadas = versionesNuevas.map(v => ({ ...v, _filename: filename, _importadoEn: new Date().toISOString() }));
    const agrupadas = CotizacionParser.groupByCotizacion(marcadas);
    // Merge: si ya existe una cotización con mismo codigo_interno, agregar versiones nuevas
    setCotizaciones(prev => {
      const map = new Map(prev.map(c => [keyOf(c), c]));
      agrupadas.forEach(nueva => {
        const k = keyOf(nueva);
        if (map.has(k)) {
          const existente = map.get(k);
          // Deduplica versiones por sheet_name + filename
          const keys = new Set(existente.versiones.map(v => (v._filename || '') + '|' + v.sheet_name));
          const extras = nueva.versiones.filter(v => !keys.has((v._filename || '') + '|' + v.sheet_name));
          existente.versiones = [...existente.versiones, ...extras];
          existente.versiones.sort((a, b) => (a.version_label || '').localeCompare(b.version_label || ''));
          // Refresca meta agregada desde última versión
          const u = existente.versiones[existente.versiones.length - 1];
          existente.total = u.resumen.total || 0;
          existente.subtotal = u.resumen.subtotal || 0;
          existente.partidas_count = u.partidas_flat.length;
          existente.fecha = u.fecha;
          existente.validacion_ok = u.validacion_ok;
        } else {
          map.set(k, nueva);
        }
      });
      return Array.from(map.values());
    });
  };

  const removeCot = (key) => setCotizaciones(prev => prev.filter(c => keyOf(c) !== key));
  const clearAll = () => {
    if (confirm('¿Eliminar todas las cotizaciones? No se puede deshacer.')) setCotizaciones([]);
  };

  return (
    <div className="ws-inner wide" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {view === 'list' && (
        <CotListView
          cotizaciones={cotizaciones}
          onParsed={addParsed}
          onOpen={k => { setActiveCotKey(k); setView('detail'); }}
          onRemove={removeCot}
          onClearAll={clearAll}
        />
      )}
      {view === 'detail' && activeCot && (
        <CotDetailView
          cot={activeCot}
          onBack={() => { setView('list'); setActiveCotKey(null); }}
          onCompare={(a, b) => { setCompareLeft(a); setCompareRight(b); setView('compare'); }}
        />
      )}
      {view === 'compare' && compareLeft && compareRight && (
        <CotCompareView
          verA={compareLeft} verB={compareRight} cot={activeCot}
          onBack={() => { setView('detail'); setCompareLeft(null); setCompareRight(null); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VISTA 1 · Lista de cotizaciones agrupadas por cliente
// ═══════════════════════════════════════════════════════════════
function CotListView({ cotizaciones, onParsed, onOpen, onRemove, onClearAll }) {
  const [q, setQ] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [sortBy, setSortBy] = useState('fecha');

  const clientes = useMemo(() => Array.from(new Set(cotizaciones.map(c => c.cliente).filter(Boolean))).sort(), [cotizaciones]);

  const filtered = useMemo(() => {
    let res = cotizaciones;
    if (filtroCliente) res = res.filter(c => c.cliente === filtroCliente);
    if (q) {
      const qq = q.toLowerCase();
      res = res.filter(c =>
        (c.codigo_interno || '').toLowerCase().includes(qq) ||
        (c.cliente || '').toLowerCase().includes(qq) ||
        (c.proyecto || '').toLowerCase().includes(qq) ||
        (c.ubicacion || '').toLowerCase().includes(qq)
      );
    }
    res = [...res];
    if (sortBy === 'fecha') res.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    else if (sortBy === 'monto') res.sort((a, b) => (b.total || 0) - (a.total || 0));
    else if (sortBy === 'cot') res.sort((a, b) => (a.codigo_interno || '').localeCompare(b.codigo_interno || ''));
    return res;
  }, [cotizaciones, q, filtroCliente, sortBy]);

  const grouped = useMemo(() => {
    const m = new Map();
    filtered.forEach(c => {
      const k = c.cliente || '— Sin cliente —';
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(c);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const totalMonto = cotizaciones.reduce((s, c) => s + (c.total || 0), 0);
  const totalVersiones = cotizaciones.reduce((s, c) => s + c.versiones.length, 0);

  return (
    <>
      {/* Header */}
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 14 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Cotizaciones</h1>
            <div className="sub muted">
              {cotizaciones.length === 0
                ? 'Sin cotizaciones · sube un Excel multi-hoja para empezar'
                : cotizaciones.length + ' cotizaciones · ' + totalVersiones + ' versiones · ' + clientes.length + ' clientes'}
            </div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            {cotizaciones.length > 0 && (
              <button className="tb-btn" onClick={onClearAll} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                {Icon.x({ size: 12 })} Limpiar todas
              </button>
            )}
            <UploadBtn onParsed={onParsed} />
          </div>
        </div>

        {/* KPIs */}
        {cotizaciones.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div className="kpi">
              <div className="lbl">Cotizaciones</div>
              <div className="val">{cotizaciones.length}</div>
              <div className="sub">{totalVersiones} versiones totales</div>
            </div>
            <div className="kpi">
              <div className="lbl">Clientes</div>
              <div className="val">{clientes.length}</div>
              <div className="sub">únicos</div>
            </div>
            <div className="kpi">
              <div className="lbl">Monto acumulado</div>
              <div className="val" style={{ color: 'var(--accent)' }}>{fmtPEN(totalMonto)}</div>
              <div className="sub">suma totales con IGV</div>
            </div>
            <div className="kpi">
              <div className="lbl">Monto promedio</div>
              <div className="val">{fmtPEN(cotizaciones.length ? totalMonto / cotizaciones.length : 0)}</div>
              <div className="sub">por cotización</div>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 24px' }}>
        {cotizaciones.length === 0 && <EmptyState onParsed={onParsed} />}

        {cotizaciones.length > 0 && (
          <>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="tb-search-wrap" style={{ maxWidth: 320, flex: 1 }}>
                <span className="ico">{Icon.search({ size: 14 })}</span>
                <input placeholder="Buscar COT, cliente, proyecto, ubicación..." value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 200 }}>
                <option value="">Todos los clientes</option>
                {clientes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12 }}>
                <option value="fecha">Orden · más reciente</option>
                <option value="monto">Por monto (mayor)</option>
                <option value="cot">Por código COT</option>
              </select>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                {filtered.length} / {cotizaciones.length}
              </div>
            </div>

            {/* Grupos por cliente */}
            <div className="vstack" style={{ gap: 20 }}>
              {grouped.map(([cliente, cots]) => {
                const sumGrupo = cots.reduce((s, c) => s + (c.total || 0), 0);
                return (
                  <div key={cliente}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: 'var(--bg-sunken)', borderRadius: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{cliente}</span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                        {cots.length} cotiz · {cots.reduce((s, c) => s + c.versiones.length, 0)} versiones
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 'auto', fontWeight: 600 }}>
                        {fmtPEN(sumGrupo)}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
                      {cots.map(c => (
                        <CotCard key={c.codigo_interno || c.proyecto} cot={c} onOpen={onOpen} onRemove={onRemove} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)' }}>
                Sin cotizaciones que coincidan con los filtros.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function CotCard({ cot, onOpen, onRemove }) {
  const hasVariantes = cot.versiones.length > 1;
  const key = cot.codigo_interno || ((cot.cliente || '') + '|' + (cot.proyecto || ''));

  return (
    <div className="card" style={{ padding: 14, cursor: 'pointer', position: 'relative', transition: 'border-color .15s, box-shadow .15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
      onClick={() => onOpen(key)}>

      <button
        onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar cotización ' + (cot.codigo_interno || 'sin código') + '?')) onRemove(key); }}
        title="Eliminar"
        style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 4, borderRadius: 4 }}
      >{Icon.x({ size: 12 })}</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', padding: '2px 8px', background: 'var(--accent-soft)', borderRadius: 4 }}>
          {cot.codigo_interno || '— Sin código —'}
        </span>
        {hasVariantes && (
          <span className="chip amber" style={{ fontSize: 9 }} title="Tiene múltiples versiones">
            {cot.versiones.length} versiones
          </span>
        )}
        {!cot.validacion_ok && (
          <span className="chip red" style={{ fontSize: 9 }} title="Alguna sección no cuadra">⚠</span>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, paddingRight: 20 }}>
        {cot.proyecto || '— Sin proyecto —'}
      </div>
      {cot.ubicacion && (
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>
          📍 {cot.ubicacion}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, marginTop: 8, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
          {cot.fecha || '—'} · {cot.partidas_count} partidas
        </div>
        <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
          {fmtPEN(cot.total || 0)}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onParsed }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 14, opacity: 0.4 }}>📊</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sin cotizaciones cargadas aún</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20, maxWidth: 500, margin: '0 auto 20px' }}>
        Sube un Excel multi-hoja. Cada hoja se detecta como una versión.
        Cotizaciones con mismo <span className="mono">COT-XXX</span> se agrupan como versiones del mismo trabajo.
      </div>
      <UploadBtn onParsed={onParsed} primary />
    </div>
  );
}

function UploadBtn({ onParsed, primary }) {
  const ref = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (file) => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const buf = await file.arrayBuffer();
      const res = await CotizacionParser.parseCotizacionWorkbook(buf);
      onParsed(res.versiones, file.name);
    } catch (e) {
      setError(e.message || String(e));
      setTimeout(() => setError(''), 4000);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        className={primary ? 'tb-btn primary' : 'tb-btn'}
        onClick={() => ref.current?.click()}
        disabled={loading}
        style={{ fontSize: 12 }}
      >
        {loading ? <>⏳ Parseando...</> : <>{Icon.upload({ size: 12 })} Importar Excel</>}
      </button>
      <input ref={ref} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
        onChange={e => handle(e.target.files[0])} />
      {error && (
        <div style={{ position: 'fixed', top: 80, right: 20, padding: '10px 14px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 6, border: '1px solid var(--danger)', fontSize: 12, zIndex: 9999 }}>
          ⚠ {error}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// VISTA 2 · Detalle cotización · tabs Resumen / Partidas / Versiones
// ═══════════════════════════════════════════════════════════════
function CotDetailView({ cot, onBack, onCompare }) {
  const [tab, setTab] = useState('resumen');
  const [versionActiva, setVersionActiva] = useState(cot.versiones[cot.versiones.length - 1].sheet_name);

  const ver = cot.versiones.find(v => v.sheet_name === versionActiva) || cot.versiones[0];

  return (
    <>
      {/* Header */}
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button className="tb-btn" onClick={onBack} style={{ fontSize: 11 }}>
            {Icon.left({ size: 12 })} Volver
          </button>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Cotizaciones / {cot.codigo_interno || 'Sin código'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', padding: '3px 10px', background: 'var(--accent-soft)', borderRadius: 4 }}>
                {cot.codigo_interno || '—'}
              </span>
              {cot.versiones.length > 1 && (
                <span className="chip amber" style={{ fontSize: 10 }}>{cot.versiones.length} versiones</span>
              )}
            </div>
            <h1 style={{ margin: '2px 0 6px', fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
              {cot.proyecto || 'Sin proyecto'}
            </h1>
            <div className="hstack" style={{ gap: 16, fontSize: 12, color: 'var(--ink-2)', flexWrap: 'wrap' }}>
              <span><b>Cliente:</b> {cot.cliente || '—'}</span>
              {cot.ubicacion && <span><b>📍</b> {cot.ubicacion}</span>}
              {ver.fecha && <span><b>Fecha:</b> {ver.fecha}</span>}
              {ver.plazo && <span><b>Plazo:</b> {ver.plazo}</span>}
            </div>
          </div>
          <div className="vstack" style={{ gap: 3, alignItems: 'flex-end' }}>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{fmtPEN(ver.resumen.total || 0)}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Total con IGV ({ver.version_label})</div>
          </div>
        </div>

        {/* Selector versión (si hay múltiples) */}
        {cot.versiones.length > 1 && (
          <div className="hstack" style={{ gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="mono text-xs muted" style={{ textTransform: 'uppercase' }}>Ver:</span>
            {cot.versiones.map(v => (
              <button key={v.sheet_name}
                onClick={() => setVersionActiva(v.sheet_name)}
                className={'tb-btn ' + (versionActiva === v.sheet_name ? 'primary' : '')}
                style={{ fontSize: 11 }}>
                {v.version_label} · {fmtPEN(v.resumen.total || 0)}
              </button>
            ))}
            <button
              onClick={() => onCompare(cot.versiones[0], cot.versiones[cot.versiones.length - 1])}
              className="tb-btn"
              style={{ marginLeft: 'auto', fontSize: 11, borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              {Icon.compare({ size: 12 })} Comparar versiones →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="hstack" style={{ gap: 2, borderBottom: '1px solid var(--line)' }}>
          {[
            { id: 'resumen', lbl: 'Resumen', icon: 'dash' },
            { id: 'partidas', lbl: 'Partidas (' + ver.partidas_flat.length + ')', icon: 'budget' },
            cot.versiones.length > 1 && { id: 'versiones', lbl: 'Versiones (' + cot.versiones.length + ')', icon: 'history' },
          ].filter(Boolean).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '9px 14px', fontSize: 12, fontWeight: 500,
                background: 'transparent', border: 'none',
                borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'),
                color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {Icon[t.icon]({ size: 13 })} {t.lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 24px' }}>
        {tab === 'resumen' && <CotResumen ver={ver} />}
        {tab === 'partidas' && <CotPartidas ver={ver} />}
        {tab === 'versiones' && <CotVersiones cot={cot} onCompare={onCompare} />}
      </div>
    </>
  );
}

function CotResumen({ ver }) {
  const r = ver.resumen;
  const Row = ({ lbl, val, pct, bold, highlight, danger }) => (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto auto',
      gap: 12, padding: '10px 14px',
      borderBottom: '1px solid var(--line)',
      background: highlight ? 'var(--accent-soft)' : 'transparent',
      fontWeight: bold ? 700 : 400,
    }}>
      <span style={{ fontSize: bold ? 13 : 12, color: danger ? 'var(--danger)' : 'var(--ink)' }}>{lbl}</span>
      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 60, textAlign: 'right' }}>
        {pct != null ? (pct * 100).toFixed(1) + '%' : ''}
      </span>
      <span className="mono" style={{ fontSize: bold ? 14 : 12, fontWeight: bold ? 700 : 500, textAlign: 'right', minWidth: 130 }}>
        {val != null ? fmtPEN(val) : '—'}
      </span>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div className="card">
        <div className="card-h"><h3>Resumen económico</h3></div>
        <div className="card-b" style={{ padding: 0 }}>
          <Row lbl="Costo Directo" val={r.costo_directo} bold />
          <Row lbl="Gastos Generales" val={r.gastos_generales} pct={r.gastos_generales_pct} />
          <Row lbl="Utilidad" val={r.utilidad} pct={r.utilidad_pct} />
          <Row lbl="Sub Total" val={r.subtotal} bold highlight />
          <Row lbl="IGV" val={r.igv} pct={r.igv_pct} />
          <Row lbl="TOTAL" val={r.total} bold highlight />
        </div>
      </div>
      <div className="vstack" style={{ gap: 14 }}>
        <div className="card">
          <div className="card-h"><h3>Validación</h3></div>
          <div className="card-b">
            <div style={{ fontSize: 12, color: ver.validacion_ok ? 'var(--ok)' : 'var(--warn-ink)', fontWeight: 600, marginBottom: 6 }}>
              {ver.validacion_ok ? '✓ Todas las sumas cuadran' : '⚠ Alguna sección no cuadra con la suma de sus partidas'}
            </div>
            {ver.warnings && ver.warnings.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Advertencias:</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {ver.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3>Meta</h3></div>
          <div className="card-b" style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.8 }}>
            <div><b>Hoja origen:</b> <span className="mono">{ver.sheet_name}</span></div>
            <div><b>Versión:</b> <span className="mono">{ver.version_label}</span></div>
            <div><b>Código interno:</b> <span className="mono">{ver.codigo_interno || '—'}</span></div>
            <div><b>Nodos árbol:</b> <span className="mono">{ver.nodos_tree || '—'}</span></div>
            <div><b>Partidas:</b> <span className="mono">{ver.partidas_flat.length}</span></div>
            {ver._filename && <div><b>Archivo:</b> <span className="mono text-xs">{ver._filename}</span></div>}
            {ver._importadoEn && <div><b>Importado:</b> <span className="mono text-xs">{new Date(ver._importadoEn).toLocaleString('es-PE')}</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CotPartidas({ ver }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    if (!q) return ver.partidas_flat;
    const qq = q.toLowerCase();
    return ver.partidas_flat.filter(p =>
      p.codigo.toLowerCase().includes(qq) ||
      (p.descripcion || '').toLowerCase().includes(qq)
    );
  }, [ver, q]);

  return (
    <>
      <div className="hstack" style={{ gap: 8, marginBottom: 10 }}>
        <div className="tb-search-wrap" style={{ maxWidth: 320 }}>
          <span className="ico">{Icon.search({ size: 14 })}</span>
          <input placeholder="Buscar partida..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
          {rows.length} / {ver.partidas_flat.length} partidas
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-sunken)', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 90 }}>Código</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Descripción</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 60 }}>Und</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 80 }}>Metrado</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 90 }}>Precio</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 100 }}>Parcial</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 100 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const isGroup = p.nivel === 1;
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--line)', background: isGroup ? 'var(--bg-sunken)' : 'transparent' }}>
                  <td style={{ padding: '6px 10px 6px ' + (10 + (p.nivel - 1) * 12) + 'px' }}>
                    <span className="mono text-xs" style={{ color: isGroup ? 'var(--ink)' : 'var(--ink-3)', fontWeight: isGroup ? 600 : 500 }}>{p.codigo}</span>
                  </td>
                  <td style={{ padding: '6px 10px', fontSize: isGroup ? 12 : 11, fontWeight: isGroup ? 600 : 400 }}>{p.descripcion}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: 10, color: 'var(--ink-3)' }}>{p.unidad || ''}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>
                    {p.metrado != null ? p.metrado.toLocaleString('es-PE') : ''}
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>
                    {p.precio_unitario != null ? p.precio_unitario.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : ''}
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>
                    {p.parcial != null && p.parcial !== 0 ? p.parcial.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : ''}
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: isGroup ? 700 : 400 }}>
                    {p.total != null ? p.total.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CotVersiones({ cot, onCompare }) {
  const [left, setLeft] = useState(cot.versiones[0].sheet_name);
  const [right, setRight] = useState(cot.versiones[cot.versiones.length - 1].sheet_name);
  const vL = cot.versiones.find(v => v.sheet_name === left);
  const vR = cot.versiones.find(v => v.sheet_name === right);
  const deltaTotal = (vR.resumen.total || 0) - (vL.resumen.total || 0);
  const deltaPct = (vL.resumen.total || 0) ? (deltaTotal / (vL.resumen.total || 1)) * 100 : 0;

  return (
    <div>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
          Selecciona 2 versiones para comparar partida por partida:
        </div>
        <div className="hstack" style={{ gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="vstack" style={{ gap: 3 }}>
            <label style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Versión A (base)</label>
            <select value={left} onChange={e => setLeft(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 240 }}>
              {cot.versiones.map(v => <option key={v.sheet_name} value={v.sheet_name}>{v.version_label} · {fmtPEN(v.resumen.total || 0)}</option>)}
            </select>
          </div>
          <div style={{ paddingBottom: 6 }}>{Icon.arrowR({ size: 16 })}</div>
          <div className="vstack" style={{ gap: 3 }}>
            <label style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Versión B (comparar)</label>
            <select value={right} onChange={e => setRight(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 240 }}>
              {cot.versiones.map(v => <option key={v.sheet_name} value={v.sheet_name}>{v.version_label} · {fmtPEN(v.resumen.total || 0)}</option>)}
            </select>
          </div>
          <button className="tb-btn primary" onClick={() => onCompare(vL, vR)} style={{ marginLeft: 'auto' }}>
            {Icon.compare({ size: 12 })} Comparar →
          </button>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-sunken)', borderRadius: 6, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Δ Total</div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: deltaTotal > 0 ? 'var(--danger)' : deltaTotal < 0 ? 'var(--ok)' : 'var(--ink)' }}>
              {deltaTotal >= 0 ? '+' : ''}{fmtPEN(deltaTotal)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Δ Porcentual</div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: deltaPct > 0 ? 'var(--danger)' : deltaPct < 0 ? 'var(--ok)' : 'var(--ink)' }}>
              {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Partidas A / B</div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 600 }}>
              {vL.partidas_flat.length} → {vR.partidas_flat.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de versiones */}
      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Versión</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Hoja origen</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Partidas</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Costo Directo</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Subtotal</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Total</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Valid.</th>
            </tr>
          </thead>
          <tbody>
            {cot.versiones.map(v => (
              <tr key={v.sheet_name} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>{v.version_label}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{v.sheet_name}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>{v.partidas_flat.length}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>{fmtPEN(v.resumen.costo_directo || 0)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>{fmtPEN(v.resumen.subtotal || 0)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>{fmtPEN(v.resumen.total || 0)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  {v.validacion_ok
                    ? <span style={{ color: 'var(--ok)', fontSize: 13 }}>✓</span>
                    : <span style={{ color: 'var(--warn-ink)', fontSize: 13 }}>⚠</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VISTA 3 · Comparador de versiones (diff partida por partida)
// ═══════════════════════════════════════════════════════════════
function CotCompareView({ verA, verB, cot, onBack }) {
  const [filter, setFilter] = useState('cambios');
  const diff = useMemo(() => CotizacionParser.diffCotizaciones(verA, verB), [verA, verB]);

  const filteredRows = useMemo(() => {
    if (filter === 'todas') return diff.rows;
    if (filter === 'modificadas') return diff.rows.filter(r => r.status === 'modificada');
    if (filter === 'nuevas') return diff.rows.filter(r => r.status === 'agregada');
    if (filter === 'eliminadas') return diff.rows.filter(r => r.status === 'eliminada');
    if (filter === 'cambios') return diff.rows.filter(r => r.status !== 'sin_cambio');
    return diff.rows;
  }, [diff, filter]);

  const maxAbsDelta = Math.max(1, ...diff.rows.map(r => Math.abs(r.delta || 0)));
  const statusColor = (s) => s === 'agregada' ? 'var(--accent)' : s === 'eliminada' ? 'var(--danger)' : s === 'modificada' ? 'var(--warn)' : 'transparent';
  const statusBg = (s) => s === 'agregada' ? 'rgba(59,91,219,0.06)' : s === 'eliminada' ? 'rgba(210,72,63,0.08)' : s === 'modificada' ? 'rgba(180,83,9,0.05)' : 'transparent';
  const statusLabel = (s) => s === 'agregada' ? '+ NUEVA' : s === 'eliminada' ? '− ELIM' : s === 'modificada' ? '⚠ MOD' : '';

  return (
    <>
      <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button className="tb-btn" onClick={onBack} style={{ fontSize: 11 }}>
            {Icon.left({ size: 12 })} Volver al detalle
          </button>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {cot?.codigo_interno} / Comparar versiones
          </div>
        </div>
        <h1 style={{ margin: '2px 0 8px', fontSize: 19, fontWeight: 600 }}>
          {verA.version_label} ⇄ {verB.version_label}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
          <div className="kpi">
            <div className="lbl">Versión A · {verA.version_label}</div>
            <div className="val" style={{ fontSize: 18 }}>{fmtPEN(verA.resumen.total || 0)}</div>
            <div className="sub">{verA.partidas_flat.length} partidas</div>
          </div>
          <div className="kpi">
            <div className="lbl">Versión B · {verB.version_label}</div>
            <div className="val" style={{ fontSize: 18 }}>{fmtPEN(verB.resumen.total || 0)}</div>
            <div className="sub">{verB.partidas_flat.length} partidas</div>
          </div>
          <div className="kpi">
            <div className="lbl">Δ Total</div>
            <div className="val" style={{ color: diff.totals.deltaTotal > 0 ? 'var(--danger)' : diff.totals.deltaTotal < 0 ? 'var(--ok)' : 'var(--ink)' }}>
              {diff.totals.deltaTotal >= 0 ? '+' : ''}{fmtPEN(diff.totals.deltaTotal)}
            </div>
            <div className="sub">{diff.totals.deltaPct >= 0 ? '+' : ''}{diff.totals.deltaPct.toFixed(1)}% vs A</div>
          </div>
          <div className="kpi">
            <div className="lbl">Cambios</div>
            <div className="val">{diff.counts.total - diff.counts.sin_cambio}</div>
            <div className="sub" style={{ flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--warn-ink)' }}>⚠ {diff.counts.modificada}</span>
              <span style={{ color: 'var(--accent)' }}>+ {diff.counts.agregada}</span>
              <span style={{ color: 'var(--danger)' }}>− {diff.counts.eliminada}</span>
            </div>
          </div>
        </div>

        <div className="hstack" style={{ gap: 4 }}>
          {[
            { id: 'todas', lbl: 'Todas (' + diff.counts.total + ')' },
            { id: 'cambios', lbl: 'Solo cambios (' + (diff.counts.total - diff.counts.sin_cambio) + ')' },
            { id: 'modificadas', lbl: 'Modificadas (' + diff.counts.modificada + ')' },
            { id: 'nuevas', lbl: 'Nuevas (' + diff.counts.agregada + ')' },
            { id: 'eliminadas', lbl: 'Eliminadas (' + diff.counts.eliminada + ')' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={'tb-btn ' + (filter === f.id ? 'primary' : '')}
              style={{ fontSize: 11 }}>{f.lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 24px' }}>
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-sunken)', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 90 }}>Código</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Descripción</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>A (total)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>B (total)</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 260 }}>Δ</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', width: 80 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--ink-4)' }}>Sin partidas en este filtro</td></tr>
              )}
              {filteredRows.map((p, i) => {
                const isGroup = p.nivel === 1;
                const barW = Math.abs(p.delta) / maxAbsDelta * 100;
                return (
                  <tr key={i} style={{
                    background: statusBg(p.status),
                    borderBottom: '1px solid var(--line)',
                    borderLeft: '3px solid ' + statusColor(p.status),
                  }}>
                    <td style={{ padding: '7px 10px 7px ' + (10 + (p.nivel - 1) * 12) + 'px' }}>
                      <span className="mono text-xs" style={{ color: isGroup ? 'var(--ink)' : 'var(--ink-3)', fontWeight: isGroup ? 600 : 500 }}>{p.codigo}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontWeight: isGroup ? 600 : 400, fontSize: isGroup ? 12 : 11.5 }}>{p.descripcion}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 }}>
                      {p.a ? (p.a.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '—'}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500 }}>
                      {p.b ? (p.b.total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '—'}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      {p.status !== 'sin_cambio' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 14, position: 'relative', background: 'var(--bg-sunken)', borderRadius: 2 }}>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'var(--line-strong)' }} />
                            <div style={{
                              position: 'absolute', top: 1, bottom: 1,
                              ...(p.delta >= 0 ? { left: '50%', width: (barW / 2) + '%' } : { right: '50%', width: (barW / 2) + '%' }),
                              background: p.delta > 0 ? 'var(--danger)' : p.delta < 0 ? 'var(--ok)' : 'var(--line)',
                              borderRadius: 2, opacity: 0.85,
                            }} />
                          </div>
                          <span className="mono" style={{ fontSize: 10, fontWeight: 600, width: 80, textAlign: 'right', color: p.delta > 0 ? 'var(--danger)' : p.delta < 0 ? 'var(--ok)' : 'var(--ink-3)' }}>
                            {p.delta >= 0 ? '+' : ''}{(p.delta || 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                      {statusLabel(p.status) && (
                        <span className="mono" style={{
                          fontSize: 9, fontWeight: 700,
                          padding: '2px 6px', borderRadius: 3,
                          background: statusColor(p.status), color: '#fff',
                        }}>{statusLabel(p.status)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

window.ComparadorPage = ComparadorPage;
