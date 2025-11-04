import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { createNote, updateNote, getNotes } from '../services/notes';
import { getCategories } from '../services/categoryServiceAppwrite';
import CodeEditor from './CodeEditor';
import ContentEditor from './ContentEditor';
import RichTextEditor from './RichTextEditor';

function NoteEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [editorMode, setEditorMode] = useState('text'); // 'text', 'code', 'mixed', or 'richtext'
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [mixedContent, setMixedContent] = useState([]); // For storing mixed text/code content
  const [richTextContent, setRichTextContent] = useState(''); // For storing rich text content
  const textareaRef = useRef(null);
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing notes
  const isEditing = !!id;

  useEffect(() => {
    loadCategories();
    if (isEditing) {
      loadNote();
    }
  }, [isEditing, id]);

  async function loadCategories() {
    try {
      const response = await getCategories(user.$id);
      setCategories(response.documents);
    } catch (error) {
      console.error('Error loading categories:', error);
      addNotification('Error loading categories: ' + error.message, 'error');
    }
  }

  async function loadNote() {
    try {
      setLoading(true);
      const notes = await getNotes(user.$id);
      const note = notes.documents.find(n => n.$id === id);
      
      if (note) {
        setTitle(note.title);
        
        // Check if the note content is a code snippet
        if (note.codeContent || note.language) {
          setEditorMode('code');
          setCodeContent(note.codeContent || '');
          setCodeLanguage(note.language || 'javascript');
        } else if (note.mixedContent && Array.isArray(note.mixedContent)) {
          // Handle mixed content (text and code blocks)
          setEditorMode('mixed');
          setMixedContent(note.mixedContent);
        } else if (note.richTextContent) {
          // Handle rich text content
          setEditorMode('richtext');
          setRichTextContent(note.richTextContent);
        } else {
          setEditorMode('text');
          setContent(note.content || '');
        }
        
        setStatus(note.status);
        setCategory(note.category || '');
        setTags(note.tags || '');
      } else {
        addNotification('Note not found', 'error');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading note:', error);
      addNotification('Error loading note: ' + error.message, 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  // Function to detect if text is code based on patterns
  const isCodeBlock = (text) => {
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
  };

  // Function to process pasted content and classify as text or code
  const processPastedContent = (pastedText) => {
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
  };



  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      addNotification('Please enter a title for your post', 'error');
      return;
    }

    // For code mode, we validate that there's code content
    if (editorMode === 'code' && !codeContent.trim()) {
      setError('Code content is required');
      addNotification('Please enter code content', 'error');
      return;
    }

    // For text mode, we validate that there's regular content
    if (editorMode === 'text' && !content.trim()) {
      setError('Content is required');
      addNotification('Please enter content for your post', 'error');
      return;
    }

    // For rich text mode, we validate that there's content
    if (editorMode === 'richtext' && !richTextContent.trim()) {
      setError('Content is required');
      addNotification('Please enter content for your post', 'error');
      return;
    }

    // For mixed mode, we validate that there's content
    if (editorMode === 'mixed' && mixedContent.length === 0) {
      setError('Content is required');
      addNotification('Please enter content for your post', 'error');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Prepare note data based on editor mode
      const noteData = {
        title: title.trim(),
        status,
        category: category || null,
        tags: tags || null,
      };

      if (editorMode === 'code') {
        noteData.codeContent = codeContent.trim();
        noteData.language = codeLanguage;
        noteData.content = codeContent.trim(); // Keep original content field for compatibility
      } else if (editorMode === 'mixed') {
        // Store mixed content as structured data
        noteData.mixedContent = mixedContent;
        // Also create a combined text version for searchability
        noteData.content = mixedContent.map(item => item.content).join('\n\n');
      } else if (editorMode === 'richtext') {
        // Store rich text content
        noteData.richTextContent = richTextContent;
        // Also create a plain text version for searchability
        const div = document.createElement('div');
        div.innerHTML = richTextContent;
        noteData.content = div.textContent || div.innerText || '';
      } else {
        noteData.content = content.trim();
      }

      if (isEditing) {
        // Update existing note
        noteData.updatedAt = new Date().toISOString();
        await updateNote(id, noteData);
        addNotification('Note updated successfully!', 'success');
      } else {
        // Create new note
        await createNote(noteData, user.$id);
        addNotification('Note created successfully!', 'success');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving note:', error);
      addNotification('Error saving note: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading && isEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center mb-8">
            <div className={`p-3 rounded-lg ${isEditing ? 'bg-indigo-100' : 'bg-green-100'} mr-4`}>
              <svg className={`h-6 w-6 ${isEditing ? 'text-indigo-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isEditing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                )}
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              <p className="text-gray-600">Write and publish your content</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Post Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg transition-colors duration-200"
                  placeholder="Enter your post title"
                  required
                />
                <p className="text-sm text-gray-500">Make your title compelling and descriptive</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <p className="text-sm text-gray-500">Choose the visibility status for your post</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.$id || cat.id} value={cat.$id || cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500">Organize your post in a category</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow space-y-2">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                  placeholder="e.g. javascript, tutorial"
                />
                <p className="text-sm text-gray-500">Separate tags with commas</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                <button
                  type="button"
                  className={`py-3 px-4 font-medium text-sm whitespace-nowrap ${
                    editorMode === 'text'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setEditorMode('text')}
                >
                  <div className="flex items-center">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Plain Text
                  </div>
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 font-medium text-sm whitespace-nowrap ${
                    editorMode === 'richtext'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setEditorMode('richtext')}
                >
                  <div className="flex items-center">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    Rich Text
                  </div>
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 font-medium text-sm whitespace-nowrap ${
                    editorMode === 'code'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setEditorMode('code')}
                >
                  <div className="flex items-center">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Code Editor
                  </div>
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 font-medium text-sm whitespace-nowrap ${
                    editorMode === 'mixed'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setEditorMode('mixed')}
                >
                  <div className="flex items-center">
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Mixed Content
                  </div>
                </button>
              </div>
              
              {editorMode === 'text' ? (
                <div className="space-y-2">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Post Content
                  </label>
                  <textarea
                    id="content"
                    ref={textareaRef}
                    rows={15}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={async (e) => {
                      // Wait for the paste to complete
                      setTimeout(async () => {
                        const pastedContent = e.target.value;
                        
                        // Process the pasted content to detect code vs text
                        const processedContent = await processPastedContent(pastedContent);
                        
                        if (processedContent.length > 0) {
                          // Switch to mixed content mode if we detected multiple blocks or code
                          if (processedContent.length > 1 || processedContent[0].type === 'code') {
                            setMixedContent(processedContent);
                            setEditorMode('mixed');
                            setContent(''); // Clear the simple content
                          } else {
                            // Keep in text mode with the pasted content
                            setContent(pastedContent);
                          }
                        }
                      }, 10); // Small delay to allow paste to complete
                    }}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                    placeholder="Write your blog post content here... (Paste blog content here to auto-detect code blocks)"
                  ></textarea>
                  <p className="text-sm text-gray-500">Write your post content in the editor above. Paste blog content with code to auto-detect code blocks.</p>
                </div>
              ) : editorMode === 'richtext' ? (
                <div className="space-y-2">
                  <label htmlFor="richtext-content" className="block text-sm font-medium text-gray-700">
                    Rich Text Content
                  </label>
                  <RichTextEditor 
                    value={richTextContent}
                    onChange={setRichTextContent}
                  />
                  <p className="text-sm text-gray-500">Format your content with rich text options for better presentation.</p>
                </div>
              ) : editorMode === 'mixed' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mixed Content (Text & Code)
                  </label>
                  <ContentEditor 
                    value={mixedContent}
                    onChange={setMixedContent}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Code Content
                  </label>
                  <CodeEditor
                    value={codeContent}
                    onChange={(content, language) => {
                      setCodeContent(content);
                      if (language) setCodeLanguage(language);
                    }}
                    language={codeLanguage}
                  />
                  <p className="text-sm text-gray-500">Write your code snippet in the editor above</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Saving...' : isEditing ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default NoteEditor;