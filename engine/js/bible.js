// Straight Truth — Bible workspace JS
// Manages columns, header interactions, drag & drop.
// Injected into the runtime via go:embed.

// Book chapter counts for client-side chapter dropdown update
var _bookChapters = {
  'Gen':50,'Exo':40,'Lev':27,'Num':36,'Deu':34,'Jos':24,'Jdg':21,'Rut':4,
  '1Sa':31,'2Sa':24,'1Ki':22,'2Ki':25,'1Ch':29,'2Ch':36,'Ezr':10,'Neh':13,
  'Est':10,'Job':42,'Psa':150,'Pro':31,'Ecc':12,'Sol':8,'Isa':66,'Jer':52,
  'Lam':5,'Eze':48,'Dan':12,'Hos':14,'Joe':3,'Amo':9,'Oba':1,'Jon':4,
  'Mic':7,'Nah':3,'Hab':3,'Zep':3,'Hag':2,'Zec':14,'Mal':4,
  'Mat':28,'Mar':16,'Luk':24,'Joh':21,'Act':28,'Rom':16,
  '1Co':16,'2Co':13,'Gal':6,'Eph':6,'Phi':4,'Col':4,
  '1Th':5,'2Th':3,'1Ti':6,'2Ti':4,'Tit':3,'Phm':1,
  'Heb':13,'Jam':5,'1Pe':5,'2Pe':3,'1Jo':5,'2Jo':1,'3Jo':1,'Jud':1,'Rev':22
};

var _MAX_COLUMNS = 5;

// Global bible namespace
window.__bible = window.__bible || {};

// ── Column management ───────────────────────────────────────────────────────

function _stAddColumn(type, extraData) {
  var ws = document.querySelector('[data-id="workspace"]');
  if (!ws) return;

  var cols = ws.querySelectorAll('.window');
  if (cols.length >= _MAX_COLUMNS) return;

  // Prevent duplicates (except passage and search)
  if (type !== 'passage' && type !== 'search') {
    for (var i = 0; i < cols.length; i++) {
      if (cols[i].getAttribute('data-type') === type) return;
    }
  }

  var data = { type: type };
  if (extraData) {
    for (var k in extraData) data[k] = extraData[k];
  }
  window.csPost('column/add', data);
}

function _stCloseColumn(colId) {
  var el = document.querySelector('[data-id="' + colId + '"]');
  if (el) el.remove();
}

function _stClearColumns() {
  var ws = document.querySelector('[data-id="workspace"]');
  if (ws) ws.innerHTML = '';
}

window.__bible.addColumn = _stAddColumn;
window.__bible.closeColumn = _stCloseColumn;
window.__bible.clearColumns = _stClearColumns;

// ── Passage loading ─────────────────────────────────────────────────────────

function _stLoadPassage(colId) {
  var bookSel = document.querySelector('[data-id="book-select"]');
  var chapSel = document.querySelector('[data-id="chapter-select"]');
  if (!bookSel || !chapSel) return;
  window.csPost('passage/load', {
    book: bookSel.value,
    chapter: parseInt(chapSel.value, 10),
    colId: colId
  }, {
    onSuccess: function() {
      var v = window.__bible._scrollTarget;
      if (v) {
        window.__bible._scrollTarget = null;
        setTimeout(function() { _stScrollToVerse(colId, v); }, 50);
      }
    }
  });
}

function _stScrollToVerse(colId, verseNum) {
  var container = document.querySelector('[data-id="' + colId + '-verses"]');
  if (!container) return;
  var verses = container.querySelectorAll('.verse');
  for (var i = 0; i < verses.length; i++) {
    var numEl = verses[i].querySelector('.verse-num');
    if (numEl && parseInt(numEl.textContent, 10) === verseNum) {
      var el = verses[i];
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('verse-highlight');
      setTimeout(function(v) { v.classList.remove('verse-highlight'); }, 2000, el);
      break;
    }
  }
}

// Find the first passage column and load it
function _stLoadFirstPassage() {
  var ws = document.querySelector('[data-id="workspace"]');
  if (!ws) return;
  var col = ws.querySelector('.window[data-type="passage"]');
  if (col) _stLoadPassage(col.getAttribute('data-id'));
}

