import React from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
  draggable?: boolean;
  "data-testid"?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "md",
  className,
  onClick,
  draggable = false,
  "data-testid": testId,
  ...props
}) => {
  const classNames = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    onClick && styles.clickable,
    draggable && styles.draggable,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={classNames}
      onClick={onClick}
      data-testid={testId}
      {...props}
    >
      {children}
    </Component>
  );
};
