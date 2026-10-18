'use strict';

// 共用小屏导航：复用各页现有链接，支持键盘与点击外部关闭。
(() => {
  const nav = document.querySelector('.site-header .nav');
  if (!nav) return;
  const links = nav.querySelector('.nav-links');
  if (!links) return;
  links.id = 'primary-links';
  let toggle = document.getElementById('site-menu-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'site-menu-toggle';
    toggle.className = 'site-menu-toggle';
    toggle.textContent = '☰';
    nav.insertBefore(toggle, links);
  }
  toggle.setAttribute('aria-label', '打开导航菜单');
  toggle.setAttribute('aria-controls', links.id);
  toggle.setAttribute('aria-expanded', 'false');
  const mobile = matchMedia('(max-width: 1100px)');
  function close(focus = false) {
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开导航菜单');
    if (focus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  links.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true);
  });
  document.addEventListener('pointerdown', event => {
    if (!links.contains(event.target) && !toggle.contains(event.target)) close();
  });
  links.addEventListener('focusout', event => {
    if (!links.contains(event.relatedTarget) && event.relatedTarget !== toggle) close();
  });
  mobile.addEventListener('change', () => close());
  // 未加载脚本时显示常规链接，导航不会变成不可访问的隐藏菜单。
  document.body.classList.add('nav-ready');
})();
