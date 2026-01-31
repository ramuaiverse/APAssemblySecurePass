import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import BackButtonIcon from "../../assets/backButton.svg";
import CloseIcon from "../../assets/close.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";

type LegislativeRejectScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LegislativeReject"
>;

type LegislativeRejectScreenRouteProp = RouteProp<
  RootStackParamList,
  "LegislativeReject"
>;

type Props = {
  navigation: LegislativeRejectScreenNavigationProp;
  route: LegislativeRejectScreenRouteProp;
};

export default function LegislativeRejectScreen({ navigation, route }: Props) {
  const { visitor, request, userId } = route.params;
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Required", "Please provide a reason for rejection.");
      return;
    }

    if (!userId || !visitor?.id) {
      Alert.alert("Error", "Missing required information.");
      return;
    }

    setLoading(true);
    try {
      await api.rejectVisitorLegislative(visitor.id, {
        current_user_id: userId,
        rejection_reason: rejectionReason.trim(),
      });

      Alert.alert("Success", "Visitor request has been rejected.", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reject visitor request. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = () => {
    if (request?.main_category_id) {
      // Try to get from category map if available
      return request.main_category_name || "—";
    }
    return "—";
  };

  const getSubCategoryName = () => {
    if (request?.sub_category_id) {
      return request.sub_category_name || "—";
    }
    return "—";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Background Assembly Image - Center */}
      <View style={styles.assemblyBackgroundContainer}>
        <Assembly width={200} height={200} opacity={0.1} />
      </View>

      {/* Background Image at Bottom */}
      <View style={styles.backgroundImageContainer}>
        <BackGround height={200} width={Dimensions.get("window").width} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackButtonIcon width={18} height={18} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Reject Visitor Request</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <CloseIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Provide a reason for rejection.</Text>

        {/* Visitor Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Visitor Details</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>FULL NAME</Text>
              <Text style={styles.detailValue}>
                {visitor?.first_name || ""} {visitor?.last_name || ""}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>EMAIL</Text>
              <Text style={styles.detailValue}>{visitor?.email || "—"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PHONE</Text>
              <Text style={styles.detailValue}>{visitor?.phone || "—"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IDENTIFICATION</Text>
              <View style={styles.identificationContainer}>
                <View style={styles.idTypeTag}>
                  <Text style={styles.idTypeText}>
                    {visitor?.identification_type || "—"}
                  </Text>
                </View>
                <Text style={styles.idNumberText}>
                  {visitor?.identification_number || ""}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CATEGORY</Text>
              <Text style={styles.detailValue}>
                {getCategoryName()}
                {getSubCategoryName() !== "—" && ` • ${getSubCategoryName()}`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PURPOSE</Text>
              <Text style={styles.detailValue}>{request?.purpose || "—"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>REQUESTED BY</Text>
              <Text style={styles.detailValue}>
                {request?.requested_by || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={styles.commentsLabel}>
            Comments<Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Please provide reason for rejection..."
            placeholderTextColor="#9CA3AF"
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.rejectButton,
              (!rejectionReason.trim() || loading) &&
                styles.rejectButtonDisabled,
            ]}
            onPress={handleReject}
            disabled={!rejectionReason.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.rejectButtonText}>Reject</Text>
            )}
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
    position: "relative",
  },
  assemblyBackgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  backgroundImageContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 0,
    height: "40%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "transparent",
    zIndex: 1,
  },
  backButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  detailsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  identificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  idTypeTag: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#F97316",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idTypeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#F97316",
  },
  idNumberText: {
    fontSize: 14,
    color: "#111827",
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 120,
    backgroundColor: "#FFFFFF",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  rejectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  rejectButtonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
