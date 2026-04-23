/* global React, ReactDOM, Sidebar, Topbar, Tweaks, Copilot, DashboardPage, ProjectDetail, LicitacionesPage, SeacePage, ProyectosPage, PresupuestoPage, ComparadorPage, GanttPage, FinanzasPage, ComprasPage, InventarioPage, ContabilidadPage, PersonalPage, DocsPage, StubPage, LoginPage, Icon, ERP_DATA */
const { useState, useEffect, useMemo } = React;

function App() {
  // Auth: lee sesión persistida al montar. Si falta → render LoginPage
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('mm.erp.auth') || sessionStorage.getItem('mm.erp.auth');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  });

  const handleLogout = () => {
    try { localStorage.removeItem('mm.erp.auth'); sessionStorage.removeItem('mm.erp.auth'); } catch (e) { }
    setSession(null);
  };

  const [route, setRoute] = useState('dashboard');
  const [projectDrill, setProjectDrill] = useState(null);
  const [tweaks, setTweaks] = useState({ theme: 'light', sidebar: 'full', accent: 'blue' });
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Sync theme to body attr
  useEffect(() => {
    document.body.setAttribute('data-theme', tweaks.theme);
  }, [tweaks.theme]);

  // Gate: sin sesión → login screen
  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  const nav = (r) => { setRoute(r); setProjectDrill(null); if (window.innerWidth < 1000) setTweaks({ ...tweaks, sidebar: 'collapsed' }); };

  const crumbs = useMemo(() => {
    const map = {
      dashboard: ['Principal', 'Dashboard'],
      licitaciones: ['Operación', 'Licitaciones'],
      seace: ['Operación', 'SEACE'],
      proyectos: ['Operación', 'Proyectos'],
      presupuesto: ['Ingeniería', 'Presupuesto'],
      comparador: ['Ingeniería', 'Comparador'],
      gantt: ['Ingeniería', 'Cronograma'],
      finanzas: ['Administración', 'Finanzas'],
      contabilidad: ['Administración', 'Contabilidad'],
      compras: ['Administración', 'Compras'],
      inventario: ['Administración', 'Inventario'],
      rrhh: ['Administración', 'Personal'],
      docs: ['Archivo', 'Documentos'],
    };
    const base = map[route] || ['ERP'];
    if (projectDrill) return [...base, projectDrill];
    return base;
  }, [route, projectDrill]);

  return (
    <div className="app" data-sb={tweaks.sidebar}>
      <Sidebar route={route} onNav={nav} onLogout={handleLogout} session={session} />
      <main className="main">
        <Topbar
          crumbs={crumbs}
          theme={tweaks.theme}
          onToggleSidebar={() => setTweaks(s => ({ ...s, sidebar: s.sidebar === 'full' ? 'icon' : s.sidebar === 'icon' ? 'collapsed' : 'full' }))}
          onToggleCopilot={() => setCopilotOpen(!copilotOpen)}
          onToggleTheme={() => setTweaks(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}
        />
        <div className="ws">
          {projectDrill ? (
            <ProjectDetail projectId={projectDrill} onBack={() => setProjectDrill(null)} />
          ) : (
            <>
              {route === 'dashboard'    && <DashboardPage onDrillProject={setProjectDrill} />}
              {route === 'licitaciones' && <LicitacionesPage />}
              {route === 'seace'        && <SeacePage />}
              {route === 'proyectos'     && <ProyectosPage onDrillProject={setProjectDrill} />}
              {route === 'presupuesto'  && <PresupuestoPage />}
              {route === 'comparador'   && <ComparadorPage />}
              {route === 'gantt'        && <GanttPage />}
              {route === 'finanzas'     && <FinanzasPage />}
              {route === 'contabilidad' && <ContabilidadPage />}
              {route === 'compras'      && <ComprasPage />}
              {route === 'inventario'   && <InventarioPage />}
              {route === 'rrhh'         && <PersonalPage />}
              {route === 'docs'         && <DocsPage />}
            </>
          )}
        </div>
      </main>

      <Copilot open={copilotOpen} onClose={() => setCopilotOpen(false)} context={route} />

      {/* Tweaks trigger (invisible area) */}
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: 40, height: 40, cursor: 'pointer', zIndex: 99 }} onClick={() => setTweaksVisible(true)} />
      <Tweaks visible={tweaksVisible} state={tweaks} setState={setTweaks} onClose={() => setTweaksVisible(false)} />
    </div>
  );
}

window.App = App;
