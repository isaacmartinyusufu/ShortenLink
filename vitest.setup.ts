import "@testing-library/jest-dom/vitest";

// Polyfill ResizeObserver for recharts in jsdom.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error - jsdom global
globalThis.ResizeObserver = globalThis.ResizeObserver ?? RO;
