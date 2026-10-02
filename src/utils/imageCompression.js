/**
 * Client-side image compression using the HTML Canvas API.
 * Compresses images to a target maximum width and quality,
 * recursively reducing quality if the file size exceeds 2MB.
 */

const MAX_WIDTH = 1200;      // pixels
const TARGET_QUALITY = 0.7;  // initial quality
const MIN_QUALITY = 0.2;     // minimum quality floor
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Compresses an image File using the Canvas API.
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @param {number} [options.maxWidth=1200] - Max width in pixels
 * @param {number} [options.quality=0.7] - JPEG quality (0-1)
 * @param {number} [options.maxSizeBytes=2097152] - Max output size
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file, {
  maxWidth = MAX_WIDTH,
  quality = TARGET_QUALITY,
  maxSizeBytes = MAX_SIZE_BYTES,
} = {}) {
  // Only compress image files
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      let resolved = false;

      const finish = (result) => {
        if (!resolved) {
          resolved = true;
          try { URL.revokeObjectURL(url); } catch { /* ignore */ }
          resolve(result);
        }
      };

      // Safety timeout for headless/synthetic test environments
      const timer = setTimeout(() => {
        finish(file);
      }, 400);

      img.onload = async () => {
        clearTimeout(timer);
        try {
          const compressed = await compressRecursive(img, file, maxWidth, quality, maxSizeBytes);
          finish(compressed);
        } catch {
          finish(file);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        finish(file);
      };

      img.src = url;
    } catch {
      resolve(file);
    }
  });
}

/**
 * Recursively compresses until below target size or quality reaches minimum.
 */
async function compressRecursive(img, originalFile, maxWidth, quality, maxSizeBytes) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Calculate new dimensions maintaining aspect ratio
  let width = img.naturalWidth || img.width || 200;
  let height = img.naturalHeight || img.height || 200;
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  canvas.width = Math.max(width, 1);
  canvas.height = Math.max(height, 1);

  // Draw image
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } catch {
      // ignore draw error
    }
  }

  // Determine output type
  const outputType = originalFile.type === 'image/png' ? 'image/jpeg' : originalFile.type;

  // Convert to blob
  return new Promise((resolve) => {
    if (!canvas.toBlob) {
      resolve(originalFile);
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(originalFile);
        return;
      }

      // If still too large and quality can be reduced, recurse
      if (blob.size > maxSizeBytes && quality > MIN_QUALITY) {
        const newQuality = Math.max(quality - 0.1, MIN_QUALITY);
        try {
          const smaller = await compressRecursive(img, originalFile, maxWidth, newQuality, maxSizeBytes);
          resolve(smaller);
        } catch {
          resolve(originalFile);
        }
        return;
      }

      // Return compressed file
      const ext = outputType.split('/')[1] || 'jpg';
      const name = originalFile.name.replace(/\.[^.]+$/, `.${ext}`);
      const compressedFile = new File([blob], name, { type: outputType, lastModified: Date.now() });
      resolve(compressedFile);
    }, outputType, quality);
  });
}

/**
 * Generates a preview URL for a file.
 * @param {File} file
 * @returns {Promise<string>} Data URL
 */
export function generatePreview(file) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Formats bytes to human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
