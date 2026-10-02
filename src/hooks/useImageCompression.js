import { useState, useCallback } from 'react';
import { compressImage } from '../utils/imageCompression';

/**
 * Hook for compressing images on the client side with progress and state tracking.
 */
export function useImageCompression(defaultOptions = {}) {
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const compress = useCallback(async (file, customOptions = {}) => {
    if (!file || !file.type.startsWith('image/')) {
      return file;
    }

    setCompressing(true);
    setError(null);
    setProgress(10);

    try {
      setProgress(50);
      const compressedFile = await compressImage(file, { ...defaultOptions, ...customOptions });
      setProgress(100);
      return compressedFile;
    } catch (err) {
      setError(err.message || 'Image compression failed');
      throw err;
    } finally {
      setCompressing(false);
    }
  }, [defaultOptions]);

  return { compress, compressing, progress, error };
}

export default useImageCompression;
