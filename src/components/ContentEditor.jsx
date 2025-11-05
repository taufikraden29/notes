import React, { useState, useRef, useCallback, useMemo } from 'react';

// Memoized Content Block Component to prevent unnecessary re-renders
const ContentBlock = React.memo(({ item, index, contentLength, updateContentBlock, removeContentBlock, moveBlock }) => {
  const handleContentChange = useCallback((e) => {
    updateContentBlock(index, { ...item, content: e.target.value });
  }, [index, item, updateContentBlock]);

  const handleTypeToggle = useCallback(() => {
    const newType = item.type === 'code' ? 'text' : 'code';
    updateContentBlock(index, { ...item, type: newType });
  }, [index, item, updateContentBlock]);

  // Calculate rows based on content length to optimize rendering
  const rows = useMemo(() => {
    return Math.min(10, Math.max(2, item.content.split('\n').length));
  }, [item.content]);

  return (
    <div className="mb-4 last:mb-0 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.type === 'code' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {item.type === 'code' ? 'Code' : 'Text'}
          </span>
          <span className="ml-2 text-xs text-gray-500 truncate max-w-xs">
            {item.content.substring(0, 50)}{item.content.length > 50 ? '...' : ''}
          </span>
        </div>
        <div className="flex space-x-1">
          {index > 0 && (
            <button
              type="button"
              onClick={() => moveBlock(index, index - 1)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors"
              title="Move up"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {index < contentLength - 1 && (
            <button
              type="button"
              onClick={() => moveBlock(index, index + 1)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors"
              title="Move down"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={handleTypeToggle}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors"
            title={`Switch to ${item.type === 'code' ? 'text' : 'code'}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => removeContentBlock(index)}
            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-100 transition-colors"
            title="Delete block"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-2">
        <textarea
          value={item.content}
          onChange={handleContentChange}
          className={`w-full p-2 text-sm rounded border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            item.type === 'code' 
              ? 'font-mono bg-gray-900 text-green-400' 
              : 'bg-white text-gray-700'
          }`}
          rows={rows}
          placeholder={`Enter ${item.type} content here...`}
        />
      </div>
    </div>
  );
});

const ContentEditor = ({ value = [], onChange, onPaste }) => {
  const [content, setContent] = useState(value);
  const textareaRef = useRef(null);
  
  // Function to detect if text is code based on patterns - memoized for performance
  const isCodeBlock = useCallback((text) => {
    // Check for common code patterns
    const codeIndicators = [
      // Indented code blocks
      /^(\s{2,}|\t)/gm,
      // Common programming syntax
      /(?:^|\s)(?:function|def|class|import|from|var|let|const|if|else|for|while|try|catch|finally|switch|case|break|continue|return|console\.log|print|puts|System\.out\.println|main\(|struct|enum|interface|impl|fn|func|package|module|use|require)\b/,
      // Code with opening/closing brackets
      /^.*\{[\s\S]*\}[\s]*$/m,
      // Multiple lines with semicolons
      /^.*;.*\n.*;/m,
      // Assignment patterns
      /=\s*['"]?[\w./-]+['"]?|=>|===|!==|<=|>=|&&|\|\|/,
      // Function calls
      /\w+\([^)]*\)/,
      // Language-specific patterns
      /(?:public|private|protected|static|final|const|var|let)\s+\w+/,
      /(?:int|float|double|string|bool|boolean|char|long)\s+\w+/,
      // Regular expressions in code
      /\/[^/]+\/[gimuy]*/,
      // Multiple operators in one line
      /[+\-*/=!<>]=|[+\-*/%^&|]+/,
      // Comments in code
      /\/\*[\s\S]*?\*\//,
      /\/\/.*$/,
    ];
    
    // Count how many indicators match
    let indicatorCount = 0;
    for (const indicator of codeIndicators) {
      if (indicator.test(text.trim())) {
        indicatorCount++;
        // Early return if we find strong indicators
        if (indicatorCount >= 2) return true;
      }
    }
    
    // Additional heuristics
    const lines = text.trim().split('\n');
    if (lines.length > 1) {
      // Check for indentation consistency (common in code)
      const indentPattern = /^\s+/;
      const indentedLines = lines.filter(line => indentPattern.test(line));
      if (indentedLines.length >= Math.max(1, lines.length / 2)) {
        return true;
      }
    }
    
    // High ratio of special characters to plain text suggests code
    const specialCharRatio = (text.match(/[{}()[\];=,."'`~!@#$%^&*|\\/?<>+\-_]/g) || []).length / text.length;
    if (specialCharRatio > 0.2 && text.length > 10) {
      return true;
    }
    
    return false;
  }, []);

  // Function to process pasted content and classify as text or code - memoized
  const processPastedContent = useCallback((pastedText) => {
    // Split the content by lines
    const lines = pastedText.split('\n');
    const processedContent = [];
    let currentTextBlock = '';
    let inCodeBlock = false;
    let codeAccumulator = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is part of a code block
      if (isCodeBlock(line)) {
        // If we were accumulating text, save it as a text block first
        if (currentTextBlock.trim() !== '') {
          processedContent.push({ type: 'text', content: currentTextBlock.trim() });
          currentTextBlock = '';
        }
        
        // Add to code accumulator
        if (!inCodeBlock) {
          // Start a new code block
          inCodeBlock = true;
          codeAccumulator = line;
        } else {
          // Continue the current code block
          codeAccumulator += '\n' + line;
        }
      } else {
        // If we were in a code block, save it as a code block first
        if (inCodeBlock) {
          processedContent.push({ type: 'code', content: codeAccumulator.trim() });
          codeAccumulator = '';
          inCodeBlock = false;
        }
        
        // Add to text accumulator
        if (currentTextBlock) {
          currentTextBlock += '\n' + line;
        } else {
          currentTextBlock = line;
        }
      }
    }
    
    // Add any remaining content
    if (currentTextBlock.trim() !== '') {
      processedContent.push({ type: 'text', content: currentTextBlock.trim() });
    }
    
    if (codeAccumulator.trim() !== '') {
      processedContent.push({ type: 'code', content: codeAccumulator.trim() });
    }
    
    return processedContent;
  }, [isCodeBlock]);

  const handlePaste = useCallback((e) => {
    // Call the parent's paste handler if provided
    if (onPaste) {
      onPaste(e);
      return;
    }
    
    // Process the pasted content to detect code vs text
    setTimeout(() => {
      const pastedContent = e.target.value;
      const processedContent = processPastedContent(pastedContent);
      
      if (processedContent.length > 0) {
        setContent(processedContent);
        onChange(processedContent);
      }
    }, 10);
  }, [onPaste, processPastedContent, onChange]);

  const addContentBlock = useCallback((type, content = '') => {
    const newContent = [...content, { type, content }];
    setContent(newContent);
    onChange(newContent);
  }, [onChange]);

  const updateContentBlock = useCallback((index, newContent) => {
    const updatedContent = [...content];
    updatedContent[index] = newContent;
    setContent(updatedContent);
    onChange(updatedContent);
  }, [content, onChange]);

  const removeContentBlock = useCallback((index) => {
    const updatedContent = content.filter((_, i) => i !== index);
    setContent(updatedContent);
    onChange(updatedContent);
  }, [content, onChange]);

  const moveBlock = useCallback((fromIndex, toIndex) => {
    const updatedContent = [...content];
    const [movedItem] = updatedContent.splice(fromIndex, 1);
    updatedContent.splice(toIndex, 0, movedItem);
    setContent(updatedContent);
    onChange(updatedContent);
  }, [content, onChange]);

  // Memoize the content blocks to prevent unnecessary re-renders
  const contentBlocks = useMemo(() => {
    return content.map((item, index) => (
      <ContentBlock
        key={index}
        item={item}
        index={index}
        contentLength={content.length}
        updateContentBlock={updateContentBlock}
        removeContentBlock={removeContentBlock}
        moveBlock={moveBlock}
      />
    ));
  }, [content, updateContentBlock, removeContentBlock, moveBlock]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Content Blocks</h3>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => addContentBlock('text')}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Add Text Block
          </button>
          <button
            type="button"
            onClick={() => addContentBlock('code')}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Add Code Block
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-white max-h-96 overflow-y-auto">
        {content.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No content blocks yet.</p>
            <p className="mt-2 text-sm">Add text or code blocks, or paste blog content to auto-detect.</p>
          </div>
        ) : (
          contentBlocks
        )}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Tip: Paste blog content with code examples to auto-detect and separate code from text.
      </div>
    </div>
  );
};

export default ContentEditor;