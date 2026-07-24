// ============================================================
// ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (ВСПЫШКА ПРИ РЕСПАВНЕ)
// ============================================================

let overlayElem = null;

function getOverlay() {
  if (!overlayElem) {
    overlayElem = document.getElementById('respawn-overlay');
    if (!overlayElem) {
      overlayElem = document.createElement('div');
      overlayElem.id = 'respawn-overlay';
      document.body.appendChild(overlayElem);
    }
  }
  return overlayElem;
}

export function triggerRespawnVFX(color = '#00f3ff') {
  const overlay = getOverlay();
  
  overlay.style.background = color;
  overlay.style.boxShadow = `inset 0 0 100px ${color}`;
  
  overlay.classList.add('active');

  setTimeout(() => {
    overlay.classList.remove('active');
  }, 80);
}
