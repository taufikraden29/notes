import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CodeEditor from '../components/CodeEditor';

describe('CodeEditor Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders CodeEditor with default props', () => {
    render(<CodeEditor value="" onChange={mockOnChange} />);
    
    expect(screen.getByText('Language:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('renders with initial value', () => {
    const initialValue = 'console.log("Hello, world!");';
    render(<CodeEditor value={initialValue} onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(initialValue);
  });

  test('renders with initial language', () => {
    render(<CodeEditor value="" onChange={mockOnChange} language="python" />);
    
    const languageSelect = screen.getByRole('combobox');
    expect(languageSelect).toHaveValue('python');
  });

  test('updates content when textarea changes', () => {
    render(<CodeEditor value="" onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'console.log("updated");' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('console.log("updated");', 'javascript');
  });

  test('updates language when select changes', () => {
    render(<CodeEditor value="console.log('test');" onChange={mockOnChange} />);
    
    const languageSelect = screen.getByRole('combobox');
    fireEvent.change(languageSelect, { target: { value: 'python' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('console.log(\'test\');', 'python');
  });

  test('updates both content and language when both change', () => {
    render(<CodeEditor value="" onChange={mockOnChange} />);
    
    // Change content
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'print("hello")' } });
    
    // Change language
    const languageSelect = screen.getByRole('combobox');
    fireEvent.change(languageSelect, { target: { value: 'python' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('print("hello")', 'python');
  });

  test('displays all supported languages in select', () => {
    render(<CodeEditor value="" onChange={mockOnChange} />);
    
    const languageSelect = screen.getByRole('combobox');
    const options = languageSelect.querySelectorAll('option');
    
    // Check for a few key languages
    expect(Array.from(options).map(opt => opt.value)).toContain('javascript');
    expect(Array.from(options).map(opt => opt.value)).toContain('python');
    expect(Array.from(options).map(opt => opt.value)).toContain('html');
    expect(Array.from(options).map(opt => opt.value)).toContain('css');
  });

  test('updates language when prop changes', () => {
    const { rerender } = render(<CodeEditor value="" onChange={mockOnChange} language="javascript" />);
    
    // Verify initial language
    expect(screen.getByRole('combobox')).toHaveValue('javascript');
    
    // Rerender with different language
    rerender(<CodeEditor value="" onChange={mockOnChange} language="python" />);
    
    // Verify language changed
    expect(screen.getByRole('combobox')).toHaveValue('python');
  });
});