/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

// Augment Vitest's expect with jest-dom matchers
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<R = any> extends TestingLibraryMatchers<R, void> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
