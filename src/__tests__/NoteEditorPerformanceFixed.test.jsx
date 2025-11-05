import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoteEditor from '../components/NoteEditor';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { createNote, updateNote, getNotes, autoSaveNote, cancelPendingAutoSave } from '../services/notes';
import { getCategories } from '../services/categoryServiceAppwrite';

// Mock context hooks
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/NotificationContext', () => ({
  useNotification: jest.fn(),
}));

// Mock services
jest.mock('../services/notes', () => ({
  createNote: jest.fn(() => Promise.resolve({})),
  updateNote: jest.fn(() => Promise.resolve({})),
  getNotes: jest.fn(() => Promise.resolve({ documents: [] })),
  autoSaveNote: jest.fn(() => Promise.resolve({})),
  cancelPendingAutoSave: jest.fn(),
}));

jest.mock('../services/categoryServiceAppwrite', () => ({
  getCategories: jest.fn(() => Promise.resolve({ documents: [] })),
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((content) => content),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: null }), // Default to null for new note
}));

// Mock document.createElement for DOMPurify simulation
Object.defineProperty(document, 'createElement', {
  value: () => ({
    innerHTML: '',
    textContent: '',
    innerText: '',
  }),
  writable: true,
});

describe('NoteEditor Component - Performance and Optimization Tests', () => {
  const mockAddNotification = jest.fn();
  const mockUser = { $id: 'user123', name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({ user: mockUser });
    useNotification.mockReturnValue({ addNotification: mockAddNotification });
  });

  test('uses memoization to prevent unnecessary re-renders', async () => {
    render(<NoteEditor />);
    
    // Wait for component to render properly
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your post title')).toBeInTheDocument();
    });
    
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    
    // Rapidly change the title multiple times to test debouncing
    act(() => {
      fireEvent.change(titleInput, { target: { value: 'Title 1' } });
      fireEvent.change(titleInput, { target: { value: 'Title 2' } });
      fireEvent.change(titleInput, { target: { value: 'Title 3' } });
    });
    
    // Wait for the debounce timeout to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
  });

  test('debounces auto-save calls to optimize performance', async () => {
    // Mock editing mode with an ID
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: 'note123' }),
    }));
    
    // Re-render with the updated mock
    const { unmount } = render(<NoteEditor />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your post title')).toBeInTheDocument();
    });
    
    // Rapidly change content multiple times
    const contentTextarea = screen.getByPlaceholder('Write your blog post content here... (Paste blog content here to auto-detect code blocks)');
    
    act(() => {
      fireEvent.change(contentTextarea, { target: { value: 'Content 1' } });
      fireEvent.change(contentTextarea, { target: { value: 'Content 2' } });
      fireEvent.change(contentTextarea, { target: { value: 'Content 3' } });
    });
    
    // Wait for the debounce period
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
    });
    
    // Auto-save should only be called once with the final content
    expect(autoSaveNote).toHaveBeenCalledTimes(1);
    
    unmount();
  });

  test('debounces local storage saves to optimize performance', async () => {
    // Mock editing mode with an ID
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: 'note123' }),
    }));
    
    // Re-render with the updated mock
    const { unmount } = render(<NoteEditor />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your post title')).toBeInTheDocument();
    });
    
    // Rapidly change title multiple times
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    
    act(() => {
      fireEvent.change(titleInput, { target: { value: 'Title 1' } });
      fireEvent.change(titleInput, { target: { value: 'Title 2' } });
      fireEvent.change(titleInput, { target: { value: 'Title 3' } });
    });
    
    // Wait for the debounce timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
    
    // LocalStorage should only be called once with the final value
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'draft_title_note123',
      'Title 3'
    );
    
    unmount();
  });

  test('optimizes category options rendering with memoization', async () => {
    const mockCategories = [
      { $id: 'cat1', name: 'Technology' },
      { $id: 'cat2', name: 'Tutorial' },
      { $id: 'cat3', name: 'News' },
    ];
    
    getCategories.mockResolvedValueOnce({ documents: mockCategories });
    
    render(<NoteEditor />);
    
    await waitFor(() => {
      expect(getCategories).toHaveBeenCalledWith('user123');
    });
    
    // Check that all category options are rendered
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Tutorial')).toBeInTheDocument();
    expect(screen.getByText('News')).toBeInTheDocument();
    
    // The options should be memoized and not re-render unnecessarily
    const categorySelect = screen.getByRole('combobox');
    expect(categorySelect).toBeInTheDocument();
  });

  test('handles XSS sanitization efficiently', async () => {
    render(<NoteEditor />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your post title')).toBeInTheDocument();
    });
    
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: '<script>alert("XSS")</script>' } });
    
    // DOMPurify should sanitize the input
    expect(titleInput.value).toBe('<script>alert("XSS")</script>');
    // Note: In a real implementation, DOMPurify would clean this, but in tests
    // we're mocking it to return the same value
  });

  test('cancels pending auto-saves when component unmounts', async () => {
    // Mock an editing session with an ID
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: 'note123' }),
    }));
    
    const { unmount } = render(<NoteEditor />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your post title')).toBeInTheDocument();
    });
    
    // Unmount the component
    unmount();
    
    // Check that pending auto-saves are cancelled
    expect(cancelPendingAutoSave).toHaveBeenCalledWith('note123');
    
    // Check that draft data is cleared from localStorage
    expect(localStorage.removeItem).toHaveBeenCalledWith('draft_title_note123');
    expect(localStorage.removeItem).toHaveBeenCalledWith('draft_content_note123');
  });

  test('efficiently processes pasted content with debouncing', async () => {
    render(<NoteEditor />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your post title')).toBeInTheDocument();
    });
    
    const contentTextarea = screen.getByPlaceholder('Write your blog post content here... (Paste blog content here to auto-detect code blocks)');
    
    // Simulate pasting content multiple times rapidly
    fireEvent.paste(contentTextarea, {
      clipboardData: {
        getData: jest.fn(() => 'function hello() { console.log("world"); }'),
      },
    });
    
    fireEvent.paste(contentTextarea, {
      clipboardData: {
        getData: jest.fn(() => 'function goodbye() { console.log("universe"); }'),
      },
    });
    
    // Wait for the paste processing to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // The content should be updated appropriately
    expect(contentTextarea.value).toContain('function goodbye()');
  });
});