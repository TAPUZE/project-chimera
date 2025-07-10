import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import agentsReducer from './agentsSlice';
import tasksReducer from './tasksSlice';
import chatReducer from './chatSlice';
import analyticsReducer from './analyticsSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    agents: agentsReducer,
    tasks: tasksReducer,
    chat: chatReducer,
    analytics: analyticsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
