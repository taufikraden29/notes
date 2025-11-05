import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createCategory, updateCategory } from '../services/categoryServiceAppwrite';

const CategoryForm = ({ category = null, onSave, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || '#4F46E5',
    description: category?.description || '',
    parentId: category?.parentId || null
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Menghapus error saat user mengetik
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama kategori wajib diisi';
    }
    
    if (formData.name.length > 255) {
      newErrors.name = 'Nama kategori tidak boleh lebih dari 255 karakter';
    }
    
    if (formData.description && formData.description.length > 102) {
      newErrors.description = 'Deskripsi tidak boleh lebih dari 102 karakter';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      let result;
      if (category) {
        // Update kategori yang sudah ada
        result = await updateCategory(category.id, {
          name: formData.name,
          color: formData.color,
          description: formData.description,
          parentId: formData.parentId
        });
      } else {
        // Buat kategori baru
        result = await createCategory({
          name: formData.name,
          color: formData.color,
          description: formData.description,
          parentId: formData.parentId
        }, user.$id);
      }
      
      if (result) {
        onSave(result); // Panggil callback setelah berhasil
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setErrors({ submit: 'Gagal menyimpan kategori. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {category ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {category 
            ? 'Perbarui detail kategori yang ada' 
            : 'Buat kategori baru untuk mengorganisir catatan Anda'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan nama kategori"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="color" className="block text-sm font-medium text-gray-700">
              Warna Kategori
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-12 h-12 border-0 rounded cursor-pointer overflow-hidden"
                  title="Pilih warna"
                />
                <div className="absolute inset-0 rounded border border-gray-300 pointer-events-none"></div>
              </div>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="block w-32 rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
                placeholder="#RRGGBB"
              />
              
              {/* Predefined color options */}
              <div className="flex space-x-2">
                {['#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    className={`w-6 h-6 rounded-full border ${
                      formData.color === color ? 'border-gray-900 ring-2 ring-offset-2 ring-indigo-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Set color to ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border transition-colors ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Deskripsi kategori (opsional)"
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.description}
              </p>
            )}
          </div>
        </div>
        
        {errors.submit && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{errors.submit}</span>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : (
              category ? 'Update Kategori' : 'Simpan Kategori'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;