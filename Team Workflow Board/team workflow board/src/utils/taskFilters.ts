import type { Task, FilterOptions, SortOptions } from "../types";

export const filterTasks = (
  tasks: Task[],
  filters: Partial<FilterOptions>,
): Task[] => {
  return tasks.filter((task) => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(task.status)) return false;
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(task.priority)) return false;
    }

    // Assignee filter
    if (filters.assignee && filters.assignee.length > 0) {
      if (!filters.assignee.includes(task.assignee)) return false;
    }

    // Tags filter (task must have at least one matching tag)
    if (filters.tags && filters.tags.length > 0) {
      if (!task.tags.some((tag) => filters.tags!.includes(tag))) return false;
    }

    // Search filter (searches title, description, and assignee)
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        task.title,
        task.description,
        task.assignee,
        ...task.tags,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });
};

export const sortTasks = (tasks: Task[], sortOptions: SortOptions): Task[] => {
  return [...tasks].sort((a, b) => {
    const aValue = a[sortOptions.field];
    const bValue = b[sortOptions.field];

    let comparison = 0;

    if (aValue < bValue) {
      comparison = -1;
    } else if (aValue > bValue) {
      comparison = 1;
    }

    return sortOptions.direction === "asc" ? comparison : -comparison;
  });
};

export const getUniqueValues = <T extends keyof Task>(
  tasks: Task[],
  field: T,
): string[] => {
  const values = tasks
    .map((task) => {
      const value = task[field];
      if (Array.isArray(value)) {
        return value;
      }
      return String(value);
    })
    .flat();

  return Array.from(new Set(values)).sort();
};

export const getTaskStatistics = (tasks: Task[]) => {
  const stats = {
    total: tasks.length,
    byStatus: {
      Backlog: 0,
      "In Progress": 0,
      Done: 0,
    },
    byPriority: {
      Low: 0,
      Medium: 0,
      High: 0,
    },
    totalTags: 0,
  };

  tasks.forEach((task) => {
    stats.byStatus[task.status]++;
    stats.byPriority[task.priority]++;
  });

  const allTags = tasks.flatMap((task) => task.tags);
  stats.totalTags = new Set(allTags).size;

  return stats;
};
