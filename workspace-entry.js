'use strict';

// 跨页示例入口复用工作台原有填充逻辑，不自动生成。
(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('example') !== '1' || params.has('history-source')) return;
  document.getElementById('fill-example').click();
  try {
    const url = new URL(location.href);
    url.searchParams.delete('example');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch (_) { /* 地址限制不影响表单演示。 */ }
})();
