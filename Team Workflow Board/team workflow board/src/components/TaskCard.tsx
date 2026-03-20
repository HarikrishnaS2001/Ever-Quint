import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types";
import { Card, Tag, getPriorityColor } from "./ui";
import { format } from "date-fns";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.actions}`)) {
      return;
    }
    onClick?.();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.wrapper}
      {...attributes}
      {...listeners}
    >
      <Card
        variant="elevated"
        className={styles.card}
        onClick={handleCardClick}
        draggable
        data-testid={`task-card-${task.id}`}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{task.title}</h3>
          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              onClick={handleEdit}
              aria-label="Edit task"
              title="Edit task"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z" />
              </svg>
            </button>
            <button
              className={`${styles.actionButton} ${styles.delete}`}
              onClick={handleDelete}
              aria-label="Delete task"
              title="Delete task"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"
                />
              </svg>
            </button>
          </div>
        </div>

        <p className={styles.description}>{task.description}</p>

        <div className={styles.metadata}>
          <div className={styles.tags}>
            <Tag
              variant="priority"
              color={getPriorityColor(task.priority)}
              size="sm"
            >
              {task.priority}
            </Tag>
            {task.tags.map((tag) => (
              <Tag key={tag} size="sm" color="blue">
                {tag}
              </Tag>
            ))}
          </div>

          <div className={styles.assignee}>
            <span className={styles.assigneeLabel}>Assigned to:</span>
            <span className={styles.assigneeName}>{task.assignee}</span>
          </div>

          <div className={styles.dates}>
            <div className={styles.date}>
              <span className={styles.dateLabel}>Created:</span>
              <span className={styles.dateValue}>
                {format(task.createdAt, "MMM d, yyyy")}
              </span>
            </div>
            {task.updatedAt.getTime() !== task.createdAt.getTime() && (
              <div className={styles.date}>
                <span className={styles.dateLabel}>Updated:</span>
                <span className={styles.dateValue}>
                  {format(task.updatedAt, "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
