// For web development, you may need to use a proxy or test on native devices
// CORS only affects web browsers, not native iOS/Android apps
const API_BASE_URL =
  "https://smart-gate-backend-714903368119.us-central1.run.app";

// UserLoginRequest schema from Swagger
export interface LoginRequest {
  username: string;
  password: string;
}

// TokenResponse schema from Swagger
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string; // default: "bearer"
  expires_in: number;
}

// RefreshTokenRequest schema from Swagger
export interface RefreshTokenRequest {
  refresh_token: string;
}

// RefreshTokenResponse is the same as LoginResponse
export type RefreshTokenResponse = LoginResponse;

// QRValidationRequest schema from Swagger
export interface QRValidationRequest {
  qr_code_id: string;
}

// ScanStatus enum from Swagger
export type ScanStatus = "approved" | "rejected" | "expired";

// PassResponse schema from Swagger (simplified for validation response)
export interface PassResponse {
  id: string;
  qr_code_id: string;
  qr_code_url: string;
  full_name: string;
  email: string | null;
  phone: string;
  organization: string | null;
  number_of_visitors: number;
  purpose_of_visit: string;
  pass_type: string;
  entry_type: string;
  valid_from: string;
  valid_until: string;
  status: string;
  designation: string | null;
  identification_type: string | null;
  identification_number: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
}

// QRValidationResponse schema from Swagger
export interface QRValidationResponse {
  valid: boolean;
  status: ScanStatus;
  message: string;
  pass_data: PassResponse | null;
  scan_id: string | null;
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
    try {
      // API expects JSON format with username and password (both required)
      if (!credentials.username || !credentials.password) {
        throw new Error("Username and password are required");
      }

      const requestBody: LoginRequest = {
        username: credentials.username,
        password: credentials.password,
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
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
        // Log the full error response for debugging
        // console.error("Login API Error:", {
        //   status: response.status,
        //   statusText: response.statusText,
        //   data: JSON.stringify(data, null, 2),
        // });

        // Handle 422 validation errors - show detailed field errors
        if (response.status === 422) {
          let errorMessage = "Validation Error: ";

          if (Array.isArray(data.detail)) {
            // FastAPI validation errors format
            const validationErrors = data.detail
              .map((err: any) => {
                const field =
                  err.loc && Array.isArray(err.loc)
                    ? err.loc.slice(1).join(".") // Remove 'body' from path
                    : "field";
                const msg = err.msg || err.message || "Invalid value";
                return `${field}: ${msg}`;
              })
              .join("\n");
            errorMessage += validationErrors;
          } else if (data.detail && typeof data.detail === "object") {
            // Try to extract error message from detail object
            errorMessage += JSON.stringify(data.detail, null, 2);
          } else if (typeof data.detail === "string") {
            errorMessage += data.detail;
          } else {
            errorMessage +=
              "Invalid request format. Please check your credentials.";
          }

          throw new Error(errorMessage);
        }

        // Handle 401 Unauthorized (invalid credentials)
        if (response.status === 401) {
          // Extract error message from detail field
          let errorMsg = "Invalid username or password";

          if (typeof data.detail === "string") {
            errorMsg = data.detail;
          } else if (data.detail && typeof data.detail === "object") {
            // If detail is an object, try to extract message
            errorMsg = data.detail.message || JSON.stringify(data.detail);
          } else if (data.message) {
            errorMsg = data.message;
          } else if (data.error) {
            errorMsg = data.error;
          }

          // Create a custom error with the message
          const error = new Error(errorMsg);
          // Add a flag to indicate this is a credentials error
          (error as any).isCredentialsError = true;
          throw error;
        }

        // Handle other error formats
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
            : `Login failed: ${response.statusText}`);

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

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    try {
      const requestBody: RefreshTokenRequest = {
        refresh_token: refreshToken,
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
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
        // console.error("Refresh Token API Error:", {
        //   status: response.status,
        //   statusText: response.statusText,
        //   data: JSON.stringify(data, null, 2),
        // });

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
            : `Token refresh failed: ${response.statusText}`);

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

  validateQRCode: async (
    qrCodeId: string,
    location: string = "Main Gate",
    event?: string
  ): Promise<QRValidationResponse> => {
    try {
      // Get access token
      const { tokenStorage } = await import("./tokenStorage");
      const accessToken = await tokenStorage.getAccessToken();

      if (!accessToken) {
        throw new Error("No access token available. Please login again.");
      }

      const requestBody: QRValidationRequest = {
        qr_code_id: qrCodeId,
      };

      // Build URL with query parameters
      let url = `${API_BASE_URL}/api/v1/passes/validate?location=${encodeURIComponent(
        location
      )}`;
      if (event) {
        url += `&event=${encodeURIComponent(event)}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
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
        // console.error("Validate QR Code API Error:", {
        //   status: response.status,
        //   statusText: response.statusText,
        //   data: JSON.stringify(data, null, 2),
        // });

        // Handle 401 Unauthorized - token might be expired
        if (response.status === 401) {
          // Try to refresh token
          const { tokenManager } = await import("./tokenManager");
          const refreshed = await tokenManager.refreshToken();

          if (refreshed) {
            // Retry with new token
            const newAccessToken = await tokenStorage.getAccessToken();
            const retryResponse = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${newAccessToken}`,
              },
              body: JSON.stringify(requestBody),
            });

            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }

          throw new Error("Authentication failed. Please login again.");
        }

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

  createPass: async (formData: VisitorFormData): Promise<PassResponse> => {
    try {
      // Get access token
      const { tokenStorage } = await import("./tokenStorage");
      const accessToken = await tokenStorage.getAccessToken();

      if (!accessToken) {
        throw new Error("No access token available. Please login again.");
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/passes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
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
        // console.error("Create Pass API Error:", {
        //   status: response.status,
        //   statusText: response.statusText,
        //   data: JSON.stringify(data, null, 2),
        // });

        // Handle 401 Unauthorized - token might be expired
        if (response.status === 401) {
          // Try to refresh token
          const { tokenManager } = await import("./tokenManager");
          const refreshed = await tokenManager.refreshToken();

          if (refreshed) {
            // Retry with new token
            const newAccessToken = await tokenStorage.getAccessToken();
            const retryResponse = await fetch(`${API_BASE_URL}/api/v1/passes`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${newAccessToken}`,
              },
              body: JSON.stringify(formData),
            });

            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }

          throw new Error("Authentication failed. Please login again.");
        }

        // Handle 422 validation errors
        if (response.status === 422) {
          let errorMessage = "Validation Error: ";

          if (Array.isArray(data.detail)) {
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
          } else if (typeof data.detail === "string") {
            errorMessage += data.detail;
          } else {
            errorMessage += "Invalid request format. Please check your input.";
          }

          throw new Error(errorMessage);
        }

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
};
