/* global React */
const { useState, useEffect } = React;

// Modal CRUD empresa: editar capacidad CAPECO, especialidades, experiencia, personal
function EmpresaModal({ open, empresa, onClose, onSaved, api }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (empresa) {
      setForm({
        razonSocial: empresa.razonSocial || "",
        ruc: empresa.ruc || "",
        capacidadContratacionCAPECO: empresa.capacidadContratacionCAPECO || 0,
        especialidades: [...(empresa.especialidades || [])],
        experiencia: [...(empresa.experiencia || [])],
        personal: [...(empresa.personal || [])],
      });
    }
  }, [empresa]);

  if (!open || !form) return null;

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(`${api}/api/v2/empresa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const updated = await r.json();
      onSaved(updated);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // helpers de listas
  const addEspecialidad = () => setForm(f => ({ ...f, especialidades: [...f.especialidades, ""] }));
  const setEspecialidad = (i, v) => setForm(f => ({ ...f, especialidades: f.especialidades.map((e, idx) => idx === i ? v : e) }));
  const delEspecialidad = (i) => setForm(f => ({ ...f, especialidades: f.especialidades.filter((_, idx) => idx !== i) }));

  const addExperiencia = () => setForm(f => ({ ...f, experiencia: [...f.experiencia, { obra: "", entidad: "", monto: 0, tipo: "", anio: new Date().getFullYear() }] }));
  const setExperiencia = (i, k, v) => setForm(f => ({ ...f, experiencia: f.experiencia.map((e, idx) => idx === i ? { ...e, [k]: v } : e) }));
  const delExperiencia = (i) => setForm(f => ({ ...f, experiencia: f.experiencia.filter((_, idx) => idx !== i) }));

  const addPersonal = () => setForm(f => ({ ...f, personal: [...f.personal, { nombres: "", profesion: "", expMeses: 0, especialidad: "", dni: "" }] }));
  const setPersonal = (i, k, v) => setForm(f => ({ ...f, personal: f.personal.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }));
  const delPersonal = (i) => setForm(f => ({ ...f, personal: f.personal.filter((_, idx) => idx !== i) }));

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(900px, 95vw)', maxHeight: '90vh',
        background: 'var(--bg-elev)', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Mi empresa</h2>
            <div className="sub muted" style={{ fontSize: 11 }}>Capacidad CAPECO · especialidades · experiencia · personal</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 20, padding: 4 }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Datos básicos */}
          <Section title="Datos básicos">
            <Row>
              <FormField label="Razón social" value={form.razonSocial} onChange={v => setForm(f => ({ ...f, razonSocial: v }))} />
              <FormField label="RUC" value={form.ruc} onChange={v => setForm(f => ({ ...f, ruc: v }))} />
              <FormField label="Capacidad CAPECO (S/)" type="number" value={form.capacidadContratacionCAPECO} onChange={v => setForm(f => ({ ...f, capacidadContratacionCAPECO: Number(v) }))} />
            </Row>
          </Section>

          {/* Especialidades */}
          <Section title="Especialidades" onAdd={addEspecialidad}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.especialidades.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-sunken)', borderRadius: 4, padding: '4px 8px' }}>
                  <input
                    value={e}
                    onChange={ev => setEspecialidad(i, ev.target.value)}
                    placeholder="ej. edificacion"
                    style={{ border: 'none', background: 'transparent', fontSize: 12, color: 'var(--ink)', outline: 'none', width: 120 }}
                  />
                  <button onClick={() => delEspecialidad(i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14 }}>×</button>
                </div>
              ))}
              {form.especialidades.length === 0 && <span className="muted" style={{ fontSize: 11 }}>Sin especialidades. Click "+ Añadir"</span>}
            </div>
          </Section>

          {/* Experiencia */}
          <Section title={`Experiencia (${form.experiencia.length})`} onAdd={addExperiencia}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.experiencia.map((e, i) => (
                <div key={i} style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr auto', gap: 8, alignItems: 'center' }}>
                    <FormField compact label="Obra" value={e.obra} onChange={v => setExperiencia(i, "obra", v)} />
                    <FormField compact label="Entidad" value={e.entidad} onChange={v => setExperiencia(i, "entidad", v)} />
                    <FormField compact label="Monto S/" type="number" value={e.monto} onChange={v => setExperiencia(i, "monto", Number(v))} />
                    <FormField compact label="Tipo" value={e.tipo} onChange={v => setExperiencia(i, "tipo", v)} />
                    <FormField compact label="Año" type="number" value={e.anio} onChange={v => setExperiencia(i, "anio", Number(v))} />
                    <button onClick={() => delExperiencia(i)} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Eliminar</button>
                  </div>
                </div>
              ))}
              {form.experiencia.length === 0 && <span className="muted" style={{ fontSize: 11 }}>Sin experiencia registrada</span>}
            </div>
          </Section>

          {/* Personal */}
          <Section title={`Personal (${form.personal.length} ingenieros)`} onAdd={addPersonal}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.personal.map((p, i) => (
                <div key={i} style={{ padding: 10, background: 'var(--bg-sunken)', borderRadius: 6, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <FormField compact label="Nombres" value={p.nombres} onChange={v => setPersonal(i, "nombres", v)} />
                    <FormField compact label="Profesión" value={p.profesion} onChange={v => setPersonal(i, "profesion", v)} />
                    <FormField compact label="Exp meses" type="number" value={p.expMeses} onChange={v => setPersonal(i, "expMeses", Number(v))} />
                    <FormField compact label="Especialidad" value={p.especialidad} onChange={v => setPersonal(i, "especialidad", v)} />
                    <FormField compact label="DNI" value={p.dni} onChange={v => setPersonal(i, "dni", v)} />
                    <button onClick={() => delPersonal(i)} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>×</button>
                  </div>
                </div>
              ))}
              {form.personal.length === 0 && <span className="muted" style={{ fontSize: 11 }}>Sin personal registrado</span>}
            </div>
          </Section>
        </div>

        {err && (
          <div style={{ padding: '10px 20px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', fontSize: 12 }}>
            Error: {err}
          </div>
        )}

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="tb-btn">Cancelar</button>
          <button onClick={save} disabled={saving} className="tb-btn primary">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ title, children, onAdd }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{title}</span>
        {onAdd && (
          <button onClick={onAdd} style={{ padding: '3px 10px', fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ Añadir</button>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>{children}</div>;
}

function FormField({ label, value, onChange, type = "text", compact = false }) {
  return (
    <div>
      <div style={{ fontSize: compact ? 8 : 10, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: compact ? '4px 6px' : '6px 10px', fontSize: compact ? 11 : 12, fontFamily: type === 'number' ? 'var(--mono)' : 'var(--sans)', border: '1px solid var(--line)', borderRadius: 4, background: 'var(--bg-elev)', color: 'var(--ink)' }}
      />
    </div>
  );
}

window.EmpresaModal = EmpresaModal;
