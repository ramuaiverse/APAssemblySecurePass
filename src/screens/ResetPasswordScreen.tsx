import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { api } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import Assembly from "../../assets/assembly.svg";
import DigitalPass from "../../assets/digitalPass.svg";
import QuestionMarkIcon from "../../assets/questionMark.svg";
import BackButtonIcon from "../../assets/backButton.svg";

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ResetPassword"
>;

type ResetPasswordScreenRouteProp = RouteProp<
  RootStackParamList,
  "ResetPassword"
>;

type Props = {
  navigation: ResetPasswordScreenNavigationProp;
  route: ResetPasswordScreenRouteProp;
};

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const username = route.params?.username || "";
  const mobileMasked = route.params?.mobileMasked || "****2020";
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isLandscape = dimensions.width > dimensions.height;

  const handleVerifyOTP = async () => {
    // Clear previous errors
    setOtpError("");

    // Validate fields
    if (!otpCode.trim()) {
      setOtpError("OTP code is required");
      return;
    }

    if (otpCode.trim().length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      await api.verifyOTP(username, otpCode.trim());

      // Show success message and logout
      Alert.alert(
        "Success",
        "Password has been reset successfully. Please login again.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to login method selection (logout)
              navigation.replace("LoginMethodSelection");
            },
          },
        ],
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to verify OTP. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleOTPChange = (text: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtpCode(numericText);
    if (otpError) {
      setOtpError("");
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
        >
          {/* Header with Logos */}
          <View style={[styles.header, isLandscape && styles.headerLandscape]}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.headerBackButton}
            >
              <BackButtonIcon width={20} height={20} />
            </TouchableOpacity>
            <View
              style={[
                styles.logoContainer,
                isLandscape && styles.logoContainerLandscape,
              ]}
            >
              <DigitalPass
                width={isLandscape ? 80 : 110}
                height={isLandscape ? 110 : 150}
              />
              <Assembly
                width={isLandscape ? 80 : 110}
                height={isLandscape ? 110 : 150}
              />
            </View>
          </View>

          {/* Modal Card */}
          <View
            style={[styles.modalCard, isLandscape && styles.modalCardLandscape]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
            </View>

            {/* Content */}
            <Text style={styles.instructionText}>
              OTP has been sent to {mobileMasked}. Please enter the OTP below.
            </Text>

            {/* OTP Field */}
            <Text style={styles.inputLabel}>OTP Code</Text>
            <View
              style={[
                styles.inputContainer,
                otpError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#ADAEBC"
                value={otpCode}
                onChangeText={handleOTPChange}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
              />
            </View>
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.verifyOTPButton,
                  otpCode.trim().length === 6 && styles.verifyOTPButtonActive,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOTP}
                disabled={loading || otpCode.trim().length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyOTPButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerTextContainer}>
              <QuestionMarkIcon width={14} height={14} />
              <Text style={styles.footerText}>Authorized Personnel Only</Text>
            </View>
            <Text style={styles.footerSubtext}>
              This system is for official use only. All activities are monitored
              and logged.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F7E8",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    position: "relative",
    marginBottom: 10,
  },
  headerLandscape: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  headerBackButton: {
    position: "absolute",
    top: 0,
    left: 0,
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  logoContainer: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 60,
    marginTop: 20,
  },
  logoContainerLandscape: {
    paddingVertical: 5,
    gap: 30,
    marginTop: 10,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 20,
  },
  modalCardLandscape: {
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
    paddingVertical: 20,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  instructionText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 10,
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: "#FFFFFF",
    minHeight: 50,
  },
  inputContainerError: {
    borderColor: "#EF4444",
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#111827",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  verifyOTPButton: {
    flex: 1,
    backgroundColor: "#9CA3AF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  verifyOTPButtonActive: {
    backgroundColor: "#457E51",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyOTPButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 50,
  },
  backButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  footerText: {
    color: "#8B8B8B",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  footerSubtext: {
    color: "#8B8B8B",
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
  },
});
