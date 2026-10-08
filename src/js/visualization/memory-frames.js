// ============================================================
// SchedSync — Memory Frames Visualization
// ============================================================
// Displays memory frames as a grid, with page contents,
// hit/fault indicators, and a page access log.
// ============================================================

const MemoryFramesViz = (function () {
  'use strict';

  const framesContainer = document.getElementById('memory-frames');
  const pageLogContainer = document.getElementById('page-log');

  /**
   * Resets the memory frames display.
   */
  function reset() {
    if (framesContainer) framesContainer.innerHTML = '';
    if (pageLogContainer) pageLogContainer.innerHTML = '';
  }

  /**
   * Updates the memory frames display.
   * @param {number[]} frames - Current page numbers in frames
   * @param {object|null} pageAccess - { page, hit, evicted, frames } or null
   * @param {number} totalFrames - Total frame capacity
   */
  function update(frames, pageAccess, totalFrames) {
    if (!framesContainer) return;

    framesContainer.innerHTML = '';

    // Render frame slots
    for (let i = 0; i < totalFrames; i++) {
      const frameEl = document.createElement('div');
      frameEl.className = 'memory-frame';

      const hasPage = i < frames.length;

      if (hasPage) {
        frameEl.classList.add('memory-frame-filled');

        // Highlight the most recently accessed page
        if (pageAccess && frames[i] === pageAccess.page) {
          if (pageAccess.hit) {
            frameEl.classList.add('memory-frame-hit');
          } else {
            frameEl.classList.add('memory-frame-fault');
          }
        }

        const pageNum = document.createElement('span');
        pageNum.className = 'frame-page-num';
        pageNum.textContent = frames[i];
        frameEl.appendChild(pageNum);
      } else {
        frameEl.classList.add('memory-frame-empty');

        const emptyLabel = document.createElement('span');
        emptyLabel.className = 'frame-empty-label';
        emptyLabel.textContent = '—';
        frameEl.appendChild(emptyLabel);
      }

      // Frame index label
      const indexLabel = document.createElement('span');
      indexLabel.className = 'frame-index';
      indexLabel.textContent = `F${i}`;
      frameEl.appendChild(indexLabel);

      // Entry animation
      frameEl.style.animation = `framePop 0.3s ease ${i * 0.05}s both`;

      framesContainer.appendChild(frameEl);
    }

    // Add page access log entry
    if (pageAccess && pageLogContainer) {
      addLogEntry(pageAccess);
    }
  }

  /**
   * Adds a log entry for a page access.
   * @param {object} access - { page, hit, evicted, pid }
   */
  function addLogEntry(access) {
    const entry = document.createElement('div');
    entry.className = 'page-log-entry';

    if (access.hit) {
      entry.classList.add('page-log-hit');
    } else {
      entry.classList.add('page-log-fault');
    }

    const icon = document.createElement('span');
    icon.className = 'page-log-icon';
    icon.textContent = access.hit ? '✓' : '✗';
    entry.appendChild(icon);

    const text = document.createElement('span');
    text.className = 'page-log-text';
    if (access.hit) {
      text.textContent = `Page ${access.page} → Hit`;
    } else if (access.evicted !== null && access.evicted !== undefined) {
      text.textContent = `Page ${access.page} → Fault (evicted ${access.evicted})`;
    } else {
      text.textContent = `Page ${access.page} → Fault (loaded)`;
    }
    entry.appendChild(text);

    if (access.pid) {
      const pidBadge = document.createElement('span');
      pidBadge.className = 'page-log-pid';
      pidBadge.textContent = access.pid;
      entry.appendChild(pidBadge);
    }

    // Animate in
    entry.style.animation = 'logSlideIn 0.25s ease forwards';

    pageLogContainer.appendChild(entry);

    // Auto-scroll to bottom
    pageLogContainer.scrollTop = pageLogContainer.scrollHeight;
  }

  return { update, reset };
})();
