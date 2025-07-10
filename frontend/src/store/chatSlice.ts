import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  session_id: string;
  agent_id?: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  agent_id?: string;
  messages: ChatMessage[];
}

export interface ChatState {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  isStreaming: boolean;
}

const initialState: ChatState = {
  sessions: [],
  currentSession: null,
  messages: [],
  loading: false,
  error: null,
  isStreaming: false,
};

// Async thunks
export const fetchChatSessions = createAsyncThunk(
  'chat/fetchChatSessions',
  async (_, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/chat/sessions', {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch chat sessions');
    }
    
    return response.json();
  }
);

export const createChatSession = createAsyncThunk(
  'chat/createChatSession',
  async (sessionData: { title: string; agent_id?: string }, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/chat/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.auth.token}`,
      },
      body: JSON.stringify(sessionData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create chat session');
    }
    
    return response.json();
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async (sessionId: string, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/chat/sessions/${sessionId}/messages`, {
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch chat messages');
    }
    
    return response.json();
  }
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendChatMessage',
  async ({ sessionId, content, agent_id }: { sessionId: string; content: string; agent_id?: string }, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.auth.token}`,
      },
      body: JSON.stringify({ content, agent_id }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send chat message');
    }
    
    return response.json();
  }
);

export const generateChatCompletion = createAsyncThunk(
  'chat/generateChatCompletion',
  async ({ message, agent_id, model }: { message: string; agent_id?: string; model?: string }, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.auth.token}`,
      },
      body: JSON.stringify({ message, agent_id, model }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate chat completion');
    }
    
    return response.json();
  }
);

export const deleteChatSession = createAsyncThunk(
  'chat/deleteChatSession',
  async (sessionId: string, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await fetch(`/api/v1/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.auth.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete chat session');
    }
    
    return sessionId;
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<ChatSession | null>) => {
      state.currentSession = action.payload;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action: PayloadAction<{ id: string; updates: Partial<ChatMessage> }>) => {
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...action.payload.updates };
      }
    },
    setIsStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chat sessions
      .addCase(fetchChatSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchChatSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch chat sessions';
      })
      // Create chat session
      .addCase(createChatSession.fulfilled, (state, action) => {
        state.sessions.push(action.payload);
      })
      // Fetch chat messages
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
      })
      // Send chat message
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      // Generate chat completion
      .addCase(generateChatCompletion.pending, (state) => {
        state.isStreaming = true;
      })
      .addCase(generateChatCompletion.fulfilled, (state, action) => {
        state.isStreaming = false;
        state.messages.push(action.payload);
      })
      .addCase(generateChatCompletion.rejected, (state, action) => {
        state.isStreaming = false;
        state.error = action.error.message || 'Failed to generate completion';
      })
      // Delete chat session
      .addCase(deleteChatSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(session => session.id !== action.payload);
        if (state.currentSession?.id === action.payload) {
          state.currentSession = null;
          state.messages = [];
        }
      });
  },
});

export const { 
  setCurrentSession, 
  addMessage, 
  updateMessage, 
  setIsStreaming, 
  clearError, 
  clearMessages 
} = chatSlice.actions;

export default chatSlice.reducer;
