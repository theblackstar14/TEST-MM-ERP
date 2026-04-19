/* global React, Icon, ERP_DATA */
const { useState, useMemo } = React;
const { fmtPEN } = ERP_DATA;

// ── Helpers ──────────────────────────────────────────────────────
const AVATAR_COLORS = ['#3B5BDB','#F59F00','#2F7D5C','#7C3AED','#D1453B','#0EA5B7','#D97757','#6B84E8'];
function avatarColor(name) {
  if (!name) return '#6B7280';
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
function initials(name) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[p.length - 1][0] || '')).toUpperCase();
}
function shortName(name) {
  if (!name) return '—';
  return name.replace('Ing. ', '').replace('Arq. ', '');
}
function riskLabel(r) { return r === 'high' ? 'Alto' : r === 'medium' ? 'Medio' : 'Bajo'; }
function riskChip(r)  { return r === 'high' ? 'red'  : r === 'medium' ? 'amber' : 'green'; }
function statusChip(s){ return s === 'En ejecución' ? 'blue' : s === 'Licitación' ? 'amber' : 'green'; }

function barColor(pct) {
  if (pct >= 70) return 'var(--ok)';
  if (pct >= 40) return 'var(--warn)';
  return 'var(--danger)';
}

function daysLeft(endDate) {
  const end = new Date(endDate);
  const now = new Date('2026-04-18');
  return Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));
}

