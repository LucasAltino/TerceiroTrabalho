const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  justify?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'open' | 'in_progress' | 'closed';
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface CreateTicketPayload {
  id?: string;
  title: string;
  description: string;
  justify?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'open' | 'in_progress' | 'closed';
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  justify?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'open' | 'in_progress' | 'closed';
}

export type ReturnTypeValue = 'DEVOLUTION' | 'EXCHANGE';
export type ReturnStatusValue =
  'REQUESTED' | 'POSTED' | 'RECEIVED' | 'INSPECTING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  type: ReturnTypeValue;
  reason: string;
  description: string;
  status: ReturnStatusValue;
  trackingCode: string | null;
  inspectionResult: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnPayload {
  orderId: string;
  customerId: string;
  productId: string;
  type: ReturnTypeValue;
  reason: string;
  description: string;
  trackingCode?: string | null;
}

export interface UpdateReturnPayload {
  reason?: string;
  description?: string;
  trackingCode?: string | null;
  status?: string;
}

export interface InspectReturnPayload {
  approved: boolean;
  result: string;
  rejectionReason?: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || JSON.stringify(errJson);
    } catch {
      // ignore
    }
    throw new Error(errorDetail || `Erro ${response.status} ao acessar ${endpoint}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ----------------- TICKETS API -----------------
export const ticketsApi = {
  list: async (): Promise<Ticket[]> => {
    return request<Ticket[]>('/tickets');
  },
  getById: async (id: string): Promise<Ticket> => {
    return request<Ticket>(`/tickets/${id}`);
  },
  create: async (data: CreateTicketPayload): Promise<Ticket> => {
    return request<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: UpdateTicketPayload): Promise<Ticket> => {
    return request<Ticket>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (id: string, status: 'open' | 'in_progress' | 'closed'): Promise<Ticket> => {
    return request<Ticket>(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  delete: async (id: string): Promise<void> => {
    return request<void>(`/tickets/${id}`, {
      method: 'DELETE',
    });
  },
};

// ----------------- RETURNS API -----------------
export const returnsApi = {
  list: async (): Promise<ReturnRequest[]> => {
    return request<ReturnRequest[]>('/returns');
  },
  getById: async (id: string): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}`);
  },
  create: async (data: CreateReturnPayload): Promise<ReturnRequest> => {
    return request<ReturnRequest>('/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: UpdateReturnPayload): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (id: string, status: ReturnStatusValue): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  inspect: async (id: string, data: InspectReturnPayload): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/inspection`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: string): Promise<void> => {
    return request<void>(`/returns/${id}`, {
      method: 'DELETE',
    });
  },
};

// ----------------- LEADS API -----------------
export const leadsApi = {
  create: async (email: string): Promise<{ message: string; email: string }> => {
    return request<{ message: string; email: string }>('/leads', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};
