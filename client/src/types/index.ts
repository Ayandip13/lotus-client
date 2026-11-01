export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: ApiErrorDetail[];
  };
}

export interface HealthCheckResponse {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
  version: string;
  database: {
    status: string;
    connected: boolean;
  };
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
}
