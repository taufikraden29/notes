import React, { useState, useRef } from 'react';

const RichTextEditor = ({ value = '', onChange }) => {
  const editorRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
  const handleInput = () => {
    const content = editorRef.current.innerHTML;
    onChange(content);
    
    // Update formatting state
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).startContainer.parentNode;
      setIsBold(range.tagName === 'B' || range.closest('b, strong'));
      setIsItalic(range.tagName === 'I' || range.closest('i, em'));
      setIsUnderline(range.tagName === 'U' || range.closest('u'));
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className={`p-2 rounded ${
            isBold 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6a2 2 0 012-2h5.5a2 2 0 011.6.8l1.5 2a2 2 0 001.6.8H19a2 2 0 012 2v1a2 2 0 01-2 2h-4.5a1 1 0 00-1 1v.5a1 1 0 001 1H19a1 1 0 001-1v-1a2 2 0 002-2V6a2 2 0 00-2-2H3a2 2 0 00-2 2v12a2 2 0 002 2h6.5a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 01-1-1V6z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className={`p-2 rounded ${
            isItalic 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className={`p-2 rounded ${
            isUnderline 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19V5a2 2 0 012-2h10a2 2 0 012 2v14M5 19h14M5 19h14" />
          </svg>
        </button>
        <div className="border-l border-gray-200 mx-1 h-6 self-center"></div>
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100"
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100"
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="border-l border-gray-200 mx-1 h-6 self-center"></div>
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100"
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h1')}
          className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h2')}
          className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100"
          title="Heading 2"
        >
          H2
        </button>
      </div>
      
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-64 p-4 bg-white text-gray-700 focus:outline-none overflow-auto"
        style={{ minHeight: '256px' }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Tip: Use formatting tools to enhance your content readability.
      </div>
    </div>
  );
};

export default RichTextEditor;