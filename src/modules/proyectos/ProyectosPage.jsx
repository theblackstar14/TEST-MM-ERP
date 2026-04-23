/* global React, Icon, ERP_DATA, L */
const { useState, useMemo, useEffect, useRef } = React;
const { fmtPEN } = ERP_DATA;

// ── Helpers ──────────────────────────────────────────────────────
function riskLabel(r) { return r === 'high' ? 'Alto' : r === 'medium' ? 'Medio' : 'Bajo'; }
function riskChip(r)  { return r === 'high' ? 'red'  : r === 'medium' ? 'amber' : 'green'; }
function statusChip(s){ return s === 'En ejecución' ? 'blue' : s === 'Licitación' ? 'amber' : 'green'; }

// ── Componente de Mapa de Proyectos (Leaflet con NASA & Weather) ──
function ProjectMap({ projects, onProjectClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [nasaEvents, setNasaEvents] = useState([]);
  const [showRisks, setShowRisks] = useState(true);
  const [loadingNasa, setLoadingNasa] = useState(false);

  // 1. Fetch NASA EONET API (Eventos Naturales en Tiempo Real)
  useEffect(() => {
    setLoadingNasa(true);
    fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20')
      .then(r => r.json())
      .then(data => {
        const events = (data.events || []).map(e => ({
          id: e.id,
          title: e.title,
          type: e.categories[0]?.title,
          lat: e.geometry[0].coordinates[1],
          lng: e.geometry[0].coordinates[0],
          link: e.sources[0]?.url
        }));
        setNasaEvents(events);
      })
      .catch(err => console.error("NASA API Error:", err))
      .finally(() => setLoadingNasa(false));
  }, []);

  // 2. Inicializar Mapa y Capas
  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [-9.19, -75.01],
      zoom: 5,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; NASA EONET | OpenStreetMap'
    }).addTo(mapInstance.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    // Capas de Proyectos
    projects.forEach(p => {
      let coords = [-12.0464, -77.0428];
      if (p.location.includes('Lurín')) coords = [-12.2694, -76.8717];
      if (p.location.includes('Iquitos')) coords = [-3.7491, -73.2538];
      if (p.location.includes('Mall del Sur')) coords = [-12.1554, -76.9405];
      if (p.location.includes('Los Olivos')) coords = [-11.9922, -77.0675];

      const markerColor = p.status === 'En ejecución' ? 'var(--accent)' : 'var(--warn)';
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      L.marker(coords, { icon: customIcon }).addTo(mapInstance.current)
        .bindPopup(`
          <div style="min-width: 160px">
            <div style="font-size: 10px; color: var(--ink-4); font-weight: 700; margin-bottom: 2px;">${p.id}</div>
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">${p.name}</div>
            <div style="font-size: 11px; color: var(--ink-3); margin-bottom: 10px;">${p.client}</div>
            <div style="display: flex; gap: 4px; margin-bottom: 10px;">
              <span class="chip blue" style="font-size: 9px">🌦️ 24°C Despejado</span>
            </div>
            <button id="pop-${p.id}" style="width: 100%; padding: 8px; background: var(--accent); color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">MONITOREAR OBRA</button>
          </div>
        `).on('popupopen', () => {
          document.getElementById(`pop-${p.id}`).onclick = () => onProjectClick(p.id);
        });
    });

    // Capas de NASA (solo si showRisks es true)
    if (showRisks) {
      nasaEvents.forEach(e => {
        const disasterIcon = L.divIcon({
          className: 'disaster-icon',
          html: `<div style="font-size: 20px; filter: drop-shadow(0 0 4px rgba(0,0,0,0.4));">🔥</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        if (e.type.includes('Wildfires')) {
          L.marker([e.lat, e.lng], { icon: disasterIcon }).addTo(mapInstance.current)
            .bindPopup(`<b style="color: var(--danger)">ALERTA NASA: INCENDIO</b><br/>${e.title}<br/><a href="${e.link}" target="_blank" style="font-size: 10px; color: var(--accent)">Ver reporte oficial</a>`);
        }
      });
    }

    return () => mapInstance.current.remove();
  }, [projects, nasaEvents, showRisks]);

  return (
    <div className="card" style={{ height: 650, position: 'relative', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      
      {/* Selector de Capas */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
        <div className="card" style={{ padding: '8px', background: 'var(--bg-elev)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button 
            className={'tb-btn ' + (showRisks ? 'primary' : '')} 
            style={{ fontSize: 10, height: 28 }}
            onClick={() => setShowRisks(!showRisks)}
          >
            {Icon.warn({ size: 12 })} Capa NASA: {showRisks ? 'ON' : 'OFF'}
          </button>
          {loadingNasa && <div style={{ fontSize: 9, color: 'var(--accent)', textAlign: 'center', fontFamily: 'var(--mono)' }}>Sincronizando...</div>}
        </div>
      </div>

      {/* Panel GeoIntel */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, pointerEvents: 'none' }}>
        <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-elev)', boxShadow: 'var(--shadow-lg)', pointerEvents: 'auto', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ fontSize: 9, color: 'var(--ink-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Centro de Control MM·AI</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Geo·Radar Satelital</div>
          <div className="vstack" style={{ gap: 8 }}>
            <div className="hstack" style={{ gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Proyectos Activos ({projects.length})</span>
            </div>
            <div className="hstack" style={{ gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)' }}>Alertas Incendio (NASA): {nasaEvents.filter(e => e.type.includes('Wildfires')).length}</span>
            </div>
            <div className="hstack" style={{ gap: 8 }}>
              <span style={{ fontSize: 18 }}>🌧️</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>Previsión Lluvias: Normal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reporte de Riesgos */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, maxWidth: 300 }}>
        <div className="card" style={{ padding: '14px', background: 'var(--bg-elev)', boxShadow: 'var(--shadow-lg)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            {Icon.sparkle({ size: 14, color: 'var(--accent)' })} Análisis de Riesgo IA
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 6px' }}>📍 <b>Iquitos:</b> Probabilidad de lluvia fuerte en 48h (85%). Sugerencia: <i>Asegurar techado de almacén regional.</i></p>
            <p style={{ margin: 0 }}>📍 <b>Lima:</b> Condiciones estables. NASA no reporta eventos sísmicos o incendios en un radio de 50km.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ProjectCard ──────────────────────────────────────────────────
function ProjectCard({ p, index, onClick }) {
  const pctF  = p.progressFisico * 100;
  const days  = Math.max(0, Math.round((new Date(p.endDate) - new Date('2026-04-18')) / 86400000));
  
  return (
    <div className="proj-card animate-card-in" style={{ animationDelay: `${index * 0.05}s` }} onClick={() => onClick(p.id)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{p.id}</span>
        <div className="hstack" style={{ gap: 4 }}>
          <span className={'chip ' + statusChip(p.status)}><span className="dot" />{p.status}</span>
          <span className={'chip ' + riskChip(p.risk)}>{riskLabel(p.risk)}</span>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div className="proj-card-name" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35, marginBottom: 4 }}>{p.name}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.client}</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div className="hstack between" style={{ marginBottom: 4, fontSize: 10 }}>
          <span className="muted">Avance Físico</span>
          <span className="strong">{pctF.toFixed(0)}%</span>
        </div>
        <div className="pbar" style={{ height: 6 }}><span style={{ width: pctF + '%', background: 'var(--accent)' }} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <div className="vstack" style={{ gap: 2 }}>
          <span style={{ fontSize: 9, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Presupuesto</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>{fmtPEN(p.budget).split(',')[0]}</span>
        </div>
        <div className="vstack" style={{ gap: 2 }}>
          <span style={{ fontSize: 9, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Días rest.</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: days < 30 ? 'var(--danger)' : 'inherit' }}>{days}d</span>
        </div>
        <div className="vstack" style={{ gap: 2, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 9, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Hitos</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>{p.hitos}/{p.hitosTotal}</span>
        </div>
      </div>
    </div>
  );
}

// ── ProyectosPage ────────────────────────────────────────────────
function ProyectosPage({ onDrillProject }) {
  const { projects } = ERP_DATA;
  const [filter, setFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('map'); // Por defecto en mapa para ver las novedades
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    let res = projects;
    if (filter === 'ejecucion') res = projects.filter(p => p.status === 'En ejecución');
    if (filter === 'riesgo') res = projects.filter(p => p.risk === 'high');
    if (q) res = res.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase()));
    return res;
  }, [filter, q]);

  return (
    <div className="ws-inner">
      <div className="page-h">
        <div>
          <h1>Proyectos</h1>
          <div className="sub muted">Monitoreo satelital de obras y prevención de riesgos naturales</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <div className="tw-seg" style={{ marginRight: 10 }}>
            <button className={viewMode === 'grid' ? 'on' : ''} onClick={() => setViewMode('grid')}>{Icon.dash({ size: 13 })} Lista</button>
            <button className={viewMode === 'map' ? 'on' : ''} onClick={() => setViewMode('map')}>{Icon.compare({ size: 13 })} Geo·Radar</button>
          </div>
          <button className="tb-btn primary">{Icon.plus({ size: 13 })} Nuevo Proyecto</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div className="hstack" style={{ gap: 4 }}>
          {['todos', 'ejecucion', 'riesgo'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={'tb-btn ' + (filter === f ? 'primary' : '')} style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
        <div className="tb-search-wrap" style={{ maxWidth: 300 }}>
          <span className="ico">{Icon.search({ size: 14 })}</span>
          <input placeholder="Buscar proyecto..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {viewMode === 'map' ? (
        <ProjectMap projects={filtered} onProjectClick={onDrillProject} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} onClick={onDrillProject} />
          ))}
        </div>
      )}
    </div>
  );
}

window.ProyectosPage = ProyectosPage;
