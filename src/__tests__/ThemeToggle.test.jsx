import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '../components/ThemeToggle';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test component to access theme context
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <ThemeToggle />
      <button onClick={toggleTheme} data-testid="context-toggle">
        Toggle via context
      </button>
    </div>
  );
};

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  test('renders theme toggle button with light theme icon initially', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check that the theme is light by default
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    
    // Check that the moon icon is shown for light theme (dark mode toggle)
    const themeButton = screen.getByRole('button', { name: /Toggle theme/i });
    expect(themeButton.querySelector('svg path[d*="M20.354 15.354A9 9 0 018.646 3.606"]')).toBeInTheDocument();
  });

  test('toggles theme from light to dark', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial state should be light
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Click the theme toggle button
    const themeButton = screen.getByRole('button', { name: /Toggle theme/i });
    fireEvent.click(themeButton);

    // Wait for the state update
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    // Check that the theme has been applied to the document
    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
    // Check that the icon changed to the sun icon (for dark theme)
    expect(themeButton.querySelector('svg path[d*="M12 3v1m0 16v1m9-9h-1"]')).toBeInTheDocument();
  });

  test('toggles theme from dark to light', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Toggle to dark first
    const themeButton = screen.getByRole('button', { name: /Toggle theme/i });
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    // Then toggle back to light
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    // Check that the theme has been applied to the document
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    
    // Check that the icon changed back to the moon icon
    expect(themeButton.querySelector('svg path[d*="M20.354 15.354A9 9 0 018.646 3.606"]')).toBeInTheDocument();
  });

  test('uses system preference for initial theme when no saved theme exists', async () => {
    // Mock system preference to be dark
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: true, // System prefers dark
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should start with dark theme based on system preference
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  test('uses saved theme preference over system preference', async () => {
    localStorageMock.getItem.mockReturnValue('light'); // User preference is light
    
    // Mock system preference to be dark
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: true, // System prefers dark
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should use saved preference (light) over system preference (dark)
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  test('saves theme preference to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Toggle theme
    const themeButton = screen.getByRole('button', { name: /Toggle theme/i });
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    // Toggle back
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  test('applies theme class to document element', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Start with light theme
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Toggle to dark
    const themeButton = screen.getByRole('button', { name: /Toggle theme/i });
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    // Toggle back to light
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  test('has proper accessibility attributes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const themeButton = screen.getByRole('button', { name: /Toggle theme/i });
    expect(themeButton).toHaveAttribute('aria-label', 'Toggle theme');
    expect(themeButton).toHaveAttribute('type', 'button');
  });
});