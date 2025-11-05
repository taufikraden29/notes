import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Jest provides afterEach globally
afterEach(() => {
  cleanup();
});

// Mock TextEncoder and TextDecoder for jsdom
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;