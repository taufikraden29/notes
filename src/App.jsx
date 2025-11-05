import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import NoteEditor from './components/NoteEditor';
import NoteViewer from './components/NoteViewer';
import CategoriesManager from './components/CategoriesManager';
import './App.css';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/categories" element={
          <ProtectedRoute>
            <CategoriesManager />
          </ProtectedRoute>
        } />
        <Route path="/note/new" element={
          <ProtectedRoute>
            <NoteEditor />
          </ProtectedRoute>
        } />
        <Route path="/note/:id" element={
          <ProtectedRoute>
            <NoteViewer />
          </ProtectedRoute>
        } />
        <Route path="/note/:id/edit" element={
          <ProtectedRoute>
            <NoteEditor />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
