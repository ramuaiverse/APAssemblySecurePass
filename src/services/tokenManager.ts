import { AppState, AppStateStatus } from "react-native";
import { tokenStorage, StoredTokens } from "./tokenStorage";
import { api } from "./api";

// Activity timeout: if user is inactive for this duration, logout on expiry
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

class TokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private expiryTimer: NodeJS.Timeout | null = null;
  private activityCheckInterval: NodeJS.Timeout | null = null;
  private onLogoutCallback: (() => void) | null = null;
  private isActive = true;

  private appStateSubscription: any = null;

  constructor() {
    // Track app state changes
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange
    );

    // Track user activity (touch/interaction)
    this.startActivityTracking();
  }

  // Set callback for logout
  setLogoutCallback(callback: () => void) {
    this.onLogoutCallback = callback;
  }

  // Handle app state changes (foreground/background)
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      console.log("App became active, checking token status...");
      this.isActive = true;
      this.checkAndRefreshToken();
    } else {
      console.log("App went to background");
      this.isActive = false;
    }
  };

  // Start tracking user activity
  private startActivityTracking() {
    // Update activity on any touch/interaction
    // This is a simple implementation - you might want to use a more sophisticated approach
    this.activityCheckInterval = setInterval(async () => {
      if (this.isActive) {
        await tokenStorage.updateLastActivity();
      }
    }, 60000); // Update every minute when active
  }

  // Initialize token management after login
  async initializeTokens(tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }) {
    console.log("Initializing token manager with tokens");

    // Save tokens
    await tokenStorage.saveTokens(tokens);

    // Set up token refresh and expiry monitoring
    this.scheduleTokenRefresh(tokens.expires_in);
    this.scheduleExpiryCheck(tokens.expires_in);
  }

  // Schedule token refresh before expiry
  private scheduleTokenRefresh(expiresIn: number) {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token 1 minute before expiry (or 30 seconds if token expires in less than 1 minute)
    const refreshBefore = Math.min(expiresIn - 60, expiresIn - 30);
    const refreshDelay = Math.max(refreshBefore * 1000, 1000); // Convert to milliseconds

    console.log(
      `Scheduling token refresh in ${
        refreshDelay / 1000
      } seconds (${refreshBefore} seconds before expiry)`
    );

    this.refreshTimer = setTimeout(async () => {
      await this.refreshTokenIfActive();
    }, refreshDelay);
  }

  // Schedule expiry check
  private scheduleExpiryCheck(expiresIn: number) {
    // Clear existing timer
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
    }

    const checkDelay = expiresIn * 1000; // Convert to milliseconds

    console.log(`Scheduling expiry check in ${checkDelay / 1000} seconds`);

    this.expiryTimer = setTimeout(async () => {
      await this.handleTokenExpiry();
    }, checkDelay);
  }

  // Refresh token if user is active
  private async refreshTokenIfActive() {
    try {
      const lastActivity = await tokenStorage.getLastActivity();
      const now = Date.now();

      if (!lastActivity) {
        console.log("No activity recorded, logging out");
        await this.logout();
        return;
      }

      const inactiveTime = now - lastActivity;
      const isUserActive = inactiveTime < INACTIVITY_TIMEOUT;

      console.log("Token refresh check:", {
        inactiveTime: `${Math.round(inactiveTime / 1000)}s`,
        isUserActive,
        appState: this.isActive ? "active" : "background",
      });

      if (isUserActive && this.isActive) {
        // User is active, refresh token
        console.log("User is active, refreshing token...");
        await this.refreshToken();
      } else {
        // User is inactive, logout
        console.log("User is inactive, logging out...");
        await this.logout();
      }
    } catch (error) {
      console.error("Error in refreshTokenIfActive:", error);
      await this.logout();
    }
  }

  // Handle token expiry
  private async handleTokenExpiry() {
    try {
      const isExpired = await tokenStorage.isTokenExpired();

      if (isExpired) {
        console.log("Token has expired");
        const lastActivity = await tokenStorage.getLastActivity();
        const now = Date.now();

        if (!lastActivity) {
          console.log("No activity recorded, logging out");
          await this.logout();
          return;
        }

        const inactiveTime = now - lastActivity;
        const isUserActive = inactiveTime < INACTIVITY_TIMEOUT;

        if (isUserActive && this.isActive) {
          // Try to refresh even if expired (might still work)
          console.log("User is active, attempting token refresh...");
          await this.refreshToken();
        } else {
          console.log("User is inactive, logging out...");
          await this.logout();
        }
      }
    } catch (error) {
      console.error("Error in handleTokenExpiry:", error);
      await this.logout();
    }
  }

  // Refresh the access token
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!refreshToken) {
        console.log("No refresh token available");
        await this.logout();
        return false;
      }

      console.log("Refreshing access token...");
      const response = await api.refreshToken(refreshToken);

      if (response.access_token && response.refresh_token) {
        console.log("Token refreshed successfully");

        // Save new tokens
        await tokenStorage.saveTokens({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          expires_in: response.expires_in,
        });

        // Reschedule refresh and expiry
        this.scheduleTokenRefresh(response.expires_in);
        this.scheduleExpiryCheck(response.expires_in);

        return true;
      } else {
        console.log("Invalid refresh response");
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      await this.logout();
      return false;
    }
  }

  // Check and refresh token if needed
  async checkAndRefreshToken(): Promise<boolean> {
    try {
      const isExpired = await tokenStorage.isTokenExpired();

      if (isExpired) {
        console.log("Token is expired, attempting refresh...");
        return await this.refreshToken();
      } else {
        // Token is still valid, but check if we should refresh soon
        const tokens = await tokenStorage.getTokens();
        if (tokens) {
          const timeUntilExpiry = tokens.expires_at - Date.now();
          const refreshThreshold = 60 * 1000; // 1 minute

          if (timeUntilExpiry < refreshThreshold) {
            console.log("Token expires soon, refreshing...");
            return await this.refreshToken();
          }
        }
        return true;
      }
    } catch (error) {
      console.error("Error in checkAndRefreshToken:", error);
      return false;
    }
  }

  // Logout user
  async logout() {
    console.log("Logging out user...");

    // Clear timers
    this.clearTimers();

    // Clear tokens
    await tokenStorage.clearTokens();

    // Call logout callback
    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
  }

  // Clear all timers
  private clearTimers() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
  }

  // Cleanup
  destroy() {
    this.clearTimers();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
