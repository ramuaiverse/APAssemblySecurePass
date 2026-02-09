import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_STORAGE_KEY = "@auth_data";

export interface AuthData {
  userFullName?: string;
  userId?: string;
  role?: string;
  designation?: string;
  hod_approver?: boolean;
  sub_categories?: Array<any>;
  loginType?: "login" | "security" | "admin"; // Track which login type was used
  initialScreen?: string; // Track which screen to navigate to (Home or PreCheck)
}

export const authStorage = {
  // Save auth data
  async saveAuthData(authData: AuthData): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  },

  // Get auth data
  async getAuthData(): Promise<AuthData | null> {
    try {
      const data = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error("Error getting auth data:", error);
      return null;
    }
  },

  // Clear auth data (on logout)
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  },
};
