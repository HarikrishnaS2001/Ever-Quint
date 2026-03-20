import { useState, useCallback, useEffect } from 'react';
import type { CreateTaskInput } from '../types';

interface FormErrors {
  title?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  tags?: string;
}

interface UseTaskFormOptions {
  initialValues?: Partial<CreateTaskInput>;
  onSubmit: (data: CreateTaskInput) => void;
}

export const useTaskForm = ({ initialValues = {}, onSubmit }: UseTaskFormOptions) => {
  const [values, setValues] = useState<CreateTaskInput>({
    title: initialValues.title || '',
    description: initialValues.description || '',
    priority: initialValues.priority || 'Medium',
    assignee: initialValues.assignee || '',
    tags: initialValues.tags || []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values when initialValues changes (only for editing existing tasks)
  useEffect(() => {
    // Only update if we have actual initial values (editing a task)
    if (initialValues.title) {
      setValues({
        title: initialValues.title || '',
        description: initialValues.description || '',
        priority: initialValues.priority || 'Medium',
        assignee: initialValues.assignee || '',
        tags: initialValues.tags || []
      });
      setErrors({}); // Clear any existing errors when loading new data
    }
  }, [initialValues]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!values.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (values.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Description validation
    if (!values.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (values.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Assignee validation
    if (!values.assignee.trim()) {
      newErrors.assignee = 'Assignee is required';
    }

    // Priority validation
    if (!['Low', 'Medium', 'High'].includes(values.priority)) {
      newErrors.priority = 'Invalid priority level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const updateField = useCallback(<K extends keyof CreateTaskInput>(
    field: K,
    value: CreateTaskInput[K]
  ) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !values.tags.includes(trimmedTag)) {
      updateField('tags', [...values.tags, trimmedTag]);
    }
  }, [values.tags, updateField]);

  const removeTag = useCallback((tagToRemove: string) => {
    updateField('tags', values.tags.filter(tag => tag !== tagToRemove));
  }, [values.tags, updateField]);

  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (validateForm()) {
        await onSubmit(values);
        
        // Reset form after successful submission
        setValues({
          title: '',
          description: '',
          priority: 'Medium',
          assignee: '',
          tags: []
        });
        setErrors({});
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, isSubmitting, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setValues({
      title: initialValues.title || '',
      description: initialValues.description || '',
      priority: initialValues.priority || 'Medium',
      assignee: initialValues.assignee || '',
      tags: initialValues.tags || []
    });
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    updateField,
    addTag,
    removeTag,
    handleSubmit,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
};