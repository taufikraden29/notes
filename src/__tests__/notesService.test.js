import { createNote, updateNote, getNotes, autoSaveNote, cancelPendingAutoSave, getNoteById, getDraftNotes, deleteNote } from '../services/notes';
import { databases, Query } from '../services/appwrite';

// Mock the Appwrite database service
jest.mock('../services/appwrite', () => ({
  databases: {
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
  Query: {
    equal: jest.fn((key, value) => ({ key, value, method: 'equal' })),
    orderDesc: jest.fn((field) => ({ field, method: 'orderDesc' })),
  },
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((content) => content),
}));

// Mock document.createElement for DOMPurify simulation
Object.defineProperty(document, 'createElement', {
  value: () => ({
    innerHTML: '',
    textContent: '',
    innerText: '',
  }),
  writable: true,
});

describe('Notes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    test('creates a note with all required fields', async () => {
      const mockNoteData = {
        title: 'Test Note',
        content: 'Test content',
        status: 'draft',
        category: 'tech',
        tags: 'javascript,react',
        codeContent: 'console.log("hello");',
        language: 'javascript',
        richTextContent: '<p>Rich text</p>',
        mixedContent: [{ type: 'text', content: 'Mixed content' }],
      };
      
      const mockUserId = 'user123';
      const mockResponse = { $id: 'note123', ...mockNoteData };
      
      databases.createDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await createNote(mockNoteData, mockUserId);
      
      expect(databases.createDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        mockNoteData.$id || "unique()",
        expect.objectContaining({
          title: 'Test Note',
          content: 'Test content',
          status: 'draft',
          category: 'tech',
          tags: 'javascript,react',
          owner: mockUserId,
          codeContent: 'console.log("hello");',
          language: 'javascript',
          richTextContent: '<p>Rich text</p>',
          mixedContent: [{ type: 'text', content: 'Mixed content' }],
        })
      );
      
      expect(result).toEqual(mockResponse);
    });

    test('creates a note with minimal required fields', async () => {
      const mockNoteData = {
        title: 'Simple Note',
        content: 'Simple content',
        status: 'draft',
      };
      
      const mockUserId = 'user123';
      const mockResponse = { $id: 'note123', ...mockNoteData };
      
      databases.createDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await createNote(mockNoteData, mockUserId);
      
      expect(databases.createDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        mockNoteData.$id || "unique()",
        expect.objectContaining({
          title: 'Simple Note',
          content: 'Simple content',
          status: 'draft',
          category: null,
          tags: null,
          owner: mockUserId,
          codeContent: null,
          language: null,
          richTextContent: null,
          mixedContent: null,
        })
      );
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getNotes', () => {
    test('retrieves notes for a user', async () => {
      const mockUserId = 'user123';
      const mockResponse = {
        documents: [
          { $id: 'note1', title: 'Note 1', owner: mockUserId },
          { $id: 'note2', title: 'Note 2', owner: mockUserId },
        ],
      };
      
      databases.listDocuments.mockResolvedValueOnce(mockResponse);
      
      const result = await getNotes(mockUserId);
      
      expect(databases.listDocuments).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        [Query.equal("owner", mockUserId), Query.orderDesc("$createdAt")]
      );
      
      expect(result).toEqual(mockResponse);
    });

    test('retrieves notes for a user with category filter', async () => {
      const mockUserId = 'user123';
      const mockCategoryId = 'cat1';
      const mockResponse = {
        documents: [
          { $id: 'note1', title: 'Note 1', owner: mockUserId, category: mockCategoryId },
        ],
      };
      
      databases.listDocuments.mockResolvedValueOnce(mockResponse);
      
      const result = await getNotes(mockUserId, mockCategoryId);
      
      expect(databases.listDocuments).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        [
          Query.equal("owner", mockUserId),
          Query.orderDesc("$createdAt"),
          Query.equal("category", mockCategoryId)
        ]
      );
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateNote', () => {
    test('updates a note with all fields', async () => {
      const noteId = 'note123';
      const mockNoteData = {
        title: 'Updated Title',
        content: 'Updated content',
        status: 'published',
        category: 'updated category',
        tags: 'updated,tags',
        updatedAt: '2023-01-01T00:00:00Z',
        codeContent: 'console.log("updated");',
        language: 'javascript',
        richTextContent: '<p>Updated rich text</p>',
        mixedContent: [{ type: 'text', content: 'Updated mixed content' }],
      };
      
      const mockResponse = { $id: noteId, ...mockNoteData };
      
      databases.updateDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await updateNote(noteId, mockNoteData);
      
      expect(databases.updateDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        noteId,
        expect.objectContaining({
          title: 'Updated Title',
          content: 'Updated content',
          status: 'published',
          category: 'updated category',
          tags: 'updated,tags',
          updatedAt: '2023-01-01T00:00:00Z',
          codeContent: 'console.log("updated");',
          language: 'javascript',
          richTextContent: '<p>Updated rich text</p>',
          mixedContent: [{ type: 'text', content: 'Updated mixed content' }],
        })
      );
      
      expect(result).toEqual(mockResponse);
    });

    test('updates a note with minimal fields', async () => {
      const noteId = 'note123';
      const mockNoteData = {
        title: 'Updated Title',
        content: 'Updated content',
      };
      
      const mockResponse = { $id: noteId, title: 'Updated Title', content: 'Updated content' };
      
      databases.updateDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await updateNote(noteId, mockNoteData);
      
      expect(databases.updateDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        noteId,
        expect.objectContaining({
          title: 'Updated Title',
          content: 'Updated content',
        })
      );
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('autoSaveNote', () => {
    test('auto-saves rich text content', async () => {
      const noteId = 'note123';
      const mockNoteData = {
        richTextContent: '<p>Rich text content</p>',
        title: 'Auto-saved title',
      };
      
      const mockResponse = { $id: noteId, ...mockNoteData };
      
      databases.updateDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await autoSaveNote(noteId, mockNoteData);
      
      expect(databases.updateDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        noteId,
        expect.objectContaining({
          richTextContent: '<p>Rich text content</p>',
          content: 'Rich text content', // Plain text version for searchability
          title: 'Auto-saved title',
          updatedAt: expect.any(String), // Should be an ISO date string
        })
      );
      
      expect(result).toEqual(mockResponse);
    });

    test('auto-saves regular content', async () => {
      const noteId = 'note123';
      const mockNoteData = {
        content: 'Regular content',
      };
      
      const mockResponse = { $id: noteId, content: 'Regular content' };
      
      databases.updateDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await autoSaveNote(noteId, mockNoteData);
      
      expect(databases.updateDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        noteId,
        expect.objectContaining({
          content: 'Regular content',
          updatedAt: expect.any(String), // Should be an ISO date string
        })
      );
      
      expect(result).toEqual(mockResponse);
    });

    test('auto-saves code content', async () => {
      const noteId = 'note123';
      const mockNoteData = {
        codeContent: 'console.log("code");',
        language: 'javascript',
      };
      
      const mockResponse = { $id: noteId, codeContent: 'console.log("code");' };
      
      databases.updateDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await autoSaveNote(noteId, mockNoteData);
      
      expect(databases.updateDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        noteId,
        expect.objectContaining({
          codeContent: 'console.log("code");',
          content: 'console.log("code");', // Also stored in content for searchability
          updatedAt: expect.any(String), // Should be an ISO date string
        })
      );
      
      expect(result).toEqual(mockResponse);
    });

    test('auto-saves mixed content', async () => {
      const noteId = 'note123';
      const mockNoteData = {
        mixedContent: [
          { type: 'text', content: 'Text content' },
          { type: 'code', content: 'console.log("code");' },
        ],
      };
      
      const mockResponse = { $id: noteId, mixedContent: mockNoteData.mixedContent };
      
      databases.updateDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await autoSaveNote(noteId, mockNoteData);
      
      expect(databases.updateDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        noteId,
        expect.objectContaining({
          mixedContent: [
            { type: 'text', content: 'Text content' },
            { type: 'code', content: 'console.log("code");' },
          ],
          content: 'Text content\n\nconsole.log("code");', // Plain text version for searchability
          updatedAt: expect.any(String), // Should be an ISO date string
        })
      );
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getNoteById', () => {
    test('retrieves a specific note by ID', async () => {
      const noteId = 'note123';
      const mockResponse = {
        $id: noteId,
        title: 'Test Note',
        content: 'Test content',
      };
      
      databases.getDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await getNoteById(noteId);
      
      expect(databases.getDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        noteId
      );
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDraftNotes', () => {
    test('retrieves draft notes for a user', async () => {
      const mockUserId = 'user123';
      const mockResponse = {
        documents: [
          { $id: 'note1', title: 'Draft 1', status: 'draft', owner: mockUserId },
          { $id: 'note2', title: 'Draft 2', status: 'draft', owner: mockUserId },
        ],
      };
      
      databases.listDocuments.mockResolvedValueOnce(mockResponse);
      
      const result = await getDraftNotes(mockUserId);
      
      expect(databases.listDocuments).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        [
          Query.equal("owner", mockUserId),
          Query.equal("status", "draft"),
          Query.orderDesc("$updatedAt")
        ]
      );
      
      expect(result).toEqual(mockResponse);
    });

    test('retrieves draft notes for a user with category filter', async () => {
      const mockUserId = 'user123';
      const mockCategoryId = 'cat1';
      const mockResponse = {
        documents: [
          { $id: 'note1', title: 'Draft 1', status: 'draft', owner: mockUserId, category: mockCategoryId },
        ],
      };
      
      databases.listDocuments.mockResolvedValueOnce(mockResponse);
      
      const result = await getDraftNotes(mockUserId, mockCategoryId);
      
      expect(databases.listDocuments).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        [
          Query.equal("owner", mockUserId),
          Query.equal("status", "draft"),
          Query.orderDesc("$updatedAt"),
          Query.equal("category", mockCategoryId)
        ]
      );
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteNote', () => {
    test('deletes a note by ID', async () => {
      const noteId = 'note123';
      const mockResponse = { success: true };
      
      databases.deleteDocument.mockResolvedValueOnce(mockResponse);
      
      const result = await deleteNote(noteId);
      
      expect(databases.deleteDocument).toHaveBeenCalledWith(
        "690a0b4e000da938919f", // DATABASE_ID
        "notes", // COLLECTION_ID
        noteId
      );
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelPendingAutoSave', () => {
    test('cancels pending auto-save for a note', () => {
      // Since this function just cancels pending updates internally,
      // we can only test that it doesn't throw an error
      expect(() => cancelPendingAutoSave('note123')).not.toThrow();
    });
  });
});