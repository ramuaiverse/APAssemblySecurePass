import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "@auth_access_token";
const REFRESH_TOKEN_KEY = "@auth_refresh_token";
const TOKEN_EXPIRY_KEY = "@auth_token_expiry";
const LAST_ACTIVITY_KEY = "@auth_last_activity";

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // timestamp in milliseconds
}

export const tokenStorage = {
  // Save tokens after login
  saveTokens: async (tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number; // in seconds
  }): Promise<void> => {
    try {
      const expiresAt = Date.now() + tokens.expires_in * 1000;
      
      await AsyncStorage.multiSet([
        [ACCESS_TOKEN_KEY, tokens.access_token],
        [REFRESH_TOKEN_KEY, tokens.refresh_token],
        [TOKEN_EXPIRY_KEY, expiresAt.toString()],
        [LAST_ACTIVITY_KEY, Date.now().toString()],
      ]);
      
      console.log("Tokens saved successfully");
      console.log("Token expires at:", new Date(expiresAt).toISOString());
    } catch (error) {
      console.error("Error saving tokens:", error);
      throw error;
    }
  },

  // Get stored tokens
  getTokens: async (): Promise<StoredTokens | null> => {
    try {
      const [accessToken, refreshToken, expiresAt] = await AsyncStorage.multiGet([
        ACCESS_TOKEN_KEY,
        REFRESH_TOKEN_KEY,
        TOKEN_EXPIRY_KEY,
      ]);

      if (!accessToken[1] || !refreshToken[1] || !expiresAt[1]) {
        return null;
      }

      return {
        access_token: accessToken[1],
        refresh_token: refreshToken[1],
        expires_at: parseInt(expiresAt[1], 10),
      };
    } catch (error) {
      console.error("Error getting tokens:", error);
      return null;
    }
  },

  // Get access token
  getAccessToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  },

  // Get refresh token
  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  },

  // Update last activity timestamp
  updateLastActivity: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error("Error updating last activity:", error);
    }
  },

  // Get last activity timestamp
  getLastActivity: async (): Promise<number | null> => {
    try {
      const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      return lastActivity ? parseInt(lastActivity, 10) : null;
    } catch (error) {
      console.error("Error getting last activity:", error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: async (): Promise<boolean> => {
    try {
      const tokens = await tokenStorage.getTokens();
      if (!tokens) return true;
      
      const now = Date.now();
      const isExpired = now >= tokens.expires_at;
      
      console.log("Token expiry check:", {
        now: new Date(now).toISOString(),
        expiresAt: new Date(tokens.expires_at).toISOString(),
        isExpired,
      });
      
      return isExpired;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  },

  // Clear all tokens (logout)
  clearTokens: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        ACCESS_TOKEN_KEY,
        REFRESH_TOKEN_KEY,
        TOKEN_EXPIRY_KEY,
        LAST_ACTIVITY_KEY,
      ]);
      console.log("Tokens cleared");
    } catch (error) {
      console.error("Error clearing tokens:", error);
      throw error;
    }
  },
};

