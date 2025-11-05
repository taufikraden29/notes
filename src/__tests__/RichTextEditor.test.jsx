import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RichTextEditor from '../components/RichTextEditor';
import { autoSaveNote } from '../services/notes';

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((content) => content),
}));

// Mock the autoSaveNote service
jest.mock('../services/notes', () => ({
  autoSaveNote: jest.fn(() => Promise.resolve({})),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock document.execCommand
Object.defineProperty(document, 'execCommand', {
  value: jest.fn(),
});

// Mock window.getSelection
Object.defineProperty(window, 'getSelection', {
  value: () => ({
    rangeCount: 1,
    getRangeAt: () => ({
      startContainer: {
        parentNode: {
          tagName: 'P',
          closest: jest.fn(),
        },
      },
    }),
  }),
  writable: true,
});

describe('RichTextEditor Component', () => {
  const mockOnChange = jest.fn();
  const mockOnAutoSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders RichTextEditor with default props', () => {
    render(
      <RichTextEditor 
        value="" 
        onChange={mockOnChange} 
      />
    );

    expect(screen.getByRole('textbox', { name: /textbox/i })).toBeInTheDocument();
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    expect(screen.getByTitle('Underline')).toBeInTheDocument();
  });

  test('renders with initial value', () => {
    const initialValue = '<p>Hello, world!</p>';
    render(
      <RichTextEditor 
        value={initialValue} 
        onChange={mockOnChange} 
      />
    );

    const editor = screen.getByRole('textbox', { name: /textbox/i });
    expect(editor).toHaveTextContent('Hello, world!');
  });

  test('calls onChange when content changes', () => {
    render(
      <RichTextEditor 
        value="" 
        onChange={mockOnChange} 
      />
    );

    const editor = screen.getByRole('textbox', { name: /textbox/i });
    fireEvent.input(editor, { target: { innerHTML: '<p>Updated content</p>' } });

    expect(mockOnChange).toHaveBeenCalledWith('<p>Updated content</p>');
  });

  test('handles formatting commands', () => {
    render(
      <RichTextEditor 
        value="" 
        onChange={mockOnChange} 
      />
    );

    const boldButton = screen.getByTitle('Bold');
    fireEvent.click(boldButton);

    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
  });

  test('handles link insertion', () => {
    // Mock prompt to return a URL
    window.prompt = jest.fn(() => 'https://example.com');
    
    render(
      <RichTextEditor 
        value="" 
        onChange={mockOnChange} 
      />
    );

    const linkButton = screen.getByTitle('Insert Link');
    fireEvent.click(linkButton);

    expect(window.prompt).toHaveBeenCalledWith('Enter the URL:');
    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
  });

  test('rejects invalid URLs', () => {
    // Mock prompt to return an invalid URL
    window.prompt = jest.fn(() => 'javascript:alert(1)');
    window.alert = jest.fn();
    
    render(
      <RichTextEditor 
        value="" 
        onChange={mockOnChange} 
      />
    );

    const linkButton = screen.getByTitle('Insert Link');
    fireEvent.click(linkButton);

    expect(window.alert).toHaveBeenCalledWith('Invalid URL. Only HTTP, HTTPS, and mailto links are allowed.');
  });

  test('sanitizes pasted content', () => {
    render(
      <RichTextEditor 
        value="" 
        onChange={mockOnChange} 
      />
    );

    const editor = screen.getByRole('textbox', { name: /textbox/i });
    fireEvent.paste(editor, {
      clipboardData: {
        getData: jest.fn(() => '<script>alert("xss")</script><p>Safe content</p>'),
      },
    });

    expect(document.execCommand).toHaveBeenCalledWith('insertHTML', false, expect.any(String));
  });

  test('auto-saves content when noteId is provided', async () => {
    const noteId = 'test-note-id';
    const content = '<p>Test content</p>';
    
    jest.useFakeTimers();
    
    render(
      <RichTextEditor 
        value={content} 
        onChange={mockOnChange}
        noteId={noteId}
        autoSave={true}
        onAutoSave={mockOnAutoSave}
      />
    );

    // Fast-forward time to trigger auto-save
    jest.advanceTimersByTime(30000); // 30 seconds

    await waitFor(() => {
      expect(mockOnAutoSave).toHaveBeenCalledWith(noteId, content);
    });

    jest.useRealTimers();
  });

  test('auto-saves to local storage when noteId is provided', () => {
    const noteId = 'test-note-id';
    const content = '<p>Test content</p>';
    
    render(
      <RichTextEditor 
        value={content} 
        onChange={mockOnChange}
        noteId={noteId}
        autoSave={true}
      />
    );

    // Trigger auto-save by simulating content change
    const editor = screen.getByRole('textbox', { name: /textbox/i });
    fireEvent.input(editor, { target: { innerHTML: '<p>Updated content</p>' } });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      `draft_${noteId}`,
      '<p>Updated content</p>'
    );
  });

  test('loads draft from local storage if available', () => {
    const noteId = 'test-note-id';
    const draftContent = '<p>Draft content</p>';
    
    localStorageMock.getItem.mockReturnValue(draftContent);
    
    render(
      <RichTextEditor 
        value="" 
        onChange={mockOnChange}
        noteId={noteId}
        autoSave={true}
      />
    );

    expect(mockOnChange).toHaveBeenCalledWith(draftContent);
  });

  test('displays auto-save status correctly', async () => {
    const noteId = 'test-note-id';
    const content = '<p>Test content</p>';
    
    // Mock successful auto-save
    mockOnAutoSave.mockResolvedValueOnce(Promise.resolve());
    
    render(
      <RichTextEditor 
        value={content} 
        onChange={mockOnChange}
        noteId={noteId}
        autoSave={true}
        onAutoSave={mockOnAutoSave}
      />
    );

    // Initially should show "Auto-save enabled"
    expect(screen.getByText('Auto-save enabled')).toBeInTheDocument();

    // Trigger auto-save
    const editor = screen.getByRole('textbox', { name: /textbox/i });
    fireEvent.input(editor, { target: { innerHTML: '<p>Updated content</p>' } });

    // Should show "Saving..."
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    await waitFor(() => {
      // Should show "Saved" after successful save
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  test('shows error status when auto-save fails', async () => {
    const noteId = 'test-note-id';
    const content = '<p>Test content</p>';
    
    // Mock failed auto-save
    mockOnAutoSave.mockRejectedValueOnce(new Error('Auto-save failed'));
    
    render(
      <RichTextEditor 
        value={content} 
        onChange={mockOnChange}
        noteId={noteId}
        autoSave={true}
        onAutoSave={mockOnAutoSave}
      />
    );

    // Trigger auto-save
    const editor = screen.getByRole('textbox', { name: /textbox/i });
    fireEvent.input(editor, { target: { innerHTML: '<p>Updated content</p>' } });

    await waitFor(() => {
      // Should show "Save failed" after failed save
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});