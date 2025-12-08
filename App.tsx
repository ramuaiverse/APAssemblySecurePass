import React, { useEffect, useState, useRef } from "react";
import { NavigationContainerRef } from "@react-navigation/native";
import { setUpNavigation } from "./src/navigation";
import CustomSplashScreen from "@/Components/CustomSplashScreen";
import { tokenManager } from "@/services/tokenManager";
import { tokenStorage } from "@/services/tokenStorage";
import { RootStackParamList } from "@/types";

const App = () => {
  const [ready, setReady] = useState(false);
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    async function loadApp() {
      try {
        // Check if user has existing tokens
        const tokens = await tokenStorage.getTokens();

        if (tokens) {
          console.log("Found existing tokens, checking validity...");
          const isExpired = await tokenStorage.isTokenExpired();

          if (!isExpired) {
            // Token is still valid, check if we need to refresh
            await tokenManager.checkAndRefreshToken();

            // Initialize token manager with existing tokens
            const timeUntilExpiry = tokens.expires_at - Date.now();
            const expiresIn = Math.floor(timeUntilExpiry / 1000);

            if (expiresIn > 0) {
              await tokenManager.initializeTokens({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_in: expiresIn,
              });
            }
          } else {
            // Token expired, try to refresh
            console.log("Token expired, attempting refresh...");
            const refreshed = await tokenManager.refreshToken();
            if (!refreshed) {
              // Refresh failed, clear tokens
              await tokenStorage.clearTokens();
            }
          }
        }

        // Set up logout callback
        tokenManager.setLogoutCallback(() => {
          if (navigationRef.current) {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setReady(true);
      }
    }

    loadApp();

    // Cleanup on unmount
    return () => {
      tokenManager.destroy();
    };
  }, []);

  if (!ready) {
    return <CustomSplashScreen />;
  }

  return <>{setUpNavigation(navigationRef)}</>;
};

export default App;
