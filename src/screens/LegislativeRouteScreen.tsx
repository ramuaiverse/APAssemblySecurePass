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

  useEffect(() => {
    fetchSuperiors();
  }, []);

  const fetchSuperiors = async () => {
    try {
      setLoadingSuperiors(true);
      // Get department from request or default to "department"
      const department = request?.main_category_id
        ? "department"
        : "department";
      const fetchedSuperiors = await api.getSuperiors(department);
      setSuperiors(fetchedSuperiors);
    } catch (error) {
      Alert.alert("Error", "Failed to load superiors. Please try again.");
    } finally {
      setLoadingSuperiors(false);
    }
  };

  const getCategoryName = () => {
    if (request?.main_category_id) {
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

  const getSuperiorDisplayText = (superior: Superior | null) => {
    if (!superior) return "—";
    const level = superior.approval_level || "";
    const role = superior.role || "";
    return `${superior.username} (${superior.email}) - ${level} - ${role}`;
  };

  const getSuperiorName = (superiorId: string | null) => {
    if (!superiorId) return "—";
    const superior = superiors.find((s) => s.id === superiorId);
    return getSuperiorDisplayText(superior || null);
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
          <CloseIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Forward to a superior for review.</Text>

        {/* Visitor Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Visitor Details</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>FULL NAME</Text>
                  <Text style={styles.detailValue}>
                    {visitor?.first_name || ""} {visitor?.last_name || ""}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PHONE</Text>
                  <Text style={styles.detailValue}>
                    {visitor?.phone || "—"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>CATEGORY</Text>
                  <Text style={styles.detailValue}>
                    {getCategoryName()}
                    {getSubCategoryName() !== "—" &&
                      ` • ${getSubCategoryName()}`}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>REQUESTED BY</Text>
                  <Text style={styles.detailValue}>
                    {request?.requested_by || "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.column}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>EMAIL</Text>
                  <Text style={styles.detailValue}>
                    {visitor?.email || "—"}
                  </Text>
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
                  <Text style={styles.detailLabel}>PURPOSE</Text>
                  <Text style={styles.detailValue}>
                    {request?.purpose || "—"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Car Passes Section */}
        {visitor?.car_passes && visitor.car_passes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="description" size={20} color="#111827" />
              <Text style={styles.sectionTitle}>
                CAR PASSES ({visitor.car_passes.length})
              </Text>
            </View>

            {visitor.car_passes.map((carPass: any, index: number) => (
              <View key={index} style={styles.carPassCard}>
                <View style={styles.twoColumnRow}>
                  <View style={styles.column}>
                    <Text style={styles.carPassLabel}>
                      CAR PASS #{index + 1}
                    </Text>
                    <Text style={styles.carPassDetailText}>
                      Make: {carPass.car_make || "—"}
                    </Text>
                    <Text style={styles.carPassDetailText}>
                      Color: {carPass.car_color || "—"}
                    </Text>
                    <Text style={styles.carPassDetailText}>
                      Tag: {carPass.car_tag || "—"}
                    </Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.carPassDetailText}>
                      Model: {carPass.car_model || "—"}
                    </Text>
                    <Text style={styles.carPassDetailText}>
                      Number: {carPass.car_number || "—"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
                <CloseIcon width={20} height={20} />
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
                    <Text style={styles.modalItemText}>
                      {getSuperiorDisplayText(superior)}
                    </Text>
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
  twoColumnRow: {
    flexDirection: "row",
    gap: 16,
  },
  column: {
    flex: 1,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
  },
  identificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
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
    backgroundColor: "#FFF7ED",
    marginBottom: 12,
  },
  carPassLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  carPassDetailText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    marginBottom: 4,
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
