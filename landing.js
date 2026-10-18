'use strict';

// 兼容旧的一页式工作台链接，不在产品首页加载生成业务。
(() => {
  function routeLegacyWorkspace() {
    const params = new URLSearchParams(location.search);
    if (location.hash !== '#generator' && !params.has('history-source')) return;
    location.replace(new URL('workspace.html' + location.search + '#generator', location.href).href);
  }
  routeLegacyWorkspace();
  window.addEventListener('hashchange', routeLegacyWorkspace);
})();
