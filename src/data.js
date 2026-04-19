// MMHIGHMETRIK realistic dataset — Peru, PEN
window.ERP_DATA = (() => {
  const fmtPEN = (n) => {
    const neg = n < 0;
    const v = Math.abs(n);
    const s = v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (neg ? '-' : '') + 'S/ ' + s;
  };
  const fmtInt = (n) => n.toLocaleString('es-PE');
  const fmtPct = (n) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';

  const projects = [
    {
      id: 'OB-2025-021',
      name: 'Remodelación oficinas corporativas — San Isidro',
      client: 'Corporación Belcorp S.A.',
      status: 'En ejecución',
      budget: 842500,
      spent: 518200,
      committed: 712300,
      progressFisico: 0.62,
      progressFinanciero: 0.615,
      startDate: '2025-08-11',
      endDate: '2026-05-30',
      manager: 'Ing. Carla Mendoza',
      location: 'Av. República de Panamá 3591, San Isidro',
      hitos: 3,
      hitosTotal: 7,
      deviation: -3.8,
      risk: 'medium',
    },
    {
      id: 'OB-2025-018',
      name: 'Construcción nave industrial liviana — Lurín',
      client: 'Logística Andina SAC',
      status: 'En ejecución',
      budget: 1680000,
      spent: 1103400,
      committed: 1421000,
      progressFisico: 0.71,
      progressFinanciero: 0.656,
      startDate: '2025-06-02',
      endDate: '2026-06-15',
      manager: 'Ing. Rodrigo Paredes',
      location: 'Parque Industrial Lurín Mz. C Lt. 14',
      hitos: 5,
      hitosTotal: 9,
      deviation: 1.9,
      risk: 'low',
    },
    {
      id: 'OB-2025-024',
      name: 'Implementación local comercial — Mall del Sur',
      client: 'Grupo Retail Perú',
      status: 'En ejecución',
      budget: 312000,
      spent: 298100,
      committed: 321400,
      progressFisico: 0.88,
      progressFinanciero: 0.956,
      startDate: '2025-11-18',
      endDate: '2026-05-10',
      manager: 'Ing. Luisa Farfán',
      location: 'Mall del Sur, Av. Lima 900',
      hitos: 6,
      hitosTotal: 7,
      deviation: 7.6,
      risk: 'high',
    },
    {
      id: 'OB-2025-012',
      name: 'Mantenimiento integral — Planta Ate',
      client: 'Alicorp S.A.A.',
      status: 'En ejecución',
      budget: 186000,
      spent: 74400,
      committed: 112000,
      progressFisico: 0.40,
      progressFinanciero: 0.40,
      startDate: '2026-01-12',
      endDate: '2026-07-30',
      manager: 'Ing. Marco Díaz',
      location: 'Planta Ate — Carretera Central Km 4.5',
      hitos: 2,
      hitosTotal: 6,
      deviation: 0.2,
      risk: 'low',
    },
    {
      id: 'OB-2026-003',
      name: 'Mejoramiento áreas comunes — Edificio Miraflores',
      client: 'Junta de Propietarios Edif. Orrantia',
      status: 'Licitación',
      budget: 68400,
      spent: 0,
      committed: 0,
      progressFisico: 0.0,
      progressFinanciero: 0.0,
      startDate: '2026-05-20',
      endDate: '2026-09-15',
      manager: 'Ing. Carla Mendoza',
      location: 'Calle Enrique Palacios 1120, Miraflores',
      hitos: 0,
      hitosTotal: 5,
      deviation: 0,
      risk: 'low',
    },
    {
      id: 'OB-2026-005',
      name: 'Remodelación integral — Clínica Internacional Sede Norte',
      client: 'Clínica Internacional',
      status: 'Licitación',
      budget: 1245000,
      spent: 0,
      committed: 0,
      progressFisico: 0,
      progressFinanciero: 0,
      startDate: '2026-06-01',
      endDate: '2027-02-28',
      manager: 'Ing. Rodrigo Paredes',
      location: 'Av. Naranjal 558, Los Olivos',
      hitos: 0,
      hitosTotal: 8,
      deviation: 0,
      risk: 'medium',
    },
  ];

  // Partidas (budget lines) — hierarchical. Project OB-2025-021
  const partidas = [
    { id: '01', level: 1, code: '01', name: 'OBRAS PROVISIONALES Y TRABAJOS PRELIMINARES', unit: '', qty: null, unitPrice: null, budget: 38400, real: 36900, parent: null, ai: null },
    { id: '01.01', level: 2, code: '01.01', name: 'Cerco provisional de obra', unit: 'm', qty: 120, unitPrice: 98.50, budget: 11820, real: 11400, parent: '01', ai: null },
    { id: '01.02', level: 2, code: '01.02', name: 'Caseta de guardianía y almacén', unit: 'und', qty: 1, unitPrice: 8650, budget: 8650, real: 8650, parent: '01', ai: null },
    { id: '01.03', level: 2, code: '01.03', name: 'Agua y desagüe provisional', unit: 'glb', qty: 1, unitPrice: 4200, budget: 4200, real: 3950, parent: '01', ai: null },
    { id: '01.04', level: 2, code: '01.04', name: 'Instalaciones eléctricas provisionales', unit: 'glb', qty: 1, unitPrice: 3800, budget: 3800, real: 4100, parent: '01', ai: 'Sobrecosto 7.9% vs histórico', aiKind: 'warn' },
    { id: '01.05', level: 2, code: '01.05', name: 'Cartel de obra 3.60×2.40m', unit: 'und', qty: 2, unitPrice: 1480, budget: 2960, real: 2820, parent: '01', ai: null },
    { id: '01.06', level: 2, code: '01.06', name: 'Limpieza y desbroce de terreno', unit: 'm2', qty: 580, unitPrice: 5.10, budget: 2958, real: 2880, parent: '01', ai: null },
    { id: '01.07', level: 2, code: '01.07', name: 'Trazo y replanteo', unit: 'm2', qty: 580, unitPrice: 7.25, budget: 4205, real: 3100, parent: '01', ai: null },

    { id: '02', level: 1, code: '02', name: 'MOVIMIENTO DE TIERRAS', unit: '', qty: null, unitPrice: null, budget: 61280, real: 68110, parent: null, ai: 'Desviación +11.1% — revisar partidas hijas', aiKind: 'alert' },
    { id: '02.01', level: 2, code: '02.01', name: 'Excavación', unit: '', qty: null, unitPrice: null, budget: 34250, real: 39820, parent: '02', ai: null },
    { id: '02.01.01', level: 3, code: '02.01.01', name: 'Excavación manual en terreno normal', unit: 'm3', qty: 148, unitPrice: 42.80, budget: 6334, real: 6810, parent: '02.01', ai: null },
    { id: '02.01.02', level: 3, code: '02.01.02', name: 'Excavación con maquinaria — retroexcavadora', unit: 'm3', qty: 620, unitPrice: 18.50, budget: 11470, real: 14200, parent: '02.01', ai: 'IA: alquiler de equipo superó tarifa base', aiKind: 'alert' },
    { id: '02.01.03', level: 3, code: '02.01.03', name: 'Carguío y transporte a botadero autorizado', unit: 'm3', qty: 768, unitPrice: 21.40, budget: 16435, real: 18810, parent: '02.01', ai: null },
    { id: '02.02', level: 2, code: '02.02', name: 'Rellenos y compactación', unit: '', qty: null, unitPrice: null, budget: 18640, real: 19820, parent: '02', ai: null },
    { id: '02.02.01', level: 3, code: '02.02.01', name: 'Relleno compactado con material propio', unit: 'm3', qty: 420, unitPrice: 28.40, budget: 11928, real: 12640, parent: '02.02', ai: null },
    { id: '02.02.02', level: 3, code: '02.02.02', name: 'Relleno con afirmado — capa de 0.20m', unit: 'm3', qty: 120, unitPrice: 55.93, budget: 6712, real: 7180, parent: '02.02', ai: null },
    { id: '02.03', level: 2, code: '02.03', name: 'Nivelación y perfilado', unit: 'm2', qty: 580, unitPrice: 14.46, budget: 8390, real: 8470, parent: '02', ai: null },

    { id: '03', level: 1, code: '03', name: 'ESTRUCTURAS', unit: '', qty: null, unitPrice: null, budget: 218400, real: 142100, parent: null, ai: null },
    { id: '03.01', level: 2, code: '03.01', name: 'Concreto armado — cimentación', unit: '', qty: null, unitPrice: null, budget: 84200, real: 56800, parent: '03', ai: null },
    { id: '03.01.01', level: 3, code: '03.01.01', name: 'Concreto f\'c=210 kg/cm² en zapatas', unit: 'm3', qty: 48, unitPrice: 680, budget: 32640, real: 22100, parent: '03.01', ai: null },
    { id: '03.01.02', level: 3, code: '03.01.02', name: 'Acero corrugado fy=4200 kg/cm² en zapatas', unit: 'kg', qty: 3840, unitPrice: 5.82, budget: 22349, real: 15200, parent: '03.01', ai: null },
    { id: '03.01.03', level: 3, code: '03.01.03', name: 'Encofrado y desencofrado de zapatas', unit: 'm2', qty: 165, unitPrice: 56.40, budget: 9306, real: 7400, parent: '03.01', ai: null },
    { id: '03.01.04', level: 3, code: '03.01.04', name: 'Solado de concreto f\'c=100 kg/cm²', unit: 'm2', qty: 180, unitPrice: 44.10, budget: 7938, real: 5400, parent: '03.01', ai: null },
    { id: '03.02', level: 2, code: '03.02', name: 'Concreto armado — columnas y placas', unit: '', qty: null, unitPrice: null, budget: 68400, real: 42300, parent: '03', ai: null },
    { id: '03.03', level: 2, code: '03.03', name: 'Concreto armado — losas y vigas', unit: '', qty: null, unitPrice: null, budget: 65800, real: 43000, parent: '03', ai: null },

    { id: '04', level: 1, code: '04', name: 'ARQUITECTURA', unit: '', qty: null, unitPrice: null, budget: 186400, real: 118200, parent: null, ai: null },
    { id: '04.01', level: 2, code: '04.01', name: 'Muros y tabiques', unit: '', qty: null, unitPrice: null, budget: 48200, real: 32800, parent: '04', ai: null },
    { id: '04.02', level: 2, code: '04.02', name: 'Pisos y contrapisos', unit: '', qty: null, unitPrice: null, budget: 52100, real: 31200, parent: '04', ai: null },
    { id: '04.03', level: 2, code: '04.03', name: 'Cielos rasos y falsos cielos', unit: '', qty: null, unitPrice: null, budget: 29400, real: 18100, parent: '04', ai: null },
    { id: '04.04', level: 2, code: '04.04', name: 'Carpintería de madera y metálica', unit: '', qty: null, unitPrice: null, budget: 32800, real: 24300, parent: '04', ai: null },
    { id: '04.05', level: 2, code: '04.05', name: 'Pintura y acabados', unit: '', qty: null, unitPrice: null, budget: 23900, real: 11800, parent: '04', ai: null },

    { id: '05', level: 1, code: '05', name: 'INSTALACIONES ELÉCTRICAS', unit: '', qty: null, unitPrice: null, budget: 142800, real: 88200, parent: null, ai: null },
    { id: '05.01', level: 2, code: '05.01', name: 'Tableros eléctricos y alimentadores', unit: '', qty: null, unitPrice: null, budget: 58200, real: 38200, parent: '05', ai: null },
    { id: '05.02', level: 2, code: '05.02', name: 'Circuitos de alumbrado y tomacorrientes', unit: '', qty: null, unitPrice: null, budget: 44400, real: 28100, parent: '05', ai: null },
    { id: '05.03', level: 2, code: '05.03', name: 'Luminarias LED', unit: 'und', qty: 184, unitPrice: 218, budget: 40112, real: 21900, parent: '05', ai: 'IA sugiere consolidar compra: ahorro estimado S/ 4,200', aiKind: 'insight' },

    { id: '06', level: 1, code: '06', name: 'INSTALACIONES SANITARIAS', unit: '', qty: null, unitPrice: null, budget: 84200, real: 51800, parent: null, ai: null },
    { id: '07', level: 1, code: '07', name: 'COMUNICACIONES Y DATA', unit: '', qty: null, unitPrice: null, budget: 62400, real: 28100, parent: null, ai: null },
    { id: '08', level: 1, code: '08', name: 'HVAC — AIRE ACONDICIONADO', unit: '', qty: null, unitPrice: null, budget: 48600, real: 14900, parent: null, ai: null },
  ];

  // Bids / licitaciones pipeline
  const bids = [
    { id: 'LIC-2026-014', name: 'Remodelación sede — BanBif Surco', client: 'Banco Interamericano de Finanzas', stage: 'Prospecto', amount: 480000, probability: 25, deadline: '2026-05-02', owner: 'CM' },
    { id: 'LIC-2026-011', name: 'Adecuación planta — Nestlé Lima', client: 'Nestlé Perú', stage: 'Prospecto', amount: 920000, probability: 15, deadline: '2026-05-18', owner: 'RP' },
    { id: 'LIC-2026-010', name: 'Oficinas regional — Pacífico Seguros', client: 'Pacífico Seguros', stage: 'Calificación', amount: 340000, probability: 40, deadline: '2026-04-28', owner: 'LF' },
    { id: 'LIC-2026-009', name: 'Laboratorio clínico — Sanna', client: 'Sanna Clínica', stage: 'Calificación', amount: 612000, probability: 55, deadline: '2026-04-30', owner: 'CM' },
    { id: 'LIC-2026-007', name: 'Mejoras almacén central — Ransa', client: 'Ransa Comercial', stage: 'Propuesta', amount: 1120000, probability: 60, deadline: '2026-04-22', owner: 'RP' },
    { id: 'LIC-2026-005', name: 'Remodelación agencias — Interbank x4', client: 'Interbank', stage: 'Propuesta', amount: 780000, probability: 65, deadline: '2026-04-19', owner: 'LF' },
    { id: 'LIC-2026-003', name: 'Centro médico ocupacional — Backus', client: 'Backus', stage: 'Negociación', amount: 498000, probability: 80, deadline: '2026-04-15', owner: 'CM' },
    { id: 'LIC-2026-006', name: 'Clínica Internacional Sede Norte', client: 'Clínica Internacional', stage: 'Negociación', amount: 1245000, probability: 75, deadline: '2026-04-18', owner: 'RP' },
    { id: 'LIC-2026-001', name: 'Edificio Miraflores áreas comunes', client: 'JP Edif. Orrantia', stage: 'Adjudicada', amount: 68400, probability: 100, deadline: '2026-03-12', owner: 'CM' },
  ];

  // Gantt tasks for OB-2025-021
  const gantt = [
    { id: 'g1', name: 'Obras provisionales', start: 0, dur: 10, progress: 1.0, group: 'Preliminares', deps: [] },
    { id: 'g2', name: 'Movimiento de tierras', start: 8, dur: 14, progress: 1.0, group: 'Estructuras', deps: ['g1'] },
    { id: 'g3', name: 'Cimentación (zapatas, solado)', start: 20, dur: 22, progress: 0.85, group: 'Estructuras', deps: ['g2'] },
    { id: 'g4', name: 'Columnas y placas', start: 36, dur: 28, progress: 0.62, group: 'Estructuras', deps: ['g3'] },
    { id: 'g5', name: 'Losas y vigas', start: 58, dur: 24, progress: 0.44, group: 'Estructuras', deps: ['g4'] },
    { id: 'g6', name: 'Muros y tabiquería', start: 72, dur: 26, progress: 0.30, group: 'Arquitectura', deps: ['g4'] },
    { id: 'g7', name: 'Instalaciones eléctricas', start: 78, dur: 34, progress: 0.18, group: 'Instalaciones', deps: ['g5'] },
    { id: 'g8', name: 'Instalaciones sanitarias', start: 82, dur: 30, progress: 0.12, group: 'Instalaciones', deps: ['g5'] },
    { id: 'g9', name: 'Pisos, cielos rasos', start: 110, dur: 26, progress: 0.0, group: 'Arquitectura', deps: ['g6'] },
    { id: 'g10', name: 'Carpintería y acabados', start: 130, dur: 28, progress: 0.0, group: 'Arquitectura', deps: ['g9'] },
    { id: 'g11', name: 'HVAC y comunicaciones', start: 140, dur: 22, progress: 0.0, group: 'Instalaciones', deps: ['g7', 'g8'] },
    { id: 'g12', name: 'Pruebas, entrega y cierre', start: 164, dur: 14, progress: 0.0, group: 'Cierre', deps: ['g10', 'g11'] },
  ];

  // Cashflow by month — OB-2025-021
  const cashflow = [
    { month: 'Ago \'25', ingresos: 105000, egresos: 68400, acumulado: 36600 },
    { month: 'Sep \'25', ingresos: 120000, egresos: 94200, acumulado: 62400 },
    { month: 'Oct \'25', ingresos: 98000, egresos: 112400, acumulado: 48000 },
    { month: 'Nov \'25', ingresos: 140000, egresos: 108200, acumulado: 79800 },
    { month: 'Dic \'25', ingresos: 0, egresos: 48200, acumulado: 31600 },
    { month: 'Ene \'26', ingresos: 156000, egresos: 86800, acumulado: 100800 },
    { month: 'Feb \'26', ingresos: 98000, egresos: 92400, acumulado: 106400 },
    { month: 'Mar \'26', ingresos: 124000, egresos: 102400, acumulado: 128000 },
  ];

  // Documents tree
  const docsTree = [
    { name: '01 — Licitación', kind: 'folder', size: null, modified: '2025-07-18', children: [
      { name: 'Bases integradas.pdf', kind: 'pdf', size: 4200000, modified: '2025-07-02' },
      { name: 'Propuesta técnica v3.pdf', kind: 'pdf', size: 8900000, modified: '2025-07-12' },
      { name: 'Propuesta económica.xlsx', kind: 'xlsx', size: 180000, modified: '2025-07-12' },
      { name: 'Acta de adjudicación.pdf', kind: 'pdf', size: 320000, modified: '2025-07-18' },
    ]},
    { name: '02 — Ingeniería', kind: 'folder', size: null, modified: '2025-09-02', children: [
      { name: 'Planos arquitectura — A-01 a A-08.dwg', kind: 'dwg', size: 24000000, modified: '2025-08-22' },
      { name: 'Planos estructuras — E-01 a E-06.dwg', kind: 'dwg', size: 18000000, modified: '2025-08-24' },
      { name: 'Planos IIEE — IE-01 a IE-05.dwg', kind: 'dwg', size: 14200000, modified: '2025-08-28' },
      { name: 'Memoria de cálculo.pdf', kind: 'pdf', size: 2400000, modified: '2025-09-02' },
    ]},
    { name: '03 — Presupuesto', kind: 'folder', size: null, modified: '2026-03-14', children: [
      { name: 'Presupuesto base v1.xlsx', kind: 'xlsx', size: 420000, modified: '2025-07-10' },
      { name: 'Presupuesto v2 — post adjudicación.xlsx', kind: 'xlsx', size: 440000, modified: '2025-08-04' },
      { name: 'Presupuesto v3 — adicional #1.xlsx', kind: 'xlsx', size: 468000, modified: '2026-01-22' },
      { name: 'Presupuesto v4 — vigente.xlsx', kind: 'xlsx', size: 482000, modified: '2026-03-14' },
    ]},
    { name: '04 — Compras', kind: 'folder', size: null, modified: '2026-04-08', children: [
      { name: 'OC-2025-081 Cemento UNACEM.pdf', kind: 'pdf', size: 180000, modified: '2025-10-14' },
      { name: 'OC-2025-082 Acero Aceros Arequipa.pdf', kind: 'pdf', size: 210000, modified: '2025-10-18' },
      { name: 'OC-2026-012 Luminarias Philips.pdf', kind: 'pdf', size: 198000, modified: '2026-02-03' },
    ]},
    { name: '05 — Valorizaciones', kind: 'folder', size: null, modified: '2026-04-05', children: [
      { name: 'V01 — Agosto 2025.pdf', kind: 'pdf', size: 1200000, modified: '2025-09-02' },
      { name: 'V02 — Setiembre 2025.pdf', kind: 'pdf', size: 1180000, modified: '2025-10-02' },
      { name: 'V07 — Febrero 2026.pdf', kind: 'pdf', size: 1240000, modified: '2026-03-03' },
      { name: 'V08 — Marzo 2026.pdf', kind: 'pdf', size: 1280000, modified: '2026-04-05' },
    ]},
    { name: '06 — Fotos de obra', kind: 'folder', size: null, modified: '2026-04-11', children: [] },
  ];

  // Budget versions for comparator
  const versions = [
    { id: 'v1', label: 'v1 — Base licitación', date: '2025-07-10', total: 798200, author: 'Ing. Carla Mendoza', note: 'Presupuesto entregado en la propuesta' },
    { id: 'v2', label: 'v2 — Post adjudicación', date: '2025-08-04', total: 812400, author: 'Ing. Carla Mendoza', note: 'Ajuste por cambio de proveedor de acero' },
    { id: 'v3', label: 'v3 — Adicional #1', date: '2026-01-22', total: 831600, author: 'Ing. Rodrigo Paredes', note: 'Adicional por cambio de especificación en HVAC' },
    { id: 'v4', label: 'v4 — Vigente', date: '2026-03-14', total: 842500, author: 'Ing. Carla Mendoza', note: 'Ajuste por alza de insumos Q1' },
  ];

  return { projects, partidas, bids, gantt, cashflow, docsTree, versions, fmtPEN, fmtInt, fmtPct };
})();
