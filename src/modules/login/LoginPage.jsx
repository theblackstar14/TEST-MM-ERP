/* global React */
const { useState: useStateLg, useEffect: useEffectLg, useMemo: useMemoLg } = React;

/* ─────────── Accent palettes ─────────── */
const LG_ACCENTS = {
  indigo: { c: '#4F46E5', ink: '#FFFFFF', soft: '#EEF0FF', name: 'Indigo' },
  slate:  { c: '#1F2937', ink: '#FFFFFF', soft: '#EEF1F5', name: 'Grafito' },
  terra:  { c: '#B04A2F', ink: '#FFFFFF', soft: '#FAEFEA', name: 'Terracota' },
  forest: { c: '#2F5D3A', ink: '#FFFFFF', soft: '#EAF1EC', name: 'Bosque' },
};

/* ─────────── Brand logo ─────────── */
function LgBrandMark({ size = 36, accent = '#4F46E5' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: accent,
      display: 'grid', placeItems: 'center',
      color: 'white', fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 700, fontSize: size * 0.42, letterSpacing: '-0.02em',
      boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 1px 2px rgba(0,0,0,.06)',
      position: 'relative', overflow: 'hidden',
    }}>
      <svg viewBox="0 0 40 40" width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <path d="M 8 28 L 14 14 L 20 24 L 26 12 L 32 28" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <span style={{ position: 'relative' }}>MH</span>
    </div>
  );
}

function LgWordMark({ accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <LgBrandMark size={34} accent={accent} />
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: 15, color: '#0F1115' }}>
          MMHIGHMETRIK
        </div>
        <div className="lg-mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: '#8A8F98', textTransform: 'uppercase', marginTop: 2 }}>
          Engineers ERP
        </div>
      </div>
    </div>
  );
}

/* ─────────── UI bits ─────────── */
function LgLabel({ children, htmlFor, hint }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <label htmlFor={htmlFor} className="lg-mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8F98', fontWeight: 500 }}>
        {children}
      </label>
      {hint}
    </div>
  );
}

function LgField({ id, type = 'text', value, onChange, placeholder, autoComplete, invalid, rightSlot, onFocus, onBlur }) {
  const [focus, setFocus] = useStateLg(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#FFFFFF',
      border: `1px solid ${invalid ? '#D2483F' : focus ? '#0F1115' : '#E6E6E3'}`,
      borderRadius: 10,
      padding: '0 14px',
      height: 48,
      transition: 'border-color .15s, box-shadow .15s',
      boxShadow: focus ? '0 0 0 4px rgba(15,17,21,0.04)' : 'none',
    }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={(e) => { setFocus(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setFocus(false); onBlur && onBlur(e); }}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 14.5, color: '#0F1115', letterSpacing: '-0.005em',
          padding: '14px 0',
        }}
      />
      {rightSlot}
    </div>
  );
}

function LgCheck({ checked, onChange, children }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <span style={{
        width: 16, height: 16, borderRadius: 4,
        border: `1px solid ${checked ? '#0F1115' : '#E6E6E3'}`,
        background: checked ? '#0F1115' : 'white',
        display: 'grid', placeItems: 'center',
        transition: 'all .12s',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5.2 L4 7.5 L8.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      <span style={{ fontSize: 13.5, color: '#3B3F46' }}>{children}</span>
    </label>
  );
}

function LgPrimaryBtn({ children, onClick, loading, disabled, accent }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        height: 48, width: '100%', borderRadius: 10, border: 'none',
        background: disabled ? '#C7C9CE' : accent,
        color: 'white', fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.005em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'transform .08s, filter .15s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.995)')}
      onMouseUp={e => (e.currentTarget.style.transform = '')}
      onMouseLeave={e => (e.currentTarget.style.transform = '')}
    >
      {loading ? (
        <>
          <LgSpinner /> <span>Autenticando…</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8 H12 M9 5 L12 8 L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
    </button>
  );
}

function LgSpinner({ size = 14 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white',
      animation: 'lg-spin .7s linear infinite', display: 'inline-block',
    }} />
  );
}

