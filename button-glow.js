'use strict';

// 仅测量视口附近的按钮；滚动时暂停光效，避免跟随滚动重复布局与绘制。
(() => {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = Array.from(document.querySelectorAll('.button, .nav-cta, .example-button, .text-button, .upload-zone, .glass-select-trigger'));
  targets.forEach(button => button.classList.add('button-glow'));
  const reach = 64;
  let point = null;
  let frame = 0;
  let dirty = true;
  let measuredAt = -Infinity;
  const bounds = new Map();
  const values = new Map();
  const visible = new Set(targets);
  const lit = new Set();
  if (typeof IntersectionObserver !== 'undefined') {
    visible.clear();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else { visible.delete(entry.target); unlight(entry.target); }
      });
      dirty = true;
    }, { rootMargin: '64px' });
    targets.forEach(button => observer.observe(button));
  }

  function set(button, name, value) {
    let previous = values.get(button);
    if (!previous) { previous = {}; values.set(button, previous); }
    if (previous[name] === value) return;
    button.style.setProperty(name, value);
    previous[name] = value;
  }
  function unlight(button) {
    if (lit.delete(button)) set(button, '--button-glow', '0');
  }

  function clear() {
    point = null;
    cancelAnimationFrame(frame);
    frame = 0;
    lit.forEach(unlight);
  }
  function paint(timestamp) {
    frame = 0;
    if (!point || !finePointer.matches || reducedMotion.matches) return;
    if (dirty || timestamp - measuredAt > 120) {
      // 本阶段只读取位置；不能在循环内夹杂 style 写入。
      visible.forEach(button => { bounds.set(button, button.getBoundingClientRect()); });
      dirty = false;
      measuredAt = timestamp;
    }
    for (const button of visible) {
      const rect = bounds.get(button);
      if (button.disabled || button.getAttribute('aria-disabled') === 'true' || !rect?.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) {
        unlight(button);
        continue;
      }
      const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
      const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
      const distance = Math.hypot(dx, dy);
      const strength = Math.pow(Math.max(0, 1 - distance / reach), 1.6);
      if (strength > 0) {
        // 固定渐变位置，仅改变透明度，避免鼠标每移动一像素就重绘渐变。
        lit.add(button);
        set(button, '--button-glow', (Math.round(strength * 10) / 10).toFixed(1));
      } else unlight(button);
    }
  }
  function schedule() {
    if (!frame && point) frame = requestAnimationFrame(paint);
  }
  function invalidate() { dirty = true; }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches || reducedMotion.matches) return;
    point = { x: event.clientX, y: event.clientY };
    schedule();
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    invalidate();
    if (event.pointerType !== 'mouse') clear();
  }, { passive: true });
  document.addEventListener('pointerleave', clear);
  document.addEventListener('scroll', () => { invalidate(); clear(); }, { passive: true, capture: true });
  document.addEventListener('focusin', invalidate);
  window.addEventListener('resize', () => { invalidate(); schedule(); }, { passive: true });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(invalidate).observe(document.body);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  window.addEventListener('blur', clear);
  finePointer.addEventListener('change', clear);
  reducedMotion.addEventListener('change', clear);
})();
