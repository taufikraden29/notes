import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import EditorToolbar from './EditorToolbar';
import { autoSaveNote } from '../services/notes';

const ImprovedRichTextEditor = ({ value = '', onChange, noteId = null, autoSave = true, onAutoSave = null }) => {
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
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="min-h-64 p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none overflow-auto flex-grow"
        style={{ minHeight: '256px' }}
        role="textbox"
        aria-label="Rich text editor"
        aria-multiline="true"
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
          {isFocused ? 'Press Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline' : 'Tip: Use formatting tools to enhance your content readability.'}
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

export default ImprovedRichTextEditor;