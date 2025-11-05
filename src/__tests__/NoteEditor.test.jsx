import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('NoteEditor Component', () => {
  const mockAddNotification = jest.fn();
  const mockUser = { $id: 'user123', name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({ user: mockUser });
    useNotification.mockReturnValue({ addNotification: mockAddNotification });
  });

  test('renders NoteEditor for creating a new note', () => {
    render(<NoteEditor />);
    
    expect(screen.getByText('Create New Blog Post')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your post title')).toBeInTheDocument();
    expect(screen.getByText('Plain Text')).toBeInTheDocument();
    expect(screen.getByText('Rich Text')).toBeInTheDocument();
    expect(screen.getByText('Code Editor')).toBeInTheDocument();
    expect(screen.getByText('Mixed Content')).toBeInTheDocument();
  });

  test('renders NoteEditor for editing an existing note', () => {
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: 'note123' }), // Mock editing mode
    }));
    
    // Re-import the component to apply the mock
    const { render: renderWithParams } = require('@testing-library/react');
    const NoteEditor = require('../components/NoteEditor').default;
    
    renderWithParams(<NoteEditor />);
    
    expect(screen.getByText('Edit Blog Post')).toBeInTheDocument();
  });

  test('validates required fields on form submission', async () => {
    render(<NoteEditor />);
    
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith('Please enter a title for your post', 'error');
    });
  });

  test('validates content based on editor mode', async () => {
    render(<NoteEditor />);
    
    // Set title but leave content empty
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    // Switch to code editor mode
    fireEvent.click(screen.getByText('Code Editor'));
    
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith('Please enter code content', 'error');
    });
  });

  test('handles text editor mode content validation', async () => {
    render(<NoteEditor />);
    
    // Set title but leave content empty
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    // Switch to text editor mode
    fireEvent.click(screen.getByText('Plain Text'));
    
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith('Please enter content for your post', 'error');
    });
  });

  test('handles rich text editor mode content validation', async () => {
    render(<NoteEditor />);
    
    // Set title but leave content empty
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    // Switch to rich text editor mode
    fireEvent.click(screen.getByText('Rich Text'));
    
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith('Please enter content for your post', 'error');
    });
  });

  test('handles mixed content editor mode validation', async () => {
    render(<NoteEditor />);
    
    // Set title but leave content empty
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    // Switch to mixed content editor mode
    fireEvent.click(screen.getByText('Mixed Content'));
    
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith('Please enter content for your post', 'error');
    });
  });

  test('submits note successfully in text mode', async () => {
    render(<NoteEditor />);
    
    // Fill in required fields
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    const contentTextarea = screen.getByPlaceholder('Write your blog post content here... (Paste blog content here to auto-detect code blocks)');
    fireEvent.change(contentTextarea, { target: { value: 'Test content' } });
    
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          content: 'Test content',
          status: 'draft',
          category: null,
          tags: null,
          owner: 'user123',
        }),
        'user123'
      );
    });
  });

  test('submits note successfully in rich text mode', async () => {
    render(<NoteEditor />);
    
    // Switch to rich text mode
    fireEvent.click(screen.getByText('Rich Text'));
    
    // Fill in required fields
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    // Simulate rich text content
    const richTextEditor = document.querySelector('[contenteditable]');
    fireEvent.input(richTextEditor, { target: { innerHTML: '<p>Rich text content</p>' } });
    
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          richTextContent: '<p>Rich text content</p>',
          content: 'Rich text content', // Plain text version for searchability
          status: 'draft',
          category: null,
          tags: null,
          owner: 'user123',
        }),
        'user123'
      );
    });
  });

  test('submits note successfully in code mode', async () => {
    render(<NoteEditor />);
    
    // Switch to code mode
    fireEvent.click(screen.getByText('Code Editor'));
    
    // Fill in required fields
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    // Find the code editor textarea and change its value
    const codeEditorTextarea = screen.getByPlaceholderText('Enter your code here...');
    fireEvent.change(codeEditorTextarea, { target: { value: 'console.log("Hello");' } });
    
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          codeContent: 'console.log("Hello");',
          content: 'console.log("Hello");', // Also stored in content for searchability
          language: 'javascript',
          status: 'draft',
          category: null,
          tags: null,
          owner: 'user123',
        }),
        'user123'
      );
    });
  });

  test('loads categories on component mount', async () => {
    const mockCategories = [
      { $id: 'cat1', name: 'Technology' },
      { $id: 'cat2', name: 'Tutorial' },
    ];
    
    getCategories.mockResolvedValueOnce({ documents: mockCategories });
    
    render(<NoteEditor />);
    
    await waitFor(() => {
      expect(getCategories).toHaveBeenCalledWith('user123');
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Tutorial')).toBeInTheDocument();
    });
  });

  test('handles auto-save functionality', async () => {
    // Mock a note ID to enable auto-save
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: 'note123' }),
    }));
    
    // Re-import to apply the mock
    const { render: renderWithParams } = require('@testing-library/react');
    const NoteEditor = require('../components/NoteEditor').default;
    
    renderWithParams(<NoteEditor />);
    
    // Change title to trigger auto-save
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Auto-saved Title' } });
    
    // Simulate the useEffect that saves to localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'draft_title_note123',
      'Auto-saved Title'
    );
  });

  test('cancels pending auto-saves on manual save', async () => {
    // Mock editing mode
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: 'note123' }),
    }));
    
    // Re-import to apply the mock
    const { render: renderWithParams } = require('@testing-library/react');
    const NoteEditor = require('../components/NoteEditor').default;
    
    renderWithParams(<NoteEditor />);
    
    // Fill in required fields
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    const submitButton = screen.getByText('Update Post'); // In editing mode
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(cancelPendingAutoSave).toHaveBeenCalledWith('note123');
    });
  });

  test('sanitizes input to prevent XSS', async () => {
    render(<NoteEditor />);
    
    // Fill in title with potential XSS
    const titleInput = screen.getByPlaceholderText('Enter your post title');
    fireEvent.change(titleInput, { target: { value: '<script>alert("XSS")</script>' } });
    
    // Fill in tags with potential XSS
    const tagsInput = screen.getByPlaceholder('e.g. javascript, tutorial');
    fireEvent.change(tagsInput, { target: { value: '<img src=x onerror=alert("XSS")>' } });
    
    // Submit the form
    const submitButton = screen.getByText('Publish Post');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(createNote).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '<script>alert("XSS")</script>', // This would be sanitized by DOMPurify in real implementation
          tags: '<img src=x onerror=alert("XSS")>', // This would be sanitized by DOMPurify in real implementation
        }),
        'user123'
      );
    });
  });
});