// Navigate to a verse reference (e.g. "Gen.1.1" or "Mat.5.3-12")
function _stNavigateToRef(ref) {
  if (!ref) return;
  var parts = ref.split('.');
  if (parts.length < 2) return;
  var book = parts[0];
  var chapter = parseInt(parts[1], 10);
  var verse = parts[2] ? parseInt(parts[2], 10) : 1;

  var bookSel = document.querySelector('[data-id="book-select"]');
  var chapSel = document.querySelector('[data-id="chapter-select"]');
  if (!bookSel || !chapSel) return;

  // Ensure a passage column exists
  var ws = document.querySelector('[data-id="workspace"]');
  var passageCol = ws ? ws.querySelector('.window[data-type="passage"]') : null;
  if (!passageCol) {
    _stAddColumn('passage');
  }

  // Update book select
  bookSel.value = book;
  // Rebuild chapter dropdown
  var chapters = _bookChapters[book] || 1;
  chapSel.innerHTML = '';
  for (var i = 1; i <= chapters; i++) {
    var o = document.createElement('option');
    o.value = i;
    o.textContent = 'Chapter ' + i;
    chapSel.appendChild(o);
  }
  chapSel.value = chapter;

  // Store target verse for scroll-after-load
  window.__bible._scrollTarget = verse;

  // Load passage (MutationObserver will auto-load if column was just added)
  if (passageCol) {
    _stLoadPassage(passageCol.getAttribute('data-id'));
  }
}

// ── Strong's lookup ─────────────────────────────────────────────────────────

function _stLookupStrongs(strongNum) {
  // Find the Strong's column or add one
  var ws = document.querySelector('[data-id="workspace"]');
  var strongsCol = ws ? ws.querySelector('.window[data-type="strongs"]') : null;
  if (!strongsCol) {
    _stAddColumn('strongs');
    // Wait for column to be added, then do lookup
    setTimeout(function() {
      var col = ws.querySelector('.window[data-type="strongs"]');
      if (col) {
        window.csPost('strongs/lookup', { strong: strongNum, colId: col.getAttribute('data-id') });
      }
    }, 200);
    return;
  }
  window.csPost('strongs/lookup', { strong: strongNum, colId: strongsCol.getAttribute('data-id') });
}

// ── Cross-refs ──────────────────────────────────────────────────────────────

function _stLoadCrossRefs(verseRef) {
  var ws = document.querySelector('[data-id="workspace"]');
  var crossCol = ws ? ws.querySelector('.window[data-type="crossrefs"]') : null;
  if (!crossCol) {
    _stAddColumn('crossrefs');
    setTimeout(function() {
      var col = ws.querySelector('.window[data-type="crossrefs"]');
      if (col) {
        window.csPost('crossrefs/load', { verse: verseRef, colId: col.getAttribute('data-id') });
      }
    }, 200);
    return;
  }
  window.csPost('crossrefs/load', { verse: verseRef, colId: crossCol.getAttribute('data-id') });
}

// ── Interlinear toggle ──────────────────────────────────────────────────────

function _stToggleInterlinear(btn) {
  var colId = btn.getAttribute('data-col-id');
  if (!colId) return;

  var versesEl = document.querySelector('[data-id="' + colId + '-verses"]');
  if (!versesEl) return;

  var isInterlinear = versesEl.classList.contains('interlinear-mode');

  if (isInterlinear) {
    // Switch back to normal — reload passage
    versesEl.classList.remove('interlinear-mode');
    btn.classList.remove('active');
    _stLoadPassage(colId);
  } else {
    // Switch to interlinear
    var bookSel = document.querySelector('[data-id="book-select"]');
    var chapSel = document.querySelector('[data-id="chapter-select"]');
    if (!bookSel || !chapSel) return;
    versesEl.classList.add('interlinear-mode');
    btn.classList.add('active');
    window.csPost('passage/interlinear', {
      book: bookSel.value,
      chapter: parseInt(chapSel.value, 10),
      colId: colId
    });
  }
}

// ── Column search ───────────────────────────────────────────────────────────

function _stSearchFromColumn(colId) {
  var input = document.querySelector('[data-id="' + colId + '-search"]');
  if (!input) return;
  var q = input.value.trim();
  if (!q) return;
  window.csPost('search/verses', { query: q, colId: colId });
}

// ── Converter ───────────────────────────────────────────────────────────────

function _stConvert(colId) {
  var input = document.querySelector('[data-id="' + colId + '-value"]');
  var select = document.querySelector('[data-id="' + colId + '-unit"]');
  var result = document.querySelector('[data-id="' + colId + '-result"]');
  if (!input || !select || !result) return;

  var val = parseFloat(input.value);
  var opt = select.options[select.selectedIndex];
  if (!opt || !opt.value || isNaN(val)) {
    result.innerHTML = '';
    return;
  }

  var metric = parseFloat(opt.getAttribute('data-metric')) || 0;
  var metricUnit = opt.getAttribute('data-metric-unit') || '';
  var imperial = parseFloat(opt.getAttribute('data-imperial')) || 0;
  var imperialUnit = opt.getAttribute('data-imperial-unit') || '';

  var html = '<div style="font-size:15px;font-weight:600;margin-bottom:8px">' + val + ' × ' + opt.value + '</div>';
  if (metric > 0 && metricUnit) {
    var mResult = (val * metric).toFixed(4).replace(/\.?0+$/, '');
    html += '<div style="font-size:14px;margin:4px 0">≈ <strong>' + mResult + '</strong> ' + metricUnit + '</div>';
  }
  if (imperial > 0 && imperialUnit) {
    var iResult = (val * imperial).toFixed(4).replace(/\.?0+$/, '');
    html += '<div style="font-size:14px;margin:4px 0">≈ <strong>' + iResult + '</strong> ' + imperialUnit + '</div>';
  }
  result.innerHTML = html;
}

