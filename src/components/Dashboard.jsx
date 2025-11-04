import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getNotes, deleteNote } from '../services/notes';
import { getCategories } from '../services/categoryServiceAppwrite';

function Dashboard() {
  const [allNotes, setAllNotes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotesAndCategories();
  }, []);

  async function loadNotesAndCategories() {
    try {
      setLoading(true);
      const [notesResponse, categoriesResponse] = await Promise.all([
        getNotes(user.$id),
        getCategories(user.$id)
      ]);
      const allNotesData = notesResponse.documents;
      setAllNotes(allNotesData);
      setNotes(allNotesData); // Tampilkan semua catatan awalnya
      setCategories(categoriesResponse.documents);
      addNotification('Notes loaded successfully!', 'info');
    } catch (error) {
      console.error('Error loading notes and categories:', error);
      addNotification('Error loading notes: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Fungsi untuk mendapatkan kategori dari ID
  const getCategoryById = (id) => {
    return categories.find(cat => cat.id === id);
  };
  
  // Fungsi untuk menerapkan filter kategori dan pencarian
  useEffect(() => {
    let filteredNotes = allNotes;
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        // Tampilkan catatan tanpa kategori
        filteredNotes = filteredNotes.filter(note => !note.category || note.category === null);
      } else {
        // Tampilkan catatan dengan kategori tertentu
        filteredNotes = filteredNotes.filter(note => note.category === selectedCategory);
      }
    }
    
    // Apply search filter (title, content, and tags)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query) ||
        (note.tags && note.tags.toLowerCase().includes(query)) ||
        // Check if the search query matches any individual tag
        (note.tags && note.tags.split(',').map(tag => tag.trim()).some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    setNotes(filteredNotes);
  }, [selectedCategory, searchQuery, allNotes]);

  async function handleDeleteNote(noteId) {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await deleteNote(noteId);
        setNotes(notes.filter(note => note.$id !== noteId));
        setAllNotes(allNotes.filter(note => note.$id !== noteId));
        addNotification('Note deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting note:', error);
        addNotification('Error deleting note: ' + error.message, 'error');
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="lg:w-2/3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Your Blog</h2>
                <p className="text-gray-600 mt-2">{notes.length} {notes.length === 1 ? 'post' : 'posts'} published</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Filter by:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="uncategorized">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {notes.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto flex justify-center">
                  <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-2xl font-medium text-gray-900">No blog posts yet</h3>
                <p className="mt-2 text-gray-500 max-w-md mx-auto">Get started by creating your first blog post. Share your thoughts and ideas with the world.</p>
                <div className="mt-8 space-y-4">
                  <button
                    onClick={() => navigate('/note/new')}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg className="-ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create your first blog post
                  </button>
                  <p className="text-sm text-gray-500">or</p>
                  <div className="inline-block text-left">
                    <p className="text-sm text-gray-500 mb-2">Quick start:</p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li className="flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        <span>Create a new post</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        <span>Add content with text and code</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        <span>Organize with categories and tags</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Action Bar */}
                <div className="bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{notes.length} Blog Posts</h3>
                    <p className="text-sm text-gray-500">Manage and organize your content</p>
                  </div>
                  <button
                    onClick={() => navigate('/note/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Post
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.map((note) => (
                    <div 
                      key={note.$id} 
                      className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full group"
                    >
                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{note.title}</h3>
                          <div className="flex flex-col items-end space-y-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${note.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {note.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                            {(() => {
                              if (note.category) {
                                const category = getCategoryById(note.category);
                                if (category) {
                                  return (
                                    <span 
                                      key={`${note.$id}-category`}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                      style={{ backgroundColor: category.color }}
                                    >
                                      {category.name}
                                    </span>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3 flex-grow text-sm">
                          {note.content.substring(0, 120)}{note.content.length > 120 ? '...' : ''}
                        </p>
                        
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="bg-indigo-100 rounded-full p-1.5">
                                  <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-2">
                                <p className="text-xs text-gray-500">
                                  {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-1">
                              <button
                                onClick={() => navigate(`/note/${note.$id}`)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-xs px-2.5 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                              >
                                Read
                              </button>
                              <button
                                onClick={() => navigate(`/note/${note.$id}/edit`)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.$id)}
                                className="text-red-600 hover:text-red-800 font-medium text-xs px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/note/new')}
                  className="w-full flex items-center px-3 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Post
                </button>
                <div className="text-xs text-gray-600 mt-2">
                  <p className="font-medium">Next steps:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Create a new blog post</li>
                    <li>Organize with categories</li>
                    <li>Add relevant tags</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Featured Posts */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Featured Posts</h3>
              <div className="space-y-3">
                {allNotes
                  .filter(note => note.status === 'published')
                  .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                  .slice(0, 3)
                  .map(note => (
                    <div key={`featured-${note.$id}`} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer" onClick={() => navigate(`/note/${note.$id}`)}>
                      <div className="flex-shrink-0">
                        <div className="bg-indigo-100 rounded-full p-1.5">
                          <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">{note.title}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Popular Tags */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Popular Tags</h3>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  // Get all unique tags from notes
                  const allTags = [];
                  allNotes.forEach(note => {
                    if (note.tags) {
                      const tags = note.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                      allTags.push(...tags);
                    }
                  });
                  
                  // Count tag occurrences
                  const tagCount = allTags.reduce((acc, tag) => {
                    acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                  }, {});
                  
                  // Sort tags by count and get top 8
                  const sortedTags = Object.entries(tagCount)
                    .sort(([,countA], [,countB]) => countB - countA)
                    .slice(0, 8)
                    .map(([tag]) => tag);
                  
                  return sortedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        setSelectedCategory('all');
                      }}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      #{tag}
                    </button>
                  ));
                })()}
              </div>
            </div>
            
            {/* Categories Filter */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs ${
                    selectedCategory === 'all' 
                      ? 'bg-indigo-100 text-indigo-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                  <span className="ml-1 bg-gray-200 text-gray-700 rounded-full px-1.5 py-0 text-xs">
                    {allNotes.length}
                  </span>
                </button>
                
                <button
                  onClick={() => setSelectedCategory('uncategorized')}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs ${
                    selectedCategory === 'uncategorized' 
                      ? 'bg-indigo-100 text-indigo-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  None
                  <span className="ml-1 bg-gray-200 text-gray-700 rounded-full px-1.5 py-0 text-xs">
                    {allNotes.filter(note => !note.category).length}
                  </span>
                </button>
                
                {categories.map((category) => {
                  const noteCount = allNotes.filter(note => note.category === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs truncate ${
                        selectedCategory === category.id 
                          ? 'bg-indigo-100 text-indigo-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name.substring(0, 12)}{category.name.length > 12 ? '...' : ''}</span>
                        <span className="bg-gray-200 text-gray-700 rounded-full px-1.5 py-0.5 text-xs ml-2">
                          {noteCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;