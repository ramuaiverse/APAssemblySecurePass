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
import UserNameIcon from "../../assets/userName.svg";
import PasswordIcon from "../../assets/password.svg";
import QuestionMarkIcon from "../../assets/questionMark.svg";
import EyeIcon from "../../assets/eye.svg";
import LoginIcon from "../../assets/login.svg";
import BackButtonIcon from "../../assets/backButton.svg";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "security">("login");

  const handleLogin = async () => {
    // Clear previous errors
    setUsernameError("");
    setPasswordError("");
    setRoleError("");

    // Validate fields - password is now optional
    let hasError = false;
    if (!username.trim()) {
      setUsernameError("Username is required");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.login({
        username: username.trim(),
        password: password || "", // Password is optional
        // expected_role: activeTab === "login" ? "login" : "security",
      });

      // Check if this is first-time login
      if (response.is_first_time_login === true) {
        // Navigate to set password screen
        navigation.replace("SetPassword", {
          username: username.trim(),
        });
        setLoading(false);
        return;
      }

      // Check if user is active and login is successful
      if (response.id && response.is_active) {
        // Validate role based on selected tab
        const userRole = response.role?.toLowerCase() || "";

        // Check if user is trying to login with wrong role
        if (activeTab === "login" && userRole === "security") {
          setRoleError(
            "Access denied, this login is not for security personnel",
          );
          setLoading(false);
          return;
        }

        if ((activeTab === "login"||activeTab === "security") && userRole === "admin") {
          setRoleError(
            "Access denied, this login is not for admin personnel",
          );
          setLoading(false);
          return;
        }

        if (activeTab === "security" && userRole !== "security") {
          setRoleError(
            "Access denied, this login is for security personnel only",
          );
          setLoading(false);
          return;
        }

        // Navigate based on selected login mode
        // Login navigation - navigate to Home screen
        if (activeTab === "login") {
          navigation.replace("Home", {
            userFullName: response.full_name,
            userId: response.id,
            role: response.role,
          });
        } else {
          navigation.replace("PreCheck");
        }
        // Security login navigation - navigate to PreCheck screen first
        // navigation.replace("PreCheck");
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

      // Check if this is a credentials error (401 status)
      const isCredentialsError = (error as any)?.isCredentialsError || false;

      // Parse error message to extract field-specific errors
      const errorLower = errorMessage.toLowerCase();

      // Check for common authentication error patterns
      const isInvalidCredentials =
        isCredentialsError ||
        errorLower.includes("invalid") ||
        errorLower.includes("incorrect") ||
        errorLower.includes("wrong") ||
        errorLower.includes("authentication failed") ||
        errorLower.includes("unauthorized") ||
        errorLower.includes("credentials");

      // Handle "Incorrect username or password" or similar messages
      if (
        isInvalidCredentials &&
        (errorLower.includes("username") || errorLower.includes("password"))
      ) {
        // If error mentions both username and password, show error on both fields
        if (
          errorLower.includes("username") &&
          errorLower.includes("password")
        ) {
          setUsernameError("Username is invalid");
          setPasswordError("Password is invalid");
        } else if (errorLower.includes("username")) {
          // Only username mentioned
          setUsernameError("Username is invalid");
        } else if (errorLower.includes("password")) {
          // Only password mentioned
          setPasswordError("Password is invalid");
        }
      } else if (isInvalidCredentials) {
        // General invalid credentials error - show on both fields
        setUsernameError("Username is invalid");
        setPasswordError("Password is invalid");
      } else {
        // For other errors that don't match credentials pattern, show alert
        Alert.alert("Login Failed", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // Clear error when user starts typing
    if (usernameError) {
      setUsernameError("");
    }
    if (roleError) {
      setRoleError("");
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError("");
    }
    if (roleError) {
      setRoleError("");
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
            {/* Tab Selection - Commented out for now */}
            <View style={styles.tabWrapper}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "login"
                      ? styles.tabActive
                      : styles.tabInactive,
                  ]}
                  onPress={() => {
                    setActiveTab("login");
                    setRoleError("");
                    setUsername("");
                    setPassword("");
                    setUsernameError("");
                    setPasswordError("");
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "login"
                        ? styles.tabTextActive
                        : styles.tabTextInactive,
                    ]}
                  >
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "security"
                      ? styles.tabActive
                      : styles.tabInactive,
                  ]}
                  onPress={() => {
                    setActiveTab("security");
                    setRoleError("");
                    setUsername("");
                    setPassword("");
                    setUsernameError("");
                    setPasswordError("");
                  }}
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
              {activeTab === "login" ? "Login" : "Security Login"}
            </Text>
            <Text style={styles.cardSubtitle}>
              Enter your credentials to access the system.
            </Text>

            {/* Username Field */}
            <Text style={styles.inputLabel}>Username</Text>
            <View
              style={[
                styles.inputContainer,
                usernameError && styles.inputContainerError,
              ]}
            >
              <View style={styles.inputIcon}>
                <UserNameIcon width={13} height={14} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#ADAEBC"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
              />
            </View>
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}

            {/* Password Field - Optional */}
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                passwordError && styles.inputContainerError,
              ]}
            >
              <View style={styles.inputIcon}>
                <PasswordIcon width={13} height={14} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#ADAEBC"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <EyeIcon width={16} height={13} />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            {roleError ? (
              <Text style={styles.errorText}>{roleError}</Text>
            ) : null}

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

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
  },
  backButton: {
    paddingHorizontal: 16,
  },
  logoContainer: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 60,
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
    marginBottom: 10,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 14,
    color: "#111827",
    marginVertical: 10,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
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
  forgotPassword: {
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#1E40AF",
    fontSize: 14,
    fontWeight: "500",
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
