import { useState, useMemo } from "react";
import type { Task, FilterOptions, SortOptions } from "../types";
import { filterTasks, sortTasks } from "../utils/taskFilters";

interface UseTaskFiltersOptions {
  tasks: Task[];
}

export const useTaskFilters = ({ tasks }: UseTaskFiltersOptions) => {
  const [filters, setFilters] = useState<Partial<FilterOptions>>({
    status: [],
    priority: [],
    assignee: [],
    tags: [],
    search: "",
  });

  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: "createdAt",
    direction: "desc",
  });

  const filteredTasks = useMemo(() => {
    let result = filterTasks(tasks, filters);
    result = sortTasks(result, sortOptions);
    return result;
  }, [tasks, filters, sortOptions]);

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSort = (field: keyof Task, direction?: "asc" | "desc") => {
    setSortOptions((prev) => ({
      field,
      direction:
        direction ||
        (prev.field === field && prev.direction === "asc" ? "desc" : "asc"),
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      assignee: [],
      tags: [],
      search: "",
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
      filters.status?.length ||
      filters.priority?.length ||
      filters.assignee?.length ||
      filters.tags?.length,
    );
  }, [filters]);

  return {
    filters,
    sortOptions,
    filteredTasks,
    updateFilter,
    updateSort,
    clearFilters,
    hasActiveFilters,
  };
};
