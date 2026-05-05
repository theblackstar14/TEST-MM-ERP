/* global React, Icon, ERP_DATA, EmpresaModal */
const { useState, useEffect, useMemo } = React;

// =================== SEACE (vista completa con highlight + filtros + drawer) ===================
const API = window.SEACE_API || "";

// Helpers ─────────────────────────────────────────────────────────────────────
const fmtMonto = (n) => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}K`;
  return `S/ ${n.toFixed(0)}`;
};
const fmtMontoExacto = (n) => {
  if (n == null || isNaN(n)) return '—';
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const RESULTADO_META = {
  califica:      { label: 'Califica',     chip: 'green', stripe: 'var(--ok)',     bg: 'var(--ok-soft)' },
  consorcio:     { label: 'Consorcio',    chip: 'amber', stripe: 'var(--warn)',   bg: 'var(--warn-soft)' },
  indeterminado: { label: 'Indeterminado',chip: '',      stripe: 'var(--ink-3)',  bg: 'transparent' },
  no_califica:   { label: 'No califica',  chip: 'red',   stripe: 'var(--danger)', bg: 'transparent' },
};

const CAPACIDAD_BUCKETS = [
  { id: 'todos',    label: 'Todos',           pctMin: 0,    pctMax: null },
  { id: 'pequenas', label: 'Pequeñas <25%',   pctMin: 0,    pctMax: 0.25 },
  { id: 'medianas', label: 'Medianas 25–75%', pctMin: 0.25, pctMax: 0.75 },
  { id: 'grandes',  label: 'Grandes 75–100%', pctMin: 0.75, pctMax: 1.00 },
  { id: 'sobre',    label: 'Sobre cap >100%', pctMin: 1.00, pctMax: null },
];

const motivoIndet = (p) => {
  const ct = p.calidad_texto || {};
  if (ct.escaneado) return { icon: '📄', txt: 'Escaneado' };
  if (ct.template) return { icon: '⚠', txt: 'Template' };
  if (!p.documento_usado) return { icon: '⏬', txt: 'Sin descarga' };
  return { icon: '?', txt: 'Ambiguo' };
};

function SeacePage() {
  // datos
  const [procesos, setProcesos]     = useState([]);
  const [empresa, setEmpresa]       = useState(null);
  const [ubicaciones, setUbicaciones] = useState({ regiones: [] });
  const [lastRun, setLastRun]       = useState(null);

  // selección + drawer
  const [selected, setSelected]     = useState(null);
  const [detalle, setDetalle]       = useState(null);
  const [tab, setTab]               = useState('requisitos');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ui
  const [running, setRunning]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [log, setLog]               = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [empresaModalOpen, setEmpresaModalOpen] = useState(false);

  // filtros
  const [filtros, setFiltros] = useState({
    resultados: ['califica', 'consorcio', 'indeterminado'],
    capacidad: 'todos',
    minMonto: 0,
    minDias: 0,
    minScore: 0,
    region: 'todas',
    cumplePlantel: 'cualquiera',
    search: '',
  });

  const ts = () => new Date().toLocaleTimeString('es-PE');
  const pushLog = (lvl, msg) => setLog(l => [...l, { t: ts(), lvl, msg }]);

  // ─── carga inicial ──────────────────────────────────────────────────────────
  const loadAll = async () => {
    if (!API) {
      pushLog('warn', 'Configura window.SEACE_API en index.html');
      return;
    }
    try {
      pushLog('info', `GET ${API}/api/v2/empresa`);
      const empResp = await fetch(`${API}/api/v2/empresa`);
      if (empResp.ok) setEmpresa(await empResp.json());

      const ubResp = await fetch(`${API}/api/v2/ubicaciones`);
      if (ubResp.ok) setUbicaciones(await ubResp.json());

      const lrResp = await fetch(`${API}/api/v2/last-run`);
      if (lrResp.ok) {
        const j = await lrResp.json();
        setLastRun(j.run);
      }

      const pResp = await fetch(`${API}/api/v2/procesos?limit=500`);
      if (!pResp.ok) throw new Error(`HTTP ${pResp.status}`);
      const pJson = await pResp.json();
      setProcesos(pJson.data || []);
      pushLog('ok', `${(pJson.data || []).length} procesos cargados`);
    } catch (e) {
      pushLog('warn', 'Error: ' + e.message);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ─── carga detalle ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected || !API) { setDetalle(null); return; }
    setDetalle(null);
    fetch(`${API}/api/v2/procesos/${encodeURIComponent(selected)}`)
      .then(r => r.json())
      .then(j => setDetalle(j))
      .catch(e => pushLog('warn', 'Detalle err: ' + e.message));
  }, [selected]);

  // ─── filtros ────────────────────────────────────────────────────────────────
  const procesosFiltrados = useMemo(() => {
    const cap = empresa?.capacidadContratacionCAPECO || 0;
    const bucket = CAPACIDAD_BUCKETS.find(b => b.id === filtros.capacidad);
    const search = filtros.search.toLowerCase();

    return procesos.filter(p => {
      const result = p.evaluacion?.resultado;
      if (!filtros.resultados.includes(result)) return false;
      if ((p.dias_restantes ?? 0) < filtros.minDias) return false;
      if ((p.score ?? 0) < filtros.minScore) return false;
      if ((p.valor_referencial ?? 0) < filtros.minMonto) return false;
      if (filtros.region !== 'todas' && p.region !== filtros.region) return false;
      if (filtros.cumplePlantel !== 'cualquiera') {
        const pc = p.evaluacion?.plantel?.cumple;
        if (pc !== filtros.cumplePlantel) return false;
      }
      if (bucket && bucket.id !== 'todos' && cap > 0) {
        const vr = p.valor_referencial || 0;
        const pct = vr / cap;
        if (pct < bucket.pctMin) return false;
        if (bucket.pctMax != null && pct > bucket.pctMax) return false;
      }
      if (search) {
        const blob = `${p.nomenclatura} ${p.entidad} ${p.descripcion || ''}`.toLowerCase();
        if (!blob.includes(search)) return false;
      }
      return true;
    });
  }, [procesos, filtros, empresa]);

  const stats = useMemo(() => {
    const t = procesos.length;
    const c = procesos.filter(p => p.evaluacion?.resultado === 'califica').length;
    const co = procesos.filter(p => p.evaluacion?.resultado === 'consorcio').length;
    const ind = procesos.filter(p => p.evaluacion?.resultado === 'indeterminado').length;
    const no = procesos.filter(p => p.evaluacion?.resultado === 'no_califica').length;
    const mc = procesos
      .filter(p => p.evaluacion?.resultado === 'califica')
      .reduce((s, p) => s + (p.valor_referencial || 0), 0);
    const mco = procesos
      .filter(p => p.evaluacion?.resultado === 'consorcio')
      .reduce((s, p) => s + (p.valor_referencial || 0), 0);
    return { total: t, califican: c, consorcio: co, indet: ind, no_calif: no, montoCalif: mc, montoConsorcio: mco };
  }, [procesos]);

  // ─── ejecutar scraper (mock animado) ────────────────────────────────────────
  const ejecutarScraper = () => {
    setRunning(true);
    setProgress(0);
    setConsoleOpen(true);
    pushLog('info', '▶ Iniciando scraper SEACE…');
    const steps = [
      { ms: 800,  pct: 10,  msg: 'Abriendo buscador SEACE…' },
      { ms: 1200, pct: 25,  msg: 'Aplicando filtros: Obra · 10/04 → 24/04' },
      { ms: 1500, pct: 45,  msg: 'Listado: 32 páginas · 475 procesos totales' },
      { ms: 1200, pct: 60,  msg: 'Pre-filtro: 50 pasaron (publicación + monto)' },
      { ms: 1500, pct: 75,  msg: 'Cronogramas leídos: 50 · con tiempo: 6' },
      { ms: 1500, pct: 88,  msg: 'Detalle + descarga: 6 procesos · 5 PDFs' },
      { ms: 1200, pct: 95,  msg: 'LLM Claude: extrae plantel + lugar ejecución' },
      { ms: 800,  pct: 100, msg: '✓ Run completo · persistido en Supabase' },
    ];
    let i = 0;
    const tick = () => {
      if (i >= steps.length) { setRunning(false); loadAll(); return; }
      const s = steps[i++];
      setTimeout(() => { setProgress(s.pct); pushLog(s.pct === 100 ? 'ok' : 'info', s.msg); tick(); }, s.ms);
    };
    tick();
  };

  const downloadDoc = async (nid, docId, filename) => {
    try {
      const r = await fetch(`${API}/api/v2/procesos/${encodeURIComponent(nid)}/documentos/${docId}/url`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      window.open(j.url, '_blank');
      pushLog('ok', `Descarga: ${filename}`);
    } catch (e) {
      pushLog('warn', 'Download err: ' + e.message);
    }
  };

  const cap = empresa?.capacidadContratacionCAPECO || 0;
  const sweetMin = Math.round(cap * 0.30);
  const sweetMax = cap;

  const openDrawer = (nid) => {
    setSelected(nid);
    setDrawerOpen(true);
  };

  const aplicarSweetSpot = () => {
    setFiltros(f => ({ ...f, capacidad: 'medianas' }));
  };

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ws-inner wide" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER */}
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="hstack" style={{ gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span className="mono text-xs" style={{ color: 'var(--accent)' }}>SEACE</span>
              <span className={`chip ${API ? 'green' : 'red'}`}><span className="dot" />{API ? 'Conectado · OSCE' : 'Sin API'}</span>
              <span className="chip"><span className="mono text-xs">v2 · {API ? new URL(API).hostname : ''}</span></span>
              <span className="chip"><span className="mono text-xs">{procesos.length} en DB</span></span>
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Importador SEACE · Licitaciones del Estado</h1>
            <div className="sub muted" style={{ marginTop: 4, fontSize: 12 }}>Scraper IA · plantel · ubicación · capacidad CAPECO</div>
          </div>
          <div className="hstack" style={{ gap: 6, flexShrink: 0 }}>
            <button className="tb-btn" onClick={() => setConsoleOpen(o => !o)}>
              <span className="ico">▣</span>{consoleOpen ? 'Ocultar consola' : 'Consola'}
            </button>
            <button className="tb-btn" onClick={loadAll} disabled={running}>
              <span className="ico">↻</span>Recargar
            </button>
            <button className="tb-btn primary" onClick={ejecutarScraper} disabled={running}>
              <span className="ico">{Icon.sparkle ? Icon.sparkle({ size: 13 }) : '✦'}</span>
              {running ? 'Ejecutando…' : 'Ejecutar scraper'}
            </button>
          </div>
        </div>

        {running && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
              <span style={{ display: 'block', width: progress + '%', height: '100%', background: 'var(--accent)', transition: 'width .3s' }} />
            </div>
          </div>
        )}

        {/* STATS auto-fit */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginTop: 14 }}>
          <QuickStat l="Total scrapeado" v={String(stats.total)} d={lastRun ? `corrida ${new Date(lastRun.started_at).toLocaleDateString('es-PE')}` : 'sin runs'} />
          <QuickStat l="Califican" v={String(stats.califican)} d={fmtMonto(stats.montoCalif)} color="var(--ok)" />
          <QuickStat l="Consorcio" v={String(stats.consorcio)} d={fmtMonto(stats.montoConsorcio)} color="var(--warn)" />
          <QuickStat l="En análisis" v={String(stats.indet)} d="revisar manual" />
          <QuickStat l="No califica" v={String(stats.no_calif)} d="" color="var(--danger)" />
        </div>
      </div>

      {/* EMPRESA BANNER + FILTROS */}
      {empresa && (
        <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginBottom: 10, fontSize: 11, alignItems: 'center' }}>
            <BannerItem l="Empresa" v={empresa.razonSocial} />
            <BannerItem l="Capacidad CAPECO" v={fmtMonto(cap)} mono />
            <BannerItem l="Sweet spot" v={`${fmtMonto(sweetMin)} – ${fmtMonto(sweetMax)}`} mono />
            <BannerItem l="Personal" v={`${empresa.personal?.length || 0} ingenieros`} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button
                onClick={() => setEmpresaModalOpen(true)}
                style={{ padding: '3px 10px', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, background: 'var(--bg-elev)', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 4, cursor: 'pointer' }}
              >
                ✏ Editar empresa
              </button>
              <button
                onClick={aplicarSweetSpot}
                style={{ padding: '3px 10px', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Aplicar sweet spot
              </button>
            </div>
          </div>

          {/* FILTROS FILA 1 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', alignItems: 'center', marginBottom: 8 }}>
            <FilterGroupLabel>Resultado</FilterGroupLabel>
            <div className="hstack" style={{ gap: 4, flexWrap: 'wrap' }}>
              {Object.entries(RESULTADO_META).map(([k, m]) => (
                <FilterChip
                  key={k}
                  active={filtros.resultados.includes(k)}
                  onClick={() => setFiltros(f => ({ ...f, resultados: f.resultados.includes(k) ? f.resultados.filter(r => r !== k) : [...f.resultados, k] }))}
                  color={m.chip}
                >
                  {m.label} · {procesos.filter(p => p.evaluacion?.resultado === k).length}
                </FilterChip>
              ))}
            </div>

            <FilterGroupLabel>Capacidad</FilterGroupLabel>
            <div className="hstack" style={{ gap: 4, flexWrap: 'wrap' }}>
              {CAPACIDAD_BUCKETS.map(b => (
                <FilterChip
                  key={b.id}
                  active={filtros.capacidad === b.id}
                  onClick={() => setFiltros(f => ({ ...f, capacidad: b.id }))}
                >
                  {b.label}
                </FilterChip>
              ))}
            </div>

            <input
              type="text"
              placeholder="Buscar nomenclatura/entidad…"
              value={filtros.search}
              onChange={e => setFiltros(f => ({ ...f, search: e.target.value }))}
              style={{ flex: 1, minWidth: 160, maxWidth: 320, padding: '5px 10px', fontSize: 12, fontFamily: 'var(--sans)', border: '1px solid var(--line)', borderRadius: 4, background: 'var(--bg-elev)', color: 'var(--ink)' }}
            />

            <button
              onClick={() => setShowAdvanced(o => !o)}
              style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, background: showAdvanced ? 'var(--accent-soft)' : 'var(--bg-elev)', color: showAdvanced ? 'var(--accent-ink)' : 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 4, cursor: 'pointer' }}
            >
              {showAdvanced ? '− Menos filtros' : '+ Más filtros'}
            </button>
          </div>

          {/* FILTROS FILA 2 (avanzados, colapsable) */}
          {showAdvanced && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
              <SliderField
                label="Monto mínimo"
                value={filtros.minMonto}
                onChange={v => setFiltros(f => ({ ...f, minMonto: v }))}
                min={0}
                max={20_000_000}
                step={100_000}
                fmt={fmtMonto}
              />
              <SliderField
                label="Días mínimos para presentación"
                value={filtros.minDias}
                onChange={v => setFiltros(f => ({ ...f, minDias: v }))}
                min={0}
                max={60}
                step={1}
                fmt={(v) => `${v}d`}
              />
              <SliderField
                label="Score mínimo"
                value={filtros.minScore}
                onChange={v => setFiltros(f => ({ ...f, minScore: v }))}
                min={0}
                max={100}
                step={5}
                fmt={(v) => String(v)}
              />
              <div>
                <FilterGroupLabel>Región</FilterGroupLabel>
                <select
                  value={filtros.region}
                  onChange={e => setFiltros(f => ({ ...f, region: e.target.value }))}
                  style={{ width: '100%', marginTop: 4, padding: '5px 8px', fontSize: 12, fontFamily: 'var(--sans)', border: '1px solid var(--line)', borderRadius: 4, background: 'var(--bg-elev)', color: 'var(--ink)' }}
                >
                  <option value="todas">Todas</option>
                  {ubicaciones.regiones?.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <FilterGroupLabel>Plantel</FilterGroupLabel>
                <select
                  value={filtros.cumplePlantel}
                  onChange={e => setFiltros(f => ({ ...f, cumplePlantel: e.target.value }))}
                  style={{ width: '100%', marginTop: 4, padding: '5px 8px', fontSize: 12, fontFamily: 'var(--sans)', border: '1px solid var(--line)', borderRadius: 4, background: 'var(--bg-elev)', color: 'var(--ink)' }}
                >
                  <option value="cualquiera">Cualquiera</option>
                  <option value="si">Cubre 100%</option>
                  <option value="parcial">Parcial</option>
                  <option value="no">No cubre</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-3)' }}>
            Mostrando <strong style={{ color: 'var(--ink)' }}>{procesosFiltrados.length}</strong> de {procesos.length} procesos analizados
          </div>
        </div>
      )}

      {/* TABLA full-width */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-elev)' }}>
        <table>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elev)', zIndex: 1 }}>
            <tr>
              <th style={{ width: 6 }}></th>
              <th style={{ width: 160 }}>Nomenclatura</th>
              <th>Entidad / Descripción</th>
              <th style={{ width: 120 }} className="hide-narrow">Región</th>
              <th style={{ width: 140 }} className="num-c">Monto</th>
              <th style={{ width: 70 }} className="num-c">Días</th>
              <th style={{ width: 60 }} className="num-c hide-narrow">Score</th>
              <th style={{ width: 90 }}>Plantel</th>
              <th style={{ width: 130 }}>Resultado</th>
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {procesosFiltrados.length === 0 && !running && (
              <tr><td colSpan="10" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
                {procesos.length === 0 ? 'Sin datos. Ejecuta el scraper.' : 'Sin resultados con estos filtros.'}
              </td></tr>
            )}
            {procesosFiltrados.map(p => {
              const meta = RESULTADO_META[p.evaluacion?.resultado] || RESULTADO_META.indeterminado;
              const sel = selected === p.nid_proceso && drawerOpen;
              const pct = cap > 0 ? Math.round(((p.valor_referencial || 0) / cap) * 100) : null;
              const pctColor = pct == null ? 'var(--ink-4)' :
                pct < 25  ? 'var(--ink-3)' :
                pct <= 100 ? 'var(--ok)' :
                'var(--danger)';
              const plantel = p.evaluacion?.plantel;
              const isIndet = p.evaluacion?.resultado === 'indeterminado';
              const motivo = isIndet ? motivoIndet(p) : null;

              return (
                <tr
                  key={p.nid_proceso}
                  className="row-hover"
                  onClick={() => openDrawer(p.nid_proceso)}
                  style={{ cursor: 'pointer', background: sel ? 'var(--accent-soft)' : meta.bg, transition: 'background 0.1s' }}
                >
                  <td style={{ padding: 0, background: meta.stripe, width: 4 }}></td>
                  <td>
                    <span className="mono text-xs" style={{ color: 'var(--accent)', fontWeight: 600 }}>{p.nomenclatura}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, marginBottom: 2, fontSize: 12, lineHeight: 1.3 }}>{p.entidad}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 480 }}>
                      {p.descripcion_corta || p.descripcion}
                    </div>
                  </td>
                  <td className="hide-narrow">
                    <span className="mono text-xs" style={{ color: p.region ? 'var(--ink-2)' : 'var(--ink-4)' }}>
                      {p.region || '—'}
                    </span>
                  </td>
                  <td className="num-c">
                    <div style={{ fontWeight: 600, fontFamily: 'var(--mono)' }} title={fmtMontoExacto(p.valor_referencial)}>
                      {fmtMonto(p.valor_referencial)}
                    </div>
                    {pct != null && (
                      <div className="mono text-xs" style={{ color: pctColor, fontSize: 10 }}>{pct}% cap</div>
                    )}
                  </td>
                  <td className="num-c">
                    <span className="mono" style={{ color: (p.dias_restantes ?? 0) >= 15 ? 'var(--ok)' : (p.dias_restantes ?? 0) >= 7 ? 'var(--warn)' : 'var(--danger)' }}>
                      {p.dias_restantes ?? '—'}d
                    </span>
                  </td>
                  <td className="num-c hide-narrow">
                    <span className="mono" style={{ fontWeight: 600 }}>{p.score ?? '—'}</span>
                  </td>
                  <td>
                    {plantel?.total > 0 ? (
                      <span className={`chip ${plantel.cumple === 'si' ? 'green' : plantel.cumple === 'parcial' ? 'amber' : 'red'}`}>
                        {plantel.cubiertos}/{plantel.total}
                      </span>
                    ) : (
                      <span className="text-xs muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="hstack" style={{ gap: 4 }}>
                      <span className={`chip ${meta.chip}`}>{meta.label}</span>
                      {motivo && <span title={motivo.txt} style={{ fontSize: 11 }}>{motivo.icon}</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-4)' }}>›</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* DRAWER detalle */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 'min(720px, 90vw)',
            background: 'var(--bg-elev)',
            borderLeft: '1px solid var(--line)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 101,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.2s ease-out',
          }}>
            <DetailDrawer
              proceso={detalle?.proceso}
              documentos={detalle?.documentos}
              tab={tab}
              setTab={setTab}
              empresa={empresa}
              onDownload={downloadDoc}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </>
      )}

      {/* MODAL EMPRESA CRUD */}
      <EmpresaModal
        open={empresaModalOpen}
        empresa={empresa}
        onClose={() => setEmpresaModalOpen(false)}
        onSaved={(updated) => { setEmpresa(updated); pushLog('ok', 'Empresa actualizada'); }}
        api={API}
      />

      {/* CONSOLA flotante (collapsible) */}
      {consoleOpen && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16,
          width: 'min(420px, 90vw)', height: 280,
          background: '#0A0C10', color: '#8FA3F0',
          borderRadius: 8, boxShadow: 'var(--shadow-lg)',
          zIndex: 50, display: 'flex', flexDirection: 'column',
          fontFamily: 'var(--mono)', fontSize: 11,
          border: '1px solid #252931',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #252931', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#8B8B86', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              Consola scraper · {running ? 'corriendo…' : 'idle'}
            </span>
            <button onClick={() => setConsoleOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8B8B86', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
            {log.map((l, i) => {
              const c = l.lvl === 'ok' ? '#7BC69E' : l.lvl === 'warn' ? '#F7C666' : '#8FA3F0';
              return (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, lineHeight: 1.4 }}>
                  <span style={{ color: '#5C5C58', flexShrink: 0, fontSize: 10 }}>{l.t}</span>
                  <span style={{ color: c, flexShrink: 0, width: 36, fontSize: 10 }}>[{l.lvl}]</span>
                  <span style={{ color: c, fontSize: 10 }}>{l.msg}</span>
                </div>
              );
            })}
            {running && <div style={{ color: '#8FA3F0' }}>▍</div>}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media (max-width: 1100px) {
          .hide-narrow { display: none; }
        }
      `}</style>
    </div>
  );
}

