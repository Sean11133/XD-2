import "@testing-library/jest-dom";

// jsdom 不實作 scrollIntoView，補上 stub 避免 LogPanel 測試失敗
window.HTMLElement.prototype.scrollIntoView = function () {};
