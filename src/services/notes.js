// src/services/notes.js
// INSTRUKSI PENTING:
// 1. Buat collection baru di Appwrite dengan nama "notes" (jika belum ada)
// 2. Tambahkan field-field berikut ke skema collection:
//    - title: String, size 256, required
//    - content: String, size 4000, required
//    - status: String, size 20, required (draft/published)
//    - category: String, size 128, nullable
//    - tags: String, size 256, nullable
//    - owner: String, size 36, required
//    - codeContent: String, size 4000, nullable
//    - language: String, size 20, nullable
//    - richTextContent: String, size 4000, nullable
//    - mixedContent: String, size 10000, nullable (JSON string)
// 3. Ganti COLLECTION_ID di bawah dengan ID collection notes yang sebenarnya

import { databases, Query } from "./appwrite";

const DATABASE_ID = "690a0b4e000da938919f"; // Database ID Anda
const COLLECTION_ID = "notes"; // GANTI DENGAN COLLECTION ID NOTES YANG SESUNGGUHNYA

// Debounced update function to optimize frequent saves
class NoteUpdateManager {
  constructor() {
    this.pendingUpdates = new Map();
    this.debounceTimers = new Map();
  }

  // Debounced update function to reduce API calls during auto-save
  async debouncedUpdate(noteId, noteData, delay = 1000) {
    // Clear existing timer for this note
    if (this.debounceTimers.has(noteId)) {
      clearTimeout(this.debounceTimers.get(noteId));
    }

    // Merge with existing pending update or create new one
    const existingUpdate = this.pendingUpdates.get(noteId) || {};
    const mergedUpdate = { ...existingUpdate, ...noteData };

    this.pendingUpdates.set(noteId, mergedUpdate);

    // Set new timer
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const result = await this.executeUpdate(noteId, mergedUpdate);
          this.pendingUpdates.delete(noteId);
          this.debounceTimers.delete(noteId);
          resolve(result);
        } catch (error) {
          this.debounceTimers.delete(noteId);
          reject(error);
        }
      }, delay);

      this.debounceTimers.set(noteId, timer);
    });
  }

  async executeUpdate(noteId, noteData) {
    return await databases.updateDocument(DATABASE_ID, COLLECTION_ID, noteId, noteData);
  }

  // Cancel pending updates for a specific note
  cancelPendingUpdate(noteId) {
    if (this.debounceTimers.has(noteId)) {
      clearTimeout(this.debounceTimers.get(noteId));
      this.debounceTimers.delete(noteId);
      this.pendingUpdates.delete(noteId);
    }
  }
}

const updateManager = new NoteUpdateManager();

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
      richTextContent: noteData.richTextContent || null,
      mixedContent: noteData.mixedContent || null,
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

// Optimized update function for regular updates
export async function updateNote(noteId, noteData) {
  const updatePayload = {
    title: noteData.title,
    content: noteData.content,
    status: noteData.status,
    category: noteData.category || null,
    tags: noteData.tags || null,
    updatedAt: noteData.updatedAt,
    codeContent: noteData.codeContent || null,
    language: noteData.language || null,
    richTextContent: noteData.richTextContent || null,
    mixedContent: noteData.mixedContent || null,
  };

  // Remove undefined/null values to avoid updating with null values unnecessarily
  Object.keys(updatePayload).forEach(key => {
    if (updatePayload[key] === undefined || updatePayload[key] === null) {
      delete updatePayload[key];
    }
  });

  return await databases.updateDocument(DATABASE_ID, COLLECTION_ID, noteId, updatePayload);
}

// Optimized update function specifically for auto-save operations
export async function autoSaveNote(noteId, noteData) {
  // For auto-save, we only update the content fields that are being edited
  const autoSavePayload = {};

  if (noteData.richTextContent !== undefined) {
    autoSavePayload.richTextContent = noteData.richTextContent;
    // Also update plain content for searchability
    const div = document.createElement('div');
    div.innerHTML = noteData.richTextContent;
    autoSavePayload.content = div.textContent || div.innerText || '';
  } else if (noteData.content !== undefined) {
    autoSavePayload.content = noteData.content;
  } else if (noteData.codeContent !== undefined) {
    autoSavePayload.codeContent = noteData.codeContent;
    autoSavePayload.content = noteData.codeContent;
  } else if (noteData.mixedContent !== undefined) {
    autoSavePayload.mixedContent = noteData.mixedContent;
    // Create a plain text version for searchability
    autoSavePayload.content = Array.isArray(noteData.mixedContent) 
      ? noteData.mixedContent.map(item => item.content).join('\n\n') 
      : '';
  }

  // Only update title if it's provided in the auto-save data
  if (noteData.title !== undefined) {
    autoSavePayload.title = noteData.title;
  }

  // Only update status if it's provided in the auto-save data
  if (noteData.status !== undefined) {
    autoSavePayload.status = noteData.status;
  }

  // Only update category if it's provided in the auto-save data
  if (noteData.category !== undefined) {
    autoSavePayload.category = noteData.category;
  }

  // Only update tags if it's provided in the auto-save data
  if (noteData.tags !== undefined) {
    autoSavePayload.tags = noteData.tags;
  }

  // Always update the last modified time for auto-saves
  autoSavePayload.updatedAt = new Date().toISOString();

  // Use debounced update to optimize frequent auto-save requests
  return await updateManager.debouncedUpdate(noteId, autoSavePayload, 1000);
}

// Function to cancel pending auto-save updates (useful when user manually saves)
export function cancelPendingAutoSave(noteId) {
  updateManager.cancelPendingUpdate(noteId);
}

// Function to get a specific note by ID
export async function getNoteById(noteId) {
  return await databases.getDocument(DATABASE_ID, COLLECTION_ID, noteId);
}

// Function to get draft notes only
export async function getDraftNotes(userId, categoryId = null) {
  let queries = [
    Query.equal("owner", userId),
    Query.equal("status", "draft"),
    Query.orderDesc("$updatedAt")
  ];

  // Jika categoryId disediakan, tambahkan filter
  if (categoryId) {
    queries.push(Query.equal("category", categoryId));
  }

  return await databases.listDocuments(DATABASE_ID, COLLECTION_ID, queries);
}

export async function deleteNote(noteId) {
  return await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, noteId);
}
