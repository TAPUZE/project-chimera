import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AnalyticsOverview {
  total_agents: number;
  active_agents: number;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  total_chat_sessions: number;
  total_messages: number;
  last_updated: string;
}

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  tasks_completed: number;
  tasks_failed: number;
  average_response_time: number;
  last_active: string;
  success_rate: number;
}

export interface TaskAnalytics {
  task_type: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  average_duration: number;
  success_rate: number;
}

export interface UsageMetrics {
  date: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  unique_users: number;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  timestamp: string;
}

export interface AnalyticsState {
  overview: AnalyticsOverview | null;
  agentPerformance: AgentPerformance[];
  taskAnalytics: TaskAnalytics[];
  usageMetrics: UsageMetrics[];
  systemMetrics: SystemMetrics[];
  loading: boolean;
  error: string | null;
  dateRange: {
    start: string;
    end: string;
  };
}

const initialState: AnalyticsState = {
  overview: null,
  agentPerformance: [],
  taskAnalytics: [],
  usageMetrics: [],
  systemMetrics: [],
  loading: false,
  error: null,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
};

// Async thunks
export const fetchAnalyticsOverview = createAsyncThunk(
  'analytics/fetchAnalyticsOverview',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/analytics/overview', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics overview');
    }
    
    return response.json();
  }
);

export const fetchAgentPerformance = createAsyncThunk(
  'analytics/fetchAgentPerformance',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/analytics/agents/performance', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch agent performance');
    }
    
    return response.json();
  }
);

export const fetchTaskAnalytics = createAsyncThunk(
  'analytics/fetchTaskAnalytics',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/analytics/tasks/analytics', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch task analytics');
    }
    
    return response.json();
  }
);

export const fetchUsageMetrics = createAsyncThunk(
  'analytics/fetchUsageMetrics',
  async (dateRange: { start: string; end: string }, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const queryParams = new URLSearchParams({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }).toString();
    
    const response = await fetch(`/api/v1/analytics/usage/daily?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch usage metrics');
    }
    
    return response.json();
  }
);

export const fetchSystemMetrics = createAsyncThunk(
  'analytics/fetchSystemMetrics',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/analytics/system/metrics', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch system metrics');
    }
    
    return response.json();
  }
);

export const exportAnalyticsData = createAsyncThunk(
  'analytics/exportAnalyticsData',
  async (format: 'csv' | 'json', { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/analytics/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export analytics data');
    }
    
    return response.blob();
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.dateRange = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch analytics overview
      .addCase(fetchAnalyticsOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchAnalyticsOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch analytics overview';
      })
      // Fetch agent performance
      .addCase(fetchAgentPerformance.fulfilled, (state, action) => {
        state.agentPerformance = action.payload;
      })
      // Fetch task analytics
      .addCase(fetchTaskAnalytics.fulfilled, (state, action) => {
        state.taskAnalytics = action.payload;
      })
      // Fetch usage metrics
      .addCase(fetchUsageMetrics.fulfilled, (state, action) => {
        state.usageMetrics = action.payload;
      })
      // Fetch system metrics
      .addCase(fetchSystemMetrics.fulfilled, (state, action) => {
        state.systemMetrics = action.payload;
      })
      // Export analytics data
      .addCase(exportAnalyticsData.fulfilled, (state, action) => {
        // Handle blob download
        const url = window.URL.createObjectURL(action.payload);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
  },
});

export const { setDateRange, clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
