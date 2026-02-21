// utils/documentUtils.js

/**
 * Get file extension from filename or URL
 * @param {string} filename - The filename or URL
 * @returns {string} - The file extension (lowercase, without dot)
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Get document type based on file extension or mime type
 * @param {string} filename - The filename or URL
 * @param {string} mimeType - Optional mime type
 * @returns {string} - Document category (pdf, word, excel, powerpoint, text, archive, code, etc.)
 */
export const getDocumentType = (filename, mimeType = '') => {
  const ext = getFileExtension(filename);
  
  // Check mime type first if provided
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    if (mimeType.includes('text')) return 'text';
    if (mimeType.includes('zip') || mimeType.includes('compress')) return 'archive';
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('html')) return 'code';
  }
  
  // Check by extension
  const pdfExts = ['pdf'];
  const wordExts = ['doc', 'docx', 'dot', 'dotx', 'docm', 'dotm'];
  const excelExts = ['xls', 'xlsx', 'xlsm', 'xltx', 'csv', 'xlsb'];
  const powerpointExts = ['ppt', 'pptx', 'pptm', 'potx', 'potm', 'ppsx'];
  const textExts = ['txt', 'rtf', 'md', 'markdown'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml'];
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoExts = ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
  
  if (pdfExts.includes(ext)) return 'pdf';
  if (wordExts.includes(ext)) return 'word';
  if (excelExts.includes(ext)) return 'excel';
  if (powerpointExts.includes(ext)) return 'powerpoint';
  if (textExts.includes(ext)) return 'text';
  if (archiveExts.includes(ext)) return 'archive';
  if (codeExts.includes(ext)) return 'code';
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  
  return 'document';
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get color for document type (for UI theming)
 * @param {string} docType - Document type
 * @returns {string} - Color class or hex code
 */
export const getDocumentColor = (docType) => {
  const colors = {
    pdf: '#F40F02', // Adobe red
    word: '#2B5797', // Microsoft Word blue
    excel: '#217346', // Microsoft Excel green
    powerpoint: '#D24726', // Microsoft PowerPoint orange
    text: '#757575', // Gray
    archive: '#FFA000', // Amber
    code: '#6A1B9A', // Purple
    image: '#2196F3', // Blue
    video: '#E91E63', // Pink
    audio: '#00ACC1', // Cyan
    document: '#607D8B' // Blue-gray
  };
  
  return colors[docType] || colors.document;
};

/**
 * Get background color class for document type
 * @param {string} docType - Document type
 * @returns {string} - Tailwind color class
 */
export const getDocumentBgClass = (docType) => {
  const classes = {
    pdf: 'bg-red-100 dark:bg-red-900/30',
    word: 'bg-blue-100 dark:bg-blue-900/30',
    excel: 'bg-green-100 dark:bg-green-900/30',
    powerpoint: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'bg-gray-100 dark:bg-gray-800',
    archive: 'bg-amber-100 dark:bg-amber-900/30',
    code: 'bg-purple-100 dark:bg-purple-900/30',
    image: 'bg-blue-100 dark:bg-blue-900/30',
    video: 'bg-pink-100 dark:bg-pink-900/30',
    audio: 'bg-cyan-100 dark:bg-cyan-900/30',
    document: 'bg-gray-100 dark:bg-gray-800'
  };
  
  return classes[docType] || classes.document;
};

/**
 * Get text color class for document type
 * @param {string} docType - Document type
 * @returns {string} - Tailwind color class
 */
export const getDocumentTextClass = (docType) => {
  const classes = {
    pdf: 'text-red-600 dark:text-red-400',
    word: 'text-blue-600 dark:text-blue-400',
    excel: 'text-green-600 dark:text-green-400',
    powerpoint: 'text-orange-600 dark:text-orange-400',
    text: 'text-gray-600 dark:text-gray-400',
    archive: 'text-amber-600 dark:text-amber-400',
    code: 'text-purple-600 dark:text-purple-400',
    image: 'text-blue-600 dark:text-blue-400',
    video: 'text-pink-600 dark:text-pink-400',
    audio: 'text-cyan-600 dark:text-cyan-400',
    document: 'text-gray-600 dark:text-gray-400'
  };
  
  return classes[docType] || classes.document;
};

/**
 * Get display name for document type
 * @param {string} docType - Document type
 * @returns {string} - Human-readable document type
 */
export const getDocumentTypeName = (docType) => {
  const names = {
    pdf: 'PDF Document',
    word: 'Word Document',
    excel: 'Excel Spreadsheet',
    powerpoint: 'PowerPoint Presentation',
    text: 'Text File',
    archive: 'Archive',
    code: 'Code File',
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    document: 'Document'
  };
  
  return names[docType] || 'Document';
};