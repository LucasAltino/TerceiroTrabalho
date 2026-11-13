const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  justify?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "open" | "in_progress" | "closed";
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface CreateTicketPayload {
  id?: string;
  title: string;
  description: string;
  justify?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status?: "open" | "in_progress" | "closed";
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  justify?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status?: "open" | "in_progress" | "closed";
}

export type ReturnTypeValue = "DEVOLUTION" | "EXCHANGE";
export type ReturnStatusValue =
  | "REQUESTED"
  | "POSTED"
  | "RECEIVED"
  | "INSPECTING"
  | "ADJUSTMENT_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

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
  adjustmentRequestedAt: string | null;
  adjustmentReason: string | null;
  version: number;
  reverseCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReturnPayload {
  orderId: string;
  productId: string;
  type: ReturnTypeValue;
  reason: string;
  description: string;
  items: { orderItemId: string; quantity: number }[];
}

export interface UpdateReturnPayload {
  reason?: string;
  description?: string;
  trackingCode?: string | null;
}

export interface PostReturnPayload {
  trackingCode: string;
  reverseCode: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(typeof window !== "undefined" && sessionStorage.getItem("accessToken")
        ? { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` }
        : {}),
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
    throw new Error(
      errorDetail || `Erro ${response.status} ao acessar ${endpoint}`,
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const authApi = {
  login: async (email: string, password: string): Promise<void> => {
    const result = await request<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (typeof window !== "undefined")
      sessionStorage.setItem("accessToken", result.accessToken);
  },
  logout: (): void => {
    if (typeof window !== "undefined") sessionStorage.removeItem("accessToken");
  },
  getToken: (): string | null =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("accessToken")
      : null,
};

// ----------------- TICKETS API -----------------
export const ticketsApi = {
  list: async (): Promise<Ticket[]> => {
    return request<Ticket[]>("/tickets");
  },
  getById: async (id: string): Promise<Ticket> => {
    return request<Ticket>(`/tickets/${id}`);
  },
  create: async (data: CreateTicketPayload): Promise<Ticket> => {
    return request<Ticket>("/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: UpdateTicketPayload): Promise<Ticket> => {
    return request<Ticket>(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (
    id: string,
    status: "open" | "in_progress" | "closed",
  ): Promise<Ticket> => {
    return request<Ticket>(`/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  delete: async (id: string): Promise<void> => {
    return request<void>(`/tickets/${id}`, {
      method: "DELETE",
    });
  },
};

// ----------------- RETURNS API -----------------
export const returnsApi = {
  list: async (): Promise<ReturnRequest[]> => {
    return request<ReturnRequest[]>("/returns");
  },
  getById: async (id: string): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}`);
  },
  create: async (data: CreateReturnPayload): Promise<ReturnRequest> => {
    return request<ReturnRequest>("/returns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (
    id: string,
    data: UpdateReturnPayload,
  ): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  post: async (id: string, data: PostReturnPayload): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/post`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  receive: async (id: string): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/receive`, { method: "POST" });
  },
  startInspection: async (id: string): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/start-inspection`, {
      method: "POST",
    });
  },
  approve: async (
    id: string,
    inspectionResult: string,
  ): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ inspectionResult }),
    });
  },
  reject: async (
    id: string,
    rejectionReason: string,
  ): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionReason }),
    });
  },
  requestAdjustment: async (
    id: string,
    adjustmentReason: string,
  ): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/request-adjustment`, {
      method: "POST",
      body: JSON.stringify({ adjustmentReason }),
    });
  },
  complete: async (id: string): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/complete`, {
      method: "POST",
    });
  },
  cancel: async (id: string, justification: string): Promise<ReturnRequest> => {
    return request<ReturnRequest>(`/returns/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ justification }),
    });
  },
};

// ----------------- LEADS API -----------------
export const leadsApi = {
  create: async (
    email: string,
  ): Promise<{ message: string; email: string }> => {
    return request<{ message: string; email: string }>("/leads", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};
