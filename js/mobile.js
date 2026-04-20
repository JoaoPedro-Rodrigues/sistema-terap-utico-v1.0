// ─── Mobile Navigation ───────────────────────────────

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle  = document.getElementById('menu-toggle');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay && overlay.classList.add('visible');
    toggle && toggle.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle  = document.getElementById('menu-toggle');
  if (!sidebar) return;
  sidebar.classList.remove('open');
  overlay && overlay.classList.remove('visible');
  toggle && toggle.classList.remove('open');
  document.body.style.overflow = '';
}

// Fechar com tecla ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSidebar();
});

// Swipe para fechar sidebar (deslizar para a esquerda)
(function() {
  let startX = 0;
  let startY = 0;
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  sidebar.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && dx < -60) {
      closeSidebar();
    }
  }, { passive: true });
})();

// Swipe para abrir sidebar (deslizar da borda esquerda)
(function() {
  let startX = 0;
  document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const sidebar = document.getElementById('sidebar');
    if (startX < 20 && dx > 60 && sidebar && !sidebar.classList.contains('open')) {
      toggleSidebar();
    }
  }, { passive: true });
})();

// Fechar modal ao puxar para baixo (bottom sheet feel)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    const modal = overlay.querySelector('.modal');
    if (!modal) return;

    let startY = 0;
    modal.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    modal.addEventListener('touchend', e => {
      const dy = e.changedTouches[0].clientY - startY;
      if (dy > 80 && modal.scrollTop === 0) {
        overlay.classList.remove('open');
      }
    }, { passive: true });
  });

  // Fechar modais com overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Fechar modais com botão X
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('open');
    });
  });
});
