import '@testing-library/jest-dom/vitest';
// vitest compiles JSX with the classic runtime for modules that do not import
// React (most components here). Expose React globally so those modules can
// render in tests without each one adding an unused import.
import React from 'react';

globalThis.React = React;

// jsdom implements no layout, so `scrollIntoView` is missing entirely and any
// component that scrolls a list throws on mount. The chat view does exactly
// that after every message.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom ships no matchMedia, and three different places read it at module load:/n// the theme preference, the landing's motion switch and its pointer-capability
// check. Default answer: the query does not match.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
}
