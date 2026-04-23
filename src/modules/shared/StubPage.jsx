/* global React, Icon */

// Stub page for anything not built
function StubPage({ title, desc, icon }) {
  return (
    <div className="ws-inner">
      <div className="page-h">
        <div>
          <h1>{title}</h1>
          <div className="sub muted">{desc}</div>
        </div>
      </div>
      <div className="card" style={{ padding: 80, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon ? icon({ size: 28 }) : Icon.cog({ size: 28 })}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title} — módulo en integración</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 420, margin: '0 auto' }}>
          Interfaz conectada al ERP. Datos de prueba disponibles; vista completa estará lista en la siguiente iteración de diseño.
        </div>
      </div>
    </div>
  );
}

window.StubPage = StubPage;
