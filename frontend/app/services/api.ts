import axios from 'axios'
import type { 
  User, 
  MenuItem, 
  Order, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  LoginRequest,
  LoginResponse,
  ApiResponse,
  DashboardStats,
  Payment,
  SalesInsights,
  BillData
} from '~/types'

const API_BASE_URL = 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
    console.log(response.data)
    return response.data!
  },
  
  register: async (userData: any): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/auth/register', userData)
    return response.data.data!
  },
  
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile')
    return response.data.data!
  },
}

// Menu API
export const menuAPI = {
  getAll: async (): Promise<MenuItem[]> => {
    const response = await api.get<ApiResponse<MenuItem[]>>('/menu/')
    return response.data.data!
  },
  
  getAdmin: async (): Promise<MenuItem[]> => {
    const response = await api.get<ApiResponse<MenuItem[]>>('/menu/admin')
    return response.data.data!
  },
  
  getById: async (id: string): Promise<MenuItem> => {
    const response = await api.get<ApiResponse<MenuItem>>(`/menu/${id}`)
    return response.data.data!
  },
  
  create: async (menuItem: FormData): Promise<MenuItem> => {
    const response = await api.post<ApiResponse<MenuItem>>('/menu', menuItem, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data!
  },
  
  update: async (id: string, menuItem: FormData): Promise<MenuItem> => {
    const response = await api.put<ApiResponse<MenuItem>>(`/menu/${id}`, menuItem, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data!
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/menu/${id}`)
  },
  
  toggleAvailability: async (id: string): Promise<MenuItem> => {
    const response = await api.patch<ApiResponse<MenuItem>>(`/menu/${id}/toggle`)
    return response.data.data!
  },
}

interface edited_item{
  id:number,
  quantity:number,
}

// Orders API
export const ordersAPI = {
  getAll: async (params?: { 
    status?: string; 
    page?: number; 
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Order[]; pagination: any }> => {
    const response = await api.get<ApiResponse<Order[]>>('/orders', { params })
    console.log(response.data.data)
    return {
      data: response.data.data!,
      pagination: response.data.pagination,
    }
  },
  
  getById: async (id: string): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`)
    return response.data.data!
  },

  getBill: async (id: string): Promise<BillData> => {
    const response = await api.get<ApiResponse<BillData>>(`/orders/${id}/bill`)
    console.log(response.data.data)
    return response.data.data!
  },
  
  create: async (order: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>('/orders', order)
    return response.data.data!
  },
  
  updateStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status })
    return response.data.data!
  },

  updateItemStatus: async (id: string, itemIndex: number, status: string, chefRemarks?: string): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/items/${itemIndex}/status`, { 
      status, 
      chefRemarks 
    })
    return response.data.data!
  },

  updateItems: async (id: string,items:edited_item[]): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/items/update`, { 
       updates: items
    })
    return response.data.data!
  },

  addItem: async (id:string,items:MenuItem): Promise<Order> =>{
    let a=[items]
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/additems`,{
      items:a
    })
    return response.data.data!
  },

  addChefRemarks: async (id: string, chefRemarks: string): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/remarks`, { chefRemarks })
    return response.data.data!
  },
  // Orders API - add this function
getOrdersByDate: async (startDate: string, endDate: string, status?: string): Promise<Order[]> => {
  const params: any = { startDate, endDate };
  if (status) params.status = status;

  const response = await api.get<ApiResponse<Order[]>>('/orders/by-date', { params });
  return response.data.data!;
},


  createPayment: async (id: string, paymentData: {
    paymentMethod: 'cash' | 'card' | 'digital';
    amount: number;
    cashCollected?: number;
    remarks?: string;
  }): Promise<Payment> => {
    const response = await api.post<ApiResponse<Payment>>(`/orders/${id}/payment`, paymentData)
    return response.data.data!
  },

  submitCash: async (orderId: string): Promise<Payment> => {
    const response = await api.patch<ApiResponse<Payment>>(`/orders/${orderId}/submitCash`, {  
    })
    return response.data.data!
  },

  getCashCollections: async (params?: {
    startDate?: string;
    endDate?: string;
    waiterId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Payment[];
    waitersWithPendingCash: any[];
    pagination: any;
  }> => {
    const response = await api.get<ApiResponse<{
      data: Payment[];
      waitersWithPendingCash: any[];
      pagination: any;
    }>>('/orders/payments/cash-collections', { params })
    return response.data.data!
  },

  updatePayment: async (paymentId: string, paymentData: {
    paymentMethod: 'cash' | 'card' | 'digital';
    amount: number;
    cashCollected?: number;
    cashSubmitted?: number;
    remarks?: string;
  }): Promise<Payment> => {
    const response = await api.put<ApiResponse<Payment>>(`/orders/payments/${paymentId}`, paymentData)
    return response.data.data!
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`)
  },
}

// Insights API
// Insights API
export const insightsAPI = {
  // Existing sales insights (if needed)
  getSalesInsights: async (startDate: string, endDate: string): Promise<SalesInsights> => {
    const response = await api.get<ApiResponse<SalesInsights>>('/orders/insights/sales', {
      params: { startDate, endDate }
    });
    return response.data.data!;
  },

  // New: full restaurant insights
  getFullInsights: async (startDate?: string, endDate?: string): Promise<SalesInsights> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get<ApiResponse<SalesInsights>>('/orders/insights', { params });
    return response.data.data!;
  },
};


// Dashboard API
export const dashboardAPI = {
  getStats: async (date?: string): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats', {
      params: { date },
    })
    return response.data.data!
  },
}



export default api
