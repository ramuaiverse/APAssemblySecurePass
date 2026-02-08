// Base URL for pass-requests validation APIs (no authentication required)
export const API_BASE_URL =
  "https://category-service-714903368119.us-central1.run.app";

export const STAGE_API_BASE_URL =
  "https://apld-stg-apiserivce-714903368119.us-central1.run.app";

// UserLoginRequest schema from new API
export interface LoginRequest {
  username: string;
  password?: string; // Optional for first-time login
  expected_role?: string;
}

// UserLoginResponse schema from new API
export interface LoginResponse {
  username: string;
  email: string;
  full_name: string;
  mobile: string;
  employee_id: string | null;
  role: string;
  designation: string | null;
  approval_level: string | null;
  hod_approver: boolean;
  legislative_approver: boolean;
  is_superior: boolean;
  must_set_password: boolean;
  profile_picture: string | null;
  id: string; // uuid
  is_active: boolean;
  created_at: string; // date-time
  updated_at: string; // date-time
  created_by: string | null;
  sub_categories: Array<object>;
  is_first_time_login: boolean | null;
}

// ScanStatus enum from Swagger
export type ScanStatus = "approved" | "rejected" | "expired";

// VisitorResponse schema from new API structure
export interface VisitorResponse {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  identification_type: string | null;
  identification_number: string | null;
  identification_photo_url: string | null;
  photo: string | null;
}

// PassResponse schema from new API structure
export interface PassResponse {
  request_id: string;
  pass_number: string;
  pass_qr_string: string;
  pass_qr_code: string;
  session: string;
  category: string;
  pass_category: string;
  pass_sub_category: string;
  pass_type: string;
  valid_from: string;
  valid_to: string;
  valid_from_formatted: string;
  valid_to_formatted: string;
  purpose: string;
  requested_by: string;
}

// QRValidationResponse schema from new API structure
export interface QRValidationResponse {
  valid: boolean;
  suspended: boolean;
  expired: boolean;
  not_yet_valid: boolean;
  visitor: VisitorResponse | null;
  pass: PassResponse | null;
  status: ScanStatus;
  scan_recorded: boolean;
  scan_id: string | null;
  message?: string;
}

// PassType enum from Swagger
export type PassTypeEnum = "daily" | "single" | "multiple" | "event";

// EntryType enum from Swagger
export type EntryType = "single" | "multiple";

// VisitorFormData schema from Swagger
export interface VisitorFormData {
  full_name: string;
  email?: string | null;
  phone: string;
  organization?: string | null;
  numberOfVisitors: number;
  purposeOfVisit: string;
  passType: PassTypeEnum;
  entryType: EntryType;
  validFrom: string; // ISO date-time string
  validUntil: string; // ISO date-time string
  notes?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;
}

// SubCategory schema from category API
export interface SubCategory {
  name: string;
  color: string | null;
  hex_code: string | null;
  description: string;
  is_active: boolean;
  daily_limit: number | null;
  monthly_limit: number | null;
  pass_type_id: string | null;
  id: string;
  main_category_id: string;
  created_at: string;
  updated_at: string;
  restrictions: any[];
  pass_type: string | null;
}

// MainCategory schema from category API
export interface MainCategory {
  type: string;
  name: string;
  color: string | null;
  hex_code: string | null;
  is_active: boolean;
  created_by: string;
  pass_type_id: string | null;
  daily_limit: number | null;
  id: string;
  created_at: string;
  updated_at: string;
  sub_categories: SubCategory[];
  pass_type: string | null;
}

