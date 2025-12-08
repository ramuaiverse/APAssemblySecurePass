import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { tokenManager } from "@/services/tokenManager";
import { api } from "@/services/api";
import { Alert } from "react-native";
import FlashIcon from "../../assets/flash.svg";
import LogOutIcon from "../../assets/logOut.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import AssemblyIcon from "../../assets/assembly.svg";
import { SafeAreaView } from "react-native-safe-area-context";

type QRScanScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "QRScan"
>;

type Props = {
  navigation: QRScanScreenNavigationProp;
  route: RouteProp<RootStackParamList, "QRScan">;
};

const { width } = Dimensions.get("window");
const SCAN_AREA_SIZE = width * 0.7;

export default function QRScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }

    // Cleanup: reset processing ref when component unmounts
    return () => {
      isProcessingRef.current = false;
    };
  }, [permission]);

  const handleBack = () => {
    navigation.replace("Login");
  };

  const handleLogout = async () => {
    await tokenManager.logout();
    navigation.replace("Login");
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Prevent scanning if already processing, scanned, validating, or if it's the same code
    // Use ref for immediate synchronous check to prevent race conditions
    if (
      isProcessingRef.current ||
      scanned ||
      validating ||
      lastScannedCode === data
    ) {
      return;
    }

    // Set ref immediately to prevent duplicate calls (synchronous)
    isProcessingRef.current = true;
    setScanned(true);
    setValidating(true);
    setLastScannedCode(data);

    try {
      // Extract qr_code_id from scanned data
      // The API accepts:
      // - Direct qr_code_id string
      // - JSON string with qr_code_id or pass_id field
      let qrCodeId: string;

      try {
        // Try to parse as JSON first
        const qrData = JSON.parse(data);
        // Check for qr_code_id or pass_id field
        qrCodeId =
          qrData.qr_code_id || qrData.passId || qrData.qrCodeId || data;
      } catch {
        // If not JSON, use the data directly as qr_code_id
        qrCodeId = data;
      }

      console.log("Validating QR code:", qrCodeId);

      // Call the validate API
      const validationResponse = await api.validateQRCode(qrCodeId);

      // Log full validation response
      console.log(
        "QR Validation API Response:",
        JSON.stringify(validationResponse, null, 2)
      );
      console.log(
        "Validation Status:",
        validationResponse.valid ? "VALID" : "INVALID"
      );
      console.log("Scan Status:", validationResponse.status);
      console.log("Message:", validationResponse.message);
      console.log("Scan ID:", validationResponse.scan_id);

      // Check if valid
      if (validationResponse.valid && validationResponse.pass_data) {
        // Valid pass - navigate to ValidPass screen
        const passData = validationResponse.pass_data;

        // Log pass data details
        console.log("Pass Data:", JSON.stringify(passData, null, 2));
        console.log("Visitor Name:", passData.full_name);
        console.log("Phone:", passData.phone);
        console.log("Email:", passData.email);
        console.log("Organization:", passData.organization);
        console.log("Purpose:", passData.purpose_of_visit);
        console.log("Valid From:", passData.valid_from);
        console.log("Valid Until:", passData.valid_until);
        console.log("Pass Status:", passData.status);
        console.log("Number of Visitors:", passData.number_of_visitors);
        console.log("Created By:", passData.created_by);

        console.log("✅ Valid pass - Navigating to ValidPass screen");

        // Reset ref before navigation
        isProcessingRef.current = false;
        navigation.replace("ValidPass", {
          validationResponse: validationResponse,
        });
      } else {
        // Invalid pass - navigate to InvalidPass screen
        console.log("❌ Invalid pass - Reason:", validationResponse.message);
        console.log("Scan Status:", validationResponse.status);
        // Reset ref before navigation
        isProcessingRef.current = false;
        navigation.replace("InvalidPass");
      }
    } catch (error) {
      // console.error("Error validating QR code:", error);

      // Show error alert
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to validate QR code. Please try again.";

      // If authentication error, logout
      if (
        errorMessage.includes("Authentication") ||
        errorMessage.includes("login")
      ) {
        Alert.alert("Session Expired", errorMessage, [
          {
            text: "OK",
            onPress: async () => {
              isProcessingRef.current = false;
              await tokenManager.logout();
              navigation.replace("Login");
            },
          },
        ]);
        // Keep scanned as true since we're navigating away
        return;
      } else if (
        errorMessage.includes("Failed to validate QR code") ||
        errorMessage === "Failed to validate QR code"
      ) {
        // Handle 500 error or validation failure - navigate to InvalidPass screen
        console.log(
          "❌ QR code validation failed - Navigating to InvalidPass screen"
        );
        // Reset ref before navigation
        isProcessingRef.current = false;
        navigation.replace("InvalidPass");
        return;
      } else {
        // For other errors, show alert and reset state only when user dismisses it
        Alert.alert("Validation Error", errorMessage, [
          {
            text: "OK",
            onPress: () => {
              // Reset scanning state and clear last scanned code to allow scanning again
              isProcessingRef.current = false;
              setScanned(false);
              setValidating(false);
              setLastScannedCode(null);
            },
          },
        ]);
        // Keep scanned as true until alert is dismissed
        // Don't reset validating here - it will be reset when user dismisses alert
        return;
      }
    } finally {
      // Reset ref if we're not navigating (for cases where navigation doesn't happen)
      // Navigation cases reset the ref before navigating
      // Alert cases reset the ref in the alert callback
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <BackButtonIcon width={20} height={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <AssemblyIcon width={120} height={140} />
      </View>

      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        enableTorch={flashlightOn}
      >
        <View style={styles.overlay}>
          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Loading Indicator Overlay */}
          {validating && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#457E51" />
                <Text style={styles.loadingText}>Validating QR Code...</Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <View style={styles.scanningDot} />
              <Text style={styles.scanningText}>
                {validating ? "Validating..." : "Scanning..."}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.flashlightButton}
              onPress={() => setFlashlightOn(!flashlightOn)}
            >
              <FlashIcon width={12} height={12} />
              <Text style={styles.flashlightText}>Flashlight</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F7E8",
  },
  message: {
    color: "#111827",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  permissionButton: {
    backgroundColor: "#457E51",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: "center",
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  headerButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "bold",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "space-between",
  },
  instructionsContainer: {
    padding: 20,
    alignItems: "center",
  },
  instructions: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  scanFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    alignSelf: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
    top: 100,
    left: 0,
  },
  topRight: {
    top: 100,
    right: 0,
    left: "auto",
    borderRightWidth: 4,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: 350,
    borderBottomWidth: 4,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 350,
    left: "auto",
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  footer: {
    backgroundColor: "#E3F7E8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    gap: 4,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
  },
  scanningText: {
    color: "#00AF58",
    fontSize: 10,
  },
  flashlightButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    gap: 4,
  },
  flashlightText: {
    color: "#0F1721",
    fontSize: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});
