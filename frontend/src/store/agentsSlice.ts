import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  model: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  configuration: Record<string, any>;
}

export interface AgentsState {
  agents: Agent[];
  currentAgent: Agent | null;
  loading: boolean;
  error: string | null;
  availableTypes: string[];
  availableModels: string[];
}

const initialState: AgentsState = {
  agents: [],
  currentAgent: null,
  loading: false,
  error: null,
  availableTypes: [],
  availableModels: [],
};

// Async thunks
export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/agents/', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }
    
    return response.json();
  }
);

export const createAgent = createAsyncThunk(
  'agents/createAgent',
  async (agentData: Omit<Agent, 'id' | 'created_at' | 'updated_at' | 'user_id'>, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/agents/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.auth.token}`,
      },
      body: JSON.stringify(agentData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create agent');
    }
    
    return response.json();
  }
);

export const updateAgent = createAsyncThunk(
  'agents/updateAgent',
  async ({ id, updates }: { id: string; updates: Partial<Agent> }, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/agents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.auth.token}`,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update agent');
    }
    
    return response.json();
  }
);

export const deleteAgent = createAsyncThunk(
  'agents/deleteAgent',
  async (id: string, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/agents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete agent');
    }
    
    return id;
  }
);

export const fetchAvailableTypes = createAsyncThunk(
  'agents/fetchAvailableTypes',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/agents/types/available', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch available types');
    }
    
    return response.json();
  }
);

export const fetchAvailableModels = createAsyncThunk(
  'agents/fetchAvailableModels',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/agents/models/available', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch available models');
    }
    
    return response.json();
  }
);

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    setCurrentAgent: (state, action: PayloadAction<Agent | null>) => {
      state.currentAgent = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch agents
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch agents';
      })
      // Create agent
      .addCase(createAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.agents.push(action.payload);
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create agent';
      })
      // Update agent
      .addCase(updateAgent.fulfilled, (state, action) => {
        const index = state.agents.findIndex(agent => agent.id === action.payload.id);
        if (index !== -1) {
          state.agents[index] = action.payload;
        }
      })
      // Delete agent
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.agents = state.agents.filter(agent => agent.id !== action.payload);
      })
      // Fetch available types
      .addCase(fetchAvailableTypes.fulfilled, (state, action) => {
        state.availableTypes = action.payload;
      })
      // Fetch available models
      .addCase(fetchAvailableModels.fulfilled, (state, action) => {
        state.availableModels = action.payload;
      });
  },
});

export const { setCurrentAgent, clearError } = agentsSlice.actions;

// Selectors
export const selectAvailableAgents = (state: { agents: AgentsState }) => 
  state.agents.agents.filter(agent => agent.is_active);

export default agentsSlice.reducer;
