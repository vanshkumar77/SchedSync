// ============================================================
// SchedSync — Simulation Controls
// ============================================================
// Wires Play/Pause/Step/Reset buttons and speed slider to the
// simulation engine and visualization modules. This is the
// glue between user interaction and the simulation loop.
// ============================================================

const Controls = (function () {
  'use strict';

  // ---- DOM References ----
  const stepBtn = document.getElementById('step-btn');
  const playBtn = document.getElementById('play-btn');
  const resetBtn = document.getElementById('reset-btn');
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');
  const currentTimeEl = document.getElementById('current-time');
  const currentProcessEl = document.getElementById('current-process');
  const simStatusEl = document.getElementById('sim-status');

  let playInterval = null;
  let isPlaying = false;
  let speed = parseInt(speedSlider.value, 10) || 500;

  // ============================================================
  // Simulation lifecycle
  // ============================================================

  /**
   * Starts / initializes a new simulation run.
   * Reads processes and config, initializes the engine.
   */
  function startSimulation() {
    const processes = ProcessManager.getProcesses();

    if (processes.length === 0) {
      App.showToast('Add at least one process before running.', 'error');
      return false;
    }

    const config = App.getConfig();

    // Validate time quantum for Round Robin
    if (config.cpuAlgorithm === 'rr' && (!config.timeQuantum || config.timeQuantum < 1)) {
      App.showToast('Time quantum must be ≥ 1 for Round Robin.', 'error');
      return false;
    }

    // Validate memory frames
    if (!config.memoryFrames || config.memoryFrames < 1) {
      App.showToast('Memory frames must be ≥ 1.', 'error');
      return false;
    }

    // Reset visualizations
    GanttChart.reset();
    ReadyQueueViz.reset();
    MemoryFramesViz.reset();

    // Initialize engine
    SimulationEngine.reset();
    SimulationEngine.init(processes, config);

    // Update UI
    updateStatus('running');
    App.showToast('Simulation started!', 'success', 1500);

    return true;
  }

  /**
   * Executes a single simulation tick and updates all visualizations.
   */
  function executeTick() {
    // If engine not active, try to start a new simulation
    if (!SimulationEngine.isActive()) {
      if (!startSimulation()) return;
    }

    // If already complete, stop
    if (SimulationEngine.isComplete()) {
      stopPlaying();
      updateStatus('done');
      showFinalMetrics();
      App.showToast('Simulation complete!', 'info');
      return;
    }

    // Execute one tick
    const tickData = SimulationEngine.tick();
    if (!tickData) return;

    // Update all visualizations
    GanttChart.addTick(tickData);
    ReadyQueueViz.update(tickData.readyQueue, tickData.runningProcess);

    const config = App.getConfig();
    MemoryFramesViz.update(
      tickData.frames,
      tickData.pageAccess,
      config.memoryFrames
    );

    // Update status bar
    currentTimeEl.textContent = tickData.time;
    currentProcessEl.textContent = tickData.runningProcess || '—';

    if (tickData.isStalled) {
      updateStatus('stalled');
    } else if (tickData.runningProcess) {
      updateStatus('running');
    } else {
      updateStatus('running'); // idle but sim still running
    }

    // Check if simulation just completed
    if (tickData.isFinished) {
      stopPlaying();
      updateStatus('done');
      showFinalMetrics();
      App.showToast('Simulation complete!', 'success');
    }
  }

  /**
   * Shows final performance metrics.
   */
  function showFinalMetrics() {
    const metrics = SimulationEngine.getMetrics();

    const awtEl = document.querySelector('#metric-awt .metric-value');
    const attEl = document.querySelector('#metric-att .metric-value');
    const pfEl = document.querySelector('#metric-pf .metric-value');
    const idleEl = document.querySelector('#metric-idle .metric-value');

    if (awtEl) awtEl.textContent = metrics.avgWaitingTime;
    if (attEl) attEl.textContent = metrics.avgTurnaroundTime;
    if (pfEl) pfEl.textContent = `${metrics.totalPageFaults} (${metrics.pageFaultRate}%)`;
    if (idleEl) idleEl.textContent = `${metrics.cpuIdleTime} ticks`;

    // Trigger pop animation on each card
    document.querySelectorAll('.metric-card').forEach(card => {
      card.classList.remove('metric-updated');
      void card.offsetWidth; // Force reflow to restart animation
      card.classList.add('metric-updated');
    });
  }

  /**
   * Resets the entire simulation and all visualizations.
   */
  function resetSimulation() {
    stopPlaying();
    SimulationEngine.reset();
    GanttChart.reset();
    ReadyQueueViz.reset();
    MemoryFramesViz.reset();

    // Reset status bar
    currentTimeEl.textContent = '0';
    currentProcessEl.textContent = '—';
    updateStatus('idle');

    // Reset metrics
    document.querySelectorAll('.metric-value').forEach(el => {
      el.textContent = '—';
    });

    App.showToast('Simulation reset.', 'info', 1500);
  }

  // ============================================================
  // Play / Pause
  // ============================================================

  function startPlaying() {
    if (isPlaying) return;
    isPlaying = true;
    playBtn.textContent = '⏸ Pause';
    playBtn.title = 'Pause simulation';

    playInterval = setInterval(() => {
      executeTick();

      // Stop if simulation is complete
      if (SimulationEngine.isComplete()) {
        stopPlaying();
      }
    }, speed);
  }

  function stopPlaying() {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
    isPlaying = false;
    playBtn.textContent = '▶ Play';
    playBtn.title = 'Auto-run simulation';
  }

  function togglePlay() {
    // If engine not active, start fresh
    if (!SimulationEngine.isActive() && !isPlaying) {
      if (!startSimulation()) return;
    }

    if (isPlaying) {
      stopPlaying();
      updateStatus('paused');
    } else {
      if (SimulationEngine.isComplete()) {
        App.showToast('Simulation already complete. Reset to run again.', 'info');
        return;
      }
      startPlaying();
    }
  }

  // ============================================================
  // Status display
  // ============================================================

  function updateStatus(status) {
    const labels = {
      idle: 'Idle',
      running: 'Running',
      paused: 'Paused',
      stalled: 'Stalled',
      done: 'Complete'
    };
    simStatusEl.textContent = labels[status] || status;
    simStatusEl.dataset.status = status;
  }

  // ============================================================
  // Speed slider
  // ============================================================

  function updateSpeed() {
    speed = parseInt(speedSlider.value, 10);
    speedValue.textContent = `${speed}ms`;

    // If currently playing, restart interval with new speed
    if (isPlaying) {
      stopPlaying();
      startPlaying();
    }
  }

  // ============================================================
  // Event Listeners
  // ============================================================

  function init() {
    stepBtn.addEventListener('click', executeTick);
    playBtn.addEventListener('click', togglePlay);
    resetBtn.addEventListener('click', resetSimulation);
    speedSlider.addEventListener('input', updateSpeed);

    // Set initial speed display
    speedValue.textContent = `${speed}ms`;

    console.log('[SchedSync] Controls initialized.');
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    executeTick,
    startSimulation,
    resetSimulation,
    togglePlay,
    startPlaying,
    stopPlaying,
    init
  };
})();
