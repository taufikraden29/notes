# BlogMe - Your Personal Blog Platform

BlogMe is a modern, user-friendly blog platform built with React and Vite. It allows users to create, edit, and publish blog posts with support for both regular text content and code snippets with syntax highlighting.

## Features

- **User Authentication**: Secure login system with Appwrite
- **Blog Post Management**: Create, edit, and delete blog posts
- **Code Snippets**: Support for code snippets with syntax highlighting
- **Category Management**: Organize posts by categories
- **Tagging System**: Add tags to posts for better organization
- **Responsive Design**: Works on desktop and mobile devices
- **Copy Functionality**: Easily copy code snippets with one click

## Technologies Used

- React 19
- Vite 7
- Appwrite for backend services
- Tailwind CSS for styling
- Prism.js for syntax highlighting
- React Router for navigation

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Appwrite backend and update `src/services/appwrite.js` with your credentials
4. Run the development server: `npm run dev`

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Appwrite Configuration

To use this application with Appwrite, you need to:

1. Create a new Appwrite project
2. Add the Appwrite endpoint and project ID to `src/services/appwrite.js`
3. Create a "notes" collection with the following fields:
   - title: String, size 256, required
   - content: String, size 4000, required
   - status: String, size 20, required (draft/published)
   - category: String, size 128, nullable
   - tags: String, size 256, nullable
   - owner: String, size 36, required
   - codeContent: String, size 4000, nullable
   - language: String, size 20, nullable
   - richTextContent: String, size 4000, nullable
   - mixedContent: String, size 10000, nullable (JSON string)

## License

This project is open source and available under the [MIT License](LICENSE).
