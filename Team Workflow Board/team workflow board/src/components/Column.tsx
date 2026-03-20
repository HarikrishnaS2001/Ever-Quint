import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { Button } from './ui';
import styles from './Column.module.css';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'Backlog':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    case 'In Progress':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H6a1 1 0 100 2h4.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      );
    case 'Done':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
  }
};

const getColumnClass = (status: TaskStatus) => {
  switch (status) {
    case 'Backlog':
      return styles.backlog;
    case 'In Progress':
      return styles.inProgress;
    case 'Done':
      return styles.done;
  }
};

export const Column: React.FC<ColumnProps> = ({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTaskClick
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });

  const taskIds = tasks.map(task => task.id);

  const columnClass = [
    styles.column,
    getColumnClass(status),
    isOver && styles.dragOver
  ].filter(Boolean).join(' ');

  return (
    <div className={columnClass} data-testid={`column-${status.toLowerCase().replace(' ', '-')}`}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <div className={styles.icon}>
            {getStatusIcon(status)}
          </div>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.count}>
            {tasks.length}
          </div>
        </div>
        
        {status === 'Backlog' && (
          <Button 
            size="sm" 
            onClick={onAddTask}
            aria-label="Add new task"
            className={styles.addButton}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" clipRule="evenodd" />
            </svg>
            Add Task
          </Button>
        )}
      </div>

      <div ref={setNodeRef} className={styles.taskList}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {getStatusIcon(status)}
            </div>
            <p className={styles.emptyText}>
              {status === 'Backlog' 
                ? 'No tasks in backlog. Create one to get started!'
                : status === 'In Progress'
                ? 'No tasks in progress. Drag tasks here to start working.'
                : 'No completed tasks yet. Move finished tasks here.'
              }
            </p>
            {status === 'Backlog' && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onAddTask}
                className={styles.emptyAction}
              >
                Create First Task
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};