/* global React, Icon */
const { useState } = React;

function Sidebar({ route, onNav, onLogout, session }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dash', section: 'operación' },
    { id: 'licitaciones', label: 'Licitaciones', icon: 'bid', section: 'operación', badge: '9' },
    { id: 'seace', label: 'SEACE', icon: 'cloud', section: 'operación', badge: '3' },
    { id: 'proyectos', label: 'Proyectos', icon: 'project', section: 'operación', badge: '4' },
    { id: 'presupuesto', label: 'Presupuesto', icon: 'budget', section: 'ingeniería' },
    { id: 'comparador', label: 'Comparador v', icon: 'compare', section: 'ingeniería' },
    { id: 'gantt', label: 'Cronograma', icon: 'gantt', section: 'ingeniería' },
    { id: 'finanzas', label: 'Finanzas', icon: 'money', section: 'administración' },
    { id: 'contabilidad', label: 'Contabilidad', icon: 'book', section: 'administración' },
    { id: 'compras', label: 'Compras', icon: 'cart', section: 'administración' },
    { id: 'inventario', label: 'Inventario', icon: 'box', section: 'administración' },
    { id: 'rrhh', label: 'Personal', icon: 'team', section: 'administración' },
    { id: 'docs', label: 'Documentos', icon: 'docs', section: 'archivo' },
  ];
  const groups = {};
  items.forEach(i => { (groups[i.section] = groups[i.section] || []).push(i); });

  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="sb-logo">MM</div>
        <div className="sb-brand-text">
          <div className="t1">MMHIGHMETRIK</div>
          <div className="t2">Engineers ERP</div>
        </div>
      </div>
      {Object.entries(groups).map(([sec, arr]) => (
        <div key={sec} className="sb-section">
          <div className="sb-section-label">{sec}</div>
          <nav className="sb-nav">
            {arr.map(it => (
              <button
                key={it.id}
                className={'sb-item' + (route === it.id ? ' active' : '')}
                onClick={() => onNav(it.id)}
                title={it.label}
              >
                <span className="ico">{Icon[it.icon]({ size: 16 })}</span>
                <span className="label">{it.label}</span>
                {it.badge && <span className="badge">{it.badge}</span>}
              </button>
            ))}
          </nav>
        </div>
      ))}
      <div className="sb-foot">
        <div className="sb-avatar">MG</div>
        <div className="sb-foot-text">
          <div className="t1">Mario Garcia</div>
          <div className="t2">Ing. proyectos</div>
        </div>
        <button
          onClick={() => { onLogout && onLogout(); }}
          title={'Cerrar sesión' + (session?.email ? ' · ' + session.email : '')}
          style={{
            marginLeft: 'auto', width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--line)', background: 'var(--bg-elev)',
            color: 'var(--ink-3)', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <path d="M16 17l5-5-5-5"/>
            <path d="M21 12H9"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
