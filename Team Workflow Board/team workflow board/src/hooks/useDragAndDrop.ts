import { useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types';

interface UseDragAndDropOptions {
  tasks: Task[];
  onReorder: (tasks: Task[]) => void;
  onStatusChange: (id: string, updates: { status: TaskStatus }) => void;
}

export const useDragAndDrop = ({ 
  tasks, 
  onReorder, 
  onStatusChange 
}: UseDragAndDropOptions) => {
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task
    const activeTask = tasks.find(task => task.id === activeId);
    if (!activeTask) return;

    // Check if we're dropping on a column (status change)
    if (['Backlog', 'In Progress', 'Done'].includes(overId)) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        onStatusChange(activeId, { status: newStatus });
      }
      return;
    }

    // Check if we're reordering within the same column
    const overTask = tasks.find(task => task.id === overId);
    if (!overTask || activeTask.status !== overTask.status) {
      return;
    }

    // Get indices for reordering
    const activeIndex = tasks.findIndex(task => task.id === activeId);
    const overIndex = tasks.findIndex(task => task.id === overId);

    if (activeIndex !== overIndex) {
      const reorderedTasks = arrayMove(tasks, activeIndex, overIndex);
      onReorder(reorderedTasks);
    }
  }, [tasks, onReorder, onStatusChange]);

  return {
    handleDragEnd
  };
};