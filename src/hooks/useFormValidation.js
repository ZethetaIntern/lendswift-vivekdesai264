import { useState, useCallback } from 'react';

/**
 * Hook for managing form validation state and custom validation logic against schemas.
 */
export function useFormValidation(schema) {
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (data) => {
    if (!schema) return { success: true, data };
    
    setIsValidating(true);
    try {
      const result = await schema.safeParseAsync(data);
      if (result.success) {
        setErrors({});
        return { success: true, data: result.data };
      } else {
        const formattedErrors = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          formattedErrors[path] = issue.message;
        });
        setErrors(formattedErrors);
        return { success: false, errors: formattedErrors };
      }
    } finally {
      setIsValidating(false);
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    validate,
    errors,
    isValidating,
    clearErrors,
  };
}

export default useFormValidation;
