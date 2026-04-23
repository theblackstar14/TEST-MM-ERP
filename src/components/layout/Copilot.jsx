/* global React, Icon */

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

window.Copilot = Copilot;
