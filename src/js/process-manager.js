// ============================================================
// SchedSync — Process Manager
// ============================================================
// Handles adding, removing, validating, and rendering
// processes in the input panel. This is the single source
// of truth for the process list.
// ============================================================

const ProcessManager = (function () {
  'use strict';

  // ---- Internal State ----
  let processes = [];
  let nextAutoId = 1;

  // ---- Process Color Mapping ----
  const PROCESS_COLORS = [
    'var(--process-color-1)',
    'var(--process-color-2)',
    'var(--process-color-3)',
    'var(--process-color-4)',
    'var(--process-color-5)',
    'var(--process-color-6)',
    'var(--process-color-7)',
    'var(--process-color-8)'
  ];

  /**
   * Returns a color for a process based on its index.
   * @param {number} index
   * @returns {string} CSS color variable
   */
  function getProcessColor(index) {
    return PROCESS_COLORS[index % PROCESS_COLORS.length];
  }

  /**
   * Parses a page reference string into an array of integers.
   * Accepts comma-separated or space-separated numbers.
   * Returns an empty array if input is empty or invalid.
   *
   * @param {string} raw - e.g. "1,2,3,1,4" or "1 2 3 1 4"
   * @returns {number[]}
   */
  function parsePageReferences(raw) {
    if (!raw || raw.trim() === '') return [];

    // Split by comma, space, or both
    const parts = raw.trim().split(/[\s,]+/);
    const pages = [];

    for (const part of parts) {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0) {
        return null; // Signal invalid input
      }
      pages.push(num);
    }

    return pages;
  }

  /**
   * Validates all inputs for a new process.
   * Returns { valid: true, data: {...} } or { valid: false, error: '...' }
   *
   * @param {string} pid       - Process ID (e.g. "P1")
   * @param {string} arrivalRaw - Arrival time as string
   * @param {string} burstRaw   - Burst time as string
   * @param {string} pagesRaw   - Page references as string
   * @param {string} priorityRaw - Priority as string (lower = higher priority)
   * @returns {{ valid: boolean, data?: object, error?: string }}
   */
  function validate(pid, arrivalRaw, burstRaw, pagesRaw, priorityRaw) {
    // ---- PID Validation ----
    pid = (pid || '').trim();
    if (!pid) {
      return { valid: false, error: 'Process ID is required.' };
    }
    if (pid.length > 10) {
      return { valid: false, error: 'Process ID must be 10 characters or fewer.' };
    }
    // Check for duplicate PID
    if (processes.some(p => p.pid.toUpperCase() === pid.toUpperCase())) {
      return { valid: false, error: `Process "${pid}" already exists.` };
    }

    // ---- Arrival Time Validation ----
    const arrival = parseInt(arrivalRaw, 10);
    if (isNaN(arrival) || arrival < 0) {
      return { valid: false, error: 'Arrival time must be a non-negative integer.' };
    }
    if (arrival > 1000) {
      return { valid: false, error: 'Arrival time must be ≤ 1000.' };
    }

    // ---- Burst Time Validation ----
    const burst = parseInt(burstRaw, 10);
    if (isNaN(burst) || burst < 1) {
      return { valid: false, error: 'Burst time must be a positive integer (≥ 1).' };
    }
    if (burst > 100) {
      return { valid: false, error: 'Burst time must be ≤ 100.' };
    }

    // ---- Page References Validation ----
    const pages = parsePageReferences(pagesRaw);
    if (pages === null) {
      return { valid: false, error: 'Page references must be non-negative integers separated by commas or spaces.' };
    }
    if (pages.length > 50) {
      return { valid: false, error: 'Page reference string must contain ≤ 50 entries.' };
    }

    // ---- Priority Validation ----
    const priority = parseInt(priorityRaw, 10);
    const validPriority = (!isNaN(priority) && priority >= 0 && priority <= 100) ? priority : 0;

    return {
      valid: true,
      data: {
        pid: pid,
        arrivalTime: arrival,
        burstTime: burst,
        pageReferences: pages,
        priority: validPriority,
        colorIndex: processes.length
      }
    };
  }

  /**
   * Adds a validated process to the list.
   * @param {object} processData - Validated process data
   * @returns {object} The added process object
   */
  function addProcess(processData) {
    const process = {
      pid: processData.pid,
      arrivalTime: processData.arrivalTime,
      burstTime: processData.burstTime,
      pageReferences: processData.pageReferences,
      priority: processData.priority !== undefined ? processData.priority : 0,
      colorIndex: processData.colorIndex
    };
    processes.push(process);
    nextAutoId++;
    renderTable();
    updateEmptyState();
    return process;
  }

  /**
   * Removes a process by PID.
   * @param {string} pid
   */
  function removeProcess(pid) {
    processes = processes.filter(p => p.pid !== pid);
    // Reassign color indices after removal
    processes.forEach((p, i) => { p.colorIndex = i; });
    renderTable();
    updateEmptyState();
  }

  /**
   * Returns a deep copy of the current processes array.
   * @returns {object[]}
   */
  function getProcesses() {
    return JSON.parse(JSON.stringify(processes));
  }

  /**
   * Returns the count of current processes.
   * @returns {number}
   */
  function getCount() {
    return processes.length;
  }

  /**
   * Clears all processes.
   */
  function clearAll() {
    processes = [];
    nextAutoId = 1;
    renderTable();
    updateEmptyState();
  }

  /**
   * Returns the next suggested auto-generated PID.
   * @returns {string} e.g. "P1", "P2", ...
   */
  function getNextPid() {
    let candidate = `P${nextAutoId}`;
    while (processes.some(p => p.pid.toUpperCase() === candidate.toUpperCase())) {
      nextAutoId++;
      candidate = `P${nextAutoId}`;
    }
    return candidate;
  }

  // ============================================================
  // DOM Rendering
  // ============================================================

  /**
   * Renders the process table body.
   */
  function renderTable() {
    const tbody = document.getElementById('process-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    processes.forEach((proc) => {
      const tr = document.createElement('tr');
      const color = getProcessColor(proc.colorIndex);

      // PID cell with color dot
      const tdPid = document.createElement('td');
      tdPid.innerHTML = `<span class="process-color-dot" style="background-color: ${color};"></span>${escapeHtml(proc.pid)}`;
      tr.appendChild(tdPid);

      // Arrival Time
      const tdAT = document.createElement('td');
      tdAT.textContent = proc.arrivalTime;
      tr.appendChild(tdAT);

      // Burst Time
      const tdBT = document.createElement('td');
      tdBT.textContent = proc.burstTime;
      tr.appendChild(tdBT);

      // Priority
      const tdPri = document.createElement('td');
      tdPri.textContent = proc.priority !== undefined ? proc.priority : '—';
      tr.appendChild(tdPri);

      // Page References
      const tdPages = document.createElement('td');
      tdPages.textContent = proc.pageReferences.length > 0
        ? proc.pageReferences.join(', ')
        : '—';
      tdPages.title = proc.pageReferences.join(', ');
      tr.appendChild(tdPages);

      // Delete button
      const tdAction = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.title = `Remove ${proc.pid}`;
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('click', () => {
        removeProcess(proc.pid);
      });
      tdAction.appendChild(deleteBtn);
      tr.appendChild(tdAction);

      tbody.appendChild(tr);
    });
  }

  /**
   * Shows/hides the empty state message.
   */
  function updateEmptyState() {
    const emptyState = document.getElementById('empty-state');
    const table = document.getElementById('process-table');
    if (!emptyState || !table) return;

    if (processes.length === 0) {
      emptyState.style.display = 'block';
      table.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      table.style.display = 'table';
    }
  }

  /**
   * Escapes HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ---- Public API ----
  return {
    validate,
    addProcess,
    removeProcess,
    getProcesses,
    getCount,
    clearAll,
    getNextPid,
    getProcessColor,
    renderTable,
    updateEmptyState
  };
})();
