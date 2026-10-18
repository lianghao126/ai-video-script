(() => {
  'use strict';
  // 仅切换说明内容，不创建订单、认证状态或积分记录。
  const plans = {
    free: { name: '免费版', detail: '20 积分（示例额度），演示价格 ¥0。展示基础分镜生成、编辑与导出功能。' },
    basic: { name: '基础版', detail: '300 积分（示例额度），演示价格待定。展示更高使用额度与历史记录权益。' },
    pro: { name: '专业版', detail: '1500 积分（示例额度），演示价格待定。展示更高额度、历史记录与尚未接入的高级能力。' }
  };
  const panel = document.getElementById('plan-explanation');
  const title = document.getElementById('explanation-title');
  const detail = document.getElementById('explanation-detail');
  const feedback = document.getElementById('pricing-feedback');
  const buttons = Array.from(document.querySelectorAll('[data-plan]'));
  let trigger = null;
  function close() {
    panel.hidden = true;
    buttons.forEach(button => button.setAttribute('aria-expanded', 'false'));
    feedback.textContent = '已收起套餐说明，没有变更套餐或积分。';
    if (trigger) trigger.focus();
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const plan = plans[button.dataset.plan];
    if (!plan) return;
    trigger = button;
    title.textContent = plan.name + ' · 教学方案说明';
    detail.textContent = plan.detail;
    panel.hidden = false;
    buttons.forEach(item => item.setAttribute('aria-expanded', String(item === button)));
    feedback.textContent = '正在查看' + plan.name + '的演示说明，未开通或扣费。';
    title.focus({ preventScroll: true });
    panel.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }));
  document.getElementById('close-explanation').addEventListener('click', close);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
  });
})();
