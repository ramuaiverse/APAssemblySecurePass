import React, { useEffect, useRef } from "react";
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
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import QRCode from "react-native-qrcode-svg";
import CloseIcon from "../../assets/close.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import BackGroundIcon from "../../assets/backGround.svg";
import PrintIcon from "../../assets/print.svg";
import DownloadIcon from "../../assets/download.svg";
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

  // Log pass data for debugging
  useEffect(() => {
    console.log(
      "PreviewPassScreen - Pass Data:",
      JSON.stringify(passData, null, 2)
    );
    console.log("PreviewPassScreen - QR Code URL:", qrCodeUrl);
    console.log("PreviewPassScreen - QR Code ID:", qrCodeId);
  }, [passData, qrCodeUrl, qrCodeId]);

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

  const generateHTML = () => {
    const passId =
      qrCodeId ||
      `AP${date.replace(/-/g, "")}${Math.floor(Math.random() * 10000)}`;

    // Generate QR code data for HTML (use qr_code_id or URL)
    const qrDataForHTML = qrCodeId || qrCodeUrl || "";
    // For HTML, we'll display the QR code ID as text since we can't embed SVG easily
    const qrCodeSection = qrDataForHTML
      ? `<div style="text-align: center; padding: 20px;">
          <p style="font-size: 12px; color: #111827; font-weight: 600; margin-bottom: 10px;">QR Code ID</p>
          <p style="font-size: 10px; color: #6B7280; word-break: break-all; background-color: #F9FAFB; padding: 10px; border-radius: 8px;">${qrDataForHTML}</p>
          <p style="font-size: 11px; color: #9CA3AF; margin-top: 10px;">Scan this code using the mobile app</p>
        </div>`
      : `<p style="text-align: center; padding: 50px; background-color: #F3F4F6; border-radius: 10px;">QR Code</p>`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #111827;
              margin: 0;
            }
            .qr-section {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background-color: #F9FAFB;
              border-radius: 10px;
            }
            .info-section {
              background-color: #F9FAFB;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .info-row {
              margin-bottom: 15px;
            }
            .info-label {
              font-size: 12px;
              color: #6B7280;
              margin-bottom: 5px;
            }
            .info-value {
              font-size: 16px;
              color: #111827;
              font-weight: 600;
            }
            .details-section {
              background-color: #FFFFFF;
              padding: 20px;
              border-radius: 10px;
              border: 1px solid #E5E7EB;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 1px solid #F3F4F6;
            }
            .detail-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .detail-label {
              font-size: 14px;
              color: #6B7280;
            }
            .detail-value {
              font-size: 14px;
              color: #111827;
              font-weight: 500;
              text-align: right;
            }
            .authorized-badge {
              display: inline-block;
              background-color: #00A551;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
              margin-left: 10px;
            }
            .pass-id {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Visitor Pass</h1>
          </div>
          
          <div class="qr-section">
            <p><strong>QR Code</strong></p>
            ${qrCodeSection}
            <p style="font-size: 10px; color: #9CA3AF; margin-top: 10px;">Pass ID: ${passId}</p>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Name</div>
              <div class="info-value">${visitorName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Mobile Number</div>
              <div class="info-value">${mobileNumber}</div>
            </div>
          </div>
          
          <div class="details-section">
            <div class="detail-row">
              <div class="detail-label">Date</div>
              <div class="detail-value">${date}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Time Slot</div>
              <div class="detail-value">${startTime} - ${endTime}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Purpose</div>
              <div class="detail-value">${purpose}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Visitors</div>
              <div class="detail-value">
                ${numberOfVisitors} Person${
      parseInt(numberOfVisitors) > 1 ? "s" : ""
    }
                <span class="authorized-badge">AUTHORIZED</span>
              </div>
            </div>
          </div>
          
          <div class="pass-id">
            Pass ID: ${passId}
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      const html = generateHTML();
      await Print.printAsync({
        html,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to print. Please try again.");
    }
  };

  const handlePDF = async () => {
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (Platform.OS === "ios") {
        // On iOS, share the PDF using Share API
        const shareOptions: any = {
          url: uri,
        };
        await Share.share(shareOptions);
      } else {
        // On Android, try to share the PDF, fallback to alert
        try {
          await Share.share({
            url: uri,
            message: `Visitor Pass PDF for ${visitorName}`,
          } as any);
        } catch (shareError) {
          // If sharing fails, show file location
          Alert.alert(
            "PDF Generated",
            `PDF saved to: ${uri}\n\nYou can find it in your Downloads folder.`,
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    }
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
          console.log("QR code image captured:", imageUri);
        }
      } catch (qrError) {
        console.warn("Could not capture QR code image:", qrError);
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
        console.log("Sharing image URI:", fileUri);
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
          console.warn(
            "Could not delete temporary QR code file:",
            cleanupError
          );
        }
      }

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared with activity type:", result.activityType);
        } else {
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      // console.error("Error sharing:", error);
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
  qrCodeImage: {
    width: 150,
    height: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
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
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderWidth: 1,
    borderColor: "#457E51",
    borderRadius: 8,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
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
