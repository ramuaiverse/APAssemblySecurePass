import React, { useState } from "react";
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
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types";
import { api } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import Assembly from "../../assets/assembly.svg";
import DigitalPass from "../../assets/digitalPass.svg";
import QuestionMarkIcon from "../../assets/questionMark.svg";
import LoginIcon from "../../assets/login.svg";
import BackButtonIcon from "../../assets/backButton.svg";

type UsernameOTPLoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UsernameOTPLogin"
>;

type Props = {
  navigation: UsernameOTPLoginScreenNavigationProp;
};

export default function UsernameOTPLoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [activeTab, setActiveTab] = useState<"admin" | "security">("admin");

  const handleSendOTP = async () => {
    // Clear previous errors
    setUsernameError("");

    // Validate username
    if (!username.trim()) {
      setUsernameError("Username is required");
      return;
    }

    // Basic username validation (alphanumeric and underscore, 3-30 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username.trim())) {
      setUsernameError(
        "Please enter a valid username (3-30 characters, alphanumeric and underscore only)",
      );
      return;
    }

    setSendingOtp(true);
    try {
      await api.generateOTP(username.trim());

      // Clear OTP input if it was previously entered
      setOtp("");
      setOtpError("");
      setOtpSent(true);
      Alert.alert(
        "OTP Sent",
        "Please check your registered email/phone for the OTP code.",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send OTP. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLogin = async () => {
    // Clear previous errors
    setOtpError("");

    // Validate OTP
    if (!otp.trim()) {
      setOtpError("OTP is required");
      return;
    }

    if (otp.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      const response = await api.verifyOTP(username.trim(), otp.trim());

      // Check if user is active and login is successful
      if (response.id && response.is_active) {
        // Navigate based on selected login mode (same as LoginScreen)
        if (activeTab === "admin") {
          navigation.replace("IssueVisitorPass", {
            userFullName: response.full_name,
            userId: response.id,
          });
        } else {
          navigation.replace("PreCheck");
        }
      } else {
        // If user is not active or no ID, show an error
        Alert.alert(
          "Login Failed",
          response.is_active === false
            ? "Your account is inactive. Please contact administrator."
            : "Authentication failed. Please try again.",
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during login.";

      // Check if this is an invalid OTP error
      const isInvalidOTP = (error as any)?.isInvalidOTP || false;
      const errorLower = errorMessage.toLowerCase();
      const isOTPError =
        isInvalidOTP ||
        errorLower.includes("invalid") ||
        errorLower.includes("incorrect") ||
        errorLower.includes("wrong") ||
        errorLower.includes("otp") ||
        errorLower.includes("expired");

      if (isOTPError) {
        setOtpError("Invalid OTP. Please try again.");
      } else {
        Alert.alert("Login Failed", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    // Allow alphanumeric and underscore only
    const cleaned = text.replace(/[^a-zA-Z0-9_]/g, "");
    setUsername(cleaned);
    // Clear error when user starts typing
    if (usernameError) {
      setUsernameError("");
    }
    // If OTP was already sent and user changes username, reset OTP state
    if (otpSent) {
      setOtpSent(false);
      setOtp("");
      setOtpError("");
    }
  };

  const handleOtpChange = (text: string) => {
    // Only allow numeric input and limit to 6 digits
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(cleaned);
    // Clear error when user starts typing
    if (otpError) {
      setOtpError("");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Back Button - Fixed Position */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <BackButtonIcon width={20} height={20} />
      </TouchableOpacity>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.contentWrapper}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <DigitalPass width={110} height={150} />
              <Assembly width={110} height={150} />
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.loginCard}>
            {/* Tab Selection */}
            <View style={styles.tabWrapper}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "admin"
                      ? styles.tabActive
                      : styles.tabInactive,
                  ]}
                  onPress={() => setActiveTab("admin")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "admin"
                        ? styles.tabTextActive
                        : styles.tabTextInactive,
                    ]}
                  >
                    Admin Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "security"
                      ? styles.tabActive
                      : styles.tabInactive,
                  ]}
                  onPress={() => setActiveTab("security")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "security"
                        ? styles.tabTextActive
                        : styles.tabTextInactive,
                    ]}
                  >
                    Security Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.cardTitle}>
              {activeTab === "admin" ? "Admin Login" : "Security Login"}
            </Text>
            <Text style={styles.cardSubtitle}>
              Enter your username to receive an OTP code.
            </Text>

            {/* Username Field */}
            <Text style={styles.inputLabel}>Username</Text>
            <View
              style={[
                styles.inputContainer,
                usernameError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#ADAEBC"
                value={username}
                onChangeText={handleUsernameChange}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}

            {/* Send OTP Button */}
            {!otpSent && (
              <TouchableOpacity
                style={[
                  styles.sendOtpButton,
                  sendingOtp && styles.sendOtpButtonDisabled,
                ]}
                onPress={handleSendOTP}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendOtpButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            )}

            {/* OTP Field */}
            {otpSent && (
              <>
                <Text style={styles.inputLabel}>Enter OTP</Text>
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
                    value={otp}
                    onChangeText={handleOtpChange}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                {otpError ? (
                  <Text style={styles.errorText}>{otpError}</Text>
                ) : null}

                {/* Resend OTP */}
                <TouchableOpacity
                  style={styles.resendOtpButton}
                  onPress={handleSendOTP}
                  disabled={sendingOtp}
                >
                  <Text style={styles.resendOtpText}>
                    {sendingOtp ? "Sending..." : "Resend OTP"}
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Login</Text>
                      <LoginIcon width={16} height={14} />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      
      {/* Footer - Fixed at Bottom */}
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
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 0,
  },
  header: {
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    minWidth: 36,
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 10,
  },
  logoContainer: {
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 60,
    marginTop: 0,
  },
  loginCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    paddingVertical: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 18,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 25,
    textAlign: "center",
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
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: "#f9f9f9",
  },
  inputContainerError: {
    borderColor: "#EF4444",
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  sendOtpButton: {
    backgroundColor: "#457E51",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  sendOtpButtonDisabled: {
    opacity: 0.6,
  },
  sendOtpButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  resendOtpButton: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  resendOtpText: {
    color: "#1E40AF",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#457E51",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginRight: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: "#E3F7E8",
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
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 10,
  },
  tabWrapper: {
    marginBottom: 20,
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
});
