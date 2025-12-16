// For web development, you may need to use a proxy or test on native devices
// CORS only affects web browsers, not native iOS/Android apps
const API_BASE_URL =
  "https://smart-gate-backend-714903368119.us-central1.run.app";

// Base URL for pass-requests validation APIs (no authentication required)
const VALIDATION_API_BASE_URL =
  "https://category-service-714903368119.us-central1.run.app";

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
  qr_code_id?: string;
  qr_data?: string;
  qr_code?: string;
  qr_string?: string;
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

  // Validate QR code without authentication (public endpoint)
  validateQRCodePublic: async (
    qrCodeId: string
  ): Promise<QRValidationResponse> => {
    try {
      const response = await fetch(
        `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/validate-qr/${encodeURIComponent(
          qrCodeId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
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
    // try {
    //   // Validate that qrCodeId is not empty
    //   if (!qrCodeId) {
    //     throw new Error("QR code data is required");
    //   }

    //   // Convert to string and trim
    //   let qrDataString = String(qrCodeId).trim();

    //   // Extract UUID from URL if it's a URL format
    //   // Format: http://localhost:3000/validate/{uuid} or similar
    //   if (qrDataString.includes("/validate/")) {
    //     const match = qrDataString.match(/\/validate\/([^\/\s]+)/);
    //     if (match && match[1]) {
    //       qrDataString = match[1];
    //       console.log("Extracted UUID from URL in API:", qrDataString);
    //     }
    //   }

    //   // If it's a full URL but doesn't match the pattern, try to extract the last part
    //   if (qrDataString.includes("http") && qrDataString.includes("/")) {
    //     const parts = qrDataString.split("/");
    //     const lastPart = parts[parts.length - 1];
    //     // Check if last part looks like a UUID (contains hyphens and is reasonably long)
    //     if (lastPart.includes("-") && lastPart.length > 20) {
    //       qrDataString = lastPart;
    //       console.log("Extracted UUID from URL path in API:", qrDataString);
    //     }
    //   }

    //   if (
    //     qrDataString === "" ||
    //     qrDataString === "null" ||
    //     qrDataString === "undefined"
    //   ) {
    //     throw new Error("QR code data is invalid");
    //   }

    //   // Create request body with qr_data field
    //   // Ensure the value is a valid non-empty string
    //   const qrDataValue = qrDataString;

    //   // Final validation before creating request body
    //   if (
    //     !qrDataValue ||
    //     qrDataValue === null ||
    //     qrDataValue === undefined ||
    //     qrDataValue.trim() === ""
    //   ) {
    //     console.error("QR data value is invalid:", {
    //       original: qrCodeId,
    //       processed: qrDataString,
    //       type: typeof qrCodeId,
    //     });
    //     throw new Error("QR code data is required and cannot be empty");
    //   }

    //   // Create request body - ensure qr_data is explicitly set
    //   const requestBody: Record<string, string> = {};
    //   requestBody.qr_data = qrDataValue;

    //   // Final check that qr_data is set
    //   if (!requestBody.qr_data) {
    //     console.error("Failed to set qr_data in request body");
    //     throw new Error("Failed to set QR data in request body");
    //   }

    //   // Verify request body structure
    //   console.log("=== Validate QR Request Debug ===");
    //   console.log("QR Code ID (original):", qrCodeId);
    //   console.log("QR Code ID (processed):", qrDataString);
    //   console.log("QR Code ID Type:", typeof qrCodeId);
    //   console.log("QR Code ID Length:", qrDataString.length);
    //   console.log("Request Body Object:", requestBody);
    //   console.log("Request Body qr_data value:", requestBody.qr_data);
    //   console.log("Request Body qr_data type:", typeof requestBody.qr_data);
    //   console.log("Request Body qr_data length:", requestBody.qr_data?.length);
    //   console.log(
    //     "API URL:",
    //     `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/validate-qr`
    //   );

    //   const requestBodyString = JSON.stringify(requestBody);
    //   console.log("Request Body String:", requestBodyString);

    //   // Verify the stringified body before sending
    //   try {
    //     const parsed = JSON.parse(requestBodyString);
    //     console.log("Request Body String parsed back:", parsed);
    //     console.log("Parsed qr_data value:", parsed.qr_data);
    //     console.log("Parsed qr_data type:", typeof parsed.qr_data);

    //     // Final validation - ensure qr_data exists and is not null
    //     if (
    //       !parsed.qr_data ||
    //       parsed.qr_data === null ||
    //       parsed.qr_data === undefined
    //     ) {
    //       console.error(
    //         "ERROR: qr_data is null/undefined in parsed request body!"
    //       );
    //       throw new Error("QR data is null in request body");
    //     }
    //   } catch (e) {
    //     console.error("Error parsing/validating request body string:", e);
    //     if (
    //       e instanceof Error &&
    //       (e.message.includes("null") || e.message.includes("undefined"))
    //     ) {
    //       throw e;
    //     }
    //   }

    //   const response = await fetch(
    //     `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/validate-qr`,
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Accept: "application/json",
    //       },
    //       body: requestBodyString,
    //     }
    //   );

    //   console.log("Validate QR Response Status:", response.status);

    //   let data;
    //   const contentType = response.headers.get("content-type");

    //   if (contentType && contentType.includes("application/json")) {
    //     data = await response.json();
    //   } else {
    //     const text = await response.text();
    //     console.log("Validate QR Non-JSON Response:", text);
    //     throw new Error(`Server error: ${text || `Status ${response.status}`}`);
    //   }

    //   if (!response.ok) {
    //     console.log(
    //       "Validate QR Error Response:",
    //       JSON.stringify(data, null, 2)
    //     );
    //     console.log("Response Status:", response.status);

    //     const errorMessage =
    //       (Array.isArray(data.detail)
    //         ? data.detail
    //             .map((e: any) => e.msg || e.message || JSON.stringify(e))
    //             .join(", ")
    //         : typeof data.detail === "string"
    //         ? data.detail
    //         : data.detail
    //         ? JSON.stringify(data.detail)
    //         : null) ||
    //       data.message ||
    //       data.error ||
    //       (typeof data === "string"
    //         ? data
    //         : `Validation failed: ${response.statusText}`);

    //     throw new Error(errorMessage);
    //   }

    //   return data;
    // } catch (error) {
    //   console.error("Validate QR Code Error:", error);
    //   if (error instanceof Error) {
    //     throw error;
    //   }
    //   throw new Error("Network error. Please check your connection.");
    // }
  },

  // Validate pass number without authentication (public endpoint)
  validatePassNumber: async (
    passNumber: string
  ): Promise<QRValidationResponse> => {
    try {
      const response = await fetch(
        `${VALIDATION_API_BASE_URL}/api/v1/pass-requests/validate-pass-number/${encodeURIComponent(
          passNumber
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
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

      console.log("Upload photo URL:", url);
      console.log("QR Data:", qrData);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          // Don't set Content-Type - let fetch set it with boundary for FormData
          Accept: "application/json",
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);
      console.log("Upload response ok:", response.ok);

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log("Upload response text:", text);
        throw new Error(`Server error: ${text || `Status ${response.status}`}`);
      }

      if (!response.ok) {
        console.log("Upload error data:", data);
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
};
