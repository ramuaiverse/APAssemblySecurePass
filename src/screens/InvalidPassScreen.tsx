import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { handleLogout } from "@/utils/logout";
import LogOutIcon from "../../assets/logOut.svg";
import BackButtonIcon from "../../assets/backButton.svg";

type InvalidPassScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "InvalidPass"
>;

type InvalidPassScreenRouteProp = RouteProp<RootStackParamList, "InvalidPass">;

type Props = {
  navigation: InvalidPassScreenNavigationProp;
  route: InvalidPassScreenRouteProp;
};

export default function InvalidPassScreen({ navigation, route }: Props) {
  // Get validation response from route params if available
  const validationResponse = route.params?.validationResponse;
  const errorMessage =
    validationResponse?.message ||
    (validationResponse?.suspended
      ? "Pass is suspended."
      : validationResponse?.expired
        ? "Pass has expired."
        : validationResponse?.not_yet_valid
          ? "Pass is not yet valid."
          : "Pass details not matching. Do not allow entry.");
  const status = validationResponse?.status || "rejected";
  const suspended = validationResponse?.suspended ?? false;
  const expired = validationResponse?.expired ?? false;
  const notYetValid = validationResponse?.not_yet_valid ?? false;

  const handleBack = () => {
    // Use goBack to return to previous screen in stack
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("PreCheck");
    }
  };

  const handleScanNext = () => {
    // Navigate to PreCheck screen for next scan
    navigation.navigate("PreCheck");
  };

  // Handle Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("PreCheck");
        }
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );


  return (
    <LinearGradient
      colors={["#f44336", "#e53935", "#d32f2f"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <BackButtonIcon width={20} height={20} />
        </TouchableOpacity>
        <View style={styles.headerButton} />
        <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.headerButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="close" size={60} color="#f44336" />
          </View>
        </View>

        {/* Status Text */}
        <Text style={styles.statusText}>Invalid Pass</Text>
        <Text style={styles.statusSubtext}>{errorMessage}</Text>
        {status && (
          <Text style={styles.statusBadge}>
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        )}

        {/* Scan Next Button */}
        <TouchableOpacity
          style={styles.scanNextButton}
          onPress={handleScanNext}
        >
          <Text style={styles.scanNextButtonText}>Scan Next</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: 50,
  },
  headerButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  statusSubtext: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
    opacity: 0.9,
  },
  statusBadge: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    marginBottom: 50,
    paddingHorizontal: 20,
    opacity: 0.8,
    fontWeight: "500",
  },
  scanNextButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  scanNextButtonText: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "500",
  },
});
