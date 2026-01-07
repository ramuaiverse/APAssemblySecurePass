import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import QRCode from "react-native-qrcode-svg";
import CloseIcon from "../../assets/close.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import BackGroundIcon from "../../assets/backGround.svg";
import ShareIcon from "../../assets/share.svg";

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
  // Use pass_qr_string to generate QR code
  const qrData = qrCodeString || "";

  if (!qrData) {
    return (
      <View style={styles.qrCodeContainer}>
        <Text style={styles.qrCodePlaceholder}>QR Code not available</Text>
      </View>
    );
  }

  return (
    <View
      ref={qrCodeViewRef}
      style={styles.qrCodeContainer}
      collapsable={false}
    >
      <QRCode
        value={qrData}
        size={150}
        color="#000000"
        backgroundColor="#FFFFFF"
        logo={undefined}
      />
    </View>
  );
};

export default function PreviewPassScreen({ navigation, route }: Props) {
  // Ref for QR code view to capture as image
  const qrCodeViewRef = useRef<View>(null);
  // Ref for entire card container to capture as image
  const cardContainerRef = useRef<View>(null);

  // Get pass data from route params (full API response)
  const passRequestData = route.params?.passData;
  const categoryName = route.params?.categoryName || null;
  const passTypeName = route.params?.passTypeName || null;

  // Extract first visitor from visitors array
  const firstVisitor = passRequestData?.visitors?.[0];

  // Extract data from API response
  const visitorName =
    firstVisitor?.first_name && firstVisitor?.last_name
      ? `${firstVisitor.first_name} ${firstVisitor.last_name}`.trim()
      : "N/A";
  const purpose = passRequestData?.purpose || "N/A";
  const numberOfVisitors = passRequestData?.visitors?.length?.toString() || "1";
  const qrCodeString = firstVisitor?.pass_qr_string || "";
  const passNumber = firstVisitor?.pass_number || null;
  const identificationType = firstVisitor?.identification_type || null;
  const identificationNumber = firstVisitor?.identification_number || null;
  const requestedBy = passRequestData?.requested_by || null;
  const season = passRequestData?.season || null;

  // Format dates from ISO strings
  const formatDateFromISO = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const formatTimeFromISO = (isoString: string) => {
    try {
      const date = new Date(isoString);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours || 12;
      const minutesStr = String(minutes).padStart(2, "0");
      return `${hours}:${minutesStr} ${ampm}`;
    } catch {
      return isoString;
    }
  };

  const date = passRequestData?.valid_from
    ? formatDateFromISO(passRequestData.valid_from)
    : "N/A";
  const startTime = passRequestData?.valid_from
    ? formatTimeFromISO(passRequestData.valid_from)
    : "N/A";
  const endTime = passRequestData?.valid_to
    ? formatTimeFromISO(passRequestData.valid_to)
    : "N/A";

  // Format phone number to show only digits
  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, "");
  };

  // Format time to remove AM/PM
  const formatTime = (time: string) => {
    return time.replace(/\s*(AM|PM|am|pm)/gi, "").trim();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Visitor Pass${season ? ` - ${season}` : ""}

Name: ${visitorName}
${passNumber ? `Pass Number: ${passNumber}` : ""}
Date: ${date}
Time Slot: ${startTime} - ${endTime}
Purpose: ${purpose}
${
  identificationType && identificationNumber
    ? `${
        identificationType.charAt(0).toUpperCase() + identificationType.slice(1)
      }: ${identificationNumber}`
    : ""
}
${requestedBy ? `Requested By: ${requestedBy}` : ""}
Visitors: ${numberOfVisitors} Person${parseInt(numberOfVisitors) > 1 ? "s" : ""}
${qrCodeString ? `QR Code: ${qrCodeString}` : ""}

This pass is authorized for entry.`;

      let imageUri: string | null = null;

      // Try to capture entire card container as image (includes all details)
      try {
        if (cardContainerRef.current) {
          // Capture the entire card container as an image
          const uri = await captureRef(cardContainerRef, {
            format: "png",
            quality: 1.0,
            result: "tmpfile",
          });

          imageUri = uri;
        }
      } catch (captureError) {
        // Continue with text-only share if capture fails
      }

      const shareOptions: any = {
        message: shareMessage,
        title: "Visitor Pass",
      };

      // Add image if available - works for both iOS and Android
      if (imageUri) {
        // For both platforms, use url property for images
        // Ensure proper file URI format for Android
        const fileUri =
          Platform.OS === "android" && !imageUri.startsWith("file://")
            ? `file://${imageUri}`
            : imageUri;
        shareOptions.url = fileUri;

        // On Android, also include the message in the share
        if (Platform.OS === "android") {
          shareOptions.message = `${shareMessage}\n\n[Image attached]`;
        }
      }

      const result = await Share.share(shareOptions);

      // Clean up temporary file after sharing (optional, system will clean up eventually)
      if (imageUri) {
        try {
          await FileSystem.deleteAsync(imageUri, { idempotent: true });
        } catch (cleanupError) {
          // Failed to delete temporary file - system will clean up eventually
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share pass. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Preview Pass</Text>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <CloseIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* White Card Container */}
        <View
          ref={cardContainerRef}
          style={styles.cardContainer}
          collapsable={false}
        >
          {/* Session Title */}
          {season && <Text style={styles.sessionTitle}>{season}</Text>}

          {/* QR Code */}
          <QRCodeDisplay
            qrCodeString={qrCodeString}
            qrCodeViewRef={qrCodeViewRef}
          />

          {/* Visitor Name */}
          <View style={styles.nameSection}>
            <Text style={styles.visitorName}>{visitorName}</Text>
          </View>

          {/* Pass Details - Simple Text Format */}
          <View style={styles.detailsContainer}>
            {passNumber && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Pass No: </Text>
                <Text>{passNumber}</Text>
              </Text>
            )}
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Date: </Text>
              <Text>{date}</Text>
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Time Slot: </Text>
              <Text>
                {startTime} - {endTime}
              </Text>
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Purpose: </Text>
              <Text>{purpose}</Text>
            </Text>
            {identificationType && identificationNumber && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>
                  {identificationType.charAt(0).toUpperCase() +
                    identificationType.slice(1)}
                  :{" "}
                </Text>
                <Text>{identificationNumber}</Text>
              </Text>
            )}
            {requestedBy && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Requested By: </Text>
                <Text>{requestedBy}</Text>
              </Text>
            )}
            {categoryName && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Category: </Text>
                <Text>{categoryName}</Text>
              </Text>
            )}
            {passTypeName && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Pass Type: </Text>
                <Text>{passTypeName}</Text>
              </Text>
            )}
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Visitors: </Text>
              <Text>
                {numberOfVisitors} Person
                {parseInt(numberOfVisitors) > 1 ? "s" : ""}
              </Text>
            </Text>
          </View>

          {/* Authorized Badge */}
          <View style={styles.authorizedBadge}>
            <View style={styles.authorizedBadgeInner}>
              <Text style={styles.authorizedText}>AUTHORIZED</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <ShareIcon width={14} height={14} />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Background Icon - Behind Card */}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  headerButton: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  cardContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
    position: "relative",
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  qrCodeContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
    minWidth: 150,
    borderWidth: 1,
    borderColor: "#111827",

    padding: 6,
  },
  qrCodePlaceholder: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    padding: 20,
  },
  nameSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  visitorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  detailsContainer: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  detailText: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: "bold",
  },
  authorizedBadge: {
    backgroundColor: "#E3F7E8",
    padding: 4,
    borderRadius: 16,
    marginBottom: 24,
    alignSelf: "center",
    marginTop: 8,
  },
  authorizedBadgeInner: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  authorizedText: {
    color: "#065F46",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    paddingTop: 20,
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
  backgroundContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
    pointerEvents: "none",
  },
});
