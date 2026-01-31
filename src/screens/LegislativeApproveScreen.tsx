import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  api,
  MainCategory,
  PassTypeItem,
  Session,
  SubCategory,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import BackButtonIcon from "../../assets/backButton.svg";
import CloseIcon from "../../assets/close.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import CalendarIcon from "../../assets/calendar.svg";
import Assembly from "../../assets/assembly.svg";
import BackGround from "../../assets/backGround.svg";

type LegislativeApproveScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LegislativeApprove"
>;

type LegislativeApproveScreenRouteProp = RouteProp<
  RootStackParamList,
  "LegislativeApprove"
>;

type Props = {
  navigation: LegislativeApproveScreenNavigationProp;
  route: LegislativeApproveScreenRouteProp;
};

export default function LegislativeApproveScreen({ navigation, route }: Props) {
  const { visitor, request, userId } = route.params;
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  // Pass Configuration State
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    request?.main_category_id || null,
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | null
  >(request?.sub_category_id || null);
  const [selectedPassTypeId, setSelectedPassTypeId] = useState<string | null>(
    visitor?.pass_type_id || request?.pass_type_id || null,
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [selectedSessionName, setSelectedSessionName] = useState<string>("");
  const [passTypes, setPassTypes] = useState<PassTypeItem[]>([]);

  // Date/Time State
  const [validFrom, setValidFrom] = useState<Date>(() => {
    if (request?.valid_from) {
      return new Date(request.valid_from);
    }
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  });
  const [validTo, setValidTo] = useState<Date | null>(() => {
    if (request?.valid_to) {
      return new Date(request.valid_to);
    }
    const date = new Date();
    date.setHours(17, 0, 0, 0);
    return date;
  });

  // Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showValidFromPicker, setShowValidFromPicker] = useState(false);
  const [showValidToPicker, setShowValidToPicker] = useState(false);

  // Temp date/time states for pickers
  const [tempValidFromDate, setTempValidFromDate] = useState<Date>(validFrom);
  const [tempValidFromHour, setTempValidFromHour] = useState(8);
  const [tempValidFromMinute, setTempValidFromMinute] = useState(0);
  const [tempValidFromAmPm, setTempValidFromAmPm] = useState<"AM" | "PM">("AM");
  const [tempValidToDate, setTempValidToDate] = useState<Date | null>(validTo);
  const [tempValidToHour, setTempValidToHour] = useState(17);
  const [tempValidToMinute, setTempValidToMinute] = useState(0);
  const [tempValidToAmPm, setTempValidToAmPm] = useState<"AM" | "PM">("PM");

  useEffect(() => {
    fetchCategories();
    fetchPassTypes();
    fetchSessions();
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await api.getMainCategories();
      setCategories(cats);
    } catch (error) {
      // Failed to fetch categories
    }
  };

  const fetchPassTypes = async () => {
    try {
      const types = await api.getAllPassTypes();
      setPassTypes(types);
    } catch (error) {
      // Failed to fetch pass types
    }
  };

  const fetchSessions = async () => {
    try {
      const sess = await api.getSessions();
      setSessions(sess);
    } catch (error) {
      // Failed to fetch sessions
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "—";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "—";
  };

  const getSubCategoryName = (subCategoryId: string | null) => {
    if (!subCategoryId) return "—";
    for (const category of categories) {
      const subCat = category.sub_categories?.find(
        (sc) => sc.id === subCategoryId,
      );
      if (subCat) return subCat.name;
    }
    return "—";
  };

  const getPassTypeName = (passTypeId: string | null) => {
    if (!passTypeId) return "—";
    const passType = passTypes.find((pt) => pt.id === passTypeId);
    return passType?.name || "—";
  };

  const getSessionName = (sessionId: string | null) => {
    if (!sessionId) return "—";
    const session = sessions.find((s) => s.id === sessionId);
    return session?.name || "—";
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeForDisplay = (
    hour: number,
    minute: number,
    amPm: "AM" | "PM",
  ) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = String(minute).padStart(2, "0");
    return `${displayHour}:${displayMinute} ${amPm}`;
  };

  const formatDateForCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleValidFromDateSelect = (day: any) => {
    const newDate = new Date(day.dateString);
    setTempValidFromDate(newDate);
  };

  const handleValidFromTimeConfirm = () => {
    let hour24 = tempValidFromHour;
    if (tempValidFromAmPm === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (tempValidFromAmPm === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const newDate = new Date(tempValidFromDate);
    newDate.setHours(hour24, tempValidFromMinute, 0, 0);
    setValidFrom(newDate);
    setShowValidFromPicker(false);
  };

  const handleValidToDateSelect = (day: any) => {
    const newDate = new Date(day.dateString);
    setTempValidToDate(newDate);
  };

  const handleValidToTimeConfirm = () => {
    if (!tempValidToDate) return;

    let hour24 = tempValidToHour;
    if (tempValidToAmPm === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (tempValidToAmPm === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const newDate = new Date(tempValidToDate);
    newDate.setHours(hour24, tempValidToMinute, 0, 0);
    setValidTo(newDate);
    setShowValidToPicker(false);
  };

  const handleApprove = async () => {
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

    if (!userId || !visitor?.id || !request?.id) {
      Alert.alert("Error", "Missing required information.");
      return;
    }

    setLoading(true);
    try {
      const requestId = request.id;

      // Format dates for API
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
      const validUntilISO = validTo ? formatLocalISOString(validTo) : null;

      // Get pass type color
      const passType = passTypes.find((pt) => pt.id === selectedPassTypeId);
      const passTypeColor = passType?.color || "#3B82F6";

      // Call generate-pass API
      await api.generatePass(requestId, {
        visitor_id: visitor.id,
        pass_category_id: selectedCategoryId,
        pass_sub_category_id: selectedSubCategoryId || undefined,
        pass_type_id: selectedPassTypeId,
        current_user_id: userId,
        valid_from: validFromISO,
        valid_to: validUntilISO || undefined,
        pass_type_color: passTypeColor,
      });

      // Get pass request details for PreviewPass
      const passRequestData = await api.getPassRequest(requestId);

      // Get category and pass type names
      const categoryName = getCategoryName(selectedCategoryId);
      const passTypeName = getPassTypeName(selectedPassTypeId);

      // Navigate to PreviewPassScreen
      navigation.replace("PreviewPass", {
        passData: passRequestData,
        categoryName: categoryName,
        passTypeName: passTypeName,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to approve and generate pass. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const availableSubCategories = selectedCategory?.sub_categories || [];

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
          <Text style={styles.headerTitle}>Approve Visitor Request</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <CloseIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Review and approve the visitor request.
        </Text>

        {/* Visitor Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Visitor Details</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>FULL NAME</Text>
              <Text style={styles.detailValue}>
                {visitor?.first_name || ""} {visitor?.last_name || ""}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>EMAIL</Text>
              <Text style={styles.detailValue}>{visitor?.email || "—"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PHONE</Text>
              <Text style={styles.detailValue}>{visitor?.phone || "—"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IDENTIFICATION</Text>
              <View style={styles.identificationContainer}>
                <View style={styles.idTypeTag}>
                  <Text style={styles.idTypeText}>
                    {visitor?.identification_type || "—"}
                  </Text>
                </View>
                <Text style={styles.idNumberText}>
                  {visitor?.identification_number || ""}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CATEGORY</Text>
              <Text style={styles.detailValue}>
                {getCategoryName(selectedCategoryId)}
                {getSubCategoryName(selectedSubCategoryId) !== "—" &&
                  ` • ${getSubCategoryName(selectedSubCategoryId)}`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PURPOSE</Text>
              <Text style={styles.detailValue}>{request?.purpose || "—"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>REQUESTED BY</Text>
              <Text style={styles.detailValue}>
                {request?.requested_by || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Pass Configuration Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#457E51" />
            <Text style={styles.sectionTitle}>Pass Configuration</Text>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  !selectedCategoryId && styles.placeholderText,
                ]}
              >
                {getCategoryName(selectedCategoryId)}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Sub-Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sub-Category</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowSubCategoryModal(true)}
              disabled={!selectedCategoryId}
            >
              <Text
                style={[
                  styles.inputText,
                  (!selectedSubCategoryId || !selectedCategoryId) &&
                    styles.placeholderText,
                ]}
              >
                {selectedCategoryId
                  ? getSubCategoryName(selectedSubCategoryId)
                  : "Select category first"}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Valid From */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Valid From<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => {
                setTempValidFromDate(validFrom);
                const hour = validFrom.getHours();
                const minute = validFrom.getMinutes();
                setTempValidFromHour(
                  hour > 12 ? hour - 12 : hour === 0 ? 12 : hour,
                );
                setTempValidFromMinute(minute);
                setTempValidFromAmPm(hour >= 12 ? "PM" : "AM");
                setShowValidFromPicker(true);
              }}
            >
              <Text style={styles.inputText}>
                {formatDateForDisplay(validFrom)}{" "}
                {formatTimeForDisplay(
                  validFrom.getHours() > 12
                    ? validFrom.getHours() - 12
                    : validFrom.getHours() === 0
                      ? 12
                      : validFrom.getHours(),
                  validFrom.getMinutes(),
                  validFrom.getHours() >= 12 ? "PM" : "AM",
                )}
              </Text>
              <CalendarIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Valid To */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valid To (Optional)</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => {
                if (validTo) {
                  setTempValidToDate(validTo);
                  const hour = validTo.getHours();
                  const minute = validTo.getMinutes();
                  setTempValidToHour(
                    hour > 12 ? hour - 12 : hour === 0 ? 12 : hour,
                  );
                  setTempValidToMinute(minute);
                  setTempValidToAmPm(hour >= 12 ? "PM" : "AM");
                }
                setShowValidToPicker(true);
              }}
            >
              <Text
                style={[styles.inputText, !validTo && styles.placeholderText]}
              >
                {validTo
                  ? `${formatDateForDisplay(validTo)} ${formatTimeForDisplay(
                      validTo.getHours() > 12
                        ? validTo.getHours() - 12
                        : validTo.getHours() === 0
                          ? 12
                          : validTo.getHours(),
                      validTo.getMinutes(),
                      validTo.getHours() >= 12 ? "PM" : "AM",
                    )}`
                  : "Select date and time"}
              </Text>
              <CalendarIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Pass Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Pass Type<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowPassTypeModal(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  !selectedPassTypeId && styles.placeholderText,
                ]}
              >
                {getPassTypeName(selectedPassTypeId)}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Session */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Session<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowSessionModal(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  !selectedSessionName && styles.placeholderText,
                ]}
              >
                {selectedSessionName || "Select session"}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={styles.commentsLabel}>Comments</Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Add any comments (optional)..."
            placeholderTextColor="#9CA3AF"
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.approveButton,
              loading && styles.approveButtonDisabled,
            ]}
            onPress={handleApprove}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.approveButtonText}>
                Approve & Generate Pass
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <CloseIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategoryId(category.id);
                    setSelectedSubCategoryId(null);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{category.name}</Text>
                  {selectedCategoryId === category.id && (
                    <Ionicons name="checkmark" size={20} color="#457E51" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sub-Category Modal */}
      <Modal
        visible={showSubCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sub-Category</Text>
              <TouchableOpacity onPress={() => setShowSubCategoryModal(false)}>
                <CloseIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {availableSubCategories.map((subCat) => (
                <TouchableOpacity
                  key={subCat.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedSubCategoryId(subCat.id);
                    setShowSubCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{subCat.name}</Text>
                  {selectedSubCategoryId === subCat.id && (
                    <Ionicons name="checkmark" size={20} color="#457E51" />
                  )}
                </TouchableOpacity>
              ))}
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
                <CloseIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {passTypes.map((passType) => (
                <TouchableOpacity
                  key={passType.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedPassTypeId(passType.id);
                    setShowPassTypeModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{passType.name}</Text>
                  {selectedPassTypeId === passType.id && (
                    <Ionicons name="checkmark" size={20} color="#457E51" />
                  )}
                </TouchableOpacity>
              ))}
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
                <CloseIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedSessionId(session.id);
                    setSelectedSessionName(session.name);
                    setShowSessionModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{session.name}</Text>
                  {selectedSessionId === session.id && (
                    <Ionicons name="checkmark" size={20} color="#457E51" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Valid From Date/Time Picker */}
      {showValidFromPicker && (
        <Modal
          visible={showValidFromPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowValidFromPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowValidFromPicker(false)}
                  style={styles.datePickerCancelButton}
                >
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerModalTitle}>
                  Select Date & Time
                </Text>
                <TouchableOpacity
                  onPress={handleValidFromTimeConfirm}
                  style={styles.datePickerDoneButton}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <Calendar
                current={formatDateForCalendar(tempValidFromDate)}
                onDayPress={handleValidFromDateSelect}
                markedDates={{
                  [formatDateForCalendar(tempValidFromDate)]: {
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
              {/* Time Picker */}
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerRow}>
                  <View style={styles.timePickerColumn}>
                    <ScrollView style={styles.timePickerScroll}>
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
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </ScrollView>
                  </View>
                  <View style={styles.timePickerColumn}>
                    <ScrollView style={styles.timePickerScroll}>
                      {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
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
                            {String(minute).padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.timePickerColumn}>
                    <ScrollView style={styles.timePickerScroll}>
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
        </Modal>
      )}

      {/* Valid To Date/Time Picker */}
      {showValidToPicker && (
        <Modal
          visible={showValidToPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowValidToPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowValidToPicker(false)}
                  style={styles.datePickerCancelButton}
                >
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerModalTitle}>
                  Select Date & Time
                </Text>
                <TouchableOpacity
                  onPress={handleValidToTimeConfirm}
                  style={styles.datePickerDoneButton}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <Calendar
                current={
                  tempValidToDate
                    ? formatDateForCalendar(tempValidToDate)
                    : formatDateForCalendar(new Date())
                }
                onDayPress={handleValidToDateSelect}
                markedDates={{
                  [tempValidToDate
                    ? formatDateForCalendar(tempValidToDate)
                    : formatDateForCalendar(new Date())]: {
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
              {/* Time Picker */}
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerRow}>
                  <View style={styles.timePickerColumn}>
                    <ScrollView style={styles.timePickerScroll}>
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
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </ScrollView>
                  </View>
                  <View style={styles.timePickerColumn}>
                    <ScrollView style={styles.timePickerScroll}>
                      {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
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
                            {String(minute).padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.timePickerColumn}>
                    <ScrollView style={styles.timePickerScroll}>
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
            </View>
          </View>
        </Modal>
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "transparent",
    zIndex: 1,
  },
  backButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    minWidth: 36,
    minHeight: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  detailsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  identificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  idTypeTag: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#F97316",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idTypeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#F97316",
  },
  idNumberText: {
    fontSize: 14,
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  inputText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
    backgroundColor: "#FFFFFF",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  approveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#457E51",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
  },
  approveButtonDisabled: {
    opacity: 0.6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
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
    fontWeight: "600",
    color: "#111827",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemText: {
    fontSize: 16,
    color: "#111827",
  },
  datePickerModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  datePickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerCancelButton: {
    padding: 8,
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
    padding: 8,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#457E51",
  },
  timePickerContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 10,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerRow: {
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
});
