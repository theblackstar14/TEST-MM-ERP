/* global React, Icon, ERP_DATA, pdfjsLib */
const { useState, useMemo, useEffect, useRef } = React;
const {
  planContable, asientosContables, cartolasBancarias,
  cuentasBancariasBalances, BANK_TO_PCGE,
  fmtPEN, fmtCompact,
} = ERP_DATA;

// ═══════════════════════════════════════════════════════════════
// PARSER · Estado de cuenta BCP (PDF con prefix $BOP$ + password DNI)
// ═══════════════════════════════════════════════════════════════
async function parseBcpEstadoCuenta(file, password) {
  if (!window.pdfjsLib) throw new Error('pdf.js no cargó. Revisa conexión a unpkg o ad-blocker.');

  const buf = new Uint8Array(await file.arrayBuffer());
  let pdfBytes = buf;
  // Strip $BOP$ marker propietario BCP (0x24 0x42 0x4F 0x50 0x24 = 5 bytes)
  if (buf.length > 5 && buf[0] === 0x24 && buf[1] === 0x42 && buf[2] === 0x4F && buf[3] === 0x50 && buf[4] === 0x24) {
    pdfBytes = buf.slice(5);
  }
  if (pdfBytes[0] !== 0x25 || pdfBytes[1] !== 0x50) throw new Error('No parece un PDF válido tras strip $BOP$.');

  let doc;
  try { doc = await pdfjsLib.getDocument({ data: pdfBytes, password }).promise; }
  catch (e) {
    if (e.name === 'PasswordException') throw new Error('Contraseña incorrecta. Usa DNI del titular.');
    throw e;
  }

  const MES_MAP = { ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06', JUL: '07', AGO: '08', SET: '09', SEP: '09', OCT: '10', NOV: '11', DIC: '12' };
  const numRe = /^[\d,]+\.\d{2}$/;
  const datePairRe = /^(\d{2})([A-Z]{3})$/;

  const meta = { banco: 'BCP', cuenta: '', moneda: 'PEN', periodo: '', fechaDesde: null, fechaHasta: null, titular: '', saldoInicial: null, saldoFinal: null, totCargo: 0, totAbono: 0 };
  const movimientos = [];
  let yearHint = new Date().getFullYear();
  let refCounter = 1;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();

    const rowsMap = {};
    tc.items.forEach(it => {
      if (!it.str || !it.str.trim()) return;
      const y = Math.round(it.transform[5]);
      const x = it.transform[4];
      (rowsMap[y] = rowsMap[y] || []).push({ x, str: it.str.trim() });
    });
    const ys = Object.keys(rowsMap).map(Number).sort((a, b) => b - a);

    // X-threshold para separar columna CARGOS vs ABONOS
    let xCargo = null, xAbono = null;
    for (const y of ys) {
      rowsMap[y].forEach(it => {
        if (/CARGOS|DEBE/i.test(it.str) && xCargo === null) xCargo = it.x;
        if (/ABONOS|HABER/i.test(it.str) && xAbono === null) xAbono = it.x;
      });
      if (xCargo !== null && xAbono !== null) break;
    }
    const xThreshold = (xCargo !== null && xAbono !== null) ? (xCargo + xAbono) / 2 : 480;

    for (const y of ys) {
      const items = rowsMap[y].sort((a, b) => a.x - b.x);
      const lineJoined = items.map(i => i.str).join(' ');

      // Periodo
      const perM = lineJoined.match(/DEL\s+(\d{2})\/(\d{2})\/(\d{2})\s+AL\s+(\d{2})\/(\d{2})\/(\d{2})/);
      if (perM) {
        const y1 = 2000 + parseInt(perM[3]);
        const y2 = 2000 + parseInt(perM[6]);
        meta.fechaDesde = `${y1}-${perM[2]}-${perM[1]}`;
        meta.fechaHasta = `${y2}-${perM[5]}-${perM[4]}`;
        meta.periodo = `${MESES[parseInt(perM[2]) - 1]} ${y1}`;
        yearHint = y1;
      }
      const ctaM = lineJoined.match(/(\d{3}-\d{7,9}-\d-\d{2})\s+(SOLES|DOLARES|D\u00d3LARES)/i);
      if (ctaM) { meta.cuenta = ctaM[1]; meta.moneda = /SOLES/i.test(ctaM[2]) ? 'PEN' : 'USD'; }
      if (!meta.titular && /^[A-Z\u00d1][A-Z\u00d1 ]{10,}$/.test(lineJoined) && !/BCP|ESTADO|CUENTA|CODIGO/i.test(lineJoined)) {
        meta.titular = lineJoined.trim();
      }
      const saM = lineJoined.match(/SALDO ANTERIOR[\s\S]*?([\d,]+\.\d{2})\s*$/);
      if (saM && meta.saldoInicial === null) meta.saldoInicial = parseFloat(saM[1].replace(/,/g, ''));
      const totM = lineJoined.match(/TOTAL MOVIMIENTO\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/);
      if (totM) { meta.totCargo = parseFloat(totM[1].replace(/,/g, '')); meta.totAbono = parseFloat(totM[2].replace(/,/g, '')); }
      const sfM = lineJoined.match(/^\s*SALDO\s+([\d,]+\.\d{2})\s*$/);
      if (sfM) meta.saldoFinal = parseFloat(sfM[1].replace(/,/g, ''));

      // Línea de movimiento: arranca con DDMMM DDMMM
      if (items.length < 3) continue;
      const d1 = datePairRe.exec(items[0].str);
      const d2 = datePairRe.exec(items[1].str);
      if (!d1 || !d2) continue;
      const mesCod = MES_MAP[d1[2]] || '01';
      const fechaISO = `${yearHint}-${mesCod}-${d1[1].padStart(2, '0')}`;

      let cargo = 0, abono = 0;
      const descParts = [];
      for (let i = 2; i < items.length; i++) {
        const s = items[i].str.replace(/\s/g, '');
        if (numRe.test(s)) {
          const val = parseFloat(s.replace(/,/g, ''));
          if (items[i].x < xThreshold) cargo = val;
          else abono = val;
        } else {
          descParts.push(items[i].str);
        }
      }
      const descripcion = descParts.join(' ').trim();
      if (!descripcion) continue;
      if (cargo === 0 && abono === 0) continue;

      // Cálculo saldo running
      const prevSaldo = movimientos.length > 0 ? movimientos[movimientos.length - 1].saldo : (meta.saldoInicial || 0);
      const saldo = prevSaldo - cargo + abono;

      movimientos.push({
        fecha: fechaISO,
        descripcion,
        ref: 'RL-' + String(refCounter++).padStart(4, '0'),
        cargo, abono, saldo,
        matchId: null,
      });
    }
  }

  return { ...meta, movimientos };
}

const TODAY_CTB = new Date();
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];

function findCuenta(codigo) { return planContable.find(c => c.codigo === codigo); }

// Agrupa asientos por mes YYYY-MM
function agrupaMesAsientos(asientos) {
  const map = {};
  asientos.forEach(a => {
    const ym = a.fecha.slice(0, 7);
    (map[ym] = map[ym] || []).push(a);
  });
  return map;
}

// Saldo acumulado por cuenta en período
function saldoCuenta(cuentaCodigo, asientos, fechaHasta = null) {
  let saldo = 0;
  asientos.forEach(a => {
    if (fechaHasta && a.fecha > fechaHasta) return;
    a.lineas.forEach(l => {
      if (l.cuenta === cuentaCodigo || l.cuenta.startsWith(cuentaCodigo)) {
        saldo += (l.debe || 0) - (l.haber || 0);
      }
    });
  });
  return saldo;
}

