import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import * as ImagePicker from "expo-image-picker";
import LogOutIcon from "../../assets/logOut.svg";
import ApprovedIcon from "../../assets/approved.svg";
import VisitorIcon from "../../assets/visitor.svg";
import ReferenceIcon from "../../assets/reference.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import ScanIcon from "../../assets/scan.svg";
import CameraIcon from "../../assets/camera.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import AssemblyIcon from "../../assets/assembly.svg";
import BackGroundIcon from "../../assets/backGround.svg";
import { api } from "@/services/api";

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
    validationResponse?.visitorPhoto || visitorPhotoUrl || null
  );
  const [saving, setSaving] = useState(false);
  const [openingCamera, setOpeningCamera] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  // Check if photo already exists from API (don't show save button)
  const photoExistsFromAPI = !!visitorPhotoUrl;

  // Log the validation response for debugging
  useEffect(() => {
    console.log(
      "ValidPassScreen - Validation Response:",
      JSON.stringify(validationResponse, null, 2)
    );
    console.log("ValidPassScreen - Visitor:", JSON.stringify(visitor, null, 2));
    console.log("ValidPassScreen - Pass:", JSON.stringify(pass, null, 2));
    console.log("ValidPassScreen - Visitor Name:", visitorName);
    console.log("ValidPassScreen - Reference:", requestedBy);
    console.log("ValidPassScreen - Valid From:", validFrom);
    console.log("ValidPassScreen - Valid To:", validTo);
    console.log("ValidPassScreen - Session:", session);
    console.log("ValidPassScreen - Category:", category);
    console.log("ValidPassScreen - Pass Category:", passCategory);
    console.log("ValidPassScreen - Pass Sub Category:", passSubCategory);
    console.log("ValidPassScreen - Pass Type:", passType);
    console.log("ValidPassScreen - Purpose:", purpose);
    console.log("ValidPassScreen - Pass Number:", passNumber);
    console.log("ValidPassScreen - Status:", status);
    console.log("ValidPassScreen - Visitor Photo URL:", visitorPhotoUrl);
    console.log("ValidPassScreen - Visitor Photo State:", visitorPhoto);
    console.log("ValidPassScreen - Photo Exists From API:", photoExistsFromAPI);
    console.log("ValidPassScreen - Photo Uploaded:", photoUploaded);
  }, [
    validationResponse,
    visitor,
    pass,
    visitorName,
    requestedBy,
    validFrom,
    validTo,
    session,
    category,
    passCategory,
    passSubCategory,
    passType,
    purpose,
    passNumber,
    status,
    visitorPhotoUrl,
    visitorPhoto,
    photoExistsFromAPI,
    photoUploaded,
  ]);

  const handleScanNext = () => {
    console.log("Scan Next button pressed");
    navigation.replace("QRScan");
  };

  const handleBack = () => {
    navigation.replace("QRScan");
  };

  const handleLogout = () => {
    navigation.replace("Login");
  };

  const handleTakePhoto = async () => {
    console.log("Taking photo");

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
          [{ text: "OK" }]
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

      console.log("Camera result:", result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log("Photo captured:", result.assets[0].uri);
        setVisitorPhoto(result.assets[0].uri);
      } else {
        console.log("Camera was canceled or no assets");
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to take photo. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setOpeningCamera(false);
    }
  };

  const handleSavePhoto = async () => {
    console.log("Saving photo");
    console.log("Visitor photo:", visitorPhoto);
    if (!visitorPhoto) {
      console.log("No visitor photo");
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

    console.log("QR Data for upload:", qrData);
    console.log("Visitor ID:", visitorId);
    console.log("Pass Number:", passNumber);
    console.log("Pass QR String:", passQrString);

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
      // navigation.replace("QRScan");
    } catch (error) {
      console.error("Error saving photo:", error);
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
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      {/* Illustrative Graphic Section */}
      <View style={styles.graphicContainer}>
        <AssemblyIcon width={120} height={140} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
  visitorNameCenteredContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  visitorNameLabelCentered: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  visitorNameValueCentered: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
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
  visitorPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#457E51",
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
});
