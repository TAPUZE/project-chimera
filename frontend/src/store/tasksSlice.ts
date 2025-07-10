import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  agent_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  result: any;
  dependencies: string[];
}

export interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  availableTypes: string[];
  filters: {
    status: string;
    priority: string;
    type: string;
  };
}

const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
  availableTypes: [],
  filters: {
    status: 'all',
    priority: 'all',
    type: 'all',
  },
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters: Record<string, string> = {}, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/v1/tasks/?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    
    return response.json();
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'result'>, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/tasks/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.auth.token}`,
      },
      body: JSON.stringify(taskData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    
    return response.json();
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: Partial<Task> }, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.auth.token}`,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    
    return response.json();
  }
);

export const executeTask = createAsyncThunk(
  'tasks/executeTask',
  async (id: string, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/tasks/${id}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to execute task');
    }
    
    return response.json();
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
    
    return id;
  }
);

export const fetchAvailableTaskTypes = createAsyncThunk(
  'tasks/fetchAvailableTaskTypes',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/tasks/types/available', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch available task types');
    }
    
    return response.json();
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<TasksState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create task';
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      // Execute task
      .addCase(executeTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      })
      // Fetch available task types
      .addCase(fetchAvailableTaskTypes.fulfilled, (state, action) => {
        state.availableTypes = action.payload;
      });
  },
});

export const { setCurrentTask, setFilters, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