// ═══════════════════════════════════════════════════════════════
// CONTABILIDAD PAGE
// ═══════════════════════════════════════════════════════════════
function ContabilidadPage() {
  const [tab, setTab] = useState('plan');
  const [cuentaSel, setCuentaSel] = useState(null);

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>
      <div className="page-h">
        <div>
          <h1>Contabilidad · PCGE 2020</h1>
          <div className="sub muted">Plan contable · libro diario · conciliación bancaria · cálculo tributario mensual</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <span className="chip blue" style={{ fontSize: 10 }}>{Icon.sparkle({ size: 10 })} Revisado por contador: <b>Pendiente</b></span>
          <button className="tb-btn">{Icon.download({ size: 13 })} Export PLE SUNAT</button>
        </div>
      </div>

      <div className="hstack" style={{ gap: 2, marginBottom: 14 }}>
        {[
          { id: 'plan',     label: 'Plan Contable',       icon: 'book' },
          { id: 'diario',   label: 'Libro Diario',        icon: 'docs' },
          { id: 'bancos',   label: 'Bancos y Conciliación', icon: 'bank' },
          { id: 'fiscal',   label: 'Fiscal (IGV / Renta)', icon: 'scale' },
          { id: 'reportes', label: 'Reportes',            icon: 'trend' },
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

      {tab === 'plan'     && <CtbPlanContableView onSelectCuenta={setCuentaSel} selected={cuentaSel} />}
      {tab === 'diario'   && <CtbLibroDiarioView />}
      {tab === 'bancos'   && <CtbBancosView />}
      {tab === 'fiscal'   && <CtbFiscalView />}
      {tab === 'reportes' && <CtbReportesView />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1. PLAN CONTABLE (árbol jerárquico PCGE)
// ═══════════════════════════════════════════════════════════════
function CtbPlanContableView({ onSelectCuenta, selected }) {
  const [q, setQ] = useState('');
  const [filterClase, setFilterClase] = useState('all');

  // Agrupa por clase
  const porClase = useMemo(() => {
    const m = {};
    planContable.forEach(c => {
      if (q.trim()) {
        const ql = q.toLowerCase();
        if (!c.codigo.includes(ql) && !c.nombre.toLowerCase().includes(ql)) return;
      }
      if (filterClase !== 'all' && String(c.clase) !== filterClase) return;
      (m[c.clase] = m[c.clase] || []).push(c);
    });
    return m;
  }, [q, filterClase]);

  // Cuentas mostradas con saldo
  const cuentasConSaldo = useMemo(() => {
    const m = {};
    planContable.forEach(c => {
      m[c.codigo] = saldoCuenta(c.codigo, asientosContables);
    });
    return m;
  }, []);

  const claseInfo = {
    1: { nombre: 'Activos', color: 'var(--accent)' },
    2: { nombre: 'Activos realizables', color: 'var(--accent)' },
    3: { nombre: 'Activos no corrientes', color: 'var(--accent)' },
    4: { nombre: 'Pasivos', color: 'var(--danger)' },
    5: { nombre: 'Patrimonio', color: '#7C3AED' },
    6: { nombre: 'Gastos por naturaleza', color: 'var(--warn)' },
    7: { nombre: 'Ingresos', color: 'var(--ok)' },
    8: { nombre: 'Saldos intermediarios / Resultados', color: 'var(--ink-3)' },
    9: { nombre: 'Contabilidad analítica', color: 'var(--ink-3)' },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 14 }}>
      <div className="card">
        <div className="card-h">
          <div className="hstack" style={{ gap: 10 }}>
            <h3>Plan Contable General Empresarial</h3>
            <span className="chip blue" style={{ fontSize: 10 }}>PCGE 2020 · {planContable.length} cuentas</span>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <div className="tb-search-wrap" style={{ width: 240, height: 28, maxWidth: 'none' }}>
              <span className="ico">{Icon.search({ size: 12 })}</span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cuenta o código..." style={{ fontSize: 11 }} />
            </div>
            <select value={filterClase} onChange={e => setFilterClase(e.target.value)} className="fin-input" style={{ height: 28, fontSize: 11 }}>
              <option value="all">Todas las clases</option>
              {Object.entries(claseInfo).map(([k, v]) => <option key={k} value={k}>Clase {k} · {v.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="card-b tight" style={{ maxHeight: 560, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Código</th>
                <th>Cuenta</th>
                <th style={{ width: 90 }}>Clase</th>
                <th style={{ width: 110 }}>Grupo</th>
                <th className="num-c" style={{ width: 130 }}>Saldo actual</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(porClase).map(([clase, cuentas]) => {
                const info = claseInfo[clase];
                return (
                  <React.Fragment key={clase}>
                    <tr style={{ background: 'var(--bg-sunken)' }}>
                      <td colSpan="5" style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: info?.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: info?.color, marginRight: 8 }} />
                        Clase {clase} · {info?.nombre}
                      </td>
                    </tr>
                    {cuentas.map(c => {
                      const saldo = cuentasConSaldo[c.codigo] || 0;
                      const isSel = selected?.codigo === c.codigo;
                      return (
                        <tr
                          key={c.codigo}
                          className="row-hover"
                          onClick={() => onSelectCuenta(c)}
                          style={{ cursor: 'pointer', background: isSel ? 'var(--accent-soft)' : undefined }}
                        >
                          <td className="mono text-xs" style={{ paddingLeft: 8 + c.nivel * 14, fontWeight: c.nivel <= 2 ? 700 : 500, color: c.nivel <= 2 ? 'var(--ink)' : 'var(--ink-3)' }}>
                            {c.codigo}
                          </td>
                          <td style={{ fontSize: c.nivel <= 2 ? 12 : 11, fontWeight: c.nivel <= 2 ? 600 : 400 }}>
                            {c.nombre}
                          </td>
                          <td>
                            <span className="chip" style={{ fontSize: 9, background: info?.color + '22', color: info?.color, borderColor: 'transparent' }}>{c.tipo}</span>
                          </td>
                          <td className="text-xs muted">{c.grupo}</td>
                          <td className="num-c mono" style={{ fontSize: 11, fontWeight: c.nivel <= 2 ? 700 : 500, color: saldo >= 0 ? 'var(--ink)' : 'var(--danger)' }}>
                            {saldo !== 0 ? fmtPEN(Math.abs(saldo)) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <CtbCuentaDetail cuenta={selected} onClose={() => onSelectCuenta(null)} />}
    </div>
  );
}

function CtbCuentaDetail({ cuenta, onClose }) {
  const asientosCuenta = useMemo(() => {
    return asientosContables.filter(a =>
      a.lineas.some(l => l.cuenta === cuenta.codigo || l.cuenta.startsWith(cuenta.codigo))
    );
  }, [cuenta.codigo]);

  const saldo = saldoCuenta(cuenta.codigo, asientosContables);
  const totalDebe = asientosCuenta.reduce((s, a) => s + a.lineas.filter(l => l.cuenta === cuenta.codigo || l.cuenta.startsWith(cuenta.codigo)).reduce((ss, l) => ss + (l.debe || 0), 0), 0);
  const totalHaber = asientosCuenta.reduce((s, a) => s + a.lineas.filter(l => l.cuenta === cuenta.codigo || l.cuenta.startsWith(cuenta.codigo)).reduce((ss, l) => ss + (l.haber || 0), 0), 0);

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <div className="mono text-xs" style={{ color: 'var(--ink-3)', fontWeight: 700 }}>{cuenta.codigo}</div>
          <h3 style={{ margin: '2px 0 0', fontSize: 13 }}>{cuenta.nombre}</h3>
        </div>
        <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 12 })}</button>
      </div>
      <div className="card-b">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Total Debe</div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{fmtPEN(totalDebe)}</div>
          </div>
          <div style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Total Haber</div>
            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--warn-ink)' }}>{fmtPEN(totalHaber)}</div>
          </div>
          <div style={{ gridColumn: 'span 2', padding: 10, background: saldo >= 0 ? 'var(--ok-soft)' : 'var(--danger-soft)', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Saldo actual ({saldo >= 0 ? 'Deudor' : 'Acreedor'})</div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: saldo >= 0 ? 'var(--ok)' : 'var(--danger)' }}>{fmtPEN(Math.abs(saldo))}</div>
          </div>
        </div>

        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--line)' }}>
          Movimientos ({asientosCuenta.length})
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {asientosCuenta.slice(0, 30).map(a => {
            const linea = a.lineas.find(l => l.cuenta === cuenta.codigo || l.cuenta.startsWith(cuenta.codigo));
            return (
              <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px dashed var(--line)', fontSize: 11 }}>
                <div className="hstack between">
                  <span className="mono text-xs">{a.fecha}</span>
                  <span className="mono text-xs muted">{a.id}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-2)', margin: '2px 0' }}>{a.glosa}</div>
                <div className="hstack between">
                  <span className="mono text-xs" style={{ color: 'var(--accent)' }}>
                    {linea?.debe ? 'D ' + fmtPEN(linea.debe) : ''}
                  </span>
                  <span className="mono text-xs" style={{ color: 'var(--warn-ink)' }}>
                    {linea?.haber ? 'H ' + fmtPEN(linea.haber) : ''}
                  </span>
                </div>
              </div>
            );
          })}
          {asientosCuenta.length > 30 && <div className="text-xs muted" style={{ padding: '6px 0', textAlign: 'center' }}>+{asientosCuenta.length - 30} asientos más...</div>}
          {asientosCuenta.length === 0 && <div className="text-xs muted" style={{ padding: 20, textAlign: 'center' }}>Sin movimientos en esta cuenta</div>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. LIBRO DIARIO
// ═══════════════════════════════════════════════════════════════
function CtbLibroDiarioView() {
  const [q, setQ] = useState('');
  const [filterMes, setFilterMes] = useState('all');
  const [expanded, setExpanded] = useState({});

  const mesesDisponibles = useMemo(() => {
    const s = new Set();
    asientosContables.forEach(a => s.add(a.fecha.slice(0, 7)));
    return Array.from(s).sort();
  }, []);

  const filtered = useMemo(() => {
    let list = [...asientosContables];
    if (filterMes !== 'all') list = list.filter(a => a.fecha.startsWith(filterMes));
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(a =>
        a.glosa.toLowerCase().includes(ql) ||
        (a.contraparte || '').toLowerCase().includes(ql) ||
        (a.docOrigen || '').toLowerCase().includes(ql) ||
        a.lineas.some(l => l.cuenta.includes(q))
      );
    }
    return list.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [q, filterMes]);

  const totales = useMemo(() => {
    let debe = 0, haber = 0;
    filtered.forEach(a => a.lineas.forEach(l => {
      debe += l.debe || 0;
      haber += l.haber || 0;
    }));
    return { debe, haber, diff: debe - haber };
  }, [filtered]);

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <CtbKPI lbl="Asientos" val={filtered.length} color="var(--accent)" />
        <CtbKPI lbl="Total Debe" val={fmtCompact(totales.debe)} color="var(--accent)" />
        <CtbKPI lbl="Total Haber" val={fmtCompact(totales.haber)} color="var(--warn-ink)" />
        <CtbKPI lbl="Diferencia"
          val={totales.diff === 0 ? '✓ Balanceado' : fmtCompact(Math.abs(totales.diff))}
          color={totales.diff === 0 ? 'var(--ok)' : 'var(--danger)'}
          sub={totales.diff === 0 ? 'Doble partida OK' : 'Revisar'}
        />
      </div>

      <div className="card">
        <div className="card-h">
          <div className="hstack" style={{ gap: 10 }}>
            <h3>Libro Diario</h3>
            <span className="chip blue" style={{ fontSize: 10 }}>{asientosContables.length} asientos totales</span>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <div className="tb-search-wrap" style={{ width: 220, height: 28, maxWidth: 'none' }}>
              <span className="ico">{Icon.search({ size: 12 })}</span>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar glosa, cuenta, doc..." style={{ fontSize: 11 }} />
            </div>
            <select value={filterMes} onChange={e => setFilterMes(e.target.value)} className="fin-input" style={{ height: 28, fontSize: 11 }}>
              <option value="all">Todos los meses</option>
              {mesesDisponibles.map(m => {
                const [y, mm] = m.split('-');
                return <option key={m} value={m}>{MESES[parseInt(mm, 10) - 1]} {y}</option>;
              })}
            </select>
            <button className="tb-btn" style={{ height: 28, fontSize: 11 }}>{Icon.plus({ size: 11 })}Manual</button>
            <button className="tb-btn" style={{ height: 28, fontSize: 11 }}>{Icon.download({ size: 11 })}PLE</button>
          </div>
        </div>
        <div className="card-b tight" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Fecha</th>
                <th style={{ width: 90 }}>N° Asiento</th>
                <th style={{ width: 110 }}>Doc. Origen</th>
                <th>Glosa</th>
                <th className="num-c" style={{ width: 120 }}>Debe</th>
                <th className="num-c" style={{ width: 120 }}>Haber</th>
                <th style={{ width: 120 }}>Estado</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const debe = a.lineas.reduce((s, l) => s + (l.debe || 0), 0);
                const haber = a.lineas.reduce((s, l) => s + (l.haber || 0), 0);
                const isOpen = expanded[a.id];
                return (
                  <React.Fragment key={a.id}>
                    <tr
                      className="row-hover"
                      onClick={() => setExpanded(p => ({ ...p, [a.id]: !p[a.id] }))}
                      style={{ cursor: 'pointer', background: isOpen ? 'var(--bg-sunken)' : undefined }}
                    >
                      <td className="mono text-xs">{a.fecha.slice(5)}</td>
                      <td className="mono text-xs" style={{ fontWeight: 700 }}>{a.id}</td>
                      <td className="mono text-xs muted">{a.docOrigen}</td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{a.glosa}</div>
                        <div className="text-xs muted" style={{ fontSize: 10 }}>{a.tipoDoc} · {a.proyecto}</div>
                      </td>
                      <td className="num-c mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmtPEN(debe)}</td>
                      <td className="num-c mono" style={{ color: 'var(--warn-ink)', fontWeight: 600 }}>{fmtPEN(haber)}</td>
                      <td>
                        {a.status === 'Revisar contador'
                          ? <span className="chip amber" style={{ fontSize: 9 }}>⚠ Revisar</span>
                          : <span className="chip green" style={{ fontSize: 9 }}>✓ Registrado</span>}
                      </td>
                      <td style={{ color: 'var(--ink-4)', textAlign: 'center' }}>{isOpen ? '▾' : '▸'}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan="8" style={{ padding: 0, background: 'var(--bg-sunken)' }}>
                          <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>
                              Líneas del asiento · {a.lineas.length} movimientos
                            </div>
                            <table style={{ background: 'var(--bg-elev)', borderRadius: 4, overflow: 'hidden' }}>
                              <thead>
                                <tr>
                                  <th style={{ width: 80, fontSize: 9 }}>Cuenta</th>
                                  <th style={{ fontSize: 9 }}>Descripción</th>
                                  <th className="num-c" style={{ width: 120, fontSize: 9 }}>Debe</th>
                                  <th className="num-c" style={{ width: 120, fontSize: 9 }}>Haber</th>
                                </tr>
                              </thead>
                              <tbody>
                                {a.lineas.map((l, i) => {
                                  const cta = findCuenta(l.cuenta);
                                  return (
                                    <tr key={i}>
                                      <td className="mono text-xs" style={{ fontWeight: 700, padding: '4px 10px' }}>{l.cuenta}</td>
                                      <td style={{ fontSize: 11, padding: '4px 10px' }}>
                                        {cta?.nombre || '—'}
                                        {l.descripcion && <div className="text-xs muted" style={{ fontSize: 10 }}>{l.descripcion}</div>}
                                      </td>
                                      <td className="num-c mono" style={{ fontSize: 11, padding: '4px 10px', color: l.debe ? 'var(--accent)' : 'var(--ink-4)', fontWeight: l.debe ? 700 : 400 }}>
                                        {l.debe ? fmtPEN(l.debe) : '—'}
                                      </td>
                                      <td className="num-c mono" style={{ fontSize: 11, padding: '4px 10px', color: l.haber ? 'var(--warn-ink)' : 'var(--ink-4)', fontWeight: l.haber ? 700 : 400 }}>
                                        {l.haber ? fmtPEN(l.haber) : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr style={{ background: 'var(--bg-sunken)', fontWeight: 700 }}>
                                  <td colSpan="2" style={{ padding: '4px 10px', fontSize: 10 }}>TOTAL</td>
                                  <td className="num-c mono" style={{ fontSize: 11, padding: '4px 10px' }}>{fmtPEN(debe)}</td>
                                  <td className="num-c mono" style={{ fontSize: 11, padding: '4px 10px' }}>{fmtPEN(haber)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
// 3. BANCOS + CONCILIACIÓN
// ═══════════════════════════════════════════════════════════════
// Helper: genera asiento sintético desde un movimiento de estado cuenta
function synthAsientoFromMov(mov, cuentaPCGE, idx) {
  const isIngreso = mov.abono > 0;
  const monto = isIngreso ? mov.abono : mov.cargo;
  // Inferencia glosa → cuenta contrapartida
  const g = (mov.descripcion || '').toUpperCase();
  let ctaContra = isIngreso ? '759' : '659'; // defaults: otros ingresos / otros gastos
  if (/YAPE/.test(g)) ctaContra = isIngreso ? '759' : '659';
  else if (/MANT|COMISION|ITF/.test(g)) ctaContra = '6732'; // comisiones bancarias
  else if (/RETIRO/.test(g)) ctaContra = '1011'; // caja
  else if (/VEND|WONG|BODEGA|TIENDA|MAX/.test(g)) ctaContra = '6039'; // materiales/suministros menores
  else if (/TRAN\.CEL|TRANSF/.test(g)) ctaContra = isIngreso ? '1212' : '4212';
  else if (/REPUBLICA|PROCESADORA/.test(g)) ctaContra = '6392';

  return {
    id: 'AS-REAL-' + String(idx + 1).padStart(4, '0'),
    fecha: mov.fecha,
    glosa: mov.descripcion,
    docOrigen: mov.ref || '—',
    revisado: true,
    lineas: isIngreso
      ? [
          { cuenta: cuentaPCGE, debe: monto, haber: 0 },
          { cuenta: ctaContra,   debe: 0,     haber: monto },
        ]
      : [
          { cuenta: ctaContra,   debe: monto, haber: 0 },
          { cuenta: cuentaPCGE, debe: 0,     haber: monto },
        ],
  };
}

// ═══════════════════════════════════════════════════════════════
// SIMULACIÓN TUTORIAL · dataset con discrepancias controladas
// Diseñado para que los 4 métodos (aritmético / contable / 4 col / matching)
// arrojen el saldo conciliado correcto = 3,620
//
// Target: saldo libro 2,100 · saldo banco 3,620
// Fórmula: 2100 − 105 (cargos solo banco) + 25 (abonos solo banco)
//                 − 0   (débitos solo libro) + 1600 (créditos solo libro) = 3,620 ✓
// ═══════════════════════════════════════════════════════════════
function buildSimulacionTutorial(cuentaId) {
  const PCGE = BANK_TO_PCGE[cuentaId] || '10411';
  const APERTURA = 4800; // hace que saldo libro = 2100 y saldo banco = 3620

  // Asientos libro auxiliar — lo que la empresa SÍ contabilizó
  const asientos = [
    // Apertura (periodo anterior ya conciliado · fuera del rango abril)
    { id: 'SIM-000', fecha: '2026-03-31', glosa: 'Saldo inicial conciliado (cierre marzo)', docOrigen: 'APERTURA', revisado: true,
      lineas: [{ cuenta: PCGE, debe: APERTURA, haber: 0 }, { cuenta: '591', debe: 0, haber: APERTURA }] },

    // Matches con banco (verde)
    { id: 'SIM-001', fecha: '2026-04-03', glosa: 'Depósito cliente ACME SAC', docOrigen: 'DEP-001', revisado: true,
      lineas: [{ cuenta: PCGE, debe: 1600, haber: 0 }, { cuenta: '1212', debe: 0, haber: 1600 }] },
    { id: 'SIM-002', fecha: '2026-04-06', glosa: 'Retiro efectivo para caja chica', docOrigen: 'RET-001', revisado: true,
      lineas: [{ cuenta: '1011', debe: 1000, haber: 0 }, { cuenta: PCGE, debe: 0, haber: 1000 }] },
    { id: 'SIM-003', fecha: '2026-04-15', glosa: 'Préstamo bancario 30 días', docOrigen: 'PRE-001', revisado: true,
      lineas: [{ cuenta: PCGE, debe: 10000, haber: 0 }, { cuenta: '451', debe: 0, haber: 10000 }] },
    { id: 'SIM-004', fecha: '2026-04-19', glosa: 'Retiro efectivo para planilla', docOrigen: 'RET-002', revisado: true,
      lineas: [{ cuenta: '1011', debe: 14000, haber: 0 }, { cuenta: PCGE, debe: 0, haber: 14000 }] },
    { id: 'SIM-005', fecha: '2026-04-22', glosa: 'Depósito cliente Beta EIRL', docOrigen: 'DEP-002', revisado: true,
      lineas: [{ cuenta: PCGE, debe: 4300, haber: 0 }, { cuenta: '1212', debe: 0, haber: 4300 }] },
    { id: 'SIM-006', fecha: '2026-04-24', glosa: 'Cheque 004 cobrado · proveedor', docOrigen: 'CHQ-004', revisado: true,
      lineas: [{ cuenta: '4212', debe: 2000, haber: 0 }, { cuenta: PCGE, debe: 0, haber: 2000 }] },

    // Solo en libro — cheques girados no cobrados (NO contabilizar, solo identificar)
    { id: 'SIM-007', fecha: '2026-04-06', glosa: 'Cheque 001 girado · Proveedor Gamma', docOrigen: 'CHQ-001', revisado: true,
      lineas: [{ cuenta: '4212', debe: 500, haber: 0 }, { cuenta: PCGE, debe: 0, haber: 500 }] },
    { id: 'SIM-008', fecha: '2026-04-10', glosa: 'Cheque 002 girado · Servicios SA', docOrigen: 'CHQ-002', revisado: true,
      lineas: [{ cuenta: '4212', debe: 400, haber: 0 }, { cuenta: PCGE, debe: 0, haber: 400 }] },

    // Solo en libro — pago nocturno (banco lo verá en mayo)
    { id: 'SIM-009', fecha: '2026-04-30', glosa: 'Pago préstamo (procesado 22:30h)', docOrigen: 'PAG-PRE-001', revisado: true,
      lineas: [{ cuenta: '451', debe: 700, haber: 0 }, { cuenta: PCGE, debe: 0, haber: 700 }] },
  ];

  // Estado de cuenta — lo que el banco reportó
  const movimientos = [
    // Apertura banco
    // Matches con libro (verde)
    { fecha: '2026-04-03', descripcion: 'Depósito cliente ACME SAC', ref: 'DEP-BCO-001', cargo: 0, abono: 1600, saldo: 6400 },
    { fecha: '2026-04-05', descripcion: 'Retiro ventanilla', ref: 'RET-BCO-001', cargo: 1000, abono: 0, saldo: 5400 },

    // Solo banco — notas débito (comisiones)
    { fecha: '2026-04-12', descripcion: 'MANT CUENTA · Comisión uso chequera', ref: 'COM-CHEK', cargo: 20, abono: 0, saldo: 5380 },
    { fecha: '2026-04-12', descripcion: 'IGV Chequera 18%', ref: 'IGV-CHEK', cargo: 4, abono: 0, saldo: 5376 },

    { fecha: '2026-04-15', descripcion: 'Préstamo desembolsado', ref: 'PRE-BCO-001', cargo: 0, abono: 10000, saldo: 15376 },
    { fecha: '2026-04-15', descripcion: 'Comisión Estudio Crédito', ref: 'COM-EST', cargo: 20, abono: 0, saldo: 15356 },

    { fecha: '2026-04-19', descripcion: 'Retiro ventanilla', ref: 'RET-BCO-002', cargo: 14000, abono: 0, saldo: 1356 },
    { fecha: '2026-04-19', descripcion: 'GMF Impuesto Movimientos Financieros 0.4%', ref: 'GMF-001', cargo: 56, abono: 0, saldo: 1300 },

    { fecha: '2026-04-22', descripcion: 'Depósito cliente Beta EIRL', ref: 'DEP-BCO-002', cargo: 0, abono: 4300, saldo: 5600 },
    { fecha: '2026-04-24', descripcion: 'Cheque 004 cobrado', ref: 'CHQ-BCO-004', cargo: 2000, abono: 0, saldo: 3600 },

    // Solo banco — intereses sobregiro + intereses ganados
    { fecha: '2026-04-30', descripcion: 'Intereses Sobregiro', ref: 'INT-SOB', cargo: 5, abono: 0, saldo: 3595 },
    { fecha: '2026-04-30', descripcion: 'Intereses Ganados Cuenta', ref: 'INT-GAN', cargo: 0, abono: 25, saldo: 3620 },
  ];

  const estadoCuenta = {
    id: 'SIM-EST-TUTORIAL',
    cuentaId,
    banco: BANK_TO_PCGE[cuentaId] ? cuentaId.split('-')[0] : 'BCP',
    periodo: 'Abril 2026 · Simulación',
    saldoInicial: APERTURA,
    saldoFinal: 3620,
    fechaDesde: '2026-04-01',
    fechaHasta: '2026-04-30',
    movimientos,
    _simulacion: true,
  };

  return { asientos, estadoCuenta };
}

function CtbBancosView() {
  const [cuentaSel, setCuentaSel] = useState('BCP-SOL');
  const [estadosOverride, setEstadosOverride] = useState({}); // { cuentaId: estadoParseado }
  const [asientosOverride, setAsientosOverride] = useState({}); // { cuentaId: [asientos] }
  const [uploadOpen, setUploadOpen] = useState(false);

  // Mezcla: si hay override para esta cuenta, usa ese; sino, mock
  const cartolaMock = cartolasBancarias.find(c => c.cuentaId === cuentaSel);
  const cartola = estadosOverride[cuentaSel] || cartolaMock;
  const isReal = !!(estadosOverride[cuentaSel] && !estadosOverride[cuentaSel]._simulacion);
  const isSim = !!(estadosOverride[cuentaSel] && estadosOverride[cuentaSel]._simulacion);
  const extraAsientos = asientosOverride[cuentaSel];

  const handleParsed = (parsed) => {
    const cuentaPCGE = BANK_TO_PCGE[cuentaSel] || '10411';
    const withCuentaId = {
      ...parsed,
      cuentaId: cuentaSel,
      id: 'EST-REAL-' + cuentaSel + '-' + Date.now(),
    };

    // Para demo: genera asientos matching TODOS los movimientos MENOS UNO
    // (el mov sin match queda como huérfano para que el usuario use "+ Crear asiento")
    const huérfanoIdx = Math.max(0, parsed.movimientos.length - 1);
    const generados = parsed.movimientos
      .map((mov, i) => (i === huérfanoIdx ? null : synthAsientoFromMov(mov, cuentaPCGE, i)))
      .filter(Boolean);

    setEstadosOverride(prev => ({ ...prev, [cuentaSel]: withCuentaId }));
    setAsientosOverride(prev => ({ ...prev, [cuentaSel]: generados }));
    setUploadOpen(false);
  };

  const handleCrearAsiento = (mov) => {
    const cuentaPCGE = BANK_TO_PCGE[cuentaSel] || '10411';
    const existing = asientosOverride[cuentaSel] || [];
    const nextIdx = existing.length;
    const newAsiento = synthAsientoFromMov(mov, cuentaPCGE, nextIdx + 900); // idx alto para no colisionar
    newAsiento.id = 'AS-MANUAL-' + Date.now().toString().slice(-4);
    setAsientosOverride(prev => ({ ...prev, [cuentaSel]: [...existing, newAsiento] }));
  };

  const clearReal = () => {
    setEstadosOverride(prev => { const cp = { ...prev }; delete cp[cuentaSel]; return cp; });
    setAsientosOverride(prev => { const cp = { ...prev }; delete cp[cuentaSel]; return cp; });
  };

  const handleLoadSimulation = () => {
    const { asientos, estadoCuenta } = buildSimulacionTutorial(cuentaSel);
    setEstadosOverride(prev => ({ ...prev, [cuentaSel]: estadoCuenta }));
    setAsientosOverride(prev => ({ ...prev, [cuentaSel]: asientos }));
  };

  return (
    <div className="vstack" style={{ gap: 14 }}>
      {/* Barra TEST · cargar estado real / simulación tutorial */}
      <div className="hstack" style={{ gap: 8, padding: '10px 14px', background: 'linear-gradient(90deg, rgba(255,165,0,0.08), rgba(59,91,219,0.08))', border: '1px dashed var(--warn)', borderRadius: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--warn-ink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          🧪 Modo test
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1, minWidth: 240 }}>
          {isSim
            ? <><b>Simulación tutorial activa</b> · Saldo libro 2,100 · Saldo banco 3,620 · Los 4 métodos cuadran en 3,620 / 2,020</>
            : <>Cargar simulación con discrepancias controladas <b>o</b> un PDF BCP real (password DNI) para probar conciliación.</>}
        </div>
        {(isReal || isSim) && (
          <button className="tb-btn" onClick={clearReal} style={{ fontSize: 11, color: 'var(--warn-ink)', borderColor: 'var(--warn)' }}>
            {Icon.history({ size: 12 })} Volver al mock
          </button>
        )}
        <button
          className="tb-btn"
          onClick={handleLoadSimulation}
          style={{ background: '#2F5D3A', border: 'none', color: '#fff', fontWeight: 600, fontSize: 12 }}
          title="Dataset con 10 asientos y 11 movs banco · 6 matches + 5 notas débito + 1 NC + 3 cheques pendientes"
        >
          🎓 TEST · Simulación tutorial
        </button>
        <button
          className="tb-btn primary"
          onClick={() => setUploadOpen(true)}
          style={{ background: 'linear-gradient(135deg, #f59e0b, #3B5BDB)', border: 'none', color: '#fff', fontWeight: 600 }}
        >
          {Icon.upload({ size: 13 })} TEST · Cargar PDF BCP real
        </button>
      </div>

      {/* Cuentas bancarias cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {cuentasBancariasBalances.map(c => {
          const realOverride = estadosOverride[c.id];
          return (
            <div
              key={c.id}
              className="card"
              onClick={() => setCuentaSel(c.id)}
              style={{
                cursor: 'pointer', padding: 14,
                borderLeft: `3px solid ${c.borderColor}`,
                background: cuentaSel === c.id ? 'var(--accent-soft)' : undefined,
                position: 'relative',
              }}
            >
              {realOverride && (
                <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 3, background: realOverride._simulacion ? '#2F5D3A' : 'var(--ok)', color: '#fff', fontWeight: 700, fontFamily: 'var(--mono)' }}>
                  {realOverride._simulacion ? '🎓 SIMULACIÓN' : 'PDF REAL'}
                </span>
              )}
              <div className="hstack between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: c.borderColor, textTransform: 'uppercase' }}>
                  {c.banco}
                </span>
                <span className="mono text-xs muted">{BANK_TO_PCGE[c.id]}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.alias}</div>
              <div className="mono text-xs muted" style={{ marginBottom: 8 }}>{c.numero}</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: c.borderColor }}>
                {c.moneda === 'PEN' ? 'S/ ' : '$ '}{c.saldoActual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </div>

      {cartola ? (
        <CtbConciliacionPanel cartola={cartola} isReal={isReal} extraAsientos={extraAsientos} onCrearAsiento={handleCrearAsiento} />
      ) : (
        <div className="card">
          <div className="card-h">
            <h3>Conciliación bancaria</h3>
            <button className="tb-btn primary" onClick={() => setUploadOpen(true)}>{Icon.upload({ size: 13 })} Importar estado de cuenta</button>
          </div>
          <div className="card-b" style={{ textAlign: 'center', padding: 40, color: 'var(--ink-4)' }}>
            Sin estado de cuenta cargado. Sube el PDF mensual del banco para conciliar.
          </div>
        </div>
      )}

      {uploadOpen && <CtbUploadEstadoModal onClose={() => setUploadOpen(false)} onParsed={handleParsed} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD modal · PDF + password → parser → preview → usar
// ═══════════════════════════════════════════════════════════════
function CtbUploadEstadoModal({ onClose, onParsed }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | parsing | success | error
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const handleParse = async () => {
    if (!file) return setError('Selecciona un PDF');
    if (!password) return setError('Ingresa la contraseña (DNI titular)');
    setStatus('parsing'); setError('');
    try {
      const parsed = await parseBcpEstadoCuenta(file, password);
      setPreview(parsed);
      setStatus('success');
    } catch (e) {
      setError(e.message || String(e));
      setStatus('error');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 640, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-elev)', borderRadius: 12, border: '1px solid var(--line)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Cargar estado de cuenta BCP</h3>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--mono)' }}>
              Parser posicional · strip $BOP$ marker · pdf.js con password
            </div>
          </div>
          <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 14 })}</button>
        </div>

        <div style={{ padding: 22 }}>
          {status !== 'success' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Archivo PDF</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ padding: '20px 16px', border: '1px dashed ' + (file ? 'var(--accent)' : 'var(--line)'), borderRadius: 8, background: 'var(--bg-sunken)', cursor: 'pointer', textAlign: 'center', color: file ? 'var(--accent)' : 'var(--ink-3)', fontSize: 12 }}
                >
                  {file
                    ? <><span>{Icon.check({ size: 14 })} {file.name}</span> <span style={{ color: 'var(--ink-4)', fontSize: 11, marginLeft: 8 }}>({(file.size / 1024).toFixed(1)} KB)</span></>
                    : <>{Icon.upload({ size: 14 })} Clic para seleccionar PDF BCP</>}
                </div>
                <input
                  ref={fileRef} type="file" accept=".pdf,.PDF,application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => { setFile(e.target.files[0]); setError(''); }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Contraseña (DNI titular)</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="8 dígitos DNI"
                  onKeyDown={e => e.key === 'Enter' && handleParse()}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-sunken)', fontSize: 13, fontFamily: 'var(--mono)', letterSpacing: '0.08em', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 6, fontSize: 12, marginBottom: 12, border: '1px solid var(--danger)' }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--bg-sunken)', color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button
                  onClick={handleParse}
                  disabled={status === 'parsing'}
                  style={{ flex: 2, padding: '9px 0', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: status === 'parsing' ? 'wait' : 'pointer', opacity: status === 'parsing' ? 0.7 : 1 }}
                >
                  {status === 'parsing' ? '⏳ Parseando PDF...' : '▶ Analizar PDF'}
                </button>
              </div>
            </>
          )}

          {status === 'success' && preview && (
            <>
              <div style={{ padding: 14, background: 'var(--ok-soft)', borderRadius: 8, border: '1px solid var(--ok)', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ok)', marginBottom: 10 }}>
                  ✓ PDF parseado · {preview.movimientos.length} movimientos extraídos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                  <div><strong>Titular:</strong> {preview.titular || '—'}</div>
                  <div><strong>Cuenta:</strong> <span className="mono">{preview.cuenta || '—'}</span></div>
                  <div><strong>Periodo:</strong> {preview.periodo || '—'}</div>
                  <div><strong>Moneda:</strong> {preview.moneda}</div>
                  <div><strong>Saldo inicial:</strong> <span className="mono">{preview.saldoInicial !== null ? preview.saldoInicial.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '—'}</span></div>
                  <div><strong>Saldo final:</strong> <span className="mono">{preview.saldoFinal !== null ? preview.saldoFinal.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '—'}</span></div>
                  <div><strong>Total cargos:</strong> <span className="mono" style={{ color: 'var(--danger)' }}>{preview.totCargo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                  <div><strong>Total abonos:</strong> <span className="mono" style={{ color: 'var(--ok)' }}>{preview.totAbono.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                </div>
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-sunken)', zIndex: 1 }}>
                    <tr style={{ borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Fecha</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Descripción</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Cargo</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Abono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.movimientos.map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{m.fecha}</td>
                        <td style={{ padding: '5px 10px', color: 'var(--ink)' }}>{m.descripcion}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'var(--mono)', color: m.cargo > 0 ? 'var(--danger)' : 'var(--ink-4)' }}>
                          {m.cargo > 0 ? m.cargo.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '—'}
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'var(--mono)', color: m.abono > 0 ? 'var(--ok)' : 'var(--ink-4)' }}>
                          {m.abono > 0 ? m.abono.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setStatus('idle'); setPreview(null); setFile(null); setPassword(''); }} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: '1px solid var(--line)', background: 'var(--bg-sunken)', color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer' }}>
                  ← Otro archivo
                </button>
                <button onClick={() => onParsed(preview)} style={{ flex: 2, padding: '9px 0', borderRadius: 7, border: 'none', background: 'var(--ok)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  ✓ Usar en conciliación
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPERS · Clasificador de mov bancario → categoría contable
// ═══════════════════════════════════════════════════════════════
function classifyMov(mov) {
  const g = (mov.descripcion || '').toUpperCase();
  const esCargo = mov.cargo > 0;
  if (/MANT\.?\s*CUENTA|MANTENIMIENTO|COMISION.*BCO|COMISION.*BANC|COMISION TRF|PORTES|CUOTA MANEJO/.test(g))
    return { cat: 'notaDebito', sub: 'Comisión bancaria', cuenta: '6732' };
  if (/ITF|IMPUESTO.*FINANC|GMF|GRAVAMEN/.test(g))
    return { cat: 'impuesto', sub: 'ITF / GMF', cuenta: '641' };
  if (/INTERES.*SOBREGIRO|SOBREGIRO/.test(g))
    return { cat: 'notaDebito', sub: 'Intereses sobregiro', cuenta: '6732' };
  if (/COMISION.*CREDITO|ESTUDIO.*CREDITO/.test(g))
    return { cat: 'notaDebito', sub: 'Comisión estudio crédito', cuenta: '6732' };
  if (/\bIVA\b|\bIGV\b/.test(g))
    return { cat: 'impuesto', sub: 'IGV retenido', cuenta: '40112' };
  if (/INTERES.*GANAD|RENDIMIENTO|INTERESES A FAVOR/.test(g))
    return { cat: 'notaCredito', sub: 'Intereses ganados', cuenta: '775' };
  if (/CHEQUE/.test(g) && esCargo)
    return { cat: 'cheque', sub: 'Cheque cobrado', cuenta: null };
  if (/DETRACCION|SPOT/.test(g))
    return { cat: 'impuesto', sub: 'Detracción SPOT', cuenta: '4071' };
  if (!esCargo && /DEPOSITO|ABONO|COBRO|RECEP|TRANSF\s*REC|TRF\s*REC/.test(g))
    return { cat: 'deposito', sub: 'Cobro cliente en tránsito', cuenta: '1212' };
  if (/YAPE|PLIN|TRANSF/.test(g))
    return esCargo
      ? { cat: 'notaDebito', sub: 'Transferencia enviada', cuenta: '659' }
      : { cat: 'deposito', sub: 'Transferencia recibida', cuenta: '759' };
  return { cat: 'otro', sub: 'Otro movimiento', cuenta: esCargo ? '659' : '759' };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 1 · ARITMÉTICO — saldo libro ± ajustes = saldo banco
// ═══════════════════════════════════════════════════════════════
// Detecta asientos de libro que explican la diferencia (no requieren nuevo asiento)
// Cheques girados no cobrados y pagos en horario nocturno
function isAsientoEnTransito(a) {
  const g = (a.glosa || '').toUpperCase();
  return /CHEQUE.*GIRAD|GIRAD.*CHEQUE|22:\d{2}|23:\d{2}|NOCTURN|PROCESAD.*\d\d:\d\d/.test(g);
}

// ═══════════════════════════════════════════════════════════════
// SIDE-BY-SIDE compartido · asientos ERP ⇄ movs banco
// Soporta drag-drop: arrastra mov banco → dropea en columna ERP → crea asiento
// ═══════════════════════════════════════════════════════════════
function CtbSideBySide({ cartola, asientosBancarios, matching, onCrearAsiento, maxHeight = 360 }) {
  const asientosMatched = new Set(matching.values());
  const [dragOver, setDragOver] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const idxStr = e.dataTransfer.getData('movIdx');
    if (idxStr === '') return;
    const mov = cartola.movimientos[parseInt(idxStr, 10)];
    if (mov && onCrearAsiento) onCrearAsiento(mov);
  };

  const dropZoneStyle = {
    background: dragOver ? 'var(--accent-soft)' : 'transparent',
    transition: 'background .15s',
    outline: dragOver ? '2px dashed var(--accent)' : 'none',
    outlineOffset: -4,
  };

  return (
    <div style={{ padding: 0, display: 'grid', gridTemplateColumns: '1fr 52px 1fr', gap: 0, borderBottom: '1px solid var(--line)' }}>
      {/* Columna izquierda · ERP Asientos (drop zone) */}
      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={dropZoneStyle}>
        <div style={{ padding: '8px 14px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>ERP · Asientos ({asientosBancarios.length})</span>
          <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600 }}>⇐ suelta aquí</span>
        </div>
        <div style={{ maxHeight, overflowY: 'auto' }}>
          {asientosBancarios.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)', fontSize: 11 }}>Sin asientos · arrastra movs del banco para generar</div>
          )}
          {asientosBancarios.map(a => {
            const matched = asientosMatched.has(a.id);
            const enTransito = !matched && isAsientoEnTransito(a);
            const borderColor = matched ? 'var(--ok)' : enTransito ? 'var(--accent)' : 'var(--warn)';
            const bgColor = matched ? 'transparent' : enTransito ? 'var(--accent-soft)' : 'var(--warn-soft)';
            return (
              <div key={a.id} style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--line)',
                borderLeft: `3px solid ${borderColor}`,
                background: bgColor,
              }} title={enTransito ? 'En tránsito · banco aún no lo ve. No requiere acción · explica la diferencia de saldos.' : ''}>
                <div className="hstack between" style={{ marginBottom: 2 }}>
                  <span className="mono text-xs" style={{ fontWeight: 700 }}>{a.id}</span>
                  <span className="mono text-xs muted">{a.fecha.slice(5)}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{a.glosa}</div>
                <div className="hstack between" style={{ marginTop: 4 }}>
                  <span className="mono text-xs muted">{a.docOrigen}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: a.monto > 0 ? 'var(--ok)' : 'var(--danger)' }}>
                    {a.monto > 0 ? '+' : ''}{fmtPEN(a.monto)}
                  </span>
                </div>
                {!matched && enTransito && (
                  <div className="chip blue" style={{ fontSize: 9, marginTop: 4 }} title="Cheque girado no cobrado o pago en horario nocturno · no requiere asiento nuevo">
                    ⏳ En tránsito · explica diferencia
                  </div>
                )}
                {!matched && !enTransito && (
                  <div className="chip amber" style={{ fontSize: 9, marginTop: 4 }}>Pendiente match</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Centro · flecha drag hint */}
      <div style={{ background: 'var(--bg-sunken)', borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', gap: 6 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase' }}>match</div>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.4 }}>
          <path d="M14 6 L18 10 L14 14" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M6 14 L2 10 L6 6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M2 10 H18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
        </svg>
        <div style={{ fontSize: 8, color: 'var(--ink-4)', textAlign: 'center', lineHeight: 1.2 }}>arrastra →<br/>crea asiento</div>
      </div>

      {/* Columna derecha · Estado de cuenta (draggable) */}
      <div>
        <div style={{ padding: '8px 14px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Estado de cuenta {cartola.banco} ({cartola.movimientos.length})</span>
          <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600 }}>arrastra ⇒</span>
        </div>
        <div style={{ maxHeight, overflowY: 'auto' }}>
          {cartola.movimientos.map((mov, i) => {
            const matched = matching.has(i);
            const amount = mov.cargo > 0 ? -mov.cargo : mov.abono;
            const draggable = !matched && !!onCrearAsiento;
            return (
              <div key={i}
                draggable={draggable}
                onDragStart={(e) => { e.dataTransfer.setData('movIdx', String(i)); setDraggingIdx(i); e.dataTransfer.effectAllowed = 'copy'; }}
                onDragEnd={() => setDraggingIdx(null)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--line)',
                  borderLeft: matched ? '3px solid var(--ok)' : '3px solid var(--danger)',
                  background: draggingIdx === i ? 'var(--accent-soft)' : matched ? 'transparent' : 'var(--danger-soft)',
                  cursor: draggable ? 'grab' : 'default',
                  opacity: draggingIdx === i ? 0.5 : 1,
                  transition: 'opacity .15s',
                }}>
                <div className="hstack between" style={{ marginBottom: 2 }}>
                  <span className="mono text-xs" style={{ fontWeight: 700 }}>{mov.ref}</span>
                  <span className="mono text-xs muted">{mov.fecha.slice(5)}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{mov.descripcion}</div>
                <div className="hstack between" style={{ marginTop: 4 }}>
                  <span className="text-xs muted">Saldo: S/ {(mov.saldo ?? 0).toLocaleString('es-PE')}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: amount > 0 ? 'var(--ok)' : 'var(--danger)' }}>
                    {amount > 0 ? '+' : ''}{fmtPEN(amount)}
                  </span>
                </div>
                {!matched && (
                  <div className="hstack" style={{ gap: 6, marginTop: 4 }}>
                    <span className="chip red" style={{ fontSize: 9 }}>Sin match</span>
                    {draggable && <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>✋ arrástrame</span>}
                    <button
                      className="tb-btn"
                      style={{ height: 20, fontSize: 9, padding: '0 8px', cursor: onCrearAsiento ? 'pointer' : 'not-allowed', opacity: onCrearAsiento ? 1 : 0.5, marginLeft: 'auto' }}
                      disabled={!onCrearAsiento}
                      onClick={(e) => { e.stopPropagation(); onCrearAsiento && onCrearAsiento(mov); }}
                      title="Genera asiento ERP sincronizado con este movimiento"
                    >
                      {Icon.plus({ size: 10 })} Crear asiento
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CtbMetodoAritmetico({ cartola, asientosBancarios, matching, saldoLibro, onCrearAsiento }) {
  const asientosMatched = new Set(matching.values());
  const soloEnBanco = cartola.movimientos.filter((_, i) => !matching.has(i));
  const soloEnLibro = asientosBancarios.filter(a => !asientosMatched.has(a.id));

  const cargosBanco = soloEnBanco.filter(m => m.cargo > 0);
  const abonosBanco = soloEnBanco.filter(m => m.abono > 0);
  const debitosLibro = soloEnLibro.filter(a => a.monto > 0); // entraron al libro, banco no las ve
  const creditosLibro = soloEnLibro.filter(a => a.monto < 0); // salieron del libro, banco no las ve

  const sumCargo = cargosBanco.reduce((s, m) => s + m.cargo, 0);
  const sumAbono = abonosBanco.reduce((s, m) => s + m.abono, 0);
  const sumDeb = debitosLibro.reduce((s, a) => s + a.monto, 0);
  const sumCred = creditosLibro.reduce((s, a) => s + Math.abs(a.monto), 0);

  const saldoCalculado = saldoLibro - sumCargo + sumAbono - sumDeb + sumCred;
  const cuadra = Math.abs(saldoCalculado - cartola.saldoFinal) < 1;

  const Row = ({ lbl, movs, op, total, color }) => (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)' }}>
      <div className="hstack between" style={{ marginBottom: movs.length ? 6 : 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{lbl}</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color }}>{op} {fmtPEN(total)}</span>
      </div>
      {movs.length > 0 && (
        <div style={{ paddingLeft: 14, borderLeft: '2px solid var(--line)', marginTop: 4 }}>
          {movs.map((m, i) => (
            <div key={i} className="hstack between" style={{ padding: '2px 0', fontSize: 11 }}>
              <span style={{ color: 'var(--ink-3)' }}>
                • {m.descripcion || m.glosa} {m.ref ? <span className="mono text-xs muted">· {m.ref}</span> : ''}
              </span>
              <span className="mono" style={{ fontSize: 11 }}>{fmtPEN(m.cargo || m.abono || Math.abs(m.monto))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="card-b" style={{ padding: 0 }}>
      <div style={{ padding: '14px 16px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between">
          <div>
            <div className="mono text-xs muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Método Aritmético</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>Arrastra movs del banco a la columna ERP para crear asientos · abajo se recalcula la fórmula</div>
          </div>
          <span className="chip blue" style={{ fontSize: 10 }}>Uso pyme / reporte gerencia</span>
        </div>
      </div>

      <CtbSideBySide cartola={cartola} asientosBancarios={asientosBancarios} matching={matching} onCrearAsiento={onCrearAsiento} />

      <div style={{ padding: '14px 16px', background: 'var(--accent-soft)', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between">
          <span style={{ fontSize: 13, fontWeight: 700 }}>Saldo final Libro Auxiliar</span>
          <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-ink)' }}>{fmtPEN(saldoLibro)}</span>
        </div>
      </div>

      <Row lbl="(−) Cargos en banco NO en libro" movs={cargosBanco} op="−" total={sumCargo} color="var(--danger)" />
      <Row lbl="(+) Abonos en banco NO en libro" movs={abonosBanco} op="+" total={sumAbono} color="var(--ok)" />
      <Row lbl="(−) Débitos en libro NO en banco" movs={debitosLibro} op="−" total={sumDeb} color="var(--danger)" />
      <Row lbl="(+) Créditos en libro NO en banco" movs={creditosLibro} op="+" total={sumCred} color="var(--ok)" />

      <div style={{ padding: '14px 16px', background: cuadra ? 'var(--ok-soft)' : 'var(--danger-soft)', borderTop: '2px solid ' + (cuadra ? 'var(--ok)' : 'var(--danger)') }}>
        <div className="hstack between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Saldo calculado</span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: cuadra ? 'var(--ok)' : 'var(--danger)' }}>
            {fmtPEN(saldoCalculado)}
          </span>
        </div>
        <div className="hstack between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Saldo real estado cuenta</span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{fmtPEN(cartola.saldoFinal)}</span>
        </div>
        <div style={{ fontSize: 11, color: cuadra ? 'var(--ok)' : 'var(--danger)', fontWeight: 600 }}>
          {cuadra ? '✓ Cuadra · Diferencia < S/ 1.00' : `⚠ No cuadra · Diferencia ${fmtPEN(Math.abs(saldoCalculado - cartola.saldoFinal))}`}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 2 · CONTABLE — secciones formales + asientos sugeridos
// ═══════════════════════════════════════════════════════════════
function CtbMetodoContable({ cartola, asientosBancarios, matching, saldoLibro, onCrearAsiento }) {
  const asientosMatched = new Set(matching.values());
  const soloEnBanco = cartola.movimientos.filter((_, i) => !matching.has(i));
  const soloEnLibro = asientosBancarios.filter(a => !asientosMatched.has(a.id));

  // Clasifica cada mov no conciliado
  const grouped = { notaDebito: [], notaCredito: [], impuesto: [], deposito: [], cheque: [], otro: [] };
  soloEnBanco.forEach(m => {
    const c = classifyMov(m);
    grouped[c.cat].push({ mov: m, cat: c, source: 'banco' });
  });
  // Asientos solo en libro que parecen cheques pendientes o pagos nocturnos
  soloEnLibro.forEach(a => {
    const isCheque = /CHEQUE|CHQ/i.test(a.glosa);
    grouped.cheque.push({ mov: { descripcion: a.glosa, ref: a.docOrigen, cargo: Math.abs(a.monto), abono: 0 }, cat: { cat: 'cheque', sub: isCheque ? 'Cheque pendiente de cobro' : 'Pago no reflejado en banco', cuenta: null }, source: 'libro' });
  });

  const Section = ({ titulo, items, signo, nota, color }) => {
    if (!items.length) return null;
    const total = items.reduce((s, it) => s + (it.mov.cargo || it.mov.abono || 0), 0);
    return (
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between" style={{ marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{titulo}</div>
            {nota && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{nota}</div>}
          </div>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color }}>
            {signo} {fmtPEN(total)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '4px 12px', fontSize: 11 }}>
          {items.map((it, i) => (
            <React.Fragment key={i}>
              <div style={{ color: 'var(--ink-2)' }}>
                <span style={{ color: 'var(--ink-4)' }}>•</span> {it.mov.descripcion}
                {it.mov.ref && <span className="mono text-xs muted" style={{ marginLeft: 6 }}>{it.mov.ref}</span>}
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                {it.cat.cuenta ? 'cta ' + it.cat.cuenta : 'sin contab'}
              </div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                {fmtPEN(it.mov.cargo || it.mov.abono)}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Cálculo saldo final libro tras contabilizar las diferencias
  const sumaDebitoLibro = [...grouped.deposito, ...grouped.notaCredito].reduce((s, it) => s + (it.mov.abono || 0), 0);
  const sumaCreditoLibro = [...grouped.notaDebito, ...grouped.impuesto].reduce((s, it) => s + (it.mov.cargo || 0), 0);
  const saldoLibroAjustado = saldoLibro + sumaDebitoLibro - sumaCreditoLibro;
  // Cheques pendientes y pagos nocturnos no se contabilizan pero explican la diferencia con saldo banco
  const diferenciasNoCont = grouped.cheque.reduce((s, it) => s + (it.mov.cargo || 0), 0);
  const saldoConciliado = saldoLibroAjustado + diferenciasNoCont;
  const cuadra = Math.abs(saldoConciliado - cartola.saldoFinal) < 1;

  return (
    <div className="card-b" style={{ padding: 0 }}>
      <div style={{ padding: '14px 16px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between">
          <div>
            <div className="mono text-xs muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Método Contable</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>Estándar SUNAT · arrastra los huérfanos del banco a la columna ERP y abajo se actualizan las secciones</div>
          </div>
          <span className="chip green" style={{ fontSize: 10 }}>Kelly / auditoría</span>
        </div>
      </div>

      <CtbSideBySide cartola={cartola} asientosBancarios={asientosBancarios} matching={matching} onCrearAsiento={onCrearAsiento} />

      <div style={{ padding: '14px 16px', background: 'var(--accent-soft)', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between">
          <span style={{ fontSize: 13, fontWeight: 700 }}>Saldo libro auxiliar (inicial)</span>
          <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{fmtPEN(saldoLibro)}</span>
        </div>
      </div>

      <Section titulo="Notas débito no contabilizadas" nota="Cobros del banco → gasto para la empresa"
        items={grouped.notaDebito} signo="−" color="var(--danger)" />
      <Section titulo="Impuestos no contabilizados" nota="ITF / GMF / IVA cobrados por el banco"
        items={grouped.impuesto} signo="−" color="var(--danger)" />
      <Section titulo="Notas crédito no contabilizadas" nota="Abonos del banco → ingreso para la empresa"
        items={grouped.notaCredito} signo="+" color="var(--ok)" />
      <Section titulo="Depósitos en tránsito" nota="Cobros de clientes ya en banco, no contabilizados"
        items={grouped.deposito} signo="+" color="var(--ok)" />
      <Section titulo="Cheques pendientes / pagos nocturnos" nota="No se contabilizan · solo se identifican como soporte"
        items={grouped.cheque} signo="○" color="var(--warn-ink)" />
      <Section titulo="Otros movimientos" items={grouped.otro} signo="±" color="var(--ink-3)" />

      <div style={{ padding: '14px 16px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Saldo libro tras contabilizar ajustes</span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{fmtPEN(saldoLibroAjustado)}</span>
        </div>
        <div className="hstack between" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>(+) Diferencias identificadas no contab.</span>
          <span className="mono" style={{ fontSize: 13 }}>{fmtPEN(diferenciasNoCont)}</span>
        </div>
      </div>

      <div style={{ padding: '14px 16px', background: cuadra ? 'var(--ok-soft)' : 'var(--warn-soft)', borderTop: '2px solid ' + (cuadra ? 'var(--ok)' : 'var(--warn)') }}>
        <div className="hstack between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Saldo conciliado</span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: cuadra ? 'var(--ok)' : 'var(--warn-ink)' }}>
            {fmtPEN(saldoConciliado)}
          </span>
        </div>
        <div className="hstack between" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>Saldo estado cuenta</span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{fmtPEN(cartola.saldoFinal)}</span>
        </div>
        <div style={{ fontSize: 11, color: cuadra ? 'var(--ok)' : 'var(--warn-ink)', fontWeight: 600 }}>
          {cuadra ? '✓ Conciliación exitosa · soporte listo para auditoría' : `⚠ Diferencia residual ${fmtPEN(Math.abs(saldoConciliado - cartola.saldoFinal))} · revisar cheques pendientes o depósitos en tránsito no identificados`}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 4 · CUATRO COLUMNAS — saldos ajustados (SAP / Oracle style)
// ═══════════════════════════════════════════════════════════════
function CtbMetodoCuatroCol({ cartola, asientosBancarios, matching, saldoLibro, onCrearAsiento }) {
  const asientosMatched = new Set(matching.values());
  const soloEnBanco = cartola.movimientos.filter((_, i) => !matching.has(i));
  const soloEnLibro = asientosBancarios.filter(a => !asientosMatched.has(a.id));

  // Cada ajuste afecta: libro (+/-), banco (+/-) y su signo en débito/crédito
  // Ajustes que modifican LIBRO:
  const ajustesLibro = [];
  soloEnBanco.forEach(m => {
    const c = classifyMov(m);
    if (c.cat === 'cheque') return;
    if (m.cargo > 0) ajustesLibro.push({ glosa: m.descripcion, ref: m.ref, lado: 'libro', debito: 0, credito: m.cargo, cat: c.sub });
    if (m.abono > 0) ajustesLibro.push({ glosa: m.descripcion, ref: m.ref, lado: 'libro', debito: m.abono, credito: 0, cat: c.sub });
  });
  // Ajustes que modifican BANCO (conocidos como "cheques pendientes + pagos nocturnos")
  const ajustesBanco = [];
  soloEnLibro.forEach(a => {
    ajustesBanco.push({
      glosa: a.glosa, ref: a.docOrigen, lado: 'banco',
      debito: a.monto < 0 ? Math.abs(a.monto) : 0,
      credito: a.monto > 0 ? a.monto : 0,
      cat: a.monto < 0 ? 'Cheque pendiente (banco −)' : 'Depósito pendiente (banco +)',
    });
  });
  soloEnBanco.filter(m => classifyMov(m).cat === 'cheque').forEach(m => {
    ajustesBanco.push({ glosa: m.descripcion, ref: m.ref, lado: 'banco', debito: m.cargo || 0, credito: m.abono || 0, cat: 'Cheque banco' });
  });

  const totDebLibro = ajustesLibro.reduce((s, a) => s + a.debito, 0);
  const totCredLibro = ajustesLibro.reduce((s, a) => s + a.credito, 0);
  const totDebBanco = ajustesBanco.reduce((s, a) => s + a.debito, 0);
  const totCredBanco = ajustesBanco.reduce((s, a) => s + a.credito, 0);

  const saldoLibroFinal = saldoLibro + totDebLibro - totCredLibro;
  const saldoBancoFinal = cartola.saldoFinal + totDebBanco - totCredBanco;
  const cuadra = Math.abs(saldoLibroFinal - saldoBancoFinal) < 1;

  const Cell = ({ v, color }) => (
    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, color: color || 'var(--ink)' }}>
      {v > 0 ? fmtPEN(v) : v < 0 ? '-' + fmtPEN(Math.abs(v)) : '—'}
    </td>
  );

  return (
    <div className="card-b" style={{ padding: 0 }}>
      <div style={{ padding: '14px 16px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between">
          <div>
            <div className="mono text-xs muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Método Cuatro Columnas</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>SAP / Oracle style · arrastra huérfanos para generar asientos y la tabla de abajo se recalcula</div>
          </div>
          <span className="chip amber" style={{ fontSize: 10 }}>Tesorería corporativa</span>
        </div>
      </div>

      <CtbSideBySide cartola={cartola} asientosBancarios={asientosBancarios} matching={matching} onCrearAsiento={onCrearAsiento} />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg-sunken)', borderBottom: '2px solid var(--line)' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Concepto</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>S. Libro</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>S. Banco</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ok)' }}>Débito</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--danger)' }}>Crédito</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: 'var(--accent-soft)', borderBottom: '1px solid var(--line)', fontWeight: 700 }}>
              <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>Saldo inicial</td>
              <Cell v={saldoLibro} />
              <Cell v={cartola.saldoFinal} />
              <Cell v={0} />
              <Cell v={0} />
            </tr>
            {ajustesLibro.length > 0 && (
              <tr><td colSpan={5} style={{ padding: '6px 12px', background: 'var(--bg-sunken)', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Ajustes al libro auxiliar</td></tr>
            )}
            {ajustesLibro.map((a, i) => (
              <tr key={'l' + i} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '5px 12px', fontSize: 11 }}>
                  {a.glosa}
                  <div style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{a.cat} {a.ref && '· ' + a.ref}</div>
                </td>
                <td style={{ padding: '5px 12px', textAlign: 'right', fontSize: 10, color: 'var(--ink-4)' }}>libro</td>
                <td></td>
                <Cell v={a.debito} color="var(--ok)" />
                <Cell v={a.credito} color="var(--danger)" />
              </tr>
            ))}
            {ajustesBanco.length > 0 && (
              <tr><td colSpan={5} style={{ padding: '6px 12px', background: 'var(--bg-sunken)', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Ajustes al estado cuenta banco</td></tr>
            )}
            {ajustesBanco.map((a, i) => (
              <tr key={'b' + i} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '5px 12px', fontSize: 11 }}>
                  {a.glosa}
                  <div style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{a.cat} {a.ref && '· ' + a.ref}</div>
                </td>
                <td></td>
                <td style={{ padding: '5px 12px', textAlign: 'right', fontSize: 10, color: 'var(--ink-4)' }}>banco</td>
                <Cell v={a.debito} color="var(--ok)" />
                <Cell v={a.credito} color="var(--danger)" />
              </tr>
            ))}
            <tr style={{ background: 'var(--bg-sunken)', borderTop: '2px solid var(--line)', borderBottom: '1px solid var(--line)', fontWeight: 700 }}>
              <td style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700 }}>Subtotal ajustes</td>
              <td></td>
              <td></td>
              <Cell v={totDebLibro + totDebBanco} color="var(--ok)" />
              <Cell v={totCredLibro + totCredBanco} color="var(--danger)" />
            </tr>
            <tr style={{ background: cuadra ? 'var(--ok-soft)' : 'var(--warn-soft)', borderTop: '2px solid ' + (cuadra ? 'var(--ok)' : 'var(--warn)') }}>
              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700 }}>Saldo conciliado / ajustado</td>
              <Cell v={saldoLibroFinal} />
              <Cell v={saldoBancoFinal} />
              <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: cuadra ? 'var(--ok)' : 'var(--warn-ink)' }}>
                {cuadra ? '✓ Convergencia OK' : '⚠ Δ ' + fmtPEN(Math.abs(saldoLibroFinal - saldoBancoFinal))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 7 · OPEN BANKING / CONCILIACIÓN CONTINUA (mock)
// ═══════════════════════════════════════════════════════════════
function CtbOpenBanking({ cartola }) {
  const conectores = [
    { banco: 'BCP', status: 'conectado', ultimoSync: 'hace 12s', movsHoy: 14, color: 'var(--ok)', api: 'https://api.bcp.com.pe/openbank/v1/accounts (mock)' },
    { banco: 'BBVA', status: 'conectado', ultimoSync: 'hace 34s', movsHoy: 6, color: 'var(--ok)', api: 'https://connect.bbva.pe/psd2/accounts (mock)' },
    { banco: 'Interbank', status: 'pendiente_convenio', ultimoSync: '—', movsHoy: 0, color: 'var(--warn)', api: 'pendiente firma convenio bilateral' },
    { banco: 'Scotiabank', status: 'desconectado', ultimoSync: '—', movsHoy: 0, color: 'var(--danger)', api: 'no disponible · revisar credenciales OAuth2' },
  ];

  const now = new Date();
  const liveMovs = [
    { ts: new Date(now - 45 * 1000), banco: 'BCP', glosa: 'TRF RECEP RANSA COMERCIAL', monto: 48200, tipo: 'abono' },
    { ts: new Date(now - 2 * 60 * 1000), banco: 'BBVA', glosa: 'COMISION TRF INTERBANCARIA', monto: 8.50, tipo: 'cargo' },
    { ts: new Date(now - 4 * 60 * 1000), banco: 'BCP', glosa: 'PAGO YAPE a 194772', monto: 12.00, tipo: 'cargo' },
    { ts: new Date(now - 7 * 60 * 1000), banco: 'BCP', glosa: 'DEPOSITO BELCORP SA', monto: 124000, tipo: 'abono' },
    { ts: new Date(now - 15 * 60 * 1000), banco: 'BBVA', glosa: 'MANT CTA CTE MES', monto: 18.00, tipo: 'cargo' },
  ];

  const fmtTime = (d) => {
    const s = Math.floor((now - d) / 1000);
    if (s < 60) return `hace ${s}s`;
    const m = Math.floor(s / 60);
    return `hace ${m}min`;
  };

  return (
    <div className="card-b" style={{ padding: 0 }}>
      <div style={{ padding: '14px 16px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between">
          <div>
            <div className="hstack" style={{ gap: 6 }}>
              <div className="mono text-xs muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Conciliación Continua</div>
              <span className="chip red" style={{ fontSize: 9 }}>BETA · MOCK</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>Conectores bancarios vía Open Banking · PSD2 / API directa</div>
          </div>
          <div className="hstack" style={{ gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)', animation: 'pulse 2s ease-in-out infinite' }} />
            <span className="mono text-xs" style={{ color: 'var(--ok)', fontWeight: 600 }}>2 / 4 conectados</span>
          </div>
        </div>
      </div>

      {/* Warning producción */}
      <div style={{ padding: '12px 16px', background: 'var(--warn-soft)', borderBottom: '1px solid var(--warn)', fontSize: 11, color: 'var(--warn-ink)', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Funcionalidad en prototipo · no operativa en producción</div>
        En producción requiere: (1) convenio bilateral con cada banco · (2) implementación <b>API PSD2 Perú</b> (reglamentación SBS proyectada <span className="mono">2026-2027</span>) · (3) certificación eIDAS / firma digital RENIEC para OAuth2 bancario · (4) endpoint backend intermediario (no se puede llamar APIs bancarias directo desde browser por CORS + seguridad). Los datos mostrados son mock local.
      </div>

      {/* Grid conectores */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, borderBottom: '1px solid var(--line)' }}>
        {conectores.map(c => (
          <div key={c.banco} style={{ padding: 12, background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, borderLeft: `3px solid ${c.color}` }}>
            <div className="hstack between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{c.banco}</span>
              <span className="hstack" style={{ gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
                <span className="mono" style={{ fontSize: 9, textTransform: 'uppercase', color: c.color, fontWeight: 700 }}>
                  {c.status === 'conectado' ? 'conectado' : c.status === 'pendiente_convenio' ? 'pendiente' : 'off'}
                </span>
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginBottom: 6 }}>
              sync: {c.ultimoSync}
            </div>
            <div className="hstack between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>movs hoy</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{c.movsHoy}</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', wordBreak: 'break-all', lineHeight: 1.4 }}>
              {c.api}
            </div>
          </div>
        ))}
      </div>

      {/* Live feed */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Feed tiempo real</div>
          <span className="chip green" style={{ fontSize: 9 }}>● LIVE</span>
        </div>
        <div className="vstack" style={{ gap: 6 }}>
          {liveMovs.map((m, i) => {
            const cat = classifyMov(m);
            return (
              <div key={i} style={{
                padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 6,
                borderLeft: `3px solid ${m.tipo === 'abono' ? 'var(--ok)' : 'var(--danger)'}`,
                display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center',
              }}>
                <span className="mono text-xs muted" style={{ minWidth: 70 }}>{fmtTime(m.ts)}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{m.glosa}</div>
                  <div className="mono text-xs muted">{m.banco} · cat: <span style={{ color: 'var(--accent)' }}>{cat.sub}</span> · sugiere cta {cat.cuenta || '—'}</div>
                </div>
                <span className="chip blue" style={{ fontSize: 9 }}>auto-match intentando</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: m.tipo === 'abono' ? 'var(--ok)' : 'var(--danger)' }}>
                  {m.tipo === 'abono' ? '+' : '−'}{fmtPEN(m.monto)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap */}
      <div style={{ padding: '14px 16px', background: 'var(--bg-sunken)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)' }}>Roadmap producción</div>
        <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7 }}>
          <div><span className="mono">Q3 2026</span> · Backend intermediario Node/Supabase con job cron de sync bancario cada 5min</div>
          <div><span className="mono">Q4 2026</span> · Convenio API BCP (empresas corporativas, archivo MT940 diario)</div>
          <div><span className="mono">Q1 2027</span> · Convenio API BBVA + Interbank (PSD2 peruana si sale)</div>
          <div><span className="mono">Q2 2027</span> · ML matching (aprende patrones históricos de glosas → cuentas PCGE)</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONCILIACIÓN — selector de método + body
// ═══════════════════════════════════════════════════════════════
function CtbConciliacionPanel({ cartola, isReal, extraAsientos, onCrearAsiento }) {
  const cuentaPCGE = BANK_TO_PCGE[cartola.cuentaId];
  const [metodo, setMetodo] = useState('rules'); // rules | aritmetico | contable | columnas | continuo

  // Base: si hay extraAsientos (PDF real cargado) → usa esos. Sino, los globales.
  const asientosBase = extraAsientos && extraAsientos.length > 0 ? extraAsientos : asientosContables;

  // Asientos que tocan esta cuenta bancaria en el período
  const asientosBancarios = useMemo(() => {
    return asientosBase.filter(a => {
      if (a.fecha < cartola.fechaDesde || a.fecha > cartola.fechaHasta) return false;
      return a.lineas.some(l => l.cuenta === cuentaPCGE || l.cuenta.startsWith(cuentaPCGE));
    }).map(a => {
      const linea = a.lineas.find(l => l.cuenta === cuentaPCGE || l.cuenta.startsWith(cuentaPCGE));
      return {
        ...a,
        monto: (linea?.debe || 0) - (linea?.haber || 0),
        tipo: linea?.debe ? 'abono' : 'cargo',
      };
    });
  }, [cartola, cuentaPCGE, asientosBase]);

  // Matching: asiento vs movimiento cartola
  const matching = useMemo(() => {
    // Greedy con prioridad por fecha: cada asiento solo puede matchear UNA vez.
    // Preferencia: fecha exacta → ±1d → ±2d. Tolerancia monto < 0.01 (antes < 1).
    const map = new Map(); // cartolaMovIdx → asientoId
    const consumidos = new Set(); // asientoIds ya emparejados

    const intentaMatch = (mov, i, maxDiffDays) => {
      if (map.has(i)) return;
      const amount = mov.cargo > 0 ? -mov.cargo : mov.abono;
      const mDate = new Date(mov.fecha);
      // Busca todos candidatos + ordena por cercanía de fecha
      const candidatos = asientosBancarios
        .filter(a => !consumidos.has(a.id))
        .filter(a => Math.abs(Math.abs(a.monto) - Math.abs(amount)) < 0.01)
        .map(a => {
          const diffDays = Math.abs((mDate - new Date(a.fecha)) / (1000 * 60 * 60 * 24));
          return { a, diffDays };
        })
        .filter(x => x.diffDays <= maxDiffDays)
        .sort((x, y) => x.diffDays - y.diffDays);
      if (candidatos.length > 0) {
        const winner = candidatos[0].a;
        map.set(i, winner.id);
        consumidos.add(winner.id);
      }
    };

    // Pase 1: fecha exacta
    cartola.movimientos.forEach((mov, i) => intentaMatch(mov, i, 0));
    // Pase 2: ±1 día
    cartola.movimientos.forEach((mov, i) => intentaMatch(mov, i, 1));
    // Pase 3: ±2 días
    cartola.movimientos.forEach((mov, i) => intentaMatch(mov, i, 2));

    return map;
  }, [cartola, asientosBancarios]);

  const conciliadasCount = matching.size;
  const soloBanco = cartola.movimientos.length - conciliadasCount;
  const asientosMatched = new Set(matching.values());
  const soloErp = asientosBancarios.filter(a => !asientosMatched.has(a.id)).length;

  // Saldo libro al corte: saldoCuenta del PCGE hasta fechaHasta
  const saldoLibro = useMemo(() => saldoCuenta(cuentaPCGE, asientosBase, cartola.fechaHasta), [cuentaPCGE, asientosBase, cartola.fechaHasta]);

  // Selector de método
  const metodos = [
    { id: 'rules', lbl: 'Matching IA', sub: 'Rule-based (activo)', icon: 'sparkle' },
    { id: 'aritmetico', lbl: 'Aritmético', sub: 'Método 1', icon: 'compare' },
    { id: 'contable', lbl: 'Contable', sub: 'Método 2 · SUNAT', icon: 'book' },
    { id: 'columnas', lbl: '4 Columnas', sub: 'Método 4 · ERP style', icon: 'grip' },
    { id: 'continuo', lbl: 'Continuo', sub: 'Método 7 · Beta', icon: 'cloud' },
  ];

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <CtbKPI lbl="Saldo banco" val={fmtCompact(cartola.saldoFinal)} color="var(--accent)" />
        <CtbKPI lbl="Conciliadas" val={conciliadasCount + ' / ' + cartola.movimientos.length} color="var(--ok)" sub={Math.round(conciliadasCount/cartola.movimientos.length*100)+'% match auto'} />
        <CtbKPI lbl="Solo banco" val={soloBanco} color="var(--danger)" sub="Crear asiento" />
        <CtbKPI lbl="Solo ERP" val={soloErp} color="var(--warn)" sub="Verificar estado cuenta" />
      </div>

      <div className="card">
        <div className="card-h" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3>
              Conciliación · {cartola.banco} {cartola.periodo}
              {isReal && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, background: 'var(--ok)', color: '#fff', fontWeight: 700, marginLeft: 8, fontFamily: 'var(--mono)' }}>PDF REAL</span>}
            </h3>
            <div className="text-xs muted" style={{ marginTop: 2 }}>
              {cartola.fechaDesde} → {cartola.fechaHasta} · Saldo inicial {fmtPEN(cartola.saldoInicial)} · Saldo final {fmtPEN(cartola.saldoFinal)}
            </div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            <button className="tb-btn" style={{ height: 28, fontSize: 11 }}>{Icon.upload({ size: 11 })}Re-importar</button>
            <button className="tb-btn primary" style={{ height: 28, fontSize: 11 }}>{Icon.check({ size: 11 })}Confirmar conciliación</button>
          </div>
        </div>

        {/* Selector de método · tab bar */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--line)', overflowX: 'auto' }}>
          {metodos.map(m => (
            <button key={m.id} onClick={() => setMetodo(m.id)}
              style={{
                padding: '10px 14px', fontSize: 12, fontWeight: 500,
                background: metodo === m.id ? 'var(--bg-elev)' : 'transparent',
                border: 'none',
                borderBottom: '2px solid ' + (metodo === m.id ? 'var(--accent)' : 'transparent'),
                color: metodo === m.id ? 'var(--ink)' : 'var(--ink-3)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                whiteSpace: 'nowrap',
              }}>
              <span style={{ opacity: 0.8 }}>{Icon[m.icon]({ size: 13 })}</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600 }}>{m.lbl}</div>
                <div className="mono text-xs muted" style={{ fontSize: 9 }}>{m.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {metodo === 'aritmetico' && <CtbMetodoAritmetico cartola={cartola} asientosBancarios={asientosBancarios} matching={matching} saldoLibro={saldoLibro} onCrearAsiento={onCrearAsiento} />}
        {metodo === 'contable' && <CtbMetodoContable cartola={cartola} asientosBancarios={asientosBancarios} matching={matching} saldoLibro={saldoLibro} onCrearAsiento={onCrearAsiento} />}
        {metodo === 'columnas' && <CtbMetodoCuatroCol cartola={cartola} asientosBancarios={asientosBancarios} matching={matching} saldoLibro={saldoLibro} onCrearAsiento={onCrearAsiento} />}
        {metodo === 'continuo' && <CtbOpenBanking cartola={cartola} />}

        {metodo === 'rules' && (
        <div className="card-b" style={{ padding: 0, display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 0 }}>
          {/* Columna izquierda: ERP */}
          <div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-3)' }}>
              ERP · Asientos ({asientosBancarios.length})
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {asientosBancarios.map(a => {
                const matched = asientosMatched.has(a.id);
                return (
                  <div key={a.id} style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--line)',
                    borderLeft: matched ? '3px solid var(--ok)' : '3px solid var(--warn)',
                    background: matched ? 'transparent' : 'var(--warn-soft)',
                  }}>
                    <div className="hstack between" style={{ marginBottom: 2 }}>
                      <span className="mono text-xs" style={{ fontWeight: 700 }}>{a.id}</span>
                      <span className="mono text-xs muted">{a.fecha.slice(5)}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{a.glosa}</div>
                    <div className="hstack between" style={{ marginTop: 4 }}>
                      <span className="mono text-xs muted">{a.docOrigen}</span>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: a.monto > 0 ? 'var(--ok)' : 'var(--danger)' }}>
                        {a.monto > 0 ? '+' : ''}{fmtPEN(a.monto)}
                      </span>
                    </div>
                    {!matched && <div className="chip amber" style={{ fontSize: 9, marginTop: 4 }}>Pendiente match</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna centro: flechas matching */}
          <div style={{ background: 'var(--bg-sunken)', borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)', textAlign: 'center', padding: '8px 0', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
            match
          </div>

          {/* Columna derecha: Cartola */}
          <div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-3)' }}>
              Estado de cuenta {cartola.banco} ({cartola.movimientos.length})
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {cartola.movimientos.map((mov, i) => {
                const matched = matching.has(i);
                const amount = mov.cargo > 0 ? -mov.cargo : mov.abono;
                return (
                  <div key={i} style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--line)',
                    borderLeft: matched ? '3px solid var(--ok)' : '3px solid var(--danger)',
                    background: matched ? 'transparent' : 'var(--danger-soft)',
                  }}>
                    <div className="hstack between" style={{ marginBottom: 2 }}>
                      <span className="mono text-xs" style={{ fontWeight: 700 }}>{mov.ref}</span>
                      <span className="mono text-xs muted">{mov.fecha.slice(5)}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{mov.descripcion}</div>
                    <div className="hstack between" style={{ marginTop: 4 }}>
                      <span className="text-xs muted">Saldo: S/ {mov.saldo.toLocaleString('es-PE')}</span>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: amount > 0 ? 'var(--ok)' : 'var(--danger)' }}>
                        {amount > 0 ? '+' : ''}{fmtPEN(amount)}
                      </span>
                    </div>
                    {!matched && (
                      <div className="hstack" style={{ gap: 6, marginTop: 4 }}>
                        <span className="chip red" style={{ fontSize: 9 }}>Sin match</span>
                        <button
                          className="tb-btn"
                          style={{ height: 20, fontSize: 9, padding: '0 8px', cursor: onCrearAsiento ? 'pointer' : 'not-allowed', opacity: onCrearAsiento ? 1 : 0.5 }}
                          disabled={!onCrearAsiento}
                          onClick={(e) => { e.stopPropagation(); onCrearAsiento && onCrearAsiento(mov); }}
                          title="Genera asiento ERP sincronizado con este movimiento"
                        >
                          {Icon.plus({ size: 10 })} Crear asiento
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. FISCAL (IGV + Renta)
// ═══════════════════════════════════════════════════════════════
function CtbFiscalView() {
  const mesesDisponibles = useMemo(() => {
    const s = new Set();
    asientosContables.forEach(a => s.add(a.fecha.slice(0, 7)));
    return Array.from(s).sort();
  }, []);

  const [mesSel, setMesSel] = useState(mesesDisponibles[mesesDisponibles.length - 1] || '2026-04');
  const [metodoRenta, setMetodoRenta] = useState('coeficiente'); // 'coeficiente' | 'fijo'
  const [coeficiente, setCoeficiente] = useState(0.0172); // mock valor

  // Cálculos IGV del mes
  const stats = useMemo(() => {
    const asientosMes = asientosContables.filter(a => a.fecha.startsWith(mesSel));
    let igvVentas = 0, igvCompras = 0, ventasGravadas = 0, comprasGravadas = 0;
    let detracciones = 0, renta4ta = 0, renta5ta = 0, essalud = 0;

    asientosMes.forEach(a => {
      a.lineas.forEach(l => {
        if (l.cuenta === '40111') igvVentas += (l.haber || 0) - (l.debe || 0);
        if (l.cuenta === '40112') igvCompras += (l.debe || 0) - (l.haber || 0);
        if (l.cuenta === '40114') detracciones += (l.haber || 0) - (l.debe || 0);
        if (l.cuenta === '40172') renta4ta += (l.haber || 0) - (l.debe || 0);
        if (l.cuenta === '40173') renta5ta += (l.haber || 0) - (l.debe || 0);
        if (l.cuenta === '4031') essalud += (l.haber || 0) - (l.debe || 0);
        if (l.cuenta.startsWith('70')) ventasGravadas += (l.haber || 0) - (l.debe || 0);
        if (l.cuenta.startsWith('60') || l.cuenta.startsWith('63')) comprasGravadas += (l.debe || 0) - (l.haber || 0);
      });
    });

    const igvPagar = Math.max(0, igvVentas - igvCompras);
    const ingresosNetos = ventasGravadas;
    const rentaCoef = ingresosNetos * coeficiente;
    const rentaFija = ingresosNetos * 0.015;
    const rentaPagar = metodoRenta === 'coeficiente' ? rentaCoef : rentaFija;

    return {
      asientosMes: asientosMes.length,
      igvVentas, igvCompras, igvPagar,
      ventasGravadas, comprasGravadas,
      ingresosNetos, rentaCoef, rentaFija, rentaPagar,
      detracciones, renta4ta, renta5ta, essalud,
    };
  }, [mesSel, metodoRenta, coeficiente]);

  const [y, m] = mesSel.split('-');
  const nombreMes = `${MESES[parseInt(m, 10) - 1]} ${y}`;

  return (
    <div className="vstack" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-h">
          <h3>Liquidación tributaria · {nombreMes}</h3>
          <select value={mesSel} onChange={e => setMesSel(e.target.value)} className="fin-input" style={{ height: 28, fontSize: 11 }}>
            {mesesDisponibles.map(m => {
              const [y2, mm2] = m.split('-');
              return <option key={m} value={m}>{MESES[parseInt(mm2, 10) - 1]} {y2}</option>;
            })}
          </select>
        </div>

        <div className="card-b">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* IGV */}
            <div style={{ padding: 16, background: 'var(--bg-sunken)', borderRadius: 8, borderLeft: '4px solid var(--accent)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                IGV del mes
              </div>
              <CtbLineaTributo lbl="IGV ventas (débito fiscal)" val={stats.igvVentas} color="var(--accent)" />
              <CtbLineaTributo lbl="IGV compras (crédito fiscal)" val={-stats.igvCompras} color="var(--warn-ink)" />
              <div style={{ borderTop: '2px solid var(--accent)', marginTop: 8, paddingTop: 8 }}>
                <CtbLineaTributo lbl="IGV a pagar SUNAT" val={stats.igvPagar} color="var(--danger)" bold />
              </div>
              <div className="text-xs muted" style={{ marginTop: 8, fontSize: 10 }}>
                Ventas gravadas: {fmtPEN(stats.ventasGravadas)} · Compras gravadas: {fmtPEN(stats.comprasGravadas)}
              </div>
            </div>

            {/* Renta */}
            <div style={{ padding: 16, background: 'var(--bg-sunken)', borderRadius: 8, borderLeft: '4px solid var(--warn)' }}>
              <div className="hstack between" style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--warn-ink)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Impuesto a la Renta 3ra
                </div>
                <div className="tw-seg" style={{ height: 22 }}>
                  <button className={metodoRenta === 'coeficiente' ? 'on' : ''} onClick={() => setMetodoRenta('coeficiente')} style={{ fontSize: 9, padding: '0 6px' }}>Coef.</button>
                  <button className={metodoRenta === 'fijo' ? 'on' : ''} onClick={() => setMetodoRenta('fijo')} style={{ fontSize: 9, padding: '0 6px' }}>1.5%</button>
                </div>
              </div>

              {metodoRenta === 'coeficiente' ? (
                <>
                  <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: 8 }}>
                    Coef. = Impuesto calc. año anterior / Ingresos netos mismo año
                  </div>
                  <div className="hstack" style={{ gap: 6, marginBottom: 8 }}>
                    <span className="text-xs muted">Coef. actual:</span>
                    <input
                      type="number" step="0.0001"
                      value={coeficiente}
                      onChange={e => setCoeficiente(parseFloat(e.target.value) || 0)}
                      className="fin-input mono"
                      style={{ width: 100, fontSize: 11, padding: '3px 6px' }}
                    />
                    <span className="text-xs muted">({(coeficiente * 100).toFixed(2)}%)</span>
                  </div>
                  <CtbLineaTributo lbl={`Ingresos netos × ${(coeficiente*100).toFixed(2)}%`} val={stats.rentaCoef} color="var(--warn)" />
                </>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: 8 }}>
                    Pago mensual = 1.5% × Ingresos netos
                  </div>
                  <div className="text-xs muted" style={{ marginBottom: 8 }}>
                    Aplica si recién inicias, no tienes coef. calculado o el coef. es menor a 1.5%
                  </div>
                  <CtbLineaTributo lbl="Ingresos netos × 1.5%" val={stats.rentaFija} color="var(--warn)" />
                </>
              )}

              <div style={{ borderTop: '2px solid var(--warn)', marginTop: 8, paddingTop: 8 }}>
                <CtbLineaTributo lbl="Renta 3ra a pagar" val={stats.rentaPagar} color="var(--danger)" bold />
              </div>
              <div className="text-xs muted" style={{ marginTop: 8, fontSize: 10 }}>
                Ingresos netos del mes: {fmtPEN(stats.ingresosNetos)} · Diferencia vs otro método: {fmtPEN(Math.abs(stats.rentaCoef - stats.rentaFija))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
            <CtbKPI lbl="Detracciones acum." val={fmtCompact(stats.detracciones)} color="#7C3AED" sub="SPOT cuenta BN" />
            <CtbKPI lbl="Renta 4ta cat. (RHE)" val={fmtCompact(stats.renta4ta)} color="var(--warn)" />
            <CtbKPI lbl="Renta 5ta cat. (planilla)" val={fmtCompact(stats.renta5ta)} color="var(--warn)" />
            <CtbKPI lbl="EsSalud por pagar" val={fmtCompact(stats.essalud)} color="var(--ok)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <div style={{ padding: 12, background: 'var(--danger-soft)', borderRadius: 6, borderLeft: '4px solid var(--danger)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--danger-ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total a pagar SUNAT {nombreMes}
              </div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)', marginTop: 4 }}>
                {fmtPEN(stats.igvPagar + stats.rentaPagar)}
              </div>
              <div className="text-xs muted" style={{ marginTop: 4 }}>
                IGV {fmtCompact(stats.igvPagar)} + Renta {fmtCompact(stats.rentaPagar)}
              </div>
            </div>
            <div style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 6, borderLeft: '4px solid var(--ink-3)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Vencimiento declaración jurada
              </div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                15 días hábiles siguientes al mes
              </div>
              <div className="text-xs muted" style={{ marginTop: 4 }}>
                Form. 621 (IVAP - IGV - Renta) · Vía Clave SOL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtbLineaTributo({ lbl, val, color, bold }) {
  return (
    <div className="hstack between" style={{ padding: '3px 0', fontSize: bold ? 13 : 12 }}>
      <span style={{ color: 'var(--ink-2)', fontWeight: bold ? 700 : 400 }}>{lbl}</span>
      <span className="mono" style={{ fontWeight: bold ? 800 : 600, color, fontSize: bold ? 16 : 13 }}>
        {val < 0 ? '-' : ''}{fmtPEN(Math.abs(val))}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. REPORTES (stubs)
// ═══════════════════════════════════════════════════════════════
function CtbReportesView() {
  return (
    <div className="card">
      <div className="card-h">
        <h3>Reportes contables y fiscales</h3>
        <span className="hint">Export PDF/Excel · PLE TXT formato SUNAT</span>
      </div>
      <div className="card-b" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { t: 'Libro Mayor',         d: 'Saldos por cuenta · período configurable',   i: 'book',   tag: 'PLE 5.1', ready: true },
          { t: 'Estado de Situación', d: 'Activo / Pasivo / Patrimonio a la fecha',    i: 'trend',  tag: 'EEFF',    ready: true },
          { t: 'Estado de Resultados', d: 'Ingresos - Gastos · Utilidad del período',  i: 'trend',  tag: 'EEFF',    ready: true },
          { t: 'Libro Diario PLE',    d: 'Formato TXT SUNAT · envío electrónico',      i: 'file',   tag: 'PLE 5.1', ready: true },
          { t: 'Registro de Ventas',  d: 'CPE emitidos · IGV débito fiscal',           i: 'money',  tag: 'PLE 14',  ready: true },
          { t: 'Registro de Compras', d: 'Facturas recibidas · IGV crédito fiscal',    i: 'money',  tag: 'PLE 8',   ready: true },
          { t: 'Flujo de Efectivo',   d: 'Método directo · actividades operación',     i: 'trend',  tag: 'EEFF',    ready: false },
          { t: 'Libro Caja-Bancos',   d: 'Movimientos cuentas 10 · mensual',           i: 'bank',   tag: 'PLE 1',   ready: false },
          { t: 'Declaración mensual', d: 'PDT 621 · IGV + Renta',                      i: 'file',   tag: 'SUNAT',   ready: false },
        ].map(r => {
          const IconFn = Icon[r.i] || Icon.file;
          return (
            <div key={r.t} className="card" style={{ padding: 14, cursor: r.ready ? 'pointer' : 'not-allowed', background: 'var(--bg-sunken)', opacity: r.ready ? 1 : 0.55 }}>
              <div className="hstack between" style={{ marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {IconFn({ size: 14 })}
                </div>
                <span className="chip" style={{ fontSize: 9, background: r.ready ? 'var(--ok-soft)' : 'var(--bg)', color: r.ready ? 'var(--ok-ink)' : 'var(--ink-4)', borderColor: 'transparent' }}>
                  {r.tag}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{r.t}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.d}</div>
              {!r.ready && <div className="chip" style={{ fontSize: 9, marginTop: 6 }}>Próximamente</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CtbKPI({ lbl, val, color, sub }) {
  return (
    <div style={{ padding: '10px 14px', background: 'var(--bg-elev)', borderRadius: 6, border: '1px solid var(--line)', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 3 }}>{lbl}</div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

window.ContabilidadPage = ContabilidadPage;
