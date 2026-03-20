import type { Task, CreateTaskInput, UpdateTaskInput } from "../types";
import { v4 as uuidv4 } from "uuid";

const TASKS_STORAGE_KEY = "team-workflow-tasks";
const SCHEMA_VERSION = "1.0.0";

interface StorageData {
  version: string;
  tasks: Task[];
  lastUpdated: string;
}

export const loadTasksFromStorage = (): Task[] => {
  try {
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!data) return [];

    const storageData: StorageData = JSON.parse(data);

    if (storageData.version !== SCHEMA_VERSION) {
      console.warn("Storage schema version mismatch. Using default data.");
      return [];
    }

    return storageData.tasks.map((task) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));
  } catch (error) {
    console.error("Error loading tasks from storage:", error);
    return [];
  }
};

export const saveTasksToStorage = (tasks: Task[]): void => {
  try {
    const storageData: StorageData = {
      version: SCHEMA_VERSION,
      tasks,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error("Error saving tasks to storage:", error);
    throw new Error("Failed to save tasks. Storage may be full.");
  }
};

export const createTask = (input: CreateTaskInput): Task => {
  const now = new Date();
  return {
    id: uuidv4(),
    ...input,
    status: "Backlog",
    createdAt: now,
    updatedAt: now,
  };
};

export const updateTask = (
  existing: Task,
  updates: Omit<UpdateTaskInput, "id">,
): Task => {
  return {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };
};

export const deleteTask = (tasks: Task[], taskId: string): Task[] => {
  return tasks.filter((task) => task.id !== taskId);
};