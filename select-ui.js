'use strict';

// 保留原生 select 作为表单数据来源，只增强展开菜单的显示与操作。
(() => {
  let opened = null;

  function enhanceSelect(select) {
    const wrapper = document.createElement('div');
    wrapper.className = 'glass-select';
    select.before(wrapper);
    wrapper.append(select);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'glass-select-trigger';
    trigger.id = select.id + '-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', select.id + '-menu');

    const value = document.createElement('span');
    value.className = 'glass-select-value';
    const arrow = document.createElement('span');
    arrow.className = 'glass-select-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    trigger.append(value, arrow);

    const label = document.querySelector('label[for="' + select.id + '"]');
    if (label) {
      label.id ||= select.id + '-label';
      label.htmlFor = trigger.id;
      trigger.setAttribute('aria-labelledby', label.id);
    }
    const menu = document.createElement('ul');
    menu.className = 'glass-select-menu';
    menu.id = select.id + '-menu';
    menu.setAttribute('role', 'listbox');
    if (label) menu.setAttribute('aria-labelledby', label.id);
    menu.hidden = true;
    const options = Array.from(select.options);
    const items = options.map((option, index) => {
      const item = document.createElement('li');
      item.className = 'glass-select-option';
      item.id = select.id + '-option-' + index;
      item.setAttribute('role', 'option');
      const text = document.createElement('span');
      text.textContent = option.textContent;
      const check = document.createElement('span');
      check.className = 'glass-select-check';
      check.textContent = '✓';
      check.setAttribute('aria-hidden', 'true');
      item.append(text, check);
      item.addEventListener('mousedown', event => event.preventDefault());
      item.addEventListener('click', () => choose(index));
      menu.append(item);
      return item;
    });
    wrapper.append(trigger, menu);
    select.classList.add('glass-select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    let active = select.selectedIndex;

    function sync() {
      value.textContent = options[select.selectedIndex]?.textContent || '请选择';
      items.forEach((item, index) => item.setAttribute('aria-selected', String(index === select.selectedIndex)));
      trigger.disabled = select.disabled;
    }
    function close() {
      menu.hidden = true;
      wrapper.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      if (opened === control) opened = null;
    }
    function placeMenu() {
      const rect = trigger.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) { close(); return; }
      const desired = Math.min(280, menu.scrollHeight + 2);
      const below = window.innerHeight - rect.bottom - 16;
      const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
      const above = Math.max(0, rect.top - Math.max(16, headerBottom + 36));
      const up = below < desired && above > below;
      wrapper.dataset.side = up ? 'top' : 'bottom';
      menu.style.maxHeight = Math.max(64, Math.min(desired, up ? above : below)) + 'px';
    }
    function highlight(index) {
      active = Math.max(0, Math.min(items.length - 1, index));
      items.forEach((item, i) => item.classList.toggle('is-active', i === active));
      const item = items[active];
      trigger.setAttribute('aria-activedescendant', item.id);
      if (item.offsetTop < menu.scrollTop) menu.scrollTop = item.offsetTop;
      if (item.offsetTop + item.offsetHeight > menu.scrollTop + menu.clientHeight) {
        menu.scrollTop = item.offsetTop + item.offsetHeight - menu.clientHeight;
      }
    }
    function open(index = select.selectedIndex) {
      if (trigger.disabled) return;
      if (opened && opened !== control) opened.close();
      sync();
      opened = control;
      menu.hidden = false;
      wrapper.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      placeMenu();
      if (!menu.hidden) highlight(index);
    }
    function choose(index) {
      select.selectedIndex = index;
      sync();
      close();
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      trigger.focus({ preventScroll: true });
    }
    const control = { wrapper, menu, close, placeMenu };
    trigger.addEventListener('click', () => menu.hidden ? open() : close());
    trigger.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (event.key === 'Enter' || event.key === ' ') {
          if (menu.hidden) open(); else choose(active);
        } else if (event.key === 'Home' || event.key === 'End') {
          const index = event.key === 'Home' ? 0 : items.length - 1;
          if (menu.hidden) open(index); else highlight(index);
        } else if (menu.hidden) open();
        else highlight(active + (event.key === 'ArrowDown' ? 1 : -1));
      } else if (event.key === 'Escape' && !menu.hidden) {
        event.preventDefault();
        close();
      } else if (event.key === 'Tab') close();
    });
    wrapper.addEventListener('focusout', event => {
      if (!wrapper.contains(event.relatedTarget)) close();
    });
    select.addEventListener('change', sync);
    sync();
  }

  document.querySelectorAll('#requirements-form select').forEach(enhanceSelect);
  document.addEventListener('pointerdown', event => {
    if (opened && !opened.wrapper.contains(event.target)) opened.close();
  });
  window.addEventListener('resize', () => { if (opened) opened.placeMenu(); });
  document.addEventListener('scroll', event => {
    if (opened && event.target !== opened.menu) opened.placeMenu();
  }, true);
})();
