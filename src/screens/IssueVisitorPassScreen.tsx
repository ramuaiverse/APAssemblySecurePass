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
} from "@/services/api";
import LogOutIcon from "../../assets/logOut.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import CalendarIcon from "../../assets/calendar.svg";
import { SafeAreaView } from "react-native-safe-area-context";

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
  // Visitor Information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [identificationPhoto, setIdentificationPhoto] = useState<string | null>(
    null,
  );
  const [identificationDocument, setIdentificationDocument] = useState<
    string | null
  >(null);

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

  // Car Pass
  const [carPass, setCarPass] = useState<boolean>(false);
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [carTag, setCarTag] = useState("");

  // Car Pass Error states
  const [carMakeError, setCarMakeError] = useState("");
  const [carModelError, setCarModelError] = useState("");
  const [carColorError, setCarColorError] = useState("");
  const [carNumberError, setCarNumberError] = useState("");

  // UI States
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showPassCategoryModal, setShowPassCategoryModal] = useState(false);
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showValidFromPicker, setShowValidFromPicker] = useState(false);
  const [showValidToPicker, setShowValidToPicker] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("+91");
    setIdType("Aadhaar");
    setIdNumber("");
    setIdentificationPhoto(null);
    setIdentificationDocument(null);
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
    setCarPass(false);
    setCarMake("");
    setCarModel("");
    setCarColor("");
    setCarNumber("");
    setCarTag("");
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
    setCarMakeError("");
    setCarModelError("");
    setCarColorError("");
    setCarNumberError("");
  };

  useFocusEffect(
    React.useCallback(() => {
      resetForm();
    }, []),
  );

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
        setIdentificationPhoto(result.assets[0].uri);
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
        setIdentificationDocument(result.assets[0].uri);
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
      setSelectedCategorySubCategories(selectedCategory.sub_categories || []);
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

  // Handle issue pass
  const handleIssuePass = async () => {
    // Clear previous errors
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
    setCarMakeError("");
    setCarModelError("");
    setCarColorError("");
    setCarNumberError("");

    // Validate required fields
    let hasError = false;

    if (!firstName.trim()) {
      setFirstNameError("First name is required");
      hasError = true;
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email");
      hasError = true;
    }

    if (!phone.trim() || phone === "+91") {
      setPhoneError("Phone number is required");
      hasError = true;
    } else if (phone.replace(/[^0-9]/g, "").length < 10) {
      setPhoneError("Please enter a valid phone number");
      hasError = true;
    }

    if (!idType) {
      setIdTypeError("ID type is required");
      hasError = true;
    }

    if (!idNumber.trim()) {
      setIdNumberError("ID number is required");
      hasError = true;
    }

    if (!passCategory.trim()) {
      setPassCategoryError("Pass category is required");
      hasError = true;
    }

    if (!passType.trim()) {
      setPassTypeError("Pass type is required");
      hasError = true;
    }

    if (!purpose.trim()) {
      setPurposeError("Purpose is required");
      hasError = true;
    }

    // Validate valid from date/time - removed validation to allow showing 8am to 5pm even if current time is between 8am to 5pm
    //   setValidFromError("Valid from date/time must be in the future");
    //   hasError = true;
    // }

    // Validate car passes if car pass is enabled
    if (carPass) {
      if (!carMake.trim()) {
        setCarMakeError("Car make is required");
        hasError = true;
      }
      if (!carModel.trim()) {
        setCarModelError("Car model is required");
        hasError = true;
      }
      if (!carColor.trim()) {
        setCarColorError("Car color is required");
        hasError = true;
      }
      if (!carNumber.trim()) {
        setCarNumberError("Car number is required");
        hasError = true;
      }
    }

    if (hasError) {
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

      // Build visitor object
      const visitor: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.replace(/[^0-9+]/g, ""),
        identification_type: idType.toLowerCase(),
        identification_number: idNumber.trim(),
      };

      // Add car passes if car pass is enabled
      if (carPass) {
        visitor.car_passes = [
          {
            car_make: carMake.trim(),
            car_model: carModel.trim(),
            car_color: carColor.trim(),
            car_number: carNumber.trim(),
            ...(carTag.trim() && { car_tag: carTag.trim() }),
          },
        ];
      } else {
        visitor.car_passes = [];
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
      formData.append("visitors", JSON.stringify([visitor]));

      // Add visitor photo if available
      if (identificationPhoto) {
        const photoUri = identificationPhoto;
        const filename = photoUri.split("/").pop() || "photo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("visitor_photos", {
          uri: photoUri,
          type: type,
          name: filename,
        } as any);
      }

      // Add visitor document if available
      if (identificationDocument) {
        const docUri = identificationDocument;
        const filename = docUri.split("/").pop() || "document.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("visitor_documents", {
          uri: docUri,
          type: type,
          name: filename,
        } as any);
      }

      // Submit the form
      const submitResponse = await api.submitPassRequestWithFiles(formData);

      // Extract request_id from response
      const requestId = submitResponse?.request_id || submitResponse?.id;
      if (!requestId) {
        throw new Error("Request ID not found in response");
      }

      // Extract visitor_id from response (first visitor)
      const visitorId =
        submitResponse?.visitors?.[0]?.id ||
        submitResponse?.visitor_id ||
        submitResponse?.visitors?.[0]?.visitor_id;

      if (!visitorId) {
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

      // Step 2: Generate pass
      await api.generatePass(requestId, {
        visitor_id: visitorId,
        pass_category_id: selectedCategoryId,
        pass_sub_category_id: selectedSubCategoryId || undefined,
        pass_type_id: selectedPassTypeId || undefined,
        current_user_id: currentUserId,
      });

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
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <LogOutIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Visitor Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visitor Information</Text>

            {/* First Name */}
            <Text style={styles.inputLabel}>
              First Name<Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                firstNameError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor="#ADAEBC"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (firstNameError) setFirstNameError("");
                }}
              />
            </View>
            {firstNameError ? (
              <Text style={styles.errorText}>{firstNameError}</Text>
            ) : null}

            {/* Last Name */}
            <Text style={styles.inputLabel}>
              Last Name<Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                lastNameError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor="#ADAEBC"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (lastNameError) setLastNameError("");
                }}
              />
            </View>
            {lastNameError ? (
              <Text style={styles.errorText}>{lastNameError}</Text>
            ) : null}

            {/* Email */}
            <Text style={styles.inputLabel}>
              Email<Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                emailError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                placeholderTextColor="#ADAEBC"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {/* Phone */}
            <Text style={styles.inputLabel}>
              Phone<Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                phoneError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#ADAEBC"
                value={phone}
                onChangeText={(text) => {
                  // Keep +91 prefix
                  if (text.startsWith("+91")) {
                    setPhone(text);
                  } else if (text.length === 0) {
                    setPhone("+91");
                  } else if (!text.startsWith("+")) {
                    setPhone("+91" + text.replace(/[^0-9]/g, ""));
                  }
                  if (phoneError) setPhoneError("");
                }}
                keyboardType="phone-pad"
              />
            </View>
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}

            {/* ID Type */}
            <Text style={styles.inputLabel}>
              ID Type<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.inputContainer,
                idTypeError && styles.inputContainerError,
              ]}
              onPress={() => setShowIdTypeModal(true)}
            >
              <Text style={[styles.input, !idType && styles.placeholderText]}>
                {idType || "Select ID Type"}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>
            {idTypeError ? (
              <Text style={styles.errorText}>{idTypeError}</Text>
            ) : null}

            {/* ID Number */}
            <Text style={styles.inputLabel}>
              ID Number<Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                idNumberError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter ID number"
                placeholderTextColor="#ADAEBC"
                value={idNumber}
                onChangeText={(text) => {
                  setIdNumber(text);
                  if (idNumberError) setIdNumberError("");
                }}
              />
            </View>
            {idNumberError ? (
              <Text style={styles.errorText}>{idNumberError}</Text>
            ) : null}

            {/* Identification Photo */}
            <Text style={styles.inputLabel}>Identification Photo</Text>
            <TouchableOpacity
              style={styles.fileUploadButton}
              onPress={handleIdentificationPhotoUpload}
            >
              <Text style={styles.fileUploadText}>
                {identificationPhoto ? "File chosen" : "Choose File"}
              </Text>
              {!identificationPhoto && (
                <Text style={styles.fileUploadSubtext}>No file chosen</Text>
              )}
            </TouchableOpacity>

            {/* Identification Document */}
            <Text style={styles.inputLabel}>Identification Document</Text>
            <TouchableOpacity
              style={styles.fileUploadButton}
              onPress={handleIdentificationDocumentUpload}
            >
              <Text style={styles.fileUploadText}>
                {identificationDocument ? "File chosen" : "Choose File"}
              </Text>
              {!identificationDocument && (
                <Text style={styles.fileUploadSubtext}>No file chosen</Text>
              )}
            </TouchableOpacity>
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
              style={[
                styles.inputContainer,
                passCategoryError && styles.inputContainerError,
              ]}
              onPress={() => setShowPassCategoryModal(true)}
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
              style={[
                styles.inputContainer,
                passTypeError && styles.inputContainerError,
                !passCategory && styles.inputContainerDisabled,
              ]}
              onPress={() => {
                if (passCategory) {
                  setShowPassTypeModal(true);
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
              style={styles.inputContainer}
              onPress={() => setShowSessionModal(true)}
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
              style={[
                styles.inputContainer,
                validFromError && styles.inputContainerError,
              ]}
              onPress={openValidFromPicker}
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
              style={styles.inputContainer}
              onPress={openValidToPicker}
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

          {/* Car Pass Section */}
          <View style={styles.section}>
            <View style={styles.carPassHeader}>
              <Text style={styles.sectionTitle}>Car Pass</Text>
              {carPass && (
                <TouchableOpacity
                  onPress={() => {
                    setCarPass(false);
                    setCarMake("");
                    setCarModel("");
                    setCarColor("");
                    setCarNumber("");
                    setCarTag("");
                    setCarMakeError("");
                    setCarModelError("");
                    setCarColorError("");
                    setCarNumberError("");
                  }}
                  style={styles.removeCarPassButton}
                >
                  <Text style={styles.removeCarPassText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.carPassDescription}>
              Add a car pass for the visitor (optional, maximum 1)
            </Text>
            {!carPass ? (
              <>
                <Text style={styles.carPassStatus}>
                  No car pass added yet. Click "Add Car Pass" to add one.
                </Text>
                <TouchableOpacity
                  style={styles.addCarPassButton}
                  onPress={() => setCarPass(true)}
                >
                  <Text style={styles.addCarPassButtonText}>
                    + Add Car Pass
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.carPassFormContainer}>
                {/* Car Make */}
                <Text style={styles.inputLabel}>
                  Car Make<Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    carMakeError && styles.inputContainerError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Toyota, Honda, BMW"
                    placeholderTextColor="#ADAEBC"
                    value={carMake}
                    onChangeText={(text) => {
                      setCarMake(text);
                      if (carMakeError) setCarMakeError("");
                    }}
                  />
                </View>
                {carMakeError ? (
                  <Text style={styles.errorText}>{carMakeError}</Text>
                ) : null}

                {/* Car Model */}
                <Text style={styles.inputLabel}>
                  Car Model<Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    carModelError && styles.inputContainerError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Camry, Civic, X5"
                    placeholderTextColor="#ADAEBC"
                    value={carModel}
                    onChangeText={(text) => {
                      setCarModel(text);
                      if (carModelError) setCarModelError("");
                    }}
                  />
                </View>
                {carModelError ? (
                  <Text style={styles.errorText}>{carModelError}</Text>
                ) : null}

                {/* Car Color */}
                <Text style={styles.inputLabel}>
                  Car Color<Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    carColorError && styles.inputContainerError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Red, Blue, White"
                    placeholderTextColor="#ADAEBC"
                    value={carColor}
                    onChangeText={(text) => {
                      setCarColor(text);
                      if (carColorError) setCarColorError("");
                    }}
                  />
                </View>
                {carColorError ? (
                  <Text style={styles.errorText}>{carColorError}</Text>
                ) : null}

                {/* Car Number */}
                <Text style={styles.inputLabel}>
                  Car Number (Registration)
                  <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    carNumberError && styles.inputContainerError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., AP39AB1234"
                    placeholderTextColor="#ADAEBC"
                    value={carNumber}
                    onChangeText={(text) => {
                      setCarNumber(text);
                      if (carNumberError) setCarNumberError("");
                    }}
                    autoCapitalize="characters"
                  />
                </View>
                {carNumberError ? (
                  <Text style={styles.errorText}>{carNumberError}</Text>
                ) : null}

                {/* Car Tag (Optional) */}
                <Text style={styles.inputLabel}>Car Tag (Optional)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Optional tag or label for this car pass"
                    placeholderTextColor="#ADAEBC"
                    value={carTag}
                    onChangeText={setCarTag}
                  />
                </View>
              </View>
            )}
          </View>

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
                      setIdType(type);
                      setIdTypeError("");
                      setShowIdTypeModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{type}</Text>
                    {idType === type && (
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
