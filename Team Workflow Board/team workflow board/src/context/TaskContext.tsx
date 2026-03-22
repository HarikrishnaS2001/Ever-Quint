import React, { useReducer, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import type {
  CreateTaskInput,
  Task,
  ToastMessage,
  UpdateTaskInput,
} from "../types";
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  createTask,
  updateTask,
  deleteTask,
} from "../utils/taskStorage";
import { v4 as uuidv4 } from "uuid";

interface TaskProviderProps {
  children: ReactNode;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  toasts: ToastMessage[];
}

type TaskAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "LOAD_TASKS"; payload: Task[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "REORDER_TASKS"; payload: Task[] }
  | { type: "ADD_TOAST"; payload: ToastMessage }
  | { type: "REMOVE_TOAST"; payload: string };

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  toasts: [],
};

interface TaskContextType {
  state: TaskState;
  actions: {
    loadTasks: () => void;
    addTask: (input: CreateTaskInput) => void;
    updateTask: (id: string, updates: Omit<UpdateTaskInput, "id">) => void;
    deleteTask: (id: string) => void;
    reorderTasks: (tasks: Task[]) => void;
    showToast: (
      message: string,
      type?: ToastMessage["type"],
      duration?: number,
    ) => void;
    removeToast: (id: string) => void;
  };
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "LOAD_TASKS":
      return {
        ...state,
        tasks: action.payload,
        loading: false,
        error: null,
      };

    case "ADD_TASK":
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };

    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task,
        ),
      };

    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };

    case "REORDER_TASKS":
      return {
        ...state,
        tasks: action.payload,
      };

    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };

    default:
      return state;
  }
};

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const showToast = (
    message: string,
    type: ToastMessage["type"] = "info",
    duration = 4000,
  ) => {
    const toast: ToastMessage = {
      id: uuidv4(),
      message,
      type,
      duration,
    };
    dispatch({ type: "ADD_TOAST", payload: toast });
  };

  const removeToast = (id: string) => {
    dispatch({ type: "REMOVE_TOAST", payload: id });
  };

  const addTask = (input: CreateTaskInput) => {
    try {
      const newTask = createTask(input);
      dispatch({ type: "ADD_TASK", payload: newTask });

      const updatedTasks = [...state.tasks, newTask];
      saveTasksToStorage(updatedTasks);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create task";
      showToast(errorMessage, "error");
    }
  };

  const updateTaskAction = (
    id: string,
    updates: Omit<UpdateTaskInput, "id">,
  ) => {
    try {
      const existingTask = state.tasks.find((task) => task.id === id);
      if (!existingTask) {
        throw new Error("Task not found");
      }

      const updatedTask = updateTask(existingTask, updates);
      dispatch({ type: "UPDATE_TASK", payload: updatedTask });

      const updatedTasks = state.tasks.map((task) =>
        task.id === id ? updatedTask : task,
      );
      saveTasksToStorage(updatedTasks);
      showToast("Task updated successfully", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update task";
      showToast(errorMessage, "error");
    }
  };

  const deleteTaskAction = (id: string) => {
    try {
      dispatch({ type: "DELETE_TASK", payload: id });

      const updatedTasks = deleteTask(state.tasks, id);
      saveTasksToStorage(updatedTasks);
      showToast("Task deleted successfully", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete task";
      showToast(errorMessage, "error");
    }
  };

  const reorderTasks = (tasks: Task[]) => {
    try {
      dispatch({ type: "REORDER_TASKS", payload: tasks });
      saveTasksToStorage(tasks);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save task order";
      showToast(errorMessage, "error");
    }
  };

  const loadTasks = () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const tasks = loadTasksFromStorage();
      dispatch({ type: "LOAD_TASKS", payload: tasks });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load tasks";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      showToast("Failed to load tasks", "error");
    }
  };

  // Load initial tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const actions = {
    loadTasks,
    addTask,
    updateTask: updateTaskAction,
    deleteTask: deleteTaskAction,
    reorderTasks,
    showToast,
    removeToast,
  };

  return (
    <TaskContext.Provider value={{ state, actions }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
