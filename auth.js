'use strict';

// 只处理前端表单交互，不请求认证接口，也不写入任何浏览器存储。
(() => {
  const form = document.getElementById('auth-form');
  if (!form) return;
  const email = document.getElementById('auth-email');
  const password = document.getElementById('auth-password');
  const confirm = document.getElementById('auth-confirm');
  const fields = [email, password, confirm].filter(Boolean);
  const status = document.getElementById('auth-status');
  const success = document.getElementById('auth-success');
  const toggles = Array.from(form.querySelectorAll('[data-password-target]'));

  function clearError(field) {
    field.removeAttribute('aria-invalid');
    const error = document.getElementById(field.id + '-error');
    error.hidden = true;
    error.textContent = '';
  }

  function hidePasswords(clear = false) {
    toggles.forEach(button => {
      const input = document.getElementById(button.dataset.passwordTarget);
      input.type = 'password';
      if (clear) input.value = '';
      button.textContent = '显示';
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', input === confirm ? '显示确认密码' : '显示密码');
    });
  }

  toggles.forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordTarget);
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.textContent = visible ? '隐藏' : '显示';
      button.setAttribute('aria-pressed', String(visible));
      button.setAttribute('aria-label', (visible ? '隐藏' : '显示') + (input === confirm ? '确认密码' : '密码'));
    });
  });

  fields.forEach(field => field.addEventListener('input', () => {
    clearError(field);
    if (field === password && confirm) clearError(confirm);
    status.textContent = '';
    success.hidden = true;
  }));

  form.addEventListener('submit', event => {
    event.preventDefault();
    fields.forEach(clearError);
    success.hidden = true;
    const errors = new Map();
    if (!email.value.trim()) errors.set(email, '请填写邮箱。');
    else if (email.validity.typeMismatch || email.value.length > 254) errors.set(email, '请填写有效的邮箱，例如 demo@example.com。');
    if (!password.value.trim()) errors.set(password, '请填写测试密码，请勿使用真实密码。');
    else if (password.value.length < 8 || password.value.length > 128) errors.set(password, '密码请填写 8—128 个字符。');
    if (confirm) {
      if (!confirm.value) errors.set(confirm, '请再次输入测试密码。');
      else if (confirm.value !== password.value) errors.set(confirm, '两次密码不一致，请重新确认。');
    }
    if (errors.size) {
      errors.forEach((message, field) => {
        field.setAttribute('aria-invalid', 'true');
        const error = document.getElementById(field.id + '-error');
        error.textContent = message;
        error.hidden = false;
      });
      status.textContent = `请检查 ${errors.size} 处输入提示。`;
      const first = errors.keys().next().value;
      first.focus();
      return;
    }
    // 演示只展示校验结果，不建立模拟凭证或声称认证成功。
    hidePasswords(true);
    success.hidden = false;
    status.textContent = '前端格式校验通过；未发送数据，未进行真实认证。';
    const link = success.querySelector('a');
    link.focus({ preventScroll: true });
    success.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  const forgot = document.getElementById('forgot-password');
  forgot?.addEventListener('click', () => {
    const panel = document.getElementById('password-help');
    panel.hidden = !panel.hidden;
    forgot.setAttribute('aria-expanded', String(!panel.hidden));
  });

  // 监听器准备好后才启用输入；未加载脚本时不会提交表单。
  document.getElementById('auth-fields').disabled = false;
  window.addEventListener('pagehide', () => hidePasswords(true));
  window.addEventListener('pageshow', event => { if (event.persisted) hidePasswords(true); });
})();
