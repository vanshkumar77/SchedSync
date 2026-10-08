// ============================================================
// SchedSync — SJF (Shortest Job First) Scheduler
// ============================================================
// Non-preemptive: when CPU is free, picks the process with
// the shortest burst time from the ready queue.
// Once started, it runs to completion.
// ============================================================

class SJFScheduler {
  /**
   * @param {object[]} processes - Array of { pid, arrivalTime, burstTime }
   */
  constructor(processes) {
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

    this.currentProcess = null;
    this.readyQueue = [];
    this.completed = [];
    this.currentTime = -1;
  }

  /**
   * Sorts the ready queue by burst time (shortest first).
   * Ties broken by arrival time, then input order.
   */
  sortReadyQueue() {
    this.readyQueue.sort((a, b) => {
      if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.inputOrder - b.inputOrder;
    });
  }

  tick() {
    this.currentTime++;
    const time = this.currentTime;
    let event = '';
    let runningPid = null;

    // 1. Add newly arrived processes to the ready queue
    for (const p of this.processes) {
      if (p.arrivalTime === time && p.completionTime === -1 && p !== this.currentProcess) {
        this.readyQueue.push(p);
        event += `${p.pid} arrived. `;
      }
    }

    // 2. If no process is running, pick shortest job from ready queue
    if (!this.currentProcess && this.readyQueue.length > 0) {
      this.sortReadyQueue();
      this.currentProcess = this.readyQueue.shift();
      if (this.currentProcess.startTime === -1) {
        this.currentProcess.startTime = time;
      }
      event += `${this.currentProcess.pid} started (BT=${this.currentProcess.burstTime}). `;
    }

    // 3. Execute current process
    if (this.currentProcess) {
      runningPid = this.currentProcess.pid;
      this.currentProcess.remainingTime--;

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

  getMetrics() {
    const n = this.processes.length;
    if (n === 0) return { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuIdleTime: 0 };

    const totalWT = this.processes.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTAT = this.processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const totalBurst = this.processes.reduce((sum, p) => sum + p.burstTime, 0);
    const totalTime = Math.max(...this.processes.map(p => p.completionTime));

    return {
      avgWaitingTime: parseFloat((totalWT / n).toFixed(2)),
      avgTurnaroundTime: parseFloat((totalTAT / n).toFixed(2)),
      cpuIdleTime: Math.max(0, totalTime - totalBurst)
    };
  }

  isComplete() {
    return this.completed.length === this.processes.length
      && this.readyQueue.length === 0
      && !this.currentProcess;
  }
}
