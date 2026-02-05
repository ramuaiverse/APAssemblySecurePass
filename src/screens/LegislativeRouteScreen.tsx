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
  Modal,
  Dimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Superior } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import BackButtonIcon from "../../assets/backButton.svg";
import CloseIcon from "../../assets/close.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";

type LegislativeRouteScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LegislativeRoute"
>;

type LegislativeRouteScreenRouteProp = RouteProp<
  RootStackParamList,
  "LegislativeRoute"
>;

type Props = {
  navigation: LegislativeRouteScreenNavigationProp;
  route: LegislativeRouteScreenRouteProp;
};

export default function LegislativeRouteScreen({ navigation, route }: Props) {
  const { visitor, request, userId } = route.params;
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [superiors, setSuperiors] = useState<Superior[]>([]);
  const [selectedSuperiorId, setSelectedSuperiorId] = useState<string | null>(
    null,
  );
  const [showSuperiorModal, setShowSuperiorModal] = useState(false);
  const [loadingSuperiors, setLoadingSuperiors] = useState(false);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchCategories();
    // Fetch superiors immediately - always use "legislative" for legislative route screen
    fetchSuperiors();
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

  const fetchSuperiors = async () => {
    try {
      setLoadingSuperiors(true);
      
      // Since the superiors endpoint returns 404 for "legislative", 
      // fetch legislative users directly and filter for superiors
      const legislativeUsers = await api.getUsersByRole("legislative");
      
      // Filter to only include users who are superiors (have approval_level or is_superior flag)
      // and exclude the current user if they are L1 or higher
      const normalizeUuid = (uuid: string | undefined) => {
        if (!uuid) return '';
        return uuid.replace(/-/g, '').toLowerCase();
      };
      
      const normalizedCurrentUserId = normalizeUuid(userId);
      
      // Filter legislative users to get superiors:
      // - Must have approval_level or is_superior flag
      // - Must be active
      // - Exclude current user if they have approval_level L1 or higher
      const filteredSuperiors = legislativeUsers.filter((user: any) => {
        // Skip inactive users
        if (user.is_active === false) {
          return false;
        }
        
        // Check if user is a superior (has approval level or is_superior flag)
        const hasApprovalLevel = user.approval_level && user.approval_level.trim() !== '';
        const isSuperior = user.is_superior === true || user.legislative_approver === true;
        
        if (!hasApprovalLevel && !isSuperior) {
          return false; // Not a superior
        }
        
        // Exclude current user if they have approval_level L1 or higher
        const normalizedUserId = normalizeUuid(user.id);
        if (normalizedUserId === normalizedCurrentUserId) {
          const approvalLevel = user.approval_level?.toUpperCase() || '';
          if (approvalLevel.startsWith('L')) {
            const levelNumber = parseInt(approvalLevel.substring(1));
            if (levelNumber >= 1 && levelNumber <= 5) {
              return false; // Exclude current user if L1 or higher
            }
          }
        }
        
        return true;
      });
      
      setSuperiors(filteredSuperiors);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to load superiors. Please try again.";
      Alert.alert("Error", errorMessage);
      setSuperiors([]);
    } finally {
      setLoadingSuperiors(false);
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
        (sc: any) => sc.id === subCategoryId,
      );
      if (subCat) return subCat.name;
    }
    return "—";
  };

  const getSuperiorDisplayText = (superior: Superior | null) => {
    if (!superior) return "—";
    const fullName = superior.full_name || superior.username || "";
    const email = superior.email || "";
    const level = superior.approval_level || "";
    return fullName + (email ? ` (${email})` : "") + (level ? ` - ${level}` : "");
  };

  const getSuperiorName = (superiorId: string | null) => {
    if (!superiorId) return "—";
    const superior = superiors.find((s) => s.id === superiorId);
    return superior ? (superior.full_name || superior.username || "—") : "—";
  };

  const handleRoute = async () => {
    if (!comments.trim()) {
      Alert.alert("Required", "Please provide comments for routing.");
      return;
    }

    if (!selectedSuperiorId) {
      Alert.alert("Required", "Please select a superior.");
      return;
    }

    if (!userId || !visitor?.id || !request?.request_id) {
      Alert.alert("Error", "Missing required information.");
      return;
    }

    setLoading(true);
    try {
      // Use request.request_id (formatted ID like REQ-xxx) instead of request.id (UUID)
      await api.routeForSuperiorApproval(request.request_id, {
        visitor_id: visitor.id,
        routed_to: selectedSuperiorId,
        routed_by: userId,
        current_user_id: userId,
        comments: comments.trim(),
      });

      Alert.alert("Success", "Visitor request has been routed for approval.", [
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
          : "Failed to route visitor request. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Route for Superior Approval</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <CloseIcon width={16} height={16} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>Forward to a superior for review.</Text>

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
            placeholder="Please provide comments for routing..."
            placeholderTextColor="#9CA3AF"
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Select Superior Section */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>
            Select Superior<Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowSuperiorModal(true)}
            disabled={loadingSuperiors}
          >
            <Text
              style={[
                styles.dropdownText,
                !selectedSuperiorId && styles.placeholderText,
              ]}
            >
              {selectedSuperiorId
                ? getSuperiorName(selectedSuperiorId)
                : "-- Select a Superior --"}
            </Text>
            <ChevronDownIcon width={20} height={20} />
          </TouchableOpacity>
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
              styles.routeButton,
              (!comments.trim() || !selectedSuperiorId || loading) &&
                styles.routeButtonDisabled,
            ]}
            onPress={handleRoute}
            disabled={!comments.trim() || !selectedSuperiorId || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.routeButtonText}>Route for Approval</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Superior Selection Modal */}
      <Modal
        visible={showSuperiorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSuperiorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Superior</Text>
              <TouchableOpacity onPress={() => setShowSuperiorModal(false)}>
                <CloseIcon width={18} height={18} />
              </TouchableOpacity>
            </View>
            {loadingSuperiors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#457E51" />
              </View>
            ) : (
              <ScrollView>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedSuperiorId(null);
                    setShowSuperiorModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    -- Select a Superior --
                  </Text>
                  {!selectedSuperiorId && (
                    <Ionicons name="checkmark" size={20} color="#457E51" />
                  )}
                </TouchableOpacity>
                {superiors.map((superior) => (
                  <TouchableOpacity
                    key={superior.id}
                    style={[
                      styles.modalItem,
                      selectedSuperiorId === superior.id &&
                        styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedSuperiorId(superior.id);
                      setShowSuperiorModal(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemText}>
                        {superior.full_name || superior.username}
                      </Text>
                      {superior.email && (
                        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                          {superior.email}
                        </Text>
                      )}
                      {superior.approval_level && (
                        <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                          Level: {superior.approval_level}
                        </Text>
                      )}
                    </View>
                    {selectedSuperiorId === superior.id && (
                      <Ionicons name="checkmark" size={20} color="#457E51" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
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
  routeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#457E51",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
  },
  routeButtonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.6,
  },
  routeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemSelected: {
    backgroundColor: "#F3F4F6",
  },
  modalItemText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
