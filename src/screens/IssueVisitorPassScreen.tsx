import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import {
  api,
  MainCategory,
  PassTypeItem,
  SubCategory,
  Session,
  Issuer,
} from "@/services/api";
import LogOutIcon from "../../assets/logOut.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import CalendarIcon from "../../assets/calendar.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleLogout } from "@/utils/logout";

type IssueVisitorPassScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "IssueVisitorPass"
>;

type Props = {
  navigation: IssueVisitorPassScreenNavigationProp;
  route: {
    params?: {
      userFullName?: string;
      userId?: string;
    };
  };
};

const IDENTIFICATION_TYPES = [
  "Aadhaar",
  "Driving License",
  "ID Card",
  "Other",
  "PAN Card",
  "Passport",
  "Voter ID",
];

export default function IssueVisitorPassScreen({ navigation, route }: Props) {
  // Visitors (support multiple)
  const createNewVisitor = () => ({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    firstName: "",
    lastName: "",
    email: "",
    phone: "+91",
    idType: "Aadhaar",
    idNumber: "",
    identificationPhoto: null as string | null,
    identificationDocument: null as string | null,
    carPass: false,
    carMake: "",
    carModel: "",
    carColor: "",
    carNumber: "",
    carTag: "",
    errors: {} as Record<string, string>,
  });
  const [visitors, setVisitors] = useState<Array<any>>([createNewVisitor()]);
  const [expandedVisitors, setExpandedVisitors] = useState<Record<
    string,
    boolean
  >>({});

  // Request Details
  const [passCategory, setPassCategory] = useState("");
  const [passType, setPassType] = useState("");
  const [requestedBy, setRequestedBy] = useState(
    route.params?.userFullName || "",
  );
  const [purpose, setPurpose] = useState("Instant Pass Issuance");
  const [session, setSession] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
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
  const [comments, setComments] = useState("");

  // (Car pass fields are per-visitor now; kept global error states above)

  // UI States
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showPassCategoryModal, setShowPassCategoryModal] = useState(false);
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showValidFromPicker, setShowValidFromPicker] = useState(false);
  const [showValidToPicker, setShowValidToPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prevent automatic scrolling when modals close by restoring previous scroll position
  const scrollRef = useRef<ScrollView | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const prevModalOpenRef = useRef(false);
  const dropdownRefs = useRef<Record<string, any>>({});
  const [targetScrollY, setTargetScrollY] = useState<number | null>(null);

  const measureAndOpenRefKey = (key: string | null, openFn: () => void) => {
    try {
      const refNode = key ? dropdownRefs.current[key] : null;
      const scrollNode = (scrollRef.current && (scrollRef.current as any)._nativeTag) || null;
      const targetNode = refNode && (refNode._nativeTag || refNode);
      // fallback to findNodeHandle/ UIManager if tags not available
      if (!targetNode || !scrollNode) {
        openFn();
        return;
      }
      // UIManager.measureLayout: node, relativeToNode, error, success
      const UIManager = require("react-native").UIManager;
      const findNodeHandle = require("react-native").findNodeHandle;
      const targetHandle = findNodeHandle(refNode);
      const scrollHandle = findNodeHandle(scrollRef.current);
      if (!targetHandle || !scrollHandle) {
        openFn();
        return;
      }
      UIManager.measureLayout(
        targetHandle,
        scrollHandle,
        () => {
          openFn();
        },
        (x: number, y: number) => {
          setTargetScrollY(Math.max(0, y - 8));
          openFn();
        },
      );
    } catch {
      openFn();
    }
  };

  useEffect(() => {
    const anyModalOpen =
      showIdTypeModal ||
      showPassCategoryModal ||
      showPassTypeModal ||
      showSessionModal ||
      showValidFromPicker ||
      showValidToPicker;

    if (!anyModalOpen && prevModalOpenRef.current) {
      // Restore previous scroll position or target position after modal closes
      const toY = targetScrollY ?? lastScrollY;
      setTimeout(() => {
        try {
          scrollRef.current?.scrollTo({ y: toY, animated: false });
        } catch {
          // ignore
        }
        setTargetScrollY(null);
      }, 50);
    }
    prevModalOpenRef.current = anyModalOpen;
  }, [
    showIdTypeModal,
    showPassCategoryModal,
    showPassTypeModal,
    showSessionModal,
    showValidFromPicker,
    showValidToPicker,
    lastScrollY,
    targetScrollY,
  ]);

  // Error states
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [idTypeError, setIdTypeError] = useState("");
  const [idNumberError, setIdNumberError] = useState("");
  const [passCategoryError, setPassCategoryError] = useState("");
  const [passTypeError, setPassTypeError] = useState("");
  const [purposeError, setPurposeError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [validFromError, setValidFromError] = useState("");

  // Pass categories (this would typically come from API)
  const [passCategories, setPassCategories] = useState<string[]>([]);
  const [passTypes, setPassTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | null
  >(null);
  const [selectedPassTypeId, setSelectedPassTypeId] = useState<string | null>(
    null,
  );
  const [selectedCategorySubCategories, setSelectedCategorySubCategories] =
    useState<SubCategory[]>([]);
  const [loadingPassTypes, setLoadingPassTypes] = useState(false);
  const [allPassTypes, setAllPassTypes] = useState<PassTypeItem[]>([]);
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [loadingIssuers, setLoadingIssuers] = useState(false);

  // Time picker states
  const [tempValidFromDate, setTempValidFromDate] = useState<Date>(validFrom);
  const [tempValidFromHour, setTempValidFromHour] = useState(8);
  const [tempValidFromMinute, setTempValidFromMinute] = useState(0);
  const [tempValidFromAmPm, setTempValidFromAmPm] = useState<"AM" | "PM">("AM");
  const [tempValidToDate, setTempValidToDate] = useState<Date | null>(validTo);
  const [tempValidToHour, setTempValidToHour] = useState(5);
  const [tempValidToMinute, setTempValidToMinute] = useState(0);
  const [tempValidToAmPm, setTempValidToAmPm] = useState<"AM" | "PM">("PM");

  // Reset form
  const resetForm = () => {
    setVisitors([createNewVisitor()]);
    setPassCategory("");
    setPassType("");
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
    setSelectedPassTypeId(null);
    setSelectedCategorySubCategories([]);
    setPassTypes([]);
    setAllPassTypes([]);
    setRequestedBy(route.params?.userFullName || "Legislature");
    setPurpose("Instant Pass Issuance");
    setSession("");
    setSessionId(null);
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    setValidFrom(date);
    const toDate = new Date();
    toDate.setHours(17, 0, 0, 0);
    setValidTo(toDate);
    setComments("");
    // reset expanded map
    setExpandedVisitors({});
    // Clear errors
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPhoneError("");
    setIdTypeError("");
    setIdNumberError("");
    setPassCategoryError("");
    setPassTypeError("");
    setPurposeError("");
    setValidFromError("");
    // clear visitor-specific errors
    setVisitors((prev) =>
      prev.map((v) => ({ ...v, errors: {} as Record<string, string> })),
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      resetForm();
    }, []),
  );

  // Format date and time together
  const formatDateTime = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours || 12;
    const minutesStr = String(minutes).padStart(2, "0");
    return `${month}/${day}/${year} ${hours}:${minutesStr} ${ampm}`;
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Handle identification photo upload
  const handleIdentificationPhotoUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // default to first visitor if none specified - helper for global legacy usage
        setVisitors((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], identificationPhoto: result.assets[0].uri };
          return next;
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Handle identification document upload
  const handleIdentificationDocumentUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setVisitors((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], identificationDocument: result.assets[0].uri };
          return next;
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  // Handle pass category selection
  const handlePassCategorySelect = async (categoryName: string) => {
    setPassCategory(categoryName);
    setPassType(""); // Reset pass type when category changes
    setPassCategoryError("");
    setShowPassCategoryModal(false);

    // Find the selected category to get its ID
    const selectedCategory = categories.find(
      (cat) => cat.name === categoryName,
    );

    if (selectedCategory) {
      const categoryId = selectedCategory.id;
      setSelectedCategoryId(categoryId);
      // Store subcategories for later use
      // Only keep active subcategories for selection
      const categorySubCategories = selectedCategory.sub_categories || [];
      const activeSubCategories = categorySubCategories.filter(
        (sc) => sc.is_active,
      );
      setSelectedCategorySubCategories(activeSubCategories);
      setLoadingPassTypes(true);

      try {
        // Fetch all pass types and (optionally) category-specific pass type ids in parallel
        const [, /* categoryPassTypeIdsData */ allPassTypesData] =
          await Promise.all([
            api.getCategoryPassTypes(categoryId),
            api.getAllPassTypes(),
          ]);

        // Store all pass types for future use
        setAllPassTypes(allPassTypesData);

        // Build pass type names from active subcategories by mapping their pass_type_id to the pass type name.
        // Fall back to subcategory name if mapping is missing.
        const matchedPassTypes = activeSubCategories
          .map((subCat) => {
            const pt = allPassTypesData.find(
              (p) => p.id === subCat.pass_type_id,
            );
            return pt?.name || subCat.name;
          })
          // dedupe
          .filter((v, i, a) => a.indexOf(v) === i);

        setPassTypes(matchedPassTypes);
      } catch (error) {
        Alert.alert("Error", "Failed to load pass types. Please try again.");
        setPassTypes([]);
      } finally {
        setLoadingPassTypes(false);
      }
    } else {
      setSelectedCategoryId(null);
      setSelectedCategorySubCategories([]);
      setPassTypes([]);
    }
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
    setValidFromError("");
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

  // Visitor helpers
  const addVisitor = () => {
    const newVisitor = createNewVisitor();
    setVisitors((prev) => [...prev, newVisitor]);
    setExpandedVisitors((prev) => ({ ...prev, [newVisitor.id]: true }));
  };

  const removeVisitor = (visitorId: string) => {
    setVisitors((prev) => prev.filter((v) => v.id !== visitorId));
    setExpandedVisitors((prev) => {
      const next = { ...prev };
      delete next[visitorId];
      return next;
    });
  };

  const toggleVisitorExpanded = (visitorId: string) => {
    setExpandedVisitors((prev) => ({
      ...prev,
      [visitorId]: !(prev[visitorId] ?? true),
    }));
  };

  const updateVisitorField = (visitorId: string, field: string, value: any) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === visitorId ? { ...v, [field]: value } : v)),
    );
  };

  const handleIdentificationPhotoUploadFor = async (visitorId: string) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera roll permissions");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateVisitorField(visitorId, "identificationPhoto", result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleIdentificationDocumentUploadFor = async (visitorId: string) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera roll permissions");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateVisitorField(
          visitorId,
          "identificationDocument",
          result.assets[0].uri,
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  // Handle issue pass
  const handleIssuePass = async () => {
    // Clear previous top-level errors
    setPassCategoryError("");
    setPassTypeError("");
    setPurposeError("");
    setValidFromError("");

    // Validate visitors
    let hasError = false;
    const visitorsWithErrors = visitors.map((v) => {
      const errors: Record<string, string> = {};
      if (!v.firstName || !v.firstName.trim()) {
        errors.firstName = "First name is required";
        hasError = true;
      }
      if (!v.lastName || !v.lastName.trim()) {
        errors.lastName = "Last name is required";
        hasError = true;
      }
      if (!v.phone || v.phone === "+91") {
        errors.phone = "Phone number is required";
        hasError = true;
      } else if ((v.phone || "").replace(/[^0-9]/g, "").length < 10) {
        errors.phone = "Please enter a valid phone number";
        hasError = true;
      }
      if (!v.idType) {
        errors.idType = "ID type is required";
        hasError = true;
      }
      if (!v.idNumber || !v.idNumber.trim()) {
        errors.idNumber = "ID number is required";
        hasError = true;
      }
      return { ...v, errors };
    });

    if (hasError) {
      setVisitors(visitorsWithErrors);
      // Expand all visitors with errors so user can see them
      const expanded: Record<string, boolean> = {};
      visitorsWithErrors.forEach((v: any) => {
        if (Object.keys(v.errors || {}).length > 0) expanded[v.id] = true;
      });
      setExpandedVisitors((prev) => ({ ...prev, ...expanded }));
      return;
    }

    // Validate request-level fields
    if (!passCategory.trim()) {
      setPassCategoryError("Pass category is required");
      return;
    }

    if (!passType.trim()) {
      setPassTypeError("Pass type is required");
      return;
    }

    if (!purpose.trim()) {
      setPurposeError("Purpose is required");
      return;
    }

    setLoading(true);
    try {
      // Format dates for API - Convert to UTC
      const formatLocalISOString = (dateObj: Date): string => {
        // Use UTC methods to get UTC time components
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getUTCDate()).padStart(2, "0");
        const hours = String(dateObj.getUTCHours()).padStart(2, "0");
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getUTCSeconds()).padStart(2, "0");
        const milliseconds = String(dateObj.getUTCMilliseconds()).padStart(
          3,
          "0",
        );
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
      };

      const validFromISO = formatLocalISOString(validFrom);
      const validUntilISO = validTo ? formatLocalISOString(validTo) : null;

      // Map pass type
      const passTypeMap: Record<
        string,
        "daily" | "single" | "multiple" | "event"
      > = {
        "Single Entry": "single",
        "Multiple Entry": "multiple",
        Daily: "daily",
        Weekly: "single",
        Monthly: "multiple",
        Yearly: "event",
      };

      const apiPassType = passTypeMap[passType] || "daily";
      const entryType: "single" | "multiple" = passType.includes("Single")
        ? "single"
        : "multiple";

      // Validate required IDs
      if (!selectedCategoryId) {
        Alert.alert("Error", "Please select a category");
        setLoading(false);
        return;
      }

      if (!selectedSubCategoryId) {
        Alert.alert(
          "Error",
          `Please select a pass type. The selected pass type "${passType}" could not be matched to a subcategory.`,
        );
        setLoading(false);
        return;
      }

      // Create FormData
      const formData = new FormData();

      // Add text fields
      // Find the issuer that matches the selected category
      let passIssuerId: string | null = null;
      if (selectedCategoryId) {
        // Find issuer that has a category_weblink matching the selected category
        const matchingIssuer = issuers.find((issuer) =>
          issuer.category_weblinks.some(
            (weblink) =>
              weblink.category_id === selectedCategoryId && weblink.is_active,
          ),
        );

        if (matchingIssuer) {
          passIssuerId = matchingIssuer.id;
        } else {
          // Fallback to first active issuer if no match found
          const firstActiveIssuer = issuers.find((issuer) => issuer.is_active);
          if (firstActiveIssuer) {
            passIssuerId = firstActiveIssuer.id;
          }
        }
      }

      // Add pass_issuer_id if found
      if (passIssuerId) {
        formData.append("pass_issuer_id", passIssuerId);
      }
      formData.append("main_category_id", selectedCategoryId);
      formData.append("sub_category_id", selectedSubCategoryId);
      formData.append("requested_by", requestedBy.trim());
      formData.append("purpose", purpose.trim());
      if (sessionId) {
        formData.append("session_id", sessionId);
      }
      formData.append("valid_from", validFromISO);
      formData.append("valid_to", validUntilISO || validFromISO);
      formData.append("weblink", "legislative-mk2tc07d-laisqe"); // TODO: Generate or get from API
      formData.append(
        "comments",
        comments.trim() || "Instant pass issued by Legislature",
      );

      // Build visitors payload and append to formData
      const visitorsPayload = visitors.map((v) => {
        const visitorObj: any = {
          first_name: (v.firstName || "").trim(),
          last_name: (v.lastName || "").trim(),
          email: (v.email || "").trim(),
          phone: (v.phone || "").replace(/[^0-9+]/g, ""),
          identification_type: (v.idType || "Aadhaar").toLowerCase(),
          identification_number: (v.idNumber || "").trim(),
        };
        if (v.carPass) {
          visitorObj.car_passes = [
            {
              car_make: (v.carMake || "").trim(),
              car_model: (v.carModel || "").trim(),
              car_color: (v.carColor || "").trim(),
              car_number: (v.carNumber || "").trim(),
              ...(v.carTag && { car_tag: (v.carTag || "").trim() }),
            },
          ];
        } else {
          visitorObj.car_passes = [];
        }
        return visitorObj;
      });

      formData.append("visitors", JSON.stringify(visitorsPayload));

      // Add visitor photos and documents (one per visitor if provided)
      visitors.forEach((v, idx) => {
        if (v.identificationPhoto) {
          const photoUri = v.identificationPhoto;
          const filename = photoUri.split("/").pop() || `photo_${idx}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";
          formData.append("visitor_photos", {
            uri: photoUri,
            type,
            name: filename,
          } as any);
        }
        if (v.identificationDocument) {
          const docUri = v.identificationDocument;
          const filename = docUri.split("/").pop() || `document_${idx}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";
          formData.append("visitor_documents", {
            uri: docUri,
            type,
            name: filename,
          } as any);
        }
      });

      // Submit the form
      const submitResponse = await api.submitPassRequestWithFiles(formData);

      // Extract request_id from response
      const requestId = submitResponse?.request_id || submitResponse?.id;
      if (!requestId) {
        throw new Error("Request ID not found in response");
      }

      // Extract visitor ids from response (support multiple)
      const visitorIds: string[] =
        submitResponse?.visitors
          ?.map(
            (v: any) => v?.id || v?.visitor_id,
          )
          .filter(Boolean) || [];
      // Fallback single id
      if (visitorIds.length === 0 && submitResponse?.visitor_id) {
        visitorIds.push(submitResponse.visitor_id);
      }

      if (visitorIds.length === 0) {
        throw new Error("Visitor ID not found in response");
      }

      // Get current user ID
      const currentUserId = route.params?.userId;
      if (!currentUserId) {
        throw new Error("Current user ID not found");
      }

      // Get session name if selected
      const selectedSessionName = session
        ? sessions.find((s) => s.id === sessionId)?.name
        : undefined;

      // Step 1: Update pass request status
      await api.updatePassRequestStatus(requestId, {
        status: "approved",
        comments: "Auto-approved for instant pass issuance",
        current_user_id: currentUserId,
        pass_category_id: selectedCategoryId, // Using main_category_id as pass_category_id
        pass_sub_category_id: selectedSubCategoryId || undefined,
        pass_type_id: selectedPassTypeId || undefined,
        season: selectedSessionName,
      });

      // Step 2: Generate pass for each visitor
      await Promise.all(
        visitorIds.map((vid) =>
          api.generatePass(requestId, {
            visitor_id: vid,
            pass_category_id: selectedCategoryId,
            pass_sub_category_id: selectedSubCategoryId || undefined,
            pass_type_id: selectedPassTypeId || undefined,
            current_user_id: currentUserId,
          }),
        ),
      );

      // Step 3: Get pass request details
      const passRequestData = await api.getPassRequest(requestId);

      // Pass the entire response object along with category and pass type names to PreviewPassScreen
      navigation.navigate("PreviewPass", {
        passData: passRequestData,
        categoryName: passCategory,
        passTypeName: passType,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to issue pass. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load pass categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const fetchedCategories = await api.getMainCategories();
        setCategories(fetchedCategories);

        // Map category names to dropdown
        const categoryNames = fetchedCategories.map((cat) => cat.name);
        setPassCategories(categoryNames);
      } catch (error) {
        Alert.alert(
          "Error",
          "Failed to load categories. Please try again later.",
        );
        // Fallback to empty array
        setPassCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Load sessions from API
  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const fetchedSessions = await api.getSessions();
        setSessions(fetchedSessions);
      } catch (error) {
        Alert.alert(
          "Error",
          "Failed to load sessions. Please try again later.",
        );
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, []);

  // Load issuers from API
  useEffect(() => {
    const fetchIssuers = async () => {
      setLoadingIssuers(true);
      try {
        const fetchedIssuers = await api.getIssuers();
        setIssuers(fetchedIssuers);
      } catch (error) {
        Alert.alert("Error", "Failed to load issuers. Please try again later.");
        setIssuers([]);
      } finally {
        setLoadingIssuers(false);
      }
    };

    fetchIssuers();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <BackButtonIcon width={18} height={18} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Insta Pass</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleLogout(navigation)}
            style={styles.headerButton}
          >
            <LogOutIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={(ref) => {
            scrollRef.current = ref;
          }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(e) => setLastScrollY(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          {/* Visitors Section */}
          <View style={styles.section}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={styles.sectionTitle}>Visitors</Text>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#457E51",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  gap: 6,
                }}
                onPress={addVisitor}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Add Visitor
                </Text>
              </TouchableOpacity>
            </View>

            {visitors.map((visitor, visitorIndex) => {
              const isExpanded = expandedVisitors[visitor.id] ?? true;
              return (
                <View
                  key={visitor.id}
                  style={{
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 8,
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 16,
                      borderBottomWidth: isExpanded ? 1 : 0,
                      borderBottomColor: "#E5E7EB",
                    }}
                    onPress={() => toggleVisitorExpanded(visitor.id)}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      Visitor {visitorIndex + 1}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {visitors.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeVisitor(visitor.id)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      )}
                      <ChevronDownIcon
                        width={20}
                        height={20}
                        style={{
                          transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                        }}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={{ padding: 16 }}>
                      {/* First Name */}
                      <Text style={styles.inputLabel}>
                        First Name<Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.errors?.firstName && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Enter first name"
                          placeholderTextColor="#ADAEBC"
                          value={visitor.firstName}
                          onChangeText={(text) => {
                            updateVisitorField(visitor.id, "firstName", text);
                          }}
                        />
                      </View>
                      {visitor.errors?.firstName ? (
                        <Text style={styles.errorText}>
                          {visitor.errors.firstName}
                        </Text>
                      ) : null}

                      {/* Last Name */}
                      <Text style={styles.inputLabel}>
                        Last Name<Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.errors?.lastName && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Enter last name"
                          placeholderTextColor="#ADAEBC"
                          value={visitor.lastName}
                          onChangeText={(text) =>
                            updateVisitorField(visitor.id, "lastName", text)
                          }
                        />
                      </View>
                      {visitor.errors?.lastName ? (
                        <Text style={styles.errorText}>
                          {visitor.errors.lastName}
                        </Text>
                      ) : null}

                      {/* Email */}
                      <Text style={styles.inputLabel}>Email</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.errors?.email && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Enter email"
                          placeholderTextColor="#ADAEBC"
                          value={visitor.email}
                          onChangeText={(text) =>
                            updateVisitorField(visitor.id, "email", text)
                          }
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      {/* Phone */}
                      <Text style={styles.inputLabel}>
                        Phone<Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.errors?.phone && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Enter phone number"
                          placeholderTextColor="#ADAEBC"
                          value={visitor.phone}
                          onChangeText={(text) => {
                            // Keep +91 prefix
                            if (text.startsWith("+91")) {
                              updateVisitorField(visitor.id, "phone", text);
                            } else if (text.length === 0) {
                              updateVisitorField(visitor.id, "phone", "+91");
                            } else if (!text.startsWith("+")) {
                              updateVisitorField(
                                visitor.id,
                                "phone",
                                "+91" + text.replace(/[^0-9]/g, ""),
                              );
                            }
                          }}
                          keyboardType="phone-pad"
                        />
                      </View>
                      {visitor.errors?.phone ? (
                        <Text style={styles.errorText}>{visitor.errors.phone}</Text>
                      ) : null}

                      {/* ID Type */}
                      <Text style={styles.inputLabel}>
                        ID Type<Text style={styles.required}>*</Text>
                      </Text>
                      <TouchableOpacity
                        ref={(el) => {
                          dropdownRefs.current[`idType_${visitor.id}`] = el;
                        }}
                        style={[
                          styles.inputContainer,
                          visitor.errors?.idType && styles.inputContainerError,
                        ]}
                        onPress={() =>
                          measureAndOpenRefKey(`idType_${visitor.id}`, () => {
                            setShowIdTypeModal(true);
                            setExpandedVisitors((prev) => ({
                              ...prev,
                              _idTypeTarget: visitor.id,
                            }));
                          })
                        }
                      >
                        <Text
                          style={[styles.input, !visitor.idType && styles.placeholderText]}
                        >
                          {visitor.idType || "Select ID Type"}
                        </Text>
                        <ChevronDownIcon width={20} height={20} />
                      </TouchableOpacity>

                      {/* ID Number */}
                      <Text style={styles.inputLabel}>
                        ID Number<Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.errors?.idNumber && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Enter ID number"
                          placeholderTextColor="#ADAEBC"
                          value={visitor.idNumber}
                          onChangeText={(text) =>
                            updateVisitorField(visitor.id, "idNumber", text)
                          }
                        />
                      </View>

                      {/* Identification Photo */}
                      <Text style={styles.inputLabel}>Identification Photo</Text>
                      <TouchableOpacity
                        style={styles.fileUploadButton}
                        onPress={() => handleIdentificationPhotoUploadFor(visitor.id)}
                      >
                        <Text style={styles.fileUploadText}>
                          {visitor.identificationPhoto ? "File chosen" : "Choose File"}
                        </Text>
                        {!visitor.identificationPhoto && (
                          <Text style={styles.fileUploadSubtext}>No file chosen</Text>
                        )}
                      </TouchableOpacity>

                      {/* Identification Document */}
                      <Text style={styles.inputLabel}>Identification Document</Text>
                      <TouchableOpacity
                        style={styles.fileUploadButton}
                        onPress={() =>
                          handleIdentificationDocumentUploadFor(visitor.id)
                        }
                      >
                        <Text style={styles.fileUploadText}>
                          {visitor.identificationDocument ? "File chosen" : "Choose File"}
                        </Text>
                        {!visitor.identificationDocument && (
                          <Text style={styles.fileUploadSubtext}>No file chosen</Text>
                        )}
                      </TouchableOpacity>

                      {/* Car Pass (per visitor) */}
                      <View style={{ marginTop: 12 }}>
                        <View style={styles.carPassHeader}>
                          <Text style={styles.sectionTitle}>Car Pass</Text>
                          {visitor.carPass && (
                            <TouchableOpacity
                              onPress={() =>
                                updateVisitorField(visitor.id, "carPass", false)
                              }
                              style={styles.removeCarPassButton}
                            >
                              <Text style={styles.removeCarPassText}>Remove</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.carPassDescription}>
                          Add a car pass for this visitor (optional, maximum 1)
                        </Text>
                        {!visitor.carPass ? (
                          <>
                            <Text style={styles.carPassStatus}>
                              No car pass added yet. Click "Add Car Pass" to add one.
                            </Text>
                            <TouchableOpacity
                              style={styles.addCarPassButton}
                              onPress={() => updateVisitorField(visitor.id, "carPass", true)}
                            >
                              <Text style={styles.addCarPassButtonText}>
                                + Add Car Pass
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <View style={styles.carPassFormContainer}>
                            <Text style={styles.inputLabel}>
                              Car Make<Text style={styles.required}>*</Text>
                            </Text>
                            <View style={[styles.inputContainer]}>
                              <TextInput
                                style={styles.input}
                                placeholder="e.g., Toyota, Honda, BMW"
                                placeholderTextColor="#ADAEBC"
                                value={visitor.carMake}
                                onChangeText={(t) =>
                                  updateVisitorField(visitor.id, "carMake", t)
                                }
                              />
                            </View>

                            <Text style={styles.inputLabel}>
                              Car Model<Text style={styles.required}>*</Text>
                            </Text>
                            <View style={[styles.inputContainer]}>
                              <TextInput
                                style={styles.input}
                                placeholder="e.g., Camry, Civic, X5"
                                placeholderTextColor="#ADAEBC"
                                value={visitor.carModel}
                                onChangeText={(t) =>
                                  updateVisitorField(visitor.id, "carModel", t)
                                }
                              />
                            </View>

                            <Text style={styles.inputLabel}>
                              Car Color<Text style={styles.required}>*</Text>
                            </Text>
                            <View style={[styles.inputContainer]}>
                              <TextInput
                                style={styles.input}
                                placeholder="e.g., Red, Blue, White"
                                placeholderTextColor="#ADAEBC"
                                value={visitor.carColor}
                                onChangeText={(t) =>
                                  updateVisitorField(visitor.id, "carColor", t)
                                }
                              />
                            </View>

                            <Text style={styles.inputLabel}>
                              Car Number (Registration)
                              <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={[styles.inputContainer]}>
                              <TextInput
                                style={styles.input}
                                placeholder="e.g., AP39AB1234"
                                placeholderTextColor="#ADAEBC"
                                value={visitor.carNumber}
                                onChangeText={(t) =>
                                  updateVisitorField(visitor.id, "carNumber", t)
                                }
                                autoCapitalize="characters"
                              />
                            </View>

                            <Text style={styles.inputLabel}>Car Tag (Optional)</Text>
                            <View style={styles.inputContainer}>
                              <TextInput
                                style={styles.input}
                                placeholder="Optional tag or label for this car pass"
                                placeholderTextColor="#ADAEBC"
                                value={visitor.carTag}
                                onChangeText={(t) =>
                                  updateVisitorField(visitor.id, "carTag", t)
                                }
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Request Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request Details</Text>

            {/* Pass Category */}
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                Pass Category<Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TouchableOpacity
              ref={(el) => {
                dropdownRefs.current["passCategory"] = el;
              }}
              style={[
                styles.inputContainer,
                passCategoryError && styles.inputContainerError,
              ]}
              onPress={() =>
                measureAndOpenRefKey("passCategory", () =>
                  setShowPassCategoryModal(true),
                )
              }
            >
              <Text
                style={[styles.input, !passCategory && styles.placeholderText]}
              >
                {passCategory || "Select Pass Category"}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>
            {passCategoryError ? (
              <Text style={styles.errorText}>{passCategoryError}</Text>
            ) : null}

            {/* Pass Type */}
            <Text style={styles.inputLabel}>
              Pass Type<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              ref={(el) => {
                dropdownRefs.current["passType"] = el;
              }}
              style={[
                styles.inputContainer,
                passTypeError && styles.inputContainerError,
                !passCategory && styles.inputContainerDisabled,
              ]}
              onPress={() => {
                if (passCategory) {
                  measureAndOpenRefKey("passType", () => setShowPassTypeModal(true));
                }
              }}
              disabled={!passCategory}
            >
              <Text
                style={[
                  styles.input,
                  (!passType || !passCategory) && styles.placeholderText,
                ]}
              >
                {!passCategory
                  ? "Select Pass Category first"
                  : passType || "Select Pass Type"}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>
            {passTypeError ? (
              <Text style={styles.errorText}>{passTypeError}</Text>
            ) : null}

            {/* Requested By */}
            <Text style={styles.inputLabel}>
              Requested By<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter requested by"
                placeholderTextColor="#ADAEBC"
                value={requestedBy}
                onChangeText={setRequestedBy}
              />
            </View>

            {/* Purpose */}
            <Text style={styles.inputLabel}>
              Purpose<Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                purposeError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter purpose"
                placeholderTextColor="#ADAEBC"
                value={purpose}
                onChangeText={(text) => {
                  setPurpose(text);
                  if (purposeError) setPurposeError("");
                }}
              />
            </View>
            {purposeError ? (
              <Text style={styles.errorText}>{purposeError}</Text>
            ) : null}

            {/* Session */}
            <Text style={styles.inputLabel}>Session</Text>
            <TouchableOpacity
              ref={(el) => {
                dropdownRefs.current["session"] = el;
              }}
              style={styles.inputContainer}
              onPress={() =>
                measureAndOpenRefKey("session", () => setShowSessionModal(true))
              }
            >
              <Text style={[styles.input, !session && styles.placeholderText]}>
                {session || "Select Session"}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>

            {/* Valid From */}
            <Text style={styles.inputLabel}>
              Valid From<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              ref={(el) => {
                dropdownRefs.current["validFrom"] = el;
              }}
              style={[
                styles.inputContainer,
                validFromError && styles.inputContainerError,
              ]}
              onPress={() => measureAndOpenRefKey("validFrom", openValidFromPicker)}
            >
              <Text style={styles.input}>{formatDateTime(validFrom)}</Text>
              <CalendarIcon width={20} height={20} />
            </TouchableOpacity>
            {validFromError ? (
              <Text style={styles.errorText}>{validFromError}</Text>
            ) : null}

            {/* Valid To (Optional) */}
            <Text style={styles.inputLabel}>Valid To (Optional)</Text>
            <TouchableOpacity
              ref={(el) => {
                dropdownRefs.current["validTo"] = el;
              }}
              style={styles.inputContainer}
              onPress={() => measureAndOpenRefKey("validTo", openValidToPicker)}
            >
              <Text style={styles.input}>
                {validTo ? formatDateTime(validTo) : "Select date and time"}
              </Text>
              <CalendarIcon width={20} height={20} />
            </TouchableOpacity>

            {/* Comments */}
            <Text style={styles.inputLabel}>Comments (Optional)</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Additional comments or notes..."
                placeholderTextColor="#ADAEBC"
                value={comments}
                onChangeText={setComments}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Car Pass is now part of each visitor entry */}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.issueButton,
                loading && styles.issueButtonDisabled,
              ]}
              onPress={handleIssuePass}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                  <Text style={styles.issueButtonText}>Issue Instant Pass</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ID Type Modal */}
        <Modal
          visible={showIdTypeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowIdTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select ID Type</Text>
                <TouchableOpacity onPress={() => setShowIdTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {IDENTIFICATION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.modalItem}
                    onPress={() => {
                      const targetId = (expandedVisitors as any)?._idTypeTarget;
                      if (targetId) {
                        updateVisitorField(targetId, "idType", type);
                        // clear visitor specific idType error if present
                        setVisitors((prev) =>
                          prev.map((v) =>
                            v.id === targetId
                              ? { ...v, errors: { ...(v.errors || {}), idType: "" } }
                              : v,
                          ),
                        );
                      }
                      setShowIdTypeModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{type}</Text>
                    {/* show checkmark if any visitor currently has this type selected as the target */}
                    {((expandedVisitors as any)?._idTypeTarget &&
                      visitors.find((v) => v.id === (expandedVisitors as any)?._idTypeTarget)
                        ?.idType) === type && (
                      <Ionicons name="checkmark" size={20} color="#457E51" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Pass Category Modal */}
        <Modal
          visible={showPassCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPassCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Pass Category</Text>
                <TouchableOpacity
                  onPress={() => setShowPassCategoryModal(false)}
                >
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {loadingCategories ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#457E51" />
                    <Text style={styles.modalLoadingText}>
                      Loading categories...
                    </Text>
                  </View>
                ) : passCategories.length === 0 ? (
                  <View style={styles.modalLoadingContainer}>
                    <Text style={styles.modalLoadingText}>
                      No categories available
                    </Text>
                  </View>
                ) : (
                  passCategories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={styles.modalItem}
                      onPress={() => handlePassCategorySelect(category)}
                    >
                      <Text style={styles.modalItemText}>{category}</Text>
                      {passCategory === category && (
                        <Ionicons name="checkmark" size={20} color="#457E51" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Pass Type Modal */}
        <Modal
          visible={showPassTypeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPassTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Pass Type</Text>
                <TouchableOpacity onPress={() => setShowPassTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {loadingPassTypes ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#1F2937" />
                    <Text style={styles.modalLoadingText}>
                      Loading pass types...
                    </Text>
                  </View>
                ) : passTypes.length === 0 ? (
                  <View style={styles.modalEmptyContainer}>
                    <Text style={styles.modalEmptyText}>
                      No pass types available
                    </Text>
                  </View>
                ) : (
                  passTypes.map((type) => {
                    // Find the pass type object to get its ID
                    const passTypeItem = allPassTypes.find(
                      (pt) => pt.name === type,
                    );
                    // Find subcategory by matching pass_type_id with pass type ID
                    const subCategory = selectedCategorySubCategories.find(
                      (subCat) => subCat.pass_type_id === passTypeItem?.id,
                    );
                    return (
                      <TouchableOpacity
                        key={type}
                        style={styles.modalItem}
                        onPress={() => {
                          setPassType(type);
                          // Store pass type ID
                          setSelectedPassTypeId(passTypeItem?.id || null);

                          // Use subcategory ID if found, otherwise try to find by name as fallback
                          let subCatId =
                            subCategory?.id ||
                            selectedCategorySubCategories.find(
                              (subCat) => subCat.name === type,
                            )?.id ||
                            null;

                          // If still not found, use the first active subcategory as fallback
                          if (
                            !subCatId &&
                            selectedCategorySubCategories.length > 0
                          ) {
                            const firstActiveSubCategory =
                              selectedCategorySubCategories.find(
                                (subCat) => subCat.is_active,
                              ) || selectedCategorySubCategories[0];
                            subCatId = firstActiveSubCategory.id;
                          }

                          if (!subCatId) {
                          }

                          setSelectedSubCategoryId(subCatId);
                          setPassTypeError("");
                          setShowPassTypeModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{type}</Text>
                        {passType === type && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#457E51"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Session Modal */}
        <Modal
          visible={showSessionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSessionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Session</Text>
                <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {loadingSessions ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#1F2937" />
                    <Text style={styles.modalLoadingText}>
                      Loading sessions...
                    </Text>
                  </View>
                ) : sessions.length === 0 ? (
                  <View style={styles.modalEmptyContainer}>
                    <Text style={styles.modalEmptyText}>
                      No sessions available
                    </Text>
                  </View>
                ) : (
                  sessions.map((sessionItem) => (
                    <TouchableOpacity
                      key={sessionItem.id}
                      style={styles.modalItem}
                      onPress={() => {
                        setSession(sessionItem.name);
                        setSessionId(sessionItem.id);
                        setShowSessionModal(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>
                        {sessionItem.name}
                      </Text>
                      {session === sessionItem.name && (
                        <Ionicons name="checkmark" size={20} color="#457E51" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
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
                    current={formatDate(tempValidFromDate)}
                    onDayPress={onValidFromDateSelect}
                    markedDates={{
                      [formatDate(tempValidFromDate)]: {
                        selected: true,
                        selectedColor: "#457E51",
                        selectedTextColor: "#FFFFFF",
                      },
                    }}
                    minDate={formatDate(new Date())}
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
                          {["AM", "PM"].map((amPm) => (
                            <TouchableOpacity
                              key={amPm}
                              style={[
                                styles.timePickerItem,
                                tempValidFromAmPm === amPm &&
                                  styles.timePickerItemSelected,
                              ]}
                              onPress={() =>
                                setTempValidFromAmPm(amPm as "AM" | "PM")
                              }
                            >
                              <Text
                                style={[
                                  styles.timePickerText,
                                  tempValidFromAmPm === amPm &&
                                    styles.timePickerTextSelected,
                                ]}
                              >
                                {amPm}
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
                        current={formatDate(tempValidToDate)}
                        onDayPress={onValidToDateSelect}
                        markedDates={{
                          [formatDate(tempValidToDate)]: {
                            selected: true,
                            selectedColor: "#457E51",
                            selectedTextColor: "#FFFFFF",
                          },
                        }}
                        minDate={formatDate(new Date())}
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
                              {["AM", "PM"].map((amPm) => (
                                <TouchableOpacity
                                  key={amPm}
                                  style={[
                                    styles.timePickerItem,
                                    tempValidToAmPm === amPm &&
                                      styles.timePickerItemSelected,
                                  ]}
                                  onPress={() =>
                                    setTempValidToAmPm(amPm as "AM" | "PM")
                                  }
                                >
                                  <Text
                                    style={[
                                      styles.timePickerText,
                                      tempValidToAmPm === amPm &&
                                        styles.timePickerTextSelected,
                                    ]}
                                  >
                                    {amPm}
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
      </KeyboardAvoidingView>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 8,
    marginTop: 10,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 10,
  },
  enterTextLink: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },
  required: {
    color: "#EF4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: "#FFFFFF",
    minHeight: 45,
  },
  inputContainerError: {
    borderColor: "#EF4444",
    borderWidth: 1.5,
  },
  inputContainerDisabled: {
    backgroundColor: "#F3F4F6",
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  placeholderText: {
    color: "#ADAEBC",
  },
  fileUploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#F9FAFB",
  },
  fileUploadText: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },
  fileUploadSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 5,
    backgroundColor: "#FFFFFF",
    minHeight: 100,
  },
  textArea: {
    fontSize: 16,
    color: "#333",
    minHeight: 80,
  },
  carPassDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 10,
  },
  carPassStatus: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 15,
    fontStyle: "italic",
  },
  addCarPassButton: {
    backgroundColor: "#457E51",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  addCarPassButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  carPassHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  carPassFormContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 15,
    backgroundColor: "#F9FAFB",
    marginTop: 10,
  },
  carPassRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  carPassColumn: {
    flex: 1,
  },
  carPassInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  carPassInfoText: {
    fontSize: 14,
    color: "#111827",
  },
  removeCarPassButton: {
    padding: 5,
  },
  removeCarPassText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#457E51",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#457E51",
    fontSize: 16,
    fontWeight: "600",
  },
  issueButton: {
    flex: 2,
    backgroundColor: "#457E51",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  issueButtonDisabled: {
    opacity: 0.6,
  },
  issueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemText: {
    fontSize: 16,
    color: "#111827",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalInputContainer: {
    padding: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalSubmitButton: {
    backgroundColor: "#457E51",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerCancelButton: {
    padding: 5,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  datePickerDoneButton: {
    padding: 5,
  },
  datePickerDoneText: {
    fontSize: 16,
    color: "#457E51",
    fontWeight: "600",
  },
  timePickerContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 10,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  customTimePicker: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 200,
  },
  timePickerColumn: {
    flex: 1,
    height: 200,
    alignItems: "center",
  },
  timePickerScroll: {
    width: "100%",
  },
  timePickerItem: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  timePickerItemSelected: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  timePickerText: {
    fontSize: 20,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  timePickerTextSelected: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 24,
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