// PassTypeItem schema from pass-types API
export interface PassTypeItem {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Session schema from sessions API
export interface Session {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// CategoryWeblink schema from issuers API
export interface CategoryWeblink {
  category_id: string;
  category_name: string;
  category_type: string;
  weblink: string;
  is_active: boolean;
  id: string;
  pass_issuer_id: string;
  created_at: string;
  updated_at: string;
}

// Issuer schema from issuers API
export interface Issuer {
  name: string;
  type: string;
  weblink: string;
  is_active: boolean;
  department_type: string | null;
  mla_mlc_number: string | null;
  constituency: string | null;
  media_agency: string | null;
  media_pass_type: string | null;
  issuer_role: string | null;
  institution_type: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  id: string;
  created_at: string;
  updated_at: string;
  category_weblinks: CategoryWeblink[];
}

// User schema from users by role API
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  mobile: string;
  employee_id: string | null;
  role: string;
  approval_level: string | null;
  hod_approver: boolean;
  legislative_approver: boolean;
  is_superior: boolean;
  must_set_password: boolean;
  profile_picture: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Superior schema
export interface Superior {
  id: string;
  username: string;
  email: string;
  full_name: string;
  mobile: string;
  employee_id: string | null;
  role: string;
  approval_level: string | null;
  hod_approver: boolean;
  legislative_approver: boolean;
  is_superior: boolean;
  must_set_password: boolean;
  profile_picture: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const api = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Validate required fields - password is now optional
    if (!credentials.username) {
      throw new Error("Username is required");
    }

    // Build request body - ensure all fields are strings
    const requestBody: LoginRequest = {
      username: String(credentials.username).trim(),
      password: credentials.password ? String(credentials.password) : "",
    };

    // Add expected_role if provided
    if (credentials.expected_role) {
      requestBody.expected_role = String(credentials.expected_role).trim();
    }

    // Ensure username is not empty after trim
    if (!requestBody.username) {
      throw new Error("Username cannot be empty");
    }

    // The API expects form-encoded data
    const formData = new URLSearchParams();
    formData.append("username", requestBody.username);
    if (requestBody.password) {
      formData.append("password", requestBody.password);
    }
    formData.append("expected_role", requestBody.expected_role || "");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/pass-requests/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: formData.toString(),
        },
      );

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        // Handle 422 validation errors
        if (response.status === 422) {
          let errorMessage = "Validation Error: ";

          if (Array.isArray(data?.detail)) {
            const validationErrors = data.detail
              .map((err: any) => {
                const field =
                  err.loc && Array.isArray(err.loc)
                    ? err.loc.slice(1).join(".")
                    : "field";
                const msg = err.msg || err.message || "Invalid value";
                return `${field}: ${msg}`;
              })
              .join("\n");
            errorMessage += validationErrors;
          } else if (typeof data?.detail === "string") {
            errorMessage += data.detail;
          } else {
            errorMessage +=
              "Invalid request format. Please check your credentials.";
          }

          throw new Error(errorMessage);
        }

        // Handle 401 Unauthorized
        if (response.status === 401) {
          const errorMsg =
            typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error || "Invalid username or password";

          const error = new Error(errorMsg);
          (error as any).isCredentialsError = true;
          throw error;
        }

        // Handle other errors
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          `Login failed: ${response.statusText || `Status ${response.status}`}`;

