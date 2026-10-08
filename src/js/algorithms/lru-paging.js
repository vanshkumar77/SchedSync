// ============================================================
// SchedSync — LRU Page Replacement Algorithm
// ============================================================
// Least Recently Used: when a page fault occurs and frames
// are full, the page that was accessed least recently is
// evicted. On a hit, the page's recency is updated.
// ============================================================

class LRUPaging {
  /**
   * @param {number} frameCount - Number of memory frames available
   */
  constructor(frameCount) {
    this.frameCount = Math.max(1, frameCount);
    this.frames = [];        // Current pages in memory (most recently used at end)
    this.accessLog = [];     // Log of each access
    this.totalFaults = 0;
    this.totalHits = 0;
  }

  /**
   * Accesses a page. On a hit, the page is moved to the most-recent
   * position. On a fault, the least-recently-used page (index 0)
   * is evicted if frames are full.
   *
   * @param {number} page - The page number to access
   * @returns {{ page: number, hit: boolean, evicted: number|null, frames: number[] }}
   */
  accessPage(page) {
    let hit = false;
    let evicted = null;

    const index = this.frames.indexOf(page);

    if (index !== -1) {
      // ---- HIT: page in memory — move to most-recent position ----
      hit = true;
      this.totalHits++;
      // Remove from current position and push to end (most recent)
      this.frames.splice(index, 1);
      this.frames.push(page);
    } else {
      // ---- FAULT: page not in memory ----
      this.totalFaults++;

      if (this.frames.length >= this.frameCount) {
        // Evict the least recently used page (first element = LRU)
        evicted = this.frames.shift();
      }

      // Add new page at the end (most recent)
      this.frames.push(page);
    }

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
