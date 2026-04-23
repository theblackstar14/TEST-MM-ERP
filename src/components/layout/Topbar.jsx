/* global React, Icon, NotifPanel, NOTIFS_DATA */
const { useState, useEffect } = React;

function Topbar({ crumbs, onToggleSidebar, onToggleCopilot, onToggleTheme, theme }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = NOTIFS_DATA.filter(n => !n.read).length;

  // Cerrar al click fuera
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.notif-wrap')) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  return (
    <div className="tb">
      <button className="tb-icon-btn" onClick={onToggleSidebar} title="Cambiar barra lateral">{Icon.sidebar({ size: 14 })}</button>
      <div className="tb-crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="tb-search-wrap" style={{ marginLeft: 18 }}>
        <span className="ico">{Icon.search({ size: 14 })}</span>
        <input placeholder="Buscar proyectos, partidas, OC, facturas…" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="tb-actions">
        <button className="tb-btn">{Icon.upload({ size: 13 })} Importar Excel</button>
        <div className="tb-divider" />
        <button className="tb-icon-btn" onClick={onToggleTheme} title="Cambiar tema">
          {theme === 'dark' ? Icon.sun({ size: 14 }) : Icon.moon({ size: 14 })}
        </button>

        {/* Bell + dropdown */}
        <div className="notif-wrap" style={{ position: 'relative' }}>
          <button
            className="tb-icon-btn"
            title="Notificaciones"
            onClick={() => setNotifOpen(v => !v)}
            style={{ position: 'relative', background: notifOpen ? 'var(--bg-sunken)' : undefined }}
          >
            {Icon.bell({ size: 14 })}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 3,
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--danger)', color: '#fff',
                fontSize: 8, fontWeight: 700, fontFamily: 'var(--mono)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid var(--bg-elev)',
              }}>{unreadCount}</span>
            )}
          </button>
          {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
        </div>

        <button className="tb-btn primary" onClick={onToggleCopilot}>
          {Icon.sparkle({ size: 13 })} Copiloto IA
        </button>
      </div>
    </div>
  );
}

window.Topbar = Topbar;
