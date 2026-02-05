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
import { api, MainCategory, PassTypeItem, User } from "@/services/api";
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

type RequestDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RequestDetails"
>;

type RequestDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "RequestDetails"
>;

type Props = {
  navigation: RequestDetailsScreenNavigationProp;
  route: RequestDetailsScreenRouteProp;
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

const getInitials = (name: string) => {
  const parts = name.split(" ");
  const first = parts[0]?.charAt(0)?.toUpperCase() || "";
  const last = parts[parts.length - 1]?.charAt(0)?.toUpperCase() || "";
  return first + last;
};

export default function RequestDetailsScreen({ navigation, route }: Props) {
  const { request, visitor } = route.params;

  // Category mappings
  const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
  const [subCategoryMap, setSubCategoryMap] = useState<{
    [key: string]: string;
  }>({});

  // Pass type mappings
  const [passTypeMap, setPassTypeMap] = useState<{ [key: string]: string }>({});

  // User mappings
  const [userMap, setUserMap] = useState<{ [key: string]: string }>({});

  // HOD User mappings (department role)
  const [hodUserMap, setHodUserMap] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCategories();
    fetchPassTypes();
    fetchHODUsers();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const allUsers: any[] = [];
      // Fetch users from different roles
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

      const userMapping: { [key: string]: string } = {};
      allUsers.forEach((user: User) => {
        if (user.id && user.full_name) {
          userMapping[user.id] = user.full_name;
        }
      });
      setUserMap(userMapping);
    } catch (error) {
      // Error fetching users
    }
  };

  const fetchHODUsers = async () => {
    try {
      const hodUsers = await api.getUsersByRole("department");
      const hodUserMapping: { [key: string]: string } = {};
      hodUsers.forEach((user: User) => {
        if (user.id && user.full_name) {
          hodUserMapping[user.id] = user.full_name;
        }
      });
      setHodUserMap(hodUserMapping);
    } catch (error) {
      // Error fetching HOD users
    }
  };

  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return "—";
    // Check if user map has been populated
    if (Object.keys(userMap).length === 0) {
      // If map is empty, return ID as fallback (might still be loading)
      return userId;
    }
    return userMap[userId] || userId;
  };

  const getHODUserName = (userId: string | null | undefined) => {
    if (!userId) return "—";
    // Check if HOD user map has been populated
    if (Object.keys(hodUserMap).length === 0) {
      // If map is empty, return ID as fallback (might still be loading)
      return userId;
    }
    return hodUserMap[userId] || userId;
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

  // Determine visitor status based on portal logic
  const getVisitorStatus = () => {
    if (visitor.status === "denied") {
      return "rejected";
    }
    if (visitor.status === "approved" && visitor.passGeneratedAt) {
      return "approved";
    }
    if (visitor.status === "approved" && !visitor.passGeneratedAt) {
      return "routed_for_approval";
    }
    return visitor.status || "pending";
  };

  const visitorStatus = getVisitorStatus();
  const isApproved = visitorStatus === "approved";
  const isRejected = visitorStatus === "rejected";
  const isPending = visitorStatus === "pending";
  const isRouted = visitorStatus === "routed_for_approval";

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
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cardsContainer}>
          {/* Card 1: Visitor Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIcon, { backgroundColor: "#457E51" }]}>
                  <VisitorIcon width={20} height={20} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Visitor Information</Text>
                  <Text style={styles.cardSubtitle}>
                    {visitor.name || "Visitor Details"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardHeaderSeparator} />

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person-outline" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>FULL NAME</Text>
                  <Text style={styles.infoValue}>{visitor.name || "—"}</Text>
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
                  <MaterialIcons name="badge" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>IDENTIFICATION</Text>
                  <Text style={styles.infoValue}>
                    {visitor.identificationType || "—"}{" "}
                    {visitor.identificationNumber || ""}
                  </Text>
                </View>
              </View>

              {(visitor.identification_document_url || visitor.identificationDocumentUrl) && (
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
                        source={{
                          uri:
                            visitor.identification_document_url ||
                            visitor.identificationDocumentUrl,
                        }}
                        style={styles.photo}
                      />
                      <TouchableOpacity
                        style={styles.photoButton}
                        onPress={() =>
                          handleOpenDocument(
                            visitor.identification_document_url ||
                              visitor.identificationDocumentUrl,
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

              {visitor.validFrom && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="event" size={24} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>VALID FROM</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(visitor.validFrom)}
                    </Text>
                  </View>
                </View>
              )}

              {visitor.validTo && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="event-busy" size={24} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>VALID TO</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(visitor.validTo)}
                    </Text>
                  </View>
                </View>
              )}

              {visitor.purpose && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="description" size={24} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>PURPOSE</Text>
                    <Text style={styles.infoValue}>{visitor.purpose}</Text>
                  </View>
                </View>
              )}

              {visitor.passTypeName && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="local-offer" size={24} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>PASS TYPE</Text>
                    <Text style={styles.infoValue}>
                      {visitor.passTypeName}
                    </Text>
                  </View>
                </View>
              )}

              {/* Car Passes Section */}
              {visitor.car_passes && visitor.car_passes.length > 0 && (
                <>
                  <View style={styles.carPassesSectionHeader}>
                    <Text style={styles.carPassesSectionTitle}>
                      CAR PASSES ({visitor.car_passes.length})
                    </Text>
                  </View>
                  {visitor.car_passes.map((carPass: any, index: number) => (
                    <View key={index} style={styles.carPassCard}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                          <MaterialIcons
                            name="directions-car"
                            size={24}
                            color="#F97316"
                          />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.carPassLabel}>
                            CAR PASS #{index + 1}
                          </Text>
                          <View style={styles.carPassDetails}>
                            <Text style={styles.carPassDetailText}>
                              Make: {carPass.car_make || "—"}
                            </Text>
                            <Text style={styles.carPassDetailText}>
                              Model: {carPass.car_model || "—"}
                            </Text>
                            <Text style={styles.carPassDetailText}>
                              Color: {carPass.car_color || "—"}
                            </Text>
                            <Text style={styles.carPassDetailText}>
                              Number: {carPass.car_number || "—"}
                            </Text>
                            {carPass.car_tag && (
                              <Text style={styles.carPassDetailText}>
                                Tag: {carPass.car_tag}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="info" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>STATUS</Text>
                  <View style={styles.statusContainer}>
                    {isApproved ? (
                      <View style={styles.approvedStatus}>
                        <Text style={styles.approvedStatusText}>Approved</Text>
                      </View>
                    ) : isRejected ? (
                      <View style={styles.rejectedStatus}>
                        <Text style={styles.rejectedStatusText}>Rejected</Text>
                      </View>
                    ) : isRouted ? (
                      <View style={styles.routedStatus}>
                        <Text style={styles.routedStatusText}>
                          Routed for Approval
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.pendingStatus}>
                        <Text style={styles.pendingStatusText}>Pending</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {visitor.denialReason && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="cancel" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>REJECTION REASON</Text>
                    <View style={styles.rejectionReasonBox}>
                      <Text style={styles.rejectionReasonText}>
                        {visitor.denialReason}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {visitor.approverComments && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="comment" size={24} color="#10B981" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>APPROVER COMMENTS</Text>
                    <Text style={styles.infoValue}>
                      {visitor.approverComments}
                    </Text>
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
                    {request.requestId}
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
                    {request.requestedBy || "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="description" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>PURPOSE</Text>
                  <Text style={styles.infoValue}>
                    {request.purpose || "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="event" size={24} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>SUBMITTED DATE</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(request.submittedDate)}
                  </Text>
                </View>
              </View>

              {request.visitDate && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="calendar-today" size={24} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>VISIT DATE</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(request.visitDate)} {request.visitTime || ""}
                    </Text>
                  </View>
                </View>
              )}

              {request.hodApprovedBy && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="check-circle" size={24} color="#10B981" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>APPROVED BY (HOD)</Text>
                    <Text style={styles.infoValue}>
                      {getHODUserName(request.hodApprovedBy)}
                    </Text>
                  </View>
                </View>
              )}

              {request.legislativeApprovedBy && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="verified" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>APPROVED BY (LEGISLATIVE)</Text>
                    <Text style={styles.infoValue}>
                      {getUserName(request.legislativeApprovedBy)}
                    </Text>
                  </View>
                </View>
              )}

              {request.legislativeApprovedAt && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="schedule" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>LEGISLATIVE APPROVAL DATE</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(request.legislativeApprovedAt)}
                    </Text>
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
                  <MaterialIcons name="timeline" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Timeline</Text>
                  <Text style={styles.cardSubtitle}>Request Status History</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardHeaderSeparator} />

            <View style={styles.cardContent}>
              <View style={styles.timelineContainer}>
                {/* Submitted */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <View style={styles.timelineDotInner} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Request Submitted</Text>
                    <Text style={styles.timelineDate}>
                      {formatDate(request.submittedDate)}
                    </Text>
                    <Text style={styles.timelineDescription}>
                      Request created by {request.requestedBy}
                    </Text>
                  </View>
                </View>

                {/* HOD Approval */}
                {visitor.approvedDate && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, styles.timelineDotApproved]}>
                      <View style={styles.timelineDotInner} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>HOD Approved</Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(visitor.approvedDate)}
                      </Text>
                      {request.hodApprovedBy && (
                        <Text style={styles.timelineDescription}>
                          Approved by {getHODUserName(request.hodApprovedBy)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Rejected */}
                {visitor.deniedDate && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, styles.timelineDotRejected]}>
                      <View style={styles.timelineDotInner} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Rejected</Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(visitor.deniedDate)}
                      </Text>
                      {visitor.denialReason && (
                        <Text style={styles.timelineDescription}>
                          {visitor.denialReason}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Legislative Approval */}
                {request.legislativeApprovedAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, styles.timelineDotApproved]}>
                      <View style={styles.timelineDotInner} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>
                        Legislative Approved
                      </Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(request.legislativeApprovedAt)}
                      </Text>
                      {request.legislativeApprovedBy && (
                        <Text style={styles.timelineDescription}>
                          Approved by {getUserName(request.legislativeApprovedBy)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Pass Generated */}
                {visitor.passGeneratedAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, styles.timelineDotApproved]}>
                      <View style={styles.timelineDotInner} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Pass Generated</Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(visitor.passGeneratedAt)}
                      </Text>
                      <Text style={styles.timelineDescription}>
                        Visitor pass has been generated and sent
                      </Text>
                    </View>
                  </View>
                )}
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
  statusContainer: {
    marginTop: 4,
  },
  approvedStatus: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  approvedStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  rejectedStatus: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  rejectedStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  routedStatus: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  routedStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
  pendingStatus: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  pendingStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
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
    left: 15,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#E5E7EB",
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 24,
    position: "relative",
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    zIndex: 1,
  },
  timelineDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#9CA3AF",
  },
  timelineDotApproved: {
    backgroundColor: "#D1FAE5",
  },
  timelineDotRejected: {
    backgroundColor: "#FEE2E2",
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  carPassesSectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  carPassesSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  carPassDetailText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
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
});
