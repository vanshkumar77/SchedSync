// ============================================================
// SchedSync — Simulation Engine
// ============================================================
// Core orchestrator that combines CPU scheduling and memory
// paging. Drives the simulation tick-by-tick, handling:
//  - CPU scheduling decisions
//  - Page accesses for the running process
//  - Page fault stalls (CPU pauses during memory I/O)
//  - State snapshots for visualization each tick
// ============================================================

const SimulationEngine = (function () {
  'use strict';

  // ---- Internal State ----
  let cpuScheduler = null;
  let pagingEngine = null;
  let config = null;
  let tickHistory = [];      // Array of per-tick snapshots
  let pageAccessIndex = {};  // Per-process: how far into their page ref string
  let stallRemaining = 0;    // Ticks of stall left for current page fault
  let stalledProcess = null; // Which process is stalled
  let isRunning = false;
  let isFinished = false;
  let totalPageFaults = 0;
  let totalPageHits = 0;
  let cpuIdleTicks = 0;

  /**
   * Initializes the simulation engine with processes and config.
   *
   * @param {object[]} processes - Array of { pid, arrivalTime, burstTime, pageReferences }
   * @param {object} cfg - { cpuAlgorithm, pagingAlgorithm, timeQuantum, memoryFrames, pageFaultStall }
   */
  function init(processes, cfg) {
    config = cfg;
    tickHistory = [];
    pageAccessIndex = {};
    stallRemaining = 0;
    stalledProcess = null;
    isRunning = false;
    isFinished = false;
    totalPageFaults = 0;
    totalPageHits = 0;
    cpuIdleTicks = 0;

    // Initialize page access indices for each process
    processes.forEach(p => {
      pageAccessIndex[p.pid] = 0;
    });

    // Create the CPU scheduler based on selected algorithm
    switch (cfg.cpuAlgorithm) {
      case 'fcfs':
        cpuScheduler = new FCFSScheduler(processes);
        break;
      case 'sjf':
        cpuScheduler = new SJFScheduler(processes);
        break;
      case 'srtf':
        cpuScheduler = new SRTFScheduler(processes);
        break;
      case 'rr':
        cpuScheduler = new RoundRobinScheduler(processes, cfg.timeQuantum);
        break;
      case 'priority':
        cpuScheduler = new PriorityScheduler(processes);
        break;
      default:
        cpuScheduler = new FCFSScheduler(processes);
    }

    // Create the paging engine
    switch (cfg.pagingAlgorithm) {
      case 'lru':
        pagingEngine = new LRUPaging(cfg.memoryFrames);
        break;
      case 'fifo':
      default:
        pagingEngine = new FIFOPaging(cfg.memoryFrames);
    }

    isRunning = true;
  }

  /**
   * Advances the simulation by one tick.
   * Handles CPU scheduling, page access, and stall logic.
   *
   * @returns {object|null} Tick snapshot, or null if not initialized / already finished
   */
  function tick() {
    if (!isRunning || !cpuScheduler) return null;
    if (isFinished) return null;

    // ---- Handle page fault stall ----
    // If the CPU is stalled due to a page fault, just count down
    if (stallRemaining > 0) {
      stallRemaining--;

      const stallTick = {
        time: tickHistory.length,
        runningProcess: stalledProcess,
        readyQueue: [], // We don't advance the scheduler during stall
        completed: [],
        isStalled: true,
        stallRemaining: stallRemaining,
        event: `CPU stalled — memory I/O for ${stalledProcess} (${stallRemaining} ticks remaining).`,
        pageAccess: null,
        frames: pagingEngine.getFrames(),
        isFinished: false
      };

      // Copy ready queue and completed from last tick if available
      if (tickHistory.length > 0) {
        const lastTick = tickHistory[tickHistory.length - 1];
        stallTick.readyQueue = lastTick.readyQueue;
        stallTick.completed = lastTick.completed;
      }

      cpuIdleTicks++; // CPU does no useful work during stall
      tickHistory.push(stallTick);
      return stallTick;
    }

    // ---- Normal CPU scheduling tick ----
    const schedState = cpuScheduler.tick();

    // Track CPU idle
    if (!schedState.runningProcess) {
      cpuIdleTicks++;
    }

    // ---- Page access for the running process ----
    let pageAccess = null;
    const runningPid = schedState.runningProcess;

    if (runningPid) {
      // Find the process data to get page references
      const processes = ProcessManager.getProcesses();
      const proc = processes.find(p => p.pid === runningPid);

      if (proc && proc.pageReferences && proc.pageReferences.length > 0) {
        const pageIdx = pageAccessIndex[runningPid] || 0;

        if (pageIdx < proc.pageReferences.length) {
          const pageNum = proc.pageReferences[pageIdx];
          const result = pagingEngine.accessPage(pageNum);
          pageAccessIndex[runningPid] = pageIdx + 1;

          pageAccess = {
            pid: runningPid,
            page: pageNum,
            hit: result.hit,
            evicted: result.evicted,
            frames: result.frames
          };

          if (result.hit) {
            totalPageHits++;
          } else {
            totalPageFaults++;

            // Introduce stall on page fault
            if (config.pageFaultStall > 0) {
              stallRemaining = config.pageFaultStall;
              stalledProcess = runningPid;
            }
          }
        }
      }
    }

    // Build tick snapshot
    const tickSnapshot = {
      time: tickHistory.length,
      runningProcess: runningPid,
      readyQueue: schedState.readyQueue,
      completed: schedState.completed,
      isStalled: false,
      stallRemaining: 0,
      event: schedState.event,
      pageAccess: pageAccess,
      frames: pagingEngine.getFrames(),
      isFinished: schedState.isFinished && stallRemaining === 0
    };

    if (tickSnapshot.isFinished) {
      isFinished = true;
      isRunning = false;
    }

    tickHistory.push(tickSnapshot);
    return tickSnapshot;
  }

  /**
   * Returns performance metrics after simulation.
   * @returns {object}
   */
  function getMetrics() {
    if (!cpuScheduler) {
      return {
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        totalPageFaults: 0,
        totalPageHits: 0,
        cpuIdleTime: 0,
        pageFaultRate: 0
      };
    }

    const cpuMetrics = cpuScheduler.getMetrics();
    const totalAccesses = totalPageFaults + totalPageHits;

    return {
      avgWaitingTime: cpuMetrics.avgWaitingTime,
      avgTurnaroundTime: cpuMetrics.avgTurnaroundTime,
      totalPageFaults: totalPageFaults,
      totalPageHits: totalPageHits,
      cpuIdleTime: cpuIdleTicks,
      pageFaultRate: totalAccesses > 0
        ? parseFloat((totalPageFaults / totalAccesses * 100).toFixed(1))
        : 0
    };
  }

  /**
   * Returns the full tick history.
   * @returns {object[]}
   */
  function getHistory() {
    return [...tickHistory];
  }

  /**
   * Returns the last tick snapshot.
   * @returns {object|null}
   */
  function getLastTick() {
    return tickHistory.length > 0 ? tickHistory[tickHistory.length - 1] : null;
  }

  /**
   * Checks if simulation is complete.
   * @returns {boolean}
   */
  function isComplete() {
    return isFinished;
  }

  /**
   * Checks if simulation is initialized and active.
   * @returns {boolean}
   */
  function isActive() {
    return isRunning;
  }

  /**
   * Resets the simulation engine completely.
   */
  function reset() {
    cpuScheduler = null;
    pagingEngine = null;
    config = null;
    tickHistory = [];
    pageAccessIndex = {};
    stallRemaining = 0;
    stalledProcess = null;
    isRunning = false;
    isFinished = false;
    totalPageFaults = 0;
    totalPageHits = 0;
    cpuIdleTicks = 0;
  }

  /**
   * Returns current tick count.
   * @returns {number}
   */
  function getCurrentTime() {
    return tickHistory.length;
  }

  // ---- Public API ----
  return {
    init,
    tick,
    getMetrics,
    getHistory,
    getLastTick,
    isComplete,
    isActive,
    reset,
    getCurrentTime
  };
})();
