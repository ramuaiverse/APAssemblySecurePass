import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, MainCategory, User } from "@/services/api";
import BackButtonIcon from "../../assets/backButton.svg";
import CloseIcon from "../../assets/close.svg";
import CalendarIcon from "../../assets/calendar.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";
import LogOutIcon from "../../assets/logOut.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import { Ionicons } from "@expo/vector-icons";

type StatusAndApprovalsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "StatusAndApprovals"
>;

type Props = {
  navigation: StatusAndApprovalsScreenNavigationProp;
  route: RouteProp<RootStackParamList, "StatusAndApprovals">;
};

interface PassRequestUI {
  id: string;
  requestId: string;
  visitors: VisitorUI[];
  visitDate: string;
  visitTime: string;
  purpose: string;
  submittedDate: string;
  requestedBy: string;
  overallStatus: "pending" | "approved" | "rejected" | "routed_for_approval" | "partial";
  hodApprovedBy?: string;
  legislativeApprovedBy?: string;
  legislativeApprovedAt?: string;
}

interface VisitorUI {
  id: string;
  name: string;
  email: string;
  phone: string;
  identificationType: string;
  identificationNumber: string;
  status: "pending" | "approved" | "denied";
  approvedBy?: string;
  approverComments?: string;
  denialReason?: string;
  approvedDate?: string;
  deniedDate?: string;
  validFrom?: string;
  validTo?: string;
  purpose?: string;
  passTypeId?: string;
  passTypeName?: string;
  passGeneratedAt?: string;
  car_passes?: any[];
  identification_document_url?: string;
}

