import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import EditorToolbar from './EditorToolbar';
import { autoSaveNote } from '../services/notes';

const EnhancedRichTextEditor = ({ value = '', onChange, noteId = null, autoSave = true, onAutoSave = null }) => {
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
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  
  // Refs for debouncing
  const autoSaveTimeoutRef = useRef(null);
  const wordCountTimeoutRef = useRef(null);
  
  // Load draft from local storage if available
  useEffect(() => {
    if (noteId) {
      const savedDraft = localStorage.getItem(`draft_${noteId}`);
      if (savedDraft && value === '') {
        onChange(savedDraft);
      }
    }
  }, [noteId, value, onChange]);
  
  // Calculate word count and reading time with debouncing to improve performance
  const calculateWordCount = useCallback(() => {
    if (wordCountTimeoutRef.current) {
      clearTimeout(wordCountTimeoutRef.current);
    }
    
    wordCountTimeoutRef.current = setTimeout(() => {
      const textContent = editorRef.current ? editorRef.current.innerText || editorRef.current.textContent : value;
      const words = textContent.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
      // Average reading speed is about 200 words per minute
      setReadingTime(Math.ceil(words.length / 200));
    }, 500); // Debounce for 500ms
  }, [value]);
  
  useEffect(() => {
    calculateWordCount();
  }, [calculateWordCount]);
  
  // Optimized auto-save functionality with debouncing
  const handleAutoSave = useCallback(async (content) => {
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set a new timeout to debounce the auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
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
    }, 1000); // Debounce auto-save by 1 second
  }, [noteId, onAutoSave]);
  
  const handleInput = useCallback(() => {
    const content = editorRef.current ? editorRef.current.innerHTML : value;
    onChange(content);
    
    // Update formatting state
    updateFormattingState();
    
    // Calculate word count with debounce
    calculateWordCount();
    
    // Trigger auto-save if enabled
    if (autoSave && noteId && content.trim() !== '') {
      handleAutoSave(content);
    }
  }, [value, onChange, updateFormattingState, calculateWordCount, autoSave, noteId, handleAutoSave]);

  const updateFormattingState = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).startContainer.parentNode;
      setIsBold(!!(range.tagName === 'B' || range.closest('b, strong')));
      setIsItalic(!!(range.tagName === 'I' || range.closest('i, em')));
      setIsUnderline(!!(range.tagName === 'U' || range.closest('u')));
      setIsStrikethrough(!!(range.tagName === 'STRIKE' || range.closest('strike, s')));
      setIsCode(!!(range.tagName === 'CODE' || range.closest('code')));
      setIsQuote(!!(range.tagName === 'Q' || range.closest('q')));
      setIsBlockquote(!!(range.tagName === 'BLOCKQUOTE' || range.closest('blockquote')));
      setIsSubscript(!!(range.tagName === 'SUB' || range.closest('sub')));
      setIsSuperscript(!!(range.tagName === 'SUP' || range.closest('sup')));
    }
  }, []);

  const formatText = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  }, [handleInput]);

  const isValidUrl = useCallback((urlString) => {
    try {
      const url = new URL(urlString);
      // Only allow http, https, and mailto protocols
      return ['http:', 'https:', 'mailto:'].includes(url.protocol);
    } catch (error) {
      return false;
    }
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt('Enter the URL:');
    if (url) {
      if (isValidUrl(url)) {
        formatText('createLink', url);
      } else {
        alert('Invalid URL. Only HTTP, HTTPS, and mailto links are allowed.');
      }
    }
  }, [formatText, isValidUrl]);

  const insertImage = useCallback(() => {
    const url = prompt('Enter the image URL:');
    if (url) {
      if (isValidUrl(url)) {
        formatText('insertImage', url);
      } else {
        alert('Invalid URL. Only HTTP and HTTPS image links are allowed.');
      }
    }
  }, [formatText, isValidUrl]);

  const insertHorizontalRule = useCallback(() => {
    formatText('insertHorizontalRule');
  }, [formatText]);

  const clearFormatting = useCallback(() => {
    formatText('removeFormat');
  }, [formatText]);

  const handlePaste = useCallback((e) => {
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
  }, [handleInput]);

  const handleKeyDown = useCallback((e) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 'k':
          e.preventDefault();
          insertLink();
          break;
        default:
          break;
      }
    }
  }, [formatText, insertLink]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (wordCountTimeoutRef.current) {
        clearTimeout(wordCountTimeoutRef.current);
      }
    };
  }, []);

  // Memoize sanitized content to prevent unnecessary recalculations
  const sanitizedValue = useMemo(() => {
    return DOMPurify.sanitize(value, {
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
  }, [value]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm flex flex-col h-full">
      <EditorToolbar 
        onFormat={formatText}
        isBold={isBold}
        isItalic={isItalic}
        isUnderline={isUnderline}
        isStrikethrough={isStrikethrough}
      />
      
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="min-h-64 p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none overflow-auto flex-grow"
        style={{ minHeight: '256px' }}
        role="textbox"
        aria-label="Rich text editor"
        aria-multiline="true"
        dangerouslySetInnerHTML={{ __html: sanitizedValue }}
      />
      
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex space-x-4">
          {isFocused ? (
            <span>Press Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline</span>
          ) : (
            <span>Tip: Use formatting tools to enhance your content readability.</span>
          )}
          <span>Words: {wordCount} | Reading time: {readingTime} min</span>
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

export default EnhancedRichTextEditor;