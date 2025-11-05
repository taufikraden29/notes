import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedRichTextEditor from '../components/EnhancedRichTextEditor';
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

// Mock window.prompt and window.alert
window.prompt = jest.fn();
window.alert = jest.fn();

describe('EnhancedRichTextEditor Component', () => {
  const mockOnChange = jest.fn();
  const mockOnAutoSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    window.prompt.mockReturnValue('https://example.com');
    document.execCommand.mockReturnValue(true);
  });

  test('renders EnhancedRichTextEditor with default props', () => {
    render(
      <EnhancedRichTextEditor 
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
      <EnhancedRichTextEditor 
        value={initialValue} 
        onChange={mockOnChange} 
      />
    );

    const editor = screen.getByRole('textbox', { name: /textbox/i });
    expect(editor).toHaveTextContent('Hello, world!');
  });

  test('calls onChange when content changes', () => {
    render(
      <EnhancedRichTextEditor 
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
      <EnhancedRichTextEditor 
        value="" 
        onChange={mockOnChange} 
      />
    );

    const boldButton = screen.getByTitle('Bold');
    fireEvent.click(boldButton);

    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
  });

  test('handles link insertion', () => {
    window.prompt.mockReturnValue('https://example.com');
    
    render(
      <EnhancedRichTextEditor 
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
    window.prompt.mockReturnValue('javascript:alert(1)');
    
    render(
      <EnhancedRichTextEditor 
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
      <EnhancedRichTextEditor 
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

  test('auto-saves content with debouncing when noteId is provided', async () => {
    const noteId = 'test-note-id';
    const content = '<p>Test content</p>';
    
    jest.useFakeTimers();
    
    render(
      <EnhancedRichTextEditor 
        value={content} 
        onChange={mockOnChange}
        noteId={noteId}
        autoSave={true}
        onAutoSave={mockOnAutoSave}
      />
    );

    // Simulate content change
    const editor = screen.getByRole('textbox', { name: /textbox/i });
    fireEvent.input(editor, { target: { innerHTML: '<p>Updated content</p>' } });

    // Fast-forward time to trigger auto-save (1 second debounce)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockOnAutoSave).toHaveBeenCalledWith(noteId, '<p>Updated content</p>');
    });

    jest.useRealTimers();
  });

  test('auto-saves to local storage when noteId is provided', () => {
    const noteId = 'test-note-id';
    const content = '<p>Test content</p>';
    
    render(
      <EnhancedRichTextEditor 
        value={content} 
        onChange={mockOnChange}
        noteId={noteId}
        autoSave={true}
      />
    );

    // Trigger auto-save by simulating content change
    const editor = screen.getByRole('textbox', { name: /textbox/i });
    fireEvent.input(editor, { target: { innerHTML: '<p>Updated content</p>' } });

    // The auto-save is debounced, so we need to wait for it to complete
    setTimeout(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `draft_${noteId}`,
        '<p>Updated content</p>'
      );
    }, 1500); // Wait longer than the debounce time
  });

  test('loads draft from local storage if available', () => {
    const noteId = 'test-note-id';
    const draftContent = '<p>Draft content</p>';
    
    localStorageMock.getItem.mockReturnValue(draftContent);
    
    render(
      <EnhancedRichTextEditor 
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
    
    jest.useFakeTimers();
    
    render(
      <EnhancedRichTextEditor 
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

    // Fast-forward time to trigger auto-save
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should show "Saving..." during the save process
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    await waitFor(() => {
      // Should show "Saved" after successful save
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('shows error status when auto-save fails', async () => {
    const noteId = 'test-note-id';
    const content = '<p>Test content</p>';
    
    // Mock failed auto-save
    mockOnAutoSave.mockRejectedValueOnce(new Error('Auto-save failed'));
    
    jest.useFakeTimers();
    
    render(
      <EnhancedRichTextEditor 
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

    // Fast-forward time to trigger auto-save
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      // Should show "Save failed" after failed save
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('calculates and displays word count and reading time', async () => {
    const content = '<p>This is a sample text with multiple words to test word count calculation.</p>';
    
    jest.useFakeTimers();
    
    render(
      <EnhancedRichTextEditor 
        value={content} 
        onChange={mockOnChange}
      />
    );

    // Fast-forward time to allow word count calculation (500ms debounce)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // The editor should show word count and reading time
    await waitFor(() => {
      const statusElement = screen.getByText(/Words: \d+ \| Reading time: \d+ min/);
      expect(statusElement).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('handles keyboard shortcuts', () => {
    render(
      <EnhancedRichTextEditor 
        value="" 
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByRole('textbox', { name: /textbox/i });
    
    // Test Ctrl+B for bold
    fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
    
    // Test Ctrl+I for italic
    fireEvent.keyDown(editor, { key: 'i', ctrlKey: true });
    expect(document.execCommand).toHaveBeenCalledWith('italic', false, null);
    
    // Test Ctrl+U for underline
    fireEvent.keyDown(editor, { key: 'u', ctrlKey: true });
    expect(document.execCommand).toHaveBeenCalledWith('underline', false, null);
    
    // Test Ctrl+K for link insertion
    fireEvent.keyDown(editor, { key: 'k', ctrlKey: true });
    expect(window.prompt).toHaveBeenCalledWith('Enter the URL:');
  });

  test('clears formatting when clear formatting button is clicked', () => {
    render(
      <EnhancedRichTextEditor 
        value="" 
        onChange={mockOnChange}
      />
    );

    const clearFormatButton = screen.getByTitle('Clear Formatting');
    fireEvent.click(clearFormatButton);

    expect(document.execCommand).toHaveBeenCalledWith('removeFormat');
  });

  test('inserts horizontal rule when HR button is clicked', () => {
    render(
      <EnhancedRichTextEditor 
        value="" 
        onChange={mockOnChange}
      />
    );

    const hrButton = screen.getByTitle('Insert Horizontal Rule');
    fireEvent.click(hrButton);

    expect(document.execCommand).toHaveBeenCalledWith('insertHorizontalRule');
  });

  test('handles image insertion', () => {
    window.prompt.mockReturnValue('https://example.com/image.jpg');
    
    render(
      <EnhancedRichTextEditor 
        value="" 
        onChange={mockOnChange}
      />
    );

    const imageButton = screen.getByTitle('Insert Image');
    fireEvent.click(imageButton);

    expect(window.prompt).toHaveBeenCalledWith('Enter the image URL:');
    expect(document.execCommand).toHaveBeenCalledWith('insertImage', false, 'https://example.com/image.jpg');
  });

  test('rejects invalid image URLs', () => {
    window.prompt.mockReturnValue('javascript:alert(1)');
    
    render(
      <EnhancedRichTextEditor 
        value="" 
        onChange={mockOnChange}
      />
    );

    const imageButton = screen.getByTitle('Insert Image');
    fireEvent.click(imageButton);

    expect(window.alert).toHaveBeenCalledWith('Invalid URL. Only HTTP and HTTPS image links are allowed.');
  });

  test('handles focus and blur events', () => {
    render(
      <EnhancedRichTextEditor 
        value="" 
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByRole('textbox', { name: /textbox/i });
    
    // Focus the editor
    fireEvent.focus(editor);
    
    // Check that focus-related text appears
    expect(screen.getByText(/Press Ctrl\+B for bold/)).toBeInTheDocument();
    
    // Blur the editor
    fireEvent.blur(editor);
    
    // Check that focus-related text disappears
    expect(screen.getByText(/Tip: Use formatting tools/)).toBeInTheDocument();
  });

  test('cancels pending timeouts on unmount', () => {
    const { unmount } = render(
      <EnhancedRichTextEditor 
        value="" 
        onChange={mockOnChange}
      />
    );

    // Mock setTimeout to track timers
    const originalSetTimeout = setTimeout;
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

    unmount();

    // Should clear any pending timeouts
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});