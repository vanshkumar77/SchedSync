// ============================================================
// SchedSync — App Entry Point (Renderer)
// ============================================================
// Initializes all modules, wires up DOM event listeners,
// and coordinates the application flow.
// ============================================================

const App = (function () {
  'use strict';

  // ---- DOM References ----
  const processForm = document.getElementById('process-form');
  const pidInput = document.getElementById('pid-input');
  const arrivalInput = document.getElementById('arrival-input');
  const burstInput = document.getElementById('burst-input');
  const pagesInput = document.getElementById('pages-input');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const cpuAlgorithmSelect = document.getElementById('cpu-algorithm-select');
  const quantumGroup = document.getElementById('quantum-group');
  const quantumInput = document.getElementById('quantum-input');
  const footerVersion = document.getElementById('footer-version');

  // ---- Toast Notification System ----
  let toastTimeout = null;

  /**
   * Shows a brief toast notification at the top of the visualization area.
   * @param {string} message - The message to display
   * @param {'success'|'error'|'info'} type - Toast type
   * @param {number} duration - How long to show (ms)
   */
  function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();
    if (toastTimeout) clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Insert at the top of the visualization area
    const vizArea = document.getElementById('visualization-area');
    if (vizArea) {
      vizArea.insertBefore(toast, vizArea.firstChild);
    } else {
      document.body.appendChild(toast);
    }

    // Trigger entry animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    // Auto-dismiss
    toastTimeout = setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      // Fallback removal if transition doesn't fire
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, duration);
  }

  /**
   * Resets the process form and focuses the PID field.
   */
  function resetForm() {
    processForm.reset();
    // Set next suggested PID
    pidInput.value = ProcessManager.getNextPid();
    pidInput.focus();
  }

  /**
   * Handles form submission — validates and adds a process.
   * @param {Event} e
   */
  function handleAddProcess(e) {
    e.preventDefault();

    const result = ProcessManager.validate(
      pidInput.value,
      arrivalInput.value,
      burstInput.value,
      pagesInput.value,
      document.getElementById('priority-input').value
    );

    if (!result.valid) {
      showToast(result.error, 'error');
      return;
    }

    const process = ProcessManager.addProcess(result.data);
    showToast(`Process ${process.pid} added successfully.`, 'success', 2000);
    resetForm();
  }

  /**
   * Handles "Clear All" button click.
   */
  function handleClearAll() {
    if (ProcessManager.getCount() === 0) {
      showToast('No processes to clear.', 'info', 2000);
      return;
    }
    ProcessManager.clearAll();
    showToast('All processes cleared.', 'info', 2000);
    resetForm();
  }

  /**
   * Shows/hides the time quantum input based on the selected CPU algorithm.
   */
  function handleAlgorithmChange() {
    const algo = cpuAlgorithmSelect.value;
    const priorityGroup = document.getElementById('priority-group');

    // Show/hide time quantum
    if (algo === 'rr') {
      quantumGroup.style.display = '';
      quantumGroup.classList.add('visible');
    } else {
      quantumGroup.classList.remove('visible');
      quantumGroup.style.display = 'none';
    }

    // Show/hide priority input
    if (algo === 'priority') {
      priorityGroup.style.display = '';
    } else {
      priorityGroup.style.display = 'none';
    }
  }

  /**
   * Returns the current simulation configuration.
   * @returns {object}
   */
  function getConfig() {
    return {
      cpuAlgorithm: cpuAlgorithmSelect.value,
      pagingAlgorithm: document.getElementById('paging-algorithm-select').value,
      timeQuantum: parseInt(quantumInput.value, 10) || 2,
      memoryFrames: parseInt(document.getElementById('frames-input').value, 10) || 3,
      pageFaultStall: parseInt(document.getElementById('stall-input').value, 10) || 1
    };
  }

  /**
   * Sets up the version display in the footer.
   */
  function initFooter() {
    if (footerVersion && window.schedSync) {
      footerVersion.textContent = `v${window.schedSync.getVersion()}`;
    }
  }

  // ============================================================
  // Initialization
  // ============================================================

  function init() {
    // Set initial PID suggestion
    pidInput.value = ProcessManager.getNextPid();

    // Wire up form submission
    processForm.addEventListener('submit', handleAddProcess);

    // Wire up Clear All
    clearAllBtn.addEventListener('click', handleClearAll);

    // Wire up algorithm change (show/hide quantum)
    cpuAlgorithmSelect.addEventListener('change', handleAlgorithmChange);
    handleAlgorithmChange(); // Set initial state

    // Initialize footer version
    initFooter();

    // Initialize empty state
    ProcessManager.updateEmptyState();

    console.log('[SchedSync] App initialized.');
  }

  // ---- Run on DOM ready ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Public API ----
  return {
    showToast,
    getConfig,
    init
  };
})();
