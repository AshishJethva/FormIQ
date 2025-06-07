// src/utils/fileValidation.ts

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Enhanced file type validation that handles all scenarios consistently
 */
export const validateFileType = (
  file: File,
  acceptAttribute?: string,
  fieldType?: 'image' | 'fileUpload'
): FileValidationResult => {
  console.log('🔍 Validating file:', {
    fileName: file.name,
    mimeType: file.type,
    acceptAttribute,
    fieldType,
  });

  // Handle empty, undefined, or wildcard accept attributes
  if (
    !acceptAttribute ||
    acceptAttribute === '*/*' ||
    acceptAttribute === '*' ||
    acceptAttribute.trim() === '' ||
    acceptAttribute === 'undefined' ||
    acceptAttribute === 'null'
  ) {
    console.log('✅ No restrictions or wildcard - file accepted');

    // Still check for dangerous file types
    if (isDangerousFileType(file)) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons',
      };
    }

    return { isValid: true };
  }

  // For image fields, validate it's actually an image
  if (fieldType === 'image') {
    if (!file.type.startsWith('image/')) {
      console.log('❌ Image field requires image file, got:', file.type);
      return {
        isValid: false,
        error: 'Only image files are allowed',
      };
    }

    // If accept is just "image/*", allow all images
    if (acceptAttribute === 'image/*') {
      console.log('✅ Image field accepts all images');
      return { isValid: true };
    }
  }

  // Parse accept attribute
  const allowedTypes = acceptAttribute
    .split(',')
    .map(type => type.trim().toLowerCase())
    .filter(type => type.length > 0);

  console.log('📋 Parsed allowed types:', allowedTypes);

  // Check each allowed type
  for (const allowedType of allowedTypes) {
    console.log(`🔍 Checking against: "${allowedType}"`);

    if (checkTypeMatch(allowedType, file)) {
      console.log(`✅ File matches type: ${allowedType}`);
      return { isValid: true };
    }
  }

  console.log('❌ File type not allowed:', {
    fileType: file.type,
    fileName: file.name,
    allowedTypes,
  });

  return {
    isValid: false,
    error: `File type "${file.type}" is not allowed. Accepted types: ${acceptAttribute}`,
  };
};

/**
 * Check if a specific type matches the file
 */
const checkTypeMatch = (allowedType: string, file: File): boolean => {
  // Handle wildcard MIME types (e.g., "image/*", "video/*")
  if (allowedType.endsWith('/*')) {
    const baseType = allowedType.slice(0, -2);
    return file.type.toLowerCase().startsWith(baseType + '/');
  }

  // Handle file extensions (e.g., ".pdf", ".doc")
  if (allowedType.startsWith('.')) {
    return file.name.toLowerCase().endsWith(allowedType.toLowerCase());
  }

  // Handle exact MIME types (e.g., "application/pdf")
  if (file.type.toLowerCase() === allowedType) {
    return true;
  }

  // Handle common aliases
  return checkAliasMatch(allowedType, file);
};

/**
 * Check alias matches for common file types
 */
