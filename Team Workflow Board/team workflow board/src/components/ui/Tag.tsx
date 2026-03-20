import React from "react";
import styles from "./Tag.module.css";

interface TagProps {
  children: React.ReactNode;
  variant?: "default" | "priority" | "status";
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  children,
  variant = "default",
  color = "blue",
  size = "md",
  removable = false,
  onRemove,
  className,
  ...props
}) => {
  const classNames = [
    styles.tag,
    styles[variant],
    styles[color],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames} {...props}>
      <span className={styles.content}>{children}</span>
      {removable && onRemove && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={onRemove}
          aria-label="Remove tag"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path
              d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export const getPriorityColor = (priority: string): TagProps["color"] => {
  switch (priority.toLowerCase()) {
    case "high":
      return "red";
    case "medium":
      return "yellow";
    case "low":
      return "green";
    default:
      return "gray";
  }
};

export const getStatusColor = (status: string): TagProps["color"] => {
  switch (status.toLowerCase()) {
    case "backlog":
      return "gray";
    case "in progress":
      return "blue";
    case "done":
      return "green";
    default:
      return "gray";
  }
};