// ─── DRAWER ───────────────────────────────────────────────────────────────────
function DetailDrawer({ proceso, documentos, tab, setTab, empresa, onDownload, onClose }) {
  if (!proceso) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="muted" style={{ fontSize: 13 }}>Cargando detalle…</div>
        <button onClick={onClose} className="tb-btn" style={{ marginTop: 16 }}>Cerrar</button>
      </div>
    );
  }

  const meta = RESULTADO_META[proceso.evaluacion?.resultado] || RESULTADO_META.indeterminado;
  const cap = empresa?.capacidadContratacionCAPECO || 0;
  const pct = cap > 0 ? Math.round(((proceso.valor_referencial || 0) / cap) * 100) : null;

  return (
    <>
      {/* header drawer */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
        <div className="hstack between" style={{ marginBottom: 8 }}>
          <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span className="mono text-xs" style={{ color: 'var(--accent)', fontWeight: 600 }}>{proceso.nomenclatura}</span>
            <span className={`chip ${meta.chip}`}>{meta.label}</span>
            {proceso.score != null && <span className="chip"><span className="mono">{proceso.score} pts</span></span>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{proceso.entidad}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 12 }}>
          {proceso.descripcion}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <Field l="Monto exacto" v={fmtMontoExacto(proceso.valor_referencial)} sub={pct != null ? `${pct}% capacidad` : null} />
          <Field l="Presentación" v={proceso.fecha_propuesta ? new Date(proceso.fecha_propuesta).toLocaleDateString('es-PE') : '—'} sub={`${proceso.dias_restantes ?? '—'} días restantes`} />
          <Field l="Región" v={proceso.region || '—'} sub={proceso.distrito || ''} />
          <Field l="Estado" v={proceso.estado || '—'} />
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
        {['requisitos', 'plantel', 'evaluacion', 'documentos'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px 8px', fontSize: 11, fontFamily: 'var(--mono)',
              textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
              background: 'transparent', border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t ? 'var(--accent)' : 'var(--ink-3)',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {tab === 'requisitos' && <TabRequisitos proceso={proceso} />}
        {tab === 'plantel' && <TabPlantel proceso={proceso} empresa={empresa} />}
        {tab === 'evaluacion' && <TabEvaluacion proceso={proceso} />}
        {tab === 'documentos' && <TabDocumentos proceso={proceso} documentos={documentos} onDownload={onDownload} />}
      </div>
    </>
  );
}

function TabRequisitos({ proceso }) {
  const r = proceso.requisitos;
  if (!r) return <div className="muted" style={{ fontSize: 12 }}>Sin requisitos extraídos.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      <Field l="Experiencia mínima del postor" v={r.experienciaMinima ? `S/ ${r.experienciaMinima.toLocaleString('es-PE')}` : '—'} />
      <Field l="Tipo obra similar" v={r.tipoObra || '—'} />
      <Field l="Antigüedad máx" v={r.antiguedadMaxAnios ? `${r.antiguedadMaxAnios} años` : '—'} />
      <Field l="Confianza extracción" v={r.confianza != null ? `${(r.confianza * 100).toFixed(0)}%` : '—'} />
      {proceso.lugar_ejecucion && (
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>Lugar de ejecución</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', fontStyle: 'italic', padding: 10, background: 'var(--bg-sunken)', borderRadius: 4 }}>
            {proceso.lugar_ejecucion}
          </div>
        </div>
      )}
    </div>
  );
}

