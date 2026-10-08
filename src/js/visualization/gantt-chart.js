// ============================================================
// SchedSync — Gantt Chart Visualization
// ============================================================
// Renders an incremental horizontal Gantt chart showing
// which process runs at each time unit, with color-coded
// blocks and a timeline axis.
// ============================================================

const GanttChart = (function () {
  'use strict';

  const container = document.getElementById('gantt-chart');
  const timeline = document.getElementById('gantt-timeline');
  let lastPid = null;
  let currentBlock = null;

  /**
   * Resets the Gantt chart.
   */
  function reset() {
    if (container) container.innerHTML = '';
    if (timeline) timeline.innerHTML = '';
    lastPid = null;
    currentBlock = null;
  }

  /**
   * Gets the CSS color for a process.
   * @param {string|null} pid
   * @returns {string}
   */
  function getColor(pid) {
    if (!pid) return 'var(--process-idle)';
    const processes = ProcessManager.getProcesses();
    const idx = processes.findIndex(p => p.pid === pid);
    return ProcessManager.getProcessColor(idx >= 0 ? idx : 0);
  }

  /**
   * Adds a tick to the Gantt chart.
   * Merges consecutive ticks of the same process into one block.
   *
   * @param {object} tickData - { time, runningProcess, isStalled }
   */
  function addTick(tickData) {
    if (!container || !timeline) return;

    const pid = tickData.isStalled ? tickData.runningProcess : tickData.runningProcess;
    const label = pid || 'idle';
    const isIdle = !pid;
    const isStalled = tickData.isStalled;

    // If same process as last tick (and same stall state), extend the current block
    if (pid === lastPid && currentBlock && ((isStalled && currentBlock.dataset.stalled === 'true') || (!isStalled && currentBlock.dataset.stalled !== 'true'))) {
      const span = parseInt(currentBlock.dataset.span, 10) + 1;
      currentBlock.dataset.span = span;
      currentBlock.style.flex = `${span}`;
      // Update the label to show the span
      const labelEl = currentBlock.querySelector('.gantt-label');
      if (labelEl) labelEl.textContent = label;
    } else {
      // Create a new block
      const block = document.createElement('div');
      block.className = 'gantt-block';
      if (isIdle) block.classList.add('gantt-idle');
      if (isStalled) block.classList.add('gantt-stalled');
      block.dataset.pid = pid || '';
      block.dataset.span = '1';
      block.dataset.stalled = isStalled ? 'true' : 'false';
      block.style.flex = '1';
      block.style.backgroundColor = isIdle ? '' : getColor(pid);

      const labelEl = document.createElement('span');
      labelEl.className = 'gantt-label';
      labelEl.textContent = isStalled ? `${label}⏳` : label;
      block.appendChild(labelEl);

      // Tooltip
      block.title = isStalled
        ? `Time ${tickData.time}: ${label} (stalled — page fault)`
        : `Time ${tickData.time}: ${label}`;

      // Entry animation
      block.style.animation = 'ganttSlideIn 0.3s ease forwards';

      container.appendChild(block);
      currentBlock = block;
    }

    lastPid = pid;

    // Add timeline tick mark
    const tick = document.createElement('span');
    tick.className = 'gantt-tick';
    tick.textContent = tickData.time;
    timeline.appendChild(tick);

    // Auto-scroll to the right
    const wrapper = container.parentElement;
    if (wrapper) {
      wrapper.scrollLeft = wrapper.scrollWidth;
    }
  }

  return { addTick, reset };
})();
