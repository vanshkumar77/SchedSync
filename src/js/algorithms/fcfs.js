// ============================================================
// SchedSync — FCFS (First Come First Served) Scheduler
// ============================================================
// Non-preemptive: processes are executed in order of arrival.
// Once a process starts, it runs to completion.
// ============================================================

class FCFSScheduler {
  /**
   * @param {object[]} processes - Array of { pid, arrivalTime, burstTime }
   */
  constructor(processes) {
    // Deep copy and sort by arrival time, then by input order
    this.processes = processes.map((p, i) => ({
      pid: p.pid,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      remainingTime: p.burstTime,
      startTime: -1,
      completionTime: -1,
      waitingTime: 0,
      turnaroundTime: 0,
      inputOrder: i
    }));

    // Sort by arrival time, break ties by input order (FIFO)
    this.processes.sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.inputOrder - b.inputOrder;
    });

    this.currentProcess = null;
    this.readyQueue = [];
    this.completed = [];
    this.currentTime = -1;
  }

  /**
   * Advances the scheduler by one time unit.
   * Returns the state after this tick.
   *
   * @returns {{ 
   *   time: number,
   *   runningProcess: string|null,
   *   readyQueue: string[],
   *   completed: string[],
   *   isFinished: boolean,
   *   event: string
   * }}
   */
  tick() {
    this.currentTime++;
    const time = this.currentTime;
    let event = '';
    let runningPid = null; // Track who runs THIS tick

    // 1. Add newly arrived processes to the ready queue
    for (const p of this.processes) {
      if (p.arrivalTime === time && p.completionTime === -1 && p !== this.currentProcess) {
        this.readyQueue.push(p);
        event += `${p.pid} arrived. `;
      }
    }

    // 2. If no process is running, pick the next from the ready queue
    if (!this.currentProcess && this.readyQueue.length > 0) {
      this.currentProcess = this.readyQueue.shift();
      if (this.currentProcess.startTime === -1) {
        this.currentProcess.startTime = time;
      }
      event += `${this.currentProcess.pid} started. `;
    }

    // 3. Execute the current process for one tick
    if (this.currentProcess) {
      runningPid = this.currentProcess.pid; // Capture before possible completion
      this.currentProcess.remainingTime--;

      // Check if process completed
      if (this.currentProcess.remainingTime === 0) {
        this.currentProcess.completionTime = time + 1;
        this.currentProcess.turnaroundTime = this.currentProcess.completionTime - this.currentProcess.arrivalTime;
        this.currentProcess.waitingTime = this.currentProcess.turnaroundTime - this.currentProcess.burstTime;
        this.completed.push(this.currentProcess);
        event += `${this.currentProcess.pid} completed. `;
        this.currentProcess = null;
      }
    }

    const isFinished = this.completed.length === this.processes.length
      && this.readyQueue.length === 0
      && !this.currentProcess;

    return {
      time,
      runningProcess: runningPid,
      readyQueue: this.readyQueue.map(p => p.pid),
      completed: this.completed.map(p => p.pid),
      isFinished,
      event: event.trim() || (runningPid ? `${runningPid} running.` : 'CPU idle.')
    };
  }

  /**
   * Returns final metrics after simulation is complete.
   * @returns {{ avgWaitingTime: number, avgTurnaroundTime: number, cpuIdleTime: number }}
   */
  getMetrics() {
    const n = this.processes.length;
    if (n === 0) return { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuIdleTime: 0 };

    const totalWT = this.processes.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTAT = this.processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const totalBurst = this.processes.reduce((sum, p) => sum + p.burstTime, 0);
    const totalTime = Math.max(...this.processes.map(p => p.completionTime));
    const cpuIdleTime = totalTime - totalBurst;

    return {
      avgWaitingTime: parseFloat((totalWT / n).toFixed(2)),
      avgTurnaroundTime: parseFloat((totalTAT / n).toFixed(2)),
      cpuIdleTime: Math.max(0, cpuIdleTime)
    };
  }

  /**
   * Checks if simulation is complete.
   * @returns {boolean}
   */
  isComplete() {
    return this.completed.length === this.processes.length
      && this.readyQueue.length === 0
      && !this.currentProcess;
  }
}
