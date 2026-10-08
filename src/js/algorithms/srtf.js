// ============================================================
// SchedSync — SRTF (Shortest Remaining Time First) Scheduler
// ============================================================
// Preemptive version of SJF: at every tick, the process with
// the shortest REMAINING time runs. A newly arrived process
// with shorter remaining time can preempt the current one.
// ============================================================

class SRTFScheduler {
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
   * Sorts by remaining time (shortest first).
   * Ties broken by arrival time, then input order.
   */
  sortByRemaining(queue) {
    queue.sort((a, b) => {
      if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
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

    // 2. Preemptive check — put current process back and re-evaluate
    if (this.currentProcess) {
      this.readyQueue.push(this.currentProcess);
    }

    // 3. Sort all candidates by remaining time and pick the shortest
    if (this.readyQueue.length > 0) {
      this.sortByRemaining(this.readyQueue);
      const picked = this.readyQueue.shift();

      // Check if preemption occurred
      if (this.currentProcess && this.currentProcess !== picked) {
        event += `${this.currentProcess.pid} preempted by ${picked.pid}. `;
      }

      this.currentProcess = picked;

      if (this.currentProcess.startTime === -1) {
        this.currentProcess.startTime = time;
        event += `${this.currentProcess.pid} started. `;
      }
    } else {
      this.currentProcess = null;
    }

    // 4. Execute current process for one tick
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
