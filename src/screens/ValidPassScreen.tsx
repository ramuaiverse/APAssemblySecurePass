import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import * as ImagePicker from "expo-image-picker";
import LogOutIcon from "../../assets/logOut.svg";
import ApprovedIcon from "../../assets/approved.svg";
import VisitorIcon from "../../assets/visitor.svg";
import ReferenceIcon from "../../assets/reference.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import ScanIcon from "../../assets/scan.svg";
import CameraIcon from "../../assets/camera.svg";
import CloseIcon from "../../assets/close.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import AssemblyIcon from "../../assets/assembly.svg";
import BackGroundIcon from "../../assets/backGround.svg";
import { api } from "@/services/api";
import { handleLogout } from "@/utils/logout";

type ValidPassScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ValidPass"
>;

type ValidPassScreenRouteProp = RouteProp<RootStackParamList, "ValidPass">;

type Props = {
  navigation: ValidPassScreenNavigationProp;
  route: ValidPassScreenRouteProp;
};

// Helper function to format date
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export default function ValidPassScreen({ navigation, route }: Props) {
  // Get validation response from route params
  const validationResponse = route.params?.validationResponse;
  const visitor = validationResponse?.visitor;
  const pass = validationResponse?.pass;

  // Extract ALL visitor information from API response
  const visitorId = visitor?.id || null;
  const firstName = visitor?.first_name || null;
  const lastName = visitor?.last_name || null;
  const visitorName =
    visitor?.name || visitor?.first_name + " " + visitor?.last_name || "N/A";
  const email = visitor?.email || null;
  const phone = visitor?.phone || "N/A";
  const identificationType = visitor?.identification_type || null;
  const identificationNumber = visitor?.identification_number || null;
  const identificationPhotoUrl = visitor?.identification_photo_url || null;
  const visitorPhotoUrl = visitor?.photo || null;

  // Extract ALL pass information from API response
  const requestId = pass?.request_id || null;
  const passNumber = pass?.pass_number || null;
  const passQrString = pass?.pass_qr_string || null;
  const passQrCode = pass?.pass_qr_code || null;
  const session = pass?.session || null;
  const category = pass?.category || null;
  const passCategory = pass?.pass_category || null;
  const passSubCategory = pass?.pass_sub_category || null;
  const passType = pass?.pass_type || null;
  const purpose = pass?.purpose || null;
  const requestedBy = pass?.requested_by || "System";

  // Use formatted dates from API, fallback to formatting if not available
  const validFrom = pass?.valid_from_formatted || formatDate(pass?.valid_from);
  const validTo = pass?.valid_to_formatted || formatDate(pass?.valid_to);

  // Top-level status fields
  const valid = validationResponse?.valid ?? false;
  const suspended = validationResponse?.suspended ?? false;
  const expired = validationResponse?.expired ?? false;
  const notYetValid = validationResponse?.not_yet_valid ?? false;
  const status = validationResponse?.status || null;
  const scanRecorded = validationResponse?.scan_recorded ?? false;
  const scanId = validationResponse?.scan_id || null;

  // Photo capture state - initialize from route params if available, or use visitor photo URL
  const [visitorPhoto, setVisitorPhoto] = useState<string | null>(
    validationResponse?.visitorPhoto || visitorPhotoUrl || null,
  );
  const [saving, setSaving] = useState(false);
  const [openingCamera, setOpeningCamera] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  // Suspend modal state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspending, setSuspending] = useState(false);

  // Check if photo already exists from API (don't show save button)
  const photoExistsFromAPI = !!visitorPhotoUrl;

  const handleBack = () => {
    // Use goBack to return to previous screen in stack
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("PreCheck");
    }
  };

  const handleScanNext = async () => {
    // Navigate to PreCheck screen for next scan
    navigation.navigate("PreCheck");
  };

  // Handle Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("PreCheck");
        }
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  const handleReportPress = () => {
    setShowSuspendModal(true);
    setSuspendReason("");
  };

  const handleSuspendSubmit = async () => {
    if (!suspendReason.trim()) {
      Alert.alert("Error", "Please enter a suspend reason");
      return;
    }

    if (!visitorId) {
      Alert.alert("Error", "Visitor ID is missing");
      return;
    }

    setSuspending(true);

    try {
      const suspendedBy = "system";

      const response = await api.suspendVisitor(visitorId, {
        suspended_by: suspendedBy,
        reason: suspendReason.trim(),
      });

      // Close modal and reset state
      setShowSuspendModal(false);
      setSuspendReason("");
      setSuspending(false);

      // Show success message and navigate
      Alert.alert("Success", "Visitor has been suspended successfully", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to PreCheck screen
            navigation.navigate("PreCheck");
          },
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to suspend visitor. Please try again.";

      Alert.alert("Error", errorMessage, [
        {
          text: "OK",
          onPress: () => {
            setSuspending(false);
          },
        },
      ]);
    } finally {
      setSuspending(false);
    }
  };

  const handleSuspendCancel = () => {
    setShowSuspendModal(false);
    setSuspendReason("");
  };

  const handleTakePhoto = async () => {
    if (openingCamera) {
      // Prevent multiple rapid taps while camera is opening
      return;
    }

    setOpeningCamera(true);
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Camera Permission",
          "Camera permission is required to take visitor photos.",
          [{ text: "OK" }],
        );
        setOpeningCamera(false);
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setVisitorPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to take photo. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setOpeningCamera(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!visitorPhoto) {
      return;
    }

    // Extract QR data - prioritize visitor ID, then pass_number, then extract from pass_qr_string URL
    let qrData = visitorId;

    if (!qrData && passNumber) {
      // Try using pass_number if visitor ID is not available
      qrData = passNumber;
    }

    if (!qrData && passQrString) {
      // Extract ID from URL like "http://localhost:3000/validate/{id}"
      const match = passQrString.match(/\/validate\/([^\/]+)/);
      if (match && match[1]) {
        qrData = match[1];
      } else {
        // If no match, try using the full string
        qrData = passQrString;
      }
    }

    if (!qrData) {
      Alert.alert("Error", "Unable to upload photo. QR data not found.");
      return;
    }

    setSaving(true);
    try {
      // Upload photo to API
      await api.uploadVisitorPhoto(qrData, visitorPhoto);

      // Mark photo as uploaded
      setPhotoUploaded(true);

      // Navigate to QRScan screen after successful upload
      setSaving(false);
      Alert.alert("Success", "Visitor photo uploaded successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload photo. Please try again.";
      Alert.alert("Error", errorMessage);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <BackButtonIcon width={10} height={24} />
        </TouchableOpacity>
        <View style={styles.headerButton} />
        <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.headerButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      {/* Illustrative Graphic Section */}
      <View style={styles.graphicContainer}>
        <AssemblyIcon width={100} height={120} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

          {/* Visitor Photo */}
          {visitorPhoto && (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: visitorPhoto }}
                style={styles.visitorPhoto}
              />
            </View>
          )}

          {/* Visitor Information - Only selected fields */}
          <>
            {/* Visitor Name */}
            <View style={styles.detailRow}>
              <VisitorIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Visitor Name</Text>
                <Text style={styles.detailValue}>{visitorName}</Text>
              </View>
            </View>

            {/* Pass Number */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pass Number</Text>
                <Text style={styles.detailValue}>{passNumber || "N/A"}</Text>
              </View>
            </View>

            {/* Session */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Session</Text>
                <Text style={styles.detailValue}>{session || "N/A"}</Text>
              </View>
            </View>

            {/* Pass Category */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pass Category</Text>
                <Text style={styles.detailValue}>{passCategory || "N/A"}</Text>
              </View>
            </View>

            {/* Type (Pass Type) */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pass Type</Text>
                <Text style={styles.detailValue}>{passType || "N/A"}</Text>
              </View>
            </View>

            {/* Valid From */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Valid From</Text>
                <Text style={styles.detailValue}>{validFrom || "N/A"}</Text>
              </View>
            </View>

            {/* Valid To */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Valid To</Text>
                <Text style={styles.detailValue}>{validTo || "N/A"}</Text>
              </View>
            </View>

            {/* Reference */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={styles.detailValue}>{requestedBy}</Text>
              </View>
            </View>

            {/* Identification Number */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Identification Number</Text>
                <Text style={styles.detailValue}>
                  {(identificationType?.toUpperCase() || "N/A") +
                    " " +
                    (identificationNumber || "N/A")}
                </Text>
              </View>
            </View>

            {/* Identification Photo */}
            {identificationPhotoUrl && (
              <>
                <View style={styles.fullSeparator} />
                <View style={styles.photoContainer}>
                  <Text style={styles.photoLabel}>Identification Document</Text>
                  <Image
                    source={{ uri: identificationPhotoUrl }}
                    style={styles.identificationPhoto}
                  />
                </View>
              </>
            )}

            {/* Purpose */}
            <View style={styles.fullSeparator} />
            <View style={styles.detailRow}>
              <ReferenceIcon width={40} height={40} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Purpose</Text>
                <Text style={styles.detailValue}>{purpose || "N/A"}</Text>
              </View>
            </View>
          </>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.scanNextButton}
            onPress={handleScanNext}
            activeOpacity={0.7}
          >
            <ScanIcon width={20} height={20} />
            <Text style={styles.scanNextButtonText}>Scan Next</Text>
          </TouchableOpacity>

          {/* Report Button */}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReportPress}
            activeOpacity={0.7}
          >
            <Text style={styles.reportButtonText}>Report</Text>
          </TouchableOpacity>

          {!visitorPhoto ? (
            <TouchableOpacity
              style={styles.takePhotoButton}
              onPress={handleTakePhoto}
              disabled={openingCamera}
              activeOpacity={0.7}
            >
              {openingCamera ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CameraIcon width={20} height={20} />
                  <Text style={styles.takePhotoButtonText}>
                    Take Visitor Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : !photoExistsFromAPI && !photoUploaded ? (
            // Show save button only if photo doesn't exist from API and hasn't been uploaded yet
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePhoto}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <ApprovedIcon width={18} height={18} />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
      {/* Background SVG at bottom */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <BackGroundIcon height={200} />
      </View>

      {/* Suspend Modal - Centered Modal */}
      <Modal
        visible={showSuspendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuspendCancel}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleSuspendCancel}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.modalContent}>
              {/* Close Icon */}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleSuspendCancel}
              >
                <CloseIcon width={20} height={20} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Suspend Visitor</Text>
              <Text style={styles.modalSubtitle}>
                Please enter the reason for suspending this visitor
              </Text>

              <TextInput
                style={styles.reasonInput}
                placeholder="Enter suspend reason..."
                placeholderTextColor="#9CA3AF"
                value={suspendReason}
                onChangeText={setSuspendReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!suspending}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={handleSuspendCancel}
                  disabled={suspending}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSubmit]}
                  onPress={handleSuspendSubmit}
                  disabled={suspending || !suspendReason.trim()}
                >
                  {suspending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonSubmitText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    paddingVertical: 10,
  },
  headerButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 30,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  scanNextButtonText: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "500",
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  visitorPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#457E51",
  },
  identificationPhoto: {
    width: "100%",
    maxWidth: 300,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    resizeMode: "contain",
  },
  takePhotoButton: {
    backgroundColor: "#457E51",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  takePhotoButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#457E51",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
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
  reportButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 8,
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  reportButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardAvoidingView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: "relative",
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonSubmit: {
    backgroundColor: "#EF4444",
  },
  modalButtonCancelText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonSubmitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
