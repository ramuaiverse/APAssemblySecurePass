import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleLogout } from "@/utils/logout";
import { api, MainCategory } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import BackButtonIcon from "../../assets/backButton.svg";
import LogOutIcon from "../../assets/logOut.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";

type MyPassRequestsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MyPassRequests"
>;

type MyPassRequestsScreenRouteProp = RouteProp<
  RootStackParamList,
  "MyPassRequests"
>;

type Props = {
  navigation: MyPassRequestsScreenNavigationProp;
  route: MyPassRequestsScreenRouteProp;
};

export default function MyPassRequestsScreen({ navigation, route }: Props) {
  const userId = route.params?.userId || "";
  const userFullName = route.params?.userFullName || "";
  const designation = route.params?.designation || null;
  const userSubCategories = route.params?.sub_categories || [];

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {},
  );

  // Category mappings
  const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
  const [subCategoryMap, setSubCategoryMap] = useState<{
    [key: string]: string;
  }>({});

  useFocusEffect(
    React.useCallback(() => {
      fetchCategories();
      fetchMyRequests();
    }, [userId, userFullName]),
  );

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

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      let allRequests = await api.getAllPassRequests(10000);

      // Filter requests created by this user
      const myRequests = allRequests.filter((req: any) => {
        const matches =
          req.requested_by === userId ||
          req.requested_by === userFullName ||
          req.created_by === userId;
        return matches;
      });

      // Also filter by sub_categories if provided
      if (userSubCategories.length > 0) {
        const userSubCategoryIds = userSubCategories.map((cat: any) => cat.id);

        const filtered = myRequests.filter((req: any) => {
          const matches = userSubCategoryIds.includes(req.sub_category_id);
          return matches;
        });
        setRequests(filtered);
      } else {
        setRequests(myRequests);
      }

      // Initialize all cards as expanded (open) by default
      const initialExpandedRows: { [key: string]: boolean } = {};
      myRequests.forEach((req) => {
        initialExpandedRows[req.id] = true;
      });
      setExpandedRows(initialExpandedRows);
    } catch (error) {
      Alert.alert("Error", "Failed to load requests. Please try again.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };


  const handleNewRequest = () => {
    navigation.navigate("RequestVisitorPass", {
      userId,
      userFullName,
      designation: designation || undefined,
      sub_categories: userSubCategories,
    });
  };

  const handleViewRequest = (request: any) => {
    navigation.navigate("MyPassRequestDetails", {
      request,
      visitor: request.visitors?.[0] || null,
    });
  };

  const toggleRow = (requestId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      case "pending":
        return "#F59E0B";
      case "routed":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#D1FAE5";
      case "rejected":
        return "#FEE2E2";
      case "pending":
        return "#FEF3C7";
      case "routed":
        return "#E9D5FF";
      default:
        return "#F3F4F6";
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
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackButtonIcon width={18} height={18} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Pass Requests</Text>
          </View>
          <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.logoutButton}>
            <LogOutIcon width={22} height={22} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.headerSubtitle}>
        View and manage all your visitor pass requests
      </Text>

      {/* Content */}
      <View style={styles.content}>
        {/* New Request Button */}
        <View style={styles.newRequestContainer}>
          <TouchableOpacity
            style={styles.newRequestButton}
            onPress={handleNewRequest}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newRequestButtonText}>New Request</Text>
          </TouchableOpacity>
        </View>

        {/* Requests List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#457E51" />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No requests found</Text>
            <Text style={styles.emptySubtext}>
              Create your first pass request
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Request Cards */}
            <View style={styles.cardsListContainer}>
              {requests.map((request) => {
                const isExpanded = expandedRows[request.id] ?? true;

                return (
                  <View key={request.id} style={styles.requestCardWrapper}>
                    <View style={styles.requestCard}>
                      <View style={styles.requestCardHeader}>
                        <TouchableOpacity
                          style={styles.requestIdContainer}
                          onPress={() => handleViewRequest(request)}
                        >
                          <Text style={styles.requestIdText}>
                            {request.request_id || request.id}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => toggleRow(request.id)}
                          style={styles.chevronButton}
                        >
                          <ChevronDownIcon
                            width={20}
                            height={20}
                            style={{
                              transform: [
                                { rotate: isExpanded ? "180deg" : "0deg" },
                              ],
                            }}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <View style={styles.requestCardContent}>
                          {/* Request Details */}
                          <View style={styles.requestDetailsSection}>
                            <View style={styles.requestInfoRow}>
                              <Text style={styles.requestInfoLabel}>
                                Requested Date:
                              </Text>
                              <Text style={styles.requestInfoValue}>
                                {formatDate(
                                  request.created_at || request.requested_at,
                                )}
                              </Text>
                            </View>
                            <View style={styles.requestInfoRow}>
                              <Text style={styles.requestInfoLabel}>
                                Visitors:
                              </Text>
                              <Text style={styles.requestInfoValue}>
                                {request.visitors?.length || 0} visitor
                                {(request.visitors?.length || 0) !== 1
                                  ? "s"
                                  : ""}
                              </Text>
                            </View>
                            <View style={styles.requestInfoRow}>
                              <Text style={styles.requestInfoLabel}>
                                Purpose:
                              </Text>
                              <Text style={styles.requestInfoValue}>
                                {request.purpose || "—"}
                              </Text>
                            </View>
                            <View style={styles.requestInfoRow}>
                              <Text style={styles.requestInfoLabel}>
                                Category:
                              </Text>
                              <Text style={styles.requestInfoValue}>
                                {getCategoryName(request.main_category_id)}
                                {request.sub_category_id &&
                                  ` • ${getSubCategoryName(
                                    request.sub_category_id,
                                  )}`}
                              </Text>
                            </View>
                            <View style={styles.requestInfoRow}>
                              <Text style={styles.requestInfoLabel}>
                                Valid From:
                              </Text>
                              <Text style={styles.requestInfoValue}>
                                {request.valid_from
                                  ? formatDate(request.valid_from)
                                  : "—"}
                              </Text>
                            </View>
                            {request.valid_to && (
                              <View style={styles.requestInfoRow}>
                                <Text style={styles.requestInfoLabel}>
                                  Valid To:
                                </Text>
                                <Text style={styles.requestInfoValue}>
                                  {formatDate(request.valid_to)}
                                </Text>
                              </View>
                            )}
                            <View style={styles.requestInfoRow}>
                              <Text style={styles.requestInfoLabel}>
                                Status:
                              </Text>
                              <View style={styles.statusContainer}>
                                <View
                                  style={[
                                    styles.statusBadge,
                                    {
                                      backgroundColor: getStatusBgColor(
                                        request.status,
                                      ),
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusText,
                                      {
                                        color: getStatusColor(request.status),
                                      },
                                    ]}
                                  >
                                    {request.status
                                      ? request.status.charAt(0).toUpperCase() +
                                        request.status.slice(1)
                                      : "Pending"}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* View Details Button */}
                          <TouchableOpacity
                            style={styles.viewDetailsButton}
                            onPress={() => handleViewRequest(request)}
                          >
                            <Text style={styles.viewDetailsButtonText}>
                              View Details
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
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
  headerContainer: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  backButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    margin: 12,
  },
  logoutButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
    zIndex: 1,
  },
  newRequestContainer: {
    marginBottom: 16,
    alignItems: "flex-end",
  },
  newRequestButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#457E51",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  newRequestButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  cardsListContainer: {
    gap: 16,
  },
  requestCardWrapper: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
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
  requestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestIdContainer: {
    flex: 1,
  },
  requestIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
    textDecorationLine: "underline",
  },
  chevronButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  requestCardContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  requestDetailsSection: {
    gap: 12,
  },
  requestInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  requestInfoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  requestInfoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  statusContainer: {
    flex: 2,
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewDetailsButton: {
    backgroundColor: "#457E51",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  viewDetailsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
