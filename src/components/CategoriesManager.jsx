import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CategoriesList from './CategoriesList';
import CategoryForm from './CategoryForm';

const CategoriesManager = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Untuk memicu refresh

  const handleAdd = () => {
    setCurrentCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setShowForm(true);
  };

  const handleSave = (category) => {
    setShowForm(false);
    setCurrentCategory(null);
    // Memicu refresh daftar kategori
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setCurrentCategory(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Kategori</h1>
        <p className="text-gray-600">Kelola kategori untuk mengorganisir catatan Anda</p>
      </div>

      {!showForm ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Daftar Kategori</h2>
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Tambah Kategori
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <CategoriesList 
              userId={user.$id}
              onEdit={handleEdit} 
              key={refreshTrigger}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center">
              <button
                onClick={handleCancel}
                className="text-indigo-700 hover:text-indigo-900 flex items-center font-medium"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Kembali ke daftar
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <CategoryForm
              category={currentCategory}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;