import React from 'react';

const EditorToolbar = ({ onFormat, isBold, isItalic, isUnderline, isStrikethrough }) => {
  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
      {/* Basic formatting */}
      <button
        type="button"
        onClick={() => onFormat('bold')}
        className={`p-2 rounded ${
          isBold 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
        }`}
        title="Bold"
        aria-label="Bold"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6a2 2 0 012-2h5.5a2 2 0 011.6.8l1.5 2a2 2 0 001.6.8H19a2 2 0 012 2v1a2 2 0 01-2 2h-4.5a1 1 0 00-1 1v.5a1 1 0 001 1H19a1 1 0 001-1v-1a2 2 0 002-2V6a2 2 0 00-2-2H3a2 2 0 00-2 2v12a2 2 0 002 2h6.5a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 01-1-1V6z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onFormat('italic')}
        className={`p-2 rounded ${
          isItalic 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
        }`}
        title="Italic"
        aria-label="Italic"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onFormat('underline')}
        className={`p-2 rounded ${
          isUnderline 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
        }`}
        title="Underline"
        aria-label="Underline"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19V5a2 2 0 012-2h10a2 2 0 012 2v14M5 19h14M5 19h14" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onFormat('strikeThrough')}
        className={`p-2 rounded ${
          isStrikethrough 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
        }`}
        title="Strikethrough"
        aria-label="Strikethrough"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1h2m-2 0h6m-6 0v2m6-2V3m0 16v-2m0 2h6m-6 0v-2m0 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>
      
      <div className="border-l border-gray-200 dark:border-gray-600 mx-1 h-6 self-center"></div>
      
      {/* Headings */}
      <button
        type="button"
        onClick={() => onFormat('formatBlock', 'h1')}
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
        title="Heading 1"
        aria-label="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => onFormat('formatBlock', 'h2')}
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
        title="Heading 2"
        aria-label="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => onFormat('formatBlock', 'h3')}
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
        title="Heading 3"
        aria-label="Heading 3"
      >
        H3
      </button>
      
      <div className="border-l border-gray-200 dark:border-gray-600 mx-1 h-6 self-center"></div>
      
      {/* Lists */}
      <button
        type="button"
        onClick={() => onFormat('insertUnorderedList')}
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
        title="Bullet List"
        aria-label="Bullet List"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onFormat('insertOrderedList')}
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
        title="Numbered List"
        aria-label="Numbered List"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="border-l border-gray-200 dark:border-gray-600 mx-1 h-6 self-center"></div>
      
      {/* Alignment */}
      <button
        type="button"
        onClick={() => onFormat('justifyLeft')}
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
        title="Align Left"
        aria-label="Align Left"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onFormat('justifyCenter')}
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
        title="Align Center"
        aria-label="Align Center"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onFormat('justifyRight')}
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
        title="Align Right"
        aria-label="Align Right"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M4 18h16" />
        </svg>
      </button>
    </div>
  );
};

export default EditorToolbar;