import { API_BASE_URL, DEMO_MODE } from "@/lib/constants";
import { ApiResponse, PaginatedResponse } from "@/lib/types";
import type { LocationState, CampusLocationInfo, RushInfo } from "@/lib/constants";

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

export interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function clearAuth(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("auth_user");
    } catch {
      //
    }
  }
}

function handle401Redirect(): void {
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    if (currentPath !== "/auth/login" && currentPath !== "/") {
      window.location.href = "/auth/login";
    }
  }
}

async function refreshToken(): Promise<string | null> {
  const refreshTokenVal = getRefreshToken();
  if (!refreshTokenVal) {
    clearAuth();
    handle401Redirect();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshTokenVal }),
    });

    if (!response.ok) {
      throw new Error("Refresh failed");
    }

    const data = await response.json();
    const newToken = data.access_token;
    if (!newToken) {
      throw new Error("No token in refresh response");
    }

    localStorage.setItem("auth_token", newToken);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    if (data.user) {
      localStorage.setItem("auth_user", JSON.stringify(data.user));
    }
    document.cookie = `nexus_token=${newToken}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:token-refreshed"));
    }
    return newToken;
  } catch {
    clearAuth();
    handle401Redirect();
    return null;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const hasJson = contentType?.includes("application/json");

  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorCode = "";
    let errorData: unknown;

    if (hasJson) {
      try {
        const errorBody = await response.json();
        errorMessage =
          errorBody?.detail?.message ||
          errorBody?.detail ||
          errorBody?.error?.message ||
          errorBody?.error ||
          errorBody?.message ||
          errorMessage;
        errorCode = errorBody?.code || errorBody?.error?.code || "";
        errorData = errorBody;
      } catch {
        //
      }
    }

    throw new ApiError(response.status, errorMessage, errorData);
  }

  if (!hasJson) {
    return null as T;
  }

  const body = await response.json();
  if (body && typeof body === "object" && "success" in body && "data" in body && body.success === false) {
    const errMsg = body.error?.message || body.error || "Request failed";
    throw new ApiError(response.status, errMsg, body);
  }
  return (body?.data ?? body) as T;
}

const inFlightGetRequests = new Map<string, Promise<any>>();

async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const isGet = method === "GET";

  if (isGet) {
    const token = getAuthToken() || "anonymous";
    const dedupKey = `${token}:${url}`;
    const existing = inFlightGetRequests.get(dedupKey);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = executeFetchWithRetry<T>(url, options).finally(() => {
      inFlightGetRequests.delete(dedupKey);
    });
    inFlightGetRequests.set(dedupKey, promise);
    return promise;
  }

  return executeFetchWithRetry<T>(url, options);
}

async function executeFetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { retries = DEFAULT_RETRIES, retryDelay = DEFAULT_RETRY_DELAY, skipAuth = false, ...rest } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (!skipAuth) {
        const token = getAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, { ...rest, headers });

      if (response.status === 401 && !skipAuth) {
        if (isRefreshing) {
          const newToken = await new Promise<string | null>((resolve) => {
            subscribeTokenRefresh((token) => resolve(token));
          });
          if (newToken) {
            headers.Authorization = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, { ...rest, headers });
            return await handleResponse<T>(retryResponse);
          }
          throw new ApiError(401, "Authentication required");
        }

        isRefreshing = true;
        const newToken = await refreshToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, { ...rest, headers });
          return await handleResponse<T>(retryResponse);
        }
        throw new ApiError(401, "Authentication required");
      }

      return await handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      }

      if (attempt === retries) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * Math.pow(2, attempt))
      );
    }
  }

  throw new Error("Max retries exceeded");
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private buildUrl(path: string): string {
    if (path.startsWith("http")) return path;
    const cleanBase = (this.baseURL || "http://localhost:8000/api/v1").replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const rootBase = cleanBase.replace(/\/api\/v1\/?$/, "");
    const subPath = cleanPath.replace(/^\/api\/v1/, "");
    const normalizedSubPath = subPath.startsWith("/") ? subPath : `/${subPath}`;
    return `${rootBase}/api/v1${normalizedSubPath}`;
  }

  get<T>(path: string, options: FetchOptions = {}): Promise<T> {
    return fetchWithRetry<T>(this.buildUrl(path), { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options: FetchOptions = {}): Promise<T> {
    return fetchWithRetry<T>(this.buildUrl(path), {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, options: FetchOptions = {}): Promise<T> {
    return fetchWithRetry<T>(this.buildUrl(path), {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, options: FetchOptions = {}): Promise<T> {
    return fetchWithRetry<T>(this.buildUrl(path), {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options: FetchOptions = {}): Promise<T> {
    return fetchWithRetry<T>(this.buildUrl(path), { ...options, method: "DELETE" });
  }

  getRaw<T>(path: string, options: FetchOptions = {}): Promise<T> {
    return fetchWithRetry<T>(this.buildUrl(path), { ...options, method: "GET" });
  }
}

export const apiClient = new ApiClient();

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient.post<{ access_token: string; token_type: string; refresh_token?: string; user: any }>("/auth/login", data),
    logout: () =>
      apiClient.post("/auth/logout", {}, { skipAuth: true }),
    verify: () => apiClient.get("/auth/verify"),
    refresh: (refreshToken: string) =>
      apiClient.post<{ access_token: string; token_type: string; refresh_token?: string }>(
        "/auth/refresh",
        { refresh_token: refreshToken }
      ),
  },

  user: {
    getProfile: () => apiClient.get("/user/profile"),
    updateProfile: (data: any) => apiClient.put("/user/profile", data),
    getRole: () => apiClient.get("/user/role"),
  },

  students: {
    getMe: () => apiClient.get<any>("/students/me"),
    getMyDay: () => apiClient.get<any>("/students/my-day"),
    getSchedule: () => apiClient.get<any>("/students/schedule"),
    getPortfolio: () => apiClient.get<any>("/students/me/portfolio"),
    updatePortfolio: (data: any) => apiClient.put("/students/portfolio", data),
  },

  faculty: {
    getMe: () => apiClient.get<any>("/faculty/me"),
    getSchedule: () => apiClient.get<any>("/faculty/schedule"),
    getAvailability: () => apiClient.get<any>("/faculty/availability"),
    getRelevant: (params?: { search?: string; department?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.department) q.set("department", params.department);
      const suffix = q.toString() ? `?${q.toString()}` : "";
      return apiClient.get<any[]>(`/faculty/relevant${suffix}`);
    },
    getAllAvailability: (params?: { search?: string; department?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.department) q.set("department", params.department);
      const suffix = q.toString() ? `?${q.toString()}` : "";
      return apiClient.get<any[]>(`/faculty/availability/all${suffix}`);
    },
    getById: (id: string) => apiClient.get<any>(`/faculty/${id}`),
    setAvailability: (data: { is_available: boolean; office_location?: string }) =>
      apiClient.post("/faculty/availability", data),
    getStudents: () => apiClient.get<any[]>("/faculty/students"),
  },

  navigation: {
    getRoute: (params: { from_location?: string; to_location?: string; mode?: string; destination_floor?: number }) => {
      const q = new URLSearchParams();
      if (params.from_location) q.set("from_location", params.from_location);
      if (params.to_location) q.set("to_location", params.to_location);
      if (params.mode) q.set("mode", params.mode);
      if (params.destination_floor) q.set("destination_floor", String(params.destination_floor));
      return apiClient.get<any>(`/navigation/route?${q.toString()}`);
    },
    getLeaveNow: () => apiClient.get<any>("/navigation/leave-now"),
    getEta: (params?: Record<string, string>) => {
      const q = new URLSearchParams(params || {});
      return apiClient.get<any>(`/navigation/eta?${q.toString()}`);
    },
  },

  pulse: {
    getCampusPulse: () => apiClient.get<any>("/pulse"),
    getLocations: () => apiClient.get<any[]>("/pulse/locations"),
    reportCrowd: (data: { location_id?: number; location_name?: string; density_level: string; notes?: string }) =>
      apiClient.post<any>("/pulse/report", data),
    getBuzz: (locationId?: number) =>
      apiClient.get<any>(`/pulse/buzz${locationId ? `?location_id=${locationId}` : ""}`),
    postBuzz: (data: { location_id?: number; location_name?: string; title: string; content: string }) =>
      apiClient.post<any>("/pulse/buzz", data),
  },

  admin: {
    getDashboard: () => apiClient.get<any>("/admin/dashboard"),
    getAnalytics: () => apiClient.get<any>("/admin/analytics"),
    getSystemHealth: () => apiClient.get<any>("/admin/system-health"),
    getUsers: (role?: string, q?: string) => {
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      if (q) params.set("q", q);
      return apiClient.get<any[]>(`/admin/users?${params.toString()}`);
    },
    createUser: (data: any) => apiClient.post<any>("/admin/users", data),
    getStudents: (q?: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      return apiClient.get<any[]>(`/admin/students?${params.toString()}`);
    },
    createStudent: (data: any) => apiClient.post<any>("/admin/students", data),
    getStudent: (id: string) => apiClient.get<any>(`/admin/students/${id}`),
    updateStudent: (id: string, data: any) => apiClient.put<any>(`/admin/students/${id}`, data),
    deleteStudent: (id: string) => apiClient.delete<any>(`/admin/students/${id}`),
    getFaculty: (q?: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      return apiClient.get<any[]>(`/admin/faculty?${params.toString()}`);
    },
    createFaculty: (data: any) => apiClient.post<any>("/admin/faculty", data),
    getFacultyMember: (id: string) => apiClient.get<any>(`/admin/faculty/${id}`),
    updateFaculty: (id: string, data: any) => apiClient.put<any>(`/admin/faculty/${id}`, data),
    deleteFaculty: (id: string) => apiClient.delete<any>(`/admin/faculty/${id}`),
    getCourses: (q?: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      return apiClient.get<any[]>(`/admin/courses?${params.toString()}`);
    },
    createCourse: (data: any) => apiClient.post<any>("/admin/courses", data),
    updateCourse: (id: number, data: any) => apiClient.put<any>(`/admin/courses/${id}`, data),
    deleteCourse: (id: number) => apiClient.delete(`/admin/courses/${id}`),
    getEnrollments: (q?: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      return apiClient.get<any[]>(`/admin/enrollments?${params.toString()}`);
    },
    createEnrollment: (data: any) => apiClient.post<any>("/admin/enrollments", data),
    deleteEnrollment: (id: number) => apiClient.delete(`/admin/enrollments/${id}`),
    getIssues: (status?: string, priority?: string) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      return apiClient.get<any[]>(`/admin/issues?${params.toString()}`);
    },
    getIssue: (id: string) => apiClient.get<any>(`/admin/issues/${id}`),
    getEvents: () => apiClient.get<any[]>(`/admin/events`),
    getEvent: (id: string) => apiClient.get<any>(`/admin/events/${id}`),
  },

  buildings: {
    getAll: (page?: number, limit?: number) =>
      apiClient.get<PaginatedResponse<any>>(`/buildings?page=${page ?? 1}&limit=${limit ?? 20}`),
    getById: (id: string) => apiClient.get(`/buildings/${id}`),
    getByDepartment: (dept: string) =>
      apiClient.get<PaginatedResponse<any>>(`/buildings?department=${encodeURIComponent(dept)}`),
  },

  rooms: {
    getVacant: (params?: { min_capacity?: number; room_type?: string; building_id?: number }) => {
      const q = new URLSearchParams();
      if (params?.min_capacity) q.set("min_capacity", String(params.min_capacity));
      if (params?.room_type) q.set("room_type", params.room_type);
      if (params?.building_id) q.set("building_id", String(params.building_id));
      return apiClient.get<any[]>(`/rooms/vacant?${q.toString()}`);
    },
    getById: (id: string) => apiClient.get(`/rooms/${id}`),
    getByBuilding: (buildingId: string) =>
      apiClient.get<PaginatedResponse<any>>(`/buildings/${buildingId}/rooms`),
    getAvailability: (id: string, date?: string) =>
      apiClient.get(`/rooms/${id}/availability?date=${date ?? ""}`),
  },

  lifts: {
    getAll: () => apiClient.get<any[]>("/lifts"),
    getById: (id: string) => apiClient.get(`/lifts/${id}`),
    getByBuilding: (buildingId: string) =>
      apiClient.get<any[]>(`/buildings/${buildingId}/lifts`),
  },

  courses: {
    getAll: () => apiClient.get<PaginatedResponse<any>>("/courses"),
    getById: (id: string) => apiClient.get(`/courses/${id}`),
    getByDepartment: (dept: string) =>
      apiClient.get<PaginatedResponse<any>>(`/courses?department=${encodeURIComponent(dept)}`),
  },

  schedule: {
    getTimetable: (studentId?: string) =>
      apiClient.get(`/timetable/my-schedule${studentId ? `?studentId=${studentId}` : ""}`),
    getNextClass: () => apiClient.get("/timetable/next-class"),
    reassignRoom: (data: { new_room_number: string; new_building_name?: string }) =>
      apiClient.post("/timetable/reassign-room", data),
    getClassSession: (id: string) => apiClient.get(`/sessions/${id}`),
    getTodaysSessions: () => apiClient.get("/sessions/today"),
  },

  library: {
    getBooks: (q?: string) => apiClient.get<any[]>(`/library/books${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    getBookById: (id: string) => apiClient.get(`/library/books/${id}`),
    reserveBook: (bookId: string) => apiClient.post("/library/reserve", { book_id: bookId }),
    getSeats: () => apiClient.get<any[]>("/library/seats"),
    getOccupancy: () => apiClient.get("/library/occupancy"),
    getReservations: () => apiClient.get<any[]>("/library/reservations"),
    updateReservation: (id: string, data: { status?: string }) => apiClient.patch(`/library/reservations/${id}`, data),
  },

  lostFound: {
    getItems: (type?: string, q?: string) => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (q) params.set("q", q);
      return apiClient.get<any[]>(`/lost-found/items?${params.toString()}`);
    },
    getItemById: (id: string) => apiClient.get(`/lost-found/items/${id}`),
    reportItem: (data: { title: string; type: string; category: string; location: string; description?: string }) =>
      apiClient.post("/lost-found/report", data),
    adminGetAll: (type?: string) => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      return apiClient.get<any[]>(`/admin/lost-found?${params.toString()}`);
    },
    adminUpdateStatus: (id: string, data: { status?: string; description?: string }) =>
      apiClient.patch(`/admin/lost-found/${id}`, data),
  },

  resources: {
    search: (q?: string, courseId?: string, type?: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (courseId) params.set("course_id", courseId);
      if (type) params.set("type", type);
      return apiClient.get<any[]>(`/resources?${params.toString()}`);
    },
    getById: (id: string) => apiClient.get(`/resources/${id}`),
    bookmark: (resourceId: string) => apiClient.post("/resources/bookmark", { resource_id: resourceId }),
  },

  faq: {
    search: (q?: string, category?: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      return apiClient.get<any[]>(`/faq/search?${params.toString()}`);
    },
  },

  crowd: {
    getState: () => apiClient.get("/crowd/state"),
    getReports: (locationId?: string) =>
      apiClient.get<PaginatedResponse<any>>(
        `/crowd/reports${locationId ? `?locationId=${locationId}` : ""}`
      ),
    getHeatmap: () => apiClient.get("/crowd/heatmap"),
  },

  issues: {
    getAll: (page?: number, limit?: number) =>
      apiClient.get<PaginatedResponse<any>>(
        `/issues?page=${page ?? 1}&limit=${limit ?? 20}`
      ),
    getById: (id: string) => apiClient.get(`/issues/${id}`),
    create: (data: any) => apiClient.post("/issues", data),
    update: (id: string, data: any) => apiClient.patch(`/issues/${id}`, data),
    assign: (id: string, assigneeId: string) =>
      apiClient.post(`/issues/${id}/assign`, { assigneeId }),
  },

  events: {
    getAll: (page?: number, limit?: number) =>
      apiClient.get<PaginatedResponse<any>>(
        `/events?page=${page ?? 1}&limit=${limit ?? 20}`
      ),
    getById: (id: string) => apiClient.get(`/events/${id}`),
    create: (data: any) => apiClient.post("/events", data),
    register: (id: string) => apiClient.post(`/events/${id}/register`),
    cancelRegistration: (id: string) =>
      apiClient.delete(`/events/${id}/registration`),
    getRegistrations: (id: string) =>
      apiClient.get<{ registered: boolean; registrations: number; capacity: number }>(
        `/events/${id}/registrations`
      ),
  },

  notifications: {
    getAll: (unreadOnly?: boolean) => {
      const q = unreadOnly ? "?unread_only=true" : "";
      return apiClient.get<any[]>(`/notifications${q}`);
    },
    getUnread: () => apiClient.get<{ unread: number; count: number }>("/notifications/unread"),
    markAsRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
    markAllRead: () => apiClient.post("/notifications/read-all"),
    create: (data: { recipient_id?: string; event: string; reason: string; priority?: string; data?: Record<string, unknown> }) =>
      apiClient.post<any>("/notifications", data),
  },

  ai: {
    sendMessage: (data: { message: string; context?: Record<string, unknown> }) =>
      apiClient.post<{ response: string; tools_used: string[]; confidence: number; sources: string[] }>("/ai/chat", data),
    getSuggestions: () => apiClient.get<string[]>("/ai/suggestions"),
    getTools: () => apiClient.get<any[]>("/ai/tools"),
  },

  analytics: {
    getCampusOverview: () => apiClient.get("/analytics/campus"),
    getBuildingUsage: (buildingId: string) =>
      apiClient.get(`/analytics/building/${buildingId}`),
    getPredictions: () => apiClient.get("/analytics/predictions"),
  },

  simulation: {
    getSimulations: () => apiClient.get<any[]>("/simulation"),
    getById: (id: string) => apiClient.get(`/simulation/${id}`),
    run: (scenarioType: string = "lab_closure", params?: Record<string, unknown>) =>
      apiClient.post("/simulation/run", { scenario_type: scenarioType, parameters: params }),
    apply: (simId: string, targetRoom: string = "CSB 302") =>
      apiClient.post(`/simulation/${simId}/apply`, { target_room: targetRoom }),
    getStatus: (id: string) => apiClient.get(`/simulation/${id}/status`),
  },

  search: {
    search: (query: string, filters?: Record<string, unknown>) =>
      apiClient.post<PaginatedResponse<any>>("/search", { query, filters }),
  },

  emergency: {
    report: (data: { emergency_type: string; severity: string; location_name: string; description: string; building_id?: number; coordinates?: string; reporter_name?: string; reporter_phone?: string }) =>
      apiClient.post<any>("/emergency/report", data),
    getActive: () => apiClient.get<any[]>("/emergency/active"),
    getAll: () => apiClient.get<any[]>("/emergency/all"),
    getById: (id: string) => apiClient.get(`/emergency/${id}`),
    updateStatus: (id: string, data: { status: string; assigned_responder?: string; admin_notes?: string }) =>
      apiClient.patch(`/emergency/${id}/status`, data),
  },

  presence: {
    getConsent: () => apiClient.get<any>("/presence/consent"),
    updateConsent: (data: { is_enabled: boolean; privacy_mode?: string; share_with_friends?: boolean; share_with_faculty?: boolean }) =>
      apiClient.put<any>("/presence/consent", data),
    updateLocation: (data: { building_id?: number; floor_id?: number; room_id?: string; zone?: string }) =>
      apiClient.post<any>("/presence/location", data),
    getCampusSummary: () => apiClient.get<any>("/presence/campus-summary"),
    getLocation: () => apiClient.get<LocationState>("/location/status"),
  },

  location: {
    getLocations: () => apiClient.get<CampusLocationInfo[]>("/location/locations"),
    submitLocation: (data: { latitude: number; longitude: number; accuracy?: number; timestamp?: string }) =>
      apiClient.post<any>("/location/update", data),
    disableTracking: () => apiClient.post<any>("/location/disable"),
    getRush: () => apiClient.get<any[]>("/location/rush"),
    getLocationRush: (locationId: number) => apiClient.get<any>(`/location/rush/${locationId}`),
    getAdminOverrides: () => apiClient.get<any[]>("/location/admin/overrides"),
    createAdminOverride: (data: { location_id: number; people_count: number; rush_level: string; reason?: string; duration_minutes: number }) =>
      apiClient.post<any>("/location/admin/override", data),
    deleteAdminOverride: (overrideId: string) => apiClient.delete(`/location/admin/override/${overrideId}`),
  },
};

export function getApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const cleanBase = (API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const rootBase = cleanBase.replace(/\/api\/v1\/?$/, "");
  const subPath = cleanPath.replace(/^\/api\/v1/, "");
  const normalizedSubPath = subPath.startsWith("/") ? subPath : `/${subPath}`;
  return `${rootBase}/api/v1${normalizedSubPath}`;
}

export { ApiError };
export default apiClient;
