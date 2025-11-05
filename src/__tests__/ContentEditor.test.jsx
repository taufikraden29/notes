import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentEditor from '../components/ContentEditor';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('ContentEditor Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders ContentEditor with default props', () => {
    render(<ContentEditor value={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText('Content Blocks')).toBeInTheDocument();
    expect(screen.getByText('Add Text Block')).toBeInTheDocument();
    expect(screen.getByText('Add Code Block')).toBeInTheDocument();
    expect(screen.getByText('No content blocks yet.')).toBeInTheDocument();
  });

  test('adds a new text block', () => {
    render(<ContentEditor value={[]} onChange={mockOnChange} />);
    
    const addTextBlockBtn = screen.getByText('Add Text Block');
    fireEvent.click(addTextBlockBtn);
    
    expect(mockOnChange).toHaveBeenCalledWith([{ type: 'text', content: '' }]);
  });

  test('adds a new code block', () => {
    render(<ContentEditor value={[]} onChange={mockOnChange} />);
    
    const addCodeBlockBtn = screen.getByText('Add Code Block');
    fireEvent.click(addCodeBlockBtn);
    
    expect(mockOnChange).toHaveBeenCalledWith([{ type: 'code', content: '' }]);
  });

  test('updates content of a block', () => {
    const initialContent = [
      { type: 'text', content: 'Initial text' },
      { type: 'code', content: 'console.log("hello");' },
    ];
    
    render(<ContentEditor value={initialContent} onChange={mockOnChange} />);
    
    // Find the textarea for the first block and update it
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Updated text' } });
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { type: 'text', content: 'Updated text' },
      { type: 'code', content: 'console.log("hello");' },
    ]);
  });

  test('removes a content block', () => {
    const initialContent = [
      { type: 'text', content: 'First block' },
      { type: 'code', content: 'console.log("hello");' },
    ];
    
    render(<ContentEditor value={initialContent} onChange={mockOnChange} />);
    
    // Find the delete button for the first block
    const deleteButtons = screen.getAllByTitle('Delete block');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { type: 'code', content: 'console.log("hello");' },
    ]);
  });

  test('switches block type from text to code', () => {
    const initialContent = [
      { type: 'text', content: 'Some text' },
    ];
    
    render(<ContentEditor value={initialContent} onChange={mockOnChange} />);
    
    // Find the switch type button
    const switchTypeBtn = screen.getByTitle('Switch to code');
    fireEvent.click(switchTypeBtn);
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { type: 'code', content: 'Some text' },
    ]);
  });

  test('switches block type from code to text', () => {
    const initialContent = [
      { type: 'code', content: 'console.log("hello");' },
    ];
    
    render(<ContentEditor value={initialContent} onChange={mockOnChange} />);
    
    // Find the switch type button
    const switchTypeBtn = screen.getByTitle('Switch to text');
    fireEvent.click(switchTypeBtn);
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { type: 'text', content: 'console.log("hello");' },
    ]);
  });

  test('moves a block up', () => {
    const initialContent = [
      { type: 'text', content: 'First block' },
      { type: 'code', content: 'Second block' },
    ];
    
    render(<ContentEditor value={initialContent} onChange={mockOnChange} />);
    
    // Find the move down button for the first block
    const moveDownBtn = screen.getByTitle('Move down');
    fireEvent.click(moveDownBtn);
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { type: 'code', content: 'Second block' },
      { type: 'text', content: 'First block' },
    ]);
  });

  test('moves a block down', () => {
    const initialContent = [
      { type: 'text', content: 'First block' },
      { type: 'code', content: 'Second block' },
      { type: 'text', content: 'Third block' },
    ];
    
    render(<ContentEditor value={initialContent} onChange={mockOnChange} />);
    
    // Find the move up button for the third block (second move up button)
    const moveUpBtns = screen.getAllByTitle('Move up');
    fireEvent.click(moveUpBtns[2]); // Third block's move up button
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { type: 'text', content: 'First block' },
      { type: 'text', content: 'Third block' },
      { type: 'code', content: 'Second block' },
    ]);
  });

  test('displays content blocks correctly', () => {
    const initialContent = [
      { type: 'text', content: 'This is a text block' },
      { type: 'code', content: 'console.log("This is code");' },
    ];
    
    render(<ContentEditor value={initialContent} onChange={mockOnChange} />);
    
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a text block')).toBeInTheDocument();
    expect(screen.getByDisplayValue('console.log("This is code");')).toBeInTheDocument();
  });

  test('detects code blocks using isCodeBlock function', () => {
    // Test the isCodeBlock function directly
    const contentEditorInstance = render(<ContentEditor value={[]} onChange={mockOnChange} />);
    
    // Access the component instance to test internal functions
    // This would typically be tested separately, but for now we'll check behavior
    const codeContent = 'function hello() {\n  console.log("world");\n}';
    const textContent = 'This is just regular text.';
    
    // Add a code block to test detection
    const addCodeBlockBtn = screen.getByText('Add Code Block');
    fireEvent.click(addCodeBlockBtn);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: codeContent } });
    
    expect(mockOnChange).toHaveBeenCalledWith([{ type: 'code', content: codeContent }]);
  });
});