const checkAliasMatch = (alias: string, file: File): boolean => {
  const aliasMap: Record<
    string,
    { mimeTypes: string[]; extensions: string[] }
  > = {
    pdf: {
      mimeTypes: ['application/pdf'],
      extensions: ['.pdf'],
    },
    doc: {
      mimeTypes: [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      extensions: ['.doc', '.docx'],
    },
    docx: {
      mimeTypes: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      extensions: ['.docx'],
    },
    xls: {
      mimeTypes: [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      extensions: ['.xls', '.xlsx'],
    },
    xlsx: {
      mimeTypes: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      extensions: ['.xlsx'],
    },
    ppt: {
      mimeTypes: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
      extensions: ['.ppt', '.pptx'],
    },
    pptx: {
      mimeTypes: [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
      extensions: ['.pptx'],
    },
    txt: {
      mimeTypes: ['text/plain'],
      extensions: ['.txt'],
    },
    csv: {
      mimeTypes: ['text/csv', 'application/csv'],
      extensions: ['.csv'],
    },
    json: {
      mimeTypes: ['application/json'],
      extensions: ['.json'],
    },
    xml: {
      mimeTypes: ['text/xml', 'application/xml'],
      extensions: ['.xml'],
    },
    zip: {
      mimeTypes: ['application/zip'],
      extensions: ['.zip'],
    },
    rar: {
      mimeTypes: ['application/x-rar-compressed'],
      extensions: ['.rar'],
    },
    jpg: {
      mimeTypes: ['image/jpeg'],
      extensions: ['.jpg', '.jpeg'],
    },
    jpeg: {
      mimeTypes: ['image/jpeg'],
      extensions: ['.jpg', '.jpeg'],
    },
    png: {
      mimeTypes: ['image/png'],
      extensions: ['.png'],
    },
    gif: {
      mimeTypes: ['image/gif'],
      extensions: ['.gif'],
    },
    svg: {
      mimeTypes: ['image/svg+xml'],
      extensions: ['.svg'],
    },
    webp: {
      mimeTypes: ['image/webp'],
      extensions: ['.webp'],
    },
    mp4: {
      mimeTypes: ['video/mp4'],
      extensions: ['.mp4'],
    },
    avi: {
      mimeTypes: ['video/avi'],
      extensions: ['.avi'],
    },
    mov: {
      mimeTypes: ['video/quicktime'],
      extensions: ['.mov'],
    },
    mp3: {
      mimeTypes: ['audio/mpeg'],
      extensions: ['.mp3'],
    },
    wav: {
      mimeTypes: ['audio/wav'],
      extensions: ['.wav'],
    },
  };

  const aliasData = aliasMap[alias];
  if (!aliasData) return false;

  // Check MIME type match
  if (aliasData.mimeTypes.includes(file.type.toLowerCase())) {
    return true;
  }

  // Check extension match
  const fileName = file.name.toLowerCase();
  return aliasData.extensions.some(ext => fileName.endsWith(ext));
};

/**
 * Check if file type is potentially dangerous
 */
const isDangerousFileType = (file: File): boolean => {
  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.scr',
    '.pif',
    '.com',
    '.vbs',
    '.js',
    '.jar',
    '.msi',
    '.dll',
    '.app',
    '.deb',
    '.rpm',
    '.dmg',
  ];

  const fileName = file.name.toLowerCase();
  return dangerousExtensions.some(ext => fileName.endsWith(ext));
};

/**
 * Validate file size
 */
export const validateFileSize = (
  file: File,
  maxSize: number
): FileValidationResult => {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }
  return { isValid: true };
};

/**
 * Complete file validation (type + size)
 */
export const validateFile = (
  file: File,
  options: {
    accept?: string;
    fieldType?: 'image' | 'fileUpload';
    maxSize?: number;
    multiple?: boolean;
    existingFileCount?: number;
  } = {}
): FileValidationResult => {
  const {
    accept,
    fieldType,
    maxSize = fieldType === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024,
    multiple = false,
    existingFileCount = 0,
  } = options;

  console.log('🔍 Complete file validation:', {
    fileName: file.name,
    size: file.size,
    type: file.type,
    options,
  });

  // Validate file count
  if (!multiple && existingFileCount >= 1) {
    return {
      isValid: false,
      error: 'Only one file is allowed',
    };
  }

  if (existingFileCount >= 10) {
    return {
      isValid: false,
      error: 'Maximum 10 files allowed',
    };
  }

  // Validate file size
  // Validate file size
  const sizeResult = validateFileSize(file, maxSize);
  if (!sizeResult.isValid) {
    return sizeResult;
  }
  // Validate file type
  const typeResult = validateFileType(file, accept, fieldType);
  if (!typeResult.isValid) {
    return typeResult;
  }

  console.log('✅ File validation passed:', file.name);
  return { isValid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Check if file is an image based on MIME type
 */
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

/**
 * Get appropriate icon for file type
 */
export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return '📈';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('archive')
  )
    return '📦';
  return '📄'; // Default file icon
};
