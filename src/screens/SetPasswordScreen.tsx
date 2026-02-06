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
import PasswordIcon from "../../assets/password.svg";
import EyeIcon from "../../assets/eye.svg";
import Assembly from "../../assets/assembly.svg";
import DigitalPass from "../../assets/digitalPass.svg";
import QuestionMarkIcon from "../../assets/questionMark.svg";
import BackButtonIcon from "../../assets/backButton.svg";

type SetPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SetPassword"
>;

type SetPasswordScreenRouteProp = RouteProp<RootStackParamList, "SetPassword">;

type Props = {
  navigation: SetPasswordScreenNavigationProp;
  route: SetPasswordScreenRouteProp;
};

export default function SetPasswordScreen({ navigation, route }: Props) {
  const username = route.params?.username || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isLandscape = dimensions.width > dimensions.height;

  const handleSetPassword = async () => {
    // Clear previous errors
    setNewPasswordError("");
    setConfirmPasswordError("");

    // Validate fields
    let hasError = false;

    if (!newPassword.trim()) {
      setNewPasswordError("New password is required");
      hasError = true;
    } else if (newPassword.length < 12) {
      setNewPasswordError("Password must be at least 12 characters");
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      await api.setPassword({
        username: username,
        password: newPassword.trim(),
      });

      // Navigate to login screen immediately
      // Reset navigation stack to Login screen (which has Login and Security Login tabs)
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });

      setLoading(false);

      // Show success message after navigation
      setTimeout(() => {
        Alert.alert(
          "Success",
          "Password has been set successfully. Please login again.",
        );
      }, 300);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to set password. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (newPasswordError) {
      setNewPasswordError("");
    }
    // Clear confirm password error if passwords match
    if (confirmPassword && text === confirmPassword) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
    // Check if passwords match
    if (newPassword && text !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
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
              onPress={() => navigation.goBack()}
              style={styles.backButton}
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

          {/* Form Card */}
          <View
            style={[styles.formCard, isLandscape && styles.formCardLandscape]}
          >
            <Text style={styles.cardTitle}>Set Your Password</Text>
            <Text style={styles.cardSubtitle}>
              Welcome! Please set a password for your account. This is a
              one-time setup.
            </Text>
            {/* New Password Field */}
            <Text style={styles.inputLabel}>
              New Password <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                newPasswordError && styles.inputContainerError,
              ]}
            >
              <View style={styles.inputIcon}>
                <PasswordIcon width={13} height={14} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter new password (min. 12 characters)"
                placeholderTextColor="#ADAEBC"
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                <EyeIcon width={16} height={13} />
              </TouchableOpacity>
            </View>
            {newPasswordError ? (
              <Text style={styles.errorText}>{newPasswordError}</Text>
            ) : null}

            {/* Confirm Password Field */}
            <Text style={styles.inputLabel}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                confirmPasswordError && styles.inputContainerError,
              ]}
            >
              <View style={styles.inputIcon}>
                <PasswordIcon width={13} height={14} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#ADAEBC"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <EyeIcon width={16} height={13} />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}

            {/* Set Password Button */}
            <TouchableOpacity
              style={[
                styles.setPasswordButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.setPasswordButtonText}>Set Password</Text>
              )}
            </TouchableOpacity>
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
  backButton: {
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
  },
  logoContainerLandscape: {
    paddingVertical: 5,
    gap: 30,
  },
  formCard: {
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
  formCardLandscape: {
    paddingVertical: 20,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
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
    marginVertical: 10,
    textAlign: "left",
  },
  required: {
    color: "#F97316",
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
    minHeight: 50,
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
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 10,
    marginTop: -5,
  },
  setPasswordButton: {
    backgroundColor: "#457E51",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  setPasswordButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
