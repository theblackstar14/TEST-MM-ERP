/* global React, Icon, ERP_DATA, QRCode, L, jsQR */
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const {
  inventarioItems, inventarioUbicaciones, inventarioPersonal,
  inventarioMovimientos, inventarioMantenimientos, DEPRECIACION_CATEGORIA,
  EMISOR, fmtPEN, fmtCompact,
} = ERP_DATA;

const TODAY = new Date();
const BASE_URL_QR = 'https://erp.mmhighmetrik.com/i/';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function calcularDepreciacion(item, asOfDate = TODAY) {
  const adq = new Date(item.fechaAdq);
  const monthsElapsed = Math.max(0,
    (asOfDate.getFullYear() - adq.getFullYear()) * 12 + (asOfDate.getMonth() - adq.getMonth()));
  const monthlyDep = item.valorAdq / (item.vida * 12);
  const depAcumulada = Math.min(monthlyDep * monthsElapsed, item.valorAdq);
  const valorNeto = Math.max(0, item.valorAdq - depAcumulada);
  const pctDepreciado = item.valorAdq > 0 ? (depAcumulada / item.valorAdq) * 100 : 0;
  return { monthsElapsed, monthlyDep, depAcumulada, valorNeto, pctDepreciado };
}

function findUbicacion(id) { return inventarioUbicaciones.find(u => u.id === id); }
function findPersonal(id) { return inventarioPersonal.find(p => p.id === id); }
function findItem(id) { return inventarioItems.find(i => i.id === id); }

function estadoChipCls(estado) {
  return {
    'Operativo':         'green',
    'En mantenimiento':  'amber',
    'Dado de baja':      '',
    'Perdido':           'red',
    'En servicio externo': 'amber',
  }[estado] || '';
}

function categoriaColor(cat) {
  return {
    'Herramienta manual':    '#F59F00',
    'Herramienta eléctrica': '#3B5BDB',
    'Andamios y encofrado':  '#7C3AED',
    'Medición':              '#0EA5B7',
    'EPP':                   '#D97757',
    'Equipo eléctrico':      '#2F7D5C',
    'Mobiliario':            '#6B84E8',
    'Cómputo':               '#D1453B',
  }[cat] || '#9A9A96';
}