export default function StatusAndApprovalsScreen({ navigation, route }: Props) {
  const userId = route.params?.userId || "";
  const hodApprover = route.params?.hod_approver || false;
  const userSubCategories = route.params?.sub_categories || [];
  const userRole = route.params?.role || "";

  const [passes, setPasses] = useState<PassRequestUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "routed_for_approval"
  >("all");
  const [dateFilterType, setDateFilterType] = useState<
    "submittedDate" | "visitDate" | "approvedDate"
  >("submittedDate");
  const [dateFilterMode, setDateFilterMode] = useState<"none" | "today" | "other">("none");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [expandedVisitorDetails, setExpandedVisitorDetails] = useState<Set<string>>(new Set());
  const [showActionModal, setShowActionModal] = useState<{
    requestId: string;
    action: "approve" | "reject";
  } | null>(null);
  const [showVisitorActionModal, setShowVisitorActionModal] = useState<{
    visitorId: string;
    requestId: string;
    action: "approve" | "reject";
  } | null>(null);
  const [actionComments, setActionComments] = useState("");
  const [visitorActionComments, setVisitorActionComments] = useState("");
  const [processingStatus, setProcessingStatus] = useState<Set<string>>(new Set());
  const [processingVisitorStatus, setProcessingVisitorStatus] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [userSubCategoryIds, setUserSubCategoryIds] = useState<string[]>([]);
  const [departmentMainCategoryId, setDepartmentMainCategoryId] = useState<string | null>(null);
  const [peshiMainCategoryId, setPeshiMainCategoryId] = useState<string | null>(null);
  const [isHodApprover, setIsHodApprover] = useState<boolean>(false);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(20);
  const itemsPerPage = 20;
  const [loadingMore, setLoadingMore] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<"from" | "to">("from");

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

  useEffect(() => {
    if (dateFilterMode === "today") {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (dateFilterMode === "none") {
      setDateFrom("");
      setDateTo("");
    }
  }, [dateFilterMode]);

  const transformAPIData = async (
    apiRequests: any[],
    hodApproverStatus: boolean = false,
    userSubCategoryIdsParam: string[] = [],
    mainCategoryIdParam: string | null = null,
    currentUserIdParam: string | null = null,
    roleParam: string = ""
  ): Promise<PassRequestUI[]> => {
    // Fetch all main categories to check for insta pass types
    let instaCategoryIds: Set<string> = new Set();
    try {
      const allCategories = await api.getMainCategories();
      instaCategoryIds = new Set(
        allCategories
          .filter((cat) => cat.type?.toLowerCase().includes("insta"))
          .map((cat) => cat.id)
      );
    } catch (err) {
      // Error fetching categories
    }

    // Fetch all pass types to map pass_type_id to pass type name
    let passTypeMap: Map<string, string> = new Map();
    try {
      const allPassTypes = await api.getAllPassTypes();
      allPassTypes.forEach((pt) => {
        passTypeMap.set(pt.id, pt.name);
      });
    } catch (err) {
      // Error fetching pass types
    }

    // Filter requests
    let filteredRequests = apiRequests.filter(
      (request) => !instaCategoryIds.has(request.main_category_id)
    );

    const effectiveMainCategoryId = mainCategoryIdParam || (userRole === "peshi" ? peshiMainCategoryId : departmentMainCategoryId);
    const effectiveSubCategoryIds =
      userSubCategoryIdsParam.length > 0 ? userSubCategoryIdsParam : userSubCategoryIds;
    const effectiveCurrentUserId = currentUserIdParam || currentUserId;
    const effectiveRole = roleParam || userRole;

    // Filter by main category based on role (department or peshi)
    if (effectiveMainCategoryId) {
      filteredRequests = filteredRequests.filter(
        (request) => request.main_category_id === effectiveMainCategoryId
      );
    } else {
      // If main category is not found, filter out all requests (safety)
      filteredRequests = [];
    }

    // Filter by user's sub-categories (department/peshi type) - e.g., "irrigation"
    // This ensures each HOD only sees requests from their specific department/peshi type
    // Only filter by sub-category if user has sub-categories assigned
    // If user has no sub-categories, show all requests (filtered by requested_by for non-HOD users)
    if (effectiveSubCategoryIds.length > 0) {
      // Convert both to strings for reliable comparison (UUIDs might be objects or strings)
      const userSubCategoryIdsStr = effectiveSubCategoryIds.map((id) => String(id).toLowerCase());
      filteredRequests = filteredRequests.filter((request) => {
        if (!request.sub_category_id) {
          return false; // Exclude requests without sub_category_id
        }
        const requestSubCategoryIdStr = String(request.sub_category_id).toLowerCase();
        const isMatch = userSubCategoryIdsStr.includes(requestSubCategoryIdStr);
        return isMatch;
      });
    } else {
      // If user has no sub-categories assigned, don't filter by sub-category
      // (they'll still be filtered by main category and requested_by for non-HOD users)
    }

    // Filter by requested_by only if user is NOT an HOD approver
    // HOD approvers see ALL requests for their department/peshi type (from all users in that type)
    // Non-HOD users only see their own requests
    if (!hodApproverStatus) {
      const userFullName = route.params?.userFullName || "";
      const loggedInUsername = route.params?.username || "";
      
      if (effectiveCurrentUserId || loggedInUsername || userFullName) {
        filteredRequests = filteredRequests.filter((request) => {
          const requestedBy = request.requested_by || "";
          const requestedByLower = requestedBy.toLowerCase().trim();
          
          let matchesRequestedBy = false;
          
          // First check if requested_by matches current user ID (new requests)
          if (effectiveCurrentUserId) {
            matchesRequestedBy = requestedByLower === effectiveCurrentUserId.toLowerCase().trim();
          }
          
          // If not matched by ID, check if it matches username (old requests for backward compatibility)
          if (!matchesRequestedBy && loggedInUsername) {
            matchesRequestedBy = requestedByLower === loggedInUsername.toLowerCase().trim();
          }
          
          // If still not matched, check if it matches full name (old requests for backward compatibility)
          if (!matchesRequestedBy && userFullName) {
            matchesRequestedBy = requestedByLower === userFullName.toLowerCase().trim();
          }
          
          return matchesRequestedBy;
        });
      } else {
        // If neither user ID, username nor fullName is available, filter out all requests (safety)
        filteredRequests = [];
      }
    }

    return filteredRequests.map((request) => {
      const statusMap: Record<
        string,
        "pending" | "approved" | "rejected" | "routed_for_approval"
      > = {
        pending: "pending",
        approved: "approved",
        rejected: "rejected",
        routed_for_approval: "routed_for_approval",
      };

      let overallStatus: "pending" | "approved" | "rejected" | "routed_for_approval" | "partial" =
        statusMap[request.status] || "pending";

      const getVisitorStatus = (
        visitorStatus: string | undefined,
        passGeneratedAt: string | null | undefined
      ): "pending" | "approved" | "denied" => {
        if (passGeneratedAt) {
          return "approved";
        }
        if (visitorStatus === "rejected") {
          return "denied";
        }
        if (visitorStatus === "approved") {
          return "approved";
        }
        return "pending";
      };

      const visitors: VisitorUI[] = request.visitors.map((visitor: any) => {
        const visitorStatus = getVisitorStatus(
          visitor.visitor_status,
          visitor.pass_generated_at
        );
        const visitorValidFrom = visitor.valid_from || request.valid_from;
        const visitorValidTo = visitor.valid_to || request.valid_to;
        const visitorPurpose = visitor.purpose || request.purpose;
        const passTypeId = visitor.pass_type_id;
        const passTypeName = passTypeId ? passTypeMap.get(passTypeId) : undefined;

        return {
          id: visitor.id,
          name: `${visitor.first_name} ${visitor.last_name}`,
          email: visitor.email,
          phone: visitor.phone,
          identificationType: visitor.identification_type,
          identificationNumber: visitor.identification_number,
          status: visitorStatus,
          approvedBy: visitor.visitor_approved_by,
          approverComments: visitor.visitor_approved_at ? "Approved by HOD" : undefined,
          denialReason: visitor.visitor_rejection_reason,
          approvedDate: visitor.visitor_approved_at || request.approved_at,
          deniedDate: visitor.visitor_rejected_at,
          validFrom: visitorValidFrom,
          validTo: visitorValidTo,
          purpose: visitorPurpose,
          passTypeId: passTypeId,
          passTypeName: passTypeName,
          passGeneratedAt: visitor.pass_generated_at,
          car_passes: visitor.car_passes || [],
          identification_document_url: visitor.identification_document_url,
        };
      });

      // Calculate overall status
      if (visitors.length > 0) {
        const deniedCount = visitors.filter((v) => v.status === "denied").length;
        const approvedCount = visitors.filter((v) => v.status === "approved").length;
        const pendingCount = visitors.filter((v) => v.status === "pending").length;
        const allDenied = deniedCount === visitors.length;
        const allApproved = approvedCount === visitors.length;
        const allPassGenerated = visitors.every((v) => v.passGeneratedAt);

        if (allDenied) {
          overallStatus = "rejected";
        } else if (allApproved && allPassGenerated) {
          overallStatus = "approved";
        } else if (deniedCount > 0) {
          overallStatus = "partial";
        } else if (allApproved && !allPassGenerated) {
          overallStatus = "routed_for_approval";
        } else if (pendingCount > 0) {
          overallStatus = "pending";
        }
      }

      const validFromDate = request.valid_from ? new Date(request.valid_from) : null;
      const visitDate = validFromDate ? validFromDate.toISOString().split("T")[0] : "";
      const visitTime = validFromDate
        ? validFromDate.toTimeString().split(" ")[0].substring(0, 5)
        : "";

      const approvedVisitor = visitors.find((v) => {
        if (v.status !== "approved" || !v.approvedBy) return false;
        const approvedBy = v.approvedBy;
        return (
          typeof approvedBy === "string" &&
          approvedBy.length === 36 &&
          approvedBy.includes("-")
        );
      });
      const hodApprovedBy = approvedVisitor?.approvedBy;

      const statusStrings = ["pending", "approved", "rejected", "denied", "routed_for_approval"];
      const isValidUUID =
        hodApprovedBy &&
        typeof hodApprovedBy === "string" &&
        hodApprovedBy.length === 36 &&
        hodApprovedBy.includes("-") &&
        !statusStrings.includes(hodApprovedBy.toLowerCase());
      const finalHodApprovedBy = isValidUUID ? hodApprovedBy : undefined;

      let legislativeApprovedBy: string | undefined = undefined;
      let legislativeApprovedAt: string | undefined = undefined;
      if (overallStatus === "approved" && request.approved_by && request.approved_at) {
        const approvedBy = request.approved_by;
        const isValidUUID =
          typeof approvedBy === "string" &&
          approvedBy.length === 36 &&
          approvedBy.includes("-") &&
          !statusStrings.includes(approvedBy.toLowerCase());
        if (isValidUUID) {
          legislativeApprovedBy = approvedBy;
          legislativeApprovedAt = request.approved_at;
        }
      }

      return {
        id: request.id,
        requestId: request.request_id,
        visitors,
        visitDate,
        visitTime,
        purpose: request.purpose,
        submittedDate: request.created_at,
        requestedBy: request.requested_by,
        overallStatus,
        hodApprovedBy: finalHodApprovedBy,
        legislativeApprovedBy,
        legislativeApprovedAt,
      };
    });
  };

  useEffect(() => {
    // Don't fetch if userRole is not set
    if (!userRole || (userRole !== "department" && userRole !== "peshi")) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let currentUserHodApproverStatus = false;
        let currentUserSubCategoryIds: string[] = [];
        let currentMainCategoryId: string | null = null;

        try {
          // Fetch users based on role (department or peshi)
          const roleToFetch = userRole === "department" ? "department" : "peshi";
          const users = await api.getUsersByRole(roleToFetch);

          if (users.length === 0) {
            setError(`No ${roleToFetch} users found. Please contact administrator.`);
            setLoading(false);
            return;
          }

          let matchedUser: User | undefined;

          // Try to match by userId if provided
          if (userId) {
            matchedUser = users.find((u) => u.id === userId);
          }

          const userToUse = matchedUser || users[0];

          if (userToUse) {
            setCurrentUserId(userToUse.id);
            currentUserHodApproverStatus = userToUse.hod_approver || false;
            setIsHodApprover(currentUserHodApproverStatus);

            // Get sub_categories from route params (User type doesn't have sub_categories)
            if (userSubCategories && userSubCategories.length > 0) {
              currentUserSubCategoryIds = userSubCategories.map((sc: any) => String(sc.id));
              setUserSubCategoryIds(currentUserSubCategoryIds);
            } else {
              currentUserSubCategoryIds = [];
              setUserSubCategoryIds([]);
            }
          }
        } catch (err) {
          setError("Failed to load user information. Please refresh the page.");
        }

        try {
          const allCategories = await api.getMainCategories();
          // Find category based on role (case-insensitive)
          const categoryToFind = userRole === "department" ? "department" : "peshi";
          const category = allCategories.find(
            (cat) => cat.type?.toLowerCase() === categoryToFind.toLowerCase()
          );
          if (category) {
            currentMainCategoryId = category.id;
            if (userRole === "department") {
              setDepartmentMainCategoryId(category.id);
            } else {
              setPeshiMainCategoryId(category.id);
            }
          } else {
            setError(`${categoryToFind} category not found. Please contact administrator.`);
            setLoading(false);
            return;
          }
        } catch (err) {
          setError(`Failed to load ${userRole} category. Please refresh the page.`);
          setLoading(false);
          return;
        }

        try {
          const allUsers: User[] = [];
          // Fetch users from different roles based on userRole
          const [departmentUsers, peshiUsers, legislativeUsers, adminUsers] = await Promise.all([
            api.getUsersByRole("department").catch(() => []),
            api.getUsersByRole("peshi").catch(() => []),
            api.getUsersByRole("legislative").catch(() => []),
            api.getUsersByRole("admin").catch(() => []),
          ]);
          allUsers.push(...departmentUsers, ...peshiUsers, ...legislativeUsers, ...adminUsers);

          const newUserMap = new Map<string, string>();
          allUsers.forEach((user) => {
            newUserMap.set(user.id, user.full_name || user.username);
          });
          setUserMap(newUserMap);
        } catch (err) {
          // Error fetching users
        }

        const apiRequests = await api.getAllPassRequests(1000);
        const transformedRequests = await transformAPIData(
          apiRequests,
          currentUserHodApproverStatus,
          currentUserSubCategoryIds,
          currentMainCategoryId,
          currentUserId,
          userRole
        );
        setPasses(transformedRequests);

        // Initialize all cards as expanded by default
        const initialExpandedRequests = new Set<string>();
        const initialExpandedVisitorDetails = new Set<string>();

        transformedRequests.forEach((request) => {
          initialExpandedRequests.add(request.id);
          request.visitors.forEach((visitor: any, index: number) => {
            const visitorId = visitor.id || `${request.id}-${index}`;
            initialExpandedVisitorDetails.add(visitorId);
          });
        });

        setExpandedRequests(initialExpandedRequests);
        setExpandedVisitorDetails(initialExpandedVisitorDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch pass requests");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, userId, hodApprover, userSubCategories]);

  const handleVisitorStatusUpdate = async (
    visitorId: string,
    requestId: string,
    newStatus: "approved" | "rejected",
    comments?: string
  ) => {
    try {
      setProcessingVisitorStatus((prev) => new Set(prev).add(visitorId));

      let userIdToUse = currentUserId;
      if (!userIdToUse) {
        Alert.alert("Error", "Current user ID not found. Please refresh the page.");
        return;
      }

      await api.updateVisitorStatus(visitorId, newStatus, userIdToUse, comments);

      const apiRequests = await api.getAllPassRequests(1000);
      const mainCategoryId = userRole === "department" ? departmentMainCategoryId : peshiMainCategoryId;
      const transformedRequests = await transformAPIData(
        apiRequests,
        isHodApprover,
        userSubCategoryIds,
        mainCategoryId,
        currentUserId,
        userRole
      );
      setPasses(transformedRequests);

      // Initialize all cards as expanded by default
      const initialExpandedRequests = new Set<string>();
      const initialExpandedVisitorDetails = new Set<string>();

      transformedRequests.forEach((request) => {
        initialExpandedRequests.add(request.id);
        request.visitors.forEach((visitor: any, index: number) => {
          const visitorId = visitor.id || `${request.id}-${index}`;
          initialExpandedVisitorDetails.add(visitorId);
        });
      });

      setExpandedRequests(initialExpandedRequests);
      setExpandedVisitorDetails(initialExpandedVisitorDetails);
      setShowVisitorActionModal(null);
      setVisitorActionComments("");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update visitor status");
    } finally {
      setProcessingVisitorStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(visitorId);
        return newSet;
      });
    }
  };

  const handleApproveAll = async (
    requestId: string,
    visitors: VisitorUI[],
    comments?: string
  ) => {
    try {
      setProcessingStatus((prev) => new Set(prev).add(requestId));

      if (!currentUserId) {
        Alert.alert("Error", "Current user ID not found. Please refresh the page.");
        return;
      }

      const updatePromises = visitors.map((visitor) =>
        api.updateVisitorStatus(
          visitor.id,
          "approved",
          currentUserId,
          comments || `Bulk approved all ${visitors.length} visitor(s)`
        )
      );

      await Promise.all(updatePromises);

      try {
        const commentText = userRole === "peshi" 
          ? `Approved by Peshi HOD, forwarded to Legislature for final approval`
          : `Approved by Department HOD, forwarded to Legislature for final approval`;
        await api.updatePassRequestStatus(requestId, {
          status: "routed_for_approval",
          comments: comments || commentText,
          current_user_id: currentUserId,
          routed_by: currentUserId,
        });
      } catch (routeErr) {
        // Error routing to legislative
      }

      const apiRequests = await api.getAllPassRequests(1000);
      const mainCategoryId = userRole === "department" ? departmentMainCategoryId : peshiMainCategoryId;
      const transformedRequests = await transformAPIData(
        apiRequests,
        isHodApprover,
        userSubCategoryIds,
        mainCategoryId,
        currentUserId,
        userRole
      );
      setPasses(transformedRequests);

      // Initialize all cards as expanded by default
      const initialExpandedRequests = new Set<string>();
      const initialExpandedVisitorDetails = new Set<string>();

      transformedRequests.forEach((request) => {
        initialExpandedRequests.add(request.id);
        request.visitors.forEach((visitor: any, index: number) => {
          const visitorId = visitor.id || `${request.id}-${index}`;
          initialExpandedVisitorDetails.add(visitorId);
        });
      });

      setExpandedRequests(initialExpandedRequests);
      setExpandedVisitorDetails(initialExpandedVisitorDetails);
      setShowActionModal(null);
      setActionComments("");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to approve all visitors");
    } finally {
      setProcessingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectAll = async (
    requestId: string,
    visitors: VisitorUI[],
    comments?: string
  ) => {
    try {
      setProcessingStatus((prev) => new Set(prev).add(requestId));

      const updatePromises = visitors.map((visitor) =>
        api.updateVisitorStatus(
          visitor.id,
          "rejected",
          currentUserId,
          comments || `Bulk rejected all ${visitors.length} visitor(s)`
        )
      );

      await Promise.all(updatePromises);

      const apiRequests = await api.getAllPassRequests(1000);
      const mainCategoryId = userRole === "department" ? departmentMainCategoryId : peshiMainCategoryId;
      const transformedRequests = await transformAPIData(
        apiRequests,
        isHodApprover,
        userSubCategoryIds,
        mainCategoryId,
        currentUserId,
        userRole
      );
      setPasses(transformedRequests);

      // Initialize all cards as expanded by default
      const initialExpandedRequests = new Set<string>();
      const initialExpandedVisitorDetails = new Set<string>();

      transformedRequests.forEach((request) => {
        initialExpandedRequests.add(request.id);
        request.visitors.forEach((visitor: any, index: number) => {
          const visitorId = visitor.id || `${request.id}-${index}`;
          initialExpandedVisitorDetails.add(visitorId);
        });
      });

      setExpandedRequests(initialExpandedRequests);
      setExpandedVisitorDetails(initialExpandedVisitorDetails);
      setShowActionModal(null);
      setActionComments("");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to reject all visitors");
    } finally {
      setProcessingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const filteredPasses = useMemo(() => {
    return passes.filter((pass) => {
      // Status filter
      if (filter !== "all") {
        if (filter === "rejected") {
          if (pass.overallStatus !== "rejected" && pass.overallStatus !== "partial") {
            return false;
          }
        } else if (pass.overallStatus !== filter) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          pass.requestId,
          pass.requestedBy,
          pass.purpose,
          ...pass.visitors.flatMap((v) => [
            v.name,
            v.email,
            v.phone,
            v.identificationNumber,
            v.identificationType,
          ]),
        ];
        const matchesSearch = searchFields.some((field) =>
          field.toLowerCase().includes(query)
        );
        if (!matchesSearch) {
          return false;
        }
      }

      // Date filter
      if (dateFrom || dateTo) {
        let dateToCheck: string | undefined;

        switch (dateFilterType) {
          case "submittedDate":
            dateToCheck = pass.submittedDate;
            break;
          case "visitDate":
            dateToCheck = pass.visitDate;
            break;
          case "approvedDate":
            const approvedVisitor = pass.visitors.find((v) => v.approvedDate);
            dateToCheck = approvedVisitor?.approvedDate;
            break;
        }

        if (!dateToCheck) {
          if (dateFilterType === "approvedDate") {
            return false;
          }
          return true;
        }

        const checkDate = new Date(dateToCheck);

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (checkDate < fromDate) {
            return false;
          }
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (checkDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [passes, filter, searchQuery, dateFrom, dateTo, dateFilterType]);

  const displayedPasses = useMemo(() => {
    return filteredPasses.slice(0, displayedItemsCount);
  }, [filteredPasses, displayedItemsCount]);

  const hasMore = displayedItemsCount < filteredPasses.length;

  useEffect(() => {
    setDisplayedItemsCount(20);
  }, [filter, searchQuery, dateFilterMode, dateFrom, dateTo, dateFilterType]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      // Simulate slight delay for smooth UX
      setTimeout(() => {
        setDisplayedItemsCount((prev) => Math.min(prev + itemsPerPage, filteredPasses.length));
        setLoadingMore(false);
      }, 300);
    }
  };

  const stats = {
    total: passes.length,
    approved: passes.filter((p) => p.overallStatus === "approved").length,
    pending: passes.filter((p) => p.overallStatus === "pending").length,
    denied: passes.filter(
      (p) => p.overallStatus === "rejected" || p.overallStatus === "partial"
    ).length,
    routed: passes.filter((p) => p.overallStatus === "routed_for_approval").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return { bg: "#d1fae5", text: "#065f46", border: "#10b981" };
      case "pending":
        return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
      case "denied":
      case "rejected":
        return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" };
      case "partial":
        return { bg: "#fed7aa", text: "#9a3412", border: "#ea580c" };
      case "routed_for_approval":
        return { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" };
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#9ca3af" };
    }
  };

  const toggleRequest = (requestId: string) => {
    setExpandedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#457E51" />
          <Text style={styles.loadingText}>Loading pass requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Pass Requests and Approval</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOutIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <Text style={styles.headerSubtitle}>
        Manage and approve pass requests
      </Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
          if (isCloseToBottom && hasMore && !loadingMore) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          <View style={[styles.summaryCard, styles.totalCard]}>
            <Text style={styles.summaryCardValue}>{stats.total}</Text>
            <Text style={styles.summaryCardLabel}>Total Requests</Text>
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
            <Text style={styles.summaryCardValue}>{stats.denied}</Text>
            <Text style={styles.summaryCardLabel}>Rejected</Text>
          </View>
        </View>

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
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <CloseIcon width={16} height={16} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.filtersContainer}>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                Alert.alert(
                  "Date Type",
                  "Select date filter type",
                  [
                    { text: "Submitted Date", onPress: () => setDateFilterType("submittedDate") },
                    { text: "Visit Date", onPress: () => setDateFilterType("visitDate") },
                    { text: "Approved Date", onPress: () => setDateFilterType("approvedDate") },
                  ],
                  { cancelable: true }
                );
              }}
            >
              <Text style={styles.filterText}>
                {dateFilterType === "submittedDate"
                  ? "Submitted Date"
                  : dateFilterType === "visitDate"
                  ? "Visit Date"
                  : "Approved Date"}
              </Text>
              <ChevronDownIcon width={16} height={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                Alert.alert(
                  "Filter",
                  "Select date filter",
                  [
                    { text: "All Dates", onPress: () => setDateFilterMode("none") },
                    { text: "Today", onPress: () => setDateFilterMode("today") },
                    { text: "Other", onPress: () => setDateFilterMode("other") },
                  ],
                  { cancelable: true }
                );
              }}
            >
              <Text style={styles.filterText}>
                {dateFilterMode === "none"
                  ? "All Dates"
                  : dateFilterMode === "today"
                  ? "Today"
                  : "Other"}
              </Text>
              <ChevronDownIcon width={16} height={16} />
            </TouchableOpacity>

            {dateFilterMode === "other" && (
              <>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    setDatePickerType("from");
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.filterText}>
                    {dateFrom ? formatDate(dateFrom) : "From"}
                  </Text>
                  <CalendarIcon width={16} height={16} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    setDatePickerType("to");
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.filterText}>
                    {dateTo ? formatDate(dateTo) : "To"}
                  </Text>
                  <CalendarIcon width={16} height={16} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          {[
            { value: "all", label: "All Requests" },
            { value: "pending", label: "Pending" },
            { value: "routed_for_approval", label: "Routed" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ].map(({ value, label }) => {
            const count =
              value === "all"
                ? passes.length
                : value === "rejected"
                ? passes.filter(
                    (p) => p.overallStatus === "rejected" || p.overallStatus === "partial"
                  ).length
                : passes.filter((p) => p.overallStatus === value).length;

            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.tab,
                  filter === value && styles.tabActive,
                ]}
                onPress={() => setFilter(value as typeof filter)}
              >
                <Text
                  style={[
                    styles.tabText,
                    filter === value && styles.tabTextActive,
                  ]}
                >
                  {value === "all" ? label : `${label} (${count})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Request Cards */}
        {displayedPasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || dateFilterMode !== "none"
                ? "No matching requests found"
                : "No requests yet"}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsListContainer}>
            {displayedPasses.map((request) => {
              const statusStyle = getStatusColor(request.overallStatus);
              const isExpanded = expandedRequests.has(request.id);
              const visitorCount = request.visitors.length;
              const approvedCount = request.visitors.filter((v) => v.status === "approved").length;
              const pendingCount = request.visitors.filter((v) => v.status === "pending").length;
              const deniedCount = request.visitors.filter((v) => v.status === "denied").length;
              const allPending = pendingCount === visitorCount;

              let requestApprovalStatus:
                | "all_pending"
                | "approved"
                | "rejected"
                | "partial_approved" = "all_pending";
              if (allPending) {
                requestApprovalStatus = "all_pending";
              } else if (approvedCount === visitorCount) {
                requestApprovalStatus = "approved";
              } else if (deniedCount === visitorCount) {
                requestApprovalStatus = "rejected";
              } else if (approvedCount > 0 || deniedCount > 0) {
                requestApprovalStatus = "partial_approved";
              }

              return (
                <View key={request.id} style={styles.requestCardWrapper}>
                  <View style={styles.requestCard}>
                    <TouchableOpacity
                      onPress={() => toggleRequest(request.id)}
                      style={styles.requestCardHeader}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.requestIdText}>
                        {request.requestId}
                      </Text>
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
                              {request.requestedBy}
                            </Text>
                          </View>
                          <View style={styles.requestInfoRow}>
                            <Text style={styles.requestInfoLabel}>
                              Visit Date:
                            </Text>
                            <Text style={styles.requestInfoValue}>
                              {formatDate(request.visitDate)} {request.visitTime}
                            </Text>
                          </View>
                          <View style={styles.requestInfoRow}>
                            <Text style={styles.requestInfoLabel}>Date:</Text>
                            <Text style={styles.requestInfoValue}>
                              {formatDate(request.submittedDate)}
                            </Text>
                          </View>
                        </View>

                        {/* Approve All / Reject All Buttons for Approvers */}
                        {isHodApprover &&
                          request.visitors &&
                          request.visitors.length > 0 &&
                          request.visitors.some(
                            (v) => v.status === "pending",
                          ) && (
                            <View style={styles.approveRejectAllContainer}>
                              <TouchableOpacity
                                style={styles.approveAllButton}
                                onPress={() =>
                                  setShowActionModal({ requestId: request.requestId, action: "approve" })
                                }
                                disabled={processingStatus.has(request.requestId)}
                              >
                                <Text style={styles.approveAllButtonText}>
                                  Approve All
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rejectAllButton}
                                onPress={() =>
                                  setShowActionModal({ requestId: request.requestId, action: "reject" })
                                }
                                disabled={processingStatus.has(request.requestId)}
                              >
                                <Text style={styles.rejectAllButtonText}>
                                  Reject All
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}

                        {/* Visitors Section */}
                        {request.visitors && request.visitors.length > 0 && (
                          <View style={styles.visitorsSection}>
                            <Text style={styles.visitorsSectionTitle}>
                              Visitors ({request.visitors.length})
                            </Text>

                            {request.visitors.map((visitor: any, index: number) => {
                              const visitorId =
                                visitor.id || `${request.id}-${index}`;
                              const isVisitorExpanded =
                                expandedVisitorDetails.has(visitorId);
                              const visitorStatusStyle = getStatusColor(visitor.status);

                              return (
                                <View
                                  key={visitorId}
                                  style={styles.visitorItem}
                                >
                                  <TouchableOpacity
                                    onPress={() => {
                                      setExpandedVisitorDetails((prev) => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(visitorId)) {
                                          newSet.delete(visitorId);
                                        } else {
                                          newSet.add(visitorId);
                                        }
                                        return newSet;
                                      });
                                    }}
                                    style={styles.visitorItemHeader}
                                    activeOpacity={0.7}
                                  >
                                    <View style={styles.visitorInfo}>
                                      <View
                                        style={[
                                          styles.avatar,
                                          { backgroundColor: "#457E51" },
                                        ]}
                                      >
                                        <Text style={styles.avatarText}>
                                          {visitor.name
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                        </Text>
                                      </View>
                                      <View style={styles.visitorDetails}>
                                        <Text style={styles.visitorName}>
                                          {visitor.name}
                                        </Text>
                                        <Text style={styles.visitorId}>
                                          ID: {visitor.identificationType} -{" "}
                                          {visitor.identificationNumber}
                                        </Text>
                                      </View>
                                    </View>

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
                                          {visitor.status === "approved" ? (
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
                                          ) : visitor.status === "denied" ? (
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
                                      <View style={styles.visitorInfoRow}>
                                        <Text style={styles.visitorInfoLabel}>
                                          Email:
                                        </Text>
                                        <Text style={styles.visitorInfoValue}>
                                          {visitor.email}
                                        </Text>
                                      </View>
                                      <View style={styles.visitorInfoRow}>
                                        <Text style={styles.visitorInfoLabel}>
                                          Phone:
                                        </Text>
                                        <Text style={styles.visitorInfoValue}>
                                          {visitor.phone}
                                        </Text>
                                      </View>
                                      {visitor.validFrom && (
                                        <View style={styles.visitorInfoRow}>
                                          <Text style={styles.visitorInfoLabel}>
                                            Valid From:
                                          </Text>
                                          <Text style={styles.visitorInfoValue}>
                                            {formatDate(visitor.validFrom)}
                                          </Text>
                                        </View>
                                      )}
                                      {visitor.validTo && (
                                        <View style={styles.visitorInfoRow}>
                                          <Text style={styles.visitorInfoLabel}>
                                            Valid To:
                                          </Text>
                                          <Text style={styles.visitorInfoValue}>
                                            {formatDate(visitor.validTo)}
                                          </Text>
                                        </View>
                                      )}

                                      {/* Approve/Reject Buttons for Approvers */}
                                      {visitor.status === "pending" && isHodApprover && (
                                        <View
                                          style={
                                            styles.approveRejectButtonsContainer
                                          }
                                        >
                                          <TouchableOpacity
                                            style={styles.approveButton}
                                            onPress={() =>
                                              setShowVisitorActionModal({
                                                visitorId: visitor.id,
                                                requestId: request.requestId,
                                                action: "approve",
                                              })
                                            }
                                            disabled={processingVisitorStatus.has(visitor.id)}
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
                                              setShowVisitorActionModal({
                                                visitorId: visitor.id,
                                                requestId: request.requestId,
                                                action: "reject",
                                              })
                                            }
                                            disabled={processingVisitorStatus.has(visitor.id)}
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
                                        onPress={() => {
                                          // Navigate to RequestDetailsScreen
                                          navigation.navigate("RequestDetails", {
                                            request: request,
                                            visitor: visitor,
                                          });
                                        }}
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
                            })}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="#457E51" />
            <Text style={styles.loadingMoreText}>Loading more...</Text>
          </View>
        )}

        {/* End of List Indicator */}
        {!hasMore && displayedPasses.length > 0 && (
          <View style={styles.endOfListContainer}>
            <Text style={styles.endOfListText}>
              Showing all {filteredPasses.length} requests
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Approve/Reject All Modal */}
      <Modal
        visible={showActionModal !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowActionModal(null);
          setActionComments("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowActionModal(null);
                setActionComments("");
              }}
            >
              <CloseIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {showActionModal?.action === "approve"
                ? "Approve All Visitors"
                : "Reject All Visitors"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {showActionModal?.action === "approve"
                ? "Add optional comments for approval"
                : "Please provide a reason for rejection"}
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder={
                showActionModal?.action === "approve"
                  ? "Add any comments about this approval..."
                  : "Please provide a reason for rejection..."
              }
              placeholderTextColor="#9CA3AF"
              value={actionComments}
              onChangeText={setActionComments}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowActionModal(null);
                  setActionComments("");
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  showActionModal?.action === "approve"
                    ? styles.modalApproveButton
                    : styles.modalRejectButton,
                ]}
                onPress={async () => {
                  if (showActionModal?.action === "reject" && !actionComments.trim()) {
                    Alert.alert("Error", "Please provide a reason for rejection");
                    return;
                  }

                  const requestData = passes.find(
                    (p) => p.requestId === showActionModal?.requestId
                  );
                  if (requestData && showActionModal) {
                    if (showActionModal.action === "approve") {
                      await handleApproveAll(
                        showActionModal.requestId,
                        requestData.visitors,
                        actionComments || undefined
                      );
                    } else {
                      await handleRejectAll(
                        showActionModal.requestId,
                        requestData.visitors,
                        actionComments || undefined
                      );
                    }
                  }
                }}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {showActionModal?.action === "approve" ? "Approve All" : "Reject All"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve/Reject Visitor Modal */}
      <Modal
        visible={showVisitorActionModal !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowVisitorActionModal(null);
          setVisitorActionComments("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowVisitorActionModal(null);
                setVisitorActionComments("");
              }}
            >
              <CloseIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {showVisitorActionModal?.action === "approve"
                ? "Approve Visitor"
                : "Reject Visitor"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {showVisitorActionModal?.action === "approve"
                ? "Add optional comments for approval"
                : "Please provide a reason for rejection"}
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder={
                showVisitorActionModal?.action === "approve"
                  ? "Add any comments about this approval..."
                  : "Please provide a reason for rejection..."
              }
              placeholderTextColor="#9CA3AF"
              value={visitorActionComments}
              onChangeText={setVisitorActionComments}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowVisitorActionModal(null);
                  setVisitorActionComments("");
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  showVisitorActionModal?.action === "approve"
                    ? styles.modalApproveButton
                    : styles.modalRejectButton,
                ]}
                onPress={async () => {
                  if (
                    showVisitorActionModal?.action === "reject" &&
                    !visitorActionComments.trim()
                  ) {
                    Alert.alert("Error", "Please provide a reason for rejection");
                    return;
                  }

                  if (showVisitorActionModal) {
                    await handleVisitorStatusUpdate(
                      showVisitorActionModal.visitorId,
                      showVisitorActionModal.requestId,
                      showVisitorActionModal.action === "approve" ? "approved" : "rejected",
                      visitorActionComments || undefined
                    );
                  }
                }}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {showVisitorActionModal?.action === "approve" ? "Approve" : "Reject"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity
                style={styles.datePickerCancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>
                Select {datePickerType === "from" ? "From" : "To"} Date
              </Text>
              <TouchableOpacity
                style={styles.datePickerDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day) => {
                if (datePickerType === "from") {
                  setDateFrom(day.dateString);
                } else {
                  setDateTo(day.dateString);
                }
                setShowDatePicker(false);
              }}
              markedDates={{
                [datePickerType === "from" ? dateFrom : dateTo]: {
                  selected: true,
                  selectedColor: "#457E51",
                },
              }}
              theme={{
                todayTextColor: "#457E51",
                arrowColor: "#457E51",
                selectedDayBackgroundColor: "#457E51",
              }}
            />
          </View>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  summaryCardValue: {
    fontSize: 20,
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
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  chevronButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  tabActive: {
    backgroundColor: "#3B82F6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#FFFFFF",
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
    fontSize: 14,
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
  visitorsSection: {
    marginTop: 8,
  },
  visitorsSectionTitle: {
    fontSize: 13,
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
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  endOfListContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  endOfListText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
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
    width: "85%",
    maxWidth: 400,
    padding: 24,
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 16,
    fontWeight: "500",
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
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
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
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalApproveButton: {
    backgroundColor: "#457E51",
  },
  modalRejectButton: {
    backgroundColor: "#EF4444",
  },
  modalSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  datePickerModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  datePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#457E51",
  },
});
