import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, MainCategory, PassTypeItem } from "@/services/api";
import Assembly from "../../assets/assembly.svg";
import DigitalPass from "../../assets/digitalPass.svg";
import VisitorIcon from "../../assets/visitor.svg";
import VisitorPassIcon from "../../assets/visitorPass.svg";
import LogOutIcon from "../../assets/logOut.svg";
import ApprovedIcon from "../../assets/approved.svg";
import BackGround from "../../assets/backGround.svg";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, "Home">;

type Props = {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
};

interface DashboardMetrics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  routedRequests: number;
  totalVisitors: number;
  // Department/Peshi specific metrics
  pendingHodApproval?: number;
  hodApproved?: number;
  hodRejected?: number;
  todayRequests?: number;
}

export default function HomeScreen({ navigation, route }: Props) {
  const userId = route.params?.userId || "";
  const userRole = route.params?.role || "";
  const hodApprover = route.params?.hod_approver || false;
  const userSubCategories = route.params?.sub_categories || [];
  const designation = route.params?.designation || null;

  // Store userFullName in state to persist it even when navigating back
  const [userFullName, setUserFullName] = useState<string>(
    route.params?.userFullName || "",
  );

  const [dashboardData, setDashboardData] = useState<DashboardMetrics>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    routedRequests: 0,
    totalVisitors: 0,
    pendingHodApproval: 0,
    hodApproved: 0,
    hodRejected: 0,
    todayRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Update userFullName from route params if provided (e.g., on initial load or when navigating with params)
  // Only update if route params have userFullName - don't clear it if route params don't have it
  useEffect(() => {
    if (route.params?.userFullName) {
      setUserFullName(route.params.userFullName);
    }
    // Note: We intentionally don't clear userFullName if route.params?.userFullName is undefined
    // This preserves the state when navigating back via goBack()
  }, [route.params?.userFullName]);

  // Restore userFullName from route params when screen comes into focus
  // Only update if route params have a value - preserve existing state if route params don't have it
  useFocusEffect(
    useCallback(() => {
      // Only update if route params have userFullName and it's different from current state
      // Don't clear it if route params don't have it - this preserves state when navigating back
      const routeUserFullName = route.params?.userFullName;
      if (routeUserFullName && routeUserFullName !== userFullName) {
        setUserFullName(routeUserFullName);
      }
      // If userFullName is already set in state, preserve it even if route params don't have it
      // This ensures state persists when navigating back via goBack()
    }, [route.params?.userFullName, userFullName]),
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      let passRequests = await api.getAllPassRequests(10000);

      // Filter requests by sub_category_id if role is department or peshi
      if (
        (userRole === "department" || userRole === "peshi") &&
        userSubCategories.length > 0
      ) {
        const allowedSubCategoryIds = userSubCategories.map(
          (subCat: any) => subCat.id,
        );
        passRequests = passRequests.filter((req: any) => {
          return (
            req.sub_category_id &&
            allowedSubCategoryIds.includes(req.sub_category_id)
          );
        });
      }

      // For legislative role, use visitor-level counts (same as VisitorsScreen)
      if (userRole === "legislative") {
        // Fetch categories and pass types for buildVisitorRows
        const allCategories = await api.getMainCategories();
        const allPassTypes = await api.getAllPassTypes();

        // Helper function to determine visitor status (same logic as VisitorsScreen)
        const getVisitorStatus = (visitor: any, request: any): string => {
          // Priority 1: If visitor is suspended, show as suspended (highest priority)
          if (visitor.is_suspended) {
            return "suspended";
          }
          // Priority 2: If pass has been generated, it's approved
          if (visitor.pass_generated_at) {
            return "approved";
          }
          // Priority 3: If visitor is individually routed to superior, show as routed
          if (visitor.visitor_routed_to) {
            return "routed_for_approval";
          }
          // Priority 4: If visitor is rejected, show rejected
          if (visitor.visitor_status === "rejected") {
            return "rejected";
          }
          // Priority 5: If request is approved, check if pass is generated
          if (request.status === "approved") {
            if (visitor.pass_generated_at) {
              return "approved";
            } else {
              return "pending"; // Approved but pass not generated yet
            }
          }
          // Priority 6: If request is routed_for_approval, check routing type
          if (request.status === "routed_for_approval") {
            if (!request.routed_by) {
              return "pending"; // Auto-routed from weblink - show as pending (awaiting legislative approval)
            } else {
              return "routed_for_approval"; // Manually routed by HOD
            }
          }
          // Priority 7: If request is pending but routed to legislative, show as pending
          if (request.routed_to && request.status === "pending") {
            return "pending"; // Request routed directly to legislative (non-department/peshi categories)
          }
          // Priority 8: Otherwise, use visitor status logic
          if (visitor.visitor_status === "approved" && !visitor.pass_generated_at) {
            return "pending"; // Pending legislative approval
          }
          return visitor.visitor_status || "pending";
        };

        // Helper function to check if visitor should be shown (same logic as VisitorsScreen)
        const shouldShowVisitor = (request: any, visitor: any): boolean => {
          // Check if request is routed to legislative
          const hasRouting = !!request.routed_to || !!request.routed_at;
          const isPendingWithRouting = request.status === "pending" && hasRouting;
          const isRoutedForApproval = request.status === "routed_for_approval";
          const isRequestApproved = request.status === "approved";
          const isPassGenerated = !!visitor.pass_generated_at;
          const isVisitorApprovedOrRejected =
            visitor.visitor_status === "approved" ||
            visitor.visitor_status === "rejected";
          const isVisitorRouted = !!visitor.visitor_routed_to;

          // Show visitor if:
          // 1. Request is pending but routed to legislative
          // 2. Request is routed_for_approval
          // 3. Request is approved
          // 4. Pass has been generated
          // 5. Visitor is approved or rejected
          // 6. Visitor has been routed to superior (show it with routed status)
          return (
            isPendingWithRouting ||
            isRoutedForApproval ||
            isRequestApproved ||
            isPassGenerated ||
            isVisitorApprovedOrRejected ||
            isVisitorRouted
          );
        };

        // Build visitor rows (same logic as VisitorsScreen)
        const visitorRows: any[] = [];
        passRequests.forEach((request: any) => {
          request.visitors?.forEach((visitor: any) => {
            if (!shouldShowVisitor(request, visitor)) {
              return; // Skip this visitor (pending department approval)
            }

            // Determine status with clear priority
            const visitorStatus = getVisitorStatus(visitor, request);

            visitorRows.push({
              id: visitor.id,
              requestId: request.request_id,
              status: visitorStatus,
            });
          });
        });

        // Calculate stats based on visitor rows (using processed status) - same as VisitorsScreen
        let pending = 0;
        let routed = 0;
        let approved = 0;
        let rejected = 0;
        let suspended = 0;

        visitorRows.forEach((visitorRow) => {
          const status = visitorRow.status;
          if (status === "suspended") {
            suspended++;
          } else if (status === "routed_for_approval") {
            routed++;
          } else if (status === "approved") {
            approved++;
          } else if (status === "rejected") {
            rejected++;
          } else if (status === "pending") {
            pending++;
          }
        });

        // Total visitors is the sum of all categories
        const totalVisitors = pending + routed + approved + rejected + suspended;

        setDashboardData({
          totalRequests: visitorRows.length > 0 ? new Set(visitorRows.map((vr) => vr.requestId)).size : 0,
          pendingRequests: pending, // Visitor-level count
          approvedRequests: approved, // Visitor-level count
          rejectedRequests: rejected, // Visitor-level count
          routedRequests: routed, // Visitor-level count
          totalVisitors,
        });
      } else if (userRole !== "department" && userRole !== "peshi") {
        // For other non-department/peshi roles, use web logic with visitor filtering
        // Helper function to check if visitor should be shown (same logic as visitors page)
        const shouldShowVisitor = (request: any, visitor: any): boolean => {
          // Check if request is routed to legislative (either pending with routing or routed_for_approval)
          const hasRouting = !!request.routed_to || !!request.routed_at;
          const isPendingWithRouting =
            request.status === "pending" && hasRouting;
          const isRoutedForApproval = request.status === "routed_for_approval";
          const isRequestApproved = request.status === "approved";
          const isPassGenerated = !!visitor.pass_generated_at;
          const isVisitorApprovedOrRejected =
            visitor.visitor_status === "approved" ||
            visitor.visitor_status === "rejected";
          const isVisitorRouted = !!visitor.visitor_routed_to;

          // Show visitor if:
          // 1. Request is pending but routed to legislative
          // 2. Request is routed_for_approval
          // 3. Request is approved
          // 4. Pass has been generated
          // 5. Visitor is approved or rejected
          // 6. Visitor has been routed to superior (show it with routed status)
          return (
            isPendingWithRouting ||
            isRoutedForApproval ||
            isRequestApproved ||
            isPassGenerated ||
            isVisitorApprovedOrRejected ||
            isVisitorRouted
          );
        };

        // Helper function to determine visitor status (same logic as visitors page)
        const getVisitorStatus = (visitor: any, request: any): string => {
          // Priority 1: If visitor is suspended, show as suspended (highest priority)
          if (visitor.is_suspended) {
            return "suspended";
          }
          // Priority 2: If pass has been generated, it's approved
          if (visitor.pass_generated_at) {
            return "approved";
          }
          // Priority 3: If visitor is individually routed to superior, show as routed
          if (visitor.visitor_routed_to) {
            return "routed_for_approval";
          }
          // Priority 4: If visitor is rejected, show rejected
          if (visitor.visitor_status === "rejected") {
            return "rejected";
          }
          // Priority 5: If request is approved, check if pass is generated
          if (request.status === "approved") {
            if (visitor.pass_generated_at) {
              return "approved";
            } else {
              return "pending"; // Approved but pass not generated yet
            }
          }
          // Priority 6: If request is routed_for_approval, check routing type
          if (request.status === "routed_for_approval") {
            if (!request.routed_by) {
              return "pending"; // Auto-routed from weblink
            } else {
              return "routed_for_approval"; // Manually routed by HOD
            }
          }
          // Priority 7: If request is pending but routed to legislative, show as pending
          if (request.routed_to && request.status === "pending") {
            return "pending";
          }
          // Priority 8: Otherwise, use visitor status logic
          if (
            visitor.visitor_status === "approved" &&
            !visitor.pass_generated_at
          ) {
            return "pending"; // Pending legislative approval
          }
          return visitor.visitor_status || "pending";
        };

        let totalRequests = 0;
        let totalVisitors = 0;
        const statusCounts = {
          pending: { requests: 0, visitors: 0 },
          approved: { requests: 0, visitors: 0 },
          rejected: { requests: 0, visitors: 0 },
          routed_for_approval: { requests: 0, visitors: 0 },
        };

        passRequests.forEach((request: any) => {
          // Count only visitors that should be shown (same filtering as visitors page)
          const visibleVisitors =
            request.visitors?.filter((visitor: any) =>
              shouldShowVisitor(request, visitor),
            ) || [];
          const visitorCount = visibleVisitors.length;

          // Only count request if it has at least one visible visitor
          if (visitorCount > 0) {
            totalRequests++;
            totalVisitors += visitorCount;

            // Status counts - determine visitor status for each visible visitor
            visibleVisitors.forEach((visitor: any) => {
              const visitorStatus = getVisitorStatus(visitor, request);

              // Count by visitor status
              if (visitorStatus === "pending") {
                statusCounts.pending.visitors++;
              } else if (visitorStatus === "approved") {
                statusCounts.approved.visitors++;
              } else if (visitorStatus === "rejected") {
                statusCounts.rejected.visitors++;
              } else if (visitorStatus === "routed_for_approval") {
                statusCounts.routed_for_approval.visitors++;
              }
            });

            // Status counts for requests
            const status = request.status;
            if (status === "pending") {
              statusCounts.pending.requests++;
            } else if (status === "approved") {
              statusCounts.approved.requests++;
            } else if (status === "rejected") {
              statusCounts.rejected.requests++;
            } else if (status === "routed_for_approval") {
              statusCounts.routed_for_approval.requests++;
            }
          }
        });

        setDashboardData({
          totalRequests,
          pendingRequests: statusCounts.pending.requests,
          approvedRequests: statusCounts.approved.requests,
          rejectedRequests: statusCounts.rejected.requests,
          routedRequests: statusCounts.routed_for_approval.requests,
          totalVisitors,
        });
      } else if (userRole === "peshi") {
        // For peshi role, use peshi-specific web logic
        // Fetch categories to get peshi main category ID
        const categories = await api.getMainCategories();

        // Get peshi main category ID
        const peshiCategory = categories.find(
          (cat) => cat.type?.toLowerCase() === "peshi",
        );
        const peshiMainCategoryId = peshiCategory?.id || null;

        // Filter requests:
        // 1. Filter by peshi main category (if set)
        // 2. Filter by user's sub-categories (already done above)
        let filteredRequests = passRequests;

        if (peshiMainCategoryId) {
          filteredRequests = filteredRequests.filter(
            (req) => req.main_category_id === peshiMainCategoryId,
          );
        }

        // Calculate date ranges for today's requests
        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

        // Calculate stats (matching peshi web logic)
        const totalRequests = filteredRequests.length;
        const pendingHodApproval = filteredRequests.filter(
          (req) => req.status === "pending",
        ).length;
        const hodApproved = filteredRequests.filter(
          (req) => req.status === "routed_for_approval",
        ).length;
        const hodRejected = filteredRequests.filter(
          (req) => req.status === "rejected",
        ).length;
        const todayRequests = filteredRequests.filter(
          (req) => new Date(req.created_at) >= todayStart,
        ).length;

        // Count requests that have visitors (requests with at least one visitor)
        const totalVisitors = filteredRequests.reduce((sum, req) => {
          return sum + (req.visitors?.length || 0);
        }, 0);

        setDashboardData({
          totalRequests,
          pendingRequests: pendingHodApproval,
          approvedRequests: hodApproved, // Map hodApproved to approvedRequests for display
          rejectedRequests: hodRejected,
          routedRequests: hodApproved, // Map hodApproved to routedRequests for display
          totalVisitors,
          // Peshi specific metrics
          pendingHodApproval,
          hodApproved,
          hodRejected,
          todayRequests,
        });
      } else {
        // For department role, use department-specific web logic
        // Fetch categories to get department main category ID
        const categories = await api.getMainCategories();

        // Get department main category ID
        const departmentCategory = categories.find(
          (cat) => cat.type?.toLowerCase() === "department",
        );
        const deptMainCategoryId = departmentCategory?.id || null;

        // Filter requests:
        // 1. Filter by department main category (if set)
        // 2. Filter by user's sub-categories (already done above)
        let filteredRequests = passRequests;

        if (deptMainCategoryId) {
          filteredRequests = filteredRequests.filter(
            (req) => req.main_category_id === deptMainCategoryId,
          );
        }

        // Calculate date ranges for today's requests
        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

        // Calculate stats (matching department web logic)
        const totalRequests = filteredRequests.length;
        const pendingHodApproval = filteredRequests.filter(
          (req) => req.status === "pending",
        ).length;
        const hodApproved = filteredRequests.filter(
          (req) => req.status === "routed_for_approval",
        ).length;
        const hodRejected = filteredRequests.filter(
          (req) => req.status === "rejected",
        ).length;
        const todayRequests = filteredRequests.filter(
          (req) => new Date(req.created_at) >= todayStart,
        ).length;

        // Count requests that have visitors (requests with at least one visitor)
        const totalVisitors = filteredRequests.reduce((sum, req) => {
          return sum + (req.visitors?.length || 0);
        }, 0);

        setDashboardData({
          totalRequests,
          pendingRequests: pendingHodApproval,
          approvedRequests: hodApproved, // Map hodApproved to approvedRequests for display
          rejectedRequests: hodRejected,
          routedRequests: hodApproved, // Map hodApproved to routedRequests for display
          totalVisitors,
          // Department specific metrics
          pendingHodApproval,
          hodApproved,
          hodRejected,
          todayRequests,
        });
      }
    } catch (error) {
      // Set default values on error
      setDashboardData({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        routedRequests: 0,
        totalVisitors: 0,
        pendingHodApproval: 0,
        hodApproved: 0,
        hodRejected: 0,
        todayRequests: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchDashboardData();
  }, []);

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

  const handleInstaPass = () => {
    if (userRole === "department" || userRole === "peshi") {
      navigation.navigate("MyPassRequests", {
        userId,
        userFullName,
        designation: designation || undefined,
        sub_categories: userSubCategories,
      });
    } else {
      navigation.navigate("IssueVisitorPass", {
        userFullName,
        userId,
      });
    }
  };

  const handleVisitors = () => {
    if (userRole === "department" || userRole === "peshi") {
      navigation.navigate("StatusAndApprovals", {
        userId: userId,
        hod_approver: hodApprover,
        sub_categories: userSubCategories,
        userFullName: userFullName,
        role: userRole,
      });
    } else {
      navigation.navigate("Visitors", {
        role: userRole,
        userId: userId,
        hod_approver: hodApprover,
        sub_categories: userSubCategories,
      });
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom", "left", "right"]}
    >
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
          <View style={styles.headerContent}>
            {userFullName && (
              <Text style={styles.welcomeText}>
                Welcome,{" "}
                <Text style={styles.userFullNameBold}>{userFullName}</Text>
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOutIcon width={20} height={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dashboard Section */}
        <View style={styles.dashboardSectionContainer}>
          <View style={styles.dashboardSection}>
            <Text style={styles.dashboardHeading}>
              {userRole
                ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`
                : "Dashboard"}
            </Text>
            <Text style={styles.dashboardSubheading}>
              {userRole === "department" || userRole === "peshi"
                ? "Manage pass requests and HOD approvals"
                : "Comprehensive overview of pass requests and approvals"}
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : (
              <View style={styles.metricsContainer}>
                {/* Total Visitors */}
                <View style={[styles.metricCard, styles.totalVisitorsCard]}>
                  <View style={styles.iconAndCountContainer}>
                    <View style={[styles.iconBox, styles.totalVisitorsIconBox]}>
                      <VisitorIcon width={16} height={16} />
                    </View>
                    <Text
                      style={[styles.metricValue, styles.totalVisitorsValue]}
                    >
                      {dashboardData.totalVisitors}
                    </Text>
                  </View>
                  <Text style={[styles.metricLabel, styles.totalVisitorsLabel]}>
                    VISITORS
                  </Text>
                </View>

                {/* Pending Requests / Pending HOD Approval */}
                <View style={[styles.metricCard, styles.pendingRequestsCard]}>
                  <View style={styles.iconAndCountContainer}>
                    <View
                      style={[styles.iconBox, styles.pendingRequestsIconBox]}
                    >
                      <View style={styles.clockIcon}>
                        <View style={styles.clockCircle} />
                        <View style={styles.clockHandHour} />
                        <View style={styles.clockHandMinute} />
                      </View>
                    </View>
                    <Text
                      style={[styles.metricValue, styles.pendingRequestsValue]}
                    >
                      {userRole === "department" || userRole === "peshi"
                        ? (dashboardData.pendingHodApproval ??
                          dashboardData.pendingRequests)
                        : dashboardData.pendingRequests}
                    </Text>
                  </View>
                  <Text
                    style={[styles.metricLabel, styles.pendingRequestsLabel]}
                  >
                    {userRole === "department" || userRole === "peshi"
                      ? "PENDING HOD APPROVAL"
                      : "PENDING"}
                  </Text>
                </View>

                {/* Approved Requests / HOD Approved */}
                <View style={[styles.metricCard, styles.approvedRequestsCard]}>
                  <View style={styles.iconAndCountContainer}>
                    <View
                      style={[styles.iconBox, styles.approvedRequestsIconBox]}
                    >
                      <ApprovedIcon width={16} height={16} />
                    </View>
                    <Text
                      style={[styles.metricValue, styles.approvedRequestsValue]}
                    >
                      {userRole === "department" || userRole === "peshi"
                        ? (dashboardData.hodApproved ??
                          dashboardData.approvedRequests)
                        : dashboardData.approvedRequests}
                    </Text>
                  </View>
                  <Text
                    style={[styles.metricLabel, styles.approvedRequestsLabel]}
                  >
                    {userRole === "department" || userRole === "peshi"
                      ? "HOD APPROVED"
                      : "APPROVED"}
                  </Text>
                </View>

                {/* Routed Requests / Today's Requests */}
                <View style={[styles.metricCard, styles.routedRequestsCard]}>
                  <View style={styles.iconAndCountContainer}>
                    <View
                      style={[styles.iconBox, styles.routedRequestsIconBox]}
                    >
                      {userRole === "department" || userRole === "peshi" ? (
                        <View style={styles.clockIcon}>
                          <View style={styles.clockCircle} />
                          <View style={styles.clockHandHour} />
                          <View style={styles.clockHandMinute} />
                        </View>
                      ) : (
                        <View style={styles.routedIcon}>
                          <View style={styles.arrowLeft} />
                          <View style={styles.arrowRight} />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.metricValue, styles.routedRequestsValue]}
                    >
                      {userRole === "department" || userRole === "peshi"
                        ? (dashboardData.todayRequests ?? 0)
                        : dashboardData.routedRequests}
                    </Text>
                  </View>
                  <Text
                    style={[styles.metricLabel, styles.routedRequestsLabel]}
                  >
                    {userRole === "department" || userRole === "peshi"
                      ? "TODAY'S REQUESTS"
                      : "ROUTED"}
                  </Text>
                </View>

                {/* Rejected Requests / HOD Rejected */}
                <View style={[styles.metricCard, styles.rejectedRequestsCard]}>
                  <View style={styles.iconAndCountContainer}>
                    <View
                      style={[styles.iconBox, styles.rejectedRequestsIconBox]}
                    >
                      <View style={styles.rejectedIcon}>
                        <View
                          style={[styles.rejectedLine, styles.rejectedLine1]}
                        />
                        <View
                          style={[styles.rejectedLine, styles.rejectedLine2]}
                        />
                      </View>
                    </View>
                    <Text
                      style={[styles.metricValue, styles.rejectedRequestsValue]}
                    >
                      {userRole === "department" || userRole === "peshi"
                        ? (dashboardData.hodRejected ??
                          dashboardData.rejectedRequests)
                        : dashboardData.rejectedRequests}
                    </Text>
                  </View>
                  <Text
                    style={[styles.metricLabel, styles.rejectedRequestsLabel]}
                  >
                    {userRole === "department" || userRole === "peshi"
                      ? "HOD REJECTED"
                      : "REJECTED"}
                  </Text>
                </View>

                {/* Total Requests */}
                <View style={[styles.metricCard, styles.totalRequestsCard]}>
                  <View style={styles.iconAndCountContainer}>
                    <View style={[styles.iconBox, styles.totalRequestsIconBox]}>
                      <View style={styles.documentIcon}>
                        <View style={styles.documentLine} />
                        <View style={[styles.documentLine, { width: "60%" }]} />
                        <View style={[styles.documentLine, { width: "80%" }]} />
                      </View>
                    </View>
                    <Text
                      style={[styles.metricValue, styles.totalRequestsValue]}
                    >
                      {dashboardData.totalRequests}
                    </Text>
                  </View>
                  <Text style={[styles.metricLabel, styles.totalRequestsLabel]}>
                    TOTAL REQUESTS
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Navigation Section */}
        <View style={styles.navigationSectionContainer}>
          <View style={styles.navigationSection}>
            <Text style={styles.navigationTitle}>Quick Actions</Text>
            <View style={styles.cardsContainer}>
              {/* Insta Pass Card */}
              <TouchableOpacity
                style={styles.card}
                onPress={handleInstaPass}
                activeOpacity={0.7}
              >
                <View style={styles.cardIconContainer}>
                  <VisitorPassIcon width={50} height={50} />
                </View>
                <Text style={styles.cardTitle}>
                  {userRole === "department" || userRole === "peshi"
                    ? "Request Pass"
                    : "Insta Pass"}
                </Text>
                <Text style={styles.cardDescription}>
                  {userRole === "department" || userRole === "peshi"
                    ? "View and manage all your visitor pass requests"
                    : "Issue a new visitor pass instantly"}
                </Text>
              </TouchableOpacity>

              {/* Visitors Card */}
              <TouchableOpacity
                style={styles.card}
                onPress={handleVisitors}
                activeOpacity={0.7}
              >
                <View style={styles.cardIconContainer}>
                  <VisitorIcon width={50} height={50} />
                </View>
                <Text style={styles.cardTitle}>
                  {userRole === "department" || userRole === "peshi"
                    ? "Status & Approvals"
                    : "Visitors"}
                </Text>
                <Text style={styles.cardDescription}>
                  {userRole === "department" || userRole === "peshi"
                    ? "Review and manage all HOD approval requests"
                    : "View and manage visitor records"}
                </Text>
              </TouchableOpacity>
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
  scrollView: {
    zIndex: 1,
  },
  headerContainer: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  userFullNameBold: {
    fontWeight: "bold",
  },
  logoutButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 40,
  },
  navigationSectionContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  navigationSection: {
    marginTop: 0,
  },
  navigationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
    minWidth: 0, // Allows flex to work properly
  },
  cardIconContainer: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  dashboardSectionContainer: {
    backgroundColor: "transparent",
    marginBottom: 20,
    marginHorizontal: 16,
  },
  dashboardSection: {
    marginBottom: 0,
  },
  dashboardHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  dashboardSubheading: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricCard: {
    borderRadius: 12,
    padding: 12,
    flexBasis: "31%",
    flexGrow: 0,
    flexShrink: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconAndCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  totalRequestsCard: {
    backgroundColor: "#DBEAFE", // Light blue gradient
  },
  pendingRequestsCard: {
    backgroundColor: "#FEF3C7", // Light yellow gradient
  },
  approvedRequestsCard: {
    backgroundColor: "#D1FAE5", // Light green gradient
  },
  rejectedRequestsCard: {
    backgroundColor: "#FEE2E2", // Light red gradient
  },
  routedRequestsCard: {
    backgroundColor: "#E9D5FF", // Light purple gradient
  },
  totalVisitorsCard: {
    backgroundColor: "#F3F4F6", // Light grey gradient
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  totalRequestsIconBox: {
    backgroundColor: "#3B82F6", // Dark blue
  },
  pendingRequestsIconBox: {
    backgroundColor: "#F59E0B", // Dark orange
  },
  approvedRequestsIconBox: {
    backgroundColor: "#10B981", // Dark green
  },
  routedRequestsIconBox: {
    backgroundColor: "#8B5CF6", // Dark purple
  },
  rejectedRequestsIconBox: {
    backgroundColor: "#EF4444", // Dark red
  },
  totalVisitorsIconBox: {
    backgroundColor: "#6B7280", // Dark grey
  },
  iconText: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  documentIcon: {
    width: 12,
    height: 12,
    justifyContent: "space-between",
  },
  documentLine: {
    height: 1.5,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    width: "100%",
  },
  clockIcon: {
    width: 16,
    height: 16,
    position: "relative",
  },
  clockCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  clockHandHour: {
    position: "absolute",
    top: 5,
    left: 7,
    width: 1.5,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
  clockHandMinute: {
    position: "absolute",
    top: 3,
    left: 7,
    width: 1.5,
    height: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
  routedIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  arrowLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderRightWidth: 5,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#FFFFFF",
  },
  arrowRight: {
    width: 0,
    height: 0,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: 5,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFFFFF",
  },
  rejectedIcon: {
    width: 12,
    height: 12,
    position: "relative",
  },
  rejectedLine: {
    position: "absolute",
    width: 10,
    height: 1.5,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
  rejectedLine1: {
    top: 5,
    left: 1,
    transform: [{ rotate: "45deg" }],
  },
  rejectedLine2: {
    top: 5,
    left: 1,
    transform: [{ rotate: "-45deg" }],
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  totalRequestsValue: {
    color: "#1E40AF", // Dark blue
  },
  pendingRequestsValue: {
    color: "#D97706", // Dark orange
  },
  approvedRequestsValue: {
    color: "#059669", // Dark green
  },
  routedRequestsValue: {
    color: "#7C3AED", // Dark purple
  },
  rejectedRequestsValue: {
    color: "#DC2626", // Dark red
  },
  totalVisitorsValue: {
    color: "#374151", // Dark grey
  },
  metricLabel: {
    fontSize: 10,
    textAlign: "left",
    fontWeight: "600",
    width: "100%",
  },
  totalRequestsLabel: {
    color: "#1E40AF", // Dark blue
  },
  pendingRequestsLabel: {
    color: "#D97706", // Dark orange
  },
  approvedRequestsLabel: {
    color: "#059669", // Dark green
  },
  routedRequestsLabel: {
    color: "#7C3AED", // Dark purple
  },
  rejectedRequestsLabel: {
    color: "#DC2626", // Dark red
  },
  totalVisitorsLabel: {
    color: "#374151", // Dark grey
  },
});
