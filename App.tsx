import React, { useEffect, useState, useRef } from "react";
import { NavigationContainerRef } from "@react-navigation/native";
import { setUpNavigation } from "./src/navigation";
import CustomSplashScreen from "@/Components/CustomSplashScreen";
import { RootStackParamList } from "@/types";
import { View, StyleSheet } from "react-native";

const App = () => {
  const [ready, setReady] = useState(false);
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    async function loadApp() {
      // Show splash screen for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setReady(true);
    }

    loadApp();
  }, []);

  if (!ready) {
    return (
      <View style={styles.container}>
        <CustomSplashScreen />
      </View>
    );
  }

  return <View style={styles.container}>{setUpNavigation(navigationRef)}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default App;