// ── ProjectCard ──────────────────────────────────────────────────
function ProjectCard({ p, index, onClick }) {
  const pctF  = p.progressFisico * 100;
  const pctFi = p.progressFinanciero * 100;
  const bc    = barColor(pctF);
  const days  = daysLeft(p.endDate);
  const daysC = days < 30 ? 'var(--danger)' : days < 90 ? 'var(--warn-ink)' : 'var(--ink-2)';
  const delay    = `${index * 0.06}s`;
  const barDelay = `${0.15 + index * 0.06}s`;

  return (
    <div
      className="proj-card animate-card-in"
      style={{ animationDelay: delay }}
      onClick={() => onClick(p.id)}
    >
      {/* ── Header: código + chips ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>{p.id}</span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className={'chip ' + statusChip(p.status)}>
            <span className="dot" />
            {p.status}
          </span>
          <span className={'chip ' + riskChip(p.risk)}>
            Riesgo {riskLabel(p.risk)}
          </span>
        </div>
      </div>

      {/* ── Nombre + cliente + ubicación ── */}
      <div style={{ marginBottom: 14 }}>
        <div
          className="proj-card-name"
          style={{
            fontSize: 14, fontWeight: 600, color: 'var(--ink)',
            lineHeight: 1.35, marginBottom: 3,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            transition: 'color .15s',
          }}
        >
          {p.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>{p.client}</div>
        {p.location && (
          <div style={{ fontSize: 10, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.location.split(',')[0]}
            </span>
          </div>
        )}
      </div>

      {/* ── Barras de avance ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Avance físico</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: bc, fontFamily: 'var(--mono)' }}>{pctF.toFixed(0)}%</span>
        </div>
        <div className="pbar" style={{ height: 6, marginBottom: 8 }}>
          <span
            className="animate-bar-grow"
            style={{ width: pctF + '%', background: bc, animationDelay: barDelay, boxShadow: `0 0 5px ${bc}66` }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Avance financiero</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warn-ink)', fontFamily: 'var(--mono)' }}>{pctFi.toFixed(0)}%</span>
        </div>
        <div className="pbar" style={{ height: 6 }}>
          <span
            className="animate-bar-grow"
            style={{ width: pctFi + '%', background: 'var(--warn)', animationDelay: `${parseFloat(barDelay) + 0.05}s` }}
          />
        </div>
      </div>

      {/* ── 3 KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
        {[
          { lbl: 'Presupuesto', val: fmtPEN(p.budget).replace('S/ ', 'S/'), color: 'var(--ink)' },
          { lbl: 'Ejecutado',   val: fmtPEN(p.spent).replace('S/ ', 'S/'),  color: bc },
          {
            lbl: 'Días rest.',
            val: p.status === 'Licitación' ? '—' : days + 'd',
            color: p.status === 'Licitación' ? 'var(--ink-4)' : daysC,
          },
        ].map(k => (
          <div key={k.lbl} style={{ textAlign: 'center', padding: '6px 4px', background: 'var(--bg-sunken)', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{k.lbl}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: k.color, fontFamily: 'var(--mono)' }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── Footer: avatar + hitos + flecha ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: avatarColor(p.manager),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials(p.manager)}
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortName(p.manager)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {p.hitosTotal > 0 && (
            <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>
              {p.hitos}/{p.hitosTotal} hitos
            </span>
          )}
          <span className="proj-card-arrow" style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, transition: 'color .15s' }}>
            Ver proyecto
            <span className="arrow-icon">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── ProyectosPage ────────────────────────────────────────────────
function ProyectosPage({ onDrillProject }) {
  const { projects } = ERP_DATA;
  const [filtro, setFiltro] = useState('todos');
  const [q, setQ]           = useState('');

  const enEjecucion = projects.filter(p => p.status === 'En ejecución');
  const enRiesgo    = projects.filter(p => p.risk === 'high');
  const enLicitacion = projects.filter(p => p.status === 'Licitación');
  const budgetTotal  = projects.reduce((s, p) => s + p.budget, 0);

  const FILTROS = [
    { key: 'todos',     label: 'Todos',        count: projects.length },
    { key: 'ejecucion', label: 'En ejecución', count: enEjecucion.length },
    { key: 'riesgo',    label: 'En riesgo',    count: enRiesgo.length },
    { key: 'licitacion',label: 'Licitación',   count: enLicitacion.length },
  ];

  const STATS = [
    { lbl: 'Total proyectos', val: projects.length,       color: 'var(--ink)',      sub: `${new Set(projects.map(p => p.status)).size} estados distintos` },
    { lbl: 'En ejecución',    val: enEjecucion.length,    color: 'var(--ok)',       sub: fmtPEN(enEjecucion.reduce((s, p) => s + p.budget, 0)) + ' activo' },
    { lbl: 'En riesgo',       val: enRiesgo.length,       color: 'var(--danger)',   sub: 'Requieren atención' },
    { lbl: 'En licitación',   val: enLicitacion.length,   color: 'var(--warn-ink)', sub: 'Propuestas activas' },
    { lbl: 'Cartera total',   val: fmtPEN(budgetTotal),   color: 'var(--accent)',   sub: 'Presupuesto vigente' },
  ];

  const lista = useMemo(() => {
    let arr = projects;
    if (filtro === 'ejecucion')  arr = enEjecucion;
    else if (filtro === 'riesgo')     arr = enRiesgo;
    else if (filtro === 'licitacion') arr = enLicitacion;
    if (q) arr = arr.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.id.toLowerCase().includes(q.toLowerCase()) ||
      p.client.toLowerCase().includes(q.toLowerCase())
    );
    return arr;
  }, [filtro, q]);

  return (
    <div className="ws-inner">

      {/* ── Header ── */}
      <div className="page-h">
        <div>
          <h1>Proyectos</h1>
          <div className="sub muted">{projects.length} proyectos registrados · MMHIGHMETRIK Engineers</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <button className="tb-btn">{Icon.upload({ size: 13 })} Importar</button>
          <button className="tb-btn primary">{Icon.plus({ size: 13 })} Nuevo proyecto</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {STATS.map((s, i) => (
          <div
            key={s.lbl}
            className="card animate-fade-in"
            style={{ padding: 14, animationDelay: `${i * 0.04}s` }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: s.color, lineHeight: 1.1, marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 2 }}>{s.lbl}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTROS.map(f => {
            const active = filtro === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 6, border: '1px solid',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  transition: 'all .15s',
                  background:   active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                  borderColor:  active ? 'var(--accent)'      : 'var(--line)',
                  color:        active ? 'var(--accent-ink)'  : 'var(--ink-3)',
                }}
              >
                {f.label}
                <span style={{
                  fontSize: 10, padding: '1px 5px', borderRadius: 3,
                  fontFamily: 'var(--mono)', fontWeight: 600,
                  background: active ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                  color:      active ? 'var(--accent)'      : 'var(--ink-4)',
                }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            {Icon.search({ size: 13 })}
          </span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar proyecto..."
            style={{
              paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
              background: 'var(--bg-elev)', border: '1px solid var(--line)',
              borderRadius: 6, fontSize: 12, color: 'var(--ink)', outline: 'none',
              width: 200, transition: 'border-color .15s',
            }}
          />
        </div>
      </div>

      {/* ── Grid de cards ── */}
      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-4)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6 }}>Sin resultados</div>
          <div style={{ fontSize: 12 }}>
            {q ? `No se encontraron proyectos para "${q}"` : 'No hay proyectos en este filtro'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {lista.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} onClick={onDrillProject} />
          ))}
        </div>
      )}

    </div>
  );
}

window.ProyectosPage = ProyectosPage;
