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
      
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Kategori *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan nama kategori"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Warna Kategori
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-12 h-12 border-0 rounded cursor-pointer"
              />
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
                placeholder="#RRGGBB"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Deskripsi kategori (opsional)"
            ></textarea>
            {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
          </div>
        </div>
        
        {errors.submit && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {errors.submit}
          </div>
        )}
        
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
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