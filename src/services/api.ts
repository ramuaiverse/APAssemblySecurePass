// For web development, you may need to use a proxy or test on native devices
// CORS only affects web browsers, not native iOS/Android apps
const API_BASE_URL =
  "https://smart-gate-backend-714903368119.us-central1.run.app";

// Base URL for pass-requests validation APIs (no authentication required)
const VALIDATION_API_BASE_URL =
  "https://category-service-714903368119.us-central1.run.app";

// UserLoginRequest schema from new API
export interface LoginRequest {
  username: string;
  password: string;
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
export type PassType = "daily" | "single" | "multiple" | "event";

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
  passType: PassType;
  entryType: EntryType;
  validFrom: string; // ISO date-time string
  validUntil: string; // ISO date-time string
  notes?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;
}

export const api = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Validate required fields
    if (!credentials.username || !credentials.password) {
      throw new Error("Username and password are required");
    }

    // Build request body - ensure all fields are strings
    const requestBody: LoginRequest = {
      username: String(credentials.username).trim(),
      password: String(credentials.password),
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
    formData.append("password", requestBody.password);
    formData.append("expected_role", requestBody.expected_role || "");

    try {
      const response = await fetch(
        `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: formData.toString(),
        }
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

  createPass: async (formData: VisitorFormData): Promise<PassResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/passes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
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
            : `Failed to create pass: ${response.statusText}`);

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

  // Validate QR code without authentication (public endpoint)
  validateQRCodePublic: async (
    qrCodeId: string,
    gate?: string,
    gateAction?: "entry" | "exit"
  ): Promise<QRValidationResponse> => {
    try {
      // Build URL with optional gate and gate_action query parameters
      let url = `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/validate-qr/${encodeURIComponent(
        qrCodeId
      )}`;

      const queryParams: string[] = [];
      if (gate) {
        queryParams.push(`gate=${encodeURIComponent(gate)}`);
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
    }
  ): Promise<QRValidationResponse> => {
    try {
      // Build URL with query parameters
      let url = `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/validate-pass-number/${encodeURIComponent(
        passNumber
      )}`;

      const queryParams: string[] = [];

      // Add auto_record_scan (default: true)
      if (options?.auto_record_scan !== undefined) {
        queryParams.push(`auto_record_scan=${options.auto_record_scan}`);
      } else {
        queryParams.push(`auto_record_scan=true`);
      }

      // Add scanned_by if provided
      if (options?.scanned_by) {
        queryParams.push(
          `scanned_by=${encodeURIComponent(options.scanned_by)}`
        );
      }

      // Add gate_location if provided
      if (options?.gate_location) {
        queryParams.push(
          `gate_location=${encodeURIComponent(options.gate_location)}`
        );
      }

      // Add gate_action if provided
      if (options?.gate_action) {
        queryParams.push(
          `gate_action=${encodeURIComponent(options.gate_action)}`
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
    photoUri: string
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

      const url = `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/validate-qr/${encodeURIComponent(
        qrData
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
    }
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

    const url = `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/visitors/${visitorId}/suspend`;

    // The API expects form-encoded data
    const formData = new URLSearchParams();
    formData.append("suspended_by", requestBody.suspended_by);
    formData.append("reason", requestBody.reason);

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
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
};
