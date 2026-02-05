import React, { useState, useEffect } from "react";
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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, []);

  const fetchUsers = async () => {
    try {
      const allUsers: any[] = [];
      const departmentUsers = await api.getUsersByRole("department");
      const legislativeUsers = await api.getUsersByRole("legislative");
      const peshiUsers = await api.getUsersByRole("peshi");
      const adminUsers = await api.getUsersByRole("admin");

      allUsers.push(
        ...departmentUsers,
        ...legislativeUsers,
        ...peshiUsers,
        ...adminUsers,
      );

      const newUserMap = new Map<string, string>();
      allUsers.forEach((user) => {
        newUserMap.set(user.id, user.full_name || user.username);
      });
      setUserMap(newUserMap);
    } catch (err) {
      // Error fetching users
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await api.getMainCategories();
      setCategories(cats);
    } catch (error) {
      // Error fetching categories
    }
  };

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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "—";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "—";
  };

  const getSubCategoryName = (subCategoryId: string | null) => {
    if (!subCategoryId) return "—";
    for (const category of categories) {
      const subCat = category.sub_categories?.find(
        (sc: { id: string; }) => sc.id === subCategoryId,
      );
      if (subCat) return subCat.name;
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
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                {getCategoryName(request?.main_category_id)}
                {request?.sub_category_id && getSubCategoryName(request.sub_category_id) !== "—" &&
                  ` • ${getSubCategoryName(request.sub_category_id)}`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PURPOSE</Text>
              <Text style={styles.detailValue}>{request?.purpose || "—"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>REQUESTED BY</Text>
              <Text style={styles.detailValue}>
                {request?.requested_by ? (userMap.get(request.requested_by) || request.requested_by) : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Car Passes Section */}
        {visitor?.car_passes && visitor.car_passes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="directions-car" size={20} color="#F97316" />
              <Text style={styles.sectionTitle}>
                Car Passes ({visitor.car_passes.length})
              </Text>
            </View>

            <View style={styles.detailsContainer}>
              {visitor.car_passes.map((carPass: any, index: number) => (
                <View key={index} style={styles.carPassCard}>
                  <Text style={styles.carPassLabel}>
                    CAR PASS #{index + 1}
                  </Text>
                  <View style={styles.carPassDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>MAKE</Text>
                      <Text style={styles.detailValue}>
                        {carPass.car_make || "—"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>MODEL</Text>
                      <Text style={styles.detailValue}>
                        {carPass.car_model || "—"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>COLOR</Text>
                      <Text style={styles.detailValue}>
                        {carPass.car_color || "—"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>NUMBER</Text>
                      <Text style={styles.detailValue}>
                        {carPass.car_number || "—"}
                      </Text>
                    </View>
                    {carPass.car_tag && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>TAG</Text>
                        <Text style={styles.detailValue}>
                          {carPass.car_tag}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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
  carPassCard: {
    borderWidth: 1,
    borderColor: "#F97316",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FFF7ED",
  },
  carPassLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  carPassDetails: {
    gap: 4,
  },
});
