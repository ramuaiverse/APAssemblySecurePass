import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
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
} from "@expo/vector-icons";
import BackButtonIcon from "../../assets/backButton.svg";
import LogOutIcon from "../../assets/logOut.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";

type MyPassRequestDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MyPassRequestDetails"
>;

type MyPassRequestDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "MyPassRequestDetails"
>;

type Props = {
  navigation: MyPassRequestDetailsScreenNavigationProp;
  route: MyPassRequestDetailsScreenRouteProp;
};

const formatDateForDisplay = (dateString: string) => {
  try {
    const date = new Date(dateString);
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
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`;
  } catch {
    return dateString;
  }
};

const getInitials = (firstName: string, lastName: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last;
};

export default function MyPassRequestDetailsScreen({
  navigation,
  route,
}: Props) {
  const { request } = route.params;

  // Get all visitors from request
  const visitors = request.visitors || [];

  // Expandable state for each visitor section
  const [expandedVisitors, setExpandedVisitors] = useState<{
    [key: string]: boolean;
  }>(() => {
    const initial: { [key: string]: boolean } = {};
    visitors.forEach((v: any) => {
      initial[v.id] = true; // Start with all expanded
    });
    return initial;
  });

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
      // Error fetching categories
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
      setPassTypeMap({});
    }
  };

  const getPassTypeName = (passTypeId: string | null | undefined) => {
    if (!passTypeId) return "—";
    if (Object.keys(passTypeMap).length === 0) {
      return passTypeId;
    }
    return passTypeMap[passTypeId] || passTypeId;
  };

  // Get visitor status - default to "pending" if not explicitly set or if visitor_approved_by is not set
  const getVisitorStatus = (visitor: any) => {
    if (!visitor) return "pending";
    // If visitor_status is not set or is null/undefined, default to pending
    if (!visitor.visitor_status) return "pending";
    // If status is "approved" but visitor_approved_by is not set, it should still be pending
    // This handles cases where status might be "approved" but no approver is set
    if (visitor.visitor_status === "approved" && !visitor.visitor_approved_by) {
      return "pending";
    }
    // Also check if status is explicitly "pending"
    if (visitor.visitor_status === "pending") {
      return "pending";
    }
    return visitor.visitor_status;
  };

  // Get request-level status - check all visitors
  const getRequestStatus = () => {
    if (!visitors || visitors.length === 0) return "pending";

    // Check if all visitors are approved (have visitor_approved_by set)
    const allApproved = visitors.every(
      (v: any) =>
        v.visitor_status === "approved" &&
        v.visitor_approved_by !== null &&
        v.visitor_approved_by !== undefined,
    );

    // Check if any visitor is rejected
    const anyRejected = visitors.some(
      (v: any) => v.visitor_status === "rejected",
    );

    if (anyRejected) return "rejected";
    if (allApproved) return "approved";

    // Default to pending if any visitor is pending or doesn't have approver
    return "pending";
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Do you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: () => {
          navigation.replace("LoginMethodSelection");
        },
      },
    ]);
  };

  const toggleVisitorExpansion = (visitorId: string) => {
    setExpandedVisitors((prev) => ({
      ...prev,
      [visitorId]: !prev[visitorId],
    }));
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
          <Text style={styles.headerTitle}>Request Details</Text>
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
        {/* Two Column Layout */}
        <View style={styles.twoColumnContainer}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Card 1: Request Information */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#9333EA" }]}
                  >
                    <MaterialIcons
                      name="description"
                      size={20}
                      color="#FFFFFF"
                    />
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
                    <MaterialIcons name="tag" size={20} color="#9CA3AF" />
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
                    <Ionicons name="person-outline" size={20} color="#86EFAC" />
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
                    <MaterialIcons
                      name="local-offer"
                      size={20}
                      color="#93C5FD"
                    />
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
              </View>
            </View>

            {/* Card 2: Dates & Timeline */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#3B82F6" }]}
                  >
                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Dates & Timeline</Text>
                    <Text style={styles.cardSubtitle}>
                      Visit Dates & Status
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardHeaderSeparator} />

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="event" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>REQUESTED DATE</Text>
                    <Text style={styles.infoValue}>
                      {formatDateForDisplay(request.created_at)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>REQUEST STATUS</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {(() => {
                          // Use request-level status field
                          const status = request.status || "pending";
                          return status === "pending"
                            ? "Pending"
                            : status === "approved"
                              ? "Approved"
                              : status === "rejected"
                                ? "Rejected"
                                : status === "routed_for_approval"
                                  ? "Routed for Approval"
                                  : status === "suspended"
                                    ? "Suspended"
                                    : status.charAt(0).toUpperCase() + status.slice(1);
                        })()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Visitors Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#EC4899" }]}
                  >
                    <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Visitors</Text>
                    <Text style={styles.cardSubtitle}>
                      {request.visitors?.length || 1} visitor
                      {request.visitors?.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardHeaderSeparator} />

              <View style={styles.cardContent}>
                {/* All Visitors - Expandable */}
                {visitors.map((visitor: any, index: number) => (
                  <View key={visitor.id || index} style={styles.visitorSection}>
                    <TouchableOpacity
                      style={styles.visitorHeader}
                      onPress={() => toggleVisitorExpansion(visitor.id)}
                    >
                      <View style={styles.visitorHeaderLeft}>
                        <View style={styles.visitorInitials}>
                          <Text style={styles.visitorInitialsText}>
                            {getInitials(
                              visitor.first_name || "",
                              visitor.last_name || "",
                            )}
                          </Text>
                        </View>
                        <Text style={styles.visitorName}>
                          {visitor.first_name} {visitor.last_name}
                        </Text>
                      </View>
                      <Ionicons
                        name={
                          expandedVisitors[visitor.id]
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {/* Visitor Details */}
                    {expandedVisitors[visitor.id] && (
                      <View style={styles.visitorDetails}>
                        <View style={styles.infoRow}>
                          <View style={styles.infoIcon}>
                            <Ionicons
                              name="person-outline"
                              size={20}
                              color="#9CA3AF"
                            />
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
                            <Ionicons
                              name="mail-outline"
                              size={20}
                              color="#86EFAC"
                            />
                          </View>
                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>EMAIL</Text>
                            <Text style={[styles.infoValue, styles.linkValue]}>
                              {visitor.email || "—"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <View style={styles.infoIcon}>
                            <Ionicons
                              name="call-outline"
                              size={20}
                              color="#9333EA"
                            />
                          </View>
                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>PHONE</Text>
                            <Text style={[styles.infoValue, styles.linkValue]}>
                              {visitor.phone || "—"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <View style={styles.infoIcon}>
                            <MaterialCommunityIcons
                              name="id-card"
                              size={20}
                              color="#F97316"
                            />
                          </View>
                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>IDENTIFICATION</Text>
                            <Text style={styles.infoValue}>
                              <Text style={styles.identificationType}>
                                {visitor.identification_type || "—"}
                              </Text>{" "}
                              {visitor.identification_number || ""}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <View style={styles.infoIcon}>
                            <MaterialIcons
                              name="confirmation-number"
                              size={20}
                              color="#9333EA"
                            />
                          </View>
                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>PASS TYPE</Text>
                            <View style={styles.passTypeBadge}>
                              <Text style={styles.passTypeBadgeText}>
                                {getPassTypeName(
                                  visitor.pass_type_id ||
                                    request.pass_type_id ||
                                    (request.visitors &&
                                    request.visitors.length > 0
                                      ? request.visitors[0]?.pass_type_id
                                      : null),
                                )}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.infoRow}>
                          <View style={styles.infoIcon}>
                            <MaterialIcons
                              name="description"
                              size={20}
                              color="#F97316"
                            />
                          </View>
                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>PURPOSE</Text>
                            <Text style={styles.infoValue}>
                              {request.purpose || visitor.purpose || "—"}
                            </Text>
                          </View>
                        </View>

                        {visitor.valid_from && (
                          <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                              <MaterialIcons
                                name="event"
                                size={20}
                                color="#10B981"
                              />
                            </View>
                            <View style={styles.infoContent}>
                              <Text style={styles.infoLabel}>VALID FROM</Text>
                              <View style={styles.validFromBadge}>
                                <Text style={styles.validFromBadgeText}>
                                  {formatDateForDisplay(visitor.valid_from)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}

                        {visitor.valid_to && (
                          <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                              <MaterialIcons
                                name="event"
                                size={20}
                                color="#F97316"
                              />
                            </View>
                            <View style={styles.infoContent}>
                              <Text style={styles.infoLabel}>VALID TO</Text>
                              <View style={styles.validToBadge}>
                                <Text style={styles.validToBadgeText}>
                                  {formatDateForDisplay(visitor.valid_to)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}

                        <View style={styles.infoRow}>
                          <View style={styles.infoIcon}>
                            <Ionicons
                              name="time-outline"
                              size={20}
                              color="#9CA3AF"
                            />
                          </View>
                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>STATUS</Text>
                            <View style={styles.statusBadge}>
                              <Text style={styles.statusBadgeText}>
                                {(() => {
                                  // Use request-level status field
                                  const status = request.status || "pending";
                                  return status === "pending"
                                    ? "Pending"
                                    : status === "approved"
                                      ? "Approved"
                                      : status === "rejected"
                                        ? "Rejected"
                                        : status === "routed_for_approval"
                                          ? "Routed for Approval"
                                          : status === "suspended"
                                            ? "Suspended"
                                            : status.charAt(0).toUpperCase() + status.slice(1);
                                })()}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Car Passes - Show only first car pass per visitor */}
                        {visitor.car_passes &&
                          visitor.car_passes.length > 0 && (
                            <View style={styles.infoRow}>
                              <View style={styles.infoIcon}>
                                <MaterialIcons
                                  name="directions-car"
                                  size={20}
                                  color="#3B82F6"
                                />
                              </View>
                              <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>CAR PASS</Text>
                                <View style={styles.carPassContainer}>
                                  {visitor.car_passes
                                    .slice(0, 1)
                                    .map((carPass: any, carIndex: number) => (
                                      <View
                                        key={carIndex}
                                        style={styles.carPassItem}
                                      >
                                        <Text style={styles.carPassText}>
                                          <Text style={styles.carPassLabel}>
                                            Make:{" "}
                                          </Text>
                                          {carPass.car_make || "—"}
                                        </Text>
                                        <Text style={styles.carPassText}>
                                          <Text style={styles.carPassLabel}>
                                            Model:{" "}
                                          </Text>
                                          {carPass.car_model || "—"}
                                        </Text>
                                        <Text style={styles.carPassText}>
                                          <Text style={styles.carPassLabel}>
                                            Color:{" "}
                                          </Text>
                                          {carPass.car_color || "—"}
                                        </Text>
                                        <Text style={styles.carPassText}>
                                          <Text style={styles.carPassLabel}>
                                            Number:{" "}
                                          </Text>
                                          {carPass.car_number || "—"}
                                        </Text>
                                        {carPass.car_tag && (
                                          <Text style={styles.carPassText}>
                                            <Text style={styles.carPassLabel}>
                                              Tag:{" "}
                                            </Text>
                                            {carPass.car_tag}
                                          </Text>
                                        )}
                                      </View>
                                    ))}
                                </View>
                              </View>
                            </View>
                          )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
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
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
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
  twoColumnContainer: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  leftColumn: {
    flex: 1,
    minWidth: 300,
    gap: 16,
  },
  rightColumn: {
    flex: 1,
    minWidth: 300,
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
  visitorSection: {
    marginTop: 8,
  },
  visitorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 12,
  },
  visitorHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  visitorInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  visitorInitialsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  visitorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  visitorDetails: {
    gap: 16,
  },
  linkValue: {
    color: "#3B82F6",
  },
  identificationType: {
    color: "#F97316",
    fontWeight: "600",
  },
  passTypeBadge: {
    backgroundColor: "#E9D5FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  passTypeBadgeText: {
    color: "#9333EA",
    fontSize: 12,
    fontWeight: "600",
  },
  validFromBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  validFromBadgeText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  validToBadge: {
    backgroundColor: "#FED7AA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  validToBadgeText: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusBadgeText: {
    color: "#EAB308",
    fontSize: 12,
    fontWeight: "600",
  },
  carPassContainer: {
    marginTop: 8,
  },
  carPassItem: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  carPassText: {
    fontSize: 13,
    color: "#111827",
    lineHeight: 20,
  },
  carPassLabel: {
    fontWeight: "600",
    color: "#6B7280",
  },
});
