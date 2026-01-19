import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Dimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, MainCategory, PassTypeItem } from "@/services/api";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import BackButtonIcon from "../../assets/backButton.svg";
import ApprovedIcon from "../../assets/approved.svg";
import VisitorIcon from "../../assets/visitor.svg";
import EyeIcon from "../../assets/eye.svg";
import DownloadIcon from "../../assets/download.svg";
import VisitorPassIcon from "../../assets/visitorPass.svg";
import LogOutIcon from "../../assets/logOut.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";

type VisitorDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "VisitorDetails"
>;

type VisitorDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "VisitorDetails"
>;

type Props = {
  navigation: VisitorDetailsScreenNavigationProp;
  route: VisitorDetailsScreenRouteProp;
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    return `${dayName}, ${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
  } catch {
    return dateString;
  }
};

const formatDateOnly = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    return `${dayName}, ${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
  } catch {
    return dateString;
  }
};

const getInitials = (firstName: string, lastName: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last;
};

export default function VisitorDetailsScreen({ navigation, route }: Props) {
  const { request, visitor } = route.params;

  // Category mappings
  const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
  const [subCategoryMap, setSubCategoryMap] = useState<{
    [key: string]: string;
  }>({});

  // Pass type mappings
  const [passTypeMap, setPassTypeMap] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCategories();
    fetchPassTypes();
  }, []);

  const fetchCategories = async () => {
    try {
      const categories = await api.getMainCategories();

      // Create category ID to name mapping
      const catMap: { [key: string]: string } = {};
      const subCatMap: { [key: string]: string } = {};

      categories.forEach((category: MainCategory) => {
        catMap[category.id] = category.name;

        // Create sub-category ID to name mapping
        if (category.sub_categories && category.sub_categories.length > 0) {
          category.sub_categories.forEach((subCat) => {
            subCatMap[subCat.id] = subCat.name;
          });
        }
      });

      setCategoryMap(catMap);
      setSubCategoryMap(subCatMap);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "—";
    return categoryMap[categoryId] || categoryId;
  };

  const getSubCategoryName = (subCategoryId: string | null) => {
    if (!subCategoryId) return "";
    return subCategoryMap[subCategoryId] || subCategoryId;
  };

  const fetchPassTypes = async () => {
    try {
      const types = await api.getAllPassTypes();
      if (types && types.length > 0) {
        const typeMap: { [key: string]: string } = {};
        types.forEach((type: PassTypeItem) => {
          if (type.id && type.name) {
            typeMap[type.id] = type.name;
          }
        });
        setPassTypeMap(typeMap);
      }
    } catch (error) {
      console.error("Error fetching pass types:", error);
      // Set empty map on error to prevent infinite retries
      setPassTypeMap({});
    }
  };

  const getPassTypeName = (passTypeId: string | null | undefined) => {
    if (!passTypeId) return "—";
    // Check if pass type map has been populated
    if (Object.keys(passTypeMap).length === 0) {
      // If map is empty, return ID as fallback (might still be loading)
      return passTypeId;
    }
    return passTypeMap[passTypeId] || passTypeId;
  };

  const handleOpenDocument = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "Could not open document");
      });
    }
  };

  const handleOpenFullSize = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "Could not open image");
      });
    }
  };

  const handleLogout = () => {
    // Navigate back to login method selection
    navigation.replace("LoginMethodSelection");
  };

  const isApproved = visitor.visitor_status === "approved";
  const isRejected = visitor.visitor_status === "rejected";

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
          <Text style={styles.headerTitle}>Visitor Details</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOutIcon width={22} height={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Three/Four Card Layout */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Visitor Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIcon, { backgroundColor: "#457E51" }]}>
                  <Text style={styles.cardIconText}>
                    {getInitials(
                      visitor.first_name || "",
                      visitor.last_name || "",
                    )}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>Visitor Information</Text>
                  <Text style={styles.cardSubtitle}>Personal Details</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardHeaderSeparator} />

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <VisitorIcon width={24} height={24} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>FULL NAME</Text>
                  <Text style={styles.infoValue}>
                    {visitor.first_name} {visitor.last_name}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail-outline" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>EMAIL</Text>
                  <Text style={styles.infoValue}>{visitor.email || "—"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="call-outline" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>PHONE</Text>
                  <Text style={styles.infoValue}>{visitor.phone || "—"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialCommunityIcons
                    name="id-card"
                    size={24}
                    color="#6B7280"
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>IDENTIFICATION</Text>
                  <Text style={styles.infoValue}>
                    {visitor.identification_type || "—"}{" "}
                    {visitor.identification_number || ""}
                  </Text>
                </View>
              </View>

              {visitor.identification_document_url && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <DownloadIcon width={24} height={24} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>
                      IDENTIFICATION DOCUMENT
                    </Text>
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: visitor.identification_document_url }}
                        style={styles.photo}
                      />
                      <TouchableOpacity
                        style={styles.photoButton}
                        onPress={() =>
                          handleOpenDocument(
                            visitor.identification_document_url,
                          )
                        }
                      >
                        <Text style={styles.photoButtonText}>
                          Open Full Size
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {visitor.identification_photo_url && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <EyeIcon width={24} height={24} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>CURRENT PHOTO</Text>
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: visitor.identification_photo_url }}
                        style={styles.photo}
                      />
                      <TouchableOpacity
                        style={styles.photoButton}
                        onPress={() =>
                          handleOpenFullSize(visitor.identification_photo_url)
                        }
                      >
                        <Text style={styles.photoButtonText}>
                          Open Full Size
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Card 2: Request Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIcon, { backgroundColor: "#457E51" }]}>
                  <MaterialIcons name="description" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Request Information</Text>
                  <Text style={styles.cardSubtitle}>Request Details</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardHeaderSeparator} />

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="tag" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>REQUEST ID</Text>
                  <Text style={[styles.infoValue, styles.requestIdValue]}>
                    {request.request_id}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <VisitorIcon width={24} height={24} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>REQUESTED BY</Text>
                  <Text style={styles.infoValue}>
                    {request.requested_by || "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="category" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>CATEGORY</Text>
                  <Text style={styles.infoValue}>
                    {getCategoryName(request.main_category_id)}
                    {request.sub_category_id &&
                      ` • ${getSubCategoryName(request.sub_category_id)}`}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <VisitorPassIcon width={24} height={24} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>PASS TYPE</Text>
                  <Text style={styles.infoValue}>
                    {getPassTypeName(
                      request.pass_type_id ||
                        (request.visitors && request.visitors.length > 0
                          ? request.visitors[0]?.pass_type_id
                          : null),
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="description" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>PURPOSE</Text>
                  <Text style={styles.infoValue}>{request.purpose || "—"}</Text>
                </View>
              </View>

              {isRejected && visitor.visitor_rejection_reason && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="close-circle" size={24} color="#DC2626" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>REJECTION REASON</Text>
                    <View style={styles.rejectionReasonBox}>
                      <Text style={styles.rejectionReasonText}>
                        {visitor.visitor_rejection_reason}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {request.hod_letter_url && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <DownloadIcon width={24} height={24} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>REQUEST LETTER</Text>
                    <TouchableOpacity
                      style={styles.documentButton}
                      onPress={() => handleOpenDocument(request.hod_letter_url)}
                    >
                      <Text style={styles.documentButtonText}>
                        View Document
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Card 3: Timeline */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIcon, { backgroundColor: "#457E51" }]}>
                  <MaterialIcons name="event" size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Timeline</Text>
                  <Text style={styles.cardSubtitle}>Dates & Status</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardHeaderSeparator} />

            <View style={styles.cardContent}>
              <View style={styles.timelineContainer}>
                {/* Vertical line connecting all dots - positioned at center of dots */}
                <View style={styles.timelineVerticalLine} />

                {/* Timeline Items */}
                <View style={styles.timelineItemsWrapper}>
                  <View style={styles.timelineItem}>
                    <View
                      style={[styles.timelineDot, styles.timelineDotGrey]}
                    />
                    <View style={styles.timelineIconContainer}>
                      <Ionicons name="time-outline" size={24} color="#6B7280" />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>SUBMITTED</Text>
                      <Text style={styles.timelineText}>
                        Submitted by: {request.requested_by || "—"}
                      </Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(request.created_at)}
                      </Text>
                    </View>
                  </View>

                  {isApproved && visitor.visitor_legislative_approved_at && (
                    <View style={styles.timelineItem}>
                      <View
                        style={[styles.timelineDot, styles.timelineDotGreen]}
                      />
                      <View style={styles.timelineIconContainer}>
                        <ApprovedIcon width={24} height={24} />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>FINAL APPROVAL</Text>
                        <Text style={styles.timelineText}>
                          Approved by:{" "}
                          {visitor.visitor_legislative_approved_by || "—"}
                        </Text>
                        <Text style={styles.timelineDate}>
                          {formatDate(visitor.visitor_legislative_approved_at)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {isRejected && visitor.visitor_rejected_at && (
                    <View style={styles.timelineItem}>
                      <View
                        style={[styles.timelineDot, styles.timelineDotRed]}
                      />
                      <View style={styles.timelineIconContainer}>
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#DC2626"
                        />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>REJECTED</Text>
                        <Text style={styles.timelineText}>
                          Rejected by: {visitor.visitor_rejected_by || "—"}
                        </Text>
                        {visitor.visitor_rejection_reason && (
                          <View style={styles.rejectionReasonBox}>
                            <Text style={styles.rejectionReasonText}>
                              Reason: {visitor.visitor_rejection_reason}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.timelineDate}>
                          {formatDate(visitor.visitor_rejected_at)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {request.valid_from && (
                    <View style={styles.timelineItem}>
                      <View
                        style={[styles.timelineDot, styles.timelineDotBlue]}
                      />
                      <View style={styles.timelineIconContainer}>
                        <MaterialIcons name="event" size={24} color="#6B7280" />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>VALID FROM</Text>
                        <Text style={styles.timelineDate}>
                          {formatDateOnly(request.valid_from)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {request.valid_to && (
                    <View style={styles.timelineItem}>
                      <View
                        style={[styles.timelineDot, styles.timelineDotPurple]}
                      />
                      <View style={styles.timelineIconContainer}>
                        <MaterialIcons name="event" size={24} color="#6B7280" />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>VALID TO</Text>
                        <Text style={styles.timelineDate}>
                          {formatDateOnly(request.valid_to)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Card 4: Pass Information (only if approved) */}
          {isApproved && visitor.pass_number && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#457E51" }]}
                  >
                    <ApprovedIcon width={20} height={20} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Pass Information</Text>
                    <Text style={styles.cardSubtitle}>Pass Details</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardHeaderSeparator} />

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="tag" size={24} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>PASS NUMBER</Text>
                    <Text style={[styles.infoValue, styles.passNumberValue]}>
                      {visitor.pass_number}
                    </Text>
                    <Text style={styles.passNumberSubtext}>
                      Unique pass identifier
                    </Text>
                  </View>
                </View>

                {visitor.pass_qr_string && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <MaterialIcons name="qr-code" size={24} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>QR CODE STRING</Text>
                      <Text style={styles.infoValue}>
                        {visitor.pass_qr_string}
                      </Text>
                    </View>
                  </View>
                )}

                {visitor.pass_qr_code && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <MaterialIcons
                        name="qr-code-scanner"
                        size={16}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>QR CODE</Text>
                      <Image
                        source={{ uri: visitor.pass_qr_code }}
                        style={styles.qrCodeImage}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <VisitorPassIcon width={16} height={16} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>PASS TYPE</Text>
                    <Text style={styles.infoValue}>
                      {getPassTypeName(
                        visitor.pass_type_id || request.pass_type_id,
                      )}
                    </Text>
                  </View>
                </View>

                {visitor.pass_generated_at && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>PASS GENERATED AT</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(visitor.pass_generated_at)}
                      </Text>
                    </View>
                  </View>
                )}

                {visitor.visitor_legislative_approved_by && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <ApprovedIcon width={16} height={16} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>PASS APPROVED BY</Text>
                      <Text style={styles.infoValue}>
                        {visitor.visitor_legislative_approved_by}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    zIndex: 1,
  },
  backButton: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  scrollView: {
    zIndex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 0,
  },
  cardHeaderSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 20,
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIconText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  cardContent: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    gap: 18,
  },
  infoIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  requestIdValue: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  passNumberValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  passNumberSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  documentButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  documentButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  photoContainer: {
    marginTop: 8,
  },
  photo: {
    width: 180,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoButton: {
    backgroundColor: "#457E51",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  rejectionReasonBox: {
    backgroundColor: "#FEE2E2",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  rejectionReasonText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "500",
  },
  timelineContainer: {
    position: "relative",
    paddingLeft: 0,
  },
  timelineVerticalLine: {
    position: "absolute",
    left: 15, // Center of 32px dot (16px from left edge)
    top: 16, // Start from center of first dot
    bottom: 16, // End at center of last dot
    width: 2,
    backgroundColor: "#E5E7EB",
    zIndex: 0,
  },
  timelineItemsWrapper: {
    position: "relative",
    zIndex: 1,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    zIndex: 2,
    backgroundColor: "#E5E7EB",
  },
  timelineDotGrey: {
    backgroundColor: "#E5E7EB",
  },
  timelineDotGreen: {
    backgroundColor: "#D1FAE5",
  },
  timelineDotRed: {
    backgroundColor: "#FEE2E2",
  },
  timelineDotBlue: {
    backgroundColor: "#DBEAFE",
  },
  timelineDotPurple: {
    backgroundColor: "#E9D5FF",
  },
  timelineIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  timelineText: {
    fontSize: 13,
    color: "#111827",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  qrCodeImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginTop: 8,
  },
});
