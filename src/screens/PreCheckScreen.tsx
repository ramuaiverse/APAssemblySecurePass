import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import AssemblyIcon from "../../assets/assembly.svg";
import LogOutIcon from "../../assets/logOut.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import { SafeAreaView } from "react-native-safe-area-context";

type PreCheckScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PreCheck"
>;

type Props = {
  navigation: PreCheckScreenNavigationProp;
};

export default function PreCheckScreen({ navigation }: Props) {
  const handleBack = () => {
    // Navigate to LoginMethodSelection (logout)
    navigation.replace("LoginMethodSelection");
  };

  // Handle Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [navigation])
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Do you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: () => {
          navigation.replace("LoginMethodSelection");
        },
      },
    ]);
  };

  const handleGateEntryExit = () => {
    navigation.navigate("QRScan", { mode: "gateEntryExit" });
  };

  const handleVerifyVisitor = () => {
    navigation.navigate("QRScan", { mode: "verifyVisitor" });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <BackButtonIcon width={20} height={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Mode</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Assembly Icon */}
        <View style={styles.iconContainer}>
          <AssemblyIcon width={120} height={140} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Choose Your Action</Text>
          <Text style={styles.instructionsText}>
            Select how you want to proceed with visitor verification
          </Text>
        </View>

        {/* Buttons Container */}
        <View style={styles.buttonsContainer}>
          {/* Gate Entry or Exit Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGateEntryExit}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Gate Entry or Exit</Text>
              <Text style={styles.buttonDescription}>
                Record visitor entry or exit through gates
              </Text>
            </View>
          </TouchableOpacity>

          {/* Verify Visitor Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.verifyButton]}
            onPress={handleVerifyVisitor}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <Text style={[styles.buttonTitle, styles.verifyButtonTitle]}>
                Verify Visitor
              </Text>
              <Text
                style={[
                  styles.buttonDescription,
                  styles.verifyButtonDescription,
                ]}
              >
                Verify visitor pass without recording gate entry/exit
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F7E8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  headerButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 20,
  },
  instructionsContainer: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  instructionsText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonsContainer: {
    gap: 16,
    paddingHorizontal: 10,
  },
  actionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#457E51",
  },
  verifyButton: {
    borderColor: "#3B82F6",
  },
  buttonContent: {
    alignItems: "center",
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  verifyButtonTitle: {
    color: "#3B82F6",
  },
  buttonDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  verifyButtonDescription: {
    color: "#64748B",
  },
});