        throw new Error(errorMessage);
      }

      // Handle successful response - check if data is nested
      let loginData: LoginResponse;
      if (data.data && typeof data.data === "object") {
        loginData = data.data as LoginResponse;
      } else if (data.user && typeof data.user === "object") {
        loginData = data.user as LoginResponse;
      } else {
        loginData = data as LoginResponse;
      }

      return loginData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Validate QR code without authentication (public endpoint)
  validateQRCodePublic: async (
    qrCodeId: string,
    gate?: string,
    gateAction?: "entry" | "exit",
    autoRecordScan: boolean = true,
  ): Promise<QRValidationResponse> => {
    try {
      // Build URL with optional gate_location, gate_action, and auto_record_scan query parameters
      let url = `${API_BASE_URL}/api/v1/pass-requests/validate-qr/${encodeURIComponent(
        qrCodeId,
      )}`;

      const queryParams: string[] = [];
      // Always include auto_record_scan (defaults to true)
      queryParams.push(`auto_record_scan=${autoRecordScan}`);
      if (gate) {
        queryParams.push(`gate_location=${encodeURIComponent(gate)}`);
      }
      if (gateAction) {
        queryParams.push(`gate_action=${encodeURIComponent(gateAction)}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data.detail === "string"
              ? data.detail
              : data.detail
                ? JSON.stringify(data.detail)
                : null) ||
          data.message ||
          data.error ||
          (typeof data === "string"
            ? data
            : `Validation failed: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Validate pass number without authentication (public endpoint)
  validatePassNumber: async (
    passNumber: string,
    options?: {
      auto_record_scan?: boolean;
      scanned_by?: string;
      gate_location?: string;
      gate_action?: "entry" | "exit";
    },
  ): Promise<QRValidationResponse> => {
    try {
      // Build URL with query parameters
      let url = `${API_BASE_URL}/api/v1/pass-requests/validate-pass-number/${encodeURIComponent(
        passNumber,
      )}`;

      const queryParams: string[] = [];

      // Always include auto_record_scan (defaults to true)
      const autoRecordScan =
        options?.auto_record_scan !== undefined
          ? options.auto_record_scan
          : true;
      queryParams.push(`auto_record_scan=${autoRecordScan}`);

      // Add gate_location if provided
      if (options?.gate_location) {
        queryParams.push(
          `gate_location=${encodeURIComponent(options.gate_location)}`,
        );
      }

      // Add gate_action if provided
      if (options?.gate_action) {
        queryParams.push(
          `gate_action=${encodeURIComponent(options.gate_action)}`,
        );
      }

      // Add scanned_by if provided
      if (options?.scanned_by) {
        queryParams.push(
          `scanned_by=${encodeURIComponent(options.scanned_by)}`,
        );
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data.detail === "string"
              ? data.detail
              : data.detail
                ? JSON.stringify(data.detail)
                : null) ||
          data.message ||
          data.error ||
          (typeof data === "string"
            ? data
            : `Validation failed: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Upload visitor photo (no authentication required)
  uploadVisitorPhoto: async (
    qrData: string,
    photoUri: string,
  ): Promise<any> => {
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Extract filename from URI or use default
      const filename = photoUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("photo", {
        uri: photoUri,
        type: type,
        name: filename,
      } as any);

      const url = `${API_BASE_URL}/api/v1/pass-requests/validate-qr/${encodeURIComponent(
        qrData,
      )}/upload-photo`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          // Don't set Content-Type - let fetch set it with boundary for FormData
          Accept: "application/json",
        },
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data.detail === "string"
              ? data.detail
              : data.detail
                ? JSON.stringify(data.detail)
                : null) ||
          data.message ||
          data.error ||
          (typeof data === "string"
            ? data
            : `Photo upload failed: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Suspend visitor
  suspendVisitor: async (
    visitorId: string,
    data: {
      suspended_by: string;
      reason: string;
    },
  ): Promise<any> => {
    // Validate visitorId
    if (!visitorId || !visitorId.trim()) {
      throw new Error("visitorId is required");
    }

    // Validate required fields
    if (!data.suspended_by || !data.reason) {
      throw new Error("suspended_by and reason are required");
    }

    // Build request body - ensure all fields are strings
    const requestBody = {
      suspended_by: String(data.suspended_by).trim(),
      reason: String(data.reason).trim(),
    };

    // Ensure fields are not empty after trim
    if (!requestBody.suspended_by || !requestBody.reason) {
      throw new Error("suspended_by and reason cannot be empty");
    }

    const url = `${API_BASE_URL}/api/v1/pass-requests/visitors/${visitorId}/suspend`;

    // The API expects multipart/form-data
    const formData = new FormData();
    formData.append("suspended_by", requestBody.suspended_by);
    formData.append("reason", requestBody.reason);

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
      });

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        // Handle 422 validation errors
        if (response.status === 422) {
          let errorMessage = "Validation Error: ";

          if (Array.isArray(responseData?.detail)) {
            const validationErrors = responseData.detail
              .map((err: any) => {
                const field =
                  err.loc && Array.isArray(err.loc)
                    ? err.loc.slice(1).join(".")
                    : "field";
                const msg = err.msg || err.message || "Invalid value";
                return `${field}: ${msg}`;
              })
              .join("\n");
            errorMessage += validationErrors;
          } else if (typeof responseData?.detail === "string") {
            errorMessage += responseData.detail;
          } else {
            errorMessage += "Invalid request format.";
          }

          throw new Error(errorMessage);
        }

        // Handle other errors
        const errorMessage =
          (Array.isArray(responseData?.detail)
            ? responseData.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof responseData?.detail === "string"
              ? responseData.detail
              : responseData?.message || responseData?.error) ||
          (typeof responseData === "string"
            ? responseData
            : `Suspend visitor failed: ${
                response.statusText || `Status ${response.status}`
              }`);

        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Activate visitor (unsuspend)
  activateVisitor: async (
    visitorId: string,
    data: {
      activated_by: string;
    },
  ): Promise<any> => {
    // Validate visitorId
    if (!visitorId || !visitorId.trim()) {
      throw new Error("visitorId is required");
    }

    // Validate required fields
    if (!data.activated_by || !data.activated_by.trim()) {
      throw new Error("activated_by is required");
    }

    const url = `${API_BASE_URL}/api/v1/pass-requests/visitors/${visitorId}/activate`;

    // The API expects multipart/form-data
    const formData = new FormData();
    formData.append("activated_by", String(data.activated_by).trim());

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "*/*",
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
      });

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        // Handle 422 validation errors
        if (response.status === 422) {
          let errorMessage = "Validation Error: ";

          if (Array.isArray(responseData?.detail)) {
            const validationErrors = responseData.detail
              .map((err: any) => {
                const field =
                  err.loc && Array.isArray(err.loc)
                    ? err.loc.slice(1).join(".")
                    : "field";
                const msg = err.msg || err.message || "Invalid value";
                return `${field}: ${msg}`;
              })
              .join("\n");
            errorMessage += validationErrors;
          } else if (typeof responseData?.detail === "string") {
            errorMessage += responseData.detail;
          } else {
            errorMessage += "Invalid request format.";
          }

          throw new Error(errorMessage);
        }

        // Handle other errors
        const errorMessage =
          (Array.isArray(responseData?.detail)
            ? responseData.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof responseData?.detail === "string"
              ? responseData.detail
              : responseData?.message || responseData?.error) ||
          (typeof responseData === "string"
            ? responseData
            : `Activate visitor failed: ${
                response.statusText || `Status ${response.status}`
              }`);
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Get main categories
  getMainCategories: async (): Promise<MainCategory[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/categories/main`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to fetch categories: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      // Filter only active categories
      const activeCategories = (data as MainCategory[]).filter(
        (category) => category.is_active,
      );

      return activeCategories;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Get pass types for a specific category
  getCategoryPassTypes: async (categoryId: string): Promise<string[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/categories/main/${categoryId}/pass-types`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to fetch category pass types: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      // Return array of string IDs
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Get all pass types
  getAllPassTypes: async (): Promise<PassTypeItem[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/categories/pass-types?active_only=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to fetch pass types: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      // Return array of pass types
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Submit pass request with files
  submitPassRequestWithFiles: async (formData: FormData): Promise<any> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/submit-with-files`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          throw new Error(
            `Failed to parse JSON response: ${text || `Status ${response.status}`}`,
          );
        }
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        // Handle 422 validation errors
        if (response.status === 422) {
          let errorMessage = "Validation Error: ";

          if (Array.isArray(data?.detail)) {
            const validationErrors = data.detail
              .map((err: any) => {
                const field =
                  err.loc && Array.isArray(err.loc)
                    ? err.loc.slice(1).join(".")
                    : "field";
                const msg = err.msg || err.message || "Invalid value";
                return `${field}: ${msg}`;
              })
              .join("\n");
            errorMessage += validationErrors;
          } else if (typeof data?.detail === "string") {
            errorMessage += data.detail;
          } else {
            errorMessage += "Invalid request format. Please check your input.";
          }

          throw new Error(errorMessage);
        }

        // Handle other errors
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to submit pass request: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Get sessions
  getSessions: async (): Promise<Session[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/categories/sessions?limit=1000&active_only=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to fetch sessions: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      // Return array of sessions
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Update pass request status
  updatePassRequestStatus: async (
    requestId: string,
    statusData: {
      status: string;
      comments?: string;
      current_user_id: string;
      routed_by?: string;
      pass_category_id?: string;
      pass_sub_category_id?: string;
      pass_type_id?: string;
      season?: string;
    },
  ): Promise<any> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/${requestId}/status`;

    try {
      const formData = new FormData();
      formData.append("status", statusData.status);
      if (statusData.comments) {
        formData.append("comments", statusData.comments);
      }
      formData.append("current_user_id", statusData.current_user_id);
      if (statusData.routed_by) {
        formData.append("routed_by", statusData.routed_by);
      }
      if (statusData.pass_category_id) {
        formData.append("pass_category_id", statusData.pass_category_id);
      }
      if (statusData.pass_sub_category_id) {
        formData.append(
          "pass_sub_category_id",
          statusData.pass_sub_category_id,
        );
      }
      if (statusData.pass_type_id) {
        formData.append("pass_type_id", statusData.pass_type_id);
      }
      if (statusData.season) {
        formData.append("season", statusData.season);
      }

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "*/*",
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(
            `Server error: ${text || `Status ${response.status}`}`,
          );
        }
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to update pass request status: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Generate pass for a request
  // Legislative reject visitor
  rejectVisitorLegislative: async (
    visitorId: string,
    data: {
      current_user_id: string;
      rejection_reason: string;
    },
  ): Promise<any> => {
    if (!visitorId || !visitorId.trim()) {
      throw new Error("visitorId is required");
    }
    if (!data.current_user_id || !data.rejection_reason) {
      throw new Error("current_user_id and rejection_reason are required");
    }

    const url = `${API_BASE_URL}/api/v1/pass-requests/visitors/${visitorId}/status`;

    const formData = new FormData();
    formData.append("status", "rejected");
    formData.append("current_user_id", data.current_user_id);
    formData.append("rejection_reason", data.rejection_reason);

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "*/*",
        },
        body: formData,
      });

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(responseData?.detail)
            ? responseData.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof responseData?.detail === "string"
              ? responseData.detail
              : responseData?.message || responseData?.error) ||
          (typeof responseData === "string"
            ? responseData
            : `Reject visitor failed: ${
                response.statusText || `Status ${response.status}`
              }`);
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  generatePass: async (
    requestId: string,
    generateData: {
      visitor_id: string;
      pass_category_id?: string;
      pass_sub_category_id?: string;
      pass_type_id?: string;
      current_user_id: string;
      valid_from?: string;
      valid_to?: string;
      pass_type_color?: string;
      season?: string;
    },
  ): Promise<any> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/${requestId}/generate-pass`;

    try {
      const formData = new FormData();
      // Match curl command field order exactly
      formData.append("visitor_id", generateData.visitor_id);
      if (generateData.pass_category_id) {
        formData.append("pass_category_id", generateData.pass_category_id);
      }
      if (generateData.pass_sub_category_id) {
        formData.append(
          "pass_sub_category_id",
          generateData.pass_sub_category_id,
        );
      }
      if (generateData.pass_type_id) {
        formData.append("pass_type_id", generateData.pass_type_id);
      }
      formData.append("current_user_id", generateData.current_user_id);
      if (generateData.valid_from) {
        formData.append("valid_from", generateData.valid_from);
      }
      if (generateData.valid_to) {
        formData.append("valid_to", generateData.valid_to);
      }
      if (generateData.pass_type_color) {
        formData.append("pass_type_color", generateData.pass_type_color);
      }
      if (generateData.season) {
        formData.append("season", generateData.season);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(
            `Server error: ${text || `Status ${response.status}`}`,
          );
        }
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to generate pass: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Get pass request details
  getPassRequest: async (requestId: string): Promise<any> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/${requestId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to get pass request: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Get users by role
  getUsersByRole: async (roleName: string): Promise<User[]> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/users/by-role/${roleName}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to get users by role: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Get all active issuers
  getIssuers: async (): Promise<Issuer[]> => {
    const url = `${API_BASE_URL}/api/v1/issuers?limit=100&is_active=true`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to get issuers: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Generate OTP for username
  generateOTP: async (username: string): Promise<any> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/auth/otp/generate`;

    try {
      // Format as application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("expected_role", "");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(
            `Server error: ${text || `Status ${response.status}`}`,
          );
        }
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to generate OTP: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Verify OTP and login
  verifyOTP: async (
    username: string,
    otpCode: string,
  ): Promise<LoginResponse> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/auth/otp/verify`;

    try {
      // Format as application/x-www-form-urlencoded - match exact curl format
      // Ensure values are properly trimmed and encoded
      const trimmedUsername = String(username).trim();
      const trimmedOtpCode = String(otpCode).trim();

      // Use URLSearchParams for proper encoding
      const formData = new URLSearchParams();
      formData.append("username", trimmedUsername);
      formData.append("otp_code", trimmedOtpCode);
      formData.append("expected_role", "");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to verify OTP: ${response.statusText}`);

        // Check if this is an invalid OTP error
        const errorLower = errorMessage.toLowerCase();
        const isInvalidOTP =
          errorLower.includes("invalid") ||
          errorLower.includes("incorrect") ||
          errorLower.includes("wrong") ||
          errorLower.includes("otp") ||
          errorLower.includes("expired");

        const otpError = new Error(errorMessage);
        (otpError as any).isInvalidOTP = isInvalidOTP;
        throw otpError;
      }

      // Handle nested response structure: { success: true, message: "...", user: {...} }
      let loginResponse: LoginResponse;
      if (data.user && typeof data.user === "object") {
        // Response has nested user object
        loginResponse = data.user as LoginResponse;
      } else if (data.id && data.username) {
        // Response is already the user object
        loginResponse = data as LoginResponse;
      } else {
        throw new Error(
          "Unexpected response structure from OTP verification API",
        );
      }

      return loginResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Set password for first-time login
  setPassword: async (credentials: {
    username: string;
    password: string;
  }): Promise<LoginResponse> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/auth/set-password`;

    try {
      const formData = new FormData();
      formData.append("username", credentials.username);
      formData.append("password", credentials.password);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "*/*",
        },
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(
            `Server error: ${text || `Status ${response.status}`}`,
          );
        }
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to set password: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      // Handle successful response - check if data is nested
      let setPasswordData: LoginResponse;
      if (data.data && typeof data.data === "object") {
        setPasswordData = data.data as LoginResponse;
      } else if (data.user && typeof data.user === "object") {
        setPasswordData = data.user as LoginResponse;
      } else {
        setPasswordData = data as LoginResponse;
      }

      return setPasswordData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Resend WhatsApp for visitor pass
  resendWhatsApp: async (
    requestId: string,
    visitorId: string,
  ): Promise<any> => {
    // Validate IDs
    if (!requestId || !requestId.trim()) {
      throw new Error("requestId is required");
    }
    if (!visitorId || !visitorId.trim()) {
      throw new Error("visitorId is required");
    }

    const url = `${API_BASE_URL}/api/v1/pass-requests/${requestId}/visitor/${visitorId}/resend-whatsapp`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(responseData?.detail)
            ? responseData.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof responseData?.detail === "string"
              ? responseData.detail
              : responseData?.message || responseData?.error) ||
          (typeof responseData === "string"
            ? responseData
            : `Resend WhatsApp failed: ${
                response.statusText || `Status ${response.status}`
              }`);

        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Get all pass requests for dashboard
  getAllPassRequests: async (limit: number = 10000): Promise<any[]> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests?limit=${limit}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(data?.detail)
            ? data.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof data?.detail === "string"
              ? data.detail
              : data?.message || data?.error) ||
          (typeof data === "string"
            ? data
            : `Failed to get pass requests: ${response.statusText}`);

        throw new Error(errorMessage);
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  // Update visitor status (approve/reject/pending)
  updateVisitorStatus: async (
    visitorId: string,
    status: "approved" | "rejected",
    currentUserId: string,
    rejectionReason?: string,
  ): Promise<any> => {
    if (!visitorId || !visitorId.trim()) {
      throw new Error("Visitor ID is required");
    }
    if (!currentUserId || !currentUserId.trim()) {
      throw new Error("Current user ID is required");
    }
    if (status !== "approved" && status !== "rejected") {
      throw new Error("Status must be 'approved' or 'rejected'");
    }

    const url = `${API_BASE_URL}/api/v1/pass-requests/visitors/${visitorId}/status`;

    // Create form data
    const formData = new FormData();
    formData.append("status", status);
    formData.append("current_user_id", currentUserId);
    if (rejectionReason) {
      formData.append("rejection_reason", rejectionReason);
    }

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "*/*",
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
      });

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(responseData?.detail)
            ? responseData.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof responseData?.detail === "string"
              ? responseData.detail
              : responseData?.message || responseData?.error) ||
          (typeof responseData === "string"
            ? responseData
            : `Update visitor status failed: ${
                response.statusText || `Status ${response.status}`
              }`);

        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  getSuperiors: async (department: string): Promise<Superior[]> => {
    const url = `${API_BASE_URL}/api/v1/pass-requests/superiors/${department}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(responseData?.detail)
            ? responseData.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof responseData?.detail === "string"
              ? responseData.detail
              : responseData?.message || responseData?.error) ||
          (typeof responseData === "string"
            ? responseData
            : `Get superiors failed: ${
                response.statusText || `Status ${response.status}`
              }`);
        throw new Error(errorMessage);
      }

      return responseData || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  routeForSuperiorApproval: async (
    requestId: string,
    data: {
      visitor_id: string;
      routed_to: string;
      routed_by: string;
      current_user_id: string;
      comments?: string;
    },
  ): Promise<any> => {
    if (!requestId || !requestId.trim()) {
      throw new Error("requestId is required");
    }
    if (
      !data.visitor_id ||
      !data.routed_to ||
      !data.routed_by ||
      !data.current_user_id
    ) {
      throw new Error(
        "visitor_id, routed_to, routed_by, and current_user_id are required",
      );
    }

    const url = `${API_BASE_URL}/api/v1/pass-requests/${requestId}/status`;

    const formData = new FormData();
    // Match exact order from portal curl command
    formData.append("status", "routed_for_approval");
    if (data.comments) {
      formData.append("comments", data.comments);
    }
    formData.append("routed_to", data.routed_to);
    formData.append("routed_by", data.routed_by);
    formData.append("current_user_id", data.current_user_id);
    formData.append("visitor_id", data.visitor_id);

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "*/*",
        },
        body: formData,
      });

      let responseData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        const errorMessage =
          (Array.isArray(responseData?.detail)
            ? responseData.detail
                .map((e: any) => e.msg || e.message || JSON.stringify(e))
                .join(", ")
            : typeof responseData?.detail === "string"
              ? responseData.detail
              : responseData?.message || responseData?.error) ||
          (typeof responseData === "string"
            ? responseData
            : `Route for superior approval failed: ${
                response.statusText || `Status ${response.status}`
              }`);
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },
};
