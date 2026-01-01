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

// QR Code Component - generates QR code from qr_code_id
const QRCodeDisplay = ({
  qrCodeId,
  qrCodeUrl,
  qrCodeViewRef,
}: {
  qrCodeId?: string;
  qrCodeUrl?: string | null;
  qrCodeViewRef?: React.RefObject<View | null>;
}) => {
  // Use qr_code_id to generate QR code, fallback to URL if ID not available
  const qrData = qrCodeId || qrCodeUrl || "";

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

  // Get pass data from route params
  const passData = route.params?.passData;

  // Extract data from passData or use fallback
  const visitorName = passData?.full_name || "N/A";
  const mobileNumber = passData?.phone || "N/A";
  const purpose = passData?.purpose_of_visit || "N/A";
  const numberOfVisitors = passData?.number_of_visitors?.toString() || "1";
  const qrCodeUrl = passData?.qr_code_url || null;
  const qrCodeId = passData?.qr_code_id || "";

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

  const date = passData?.valid_from
    ? formatDateFromISO(passData.valid_from)
    : "N/A";
  const startTime = passData?.valid_from
    ? formatTimeFromISO(passData.valid_from)
    : "N/A";
  const endTime = passData?.valid_until
    ? formatTimeFromISO(passData.valid_until)
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
      const shareMessage = `Visitor Pass - Assembly Session

Name: ${visitorName}
Phone: ${formatPhoneNumber(mobileNumber)}
Date: ${date}
Time Slot: ${startTime} - ${endTime}
Purpose: ${purpose}
Visitors: ${numberOfVisitors} Person${parseInt(numberOfVisitors) > 1 ? "s" : ""}
${qrCodeId ? `QR Code ID: ${qrCodeId}` : ""}

This pass is authorized for entry.`;

      let imageUri: string | null = null;

      // Try to capture QR code as image
      try {
        if (qrCodeViewRef.current) {
          // Capture the QR code view as an image
          const uri = await captureRef(qrCodeViewRef, {
            format: "png",
            quality: 1.0,
            result: "tmpfile",
          });

          imageUri = uri;
        }
      } catch (qrError) {
        // Continue with text-only share if QR capture fails
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
      } else if (qrCodeUrl) {
        // Fallback to QR code URL if image capture failed
        shareOptions.url = qrCodeUrl;
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
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Assembly session</Text>
          {/* QR Code */}
          <QRCodeDisplay
            qrCodeId={qrCodeId}
            qrCodeUrl={qrCodeUrl}
            qrCodeViewRef={qrCodeViewRef}
          />

          {/* Name and Phone Number */}
          <View style={styles.nameSection}>
            <Text style={styles.visitorName}>{visitorName}</Text>
            <Text style={styles.phoneNumber}>
              {formatPhoneNumber(mobileNumber)}
            </Text>
          </View>

          {/* Date and Time Slot Row */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>{date}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={styles.fieldLabel}>Time Slot</Text>
              <Text style={styles.fieldValue}>
                {startTime} - {endTime}
              </Text>
            </View>
          </View>

          {/* Purpose */}
          <View style={styles.purposeSection}>
            <Text style={styles.fieldLabel}>Purpose</Text>
            <Text style={styles.fieldValue}>{purpose}</Text>
          </View>

          {/* Visitors and Authorized Badge Row */}
          <View style={styles.visitorsRow}>
            <View style={styles.visitorsItem}>
              <Text style={styles.fieldLabel}>Visitors</Text>
              <Text style={styles.fieldValue}>
                {numberOfVisitors} Person
                {parseInt(numberOfVisitors) > 1 ? "(s)" : ""}
              </Text>
            </View>
            <View style={styles.authorizedBadge}>
              <View style={styles.authorizedBadgeInner}>
                <Text style={styles.authorizedText}>AUTHORIZED</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
              <PrintIcon width={14} height={14} />
              <Text style={styles.actionButtonText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handlePDF}>
              <DownloadIcon width={14} height={14} />
              <Text style={styles.actionButtonText}>PDF</Text>
            </TouchableOpacity> */}
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  phoneNumber: {
    fontSize: 14,
    color: "#6B7280",
  },
  dateTimeRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
    gap: 16,
  },
  dateTimeItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  purposeSection: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  visitorsRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  visitorsItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  authorizedBadge: {
    backgroundColor: "#E3F7E8",
    padding: 4,
    borderRadius: 16,
    marginLeft: 12,
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
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
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
