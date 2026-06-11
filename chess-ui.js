
// ── SIDEBAR TOGGLE ──
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ── BREADCRUMB UPDATE ──
const BC_LABELS = {
  white: 'White Openings', vsE4: 'vs 1.e4', vsAlekhine: 'Alekhine Defence',
  vsD4: 'vs 1.d4', vsKID: "King's Indian", vsQID: "Queen's Indian",
  openings: 'Sicilian Defence', counters: 'Anti-Sicilian',
  vsQG: "vs Queen's Gambit", middlegame: 'Middlegame',
  endgame: 'Endgames', tactics: 'Tactics', puzzles: 'Puzzles', theory: 'Theory'
};

// Patch showSection to also update sidebar + breadcrumb
const _origShow = showSection;
window.showSection = function(id, btn) {
  _origShow(id, btn);
  // Update all nav-item active states
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-section="' + id + '"]').forEach(b => b.classList.add('active'));
  // Update breadcrumb
  const bc = document.getElementById('bc-current');
  if (bc) bc.textContent = BC_LABELS[id] || id;
  // Close sidebar on mobile
  if (window.innerWidth <= 860) closeSidebar();
};

// ── READING PROGRESS BAR ──
const content = document.getElementById('content');
const bar = document.getElementById('reading-progress-bar');
if (content && bar) {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docHeight > 0 ? (scrollTop / docHeight * 100) : 0) + '%';
  });
}

// ── HASH-BASED NAVIGATION (shareable section URLs + survives refresh) ──
const VALID_SECTIONS = ['white','vsE4','vsAlekhine','vsD4','vsKID','vsQID','openings','counters','vsQG','middlegame','endgame','tactics','puzzles','theory'];

// Extend showSection to write the hash
const _showWithHash = window.showSection;
window.showSection = function(id, btn) {
  _showWithHash(id, btn);
  if (history.replaceState) history.replaceState(null, '', '#' + id);
  else location.hash = id;
};

// On load: read hash and open that section
function applyHash() {
  const h = location.hash.replace('#','');
  if (VALID_SECTIONS.includes(h)) {
    const navBtn = document.querySelector('.nav-item[data-section="' + h + '"]');
    if (navBtn) _showWithHash(h, navBtn) || (function(){
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      navBtn.classList.add('active');
      const bc = document.getElementById('bc-current');
      if (bc) bc.textContent = BC_LABELS[h] || h;
    })();
    // ensure full state update
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-section="' + h + '"]').forEach(b => b.classList.add('active'));
    const bc = document.getElementById('bc-current');
    if (bc) bc.textContent = BC_LABELS[h] || h;
  }
}
window.addEventListener('load', () => setTimeout(applyHash, 150));
window.addEventListener('hashchange', applyHash);

// ── KEYBOARD ARROW NAVIGATION (Lichess-style ← → for boards) ──
// Tracks the board nearest the viewport centre; arrows step it
let activeBoardId = null;

function findVisibleBoard() {
  const widgets = document.querySelectorAll('.section.active .board-widget');
  let best = null, bestDist = Infinity;
  const mid = window.innerHeight / 2;
  widgets.forEach(w => {
    const r = w.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const centre = (r.top + r.bottom) / 2;
    const d = Math.abs(centre - mid);
    if (d < bestDist) { bestDist = d; best = w; }
  });
  if (!best) return null;
  const cb = best.querySelector('[id^="cb-"]');
  return cb ? cb.id.slice(3) : null;
}

document.addEventListener('keydown', (e) => {
  // Don't hijack arrows when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const bid = findVisibleBoard();
  if (!bid || !window.BOARDS || !BOARDS[bid]) return;
  e.preventDefault();
  const b = BOARDS[bid];
  if (e.key === 'ArrowRight' && b.cur < b.moves.length) { b.cur++; render(bid); }
  if (e.key === 'ArrowLeft'  && b.cur > 0)              { b.cur--; render(bid); }
});

// ── PUZZLE SOLVED FEEDBACK ──
// When a puzzle board reaches its final step, show a solved banner
const _origRender = window.render;
window.render = function(bid) {
  _origRender(bid);
  if (!['p1600','p1900','p2100'].includes(bid)) return;
  const b = BOARDS[bid];
  if (!b) return;
  const container = document.getElementById('bw-' + bid);
  if (!container) return;
  let banner = container.querySelector('.puzzle-solved');
  if (b.cur >= b.moves.length && b.moves.length > 0) {
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'puzzle-solved';
      banner.style.cssText = 'margin-top:10px;padding:10px 16px;background:rgba(74,156,82,.15);border:1px solid rgba(74,156,82,.5);border-radius:3px;color:#7ec880;font-family:var(--font-mono);font-size:11px;letter-spacing:2px;text-transform:uppercase;animation:fadeIn .4s;';
      banner.textContent = '✓ Puzzle solved — click New Puzzles for the next set';
      const info = container.querySelector('.board-info');
      if (info) info.appendChild(banner);
    }
    // Track solve streak in localStorage (graceful if unavailable)
    try {
      const solved = JSON.parse(localStorage.getItem('cm-solved') || '{}');
      const key = bid + '-' + (b.fenKey || '');
      if (!solved[key]) {
        solved[key] = Date.now();
        localStorage.setItem('cm-solved', JSON.stringify(solved));
      }
    } catch(e) {}
  } else if (banner) {
    banner.remove();
  }
};
