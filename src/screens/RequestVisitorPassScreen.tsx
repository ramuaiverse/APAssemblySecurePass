import React, { useState, useEffect } from "react";
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
  API_BASE_URL,
} from "@/services/api";
import LogOutIcon from "../../assets/logOut.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import CalendarIcon from "../../assets/calendar.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { handleLogout } from "@/utils/logout";

type RequestVisitorPassScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "RequestVisitorPass"
>;

type Props = {
  navigation: RequestVisitorPassScreenNavigationProp;
  route: {
    params?: {
      userFullName?: string;
      userId?: string;
      designation?: string;
      sub_categories?: Array<{ id: string; name: string }>;
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

interface CarPass {
  carMake: string;
  carModel: string;
  carColor: string;
  carNumber: string;
  carTag?: string;
  carMakeError?: string;
  carModelError?: string;
  carColorError?: string;
  carNumberError?: string;
}

interface Visitor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  identificationPhoto: string | null;
  identificationDocument: string | null;
  passTypeId: string | null;
  validFrom: Date;
  validTo: Date | null;
  purpose: string;
  carPasses: CarPass[];
  // Error states
  firstNameError: string;
  lastNameError: string;
  emailError: string;
  phoneError: string;
  idTypeError: string;
  idNumberError: string;
  identificationDocumentError: string;
  passTypeError: string;
  validFromError: string;
  validToError: string;
  purposeError: string;
}

export default function RequestVisitorPassScreen({ navigation, route }: Props) {
  // Create initial visitor
  const createInitialVisitor = (): Visitor => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    const toDate = new Date();
    toDate.setHours(17, 0, 0, 0);
    return {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      email: "",
      phone: "+91",
      idType: "Aadhaar",
      idNumber: "",
      identificationPhoto: null,
      identificationDocument: null,
      passTypeId: null,
      validFrom: date,
      validTo: toDate,
      purpose: "",
      carPasses: [],
      firstNameError: "",
      lastNameError: "",
      emailError: "",
      phoneError: "",
      idTypeError: "",
      idNumberError: "",
      identificationDocumentError: "",
      passTypeError: "",
      validFromError: "",
      validToError: "",
      purposeError: "",
    };
  };

  // Visitors array
  const [visitors, setVisitors] = useState<Visitor[]>([createInitialVisitor()]);
  const [expandedVisitors, setExpandedVisitors] = useState<{
    [key: string]: boolean;
  }>({ [createInitialVisitor().id]: true });
  const [selectedVisitorForModal, setSelectedVisitorForModal] = useState<
    string | null
  >(null);

  // Request Details
  const [passCategory, setPassCategory] = useState("");
  const [requestedBy, setRequestedBy] = useState(
    route.params?.userFullName || "",
  );
  const [designation, setDesignation] = useState(
    route.params?.designation || "",
  );
  const [session, setSession] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [comments, setComments] = useState("");

  // UI States
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showPassCategoryModal, setShowPassCategoryModal] = useState(false);
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showValidFromPicker, setShowValidFromPicker] = useState(false);
  const [showValidToPicker, setShowValidToPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passCategoryError, setPassCategoryError] = useState("");

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

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auto-close success modal after 3 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        // Use replace to ensure screen refreshes
        navigation.replace("MyPassRequests", {
          userFullName: route.params?.userFullName,
          userId: route.params?.userId,
          sub_categories: route.params?.sub_categories,
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);
  const [submittedRequestId, setSubmittedRequestId] = useState<string>("");
  const [statusCheckUrl, setStatusCheckUrl] = useState<string>("");
  const [submittedVisitorCount, setSubmittedVisitorCount] = useState<number>(1);

  // Time picker states
  const [tempValidFromDate, setTempValidFromDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  });
  const [tempValidFromHour, setTempValidFromHour] = useState(8);
  const [tempValidFromMinute, setTempValidFromMinute] = useState(0);
  const [tempValidFromAmPm, setTempValidFromAmPm] = useState<"AM" | "PM">("AM");
  const [tempValidToDate, setTempValidToDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(17, 0, 0, 0);
    return date;
  });
  const [tempValidToHour, setTempValidToHour] = useState(5);
  const [tempValidToMinute, setTempValidToMinute] = useState(0);
  const [tempValidToAmPm, setTempValidToAmPm] = useState<"AM" | "PM">("PM");

  // Helper functions for managing visitors
  const addVisitor = () => {
    const newVisitor = createInitialVisitor();
    setVisitors([...visitors, newVisitor]);
    setExpandedVisitors({ ...expandedVisitors, [newVisitor.id]: true });
  };

  const removeVisitor = (visitorId: string) => {
    if (visitors.length === 1) {
      Alert.alert("Error", "At least one visitor is required");
      return;
    }
    setVisitors(visitors.filter((v) => v.id !== visitorId));
    const newExpanded = { ...expandedVisitors };
    delete newExpanded[visitorId];
    setExpandedVisitors(newExpanded);
  };

  const updateVisitor = (visitorId: string, updates: Partial<Visitor>) => {
    setVisitors(
      visitors.map((v) => (v.id === visitorId ? { ...v, ...updates } : v)),
    );
  };

  const toggleVisitorExpanded = (visitorId: string) => {
    setExpandedVisitors({
      ...expandedVisitors,
      [visitorId]: !expandedVisitors[visitorId],
    });
  };

  const addCarPass = (visitorId: string) => {
    const visitor = visitors.find((v) => v.id === visitorId);
    if (visitor) {
      // Only allow one car pass per visitor
      if (visitor.carPasses.length >= 1) {
        Alert.alert(
          "Limit Reached",
          "Only one car pass is allowed per visitor.",
        );
        return;
      }
      const newCarPass: CarPass = {
        carMake: "",
        carModel: "",
        carColor: "",
        carNumber: "",
        carTag: "",
        carMakeError: "",
        carModelError: "",
        carColorError: "",
        carNumberError: "",
      };
      updateVisitor(visitorId, {
        carPasses: [...visitor.carPasses, newCarPass],
      });
    }
  };

  const removeCarPass = (visitorId: string, carPassIndex: number) => {
    const visitor = visitors.find((v) => v.id === visitorId);
    if (visitor) {
      const newCarPasses = visitor.carPasses.filter(
        (_, index) => index !== carPassIndex,
      );
      updateVisitor(visitorId, { carPasses: newCarPasses });
    }
  };

  const updateCarPass = (
    visitorId: string,
    carPassIndex: number,
    updates: Partial<CarPass>,
  ) => {
    const visitor = visitors.find((v) => v.id === visitorId);
    if (visitor) {
      const newCarPasses = visitor.carPasses.map((cp, index) =>
        index === carPassIndex ? { ...cp, ...updates } : cp,
      );
      updateVisitor(visitorId, { carPasses: newCarPasses });
    }
  };

  // Reset form
  const resetForm = () => {
    setVisitors([createInitialVisitor()]);
    setExpandedVisitors({ [createInitialVisitor().id]: true });
    setPassCategory("");
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
    setSelectedCategorySubCategories([]);
    setPassTypes([]);
    setAllPassTypes([]);
    setRequestedBy(route.params?.userFullName || "");
    setDesignation(route.params?.designation || "");
    setSession("");
    setSessionId(null);
    setComments("");
    setPassCategoryError("");
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
  const handleIdentificationPhotoUpload = async (visitorId: string) => {
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
        updateVisitor(visitorId, {
          identificationPhoto: result.assets[0].uri,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Handle identification document upload
  const handleIdentificationDocumentUpload = async (visitorId: string) => {
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
        updateVisitor(visitorId, {
          identificationDocument: result.assets[0].uri,
          identificationDocumentError: "",
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  // Handle pass category selection
  const handlePassCategorySelect = async (categoryName: string) => {
    setPassCategory(categoryName);
    // Reset all visitor pass types when category changes
    setVisitors(
      visitors.map((v) => ({
        ...v,
        passTypeId: null,
        passTypeError: "",
      })),
    );
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
      const subCategories = selectedCategory.sub_categories || [];
      setSelectedCategorySubCategories(subCategories);

      // Automatically select the first active subcategory when category is selected
      // This matches web behavior where subcategory is selected from category, not from pass type
      if (subCategories.length > 0) {
        const firstActiveSubCategory =
          subCategories.find((subCat) => subCat.is_active) || subCategories[0];
        setSelectedSubCategoryId(firstActiveSubCategory.id);
      } else {
        setSelectedSubCategoryId(null);
      }

      setLoadingPassTypes(true);

      try {
        // Call both APIs in parallel
        const [categoryPassTypeIdsData, allPassTypesData] = await Promise.all([
          api.getCategoryPassTypes(categoryId),
          api.getAllPassTypes(),
        ]);

        // Store all pass types for future use
        setAllPassTypes(allPassTypesData);

        // Match IDs from category pass types with all pass types
        const matchedPassTypes = allPassTypesData
          .filter((passType) => categoryPassTypeIdsData.includes(passType.id))
          .map((passType) => passType.name);

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

  // Handle valid from date/time selection for a specific visitor
  const openValidFromPicker = (visitorId: string) => {
    const visitor = visitors.find((v) => v.id === visitorId);
    if (visitor) {
      setSelectedVisitorForModal(visitorId);
      setTempValidFromDate(new Date(visitor.validFrom));
      const hours = visitor.validFrom.getHours();
      const minutes = visitor.validFrom.getMinutes();
      setTempValidFromHour(hours % 12 || 12);
      setTempValidFromMinute(minutes);
      setTempValidFromAmPm(hours >= 12 ? "PM" : "AM");
      setShowValidFromPicker(true);
    }
  };

  const handleValidFromDone = () => {
    if (selectedVisitorForModal) {
      const hours24 =
        tempValidFromAmPm === "PM" && tempValidFromHour !== 12
          ? tempValidFromHour + 12
          : tempValidFromAmPm === "AM" && tempValidFromHour === 12
            ? 0
            : tempValidFromHour;
      const newDate = new Date(tempValidFromDate);
      newDate.setHours(hours24, tempValidFromMinute, 0, 0);
      updateVisitor(selectedVisitorForModal, {
        validFrom: newDate,
        validFromError: "",
      });
      setShowValidFromPicker(false);
      setSelectedVisitorForModal(null);
    }
  };

  // Handle valid to date/time selection for a specific visitor
  const openValidToPicker = (visitorId: string) => {
    const visitor = visitors.find((v) => v.id === visitorId);
    if (visitor && visitor.validTo) {
      setSelectedVisitorForModal(visitorId);
      setTempValidToDate(new Date(visitor.validTo));
      const hours = visitor.validTo.getHours();
      const minutes = visitor.validTo.getMinutes();
      setTempValidToHour(hours % 12 || 12);
      setTempValidToMinute(minutes);
      setTempValidToAmPm(hours >= 12 ? "PM" : "AM");
    } else if (visitor) {
      setSelectedVisitorForModal(visitorId);
      const toDate = new Date(visitor.validFrom);
      toDate.setHours(17, 0, 0, 0);
      setTempValidToDate(toDate);
      setTempValidToHour(5);
      setTempValidToMinute(0);
      setTempValidToAmPm("PM");
    }
    setShowValidToPicker(true);
  };

  const handleValidToDone = () => {
    if (selectedVisitorForModal && tempValidToDate) {
      const hours24 =
        tempValidToAmPm === "PM" && tempValidToHour !== 12
          ? tempValidToHour + 12
          : tempValidToAmPm === "AM" && tempValidToHour === 12
            ? 0
            : tempValidToHour;
      const newDate = new Date(tempValidToDate);
      newDate.setHours(hours24, tempValidToMinute, 0, 0);
      updateVisitor(selectedVisitorForModal, {
        validTo: newDate,
        validToError: "",
      });
      setShowValidToPicker(false);
      setSelectedVisitorForModal(null);
    }
  };

  const onValidFromDateSelect = (day: any) => {
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    // Ensure the date is set at midnight to avoid time comparison issues
    selectedDate.setHours(0, 0, 0, 0);
    setTempValidFromDate(selectedDate);
  };

  const onValidToDateSelect = (day: any) => {
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    setTempValidToDate(selectedDate);
  };

  // Handle issue pass
  const handleIssuePass = async () => {
    // Clear previous errors
    setPassCategoryError("");
    let hasError = false;

    // Validate category
    if (!passCategory.trim() || !selectedCategoryId || !selectedSubCategoryId) {
      setPassCategoryError("Pass category is required");
      hasError = true;
    }

    // Validate all visitors
    const updatedVisitors = visitors.map((visitor) => {
      const errors: Partial<Visitor> = {};
      let visitorHasError = false;

      if (!visitor.firstName.trim()) {
        errors.firstNameError = "First name is required";
        visitorHasError = true;
      }

      if (!visitor.lastName.trim()) {
        errors.lastNameError = "Last name is required";
        visitorHasError = true;
      }

      // Validate email format only if email is provided
      if (
        visitor.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitor.email.trim())
      ) {
        errors.emailError = "Please enter a valid email";
        visitorHasError = true;
      }

      if (!visitor.phone.trim() || visitor.phone === "+91") {
        errors.phoneError = "Phone number is required";
        visitorHasError = true;
      } else if (visitor.phone.replace(/[^0-9]/g, "").length < 10) {
        errors.phoneError = "Please enter a valid phone number";
        visitorHasError = true;
      }

      if (!visitor.idType) {
        errors.idTypeError = "ID type is required";
        visitorHasError = true;
      }

      if (!visitor.idNumber.trim()) {
        errors.idNumberError = "ID number is required";
        visitorHasError = true;
      }

      // Identification document is mandatory
      if (!visitor.identificationDocument) {
        errors.identificationDocumentError =
          "Identification document is required";
        visitorHasError = true;
      }

      if (!visitor.passTypeId) {
        errors.passTypeError = "Pass type is required";
        visitorHasError = true;
      }

      if (!visitor.purpose.trim()) {
        errors.purposeError = "Purpose is required";
        visitorHasError = true;
      }

      // Validate valid from date/time - must be in the future
      const now = new Date();
      if (visitor.validFrom <= now) {
        errors.validFromError = "Valid from date/time must be in the future";
        visitorHasError = true;
      }

      // Validate valid to date/time - must be in the future and after valid from
      if (visitor.validTo) {
        if (visitor.validTo <= now) {
          errors.validToError = "Valid to date/time must be in the future";
          visitorHasError = true;
        } else if (visitor.validTo <= visitor.validFrom) {
          errors.validToError =
            "Valid to date/time must be after valid from date/time";
          visitorHasError = true;
        }
      }

      // Validate car passes if any
      if (visitor.carPasses.length > 0) {
        const updatedCarPasses = visitor.carPasses.map((carPass, index) => {
          const carPassErrors: Partial<CarPass> = {};
          let carPassHasError = false;

          if (!carPass.carMake.trim()) {
            carPassErrors.carMakeError = "Car make is required";
            carPassHasError = true;
          }
          if (!carPass.carModel.trim()) {
            carPassErrors.carModelError = "Car model is required";
            carPassHasError = true;
          }
          if (!carPass.carColor.trim()) {
            carPassErrors.carColorError = "Car color is required";
            carPassHasError = true;
          }
          if (!carPass.carNumber.trim()) {
            carPassErrors.carNumberError = "Car number is required";
            carPassHasError = true;
          }

          if (carPassHasError) {
            visitorHasError = true;
          }

          return { ...carPass, ...carPassErrors };
        });
        errors.carPasses = updatedCarPasses;
      }

      if (visitorHasError) {
        hasError = true;
      }

      return { ...visitor, ...errors };
    });

    if (hasError) {
      setVisitors(updatedVisitors);
      // Expand first visitor with errors
      const firstErrorVisitor = updatedVisitors.find(
        (v) =>
          v.firstNameError ||
          v.lastNameError ||
          v.emailError ||
          v.phoneError ||
          v.idTypeError ||
          v.idNumberError ||
          v.identificationDocumentError ||
          v.passTypeError ||
          v.purposeError ||
          v.validFromError ||
          v.validToError,
      );
      if (firstErrorVisitor) {
        setExpandedVisitors({
          ...expandedVisitors,
          [firstErrorVisitor.id]: true,
        });
      }
      return;
    }

    setLoading(true);

    try {
      // Format dates for API
      const formatLocalISOString = (dateObj: Date): string => {
        if (
          !dateObj ||
          !(dateObj instanceof Date) ||
          isNaN(dateObj.getTime())
        ) {
          throw new Error("Invalid date object");
        }
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
      };

      // Validate required IDs
      if (!selectedCategoryId || !selectedSubCategoryId) {
        Alert.alert("Error", "Please select a category and subcategory");
        setLoading(false);
        return;
      }

      // Build visitor objects array
      const visitorObjects = visitors.map((visitor, index) => {
        try {
          // Validate dates before formatting
          if (
            !visitor.validFrom ||
            !(visitor.validFrom instanceof Date) ||
            isNaN(visitor.validFrom.getTime())
          ) {
            throw new Error(`Invalid validFrom date for visitor ${index + 1}`);
          }

          const validToDate =
            visitor.validTo &&
            visitor.validTo instanceof Date &&
            !isNaN(visitor.validTo.getTime())
              ? visitor.validTo
              : visitor.validFrom;

          const visitorObj: any = {
            first_name: visitor.firstName.trim(),
            last_name: visitor.lastName.trim(),
            email: visitor.email.trim(),
            phone: visitor.phone.replace(/[^0-9+]/g, ""),
            identification_type: visitor.idType.toLowerCase(),
            identification_number: visitor.idNumber.trim(),
            valid_from: formatLocalISOString(visitor.validFrom),
            valid_to: formatLocalISOString(validToDate),
            purpose: visitor.purpose.trim(),
            pass_type_id: visitor.passTypeId || "",
            car_passes: visitor.carPasses.map((cp) => ({
              car_make: cp.carMake.trim(),
              car_model: cp.carModel.trim(),
              car_color: cp.carColor.trim(),
              car_number: cp.carNumber.trim(),
              ...(cp.carTag?.trim() && { car_tag: cp.carTag.trim() }),
            })),
          };
          return visitorObj;
        } catch (visitorError) {
          throw new Error(
            `Error building visitor object ${index + 1}: ${visitorError instanceof Error ? visitorError.message : "Unknown error"}`,
          );
        }
      });

      // Create FormData
      let formData: FormData;
      try {
        formData = new FormData();
      } catch (formDataError) {
        throw new Error(
          `Failed to create FormData: ${formDataError instanceof Error ? formDataError.message : "Unknown error"}`,
        );
      }

      // Find the issuer that matches the selected category
      let passIssuerId: string | null = null;
      if (selectedCategoryId) {
        const matchingIssuer = issuers.find((issuer) =>
          issuer.category_weblinks.some(
            (weblink) =>
              weblink.category_id === selectedCategoryId && weblink.is_active,
          ),
        );

        if (matchingIssuer) {
          passIssuerId = matchingIssuer.id;
        } else {
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
      // Use first visitor's purpose as default, or a general purpose
      const purposeValue =
        visitors[0]?.purpose.trim() || "Visitor pass request";
      formData.append("purpose", purposeValue);
      if (sessionId) {
        formData.append("session_id", sessionId);
      }
      // Use first visitor's dates as default
      const validFromValue = formatLocalISOString(visitors[0].validFrom);
      const validToValue = visitors[0].validTo
        ? formatLocalISOString(visitors[0].validTo)
        : formatLocalISOString(visitors[0].validFrom);
      formData.append("valid_from", validFromValue);
      formData.append("valid_to", validToValue);
      // Use department weblink
      const departmentWeblink =
        issuers.find((issuer) => issuer.is_active)?.weblink || "department";
      formData.append("weblink", departmentWeblink);
      formData.append("comments", comments.trim() || "");
      const visitorsJson = JSON.stringify(visitorObjects);
      formData.append("visitors", visitorsJson);

      // Add visitor photos and documents
      // Files must be appended in the same order as visitors array
      // Match the web format exactly: empty photos, proper documents
      try {
        visitors.forEach((visitor, index) => {
          try {
            // Append visitor photo (optional - only if provided)
            if (
              visitor.identificationPhoto &&
              typeof visitor.identificationPhoto === "string" &&
              visitor.identificationPhoto.trim() !== ""
            ) {
              const photoUri = visitor.identificationPhoto;
              const filename =
                photoUri.split("/").pop() || `photo_${index}.jpg`;
              const match = /\.(\w+)$/.exec(filename.toLowerCase());
              const type = match
                ? `image/${match[1] === "jpg" ? "jpeg" : match[1]}`
                : "image/jpeg";

              // React Native FormData requires uri, type, and name properties
              formData.append("visitor_photos", {
                uri: photoUri,
                type: type,
                name: filename,
              } as any);
            }

            // Append visitor document (mandatory field - should always exist after validation)
            if (
              !visitor.identificationDocument ||
              typeof visitor.identificationDocument !== "string" ||
              visitor.identificationDocument.trim() === ""
            ) {
              throw new Error(
                `Identification document is required for visitor ${index + 1}`,
              );
            }

            const docUri = visitor.identificationDocument;
            // Extract filename from URI
            const filename = docUri.split("/").pop() || `document_${index}.jpg`;
            const match = /\.(\w+)$/.exec(filename.toLowerCase());
            const type = match
              ? `image/${match[1] === "jpg" ? "jpeg" : match[1]}`
              : "image/png"; // Default to png for documents

            // React Native FormData file object structure
            // Ensure URI is properly formatted (expo-image-picker returns file:// URIs)
            const fileObject = {
              uri: docUri,
              type: type,
              name: filename,
            };

            try {
              formData.append("visitor_documents", fileObject as any);
            } catch (appendError) {
              throw new Error(
                `Failed to append document for visitor ${index + 1}: ${appendError instanceof Error ? appendError.message : "Unknown error"}`,
              );
            }
          } catch (visitorFileError) {
            throw new Error(
              `Error preparing files for visitor ${index + 1}: ${
                visitorFileError instanceof Error
                  ? visitorFileError.message
                  : "Unknown error"
              }`,
            );
          }
        });
      } catch (fileError) {
        throw new Error(
          `Error preparing files: ${
            fileError instanceof Error ? fileError.message : "Unknown error"
          }`,
        );
      }

      // Submit the form
      let submitResponse;
      try {
        // Add a timeout wrapper to catch network issues
        const submissionPromise = api.submitPassRequestWithFiles(formData);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Request timeout after 60 seconds")),
            60000,
          );
        });

        submitResponse = (await Promise.race([
          submissionPromise,
          timeoutPromise,
        ])) as any;
      } catch (apiError) {
        // Re-throw with more context
        throw new Error(
          `API submission failed: ${apiError instanceof Error ? apiError.message : "Unknown error"}`,
        );
      }

      // Extract request_id from response
      const requestId = submitResponse?.request_id || submitResponse?.id;
      if (!requestId) {
        throw new Error("Request ID not found in response");
      }

      // Get current user ID
      const currentUserId = route.params?.userId;
      if (!currentUserId) {
        throw new Error("Current user ID not found");
      }

      // Update visitor statuses to "approved" and then route request for approval
      const responseVisitors = submitResponse?.visitors || [];

      // Step 1: Update each visitor status to "approved"
      if (responseVisitors.length > 0) {
        try {
          for (let i = 0; i < responseVisitors.length; i++) {
            const visitor = responseVisitors[i];
            const visitorId = visitor.id || visitor.visitor_id;
            if (visitorId) {
              try {
                await api.updateVisitorStatus(
                  visitorId,
                  "approved",
                  currentUserId,
                );
              } catch (updateError) {
                // Continue with next visitor even if this one fails
              }
            }
          }
        } catch (statusError) {
          // Don't throw - continue to route request even if visitor status updates fail
        }
      }

      // Step 2: Route request for approval
      try {
        await api.updatePassRequestStatus(requestId, {
          status: "routed_for_approval",
          comments:
            "Request submitted by Department HOD (pre-approved), forwarded directly to Legislature for final approval",
          routed_by: currentUserId,
          current_user_id: currentUserId,
        });
      } catch (routeError) {
        // Don't throw - request was created successfully, routing is secondary
      }

      // Build status check URL using the API base URL
      const statusUrl = `${API_BASE_URL}/status/${requestId}`;

      // Show success modal
      setSubmittedRequestId(requestId);
      setStatusCheckUrl(statusUrl);
      setSubmittedVisitorCount(visitors.length);
      setShowSuccessModal(true);
      setLoading(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit request. Please try again.";

      Alert.alert("Error", errorMessage);
      setLoading(false);
    }
  };

  // Load pass categories from API and pre-fill from user's sub_categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const fetchedCategories = await api.getMainCategories();
        setCategories(fetchedCategories);

        // Map category names to dropdown
        const categoryNames = fetchedCategories.map((cat) => cat.name);
        setPassCategories(categoryNames);

        // Pre-fill category and subcategory from user's sub_categories
        const userSubCategories = route.params?.sub_categories || [];
        if (userSubCategories.length > 0) {
          // Find the category that contains the first subcategory
          const firstSubCat = userSubCategories[0];
          const parentCategory = fetchedCategories.find((cat) =>
            cat.sub_categories?.some((sc) => sc.id === firstSubCat.id),
          );

          if (parentCategory) {
            setSelectedCategoryId(parentCategory.id);
            setPassCategory(parentCategory.name);
            setSelectedCategorySubCategories(
              parentCategory.sub_categories || [],
            );

            // Set the first subcategory
            if (firstSubCat.id) {
              setSelectedSubCategoryId(firstSubCat.id);
            }

            // Load pass types for this category
            try {
              const [categoryPassTypeIdsData, allPassTypesData] =
                await Promise.all([
                  api.getCategoryPassTypes(parentCategory.id),
                  api.getAllPassTypes(),
                ]);

              setAllPassTypes(allPassTypesData);
              const matchedPassTypes = allPassTypesData
                .filter((passType) =>
                  categoryPassTypeIdsData.includes(passType.id),
                )
                .map((passType) => passType.name);

              setPassTypes(matchedPassTypes);
            } catch (error) {}
          }
        }
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
            <Text style={styles.headerTitle}>Request Visitor Pass</Text>
          </View>
          <TouchableOpacity onPress={() => handleLogout(navigation)} style={styles.headerButton}>
            <LogOutIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Introduction Text */}
          <Text style={styles.introText}>
            Fill out the form below to request a pass for your visit.
          </Text>

          {/* Pass Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pass Category</Text>

            {/* Main Category */}
            <Text style={styles.inputLabel}>Main Category</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.input}>{passCategory || "Department"}</Text>
              {selectedCategoryId && (
                <View style={styles.tagContainer}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Pre-selected</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Department Type (Sub-Category) */}
            {selectedSubCategoryId && (
              <>
                <Text style={styles.inputLabel}>Department Type</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.input}>
                    {selectedCategorySubCategories.find(
                      (sc) => sc.id === selectedSubCategoryId,
                    )?.name || ""}
                  </Text>
                  <View style={styles.tagContainer}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Assigned</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Request Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request Information</Text>

            {/* Request By */}
            <Text style={styles.inputLabel}>
              Request By<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#ADAEBC"
                value={requestedBy}
                onChangeText={setRequestedBy}
                editable={false}
              />
            </View>
            <Text style={styles.helperText}>Auto-filled with your name</Text>

            {/* Designation */}
            <Text style={styles.inputLabel}>Designation</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter designation"
                placeholderTextColor="#ADAEBC"
                value={designation}
                onChangeText={setDesignation}
                editable={false}
              />
            </View>
            <Text style={styles.helperText}>Auto-filled from login</Text>
          </View>

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
              const visitorPassTypeName = visitor.passTypeId
                ? allPassTypes.find((pt) => pt.id === visitor.passTypeId)?.name
                : "";

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
                  {/* Visitor Header */}
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
                          transform: [
                            { rotate: isExpanded ? "180deg" : "0deg" },
                          ],
                        }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Visitor Content */}
                  {isExpanded && (
                    <View style={{ padding: 16 }}>
                      {/* First Name */}
                      <Text style={styles.inputLabel}>
                        First Name<Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.firstNameError && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Start typing name or phone..."
                          placeholderTextColor="#ADAEBC"
                          value={visitor.firstName}
                          onChangeText={(text) => {
                            updateVisitor(visitor.id, {
                              firstName: text,
                              firstNameError: "",
                            });
                          }}
                        />
                      </View>
                      {visitor.firstNameError ? (
                        <Text style={styles.errorText}>
                          {visitor.firstNameError}
                        </Text>
                      ) : null}

                      {/* Last Name */}
                      <Text style={styles.inputLabel}>
                        Last Name<Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.lastNameError && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Start typing name or phone..."
                          placeholderTextColor="#ADAEBC"
                          value={visitor.lastName}
                          onChangeText={(text) => {
                            updateVisitor(visitor.id, {
                              lastName: text,
                              lastNameError: "",
                            });
                          }}
                        />
                      </View>
                      {visitor.lastNameError ? (
                        <Text style={styles.errorText}>
                          {visitor.lastNameError}
                        </Text>
                      ) : null}

                      {/* Email */}
                      <Text style={styles.inputLabel}>Email</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.emailError && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Enter email"
                          placeholderTextColor="#ADAEBC"
                          value={visitor.email}
                          onChangeText={(text) => {
                            updateVisitor(visitor.id, {
                              email: text,
                              emailError: "",
                            });
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      {visitor.emailError ? (
                        <Text style={styles.errorText}>
                          {visitor.emailError}
                        </Text>
                      ) : null}

                      {/* Phone */}
                      <Text style={styles.inputLabel}>
                        Phone<Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.phoneError && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Enter phone number"
                          placeholderTextColor="#ADAEBC"
                          value={visitor.phone}
                          onChangeText={(text) => {
                            let newPhone = text;
                            if (text.startsWith("+91")) {
                              newPhone = text;
                            } else if (text.length === 0) {
                              newPhone = "+91";
                            } else if (!text.startsWith("+")) {
                              newPhone = "+91" + text.replace(/[^0-9]/g, "");
                            }
                            updateVisitor(visitor.id, {
                              phone: newPhone,
                              phoneError: "",
                            });
                          }}
                          keyboardType="phone-pad"
                        />
                      </View>
                      {visitor.phoneError ? (
                        <Text style={styles.errorText}>
                          {visitor.phoneError}
                        </Text>
                      ) : null}

                      {/* ID Type */}
                      <Text style={styles.inputLabel}>
                        Identification Type
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.inputContainer,
                          visitor.idTypeError && styles.inputContainerError,
                        ]}
                        onPress={() => {
                          setSelectedVisitorForModal(visitor.id);
                          setShowIdTypeModal(true);
                        }}
                      >
                        <Text
                          style={[
                            styles.input,
                            !visitor.idType && styles.placeholderText,
                          ]}
                        >
                          {visitor.idType || "Select Type"}
                        </Text>
                        <ChevronDownIcon width={20} height={20} />
                      </TouchableOpacity>
                      {visitor.idTypeError ? (
                        <Text style={styles.errorText}>
                          {visitor.idTypeError}
                        </Text>
                      ) : null}

                      {/* ID Number */}
                      <Text style={styles.inputLabel}>
                        Identification Number
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.idNumberError && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={styles.input}
                          placeholder="Enter ID number"
                          placeholderTextColor="#ADAEBC"
                          value={visitor.idNumber}
                          onChangeText={(text) => {
                            updateVisitor(visitor.id, {
                              idNumber: text,
                              idNumberError: "",
                            });
                          }}
                        />
                      </View>
                      {visitor.idNumberError ? (
                        <Text style={styles.errorText}>
                          {visitor.idNumberError}
                        </Text>
                      ) : null}

                      {/* Current Photo (Optional) */}
                      <Text style={styles.inputLabel}>
                        Current Photo (Optional)
                      </Text>
                      <TouchableOpacity
                        style={styles.fileUploadButton}
                        onPress={() =>
                          handleIdentificationPhotoUpload(visitor.id)
                        }
                      >
                        <Text style={styles.fileUploadText}>
                          {visitor.identificationPhoto
                            ? "File chosen"
                            : "Choose File"}
                        </Text>
                        {!visitor.identificationPhoto && (
                          <Text style={styles.fileUploadSubtext}>
                            No file chosen
                          </Text>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.helperText}>
                        Upload a recent photo of the visitor
                      </Text>

                      {/* Identification Document */}
                      <Text style={styles.inputLabel}>
                        Identification Document
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.fileUploadButton,
                          visitor.identificationDocumentError &&
                            styles.inputContainerError,
                        ]}
                        onPress={() =>
                          handleIdentificationDocumentUpload(visitor.id)
                        }
                      >
                        <Text style={styles.fileUploadText}>
                          {visitor.identificationDocument
                            ? "File chosen"
                            : "Choose File"}
                        </Text>
                        {!visitor.identificationDocument && (
                          <Text style={styles.fileUploadSubtext}>
                            No file chosen
                          </Text>
                        )}
                      </TouchableOpacity>
                      {visitor.identificationDocumentError ? (
                        <Text style={styles.errorText}>
                          {visitor.identificationDocumentError}
                        </Text>
                      ) : null}
                      <Text style={styles.helperText}>
                        Upload a copy of identification document (PDF, DOC,
                        DOCX, JPG, JPEG, PNG)
                      </Text>

                      {/* Pass Type */}
                      <Text style={styles.inputLabel}>
                        Pass Type<Text style={styles.required}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.inputContainer,
                          visitor.passTypeError && styles.inputContainerError,
                          !passCategory && styles.inputContainerDisabled,
                        ]}
                        onPress={() => {
                          if (passCategory) {
                            setSelectedVisitorForModal(visitor.id);
                            setShowPassTypeModal(true);
                          }
                        }}
                        disabled={!passCategory}
                      >
                        <Text
                          style={[
                            styles.input,
                            (!visitorPassTypeName || !passCategory) &&
                              styles.placeholderText,
                          ]}
                        >
                          {!passCategory
                            ? "Select Pass Category first"
                            : visitorPassTypeName || "Select Pass Type"}
                        </Text>
                        <ChevronDownIcon width={20} height={20} />
                      </TouchableOpacity>
                      {visitor.passTypeError ? (
                        <Text style={styles.errorText}>
                          {visitor.passTypeError}
                        </Text>
                      ) : null}

                      {/* Valid From */}
                      <Text style={styles.inputLabel}>
                        Valid From<Text style={styles.required}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.inputContainer,
                          visitor.validFromError && styles.inputContainerError,
                        ]}
                        onPress={() => openValidFromPicker(visitor.id)}
                      >
                        <Text style={styles.input}>
                          {formatDateTime(visitor.validFrom)}
                        </Text>
                        <CalendarIcon width={20} height={20} />
                      </TouchableOpacity>
                      {visitor.validFromError ? (
                        <Text style={styles.errorText}>
                          {visitor.validFromError}
                        </Text>
                      ) : null}

                      {/* Valid To (Optional) */}
                      <Text style={styles.inputLabel}>Valid To (Optional)</Text>
                      <TouchableOpacity
                        style={[
                          styles.inputContainer,
                          visitor.validToError && styles.inputContainerError,
                        ]}
                        onPress={() => openValidToPicker(visitor.id)}
                      >
                        <Text style={styles.input}>
                          {visitor.validTo
                            ? formatDateTime(visitor.validTo)
                            : "Select date and time"}
                        </Text>
                        <CalendarIcon width={20} height={20} />
                      </TouchableOpacity>
                      {visitor.validToError ? (
                        <Text style={styles.errorText}>
                          {visitor.validToError}
                        </Text>
                      ) : null}

                      {/* Purpose of Visit */}
                      <Text style={styles.inputLabel}>
                        Purpose of Visit<Text style={styles.required}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          visitor.purposeError && styles.inputContainerError,
                        ]}
                      >
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          placeholder="Describe the purpose of your visit..."
                          placeholderTextColor="#ADAEBC"
                          value={visitor.purpose}
                          onChangeText={(text) => {
                            updateVisitor(visitor.id, {
                              purpose: text,
                              purposeError: "",
                            });
                          }}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                        />
                      </View>
                      {visitor.purposeError ? (
                        <Text style={styles.errorText}>
                          {visitor.purposeError}
                        </Text>
                      ) : null}

                      {/* Car Passes Section */}
                      <View style={{ marginTop: 20 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <Text style={styles.sectionTitle}>Car Pass</Text>
                          {visitor.carPasses.length === 0 && (
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
                              onPress={() => addCarPass(visitor.id)}
                            >
                              <Ionicons name="add" size={18} color="#FFFFFF" />
                              <Text
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: 14,
                                  fontWeight: "600",
                                }}
                              >
                                Add Car Pass
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.carPassDescription}>
                          Only one car pass is allowed per visitor
                        </Text>

                        {visitor.carPasses.length === 0 ? (
                          <>
                            <Text style={styles.carPassStatus}>
                              No car passes added yet. Click "Add Car Pass" to
                              add one.
                            </Text>
                          </>
                        ) : (
                          visitor.carPasses.map((carPass, carPassIndex) => (
                            <View
                              key={carPassIndex}
                              style={styles.carPassFormContainer}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: 12,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: "#111827",
                                  }}
                                >
                                  Car Pass
                                </Text>
                                <TouchableOpacity
                                  onPress={() =>
                                    removeCarPass(visitor.id, carPassIndex)
                                  }
                                  style={{ padding: 4 }}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color="#EF4444"
                                  />
                                </TouchableOpacity>
                              </View>

                              {/* Car Make */}
                              <Text style={styles.inputLabel}>
                                Car Make<Text style={styles.required}>*</Text>
                              </Text>
                              <View
                                style={[
                                  styles.inputContainer,
                                  carPass.carMakeError &&
                                    styles.inputContainerError,
                                ]}
                              >
                                <TextInput
                                  style={styles.input}
                                  placeholder="e.g., Toyota, Honda, BMW"
                                  placeholderTextColor="#ADAEBC"
                                  value={carPass.carMake}
                                  onChangeText={(text) =>
                                    updateCarPass(visitor.id, carPassIndex, {
                                      carMake: text,
                                      carMakeError: "",
                                    })
                                  }
                                />
                              </View>
                              {carPass.carMakeError && (
                                <Text style={styles.errorText}>
                                  {carPass.carMakeError}
                                </Text>
                              )}

                              {/* Car Model */}
                              <Text style={styles.inputLabel}>
                                Car Model<Text style={styles.required}>*</Text>
                              </Text>
                              <View
                                style={[
                                  styles.inputContainer,
                                  carPass.carModelError &&
                                    styles.inputContainerError,
                                ]}
                              >
                                <TextInput
                                  style={styles.input}
                                  placeholder="e.g., Camry, Civic, X5"
                                  placeholderTextColor="#ADAEBC"
                                  value={carPass.carModel}
                                  onChangeText={(text) =>
                                    updateCarPass(visitor.id, carPassIndex, {
                                      carModel: text,
                                      carModelError: "",
                                    })
                                  }
                                />
                              </View>
                              {carPass.carModelError && (
                                <Text style={styles.errorText}>
                                  {carPass.carModelError}
                                </Text>
                              )}

                              {/* Car Color */}
                              <Text style={styles.inputLabel}>
                                Car Color<Text style={styles.required}>*</Text>
                              </Text>
                              <View
                                style={[
                                  styles.inputContainer,
                                  carPass.carColorError &&
                                    styles.inputContainerError,
                                ]}
                              >
                                <TextInput
                                  style={styles.input}
                                  placeholder="e.g., Red, Blue, White"
                                  placeholderTextColor="#ADAEBC"
                                  value={carPass.carColor}
                                  onChangeText={(text) =>
                                    updateCarPass(visitor.id, carPassIndex, {
                                      carColor: text,
                                      carColorError: "",
                                    })
                                  }
                                />
                              </View>
                              {carPass.carColorError && (
                                <Text style={styles.errorText}>
                                  {carPass.carColorError}
                                </Text>
                              )}

                              {/* Car Number */}
                              <Text style={styles.inputLabel}>
                                Car Number (Registration)
                                <Text style={styles.required}>*</Text>
                              </Text>
                              <View
                                style={[
                                  styles.inputContainer,
                                  carPass.carNumberError &&
                                    styles.inputContainerError,
                                ]}
                              >
                                <TextInput
                                  style={styles.input}
                                  placeholder="e.g., AP39AB1234"
                                  placeholderTextColor="#ADAEBC"
                                  value={carPass.carNumber}
                                  onChangeText={(text) =>
                                    updateCarPass(visitor.id, carPassIndex, {
                                      carNumber: text,
                                      carNumberError: "",
                                    })
                                  }
                                  autoCapitalize="characters"
                                />
                              </View>
                              {carPass.carNumberError && (
                                <Text style={styles.errorText}>
                                  {carPass.carNumberError}
                                </Text>
                              )}

                              {/* Car Tag (Optional) */}
                              <Text style={styles.inputLabel}>
                                Car Tag (Optional)
                              </Text>
                              <View style={styles.inputContainer}>
                                <TextInput
                                  style={styles.input}
                                  placeholder="Optional tag or label for this car pass"
                                  placeholderTextColor="#ADAEBC"
                                  value={carPass.carTag || ""}
                                  onChangeText={(text) =>
                                    updateCarPass(visitor.id, carPassIndex, {
                                      carTag: text,
                                    })
                                  }
                                />
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          {/* Additional Comments Section */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>
              Additional Comments (Optional)
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Any additional information..."
                placeholderTextColor="#ADAEBC"
                value={comments}
                onChangeText={setComments}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.resetButtonText}>Cancel</Text>
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
                <Text style={styles.issueButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ID Type Modal */}
        <Modal
          visible={showIdTypeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowIdTypeModal(false);
            setSelectedVisitorForModal(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select ID Type</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowIdTypeModal(false);
                    setSelectedVisitorForModal(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {IDENTIFICATION_TYPES.map((type) => {
                  const visitor = selectedVisitorForModal
                    ? visitors.find((v) => v.id === selectedVisitorForModal)
                    : null;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={styles.modalItem}
                      onPress={() => {
                        if (selectedVisitorForModal && visitor) {
                          updateVisitor(selectedVisitorForModal, {
                            idType: type,
                            idTypeError: "",
                          });
                        }
                        setShowIdTypeModal(false);
                        setSelectedVisitorForModal(null);
                      }}
                    >
                      <Text style={styles.modalItemText}>{type}</Text>
                      {visitor && visitor.idType === type && (
                        <Ionicons name="checkmark" size={20} color="#457E51" />
                      )}
                    </TouchableOpacity>
                  );
                })}
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
                    const visitor = selectedVisitorForModal
                      ? visitors.find((v) => v.id === selectedVisitorForModal)
                      : null;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={styles.modalItem}
                        onPress={() => {
                          if (selectedVisitorForModal && visitor) {
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

                            // Update visitor with pass type
                            updateVisitor(selectedVisitorForModal, {
                              passTypeId: passTypeItem?.id || null,
                              passTypeError: "",
                            });

                            // Don't change subcategory when pass type is selected
                            // Subcategory should remain as selected from category
                            // This matches web behavior where subcategory is independent of pass type
                          }
                          setShowPassTypeModal(false);
                          setSelectedVisitorForModal(null);
                        }}
                      >
                        <Text style={styles.modalItemText}>{type}</Text>
                        {visitor && visitor.passTypeId === passTypeItem?.id && (
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
              <View
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => false}
              >
                <View style={styles.datePickerModalContent}>
                  <View style={styles.datePickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowValidFromPicker(false);
                        setSelectedVisitorForModal(null);
                      }}
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
                    minDate={(() => {
                      // Set minDate to today at midnight to ensure all future dates are selectable
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return formatDate(today);
                    })()}
                    // Don't set maxDate - allow all future dates
                    // Validation will ensure Valid To is after Valid From
                    enableSwipeMonths={true}
                    hideExtraDays={false}
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
              </View>
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
              <View
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => false}
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
                        minDate={(() => {
                          // Set minDate to Valid From date (or today if no Valid From set)
                          if (selectedVisitorForModal) {
                            const visitor = visitors.find(
                              (v) => v.id === selectedVisitorForModal,
                            );
                            if (visitor?.validFrom) {
                              const validFromDate = new Date(visitor.validFrom);
                              validFromDate.setHours(0, 0, 0, 0);
                              return formatDate(validFromDate);
                            }
                          }
                          // Default to today at midnight
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return formatDate(today);
                        })()}
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
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.replace("MyPassRequests", {
            userFullName: route.params?.userFullName,
            userId: route.params?.userId,
            sub_categories: route.params?.sub_categories,
          });
        }}
      >
        <TouchableOpacity
          style={styles.successModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowSuccessModal(false);
            navigation.replace("MyPassRequests", {
              userFullName: route.params?.userFullName,
              userId: route.params?.userId,
              sub_categories: route.params?.sub_categories,
            });
          }}
        >
          <View
            style={styles.successModalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>
              Request Submitted Successfully!
            </Text>
            <Text style={styles.successMessage}>
              {submittedVisitorCount === 1
                ? "Your pass request has been submitted. You will receive a confirmation email shortly."
                : `Your pass request with ${submittedVisitorCount} visitor${submittedVisitorCount > 1 ? "s" : ""} has been submitted. You will receive a confirmation email shortly.`}
            </Text>

            {/* Request Reference Number */}
            <View style={styles.referenceContainer}>
              <Text style={styles.referenceLabel}>
                Request Reference Number
              </Text>
              <Text style={styles.referenceNumber}>{submittedRequestId}</Text>
            </View>

            {/* Status Check URL */}
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Check Request Status</Text>
              <View style={styles.statusUrlContainer}>
                <Text style={styles.statusUrl} numberOfLines={1}>
                  {statusCheckUrl}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    Alert.alert("Status URL", statusCheckUrl, [{ text: "OK" }]);
                  }}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.checkStatusButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  // Navigate back to MyPassRequestsScreen which will refresh
                  navigation.replace("MyPassRequests", {
                    userFullName: route.params?.userFullName,
                    userId: route.params?.userId,
                    sub_categories: route.params?.sub_categories,
                  });
                }}
              >
                <Text style={styles.checkStatusButtonText}>
                  Check Status Now
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.saveNote}>
              Please save your request reference number and status check link
              for future reference.
            </Text>
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
  introText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
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
  tagContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#3B82F6",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
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
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 500,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  referenceContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  referenceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  referenceNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  statusContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  statusUrlContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusUrl: {
    flex: 1,
    fontSize: 12,
    color: "#111827",
  },
  copyButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  checkStatusButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  checkStatusButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  saveNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
});
