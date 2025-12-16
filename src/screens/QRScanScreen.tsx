import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

const { width, height } = Dimensions.get("window");
const SCAN_AREA_SIZE = width * 0.7;

type TabType = "scan" | "uniqueId";

export default function QRScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const [activeTab, setActiveTab] = useState<TabType>("scan");
  const [uniqueId, setUniqueId] = useState<string[]>(["", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const inputRefs = useRef<(TextInput | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [overlayDimensions, setOverlayDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [footerHeight, setFooterHeight] = useState<number>(0);

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

  const handleUniqueIdValidation = async () => {
    const idString = uniqueId.join("");
    if (idString.length !== 5) {
      setErrorMessage("Please enter a 5-digit ID");
      return;
    }

    // Clear error message if ID is complete
    setErrorMessage("");

    if (isProcessingRef.current || validating) {
      return;
    }

    isProcessingRef.current = true;
    setValidating(true);

    try {
      console.log("Validating Unique ID:", idString);

      // Call the validate API with the 5-digit ID (no authentication required)
      const validationResponse = await api.validatePassNumber(idString);

      console.log(
        "Unique ID Validation API Response:",
        JSON.stringify(validationResponse, null, 2)
      );

      // Navigate based on valid field from API response
      if (validationResponse.valid === true) {
        console.log("✅ Valid pass - Navigating to ValidPass screen");
        isProcessingRef.current = false;
        navigation.replace("ValidPass", {
          validationResponse: validationResponse,
        });
      } else {
        console.log("❌ Invalid pass - Reason:", validationResponse.message);
        isProcessingRef.current = false;
        navigation.replace("InvalidPass", {
          validationResponse: validationResponse,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to validate ID. Please try again.";

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
        return;
      } else if (
        errorMessage.includes("Failed to validate") ||
        errorMessage === "Failed to validate ID. Please try again."
      ) {
        console.log(
          "❌ ID validation failed - Navigating to InvalidPass screen"
        );
        isProcessingRef.current = false;
        navigation.replace("InvalidPass", {});
        return;
      } else {
        navigation.replace("InvalidPass", {});
        // Alert.alert("Validation Error", errorMessage, [
        //   {
        //     text: "OK",
        //     onPress: () => {
        //       isProcessingRef.current = false;
        //       setValidating(false);
        //     },
        //   },
        // ]);
        return;
      }
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (validating) return;

    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage("");
    }

    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length > 1) {
      // If multiple digits pasted, take only the first one
      const newId = [...uniqueId];
      newId[index] = numericValue[0];
      setUniqueId(newId);

      // Move to next input if available
      if (index < 4 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }

    const newId = [...uniqueId];
    newId[index] = numericValue;
    setUniqueId(newId);

    // Auto-focus next input when a digit is entered
    if (numericValue && index < 4 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleInputKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !uniqueId[index] && index > 0) {
      // If current input is empty and backspace is pressed, focus previous input
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (validating) return;
    setActiveTab(tab);
    setUniqueId(["", "", "", "", ""]);
    setErrorMessage("");
    setScanned(false);
    setLastScannedCode(null);
    isProcessingRef.current = false;
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Validate scanned data first
    if (!data || data === null || data === undefined) {
      console.error("Scanned data is null or undefined");
      return;
    }

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
      // Log the raw scanned data first
      console.log("Raw Scanned QR Data:", data);
      console.log("Scanned Data Type:", typeof data);
      console.log("Scanned Data Length:", data?.length);

      // Extract qr_data from scanned data
      // The API expects qr_data field, so we'll try to extract it or use the data directly
      let qrData: string;

      // First, ensure we have valid data
      if (!data || data.trim() === "") {
        console.error("Empty QR code data");
        Alert.alert("Error", "Invalid QR code. Please scan again.");
        isProcessingRef.current = false;
        setScanned(false);
        setValidating(false);
        setLastScannedCode(null);
        return;
      }

      // Extract UUID from URL if it's a URL format
      // Format: http://localhost:3000/validate/{uuid} or similar
      let extractedId = data;

      // Check if it's a URL containing /validate/
      if (data.includes("/validate/")) {
        const match = data.match(/\/validate\/([^\/\s]+)/);
        if (match && match[1]) {
          extractedId = match[1];
          console.log("Extracted UUID from URL:", extractedId);
        }
      }

      // If it's a full URL but doesn't match the pattern, try to extract the last part
      if (extractedId === data && data.includes("http")) {
        const parts = data.split("/");
        const lastPart = parts[parts.length - 1];
        // Check if last part looks like a UUID (contains hyphens and is reasonably long)
        if (lastPart.includes("-") && lastPart.length > 20) {
          extractedId = lastPart;
          console.log("Extracted UUID from URL path:", extractedId);
        }
      }

      qrData = extractedId;

      // Ensure we have a valid QR data value
      if (!qrData || qrData.trim() === "") {
        console.error("Invalid QR code data:", data);
        Alert.alert("Error", "Invalid QR code. Please scan again.");
        isProcessingRef.current = false;
        setScanned(false);
        setValidating(false);
        setLastScannedCode(null);
        return;
      }

      console.log("Original scanned data:", data);
      console.log("Final QR Data to send:", qrData);
      console.log("QR Data Type:", typeof qrData);
      console.log("QR Data Length:", qrData.length);
      console.log("QR Data Value:", JSON.stringify(qrData));

      // Call the validate API (no authentication required)
      const validationResponse = await api.validateQRCodePublic(qrData);

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

      // Navigate based on valid field from API response
      if (validationResponse.valid === true) {
        // Valid pass - navigate to ValidPass screen
        const visitor = validationResponse.visitor;
        const pass = validationResponse.pass;

        // Log visitor and pass details if available
        if (visitor) {
          console.log("Visitor:", JSON.stringify(visitor, null, 2));
          console.log("Visitor Name:", visitor.name);
          console.log("Phone:", visitor.phone);
          console.log("Email:", visitor.email);
        }
        if (pass) {
          console.log("Pass:", JSON.stringify(pass, null, 2));
          console.log("Pass Number:", pass.pass_number);
          console.log("Session:", pass.session);
          console.log("Category:", pass.category);
          console.log("Purpose:", pass.purpose);
          console.log(
            "Valid From:",
            pass.valid_from_formatted || pass.valid_from
          );
          console.log("Valid To:", pass.valid_to_formatted || pass.valid_to);
          console.log("Requested By:", pass.requested_by);
        }

        console.log("✅ Valid pass - Navigating to ValidPass screen");

        // Reset ref before navigation
        isProcessingRef.current = false;
        navigation.replace("ValidPass", {
          validationResponse: validationResponse,
        });
      } else {
        // Invalid pass - navigate to InvalidPass screen
        console.log("❌ Invalid pass - Status:", validationResponse.status);
        console.log("Suspended:", validationResponse.suspended);
        console.log("Expired:", validationResponse.expired);
        console.log("Not Yet Valid:", validationResponse.not_yet_valid);
        if (validationResponse.message) {
          console.log("Message:", validationResponse.message);
        }
        // Reset ref before navigation
        isProcessingRef.current = false;
        navigation.replace("InvalidPass", {
          validationResponse: validationResponse,
        });
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
        navigation.replace("InvalidPass", {});
        return;
      } else {
        // For other errors, show alert and reset state only when user dismisses it
        // Alert.alert("Validation Error", errorMessage, [
        //   {
        //     text: "OK",
        //     onPress: () => {
        //       // Reset scanning state and clear last scanned code to allow scanning again
        //       isProcessingRef.current = false;
        //       setScanned(false);
        //       setValidating(false);
        //       setLastScannedCode(null);
        //     },
        //   },
        // ]);
        navigation.replace("InvalidPass", {});
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
        <Text style={styles.headerTitle}>
          {activeTab === "scan" ? "Scan QR Code" : "Scan or Unique ID"}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      {/* Assembly Icon */}
      <View style={styles.instructionsContainer}>
        <AssemblyIcon width={120} height={140} />
      </View>

      {/* Tab Selection - Always visible */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "scan" ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => handleTabChange("scan")}
            disabled={validating}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "scan"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              Scan QR Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "uniqueId" ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => handleTabChange("uniqueId")}
            disabled={validating}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "uniqueId"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              Unique ID
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "scan" ? (
        <>
          {/* Camera View Container */}
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              enableTorch={flashlightOn}
            />
            {/* Overlay - Positioned absolutely on top of camera */}
            <View
              style={styles.overlay}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setOverlayDimensions({ width, height });
              }}
            >
              {/* Scanning Frame */}
              <View
                style={[
                  styles.scanFrame,
                  overlayDimensions && {
                    left: (overlayDimensions.width - SCAN_AREA_SIZE) / 2,
                    top:
                      (overlayDimensions.height -
                        footerHeight -
                        SCAN_AREA_SIZE) /
                      2,
                  },
                ]}
              >
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
                    <Text style={styles.loadingText}>
                      Validating QR Code...
                    </Text>
                  </View>
                </View>
              )}

              {/* Footer - Positioned absolutely at bottom */}
              <View
                style={styles.footer}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setFooterHeight(height);
                }}
              >
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
          </View>
        </>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Unique ID Input Section */}
            <View style={styles.contentCard}>
              <View style={styles.uniqueIdContainer}>
                <Text style={styles.uniqueIdLabel}>Enter 5-digit ID</Text>
                <View style={styles.inputBoxContainer}>
                  {uniqueId.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.inputBox,
                        digit !== "" && styles.inputBoxFilled,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleInputChange(index, value)}
                      onKeyPress={({ nativeEvent }) =>
                        handleInputKeyPress(index, nativeEvent.key)
                      }
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!validating}
                      textAlign="center"
                    />
                  ))}
                </View>
                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleUniqueIdValidation}
                  disabled={validating}
                >
                  {validating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Loading Indicator Overlay */}
              {validating && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#457E51" />
                    <Text style={styles.loadingText}>Validating ID...</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionsContainer: {
    padding: 20,
    alignItems: "center",
  },
  tabWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
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
    position: "absolute",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: "auto",
    borderRightWidth: 4,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: "auto",
    left: 0,
    borderBottomWidth: 4,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: "auto",
    left: "auto",
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  contentCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  tabActive: {
    backgroundColor: "#457E51",
  },
  tabInactive: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#111827",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabTextInactive: {
    color: "#111827",
  },
  uniqueIdContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  uniqueIdLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
  },
  inputBoxContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 24,
  },
  inputBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    // backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },
  inputBoxFilled: {
    backgroundColor: "#FFFFFF",
    borderColor: "#457E51",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  verifyButton: {
    backgroundColor: "#457E51",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
