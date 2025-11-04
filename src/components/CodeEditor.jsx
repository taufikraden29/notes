import React, { useState } from 'react';

const CodeEditor = ({ value, onChange, language = 'javascript' }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  // Update the language when the prop changes
  React.useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    // Update the language in the parent component if needed
    onChange(value, e.target.value);
  };

  const handleContentChange = (e) => {
    onChange(e.target.value, selectedLanguage);
  };

  // Available languages for syntax highlighting
  const languages = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'php', 'ruby', 
    'go', 'rust', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash', 'shell', 'json'
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3">
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <label htmlFor="language-select" className="text-sm font-medium text-gray-200">
            Language:
          </label>
        </div>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="ml-2 block w-32 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-800"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={value}
        onChange={handleContentChange}
        className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 border-0 focus:outline-none resize-none"
        placeholder="Enter your code here..."
        spellCheck="false"
      />
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
        Tip: Use the syntax highlighter to format your code for better readability
      </div>
    </div>
  );
};

export default CodeEditor;