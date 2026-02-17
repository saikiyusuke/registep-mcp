export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: number;
    details?: unknown;
  };
  message?: string;
}

export interface Store {
  id: number;
  user_id: string;
  name: string;
  code: string;
  enabled: boolean;
  pos_system: string | null;
  industry_category: string | null;
  industry_detail: string | null;
  phone: string | null;
  postal_code: string | null;
  address: string | null;
  prefecture: string | null;
  schedule_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreListResponse {
  stores: Store[];
  total: number;
  plan_limit: number;
}

export interface SalesSummary {
  total_sales: number;
  total_count: number;
  average_transaction: number;
  period: string;
  start_date: string;
  end_date: string;
}

export interface Transaction {
  id: number;
  sale_date: string;
  sale_time: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
}

export interface CsvFile {
  filename: string;
  date: string;
  time: string;
  total_sales: number;
  record_count: number;
}

export interface WeatherData {
  region_code: string;
  region_name: string;
  prefecture: string;
  weather_date: string;
  temperature_max: number | null;
  temperature_min: number | null;
  temperature_avg: number | null;
  precipitation: number | null;
  weather_code: number | null;
}

export interface ChatSession {
  id: string;
  title: string;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  created_at: string;
}

export interface SqlQueryResult {
  success: boolean;
  data: Record<string, unknown>[];
  row_count: number;
  error?: string;
}
