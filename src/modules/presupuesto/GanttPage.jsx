/* global React, Icon, ERP_DATA, GanttParser */
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const { cotizaciones, projects, fmtPEN, fmtCompact } = ERP_DATA;

// ═══════════════════════════════════════════════════════════════
// GANTT PAGE — carga cotización · parsea XML · visualiza
// ═══════════════════════════════════════════════════════════════
function GanttPage() {
  const [cotSel, setCotSel] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploadMode, setUploadMode] = useState(false);

  const loadCotizacion = useCallback(async (cot) => {
    if (!cot.tieneGantt || !cot.ganttSource) {
      setCotSel(cot);
      setData(null);
      setErrorMsg('Esta cotización aún no tiene cronograma cargado. Adjunta un archivo XML/MPP desde "Importar".');
      return;
    }
    setCotSel(cot);
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(cot.ganttSource);
      if (!res.ok) throw new Error('No se pudo cargar ' + cot.ganttSource);
      const xml = await res.text();
      const parsed = GanttParser.parseMSProjectXML(xml);
      setData(parsed);
    } catch (e) {
      setErrorMsg('Error al parsear XML: ' + e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpload = useCallback((file) => {
    if (!file) return;
    setLoading(true);
    setErrorMsg(null);
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    if (ext === 'mpp') {
      // Mock: .mpp requiere backend (MPXJ Java / Aspose REST). Por ahora simula con el sample.
      setErrorMsg('⚙ Archivos .mpp requieren procesamiento server-side (MPXJ/Aspose). Simulando con ejemplo...');
      setTimeout(() => {
        fetch('assets/gantt-crematorio-rev03.xml')
          .then(r => r.text())
          .then(xml => {
            const parsed = GanttParser.parseMSProjectXML(xml);
            setData(parsed);
            setCotSel({
              id: file.name.replace(/\.[^.]+$/, '').slice(0, 40),
              nombre: file.name,
              cliente: 'Importado desde .mpp (simulado)',
              fechaEmision: new Date().toISOString().slice(0, 10),
              tieneGantt: true,
            });
            setUploadMode(false);
            setErrorMsg(null);
          })
          .catch(e => setErrorMsg('Error: ' + e.message))
          .finally(() => setLoading(false));
      }, 1400);
      return;
    }

    if (ext !== 'xml') {
      setErrorMsg('Formato no soportado. Usa .xml (MS Project → Guardar como XML) o .mpp');
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = GanttParser.parseMSProjectXML(e.target.result);
        setData(parsed);
        setCotSel({
          id: file.name.replace(/\.[^.]+$/, '').slice(0, 40),
          nombre: file.name,
          cliente: 'Importado desde archivo',
          fechaEmision: new Date().toISOString().slice(0, 10),
          tieneGantt: true,
        });
        setUploadMode(false);
      } catch (err) {
        setErrorMsg('Error al parsear XML: ' + err.message);
      } finally { setLoading(false); }
    };
    reader.onerror = () => { setErrorMsg('Error al leer archivo'); setLoading(false); };
    reader.readAsText(file);
  }, []);

  if (!cotSel || uploadMode) {
    return (
      <CotizacionesList
        cotizaciones={cotizaciones}
        onPick={loadCotizacion}
        onUpload={handleUpload}
        uploadMode={uploadMode}
        setUploadMode={setUploadMode}
        loading={loading}
        errorMsg={errorMsg}
      />
    );
  }

  return (
    <GanttViewer
      cotizacion={cotSel}
      data={data}
      loading={loading}
      errorMsg={errorMsg}
      onBack={() => { setCotSel(null); setData(null); setErrorMsg(null); }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// LISTA DE COTIZACIONES
// ═══════════════════════════════════════════════════════════════
function CotizacionesList({ cotizaciones, onPick, onUpload, uploadMode, setUploadMode, loading, errorMsg }) {
  const [hovering, setHovering] = useState(false);
  const fileRef = useRef(null);

  return (
    <div className="ws-inner" style={{ maxWidth: 'none' }}>
      <div className="page-h">
        <div>
          <h1>Cronograma de cotizaciones</h1>
          <div className="sub muted">Cada cotización puede adjuntar su Gantt · soporta MS Project XML y .mpp (vía MPXJ server-side)</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <button className="tb-btn primary" onClick={() => setUploadMode(v => !v)}>
            {Icon.upload({ size: 13 })} Importar cronograma
          </button>
        </div>
      </div>

      {uploadMode && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-h">
            <h3>Importar cronograma</h3>
            <button className="tb-icon-btn" onClick={() => setUploadMode(false)}>{Icon.x({ size: 12 })}</button>
          </div>
          <div className="card-b">
            {errorMsg && (
              <div style={{ padding: 10, background: 'var(--warn-soft)', color: 'var(--warn-ink)', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
                {errorMsg}
              </div>
            )}
            <div
              onDragOver={e => { e.preventDefault(); setHovering(true); }}
              onDragLeave={() => setHovering(false)}
              onDrop={e => {
                e.preventDefault(); setHovering(false);
                if (e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0]);
              }}
              onClick={() => !loading && fileRef.current?.click()}
              style={{
                border: '2px dashed ' + (hovering ? 'var(--accent)' : 'var(--line)'),
                borderRadius: 10, padding: '44px 24px', textAlign: 'center',
                background: hovering ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                cursor: loading ? 'progress' : 'pointer', transition: 'all .15s',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xml,.mpp"
                onChange={e => e.target.files[0] && onUpload(e.target.files[0])}
                style={{ display: 'none' }}
              />
              {loading ? (
                <div>
                  <div className="oc-spinner" style={{ margin: '0 auto 16px' }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Procesando archivo...</div>
                  <div className="text-xs muted">Parseando tasks, dependencias y recursos</div>
                </div>
              ) : (
                <div>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    {Icon.upload({ size: 24 })}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Arrastra archivo o haz click</div>
                  <div className="text-xs muted">.xml (MS Project export) · .mpp (requiere backend MPXJ — simulado)</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {cotizaciones.map(cot => (
          <CotizacionCard key={cot.id} cot={cot} onOpen={() => onPick(cot)} />
        ))}
      </div>
    </div>
  );
}

function CotizacionCard({ cot, onOpen }) {
  const statusChip = {
    'Aprobada':     { cls: 'green', label: 'Aprobada' },
    'Ejecutándose': { cls: 'blue',  label: 'Ejecutándose' },
    'En revisión':  { cls: 'amber', label: 'En revisión' },
    'Cerrada':      { cls: '',      label: 'Cerrada' },
  }[cot.status] || { cls: '', label: cot.status };

  return (
    <div
      className="card"
      onClick={onOpen}
      style={{
        cursor: 'pointer',
        padding: 16,
        borderLeft: `4px solid ${cot.tieneGantt ? 'var(--accent)' : 'var(--line)'}`,
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div className="hstack between" style={{ marginBottom: 8 }}>
        <span className="mono text-xs" style={{ color: 'var(--ink-3)', fontWeight: 700 }}>{cot.id}</span>
        <span className={'chip ' + statusChip.cls} style={{ fontSize: 10 }}>{statusChip.label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, minHeight: 34 }}>
        {cot.nombre}
      </div>
      <div className="text-xs muted" style={{ marginBottom: 10 }}>{cot.cliente}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--line)' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Duración</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{cot.duracionDias}d</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Monto</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ok-ink)' }}>{fmtCompact(cot.montoTotal)}</div>
        </div>
      </div>

      <div className="hstack between" style={{ fontSize: 11 }}>
        <div className="hstack" style={{ gap: 5 }}>
          <span style={{ color: 'var(--ink-4)' }}>{Icon.calendar({ size: 11 })}</span>
          <span className="mono muted">{cot.fechaInicio} → {cot.fechaFin}</span>
        </div>
        <span className="mono text-xs muted">rev {cot.revision}</span>
      </div>

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
        {cot.tieneGantt ? (
          <div className="hstack between">
            <span className="chip blue" style={{ fontSize: 10 }}>{Icon.gantt({ size: 10 })} Gantt disponible · {cot.sizeKB}KB</span>
            <span style={{ color: 'var(--accent)', fontSize: 13 }}>{Icon.right({ size: 14 })}</span>
          </div>
        ) : (
          <div className="hstack" style={{ gap: 6 }}>
            <span className="chip" style={{ fontSize: 10, background: 'var(--bg-sunken)' }}>Sin cronograma</span>
            <span className="text-xs muted">click para adjuntar</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GANTT VIEWER
// ═══════════════════════════════════════════════════════════════
const ROW_HEIGHT = 28;
const BAR_HEIGHT = 16;
const SIDEBAR_WIDTH = 400;
const ZOOM_PX_PER_DAY = { dia: 40, semana: 10, mes: 3, trimestre: 1.2 };

function GanttViewer({ cotizacion, data, loading, errorMsg, onBack }) {
  // ══ TODOS los hooks al top, antes de returns condicionales (Rules of Hooks) ══
  const [mode, setMode] = useState('basica');
  const [zoom, setZoom] = useState('semana');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [expandedUIDs, setExpandedUIDs] = useState(() => new Set());
  const [selectedUid, setSelectedUid] = useState(null);

  useEffect(() => {
    if (!data) return;
    const nivel1 = data.tasks.filter(t => t.outlineLevel <= 1).map(t => t.uid);
    setExpandedUIDs(new Set(nivel1));
  }, [data]);

  // Fallbacks para que los useMemo no crasheen cuando data es null
  const tasks = data?.tasks || [];
  const project = data?.project || null;
  const resources = data?.resources || [];

  const allVisibleTasks = useMemo(() => {
    if (!data) return [];
    const result = [];
    const stackExpanded = [true];
    for (const t of tasks) {
      const lvl = t.outlineLevel;
      let visible = true;
      for (let i = 1; i < lvl; i++) {
        if (stackExpanded[i] === false) { visible = false; break; }
      }
      if (visible && !t.hideBar) {
        if (!onlyCritical || t.critical || t.summary) result.push(t);
      }
      stackExpanded[lvl + 1] = expandedUIDs.has(t.uid);
    }
    return result;
  }, [tasks, expandedUIDs, onlyCritical, data]);

  // ══ AHORA sí: returns condicionales, después de todos los hooks ══
  if (loading) {
    return (
      <div className="ws-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="oc-spinner" style={{ marginBottom: 18 }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Cargando cronograma...</div>
        <div className="text-xs muted">Parseando XML MS Project</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="ws-inner">
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--warn)' }}>
          <div className="hstack between" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Cronograma no disponible</h3>
            {onBack && <button className="tb-btn" onClick={onBack}>← Volver</button>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{errorMsg}</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const toggleExpand = (uid) => {
    setExpandedUIDs(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const expandAll = () => setExpandedUIDs(new Set(tasks.map(t => t.uid)));
  const collapseAll = () => setExpandedUIDs(new Set(tasks.filter(t => t.outlineLevel <= 1).map(t => t.uid)));

  const kpiDuracion = Math.round((project.finishDate - project.startDate) / (1000 * 60 * 60 * 24));
  const kpiCosto = tasks[0]?.cost || 0;
  const kpiProgreso = tasks[0]?.percentComplete || 0;
  const kpiCriticas = tasks.filter(t => t.critical && !t.summary).length;
  const kpiHitos = tasks.filter(t => t.milestone).length;
  const kpiTotales = tasks.filter(t => !t.summary).length;

  const selectedTask = selectedUid != null ? tasks.find(t => t.uid === selectedUid) : null;

  return (
    <div className="ws-inner wide" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--line)', background: 'var(--bg-elev)', flexShrink: 0 }}>
        <div className="hstack between" style={{ marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
          <div className="hstack" style={{ gap: 10, minWidth: 0, flex: 1 }}>
            {onBack && <button className="tb-icon-btn" onClick={onBack} title="Volver a cotizaciones">{Icon.left({ size: 14 })}</button>}
            <div style={{ minWidth: 0 }}>
              <div className="hstack" style={{ gap: 8, marginBottom: 2 }}>
                <span className="mono text-xs" style={{ color: 'var(--ink-3)', fontWeight: 700 }}>{cotizacion.id}</span>
                <span className="chip blue" style={{ fontSize: 9 }}>{kpiTotales} tareas · {kpiHitos} hitos · {kpiCriticas} críticas</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 650 }}>
                {project.name}
              </h1>
              <div className="text-xs muted" style={{ marginTop: 2 }}>
                {cotizacion.cliente} · {project.startDate.toLocaleDateString('es-PE')} → {project.finishDate.toLocaleDateString('es-PE')}
              </div>
            </div>
          </div>

          <div className="hstack" style={{ gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
            <div className="tw-seg" style={{ height: 30 }}>
              <button className={mode === 'basica' ? 'on' : ''} onClick={() => setMode('basica')} style={{ fontSize: 11, padding: '0 12px' }}>Básica</button>
              <button className={mode === 'avanzada' ? 'on' : ''} onClick={() => setMode('avanzada')} style={{ fontSize: 11, padding: '0 12px' }}>Avanzada</button>
            </div>
            <div className="tw-seg" style={{ height: 30 }}>
              {[
                { k: 'dia', l: 'Día' }, { k: 'semana', l: 'Sem' }, { k: 'mes', l: 'Mes' }, { k: 'trimestre', l: 'Trim' },
              ].map(z => (
                <button key={z.k} className={zoom === z.k ? 'on' : ''} onClick={() => setZoom(z.k)} style={{ fontSize: 11, padding: '0 10px' }}>{z.l}</button>
              ))}
            </div>
            {mode === 'avanzada' && (
              <button
                onClick={() => setOnlyCritical(v => !v)}
                className="tb-btn"
                style={{ height: 30, fontSize: 11, background: onlyCritical ? 'var(--danger-soft)' : undefined, borderColor: onlyCritical ? 'var(--danger)' : undefined, color: onlyCritical ? 'var(--danger-ink)' : undefined }}
              >
                {onlyCritical ? '✓ ' : ''}Solo críticas
              </button>
            )}
            <button className="tb-btn" onClick={expandAll} style={{ height: 30, fontSize: 11 }}>Expandir</button>
            <button className="tb-btn" onClick={collapseAll} style={{ height: 30, fontSize: 11 }}>Colapsar</button>
            <button className="tb-btn" style={{ height: 30, fontSize: 11 }} title="Export PDF · pendiente">{Icon.download({ size: 11 })} PDF</button>
            <button className="tb-btn" style={{ height: 30, fontSize: 11 }} title="Export PNG · pendiente">{Icon.download({ size: 11 })} PNG</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <GanttKPI lbl="Duración" val={kpiDuracion + ' días'} color="var(--accent)" />
          <GanttKPI lbl="Costo total" val={fmtCompact(kpiCosto)} color="var(--ok)" />
          <GanttKPI lbl="Progreso" val={kpiProgreso + '%'} color="var(--warn-ink)" progress={kpiProgreso} />
          <GanttKPI lbl="Tareas críticas" val={kpiCriticas + ' / ' + kpiTotales} color="var(--danger)" />
          <GanttKPI lbl="Hitos" val={kpiHitos + ' hitos'} color="#7C3AED" />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>
        <GanttCanvas
          tasks={allVisibleTasks}
          allTasks={tasks}
          project={project}
          mode={mode}
          zoom={zoom}
          expandedUIDs={expandedUIDs}
          toggleExpand={toggleExpand}
          selectedUid={selectedUid}
          onSelect={setSelectedUid}
        />
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            allTasks={tasks}
            resources={resources}
            onClose={() => setSelectedUid(null)}
          />
        )}
      </div>
    </div>
  );
}

function GanttKPI({ lbl, val, color, progress }) {
  return (
    <div style={{ padding: '8px 12px', background: 'var(--bg-sunken)', borderRadius: 6, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 3 }}>{lbl}</div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{val}</div>
      {progress != null && (
        <div className="pbar" style={{ height: 3, marginTop: 4 }}>
          <span style={{ width: progress + '%', background: color }} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GANTT CANVAS (tree sidebar + timeline SVG)
// ═══════════════════════════════════════════════════════════════
function GanttCanvas({ tasks, allTasks, project, mode, zoom, expandedUIDs, toggleExpand, selectedUid, onSelect }) {
  const pxPerDay = ZOOM_PX_PER_DAY[zoom];
  const startMs = project.startDate.getTime();
  const endMs = project.finishDate.getTime();
  const totalDays = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)) + 14;
  const totalWidth = Math.ceil(totalDays * pxPerDay);
  const totalHeight = tasks.length * ROW_HEIGHT;

  const todayX = ((new Date().getTime() - startMs) / (1000 * 60 * 60 * 24)) * pxPerDay;
  const showToday = todayX >= 0 && todayX <= totalWidth;

  const taskToX = (d) => ((d.getTime() - startMs) / (1000 * 60 * 60 * 24)) * pxPerDay;

  const gridMarks = useMemo(
    () => buildGridMarks(project.startDate, new Date(endMs + 14 * 86400000), zoom, pxPerDay),
    [project, zoom, pxPerDay, endMs]
  );

  const uidToRow = useMemo(() => {
    const m = new Map();
    tasks.forEach((t, i) => m.set(t.uid, i));
    return m;
  }, [tasks]);

  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);

  // Sincronizar scroll vertical entre sidebar y timeline
  useEffect(() => {
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (!left || !right) return;
    let syncing = false;
    const syncFromLeft = () => {
      if (syncing) return;
      syncing = true;
      right.scrollTop = left.scrollTop;
      syncing = false;
    };
    const syncFromRight = () => {
      if (syncing) return;
      syncing = true;
      left.scrollTop = right.scrollTop;
      syncing = false;
    };
    left.addEventListener('scroll', syncFromLeft);
    right.addEventListener('scroll', syncFromRight);
    return () => {
      left.removeEventListener('scroll', syncFromLeft);
      right.removeEventListener('scroll', syncFromRight);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
      <div style={{ width: SIDEBAR_WIDTH, borderRight: '1px solid var(--line)', background: 'var(--bg-elev)', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ height: 56, borderBottom: '1px solid var(--line)', background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, flexShrink: 0 }}>
          <span style={{ width: 58 }}>WBS</span>
          <span style={{ flex: 1 }}>Tarea</span>
          <span style={{ width: 46, textAlign: 'right' }}>Dur.</span>
          <span style={{ width: 28, textAlign: 'center' }}>%</span>
        </div>
        <div ref={leftScrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {tasks.map((t) => (
            <TaskRow
              key={t.uid}
              task={t}
              expanded={expandedUIDs.has(t.uid)}
              hasChildren={hasChildren(t, allTasks)}
              toggleExpand={toggleExpand}
              selected={selectedUid === t.uid}
              onSelect={onSelect}
              mode={mode}
            />
          ))}
          {tasks.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-4)', fontSize: 12 }}>
              Sin tareas que mostrar
            </div>
          )}
        </div>
      </div>

      <div ref={rightScrollRef} style={{ flex: 1, overflow: 'auto', background: 'var(--bg)', minWidth: 0, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-sunken)', borderBottom: '1px solid var(--line)', height: 56 }}>
          <svg width={totalWidth} height={56} style={{ display: 'block' }}>
            {gridMarks.majorMarks.map((m, i) => (
              <g key={'maj' + i}>
                <line x1={m.x} y1={0} x2={m.x} y2={56} stroke="var(--line-strong)" strokeWidth="1" />
                <text x={m.x + 4} y={18} fontSize="10" fill="var(--ink-2)" fontFamily="Inter" fontWeight="600">{m.label}</text>
              </g>
            ))}
            {gridMarks.minorMarks.map((m, i) => (
              <g key={'min' + i}>
                <line x1={m.x} y1={28} x2={m.x} y2={56} stroke="var(--line)" strokeWidth="1" />
                {m.label && <text x={m.x + 3} y={44} fontSize="9" fill="var(--ink-3)" fontFamily="JetBrains Mono">{m.label}</text>}
              </g>
            ))}
            {showToday && (
              <g>
                <line x1={todayX} y1={0} x2={todayX} y2={56} stroke="var(--danger)" strokeWidth="1.5" />
                <text x={todayX + 4} y={52} fontSize="9" fill="var(--danger)" fontFamily="JetBrains Mono" fontWeight="700">HOY</text>
              </g>
            )}
          </svg>
        </div>

        <svg width={totalWidth} height={totalHeight} style={{ display: 'block' }}>
          {gridMarks.majorMarks.map((m, i) => (
            <line key={i} x1={m.x} y1={0} x2={m.x} y2={totalHeight} stroke="var(--line)" strokeWidth="0.5" />
          ))}
          {gridMarks.minorMarks.map((m, i) => (
            <line key={'sm' + i} x1={m.x} y1={0} x2={m.x} y2={totalHeight} stroke="var(--line)" strokeDasharray="2,3" strokeWidth="0.4" opacity="0.5" />
          ))}

          {showToday && (
            <line x1={todayX} y1={0} x2={todayX} y2={totalHeight} stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.55" />
          )}

          {tasks.map((t, i) => (
            <GanttBar
              key={t.uid}
              task={t}
              y={i * ROW_HEIGHT}
              taskToX={taskToX}
              pxPerDay={pxPerDay}
              mode={mode}
              selected={selectedUid === t.uid}
              onSelect={onSelect}
            />
          ))}

          {mode === 'avanzada' && (
            <DependencyArrows
              tasks={tasks}
              allTasks={allTasks}
              uidToRow={uidToRow}
              taskToX={taskToX}
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function hasChildren(task, allTasks) {
  const idx = allTasks.indexOf(task);
  const next = allTasks[idx + 1];
  return next && next.outlineLevel > task.outlineLevel;
}

// ═══════════════════════════════════════════════════════════════
// TASK ROW sidebar
// ═══════════════════════════════════════════════════════════════
function TaskRow({ task, expanded, hasChildren, toggleExpand, selected, onSelect, mode }) {
  const lvl = task.outlineLevel;
  const isCritical = mode === 'avanzada' && task.critical && !task.summary;
  return (
    <div
      onClick={() => onSelect(task.uid)}
      style={{
        height: ROW_HEIGHT,
        display: 'flex', alignItems: 'center',
        padding: `0 8px 0 ${8 + lvl * 14}px`,
        borderBottom: '1px solid var(--line)',
        background: selected ? 'var(--accent-soft)' : (task.summary ? 'var(--bg-sunken)' : 'transparent'),
        cursor: 'pointer',
        fontSize: 11,
        position: 'relative',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-sunken)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = task.summary ? 'var(--bg-sunken)' : 'transparent'; }}
    >
      {isCritical && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--danger)' }} />}
      <span
        style={{ width: 14, flexShrink: 0, color: 'var(--ink-4)', cursor: hasChildren ? 'pointer' : 'default' }}
        onClick={e => { e.stopPropagation(); if (hasChildren) toggleExpand(task.uid); }}
      >
        {hasChildren ? (expanded ? '▾' : '▸') : ''}
      </span>
      <span className="mono" style={{ width: 56, fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.outlineNumber || task.id}</span>
      <span style={{ flex: 1, fontWeight: task.summary ? 700 : 500, color: task.summary ? 'var(--ink)' : 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={task.name}>
        {task.milestone && '♦ '}
        {task.name}
      </span>
      <span className="mono" style={{ width: 46, textAlign: 'right', fontSize: 10, color: 'var(--ink-3)' }}>
        {task.durationLabel || (Math.round(task.durationHours / 8) + 'd')}
      </span>
      <span className="mono" style={{ width: 28, textAlign: 'center', fontSize: 10, color: task.percentComplete === 100 ? 'var(--ok)' : task.percentComplete > 0 ? 'var(--warn-ink)' : 'var(--ink-4)', fontWeight: 600 }}>
        {task.percentComplete}%
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GANTT BAR
// ═══════════════════════════════════════════════════════════════
const GROUP_COLORS = ['var(--accent)', '#7C3AED', 'var(--warn)', 'var(--ok)', '#0EA5B7', '#D97757', '#6B84E8'];

function GanttBar({ task, y, taskToX, pxPerDay, mode, selected, onSelect }) {
  const x1 = taskToX(task.start);
  const x2 = taskToX(task.finish);
  const barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2;
  const width = Math.max(x2 - x1, 3);
  const isCritical = mode === 'avanzada' && task.critical && !task.summary;
  const color = task.summary ? 'var(--ink)' : GROUP_COLORS[task.outlineLevel % GROUP_COLORS.length];
  const rowBg = selected ? 'rgba(59,91,219,0.06)' : task.summary ? 'rgba(0,0,0,0.02)' : 'transparent';

  if (task.milestone) {
    const my = y + ROW_HEIGHT / 2;
    return (
      <g onClick={() => onSelect(task.uid)} style={{ cursor: 'pointer' }}>
        <rect x="0" y={y} width="100%" height={ROW_HEIGHT} fill={rowBg} />
        <polygon
          points={`${x1},${my - 7} ${x1 + 7},${my} ${x1},${my + 7} ${x1 - 7},${my}`}
          fill={isCritical ? 'var(--danger)' : '#7C3AED'}
          stroke={isCritical ? 'var(--danger)' : '#7C3AED'}
          strokeWidth={selected ? 2.5 : 1}
        />
        <text x={x1 + 12} y={my + 3} fontSize="9" fill="var(--ink-2)" fontFamily="JetBrains Mono" pointerEvents="none">
          {task.name.slice(0, 50)}{task.name.length > 50 ? '…' : ''}
        </text>
      </g>
    );
  }

  if (task.summary) {
    return (
      <g onClick={() => onSelect(task.uid)} style={{ cursor: 'pointer' }}>
        <rect x="0" y={y} width="100%" height={ROW_HEIGHT} fill={rowBg} />
        <rect x={x1} y={barY + 3} width={width} height={BAR_HEIGHT - 6} fill="var(--ink)" />
        <polygon points={`${x1},${barY + BAR_HEIGHT - 3} ${x1 + 5},${barY + BAR_HEIGHT + 2} ${x1},${barY + BAR_HEIGHT + 2}`} fill="var(--ink)" />
        <polygon points={`${x2},${barY + BAR_HEIGHT - 3} ${x2 - 5},${barY + BAR_HEIGHT + 2} ${x2},${barY + BAR_HEIGHT + 2}`} fill="var(--ink)" />
      </g>
    );
  }

  const progressW = width * (task.percentComplete / 100);
  const slackPx = mode === 'avanzada' && task.totalSlackDays > 0 ? task.totalSlackDays * pxPerDay : 0;

  return (
    <g onClick={() => onSelect(task.uid)} style={{ cursor: 'pointer' }}>
      <rect x="0" y={y} width="100%" height={ROW_HEIGHT} fill={rowBg} />

      {slackPx > 0 && (
        <rect
          x={x2} y={barY}
          width={slackPx} height={BAR_HEIGHT}
          fill="var(--ink-4)" opacity="0.15"
          stroke="var(--ink-4)" strokeDasharray="3,3" strokeWidth="0.8"
          rx="2"
        />
      )}

      <rect
        x={x1} y={barY}
        width={width} height={BAR_HEIGHT}
        fill={color}
        opacity={task.percentComplete < 100 ? 0.35 : 0.55}
        rx="2"
        stroke={isCritical ? 'var(--danger)' : 'none'}
        strokeWidth={isCritical ? 2 : 0}
      />
      {progressW > 0 && (
        <rect x={x1} y={barY} width={progressW} height={BAR_HEIGHT} fill={color} opacity="1" rx="2" />
      )}
      {selected && (
        <rect x={x1 - 1} y={barY - 1} width={width + 2} height={BAR_HEIGHT + 2} fill="none" stroke="var(--accent)" strokeWidth="2" rx="3" />
      )}

      {width > 60 && (
        <text x={x1 + 6} y={barY + BAR_HEIGHT / 2 + 3} fontSize="9" fill={task.percentComplete > 40 ? '#FFF' : 'var(--ink)'} fontFamily="Inter" fontWeight="500" pointerEvents="none">
          {task.percentComplete > 0 ? `${task.percentComplete}%` : `${Math.round(task.durationHours / 8)}d`}
        </text>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY ARROWS (avanzada)
// ═══════════════════════════════════════════════════════════════
function DependencyArrows({ tasks, allTasks, uidToRow, taskToX }) {
  const arrows = useMemo(() => {
    const result = [];
    tasks.forEach((t) => {
      if (!t.predecessors || t.predecessors.length === 0) return;
      t.predecessors.forEach(pred => {
        const preTask = allTasks.find(x => x.uid === pred.uid);
        if (!preTask) return;
        const preRow = uidToRow.get(preTask.uid);
        const curRow = uidToRow.get(t.uid);
        if (preRow == null || curRow == null) return;

        let x1, y1, x2, y2;
        const preMid = preRow * ROW_HEIGHT + ROW_HEIGHT / 2;
        const curMid = curRow * ROW_HEIGHT + ROW_HEIGHT / 2;

        if (pred.type === 'FS' || !pred.type) {
          x1 = taskToX(preTask.finish); y1 = preMid;
          x2 = taskToX(t.start);        y2 = curMid;
        } else if (pred.type === 'SS') {
          x1 = taskToX(preTask.start);  y1 = preMid;
          x2 = taskToX(t.start);        y2 = curMid;
        } else if (pred.type === 'FF') {
          x1 = taskToX(preTask.finish); y1 = preMid;
          x2 = taskToX(t.finish);       y2 = curMid;
        } else if (pred.type === 'SF') {
          x1 = taskToX(preTask.start);  y1 = preMid;
          x2 = taskToX(t.finish);       y2 = curMid;
        }

        const critical = t.critical && preTask.critical && t.totalSlackDays === 0;
        result.push({ x1, y1, x2, y2, type: pred.type || 'FS', critical, key: `${preTask.uid}-${t.uid}-${pred.type}` });
      });
    });
    return result;
  }, [tasks, allTasks, uidToRow, taskToX]);

  return (
    <>
      <defs>
        <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 z" fill="var(--ink-3)" />
        </marker>
        <marker id="arrow-head-crit" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 z" fill="var(--danger)" />
        </marker>
      </defs>
      {arrows.map(a => {
        const midX = Math.max(a.x1 + 6, a.x2 - 8);
        const d = `M ${a.x1} ${a.y1} L ${midX} ${a.y1} L ${midX} ${a.y2} L ${a.x2 - 1} ${a.y2}`;
        return (
          <path
            key={a.key}
            d={d}
            fill="none"
            stroke={a.critical ? 'var(--danger)' : 'var(--ink-3)'}
            strokeWidth={a.critical ? 1.3 : 0.8}
            opacity={a.critical ? 0.85 : 0.4}
            markerEnd={a.critical ? 'url(#arrow-head-crit)' : 'url(#arrow-head)'}
          />
        );
      })}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// TASK DETAIL PANEL
// ═══════════════════════════════════════════════════════════════
function TaskDetailPanel({ task, allTasks, resources, onClose }) {
  const predecessors = task.predecessors.map(p => ({
    task: allTasks.find(t => t.uid === p.uid),
    ...p,
  })).filter(p => p.task);

  const successors = allTasks.filter(t =>
    t.predecessors.some(p => p.uid === task.uid)
  ).map(t => {
    const link = t.predecessors.find(p => p.uid === task.uid);
    return { task: t, type: link.type, lagMinutes: link.lagMinutes };
  });

  return (
    <div style={{ width: 340, borderLeft: '1px solid var(--line)', background: 'var(--bg-elev)', overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--bg-elev)', zIndex: 1 }}>
        <div className="hstack between" style={{ marginBottom: 6 }}>
          <span className="mono text-xs" style={{ color: 'var(--ink-3)' }}>WBS {task.wbs || task.id}</span>
          <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 12 })}</button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{task.name}</div>
        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
          {task.summary && <span className="chip" style={{ fontSize: 9 }}>Resumen</span>}
          {task.milestone && <span className="chip" style={{ fontSize: 9, background: '#EBE6FA', color: '#4526B8' }}>♦ Hito</span>}
          {task.critical && <span className="chip red" style={{ fontSize: 9 }}>⚠ Crítica</span>}
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <DetailSection title="Fechas">
          <DetailKV k="Inicio" v={task.start.toLocaleDateString('es-PE')} />
          <DetailKV k="Fin" v={task.finish.toLocaleDateString('es-PE')} />
          <DetailKV k="Duración" v={task.durationLabel || (Math.round(task.durationHours / 8) + ' días')} />
          <DetailKV k="% completado" v={task.percentComplete + '%'} />
        </DetailSection>

        {(task.totalSlackDays !== 0 || task.freeSlackDays !== 0) && (
          <DetailSection title="CPM / Holgura">
            <DetailKV k="Inicio temprano" v={task.earlyStart.toLocaleDateString('es-PE')} />
            <DetailKV k="Fin temprano" v={task.earlyFinish.toLocaleDateString('es-PE')} />
            <DetailKV k="Inicio tardío" v={task.lateStart.toLocaleDateString('es-PE')} />
            <DetailKV k="Fin tardío" v={task.lateFinish.toLocaleDateString('es-PE')} />
            <DetailKV k="Holgura total" v={task.totalSlackDays + ' días'} />
            <DetailKV k="Holgura libre" v={task.freeSlackDays + ' días'} />
          </DetailSection>
        )}

        {task.cost > 0 && (
          <DetailSection title="Costos">
            <DetailKV k="Costo total" v={fmtPEN(task.cost)} />
            {task.actualCost > 0 && <DetailKV k="Real incurrido" v={fmtPEN(task.actualCost)} />}
            {task.remainingCost > 0 && <DetailKV k="Restante" v={fmtPEN(task.remainingCost)} />}
          </DetailSection>
        )}

        {task.resourceUIDs && task.resourceUIDs.length > 0 && (
          <DetailSection title={`Recursos asignados (${task.resourceUIDs.length})`}>
            {task.resourceUIDs.map(uid => {
              const r = resources.find(x => x.uid === uid);
              if (!r || !r.name) return null;
              return (
                <div key={uid} style={{ padding: '4px 0', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="chip mono" style={{ fontSize: 10 }}>{r.initials || r.name.slice(0, 3).toUpperCase()}</span>
                  <span>{r.name}</span>
                </div>
              );
            })}
          </DetailSection>
        )}

        {predecessors.length > 0 && (
          <DetailSection title={`Predecesoras (${predecessors.length})`}>
            {predecessors.map((p, i) => (
              <div key={i} style={{ padding: '5px 0', fontSize: 11, borderBottom: i < predecessors.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div className="hstack between">
                  <span className="mono" style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--bg-sunken)' }}>{p.type}</span>
                  <span className="text-xs muted">ID {p.task.id}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.3 }}>
                  {p.task.name}
                </div>
              </div>
            ))}
          </DetailSection>
        )}

        {successors.length > 0 && (
          <DetailSection title={`Sucesoras (${successors.length})`}>
            {successors.slice(0, 20).map((s, i) => (
              <div key={i} style={{ padding: '5px 0', fontSize: 11, borderBottom: i < Math.min(successors.length, 20) - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div className="hstack between">
                  <span className="mono" style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--bg-sunken)' }}>{s.type}</span>
                  <span className="text-xs muted">ID {s.task.id}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.3 }}>
                  {s.task.name}
                </div>
              </div>
            ))}
            {successors.length > 20 && <div className="text-xs muted" style={{ padding: '5px 0' }}>+{successors.length - 20} más...</div>}
          </DetailSection>
        )}
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid var(--line)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function DetailKV({ k, v }) {
  return (
    <div className="hstack between" style={{ padding: '3px 0', fontSize: 11 }}>
      <span style={{ color: 'var(--ink-3)' }}>{k}</span>
      <span className="mono" style={{ color: 'var(--ink)', fontWeight: 500 }}>{v}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRID temporal según zoom
// ═══════════════════════════════════════════════════════════════
function buildGridMarks(startDate, endDate, zoom, pxPerDay) {
  const majorMarks = [];
  const minorMarks = [];
  const startMs = startDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

  const d = new Date(startDate);
  while (d <= endDate) {
    const x = ((d.getTime() - startMs) / oneDayMs) * pxPerDay;

    if (zoom === 'dia') {
      if (d.getDate() === 1) majorMarks.push({ x, label: monthNames[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) });
      minorMarks.push({ x, label: String(d.getDate()) });
    } else if (zoom === 'semana') {
      if (d.getDate() === 1) majorMarks.push({ x, label: monthNames[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) });
      if (d.getDay() === 1) minorMarks.push({ x, label: String(d.getDate()) });
    } else if (zoom === 'mes') {
      if (d.getDate() === 1) {
        if (d.getMonth() % 3 === 0) majorMarks.push({ x, label: 'Q' + (Math.floor(d.getMonth() / 3) + 1) + ' ' + d.getFullYear() });
        minorMarks.push({ x, label: monthNames[d.getMonth()] });
      }
    } else if (zoom === 'trimestre') {
      if (d.getDate() === 1 && d.getMonth() === 0) majorMarks.push({ x, label: String(d.getFullYear()) });
      if (d.getDate() === 1 && d.getMonth() % 3 === 0) minorMarks.push({ x, label: 'Q' + (Math.floor(d.getMonth() / 3) + 1) });
    }

    d.setDate(d.getDate() + 1);
  }

  return { majorMarks, minorMarks };
}

window.GanttPage = GanttPage;
window.GanttViewer = GanttViewer;
