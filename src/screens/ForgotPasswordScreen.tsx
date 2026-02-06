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
import { RootStackParamList } from "@/types";
import { api } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import Assembly from "../../assets/assembly.svg";
import DigitalPass from "../../assets/digitalPass.svg";
import UserNameIcon from "../../assets/userName.svg";
import QuestionMarkIcon from "../../assets/questionMark.svg";
import BackButtonIcon from "../../assets/backButton.svg";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

type Props = {
  navigation: ForgotPasswordScreenNavigationProp;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isLandscape = dimensions.width > dimensions.height;

  const handleSendOTP = async () => {
    // Clear previous errors
    setUsernameError("");

    // Validate fields
    if (!username.trim()) {
      setUsernameError("Username is required");
      return;
    }

    setLoading(true);
    try {
      const response = await api.generateOTP(username.trim());

      // Navigate to reset password screen with username and masked mobile
      navigation.replace("ResetPassword", {
        username: username.trim(),
        mobileMasked: response.mobile_masked || "****2020",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send OTP. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    if (usernameError) {
      setUsernameError("");
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
              onPress={handleCancel}
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
              Enter your username to receive an OTP on your registered mobile
              number.
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
                placeholder="Enter your username"
                placeholderTextColor="#ADAEBC"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
              />
            </View>
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.sendOTPButton,
                  username.trim() && styles.sendOTPButtonActive,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSendOTP}
                disabled={loading || !username.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendOTPButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  },
  logoContainerLandscape: {
    paddingVertical: 5,
    gap: 30,
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
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
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
  sendOTPButton: {
    flex: 1,
    backgroundColor: "#9CA3AF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  sendOTPButtonActive: {
    backgroundColor: "#457E51",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sendOTPButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
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
  cancelButtonText: {
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
