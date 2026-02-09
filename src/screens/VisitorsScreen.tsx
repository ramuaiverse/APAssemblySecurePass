import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { Calendar } from "react-native-calendars";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleLogout } from "@/utils/logout";
import {
  api,
  MainCategory,
  PassTypeItem,
  Session,
  SubCategory,
} from "@/services/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import BackButtonIcon from "../../assets/backButton.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";
import LogOutIcon from "../../assets/logOut.svg";
import CloseIcon from "../../assets/close.svg";
import CalendarIcon from "../../assets/calendar.svg";

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
  const isApprover = hodApprover;
  const isLegislative = userRole === "legislative";
  const userSubCategories = route.params?.sub_categories || [];

  const [passRequests, setPassRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]); // Store all requests for filtering
  const [loading, setLoading] = useState(true);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 20;
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
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map()); // Map user ID to full_name
  const [selectedPassType, setSelectedPassType] = useState("All Pass Types");
  const [selectedPassTypeId, setSelectedPassTypeId] = useState<string | null>(
    null,
  );
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Category filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState("All Categories");
  const [selectedCategoryFilterId, setSelectedCategoryFilterId] = useState<
    string | null
  >(null);
  const [showCategoryFilterModal, setShowCategoryFilterModal] = useState(false);

  // Date filter state
  const [selectedDateFilter, setSelectedDateFilter] = useState("All Dates");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());

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

  // Suspend modal state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [selectedVisitorForSuspend, setSelectedVisitorForSuspend] =
    useState<any>(null);
  const [selectedRequestForSuspend, setSelectedRequestForSuspend] =
    useState<any>(null);

  // Category mappings
  const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
  const [subCategoryMap, setSubCategoryMap] = useState<{
    [key: string]: string;
  }>({});

  // Pass types
  const [passTypes, setPassTypes] = useState<PassTypeItem[]>([]);

  // Legislative approve modal state
  const [showLegislativeApproveModal, setShowLegislativeApproveModal] =
    useState(false);
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | null
  >(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [selectedSessionName, setSelectedSessionName] = useState<string>("");
  const [validFrom, setValidFrom] = useState<Date>(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  });
  const [validTo, setValidTo] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(17, 0, 0, 0);
    return date;
  });
  const [legislativeComments, setLegislativeComments] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showPassTypeModalLegislative, setShowPassTypeModalLegislative] =
    useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showValidFromPicker, setShowValidFromPicker] = useState(false);
  const [showValidToPicker, setShowValidToPicker] = useState(false);
  const [tempValidFromDate, setTempValidFromDate] = useState<Date>(new Date());
  const [tempValidFromHour, setTempValidFromHour] = useState(8);
  const [tempValidFromMinute, setTempValidFromMinute] = useState(0);
  const [tempValidFromAmPm, setTempValidFromAmPm] = useState<"AM" | "PM">("AM");
  const [tempValidToDate, setTempValidToDate] = useState<Date | null>(null);
  const [tempValidToHour, setTempValidToHour] = useState(17);
  const [tempValidToMinute, setTempValidToMinute] = useState(0);
  const [tempValidToAmPm, setTempValidToAmPm] = useState<"AM" | "PM">("PM");

  // Route modal state
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [superiors, setSuperiors] = useState<any[]>([]);
  const [selectedSuperior, setSelectedSuperior] = useState<string>("");
  const [routeComments, setRouteComments] = useState("");
  const [showSuperiorModal, setShowSuperiorModal] = useState(false);

  // Pass type mapping state (for category-based pass types)
  const [availablePassTypes, setAvailablePassTypes] = useState<PassTypeItem[]>(
    [],
  );
  const [loadingPassTypes, setLoadingPassTypes] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPassTypes();
    fetchVisitors();
    fetchCategoriesForLegislative(); // Always fetch categories for filter dropdown
    if (isLegislative) {
      fetchSessions();
    }
  }, [isLegislative]);

  // Reload data when screen comes into focus (e.g., after returning from legislative screens)
  useFocusEffect(
    useCallback(() => {
      // Reload visitors data to get latest status after actions from legislative screens
      fetchVisitors();
    }, []),
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

  const fetchPassTypes = async () => {
    try {
      const types = await api.getAllPassTypes();
      setPassTypes(types);
    } catch (error) {
      // Error fetching pass types
    }
  };

  const fetchSessions = async () => {
    try {
      const fetchedSessions = await api.getSessions();
      setSessions(fetchedSessions);
    } catch (error) {
      // Error fetching sessions
    }
  };

  const fetchCategoriesForLegislative = async () => {
    try {
      const fetchedCategories = await api.getMainCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      // Error fetching categories
    }
  };

  // Helper function to determine visitor status based on visitor_status and pass generation
  // Priority: Suspended > Pass generated > Routed > Rejected > Approved (HOD) > Pending
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
      // Only show as approved if pass is generated, otherwise show as pending
      if (visitor.pass_generated_at) {
        return "approved";
      } else {
        return "pending"; // Approved but pass not generated yet
      }
    }
    // Priority 6: If request is routed_for_approval, check routing type
    if (request.status === "routed_for_approval") {
      // Check if this was auto-routed from weblink (no routed_by means auto-routed)
      if (!request.routed_by) {
        // Auto-routed from weblink - show as pending (awaiting legislative approval)
        return "pending";
      } else {
        // Manually routed by HOD - show as routed_for_approval
        return "routed_for_approval";
      }
    }
    // Priority 7: If request is pending but routed to legislative, show as pending
    if (request.routed_to && request.status === "pending") {
      // Request routed directly to legislative (non-department/peshi categories)
      return "pending";
    }
    // Priority 8: Otherwise, use visitor status logic
    if (visitor.visitor_status === "approved" && !visitor.pass_generated_at) {
      return "pending"; // Pending legislative approval
    }
    return visitor.visitor_status || "pending";
  };

  // Helper function to build visitor rows from requests (similar to web version)
  const buildVisitorRows = (
    allRequests: any[],
    allCategories: MainCategory[],
    allPassTypes: PassTypeItem[],
  ): any[] => {
    const visitorRows: any[] = [];

    allRequests.forEach((request: any) => {
      // Get category names
      const mainCategory = allCategories.find(
        (cat) => cat.id === request.main_category_id,
      );
      const categoryName = mainCategory?.name || "Unknown";
      const subCategory = mainCategory?.sub_categories?.find(
        (sub) => sub.id === request.sub_category_id,
      );
      const subCategoryName = subCategory?.name || "Unknown";

      request.visitors.forEach((visitor: any) => {
        // WORKFLOW CLARIFICATION:
        // 1. Department & Peshi categories: HOD approval → Legislative approval → Pass generation
        // 2. All other categories: Direct to Legislative → Pass generation (no HOD approval needed)
        //
        // Show visitors if:
        // - Approved by department HOD (visitor_status = 'approved') - for department/peshi requests
        // - Rejected visitors (visitor_status = 'rejected')
        // - Routed directly to legislative (routed_to is set) - for non-department/peshi requests
        // - Approved requests (request.status === 'approved' or pass has been generated)
        // Skip visitors that are still pending department approval (only for department/peshi requests)
        // Skip visitors that have been routed to a superior (visitor_routed_to is set) - they're no longer in legislative portal

        // Check if request is routed to legislative
        const hasRouting = !!request.routed_to || !!request.routed_at;
        const isPendingWithRouting = request.status === "pending" && hasRouting;
        const isRoutedForApproval = request.status === "routed_for_approval";
        const isRequestApproved = request.status === "approved";
        const isPassGenerated = !!visitor.pass_generated_at;
        const isVisitorApprovedOrRejected =
          visitor.visitor_status === "approved" ||
          visitor.visitor_status === "rejected";

        // Check if visitor has been individually routed to a superior
        const isVisitorRouted = !!visitor.visitor_routed_to;

        // Show visitor if:
        // 1. Request is pending but routed to legislative
        // 2. Request is routed_for_approval
        // 3. Request is approved
        // 4. Pass has been generated
        // 5. Visitor is approved or rejected
        // 6. Visitor has been routed to superior (show it with routed status)
        const shouldShow =
          isPendingWithRouting ||
          isRoutedForApproval ||
          isRequestApproved ||
          isPassGenerated ||
          isVisitorApprovedOrRejected ||
          isVisitorRouted;

        if (!shouldShow) {
          return; // Skip this visitor (pending department approval)
        }

        // Get pass category names and type if pass was issued
        let passCategoryName = "";
        let passSubCategoryName = "";
        let passCategoryType = "";
        if (visitor.pass_category_id) {
          const passMainCategory = allCategories.find(
            (cat) => cat.id === visitor.pass_category_id,
          );
          passCategoryName = passMainCategory?.name || "Unknown";
          passCategoryType = passMainCategory?.type || "";
          if (visitor.pass_sub_category_id && passMainCategory) {
            const passSubCategory = passMainCategory.sub_categories?.find(
              (sub) => sub.id === visitor.pass_sub_category_id,
            );
            passSubCategoryName = passSubCategory?.name || "";
          }
        }

        // Get pass type name if available
        const passTypeId =
          visitor.pass_type_id || (request as any).pass_type_id;
        const passType = passTypeId
          ? allPassTypes.find((pt) => pt.id === passTypeId)
          : null;

        // Determine status with clear priority
        const visitorStatus = getVisitorStatus(visitor, request);

        visitorRows.push({
          id: visitor.id,
          requestId: request.request_id,
          request: request, // Keep reference to original request
          visitor: visitor, // Keep reference to original visitor
          visitorName: `${visitor.first_name} ${visitor.last_name}`,
          email: visitor.email,
          phone: visitor.phone,
          identificationType: visitor.identification_type,
          identificationNumber: visitor.identification_number,
          category: categoryName,
          subCategory: subCategoryName,
          categoryId: request.main_category_id,
          subCategoryId: request.sub_category_id,
          categoryType: mainCategory?.type || "",
          requestedBy: request.requested_by,
          approvedBy: visitor.visitor_approved_by,
          hodApprovedAt: visitor.visitor_approved_at,
          finalApprovedBy:
            visitor.visitor_legislative_approved_by || request.approved_by,
          rejectedBy: visitor.visitor_rejected_by,
          rejectedAt: visitor.visitor_rejected_at,
          rejectionReason: visitor.visitor_rejection_reason,
          purpose: visitor.purpose || request.purpose,
          validFrom: visitor.valid_from || request.valid_from,
          validTo: visitor.valid_to || request.valid_to || undefined,
          status: visitorStatus,
          submittedAt: request.created_at,
          identificationPhotoUrl: visitor.identification_photo_url,
          identificationDocumentUrl: visitor.identification_document_url,
          hodLetterUrl: request.hod_letter_url,
          accreditationLetterUrl: request.accreditation_letter_url,
          accreditationNumber: request.accreditation_number,
          numberOfStudents: request.number_of_students,
          passUrl: visitor.pass_url,
          passQrCode: visitor.pass_qr_code,
          passQrString: visitor.pass_qr_string,
          passNumber: visitor.pass_number,
          passGeneratedAt: visitor.pass_generated_at,
          passCategoryId: visitor.pass_category_id,
          routedTo: request.routed_to,
          routedBy: request.routed_by,
          routedAt: request.routed_at,
          visitorRoutedTo: visitor.visitor_routed_to,
          visitorRoutedBy: visitor.visitor_routed_by,
          visitorRoutedAt: visitor.visitor_routed_at,
          passSubCategoryId: visitor.pass_sub_category_id,
          passCategoryName: passCategoryName,
          passSubCategoryName: passSubCategoryName,
          passCategoryType: passCategoryType,
          passTypeId: visitor.pass_type_id || (request as any).pass_type_id,
          passTypeName: passType?.name || "",
          season: request.season || "",
          isSuspended: visitor.is_suspended,
          suspendedAt: visitor.suspended_at,
          suspendedBy: visitor.suspended_by,
          suspensionReason: visitor.suspension_reason,
          carPasses: visitor.car_passes || [],
        });
      });
    });

    return visitorRows;
  };

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      let requests = await api.getAllPassRequests(10000);

      // Filter requests by sub_category_id if role is department or peshi
      if (
        (userRole === "department" || userRole === "peshi") &&
        userSubCategories.length > 0
      ) {
        const allowedSubCategoryIds = userSubCategories.map(
          (subCat: any) => subCat.id,
        );
        requests = requests.filter((req: any) => {
          return (
            req.sub_category_id &&
            allowedSubCategoryIds.includes(req.sub_category_id)
          );
        });
      }

      // Store all requests for filtering
      setAllRequests(requests);

      // Fetch all users to create a user map for name lookups
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

        // Create a map of user ID to full_name
        const newUserMap = new Map<string, string>();
        allUsers.forEach((user) => {
          newUserMap.set(user.id, user.full_name || user.username);
        });
        setUserMap(newUserMap);
      } catch (err) {
        // Continue even if user fetch fails
      }

      // Fetch categories and pass types for buildVisitorRows
      const allCategories = await api.getMainCategories();
      const allPassTypes = await api.getAllPassTypes();

      // Build visitor rows using the same logic as web
      const visitorRows = buildVisitorRows(
        requests,
        allCategories,
        allPassTypes,
      );

      // Group visitors back by request for display
      const requestsWithVisitors: { [key: string]: any[] } = {};
      visitorRows.forEach((visitorRow) => {
        if (!requestsWithVisitors[visitorRow.requestId]) {
          requestsWithVisitors[visitorRow.requestId] = [];
        }
        requestsWithVisitors[visitorRow.requestId].push(visitorRow);
      });

      // Convert back to request format with filtered visitors
      const processedRequests = requests
        .map((req) => {
          const visitors = requestsWithVisitors[req.request_id] || [];
          if (visitors.length === 0) return null;
          return {
            ...req,
            visitors: visitors.map((vr) => vr.visitor), // Use original visitor objects
            visitorRows: visitors, // Store processed visitor rows for filtering
          };
        })
        .filter((req) => req !== null);

      setPassRequests(processedRequests);

      // Initialize only first request as expanded (open) by default
      const initialExpandedRows: ExpandedRow = {};
      const initialExpandedVisitors: ExpandedVisitor = {};

      processedRequests.forEach((req, requestIndex) => {
        // Only expand the first request
        if (requestIndex === 0) {
          initialExpandedRows[req.id] = true;
          req.visitors?.forEach((visitor: any, index: number) => {
            const visitorId = visitor.id || `${req.id}-${index}`;
            initialExpandedVisitors[visitorId] = true;
          });
        }
      });

      setExpandedRows(initialExpandedRows);
      setExpandedVisitors(initialExpandedVisitors);

      // Calculate stats based on visitor rows (using processed status)
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

      setStats({
        totalVisitors,
        pending,
        routed,
        approved,
        rejected,
        suspended,
      });
    } catch (error) {
      // Error fetching visitors
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

  const getVisitorStatusCounts = (visitors: any[], visitorRows?: any[]) => {
    const counts = {
      approved: 0,
      rejected: 0,
      pending: 0,
      routed: 0,
      suspended: 0,
    };
    visitors?.forEach((visitor: any) => {
      // Use processed status from visitorRows if available
      const visitorRow = visitorRows?.find(
        (vr: any) => vr.visitor?.id === visitor.id || vr.id === visitor.id,
      );
      const status =
        visitorRow?.status ||
        (visitor.is_suspended
          ? "suspended"
          : visitor.visitor_routed_to
            ? "routed_for_approval"
            : visitor.visitor_status || "pending");

      if (status === "suspended") counts.suspended++;
      else if (status === "routed_for_approval") counts.routed++;
      else if (status === "approved") counts.approved++;
      else if (status === "rejected") counts.rejected++;
      else if (status === "pending") counts.pending++;
    });
    return counts;
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last;
  };

  // Helper function to normalize UUIDs for comparison
  const normalizeUuid = (uuid: string | undefined) => {
    if (!uuid) return "";
    return uuid.replace(/-/g, "").toLowerCase();
  };

  // Helper function to get filtered visitors for a request based on pass type
  const getFilteredVisitors = (visitors: any[] | null | undefined) => {
    if (!visitors) return [];
    if (!selectedPassTypeId) return visitors;
    return visitors.filter((v: any) => v.pass_type_id === selectedPassTypeId);
  };

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      suspended: "Suspended",
      routed_for_approval: "Routed for Approval",
      assigned_to_me: "Assigned to Me",
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredRequests = passRequests
    .map((req) => {
      // Use visitorRows if available, otherwise fall back to visitors
      const visitorRows = req.visitorRows || [];

      // Filter visitors within the request based on pass type and status
      let filteredVisitorRows = visitorRows;

      // Apply pass type filter
      if (selectedPassTypeId) {
        filteredVisitorRows = filteredVisitorRows.filter(
          (vr: any) => vr.passTypeId === selectedPassTypeId,
        );
      }

      // Apply status filter to visitors
      if (selectedStatusValue) {
        if (selectedStatusValue === "assigned_to_me") {
          // Show only requests/visitors assigned to current user
          const normalizedCurrentUserId = normalizeUuid(userId);
          filteredVisitorRows = filteredVisitorRows.filter((vr: any) => {
            const normalizedRoutedTo = normalizeUuid(vr.routedTo);
            const normalizedVisitorRoutedTo = normalizeUuid(vr.visitorRoutedTo);
            // Show if:
            // 1. Request is routed to current user (request-level routing)
            // 2. Visitor is individually routed to current user (visitor-level routing)
            const isRequestRoutedToMe =
              normalizedRoutedTo === normalizedCurrentUserId &&
              vr.status === "routed_for_approval";
            const isVisitorRoutedToMe =
              normalizedVisitorRoutedTo === normalizedCurrentUserId;
            return isRequestRoutedToMe || isVisitorRoutedToMe;
          });
        } else {
          // Map display status to actual status values
          const statusMap: { [key: string]: string } = {
            pending: "pending",
            rejected: "rejected",
            approved: "approved",
            suspended: "suspended",
            "routed for approval": "routed_for_approval",
          };
          const actualStatus =
            statusMap[selectedStatusValue] || selectedStatusValue;
          filteredVisitorRows = filteredVisitorRows.filter(
            (vr: any) => vr.status === actualStatus,
          );
        }
      }

      // Return request with filtered visitors, or null if no visitors match
      if (
        (selectedPassTypeId && filteredVisitorRows.length === 0) ||
        (selectedStatusValue && filteredVisitorRows.length === 0)
      ) {
        return null;
      }

      // Map back to original visitor objects
      const filteredVisitors = filteredVisitorRows.map((vr: any) => vr.visitor);

      return {
        ...req,
        visitors: filteredVisitors,
        visitorRows: filteredVisitorRows, // Keep visitor rows for status display
      };
    })
    .filter((req) => {
      if (!req) return false;

      // Category filter
      if (selectedCategoryFilterId) {
        if (req.main_category_id !== selectedCategoryFilterId) {
          return false;
        }
      }

      // Date filter
      if (selectedDate) {
        const filterDate = new Date(selectedDate);
        filterDate.setHours(0, 0, 0, 0);

        // Check if request's valid_from or valid_to matches the selected date
        if (req.valid_from) {
          const validFromDate = new Date(req.valid_from);
          validFromDate.setHours(0, 0, 0, 0);
          if (validFromDate.getTime() === filterDate.getTime()) {
            // Date matches, continue to other filters
          } else if (req.valid_to) {
            const validToDate = new Date(req.valid_to);
            validToDate.setHours(0, 0, 0, 0);
            if (validToDate.getTime() !== filterDate.getTime()) {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }

      // Enhanced text search filter (matching web version)
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return true;

      // Search in request details
      const requestIdMatch = req.request_id
        ?.toLowerCase()
        .includes(searchLower);
      const requestedByMatch = req.requested_by
        ?.toLowerCase()
        .includes(searchLower);
      const purposeMatch = req.purpose?.toLowerCase().includes(searchLower);

      // Search in category details
      const categoryMatch = getCategoryName(req.main_category_id)
        ?.toLowerCase()
        .includes(searchLower);
      const subCategoryMatch = getSubCategoryName(req.sub_category_id)
        ?.toLowerCase()
        .includes(searchLower);

      // Search in visitor details
      const visitorMatch = req.visitors?.some((v: any) => {
        const visitorName =
          `${v.first_name || ""} ${v.last_name || ""}`.toLowerCase();
        const email = v.email?.toLowerCase() || "";
        const phone = v.phone?.toLowerCase() || "";
        const identificationNumber =
          v.identification_number?.toLowerCase() || "";

        return (
          visitorName.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          identificationNumber.includes(searchLower)
        );
      });

      // Search in dates (formatted)
      const validFromMatch = req.valid_from
        ? formatDate(req.valid_from).toLowerCase().includes(searchLower)
        : false;
      const validToMatch = req.valid_to
        ? formatDate(req.valid_to).toLowerCase().includes(searchLower)
        : false;
      const submittedAtMatch = req.created_at
        ? formatDate(req.created_at).toLowerCase().includes(searchLower)
        : false;

      // Search in status (using visitorRows if available)
      const statusMatch = req.visitorRows?.some((vr: any) => {
        const statusLabel = getStatusLabel(vr.status || "");
        return statusLabel.toLowerCase().includes(searchLower);
      });

      // Search in user names (using userMap)
      const requestedByNameMatch = req.requested_by
        ? (userMap.get(req.requested_by) || req.requested_by)
            .toLowerCase()
            .includes(searchLower)
        : false;

      return (
        requestIdMatch ||
        requestedByMatch ||
        requestedByNameMatch ||
        purposeMatch ||
        categoryMatch ||
        subCategoryMatch ||
        visitorMatch ||
        validFromMatch ||
        validToMatch ||
        submittedAtMatch ||
        statusMatch
      );
    });

  const displayedRequests = useMemo(() => {
    return filteredRequests.slice(0, displayedItemsCount);
  }, [filteredRequests, displayedItemsCount]);

  const hasMore = displayedItemsCount < filteredRequests.length;

  useEffect(() => {
    setDisplayedItemsCount(20);
  }, [
    searchQuery,
    selectedStatusValue,
    selectedPassTypeId,
    selectedCategoryFilterId,
    selectedDate,
  ]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      // Simulate slight delay for smooth UX
      setTimeout(() => {
        setDisplayedItemsCount((prev) =>
          Math.min(prev + itemsPerPage, filteredRequests.length),
        );
        setLoadingMore(false);
      }, 300);
    }
  };

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
      // Map display status to filter value
      const statusMap: { [key: string]: string } = {
        pending: "pending",
        rejected: "rejected",
        approved: "approved",
        "routed for approval": "routed_for_approval",
        "assigned to me": "assigned_to_me",
        suspended: "suspended",
      };
      const filterValue =
        statusMap[status.toLowerCase()] || status.toLowerCase();

      // Get the display label (proper case) to match what's shown in the dropdown
      const displayLabel = getStatusLabel(
        status === "assigned to me" ? "assigned_to_me" : status,
      );

      setSelectedStatus(displayLabel);
      setSelectedStatusValue(filterValue);
    } else {
      setSelectedStatus("All Status");
      setSelectedStatusValue(null);
    }
    setShowStatusModal(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const formatDateForFilter = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date: Date): string => {
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
    return `${dayName}, ${day}/${month}/${year}`;
  };

  const handleCategoryFilterSelect = (category: MainCategory | null) => {
    if (category) {
      setSelectedCategoryFilter(category.name);
      setSelectedCategoryFilterId(category.id);
    } else {
      setSelectedCategoryFilter("All Categories");
      setSelectedCategoryFilterId(null);
    }
    setShowCategoryFilterModal(false);
  };

  const handleDateSelect = (day: any) => {
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    setTempSelectedDate(selectedDate);
  };

  const handleDateFilterDone = () => {
    setSelectedDate(tempSelectedDate);
    setSelectedDateFilter(formatDateForDisplay(tempSelectedDate));
    setShowDatePickerModal(false);
  };

  const handleVisitorClick = (request: any, visitor: any) => {
    navigation.navigate("VisitorDetails", { request, visitor, role: userRole });
  };


  // Handler for Resend WhatsApp
  const handleResendWhatsApp = async (request: any, visitor: any) => {
    try {
      setProcessingStatus(true);
      await api.resendWhatsApp(request.request_id, visitor.id);
      Alert.alert("Success", "Pass has been resent to WhatsApp successfully.");
      // Refresh the data
      await fetchVisitors();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to resend pass to WhatsApp. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
    }
  };

  // Handler for Suspend Click
  const handleSuspendClick = (visitor: any, request: any) => {
    setSelectedVisitorForSuspend(visitor);
    setSelectedRequestForSuspend(request);
    setSuspendReason("");
    setShowSuspendModal(true);
  };

  // Handler for Suspend Submit
  const handleSuspendSubmit = async () => {
    if (!suspendReason.trim()) {
      Alert.alert("Error", "Please enter a suspend reason.");
      return;
    }

    if (!selectedVisitorForSuspend) {
      Alert.alert("Error", "Visitor information not found.");
      return;
    }

    try {
      setProcessingStatus(true);
      await api.suspendVisitor(selectedVisitorForSuspend.id, {
        suspended_by: userId,
        reason: suspendReason.trim(),
      });
      Alert.alert("Success", "Visitor pass has been suspended successfully.");
      setShowSuspendModal(false);
      setSuspendReason("");
      setSelectedVisitorForSuspend(null);
      setSelectedRequestForSuspend(null);
      // Refresh the data
      await fetchVisitors();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to suspend visitor. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
    }
  };

  // Handler for Activate Click
  const handleActivateClick = async (visitor: any) => {
    if (!visitor?.id) {
      Alert.alert("Error", "Visitor information not found.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User information not found.");
      return;
    }

    try {
      setProcessingStatus(true);
      await api.activateVisitor(visitor.id, {
        activated_by: userId,
      });
      Alert.alert("Success", "Visitor pass has been activated successfully.");
      // Refresh the data
      await fetchVisitors();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to activate visitor. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
    }
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
  const handleApproveClick = (visitor: any, request: any) => {
    setSelectedVisitor(visitor);
    setSelectedRequest(request);

    if (isLegislative) {
      // For legislative role, navigate to approve screen
      navigation.navigate("LegislativeApprove", {
        visitor,
        request,
        userId: userId,
      });
      return;
    }
    // For HOD approvers, show simple approve modal
    setApproveComment("");
    setShowApproveModal(true);
  };

  // Handler for individual Reject
  const handleRejectClick = (visitor: any) => {
    setSelectedVisitor(visitor);
    // Find the request for this visitor
    const request = passRequests.find((req) =>
      req.visitors?.some((v: any) => v.id === visitor.id),
    );
    if (request) {
      setSelectedRequest(request);
    }

    if (isLegislative) {
      // For legislative role, navigate to reject screen
      navigation.navigate("LegislativeReject", {
        visitor,
        request,
        userId: userId,
      });
      return;
    }
    // For non-legislative users, show reject modal
    setRejectReason("");
    setShowRejectModal(true);
  };

  // Handler for Route for Superior Approval
  const handleRouteClick = async (visitor: any, request: any) => {
    if (isLegislative) {
      // For legislative role, navigate to route screen
      navigation.navigate("LegislativeRoute", {
        visitor,
        request,
        userId: userId,
      });
    }
  };

  // Execute Approve All
  const executeApproveAll = async () => {
    if (!selectedRequest || !userId) return;

    const pendingVisitors = selectedRequest.visitors?.filter(
      (v: any) => v.visitor_status === "pending",
    );

    if (!pendingVisitors || pendingVisitors.length === 0) {
      Alert.alert(
        "No Pending Visitors",
        "There are no pending visitors to approve.",
      );
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
      Alert.alert(
        "No Pending Visitors",
        "There are no pending visitors to reject.",
      );
      setShowRejectAllModal(false);
      return;
    }

    setProcessingStatus(true);
    try {
      // Reject all pending visitors
      const promises = pendingVisitors.map((visitor: any) =>
        api.updateVisitorStatus(visitor.id, "rejected", userId, rejectReason),
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

  // Execute Legislative Approve & Generate Pass
  const executeLegislativeApprove = async () => {
    if (!selectedRequest || !selectedVisitor || !userId) return;

    // Validate required fields
    if (!selectedCategoryId) {
      Alert.alert("Required", "Please select a category.");
      return;
    }
    if (!selectedPassTypeId) {
      Alert.alert("Required", "Please select a pass type.");
      return;
    }
    if (!selectedSessionName) {
      Alert.alert("Required", "Please select a session.");
      return;
    }

    setProcessingStatus(true);
    try {
      const requestId = selectedRequest.id;

      // Format dates for API (convert to ISO string)
      const formatLocalISOString = (dateObj: Date): string => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
      };

      const validFromISO = formatLocalISOString(validFrom);
      const validUntilISO = validTo ? formatLocalISOString(validTo) : undefined;

      // Get pass type color
      const passType = passTypes.find((pt) => pt.id === selectedPassTypeId);
      const passTypeColor = passType?.color || "#3B82F6";

      // Call generate-pass API directly (it handles status update internally)
      await api.generatePass(requestId, {
        visitor_id: selectedVisitor.id,
        pass_category_id: selectedCategoryId,
        pass_sub_category_id: selectedSubCategoryId || undefined,
        pass_type_id: selectedPassTypeId,
        current_user_id: userId,
        valid_from: validFromISO,
        valid_to: validUntilISO || undefined,
        pass_type_color: passTypeColor,
        season: selectedSessionName,
      });

      // Get pass request details
      const passRequestData = await api.getPassRequest(requestId);

      // Get category and pass type names
      const categoryName = getCategoryName(selectedCategoryId);
      const passTypeName =
        passTypes.find((pt) => pt.id === selectedPassTypeId)?.name || "";

      // Navigate to PreviewPassScreen with return information
      navigation.navigate("PreviewPass", {
        passData: passRequestData,
        categoryName: categoryName,
        passTypeName: passTypeName,
        returnTo: "Visitors",
        returnToParams: {
          role: userRole,
          userId: userId,
          hod_approver: hodApprover,
          sub_categories: userSubCategories,
        },
      });

      // Close modal and refresh
      setShowLegislativeApproveModal(false);
      await fetchVisitors();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to approve and generate pass. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
    }
  };

  // Execute Route for Superior Approval
  const executeRoute = async () => {
    if (!selectedRequest || !selectedVisitor || !userId) return;

    if (!selectedSuperior) {
      Alert.alert("Required", "Please select a superior.");
      return;
    }
    if (!routeComments.trim()) {
      Alert.alert("Required", "Please provide comments for routing.");
      return;
    }

    setProcessingStatus(true);
    try {
      // Use request.request_id (formatted ID like REQ-xxx) instead of request.id (UUID)
      await api.routeForSuperiorApproval(selectedRequest.request_id, {
        visitor_id: selectedVisitor.id,
        routed_to: selectedSuperior,
        routed_by: userId,
        current_user_id: userId,
        comments: routeComments,
      });

      // Refresh the data
      await fetchVisitors();
      setShowRouteModal(false);
      setSelectedSuperior("");
      setRouteComments("");
      Alert.alert("Success", "Visitor has been routed for superior approval.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to route visitor. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setProcessingStatus(false);
    }
  };

  // Format date for display
  const formatDateTimeForDisplay = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
  };

  // Format date for calendar
  const formatDateForCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Handle valid from date/time selection
  const openValidFromPicker = () => {
    setTempValidFromDate(new Date(validFrom));
    const hours = validFrom.getHours();
    const minutes = validFrom.getMinutes();
    setTempValidFromHour(hours % 12 || 12);
    setTempValidFromMinute(minutes);
    setTempValidFromAmPm(hours >= 12 ? "PM" : "AM");
    setShowValidFromPicker(true);
  };

  const handleValidFromDone = () => {
    const hours24 =
      tempValidFromAmPm === "PM" && tempValidFromHour !== 12
        ? tempValidFromHour + 12
        : tempValidFromAmPm === "AM" && tempValidFromHour === 12
          ? 0
          : tempValidFromHour;
    const newDate = new Date(tempValidFromDate);
    newDate.setHours(hours24, tempValidFromMinute, 0, 0);
    setValidFrom(newDate);
    setShowValidFromPicker(false);
  };

  // Handle valid to date/time selection
  const openValidToPicker = () => {
    if (validTo) {
      setTempValidToDate(new Date(validTo));
      const hours = validTo.getHours();
      const minutes = validTo.getMinutes();
      setTempValidToHour(hours % 12 || 12);
      setTempValidToMinute(minutes);
      setTempValidToAmPm(hours >= 12 ? "PM" : "AM");
    }
    setShowValidToPicker(true);
  };

  const handleValidToDone = () => {
    if (tempValidToDate) {
      const hours24 =
        tempValidToAmPm === "PM" && tempValidToHour !== 12
          ? tempValidToHour + 12
          : tempValidToAmPm === "AM" && tempValidToHour === 12
            ? 0
            : tempValidToHour;
      const newDate = new Date(tempValidToDate);
      newDate.setHours(hours24, tempValidToMinute, 0, 0);
      setValidTo(newDate);
      setShowValidToPicker(false);
    }
  };

  const onValidFromDateSelect = (day: any) => {
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    setTempValidFromDate(selectedDate);
  };

  const onValidToDateSelect = (day: any) => {
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    setTempValidToDate(selectedDate);
  };

  // Get subcategories for selected category
  const getSubCategoriesForCategory = (categoryId: string | null) => {
    if (!categoryId) return [];
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.sub_categories || [];
  };

  // Fetch pass types when category changes (for category mapping)
  useEffect(() => {
    const fetchCategoryPassTypes = async () => {
      if (!selectedCategoryId) {
        setAvailablePassTypes([]);
        setSelectedPassTypeId(null);
        return;
      }

      setLoadingPassTypes(true);
      try {
        // Get mapped pass type IDs for the selected category
        const passTypeIds = await api.getCategoryPassTypes(selectedCategoryId);

        // Filter pass types to only include mapped ones
        const mappedPassTypes = passTypes.filter((pt) =>
          passTypeIds.includes(pt.id),
        );
        setAvailablePassTypes(mappedPassTypes);

        // Auto-select if only one pass type is available
        if (mappedPassTypes.length === 1) {
          setSelectedPassTypeId(mappedPassTypes[0].id);
        } else if (mappedPassTypes.length === 0) {
          setSelectedPassTypeId(null);
        }
      } catch (error) {
        setAvailablePassTypes([]);
        setSelectedPassTypeId(null);
      } finally {
        setLoadingPassTypes(false);
      }
    };

    fetchCategoryPassTypes();
  }, [selectedCategoryId, passTypes]);

  // Get category name
  const getCategoryNameForLegislative = (categoryId: string | null) => {
    if (!categoryId) return "";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "";
  };

  // Get subcategory name
  const getSubCategoryNameForLegislative = (subCategoryId: string | null) => {
    if (!subCategoryId) return "";
    for (const category of categories) {
      const subCat = category.sub_categories?.find(
        (sc) => sc.id === subCategoryId,
      );
      if (subCat) return subCat.name;
    }
    return "";
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
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              // Fallback: Navigate to HomeScreen if there's no previous screen
              // Try to preserve existing HomeScreen params (including userFullName) from navigation state
              const navigationState = navigation.getState();
              const homeRoute = navigationState.routes.find(
                (route) => route.name === "Home",
              );
              const existingHomeParams = homeRoute?.params as any;

              navigation.navigate("Home", {
                userId: userId,
                role: userRole,
                hod_approver: hodApprover,
                sub_categories: userSubCategories,
                // Preserve userFullName if it exists in existing params
                userFullName: existingHomeParams?.userFullName || "",
              });
            }
          }}
          style={styles.backButton}
        >
          <BackButtonIcon width={18} height={18} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Visitors</Text>
        </View>
        <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.logoutButton}>
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
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            const paddingToBottom = 20;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - paddingToBottom;
            if (isCloseToBottom && hasMore && !loadingMore) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
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
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowCategoryFilterModal(true)}
              >
                <Text style={styles.filterText} numberOfLines={1}>
                  {selectedCategoryFilter}
                </Text>
                <ChevronDownIcon width={16} height={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowDatePickerModal(true)}
              >
                <Text style={styles.filterText} numberOfLines={1}>
                  {selectedDateFilter}
                </Text>
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
            {displayedRequests.map((request) => {
              const isExpanded = expandedRows[request.id] ?? false;
              const statusCounts = getVisitorStatusCounts(
                request.visitors || [],
                request.visitorRows || [],
              );
              const hasMultipleVisitors = (request.visitors?.length || 0) > 1;

              return (
                <View key={request.id} style={styles.requestCardWrapper}>
                  {/* Request Card - Always show with just request ID */}
                  <View style={styles.requestCard}>
                    <TouchableOpacity
                      onPress={() => toggleRow(request.id)}
                      style={styles.requestCardHeader}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.requestIdText}>
                        {request.request_id}
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
                              {userMap.get(request.requested_by) ||
                                request.requested_by}
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
                          !isLegislative &&
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

                                // Get processed status from visitorRows if available
                                const visitorRow = request.visitorRows?.find(
                                  (vr: any) =>
                                    vr.visitor?.id === visitor.id ||
                                    vr.id === visitor.id,
                                );
                                const displayStatus =
                                  visitorRow?.status ||
                                  (visitor.is_suspended
                                    ? "suspended"
                                    : visitor.visitor_routed_to
                                      ? "routed_for_approval"
                                      : visitor.visitor_status || "pending");

                                return (
                                  <View
                                    key={visitorId}
                                    style={styles.visitorItem}
                                  >
                                    <TouchableOpacity
                                      onPress={() => toggleVisitor(visitorId)}
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
                                            {displayStatus === "suspended" ? (
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
                                            ) : displayStatus === "approved" ? (
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
                                            ) : displayStatus === "rejected" ? (
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
                                            ) : displayStatus ===
                                              "routed_for_approval" ? (
                                              <View
                                                style={styles.pendingStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.pendingStatusText
                                                  }
                                                >
                                                  Routed
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
                                        {/* Approve/Reject/Route Buttons for Approvers */}
                                        {(isApprover || isLegislative) &&
                                          displayStatus === "pending" &&
                                          visitor.is_suspended !== true && (
                                            <View
                                              style={
                                                styles.approveRejectButtonsContainer
                                              }
                                            >
                                              <TouchableOpacity
                                                style={styles.approveButton}
                                                onPress={() =>
                                                  handleApproveClick(
                                                    visitor,
                                                    request,
                                                  )
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
                                              {isLegislative && (
                                                <TouchableOpacity
                                                  style={styles.routeButton}
                                                  onPress={() =>
                                                    handleRouteClick(
                                                      visitor,
                                                      request,
                                                    )
                                                  }
                                                  disabled={processingStatus}
                                                >
                                                  <Text
                                                    style={
                                                      styles.routeButtonText
                                                    }
                                                  >
                                                    Route
                                                  </Text>
                                                </TouchableOpacity>
                                              )}
                                            </View>
                                          )}

                                        {/* Activate Button for Suspended Passes */}
                                        {visitor.is_suspended === true && (
                                          <View
                                            style={
                                              styles.approveRejectButtonsContainer
                                            }
                                          >
                                            <TouchableOpacity
                                              style={styles.activateButton}
                                              onPress={() =>
                                                handleActivateClick(visitor)
                                              }
                                              disabled={processingStatus}
                                            >
                                              <Text
                                                style={
                                                  styles.activateButtonText
                                                }
                                              >
                                                Activate
                                              </Text>
                                            </TouchableOpacity>
                                          </View>
                                        )}

                                        {/* Resend WhatsApp and Suspend Buttons for Approved Passes */}
                                        {visitor.visitor_status ===
                                          "approved" &&
                                          visitor.pass_number &&
                                          !visitor.is_suspended && (
                                            <View
                                              style={
                                                styles.approveRejectButtonsContainer
                                              }
                                            >
                                              <TouchableOpacity
                                                style={
                                                  styles.resendWhatsAppButton
                                                }
                                                onPress={() =>
                                                  handleResendWhatsApp(
                                                    request,
                                                    visitor,
                                                  )
                                                }
                                                disabled={processingStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.resendWhatsAppButtonText
                                                  }
                                                  numberOfLines={1}
                                                >
                                                  Resend to WhatsApp
                                                </Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity
                                                style={styles.suspendButton}
                                                onPress={() =>
                                                  handleSuspendClick(
                                                    visitor,
                                                    request,
                                                  )
                                                }
                                                disabled={processingStatus}
                                              >
                                                <Text
                                                  style={
                                                    styles.suspendButtonText
                                                  }
                                                >
                                                  Suspend
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

          {/* Loading More Indicator */}
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#457E51" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          )}

          {/* End of List Indicator */}
          {!hasMore && displayedRequests.length > 0 && (
            <View style={styles.endOfListContainer}>
              <Text style={styles.endOfListText}>
                Showing all {filteredRequests.length} requests
              </Text>
            </View>
          )}
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
            <Text style={styles.approveModalTitle}>Approve All Visitors</Text>
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
                  <Text style={styles.modalApproveButtonText}>Approve All</Text>
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
          <ScrollView
            contentContainerStyle={styles.legislativeModalScrollContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.rejectModalContent}>
              <TouchableOpacity
                style={styles.modalCloseButtonTop}
                onPress={() => setShowRejectModal(false)}
              >
                <CloseIcon width={20} height={20} />
              </TouchableOpacity>
              <View style={styles.legislativeModalHeader}>
                <View style={styles.legislativeModalIconContainer}>
                  <Ionicons name="close-circle" size={48} color="#EF4444" />
                </View>
                <Text style={styles.rejectModalTitle}>
                  Reject Visitor Request
                </Text>
                <Text style={styles.rejectModalSubtitle}>
                  Provide a reason for rejection
                </Text>
              </View>

              {/* Visitor Details Section */}
              <View style={styles.legislativeModalSection}>
                <Text style={styles.legislativeModalSectionTitle}>
                  Visitor Details
                </Text>
                {selectedVisitor && (
                  <>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        FULL NAME
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.first_name || ""}{" "}
                        {selectedVisitor.last_name || ""}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        EMAIL
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.email || "—"}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        PHONE
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.phone || "—"}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        IDENTIFICATION
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.identification_type || "—"}{" "}
                        {selectedVisitor.identification_number || ""}
                      </Text>
                    </View>
                    {selectedRequest && (
                      <View style={styles.legislativeModalDetailRow}>
                        <Text style={styles.legislativeModalDetailLabel}>
                          REQUESTED BY
                        </Text>
                        <Text style={styles.legislativeModalDetailValue}>
                          {userMap.get(selectedRequest.requested_by) ||
                            selectedRequest.requested_by ||
                            "—"}
                        </Text>
                      </View>
                    )}
                    {selectedRequest && (
                      <View style={styles.legislativeModalDetailRow}>
                        <Text style={styles.legislativeModalDetailLabel}>
                          CATEGORY
                        </Text>
                        <Text style={styles.legislativeModalDetailValue}>
                          {getCategoryName(selectedRequest.main_category_id) ||
                            "—"}{" "}
                          {selectedRequest.sub_category_id &&
                            `• ${getSubCategoryName(selectedRequest.sub_category_id)}`}
                        </Text>
                      </View>
                    )}
                    {selectedRequest && (
                      <View style={styles.legislativeModalDetailRow}>
                        <Text style={styles.legislativeModalDetailLabel}>
                          PURPOSE
                        </Text>
                        <Text style={styles.legislativeModalDetailValue}>
                          {selectedRequest.purpose || "—"}
                        </Text>
                      </View>
                    )}
                    {/* Car Passes Section */}
                    {selectedVisitor.car_passes &&
                      selectedVisitor.car_passes.length > 0 && (
                        <View style={styles.legislativeModalDetailRow}>
                          <Text style={styles.legislativeModalDetailLabel}>
                            CAR PASSES ({selectedVisitor.car_passes.length})
                          </Text>
                          <View style={{ marginTop: 8 }}>
                            {selectedVisitor.car_passes.map(
                              (carPass: any, index: number) => (
                                <View key={index} style={styles.carPassCard}>
                                  <Text style={styles.carPassLabel}>
                                    CAR PASS #{index + 1}
                                  </Text>
                                  <View style={styles.carPassDetails}>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        MAKE
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_make || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        MODEL
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_model || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        COLOR
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_color || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        NUMBER
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_number || "—"}
                                      </Text>
                                    </View>
                                    {carPass.car_tag && (
                                      <View
                                        style={styles.legislativeModalDetailRow}
                                      >
                                        <Text
                                          style={
                                            styles.legislativeModalDetailLabel
                                          }
                                        >
                                          TAG
                                        </Text>
                                        <Text
                                          style={
                                            styles.legislativeModalDetailValue
                                          }
                                        >
                                          {carPass.car_tag}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              ),
                            )}
                          </View>
                        </View>
                      )}
                  </>
                )}
              </View>

              {/* Comments Section */}
              <View style={styles.legislativeModalSection}>
                <Text style={styles.legislativeModalSectionTitle}>
                  Comments<Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.legislativeModalTextArea}
                  placeholder="Please provide reason for rejection..."
                  placeholderTextColor="#9CA3AF"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.legislativeModalButtonsContainer}>
                <TouchableOpacity
                  style={styles.legislativeModalCancelButton}
                  onPress={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  disabled={processingStatus}
                >
                  <Text style={styles.legislativeModalCancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalRejectButton}
                  onPress={executeReject}
                  disabled={processingStatus || !rejectReason.trim()}
                >
                  {processingStatus ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalRejectButtonText}>Reject</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      {/* Legislative Approve Modal */}
      <Modal
        visible={showLegislativeApproveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLegislativeApproveModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLegislativeApproveModal(false)}
        >
          <ScrollView
            contentContainerStyle={styles.legislativeModalScrollContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.legislativeModalContent}>
              <TouchableOpacity
                style={styles.modalCloseButtonTop}
                onPress={() => setShowLegislativeApproveModal(false)}
              >
                <CloseIcon width={20} height={20} />
              </TouchableOpacity>
              <View style={styles.legislativeModalHeader}>
                <View style={styles.legislativeModalIconContainer}>
                  <Ionicons name="checkmark-circle" size={48} color="#457E51" />
                </View>
                <Text style={styles.legislativeModalTitle}>
                  Approve Visitor Request
                </Text>
              </View>

              {/* Visitor Details Section */}
              <View style={styles.legislativeModalSection}>
                <Text style={styles.legislativeModalSectionTitle}>
                  Visitor Details
                </Text>
                {selectedVisitor && (
                  <>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        FULL NAME
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.first_name || ""}{" "}
                        {selectedVisitor.last_name || ""}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        EMAIL
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.email || "—"}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        PHONE
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.phone || "—"}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        IDENTIFICATION
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.identification_type || "—"}{" "}
                        {selectedVisitor.identification_number || ""}
                      </Text>
                    </View>
                    {selectedRequest && (
                      <View style={styles.legislativeModalDetailRow}>
                        <Text style={styles.legislativeModalDetailLabel}>
                          REQUESTED BY
                        </Text>
                        <Text style={styles.legislativeModalDetailValue}>
                          {userMap.get(selectedRequest.requested_by) ||
                            selectedRequest.requested_by ||
                            "—"}
                        </Text>
                      </View>
                    )}
                    {selectedRequest && (
                      <View style={styles.legislativeModalDetailRow}>
                        <Text style={styles.legislativeModalDetailLabel}>
                          PURPOSE
                        </Text>
                        <Text style={styles.legislativeModalDetailValue}>
                          {selectedRequest.purpose || "—"}
                        </Text>
                      </View>
                    )}
                    {/* Car Passes Section */}
                    {selectedVisitor.car_passes &&
                      selectedVisitor.car_passes.length > 0 && (
                        <View style={styles.legislativeModalDetailRow}>
                          <Text style={styles.legislativeModalDetailLabel}>
                            CAR PASSES ({selectedVisitor.car_passes.length})
                          </Text>
                          <View style={{ marginTop: 8 }}>
                            {selectedVisitor.car_passes.map(
                              (carPass: any, index: number) => (
                                <View key={index} style={styles.carPassCard}>
                                  <Text style={styles.carPassLabel}>
                                    CAR PASS #{index + 1}
                                  </Text>
                                  <View style={styles.carPassDetails}>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        MAKE
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_make || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        MODEL
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_model || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        COLOR
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_color || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        NUMBER
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_number || "—"}
                                      </Text>
                                    </View>
                                    {carPass.car_tag && (
                                      <View
                                        style={styles.legislativeModalDetailRow}
                                      >
                                        <Text
                                          style={
                                            styles.legislativeModalDetailLabel
                                          }
                                        >
                                          TAG
                                        </Text>
                                        <Text
                                          style={
                                            styles.legislativeModalDetailValue
                                          }
                                        >
                                          {carPass.car_tag}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              ),
                            )}
                          </View>
                        </View>
                      )}
                  </>
                )}
              </View>

              {/* Pass Configuration Section */}
              <View style={styles.legislativeModalSection}>
                <Text style={styles.legislativeModalSectionTitle}>
                  Pass Configuration
                </Text>

                {/* Category - Read-only from request */}
                <View style={styles.legislativeModalInputContainer}>
                  <Text style={styles.legislativeModalInputLabel}>
                    Category
                  </Text>
                  <View
                    style={[
                      styles.legislativeModalDropdown,
                      { backgroundColor: "#F3F4F6" },
                    ]}
                  >
                    <Text style={styles.legislativeModalDropdownText}>
                      {selectedRequest && selectedRequest.main_category_id
                        ? getCategoryNameForLegislative(
                            selectedRequest.main_category_id,
                          )
                        : selectedCategoryId
                          ? getCategoryNameForLegislative(selectedCategoryId)
                          : "—"}
                    </Text>
                  </View>
                </View>

                {/* Sub-Category - Read-only from request */}
                {selectedRequest && selectedRequest.sub_category_id && (
                  <View style={styles.legislativeModalInputContainer}>
                    <Text style={styles.legislativeModalInputLabel}>
                      Sub-Category
                    </Text>
                    <View
                      style={[
                        styles.legislativeModalDropdown,
                        { backgroundColor: "#F3F4F6" },
                      ]}
                    >
                      <Text style={styles.legislativeModalDropdownText}>
                        {getSubCategoryNameForLegislative(
                          selectedRequest.sub_category_id,
                        )}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Valid From */}
                <View style={styles.legislativeModalInputContainer}>
                  <Text style={styles.legislativeModalInputLabel}>
                    Valid From<Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.legislativeModalDropdown}
                    onPress={openValidFromPicker}
                  >
                    <Text style={styles.legislativeModalDropdownText}>
                      {formatDateTimeForDisplay(validFrom)}
                    </Text>
                    <CalendarIcon width={20} height={20} />
                  </TouchableOpacity>
                </View>

                {/* Valid To */}
                <View style={styles.legislativeModalInputContainer}>
                  <Text style={styles.legislativeModalInputLabel}>
                    Valid To (Optional)
                  </Text>
                  <TouchableOpacity
                    style={styles.legislativeModalDropdown}
                    onPress={openValidToPicker}
                  >
                    <Text
                      style={[
                        styles.legislativeModalDropdownText,
                        !validTo && styles.legislativeModalDropdownPlaceholder,
                      ]}
                    >
                      {validTo
                        ? formatDateTimeForDisplay(validTo)
                        : "Select Valid To"}
                    </Text>
                    <CalendarIcon width={20} height={20} />
                  </TouchableOpacity>
                </View>

                {/* Pass Type - Based on category mapping */}
                <View style={styles.legislativeModalInputContainer}>
                  <Text style={styles.legislativeModalInputLabel}>
                    Pass Type<Text style={styles.requiredAsterisk}>*</Text>
                    {loadingPassTypes && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          marginLeft: 8,
                        }}
                      >
                        (Loading...)
                      </Text>
                    )}
                  </Text>
                  <TouchableOpacity
                    style={styles.legislativeModalDropdown}
                    onPress={() => setShowPassTypeModalLegislative(true)}
                    disabled={
                      loadingPassTypes || availablePassTypes.length === 0
                    }
                  >
                    <Text
                      style={[
                        styles.legislativeModalDropdownText,
                        !selectedPassTypeId &&
                          styles.legislativeModalDropdownPlaceholder,
                      ]}
                    >
                      {selectedPassTypeId
                        ? availablePassTypes.find(
                            (pt) => pt.id === selectedPassTypeId,
                          )?.name ||
                          passTypes.find((pt) => pt.id === selectedPassTypeId)
                            ?.name ||
                          "Select Pass Type"
                        : loadingPassTypes
                          ? "Loading pass types..."
                          : availablePassTypes.length === 0
                            ? "No pass types available"
                            : "Select Pass Type"}
                    </Text>
                    <ChevronDownIcon width={20} height={20} />
                  </TouchableOpacity>
                  {!loadingPassTypes && availablePassTypes.length === 1 && (
                    <Text
                      style={{ fontSize: 12, color: "#10B981", marginTop: 4 }}
                    >
                      Auto-selected: {availablePassTypes[0].name}
                    </Text>
                  )}
                  {!loadingPassTypes &&
                    availablePassTypes.length === 0 &&
                    selectedCategoryId && (
                      <Text
                        style={{ fontSize: 12, color: "#F59E0B", marginTop: 4 }}
                      >
                        No pass types are mapped to this category. Please map
                        pass types in the admin portal.
                      </Text>
                    )}
                </View>

                {/* Session */}
                <View style={styles.legislativeModalInputContainer}>
                  <Text style={styles.legislativeModalInputLabel}>
                    Session<Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.legislativeModalDropdown}
                    onPress={() => setShowSessionModal(true)}
                  >
                    <Text
                      style={[
                        styles.legislativeModalDropdownText,
                        !selectedSessionName &&
                          styles.legislativeModalDropdownPlaceholder,
                      ]}
                    >
                      {selectedSessionName || "Select Session"}
                    </Text>
                    <ChevronDownIcon width={20} height={20} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Comments Section */}
              <View style={styles.legislativeModalSection}>
                <Text style={styles.legislativeModalSectionTitle}>
                  Comments
                </Text>
                <TextInput
                  style={styles.legislativeModalTextArea}
                  placeholder="Add any comments (optional)..."
                  placeholderTextColor="#9CA3AF"
                  value={legislativeComments}
                  onChangeText={setLegislativeComments}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.legislativeModalButtonsContainer}>
                <TouchableOpacity
                  style={styles.legislativeModalCancelButton}
                  onPress={() => {
                    setShowLegislativeApproveModal(false);
                    setLegislativeComments("");
                  }}
                  disabled={processingStatus}
                >
                  <Text style={styles.legislativeModalCancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.legislativeModalApproveButton}
                  onPress={executeLegislativeApprove}
                  disabled={processingStatus}
                >
                  {processingStatus ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.legislativeModalApproveButtonText}>
                      Approve & Generate Pass
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      {/* Category Modal for Legislative */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View
            style={styles.filterModalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.filterModalTitle}>Select Category</Text>
            <ScrollView style={styles.filterModalList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.filterModalItem}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    setSelectedSubCategoryId(null);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.filterModalItemText}>
                    {category.name}
                  </Text>
                  {selectedCategoryId === category.id && (
                    <Ionicons name="checkmark" size={20} color="#457E51" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sub-Category Modal for Legislative */}
      <Modal
        visible={showSubCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubCategoryModal(false)}
        >
          <View
            style={styles.filterModalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.filterModalTitle}>Select Sub-Category</Text>
            <ScrollView style={styles.filterModalList}>
              {getSubCategoriesForCategory(selectedCategoryId).map(
                (subCat: SubCategory) => (
                  <TouchableOpacity
                    key={subCat.id}
                    style={styles.filterModalItem}
                    onPress={() => {
                      setSelectedSubCategoryId(subCat.id);
                      setShowSubCategoryModal(false);
                    }}
                  >
                    <Text style={styles.filterModalItemText}>
                      {subCat.name}
                    </Text>
                    {selectedSubCategoryId === subCat.id && (
                      <Ionicons name="checkmark" size={20} color="#457E51" />
                    )}
                  </TouchableOpacity>
                ),
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pass Type Modal for Legislative */}
      <Modal
        visible={showPassTypeModalLegislative}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPassTypeModalLegislative(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPassTypeModalLegislative(false)}
        >
          <View
            style={styles.filterModalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.filterModalTitle}>Select Pass Type</Text>
            <ScrollView style={styles.filterModalList}>
              {availablePassTypes.length > 0 ? (
                availablePassTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.filterModalItem}
                    onPress={() => {
                      setSelectedPassTypeId(type.id);
                      setShowPassTypeModalLegislative(false);
                    }}
                  >
                    <Text style={styles.filterModalItemText}>{type.name}</Text>
                    {selectedPassTypeId === type.id && (
                      <Ionicons name="checkmark" size={20} color="#457E51" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.filterModalItem}>
                  <Text style={styles.filterModalItemText}>
                    No pass types available for this category
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Session Modal for Legislative */}
      <Modal
        visible={showSessionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSessionModal(false)}
        >
          <View
            style={styles.filterModalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.filterModalTitle}>Select Session</Text>
            <ScrollView style={styles.filterModalList}>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.filterModalItem}
                  onPress={() => {
                    setSelectedSessionId(session.id);
                    setSelectedSessionName(session.name);
                    setShowSessionModal(false);
                  }}
                >
                  <Text style={styles.filterModalItemText}>{session.name}</Text>
                  {selectedSessionId === session.id && (
                    <Ionicons name="checkmark" size={20} color="#457E51" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Valid From Date/Time Picker */}
      {showValidFromPicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showValidFromPicker}
          onRequestClose={() => setShowValidFromPicker(false)}
        >
          <TouchableOpacity
            style={styles.datePickerModalOverlay}
            activeOpacity={1}
            onPress={() => setShowValidFromPicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.datePickerModalContent}>
                <View style={styles.datePickerModalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowValidFromPicker(false)}
                    style={styles.datePickerCancelButton}
                  >
                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerModalTitle}>
                    Select Valid From
                  </Text>
                  <TouchableOpacity
                    onPress={handleValidFromDone}
                    style={styles.datePickerDoneButton}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Calendar
                  current={formatDateForCalendar(tempValidFromDate)}
                  onDayPress={onValidFromDateSelect}
                  markedDates={{
                    [formatDateForCalendar(tempValidFromDate)]: {
                      selected: true,
                      selectedColor: "#457E51",
                      selectedTextColor: "#FFFFFF",
                    },
                  }}
                  minDate={formatDateForCalendar(new Date())}
                  theme={{
                    backgroundColor: "#FFFFFF",
                    calendarBackground: "#FFFFFF",
                    textSectionTitleColor: "#111827",
                    selectedDayBackgroundColor: "#457E51",
                    selectedDayTextColor: "#FFFFFF",
                    todayTextColor: "#457E51",
                    dayTextColor: "#111827",
                    textDisabledColor: "#D1D5DB",
                    dotColor: "#457E51",
                    selectedDotColor: "#FFFFFF",
                    arrowColor: "#457E51",
                    monthTextColor: "#111827",
                    indicatorColor: "#457E51",
                    textDayFontWeight: "500",
                    textMonthFontWeight: "bold",
                    textDayHeaderFontWeight: "600",
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                  }}
                  enableSwipeMonths={true}
                />
                <View style={styles.timePickerContainer}>
                  <View style={styles.customTimePicker}>
                    {/* Hours */}
                    <View style={styles.timePickerColumn}>
                      <ScrollView
                        style={styles.timePickerScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (hour) => (
                            <TouchableOpacity
                              key={hour}
                              style={[
                                styles.timePickerItem,
                                tempValidFromHour === hour &&
                                  styles.timePickerItemSelected,
                              ]}
                              onPress={() => setTempValidFromHour(hour)}
                            >
                              <Text
                                style={[
                                  styles.timePickerText,
                                  tempValidFromHour === hour &&
                                    styles.timePickerTextSelected,
                                ]}
                              >
                                {hour.toString().padStart(2, "0")}
                              </Text>
                            </TouchableOpacity>
                          ),
                        )}
                      </ScrollView>
                    </View>
                    {/* Minutes */}
                    <View style={styles.timePickerColumn}>
                      <ScrollView
                        style={styles.timePickerScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map(
                          (minute) => (
                            <TouchableOpacity
                              key={minute}
                              style={[
                                styles.timePickerItem,
                                tempValidFromMinute === minute &&
                                  styles.timePickerItemSelected,
                              ]}
                              onPress={() => setTempValidFromMinute(minute)}
                            >
                              <Text
                                style={[
                                  styles.timePickerText,
                                  tempValidFromMinute === minute &&
                                    styles.timePickerTextSelected,
                                ]}
                              >
                                {minute.toString().padStart(2, "0")}
                              </Text>
                            </TouchableOpacity>
                          ),
                        )}
                      </ScrollView>
                    </View>
                    {/* AM/PM */}
                    <View style={styles.timePickerColumn}>
                      <ScrollView
                        style={styles.timePickerScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        {["AM", "PM"].map((ampm) => (
                          <TouchableOpacity
                            key={ampm}
                            style={[
                              styles.timePickerItem,
                              tempValidFromAmPm === ampm &&
                                styles.timePickerItemSelected,
                            ]}
                            onPress={() =>
                              setTempValidFromAmPm(ampm as "AM" | "PM")
                            }
                          >
                            <Text
                              style={[
                                styles.timePickerText,
                                tempValidFromAmPm === ampm &&
                                  styles.timePickerTextSelected,
                              ]}
                            >
                              {ampm}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Valid To Date/Time Picker */}
      {showValidToPicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showValidToPicker}
          onRequestClose={() => setShowValidToPicker(false)}
        >
          <TouchableOpacity
            style={styles.datePickerModalOverlay}
            activeOpacity={1}
            onPress={() => setShowValidToPicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.datePickerModalContent}>
                <View style={styles.datePickerModalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowValidToPicker(false)}
                    style={styles.datePickerCancelButton}
                  >
                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerModalTitle}>
                    Select Valid To
                  </Text>
                  <TouchableOpacity
                    onPress={handleValidToDone}
                    style={styles.datePickerDoneButton}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                {tempValidToDate && (
                  <>
                    <Calendar
                      current={formatDateForCalendar(tempValidToDate)}
                      onDayPress={onValidToDateSelect}
                      markedDates={{
                        [formatDateForCalendar(tempValidToDate)]: {
                          selected: true,
                          selectedColor: "#457E51",
                          selectedTextColor: "#FFFFFF",
                        },
                      }}
                      minDate={formatDateForCalendar(validFrom)}
                      theme={{
                        backgroundColor: "#FFFFFF",
                        calendarBackground: "#FFFFFF",
                        textSectionTitleColor: "#111827",
                        selectedDayBackgroundColor: "#457E51",
                        selectedDayTextColor: "#FFFFFF",
                        todayTextColor: "#457E51",
                        dayTextColor: "#111827",
                        textDisabledColor: "#D1D5DB",
                        dotColor: "#457E51",
                        selectedDotColor: "#FFFFFF",
                        arrowColor: "#457E51",
                        monthTextColor: "#111827",
                        indicatorColor: "#457E51",
                        textDayFontWeight: "500",
                        textMonthFontWeight: "bold",
                        textDayHeaderFontWeight: "600",
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14,
                      }}
                      enableSwipeMonths={true}
                    />
                    <View style={styles.timePickerContainer}>
                      <View style={styles.customTimePicker}>
                        {/* Hours */}
                        <View style={styles.timePickerColumn}>
                          <ScrollView
                            style={styles.timePickerScroll}
                            showsVerticalScrollIndicator={false}
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                              (hour) => (
                                <TouchableOpacity
                                  key={hour}
                                  style={[
                                    styles.timePickerItem,
                                    tempValidToHour === hour &&
                                      styles.timePickerItemSelected,
                                  ]}
                                  onPress={() => setTempValidToHour(hour)}
                                >
                                  <Text
                                    style={[
                                      styles.timePickerText,
                                      tempValidToHour === hour &&
                                        styles.timePickerTextSelected,
                                    ]}
                                  >
                                    {hour.toString().padStart(2, "0")}
                                  </Text>
                                </TouchableOpacity>
                              ),
                            )}
                          </ScrollView>
                        </View>
                        {/* Minutes */}
                        <View style={styles.timePickerColumn}>
                          <ScrollView
                            style={styles.timePickerScroll}
                            showsVerticalScrollIndicator={false}
                          >
                            {Array.from({ length: 60 }, (_, i) => i).map(
                              (minute) => (
                                <TouchableOpacity
                                  key={minute}
                                  style={[
                                    styles.timePickerItem,
                                    tempValidToMinute === minute &&
                                      styles.timePickerItemSelected,
                                  ]}
                                  onPress={() => setTempValidToMinute(minute)}
                                >
                                  <Text
                                    style={[
                                      styles.timePickerText,
                                      tempValidToMinute === minute &&
                                        styles.timePickerTextSelected,
                                    ]}
                                  >
                                    {minute.toString().padStart(2, "0")}
                                  </Text>
                                </TouchableOpacity>
                              ),
                            )}
                          </ScrollView>
                        </View>
                        {/* AM/PM */}
                        <View style={styles.timePickerColumn}>
                          <ScrollView
                            style={styles.timePickerScroll}
                            showsVerticalScrollIndicator={false}
                          >
                            {["AM", "PM"].map((ampm) => (
                              <TouchableOpacity
                                key={ampm}
                                style={[
                                  styles.timePickerItem,
                                  tempValidToAmPm === ampm &&
                                    styles.timePickerItemSelected,
                                ]}
                                onPress={() =>
                                  setTempValidToAmPm(ampm as "AM" | "PM")
                                }
                              >
                                <Text
                                  style={[
                                    styles.timePickerText,
                                    tempValidToAmPm === ampm &&
                                      styles.timePickerTextSelected,
                                  ]}
                                >
                                  {ampm}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

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
              ].map((status) => {
                const displayLabel =
                  status === "All Status"
                    ? "All Status"
                    : getStatusLabel(
                        status === "assigned to me" ? "assigned_to_me" : status,
                      );
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.modalItem,
                      selectedStatus === displayLabel &&
                        styles.modalItemSelected,
                    ]}
                    onPress={() =>
                      handleStatusSelect(
                        status === "All Status" ? null : status,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedStatus === displayLabel &&
                          styles.modalItemTextSelected,
                      ]}
                    >
                      {displayLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Filter Modal */}
      <Modal
        visible={showCategoryFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedCategoryFilter === "All Categories" &&
                    styles.modalItemSelected,
                ]}
                onPress={() => handleCategoryFilterSelect(null)}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedCategoryFilter === "All Categories" &&
                      styles.modalItemTextSelected,
                  ]}
                >
                  All Categories
                </Text>
              </TouchableOpacity>
              {Object.keys(categoryMap).map((categoryId) => (
                <TouchableOpacity
                  key={categoryId}
                  style={[
                    styles.modalItem,
                    selectedCategoryFilterId === categoryId &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    const category =
                      categories.find((c) => c.id === categoryId) || null;
                    handleCategoryFilterSelect(category);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedCategoryFilterId === categoryId &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {categoryMap[categoryId]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Filter Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.datePickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePickerModal(false)}
        >
          <View
            style={styles.datePickerModalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.datePickerModalHeader}>
              <TouchableOpacity
                onPress={() => setShowDatePickerModal(false)}
                style={styles.datePickerCancelButton}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerModalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={handleDateFilterDone}
                style={styles.datePickerDoneButton}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              current={formatDateForFilter(tempSelectedDate)}
              onDayPress={handleDateSelect}
              markedDates={{
                [formatDateForFilter(tempSelectedDate)]: {
                  selected: true,
                  selectedColor: "#457E51",
                  selectedTextColor: "#FFFFFF",
                },
              }}
              theme={{
                backgroundColor: "#FFFFFF",
                calendarBackground: "#FFFFFF",
                textSectionTitleColor: "#111827",
                selectedDayBackgroundColor: "#457E51",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "#457E51",
                dayTextColor: "#111827",
                textDisabledColor: "#D1D5DB",
                dotColor: "#457E51",
                selectedDotColor: "#FFFFFF",
                arrowColor: "#457E51",
                monthTextColor: "#111827",
                indicatorColor: "#457E51",
                textDayFontWeight: "500",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              enableSwipeMonths={true}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Route Modal */}
      <Modal
        visible={showRouteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRouteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRouteModal(false)}
        >
          <ScrollView
            contentContainerStyle={styles.legislativeModalScrollContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.legislativeModalContent}>
              <TouchableOpacity
                style={styles.modalCloseButtonTop}
                onPress={() => setShowRouteModal(false)}
              >
                <CloseIcon width={20} height={20} />
              </TouchableOpacity>
              <View style={styles.legislativeModalHeader}>
                <View style={styles.legislativeModalIconContainer}>
                  <Ionicons
                    name="arrow-forward-circle"
                    size={48}
                    color="#3B82F6"
                  />
                </View>
                <Text style={styles.legislativeModalTitle}>
                  Route for Superior Approval
                </Text>
                <Text style={styles.rejectModalSubtitle}>
                  Forward to a superior for review
                </Text>
              </View>

              {/* Visitor Details Section */}
              <View style={styles.legislativeModalSection}>
                <Text style={styles.legislativeModalSectionTitle}>
                  Visitor Details
                </Text>
                {selectedVisitor && (
                  <>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        FULL NAME
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.first_name || ""}{" "}
                        {selectedVisitor.last_name || ""}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        EMAIL
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.email || "—"}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        PHONE
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.phone || "—"}
                      </Text>
                    </View>
                    <View style={styles.legislativeModalDetailRow}>
                      <Text style={styles.legislativeModalDetailLabel}>
                        IDENTIFICATION
                      </Text>
                      <Text style={styles.legislativeModalDetailValue}>
                        {selectedVisitor.identification_type || "—"}{" "}
                        {selectedVisitor.identification_number || ""}
                      </Text>
                    </View>
                    {selectedRequest && (
                      <View style={styles.legislativeModalDetailRow}>
                        <Text style={styles.legislativeModalDetailLabel}>
                          REQUESTED BY
                        </Text>
                        <Text style={styles.legislativeModalDetailValue}>
                          {userMap.get(selectedRequest.requested_by) ||
                            selectedRequest.requested_by ||
                            "—"}
                        </Text>
                      </View>
                    )}
                    {selectedRequest && (
                      <View style={styles.legislativeModalDetailRow}>
                        <Text style={styles.legislativeModalDetailLabel}>
                          CATEGORY
                        </Text>
                        <Text style={styles.legislativeModalDetailValue}>
                          {getCategoryName(selectedRequest.main_category_id) ||
                            "—"}{" "}
                          {selectedRequest.sub_category_id &&
                            `• ${getSubCategoryName(selectedRequest.sub_category_id)}`}
                        </Text>
                      </View>
                    )}
                    {selectedRequest && (
                      <View style={styles.legislativeModalDetailRow}>
                        <Text style={styles.legislativeModalDetailLabel}>
                          PURPOSE
                        </Text>
                        <Text style={styles.legislativeModalDetailValue}>
                          {selectedRequest.purpose || "—"}
                        </Text>
                      </View>
                    )}
                    {/* Car Passes Section */}
                    {selectedVisitor.car_passes &&
                      selectedVisitor.car_passes.length > 0 && (
                        <View style={styles.legislativeModalDetailRow}>
                          <Text style={styles.legislativeModalDetailLabel}>
                            CAR PASSES ({selectedVisitor.car_passes.length})
                          </Text>
                          <View style={{ marginTop: 8 }}>
                            {selectedVisitor.car_passes.map(
                              (carPass: any, index: number) => (
                                <View key={index} style={styles.carPassCard}>
                                  <Text style={styles.carPassLabel}>
                                    CAR PASS #{index + 1}
                                  </Text>
                                  <View style={styles.carPassDetails}>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        MAKE
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_make || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        MODEL
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_model || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        COLOR
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_color || "—"}
                                      </Text>
                                    </View>
                                    <View
                                      style={styles.legislativeModalDetailRow}
                                    >
                                      <Text
                                        style={
                                          styles.legislativeModalDetailLabel
                                        }
                                      >
                                        NUMBER
                                      </Text>
                                      <Text
                                        style={
                                          styles.legislativeModalDetailValue
                                        }
                                      >
                                        {carPass.car_number || "—"}
                                      </Text>
                                    </View>
                                    {carPass.car_tag && (
                                      <View
                                        style={styles.legislativeModalDetailRow}
                                      >
                                        <Text
                                          style={
                                            styles.legislativeModalDetailLabel
                                          }
                                        >
                                          TAG
                                        </Text>
                                        <Text
                                          style={
                                            styles.legislativeModalDetailValue
                                          }
                                        >
                                          {carPass.car_tag}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              ),
                            )}
                          </View>
                        </View>
                      )}
                  </>
                )}
              </View>

              {/* Superior Selection */}
              <View style={styles.legislativeModalSection}>
                <Text style={styles.legislativeModalSectionTitle}>
                  Select Superior<Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.legislativeModalDropdown}
                  onPress={() => setShowSuperiorModal(true)}
                >
                  <Text
                    style={[
                      styles.legislativeModalDropdownText,
                      !selectedSuperior &&
                        styles.legislativeModalDropdownPlaceholder,
                    ]}
                  >
                    {selectedSuperior
                      ? superiors.find((s: any) => s.id === selectedSuperior)
                          ?.full_name || "Select Superior"
                      : "Select Superior"}
                  </Text>
                  <ChevronDownIcon width={20} height={20} />
                </TouchableOpacity>
                {superiors.length === 0 && (
                  <Text
                    style={{ fontSize: 12, color: "#F59E0B", marginTop: 4 }}
                  >
                    No active superiors available. Please add superiors first.
                  </Text>
                )}
              </View>

              {/* Comments Section */}
              <View style={styles.legislativeModalSection}>
                <Text style={styles.legislativeModalSectionTitle}>
                  Comments<Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.legislativeModalTextArea}
                  placeholder="Please provide comments for routing..."
                  placeholderTextColor="#9CA3AF"
                  value={routeComments}
                  onChangeText={setRouteComments}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.legislativeModalButtonsContainer}>
                <TouchableOpacity
                  style={styles.legislativeModalCancelButton}
                  onPress={() => {
                    setShowRouteModal(false);
                    setSelectedSuperior("");
                    setRouteComments("");
                  }}
                  disabled={processingStatus}
                >
                  <Text style={styles.legislativeModalCancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.legislativeModalApproveButton}
                  onPress={executeRoute}
                  disabled={
                    processingStatus ||
                    !selectedSuperior ||
                    !routeComments.trim()
                  }
                >
                  {processingStatus ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.legislativeModalApproveButtonText}>
                      Route for Approval
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      {/* Superior Selection Modal */}
      <Modal
        visible={showSuperiorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuperiorModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuperiorModal(false)}
        >
          <View
            style={styles.filterModalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.filterModalTitle}>Select Superior</Text>
            <ScrollView style={styles.filterModalList}>
              {superiors.length > 0 ? (
                superiors.map((superior: any) => (
                  <TouchableOpacity
                    key={superior.id}
                    style={styles.filterModalItem}
                    onPress={() => {
                      setSelectedSuperior(superior.id);
                      setShowSuperiorModal(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.filterModalItemText}>
                        {superior.full_name}
                      </Text>
                      {superior.email && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#6B7280",
                            marginTop: 2,
                          }}
                        >
                          {superior.email}
                        </Text>
                      )}
                      {superior.approval_level && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            marginTop: 2,
                          }}
                        >
                          Level: {superior.approval_level}
                        </Text>
                      )}
                    </View>
                    {selectedSuperior === superior.id && (
                      <Ionicons name="checkmark" size={20} color="#457E51" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.filterModalItem}>
                  <Text style={styles.filterModalItemText}>
                    No superiors available
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Suspend Modal */}
      <Modal
        visible={showSuspendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuspendModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuspendModal(false)}
        >
          <View
            style={styles.approveModalContent}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.modalCloseButtonTop}
              onPress={() => setShowSuspendModal(false)}
            >
              <CloseIcon width={20} height={20} />
            </TouchableOpacity>
            <Text style={styles.approveModalTitle}>Suspend Pass</Text>
            {selectedVisitorForSuspend && (
              <Text style={styles.approveModalSubtitle}>
                Suspend pass for {selectedVisitorForSuspend.first_name}{" "}
                {selectedVisitorForSuspend.last_name}?
              </Text>
            )}
            <Text style={styles.modalInputLabel}>Reason (Optional)</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Enter reason..."
              placeholderTextColor="#9CA3AF"
              value={suspendReason}
              onChangeText={setSuspendReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSuspendModal(false);
                  setSuspendReason("");
                  setSelectedVisitorForSuspend(null);
                  setSelectedRequestForSuspend(null);
                }}
                disabled={processingStatus}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSuspendSubmit}
                disabled={processingStatus}
              >
                {processingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Suspend</Text>
                )}
              </TouchableOpacity>
            </View>
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
  routeButton: {
    flex: 1,
    backgroundColor: "#457E51",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  routeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  resendWhatsAppButton: {
    flex: 1,
    backgroundColor: "#457E51",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resendWhatsAppButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  suspendButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  suspendButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  activateButton: {
    flex: 1,
    backgroundColor: "#457E51",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activateButtonText: {
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
    color: "#111827",
    marginBottom: 16,
    fontWeight: "500",
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 8,
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
  modalSubmitButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitButtonText: {
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
  // Legislative Modal Styles
  legislativeModalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  legislativeModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "90%",
    maxWidth: 500,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "90%",
  },
  legislativeModalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  legislativeModalIconContainer: {
    marginBottom: 12,
  },
  legislativeModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },
  legislativeModalSection: {
    marginBottom: 24,
  },
  legislativeModalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  legislativeModalDetailRow: {
    marginBottom: 12,
  },
  legislativeModalDetailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  legislativeModalDetailValue: {
    fontSize: 14,
    color: "#111827",
  },
  legislativeModalInputContainer: {
    marginBottom: 16,
  },
  legislativeModalInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: "#EF4444",
  },
  legislativeModalDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  legislativeModalDropdownText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  legislativeModalDropdownPlaceholder: {
    color: "#9CA3AF",
  },
  legislativeModalTextArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
    textAlignVertical: "top",
  },
  legislativeModalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  legislativeModalCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  legislativeModalCancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  legislativeModalApproveButton: {
    flex: 1,
    backgroundColor: "#457E51",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  legislativeModalApproveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Filter Modal Styles
  filterModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "85%",
    maxWidth: 400,
    maxHeight: "70%",
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
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  filterModalList: {
    maxHeight: 400,
  },
  filterModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterModalItemText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  // Date Picker Modal Styles
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  datePickerModalHeader: {
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
  datePickerModalTitle: {
    fontSize: 18,
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
  // Time Picker Styles
  timePickerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  customTimePicker: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  timePickerColumn: {
    flex: 1,
    maxHeight: 200,
  },
  timePickerScroll: {
    flex: 1,
  },
  timePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemSelected: {
    backgroundColor: "#457E51",
  },
  timePickerText: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "500",
  },
  timePickerTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  carPassCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  carPassLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EA580C",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  carPassDetails: {
    gap: 8,
  },
});
