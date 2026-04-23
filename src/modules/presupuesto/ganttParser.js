/* global window */
// ═══════════════════════════════════════════════════════════════
// Parser de Microsoft Project XML (también exportado por MPXJ / Aspose)
// Schema: http://schemas.microsoft.com/project
// ═══════════════════════════════════════════════════════════════

(function () {
  // Duración ISO 8601 (PT952H0M0S) → horas decimal
  function parseDurationISO(str) {
    if (!str) return 0;
    const m = str.match(/^P?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i);
    if (!m) return 0;
    const h = parseFloat(m[1] || '0');
    const min = parseFloat(m[2] || '0');
    const s = parseFloat(m[3] || '0');
    return h + (min / 60) + (s / 3600);
  }

  // Slack en minutos del XML → días (MS Project usa 480 min/día laboral)
  function slackToDays(minutes, minutesPerDay = 480) {
    const n = parseFloat(minutes) || 0;
    return Math.round((n / minutesPerDay) * 10) / 10;
  }

  // Tipo de link MS Project
  const LINK_TYPES = {
    '0': 'FF', // Finish to Finish
    '1': 'FS', // Finish to Start (default)
    '2': 'SS', // Start to Start
    '3': 'SF', // Start to Finish
  };

  function childText(el, tag) {
    if (!el) return null;
    for (const c of Array.from(el.children)) {
      if (c.tagName === tag || c.localName === tag) return c.textContent;
    }
    return null;
  }

  function childrenByTag(el, tag) {
    if (!el) return [];
    return Array.from(el.children).filter(c => c.tagName === tag || c.localName === tag);
  }

  function parseTask(taskEl) {
    const predecessors = childrenByTag(taskEl, 'PredecessorLink').map(pl => ({
      uid: parseInt(childText(pl, 'PredecessorUID') || '0', 10),
      type: LINK_TYPES[childText(pl, 'Type') || '1'] || 'FS',
      lagMinutes: parseFloat(childText(pl, 'LinkLag') || '0'),
    }));

    const extAttrs = {};
    childrenByTag(taskEl, 'ExtendedAttribute').forEach(ea => {
      const id = childText(ea, 'FieldID');
      const val = childText(ea, 'Value');
      if (id && val) extAttrs[id] = val;
    });

    return {
      uid: parseInt(childText(taskEl, 'UID') || '0', 10),
      id: parseInt(childText(taskEl, 'ID') || '0', 10),
      guid: childText(taskEl, 'GUID'),
      name: childText(taskEl, 'Name') || '',
      wbs: childText(taskEl, 'WBS') || '',
      outlineNumber: childText(taskEl, 'OutlineNumber') || '',
      outlineLevel: parseInt(childText(taskEl, 'OutlineLevel') || '0', 10),
      start: new Date(childText(taskEl, 'Start') || 0),
      finish: new Date(childText(taskEl, 'Finish') || 0),
      durationHours: parseDurationISO(childText(taskEl, 'Duration')),
      durationLabel: extAttrs['188743734'] || null, // "120 días" si está
      percentComplete: parseInt(childText(taskEl, 'PercentComplete') || '0', 10),
      critical: childText(taskEl, 'Critical') === '1',
      milestone: childText(taskEl, 'Milestone') === '1',
      summary: childText(taskEl, 'Summary') === '1',
      earlyStart: new Date(childText(taskEl, 'EarlyStart') || 0),
      earlyFinish: new Date(childText(taskEl, 'EarlyFinish') || 0),
      lateStart: new Date(childText(taskEl, 'LateStart') || 0),
      lateFinish: new Date(childText(taskEl, 'LateFinish') || 0),
      totalSlackDays: slackToDays(childText(taskEl, 'TotalSlack')),
      freeSlackDays: slackToDays(childText(taskEl, 'FreeSlack')),
      cost: parseFloat(childText(taskEl, 'Cost') || '0'),
      remainingCost: parseFloat(childText(taskEl, 'RemainingCost') || '0'),
      actualCost: parseFloat(childText(taskEl, 'ActualCost') || '0'),
      predecessors,
      active: childText(taskEl, 'Active') !== '0',
      hideBar: childText(taskEl, 'HideBar') === '1',
      rollup: childText(taskEl, 'Rollup') === '1',
      constraintType: parseInt(childText(taskEl, 'ConstraintType') || '0', 10),
    };
  }

  function parseResource(resEl) {
    return {
      uid: parseInt(childText(resEl, 'UID') || '0', 10),
      id: parseInt(childText(resEl, 'ID') || '0', 10),
      name: childText(resEl, 'Name') || '',
      type: parseInt(childText(resEl, 'Type') || '1', 10), // 1=Work, 0=Material, 2=Cost
      initials: childText(resEl, 'Initials') || '',
    };
  }

  function parseAssignment(asgEl) {
    return {
      taskUID: parseInt(childText(asgEl, 'TaskUID') || '0', 10),
      resourceUID: parseInt(childText(asgEl, 'ResourceUID') || '-1', 10),
      units: parseFloat(childText(asgEl, 'Units') || '1'),
      work: parseDurationISO(childText(asgEl, 'Work')),
      cost: parseFloat(childText(asgEl, 'Cost') || '0'),
    };
  }

  function parseMSProjectXML(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');

    const parseError = doc.getElementsByTagName('parsererror')[0];
    if (parseError) throw new Error('XML inválido: ' + parseError.textContent.slice(0, 200));

    // MS Project usa xmlns default. documentElement es <Project> directamente.
    const rootProject = doc.documentElement;
    if (!rootProject || (rootProject.tagName !== 'Project' && rootProject.localName !== 'Project')) {
      throw new Error('No se encontró <Project> raíz. ¿Es XML de MS Project?');
    }

    const minutesPerDay = parseInt(childText(rootProject, 'MinutesPerDay') || '480', 10);

    // Tasks — usar childrenByTag (namespace-safe) en vez de querySelector
    const tasksEl = childrenByTag(rootProject, 'Tasks')[0];
    const tasks = tasksEl ? childrenByTag(tasksEl, 'Task').map(parseTask) : [];

    // Resources
    const resEl = childrenByTag(rootProject, 'Resources')[0];
    const resources = resEl ? childrenByTag(resEl, 'Resource').map(parseResource) : [];

    // Assignments
    const asgEl = childrenByTag(rootProject, 'Assignments')[0];
    const assignments = asgEl ? childrenByTag(asgEl, 'Assignment').map(parseAssignment) : [];

    // Agrupar asignaciones por tarea
    const resourcesByTask = {};
    assignments.forEach(a => {
      if (a.resourceUID >= 0) {
        if (!resourcesByTask[a.taskUID]) resourcesByTask[a.taskUID] = [];
        resourcesByTask[a.taskUID].push(a.resourceUID);
      }
    });
    tasks.forEach(t => { t.resourceUIDs = resourcesByTask[t.uid] || []; });

    const project = {
      name: childText(rootProject, 'Name') || 'Sin nombre',
      title: childText(rootProject, 'Title') || '',
      author: childText(rootProject, 'Author') || '',
      startDate: new Date(childText(rootProject, 'StartDate') || 0),
      finishDate: new Date(childText(rootProject, 'FinishDate') || 0),
      currentDate: new Date(childText(rootProject, 'CurrentDate') || Date.now()),
      creationDate: new Date(childText(rootProject, 'CreationDate') || Date.now()),
      lastSaved: new Date(childText(rootProject, 'LastSaved') || Date.now()),
      currency: childText(rootProject, 'CurrencyCode') || 'PEN',
      currencySymbol: childText(rootProject, 'CurrencySymbol') || 'S/',
      minutesPerDay,
    };

    return { project, tasks, resources, assignments };
  }

  window.GanttParser = {
    parseMSProjectXML,
    parseDurationISO,
    slackToDays,
    LINK_TYPES,
  };
})();
