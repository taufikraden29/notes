// Service untuk manajemen kategori menggunakan Appwrite
// INSTRUKSI PENTING:
// 1. Buat collection baru di Appwrite dengan nama "categories"
// 2. Tambahkan field-field berikut ke skema collection:
//    - name: String, size 255, required
//    - color: String, size 7 (for hex color), required
//    - description: String, size 102, nullable
//    - userId: String, size 36, required
//    - parentId: String, size 36, nullable
// 3. Ganti CATEGORIES_COLLECTION_ID di bawah dengan ID collection yang sebenarnya
// 4. Juga perbarui COLLECTION_ID di notes.js dengan ID collection notes yang sebenarnya

import { databases, ID, Query } from "./appwrite";

const DATABASE_ID = "690a0b4e000da938919f"; // Database ID Anda
const CATEGORIES_COLLECTION_ID = "categories"; // GANTI DENGAN COLLECTION ID KATEGORI YANG SESUNGGUHNYA

export async function createCategory(categoryData, userId) {
  return await databases.createDocument(
    DATABASE_ID,
    CATEGORIES_COLLECTION_ID,
    ID.unique(),
    {
      name: categoryData.name,
      color: categoryData.color,
      description: categoryData.description || null,
      userId: userId,
      parentId: categoryData.parentId || null,
    }
  );
}

export async function getCategories(userId) {
  return await databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID, [
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
  ]);
}

export async function updateCategory(categoryId, categoryData) {
  return await databases.updateDocument(
    DATABASE_ID,
    CATEGORIES_COLLECTION_ID,
    categoryId,
    {
      name: categoryData.name,
      color: categoryData.color,
      description: categoryData.description || null,
      parentId: categoryData.parentId || null,
    }
  );
}

export async function deleteCategory(categoryId) {
  return await databases.deleteDocument(
    DATABASE_ID,
    CATEGORIES_COLLECTION_ID,
    categoryId
  );
}

export async function getCategoryById(categoryId) {
  return await databases.getDocument(
    DATABASE_ID,
    CATEGORIES_COLLECTION_ID,
    categoryId
  );
}
