export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = "Low" | "Medium" | "High";

export type TaskStatus = "Backlog" | "In Progress" | "Done";

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  tags?: string[];
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
  tags: string[];
}

export interface FilterOptions {
  status: TaskStatus[];
  priority: TaskPriority[];
  assignee: string[];
  tags: string[];
  search: string;
}

export interface SortOptions {
  field: keyof Task;
  direction: "asc" | "desc";
}