window.__bible.navigateToRef = _stNavigateToRef;
window.__bible.lookupStrongs = _stLookupStrongs;
window.__bible.loadCrossRefs = _stLoadCrossRefs;
window.__bible.loadPassage = _stLoadPassage;
window.__bible.loadFirstPassage = _stLoadFirstPassage;

// ── Header wiring ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {

  // Add Column dropdown
  var addSel = document.querySelector('[data-id="add-column"]');
  if (addSel) {
    addSel.addEventListener('change', function() {
      if (this.value) {
        _stAddColumn(this.value);
        this.value = '';
      }
    });
  }

  // Clear button
  var clearBtn = document.querySelector('[data-id="clear-btn"]');
  if (clearBtn) {
    clearBtn.addEventListener('click', _stClearColumns);
  }

  // Book change → update chapter dropdown + reload passage
  var bookSel = document.querySelector('[data-id="book-select"]');
  if (bookSel) {
    bookSel.addEventListener('change', function() {
      var chapters = _bookChapters[this.value] || 1;
      var chapSel = document.querySelector('[data-id="chapter-select"]');
      if (!chapSel) return;
      chapSel.innerHTML = '';
      for (var i = 1; i <= chapters; i++) {
        var o = document.createElement('option');
        o.value = i;
        o.textContent = 'Chapter ' + i;
        if (i === 1) o.selected = true;
        chapSel.appendChild(o);
      }
      _stLoadFirstPassage();
    });
  }

  // Chapter change → reload passage
  var chapSel = document.querySelector('[data-id="chapter-select"]');
  if (chapSel) {
    chapSel.addEventListener('change', function() {
      _stLoadFirstPassage();
    });
  }

  // Search
  var searchBtn = document.querySelector('[data-id="search-btn"]');
  var searchInp = document.querySelector('[data-id="search-input"]');

  function doSearch() {
    var q = searchInp ? searchInp.value.trim() : '';
    if (q) _stAddColumn('search', { query: q });
  }

  if (searchBtn) searchBtn.addEventListener('click', doSearch);
  if (searchInp) {
    searchInp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doSearch();
    });
  }

  // ── Close button + expand/collapse + accordion delegation ───────────────

  document.addEventListener('click', function(e) {
    // Reference link click → navigate to passage
    var refEl = e.target.closest('[data-st-ref]');
    if (refEl) {
      e.stopPropagation();
      _stNavigateToRef(refEl.getAttribute('data-st-ref'));
      return;
    }

    // Strong's word click → open/update Strong's column
    var strongsEl = e.target.closest('[data-strong]');
    if (strongsEl) {
      e.stopPropagation();
      var strongNum = strongsEl.getAttribute('data-strong');
      if (strongNum) _stLookupStrongs(strongNum);
      return;
    }

    // Strong's link in catalog columns
    var strongsLink = e.target.closest('[data-st-strongs]');
    if (strongsLink) {
      e.stopPropagation();
      var sNum = strongsLink.getAttribute('data-st-strongs');
      if (sNum) _stLookupStrongs(sNum);
      return;
    }

    // Cross-ref indicator click → load cross-references
    var crossRefEl = e.target.closest('[data-st-crossref]');
    if (crossRefEl) {
      e.stopPropagation();
      var verseRef = crossRefEl.getAttribute('data-st-crossref');
      if (verseRef) _stLoadCrossRefs(verseRef);
      return;
    }

    // Interlinear toggle click
    var interBtn = e.target.closest('.original-toggle');
    if (interBtn) {
      e.stopPropagation();
      _stToggleInterlinear(interBtn);
      return;
    }

    // Search column internal search button
    var searchColBtn = e.target.closest('.search-btn[data-id]');
    if (searchColBtn) {
      var btnId = searchColBtn.getAttribute('data-id');
      if (btnId && btnId.endsWith('-search-btn')) {
        var colId = btnId.replace('-search-btn', '');
        _stSearchFromColumn(colId);
        return;
      }
    }

    // Verse click → toggle selection
    var verseEl = e.target.closest('.verse[data-verse]');
    if (verseEl && !e.target.closest('[data-strong]') && !e.target.closest('[data-st-crossref]')) {
      var wasSelected = verseEl.classList.contains('selected');
      // Deselect all verses first
      var container = verseEl.closest('.passage-verses');
      if (container) {
        container.querySelectorAll('.verse.selected').forEach(function(v) { v.classList.remove('selected'); });
      }
      if (!wasSelected) verseEl.classList.add('selected');
      return;
    }

    // Close button
    var btn = e.target.closest('.window-btn.close');
    if (btn) {
      var colId = btn.getAttribute('data-col-id');
      if (colId) _stCloseColumn(colId);
      return;
    }

    // Accordion toggle
    var accHeader = e.target.closest('[data-st-accordion]');
    if (accHeader) {
      var content = accHeader.nextElementSibling;
      if (content) {
        var isOpen = content.style.display !== 'none';
        content.style.display = isOpen ? 'none' : '';
        accHeader.classList.toggle('expanded', !isOpen);
        var icon = accHeader.querySelector('.accordion-icon');
        if (icon) icon.textContent = isOpen ? '▶' : '▼';
      }
      return;
    }

    // Expandable item toggle
    var expandItem = e.target.closest('[data-st-expand]');
    if (expandItem) {
      // Don't toggle if clicking a link/button inside detail
      if (e.target.closest('[data-st-detail]') && !e.target.closest('.catalogue-item-name, .question-header, .definition-header, .topical-entry-header, div > [data-st-arrow]')) return;
      var detail = expandItem.querySelector('[data-st-detail]');
      if (detail) {
        var isOpen = detail.style.display !== 'none';
        detail.style.display = isOpen ? 'none' : '';
        var arrow = expandItem.querySelector('[data-st-arrow]');
        if (arrow) arrow.textContent = isOpen ? '▶' : '▼';
      }
      return;
    }
  });

  // ── Search filtering ──────────────────────────────────────────────────────

  document.addEventListener('input', function(e) {
    var search = e.target.closest('[data-st-search]');
    if (!search) return;
    var query = search.value.toLowerCase().trim();
    var container = search.closest('.catalogue-column-content');
    if (!container) return;
    var items = container.querySelectorAll('[data-st-search-text]');
    items.forEach(function(item) {
      if (!query || item.getAttribute('data-st-search-text').indexOf(query) !== -1) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  });

  // ── Converter calculation ──────────────────────────────────────────────
  document.addEventListener('input', function(e) {
    var el = e.target;
    var id = el.getAttribute('data-id');
    if (!id) return;
    // Detect converter value or unit change
    if (id.endsWith('-value') || id.endsWith('-unit')) {
      var colId = id.replace(/-value$/, '').replace(/-unit$/, '');
      _stConvert(colId);
    }
  });
  document.addEventListener('change', function(e) {
    var el = e.target;
    var id = el.getAttribute('data-id');
    if (id && id.endsWith('-unit')) {
      var colId = id.replace(/-unit$/, '');
      _stConvert(colId);
    }
  });

  // ── Search column Enter key ────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    var el = e.target;
    var id = el.getAttribute('data-id');
    if (id && id.endsWith('-search')) {
      var colId = id.replace('-search', '');
      _stSearchFromColumn(colId);
    }
  });

  // ── Auto-load passage when column is added ─────────────────────────────

  var wsObs = document.querySelector('[data-id="workspace"]');
  if (wsObs) {
    new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1 && node.getAttribute('data-type') === 'passage') {
            _stLoadPassage(node.getAttribute('data-id'));
          }
        }
      }
    }).observe(wsObs, { childList: true });
  }

  // ── Drag & drop ────────────────────────────────────────────────────────

  var draggedEl = null;
  var ws = document.querySelector('[data-id="workspace"]');

  if (ws) {
    ws.addEventListener('dragstart', function(e) {
      var win = e.target.closest('.window');
      if (!win) return;
      draggedEl = win;
      win.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    ws.addEventListener('dragover', function(e) {
      e.preventDefault();
      var win = e.target.closest('.window');
      if (win && win !== draggedEl) {
        // Remove from all first
        ws.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
        win.classList.add('drag-over');
      }
    });

    ws.addEventListener('dragleave', function(e) {
      var win = e.target.closest('.window');
      if (win) win.classList.remove('drag-over');
    });

    ws.addEventListener('drop', function(e) {
      e.preventDefault();
      var target = e.target.closest('.window');
      if (target && draggedEl && target !== draggedEl) {
        var children = Array.from(ws.children);
        var fromIdx = children.indexOf(draggedEl);
        var toIdx = children.indexOf(target);
        if (fromIdx < toIdx) {
          target.after(draggedEl);
        } else {
          target.before(draggedEl);
        }
      }
      ws.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    });

    ws.addEventListener('dragend', function() {
      if (draggedEl) {
        draggedEl.classList.remove('dragging');
        draggedEl = null;
      }
      ws.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    });
  }
});
