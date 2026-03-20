import React, { useState } from 'react';
import type { CreateTaskInput, TaskPriority } from '../types';
import { useTaskForm } from '../hooks';
import { Button, TextInput, Select, Tag, Modal } from './ui';
import styles from './TaskForm.module.css';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  initialValues?: Partial<CreateTaskInput>;
  title?: string;
}

const priorityOptions = [
  { value: 'Low', label: 'Low Priority' },
  { value: 'Medium', label: 'Medium Priority' },
  { value: 'High', label: 'High Priority' }
];

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues = {},
  title = 'Create New Task'
}) => {
  const [newTag, setNewTag] = useState('');
  
  const {
    values,
    errors,
    isSubmitting,
    updateField,
    addTag,
    removeTag,
    handleSubmit,
    resetForm
  } = useTaskForm({
    initialValues,
    onSubmit: async (data) => {
      onSubmit(data);
      onClose();
    }
  });

  const handleClose = () => {
    resetForm();
    setNewTag('');
    onClose();
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleAddTagClick = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(e as any);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      data-testid="task-form-modal"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <TextInput
            label="Task Title"
            value={values.title}
            onChange={(value) => updateField('title', value)}
            placeholder="Enter a descriptive title for the task"
            error={errors.title}
            required
            maxLength={100}
          />
        </div>

        <div className={styles.field}>
          <TextInput
            label="Description"
            value={values.description}
            onChange={(value) => updateField('description', value)}
            placeholder="Provide details about what needs to be done"
            multiline
            rows={4}
            error={errors.description}
            required
            maxLength={500}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <Select
              label="Priority"
              value={values.priority}
              onChange={(value) => updateField('priority', value as TaskPriority)}
              options={priorityOptions}
              error={errors.priority}
              required
            />
          </div>

          <div className={styles.field}>
            <TextInput
              label="Assignee"
              value={values.assignee}
              onChange={(value) => updateField('assignee', value)}
              placeholder="Who will work on this task?"
              error={errors.assignee}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Tags
            <span className={styles.optional}>(optional)</span>
          </label>
          
          <div className={styles.tagInput}>
            <TextInput
              value={newTag}
              onChange={setNewTag}
              placeholder="Add a tag and press Enter"
              onKeyDown={handleKeyPress}
            />
            <Button
              type="button"
              onClick={handleAddTagClick}
              variant="secondary"
              size="sm"
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </div>

          {values.tags.length > 0 && (
            <div className={styles.tags}>
              {values.tags.map(tag => (
                <Tag
                  key={tag}
                  removable
                  onRemove={() => removeTag(tag)}
                  size="sm"
                  color="blue"
                >
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {initialValues.title ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};