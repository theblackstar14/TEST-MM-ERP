/* global XLSX */
// Parser de cotizaciones XLSX · port del parser TypeScript a JS puro browser-side.
// Maneja multi-hoja (cada hoja = versión), detecta header, extrae partidas jerárquicas,
// resumen CD/GG/Util/Subtotal/IGV/Total, meta (proyecto/cliente/rev/COT) y valida sumas.

(function () {
  'use strict';

  const SKIP_SHEETS = ['hoja1', 'hoja2', 'hoja3', 'portada', 'indice', 'índice', 'resumen', 'instrucciones'];
  const SUM_TOLERANCE = 1.0;
  const IGV_PCT = 0.18;

  const SUMMARY_RE = /^(de los costos|sub[\s-]?total|costo\s+(directo|total|indirecto)|igv|i\.g\.v|utilidad|gastos\s+generales|cronograma|precio\s+s(in\s+igv|\/\.?igv)|total(\s+general)?\s*$|condiciones\s+comerciales|facilidades|responsabilidades|imagen\s+referencial)/i;
  const CONDITION_RE = /^\*+/;
  const SUMMARY_CODE_RE = /^\d+\.00$/;
  const ITEM_RE = /^\d{1,2}(\.\d{2})*\.?$/;

  // ── Helpers ─────────────────────────────────────────────────────
  function round2(n) { return Math.round(n * 100) / 100; }
  function getLevel(codigo) { return codigo.replace(/\.$/, '').split('.').length; }
  function getParent(codigo) {
    const parts = codigo.replace(/\.$/, '').split('.');
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join('.');
  }

  function parseNum(val) {
    if (val == null || String(val).trim() === '') return null;
    const s = String(val).replace(/S\/\.?\s*/gi, '').trim();
    if (!s) return null;
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    const normalised = lastComma > lastDot
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(/,/g, '');
    const n = parseFloat(normalised);
    return isNaN(n) ? null : n;
  }

  function parsePct(val) {
    if (val == null || String(val).trim() === '') return null;
    const s = String(val).trim();
    const hasPct = s.endsWith('%');
    const n = parseFloat(s.replace('%', '').replace(/[S\/\s]/g, '').replace(',', '.'));
    if (isNaN(n) || n < 0) return null;
    if (hasPct || n > 1) return Math.round((n / 100) * 10000) / 10000;
    return n;
  }

  function dedup(codigo, seen) {
    const count = seen.get(codigo) || 0;
    seen.set(codigo, count + 1);
    if (count === 0) return codigo;
    return codigo + String.fromCharCode(96 + count);
  }

  // ── Step 1: sheet → rows (raw array of strings) ─────────────────
  function readRows(ws) {
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    return raw
      .map(row => row.map(c => String(c == null ? '' : c).trim()))
      .filter(row => row.some(c => c !== ''));
  }

  // ── Step 2: find header row (contains ITEM + PARCIAL/TOTAL) ─────
  function findHeaderRow(rows) {
    return rows.findIndex(row =>
      row.some(c => c.toUpperCase().includes('ITEM')) &&
      (row.some(c => c.toUpperCase().includes('PARCIAL')) ||
       row.some(c => c.toUpperCase().includes('TOTAL')))
    );
  }

  // ── Step 3: map columns by index ────────────────────────────────
  function mapColumns(header) {
    const map = {
      item: undefined, descripcion: undefined, unidad: undefined,
      metrado: undefined, precio: undefined, parcial: undefined, total: undefined,
    };
    header.forEach((col, i) => {
      const name = col.toUpperCase().trim();
      if ((name.includes('ITEM') || name.includes('CODIGO') || name.includes('CÓDIGO')) && map.item == null) map.item = i;
      if (name.includes('DESCRI') && map.descripcion == null) map.descripcion = i;
      if (name.includes('UNID') && map.unidad == null) map.unidad = i;
      if ((name.includes('METRAD') || name === 'MET.' || name.includes('CANT')) && map.metrado == null) map.metrado = i;
      if ((name.includes('PRECIO') || name.includes('P.U') || name.includes('UNIT')) && map.precio == null) map.precio = i;
      if (name.includes('PARCIAL') && map.parcial == null) map.parcial = i;
      if ((name === 'TOTAL' || (name.includes('TOTAL') && !name.includes('SUB'))) && map.total == null) map.total = i;
    });
    return map;
  }

  // ── Step 4: extract partidas from table rows ────────────────────
  function extractPartidas(rows, headerIdx, colMap) {
    if (colMap.item == null) return { partidas: [], lastPartidaIdx: headerIdx };
    const partidas = [];
    let lastPartidaIdx = headerIdx;
    const dataRows = rows.slice(headerIdx + 1);

    for (let ri = 0; ri < dataRows.length; ri++) {
      const row = dataRows[ri];
      const rawCode = (row[colMap.item] || '').trim();
      if (!rawCode || !ITEM_RE.test(rawCode)) continue;

      const descripcion = colMap.descripcion != null ? (row[colMap.descripcion] || '').trim() : '';
      if (!descripcion) continue;

      if (SUMMARY_RE.test(descripcion) || CONDITION_RE.test(descripcion)) continue;
      if (SUMMARY_CODE_RE.test(rawCode)) continue;

      lastPartidaIdx = headerIdx + 1 + ri;

      partidas.push({
        codigo: rawCode.replace(/\.$/, ''),
        descripcion,
        unidad: colMap.unidad != null ? ((row[colMap.unidad] || '').trim() || null) : null,
        metrado: colMap.metrado != null ? parseNum(row[colMap.metrado]) : null,
        precio_unitario: colMap.precio != null ? parseNum(row[colMap.precio]) : null,
      });
    }
    return { partidas, lastPartidaIdx };
  }

  // ── Step 5: extract resumen (CD/GG/Util/Subtotal/IGV/Total) ─────
  function extractExcelResumen(rows, headerIdx, colMap) {
    const r = {
      costo_directo: null, gastos_generales_pct: null, gastos_generales: null,
      utilidad_pct: null, utilidad: null, subtotal: null,
      igv_pct: null, igv: null, total: null,
    };
    const pctCols = [colMap.parcial, colMap.precio, colMap.metrado].filter(c => c != null);

    for (let ri = headerIdx + 1; ri < rows.length; ri++) {
      const row = rows[ri];
      const desc = colMap.descripcion != null ? (row[colMap.descripcion] || '').toUpperCase().trim() : '';
      if (!desc) continue;

      const isCostDir = /^COSTO\s+DIRECTO/.test(desc);
      const isGG = /^GASTOS?\s*GENERALES?/.test(desc);
      const isUtil = /^UTILIDAD\b/.test(desc);
      const isSub = /^SUB[\s-]?TOTAL/.test(desc);
      const isIGV = /^I\.?G\.?V\b/.test(desc);
      const isTotal = !isSub && !isCostDir && /^TOTAL(\s+GENERAL)?\s*$/.test(desc);

      if (!isCostDir && !isGG && !isUtil && !isSub && !isIGV && !isTotal) continue;

      let monVal = null;
      for (let i = row.length - 1; i >= 0; i--) {
        const n = parseNum(row[i]);
        if (n !== null && n > 1) { monVal = n; break; }
      }

      let pct = null;
      for (const col of pctCols) {
        pct = parsePct(row[col]);
        if (pct !== null && pct > 0 && pct <= 1) break;
        pct = null;
      }

      if (isCostDir && r.costo_directo === null) r.costo_directo = monVal;
      else if (isGG && r.gastos_generales === null) { r.gastos_generales = monVal; r.gastos_generales_pct = pct; }
      else if (isUtil && r.utilidad === null) { r.utilidad = monVal; r.utilidad_pct = pct; }
      else if (isSub && r.subtotal === null) r.subtotal = monVal;
      else if (isIGV && r.igv === null) { r.igv = monVal; r.igv_pct = pct; }
      else if (isTotal && r.total === null) r.total = monVal;
    }
    return r;
  }

  // ── Step 6: build flat list ─────────────────────────────────────
  function buildFlat(partidas) {
    const seen = new Map();
    const result = [];
    let orden = 0;
    for (const p of partidas) {
      const rawCodigo = (p.codigo || '').replace(/\.$/, '').trim();
      if (!rawCodigo || SUMMARY_CODE_RE.test(rawCodigo) ||
          SUMMARY_RE.test((p.descripcion || '').trim()) ||
          CONDITION_RE.test((p.descripcion || '').trim())) continue;

      const codigo = dedup(rawCodigo, seen);
      const metrado = typeof p.metrado === 'number' ? p.metrado : parseNum(p.metrado);
      const precio = typeof p.precio_unitario === 'number' ? p.precio_unitario : parseNum(p.precio_unitario);
      const parcial = metrado !== null && precio !== null ? round2(metrado * precio) : 0;

      result.push({
        codigo,
        descripcion: p.descripcion,
        nivel: getLevel(rawCodigo),
        unidad: p.unidad || null,
        metrado, precio_unitario: precio, parcial, total: parcial,
        parent_codigo: getParent(rawCodigo),
        orden: orden++,
      });
    }
    return result;
  }

  // ── Step 7: bottom-up chapter totals ────────────────────────────
  function fillChapterTotals(partidas) {
    const rows = partidas.map(p => Object.assign({}, p));
    for (let i = rows.length - 1; i >= 0; i--) {
      const children = rows.filter(c => c.parent_codigo === rows[i].codigo);
      if (children.length === 0) continue;
      rows[i] = Object.assign({}, rows[i], { total: round2(children.reduce((s, c) => s + c.total, 0)) });
    }
    return rows;
  }

  // ── Step 8: build tree + validate ───────────────────────────────
  function buildTree(flat) {
    const root = [];
    const stack = [];
    for (const p of flat) {
      const node = Object.assign({}, p, { children: [], _validation: null });
      const savedStack = stack.slice();

      while (stack.length) {
        if (p.codigo.startsWith(stack[stack.length - 1].codigo + '.')) break;
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node);
        stack.push({ codigo: p.codigo, node });
        continue;
      }

      const firstSeg = parseInt(p.codigo.split('.')[0], 10);
      const lastRoot = root.length > 0 ? parseInt(root[root.length - 1].codigo.split('.')[0], 10) : 0;
      const isMistyped = p.codigo.includes('.') && firstSeg < lastRoot && savedStack.length >= 2;

      if (isMistyped) {
        savedStack[savedStack.length - 2].node.children.push(node);
        stack.length = 0;
        savedStack.slice(0, -1).forEach(s => stack.push(s));
        stack.push({ codigo: p.codigo, node });
      } else {
        root.push(node);
        stack.push({ codigo: p.codigo, node });
      }
    }
    return root;
  }

  function validateTree(nodes) {
    for (const node of nodes) {
      if (node.children.length === 0) continue;
      validateTree(node.children);
      if (node.total == null) continue;
      const sumChildren = node.children.reduce((acc, c) => acc + (c.parcial || c.total || 0), 0);
      const diff = Math.abs(sumChildren - node.total);
      node._validation = {
        expected: node.total,
        calculado: Math.round(sumChildren * 100) / 100,
        diferencia: Math.round(diff * 100) / 100,
        ok: diff <= SUM_TOLERANCE,
      };
    }
  }

  function countNodes(nodes) {
    return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
  }

  function treeAllValid(nodes) {
    return nodes.every(n => (!n._validation || n._validation.ok) && treeAllValid(n.children));
  }

  // ── Step 9: extract metadata from header rows ───────────────────
  function extractMeta(rows, headerIdx, sheetName) {
    const above = rows.slice(0, headerIdx);
    const meta = {
      proyecto: null, cliente: null, fecha: null, plazo: null,
      version_label: 'REV.01', codigo_interno: null, ubicacion: null,
    };

    for (const row of above) {
      const rowStr = row.join(' ').toUpperCase();

      if ((rowStr.includes('PROYECTO:') || rowStr.includes('PROYECTO :')) && !meta.proyecto) {
        const idx = row.findIndex(c => c.toUpperCase().includes('PROYECTO'));
        meta.proyecto = row[idx + 1] ? row[idx + 1].trim() || null : null;
      }
      if (rowStr.includes('CLIENTE:') && !meta.cliente) {
        const idx = row.findIndex(c => c.toUpperCase().includes('CLIENTE'));
        meta.cliente = row[idx + 1] ? row[idx + 1].trim() || null : null;
      }
      if (rowStr.includes('UBICACI') && !meta.ubicacion) {
        const idx = row.findIndex(c => c.toUpperCase().includes('UBICACI'));
        meta.ubicacion = row[idx + 1] ? row[idx + 1].trim() || null : null;
      }
      if (rowStr.includes('FECHA') && !meta.fecha) {
        const idx = row.findIndex(c => c.toUpperCase().includes('FECHA'));
        meta.fecha = row[idx + 1] ? row[idx + 1].trim() || null : null;
      }
      if (rowStr.includes('PLAZO') && !meta.plazo) {
        const idx = row.findIndex(c => c.toUpperCase().includes('PLAZO'));
        meta.plazo = row[idx + 1] ? row[idx + 1].trim() || null : null;
      }

      const revMatch = rowStr.match(/\bREV\.?\s*0*(\d+)\b|\bV(\d+)\b/i);
      if (revMatch && meta.version_label === 'REV.01') {
        const n = revMatch[1] || revMatch[2];
        meta.version_label = 'REV.' + String(n).padStart(2, '0');
      }

      const cotMatch = rowStr.match(/COT[-\s]?\d+/i);
      if (cotMatch && !meta.codigo_interno) meta.codigo_interno = cotMatch[0].replace(/\s/g, '').toUpperCase();
    }

    if (meta.version_label === 'REV.01') {
      const m = sheetName.match(/\((\d+)\)/);
      if (m) meta.version_label = 'REV.' + String(m[1]).padStart(2, '0');
    }
    if (!meta.codigo_interno) {
      const m = sheetName.match(/COT[-\s]?\d+/i);
      if (m) meta.codigo_interno = m[0].replace(/\s/g, '').toUpperCase();
    }

    return meta;
  }

  // ── Step 10: build resumen (merge Excel vals + computed fallbacks)
  function buildResumen(er, partidas, warnings) {
    const computed = [];

    const costo_directo = er.costo_directo != null ? er.costo_directo : (function () {
      computed.push('Costo Directo');
      return round2(partidas.filter(p => p.parent_codigo === null).reduce((s, p) => s + p.total, 0));
    })();

    const igv_pct = er.igv_pct != null ? er.igv_pct : IGV_PCT;
    const gastos_generales_pct = er.gastos_generales_pct != null ? er.gastos_generales_pct : null;
    const utilidad_pct = er.utilidad_pct != null ? er.utilidad_pct : null;

    const gastos_generales = er.gastos_generales != null ? er.gastos_generales
      : (gastos_generales_pct != null ? round2(costo_directo * gastos_generales_pct) : null);
    const utilidad = er.utilidad != null ? er.utilidad
      : (utilidad_pct != null ? round2(costo_directo * utilidad_pct) : null);

    const subtotal = er.subtotal != null ? er.subtotal : (function () {
      computed.push('Sub Total');
      return round2(costo_directo + (gastos_generales || 0) + (utilidad || 0));
    })();

    const igv = er.igv != null ? er.igv : (function () { computed.push('IGV'); return round2(subtotal * igv_pct); })();
    const total = er.total != null ? er.total : (function () { computed.push('Total'); return round2(subtotal + igv); })();

    if (computed.length > 0) {
      warnings.push('Valores calculados (no leídos del Excel): ' + computed.join(', '));
    }

    return {
      costo_directo, gastos_generales_pct, gastos_generales,
      utilidad_pct, utilidad, subtotal, igv_pct, igv, total,
    };
  }

  // ── processSheet ────────────────────────────────────────────────
  function processSheet(sheetName, ws) {
    const rows = readRows(ws);
    const headerIdx = findHeaderRow(rows);
    if (headerIdx === -1) return null;

    const colMap = mapColumns(rows[headerIdx]);
    const { partidas: rawParts } = extractPartidas(rows, headerIdx, colMap);
    if (rawParts.length === 0) return null;

    const excelResumen = extractExcelResumen(rows, headerIdx, colMap);
    const meta = extractMeta(rows, headerIdx, sheetName);
    const flat = buildFlat(rawParts);
    if (flat.length === 0) return null;

    const partidas_flat = fillChapterTotals(flat);
    const warnings = [];
    const resumen = buildResumen(excelResumen, partidas_flat, warnings);

    const partidas_tree = buildTree(partidas_flat);
    validateTree(partidas_tree);
    const validacion_ok = treeAllValid(partidas_tree);

    return {
      sheet_name: sheetName,
      version_label: meta.version_label,
      codigo_interno: meta.codigo_interno,
      cliente: meta.cliente,
      proyecto: meta.proyecto,
      ubicacion: meta.ubicacion,
      fecha: meta.fecha,
      plazo: meta.plazo,
      total_sin_igv: resumen.subtotal,
      partidas_flat,
      partidas_tree,
      resumen,
      warnings,
      validacion_ok,
      nodos_tree: countNodes(partidas_tree),
    };
  }

  // ── Main entry: parseCotizacionWorkbook(arrayBuffer) ────────────
  async function parseCotizacionWorkbook(arrayBuffer) {
    if (typeof XLSX === 'undefined') throw new Error('SheetJS (XLSX) no cargado');
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const versiones = [];
    for (const sheetName of wb.SheetNames) {
      if (SKIP_SHEETS.indexOf(sheetName.toLowerCase()) >= 0) continue;
      const ws = wb.Sheets[sheetName];
      if (!ws || !ws['!ref']) continue;
      const result = processSheet(sheetName, ws);
      if (result) versiones.push(result);
    }
    if (versiones.length === 0) throw new Error('No se encontraron hojas con datos válidos');
    return { versiones, total_versiones: versiones.length };
  }

  // ── diffCotizaciones(verA, verB) · compara 2 versiones ──────────
  // Retorna rows con status: 'sin_cambio' | 'modificada' | 'agregada' | 'eliminada'
  function diffCotizaciones(verA, verB) {
    const mapA = new Map(verA.partidas_flat.map(p => [p.codigo, p]));
    const mapB = new Map(verB.partidas_flat.map(p => [p.codigo, p]));
    const allCodes = new Set([...mapA.keys(), ...mapB.keys()]);

    const rows = [];
    allCodes.forEach(codigo => {
      const a = mapA.get(codigo);
      const b = mapB.get(codigo);
      let status, descripcion, nivel, parent_codigo, orden;
      if (a && !b) { status = 'eliminada'; descripcion = a.descripcion; nivel = a.nivel; parent_codigo = a.parent_codigo; orden = a.orden; }
      else if (!a && b) { status = 'agregada'; descripcion = b.descripcion; nivel = b.nivel; parent_codigo = b.parent_codigo; orden = b.orden + 10000; }
      else {
        descripcion = b.descripcion;
        nivel = b.nivel; parent_codigo = b.parent_codigo; orden = b.orden;
        const metradoDif = (b.metrado || 0) !== (a.metrado || 0);
        const precioDif = (b.precio_unitario || 0) !== (a.precio_unitario || 0);
        const totalDif = Math.abs((b.total || 0) - (a.total || 0)) > 0.01;
        status = (metradoDif || precioDif || totalDif) ? 'modificada' : 'sin_cambio';
      }
      rows.push({
        codigo, descripcion, nivel, parent_codigo, orden, status,
        a: a ? { metrado: a.metrado, precio: a.precio_unitario, total: a.total, parcial: a.parcial } : null,
        b: b ? { metrado: b.metrado, precio: b.precio_unitario, total: b.total, parcial: b.parcial } : null,
        delta: (b ? b.total || 0 : 0) - (a ? a.total || 0 : 0),
      });
    });
    rows.sort((x, y) => x.orden - y.orden);

    const totalA = verA.resumen.total || 0;
    const totalB = verB.resumen.total || 0;
    const subtotalA = verA.resumen.subtotal || 0;
    const subtotalB = verB.resumen.subtotal || 0;

    const counts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

    return {
      rows,
      counts: {
        sin_cambio: counts.sin_cambio || 0,
        modificada: counts.modificada || 0,
        agregada: counts.agregada || 0,
        eliminada: counts.eliminada || 0,
        total: rows.length,
      },
      totals: {
        subtotalA, subtotalB, deltaSubtotal: subtotalB - subtotalA,
        totalA, totalB, deltaTotal: totalB - totalA,
        deltaPct: totalA ? ((totalB - totalA) / totalA) * 100 : 0,
      },
    };
  }

  // ── groupByCotizacion · agrupa versiones por codigo_interno (COT-XXX)
  // Si mismo COT-XXX aparece en múltiples hojas → es la misma cotización con varias versiones
  // Si COT distinto → cotizaciones distintas
  // Fallback cuando no hay codigo_interno: agrupa por cliente+proyecto
  function groupByCotizacion(versiones) {
    const map = new Map();
    versiones.forEach(v => {
      const key = v.codigo_interno || ((v.cliente || 'sin-cliente') + '|' + (v.proyecto || 'sin-proyecto'));
      if (!map.has(key)) {
        map.set(key, {
          codigo_interno: v.codigo_interno,
          cliente: v.cliente,
          proyecto: v.proyecto,
          ubicacion: v.ubicacion,
          versiones: [],
        });
      }
      map.get(key).versiones.push(v);
    });
    // Ordena versiones dentro de cada cotización por version_label (REV.01 → REV.02 → ...)
    map.forEach(cot => {
      cot.versiones.sort((a, b) => (a.version_label || '').localeCompare(b.version_label || ''));
      // Meta de la cotización = última versión disponible (suele tener más info si hubo correcciones)
      const ultima = cot.versiones[cot.versiones.length - 1];
      cot.cliente = cot.cliente || ultima.cliente;
      cot.proyecto = cot.proyecto || ultima.proyecto;
      cot.ubicacion = cot.ubicacion || ultima.ubicacion;
      cot.fecha = ultima.fecha;
      cot.plazo = ultima.plazo;
      cot.total = ultima.resumen.total || 0;
      cot.subtotal = ultima.resumen.subtotal || 0;
      cot.partidas_count = ultima.partidas_flat.length;
      cot.validacion_ok = ultima.validacion_ok;
    });
    return Array.from(map.values());
  }

  window.CotizacionParser = {
    parseCotizacionWorkbook,
    diffCotizaciones,
    groupByCotizacion,
  };
})();
