import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import NoteEditor from './components/NoteEditor';
import NoteViewer from './components/NoteViewer';
import CategoriesManager from './components/CategoriesManager';
import './App.css';

function AppContent() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Don't show navigation on login page
  const shouldShowNav = location.pathname !== '/login';

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowNav && user && (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <h1 className="ml-2 text-xl font-bold text-gray-900">BlogMe</h1>
                </div>
                <div className="hidden md:ml-6 md:flex md:space-x-8">
                  <a 
                    href="/dashboard" 
                    className={`border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      location.pathname === '/dashboard' || location.pathname === '/' 
                        ? 'border-indigo-500 text-gray-900' 
                        : ''
                    }`}
                  >
                    Blog Posts
                  </a>
                  <a 
                    href="/categories" 
                    className={`border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      location.pathname === '/categories' 
                        ? 'border-indigo-500 text-gray-900' 
                        : ''
                    }`}
                  >
                    Categories
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">Welcome, {user.name || user.email}</span>
                <button
                  onClick={() => window.location.href = '/note/new'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Post
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/categories" element={user ? <CategoriesManager /> : <Navigate to="/login" />} />
        <Route path="/note/new" element={user ? <NoteEditor /> : <Navigate to="/login" />} />
        <Route path="/note/:id" element={user ? <NoteViewer /> : <Navigate to="/login" />} />
        <Route path="/note/:id/edit" element={user ? <NoteEditor /> : <Navigate to="/login" />} />
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
