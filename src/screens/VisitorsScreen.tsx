import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, MainCategory, PassTypeItem } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import BackButtonIcon from "../../assets/backButton.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";
import LogOutIcon from "../../assets/logOut.svg";
import CloseIcon from "../../assets/close.svg";

type VisitorsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Visitors"
>;

type Props = {
  navigation: VisitorsScreenNavigationProp;
  route: RouteProp<RootStackParamList, "Visitors">;
};

interface VisitorStats {
  totalVisitors: number;
  pending: number;
  routed: number;
  approved: number;
  rejected: number;
  suspended: number;
}

interface ExpandedRow {
  [key: string]: boolean;
}

interface ExpandedVisitor {
  [key: string]: boolean;
}

export default function VisitorsScreen({ navigation, route }: Props) {
  const userRole = route.params?.role || "";
  const userId = route.params?.userId || "";
  const hodApprover = route.params?.hod_approver || false;
  const legislativeApprover = route.params?.legislative_approver || false;
  const isApprover = hodApprover || legislativeApprover;

  const [passRequests, setPassRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 0,
    pending: 0,
    routed: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<ExpandedRow>({});
  const [expandedVisitors, setExpandedVisitors] = useState<ExpandedVisitor>({});
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedStatusValue, setSelectedStatusValue] = useState<string | null>(
    null,
  );
  const [selectedPassType, setSelectedPassType] = useState("All Pass Types");
  const [selectedPassTypeId, setSelectedPassTypeId] = useState<string | null>(
    null,
  );
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Approve/Reject modals state
  const [showApproveAllModal, setShowApproveAllModal] = useState(false);
  const [showRejectAllModal, setShowRejectAllModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState(false);

  // Category mappings
  const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
  const [subCategoryMap, setSubCategoryMap] = useState<{
    [key: string]: string;
  }>({});

  // Pass types
  const [passTypes, setPassTypes] = useState<PassTypeItem[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchPassTypes();
    fetchVisitors();
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
      setPassTypes(types);
    } catch (error) {
      console.error("Error fetching pass types:", error);
    }
  };

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const requests = await api.getAllPassRequests(10000);
      setPassRequests(requests);

      // Initialize all cards as expanded (open) by default
      const initialExpandedRows: ExpandedRow = {};
      const initialExpandedVisitors: ExpandedVisitor = {};

      requests.forEach((req) => {
        initialExpandedRows[req.id] = true;
        req.visitors?.forEach((visitor: any, index: number) => {
          const visitorId = visitor.id || `${req.id}-${index}`;
          initialExpandedVisitors[visitorId] = true;
        });
      });

      setExpandedRows(initialExpandedRows);
      setExpandedVisitors(initialExpandedVisitors);

      // Calculate stats based on individual visitor statuses
      // Each visitor is counted in exactly ONE category
      let pending = 0;
      let routed = 0;
      let approved = 0;
      let rejected = 0;
      let suspended = 0;

      // Iterate through all requests and categorize each visitor
      requests.forEach((req) => {
        if (req.visitors && req.visitors.length > 0) {
          req.visitors.forEach((visitor: any) => {
            // Categorize visitor into exactly one status
            if (visitor.is_suspended === true) {
              suspended++;
            } else if (visitor.visitor_routed_to) {
              routed++;
            } else if (visitor.visitor_status === "approved") {
              approved++;
            } else if (visitor.visitor_status === "rejected") {
              rejected++;
            } else if (visitor.visitor_status === "pending") {
              pending++;
            }
          });
        }
      });

      // Total visitors is the sum of all categories
      const totalVisitors = pending + routed + approved + rejected + suspended;

      setStats({
        totalVisitors,
        pending,
        routed,
        approved,
        rejected,
        suspended,
      });
    } catch (error) {
      console.error("Error fetching visitors:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (requestId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const toggleVisitor = (visitorId: string) => {
    setExpandedVisitors((prev) => ({
      ...prev,
      [visitorId]: !prev[visitorId],
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      const displayHours = hours % 12 || 12;
      return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  const getVisitorStatusCounts = (visitors: any[]) => {
    const counts = {
      approved: 0,
      rejected: 0,
      pending: 0,
    };
    visitors?.forEach((visitor: any) => {
      if (visitor.visitor_status === "approved") counts.approved++;
      else if (visitor.visitor_status === "rejected") counts.rejected++;
      else if (visitor.visitor_status === "pending") counts.pending++;
    });
    return counts;
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last;
  };

  // Helper function to get filtered visitors for a request based on pass type
  const getFilteredVisitors = (visitors: any[] | null | undefined) => {
    if (!visitors) return [];
    if (!selectedPassTypeId) return visitors;
    return visitors.filter((v: any) => v.pass_type_id === selectedPassTypeId);
  };

  const filteredRequests = passRequests
    .map((req) => {
      // Filter visitors within the request based on pass type and status
      let filteredVisitors = getFilteredVisitors(req.visitors);

      // Apply status filter to visitors
      if (selectedStatusValue) {
        filteredVisitors = filteredVisitors.filter((v: any) => {
          if (selectedStatusValue === "suspended") {
            return v.is_suspended === true;
          } else if (selectedStatusValue === "routed for approval") {
            return (
              v.visitor_routed_to !== null && v.visitor_routed_to !== undefined
            );
          } else if (selectedStatusValue === "assigned to me") {
            // This would need user context - for now, return all visitors
            // In a real implementation, you'd check if visitor_routed_to matches current user ID
            return true;
          } else {
            // Map display status to actual status values
            const statusMap: { [key: string]: string } = {
              pending: "pending",
              rejected: "rejected",
              approved: "approved",
            };
            const actualStatus =
              statusMap[selectedStatusValue] || selectedStatusValue;
            return v.visitor_status === actualStatus;
          }
        });
      }

      // Return request with filtered visitors, or null if no visitors match
      if (
        (selectedPassTypeId && filteredVisitors.length === 0) ||
        (selectedStatusValue && filteredVisitors.length === 0)
      ) {
        return null;
      }

      return {
        ...req,
        visitors: filteredVisitors,
      };
    })
    .filter((req) => {
      if (!req) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        req.request_id?.toLowerCase().includes(searchLower) ||
        req.requested_by?.toLowerCase().includes(searchLower) ||
        req.purpose?.toLowerCase().includes(searchLower) ||
        req.visitors?.some(
          (v: any) =>
            `${v.first_name} ${v.last_name}`
              .toLowerCase()
              .includes(searchLower) ||
            v.email?.toLowerCase().includes(searchLower) ||
            v.phone?.toLowerCase().includes(searchLower),
        );

      return matchesSearch;
    });

  const handlePassTypeSelect = (passType: PassTypeItem | null) => {
    if (passType) {
      setSelectedPassType(passType.name);
      setSelectedPassTypeId(passType.id);
    } else {
      setSelectedPassType("All Pass Types");
      setSelectedPassTypeId(null);
    }
    setShowPassTypeModal(false);
  };

  const handleStatusSelect = (status: string | null) => {
    if (status && status !== "All Status") {
      setSelectedStatus(status);
      setSelectedStatusValue(status.toLowerCase());
    } else {
      setSelectedStatus("All Status");
      setSelectedStatusValue(null);
    }
    setShowStatusModal(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleVisitorClick = (request: any, visitor: any) => {
    navigation.navigate("VisitorDetails", { request, visitor, role: userRole });
  };

  const handleLogout = () => {
    // Navigate back to login method selection
    navigation.replace("LoginMethodSelection");
  };

  // Handler for Approve All
  const handleApproveAllClick = (request: any) => {
    setSelectedRequest(request);
    setApproveComment("");
    setShowApproveAllModal(true);
  };

  // Handler for Reject All
  const handleRejectAllClick = (request: any) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectAllModal(true);
  };

  // Handler for individual Approve
  const handleApproveClick = (visitor: any) => {
    setSelectedVisitor(visitor);
    setApproveComment("");
    setShowApproveModal(true);
  };

  // Handler for individual Reject
  const handleRejectClick = (visitor: any) => {
    setSelectedVisitor(visitor);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Execute Approve All
  const executeApproveAll = async () => {
    if (!selectedRequest || !userId) return;

    const pendingVisitors = selectedRequest.visitors?.filter(
      (v: any) => v.visitor_status === "pending",
    );

    if (!pendingVisitors || pendingVisitors.length === 0) {
      Alert.alert("No Pending Visitors", "There are no pending visitors to approve.");
      setShowApproveAllModal(false);
      return;
    }

    setProcessingStatus(true);
    try {
      // Approve all pending visitors
      const promises = pendingVisitors.map((visitor: any) =>
        api.updateVisitorStatus(
          visitor.id,
          "approved",
          userId,
          approveComment || undefined,
        ),
      );

      await Promise.all(promises);

      // Refresh the data
      await fetchVisitors();
      setShowApproveAllModal(false);
      setApproveComment("");
      Alert.alert("Success", "All visitors have been approved successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to approve visitors. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
    }
  };

  // Execute Reject All
  const executeRejectAll = async () => {
    if (!selectedRequest || !userId) return;

    if (!rejectReason.trim()) {
      Alert.alert("Required", "Please provide a reason for rejection.");
      return;
    }

    const pendingVisitors = selectedRequest.visitors?.filter(
      (v: any) => v.visitor_status === "pending",
    );

    if (!pendingVisitors || pendingVisitors.length === 0) {
      Alert.alert("No Pending Visitors", "There are no pending visitors to reject.");
      setShowRejectAllModal(false);
      return;
    }

    setProcessingStatus(true);
    try {
      // Reject all pending visitors
      const promises = pendingVisitors.map((visitor: any) =>
        api.updateVisitorStatus(
          visitor.id,
          "rejected",
          userId,
          rejectReason,
        ),
      );

      await Promise.all(promises);

      // Refresh the data
      await fetchVisitors();
      setShowRejectAllModal(false);
      setRejectReason("");
      Alert.alert("Success", "All visitors have been rejected successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reject visitors. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
    }
  };

  // Execute individual Approve
  const executeApprove = async () => {
    if (!selectedVisitor || !userId) return;

    setProcessingStatus(true);
    try {
      await api.updateVisitorStatus(
        selectedVisitor.id,
        "approved",
        userId,
        approveComment || undefined,
      );

      // Refresh the data
      await fetchVisitors();
      setShowApproveModal(false);
      setApproveComment("");
      Alert.alert("Success", "Visitor has been approved successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to approve visitor. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
    }
  };

  // Execute individual Reject
  const executeReject = async () => {
    if (!selectedVisitor || !userId) return;

    if (!rejectReason.trim()) {
      Alert.alert("Required", "Please provide a reason for rejection.");
      return;
    }

    setProcessingStatus(true);
    try {
      await api.updateVisitorStatus(
        selectedVisitor.id,
        "rejected",
        userId,
        rejectReason,
      );

      // Refresh the data
      await fetchVisitors();
      setShowRejectModal(false);
      setRejectReason("");
      Alert.alert("Success", "Visitor has been rejected successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reject visitor. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <BackButtonIcon width={18} height={18} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Visitors</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <Text style={styles.headerSubtitle}>
        Manage and approve visitor pass requests
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search and Filters */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email, phone, request ID, department, category, purpose, dates, status"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}
                >
                  <CloseIcon width={16} height={16} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.filtersContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowStatusModal(true)}
              >
                <Text style={styles.filterText}>{selectedStatus}</Text>
                <ChevronDownIcon width={16} height={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowPassTypeModal(true)}
              >
                <Text style={styles.filterText}>{selectedPassType}</Text>
                <ChevronDownIcon width={16} height={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryCardsContainer}>
            <View style={[styles.summaryCard, styles.totalCard]}>
              <Text style={styles.summaryCardValue}>{stats.totalVisitors}</Text>
              <Text style={styles.summaryCardLabel}>Total Visitors</Text>
            </View>
            <View style={[styles.summaryCard, styles.pendingCard]}>
              <Text style={styles.summaryCardValue}>{stats.pending}</Text>
              <Text style={styles.summaryCardLabel}>Pending</Text>
            </View>
            <View style={[styles.summaryCard, styles.routedCard]}>
              <Text style={styles.summaryCardValue}>{stats.routed}</Text>
              <Text style={styles.summaryCardLabel}>Routed</Text>
            </View>
            <View style={[styles.summaryCard, styles.approvedCard]}>
              <Text style={styles.summaryCardValue}>{stats.approved}</Text>
              <Text style={styles.summaryCardLabel}>Approved</Text>
            </View>
            <View style={[styles.summaryCard, styles.rejectedCard]}>
              <Text style={styles.summaryCardValue}>{stats.rejected}</Text>
              <Text style={styles.summaryCardLabel}>Rejected</Text>
            </View>
            <View style={[styles.summaryCard, styles.suspendedCard]}>
              <Text style={styles.summaryCardValue}>{stats.suspended}</Text>
              <Text style={styles.summaryCardLabel}>Suspended</Text>
            </View>
          </View>

          {/* Request Cards */}
          <View style={styles.cardsListContainer}>
            {filteredRequests.map((request) => {
              const isExpanded = expandedRows[request.id] ?? true;
              const statusCounts = getVisitorStatusCounts(
                request.visitors || [],
              );
              const hasMultipleVisitors = (request.visitors?.length || 0) > 1;

              return (
                <View key={request.id} style={styles.requestCardWrapper}>
                  {/* Request Card - Always show with just request ID */}
                  <View style={styles.requestCard}>
                    <View style={styles.requestCardHeader}>
                      <Text style={styles.requestIdText}>
                        {request.request_id}
                      </Text>
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
                              Purpose:
                            </Text>
                            <Text style={styles.requestInfoValue}>
                              {request.purpose}
                            </Text>
                          </View>
                          <View style={styles.requestInfoRow}>
                            <Text style={styles.requestInfoLabel}>
                              Requested By:
                            </Text>
                            <Text style={styles.requestInfoValue}>
                              {request.requested_by}
                            </Text>
                          </View>
                          <View style={styles.requestInfoRow}>
                            <Text style={styles.requestInfoLabel}>
                              Category:
                            </Text>
                            <Text style={styles.requestInfoValue}>
                              {getCategoryName(request.main_category_id)}
                              {request.sub_category_id &&
                                ` • ${getSubCategoryName(request.sub_category_id)}`}
                            </Text>
                          </View>
                          <View style={styles.requestInfoRow}>
                            <Text style={styles.requestInfoLabel}>Date:</Text>
                            <Text style={styles.requestInfoValue}>
                              {formatDate(request.created_at)}
                            </Text>
                          </View>
                        </View>

                        {/* Approve All / Reject All Buttons for Approvers */}
                        {isApprover &&
                          request.visitors &&
                          request.visitors.length > 0 &&
                          request.visitors.some(
                            (v: any) => v.visitor_status === "pending",
                          ) && (
                            <View style={styles.approveRejectAllContainer}>
                              <TouchableOpacity
                                style={styles.approveAllButton}
                                onPress={() => handleApproveAllClick(request)}
                                disabled={processingStatus}
                              >
                                <Text style={styles.approveAllButtonText}>
                                  Approve All
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rejectAllButton}
                                onPress={() => handleRejectAllClick(request)}
                                disabled={processingStatus}
                              >
                                <Text style={styles.rejectAllButtonText}>
                                  Reject All
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}

                        {/* Visitors Section - Nested within the same card */}
                        {request.visitors && request.visitors.length > 0 && (
                          <View style={styles.visitorsSection}>
                            <Text style={styles.visitorsSectionTitle}>
                              Visitors ({request.visitors.length})
                            </Text>
                            {request.visitors.map(
                              (visitor: any, index: number) => {
                                const visitorId =
                                  visitor.id || `${request.id}-${index}`;
                                const isVisitorExpanded =
                                  expandedVisitors[visitorId] ?? true;

                                return (
                                  <View
                                    key={visitorId}
                                    style={styles.visitorItem}
                                  >
                                    <View style={styles.visitorItemHeader}>
                                      <View style={styles.visitorInfo}>
                                        <View
                                          style={[
                                            styles.avatar,
                                            { backgroundColor: "#457E51" },
                                          ]}
                                        >
                                          <Text style={styles.avatarText}>
                                            {getInitials(
                                              visitor.first_name || "",
                                              visitor.last_name || "",
                                            )}
                                          </Text>
                                        </View>
                                        <View style={styles.visitorDetails}>
                                          <Text style={styles.visitorName}>
                                            {visitor.first_name}{" "}
                                            {visitor.last_name}
                                          </Text>
                                          <Text style={styles.visitorId}>
                                            ID: {visitor.identification_type} -{" "}
                                            {visitor.identification_number}
                                          </Text>
                                        </View>
                                      </View>

                                      <TouchableOpacity
                                        onPress={() => toggleVisitor(visitorId)}
                                        style={styles.chevronButton}
                                      >
                                        <ChevronDownIcon
                                          width={18}
                                          height={18}
                                          style={{
                                            transform: [
                                              {
                                                rotate: isVisitorExpanded
                                                  ? "180deg"
                                                  : "0deg",
                                              },
                                            ],
                                          }}
                                        />
                                      </TouchableOpacity>
                                    </View>

                                    {isVisitorExpanded && (
                                      <View style={styles.visitorItemContent}>
                                        <View style={styles.visitorInfoRow}>
                                          <Text style={styles.visitorInfoLabel}>
                                            Status:
                                          </Text>
                                          <View
                                            style={
                                              styles.visitorStatusContainer
                                            }
                                          >
                                            {visitor.is_suspended === true ? (
                                              <View
                                                style={styles.suspendedStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.suspendedStatusText
                                                  }
                                                >
                                                  Suspended
                                                </Text>
                                              </View>
                                            ) : visitor.visitor_status ===
                                              "approved" ? (
                                              <View
                                                style={styles.approvedStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.approvedStatusText
                                                  }
                                                >
                                                  Approved
                                                </Text>
                                              </View>
                                            ) : visitor.visitor_status ===
                                              "rejected" ? (
                                              <View
                                                style={styles.rejectedStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.rejectedStatusText
                                                  }
                                                >
                                                  Rejected
                                                </Text>
                                              </View>
                                            ) : (
                                              <View
                                                style={styles.pendingStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.pendingStatusText
                                                  }
                                                >
                                                  Pending
                                                </Text>
                                              </View>
                                            )}
                                          </View>
                                        </View>
                                        {visitor.pass_number && (
                                          <View style={styles.visitorInfoRow}>
                                            <Text
                                              style={styles.visitorInfoLabel}
                                            >
                                              Pass:
                                            </Text>
                                            <View style={styles.passInfo}>
                                              {visitor.pass_qr_code && (
                                                <Image
                                                  source={{
                                                    uri: visitor.pass_qr_code,
                                                  }}
                                                  style={styles.qrCode}
                                                />
                                              )}
                                              <Text style={styles.passNumber}>
                                                #{visitor.pass_number}
                                              </Text>
                                            </View>
                                          </View>
                                        )}
                                        {/* Approve/Reject Buttons for Approvers */}
                                        {isApprover &&
                                          visitor.visitor_status === "pending" && (
                                            <View
                                              style={
                                                styles.approveRejectButtonsContainer
                                              }
                                            >
                                              <TouchableOpacity
                                                style={styles.approveButton}
                                                onPress={() =>
                                                  handleApproveClick(visitor)
                                                }
                                                disabled={processingStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.approveButtonText
                                                  }
                                                >
                                                  Approve
                                                </Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity
                                                style={styles.rejectButton}
                                                onPress={() =>
                                                  handleRejectClick(visitor)
                                                }
                                                disabled={processingStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.rejectButtonText
                                                  }
                                                >
                                                  Reject
                                                </Text>
                                              </TouchableOpacity>
                                            </View>
                                          )}

                                        <TouchableOpacity
                                          style={styles.viewDetailsButton}
                                          onPress={() =>
                                            handleVisitorClick(request, visitor)
                                          }
                                        >
                                          <Text
                                            style={styles.viewDetailsButtonText}
                                          >
                                            View Details
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                );
                              },
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Approve All Modal */}
      <Modal
        visible={showApproveAllModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApproveAllModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowApproveAllModal(false)}
        >
          <View
            style={styles.approveModalContent}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.modalCloseButtonTop}
              onPress={() => setShowApproveAllModal(false)}
            >
              <CloseIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.approveModalTitle}>
              Approve All Visitors
            </Text>
            <Text style={styles.approveModalSubtitle}>
              Add optional comments for approval
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Add any comments about this approval..."
              placeholderTextColor="#9CA3AF"
              value={approveComment}
              onChangeText={setApproveComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowApproveAllModal(false);
                  setApproveComment("");
                }}
                disabled={processingStatus}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApproveButton}
                onPress={executeApproveAll}
                disabled={processingStatus}
              >
                {processingStatus ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalApproveButtonText}>
                    Approve All
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reject All Modal */}
      <Modal
        visible={showRejectAllModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRejectAllModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRejectAllModal(false)}
        >
          <View
            style={styles.rejectModalContent}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.modalCloseButtonTop}
              onPress={() => setShowRejectAllModal(false)}
            >
              <CloseIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.rejectModalTitle}>Reject All Visitors</Text>
            <Text style={styles.rejectModalSubtitle}>
              Please provide a reason for rejection
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Please provide a reason for rejection..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRejectAllModal(false);
                  setRejectReason("");
                }}
                disabled={processingStatus}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={executeRejectAll}
                disabled={processingStatus}
              >
                {processingStatus ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalRejectButtonText}>Reject All</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Approve Individual Modal */}
      <Modal
        visible={showApproveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApproveModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowApproveModal(false)}
        >
          <View
            style={styles.approveModalContent}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.modalCloseButtonTop}
              onPress={() => setShowApproveModal(false)}
            >
              <CloseIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.approveModalTitle}>Approve Visitor</Text>
            <Text style={styles.approveModalSubtitle}>
              Add optional comments for approval
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Add any comments about this approval..."
              placeholderTextColor="#9CA3AF"
              value={approveComment}
              onChangeText={setApproveComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowApproveModal(false);
                  setApproveComment("");
                }}
                disabled={processingStatus}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApproveButton}
                onPress={executeApprove}
                disabled={processingStatus}
              >
                {processingStatus ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalApproveButtonText}>Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reject Individual Modal */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRejectModal(false)}
        >
          <View
            style={styles.rejectModalContent}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.modalCloseButtonTop}
              onPress={() => setShowRejectModal(false)}
            >
              <CloseIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.rejectModalTitle}>Reject Visitor</Text>
            <Text style={styles.rejectModalSubtitle}>
              Please provide a reason for rejection
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Please provide a reason for rejection..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={processingStatus}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={executeReject}
                disabled={processingStatus}
              >
                {processingStatus ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalRejectButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pass Type Filter Modal */}
      <Modal
        visible={showPassTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPassTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPassTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pass Type</Text>
              <TouchableOpacity
                onPress={() => setShowPassTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  !selectedPassTypeId && styles.modalItemSelected,
                ]}
                onPress={() => handlePassTypeSelect(null)}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    !selectedPassTypeId && styles.modalItemTextSelected,
                  ]}
                >
                  All Pass Types
                </Text>
              </TouchableOpacity>
              {passTypes.map((passType) => (
                <TouchableOpacity
                  key={passType.id}
                  style={[
                    styles.modalItem,
                    selectedPassTypeId === passType.id &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => handlePassTypeSelect(passType)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedPassTypeId === passType.id &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {passType.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Filter Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity
                onPress={() => setShowStatusModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {[
                "All Status",
                "pending",
                "rejected",
                "approved",
                "routed for approval",
                "assigned to me",
                "suspended",
              ].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.modalItem,
                    selectedStatus === status && styles.modalItemSelected,
                  ]}
                  onPress={() =>
                    handleStatusSelect(status === "All Status" ? null : status)
                  }
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedStatus === status && styles.modalItemTextSelected,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: 12,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1,
  },
  summaryCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flexBasis: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  totalCard: {
    borderColor: "#111827",
  },
  pendingCard: {
    borderColor: "#F59E0B",
  },
  routedCard: {
    borderColor: "#F59E0B",
  },
  approvedCard: {
    borderColor: "#10B981",
  },
  rejectedCard: {
    borderColor: "#EF4444",
  },
  suspendedCard: {
    borderColor: "#111827",
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  searchSection: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    gap: 6,
  },
  filterText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 50,
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
  requestIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  requestCardContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 16,
  },
  requestDetailsSection: {
    gap: 10,
  },
  visitorsSection: {
    marginTop: 8,
  },
  visitorsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  visitorItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  visitorItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visitorItemContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 10,
  },
  chevronButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
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
  visitorInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  visitorInfoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  visitorInfoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  visitorStatusContainer: {
    flex: 2,
    alignItems: "flex-end",
  },
  visitorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  visitorDetails: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  visitorName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  visitorId: {
    fontSize: 11,
    color: "#6B7280",
  },
  approvedStatus: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  approvedStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  rejectedStatus: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  rejectedStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DC2626",
  },
  pendingStatus: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  pendingStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
  },
  suspendedStatus: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  suspendedStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },
  passInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qrCode: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  passNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "80%",
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 20,
    color: "#6B7280",
    fontWeight: "bold",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemSelected: {
    backgroundColor: "#EFF6FF",
  },
  modalItemText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  modalItemTextSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  approveRejectAllContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  approveAllButton: {
    flex: 1,
    backgroundColor: "#457E51",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  approveAllButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  rejectAllButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectAllButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  approveRejectButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#457E51",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  approveModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "85%",
    maxWidth: 400,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  rejectModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "85%",
    maxWidth: 400,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalCloseButtonTop: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  approveModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    marginTop: 8,
  },
  approveModalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  rejectModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    marginTop: 8,
  },
  rejectModalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  modalApproveButton: {
    backgroundColor: "#457E51",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  modalApproveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalRejectButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  modalRejectButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