function TabPlantel({ proceso, empresa }) {
  const plantelReq = proceso.plantel || [];
  const evalP = proceso.evaluacion?.plantel;

  if (!plantelReq.length) {
    return <div className="muted" style={{ fontSize: 12 }}>No se extrajeron requisitos de plantel profesional desde el PDF.</div>;
  }

  const asigMap = {};
  for (const a of (evalP?.asignaciones || [])) asigMap[a.rol] = a;

  return (
    <div>
      {evalP && (
        <div style={{ marginBottom: 14, padding: 12, background: evalP.cumple === 'si' ? 'var(--ok-soft)' : evalP.cumple === 'parcial' ? 'var(--warn-soft)' : 'var(--danger-soft)', borderRadius: 4, fontSize: 12 }}>
          <strong>{evalP.cubiertos}/{evalP.total} roles cubiertos</strong>
          {evalP.faltantes?.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 11 }}>Faltan: {evalP.faltantes.join(', ')}</div>
          )}
        </div>
      )}
      <table style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th>Rol requerido</th>
            <th>Profesión</th>
            <th>Exp. mínima</th>
            <th>Asignado</th>
          </tr>
        </thead>
        <tbody>
          {plantelReq.map((r, i) => {
            const asig = asigMap[r.rol];
            return (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.rol}</td>
                <td className="text-xs muted">{r.profesion || '—'}</td>
                <td className="mono text-xs">
                  {r.expGeneralMeses ? `${r.expGeneralMeses}m` : '—'}
                  {r.expEspecificaMeses ? ` · ${r.expEspecificaMeses}m esp` : ''}
                </td>
                <td>
                  {asig ? (
                    <span style={{ color: 'var(--ok)', fontWeight: 500 }}>✓ {asig.persona}</span>
                  ) : (
                    <span style={{ color: 'var(--danger)' }}>✗ falta</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TabEvaluacion({ proceso }) {
  const ev = proceso.evaluacion;
  if (!ev) return <div className="muted" style={{ fontSize: 12 }}>Sin evaluación.</div>;

  return (
    <div>
      <Field l="Resultado" v={RESULTADO_META[ev.resultado]?.label || ev.resultado} />
      {ev.razones?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>Razones</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.7 }}>
            {ev.razones.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
          </ul>
        </div>
      )}
      {ev.sugerenciaConsorcio && (
        <div style={{ marginTop: 14, padding: 12, background: 'var(--warn-soft)', borderRadius: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--warn-ink)', marginBottom: 6 }}>Sugerencia de consorcio</div>
          <div style={{ fontSize: 12, color: 'var(--warn-ink)', lineHeight: 1.5 }}>
            <div>Aporte empresa: <strong>{ev.sugerenciaConsorcio.aporteEmpresaPorcentaje}%</strong></div>
            <div>Gap: <strong>S/ {ev.sugerenciaConsorcio.gapMonto?.toLocaleString('es-PE')}</strong></div>
            {ev.sugerenciaConsorcio.especialidadIdeal && (
              <div>Buscar especialidad: <strong>{ev.sugerenciaConsorcio.especialidadIdeal}</strong></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabDocumentos({ proceso, documentos, onDownload }) {
  if (!documentos?.length) return <div className="muted" style={{ fontSize: 12 }}>Sin documentos descargados.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {documentos.map(d => (
        <div key={d.id} style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 12 }}>{d.filename}</div>
          <div className="muted" style={{ fontSize: 10, marginBottom: 8, fontFamily: 'var(--mono)' }}>
            {d.tipo?.toUpperCase()} · {(d.size_bytes / 1024 / 1024).toFixed(1)} MB
          </div>
          <button
            className="tb-btn primary"
            onClick={() => onDownload(proceso.nid_proceso, d.id, d.filename)}
          >
            ↓ Descargar Bases
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── helpers UI ──────────────────────────────────────────────────────────────
function FilterChip({ active, onClick, children, color }) {
  const palette = {
    green:  { bg: 'var(--ok-soft)',     fg: 'var(--ok-ink)' },
    amber:  { bg: 'var(--warn-soft)',   fg: 'var(--warn-ink)' },
    red:    { bg: 'var(--danger-soft)', fg: 'var(--danger-ink)' },
    blue:   { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)' },
  };
  const p = palette[color] || palette.blue;
  const bg = active ? p.bg : 'var(--bg-elev)';
  const fg = active ? p.fg : 'var(--ink-2)';
  const border = active ? 'transparent' : 'var(--line)';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 4,
        border: `1px solid ${border}`, background: bg, color: fg,
        fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.04em',
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function FilterGroupLabel({ children }) {
  return (
    <span style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
      {children}
    </span>
  );
}

function SliderField({ label, value, onChange, min, max, step, fmt }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <FilterGroupLabel>{label}</FilterGroupLabel>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function QuickStat({ l, v, d, color }) {
  return (
    <div style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>{l}</div>
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: color || 'var(--ink)' }}>{v}</div>
      {d && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{d}</div>}
    </div>
  );
}

function BannerItem({ l, v, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em' }}>{l}</span>
      <span style={{ fontWeight: 600, fontFamily: mono ? 'var(--mono)' : 'var(--sans)', fontSize: 12 }}>{v}</span>
    </div>
  );
}

function Field({ l, v, sub }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 3 }}>{l}</div>
      <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--mono)' }}>{v}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

window.SeacePage = SeacePage;