function LgGhostBtn({ children, onClick, icon }) {
  return (
    <button onClick={onClick} style={{
      height: 44, padding: '0 14px', borderRadius: 10,
      background: 'white', border: '1px solid #E6E6E3',
      color: '#3B3F46', fontWeight: 500, fontSize: 13.5,
      display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      transition: 'border-color .15s, background .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B3F46'; e.currentTarget.style.background = '#FAFAF8'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E6E6E3'; e.currentTarget.style.background = 'white'; }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

/* ─────────── Side artwork: abstract animated topo ─────────── */
function LgSideArt({ accent, ticker }) {
  const [t, setT] = useStateLg(0);
  useEffectLg(() => {
    let r; const loop = (ts) => { setT(ts / 1000); r = requestAnimationFrame(loop); };
    r = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(r);
  }, []);

  const phrases = useMemoLg(() => [
    { k: 'Plataforma', v: 'Donde la obra y la contabilidad hablan el mismo idioma.' },
    { k: 'Precisión', v: 'De la partida al asiento contable, en un solo flujo.' },
    { k: 'Trazabilidad', v: 'Cada metrado, cada sol, cada decisión — auditados.' },
  ], []);
  const idx = Math.floor(t / 5) % phrases.length;
  const phrase = phrases[idx];

  return (
    <div style={{
      position: 'relative', height: '100%', width: '100%',
      background: 'linear-gradient(160deg, #0B0D12 0%, #11141B 55%, #191D28 100%)',
      color: 'white', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <LgTopo t={t} accent={accent} />

      <div style={{
        position: 'absolute', width: 620, height: 620, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}40 0%, transparent 62%)`,
        top: -240, right: -220, filter: 'blur(8px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 440, height: 440, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}22 0%, transparent 65%)`,
        bottom: -180, left: -140, filter: 'blur(12px)', pointerEvents: 'none',
      }} />

      <div style={{ padding: '36px 44px', position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="lg-mono" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, boxShadow: `0 0 0 4px ${accent}33` }} />
          Plataforma v4.2
        </div>
        <div className="lg-mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'rgba(255,255,255,.55)' }}>
          LIMA · {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 54px', position: 'relative', zIndex: 2,
      }}>
        <LgSeal t={t} accent={accent} />

        <div style={{ marginTop: 48, maxWidth: 480 }}>
          <div className="lg-mono" key={'k' + idx} style={{
            fontSize: 11, letterSpacing: '0.22em', color: accent,
            textTransform: 'uppercase', marginBottom: 18, fontWeight: 500,
            animation: 'lg-fadeIn .5s ease both',
          }}>
            {phrase.k}
          </div>
          <div key={'v' + idx} style={{
            fontSize: 32, lineHeight: 1.18, fontWeight: 500,
            letterSpacing: '-0.025em', color: 'rgba(255,255,255,.94)',
            animation: 'lg-fadeIn .6s ease both',
          }}>
            {phrase.v}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 36 }}>
          {phrases.map((_, i) => (
            <span key={i} style={{
              width: i === idx ? 24 : 6, height: 3, borderRadius: 3,
              background: i === idx ? accent : 'rgba(255,255,255,.2)',
              transition: 'width .4s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '0 54px 36px', position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="lg-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase' }}>
          Ingeniería · Contabilidad · Licitaciones
        </div>
        {ticker && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 0 4px rgba(74,222,128,.18)', animation: 'lg-pulse 2s ease-in-out infinite' }} />
            <span className="lg-mono" style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)', letterSpacing: '0.1em' }}>
              Servicios operativos
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LgTopo({ t, accent }) {
  const lines = 9;
  return (
    <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}>
      <defs>
        <linearGradient id="lgLineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="0.5" stopColor={accent} stopOpacity="0.35" />
          <stop offset="1" stopColor="rgba(255,255,255,0.08)" />
        </linearGradient>
      </defs>
      {Array.from({ length: lines }).map((_, i) => {
        const phase = t * 0.3 + i * 0.6;
        const amp = 30 + i * 8;
        const y0 = 80 + i * 70;
        const pts = [];
        for (let x = -20; x <= 620; x += 20) {
          const y = y0 + Math.sin((x / 120) + phase) * amp + Math.cos((x / 70) + phase * 0.7) * (amp * 0.35);
          pts.push(`${x},${y}`);
        }
        return (
          <polyline key={i} points={pts.join(' ')} fill="none"
            stroke={i === Math.floor(lines / 2) ? 'url(#lgLineGrad)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={i === Math.floor(lines / 2) ? 1.4 : 0.7} />
        );
      })}
    </svg>
  );
}

function LgSeal({ t, accent }) {
  const rot = (t * 8) % 360;
  const rot2 = (-t * 5) % 360;
  const letters = 'MMHIGHMETRIK · ENGINEERS ERP · ';
  const r = 68;
  return (
    <div style={{ position: 'relative', width: 180, height: 180 }}>
      <svg viewBox="-100 -100 200 200" width="180" height="180" style={{ position: 'absolute', inset: 0, transform: `rotate(${rot}deg)` }}>
        <defs>
          <path id="lgRing" d={`M 0,0 m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`} />
        </defs>
        <circle r={r + 8} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="0.5" />
        <circle r={r - 8} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="0.5" />
        <text fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="4" fill="rgba(255,255,255,.55)">
          <textPath href="#lgRing" startOffset="0">{letters.repeat(3)}</textPath>
        </text>
      </svg>
      <svg viewBox="-100 -100 200 200" width="180" height="180" style={{ position: 'absolute', inset: 0, transform: `rotate(${rot2}deg)` }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x1 = Math.cos(a) * (r + 18);
          const y1 = Math.sin(a) * (r + 18);
          const x2 = Math.cos(a) * (r + 24);
          const y2 = Math.sin(a) * (r + 24);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 6 === 0 ? accent : 'rgba(255,255,255,.2)'} strokeWidth={i % 6 === 0 ? 1.4 : 0.6} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <div style={{
          width: 84, height: 84, borderRadius: 20,
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          display: 'grid', placeItems: 'center',
          boxShadow: `0 10px 30px ${accent}55, inset 0 1px 0 rgba(255,255,255,.25)`,
          position: 'relative', overflow: 'hidden',
        }}>
          <svg viewBox="0 0 100 100" width="84" height="84" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
            <path d="M 10 70 L 30 30 L 50 55 L 70 20 L 90 70" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <span className="lg-mono" style={{ position: 'relative', color: 'white', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em' }}>MH</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Login form ─────────── */
function LgLoginCard({ accent, onLogin, toast }) {
  const [email, setEmail] = useStateLg('mario.garcia@mmhighmetrik.pe');
  const [pwd, setPwd] = useStateLg('');
  const [showPwd, setShowPwd] = useStateLg(false);
  const [remember, setRemember] = useStateLg(true);
  const [loading, setLoading] = useStateLg(false);
  const [caps, setCaps] = useStateLg(false);

  const submit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);
    const session = { email: email || 'guest@mmhighmetrik.pe', loginAt: new Date().toISOString(), remember };
    try { (remember ? localStorage : sessionStorage).setItem('mm.erp.auth', JSON.stringify(session)); } catch (e) { }
    toast('Acceso concedido · Entrando al ERP…');
    setTimeout(() => onLogin && onLogin(session), 400);
  };

  return (
    <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 36 }}>
        <LgWordMark accent={accent} />
      </div>

      <div style={{ marginBottom: 28 }}>
        <div className="lg-mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A8F98', marginBottom: 10 }}>
          Acceso · Portal de operaciones
        </div>
        <h1 style={{ fontSize: 32, lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: '#0F1115' }}>
          Ingresa a tu tablero de obra.
        </h1>
        <p style={{ marginTop: 12, color: '#3B3F46', fontSize: 14.5, lineHeight: 1.5, maxWidth: 360 }}>
          Gestiona proyectos, valorizaciones, SEACE y alertas críticas desde un solo lugar.
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <LgLabel htmlFor="lg-email">Correo corporativo</LgLabel>
        <LgField
          id="lg-email" type="email" value={email} onChange={setEmail}
          placeholder="nombre@mmhighmetrik.pe"
          autoComplete="username"
          rightSlot={email && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#2F7D4A', flexShrink: 0 }}>
              <path d="M3 8.5 L6.5 12 L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <LgLabel htmlFor="lg-pwd" hint={
          <a href="#" onClick={e => { e.preventDefault(); toast('Se envió un enlace de recuperación a tu correo.'); }}
            style={{ fontSize: 12.5, color: accent, textDecoration: 'none', fontWeight: 500 }}>
            ¿Olvidaste tu contraseña?
          </a>
        }>Contraseña</LgLabel>
        <LgField
          id="lg-pwd" type={showPwd ? 'text' : 'password'} value={pwd} onChange={setPwd}
          placeholder="••••••••••"
          autoComplete="current-password"
          onFocus={e => setCaps(e.getModifierState && e.getModifierState('CapsLock'))}
          rightSlot={
            <button onClick={() => setShowPwd(s => !s)} type="button" aria-label="mostrar contraseña"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#8A8F98', display: 'grid', placeItems: 'center' }}>
              {showPwd ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10 C5 6 7.5 4.5 10 4.5 C12.5 4.5 15 6 17 10 C15 14 12.5 15.5 10 15.5 C7.5 15.5 5 14 3 10Z" stroke="currentColor" strokeWidth="1.4" /><circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" /><line x1="4" y1="16" x2="16" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10 C5 6 7.5 4.5 10 4.5 C12.5 4.5 15 6 17 10 C15 14 12.5 15.5 10 15.5 C7.5 15.5 5 14 3 10Z" stroke="currentColor" strokeWidth="1.4" /><circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" /></svg>
              )}
            </button>
          }
        />
        {caps && (
          <div className="lg-mono" style={{ marginTop: 8, fontSize: 11, color: '#B45309', letterSpacing: '0.04em' }}>
            ⚠ Bloq. Mayús está activado
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <LgCheck checked={remember} onChange={setRemember}>Mantener sesión iniciada</LgCheck>
        <div className="lg-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#8A8F98', letterSpacing: '0.08em' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2.5" y="5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" />
            <path d="M4 5 V 3.5 C 4 2.3 4.9 1.5 6 1.5 C 7.1 1.5 8 2.3 8 3.5 V 5" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          2FA ACTIVO
        </div>
      </div>

      <LgPrimaryBtn onClick={submit} loading={loading} accent={accent}>
        Entrar al ERP
      </LgPrimaryBtn>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0 18px' }}>
        <div style={{ flex: 1, height: 1, background: '#E6E6E3' }} />
        <span className="lg-mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', color: '#8A8F98', textTransform: 'uppercase' }}>
          o continúa con
        </span>
        <div style={{ flex: 1, height: 1, background: '#E6E6E3' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <LgGhostBtn onClick={() => toast('SSO corporativo · Conectando a Microsoft Entra…')} icon={
          <svg width="14" height="14" viewBox="0 0 16 16"><rect x="1" y="1" width="6.5" height="6.5" fill="#F25022" /><rect x="8.5" y="1" width="6.5" height="6.5" fill="#7FBA00" /><rect x="1" y="8.5" width="6.5" height="6.5" fill="#00A4EF" /><rect x="8.5" y="8.5" width="6.5" height="6.5" fill="#FFB900" /></svg>
        }>Entra ID</LgGhostBtn>
        <LgGhostBtn onClick={() => toast('Conexión con certificado digital RENIEC')} icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="5.5" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.2" /><path d="M9 7 H 13 M9 9.5 H 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
        }>Certificado digital</LgGhostBtn>
      </div>

      <div style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="lg-mono" style={{ fontSize: 10.5, color: '#8A8F98', letterSpacing: '0.08em' }}>
          © 2026 MMHIGHMETRIK · v4.2.1
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['Soporte', 'Privacidad', 'Términos'].map(t => (
            <a key={t} href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12, color: '#8A8F98', textDecoration: 'none' }}>{t}</a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Top bar mini ─────────── */
function LgTopBarMini({ toast }) {
  return (
    <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', gap: 10, alignItems: 'center', zIndex: 3 }}>
      <div className="lg-mono" style={{ fontSize: 11, color: '#8A8F98', letterSpacing: '0.08em' }}>
        ¿No tienes cuenta?
      </div>
      <a href="#" onClick={e => { e.preventDefault(); toast('Contacta a tu administrador para crear una cuenta corporativa.'); }}
        style={{
          fontSize: 12.5, color: '#0F1115', textDecoration: 'none',
          padding: '8px 14px', border: '1px solid #E6E6E3', borderRadius: 8,
          fontWeight: 500, background: 'white',
        }}>
        Solicitar acceso →
      </a>
    </div>
  );
}

/* ─────────── Toast ─────────── */
function LgToastHost({ msg }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      pointerEvents: 'none', zIndex: 100, transition: 'opacity .3s, transform .3s',
      opacity: msg ? 1 : 0,
    }}>
      {msg && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: '#0F1115', color: 'white', borderRadius: 10,
          padding: '12px 18px', fontSize: 13.5, fontWeight: 500,
          boxShadow: '0 10px 30px rgba(0,0,0,.2)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
          {msg}
        </div>
      )}
    </div>
  );
}

/* ─────────── Main component ─────────── */
function LoginPage({ onLogin }) {
  const accent = LG_ACCENTS.slate.c;
  const [toastMsg, setToastMsg] = useStateLg(null);
  const toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(null), 3000); };

  return (
    <div className="lg-root" style={{
      minHeight: '100vh', width: '100vw',
      background: '#0F1115',
      padding: 16, display: 'flex',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#0F1115',
    }}>
      <style>{`
        .lg-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        @keyframes lg-spin { to { transform: rotate(360deg); } }
        @keyframes lg-fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lg-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .lg-root ::selection { background: ${accent}; color: white; }
      `}</style>

      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: 'minmax(440px, 1fr) 1.1fr',
        borderRadius: 18, overflow: 'hidden', background: '#F7F7F5',
        boxShadow: '0 0 0 1px rgba(255,255,255,.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 60px', position: 'relative' }}>
          <LgTopBarMini toast={toast} />
          <LgLoginCard accent={accent} onLogin={onLogin} toast={toast} />
        </div>
        <LgSideArt accent={accent} ticker={true} />
      </div>

      <LgToastHost msg={toastMsg} />
    </div>
  );
}

window.LoginPage = LoginPage;
