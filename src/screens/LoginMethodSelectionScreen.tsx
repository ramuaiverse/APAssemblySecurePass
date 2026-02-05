import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import Assembly from "../../assets/assembly.svg";
import DigitalPass from "../../assets/digitalPass.svg";
import QuestionMarkIcon from "../../assets/questionMark.svg";

type LoginMethodSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoginMethodSelection"
>;

type Props = {
  navigation: LoginMethodSelectionScreenNavigationProp;
};

export default function LoginMethodSelectionScreen({ navigation }: Props) {
  const handleUsernamePasswordLogin = () => {
    navigation.navigate("Login");
  };

  const handleUsernameOTPLogin = () => {
    navigation.navigate("UsernameOTPLogin");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <DigitalPass width={170} height={150} />
            <Assembly width={120} height={150} />
          </View>
        </View>

        {/* Selection Card */}
        <View style={styles.selectionCard}>
          <Text style={styles.cardTitle}>Choose Login Method</Text>
          <Text style={styles.cardSubtitle}>
            Select your preferred method to access the system.
          </Text>

          {/* Username & Password Option */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleUsernamePasswordLogin}
          >
            <View style={styles.optionContent}>
              {/* <View style={styles.optionIconContainer}>
              <Text style={styles.optionIcon}>👤</Text>
            </View> */}
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Username & Password</Text>
                <Text style={styles.optionDescription}>
                  Login with your username and password
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Username & OTP Option */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleUsernameOTPLogin}
          >
            <View style={styles.optionContent}>
              {/* <View style={styles.optionIconContainer}>
              <Text style={styles.optionIcon}>📱</Text>
            </View> */}
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Username & OTP</Text>
                <Text style={styles.optionDescription}>
                  Login with your username and OTP
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTextContainer}>
          <QuestionMarkIcon width={14} height={14} />
          <Text style={styles.footerText}>Authorized Personnel Only</Text>
        </View>
        <Text style={styles.footerSubtext}>
          This system is for official use only. All activities are monitored and
          logged.
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    alignItems: "center",
  },
  logoContainer: {
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginTop: 20,
  },
  selectionCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    paddingVertical: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#457E51",
    marginBottom: 18,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 30,
    textAlign: "center",
  },
  optionButton: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#457E51",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#64748B",
  },
  arrowIcon: {
    fontSize: 20,
    color: "#457E51",
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
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
