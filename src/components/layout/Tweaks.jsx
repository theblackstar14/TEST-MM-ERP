/* global React, Icon */

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

window.Tweaks = Tweaks;
