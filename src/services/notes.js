// src/services/notes.js
// INSTRUKSI PENTING:
// 1. Buat collection baru di Appwrite dengan nama "notes" (jika belum ada)
// 2. Tambahkan field-field berikut ke skema collection:
//    - title: String, size 256, required
//    - content: String, size 400, required
//    - category: String, size 128, nullable
//    - tags: String, size 256, nullable
//    - owner: String, size 36, required
// 3. Ganti COLLECTION_ID di bawah dengan ID collection notes yang sebenarnya

import { databases, Query } from "./appwrite";

const DATABASE_ID = "690a0b4e000da938919f"; // Database ID Anda
const COLLECTION_ID = "notes"; // GANTI DENGAN COLLECTION ID NOTES YANG SESUNGGUHNYA

export async function createNote(noteData, userId) {
  return await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    noteData.$id || "unique()",
    {
      title: noteData.title,
      content: noteData.content,
      status: noteData.status,
      category: noteData.category || null,
      tags: noteData.tags || null,
      owner: userId,
      codeContent: noteData.codeContent || null,
      language: noteData.language || null,
    }
  );
}

export async function getNotes(userId, categoryId = null) {
  let queries = [Query.equal("owner", userId), Query.orderDesc("$createdAt")];

  // Jika categoryId disediakan, tambahkan filter
  if (categoryId) {
    queries.push(Query.equal("category", categoryId));
  }

  return await databases.listDocuments(DATABASE_ID, COLLECTION_ID, queries);
}

export async function updateNote(noteId, noteData) {
  return await databases.updateDocument(DATABASE_ID, COLLECTION_ID, noteId, {
    title: noteData.title,
    content: noteData.content,
    status: noteData.status,
    category: noteData.category || null,
    tags: noteData.tags || null,
    updatedAt: noteData.updatedAt,
    codeContent: noteData.codeContent || null,
    language: noteData.language || null,
  });
}

export async function deleteNote(noteId) {
  return await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, noteId);
}
