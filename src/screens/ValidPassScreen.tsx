import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import LogOutIcon from "../../assets/logOut.svg";
import ApprovedIcon from "../../assets/approved.svg";
import VisitorIcon from "../../assets/visitor.svg";
import ReferenceIcon from "../../assets/reference.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import AssemblyIcon from "../../assets/assembly.svg";
import BackGroundIcon from "../../assets/backGround.svg";

type ValidPassScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ValidPass"
>;

type ValidPassScreenRouteProp = RouteProp<RootStackParamList, "ValidPass">;

type Props = {
  navigation: ValidPassScreenNavigationProp;
  route: ValidPassScreenRouteProp;
};

export default function ValidPassScreen({ navigation, route }: Props) {
  // Get validation response from route params
  const validationResponse = route.params?.validationResponse;
  const passData = validationResponse?.pass_data;

  // Extract only visitor name and issued by
  const visitorName = passData?.full_name || "N/A";
  const issuedBy = passData?.created_by || "System";

  // Log the validation response for debugging
  useEffect(() => {
    console.log(
      "ValidPassScreen - Validation Response:",
      JSON.stringify(validationResponse, null, 2)
    );
    console.log(
      "ValidPassScreen - Pass Data:",
      JSON.stringify(passData, null, 2)
    );
    console.log("ValidPassScreen - Visitor Name:", visitorName);
    console.log("ValidPassScreen - Issued By:", issuedBy);
  }, [validationResponse, passData, visitorName, issuedBy]);

  const handleScanNext = () => {
    navigation.replace("QRScan");
  };

  const handleBack = () => {
    navigation.replace("QRScan");
  };

  const handleLogout = () => {
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <BackButtonIcon width={10} height={24} />
        </TouchableOpacity>
        <View style={styles.headerButton} />
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      {/* Illustrative Graphic Section */}
      <View style={styles.graphicContainer}>
        <AssemblyIcon width={120} height={140} />
      </View>
      <View style={styles.scrollContent}>
        {/* Visitor Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.approvedIconContainer}>
            <View style={styles.approvedIconShadow}>
              <ApprovedIcon width={84} height={84} />
            </View>
            <Text style={styles.approvedText}>Valid Pass</Text>
            <Text style={styles.approvedSubtext}>
              Verify ID and allow entry through the designated gate.
            </Text>
          </View>

          <View style={styles.fullSeparator} />

          <View style={styles.detailRow}>
            <VisitorIcon width={40} height={40} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Visitor Name</Text>
              <Text style={styles.detailValue}>{visitorName}</Text>
            </View>
          </View>

          <View style={styles.fullSeparator} />

          <View style={styles.detailRow}>
            <ReferenceIcon width={40} height={40} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Reference/Issued by</Text>
              <Text style={styles.detailValue}>{issuedBy}</Text>
            </View>
          </View>

          {/* Scan Next Button */}
          <TouchableOpacity
            style={styles.scanNextButton}
            onPress={handleScanNext}
          >
            <Text style={styles.scanNextButtonText}>Scan Next</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Background SVG at bottom */}
      <View style={styles.backgroundContainer}>
        <BackGroundIcon height={200} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F7E8",
  },
  graphicContainer: {
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  headerButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 0,
    alignItems: "center",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  approvedIconContainer: {
    alignItems: "center",
  },
  approvedIconShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 42, // Half of width/height for circular shadow
  },
  approvedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#457E51",
  },
  approvedSubtext: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 10,
    textAlign: "center",
    width: "70%",
  },
  fullSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    width: "100%",
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },
  detailContent: {
    flex: 1,
    marginLeft: 15,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    lineHeight: 20,
  },
  scanNextButton: {
    backgroundColor: "#E3F7E8",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scanNextButtonText: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "500",
  },
  backgroundContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
