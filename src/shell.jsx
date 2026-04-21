/* global React, Icon, ERP_DATA */
const { useState, useEffect, useMemo, useRef } = React;

// ---------- Sidebar ----------
function Sidebar({ route, onNav }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dash', section: 'operación' },
    { id: 'licitaciones', label: 'Licitaciones', icon: 'bid', section: 'operación', badge: '9' },
    { id: 'seace', label: 'SEACE', icon: 'cloud', section: 'operación', badge: '3' },
    { id: 'proyectos', label: 'Proyectos', icon: 'project', section: 'operación', badge: '4' },
    { id: 'presupuesto', label: 'Presupuesto', icon: 'budget', section: 'ingeniería' },
    { id: 'comparador', label: 'Comparador v', icon: 'compare', section: 'ingeniería' },
    { id: 'gantt', label: 'Cronograma', icon: 'gantt', section: 'ingeniería' },
    { id: 'finanzas', label: 'Finanzas', icon: 'money', section: 'administración' },
    { id: 'compras', label: 'Compras', icon: 'cart', section: 'administración' },
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
      </div>
    </aside>
  );
}

// ---------- Notificaciones ----------
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

// ---------- Topbar ----------
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

// ---------- Tweaks panel ----------
function Tweaks({ visible, state, setState, onClose }) {
  if (!visible) return null;
  return (
    <div className="tw-panel" data-om-ignore>
      <h4>
        Tweaks
        <button className="tb-icon-btn" style={{ width: 22, height: 22 }} onClick={onClose}>{Icon.x({ size: 12 })}</button>
      </h4>
      <div className="tw-body">
        <div className="tw-row">
          <label>Tema</label>
          <div className="tw-seg">
            <button className={state.theme === 'light' ? 'on' : ''} onClick={() => setState({ theme: 'light' })}>Claro</button>
            <button className={state.theme === 'dark' ? 'on' : ''} onClick={() => setState({ theme: 'dark' })}>Oscuro</button>
          </div>
        </div>
        <div className="tw-row">
          <label>Sidebar</label>
          <div className="tw-seg">
            <button className={state.sidebar === 'full' ? 'on' : ''} onClick={() => setState({ sidebar: 'full' })}>Full</button>
            <button className={state.sidebar === 'icon' ? 'on' : ''} onClick={() => setState({ sidebar: 'icon' })}>Solo ícono</button>
            <button className={state.sidebar === 'collapsed' ? 'on' : ''} onClick={() => setState({ sidebar: 'collapsed' })}>Oculto</button>
          </div>
        </div>
        <div className="tw-row">
          <label>Acento</label>
          <div className="tw-seg">
            <button className={state.accent === 'blue' ? 'on' : ''} onClick={() => setState({ accent: 'blue' })}>Azul</button>
            <button className={state.accent === 'indigo' ? 'on' : ''} onClick={() => setState({ accent: 'indigo' })}>Índigo</button>
            <button className={state.accent === 'teal' ? 'on' : ''} onClick={() => setState({ accent: 'teal' })}>Teal</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Copilot ----------
const SYSTEM_PROMPT = `Eres el asistente IA de MMHIGHMETRIK Engineers, empresa peruana de ingeniería y construcción.
Contexto de la empresa:
- Proyectos activos: OB-2025-021 (Edificio San Isidro, S/ 842,500), OB-2025-018 (Planta Lurín, S/ 1,240,000)
- Equipo: Ing. Mario Garcia (Jefa de obra), Arq. Pedro Quispe (Residente), Ing. Rodrigo Paredes (Costos)
- Especialidades: edificaciones, plantas industriales, obras civiles
- Sistema ERP interno con módulos: Dashboard, Licitaciones, Proyectos, Presupuesto, Finanzas, Compras, SEACE
- SEACE: plataforma peruana de contrataciones del Estado (licitaciones públicas)
Responde siempre en español, de forma concisa y profesional. Si preguntan algo fuera del contexto empresarial, redirige amablemente.`;

const SUGGESTIONS = [
  'Resume el estado actual de proyectos',
  '¿Qué licitaciones SEACE debería revisar?',
  'Alerta de presupuesto en OB-2025-021',
];

function Copilot({ open, onClose, context }) {
  const [msgs, setMsgs] = React.useState([
    { role: 'ai', text: '¡Hola Mario! Soy tu asistente IA de MMHIGHMETRIK. ¿En qué te ayudo hoy?' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const bodyRef = React.useRef(null);

  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, loading]);

  const send = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput('');
    const next = [...msgs, { role: 'user', text: q }];
    setMsgs(next);
    setLoading(true);

    const apiKey = window.ANTHROPIC_KEY;
    if (!apiKey) {
      setMsgs([...next, { role: 'ai', text: '⚠️ Falta window.ANTHROPIC_KEY en index.html.' }]);
      setLoading(false);
      return;
    }

    try {
      const history = next.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 512,
          system: SYSTEM_PROMPT + `\nContexto actual del ERP: módulo "${context}".`,
          messages: history,
        }),
      });

      const data = await res.json();
      const reply = data?.content?.[0]?.text || 'Sin respuesta.';
      setMsgs([...next, { role: 'ai', text: reply }]);
    } catch (e) {
      setMsgs([...next, { role: 'ai', text: '❌ Error: ' + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div className={'copilot' + (open ? ' open' : '')}>
      <div className="copilot-h">
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), var(--warn))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          {Icon.sparkle({ size: 14 })}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Copiloto MM·AI</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>Contexto: {context}</div>
        </div>
        <button className="tb-icon-btn" onClick={onClose}>{Icon.x({ size: 14 })}</button>
      </div>
      <div className="copilot-b" ref={bodyRef}>
        {msgs.map((m, i) => (
          <div key={i} className={'copilot-msg ' + m.role} style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
        ))}
        {loading && <div className="copilot-msg ai" style={{ opacity: 0.5 }}>···</div>}
        {!loading && msgs.length === 1 && (
          <>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', textAlign: 'center', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>— sugerencias —</div>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)} className="tb-btn" style={{ justifyContent: 'flex-start', fontWeight: 400, fontSize: 12, height: 'auto', padding: '8px 10px' }}>
                <span style={{ color: 'var(--accent)' }}>{Icon.sparkle({ size: 12 })}</span>{s}
              </button>
            ))}
          </>
        )}
      </div>
      <div className="copilot-foot">
        <div className="tb-search-wrap" style={{ maxWidth: 'none' }}>
          <span className="ico">{Icon.sparkle({ size: 14 })}</span>
          <input
            placeholder="Pregúntale algo al copiloto…"
            style={{ paddingLeft: 30 }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}

window.Shell = { Sidebar, Topbar, Tweaks, Copilot };
