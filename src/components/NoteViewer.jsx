import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNotes } from '../services/notes';
import { getCategoryById } from '../services/categoryServiceAppwrite';
import CodeBlock from './CodeBlock';
import DOMPurify from 'dompurify';

function NoteViewer() {
  const [note, setNote] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    loadNote();
  }, [id]);

  async function loadNote() {
    try {
      setLoading(true);
      const notes = await getNotes(user.$id);
      const foundNote = notes.documents.find(n => n.$id === id);
      
      if (foundNote) {
        setNote(foundNote);
        // Jika catatan memiliki kategori, muat informasi kategorinya
        if (foundNote.category) {
          try {
            const cat = await getCategoryById(foundNote.category);
            setCategory(cat);
          } catch (err) {
            console.error('Error loading category:', err);
          }
        }
      } else {
        setError('Note not found');
      }
    } catch (error) {
      setError('Error loading note');
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center px-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">Note not found</h2>
          <p className="mt-2 text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center px-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">Note not found</h2>
          <p className="mt-2 text-gray-500">The note you're looking for doesn't exist or has been deleted.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <article className="bg-white shadow-lg rounded-xl overflow-hidden">
            {/* Article Header */}
            <header className="px-6 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
                <div className="flex flex-wrap items-center text-sm text-gray-700 gap-x-4 gap-y-1">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Published: {new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {note.updatedAt && new Date(note.updatedAt) > new Date(note.createdAt) && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${note.status === 'published' ? 'bg-green-100 text-green-900' : 'bg-yellow-100 text-yellow-900'}`}>
                    {note.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  
                  {category && (
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name}
                    </span>
                  )}
                  
                  {note.tags && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.split(',').map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-900">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </header>
            
            {/* Article Content */}
            <div className="px-6 py-6">
              {note.codeContent ? (
                // If the note has code content, display it with syntax highlighting
                <CodeBlock code={note.codeContent} language={note.language || 'javascript'} />
              ) : note.mixedContent && Array.isArray(note.mixedContent) ? (
                // Display mixed content with proper formatting
                <div className="prose prose-lg max-w-none">
                  {note.mixedContent.map((item, index) => (
                    <div key={index} className="my-4">
                      {item.type === 'code' ? (
                        <div className="my-3">
                          <CodeBlock code={item.content} language={note.language || 'javascript'} />
                        </div>
                      ) : (
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 my-3">
                          {item.content.split('\n\n').map((paragraph, pIndex) => (
                            <p key={pIndex} className="mb-3 text-gray-700 leading-relaxed">
                              {paragraph.split('\n').map((line, lineIndex) => (
                                <span key={lineIndex}>
                                  {line}
                                  {lineIndex < paragraph.split('\n').length - 1 && <br />}
                                </span>
                              ))}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : note.richTextContent ? (
                // Display rich text content
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(note.richTextContent.replace(/\n/g, '<br />'), {
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
              ) : (
                // Otherwise, display regular content
                <div className="prose prose-lg max-w-none">
                  {note.content.split('\n\n').map((paragraph, index) => {
                    // Split each paragraph by newlines to handle line breaks properly
                    const lines = paragraph.split('\n');
                    return (
                      <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                        {lines.map((line, lineIndex) => (
                          <span key={lineIndex}>
                            {line}
                            {lineIndex < lines.length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Article Footer */}
            <footer className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-sm text-gray-500">
                Article ID: {note.$id.substring(0, 8)}...
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/note/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Post
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </button>
              </div>
            </footer>
          </article>
        </div>
      </main>
    </div>
  );
}

export default NoteViewer;