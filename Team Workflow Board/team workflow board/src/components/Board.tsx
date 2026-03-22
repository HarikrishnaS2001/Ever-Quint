import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useTaskContext } from "../context/TaskContext";
import { useTaskFilters, useDragAndDrop } from "../hooks";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { ToastContainer, Button, TextInput, Select } from "./ui";
import type { Task, TaskStatus, TaskPriority } from "../types";
import { getTaskStatistics } from "../utils/taskFilters";
import styles from "./Board.module.css";

const statusColumns: { status: TaskStatus; title: string }[] = [
  { status: "Backlog", title: "Backlog" },
  { status: "In Progress", title: "In Progress" },
  { status: "Done", title: "Done" },
];

export const Board: React.FC = () => {
  const { state, actions } = useTaskContext();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const {
    filters,
    filteredTasks,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useTaskFilters({ tasks: state.tasks });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const { handleDragEnd } = useDragAndDrop({
    tasks: state.tasks,
    onReorder: actions.reorderTasks,
    onStatusChange: (id, updates) => actions.updateTask(id, updates),
  });

  const handleDragStart = (event: { active: { id: string } }) => {
    const activeTask = state.tasks.find((task) => task.id === event.active.id);
    setActiveTask(activeTask || null);
  };

  const handleDragEndWrapper = (event: DragEndEvent) => {
    setActiveTask(null);
    handleDragEnd(event);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(
      (task: { status: string }) => task.status === status,
    );
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };
  const handleDeleteTask = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      actions.deleteTask(id);
    }
  };
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };
  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleSubmitTask = (data: any) => {
    if (editingTask) {
      actions.updateTask(editingTask.id, data);
    } else {
      actions.addTask(data);
    }
  };
  const stats = getTaskStatistics(state.tasks);
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndWrapper}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Team Workflow Board</h1>
            <div className={styles.stats}>
              <span className={styles.stat}>Total: {stats.total}</span>
              <span className={styles.stat}>
                In Progress: {stats.byStatus["In Progress"]}
              </span>
              <span className={styles.stat}>
                Completed: {stats.byStatus.Done}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleAddTask}>Add Task</Button>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <TextInput
              placeholder="Search tasks..."
              value={filters.search || ""}
              onChange={(value) => updateFilter("search", value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <Select
              placeholder="Filter by priority"
              value={filters.priority?.[0] || ""}
              onChange={(value) => {
                updateFilter("priority", value ? [value as TaskPriority] : []);
              }}
              options={[
                { value: "", label: "All Priorities" },
                { value: "High", label: " High Priority" },
                { value: "Medium", label: " Medium Priority" },
                { value: "Low", label: " Low Priority" },
              ]}
            />
          </div>

          {hasActiveFilters && (
            <div className={styles.filterGroup}>
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        <div className={styles.board}>
          {statusColumns.map(({ status, title }) => (
            <Column
              key={status}
              title={title}
              status={status}
              tasks={getTasksByStatus(status)}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className={styles.dragOverlay}>
              <TaskCard task={activeTask} />
            </div>
          )}
        </DragOverlay>

        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={handleCloseTaskForm}
          onSubmit={handleSubmitTask}
          initialValues={editingTask || undefined}
          title={editingTask ? "Edit Task" : "Create New Task"}
        />

        <ToastContainer toasts={state.toasts} onRemove={actions.removeToast} />
      </div>
    </DndContext>
  );
};
