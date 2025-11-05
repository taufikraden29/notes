import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { autoSaveNote } from '../services/notes';

const RichTextEditor = ({ value = '', onChange, noteId = null, autoSave = true, onAutoSave = null }) => {
  const editorRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isQuote, setIsQuote] = useState(false);
  const [isBlockquote, setIsBlockquote] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [lastSaved, setLastSaved] = useState(null);
  
  // Load draft from local storage if available
  useEffect(() => {
    if (noteId) {
      const savedDraft = localStorage.getItem(`draft_${noteId}`);
      if (savedDraft && value === '') {
        onChange(savedDraft);
      }
    }
  }, [noteId, value, onChange]);
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;
    
    const autoSaveInterval = setInterval(() => {
      const content = editorRef.current ? editorRef.current.innerHTML : value;
      if (content.trim() !== '') {
        handleAutoSave(content);
      }
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [value, noteId, autoSave, onAutoSave]);
  
  const handleAutoSave = async (content) => {
    // Always save to local storage as a fallback
    if (noteId) {
      try {
        localStorage.setItem(`draft_${noteId}`, content);
      } catch (error) {
        console.error('Failed to save to local storage:', error);
      }
    }
    
    // If we have a backend save function, try to save there too
    if (noteId && onAutoSave) {
      try {
        setAutoSaveStatus('saving');
        await onAutoSave(noteId, content);
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 2000);
      } catch (error) {
        setAutoSaveStatus('error');
        console.error('Auto-save failed:', error);
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 3000);
      }
    } else if (noteId) {
      // If no custom onAutoSave function but we have a noteId, use the service function directly
      try {
        setAutoSaveStatus('saving');
        
        // Create a note update with just the rich text content
        const noteData = {
          richTextContent: content,
        };
        
        await autoSaveNote(noteId, noteData);
        setAutoSaveStatus('saved');
        setLastSaved(new Date());
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 2000);
      } catch (error) {
        setAutoSaveStatus('error');
        console.error('Auto-save failed:', error);
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 3000);
      }
    } else {
      // If no backend save function, just update the status
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    }
  };

  const handleInput = () => {
    const content = editorRef.current.innerHTML;
    onChange(content);
    
    // Update formatting state
    updateFormattingState();
  };

  const updateFormattingState = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).startContainer.parentNode;
      setIsBold(range.tagName === 'B' || range.closest('b, strong'));
      setIsItalic(range.tagName === 'I' || range.closest('i, em'));
      setIsUnderline(range.tagName === 'U' || range.closest('u'));
      setIsStrikethrough(range.tagName === 'STRIKE' || range.closest('strike, s'));
      setIsCode(range.tagName === 'CODE' || range.closest('code'));
      setIsQuote(range.tagName === 'Q' || range.closest('q'));
      setIsBlockquote(range.tagName === 'BLOCKQUOTE' || range.closest('blockquote'));
      setIsSubscript(range.tagName === 'SUB' || range.closest('sub'));
      setIsSuperscript(range.tagName === 'SUP' || range.closest('sup'));
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const isValidUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      // Only allow http, https, and mailto protocols
      return ['http:', 'https:', 'mailto:'].includes(url.protocol);
    } catch (error) {
      return false;
    }
  };

  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      if (isValidUrl(url)) {
        formatText('createLink', url);
      } else {
        alert('Invalid URL. Only HTTP, HTTPS, and mailto links are allowed.');
      }
    }
  };

  const insertImage = () => {
    const url = prompt('Enter the image URL:');
    if (url) {
      if (isValidUrl(url)) {
        formatText('insertImage', url);
      } else {
        alert('Invalid URL. Only HTTP and HTTPS image links are allowed.');
      }
    }
  };

  const insertHorizontalRule = () => {
    formatText('insertHorizontalRule');
  };

  const clearFormatting = () => {
    formatText('removeFormat');
  };

  const handlePaste = (e) => {
    // Prevent default paste behavior to handle it manually
    e.preventDefault();
    
    // Get pasted data
    const pastedData = (e.clipboardData || window.clipboardData).getData('text/html') || 
                       (e.clipboardData || window.clipboardData).getData('text/plain');
    
    // Sanitize the pasted content before inserting
    const sanitizedData = DOMPurify.sanitize(pastedData, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'q', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'div',
        'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'b', 'i'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 
        'rel', 'width', 'height', 'align', 'colspan', 'rowspan'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
    
    // Insert the sanitized content
    document.execCommand('insertHTML', false, sanitizedData);
    
    handleInput();
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-2 flex flex-wrap gap-1">
        {/* Basic formatting */}
        <button
          type="button"
          onClick={() => formatText('bold')}
          className={`p-2 rounded ${
            isBold 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
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
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
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
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
          }`}
          title="Underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19V5a2 2 0 012-2h10a2 2 0 012 2v14M5 19h14M5 19h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('strikeThrough')}
          className={`p-2 rounded ${
            isStrikethrough 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
          }`}
          title="Strikethrough"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1h2m-2 0h6m-6 0v2m6-2V3m0 16v-2m0 2h6m-6 0v-2m0 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
        
        <div className="border-l border-gray-200 dark:border-gray-600 mx-1 h-6 self-center"></div>
        
        {/* Headings */}
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h1')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h2')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h3')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Heading 3"
        >
          H3
        </button>
        
        <div className="border-l border-gray-200 dark:border-gray-600 mx-1 h-6 self-center"></div>
        
        {/* Lists */}
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="border-l border-gray-200 dark:border-gray-600 mx-1 h-6 self-center"></div>
        
        {/* Alignment */}
        <button
          type="button"
          onClick={() => formatText('justifyLeft')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('justifyCenter')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('justifyRight')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M4 18h16" />
          </svg>
        </button>
        
        <div className="border-l border-gray-200 dark:border-gray-600 mx-1 h-6 self-center"></div>
        
        {/* Additional formatting */}
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'blockquote')}
          className={`p-2 rounded ${
            isBlockquote 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
          }`}
          title="Blockquote"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => formatText('insertHorizontalRule')}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Insert Horizontal Rule"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={clearFormatting}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Clear Formatting"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        <div className="border-l border-gray-200 dark:border-gray-600 mx-1 h-6 self-center"></div>
        
        {/* Insert elements */}
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
          title="Insert Image"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-64 p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none overflow-auto"
        style={{ minHeight: '256px' }}
        dangerouslySetInnerHTML={{ 
          __html: DOMPurify.sanitize(value, {
            ALLOWED_TAGS: [
              'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'blockquote', 'q', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'div',
              'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'b', 'i'
            ],
            ALLOWED_ATTR: [
              'href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 
              'rel', 'width', 'height', 'align', 'colspan', 'rowspan'
            ],
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
          })
        }}
      />
      
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Tip: Use formatting tools to enhance your content readability.
        </div>
        {autoSave && noteId && (
          <div className="flex items-center space-x-2">
            <div className={`text-xs ${
              autoSaveStatus === 'saving' ? 'text-blue-500 dark:text-blue-400' : 
              autoSaveStatus === 'saved' ? 'text-green-500 dark:text-green-400' : 
              autoSaveStatus === 'error' ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {autoSaveStatus === 'saving' && 'Saving...'}
              {autoSaveStatus === 'saved' && 'Saved'}
              {autoSaveStatus === 'error' && 'Save failed'}
              {autoSaveStatus === 'idle' && 'Auto-save enabled'}
            </div>
            {lastSaved && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;