// ============================================================
// SchedSync — Ready Queue Visualization
// ============================================================
// Displays the current ready queue as animated blocks flowing
// toward the CPU, with color-coded process identifiers.
// ============================================================

const ReadyQueueViz = (function () {
  'use strict';

  const queueContainer = document.getElementById('ready-queue');

  /**
   * Resets the ready queue display.
   */
  function reset() {
    if (queueContainer) queueContainer.innerHTML = '';
  }

  /**
   * Gets the CSS color for a process.
   * @param {string} pid
   * @returns {string}
   */
  function getColor(pid) {
    const processes = ProcessManager.getProcesses();
    const idx = processes.findIndex(p => p.pid === pid);
    return ProcessManager.getProcessColor(idx >= 0 ? idx : 0);
  }

  /**
   * Updates the ready queue display.
   * @param {string[]} queue - Array of PIDs in the ready queue
   * @param {string|null} runningProcess - Currently running process PID
   */
  function update(queue, runningProcess) {
    if (!queueContainer) return;

    queueContainer.innerHTML = '';

    // Show the running process first (highlighted)
    if (runningProcess) {
      const cpuBlock = document.createElement('div');
      cpuBlock.className = 'queue-item queue-running';
      cpuBlock.style.borderColor = getColor(runningProcess);
      cpuBlock.style.backgroundColor = getColor(runningProcess);

      const label = document.createElement('span');
      label.className = 'queue-item-label';
      label.textContent = runningProcess;
      cpuBlock.appendChild(label);

      const badge = document.createElement('span');
      badge.className = 'queue-cpu-badge';
      badge.textContent = 'CPU';
      cpuBlock.appendChild(badge);

      queueContainer.appendChild(cpuBlock);
    }

    // Show separator arrow if both running and waiting exist
    if (runningProcess && queue.length > 0) {
      const arrow = document.createElement('div');
      arrow.className = 'queue-separator';
      arrow.textContent = '←';
      queueContainer.appendChild(arrow);
    }

    // Show waiting processes
    queue.forEach((pid, i) => {
      const block = document.createElement('div');
      block.className = 'queue-item';
      block.style.borderColor = getColor(pid);

      const dot = document.createElement('span');
      dot.className = 'queue-color-dot';
      dot.style.backgroundColor = getColor(pid);
      block.appendChild(dot);

      const label = document.createElement('span');
      label.className = 'queue-item-label';
      label.textContent = pid;
      block.appendChild(label);

      // Staggered entry animation
      block.style.animation = `queueFadeIn 0.25s ease ${i * 0.05}s both`;

      queueContainer.appendChild(block);
    });

    // Empty state
    if (!runningProcess && queue.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'queue-empty';
      empty.textContent = 'Queue empty';
      queueContainer.appendChild(empty);
    }
  }

  return { update, reset };
})();
