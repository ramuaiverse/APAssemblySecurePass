import React, { useEffect, useState, useRef } from "react";
import { NavigationContainerRef } from "@react-navigation/native";
import { setUpNavigation } from "./src/navigation";
import CustomSplashScreen from "@/Components/CustomSplashScreen";
import { RootStackParamList } from "@/types";
import { View, StyleSheet } from "react-native";
import { authStorage } from "@/utils/authStorage";

const App = () => {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>("LoginMethodSelection");
  const [initialParams, setInitialParams] = useState<any>(undefined);
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    async function loadApp() {
      // Check for stored auth data
      const authData = await authStorage.getAuthData();
      
      if (authData && authData.userId) {
        // User is logged in, determine which screen to navigate to
        if (authData.initialScreen === "PreCheck") {
          setInitialRoute("PreCheck");
        } else if (authData.initialScreen === "IssueVisitorPass") {
          setInitialRoute("IssueVisitorPass");
          setInitialParams({
            userFullName: authData.userFullName,
            userId: authData.userId,
          });
        } else {
          // Default to Home screen
          setInitialRoute("Home");
          setInitialParams({
            userFullName: authData.userFullName,
            userId: authData.userId,
            role: authData.role,
            designation: authData.designation,
            hod_approver: authData.hod_approver,
            sub_categories: authData.sub_categories || [],
          });
        }
      } else {
        // No auth data, go to login selection
        setInitialRoute("LoginMethodSelection");
      }
      
      // Show splash screen for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setReady(true);
    }

    loadApp();
  }, []);

  // Navigate to initial screen with params after navigation is ready
  useEffect(() => {
    if (ready && navigationRef.current && initialParams && initialRoute !== "LoginMethodSelection") {
      // Small delay to ensure navigation container is ready
      const timer = setTimeout(() => {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.reset({
            index: 0,
            routes: [
              {
                name: initialRoute,
                params: initialParams,
              },
            ],
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [ready, initialRoute, initialParams]);

  if (!ready) {
    return (
      <View style={styles.container}>
        <CustomSplashScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {setUpNavigation(navigationRef, initialRoute)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default App;
