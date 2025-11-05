import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from '../components/Navigation';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock context hooks
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockLogout = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

// Mock window.matchMedia for theme testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock AuthProvider and ThemeProvider components
const MockAuthProvider = ({ children }) => {
  const mockAuthValue = {
    user: { $id: 'user123', name: 'Test User', email: 'test@example.com' },
    logout: mockLogout,
    loading: false,
  };
  
  useAuth.mockReturnValue(mockAuthValue);
  return <div>{children}</div>;
};

const MockThemeProvider = ({ children }) => {
  const mockThemeValue = {
    theme: 'light',
    toggleTheme: jest.fn(),
  };
  
  useTheme.mockReturnValue(mockThemeValue);
  return <div>{children}</div>;
};

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    useAuth.mockReturnValue({
      user: { $id: 'user123', name: 'Test User', email: 'test@example.com' },
      logout: mockLogout,
      loading: false,
    });
    
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
  });

  test('renders navigation for authenticated user', () => {
    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    expect(screen.getByText('BlogMe')).toBeInTheDocument();
    expect(screen.getByText('Blog Posts')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle theme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Post/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  test('does not render navigation for unauthenticated user', () => {
    useAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      loading: false,
    });

    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    // Navigation should not render when user is not authenticated
    expect(screen.queryByText('BlogMe')).not.toBeInTheDocument();
  });

  test('does not render navigation on login page', () => {
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useLocation: () => ({ pathname: '/login' }),
    }));

    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    // Navigation should not render on login page
    expect(screen.queryByText('BlogMe')).not.toBeInTheDocument();
  });

  test('toggles mobile menu on small screens', () => {
    // Mock small screen (mobile view)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    });

    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    // Initially, mobile menu should be hidden (not in document)
    expect(screen.queryByText('Blog Posts')).not.toBeInTheDocument();

    // Click the mobile menu button
    const mobileMenuButton = screen.getByRole('button', { name: '' }); // The hamburger/close button
    fireEvent.click(mobileMenuButton);

    // Mobile menu items should now be visible
    expect(screen.getByText('Blog Posts')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();

    // Click the button again to close the menu
    fireEvent.click(mobileMenuButton);

    // Mobile menu items should be hidden again
    expect(screen.queryByText('Blog Posts')).not.toBeInTheDocument();
  });

  test('renders desktop navigation items on larger screens', () => {
    // Mock large screen (desktop view)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    // Desktop navigation items should be visible
    expect(screen.getByText('Blog Posts')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    
    // Mobile menu button should be present but desktop items visible
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  test('handles logout functionality', () => {
    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('navigates to new post page', () => {
    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    const newPostButton = screen.getByRole('button', { name: /New Post/i });
    fireEvent.click(newPostButton);

    expect(mockNavigate).toHaveBeenCalledWith('/note/new');
  });

  test('navigates to dashboard when clicking on blog posts link', () => {
    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    const blogPostsLink = screen.getByText('Blog Posts').closest('a');
    fireEvent.click(blogPostsLink);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('navigates to categories when clicking on categories link', () => {
    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    const categoriesLink = screen.getByText('Categories').closest('a');
    fireEvent.click(categoriesLink);

    expect(mockNavigate).toHaveBeenCalledWith('/categories');
  });

  test('applies correct styling based on current route', () => {
    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    // Check that dashboard link is marked as active when on dashboard
    const dashboardLink = screen.getByText('Blog Posts').closest('a');
    expect(dashboardLink).toHaveClass('border-indigo-500', 'text-gray-900');
  });

  test('renders theme-appropriate styling', () => {
    // Test with light theme
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });

    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    // Check that light theme classes are applied
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-white');

    // Test with dark theme
    useTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: jest.fn(),
    });

    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    // Check that dark theme classes are applied
    const darkNav = screen.getByRole('navigation');
    expect(darkNav).toHaveClass('bg-gray-800');
  });

  test('mobile menu closes when navigating to a page', async () => {
    // Mock small screen (mobile view)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    });

    render(
      <MockAuthProvider>
        <MockThemeProvider>
          <Navigation />
        </MockThemeProvider>
      </MockAuthProvider>
    );

    // Open mobile menu
    const mobileMenuButton = screen.getByRole('button', { name: '' });
    fireEvent.click(mobileMenuButton);

    // Verify menu is open
    expect(screen.getByText('Blog Posts')).toBeInTheDocument();

    // Click on a navigation item (this should close the menu)
    const blogPostsLink = screen.getByText('Blog Posts');
    fireEvent.click(blogPostsLink);

    // Wait for potential state updates
    await waitFor(() => {
      // Menu should close after clicking a link
      expect(screen.queryByText('Blog Posts')).not.toBeInTheDocument();
    });
  });
});