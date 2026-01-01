import React from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import AssemblyLogo from "../../assets/assembly.svg";
import AssemblyDigitalPass from "../../assets/assemblyDigitalPass.svg";
import AssemblyIcon from "../../assets/assemblyIcon.svg";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const CustomSplashScreen: React.FC = () => {
  // Use regular View on web since SafeAreaView might not work properly
  const Container = Platform.OS === "web" ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      <View style={styles.topSection}>
        <AssemblyLogo width={width} height={height / 5} />
      </View>
      <View style={styles.middleSection}>
        <AssemblyDigitalPass width={width} height={height / 3} />
      </View>
      <View style={styles.bottomSection}>
        <AssemblyIcon width={width} height={height / 3} />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F7E8",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topSection: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 60,
  },
  middleSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

export default CustomSplashScreen;
