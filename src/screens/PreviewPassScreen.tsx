import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Image,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import QRCode from "react-native-qrcode-svg";
import CloseIcon from "../../assets/close.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import AssemblyIcon from "../../assets/assembly.svg";
import AssemblyIconBG from "../../assets/assemblyIcon.svg";
import ShareIcon from "../../assets/share.svg";
import { api } from "@/services/api";

type PreviewPassScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PreviewPass"
>;

type PreviewPassScreenRouteProp = RouteProp<RootStackParamList, "PreviewPass">;

type Props = {
  navigation: PreviewPassScreenNavigationProp;
  route: PreviewPassScreenRouteProp;
};

// QR Code Component - generates QR code from pass_qr_string
const QRCodeDisplay = ({
  qrCodeString,
  qrCodeViewRef,
}: {
  qrCodeString?: string;
  qrCodeViewRef?: React.RefObject<View | null>;
}) => {
  const qrData = qrCodeString || "";

  // Extract the last QR code ID from the string
  const getLastQrCodeId = (qrString: string) => {
    if (!qrString) return "";
    // Split on commas or slashes (not hyphens, as they're part of UUID format)
    // This handles cases like "id1,id2,id3" or "path/to/id" or "prefix-id1,prefix-id2"
    const segments = qrString.split(/[,\/\\]/);
    const lastSegment = segments[segments.length - 1]?.trim() || qrString;
    return lastSegment;
  };

  const lastQrCodeId = getLastQrCodeId(qrData);

  if (!qrData) {
    return (
      <View style={styles.qrCodeContainer}>
        <Text style={styles.qrCodePlaceholder}>QR Code not available</Text>
      </View>
    );
  }

  return (
    <View ref={qrCodeViewRef} style={styles.qrCodeWrapper} collapsable={false}>
      <View style={styles.qrCodeBorder}>
        <QRCode
          value={qrData}
          size={180}
          color="#000000"
          backgroundColor="#FFFFFF"
          logo={undefined}
        />
      </View>
      {lastQrCodeId && <Text style={styles.qrCodeId}>{lastQrCodeId}</Text>}
    </View>
  );
};

