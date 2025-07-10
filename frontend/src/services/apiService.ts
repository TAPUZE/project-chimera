import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    is_active: boolean;
  };
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = (window as any).ENV?.REACT_APP_API_URL || 'http://localhost:8000';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await this.api.post<AuthResponse>('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/v1/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.api.get('/api/v1/auth/me');
    return response.data;
  }

  async updateProfile(userData: any): Promise<any> {
    const response = await this.api.put('/api/v1/auth/me', userData);
    return response.data;
  }

  // Agent endpoints
  async getAgents(): Promise<any[]> {
    const response = await this.api.get('/api/v1/agents/');
    return response.data;
  }

  async createAgent(agentData: any): Promise<any> {
    const response = await this.api.post('/api/v1/agents/', agentData);
    return response.data;
  }

  async getAgent(id: string): Promise<any> {
    const response = await this.api.get(`/api/v1/agents/${id}`);
    return response.data;
  }

  async updateAgent(id: string, agentData: any): Promise<any> {
    const response = await this.api.put(`/api/v1/agents/${id}`, agentData);
    return response.data;
  }

  async deleteAgent(id: string): Promise<void> {
    await this.api.delete(`/api/v1/agents/${id}`);
  }

  async activateAgent(id: string): Promise<any> {
    const response = await this.api.post(`/api/v1/agents/${id}/activate`);
    return response.data;
  }

  async deactivateAgent(id: string): Promise<any> {
    const response = await this.api.post(`/api/v1/agents/${id}/deactivate`);
    return response.data;
  }

  async getAgentStatus(id: string): Promise<any> {
    const response = await this.api.get(`/api/v1/agents/${id}/status`);
    return response.data;
  }

  async getAvailableAgentTypes(): Promise<string[]> {
    const response = await this.api.get('/api/v1/agents/types/available');
    return response.data;
  }

  async getAvailableModels(): Promise<string[]> {
    const response = await this.api.get('/api/v1/agents/models/available');
    return response.data;
  }

  // Task endpoints
  async getTasks(params?: any): Promise<any[]> {
    const response = await this.api.get('/api/v1/tasks/', { params });
    return response.data;
  }

  async createTask(taskData: any): Promise<any> {
    const response = await this.api.post('/api/v1/tasks/', taskData);
    return response.data;
  }

  async getTask(id: string): Promise<any> {
    const response = await this.api.get(`/api/v1/tasks/${id}`);
    return response.data;
  }

  async updateTask(id: string, taskData: any): Promise<any> {
    const response = await this.api.put(`/api/v1/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/api/v1/tasks/${id}`);
  }

  async executeTask(id: string): Promise<any> {
    const response = await this.api.post(`/api/v1/tasks/${id}/execute`);
    return response.data;
  }

  async getTaskSubtasks(id: string): Promise<any[]> {
    const response = await this.api.get(`/api/v1/tasks/${id}/subtasks`);
    return response.data;
  }

  async cancelTask(id: string): Promise<any> {
    const response = await this.api.post(`/api/v1/tasks/${id}/cancel`);
    return response.data;
  }

  async getAvailableTaskTypes(): Promise<string[]> {
    const response = await this.api.get('/api/v1/tasks/types/available');
    return response.data;
  }

  // Chat endpoints
  async getChatSessions(): Promise<any[]> {
    const response = await this.api.get('/api/v1/chat/sessions');
    return response.data;
  }

  async createChatSession(sessionData: any): Promise<any> {
    const response = await this.api.post('/api/v1/chat/sessions', sessionData);
    return response.data;
  }

  async getChatSession(id: string): Promise<any> {
    const response = await this.api.get(`/api/v1/chat/sessions/${id}`);
    return response.data;
  }

  async updateChatSession(id: string, sessionData: any): Promise<any> {
    const response = await this.api.put(`/api/v1/chat/sessions/${id}`, sessionData);
    return response.data;
  }

  async deleteChatSession(id: string): Promise<void> {
    await this.api.delete(`/api/v1/chat/sessions/${id}`);
  }

  async getChatMessages(sessionId: string): Promise<any[]> {
    const response = await this.api.get(`/api/v1/chat/sessions/${sessionId}/messages`);
    return response.data;
  }

  async sendChatMessage(sessionId: string, message: any): Promise<any> {
    const response = await this.api.post(`/api/v1/chat/sessions/${sessionId}/messages`, message);
    return response.data;
  }

  async generateChatCompletion(data: any): Promise<any> {
    const response = await this.api.post('/api/v1/chat/completions', data);
    return response.data;
  }

  async exportChatSession(sessionId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/chat/sessions/${sessionId}/export`);
    return response.data;
  }

  // Analytics endpoints
  async getAnalyticsOverview(): Promise<any> {
    const response = await this.api.get('/api/v1/analytics/overview');
    return response.data;
  }

  async getAgentPerformance(): Promise<any[]> {
    const response = await this.api.get('/api/v1/analytics/agents/performance');
    return response.data;
  }

  async getTaskAnalytics(): Promise<any[]> {
    const response = await this.api.get('/api/v1/analytics/tasks/analytics');
    return response.data;
  }

  async getDailyUsage(): Promise<any[]> {
    const response = await this.api.get('/api/v1/analytics/usage/daily');
    return response.data;
  }

  async getSystemMetrics(): Promise<any[]> {
    const response = await this.api.get('/api/v1/analytics/system/metrics');
    return response.data;
  }

  async exportAnalytics(): Promise<any> {
    const response = await this.api.get('/api/v1/analytics/export');
    return response.data;
  }

  async recordCustomMetric(metricData: any): Promise<any> {
    const response = await this.api.post('/api/v1/analytics/metrics/record', metricData);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
