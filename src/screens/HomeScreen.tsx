import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/services/api";
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
}

export default function HomeScreen({ navigation, route }: Props) {
  const userFullName = route.params?.userFullName || "";
  const userId = route.params?.userId || "";
  const userRole = route.params?.role || "";
  const hodApprover = route.params?.hod_approver || false;
  const legislativeApprover = route.params?.legislative_approver || false;

  const [dashboardData, setDashboardData] = useState<DashboardMetrics>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    routedRequests: 0,
    totalVisitors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const passRequests = await api.getAllPassRequests(10000);

      // Calculate metrics based on top-level requests only
      const totalRequests = passRequests.length;

      // Count requests by their status
      const pendingRequests = passRequests.filter(
        (req) => req.status === "pending",
      ).length;

      const approvedRequests = passRequests.filter(
        (req) => req.status === "approved",
      ).length;

      const rejectedRequests = passRequests.filter(
        (req) => req.status === "rejected",
      ).length;

      // Count routed requests - only count requests with routed_to (request-level routing)
      const routedRequests = passRequests.filter((req) => {
        return req.routed_to !== null && req.routed_to !== undefined;
      }).length;

      // Count requests that have visitors (requests with at least one visitor)
      const totalVisitors = passRequests.reduce((sum, req) => {
        return sum + (req.visitors?.length || 0);
      }, 0);

      setDashboardData({
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        routedRequests,
        totalVisitors,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set default values on error
      setDashboardData({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        routedRequests: 0,
        totalVisitors: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Navigate back to login method selection
    navigation.replace("LoginMethodSelection");
  };

  const handleInstaPass = () => {
    navigation.navigate("IssueVisitorPass", {
      userFullName,
      userId,
    });
  };

  const handleVisitors = () => {
    navigation.navigate("Visitors", {
      role: userRole,
      userId: userId,
      hod_approver: hodApprover,
      legislative_approver: legislativeApprover,
    });
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
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
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
              Comprehensive overview of pass requests and approvals
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : (
              <View style={styles.metricsContainer}>
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

                {/* Pending Requests */}
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
                      {dashboardData.pendingRequests}
                    </Text>
                  </View>
                  <Text
                    style={[styles.metricLabel, styles.pendingRequestsLabel]}
                  >
                    PENDING
                  </Text>
                </View>

                {/* Approved Requests */}
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
                      {dashboardData.approvedRequests}
                    </Text>
                  </View>
                  <Text
                    style={[styles.metricLabel, styles.approvedRequestsLabel]}
                  >
                    APPROVED
                  </Text>
                </View>

                {/* Routed Requests */}
                <View style={[styles.metricCard, styles.routedRequestsCard]}>
                  <View style={styles.iconAndCountContainer}>
                    <View
                      style={[styles.iconBox, styles.routedRequestsIconBox]}
                    >
                      <View style={styles.routedIcon}>
                        <View style={styles.arrowLeft} />
                        <View style={styles.arrowRight} />
                      </View>
                    </View>
                    <Text
                      style={[styles.metricValue, styles.routedRequestsValue]}
                    >
                      {dashboardData.routedRequests}
                    </Text>
                  </View>
                  <Text
                    style={[styles.metricLabel, styles.routedRequestsLabel]}
                  >
                    ROUTED
                  </Text>
                </View>

                {/* Rejected Requests */}
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
                      {dashboardData.rejectedRequests}
                    </Text>
                  </View>
                  <Text
                    style={[styles.metricLabel, styles.rejectedRequestsLabel]}
                  >
                    REJECTED
                  </Text>
                </View>

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
                <Text style={styles.cardTitle}>Insta Pass</Text>
                <Text style={styles.cardDescription}>
                  Issue a new visitor pass instantly
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
                <Text style={styles.cardTitle}>Visitors</Text>
                <Text style={styles.cardDescription}>
                  View and manage visitor records
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
    padding: 8,
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