export default function PreviewPassScreen({ navigation, route }: Props) {
  const qrCodeViewRef = useRef<View>(null);
  const cardContainerRef = useRef<View>(null);

  const passRequestData = route.params?.passData;

  const categoryName = route.params?.categoryName || null;
  const passTypeName = route.params?.passTypeName || null;

  // State for pass type color
  const [passTypeColor, setPassTypeColor] = useState<string>("#3B82F6"); // Default blue color

  // Fetch pass types and get color for current pass type
  useEffect(() => {
    const fetchPassTypeColor = async () => {
      if (!passTypeName) return;

      try {
        const passTypes = await api.getAllPassTypes();
        const matchedPassType = passTypes.find(
          (pt) => pt.name.toLowerCase() === passTypeName.toLowerCase(),
        );
        if (matchedPassType?.color) {
          setPassTypeColor(matchedPassType.color);
        }
      } catch (error) {
        // Keep default color on error
      }
    };

    fetchPassTypeColor();
  }, [passTypeName]);

  const firstVisitor = passRequestData?.visitors?.[0];
  const carPasses = firstVisitor?.car_passes || [];

  const visitorName =
    firstVisitor?.first_name && firstVisitor?.last_name
      ? `${firstVisitor.first_name} ${firstVisitor.last_name}`.trim()
      : "N/A";
  const passNumber = firstVisitor?.pass_number || null;
  const identificationType = firstVisitor?.identification_type || null;
  const identificationNumber = firstVisitor?.identification_number || null;
  const identificationPhotoUrl = firstVisitor?.identification_photo_url || null;
  const requestedBy = passRequestData?.requested_by || null;
  const season = passRequestData?.season || null;
  const qrCodeString = firstVisitor?.pass_qr_string || "";

  // Get visitor initial for avatar
  const getVisitorInitial = () => {
    if (firstVisitor?.first_name) {
      return firstVisitor.first_name.charAt(0).toUpperCase();
    }
    return "V";
  };

  // Format dates in DD/MM/YYYY HH:MM format
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return "N/A";
    }
  };

  const validFrom = passRequestData?.valid_from
    ? formatDateTime(passRequestData.valid_from)
    : "N/A";
  const validTo = passRequestData?.valid_to
    ? formatDateTime(passRequestData.valid_to)
    : "N/A";

  // Format vehicle details
  const formatVehicleDetails = () => {
    if (carPasses.length === 0) return null;
    const car = carPasses[0];
    const vehicleNumber = car?.car_number || "";
    const make = car?.car_make || "";
    const model = car?.car_model || "";
    const color = car?.car_color || "";
    const tag = car?.tag || null;
    return {
      number: vehicleNumber,
      details: `${make}${make && model ? ", " : ""}${model}${
        (make || model) && color ? ", " : ""
      }${color}`,
      tag: tag,
    };
  };

  const vehicleDetails = formatVehicleDetails();

  // Get visitor type (category - pass type)
  const visitorType =
    categoryName && passTypeName
      ? `${categoryName} - ${passTypeName}`
      : categoryName || passTypeName || "General visitors";

  const handleClose = () => {
    // Navigate back to IssueVisitorPassScreen - form will reset via useFocusEffect
    navigation.replace("IssueVisitorPass", {});
  };

  const handleShare = async () => {
    try {
      // Get request_id and visitor_id
      const requestId = passRequestData?.id || passRequestData?.request_id;
      const visitorId = firstVisitor?.id || firstVisitor?.visitor_id;

      if (!requestId || !visitorId) {
        Alert.alert("Error", "Missing request ID or visitor ID");
        return;
      }

      // Call the resend WhatsApp API
      try {
        await api.resendWhatsApp(String(requestId), String(visitorId));
        Alert.alert("Success", "Pass has been sent via WhatsApp successfully");
      } catch (apiError) {
        const errorMessage =
          apiError instanceof Error
            ? apiError.message
            : "Failed to send pass via WhatsApp. Please try again.";
        Alert.alert("Error", errorMessage);
        return;
      }

      // Native share functionality - commented out for now
      // Continue with native share functionality
      // const shareMessage = `Visitor Pass${season ? ` - ${season}` : ""}
      //
      // Name: ${visitorName}
      // ${passNumber ? `Pass Number: ${passNumber}` : ""}
      // Date: ${validFrom} - ${validTo}
      // ${requestedBy ? `Requested By: ${requestedBy}` : ""}
      // ${
      //   identificationType && identificationNumber
      //     ? `${identificationType}: ${identificationNumber}`
      //     : ""
      // }
      // ${
      //   vehicleDetails
      //     ? `Vehicle: ${vehicleDetails.number}\n${vehicleDetails.details}`
      //     : ""
      // }
      // ${qrCodeString ? `QR Code: ${qrCodeString}` : ""}
      //
      // This pass is authorized for entry.`;
      //
      // let imageUri: string | null = null;
      //
      // try {
      //   if (cardContainerRef.current) {
      //     const uri = await captureRef(cardContainerRef, {
      //       format: "png",
      //       quality: 1.0,
      //       result: "tmpfile",
      //     });
      //     imageUri = uri;
      //   }
      // } catch (captureError) {
      //   // Continue with text-only share if capture fails
      // }
      //
      // const shareOptions: any = {
      //   message: shareMessage,
      //   title: "Visitor Pass",
      // };
      //
      // if (imageUri) {
      //   const fileUri =
      //     Platform.OS === "android" && !imageUri.startsWith("file://")
      //       ? `file://${imageUri}`
      //       : imageUri;
      //   shareOptions.url = fileUri;
      //
      //   if (Platform.OS === "android") {
      //     shareOptions.message = `${shareMessage}\n\n[Image attached]`;
      //   }
      // }
      //
      // const result = await Share.share(shareOptions);
      //
      // if (imageUri) {
      //   try {
      //     await FileSystem.deleteAsync(imageUri, { idempotent: true });
      //   } catch (cleanupError) {
      //     // Failed to delete temporary file
      //   }
      // }
    } catch (error) {
      Alert.alert("Error", "Failed to share pass. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Preview Pass</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <CloseIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pass Card Container */}
        <View
          ref={cardContainerRef}
          style={styles.passContainer}
          collapsable={false}
        >
          {/* Blue Header Section */}
          <View
            style={[styles.headerSection, { backgroundColor: passTypeColor }]}
          >
            {/* Background Icon */}
            <View style={styles.headerBackgroundIcon}>
              <AssemblyIconBG />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.visitorsPassTitle}>{passTypeName}</Text>
              <View style={styles.logoSection}>
                <View style={styles.logoCircle}>
                  <AssemblyIcon width={60} height={60} />
                </View>
                <View>
                  <Text style={styles.teluguText}>ఆంధ్ర ప్రదేశ్ శాసనసభ</Text>
                  <Text style={styles.legislatureText}>
                    ANDHRA PRADESH LEGISLATURE
                  </Text>
                  <Text style={styles.locationText}>
                    Velagapudi, Amaravathi
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* White Content Section */}
          <View style={styles.contentSection}>
            {/* Session and Visitor Type */}
            {season && <Text style={styles.sessionText}>{season}</Text>}
            <Text style={styles.visitorTypeText}>{visitorType}</Text>
            <View style={styles.divider} />

            {/* Visitor Info Section */}
            <View style={styles.visitorInfoSection}>
              {/* Avatar Circle */}
              <View style={styles.avatarCircle}>
                {identificationPhotoUrl ? (
                  <Image
                    source={{ uri: identificationPhotoUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>{getVisitorInitial()}</Text>
                )}
              </View>

              {/* Visitor Details */}
              <View style={styles.visitorDetails}>
                <Text style={styles.visitorName}>{visitorName}</Text>
                {passNumber && (
                  <Text
                    style={[
                      styles.visitorDetail,
                      { fontSize: 14, fontWeight: "bold" },
                    ]}
                  >
                    {passNumber}
                  </Text>
                )}
                {passTypeName && (
                  <Text style={styles.visitorDetail}>
                    <Text style={styles.visitorDetailBold}>PASSTYPE: </Text>
                    {passTypeName}
                  </Text>
                )}
                <Text style={styles.visitorDetail}>
                  <Text style={styles.visitorDetailBold}>VALID FROM: </Text>
                  {validFrom}
                </Text>
                <Text style={styles.visitorDetail}>
                  <Text style={styles.visitorDetailBold}>VALID TO: </Text>
                  {validTo}
                </Text>
                {requestedBy && (
                  <Text style={styles.visitorDetail}>
                    <Text style={styles.visitorDetailBold}>REQUESTED BY: </Text>
                    {requestedBy}
                  </Text>
                )}
                {identificationType && identificationNumber && (
                  <Text style={styles.visitorDetail}>
                    <Text style={styles.visitorDetailBold}>
                      {identificationType.toLowerCase()}:{" "}
                    </Text>
                    {identificationNumber}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.divider} />
            {/* Vehicle Pass Details */}
            {vehicleDetails && (
              <>
                <Text style={styles.vehicleTitle}>Vehicle Pass Details</Text>
                <View style={styles.vehicleBox}>
                  <Text style={styles.vehicleText}>
                    Vehicle: {vehicleDetails.number}
                  </Text>
                  {vehicleDetails.details && (
                    <Text style={styles.vehicleText}>
                      {vehicleDetails.details}
                    </Text>
                  )}
                  {vehicleDetails.tag && (
                    <View style={styles.vehicleTagContainer}>
                      <Text style={styles.vehicleTagText}>
                        {vehicleDetails.tag}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* QR Code Section */}
            <QRCodeDisplay
              qrCodeString={qrCodeString}
              qrCodeViewRef={qrCodeViewRef}
            />
          </View>

          {/* Blue Approval Section */}
          <View
            style={[styles.approvalSection, { backgroundColor: passTypeColor }]}
          >
            <View style={styles.approvedByBox}>
              <Text style={styles.approvedByLabel}>APPROVED BY</Text>
              <Text style={styles.approvedByName}>
                {requestedBy || "Authorized"}
              </Text>
            </View>
            <View style={styles.signatorySection}>
              <Text style={styles.signatoryName}>
                Prasanna Kumar Suryadevara
              </Text>
              <Text style={styles.signatoryTitle}>
                Secretary-General to State Legislature
              </Text>
            </View>
          </View>

          {/* Instructions Section */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>Instructions:</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>
                1. Visitors are permitted to visit only the person / place
                specified in the pass.
              </Text>
              <Text style={styles.instructionItem}>
                2. This Entry Pass is valid only during the period for which it
                is issued and not transferable.
              </Text>
              <Text style={styles.instructionItem}>
                3. Visitors must carry valid identification proof at all times.
              </Text>
            </View>
          </View>

          {/* Share Button */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <ShareIcon width={14} height={14} />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 10,
    backgroundColor: "#E3F7E8",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  passContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  headerSection: {
    backgroundColor: "#3B82F6",
    padding: 20,
    paddingTop: 30,
    paddingBottom: 25,
    position: "relative",
    overflow: "hidden",
  },
  headerBackgroundIcon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
    opacity: 0.15,
  },
  headerContent: {
    position: "relative",
    zIndex: 1,
  },
  visitorsPassTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
  },
  logoSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  teluguText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  legislatureText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    fontWeight: "bold",
  },
  contentSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  visitorTypeText: {
    fontSize: 14,
    color: "#111827",
    textAlign: "center",
  },
  visitorInfoSection: {
    flexDirection: "row",
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E40AF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  visitorDetails: {
    flex: 1,
    marginLeft: 15,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  visitorDetail: {
    fontSize: 12,
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },
  visitorDetailBold: {
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  vehicleBox: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  vehicleText: {
    fontSize: 12,
    color: "#111827",
    marginBottom: 4,
  },
  vehicleTagContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#1E40AF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  vehicleTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  qrCodeWrapper: {
    alignItems: "center",
    marginVertical: 20,
  },
  qrCodeBorder: {
    borderWidth: 2,
    borderColor: "#10B981",
    borderStyle: "dashed",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  qrCodeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrCodePlaceholder: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    padding: 20,
  },
  qrCodeId: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  approvalSection: {
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    flexDirection: "row",
    gap: 10,
  },
  approvedByBox: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 4,
    minWidth: 100,
    alignItems: "center",
  },
  approvedByLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  approvedByName: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
    textAlign: "center",
  },
  signatorySection: {
    alignItems: "center",
    justifyContent: "center",
  },
  signatoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  signatoryTitle: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
  },
  instructionsSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 12,
    color: "#111827",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  shareButton: {
    width: "60%",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#457E51",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
});
