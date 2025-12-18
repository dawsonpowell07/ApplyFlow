import { getApiToken } from './api-token';

const API_BASE_URL = 'https://htnpjvh1wh.execute-api.us-east-1.amazonaws.com';

interface ApiRequestOptions {
  method?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const token = await getApiToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    // Return null for empty responses - calling code should handle this
    return null as T;
  }

  return JSON.parse(text);
}

// Applications API
export interface Application {
  id?: string;
  job_title?: string;
  company?: string;
  pay?: number;
  location?: string;
  resume_used?: string;
  resume_id?: string;
  job_url?: string;
  status?: 'applied' | 'interviewing' | 'offer' | 'accepted' | 'rejected';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApplicationsListResponse {
  applications: Application[];
  count: number;
}

export const applicationsApi = {
  list: () => apiRequest<ApplicationsListResponse>('/applications'),
  get: (id: string) => apiRequest<Application>(`/applications/${id}`),
  create: (data: Partial<Application>) => apiRequest<Application>('/applications', {
    method: 'POST',
    body: data,
  }),
  update: (id: string, data: Partial<Application>) => apiRequest<Application>(`/applications/${id}`, {
    method: 'PATCH',
    body: data,
  }),
  delete: (id: string) => apiRequest<void>(`/applications/${id}`, {
    method: 'DELETE',
  }),
};

// Resumes API
export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  s3_key: string;
  upload_status: 'pending' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
}

export const resumesApi = {
  list: () => apiRequest<Resume[]>('/resumes'),
  get: (id: string) => apiRequest<Resume>(`/resumes/${id}`),
  create: (data: Partial<Resume>) => apiRequest<Resume>('/resumes', {
    method: 'POST',
    body: data,
  }),
  update: (id: string, data: Partial<Resume>) => apiRequest<Resume>(`/resumes/${id}`, {
    method: 'PATCH',
    body: data,
  }),
  getUploadUrl: (fileName: string) => apiRequest<{ upload_url: string; s3_key: string }>('/resumes/upload-url', {
    method: 'POST',
    body: { file_name: fileName },
  }),
};
