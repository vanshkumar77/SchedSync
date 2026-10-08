// ============================================================
// SchedSync — Round Robin Scheduler
// ============================================================
// Preemptive: each process gets a fixed time quantum. When
// the quantum expires, the process is moved to the back of
// the ready queue if it hasn't finished.
// ============================================================

class RoundRobinScheduler {
  /**
   * @param {object[]} processes - Array of { pid, arrivalTime, burstTime }
   * @param {number} timeQuantum - Time quantum (default: 2)
   */
  constructor(processes, timeQuantum = 2) {
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

    // Sort by arrival time, then input order for initial ordering
    this.processes.sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.inputOrder - b.inputOrder;
    });

    this.timeQuantum = Math.max(1, timeQuantum);
    this.currentProcess = null;
    this.quantumUsed = 0; // Ticks used of current quantum
    this.readyQueue = [];
    this.completed = [];
    this.currentTime = -1;
    // Track which processes have been added to avoid re-adding
    this.addedPids = new Set();
  }

  tick() {
    this.currentTime++;
    const time = this.currentTime;
    let event = '';
    let runningPid = null;

    // 1. Add newly arrived processes to the ready queue
    //    Important: new arrivals are added BEFORE checking quantum expiry
    //    so that a preempted process goes behind the new arrivals
    for (const p of this.processes) {
      if (p.arrivalTime === time && !this.addedPids.has(p.pid) && p !== this.currentProcess) {
        this.readyQueue.push(p);
        this.addedPids.add(p.pid);
        event += `${p.pid} arrived. `;
      }
    }

    // 2. Check if current process's quantum has expired
    if (this.currentProcess && this.quantumUsed >= this.timeQuantum) {
      if (this.currentProcess.remainingTime > 0) {
        // Time quantum expired — preempt, move to back of queue
        this.readyQueue.push(this.currentProcess);
        event += `${this.currentProcess.pid} quantum expired, preempted. `;
      }
      this.currentProcess = null;
      this.quantumUsed = 0;
    }

    // 3. If no process is running, pick next from ready queue
    if (!this.currentProcess && this.readyQueue.length > 0) {
      this.currentProcess = this.readyQueue.shift();
      this.quantumUsed = 0;

      if (this.currentProcess.startTime === -1) {
        this.currentProcess.startTime = time;
      }
      event += `${this.currentProcess.pid} scheduled (Q=${this.timeQuantum}). `;
    }

    // 4. Execute current process for one tick
    if (this.currentProcess) {
      runningPid = this.currentProcess.pid;
      this.currentProcess.remainingTime--;
      this.quantumUsed++;

      // Check if process completed
      if (this.currentProcess.remainingTime === 0) {
        this.currentProcess.completionTime = time + 1;
        this.currentProcess.turnaroundTime = this.currentProcess.completionTime - this.currentProcess.arrivalTime;
        this.currentProcess.waitingTime = this.currentProcess.turnaroundTime - this.currentProcess.burstTime;
        this.completed.push(this.currentProcess);
        event += `${this.currentProcess.pid} completed. `;
        this.currentProcess = null;
        this.quantumUsed = 0;
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
      event: event.trim() || (runningPid ? `${runningPid} running (${this.quantumUsed}/${this.timeQuantum}).` : 'CPU idle.')
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