// ═══════════════════════════════════════════════════════════════
// INVENTARIO PAGE
// ═══════════════════════════════════════════════════════════════
function InventarioPage() {
  const [tab, setTab] = useState('catalogo');
  const [items, setItems] = useState(inventarioItems);
  const [movimientos, setMovimientos] = useState(inventarioMovimientos);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [showTransferencia, setShowTransferencia] = useState(null); // item o null
  const [showScanner, setShowScanner] = useState(false);
  const [showEtiquetas, setShowEtiquetas] = useState(false);

  // KPIs globales
  const kpis = useMemo(() => {
    const valorAdq = items.reduce((s, i) => s + i.valorAdq, 0);
    const valorNeto = items.reduce((s, i) => s + calcularDepreciacion(i).valorNeto, 0);
    const porUbicacion = {};
    items.forEach(i => {
      porUbicacion[i.ubicacionId] = (porUbicacion[i.ubicacionId] || 0) + 1;
    });
    const enObra = items.filter(i => findUbicacion(i.ubicacionId)?.tipo === 'Obra').length;
    const enMantenimiento = items.filter(i => i.estado === 'En mantenimiento' || i.estado === 'En servicio externo').length;
    const perdidos = items.filter(i => i.estado === 'Perdido').length;
    const mantProximos = inventarioMantenimientos.filter(m => {
      if (m.estado === 'Completado') return false;
      const diff = (new Date(m.fechaProgramada) - TODAY) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    return { valorAdq, valorNeto, total: items.length, enObra, enMantenimiento, perdidos, mantProximos };
  }, [items]);

  const handleScanComplete = (codigo) => {
    setShowScanner(false);
    const item = items.find(i => i.codigo === codigo);
    if (item) {
      setSelectedItem(item);
    } else {
      alert(`Código no encontrado: ${codigo}`);
    }
  };

  const handleTransferir = (itemId, destinoId, responsableId, motivo, fotoGR) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const newMov = {
      id: 'MOV-INV-' + String(movimientos.length + 1).padStart(3, '0'),
      fecha: new Date().toISOString().slice(0, 10),
      itemId,
      ubOrigen: item.ubicacionId,
      ubDestino: destinoId,
      respEntrega: item.responsableId,
      respRecibe: responsableId,
      motivo,
      fotoGR,
    };
    setMovimientos([newMov, ...movimientos]);
    setItems(items.map(i => i.id === itemId ? { ...i, ubicacionId: destinoId, responsableId } : i));
    setShowTransferencia(null);
  };

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>
      <div className="page-h">
        <div>
          <h1>Inventario de herramientas y equipos</h1>
          <div className="sub muted">Trazabilidad por obra · escaneo QR · cálculo depreciación SUNAT</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <button className="tb-btn" onClick={() => setShowScanner(true)}>{Icon.qr({ size: 13 })} Escanear QR</button>
          <button className="tb-btn" onClick={() => setShowEtiquetas(true)}>{Icon.download({ size: 13 })} Imprimir etiquetas</button>
          <button className="tb-btn primary" onClick={() => setShowNewItem(true)}>{Icon.plus({ size: 13 })} Nuevo ítem</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 14 }}>
        <InvKPI lbl="Items totales"       val={kpis.total}                     color="var(--accent)" />
        <InvKPI lbl="Valor adquisición"   val={fmtCompact(kpis.valorAdq)}      color="var(--ok)" />
        <InvKPI lbl="Valor neto depr."    val={fmtCompact(kpis.valorNeto)}     color="var(--warn-ink)" sub={`-${Math.round((1 - kpis.valorNeto/kpis.valorAdq)*100)}% depreciación`} />
        <InvKPI lbl="En obra"             val={kpis.enObra + '/' + kpis.total} color="#7C3AED" />
        <InvKPI lbl="En mantenimiento"    val={kpis.enMantenimiento}           color="var(--warn)" />
        <InvKPI lbl="Mant. próximos 7d"   val={kpis.mantProximos}              color="var(--danger)" />
      </div>

      <div className="hstack" style={{ gap: 2, marginBottom: 14 }}>
        {[
          { id: 'catalogo',     label: 'Catálogo',       icon: 'box' },
          { id: 'movimientos',  label: 'Movimientos',    icon: 'swap' },
          { id: 'mantenimiento', label: 'Mantenimiento', icon: 'wrench' },
          { id: 'trazabilidad', label: 'Trazabilidad',   icon: 'map' },
          { id: 'reportes',     label: 'Reportes',       icon: 'trend' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 500,
              background: 'transparent', border: 'none',
              borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'),
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >{Icon[t.icon]({ size: 13 })} {t.label}</button>
        ))}
      </div>

      {tab === 'catalogo'      && <InvCatalogoView items={items} onSelect={setSelectedItem} onTransferir={setShowTransferencia} />}
      {tab === 'movimientos'   && <InvMovimientosView movimientos={movimientos} />}
      {tab === 'mantenimiento' && <InvMantenimientoView mantenimientos={inventarioMantenimientos} />}
      {tab === 'trazabilidad'  && <InvTrazabilidadView items={items} />}
      {tab === 'reportes'      && <InvReportesView items={items} />}

      {selectedItem && (
        <InvItemDetailDrawer
          item={selectedItem}
          movimientos={movimientos.filter(m => m.itemId === selectedItem.id)}
          mantenimientos={inventarioMantenimientos.filter(m => m.itemId === selectedItem.id)}
          onClose={() => setSelectedItem(null)}
          onTransferir={() => { setShowTransferencia(selectedItem); setSelectedItem(null); }}
        />
      )}

      {showNewItem && <InvNuevoItemModal onClose={() => setShowNewItem(false)} onSave={(item) => { setItems([item, ...items]); setShowNewItem(false); }} nextId={items.length + 1} />}
      {showTransferencia && <InvTransferenciaModal item={showTransferencia} onClose={() => setShowTransferencia(null)} onConfirm={handleTransferir} />}
      {showScanner && <InvScannerModal onClose={() => setShowScanner(false)} onScan={handleScanComplete} items={items} />}
      {showEtiquetas && <InvEtiquetasQRModal items={items} onClose={() => setShowEtiquetas(false)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KPI card
// ═══════════════════════════════════════════════════════════════
function InvKPI({ lbl, val, color, sub }) {
  return (
    <div style={{ padding: '10px 14px', background: 'var(--bg-elev)', borderRadius: 6, border: '1px solid var(--line)', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 3 }}>{lbl}</div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CATALOGO
// ═══════════════════════════════════════════════════════════════
function InvCatalogoView({ items, onSelect, onTransferir }) {
  const [q, setQ] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterEst, setFilterEst] = useState('all');
  const [filterUb, setFilterUb] = useState('all');

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (filterCat !== 'all' && it.categoria !== filterCat) return false;
      if (filterEst !== 'all' && it.estado !== filterEst) return false;
      if (filterUb !== 'all' && it.ubicacionId !== filterUb) return false;
      if (q.trim()) {
        const ql = q.toLowerCase();
        return it.nombre.toLowerCase().includes(ql) || it.codigo.toLowerCase().includes(ql) || (it.marca || '').toLowerCase().includes(ql);
      }
      return true;
    });
  }, [items, q, filterCat, filterEst, filterUb]);

  const categorias = Object.keys(DEPRECIACION_CATEGORIA);
  // Counts por categoría para mostrar en los chips (respeta otros filtros pero ignora filterCat)
  const catCounts = useMemo(() => {
    const m = { all: 0 };
    categorias.forEach(c => { m[c] = 0; });
    items.forEach(it => {
      if (filterEst !== 'all' && it.estado !== filterEst) return;
      if (filterUb !== 'all' && it.ubicacionId !== filterUb) return;
      if (q.trim()) {
        const ql = q.toLowerCase();
        const match = it.nombre.toLowerCase().includes(ql) || it.codigo.toLowerCase().includes(ql) || (it.marca || '').toLowerCase().includes(ql);
        if (!match) return;
      }
      m.all += 1;
      if (m[it.categoria] !== undefined) m[it.categoria] += 1;
    });
    return m;
  }, [items, q, filterEst, filterUb]);

  return (
    <div>
      <div className="card" style={{ padding: '10px 14px', marginBottom: 12 }}>
        <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <div className="tb-search-wrap" style={{ flex: 1, minWidth: 220, maxWidth: 'none' }}>
            <span className="ico">{Icon.search({ size: 13 })}</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, código, marca..." />
          </div>
          <select value={filterEst} onChange={e => setFilterEst(e.target.value)} className="fin-input" style={{ height: 30, fontSize: 11 }}>
            <option value="all">Todos estados</option>
            <option>Operativo</option>
            <option>En mantenimiento</option>
            <option>En servicio externo</option>
            <option>Dado de baja</option>
            <option>Perdido</option>
          </select>
          <select value={filterUb} onChange={e => setFilterUb(e.target.value)} className="fin-input" style={{ height: 30, fontSize: 11 }}>
            <option value="all">Todas ubicaciones</option>
            {inventarioUbicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>

        {/* Chips por categoría */}
        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterCat('all')}
            style={{
              padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600,
              border: '1px solid ' + (filterCat === 'all' ? 'var(--ink)' : 'var(--line)'),
              background: filterCat === 'all' ? 'var(--ink)' : 'var(--bg-elev)',
              color: filterCat === 'all' ? '#fff' : 'var(--ink-2)',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all .12s',
            }}
          >
            Todas <span style={{ opacity: 0.7, fontFamily: 'var(--mono)', fontSize: 10 }}>{catCounts.all}</span>
          </button>
          {categorias.map(c => {
            const active = filterCat === c;
            const color = categoriaColor(c);
            const count = catCounts[c] || 0;
            return (
              <button
                key={c}
                onClick={() => setFilterCat(active ? 'all' : c)}
                disabled={count === 0 && !active}
                style={{
                  padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                  border: '1px solid ' + (active ? color : 'var(--line)'),
                  background: active ? color : 'var(--bg-elev)',
                  color: active ? '#fff' : (count === 0 ? 'var(--ink-4)' : 'var(--ink-2)'),
                  cursor: count === 0 && !active ? 'not-allowed' : 'pointer',
                  opacity: count === 0 && !active ? 0.45 : 1,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'all .12s',
                }}
              >
                {c} <span style={{ opacity: 0.75, fontFamily: 'var(--mono)', fontSize: 10 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map(it => <InvItemCard key={it.id} item={it} onSelect={onSelect} onTransferir={onTransferir} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>
          Sin resultados con estos filtros
        </div>
      )}
    </div>
  );
}

function InvItemCard({ item, onSelect, onTransferir }) {
  const ub = findUbicacion(item.ubicacionId);
  const resp = findPersonal(item.responsableId);
  const dep = calcularDepreciacion(item);
  const catColor = categoriaColor(item.categoria);

  return (
    <div
      className="card"
      onClick={() => onSelect(item)}
      style={{
        cursor: 'pointer', padding: 12,
        borderLeft: `4px solid ${catColor}`,
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div className="hstack between" style={{ marginBottom: 6 }}>
        <span className="mono text-xs" style={{ color: 'var(--ink-3)', fontWeight: 700 }}>{item.codigo}</span>
        <span className={'chip ' + estadoChipCls(item.estado)} style={{ fontSize: 9 }}>{item.estado}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, minHeight: 32 }}>{item.nombre}</div>
      <div className="hstack" style={{ gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: catColor + '22', color: catColor, fontWeight: 600 }}>{item.categoria}</span>
        {item.marca && <span className="text-xs muted" style={{ fontSize: 10 }}>{item.marca}</span>}
      </div>

      <div style={{ padding: '6px 0', borderTop: '1px dashed var(--line)', marginBottom: 6 }}>
        <div className="hstack" style={{ gap: 6, fontSize: 11, marginBottom: 3 }}>
          <span style={{ color: 'var(--ink-4)' }}>{Icon.map({ size: 10 })}</span>
          <span style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ub ? ub.nombre : '—'}
          </span>
        </div>
        <div className="hstack" style={{ gap: 6, fontSize: 11 }}>
          <span style={{ color: 'var(--ink-4)' }}>{Icon.team({ size: 10 })}</span>
          <span style={{ color: 'var(--ink-2)' }}>{resp ? resp.nombre : '—'}</span>
        </div>
      </div>

      <div className="hstack between" style={{ paddingTop: 8, borderTop: '1px dashed var(--line)', fontSize: 10 }}>
        <div>
          <div style={{ color: 'var(--ink-4)', fontSize: 9, textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Valor adq.</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtCompact(item.valorAdq)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--ink-4)', fontSize: 9, textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Valor neto</div>
          <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: dep.valorNeto > 0 ? 'var(--ok-ink)' : 'var(--danger)' }}>
            {fmtCompact(dep.valorNeto)}
          </div>
        </div>
      </div>

      {/* Progress depreciación */}
      <div style={{ marginTop: 6 }}>
        <div className="pbar" style={{ height: 3 }}>
          <span style={{ width: dep.pctDepreciado + '%', background: dep.pctDepreciado > 75 ? 'var(--danger)' : dep.pctDepreciado > 50 ? 'var(--warn)' : 'var(--ok)' }} />
        </div>
        <div className="hstack between" style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 3 }}>
          <span>Depreciado {dep.pctDepreciado.toFixed(0)}%</span>
          <span>{Math.floor(dep.monthsElapsed / 12)}a {dep.monthsElapsed % 12}m uso</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MOVIMIENTOS (timeline)
// ═══════════════════════════════════════════════════════════════
function InvMovimientosView({ movimientos }) {
  return (
    <div className="card">
      <div className="card-h">
        <h3>Timeline de movimientos</h3>
        <span className="mono text-xs muted">{movimientos.length} movimientos registrados</span>
      </div>
      <div className="card-b tight">
        <table>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Fecha</th>
              <th style={{ width: 100 }}>ID</th>
              <th>Ítem</th>
              <th>Origen</th>
              <th>Destino</th>
              <th style={{ width: 140 }}>Responsable recibe</th>
              <th style={{ width: 90 }}>Foto GR</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map(m => {
              const item = findItem(m.itemId);
              const orig = findUbicacion(m.ubOrigen);
              const dest = findUbicacion(m.ubDestino);
              const rec = findPersonal(m.respRecibe);
              return (
                <tr key={m.id} className="row-hover">
                  <td className="mono text-xs">{m.fecha.slice(5)}</td>
                  <td className="mono text-xs muted">{m.id}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{item ? item.nombre : m.itemId}</div>
                    <div className="mono text-xs muted">{item?.codigo || '—'}</div>
                  </td>
                  <td>
                    <span className="chip" style={{ fontSize: 10, background: (orig?.color || '#9A9A96') + '22', color: orig?.color || '#9A9A96', borderColor: 'transparent' }}>
                      {orig?.nombre.replace('Obra ', '').replace('Almacén ', '').slice(0, 24) || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="chip" style={{ fontSize: 10, background: (dest?.color || '#9A9A96') + '33', color: dest?.color || '#9A9A96', borderColor: 'transparent', fontWeight: 600 }}>
                      → {dest?.nombre.replace('Obra ', '').replace('Almacén ', '').slice(0, 24) || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{rec?.nombre || '—'}</td>
                  <td>
                    {m.fotoGR
                      ? <span className="chip green" style={{ fontSize: 10 }}>{Icon.check({ size: 10 })} {m.fotoGR.slice(0, 12)}</span>
                      : <span className="text-xs muted">—</span>}
                  </td>
                  <td className="text-xs" style={{ color: 'var(--ink-2)' }}>{m.motivo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MANTENIMIENTO
// ═══════════════════════════════════════════════════════════════
function InvMantenimientoView({ mantenimientos }) {
  const programados = mantenimientos.filter(m => m.estado !== 'Completado').sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada));
  const historial = mantenimientos.filter(m => m.estado === 'Completado').sort((a, b) => (b.fechaRealizada || '').localeCompare(a.fechaRealizada || ''));
  const totalHistorial = historial.reduce((s, m) => s + (m.costo || 0), 0);
  const totalProgramado = programados.reduce((s, m) => s + (m.costo || 0), 0);

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <InvKPI lbl="Programados" val={programados.length} color="var(--warn)" sub={`Costo est. ${fmtCompact(totalProgramado)}`} />
        <InvKPI lbl="Historial"   val={historial.length}   color="var(--ok)"   sub={`Gastado ${fmtCompact(totalHistorial)}`} />
        <InvKPI lbl="Próximos 7d" val={programados.filter(m => (new Date(m.fechaProgramada) - TODAY) / (1000*60*60*24) <= 7).length} color="var(--danger)" />
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Mantenimientos programados</h3>
        </div>
        <div className="card-b tight">
          <table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Fecha</th>
                <th style={{ width: 90 }}>Tipo</th>
                <th>Ítem</th>
                <th style={{ width: 140 }}>Proveedor</th>
                <th style={{ width: 100 }}>Costo est.</th>
                <th>Descripción</th>
                <th style={{ width: 110 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {programados.map(m => {
                const item = findItem(m.itemId);
                const dias = Math.round((new Date(m.fechaProgramada) - TODAY) / (1000 * 60 * 60 * 24));
                const urgCls = dias <= 3 ? 'red' : dias <= 7 ? 'amber' : '';
                return (
                  <tr key={m.id} className="row-hover">
                    <td>
                      <div className="mono text-xs">{m.fechaProgramada.slice(5)}</div>
                      <span className={'chip ' + urgCls} style={{ fontSize: 9 }}>{dias < 0 ? 'vencido' : `en ${dias}d`}</span>
                    </td>
                    <td>
                      <span className={'chip ' + (m.tipo === 'Correctivo' ? 'red' : 'blue')} style={{ fontSize: 10 }}>
                        {m.tipo}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{item?.nombre || m.itemId}</div>
                      <div className="mono text-xs muted">{item?.codigo || '—'}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{m.proveedor}</td>
                    <td className="num-c mono" style={{ fontSize: 12 }}>{m.costo ? fmtPEN(m.costo) : '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--ink-2)' }}>{m.descripcion}</td>
                    <td><span className={'chip ' + (m.estado === 'En servicio' ? 'amber' : '')} style={{ fontSize: 10 }}>{m.estado}</span></td>
                  </tr>
                );
              })}
              {programados.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--ink-4)' }}>Sin mantenimientos programados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Historial de mantenimientos</h3>
        </div>
        <div className="card-b tight">
          <table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Realizado</th>
                <th style={{ width: 90 }}>Tipo</th>
                <th>Ítem</th>
                <th style={{ width: 140 }}>Proveedor</th>
                <th style={{ width: 100 }}>Costo real</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {historial.map(m => {
                const item = findItem(m.itemId);
                return (
                  <tr key={m.id} className="row-hover">
                    <td className="mono text-xs">{m.fechaRealizada || '—'}</td>
                    <td>
                      <span className={'chip ' + (m.tipo === 'Correctivo' ? 'red' : 'blue')} style={{ fontSize: 10 }}>
                        {m.tipo}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{item?.nombre || m.itemId}</div>
                      <div className="mono text-xs muted">{item?.codigo || '—'}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{m.proveedor}</td>
                    <td className="num-c mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{m.costo ? '-' + fmtPEN(m.costo) : '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--ink-2)' }}>{m.descripcion}</td>
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
// TRAZABILIDAD (mapa Leaflet)
// ═══════════════════════════════════════════════════════════════
function InvTrazabilidadView({ items }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [selUbId, setSelUbId] = useState(null);

  // Conteo + valor por ubicación
  const byUbicacion = useMemo(() => {
    const m = {};
    inventarioUbicaciones.forEach(u => {
      m[u.id] = { ubicacion: u, items: [], valor: 0 };
    });
    items.forEach(i => {
      if (m[i.ubicacionId]) {
        m[i.ubicacionId].items.push(i);
        m[i.ubicacionId].valor += calcularDepreciacion(i).valorNeto;
      }
    });
    return m;
  }, [items]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !window.L) return;

    const map = L.map(mapRef.current).setView([-12.1, -77.0], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    inventarioUbicaciones.forEach(u => {
      if (u.lat == null || u.lng == null) return;
      const bucket = byUbicacion[u.id];
      const count = bucket.items.length;
      if (count === 0) return;
      const radius = Math.min(25, 8 + Math.sqrt(count) * 3);

      const marker = L.circleMarker([u.lat, u.lng], {
        radius,
        fillColor: u.color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.75,
      }).addTo(map);

      marker.bindTooltip(`<b>${u.nombre}</b><br/>${count} ítems · S/ ${Math.round(bucket.valor).toLocaleString('es-PE')}`, { permanent: false, direction: 'top' });
      marker.on('click', () => setSelUbId(u.id));
    });

    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [byUbicacion]);

  const selUb = selUbId ? byUbicacion[selUbId] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, height: 'calc(100vh - 340px)', minHeight: 500 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="card-h" style={{ flexShrink: 0 }}>
          <h3>Mapa de ubicaciones físicas</h3>
          <span className="text-xs muted">Click marcador para ver ítems</span>
        </div>
        <div ref={mapRef} style={{ flex: 1, width: '100%', minHeight: 400 }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="card-h" style={{ flexShrink: 0 }}>
          <h3>{selUb ? selUb.ubicacion.nombre : 'Todas las ubicaciones'}</h3>
          {selUb && <button className="tb-icon-btn" onClick={() => setSelUbId(null)}>{Icon.x({ size: 12 })}</button>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {selUb ? (
            <>
              <div style={{ padding: '8px 10px', background: selUb.ubicacion.color + '22', borderRadius: 6, marginBottom: 10 }}>
                <div className="hstack between" style={{ fontSize: 11 }}>
                  <span><b>{selUb.items.length}</b> ítems</span>
                  <span className="mono" style={{ fontWeight: 700, color: selUb.ubicacion.color }}>{fmtCompact(selUb.valor)}</span>
                </div>
                <div className="text-xs muted" style={{ marginTop: 2 }}>
                  {selUb.ubicacion.distrito} · {selUb.ubicacion.provincia}
                </div>
              </div>
              {selUb.items.map(it => (
                <div key={it.id} style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)', fontSize: 11 }}>
                  <div className="hstack between">
                    <span className="mono text-xs" style={{ fontWeight: 700 }}>{it.codigo}</span>
                    <span className={'chip ' + estadoChipCls(it.estado)} style={{ fontSize: 9 }}>{it.estado}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>{it.nombre}</div>
                  <div className="text-xs muted" style={{ marginTop: 2 }}>
                    Resp: {findPersonal(it.responsableId)?.nombre || '—'}
                  </div>
                </div>
              ))}
            </>
          ) : (
            Object.values(byUbicacion).filter(b => b.items.length > 0).sort((a, b) => b.items.length - a.items.length).map(b => (
              <div key={b.ubicacion.id}
                onClick={() => setSelUbId(b.ubicacion.id)}
                style={{
                  padding: 10, margin: '6px 0', background: 'var(--bg-sunken)', borderRadius: 6,
                  borderLeft: `3px solid ${b.ubicacion.color}`, cursor: 'pointer',
                }}
              >
                <div className="hstack between" style={{ marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{b.ubicacion.nombre}</span>
                  <span className="chip" style={{ fontSize: 10, background: b.ubicacion.color + '22', color: b.ubicacion.color, borderColor: 'transparent' }}>{b.items.length}</span>
                </div>
                <div className="text-xs muted" style={{ marginBottom: 4 }}>{b.ubicacion.distrito}</div>
                <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: b.ubicacion.color }}>{fmtCompact(b.valor)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REPORTES (depreciación + stats)
// ═══════════════════════════════════════════════════════════════
function InvReportesView({ items }) {
  // Agrupar por categoría
  const byCat = useMemo(() => {
    const m = {};
    Object.keys(DEPRECIACION_CATEGORIA).forEach(c => {
      m[c] = { count: 0, valorAdq: 0, valorNeto: 0, depAcum: 0 };
    });
    items.forEach(i => {
      const d = calcularDepreciacion(i);
      if (!m[i.categoria]) m[i.categoria] = { count: 0, valorAdq: 0, valorNeto: 0, depAcum: 0 };
      m[i.categoria].count += 1;
      m[i.categoria].valorAdq += i.valorAdq;
      m[i.categoria].valorNeto += d.valorNeto;
      m[i.categoria].depAcum += d.depAcumulada;
    });
    return Object.entries(m).filter(([, v]) => v.count > 0).sort((a, b) => b[1].valorAdq - a[1].valorAdq);
  }, [items]);

  const totalAdq = items.reduce((s, i) => s + i.valorAdq, 0);
  const totalNeto = items.reduce((s, i) => s + calcularDepreciacion(i).valorNeto, 0);
  const totalDep = totalAdq - totalNeto;

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <InvKPI lbl="Valor adquisición total"   val={fmtCompact(totalAdq)}  color="var(--accent)" />
        <InvKPI lbl="Depreciación acumulada"    val={fmtCompact(totalDep)}  color="var(--warn-ink)" sub={`${((totalDep/totalAdq)*100).toFixed(1)}% del total`} />
        <InvKPI lbl="Valor neto en libros"      val={fmtCompact(totalNeto)} color="var(--ok)" />
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Depreciación por categoría · SUNAT tasas anuales</h3>
          <span className="text-xs muted">Método lineal mensual</span>
        </div>
        <div className="card-b tight">
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th className="num-c" style={{ width: 70 }}>Tasa</th>
                <th className="num-c" style={{ width: 70 }}>Vida</th>
                <th className="num-c" style={{ width: 60 }}>Items</th>
                <th className="num-c" style={{ width: 120 }}>Valor adq.</th>
                <th className="num-c" style={{ width: 130 }}>Depreciación</th>
                <th className="num-c" style={{ width: 120 }}>Valor neto</th>
                <th style={{ width: 140 }}>% depreciado</th>
              </tr>
            </thead>
            <tbody>
              {byCat.map(([cat, stats]) => {
                const meta = DEPRECIACION_CATEGORIA[cat];
                const pct = stats.valorAdq > 0 ? (stats.depAcum / stats.valorAdq) * 100 : 0;
                const catColor = categoriaColor(cat);
                return (
                  <tr key={cat} className="row-hover">
                    <td>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: catColor, marginRight: 6 }} />
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                    </td>
                    <td className="num-c mono">{meta?.tasa || '—'}%</td>
                    <td className="num-c mono">{meta?.vida || '—'}a</td>
                    <td className="num-c mono">{stats.count}</td>
                    <td className="num-c mono">{fmtPEN(stats.valorAdq)}</td>
                    <td className="num-c mono" style={{ color: 'var(--warn-ink)' }}>-{fmtPEN(stats.depAcum)}</td>
                    <td className="num-c mono" style={{ fontWeight: 700, color: 'var(--ok)' }}>{fmtPEN(stats.valorNeto)}</td>
                    <td>
                      <div className="hstack" style={{ gap: 6 }}>
                        <div className="pbar" style={{ flex: 1, height: 5 }}>
                          <span style={{ width: pct + '%', background: catColor }} />
                        </div>
                        <span className="mono text-xs" style={{ width: 32, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-sunken)', fontWeight: 700 }}>
                <td colSpan="3">TOTAL</td>
                <td className="num-c mono">{items.length}</td>
                <td className="num-c mono">{fmtPEN(totalAdq)}</td>
                <td className="num-c mono" style={{ color: 'var(--warn-ink)' }}>-{fmtPEN(totalDep)}</td>
                <td className="num-c mono" style={{ color: 'var(--ok)' }}>{fmtPEN(totalNeto)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ITEM DETAIL DRAWER (side panel)
// ═══════════════════════════════════════════════════════════════
function InvItemDetailDrawer({ item, movimientos, mantenimientos, onClose, onTransferir }) {
  const ub = findUbicacion(item.ubicacionId);
  const resp = findPersonal(item.responsableId);
  const dep = calcularDepreciacion(item);
  const qrUrl = BASE_URL_QR + item.codigo;
  const qrRef = useRef(null);

  // davidshimjs/qrcodejs: new QRCode(divElement, options) renderiza dentro del div
  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const tryGenerate = () => {
      if (cancelled) return;
      if (!window.QRCode) {
        if (retries++ < 30) setTimeout(tryGenerate, 100);
        return;
      }
      if (!qrRef.current) return;
      qrRef.current.innerHTML = '';
      try {
        new window.QRCode(qrRef.current, {
          text: qrUrl,
          width: 140, height: 140,
          colorDark: '#000000', colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      } catch (e) { console.error('QR gen error:', e); }
    };
    tryGenerate();
    return () => { cancelled = true; };
  }, [qrUrl]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="card"
        style={{
          width: 420, height: '100vh', overflow: 'auto',
          borderRadius: 0, margin: 0,
          animation: 'slideInRight .25s cubic-bezier(.2,.6,.2,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--bg-elev)', zIndex: 1 }}>
          <div className="hstack between" style={{ marginBottom: 6 }}>
            <span className="mono text-xs" style={{ color: 'var(--ink-3)', fontWeight: 700 }}>{item.codigo}</span>
            <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 14 })}</button>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{item.nombre}</div>
          <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span className={'chip ' + estadoChipCls(item.estado)} style={{ fontSize: 10 }}>{item.estado}</span>
            <span className="chip" style={{ fontSize: 10, background: categoriaColor(item.categoria) + '22', color: categoriaColor(item.categoria), borderColor: 'transparent' }}>{item.categoria}</span>
          </div>
        </div>

        <div style={{ padding: '12px 18px' }}>
          {/* QR code */}
          <div style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 8, marginBottom: 14, textAlign: 'center' }}>
            <div ref={qrRef} style={{ display: 'inline-block', borderRadius: 6, background: '#fff', padding: 6 }} />
            <div className="mono text-xs" style={{ marginTop: 6, color: 'var(--ink-3)', wordBreak: 'break-all' }}>{qrUrl}</div>
          </div>

          <InvDetailSection title="Identificación">
            <InvDetailKV k="Marca" v={item.marca} />
            <InvDetailKV k="Modelo" v={item.modelo} />
            {item.serie && item.serie !== '—' && <InvDetailKV k="N° Serie" v={item.serie} mono />}
          </InvDetailSection>

          <InvDetailSection title="Ubicación actual">
            <InvDetailKV k="Lugar" v={ub?.nombre || '—'} />
            <InvDetailKV k="Distrito" v={ub?.distrito || '—'} />
            <InvDetailKV k="Responsable" v={resp?.nombre || '—'} />
          </InvDetailSection>

          <InvDetailSection title="Depreciación SUNAT">
            <InvDetailKV k="Valor adquisición" v={fmtPEN(item.valorAdq)} mono />
            <InvDetailKV k="Fecha compra" v={item.fechaAdq} />
            <InvDetailKV k="Tasa anual" v={item.tasa + '% (' + item.vida + ' años)'} />
            <InvDetailKV k="Uso transcurrido" v={`${Math.floor(dep.monthsElapsed / 12)} años ${dep.monthsElapsed % 12} meses`} />
            <InvDetailKV k="Depreciación mensual" v={fmtPEN(dep.monthlyDep)} mono />
            <InvDetailKV k="Depreciación acumulada" v={'-' + fmtPEN(dep.depAcumulada)} mono />
            <div style={{ margin: '8px 0 4px', padding: '6px 10px', background: 'var(--ok-soft)', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--ok-ink)', fontWeight: 600 }}>Valor neto actual</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--ok)' }}>{fmtPEN(dep.valorNeto)}</span>
            </div>
          </InvDetailSection>

          {movimientos.length > 0 && (
            <InvDetailSection title={`Timeline movimientos (${movimientos.length})`}>
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {movimientos.slice(0, 20).map(m => {
                  const orig = findUbicacion(m.ubOrigen);
                  const dest = findUbicacion(m.ubDestino);
                  return (
                    <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px dashed var(--line)', fontSize: 11 }}>
                      <div className="mono text-xs muted" style={{ marginBottom: 2 }}>{m.fecha}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                        <b>{orig?.nombre.slice(0, 18)}</b> → <b>{dest?.nombre.slice(0, 18)}</b>
                      </div>
                      <div className="text-xs muted" style={{ marginTop: 2 }}>{m.motivo}</div>
                    </div>
                  );
                })}
              </div>
            </InvDetailSection>
          )}

          {mantenimientos.length > 0 && (
            <InvDetailSection title={`Mantenimientos (${mantenimientos.length})`}>
              {mantenimientos.map(m => (
                <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px dashed var(--line)', fontSize: 11 }}>
                  <div className="hstack between">
                    <span className={'chip ' + (m.tipo === 'Correctivo' ? 'red' : 'blue')} style={{ fontSize: 9 }}>{m.tipo}</span>
                    <span className="mono text-xs muted">{m.fechaRealizada || m.fechaProgramada}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2 }}>{m.descripcion}</div>
                  {m.costo && <div className="mono text-xs" style={{ color: 'var(--danger)', marginTop: 2 }}>-{fmtPEN(m.costo)}</div>}
                </div>
              ))}
            </InvDetailSection>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="tb-btn primary" onClick={onTransferir} style={{ flex: 1 }}>
              {Icon.swap({ size: 13 })} Transferir
            </button>
            <button className="tb-btn">{Icon.wrench({ size: 13 })} Mant.</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvDetailSection({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid var(--line)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InvDetailKV({ k, v, mono }) {
  return (
    <div className="hstack between" style={{ padding: '3px 0', fontSize: 11 }}>
      <span style={{ color: 'var(--ink-3)' }}>{k}</span>
      <span className={mono ? 'mono' : ''} style={{ color: 'var(--ink)', fontWeight: 500 }}>{v}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NUEVO ITEM MODAL
// ═══════════════════════════════════════════════════════════════
function InvNuevoItemModal({ onClose, onSave, nextId }) {
  const [form, setForm] = useState({
    nombre: '', categoria: 'Herramienta eléctrica', marca: '', modelo: '', serie: '',
    valorAdq: '', fechaAdq: new Date().toISOString().slice(0, 10),
    proveedor: '', ubicacionId: 'UB-CEN', responsableId: 'PER-004', estado: 'Operativo',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const nuevoId = 'INV-' + String(nextId).padStart(3, '0');
  const codigoPrefix = { 'Herramienta manual': 'H', 'Herramienta eléctrica': 'H', 'Medición': 'M', 'Andamios y encofrado': 'A', 'EPP': 'P', 'Equipo eléctrico': 'E', 'Mobiliario': 'O', 'Cómputo': 'C' }[form.categoria] || 'X';
  const nuevoCodigo = `MM-${codigoPrefix}-${String(nextId).padStart(4, '0')}`;

  const meta = DEPRECIACION_CATEGORIA[form.categoria];
  const valid = form.nombre.trim() && parseFloat(form.valorAdq) > 0 && form.fechaAdq;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      id: nuevoId, codigo: nuevoCodigo, ...form,
      valorAdq: parseFloat(form.valorAdq),
      tasa: meta.tasa, vida: meta.vida,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 640, maxWidth: '96vw', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Registrar nuevo ítem</div>
            <div className="mono text-xs muted" style={{ marginTop: 2 }}>{nuevoId} · {nuevoCodigo}</div>
          </div>
          <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
            <InvFField label="Nombre">
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Taladro Bosch GBH 2-26" className="fin-input" />
            </InvFField>
            <InvFField label="Categoría">
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="fin-input">
                {Object.keys(DEPRECIACION_CATEGORIA).map(c => <option key={c}>{c}</option>)}
              </select>
            </InvFField>
            <InvFField label="Marca">
              <input value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Bosch" className="fin-input" />
            </InvFField>
            <InvFField label="Modelo">
              <input value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="GBH 2-26" className="fin-input" />
            </InvFField>
            <InvFField label="N° Serie" hint="opcional">
              <input value={form.serie} onChange={e => set('serie', e.target.value)} placeholder="SN..." className="fin-input mono" />
            </InvFField>
            <InvFField label="Proveedor">
              <input value={form.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Bosch Perú" className="fin-input" />
            </InvFField>
            <InvFField label="Valor adquisición S/">
              <input type="number" min="0" value={form.valorAdq} onChange={e => set('valorAdq', e.target.value)} placeholder="0.00" className="fin-input mono" />
            </InvFField>
            <InvFField label="Fecha compra">
              <input type="date" value={form.fechaAdq} onChange={e => set('fechaAdq', e.target.value)} className="fin-input" />
            </InvFField>
            <InvFField label="Ubicación inicial">
              <select value={form.ubicacionId} onChange={e => set('ubicacionId', e.target.value)} className="fin-input">
                {inventarioUbicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </InvFField>
            <InvFField label="Responsable">
              <select value={form.responsableId} onChange={e => set('responsableId', e.target.value)} className="fin-input">
                {inventarioPersonal.map(p => <option key={p.id} value={p.id}>{p.nombre} · {p.cargo}</option>)}
              </select>
            </InvFField>
          </div>

          <div style={{ padding: 10, background: 'var(--accent-soft)', borderRadius: 6, fontSize: 11, color: 'var(--accent-ink)' }}>
            <b>Depreciación SUNAT:</b> {meta.tasa}% anual · vida útil {meta.vida} años · <span className="mono">{form.valorAdq ? fmtPEN(parseFloat(form.valorAdq) / (meta.vida * 12)) + '/mes' : '—'}</span>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--bg-elev)' }}>
          <button className="tb-btn" onClick={onClose}>Cancelar</button>
          <button className="tb-btn primary" disabled={!valid} onClick={handleSave} style={{ opacity: valid ? 1 : 0.45 }}>
            {Icon.check({ size: 13 })} Registrar ítem
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRANSFERENCIA MODAL
// ═══════════════════════════════════════════════════════════════
function InvTransferenciaModal({ item, onClose, onConfirm }) {
  const [destinoId, setDestinoId] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [fotoGR, setFotoGR] = useState('');
  const ubActual = findUbicacion(item.ubicacionId);
  const destinos = inventarioUbicaciones.filter(u => u.id !== item.ubicacionId);

  const valid = destinoId && responsableId && motivo.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 560, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Transferir ítem</div>
            <div className="mono text-xs muted" style={{ marginTop: 2 }}>{item.codigo} · {item.nombre.slice(0, 40)}</div>
          </div>
          <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, marginBottom: 12 }}>
            <div className="hstack between">
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Ubicación origen</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{ubActual?.nombre}</div>
                <div className="text-xs muted">{ubActual?.distrito}</div>
              </div>
              <div style={{ fontSize: 16, color: 'var(--accent)' }}>{Icon.arrowR({ size: 18 })}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Destino</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: destinoId ? 'var(--ink)' : 'var(--ink-4)' }}>
                  {destinoId ? findUbicacion(destinoId)?.nombre : 'Seleccionar...'}
                </div>
              </div>
            </div>
          </div>

          <InvFField label="Ubicación destino">
            <select value={destinoId} onChange={e => setDestinoId(e.target.value)} className="fin-input">
              <option value="">Seleccionar...</option>
              {destinos.map(u => <option key={u.id} value={u.id}>{u.nombre} · {u.distrito}</option>)}
            </select>
          </InvFField>

          <div style={{ marginTop: 10 }}>
            <InvFField label="Responsable recibe">
              <select value={responsableId} onChange={e => setResponsableId(e.target.value)} className="fin-input">
                <option value="">Seleccionar...</option>
                {inventarioPersonal.map(p => <option key={p.id} value={p.id}>{p.nombre} · {p.cargo}</option>)}
              </select>
            </InvFField>
          </div>

          <div style={{ marginTop: 10 }}>
            <InvFField label="Motivo / Concepto">
              <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Uso en obra, retorno a almacén, envío a mantenimiento..." className="fin-input" />
            </InvFField>
          </div>

          <div style={{ marginTop: 10 }}>
            <InvFField label="Guía de remisión (opcional)" hint="Click para adjuntar">
              <div
                onClick={() => setFotoGR(fotoGR ? '' : `gr-${new Date().getTime()}.jpg`)}
                style={{
                  border: '1.5px dashed ' + (fotoGR ? 'var(--ok)' : 'var(--line)'),
                  borderRadius: 6, padding: 12,
                  background: fotoGR ? 'var(--ok-soft)' : 'var(--bg-sunken)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 6, background: fotoGR ? 'var(--ok)' : 'var(--accent-soft)', color: fotoGR ? '#fff' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {fotoGR ? Icon.check({ size: 13 }) : Icon.camera({ size: 13 })}
                </div>
                <div style={{ fontSize: 12 }}>
                  {fotoGR || 'Click o arrastra foto de la guía firmada'}
                </div>
              </div>
            </InvFField>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--bg-elev)' }}>
          <button className="tb-btn" onClick={onClose}>Cancelar</button>
          <button
            className="tb-btn primary"
            disabled={!valid}
            style={{ opacity: valid ? 1 : 0.45 }}
            onClick={() => onConfirm(item.id, destinoId, responsableId, motivo, fotoGR)}
          >
            {Icon.swap({ size: 13 })} Confirmar transferencia
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCANNER QR (webcam + BarcodeDetector + fallback manual)
// ═══════════════════════════════════════════════════════════════
function InvScannerModal({ onClose, onScan, items }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [err, setErr] = useState(null);
  const [manualCodigo, setManualCodigo] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!window.jsQR) {
      setErr('Librería jsQR no cargó. Recargá la página o ingresa el código manualmente.');
      return;
    }

    let rafId;
    let stopped = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const tick = () => {
          if (stopped) return;
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const vw = videoRef.current.videoWidth;
            const vh = videoRef.current.videoHeight;
            canvas.width = vw;
            canvas.height = vh;
            ctx.drawImage(videoRef.current, 0, 0, vw, vh);
            try {
              const imageData = ctx.getImageData(0, 0, vw, vh);
              const code = window.jsQR(imageData.data, vw, vh, { inversionAttempts: 'dontInvert' });
              if (code && code.data) {
                stopped = true;
                const raw = code.data;
                const match = raw.match(/\/i\/([^/?#]+)/);
                const codigo = match ? match[1] : raw;
                onScan(codigo);
                return;
              }
            } catch (e) { /* ignore frame errors */ }
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } catch (e) {
        setErr('No se pudo acceder a la cámara: ' + e.message);
      }
    })();

    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 520, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{Icon.qr({ size: 14 })} Escanear código QR</div>
          <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
        </div>
        <div style={{ padding: 20 }}>
          {err ? (
            <div style={{ padding: 16, background: 'var(--warn-soft)', borderRadius: 6, color: 'var(--warn-ink)', fontSize: 12, marginBottom: 14 }}>
              {err}
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {/* Overlay marco */}
              <div style={{ position: 'absolute', inset: '15% 15%', border: '3px solid #fff', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 11, fontFamily: 'var(--mono)' }}>
                {scanning ? 'Apunta al QR · detectando...' : 'Iniciando cámara...'}
              </div>
            </div>
          )}

          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid var(--line)' }}>
            O ingresa código manualmente
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <input
              value={manualCodigo}
              onChange={e => setManualCodigo(e.target.value.toUpperCase())}
              placeholder="MM-H-0001"
              className="fin-input mono"
              style={{ flex: 1 }}
              list="items-codigos"
            />
            <datalist id="items-codigos">
              {items.map(i => <option key={i.id} value={i.codigo}>{i.nombre}</option>)}
            </datalist>
            <button
              className="tb-btn primary"
              disabled={!manualCodigo.trim()}
              onClick={() => onScan(manualCodigo.trim())}
            >
              Buscar
            </button>
          </div>
          {!err && (
            <div className="text-xs muted" style={{ marginTop: 10, fontSize: 10 }}>
              ✓ jsQR activo · funciona en Chrome · Edge · Firefox · Safari
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ETIQUETAS QR IMPRIMIBLES (A4 grid)
// ═══════════════════════════════════════════════════════════════
function InvEtiquetasQRModal({ items, onClose }) {
  const sheetRef = useRef(null);
  const [selected, setSelected] = useState(() => new Set(items.slice(0, 12).map(i => i.id)));
  const [mode, setMode] = useState('qr'); // 'qr' | 'barcode' | 'card'
  const [selQ, setSelQ] = useState('');
  const [selCat, setSelCat] = useState('all');
  const [onlySelected, setOnlySelected] = useState(false);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const selectAll = () => setSelected(new Set(items.map(i => i.id)));
  const clearAll = () => setSelected(new Set());

  const itemsToPrint = items.filter(i => selected.has(i.id));

  // Categorías presentes en items + counts
  const catList = useMemo(() => {
    const m = {};
    items.forEach(it => { m[it.categoria] = (m[it.categoria] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // Items filtrados en el selector
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (onlySelected && !selected.has(it.id)) return false;
      if (selCat !== 'all' && it.categoria !== selCat) return false;
      if (selQ.trim()) {
        const q = selQ.toLowerCase();
        return it.nombre.toLowerCase().includes(q) || it.codigo.toLowerCase().includes(q) || (it.marca || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, selQ, selCat, onlySelected, selected]);

  // Bulk: aplica selección sobre el subconjunto visible
  const selectVisible = () => setSelected(prev => {
    const next = new Set(prev);
    filteredItems.forEach(it => next.add(it.id));
    return next;
  });
  const deselectVisible = () => setSelected(prev => {
    const next = new Set(prev);
    filteredItems.forEach(it => next.delete(it.id));
    return next;
  });

  // Paginación preview · render todas las páginas con divisor visual
  const itemsPerPage = mode === 'barcode' ? 12 : 9;
  const totalPages = Math.max(1, Math.ceil(itemsToPrint.length / itemsPerPage));
  const pages = [];
  for (let i = 0; i < itemsToPrint.length; i += itemsPerPage) {
    pages.push(itemsToPrint.slice(i, i + itemsPerPage));
  }

  // Print CSS común · oculta divisor "Página X de Y" + page-break entre páginas
  const COMMON_CSS = `
    /* Solo bara visible en preview, oculta en print */
    .etq-page > div:first-child { display: none !important; }
    .etq-page { page-break-after: always; break-after: page; }
    .etq-page:last-child { page-break-after: auto; break-after: auto; }
    .etq-grid { width: 100%; }
  `;
  const PRINT_CSS = {
    qr: COMMON_CSS + `
      .etq-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
      .etq-item { border: 1px dashed #bbb; padding: 5mm 4mm; text-align: center; page-break-inside: avoid; break-inside: avoid; min-height: 60mm; }
      .etq-qr { width: 36mm; height: 36mm; margin: 0 auto 2mm; display: block; }
      .etq-codigo { font-family: 'JetBrains Mono', monospace; font-size: 11pt; font-weight: 700; margin: 2mm 0; }
      .etq-nombre { font-size: 9pt; color: #333; line-height: 1.2; min-height: 24pt; padding: 0 1mm; }
      .etq-empresa { font-size: 7pt; color: #999; margin-top: 2mm; font-family: 'JetBrains Mono', monospace; letter-spacing: 1pt; text-transform: uppercase; }
    `,
    barcode: COMMON_CSS + `
      .etq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; }
      .etq-item { border: 1px dashed #bbb; padding: 4mm 5mm; page-break-inside: avoid; break-inside: avoid; }
      .etq-bc-row1 { display: flex; align-items: baseline; gap: 4mm; margin-bottom: 1.5mm; }
      .etq-bc-codigo { font-family: 'JetBrains Mono', monospace; font-size: 11pt; font-weight: 700; }
      .etq-bc-nombre { font-size: 8.5pt; color: #333; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .etq-bc-svg { width: 100%; height: 14mm; display: block; margin: 1mm 0; }
      .etq-bc-foot { display: flex; justify-content: space-between; font-size: 7pt; color: #888; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5pt; text-transform: uppercase; margin-top: 1mm; }
    `,
    card: COMMON_CSS + `
      .etq-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
      .etq-item { border: 1px solid #ddd; border-left: 4px solid var(--cat-color, #888); padding: 4mm; page-break-inside: avoid; break-inside: avoid; min-height: 56mm; display: flex; flex-direction: column; gap: 2mm; }
      .etq-card-h { display: flex; justify-content: space-between; align-items: baseline; }
      .etq-card-codigo { font-family: 'JetBrains Mono', monospace; font-size: 9pt; font-weight: 700; color: #555; }
      .etq-card-cat { font-size: 6.5pt; padding: 1mm 2mm; border-radius: 2mm; background: var(--cat-color-soft, #eee); color: var(--cat-color, #555); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.4pt; }
      .etq-card-nombre { font-size: 10pt; font-weight: 600; line-height: 1.25; }
      .etq-card-meta { font-size: 7.5pt; color: #555; line-height: 1.5; }
      .etq-card-meta b { color: #222; }
      .etq-card-foot { margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 2mm; border-top: 1px solid #eee; font-size: 7pt; }
      .etq-card-mini-bc { width: 40mm; height: 8mm; }
    `,
  };

  const titleByMode = { qr: 'QR · 9 por hoja', barcode: 'Código de barras · 12 por hoja', card: 'Card detallada · 9 por hoja' };

  const handlePrint = () => {
    if (!sheetRef.current) return;
    const sheetHTML = sheetRef.current.outerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:-9999px;bottom:-9999px;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiquetas — ${titleByMode[mode]}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { margin: 0; font-family: Inter, system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        ${PRINT_CSS[mode]}
      </style></head><body>${sheetHTML}</body></html>`;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(fullHTML);
    doc.close();
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 1100, maxWidth: '98vw', maxHeight: '95vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elev)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Imprimir etiquetas inventario</div>
            <div className="text-xs muted" style={{ marginTop: 2 }}>
              {itemsToPrint.length} etiquetas · {titleByMode[mode]}
            </div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <div className="tw-seg" style={{ marginRight: 8 }}>
              <button className={mode === 'qr' ? 'on' : ''} onClick={() => setMode('qr')}>QR</button>
              <button className={mode === 'barcode' ? 'on' : ''} onClick={() => setMode('barcode')}>Barcode</button>
              <button className={mode === 'card' ? 'on' : ''} onClick={() => setMode('card')}>Card</button>
            </div>
            <button className="tb-btn" onClick={selectAll}>Todos ({items.length})</button>
            <button className="tb-btn" onClick={clearAll}>Quitar</button>
            <button className="tb-btn primary" disabled={itemsToPrint.length === 0} onClick={handlePrint}>
              {Icon.download({ size: 13 })} Imprimir ({itemsToPrint.length})
            </button>
            <button onClick={onClose} className="tb-icon-btn">{Icon.x({ size: 14 })}</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: 16, background: 'var(--bg)', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          {/* Selector ítems · con filtros */}
          <div style={{ borderRight: '1px solid var(--line)', paddingRight: 12, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Selecciona ítems</span>
              <span style={{ color: 'var(--accent)' }}>{selected.size} de {items.length}</span>
            </div>

            {/* Search · inline para no heredar flex-grow del topbar */}
            <div style={{ position: 'relative', marginBottom: 8, flexShrink: 0 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', pointerEvents: 'none', display: 'inline-flex' }}>
                {Icon.search({ size: 12 })}
              </span>
              <input
                value={selQ}
                onChange={e => setSelQ(e.target.value)}
                placeholder="Buscar código, nombre, marca..."
                style={{
                  width: '100%', padding: '6px 10px 6px 28px',
                  fontSize: 11, border: '1px solid var(--line)', borderRadius: 6,
                  background: 'var(--bg-elev)', color: 'var(--ink)',
                  boxSizing: 'border-box', outline: 'none', height: 28,
                }}
              />
            </div>

            {/* Category chips · scroll horizontal */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 8 }}>
              <button
                onClick={() => setSelCat('all')}
                style={{
                  padding: '3px 9px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                  border: '1px solid ' + (selCat === 'all' ? 'var(--ink)' : 'var(--line)'),
                  background: selCat === 'all' ? 'var(--ink)' : 'var(--bg-elev)',
                  color: selCat === 'all' ? '#fff' : 'var(--ink-2)',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >Todas</button>
              {catList.map(([cat, count]) => {
                const active = selCat === cat;
                const color = categoriaColor(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setSelCat(active ? 'all' : cat)}
                    style={{
                      padding: '3px 9px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                      border: '1px solid ' + (active ? color : 'var(--line)'),
                      background: active ? color : 'var(--bg-elev)',
                      color: active ? '#fff' : 'var(--ink-2)',
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >{cat.split(' ')[0]} <span style={{ opacity: 0.7, fontSize: 9 }}>{count}</span></button>
                );
              })}
            </div>

            {/* Bulk acciones del subset visible */}
            <div className="hstack" style={{ gap: 6, marginBottom: 8, fontSize: 11 }}>
              <button onClick={selectVisible} className="tb-btn" style={{ fontSize: 10, padding: '3px 8px', height: 24 }} disabled={filteredItems.length === 0}>
                + Marcar {filteredItems.length}
              </button>
              <button onClick={deselectVisible} className="tb-btn" style={{ fontSize: 10, padding: '3px 8px', height: 24 }} disabled={filteredItems.length === 0}>
                − Quitar
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--ink-3)', cursor: 'pointer', marginLeft: 'auto' }}>
                <input type="checkbox" checked={onlySelected} onChange={e => setOnlySelected(e.target.checked)} />
                solo seleccionados
              </label>
            </div>

            {/* Lista filtrada */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {filteredItems.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--ink-4)', textAlign: 'center', padding: 20 }}>
                  Sin ítems que coincidan
                </div>
              )}
              {filteredItems.map(it => (
                <label key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', cursor: 'pointer', fontSize: 11, borderRadius: 4 }}>
                  <input type="checkbox" checked={selected.has(it.id)} onChange={() => toggle(it.id)} />
                  <span className="mono text-xs" style={{ width: 80, color: 'var(--ink-3)', flexShrink: 0 }}>{it.codigo}</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview · todas las páginas con divisor */}
          <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', minHeight: 0, paddingBottom: 20 }}>
            {itemsToPrint.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-4)', textAlign: 'center', padding: 40 }}>
                Selecciona al menos un ítem para ver la vista previa
              </div>
            )}

            <div ref={sheetRef} style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pages.map((pageItems, pageIdx) => (
                <div key={pageIdx} className="etq-page" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <span>Página {pageIdx + 1} de {totalPages}</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                    <span>A4 · {pageItems.length} de {itemsPerPage}</span>
                  </div>
                  <div className="etq-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: mode === 'barcode' ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                    gap: mode === 'qr' ? 12 : 10,
                  }}>
                    {/* Modo QR */}
                    {mode === 'qr' && pageItems.map(it => (
                      <div key={it.id} className="etq-item" style={{ border: '1px dashed #bbb', padding: '14px 10px', textAlign: 'center', minHeight: 220, minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
                        <InvQRCell url={BASE_URL_QR + it.codigo} size={120} />
                        <div className="etq-codigo" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#000', margin: '8px 0 4px' }}>{it.codigo}</div>
                        <div className="etq-nombre" style={{ fontSize: 10, color: '#333', lineHeight: 1.2, minHeight: 26 }}>{it.nombre.slice(0, 50)}</div>
                        <div className="etq-empresa" style={{ fontSize: 8, color: '#999', marginTop: 6, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, textTransform: 'uppercase' }}>MMHIGHMETRIK</div>
                      </div>
                    ))}

                    {/* Modo Barcode */}
                    {mode === 'barcode' && pageItems.map(it => (
                      <div key={it.id} className="etq-item" style={{ border: '1px dashed #bbb', padding: '10px 14px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
                        <div className="etq-bc-row1" style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                          <span className="etq-bc-codigo" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700 }}>{it.codigo}</span>
                          <span className="etq-bc-nombre" style={{ fontSize: 10, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.nombre}</span>
                        </div>
                        <InvBarcodeCell value={it.codigo} className="etq-bc-svg" />
                        <div className="etq-bc-foot" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#888', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                          <span>{it.marca || '—'}</span>
                          <span>MMHIGHMETRIK</span>
                        </div>
                      </div>
                    ))}

                    {/* Modo Card */}
                    {mode === 'card' && pageItems.map(it => {
                      const ub = findUbicacion(it.ubicacionId);
                      const resp = findPersonal(it.responsableId);
                      const catColor = categoriaColor(it.categoria);
                      const catSoft = catColor + '22';
                      return (
                        <div key={it.id} className="etq-item"
                          style={{
                            border: '1px solid #ddd', borderLeft: `4px solid ${catColor}`,
                            padding: 10, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 4,
                            minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
                            background: '#fff',
                            '--cat-color': catColor, '--cat-color-soft': catSoft,
                          }}>
                          <div className="etq-card-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span className="etq-card-codigo" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: '#555' }}>{it.codigo}</span>
                            <span className="etq-card-cat" style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: catSoft, color: catColor, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                              {it.categoria.split(' ')[0]}
                            </span>
                          </div>
                          <div className="etq-card-nombre" style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.25 }}>{it.nombre}</div>
                          <div className="etq-card-meta" style={{ fontSize: 8.5, color: '#555', lineHeight: 1.4 }}>
                            <div><b>{it.marca}</b> · {it.modelo || '—'}</div>
                            {it.serie && it.serie !== '—' && <div>SN: {it.serie}</div>}
                            <div>📍 {ub ? ub.nombre : '—'}</div>
                            {resp && <div>👤 {resp.nombre}</div>}
                          </div>
                          <div className="etq-card-foot" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px solid #eee', fontSize: 8 }}>
                            <span style={{ color: '#999', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.5, textTransform: 'uppercase' }}>MMHIGHMETRIK</span>
                            <InvBarcodeCell value={it.codigo} className="etq-card-mini-bc" width={1.2} height={28} fontSize={0} margin={0} displayValue={false} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente QR inline (usa davidshimjs QRCode · renderiza canvas dentro del div)
function InvQRCell({ url, size = 90 }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const tryRender = () => {
      if (cancelled) return;
      if (!window.QRCode) {
        if (retries++ < 30) setTimeout(tryRender, 100);
        return;
      }
      if (!ref.current) return;
      ref.current.innerHTML = '';
      try {
        new window.QRCode(ref.current, {
          text: url, width: size, height: size,
          colorDark: '#000000', colorLight: '#FFFFFF',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      } catch (e) { /* ignore */ }
    };
    tryRender();
    return () => { cancelled = true; };
  }, [url, size]);

  return <div ref={ref} style={{ width: size, height: size, display: 'inline-block', background: '#F8F8F8' }} />;
}

// Componente Barcode inline · usa JsBarcode (Code128) renderizando SVG
// Después del render, ajustamos viewBox + width:100% para que escale al container
function InvBarcodeCell({ value, className, width = 1.6, height = 50, fontSize = 11, margin = 4, displayValue = true }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const tryRender = () => {
      if (cancelled) return;
      if (!window.JsBarcode) {
        if (retries++ < 30) setTimeout(tryRender, 100);
        return;
      }
      if (!ref.current) return;
      try {
        window.JsBarcode(ref.current, String(value), {
          format: 'CODE128',
          width, height, fontSize, margin,
          displayValue,
          background: '#ffffff', lineColor: '#000000',
          font: 'JetBrains Mono, monospace',
        });
        // Forzar SVG responsive: viewBox + width 100% + preserveAspectRatio
        const svg = ref.current;
        if (svg) {
          const w = svg.getAttribute('width');
          const h = svg.getAttribute('height');
          if (w && h) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
          svg.removeAttribute('width');
          svg.removeAttribute('height');
          svg.setAttribute('preserveAspectRatio', 'none');
          svg.style.width = '100%';
          svg.style.height = displayValue ? (height + fontSize + 6) + 'px' : height + 'px';
          svg.style.display = 'block';
        }
      } catch (e) { /* ignore */ }
    };
    tryRender();
    return () => { cancelled = true; };
  }, [value, width, height, fontSize, margin, displayValue]);

  return <svg ref={ref} className={className} style={{ display: 'block', width: '100%', maxWidth: '100%' }} />;
}

function InvFField({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="hstack between">
        <label style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</label>
        {hint && <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

window.InventarioPage = InventarioPage;
