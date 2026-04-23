/* global React, Icon */
const { useState } = React;

const NOTIFS_DATA = [
  { id: 1, kind: 'alert',   title: 'Valorización V08 vencida',         body: 'OB-2025-021 · Belcorp — S/ 156,000 sin facturar hace 2 días.', time: 'hace 2h',  proj: 'OB-2025-021', read: false },
  { id: 2, kind: 'alert',   title: 'Sobrecosto Movimiento de tierras',  body: 'Partida 02.01.02 — desviación +11.1% sobre presupuesto.',       time: 'hace 4h',  proj: 'OB-2025-021', read: false },
  { id: 3, kind: 'warn',    title: 'OC-2026-010 pendiente aprobación',  body: 'Sodimac Perú · S/ 6,840 — lleva 2 días sin aprobarse.',         time: 'ayer',     proj: 'OB-2025-024', read: false },
  { id: 4, kind: 'warn',    title: 'Stock crítico · acero OB-2025-018', body: 'Según cronograma necesitas acero la próxima semana. Sin OC.',   time: 'ayer',     proj: 'OB-2025-018', read: true  },
  { id: 5, kind: 'insight', title: 'Oportunidad consolidar luminarias', body: 'Combinar OC con OB-2025-018 → ahorro estimado S/ 4,200.',       time: '12 Abr',   proj: 'OB-2025-021', read: true  },
  { id: 6, kind: 'insight', title: 'SEACE · 3 nuevas convocatorias',    body: 'Rubro construcción civil · Lima y Callao. Ver SEACE.',          time: '11 Abr',   proj: null,          read: true  },
];

function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState(NOTIFS_DATA);
  const unread = notifs.filter(n => !n.read).length;

  const markAll = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })));
  const markOne = (id) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));

  const kindCfg = {
    alert:   { color: 'var(--danger)',   bg: 'var(--danger-soft)',  dot: 'var(--danger)'  },
    warn:    { color: 'var(--warn-ink)', bg: 'var(--warn-soft)',    dot: 'var(--warn)'    },
    insight: { color: 'var(--accent-ink)',bg: 'var(--accent-soft)', dot: 'var(--accent)'  },
  };

  return (
    <div className="notif-panel">
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Notificaciones</span>
          {unread > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--danger)', color: '#fff', fontFamily: 'var(--mono)' }}>
              {unread}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {unread > 0 && (
            <button onClick={markAll} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
              Marcar todo leído
            </button>
          )}
          <button onClick={onClose} className="tb-icon-btn" style={{ width: 22, height: 22 }}>{Icon.x({ size: 12 })}</button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {notifs.map((n, i) => {
          const cfg = kindCfg[n.kind];
          return (
            <div
              key={n.id}
              className={'notif-item' + (!n.read ? ' unread' : '')}
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => markOne(n.id)}
            >
              {/* Dot indicador */}
              <div style={{ paddingTop: 3, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? 'var(--line-strong)' : cfg.dot }} />
              </div>
              {/* Contenido */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: 'var(--ink)', lineHeight: 1.3 }}>{n.title}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4 }}>{n.body}</div>
                {n.proj && (
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '1px 6px', borderRadius: 3 }}>
                    {n.proj}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
        <button style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Ver historial completo
        </button>
      </div>
    </div>
  );
}

window.NotifPanel = NotifPanel;
window.NOTIFS_DATA = NOTIFS_DATA; // Export to share with Topbar if needed
