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
  const fmtCompact = (n) => {
    const a = Math.abs(n);
    const s = n < 0 ? '-' : '';
    if (a >= 1e6) return s + 'S/ ' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
    if (a >= 1e3) return s + 'S/ ' + (a / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'K';
    return s + 'S/ ' + a.toFixed(0);
  };

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
      manager: 'Ing. Mario Garcia',
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
      id: 'OB-2026-008',
      name: 'Habilitación Almacén Regional — Iquitos',
      client: 'Gobierno Regional de Loreto',
      status: 'En ejecución',
      budget: 2450000,
      spent: 450000,
      committed: 1800000,
      progressFisico: 0.18,
      progressFinanciero: 0.22,
      startDate: '2026-02-15',
      endDate: '2027-01-20',
      manager: 'Ing. Carlos Ruiz',
      location: 'Calle Putumayo 450, Iquitos, Loreto',
      hitos: 1,
      hitosTotal: 12,
      deviation: 0.5,
      risk: 'medium',
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
      manager: 'Ing. Mario Garcia',
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

  // Cashflow by month (consolidado) — con detalle de origen ingresos / egresos
  const cashflow = [
    {
      month: 'Ago \'25', year: 2025, ingresos: 105000, egresos: 68400, acumulado: 36600,
      detalleIng: [
        { tipo: 'Valorización', concepto: 'V01 — Agosto 2025', proyecto: 'OB-2025-021', contraparte: 'Corporación Belcorp S.A.', comprobante: 'F001-00234', fecha: '2025-08-22', monto: 85000 },
        { tipo: 'Adelanto directo', concepto: 'Adelanto 10% firma contrato', proyecto: 'OB-2025-018', contraparte: 'Logística Andina SAC', comprobante: 'F001-00235', fecha: '2025-08-05', monto: 20000 },
      ],
      detalleEg: [
        { categoria: 'Materiales', concepto: 'Cemento UNACEM · 480 bls', proyecto: 'OB-2025-021', contraparte: 'UNACEM S.A.A.', comprobante: 'F004-28199', fecha: '2025-08-14', monto: 26400 },
        { categoria: 'Materiales', concepto: 'Acero corrugado · 2.4t', proyecto: 'OB-2025-021', contraparte: 'Aceros Arequipa', comprobante: 'F002-15823', fecha: '2025-08-18', monto: 14200 },
        { categoria: 'Planilla', concepto: 'Obreros · quincena 1', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2025-08A', fecha: '2025-08-15', monto: 12800 },
        { categoria: 'Equipos', concepto: 'Alquiler retroexcavadora · 6 días', proyecto: 'OB-2025-021', contraparte: 'Maq. Lima SAC', comprobante: 'F001-00891', fecha: '2025-08-10', monto: 8600 },
        { categoria: 'Oficina', concepto: 'Gastos administrativos', proyecto: 'OFICINA', contraparte: 'Varios', comprobante: '—', fecha: '2025-08-30', monto: 4200 },
        { categoria: 'Subcontrato', concepto: 'Topografía inicial', proyecto: 'OB-2025-018', contraparte: 'GeoLima Ingenieros', comprobante: 'F001-00412', fecha: '2025-08-08', monto: 2200 },
      ],
    },
    {
      month: 'Sep \'25', year: 2025, ingresos: 120000, egresos: 94200, acumulado: 62400,
      detalleIng: [
        { tipo: 'Valorización', concepto: 'V02 — Setiembre 2025', proyecto: 'OB-2025-021', contraparte: 'Corporación Belcorp S.A.', comprobante: 'F001-00251', fecha: '2025-09-28', monto: 96000 },
        { tipo: 'Valorización', concepto: 'V01 — Setiembre 2025', proyecto: 'OB-2025-018', contraparte: 'Logística Andina SAC', comprobante: 'F001-00252', fecha: '2025-09-30', monto: 24000 },
      ],
      detalleEg: [
        { categoria: 'Materiales', concepto: 'Cemento UNACEM · 620 bls', proyecto: 'OB-2025-021', contraparte: 'UNACEM S.A.A.', comprobante: 'F004-28412', fecha: '2025-09-05', monto: 34100 },
        { categoria: 'Materiales', concepto: 'Agregados piedra + arena', proyecto: 'OB-2025-021', contraparte: 'Canteras Lurín', comprobante: 'F002-08221', fecha: '2025-09-12', monto: 12400 },
        { categoria: 'Planilla', concepto: 'Obreros septiembre', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2025-09', fecha: '2025-09-30', monto: 22800 },
        { categoria: 'Subcontrato', concepto: 'Excavación masiva', proyecto: 'OB-2025-018', contraparte: 'Movitec SAC', comprobante: 'F001-00988', fecha: '2025-09-18', monto: 18400 },
        { categoria: 'Tributos', concepto: 'Pago IGV agosto', proyecto: 'OFICINA', contraparte: 'SUNAT', comprobante: 'PDT-621', fecha: '2025-09-17', monto: 4200 },
        { categoria: 'Oficina', concepto: 'Servicios + utilidades', proyecto: 'OFICINA', contraparte: 'Varios', comprobante: '—', fecha: '2025-09-30', monto: 2300 },
      ],
    },
    {
      month: 'Oct \'25', year: 2025, ingresos: 98000, egresos: 112400, acumulado: 48000,
      detalleIng: [
        { tipo: 'Valorización', concepto: 'V03 — Octubre 2025', proyecto: 'OB-2025-021', contraparte: 'Corporación Belcorp S.A.', comprobante: 'F001-00268', fecha: '2025-10-30', monto: 68000 },
        { tipo: 'Valorización', concepto: 'V02 — Octubre 2025', proyecto: 'OB-2025-018', contraparte: 'Logística Andina SAC', comprobante: 'F001-00269', fecha: '2025-10-30', monto: 30000 },
      ],
      detalleEg: [
        { categoria: 'Materiales', concepto: 'Acero corrugado · 5.8t', proyecto: 'OB-2025-021', contraparte: 'Aceros Arequipa', comprobante: 'F002-16104', fecha: '2025-10-08', monto: 42400 },
        { categoria: 'Subcontrato', concepto: 'Encofrado metálico modular', proyecto: 'OB-2025-021', contraparte: 'Forsa Perú', comprobante: 'F001-00422', fecha: '2025-10-14', monto: 28200 },
        { categoria: 'Planilla', concepto: 'Obreros octubre', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2025-10', fecha: '2025-10-30', monto: 24800 },
        { categoria: 'Equipos', concepto: 'Alquiler grúa + combustible', proyecto: 'OB-2025-018', contraparte: 'Grúas Pacífico', comprobante: 'F001-01120', fecha: '2025-10-20', monto: 12800 },
        { categoria: 'Oficina', concepto: 'Gastos administrativos', proyecto: 'OFICINA', contraparte: 'Varios', comprobante: '—', fecha: '2025-10-31', monto: 4200 },
      ],
    },
    {
      month: 'Nov \'25', year: 2025, ingresos: 140000, egresos: 108200, acumulado: 79800,
      detalleIng: [
        { tipo: 'Valorización', concepto: 'V04 — Noviembre 2025', proyecto: 'OB-2025-021', contraparte: 'Corporación Belcorp S.A.', comprobante: 'F001-00284', fecha: '2025-11-29', monto: 82000 },
        { tipo: 'Valorización', concepto: 'V03 — Noviembre 2025', proyecto: 'OB-2025-018', contraparte: 'Logística Andina SAC', comprobante: 'F001-00285', fecha: '2025-11-29', monto: 36000 },
        { tipo: 'Adelanto directo', concepto: 'Adelanto OB-2025-024', proyecto: 'OB-2025-024', contraparte: 'Grupo Retail Perú', comprobante: 'F001-00286', fecha: '2025-11-20', monto: 22000 },
      ],
      detalleEg: [
        { categoria: 'Materiales', concepto: 'Albañilería + ladrillos', proyecto: 'OB-2025-021', contraparte: 'Ladrillos Lark', comprobante: 'F003-19822', fecha: '2025-11-04', monto: 28400 },
        { categoria: 'Subcontrato', concepto: 'Vaciado losas N1-N2', proyecto: 'OB-2025-021', contraparte: 'Concretos Lima', comprobante: 'F001-00501', fecha: '2025-11-15', monto: 34200 },
        { categoria: 'Planilla', concepto: 'Obreros + capataces', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2025-11', fecha: '2025-11-30', monto: 28400 },
        { categoria: 'Materiales', concepto: 'Instalaciones sanitarias', proyecto: 'OB-2025-018', contraparte: 'Sodimac Perú', comprobante: 'F002-04128', fecha: '2025-11-18', monto: 9800 },
        { categoria: 'Tributos', concepto: 'Pago detracciones', proyecto: 'OFICINA', contraparte: 'SUNAT', comprobante: 'PDT-621', fecha: '2025-11-17', monto: 3600 },
        { categoria: 'Oficina', concepto: 'Gastos administrativos', proyecto: 'OFICINA', contraparte: 'Varios', comprobante: '—', fecha: '2025-11-30', monto: 3800 },
      ],
    },
    {
      month: 'Dic \'25', year: 2025, ingresos: 0, egresos: 48200, acumulado: 31600,
      detalleIng: [],
      detalleEg: [
        { categoria: 'Planilla', concepto: 'Gratificación + CTS', proyecto: 'OFICINA', contraparte: 'Planilla interna', comprobante: 'PL-2025-12G', fecha: '2025-12-15', monto: 28400 },
        { categoria: 'Planilla', concepto: 'Obreros diciembre (reducido)', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2025-12', fecha: '2025-12-22', monto: 12600 },
        { categoria: 'Oficina', concepto: 'Cierre año + servicios', proyecto: 'OFICINA', contraparte: 'Varios', comprobante: '—', fecha: '2025-12-30', monto: 5400 },
        { categoria: 'Tributos', concepto: 'Pago IGV noviembre', proyecto: 'OFICINA', contraparte: 'SUNAT', comprobante: 'PDT-621', fecha: '2025-12-17', monto: 1800 },
      ],
    },
    {
      month: 'Ene \'26', year: 2026, ingresos: 156000, egresos: 86800, acumulado: 100800,
      detalleIng: [
        { tipo: 'Valorización', concepto: 'V05 — Ene 2026 (acumulado)', proyecto: 'OB-2025-021', contraparte: 'Corporación Belcorp S.A.', comprobante: 'F001-00312', fecha: '2026-01-28', monto: 98000 },
        { tipo: 'Valorización', concepto: 'V04 — Enero 2026', proyecto: 'OB-2025-018', contraparte: 'Logística Andina SAC', comprobante: 'F001-00313', fecha: '2026-01-30', monto: 34000 },
        { tipo: 'Valorización', concepto: 'V01 — Enero 2026', proyecto: 'OB-2025-024', contraparte: 'Grupo Retail Perú', comprobante: 'F001-00314', fecha: '2026-01-30', monto: 24000 },
      ],
      detalleEg: [
        { categoria: 'Materiales', concepto: 'Carpintería aluminio', proyecto: 'OB-2025-021', contraparte: 'Vidrios & Aluminios SA', comprobante: 'F001-07124', fecha: '2026-01-12', monto: 24800 },
        { categoria: 'Planilla', concepto: 'Obreros + staff enero', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2026-01', fecha: '2026-01-31', monto: 26400 },
        { categoria: 'Subcontrato', concepto: 'Instalaciones eléctricas', proyecto: 'OB-2025-021', contraparte: 'Electroinsa SAC', comprobante: 'F001-00122', fecha: '2026-01-20', monto: 18200 },
        { categoria: 'Materiales', concepto: 'Pisos porcelanato', proyecto: 'OB-2025-024', contraparte: 'Celima', comprobante: 'F002-11088', fecha: '2026-01-25', monto: 8400 },
        { categoria: 'Tributos', concepto: 'IGV diciembre', proyecto: 'OFICINA', contraparte: 'SUNAT', comprobante: 'PDT-621', fecha: '2026-01-17', monto: 5600 },
        { categoria: 'Oficina', concepto: 'Gastos administrativos', proyecto: 'OFICINA', contraparte: 'Varios', comprobante: '—', fecha: '2026-01-31', monto: 3400 },
      ],
    },
    {
      month: 'Feb \'26', year: 2026, ingresos: 98000, egresos: 92400, acumulado: 106400,
      detalleIng: [
        { tipo: 'Valorización', concepto: 'V06 — Febrero 2026', proyecto: 'OB-2025-021', contraparte: 'Corporación Belcorp S.A.', comprobante: 'F001-00331', fecha: '2026-02-27', monto: 64000 },
        { tipo: 'Valorización', concepto: 'V02 — Febrero 2026', proyecto: 'OB-2025-024', contraparte: 'Grupo Retail Perú', comprobante: 'F001-00332', fecha: '2026-02-28', monto: 34000 },
      ],
      detalleEg: [
        { categoria: 'Materiales', concepto: 'Tabiquería drywall', proyecto: 'OB-2025-021', contraparte: 'Eternit Perú', comprobante: 'F002-31822', fecha: '2026-02-06', monto: 18600 },
        { categoria: 'Subcontrato', concepto: 'Pintura y acabados', proyecto: 'OB-2025-024', contraparte: 'Acabados Perú SAC', comprobante: 'F001-00155', fecha: '2026-02-14', monto: 22800 },
        { categoria: 'Planilla', concepto: 'Obreros febrero', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2026-02', fecha: '2026-02-28', monto: 28400 },
        { categoria: 'Equipos', concepto: 'Alquiler equipos varios', proyecto: 'OB-2025-018', contraparte: 'Maq. Lima SAC', comprobante: 'F001-00988', fecha: '2026-02-20', monto: 12600 },
        { categoria: 'Tributos', concepto: 'IGV enero + detracciones', proyecto: 'OFICINA', contraparte: 'SUNAT', comprobante: 'PDT-621', fecha: '2026-02-17', monto: 6200 },
        { categoria: 'Oficina', concepto: 'Gastos administrativos', proyecto: 'OFICINA', contraparte: 'Varios', comprobante: '—', fecha: '2026-02-28', monto: 3800 },
      ],
    },
    {
      month: 'Mar \'26', year: 2026, ingresos: 124000, egresos: 102400, acumulado: 128000,
      detalleIng: [
        { tipo: 'Valorización', concepto: 'V07 — Marzo 2026', proyecto: 'OB-2025-021', contraparte: 'Corporación Belcorp S.A.', comprobante: 'F001-00348', fecha: '2026-03-29', monto: 72000 },
        { tipo: 'Valorización', concepto: 'V05 — Marzo 2026', proyecto: 'OB-2025-018', contraparte: 'Logística Andina SAC', comprobante: 'F001-00349', fecha: '2026-03-30', monto: 28000 },
        { tipo: 'Valorización', concepto: 'V03 — Marzo 2026', proyecto: 'OB-2025-024', contraparte: 'Grupo Retail Perú', comprobante: 'F001-00350', fecha: '2026-03-30', monto: 24000 },
      ],
      detalleEg: [
        { categoria: 'Materiales', concepto: 'Luminarias LED Philips · 184 und', proyecto: 'OB-2025-021', contraparte: 'Philips Perú', comprobante: 'F001-07421', fecha: '2026-03-10', monto: 22000 },
        { categoria: 'Subcontrato', concepto: 'Instalaciones sanitarias', proyecto: 'OB-2025-021', contraparte: 'Sanimetal SAC', comprobante: 'F001-00188', fecha: '2026-03-15', monto: 24600 },
        { categoria: 'Planilla', concepto: 'Obreros + staff marzo', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2026-03', fecha: '2026-03-31', monto: 32800 },
        { categoria: 'Materiales', concepto: 'Cableado eléctrico', proyecto: 'OB-2025-021', contraparte: 'Indeco Perú', comprobante: 'F003-22411', fecha: '2026-03-08', monto: 12400 },
        { categoria: 'Tributos', concepto: 'IGV febrero', proyecto: 'OFICINA', contraparte: 'SUNAT', comprobante: 'PDT-621', fecha: '2026-03-17', monto: 6800 },
        { categoria: 'Oficina', concepto: 'Gastos administrativos', proyecto: 'OFICINA', contraparte: 'Varios', comprobante: '—', fecha: '2026-03-31', monto: 3800 },
      ],
    },
    {
      month: 'Abr \'26', year: 2026, ingresos: 86000, egresos: 64000, acumulado: 150000,
      detalleIng: [
        { tipo: 'Valorización', concepto: 'V08 — Abril 2026 (parcial)', proyecto: 'OB-2025-021', contraparte: 'Corporación Belcorp S.A.', comprobante: 'F001-00371', fecha: '2026-04-18', monto: 56000 },
        { tipo: 'Valorización', concepto: 'V06 — Abril 2026', proyecto: 'OB-2025-018', contraparte: 'Logística Andina SAC', comprobante: 'F001-00372', fecha: '2026-04-20', monto: 30000 },
      ],
      detalleEg: [
        { categoria: 'Materiales', concepto: 'Grifería Vainsa línea Eco', proyecto: 'OB-2025-021', contraparte: 'Vainsa Perú', comprobante: 'F001-08411', fecha: '2026-04-05', monto: 18400 },
        { categoria: 'Planilla', concepto: 'Obreros quincena 1 abril', proyecto: 'OB-2025-021', contraparte: 'Planilla interna', comprobante: 'PL-2026-04A', fecha: '2026-04-15', monto: 22800 },
        { categoria: 'Subcontrato', concepto: 'HVAC — avance 40%', proyecto: 'OB-2025-021', contraparte: 'Climatización Andina', comprobante: 'F001-00200', fecha: '2026-04-12', monto: 16400 },
        { categoria: 'Equipos', concepto: 'Alquiler grúa torre', proyecto: 'OB-2025-018', contraparte: 'Grúas Pacífico', comprobante: 'F001-01188', fecha: '2026-04-10', monto: 6400 },
      ],
    },
  ];

  // Post-proceso: inyectar status en movimientos según fecha.
  // Ingresos: ≥ Mar '26 = "Por cobrar", resto = "Cobrada". 1 vencida de ejemplo.
  // Egresos: casi todos "Pagada", algunos "Pendiente" en mes actual.
  cashflow.forEach(m => {
    const recentIng = m.year === 2026 && (m.month === 'Mar \'26' || m.month === 'Abr \'26');
    m.detalleIng.forEach(e => {
      if (!e.status) e.status = recentIng ? 'Por cobrar' : 'Cobrada';
    });
    m.detalleEg.forEach(e => {
      if (!e.status) e.status = 'Pagada';
    });
  });
  // Marcar vencida + pendientes de ejemplo (UX realista: hay facturas en disputa, OCs pendientes)
  const abr = cashflow.find(m => m.month === 'Abr \'26');
  const mar = cashflow.find(m => m.month === 'Mar \'26');
  if (abr) {
    abr.detalleEg[0].status = 'Pendiente';
    abr.detalleEg[2].status = 'Pendiente';
  }
  if (mar) {
    mar.detalleIng[1].status = 'Vencida';
  }

  // Conciliación SUNAT (CPE XML import mock)
  const sunatConciliaciones = [
    { doc: 'F001-00892', tipo: 'Factura', proveedor: 'Aceros Arequipa S.A.', ruc: '20100128056', monto: 12420, oc: 'OC-2025-082', fecha: '2026-03-08', estado: 'Conciliada' },
    { doc: 'F002-00144', tipo: 'Factura', proveedor: 'UNACEM S.A.A.', ruc: '20100030595', monto: 18240, oc: 'OC-2025-081', fecha: '2026-03-05', estado: 'Conciliada' },
    { doc: 'B001-00228', tipo: 'Boleta', proveedor: 'Unimaq S.A.C.', ruc: '20505658416', monto: 24800, oc: 'OC-2026-002', fecha: '2026-04-11', estado: 'Observación', obsMsg: 'Monto difiere 1.2% vs OC' },
    { doc: 'F001-04218', tipo: 'Factura', proveedor: 'Promart Maestro', ruc: '20536557858', monto: 3842, oc: null, fecha: '2026-04-03', estado: 'Sin conciliar', obsMsg: 'Sin OC asociada' },
    { doc: 'F003-00098', tipo: 'Factura', proveedor: 'Philips Peruana S.A.', ruc: '20100020361', monto: 18312, oc: 'OC-2026-012', fecha: '2026-03-10', estado: 'Conciliada' },
    { doc: 'F001-07124', tipo: 'Factura', proveedor: 'Vidrios & Aluminios SA', ruc: '20512345678', monto: 24800, oc: 'OC-2026-005', fecha: '2026-01-12', estado: 'Conciliada' },
    { doc: 'F001-00200', tipo: 'Factura', proveedor: 'Climatización Andina', ruc: '20600112233', monto: 16400, oc: null, fecha: '2026-04-12', estado: 'Sin conciliar', obsMsg: 'Subcontrato sin OC previa' },
    { doc: 'F004-28412', tipo: 'Factura', proveedor: 'UNACEM S.A.A.', ruc: '20100030595', monto: 34100, oc: 'OC-2025-091', fecha: '2025-09-05', estado: 'Conciliada' },
    { doc: 'F002-31822', tipo: 'Factura', proveedor: 'Eternit Perú', ruc: '20100167411', monto: 18600, oc: 'OC-2026-015', fecha: '2026-02-06', estado: 'Observación', obsMsg: 'Fecha OC posterior al CPE' },
    { doc: 'F001-00188', tipo: 'Factura', proveedor: 'Sanimetal SAC', ruc: '20547812345', monto: 24600, oc: 'OC-2026-018', fecha: '2026-03-15', estado: 'Conciliada' },
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
    { id: 'v1', label: 'v1 — Base licitación', date: '2025-07-10', total: 798200, author: 'Ing. Mario Garcia', note: 'Presupuesto entregado en la propuesta' },
    { id: 'v2', label: 'v2 — Post adjudicación', date: '2025-08-04', total: 812400, author: 'Ing. Mario Garcia', note: 'Ajuste por cambio de proveedor de acero' },
    { id: 'v3', label: 'v3 — Adicional #1', date: '2026-01-22', total: 831600, author: 'Ing. Rodrigo Paredes', note: 'Adicional por cambio de especificación en HVAC' },
    { id: 'v4', label: 'v4 — Vigente', date: '2026-03-14', total: 842500, author: 'Ing. Mario Garcia', note: 'Ajuste por alza de insumos Q1' },
  ];

  // ═════════════════ FINANZAS — datos para rediseño Resumen ═════════════════

  // Cuentas bancarias con saldos en vivo
  const cuentasBancariasBalances = [
    {
      id: 'BCP-SOL',
      banco: 'BCP',
      alias: 'Cuenta Corriente Principal',
      numero: '194-4823891-0-78',
      moneda: 'PEN',
      tipo: 'Corriente',
      saldoActual: 2840500,
      ingresosMes: 4200000,
      egresosMes: 3600000,
      borderColor: '#F59F00',
      ultimoMovimiento: '2026-04-22T08:42:00',
      responsable: null,
    },
    {
      id: 'BBVA-OBR',
      banco: 'BBVA',
      alias: 'Cuenta Ahorros Obras',
      numero: '0011-0345-0200456123',
      moneda: 'PEN',
      tipo: 'Ahorros',
      saldoActual: 340200,
      ingresosMes: 180000,
      egresosMes: 24000,
      subtitle: 'Cuenta de obras / garantías',
      borderColor: '#3B5BDB',
      ultimoMovimiento: '2026-04-22T08:42:00',
    },
    {
      id: 'CAJA-LIM',
      banco: 'Caja chica',
      alias: 'Caja Chica · Oficina Lima',
      numero: '—',
      moneda: 'PEN',
      tipo: 'Efectivo',
      saldoActual: 3200,
      saldoAutorizado: 5000,
      responsable: 'Patricia Salas',
      borderColor: '#F59F00',
    },
  ];

  // Gastos oficina con presupuesto mensual
  const gastosOficina = {
    mes: 'Abril 2026',
    presupuestoMensual: 18000,
    ejecutado: 13240,
    saldo: 4760,
    pctEjecutado: 73.5,
    items: [
      { id: 'alq',   categoria: 'Alquiler oficina',        subtitle: 'Miraflores, piso 3',  monto: 4500, pct: 25, color: '#3B5BDB' },
      { id: 'serv',  categoria: 'Servicios (agua/luz/inet)', subtitle: 'Boletas incluidas',  monto: 1200, pct: 7,  color: '#F59F00' },
      { id: 'plan',  categoria: 'Planilla administrativa', subtitle: '6 personas',          monto: 5800, pct: 32, color: '#7C3AED' },
      { id: 'util',  categoria: 'Útiles y papelería',      subtitle: 'Compras del mes',     monto: 340,  pct: 2,  color: '#0EA5B7' },
      { id: 'tran',  categoria: 'Transporte y viáticos',   subtitle: 'Visitas a obra',      monto: 890,  pct: 5,  color: '#D1453B' },
      { id: 'repr',  categoria: 'Gastos de representación', subtitle: 'Reuniones clientes', monto: 510,  pct: 3,  color: '#2F7D5C' },
    ],
  };

  // Valorizaciones pipeline (para card Resumen + tab Valorizaciones)
  const valorizacionesPipeline = [
    { id: 'V06-MTC', numVal: 6, obra: 'Carretera Ruta 5',    cliente: 'MTC Perú',            monto: 680000, estado: 'Enviada',   fechaVenc: '2026-04-30', dueDays: 8 },
    { id: 'V04-SED', numVal: 4, obra: 'Saneamiento Lima',    cliente: 'SEDAPAL',             monto: 420000, estado: 'Aprobada',  fechaVenc: '2026-05-14', dueDays: 22 },
    { id: 'V03-EDI', numVal: 3, obra: 'Edificio Sede',       cliente: 'Priv. Inversiones',   monto: 510000, estado: 'Facturada', fechaVenc: '2026-06-06', dueDays: 45 },
    { id: 'V08-PUE', numVal: 8, obra: 'Puente Lurín',        cliente: 'Mun. Lima',           monto: 340000, estado: 'Cobrada',   fechaVenc: '2026-04-10', dueDays: 0,  cobradoEn: '2026-04-10' },
    { id: 'V02-HID', numVal: 2, obra: 'Cons. Hidráulica',    cliente: 'Reg. Ica',            monto: 150000, estado: 'Vencida',   fechaVenc: '2026-02-22', dueDays: -60 },
  ];

  // Cartas fianza activas
  const garantias = [
    { id: 'G1', tipo: 'Fiel cumplimiento', obra: 'Carretera Ruta 5',      banco: 'BCP',        monto: 824000, fechaVenc: '2026-05-07', dueDays: 15, urgent: true },
    { id: 'G2', tipo: 'Adelanto directo',  obra: 'Carretera Ruta 5',      banco: 'BCP',        monto: 412000, fechaVenc: '2026-05-07', dueDays: 15, urgent: true },
    { id: 'G3', tipo: 'Fiel cumplimiento', obra: 'Puente Lurín',          banco: 'BBVA',       monto: 470000, fechaVenc: '2026-05-22', dueDays: 30 },
    { id: 'G4', tipo: 'Fiel cumplimiento', obra: 'Saneam. Lima Sur',      banco: 'Scotiabank', monto: 320000, fechaVenc: '2026-10-29', dueDays: 190 },
    { id: 'G5', tipo: 'Vicios ocultos',    obra: 'Pavim. Callao',         banco: 'BCP',        monto: 260000, fechaVenc: '2026-09-24', dueDays: 155 },
    { id: 'G6', tipo: 'Fiel cumplimiento', obra: 'Clínica Internacional', banco: 'Interbank',  monto: 980000, fechaVenc: '2027-03-15', dueDays: 327 },
    { id: 'G7', tipo: 'Adelanto directo',  obra: 'Remod. Belcorp',        banco: 'BCP',        monto: 620000, fechaVenc: '2026-11-30', dueDays: 222 },
    { id: 'G8', tipo: 'Seriedad oferta',   obra: 'Hospital Loayza',       banco: 'BBVA',       monto: 914000, fechaVenc: '2026-06-18', dueDays: 57 },
  ];

  // ═════════════════ COTIZACIONES (cada una tiene su Gantt) ═════════════════
  const cotizaciones = [
    {
      id: 'COT-2025-048',
      proyectoInterno: 'OB-2025-021',
      codigoProyecto: 'PG0005',
      nombre: 'Construcción nicho, columbario y crematorio · Cementerio Municipal',
      cliente: 'Cementerio Municipal',
      revision: 3,
      fechaEmision: '2025-09-16',
      fechaInicio: '2025-10-24',
      fechaFin: '2026-02-20',
      duracionDias: 120,
      montoTotal: 125316590,
      status: 'Aprobada',
      tieneGantt: true,
      ganttSource: 'assets/gantt-crematorio-rev03.xml',
      ganttFormat: 'xml',
      sizeKB: 3450,
    },
    {
      id: 'COT-2026-012',
      proyectoInterno: 'OB-2025-021',
      codigoProyecto: 'PG0021',
      nombre: 'Remodelación oficinas · Belcorp San Isidro',
      cliente: 'Corporación Belcorp S.A.',
      revision: 2,
      fechaEmision: '2025-07-10',
      fechaInicio: '2025-08-11',
      fechaFin: '2026-05-30',
      duracionDias: 293,
      montoTotal: 842500,
      status: 'Ejecutándose',
      tieneGantt: false,
    },
    {
      id: 'COT-2026-018',
      proyectoInterno: 'OB-2025-018',
      codigoProyecto: 'PG0018',
      nombre: 'Nave industrial liviana · Lurín',
      cliente: 'Logística Andina SAC',
      revision: 1,
      fechaEmision: '2025-06-02',
      fechaInicio: '2025-06-02',
      fechaFin: '2026-06-15',
      duracionDias: 378,
      montoTotal: 1680000,
      status: 'Ejecutándose',
      tieneGantt: false,
    },
    {
      id: 'COT-2026-025',
      proyectoInterno: 'OB-2026-005',
      codigoProyecto: 'PG0025',
      nombre: 'Remodelación integral · Clínica Internacional Norte',
      cliente: 'Clínica Internacional',
      revision: 1,
      fechaEmision: '2026-03-18',
      fechaInicio: '2026-06-01',
      fechaFin: '2027-02-28',
      duracionDias: 272,
      montoTotal: 1245000,
      status: 'En revisión',
      tieneGantt: false,
    },
  ];

  // ═════════════════ INVENTARIO — items, movimientos, mantenimientos ═════════════════

  // Tasas SUNAT depreciación lineal Perú
  const DEPRECIACION_CATEGORIA = {
    'Herramienta manual':       { tasa: 25, vida: 4,  descripcion: 'Herramientas manuales y menores' },
    'Herramienta eléctrica':    { tasa: 25, vida: 4,  descripcion: 'Equipos eléctricos menores' },
    'Andamios y encofrado':     { tasa: 20, vida: 5,  descripcion: 'Andamios, puntales, encofrados' },
    'Medición':                 { tasa: 25, vida: 4,  descripcion: 'Niveles, medidores, instrumentos' },
    'EPP':                      { tasa: 100, vida: 1, descripcion: 'Equipos protección personal (consumible)' },
    'Equipo eléctrico':         { tasa: 20, vida: 5,  descripcion: 'Generadores, compresores, soldadoras' },
    'Mobiliario':               { tasa: 10, vida: 10, descripcion: 'Mobiliario oficina' },
    'Cómputo':                  { tasa: 25, vida: 4,  descripcion: 'Equipos cómputo / impresoras' },
  };

  // Ubicaciones físicas — distrito/provincia/región Perú
  const inventarioUbicaciones = [
    { id: 'UB-CEN', tipo: 'Almacén central', nombre: 'Almacén Central Oficina',       direccion: 'Av. Republica de Colombia 625 Of. 501', distrito: 'San Isidro',       provincia: 'Lima',   departamento: 'Lima',  lat: -12.0979, lng: -77.0365, color: '#3B5BDB' },
    { id: 'UB-021', tipo: 'Obra',             nombre: 'Obra OB-2025-021 Belcorp',      direccion: 'Av. República de Panamá 3591',          distrito: 'San Isidro',       provincia: 'Lima',   departamento: 'Lima',  lat: -12.1021, lng: -77.0230, color: '#F59F00' },
    { id: 'UB-018', tipo: 'Obra',             nombre: 'Obra OB-2025-018 Logística',    direccion: 'Parque Industrial Lurín Mz. C Lt. 14',  distrito: 'Lurín',            provincia: 'Lima',   departamento: 'Lima',  lat: -12.2723, lng: -76.8840, color: '#7C3AED' },
    { id: 'UB-024', tipo: 'Obra',             nombre: 'Obra OB-2025-024 Mall Retail',  direccion: 'Mall del Sur, Av. Lima 900',            distrito: 'San Juan Miraflores', provincia: 'Lima', departamento: 'Lima', lat: -12.1594, lng: -76.9746, color: '#0EA5B7' },
    { id: 'UB-012', tipo: 'Obra',             nombre: 'Obra OB-2025-012 Alicorp Ate',  direccion: 'Planta Ate · Carretera Central Km 4.5', distrito: 'Ate',              provincia: 'Lima',   departamento: 'Lima',  lat: -12.0337, lng: -76.9168, color: '#2F7D5C' },
    { id: 'UB-BOSCH', tipo: 'Servicio externo', nombre: 'Bosch Service Center Lima',   direccion: 'Av. El Derby 250',                      distrito: 'Santiago de Surco', provincia: 'Lima',  departamento: 'Lima',  lat: -12.0912, lng: -76.9846, color: '#D1453B' },
    { id: 'UB-UNIMAQ', tipo: 'Servicio externo', nombre: 'Unimaq Taller Lurín',         direccion: 'Km 40 Carretera Panamericana Sur',      distrito: 'Lurín',            provincia: 'Lima',   departamento: 'Lima',  lat: -12.2804, lng: -76.8734, color: '#D97757' },
    { id: 'UB-TRAN', tipo: 'En tránsito',      nombre: 'En tránsito / Pendiente',       direccion: '—',                                       distrito: '—',                provincia: '—',      departamento: '—',     lat: null,     lng: null,     color: '#9A9A96' },
  ];

  // Personal responsable
  const inventarioPersonal = [
    { id: 'PER-001', nombre: 'Mario A. García Calderón', cargo: 'Sub Gerente',           dni: '40456789', telefono: '987654321', email: 'mario.garcia@mmhighmetrik.com',  iniciales: 'MG' },
    { id: 'PER-002', nombre: 'Rodrigo Paredes',          cargo: 'Ingeniero Residente',   dni: '45123456', telefono: '987654322', email: 'rodrigo.paredes@mmhighmetrik.com', iniciales: 'RP' },
    { id: 'PER-003', nombre: 'Luisa Farfán',             cargo: 'Supervisora Obras',     dni: '42987654', telefono: '987654323', email: 'luisa.farfan@mmhighmetrik.com',   iniciales: 'LF' },
    { id: 'PER-004', nombre: 'Jorge Quispe Mamani',      cargo: 'Almacenero Central',    dni: '44567890', telefono: '987654324', email: 'jorge.quispe@mmhighmetrik.com',   iniciales: 'JQ' },
    { id: 'PER-005', nombre: 'Raúl Mendoza Vilca',       cargo: 'Capataz Obra 021',      dni: '46789012', telefono: '987654325', email: 'raul.mendoza@mmhighmetrik.com',   iniciales: 'RM' },
    { id: 'PER-006', nombre: 'Patricia Salas Córdova',   cargo: 'Asistente Oficina',     dni: '43210987', telefono: '987654326', email: 'patricia.salas@mmhighmetrik.com', iniciales: 'PS' },
    { id: 'PER-007', nombre: 'Carlos Huanca Huamán',     cargo: 'Maestro Obra',          dni: '47654321', telefono: '987654327', email: 'carlos.huanca@mmhighmetrik.com',  iniciales: 'CH' },
    { id: 'PER-008', nombre: 'Lucía Espinoza Ramos',     cargo: 'Ingeniera de Costos',   dni: '45678901', telefono: '987654328', email: 'lucia.espinoza@mmhighmetrik.com', iniciales: 'LE' },
    { id: 'PER-009', nombre: 'Diego Torres Saavedra',    cargo: 'Almacenero Obra 018',   dni: '46123789', telefono: '987654329', email: 'diego.torres@mmhighmetrik.com',   iniciales: 'DT' },
  ];

  // Items — catálogo realista MMHIGHMETRIK (herramientas + andamios + EPP, sin equipo pesado)
  const _mkItem = (id, codigo, nombre, categoria, marca, modelo, serie, valorAdq, fechaAdq, proveedor, estado, ubId, respId) => ({
    id, codigo, nombre, categoria, marca, modelo, serie,
    valorAdq, fechaAdq, proveedor, estado,
    ubicacionId: ubId, responsableId: respId,
    ...DEPRECIACION_CATEGORIA[categoria],
  });

  const inventarioItems = [
    // Taladros + rotomartillos
    _mkItem('INV-001', 'MM-H-0001', 'Taladro rotopercutor Bosch GBH 2-26 DRE',       'Herramienta eléctrica', 'Bosch',    'GBH 2-26 DRE',    'SN9823451', 1480, '2024-03-15', 'Bosch Perú',           'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-002', 'MM-H-0002', 'Taladro percutor DeWalt DCD791 18V',             'Herramienta eléctrica', 'DeWalt',   'DCD791',          'DW842120',  980,  '2024-05-20', 'Promart',              'Operativo',        'UB-018', 'PER-009'),
    _mkItem('INV-003', 'MM-H-0003', 'Taladro Makita HP347D inalámbrico 14.4V',        'Herramienta eléctrica', 'Makita',   'HP347D',          'MK88123',   720,  '2024-08-12', 'Distribuidora Makita', 'Operativo',        'UB-024', 'PER-003'),
    _mkItem('INV-004', 'MM-H-0004', 'Rotomartillo Bosch GSH 5 CE (pequeño)',          'Herramienta eléctrica', 'Bosch',    'GSH 5 CE',        'SN7645321', 2480, '2023-11-08', 'Bosch Perú',           'En mantenimiento', 'UB-BOSCH', 'PER-004'),
    // Amoladoras
    _mkItem('INV-005', 'MM-H-0005', 'Amoladora angular Bosch GWS 7-125',              'Herramienta eléctrica', 'Bosch',    'GWS 7-125',       'SN8912340', 420,  '2024-06-18', 'Bosch Perú',           'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-006', 'MM-H-0006', 'Amoladora angular DeWalt D28402 4.5"',           'Herramienta eléctrica', 'DeWalt',   'D28402',          'DW765432',  380,  '2024-09-22', 'Promart',              'Operativo',        'UB-CEN', 'PER-004'),
    _mkItem('INV-007', 'MM-H-0007', 'Amoladora 9" Makita GA9020',                     'Herramienta eléctrica', 'Makita',   'GA9020',          'MK91234',   680,  '2024-02-10', 'Sodimac',              'Operativo',        'UB-018', 'PER-009'),
    // Sierras
    _mkItem('INV-008', 'MM-H-0008', 'Sierra circular Bosch GKS 7000',                 'Herramienta eléctrica', 'Bosch',    'GKS 7000',        'SN7712390', 580,  '2024-04-25', 'Bosch Perú',           'Operativo',        'UB-012', 'PER-007'),
    _mkItem('INV-009', 'MM-H-0009', 'Sierra caladora DeWalt DW331K',                  'Herramienta eléctrica', 'DeWalt',   'DW331K',          'DW891234',  520,  '2024-07-14', 'Promart',              'Operativo',        'UB-CEN', 'PER-004'),
    _mkItem('INV-010', 'MM-H-0010', 'Tronzadora Makita 2414NB 14"',                   'Herramienta eléctrica', 'Makita',   '2414NB',          'MK78123',   1280, '2023-12-20', 'Distribuidora Makita', 'Operativo',        'UB-021', 'PER-005'),
    // Medición
    _mkItem('INV-011', 'MM-M-0011', 'Nivel láser autonivelante DeWalt DW089K',        'Medición',              'DeWalt',   'DW089K',          'DW441128',  1980, '2024-01-08', 'Promart',              'Operativo',        'UB-021', 'PER-002'),
    _mkItem('INV-012', 'MM-M-0012', 'Nivel láser Bosch GLL 2-15 G (verde)',           'Medición',              'Bosch',    'GLL 2-15 G',      'SN8834521', 1560, '2024-06-03', 'Bosch Perú',           'Operativo',        'UB-018', 'PER-002'),
    _mkItem('INV-013', 'MM-M-0013', 'Medidor láser distancia Bosch GLM 50',           'Medición',              'Bosch',    'GLM 50',          'SN9012345', 320,  '2025-02-14', 'Bosch Perú',           'Operativo',        'UB-021', 'PER-002'),
    _mkItem('INV-014', 'MM-M-0014', 'Medidor láser Leica Disto D2 80m',               'Medición',              'Leica',    'Disto D2',        'LC234567',  680,  '2024-11-22', 'GeoLima',              'Operativo',        'UB-CEN', 'PER-004'),
    _mkItem('INV-015', 'MM-M-0015', 'Estación total Topcon GTS-255 (básica)',         'Medición',              'Topcon',   'GTS-255',         'TC112233',  8900, '2023-08-15', 'Topomatic Perú',       'Operativo',        'UB-018', 'PER-002'),
    _mkItem('INV-016', 'MM-M-0016', 'Nivel de manguera transparente 15m',             'Herramienta manual',    'Genérico', '—',               '—',         85,   '2024-05-10', 'Sodimac',              'Operativo',        'UB-024', 'PER-007'),
    // Herramientas manuales
    _mkItem('INV-017', 'MM-H-0017', 'Juego llaves mixtas Stanley 12pz 8-22mm',        'Herramienta manual',    'Stanley',  '72-028',          '—',         280,  '2024-04-18', 'Sodimac',              'Operativo',        'UB-CEN', 'PER-004'),
    _mkItem('INV-018', 'MM-H-0018', 'Llave Stilson 18" Ridgid',                       'Herramienta manual',    'Ridgid',   '31025',           '—',         185,  '2024-10-05', 'Promart',              'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-019', 'MM-H-0019', 'Martillo carpintero Truper 16oz',                'Herramienta manual',    'Truper',   'MO-16',           '—',         42,   '2025-01-20', 'Sodimac',              'Operativo',        'UB-012', 'PER-007'),
    _mkItem('INV-020', 'MM-H-0020', 'Juego destornilladores Stanley 10pz',            'Herramienta manual',    'Stanley',  '69-101',          '—',         85,   '2024-11-08', 'Promart',              'Operativo',        'UB-CEN', 'PER-004'),
    _mkItem('INV-021', 'MM-H-0021', 'Cinta métrica Stanley FatMax 8m',                'Herramienta manual',    'Stanley',  '33-728',          '—',         68,   '2025-01-15', 'Sodimac',              'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-022', 'MM-H-0022', 'Cinta métrica Stanley 5m',                       'Herramienta manual',    'Stanley',  '30-686',          '—',         32,   '2024-12-10', 'Sodimac',              'Operativo',        'UB-018', 'PER-009'),
    _mkItem('INV-023', 'MM-H-0023', 'Plomada de bronce 250g',                         'Herramienta manual',    'Genérico', '—',               '—',         28,   '2024-09-12', 'Ferretería local',     'Operativo',        'UB-024', 'PER-007'),
    _mkItem('INV-024', 'MM-H-0024', 'Escuadra metálica 30cm Stanley',                 'Herramienta manual',    'Stanley',  '46-122',          '—',         65,   '2024-06-30', 'Sodimac',              'Operativo',        'UB-021', 'PER-005'),
    // Andamios y encofrado
    _mkItem('INV-025', 'MM-A-0025', 'Tramo andamio europeo 2×1.5m galvanizado',       'Andamios y encofrado',  'Forsa',    '—',               '—',         680,  '2023-10-15', 'Forsa Perú',           'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-026', 'MM-A-0026', 'Tramo andamio europeo 2×1.5m (segundo)',         'Andamios y encofrado',  'Forsa',    '—',               '—',         680,  '2023-10-15', 'Forsa Perú',           'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-027', 'MM-A-0027', 'Tramo andamio europeo 2×1.5m (tercero)',         'Andamios y encofrado',  'Forsa',    '—',               '—',         680,  '2023-10-15', 'Forsa Perú',           'Operativo',        'UB-018', 'PER-009'),
    _mkItem('INV-028', 'MM-A-0028', 'Diagonal andamio 2.5m x12und',                   'Andamios y encofrado',  'Forsa',    '—',               '—',         840,  '2023-10-15', 'Forsa Perú',           'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-029', 'MM-A-0029', 'Tabla plataforma andamio 2m fenólica',           'Andamios y encofrado',  'Forsa',    '—',               '—',         420,  '2024-02-20', 'Forsa Perú',           'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-030', 'MM-A-0030', 'Puntal acero galvanizado 3m regulable (x10)',    'Andamios y encofrado',  'Genérico', '—',               '—',         1280, '2023-07-22', 'Ferretería industrial','Operativo',        'UB-018', 'PER-009'),
    _mkItem('INV-031', 'MM-A-0031', 'Escalera telescópica aluminio 5.5m',             'Andamios y encofrado',  'Haulotte', 'T55',             '—',         920,  '2024-08-18', 'Promart',              'Operativo',        'UB-CEN', 'PER-004'),
    _mkItem('INV-032', 'MM-A-0032', 'Escalera tijera aluminio 3m doble acceso',       'Andamios y encofrado',  'Truper',   'E3-AL',           '—',         280,  '2024-03-25', 'Sodimac',              'Operativo',        'UB-024', 'PER-007'),
    _mkItem('INV-033', 'MM-A-0033', 'Escalera tijera aluminio 2m',                    'Andamios y encofrado',  'Truper',   'E2-AL',           '—',         180,  '2024-06-15', 'Sodimac',              'Operativo',        'UB-021', 'PER-005'),
    // Equipo eléctrico
    _mkItem('INV-034', 'MM-E-0034', 'Generador portátil Honda EU22i 2.2kW',           'Equipo eléctrico',      'Honda',    'EU22i',           'HN2841',    3800, '2023-05-10', 'Unimaq',               'Operativo',        'UB-021', 'PER-002'),
    _mkItem('INV-035', 'MM-E-0035', 'Compresor portátil 2HP 24L Black Decker',        'Equipo eléctrico',      'B&D',      'BD224/L',         'BD127845',  1280, '2024-01-30', 'Promart',              'Operativo',        'UB-018', 'PER-009'),
    _mkItem('INV-036', 'MM-E-0036', 'Soldadora inverter Indura 200A',                 'Equipo eléctrico',      'Indura',   'STICK 200',       'IN56789',   1580, '2024-04-08', 'Indura Perú',          'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-037', 'MM-E-0037', 'Bomba sumergible 1HP para achique',              'Equipo eléctrico',      'Pedrollo', 'NK1-1',           'PD12389',   680,  '2024-07-12', 'Sodimac',              'Operativo',        'UB-018', 'PER-009'),
    // EPP (consumibles)
    _mkItem('INV-038', 'MM-P-0038', 'Casco de seguridad clase E amarillo (lote 20)',  'EPP',                   '3M',       'H-700 Series',    '—',         540,  '2025-02-10', 'Sodimac',              'Operativo',        'UB-CEN', 'PER-004'),
    _mkItem('INV-039', 'MM-P-0039', 'Arnés completo cuerpo entero (lote 8)',          'EPP',                   '3M',       'ProtectaAB17510', '—',         1240, '2025-01-20', 'SKC Peru',             'Operativo',        'UB-021', 'PER-005'),
    _mkItem('INV-040', 'MM-P-0040', 'Botas punta de acero (lote 12 pares)',           'EPP',                   'Pro Boots','Model S3',        '—',         1080, '2025-03-05', 'Sodimac',              'Operativo',        'UB-024', 'PER-007'),
    _mkItem('INV-041', 'MM-P-0041', 'Guantes de cuero reforzado (lote 24 pares)',     'EPP',                   'Workman',  'WM-G-PRO',        '—',         360,  '2025-03-18', 'Ferretería industrial','Operativo',        'UB-CEN', 'PER-004'),
    _mkItem('INV-042', 'MM-P-0042', 'Gafas seguridad antiempañante (lote 30)',        'EPP',                   '3M',       'Virtua AP',       '—',         280,  '2025-02-28', 'Sodimac',              'Operativo',        'UB-018', 'PER-009'),
  ];

  // Movimientos históricos (trazabilidad) — últimos 5 meses
  const inventarioMovimientos = [
    { id: 'MOV-INV-001', fecha: '2026-04-22', itemId: 'INV-001', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-005', motivo: 'Transferencia obra Belcorp',           fotoGR: 'gr-2026-042.jpg' },
    { id: 'MOV-INV-002', fecha: '2026-04-18', itemId: 'INV-004', ubOrigen: 'UB-021',   ubDestino: 'UB-BOSCH', respEntrega: 'PER-005', respRecibe: 'PER-004', motivo: 'Envío a mantenimiento correctivo',     fotoGR: null },
    { id: 'MOV-INV-003', fecha: '2026-04-15', itemId: 'INV-011', ubOrigen: 'UB-018',   ubDestino: 'UB-021',   respEntrega: 'PER-009', respRecibe: 'PER-002', motivo: 'Uso en obra Belcorp piso 3',           fotoGR: 'gr-2026-038.jpg' },
    { id: 'MOV-INV-004', fecha: '2026-04-10', itemId: 'INV-025', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-005', motivo: 'Armado andamios fachada',              fotoGR: 'gr-2026-035.jpg' },
    { id: 'MOV-INV-005', fecha: '2026-04-10', itemId: 'INV-026', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-005', motivo: 'Armado andamios fachada',              fotoGR: 'gr-2026-035.jpg' },
    { id: 'MOV-INV-006', fecha: '2026-04-08', itemId: 'INV-034', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-002', motivo: 'Generador para obra',                  fotoGR: null },
    { id: 'MOV-INV-007', fecha: '2026-04-05', itemId: 'INV-015', ubOrigen: 'UB-CEN',   ubDestino: 'UB-018',   respEntrega: 'PER-004', respRecibe: 'PER-002', motivo: 'Replanteo estructura nave',             fotoGR: 'gr-2026-033.jpg' },
    { id: 'MOV-INV-008', fecha: '2026-03-28', itemId: 'INV-002', ubOrigen: 'UB-CEN',   ubDestino: 'UB-018',   respEntrega: 'PER-004', respRecibe: 'PER-009', motivo: 'Transferencia a Lurín',                fotoGR: null },
    { id: 'MOV-INV-009', fecha: '2026-03-25', itemId: 'INV-030', ubOrigen: 'UB-021',   ubDestino: 'UB-018',   respEntrega: 'PER-005', respRecibe: 'PER-009', motivo: 'Refuerzo encofrado losa',               fotoGR: 'gr-2026-028.jpg' },
    { id: 'MOV-INV-010', fecha: '2026-03-20', itemId: 'INV-008', ubOrigen: 'UB-CEN',   ubDestino: 'UB-012',   respEntrega: 'PER-004', respRecibe: 'PER-007', motivo: 'Corte de material mantenimiento Ate',  fotoGR: null },
    { id: 'MOV-INV-011', fecha: '2026-03-15', itemId: 'INV-027', ubOrigen: 'UB-021',   ubDestino: 'UB-018',   respEntrega: 'PER-005', respRecibe: 'PER-009', motivo: 'Andamio fachada Lurín',                 fotoGR: 'gr-2026-024.jpg' },
    { id: 'MOV-INV-012', fecha: '2026-03-10', itemId: 'INV-005', ubOrigen: 'UB-018',   ubDestino: 'UB-021',   respEntrega: 'PER-009', respRecibe: 'PER-005', motivo: 'Corte acero en Belcorp',                fotoGR: null },
    { id: 'MOV-INV-013', fecha: '2026-03-05', itemId: 'INV-036', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-005', motivo: 'Soldadura barandas metálicas',          fotoGR: 'gr-2026-018.jpg' },
    { id: 'MOV-INV-014', fecha: '2026-02-28', itemId: 'INV-010', ubOrigen: 'UB-018',   ubDestino: 'UB-021',   respEntrega: 'PER-009', respRecibe: 'PER-005', motivo: 'Tronzado perfiles metálicos',           fotoGR: null },
    { id: 'MOV-INV-015', fecha: '2026-02-20', itemId: 'INV-038', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-005', motivo: 'Reposición EPP cascos',                 fotoGR: 'gr-2026-015.jpg' },
    { id: 'MOV-INV-016', fecha: '2026-02-15', itemId: 'INV-039', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-005', motivo: 'Arneses trabajo en altura',              fotoGR: 'gr-2026-014.jpg' },
    { id: 'MOV-INV-017', fecha: '2026-02-10', itemId: 'INV-012', ubOrigen: 'UB-CEN',   ubDestino: 'UB-018',   respEntrega: 'PER-004', respRecibe: 'PER-002', motivo: 'Nivel láser para estructura',           fotoGR: null },
    { id: 'MOV-INV-018', fecha: '2026-02-05', itemId: 'INV-003', ubOrigen: 'UB-CEN',   ubDestino: 'UB-024',   respEntrega: 'PER-004', respRecibe: 'PER-003', motivo: 'Taladro inalámbrico Mall',              fotoGR: null },
    { id: 'MOV-INV-019', fecha: '2026-01-25', itemId: 'INV-028', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-005', motivo: 'Diagonales andamio',                    fotoGR: 'gr-2026-008.jpg' },
    { id: 'MOV-INV-020', fecha: '2026-01-20', itemId: 'INV-017', ubOrigen: 'UB-018',   ubDestino: 'UB-CEN',   respEntrega: 'PER-009', respRecibe: 'PER-004', motivo: 'Retorno juego llaves',                  fotoGR: null },
    { id: 'MOV-INV-021', fecha: '2026-01-15', itemId: 'INV-029', ubOrigen: 'UB-CEN',   ubDestino: 'UB-021',   respEntrega: 'PER-004', respRecibe: 'PER-005', motivo: 'Tabla plataforma andamio',              fotoGR: 'gr-2026-005.jpg' },
    { id: 'MOV-INV-022', fecha: '2026-01-10', itemId: 'INV-007', ubOrigen: 'UB-CEN',   ubDestino: 'UB-018',   respEntrega: 'PER-004', respRecibe: 'PER-009', motivo: 'Amoladora 9" para corte estructura',    fotoGR: null },
    { id: 'MOV-INV-023', fecha: '2025-12-20', itemId: 'INV-037', ubOrigen: 'UB-CEN',   ubDestino: 'UB-018',   respEntrega: 'PER-004', respRecibe: 'PER-009', motivo: 'Bomba achique zona húmeda',             fotoGR: 'gr-2025-121.jpg' },
    { id: 'MOV-INV-024', fecha: '2025-12-10', itemId: 'INV-035', ubOrigen: 'UB-CEN',   ubDestino: 'UB-018',   respEntrega: 'PER-004', respRecibe: 'PER-009', motivo: 'Compresor pintura estructura',          fotoGR: null },
    { id: 'MOV-INV-025', fecha: '2025-11-30', itemId: 'INV-031', ubOrigen: 'UB-UNIMAQ', ubDestino: 'UB-CEN', respEntrega: 'PER-004', respRecibe: 'PER-004', motivo: 'Retorno escalera telescópica',          fotoGR: null },
  ];

  // Mantenimientos programados + historial
  const inventarioMantenimientos = [
    { id: 'MNT-001', itemId: 'INV-004', tipo: 'Correctivo',  fechaProgramada: '2026-04-25', fechaRealizada: null,       proveedor: 'Bosch Service Center', costo: null, descripcion: 'Revisión rotor + cambio escobillas', estado: 'En servicio' },
    { id: 'MNT-002', itemId: 'INV-001', tipo: 'Preventivo',  fechaProgramada: '2026-05-10', fechaRealizada: null,       proveedor: 'Interno Jorge Quispe',  costo: 80,   descripcion: 'Limpieza + engrase rotatorio',       estado: 'Programado' },
    { id: 'MNT-003', itemId: 'INV-034', tipo: 'Preventivo',  fechaProgramada: '2026-05-15', fechaRealizada: null,       proveedor: 'Unimaq Taller',        costo: 280,  descripcion: 'Cambio aceite + filtros 200h',       estado: 'Programado' },
    { id: 'MNT-004', itemId: 'INV-011', tipo: 'Preventivo',  fechaProgramada: '2026-05-20', fechaRealizada: null,       proveedor: 'Interno Jorge Quispe',  costo: 50,   descripcion: 'Calibración y limpieza óptica',       estado: 'Programado' },
    { id: 'MNT-005', itemId: 'INV-005', tipo: 'Correctivo',  fechaProgramada: '2026-03-20', fechaRealizada: '2026-03-22', proveedor: 'Bosch Service Center', costo: 180, descripcion: 'Cambio disco de rodamiento',         estado: 'Completado' },
    { id: 'MNT-006', itemId: 'INV-036', tipo: 'Preventivo',  fechaProgramada: '2026-02-10', fechaRealizada: '2026-02-12', proveedor: 'Indura Perú',         costo: 140, descripcion: 'Revisión eléctrica + cambio cables',  estado: 'Completado' },
    { id: 'MNT-007', itemId: 'INV-015', tipo: 'Preventivo',  fechaProgramada: '2026-01-30', fechaRealizada: '2026-02-02', proveedor: 'Topomatic Perú',      costo: 420, descripcion: 'Calibración anual SUNAMHI',          estado: 'Completado' },
    { id: 'MNT-008', itemId: 'INV-031', tipo: 'Correctivo',  fechaProgramada: '2025-11-20', fechaRealizada: '2025-11-28', proveedor: 'Unimaq Taller',        costo: 220, descripcion: 'Reemplazo perno seguro traba',       estado: 'Completado' },
  ];

  // ═════════════════ CONTABILIDAD — PCGE 2020 + asientos + bancos ═════════════════

  // Plan Contable General Empresarial (PCGE Modificado 2019, vigente 2020+)
  // Subset relevante para empresa de construcción peruana
  const planContable = [
    // ── Clase 1 · Activo disponible y exigible ──
    { codigo: '10',    nombre: 'Efectivo y equivalentes de efectivo',       clase: 1, tipo: 'Activo', nivel: 1, grupo: 'Efectivo' },
    { codigo: '101',   nombre: 'Caja',                                       clase: 1, tipo: 'Activo', nivel: 2, parent: '10', grupo: 'Efectivo' },
    { codigo: '1011',  nombre: 'Caja MN',                                    clase: 1, tipo: 'Activo', nivel: 3, parent: '101', grupo: 'Efectivo' },
    { codigo: '104',   nombre: 'Cuentas corrientes en instituciones financieras', clase: 1, tipo: 'Activo', nivel: 2, parent: '10', grupo: 'Efectivo' },
    { codigo: '1041',  nombre: 'Cuentas corrientes operativas',              clase: 1, tipo: 'Activo', nivel: 3, parent: '104', grupo: 'Efectivo' },
    { codigo: '10411', nombre: 'BCP · Cta. corriente MN',                    clase: 1, tipo: 'Activo', nivel: 4, parent: '1041', grupo: 'Bancos' },
    { codigo: '10412', nombre: 'BCP · Cta. corriente ME (dólares)',          clase: 1, tipo: 'Activo', nivel: 4, parent: '1041', grupo: 'Bancos' },
    { codigo: '10421', nombre: 'Interbank · Cta. corriente MN',              clase: 1, tipo: 'Activo', nivel: 4, parent: '1041', grupo: 'Bancos' },
    { codigo: '10431', nombre: 'BBVA · Ahorros obras MN',                    clase: 1, tipo: 'Activo', nivel: 4, parent: '1041', grupo: 'Bancos' },
    { codigo: '10414', nombre: 'Banco de la Nación · Detracciones SPOT',     clase: 1, tipo: 'Activo', nivel: 4, parent: '1041', grupo: 'Bancos' },

    { codigo: '12',    nombre: 'Cuentas por cobrar comerciales - Terceros',   clase: 1, tipo: 'Activo', nivel: 1, grupo: 'Cobrar' },
    { codigo: '121',   nombre: 'Facturas, boletas y otros comprobantes por cobrar', clase: 1, tipo: 'Activo', nivel: 2, parent: '12', grupo: 'Cobrar' },
    { codigo: '1212',  nombre: 'Emitidas en cartera',                        clase: 1, tipo: 'Activo', nivel: 3, parent: '121', grupo: 'Cobrar' },
    { codigo: '12121', nombre: 'Facturas por cobrar - Clientes',             clase: 1, tipo: 'Activo', nivel: 4, parent: '1212', grupo: 'Cobrar' },

    { codigo: '14',    nombre: 'Cuentas por cobrar al personal, accionistas', clase: 1, tipo: 'Activo', nivel: 1, grupo: 'Cobrar' },
    { codigo: '141',   nombre: 'Personal',                                    clase: 1, tipo: 'Activo', nivel: 2, parent: '14', grupo: 'Cobrar' },

    { codigo: '16',    nombre: 'Cuentas por cobrar diversas - Terceros',     clase: 1, tipo: 'Activo', nivel: 1, grupo: 'Cobrar' },

    { codigo: '18',    nombre: 'Servicios y otros contratados por anticipado', clase: 1, tipo: 'Activo', nivel: 1, grupo: 'Pagos anticipados' },

    { codigo: '25',    nombre: 'Materiales auxiliares, suministros y repuestos', clase: 1, tipo: 'Activo', nivel: 1, grupo: 'Inventarios' },
    { codigo: '251',   nombre: 'Materiales auxiliares',                      clase: 1, tipo: 'Activo', nivel: 2, parent: '25', grupo: 'Inventarios' },

    { codigo: '33',    nombre: 'Inmuebles, maquinaria y equipo',              clase: 1, tipo: 'Activo', nivel: 1, grupo: 'Activo fijo' },
    { codigo: '332',   nombre: 'Edificaciones',                               clase: 1, tipo: 'Activo', nivel: 2, parent: '33', grupo: 'Activo fijo' },
    { codigo: '333',   nombre: 'Maquinaria y equipo de explotación',          clase: 1, tipo: 'Activo', nivel: 2, parent: '33', grupo: 'Activo fijo' },
    { codigo: '334',   nombre: 'Unidades de transporte',                      clase: 1, tipo: 'Activo', nivel: 2, parent: '33', grupo: 'Activo fijo' },
    { codigo: '335',   nombre: 'Muebles y enseres',                           clase: 1, tipo: 'Activo', nivel: 2, parent: '33', grupo: 'Activo fijo' },
    { codigo: '336',   nombre: 'Equipos diversos',                            clase: 1, tipo: 'Activo', nivel: 2, parent: '33', grupo: 'Activo fijo' },
    { codigo: '337',   nombre: 'Herramientas y unidades de reemplazo',        clase: 1, tipo: 'Activo', nivel: 2, parent: '33', grupo: 'Activo fijo' },

    { codigo: '39',    nombre: 'Depreciación, amortización y agotamiento acumulados', clase: 1, tipo: 'Activo', nivel: 1, grupo: 'Activo fijo' },
    { codigo: '391',   nombre: 'Depreciación acumulada',                      clase: 1, tipo: 'Activo', nivel: 2, parent: '39', grupo: 'Activo fijo' },
    { codigo: '3913',  nombre: 'Depreciación · IME Costo',                    clase: 1, tipo: 'Activo', nivel: 3, parent: '391', grupo: 'Activo fijo' },

    // ── Clase 4 · Pasivos ──
    { codigo: '40',    nombre: 'Tributos, contraprestaciones y aportes al sistema de pensiones y de salud por pagar', clase: 4, tipo: 'Pasivo', nivel: 1, grupo: 'Tributos' },
    { codigo: '401',   nombre: 'Gobierno central',                            clase: 4, tipo: 'Pasivo', nivel: 2, parent: '40', grupo: 'Tributos' },
    { codigo: '4011',  nombre: 'Impuesto general a las ventas',               clase: 4, tipo: 'Pasivo', nivel: 3, parent: '401', grupo: 'Tributos' },
    { codigo: '40111', nombre: 'IGV · Cuenta propia (ventas)',                clase: 4, tipo: 'Pasivo', nivel: 4, parent: '4011', grupo: 'Tributos' },
    { codigo: '40112', nombre: 'IGV · Crédito fiscal (compras)',              clase: 4, tipo: 'Pasivo', nivel: 4, parent: '4011', grupo: 'Tributos' },
    { codigo: '40114', nombre: 'IGV · Régimen de detracciones SPOT',          clase: 4, tipo: 'Pasivo', nivel: 4, parent: '4011', grupo: 'Tributos' },
    { codigo: '4017',  nombre: 'Impuesto a la renta',                         clase: 4, tipo: 'Pasivo', nivel: 3, parent: '401', grupo: 'Tributos' },
    { codigo: '40171', nombre: 'Renta 3ra categoría',                         clase: 4, tipo: 'Pasivo', nivel: 4, parent: '4017', grupo: 'Tributos' },
    { codigo: '40172', nombre: 'Renta 4ta categoría (RHE · honorarios)',      clase: 4, tipo: 'Pasivo', nivel: 4, parent: '4017', grupo: 'Tributos' },
    { codigo: '40173', nombre: 'Renta 5ta categoría (planilla)',              clase: 4, tipo: 'Pasivo', nivel: 4, parent: '4017', grupo: 'Tributos' },
    { codigo: '403',   nombre: 'Instituciones públicas',                      clase: 4, tipo: 'Pasivo', nivel: 2, parent: '40', grupo: 'Tributos' },
    { codigo: '4031',  nombre: 'EsSalud',                                     clase: 4, tipo: 'Pasivo', nivel: 3, parent: '403', grupo: 'Tributos' },
    { codigo: '4032',  nombre: 'ONP',                                         clase: 4, tipo: 'Pasivo', nivel: 3, parent: '403', grupo: 'Tributos' },
    { codigo: '407',   nombre: 'Administradoras de fondos de pensiones (AFP)', clase: 4, tipo: 'Pasivo', nivel: 2, parent: '40', grupo: 'Tributos' },

    { codigo: '41',    nombre: 'Remuneraciones y participaciones por pagar',  clase: 4, tipo: 'Pasivo', nivel: 1, grupo: 'Planilla' },
    { codigo: '411',   nombre: 'Remuneraciones por pagar',                    clase: 4, tipo: 'Pasivo', nivel: 2, parent: '41', grupo: 'Planilla' },
    { codigo: '4111',  nombre: 'Sueldos y salarios por pagar',                clase: 4, tipo: 'Pasivo', nivel: 3, parent: '411', grupo: 'Planilla' },

    { codigo: '42',    nombre: 'Cuentas por pagar comerciales - Terceros',    clase: 4, tipo: 'Pasivo', nivel: 1, grupo: 'Pagar' },
    { codigo: '421',   nombre: 'Facturas, boletas y otros comprobantes por pagar', clase: 4, tipo: 'Pasivo', nivel: 2, parent: '42', grupo: 'Pagar' },
    { codigo: '4212',  nombre: 'Emitidas',                                    clase: 4, tipo: 'Pasivo', nivel: 3, parent: '421', grupo: 'Pagar' },
    { codigo: '42121', nombre: 'Facturas por pagar - Proveedores',            clase: 4, tipo: 'Pasivo', nivel: 4, parent: '4212', grupo: 'Pagar' },

    { codigo: '45',    nombre: 'Obligaciones financieras',                    clase: 4, tipo: 'Pasivo', nivel: 1, grupo: 'Financiamiento' },
    { codigo: '46',    nombre: 'Cuentas por pagar diversas - Terceros',       clase: 4, tipo: 'Pasivo', nivel: 1, grupo: 'Pagar' },

    // ── Clase 5 · Patrimonio ──
    { codigo: '50',    nombre: 'Capital',                                     clase: 5, tipo: 'Patrimonio', nivel: 1, grupo: 'Patrimonio' },
    { codigo: '501',   nombre: 'Capital social',                              clase: 5, tipo: 'Patrimonio', nivel: 2, parent: '50', grupo: 'Patrimonio' },
    { codigo: '59',    nombre: 'Resultados acumulados',                       clase: 5, tipo: 'Patrimonio', nivel: 1, grupo: 'Patrimonio' },
    { codigo: '591',   nombre: 'Utilidades no distribuidas',                  clase: 5, tipo: 'Patrimonio', nivel: 2, parent: '59', grupo: 'Patrimonio' },

    // ── Clase 6 · Gastos por naturaleza ──
    { codigo: '60',    nombre: 'Compras',                                     clase: 6, tipo: 'Gasto', nivel: 1, grupo: 'Compras' },
    { codigo: '601',   nombre: 'Mercaderías',                                 clase: 6, tipo: 'Gasto', nivel: 2, parent: '60', grupo: 'Compras' },
    { codigo: '602',   nombre: 'Materias primas',                             clase: 6, tipo: 'Gasto', nivel: 2, parent: '60', grupo: 'Compras' },
    { codigo: '603',   nombre: 'Materiales auxiliares, suministros y repuestos', clase: 6, tipo: 'Gasto', nivel: 2, parent: '60', grupo: 'Compras' },
    { codigo: '6031',  nombre: 'Materiales auxiliares · construcción',        clase: 6, tipo: 'Gasto', nivel: 3, parent: '603', grupo: 'Compras' },

    { codigo: '62',    nombre: 'Gastos de personal, directores y gerentes',   clase: 6, tipo: 'Gasto', nivel: 1, grupo: 'Personal' },
    { codigo: '621',   nombre: 'Remuneraciones',                              clase: 6, tipo: 'Gasto', nivel: 2, parent: '62', grupo: 'Personal' },
    { codigo: '6211',  nombre: 'Sueldos y salarios',                          clase: 6, tipo: 'Gasto', nivel: 3, parent: '621', grupo: 'Personal' },
    { codigo: '622',   nombre: 'Otras remuneraciones (CTS, vacaciones)',      clase: 6, tipo: 'Gasto', nivel: 2, parent: '62', grupo: 'Personal' },
    { codigo: '627',   nombre: 'Seguridad y previsión social',                clase: 6, tipo: 'Gasto', nivel: 2, parent: '62', grupo: 'Personal' },

    { codigo: '63',    nombre: 'Gastos de servicios prestados por terceros',  clase: 6, tipo: 'Gasto', nivel: 1, grupo: 'Servicios' },
    { codigo: '631',   nombre: 'Transporte, correos y gastos de viaje',       clase: 6, tipo: 'Gasto', nivel: 2, parent: '63', grupo: 'Servicios' },
    { codigo: '632',   nombre: 'Asesoría y consultoría',                      clase: 6, tipo: 'Gasto', nivel: 2, parent: '63', grupo: 'Servicios' },
    { codigo: '634',   nombre: 'Mantenimiento y reparaciones',                clase: 6, tipo: 'Gasto', nivel: 2, parent: '63', grupo: 'Servicios' },
    { codigo: '635',   nombre: 'Alquileres (equipos, locales)',               clase: 6, tipo: 'Gasto', nivel: 2, parent: '63', grupo: 'Servicios' },
    { codigo: '636',   nombre: 'Servicios básicos (luz, agua, internet)',     clase: 6, tipo: 'Gasto', nivel: 2, parent: '63', grupo: 'Servicios' },
    { codigo: '6363',  nombre: 'Subcontratación (servicios obra)',            clase: 6, tipo: 'Gasto', nivel: 3, parent: '636', grupo: 'Servicios' },
    { codigo: '639',   nombre: 'Otros servicios',                             clase: 6, tipo: 'Gasto', nivel: 2, parent: '63', grupo: 'Servicios' },

    { codigo: '64',    nombre: 'Gastos por tributos',                         clase: 6, tipo: 'Gasto', nivel: 1, grupo: 'Tributos' },
    { codigo: '65',    nombre: 'Otros gastos de gestión',                     clase: 6, tipo: 'Gasto', nivel: 1, grupo: 'Otros' },
    { codigo: '67',    nombre: 'Gastos financieros',                          clase: 6, tipo: 'Gasto', nivel: 1, grupo: 'Financiamiento' },
    { codigo: '673',   nombre: 'Intereses por préstamos',                     clase: 6, tipo: 'Gasto', nivel: 2, parent: '67', grupo: 'Financiamiento' },

    { codigo: '68',    nombre: 'Valuación y deterioro de activos',            clase: 6, tipo: 'Gasto', nivel: 1, grupo: 'Depreciación' },
    { codigo: '681',   nombre: 'Depreciación',                                 clase: 6, tipo: 'Gasto', nivel: 2, parent: '68', grupo: 'Depreciación' },
    { codigo: '6814',  nombre: 'Depreciación de IME - Costo',                 clase: 6, tipo: 'Gasto', nivel: 3, parent: '681', grupo: 'Depreciación' },

    // ── Clase 7 · Ingresos ──
    { codigo: '70',    nombre: 'Ventas',                                       clase: 7, tipo: 'Ingreso', nivel: 1, grupo: 'Ventas' },
    { codigo: '701',   nombre: 'Mercaderías',                                  clase: 7, tipo: 'Ingreso', nivel: 2, parent: '70', grupo: 'Ventas' },
    { codigo: '704',   nombre: 'Prestación de servicios',                      clase: 7, tipo: 'Ingreso', nivel: 2, parent: '70', grupo: 'Ventas' },
    { codigo: '7041',  nombre: 'Servicios de construcción',                    clase: 7, tipo: 'Ingreso', nivel: 3, parent: '704', grupo: 'Ventas' },
    { codigo: '75',    nombre: 'Otros ingresos de gestión',                    clase: 7, tipo: 'Ingreso', nivel: 1, grupo: 'Otros' },
    { codigo: '77',    nombre: 'Ingresos financieros',                         clase: 7, tipo: 'Ingreso', nivel: 1, grupo: 'Financiamiento' },

    // ── Clase 8 · Saldos intermediarios de gestión ──
    { codigo: '88',    nombre: 'Impuesto a la renta',                          clase: 8, tipo: 'Resultado', nivel: 1, grupo: 'Impuestos' },
    { codigo: '881',   nombre: 'Impuesto a la renta · corriente',              clase: 8, tipo: 'Resultado', nivel: 2, parent: '88', grupo: 'Impuestos' },
    { codigo: '89',    nombre: 'Determinación del resultado del ejercicio',    clase: 8, tipo: 'Resultado', nivel: 1, grupo: 'Resultado' },
  ];

  // Mapeo de cuentas bancarias ERP → cuenta PCGE
  const BANK_TO_PCGE = {
    'BCP-SOL':  '10411',
    'BCP-USD':  '10412',
    'BCP-DET':  '10414',
    'IBK-SOL':  '10421',
    'BBVA-OBR': '10431',
    'CAJA-LIM': '1011',
  };

  // Mapeo categoría egreso → cuenta PCGE (para auto-generación asientos)
  const CAT_EG_TO_PCGE = {
    'Materiales':     '6031',
    'Planilla':       '6211',
    'Subcontrato':    '6363',
    'Equipos':        '635',
    'Oficina':        '639',
    'Tributos':       '641',
  };

  // Generador de asientos contables desde cashflow.detalleIng/Eg existente
  function generarAsientos() {
    const asientos = [];
    let idx = 1;
    const fmtId = (n) => 'AS-' + String(n).padStart(4, '0');

    cashflow.forEach(m => {
      // Asientos desde ingresos (valorizaciones → factura emitida)
      m.detalleIng.forEach((ing, i) => {
        if (ing.tipo !== 'Valorización') return;
        const total = ing.monto;
        const subtotal = +(total / 1.18).toFixed(2);
        const igv = +(total - subtotal).toFixed(2);
        asientos.push({
          id: fmtId(idx++),
          fecha: ing.fecha, glosa: `${ing.concepto} · ${ing.contraparte}`,
          docOrigen: ing.comprobante, tipoDoc: 'Factura emitida',
          proyecto: ing.proyecto, contraparte: ing.contraparte,
          lineas: [
            { cuenta: '12121', descripcion: 'Factura por cobrar · ' + ing.contraparte, debe: total, haber: 0 },
            { cuenta: '7041',  descripcion: 'Servicios de construcción',                debe: 0,     haber: subtotal },
            { cuenta: '40111', descripcion: 'IGV ventas 18%',                           debe: 0,     haber: igv },
          ],
          status: 'Registrado',
        });

        // Si ya fue cobrada → asiento de cobro
        if (ing.status === 'Cobrada') {
          asientos.push({
            id: fmtId(idx++),
            fecha: ing.fecha, glosa: `Cobro de ${ing.comprobante}`,
            docOrigen: ing.comprobante, tipoDoc: 'Cobro',
            proyecto: ing.proyecto, contraparte: ing.contraparte,
            lineas: [
              { cuenta: '10411', descripcion: 'BCP · ingreso valorización',              debe: total, haber: 0 },
              { cuenta: '12121', descripcion: 'Factura por cobrar · ' + ing.contraparte, debe: 0,     haber: total },
            ],
            status: 'Registrado',
          });
        }
      });

      // Asientos desde egresos (facturas recibidas de proveedores)
      m.detalleEg.forEach((eg) => {
        const catCuenta = CAT_EG_TO_PCGE[eg.categoria] || '639';
        const total = eg.monto;
        const subtotal = +(total / 1.18).toFixed(2);
        const igv = +(total - subtotal).toFixed(2);

        // Planilla va directo sin IGV
        if (eg.categoria === 'Planilla') {
          const essalud = +(subtotal * 0.09).toFixed(2);
          const neto = +(total - essalud).toFixed(2);
          asientos.push({
            id: fmtId(idx++),
            fecha: eg.fecha, glosa: `Planilla · ${eg.concepto}`,
            docOrigen: eg.comprobante, tipoDoc: 'Planilla',
            proyecto: eg.proyecto, contraparte: eg.contraparte,
            lineas: [
              { cuenta: '6211',  descripcion: 'Sueldos y salarios',  debe: subtotal, haber: 0 },
              { cuenta: '627',   descripcion: 'EsSalud 9%',          debe: essalud,  haber: 0 },
              { cuenta: '4111',  descripcion: 'Sueldos por pagar',   debe: 0,        haber: neto },
              { cuenta: '4031',  descripcion: 'EsSalud por pagar',   debe: 0,        haber: essalud },
            ],
            status: 'Registrado',
          });
          return;
        }

        // Tributo SUNAT sin IGV
        if (eg.categoria === 'Tributos') {
          asientos.push({
            id: fmtId(idx++),
            fecha: eg.fecha, glosa: `Pago tributo · ${eg.concepto}`,
            docOrigen: eg.comprobante, tipoDoc: 'Pago tributo',
            proyecto: eg.proyecto, contraparte: 'SUNAT',
            lineas: [
              { cuenta: '40111', descripcion: 'IGV por pagar',       debe: total, haber: 0 },
              { cuenta: '10411', descripcion: 'BCP · pago SUNAT',    debe: 0,     haber: total },
            ],
            status: 'Registrado',
          });
          return;
        }

        // Servicios/materiales normales con IGV
        asientos.push({
          id: fmtId(idx++),
          fecha: eg.fecha, glosa: `${eg.concepto} · ${eg.contraparte}`,
          docOrigen: eg.comprobante, tipoDoc: 'Factura recibida',
          proyecto: eg.proyecto, contraparte: eg.contraparte,
          lineas: [
            { cuenta: catCuenta, descripcion: eg.concepto.slice(0, 60),     debe: subtotal, haber: 0 },
            { cuenta: '40112',   descripcion: 'IGV compras (crédito fiscal)', debe: igv,      haber: 0 },
            { cuenta: '42121',   descripcion: 'Factura por pagar · ' + eg.contraparte, debe: 0, haber: total },
          ],
          status: eg.status === 'Pagada' ? 'Registrado' : 'Revisar contador',
        });

        // Si ya fue pagada → asiento de pago
        if (eg.status === 'Pagada') {
          asientos.push({
            id: fmtId(idx++),
            fecha: eg.fecha, glosa: `Pago a ${eg.contraparte}`,
            docOrigen: eg.comprobante, tipoDoc: 'Pago',
            proyecto: eg.proyecto, contraparte: eg.contraparte,
            lineas: [
              { cuenta: '42121', descripcion: 'Cancelación factura',        debe: total, haber: 0 },
              { cuenta: '10411', descripcion: 'BCP · pago proveedor',       debe: 0,     haber: total },
            ],
            status: 'Registrado',
          });
        }
      });
    });

    return asientos;
  }

  const asientosContables = generarAsientos();

  // Cartola bancaria mock BCP Soles (abril 2026)
  // Formato real del BCP: fecha, desc, cargo/abono, saldo
  const cartolasBancarias = [
    {
      id: 'CART-BCP-202604',
      cuentaId: 'BCP-SOL',
      banco: 'BCP',
      periodo: 'Abril 2026',
      saldoInicial: 2680000,
      saldoFinal: 2840500,
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-22',
      movimientos: [
        { fecha: '2026-04-03', descripcion: 'TRANSF INTERBANCARIA BBVA', ref: 'TRF-IBK-8412',    cargo: 0,     abono: 180000, saldo: 2860000, matchId: null },
        { fecha: '2026-04-05', descripcion: 'DEPOSITO UNACEM FACTURA F004',  ref: 'DEP-554891',  cargo: 0,     abono: 18400, saldo: 2878400, matchId: null },
        { fecha: '2026-04-08', descripcion: 'PAGO PLANILLA QUINCENA',    ref: 'PL-2026-04A',     cargo: 22800, abono: 0,     saldo: 2855600, matchId: null },
        { fecha: '2026-04-10', descripcion: 'TRANSF A GRUAS PACIFICO',   ref: 'TRF-088422',      cargo: 6400,  abono: 0,     saldo: 2849200, matchId: null },
        { fecha: '2026-04-12', descripcion: 'CLIMATIZACION ANDINA F001', ref: 'TRF-088456',      cargo: 16400, abono: 0,     saldo: 2832800, matchId: null },
        { fecha: '2026-04-15', descripcion: 'ITF IMPUESTO 0.005%',       ref: 'ITF-AUTO',        cargo: 45,    abono: 0,     saldo: 2832755, matchId: null },
        { fecha: '2026-04-15', descripcion: 'COMISION MANTENIMIENTO',    ref: 'COM-MENS',        cargo: 18,    abono: 0,     saldo: 2832737, matchId: null },
        { fecha: '2026-04-18', descripcion: 'VAINSA PERU F001-08411',    ref: 'TRF-088522',      cargo: 18400, abono: 0,     saldo: 2814337, matchId: null },
        { fecha: '2026-04-20', descripcion: 'COBRO BELCORP V08',         ref: 'DEP-661234',      cargo: 0,     abono: 56000, saldo: 2870337, matchId: null },
        { fecha: '2026-04-22', descripcion: 'COBRO LOGISTICA ANDINA',    ref: 'DEP-661301',      cargo: 0,     abono: 30000, saldo: 2900337, matchId: null },
        { fecha: '2026-04-22', descripcion: 'COMISION TRF INTERBANCARIA', ref: 'COM-TRF',         cargo: 8,     abono: 0,     saldo: 2840500, matchId: null },
      ],
    },
  ];

  // Flujo de caja real + proyectado (6 meses)
  const cashflowForecast = [
    { month: 'Abr \'26', value: 2100000, type: 'real' },
    { month: 'May \'26', value: 2400000, type: 'real' },
    { month: 'Jun \'26', value: 3200000, type: 'real' },
    { month: 'Jul \'26', value: 2800000, type: 'projected' },
    { month: 'Ago \'26', value: 3600000, type: 'projected' },
    { month: 'Set \'26', value: 4100000, type: 'projected' },
  ];

  // ═════════════════ SUNAT — CPEs emitidos + comunicaciones ═════════════════
  const EMISOR = {
    razonSocial: 'MM HIGH METRIK ENGINEERS S.A.C.',
    nombreComercial: 'MM HIGH METRIK ENGINEERS',
    ruc: '20610639764',
    direccion: 'Av. Republica de Colombia 625 Of. 501',
    distrito: 'San Isidro',
    provincia: 'Lima',
    departamento: 'Lima',
    ubigeo: '150131',
    email: 'mmhighmetrik@gmail.com',
    telefono: '(+51) 955 137 140',
    telefono2: '989010329',
    logoUrl: 'assets/logo.png',
  };

  // CPEs emitidos por MMHIGHMETRIK (lo que factura a clientes)
  const sunatEmitidos = [
    {
      id: 'SUN-001', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00362', docCompleto: 'F001-00362',
      fechaEmision: '2026-04-18', fechaEnvio: '2026-04-18T10:24:00', moneda: 'PEN',
      cliente: { razonSocial: 'Corporación Belcorp S.A.', tipoDoc: 'RUC', numDoc: '20100055237', direccion: 'Av. República de Panamá 3591, San Isidro' },
      items: [
        { cod: 'SERV-VAL', desc: 'Valorización V07 · Marzo 2026 · OB-2025-021 Oficinas San Isidro', und: 'ZZ', cant: 1, pUnit: 61016.95, valorVenta: 61016.95, igv: 10983.05, total: 72000, afectIGV: '10' },
      ],
      totales: { gravado: 61016.95, exonerado: 0, inafecto: 0, igv: 10983.05, total: 72000, detraccion: { pct: 4, monto: 2880 } },
      referencia: { tipo: 'OC', id: 'OC-2025-084' }, proyecto: 'OB-2025-021',
      estadoSunat: 'Aceptado', ticketSunat: '2026041810202418001', hashFirma: 'f7a9c3e1b842d6f0a5c8e3b9d1f7a2c4',
      leyendas: ['OPERACIÓN SUJETA A DETRACCIÓN SPOT'],
      importeEnLetras: 'SETENTA Y DOS MIL Y 00/100 SOLES',
      importadoHistorico: false,
    },
    {
      id: 'SUN-002', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00361', docCompleto: 'F001-00361',
      fechaEmision: '2026-04-12', fechaEnvio: '2026-04-12T15:42:00', moneda: 'PEN',
      cliente: { razonSocial: 'Logística Andina SAC', tipoDoc: 'RUC', numDoc: '20548877412', direccion: 'Parque Industrial Lurín Mz. C Lt. 14' },
      items: [
        { cod: 'SERV-VAL', desc: 'Valorización V05 · Marzo 2026 · OB-2025-018 Planta Lurín', und: 'ZZ', cant: 1, pUnit: 23728.81, valorVenta: 23728.81, igv: 4271.19, total: 28000, afectIGV: '10' },
      ],
      totales: { gravado: 23728.81, exonerado: 0, inafecto: 0, igv: 4271.19, total: 28000, detraccion: { pct: 4, monto: 1120 } },
      referencia: { tipo: 'CTR', id: 'CTR-2025-011' }, proyecto: 'OB-2025-018',
      estadoSunat: 'Aceptado', ticketSunat: '2026041215422118002', hashFirma: '8d2b4f6a0c1e3b5d7f9a2c4e6b8d0f2a',
      leyendas: ['OPERACIÓN SUJETA A DETRACCIÓN SPOT'],
      importeEnLetras: 'VEINTIOCHO MIL Y 00/100 SOLES',
    },
    {
      id: 'SUN-003', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00360', docCompleto: 'F001-00360',
      fechaEmision: '2026-04-08', fechaEnvio: '2026-04-08T11:18:00', moneda: 'PEN',
      cliente: { razonSocial: 'Grupo Retail Perú S.A.', tipoDoc: 'RUC', numDoc: '20566123841', direccion: 'Av. Lima 900, Mall del Sur' },
      items: [
        { cod: 'SERV-VAL', desc: 'Valorización V03 · Marzo 2026 · OB-2025-024 Local comercial Mall del Sur', und: 'ZZ', cant: 1, pUnit: 20338.98, valorVenta: 20338.98, igv: 3661.02, total: 24000, afectIGV: '10' },
      ],
      totales: { gravado: 20338.98, exonerado: 0, inafecto: 0, igv: 3661.02, total: 24000, detraccion: { pct: 4, monto: 960 } },
      proyecto: 'OB-2025-024',
      estadoSunat: 'Aceptado', ticketSunat: '2026040811182418003', hashFirma: '3c5e7a9b1d2f4c6e8a0b2d4f6c8e0a2b',
      leyendas: ['OPERACIÓN SUJETA A DETRACCIÓN SPOT'],
      importeEnLetras: 'VEINTICUATRO MIL Y 00/100 SOLES',
    },
    {
      id: 'SUN-004', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00359', docCompleto: 'F001-00359',
      fechaEmision: '2026-04-03', fechaEnvio: '2026-04-03T09:12:00', moneda: 'PEN',
      cliente: { razonSocial: 'Alicorp S.A.A.', tipoDoc: 'RUC', numDoc: '20100041953', direccion: 'Av. Argentina 4793, Callao' },
      items: [
        { cod: 'SERV-MNT', desc: 'Servicio de mantenimiento integral · Planta Ate · Marzo 2026', und: 'ZZ', cant: 1, pUnit: 10847.46, valorVenta: 10847.46, igv: 1952.54, total: 12800, afectIGV: '10' },
      ],
      totales: { gravado: 10847.46, exonerado: 0, inafecto: 0, igv: 1952.54, total: 12800, detraccion: { pct: 4, monto: 512 } },
      proyecto: 'OB-2025-012',
      estadoSunat: 'Aceptado', ticketSunat: '2026040309122418004', hashFirma: 'b1d3f5a7c9e0b2d4f6a8c0e2b4d6f8a0',
      importeEnLetras: 'DOCE MIL OCHOCIENTOS Y 00/100 SOLES',
    },
    {
      id: 'SUN-005', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00358', docCompleto: 'F001-00358',
      fechaEmision: '2026-03-29', fechaEnvio: '2026-03-29T17:55:00', moneda: 'PEN',
      cliente: { razonSocial: 'Corporación Belcorp S.A.', tipoDoc: 'RUC', numDoc: '20100055237', direccion: 'Av. República de Panamá 3591, San Isidro' },
      items: [
        { cod: 'SERV-VAL', desc: 'Valorización V06 · Febrero 2026 · OB-2025-021', und: 'ZZ', cant: 1, pUnit: 54237.29, valorVenta: 54237.29, igv: 9762.71, total: 64000, afectIGV: '10' },
      ],
      totales: { gravado: 54237.29, exonerado: 0, inafecto: 0, igv: 9762.71, total: 64000, detraccion: { pct: 4, monto: 2560 } },
      proyecto: 'OB-2025-021',
      estadoSunat: 'Aceptado', ticketSunat: '2026032917552418005', hashFirma: '9e1c3b5d7f0a2c4e6b8d0f2a4c6e8b0d',
      leyendas: ['OPERACIÓN SUJETA A DETRACCIÓN SPOT'],
      importeEnLetras: 'SESENTA Y CUATRO MIL Y 00/100 SOLES',
    },
    {
      id: 'SUN-006', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00357', docCompleto: 'F001-00357',
      fechaEmision: '2026-03-22', fechaEnvio: '2026-03-22T08:40:00', moneda: 'PEN',
      cliente: { razonSocial: 'Sanna Clínica SAC', tipoDoc: 'RUC', numDoc: '20516345823', direccion: 'Av. El Polo 789, Surco' },
      items: [
        { cod: 'SERV-ADL', desc: 'Adelanto directo 15% · Proyecto laboratorio clínico Sanna', und: 'ZZ', cant: 1, pUnit: 77796.61, valorVenta: 77796.61, igv: 14003.39, total: 91800, afectIGV: '10' },
      ],
      totales: { gravado: 77796.61, exonerado: 0, inafecto: 0, igv: 14003.39, total: 91800 },
      estadoSunat: 'Aceptado', ticketSunat: '2026032208402418006', hashFirma: '2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b',
      importeEnLetras: 'NOVENTA Y UN MIL OCHOCIENTOS Y 00/100 SOLES',
    },
    {
      id: 'SUN-007', tipoDoc: '07', tipoNombre: 'Nota de Crédito', serie: 'FC01', correlativo: '00012', docCompleto: 'FC01-00012',
      fechaEmision: '2026-03-15', fechaEnvio: '2026-03-15T14:20:00', moneda: 'PEN',
      cliente: { razonSocial: 'Interbank', tipoDoc: 'RUC', numDoc: '20100053455', direccion: 'Av. Javier Prado Este 567, San Isidro' },
      items: [
        { cod: 'NC-ANULA', desc: 'Anulación parcial · Factura F001-00342 · sobrepago valorización febrero', und: 'ZZ', cant: 1, pUnit: 4237.29, valorVenta: 4237.29, igv: 762.71, total: 5000, afectIGV: '10' },
      ],
      totales: { gravado: 4237.29, exonerado: 0, inafecto: 0, igv: 762.71, total: 5000 },
      docRelacionado: 'F001-00342', motivoNC: 'Anulación de la operación',
      estadoSunat: 'Aceptado', ticketSunat: '2026031514202418007', hashFirma: '5b7d9f1c3e5a7b9d1f3c5e7a9b1d3f5c',
      importeEnLetras: 'CINCO MIL Y 00/100 SOLES',
    },
    {
      id: 'SUN-008', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00356', docCompleto: 'F001-00356',
      fechaEmision: '2026-03-10', fechaEnvio: '2026-03-10T16:08:00', moneda: 'PEN',
      cliente: { razonSocial: 'Ransa Comercial S.A.', tipoDoc: 'RUC', numDoc: '20100039207', direccion: 'Av. Argentina 2085, Callao' },
      items: [
        { cod: 'SERV-MJR', desc: 'Ingeniería adecuación almacén central · Fase 1', und: 'ZZ', cant: 1, pUnit: 38135.59, valorVenta: 38135.59, igv: 6864.41, total: 45000, afectIGV: '10' },
      ],
      totales: { gravado: 38135.59, exonerado: 0, inafecto: 0, igv: 6864.41, total: 45000, detraccion: { pct: 4, monto: 1800 } },
      estadoSunat: 'Observado', ticketSunat: '2026031016082418008', hashFirma: '8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f',
      obsMsg: 'Observación 2335: descripción de ítem excede 250 caracteres',
      leyendas: ['OPERACIÓN SUJETA A DETRACCIÓN SPOT'],
      importeEnLetras: 'CUARENTA Y CINCO MIL Y 00/100 SOLES',
    },
    {
      id: 'SUN-009', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00355', docCompleto: 'F001-00355',
      fechaEmision: '2026-03-05', fechaEnvio: '2026-03-05T10:30:00', moneda: 'PEN',
      cliente: { razonSocial: 'Backus y Johnston SAA', tipoDoc: 'RUC', numDoc: '20100113610', direccion: 'Av. Nicolás Ayllón 3986, Ate' },
      items: [
        { cod: 'SERV-CMO', desc: 'Servicio consultoría centro médico ocupacional · fase preliminar', und: 'ZZ', cant: 1, pUnit: 22033.90, valorVenta: 22033.90, igv: 3966.10, total: 26000, afectIGV: '10' },
      ],
      totales: { gravado: 22033.90, exonerado: 0, inafecto: 0, igv: 3966.10, total: 26000 },
      estadoSunat: 'Aceptado', ticketSunat: '2026030510302418009', hashFirma: '1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e',
      importeEnLetras: 'VEINTISÉIS MIL Y 00/100 SOLES',
    },
    {
      id: 'SUN-010', tipoDoc: 'R1', tipoNombre: 'Recibo por Honorarios', serie: 'E001', correlativo: '00128', docCompleto: 'E001-00128',
      fechaEmision: '2026-03-02', fechaEnvio: '2026-03-02T09:15:00', moneda: 'PEN',
      cliente: { razonSocial: 'MMHIGHMETRIK ENGINEERS S.A.C. (interno - Ing. consultor Mario García)', tipoDoc: 'RUC', numDoc: '20548877419', direccion: 'Oficina San Isidro' },
      items: [
        { cod: 'HONOR', desc: 'Honorarios profesionales · supervisión técnica enero-febrero 2026', und: 'ZZ', cant: 1, pUnit: 8500, valorVenta: 8500, igv: 0, total: 8500, afectIGV: '20' },
      ],
      totales: { gravado: 0, exonerado: 0, inafecto: 8500, igv: 0, total: 8500, retencion: { pct: 8, monto: 680 } },
      estadoSunat: 'Aceptado', ticketSunat: '2026030209152418010', hashFirma: '4c6e8a0b2d4f6c8e0a2b4d6f8c0e2a4b',
      leyendas: ['SERVICIO SUJETO A RETENCIÓN 4TA CATEGORÍA · 8%'],
      importeEnLetras: 'OCHO MIL QUINIENTOS Y 00/100 SOLES',
    },
    {
      id: 'SUN-011', tipoDoc: '03', tipoNombre: 'Boleta de Venta', serie: 'B001', correlativo: '00048', docCompleto: 'B001-00048',
      fechaEmision: '2026-02-28', fechaEnvio: '2026-02-28T17:40:00', moneda: 'PEN',
      cliente: { razonSocial: 'Junta de Propietarios Edif. Orrantia', tipoDoc: 'DNI', numDoc: '08472315', direccion: 'Calle Enrique Palacios 1120, Miraflores' },
      items: [
        { cod: 'SERV-MJR', desc: 'Mejoramiento áreas comunes · avance 30% marzo', und: 'ZZ', cant: 1, pUnit: 17389.83, valorVenta: 17389.83, igv: 3130.17, total: 20520, afectIGV: '10' },
      ],
      totales: { gravado: 17389.83, exonerado: 0, inafecto: 0, igv: 3130.17, total: 20520 },
      estadoSunat: 'Rechazado', ticketSunat: '2026022817402418011', hashFirma: '7d9f1b3c5e7a9f1b3d5c7e9a1b3d5f7c',
      obsMsg: 'Error 2017: DNI inválido en el comprobante',
      importeEnLetras: 'VEINTE MIL QUINIENTOS VEINTE Y 00/100 SOLES',
    },
    {
      id: 'SUN-012', tipoDoc: '01', tipoNombre: 'Factura', serie: 'F001', correlativo: '00354', docCompleto: 'F001-00354',
      fechaEmision: '2026-04-22', fechaEnvio: '2026-04-22T08:05:00', moneda: 'PEN',
      cliente: { razonSocial: 'MTC Perú - Provías Nacional', tipoDoc: 'RUC', numDoc: '20131379449', direccion: 'Jr. Zorritos 1203, Lima' },
      items: [
        { cod: 'SERV-VAL', desc: 'Valorización parcial obra Carretera Ruta 5 · progreso abril', und: 'ZZ', cant: 1, pUnit: 576271.19, valorVenta: 576271.19, igv: 103728.81, total: 680000, afectIGV: '10' },
      ],
      totales: { gravado: 576271.19, exonerado: 0, inafecto: 0, igv: 103728.81, total: 680000, detraccion: { pct: 4, monto: 27200 } },
      estadoSunat: 'Pendiente',
      leyendas: ['OPERACIÓN SUJETA A DETRACCIÓN SPOT'],
      importeEnLetras: 'SEISCIENTOS OCHENTA MIL Y 00/100 SOLES',
    },
  ];

  // Log de comunicaciones SUNAT
  const sunatComunicaciones = [
    { id: 'LOG-001', cpeId: 'SUN-012', fecha: '2026-04-22T08:05:12', accion: 'ENVIO',     codigo: '—',       mensaje: 'CPE enviado a SUNAT · ticket 2026042208052418012',     nivel: 'info' },
    { id: 'LOG-002', cpeId: 'SUN-001', fecha: '2026-04-18T10:24:18', accion: 'ENVIO',     codigo: '—',       mensaje: 'F001-00362 enviado correctamente',                    nivel: 'info' },
    { id: 'LOG-003', cpeId: 'SUN-001', fecha: '2026-04-18T10:25:02', accion: 'RESPUESTA', codigo: '0',       mensaje: 'Comprobante aceptado',                                 nivel: 'info' },
    { id: 'LOG-004', cpeId: 'SUN-011', fecha: '2026-02-28T17:40:33', accion: 'RESPUESTA', codigo: '2017',    mensaje: 'DNI inválido en el comprobante',                       nivel: 'error' },
    { id: 'LOG-005', cpeId: 'SUN-008', fecha: '2026-03-10T16:09:14', accion: 'RESPUESTA', codigo: '2335',    mensaje: 'Descripción de ítem excede 250 caracteres · observación', nivel: 'warn' },
    { id: 'LOG-006', cpeId: 'SUN-002', fecha: '2026-04-12T15:42:38', accion: 'RESPUESTA', codigo: '0',       mensaje: 'Comprobante aceptado',                                 nivel: 'info' },
    { id: 'LOG-007', cpeId: 'SUN-007', fecha: '2026-03-15T14:20:44', accion: 'ENVIO',     codigo: '—',       mensaje: 'Nota de crédito FC01-00012 enviada',                   nivel: 'info' },
    { id: 'LOG-008', cpeId: 'SUN-007', fecha: '2026-03-15T14:21:22', accion: 'RESPUESTA', codigo: '0',       mensaje: 'NC vinculada a F001-00342 aceptada',                   nivel: 'info' },
    { id: 'LOG-009', cpeId: null,      fecha: '2026-04-01T02:00:00', accion: 'CRON',      codigo: 'OSE',     mensaje: 'Reenvío automático de CPEs pendientes · 0 procesados', nivel: 'info' },
    { id: 'LOG-010', cpeId: null,      fecha: '2026-03-31T23:55:00', accion: 'REPORTE',   codigo: 'PLE-ELE', mensaje: 'Libro electrónico de ventas enviado (marzo 2026)',    nivel: 'info' },
  ];

  return { projects, partidas, bids, gantt, cashflow, sunatConciliaciones, sunatEmitidos, sunatComunicaciones, docsTree, versions, cuentasBancariasBalances, gastosOficina, valorizacionesPipeline, garantias, cashflowForecast, cotizaciones, inventarioItems, inventarioUbicaciones, inventarioPersonal, inventarioMovimientos, inventarioMantenimientos, DEPRECIACION_CATEGORIA, planContable, asientosContables, cartolasBancarias, BANK_TO_PCGE, EMISOR, fmtPEN, fmtInt, fmtPct, fmtCompact };
})();
