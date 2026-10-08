// ============================================================
// SchedSync — FIFO Page Replacement Algorithm
// ============================================================
// First In, First Out: the oldest page in memory is replaced
// when a page fault occurs and all frames are full.
// ============================================================

class FIFOPaging {
  /**
   * @param {number} frameCount - Number of memory frames available
   */
  constructor(frameCount) {
    this.frameCount = Math.max(1, frameCount);
    this.frames = [];        // Current pages in memory (ordered by insertion)
    this.accessLog = [];     // Log of each page access: { page, hit, frames (snapshot) }
    this.totalFaults = 0;
    this.totalHits = 0;
  }

  /**
   * Accesses a page. If the page is already in memory, it's a hit.
   * If not, it's a fault — the oldest page is evicted if frames are full.
   *
   * @param {number} page - The page number to access
   * @returns {{ page: number, hit: boolean, evicted: number|null, frames: number[] }}
   */
  accessPage(page) {
    let hit = false;
    let evicted = null;

    if (this.frames.includes(page)) {
      // ---- HIT: page already in memory ----
      hit = true;
      this.totalHits++;
    } else {
      // ---- FAULT: page not in memory ----
      this.totalFaults++;

      if (this.frames.length >= this.frameCount) {
        // Evict the oldest page (first element = oldest in FIFO)
        evicted = this.frames.shift();
      }

      // Add the new page
      this.frames.push(page);
    }

    // Log this access with a snapshot of current frame state
    const entry = {
      page,
      hit,
      evicted,
      frames: [...this.frames] // Snapshot
    };
    this.accessLog.push(entry);

    return entry;
  }

  /**
   * Processes a full page reference string.
   * @param {number[]} pageReferences - Array of page numbers
   * @returns {{ log: object[], totalFaults: number, totalHits: number, faultRate: number }}
   */
  processAll(pageReferences) {
    // Reset state
    this.frames = [];
    this.accessLog = [];
    this.totalFaults = 0;
    this.totalHits = 0;

    for (const page of pageReferences) {
      this.accessPage(page);
    }

    return this.getResults();
  }

  /**
   * Returns current results.
   * @returns {{ log: object[], totalFaults: number, totalHits: number, faultRate: number }}
   */
  getResults() {
    const total = this.totalFaults + this.totalHits;
    return {
      log: [...this.accessLog],
      totalFaults: this.totalFaults,
      totalHits: this.totalHits,
      faultRate: total > 0 ? parseFloat((this.totalFaults / total * 100).toFixed(1)) : 0
    };
  }

  /**
   * Resets the paging state.
   */
  reset() {
    this.frames = [];
    this.accessLog = [];
    this.totalFaults = 0;
    this.totalHits = 0;
  }

  /**
   * Returns a snapshot of current frames.
   * @returns {number[]}
   */
  getFrames() {
    return [...this.frames];
  }
}
