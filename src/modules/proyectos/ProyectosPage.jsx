/* global React, Icon, ERP_DATA, L */
const { useState, useMemo, useEffect, useRef } = React;
const { fmtPEN } = ERP_DATA;

// ── Helpers ──────────────────────────────────────────────────────
function riskLabel(r) { return r === 'high' ? 'Alto' : r === 'medium' ? 'Medio' : 'Bajo'; }
function riskChip(r) { return r === 'high' ? 'red' : r === 'medium' ? 'amber' : 'green'; }
function statusChip(s) { return s === 'En ejecución' ? 'blue' : s === 'Licitación' ? 'amber' : 'green'; }
const TODAY_PR = new Date();
function daysTo(dateStr) { return Math.round((new Date(dateStr) - TODAY_PR) / 86400000); }
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; const toR = d => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1); const dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── CSV export ───────────────────────────────────────────────────
function exportCSV(rows) {
  const headers = ['ID', 'Nombre', 'Cliente', 'Estado', 'Manager', 'Presupuesto', 'Gastado', 'Avance Físico %', 'Desviación %', 'Riesgo', 'Hitos', 'Hitos Vencidos', 'Inicio', 'Fin', 'Días restantes', 'Ubicación'];
  const csv = [headers.join(',')];
  rows.forEach(p => {
    const row = [
      p.id, `"${p.name}"`, `"${p.client}"`, p.status, `"${p.manager}"`,
      p.budget, p.spent, (p.progressFisico * 100).toFixed(1), p.deviation, p.risk,
      `${p.hitos}/${p.hitosTotal}`, p.hitosVencidos || 0, p.startDate, p.endDate, daysTo(p.endDate),
      `"${p.location}"`
    ];
    csv.push(row.join(','));
  });
  const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `proyectos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── GeoRadar REAL: Open-Meteo + USGS sismos ─────────────────────
function ProjectMap({ projects, onProjectClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [weather, setWeather] = useState({}); // {projId: {temp, rainProb48h, code}}
  const [quakes, setQuakes] = useState([]);   // [{lat, lng, mag, place, time, url, ...}]
  const [loadingWx, setLoadingWx] = useState(false);
  const [loadingQk, setLoadingQk] = useState(false);
  const [showQuakes, setShowQuakes] = useState(true);

  // 1. Fetch clima Open-Meteo por proyecto (free, no API key, CORS OK)
  useEffect(() => {
    if (!projects.length) return;
    setLoadingWx(true);
    const fetches = projects.map(p =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&current=temperature_2m,weather_code&daily=precipitation_probability_max&forecast_days=3&timezone=America%2FLima`)
        .then(r => r.json())
        .then(d => ({
          id: p.id,
          temp: d.current?.temperature_2m,
          code: d.current?.weather_code,
          rainProb48h: Math.max(...(d.daily?.precipitation_probability_max || [0]).slice(0, 2)),
        }))
        .catch(() => ({ id: p.id, error: true }))
    );
    Promise.all(fetches).then(arr => {
      const m = {}; arr.forEach(x => { m[x.id] = x; });
      setWeather(m); setLoadingWx(false);
    });
  }, [projects.map(p => p.id).join(',')]);

  // 2. Fetch sismos USGS Perú bbox últimos 30 días mag≥3 (free, CORS OK)
  useEffect(() => {
    setLoadingQk(true);
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=-18.5&maxlatitude=0&minlongitude=-82&maxlongitude=-68&minmagnitude=3.5&starttime=${since}`)
      .then(r => r.json())
      .then(d => {
        const qs = (d.features || []).map(f => ({
          lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], depth: f.geometry.coordinates[2],
          mag: f.properties.mag, place: f.properties.place, time: f.properties.time, url: f.properties.url,
        }));
        setQuakes(qs);
      })
      .catch(err => console.error('USGS error:', err))
      .finally(() => setLoadingQk(false));
  }, []);

  // Clima code → emoji
  const wxIcon = (code) => {
    if (code === undefined || code === null) return '—';
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌦️';
    if (code <= 99) return '⛈️';
    return '☁️';
  };
  const wxLabel = (code) => {
    if (code === 0) return 'Despejado';
    if (code <= 3) return 'Parcialmente nublado';
    if (code <= 48) return 'Neblina';
    if (code <= 67) return 'Lluvia';
    if (code <= 77) return 'Nieve';
    if (code <= 82) return 'Chubascos';
    if (code <= 99) return 'Tormenta';
    return 'Nublado';
  };

  // 3. Inicializa mapa (solo una vez, no re-mount)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, { center: [-9.19, -75.01], zoom: 6, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap · CartoDB · Open-Meteo · USGS'
    }).addTo(mapInstance.current);
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  // 4. Paint markers (re-render al cambiar projects/weather/quakes/showQuakes)
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    // Limpia capas previas (mantiene solo tiles)
    map.eachLayer(l => { if (l instanceof L.Marker || l instanceof L.CircleMarker) map.removeLayer(l); });

    // Pines de proyectos — color por urgencia clima/riesgo
    const bounds = [];
    projects.forEach(p => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
      bounds.push([p.lat, p.lng]);
      const wx = weather[p.id] || {};
      const rainy = (wx.rainProb48h || 0) >= 60;
      const urgent = p.risk === 'high' || rainy;
      const color = urgent ? '#D2483F' : p.status === 'En ejecución' ? '#3B5BDB' : '#B45309';

      const icon = L.divIcon({
        className: 'proj-marker',
        html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px ${color}44,0 2px 8px rgba(0,0,0,.25);"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      });

      const wxLine = wx.error ? '—' : wx.temp !== undefined
        ? `${wxIcon(wx.code)} ${wx.temp.toFixed(0)}°C · ${wxLabel(wx.code)} · Lluvia 48h: <b>${wx.rainProb48h || 0}%</b>`
        : 'cargando clima…';

      L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(`
        <div style="min-width:220px;font-family:Inter,sans-serif">
          <div style="font-size:10px;color:#6B7280;font-weight:700;margin-bottom:2px;font-family:JetBrains Mono,monospace">${p.id}</div>
          <div style="font-size:13px;font-weight:700;margin-bottom:4px;line-height:1.3">${p.name}</div>
          <div style="font-size:11px;color:#6B7280;margin-bottom:8px">${p.client}</div>
          <div style="font-size:11px;padding:6px 8px;background:#F7F7F5;border-radius:6px;margin-bottom:8px">${wxLine}</div>
          <div style="font-size:11px;margin-bottom:10px">Avance: <b>${(p.progressFisico * 100).toFixed(0)}%</b> · Días rest: <b style="color:${daysTo(p.endDate) < 30 ? '#D2483F' : '#0F1115'}">${daysTo(p.endDate)}</b></div>
          <button id="pop-${p.id}" style="width:100%;padding:8px;background:#3B5BDB;color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">VER PROYECTO →</button>
        </div>
      `).on('popupopen', () => {
        const btn = document.getElementById(`pop-${p.id}`);
        if (btn) btn.onclick = () => onProjectClick(p.id);
      });
    });

    // Sismos USGS
    if (showQuakes) {
      quakes.forEach(q => {
        const r = 4 + q.mag * 1.8;
        L.circleMarker([q.lat, q.lng], {
          radius: r, color: '#B45309', fillColor: '#F59E0B', fillOpacity: 0.35, weight: 1.5,
        }).addTo(map).bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:200px">
            <div style="font-size:10px;color:#6B7280;font-family:JetBrains Mono,monospace">SISMO · USGS</div>
            <div style="font-size:18px;font-weight:700;color:#B45309">M ${q.mag.toFixed(1)}</div>
            <div style="font-size:11px;margin:4px 0">${q.place}</div>
            <div style="font-size:10px;color:#6B7280">Prof: ${q.depth.toFixed(0)}km · ${new Date(q.time).toLocaleDateString('es-PE')}</div>
            <a href="${q.url}" target="_blank" style="font-size:10px;color:#3B5BDB">Detalle oficial →</a>
          </div>
        `);
      });
    }

    // Fit bounds si hay proyectos
    if (bounds.length) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
  }, [projects, weather, quakes, showQuakes]);

  // Stats para panel overlay (calculadas real, no hardcoded)
  const wxStats = useMemo(() => {
    const vals = Object.values(weather);
    const conRiesgoLluvia = vals.filter(w => (w.rainProb48h || 0) >= 60).length;
    return { conRiesgoLluvia, total: vals.length };
  }, [weather]);

  const sismoCerca = useMemo(() => {
    if (!quakes.length || !projects.length) return null;
    let closest = null; let minDist = Infinity;
    quakes.forEach(q => {
      projects.forEach(p => {
        if (!p.lat) return;
        const d = haversine(q.lat, q.lng, p.lat, p.lng);
        if (d < minDist) { minDist = d; closest = { q, p, d }; }
      });
    });
    return closest;
  }, [quakes, projects]);

  return (
    <div className="card" style={{ height: 650, position: 'relative', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Toggle capa sismos */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
        <div className="card" style={{ padding: 8, background: 'var(--bg-elev)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className={'tb-btn ' + (showQuakes ? 'primary' : '')} style={{ fontSize: 10, height: 28 }}
            onClick={() => setShowQuakes(!showQuakes)}>
            {Icon.warn({ size: 12 })} Sismos 30d: {showQuakes ? 'ON' : 'OFF'}
          </button>
          {(loadingWx || loadingQk) && <div style={{ fontSize: 9, color: 'var(--accent)', textAlign: 'center', fontFamily: 'var(--mono)' }}>Cargando data…</div>}
        </div>
      </div>

      {/* Panel con stats reales */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
        <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-elev)', boxShadow: 'var(--shadow-lg)', borderLeft: '4px solid var(--accent)', minWidth: 260 }}>
          <div style={{ fontSize: 9, color: 'var(--ink-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Open-Meteo · USGS · Tiempo real
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Geo·Radar Operativo</div>
          <div className="vstack" style={{ gap: 8 }}>
            <div className="hstack" style={{ gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Obras activas ({projects.length})</span>
            </div>
            <div className="hstack" style={{ gap: 8 }}>
              <span style={{ fontSize: 14 }}>🌧️</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: wxStats.conRiesgoLluvia > 0 ? 'var(--danger)' : 'var(--ink-2)' }}>
                Con lluvia ≥60% 48h: <b>{wxStats.conRiesgoLluvia}</b>
              </span>
            </div>
            <div className="hstack" style={{ gap: 8 }}>
              <span style={{ fontSize: 14 }}>🌊</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>
                Sismos Perú 30d (M≥3.5): <b>{quakes.length}</b>
              </span>
            </div>
            {sismoCerca && sismoCerca.d < 200 && (
              <div style={{ padding: 8, background: 'var(--warn-soft)', borderRadius: 6, fontSize: 10, color: 'var(--warn-ink)', lineHeight: 1.4 }}>
                ⚠ Sismo M{sismoCerca.q.mag.toFixed(1)} a {sismoCerca.d.toFixed(0)}km de <b>{sismoCerca.p.id}</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ProjectCard con badges ───────────────────────────────────────
function ProjectCard({ p, index, onClick, selected, onSelect }) {
  const pctF = p.progressFisico * 100;
  const days = daysTo(p.endDate);
  const desviadoAlto = Math.abs(p.deviation) > 5;
  const hitosVenc = p.hitosVencidos || 0;
  const urgenteEntrega = days > 0 && days < 30;

  return (
    <div className="proj-card animate-card-in" style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s`, position: 'relative', borderColor: selected ? 'var(--accent)' : undefined, boxShadow: selected ? '0 0 0 3px var(--accent-soft)' : undefined }}>
      {onSelect && (
        <input type="checkbox" checked={selected} onChange={e => { e.stopPropagation(); onSelect(p.id, e.target.checked); }}
          onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', top: 10, left: 10, cursor: 'pointer', zIndex: 2 }} />
      )}
      <div onClick={() => onClick(p.id)} style={{ cursor: 'pointer', paddingLeft: onSelect ? 20 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{p.id}</span>
          <div className="hstack" style={{ gap: 4, flexWrap: 'wrap' }}>
            <span className={'chip ' + statusChip(p.status)}><span className="dot" />{p.status}</span>
            <span className={'chip ' + riskChip(p.risk)}>{riskLabel(p.risk)}</span>
          </div>
        </div>

        {/* Badges de alerta */}
        {(desviadoAlto || hitosVenc > 0 || urgenteEntrega) && (
          <div className="hstack" style={{ gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {desviadoAlto && <span className="chip red" style={{ fontSize: 9 }}>⚠ Desviación {p.deviation > 0 ? '+' : ''}{p.deviation}%</span>}
            {hitosVenc > 0 && <span className="chip red" style={{ fontSize: 9 }}>⏱ {hitosVenc} hito{hitosVenc > 1 ? 's' : ''} vencido{hitosVenc > 1 ? 's' : ''}</span>}
            {urgenteEntrega && <span className="chip amber" style={{ fontSize: 9 }}>🔥 Entrega en {days}d</span>}
          </div>
        )}

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
    </div>
  );
}

// ── KPI top bar ─────────────────────────────────────────────────
function PrKPI({ lbl, val, sub, color }) {
  return (
    <div className="kpi">
      <div className="lbl">{lbl}</div>
      <div className="val" style={{ color: color || 'var(--ink)' }}>{val}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

// ── Kanban column ───────────────────────────────────────────────
function PrKanbanCol({ title, projects, color, onDrill }) {
  return (
    <div style={{ flex: 1, minWidth: 240, background: 'var(--bg-sunken)', borderRadius: 8, padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '4px 6px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 'auto' }}>{projects.length}</span>
      </div>
      <div className="vstack" style={{ gap: 8 }}>
        {projects.length === 0 && <div style={{ fontSize: 11, color: 'var(--ink-4)', textAlign: 'center', padding: 20 }}>Sin obras</div>}
        {projects.map(p => (
          <div key={p.id} onClick={() => onDrill(p.id)} style={{
            background: 'var(--bg-elev)', borderRadius: 6, padding: 10, cursor: 'pointer',
            border: '1px solid var(--line)', borderLeft: `3px solid ${color}`,
          }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 2 }}>{p.id}</div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>{p.name}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 8 }}>{p.client}</div>
            <div className="hstack between">
              <span className="mono" style={{ fontSize: 10 }}>{fmtPEN(p.budget).split(',')[0]}</span>
              <span className={'chip ' + riskChip(p.risk)} style={{ fontSize: 9 }}>{riskLabel(p.risk)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ProyectosPage ───────────────────────────────────────────────
function ProyectosPage({ onDrillProject }) {
  const { projects } = ERP_DATA;
  const [filter, setFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('grid');
  const [q, setQ] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [sortBy, setSortBy] = useState('default'); // default | avance | desviacion | dias | monto
  const [groupByClient, setGroupByClient] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const clients = useMemo(() => Array.from(new Set(projects.map(p => p.client))).sort(), [projects]);
  const managers = useMemo(() => Array.from(new Set(projects.map(p => p.manager))).sort(), [projects]);

  const filtered = useMemo(() => {
    let res = projects;
    if (filter === 'ejecucion') res = res.filter(p => p.status === 'En ejecución');
    if (filter === 'licitacion') res = res.filter(p => p.status === 'Licitación');
    if (filter === 'riesgo') res = res.filter(p => p.risk === 'high');
    if (clientFilter) res = res.filter(p => p.client === clientFilter);
    if (managerFilter) res = res.filter(p => p.manager === managerFilter);
    if (q) res = res.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.id.toLowerCase().includes(q.toLowerCase()) ||
      p.client.toLowerCase().includes(q.toLowerCase())
    );
    // Sort
    res = [...res];
    if (sortBy === 'avance') res.sort((a, b) => b.progressFisico - a.progressFisico);
    else if (sortBy === 'desviacion') res.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
    else if (sortBy === 'dias') res.sort((a, b) => daysTo(a.endDate) - daysTo(b.endDate));
    else if (sortBy === 'monto') res.sort((a, b) => b.budget - a.budget);
    return res;
  }, [filter, q, clientFilter, managerFilter, sortBy, projects]);

  // KPIs
  const enEjecucion = projects.filter(p => p.status === 'En ejecución');
  const cartera = enEjecucion.reduce((s, p) => s + p.budget, 0);
  const enRiesgo = projects.filter(p => p.risk === 'high').length;
  const diasPromedio = enEjecucion.length
    ? Math.round(enEjecucion.reduce((s, p) => s + daysTo(p.endDate), 0) / enEjecucion.length)
    : 0;
  const margenBruto = enEjecucion.reduce((s, p) => s + (p.budget - p.spent), 0);

  const toggleSelect = (id, checked) => {
    setSelected(prev => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  };
  const clearSelection = () => setSelected(new Set());
  const selectAll = () => setSelected(new Set(filtered.map(p => p.id)));

  // Agrupar por cliente
  const grouped = useMemo(() => {
    if (!groupByClient) return null;
    const g = {};
    filtered.forEach(p => { (g[p.client] = g[p.client] || []).push(p); });
    return g;
  }, [groupByClient, filtered]);

  // Kanban stages
  const kanbanStages = useMemo(() => ({
    'Licitación': filtered.filter(p => p.status === 'Licitación'),
    'En ejecución': filtered.filter(p => p.status === 'En ejecución'),
    'Cierre': filtered.filter(p => p.progressFisico >= 0.9 && p.status === 'En ejecución'),
    'Cerrado': filtered.filter(p => p.status === 'Cerrado' || p.progressFisico >= 1),
  }), [filtered]);

  return (
    <div className="ws-inner">
      <div className="page-h">
        <div>
          <h1>Proyectos</h1>
          <div className="sub muted">Cartera de obras · monitoreo operativo y geoespacial</div>
        </div>
        <div className="hstack" style={{ gap: 6 }}>
          <div className="tw-seg" style={{ marginRight: 10 }}>
            <button className={viewMode === 'grid' ? 'on' : ''} onClick={() => setViewMode('grid')}>{Icon.dash({ size: 13 })} Lista</button>
            <button className={viewMode === 'kanban' ? 'on' : ''} onClick={() => setViewMode('kanban')}>{Icon.grip({ size: 13 })} Kanban</button>
            <button className={viewMode === 'map' ? 'on' : ''} onClick={() => setViewMode('map')}>{Icon.cloud({ size: 13 })} Geo·Radar</button>
          </div>
          <button className="tb-btn" onClick={() => exportCSV(filtered)}>{Icon.download({ size: 13 })} CSV</button>
          <button className="tb-btn primary">{Icon.plus({ size: 13 })} Nuevo Proyecto</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <PrKPI lbl="Cartera activa" val={fmtPEN(cartera)} sub={`${enEjecucion.length} obras en ejecución`} color="var(--accent)" />
        <PrKPI lbl="En riesgo alto" val={enRiesgo} sub="requieren atención" color={enRiesgo > 0 ? 'var(--danger)' : 'var(--ok)'} />
        <PrKPI lbl="Días prom. a cierre" val={diasPromedio + 'd'} sub="obras en ejecución" />
        <PrKPI lbl="Margen bruto estim." val={fmtPEN(margenBruto)} sub="budget − gastado" color="var(--ok)" />
      </div>

      {/* Filtros fila 1: chips + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="hstack" style={{ gap: 4 }}>
          {['todos', 'ejecucion', 'licitacion', 'riesgo'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={'tb-btn ' + (filter === f ? 'primary' : '')} style={{ textTransform: 'capitalize' }}>
              {f === 'licitacion' ? 'Licitación' : f}
            </button>
          ))}
        </div>
        <div className="tb-search-wrap" style={{ maxWidth: 300, flex: 1 }}>
          <span className="ico">{Icon.search({ size: 14 })}</span>
          <input placeholder="Buscar proyecto, cliente, ID..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {/* Filtros fila 2: dropdowns + sort + group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 180 }}>
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={managerFilter} onChange={e => setManagerFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12, minWidth: 180 }}>
          <option value="">Todos los managers</option>
          {managers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg-elev)', fontSize: 12 }}>
          <option value="default">Orden · default</option>
          <option value="avance">Por avance físico</option>
          <option value="desviacion">Por desviación (mayor)</option>
          <option value="dias">Por días restantes (urgentes)</option>
          <option value="monto">Por monto (mayor)</option>
        </select>
        {viewMode === 'grid' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--ink-2)' }}>
            <input type="checkbox" checked={groupByClient} onChange={e => setGroupByClient(e.target.checked)} />
            Agrupar por cliente
          </label>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
          {filtered.length} / {projects.length} obras
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-ink)' }}>
            {selected.size} seleccionada{selected.size > 1 ? 's' : ''}
          </span>
          <button className="tb-btn" style={{ fontSize: 11 }} onClick={() => exportCSV(filtered.filter(p => selected.has(p.id)))}>
            {Icon.download({ size: 11 })} Exportar selección
          </button>
          <button className="tb-btn" style={{ fontSize: 11 }} onClick={selectAll}>Seleccionar todas ({filtered.length})</button>
          <button className="tb-btn" style={{ fontSize: 11, marginLeft: 'auto' }} onClick={clearSelection}>✕ Limpiar</button>
        </div>
      )}

      {/* Body */}
      {viewMode === 'map' && <ProjectMap projects={filtered} onProjectClick={onDrillProject} />}

      {viewMode === 'kanban' && (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
          <PrKanbanCol title="Licitación" projects={kanbanStages['Licitación']} color="#F59E0B" onDrill={onDrillProject} />
          <PrKanbanCol title="En ejecución" projects={kanbanStages['En ejecución']} color="#3B5BDB" onDrill={onDrillProject} />
          <PrKanbanCol title="Cierre" projects={kanbanStages['Cierre']} color="#2F7D4A" onDrill={onDrillProject} />
          <PrKanbanCol title="Cerrado" projects={kanbanStages['Cerrado']} color="#6B7280" onDrill={onDrillProject} />
        </div>
      )}

      {viewMode === 'grid' && !groupByClient && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} onClick={onDrillProject}
              selected={selected.has(p.id)} onSelect={toggleSelect} />
          ))}
        </div>
      )}

      {viewMode === 'grid' && groupByClient && grouped && (
        <div className="vstack" style={{ gap: 20 }}>
          {Object.entries(grouped).map(([client, items]) => (
            <div key={client}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, padding: '6px 10px', background: 'var(--bg-sunken)', borderRadius: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span>{client}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{items.length} obras</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginLeft: 'auto' }}>
                  {fmtPEN(items.reduce((s, p) => s + p.budget, 0))}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {items.map((p, i) => (
                  <ProjectCard key={p.id} p={p} index={i} onClick={onDrillProject}
                    selected={selected.has(p.id)} onSelect={toggleSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
          Sin obras que coincidan con los filtros.
        </div>
      )}
    </div>
  );
}

window.ProyectosPage = ProyectosPage;
