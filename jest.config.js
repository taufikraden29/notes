export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/testSetup.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(dompurify)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/public/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/index.{js,jsx}',
    '!src/**/App.{js,jsx}',
    '!src/**/main.{js,jsx}',
    '!src/**/services/appwrite.js',
    '!src/**/__tests__/**',
  ],
};