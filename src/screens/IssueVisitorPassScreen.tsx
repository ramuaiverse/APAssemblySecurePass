import React, { useState } from "react";
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
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types";
import { api } from "@/services/api";
import { Alert, ActivityIndicator } from "react-native";
import VisitorPassIcon from "../../assets/visitorPass.svg";
import LogOutIcon from "../../assets/logOut.svg";
import BackButtonIcon from "../../assets/backButton.svg";
import ChevronDownIcon from "../../assets/chevronDown.svg";
import CalendarIcon from "../../assets/calendar.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import AssemblyIcon from "../../assets/assembly.svg";

type IssueVisitorPassScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "IssueVisitorPass"
>;

type Props = {
  navigation: IssueVisitorPassScreenNavigationProp;
};

const IDENTIFICATION_TYPES = [
  "Aadhaar",
  "PAN",
  "Driving License",
  "Passport",
  "Voter ID",
];
const PASS_TYPES = ["Daily", "Weekly", "Monthly", "Yearly"];

export default function IssueVisitorPassScreen({ navigation }: Props) {
  const [visitorName, setVisitorName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [identificationType, setIdentificationType] = useState("Aadhar");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  // Initialize date to tomorrow to ensure it's always in the future
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Set to 9:00 AM
    return tomorrow;
  };
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [startTime, setStartTime] = useState(() => {
    const time = new Date();
    time.setHours(9, 0, 0, 0); // Default to 9:00 AM
    return time;
  });
  const [endTime, setEndTime] = useState(() => {
    const time = new Date();
    time.setHours(17, 0, 0, 0); // Default to 5:00 PM
    return time;
  });
  const [numberOfVisitors, setNumberOfVisitors] = useState("1");
  const [passType, setPassType] = useState("Daily");
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error states
  const [visitorNameError, setVisitorNameError] = useState("");
  const [mobileNumberError, setMobileNumberError] = useState("");
  const [identificationNumberError, setIdentificationNumberError] =
    useState("");
  const [purposeError, setPurposeError] = useState("");
  const [dateError, setDateError] = useState("");
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  const [numberOfVisitorsError, setNumberOfVisitorsError] = useState("");

  // Custom time picker states
  const [tempStartHour, setTempStartHour] = useState(12);
  const [tempStartMinute, setTempStartMinute] = useState(0);
  const [tempStartAmPm, setTempStartAmPm] = useState<"AM" | "PM">("AM");
  const [tempEndHour, setTempEndHour] = useState(12);
  const [tempEndMinute, setTempEndMinute] = useState(0);
  const [tempEndAmPm, setTempEndAmPm] = useState<"AM" | "PM">("AM");

  // Reset all form fields when screen is focused
  const resetForm = () => {
    setVisitorName("");
    setMobileNumber("");
    setIdentificationType("Aadhar");
    setIdentificationNumber("");
    setPurpose("");
    // Reset date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow);
    // Reset times to default
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    setStartTime(start);
    const end = new Date();
    end.setHours(12, 0, 0, 0);
    setEndTime(end);
    setNumberOfVisitors("1");
    setPassType("Daily");
    // Clear all errors
    setVisitorNameError("");
    setMobileNumberError("");
    setIdentificationNumberError("");
    setPurposeError("");
    setDateError("");
    setStartTimeError("");
    setEndTimeError("");
    setNumberOfVisitorsError("");
    // Close all modals
    setShowIdTypeModal(false);
    setShowPassTypeModal(false);
    setShowDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    setLoading(false);
  };

  // Reset form when screen comes into focus (e.g., when navigating back from PreviewPassScreen)
  useFocusEffect(
    React.useCallback(() => {
      resetForm();
    }, [])
  );

  const handleBack = () => {
    navigation.replace("Login");
  };

  const handleLogout = () => {
    navigation.replace("Login");
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours || 12;
    const minutesStr = String(minutes).padStart(2, "0");
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const onDateSelect = (day: any) => {
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);

    // Allow today and future dates
    if (selectedDateOnly < today) {
      setDateError("Please select today's date or a future date");
      return;
    }

    setDate(selectedDate);
    setDateError(""); // Clear error on valid selection

    // If date is today, validate that start time is in the future
    if (selectedDateOnly.getTime() === today.getTime()) {
      const now = new Date();
      const validFromDate = new Date(selectedDate);
      validFromDate.setHours(
        startTime.getHours(),
        startTime.getMinutes(),
        0,
        0
      );
      if (validFromDate <= now) {
        setStartTimeError("Start time must be in the future for today's date");
      }
    } else {
      setStartTimeError(""); // Clear error if date is in the future
    }

    // Auto-close the calendar after selection
    setShowDatePicker(false);
  };

  const handleDatePickerDone = () => {
    setShowDatePicker(false);
  };

  const getMarkedDates = () => {
    const dateString = formatDate(date);
    return {
      [dateString]: {
        selected: true,
        selectedColor: "#457E51",
        selectedTextColor: "#FFFFFF",
      },
    };
  };

  // Initialize temp time values when opening picker
  const openStartTimePicker = () => {
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    setTempStartHour(hours % 12 || 12);
    setTempStartMinute(minutes);
    setTempStartAmPm(hours >= 12 ? "PM" : "AM");
    setShowStartTimePicker(true);
  };

  const openEndTimePicker = () => {
    const hours = endTime.getHours();
    const minutes = endTime.getMinutes();
    setTempEndHour(hours % 12 || 12);
    setTempEndMinute(minutes);
    setTempEndAmPm(hours >= 12 ? "PM" : "AM");
    setShowEndTimePicker(true);
  };

  const handleStartTimeDone = () => {
    const hours24 =
      tempStartAmPm === "PM" && tempStartHour !== 12
        ? tempStartHour + 12
        : tempStartAmPm === "AM" && tempStartHour === 12
        ? 0
        : tempStartHour;
    const newTime = new Date(startTime);
    newTime.setHours(hours24, tempStartMinute, 0, 0);

    // Validate that the selected date/time is valid
    const validFromDate = new Date(date);
    validFromDate.setHours(hours24, tempStartMinute, 0, 0);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);

    // Check if date is in the past
    if (selectedDateOnly < today) {
      setDateError("Please select today's date or a future date");
      setShowStartTimePicker(false);
      return;
    }

    // If date is today, ensure time is in the future
    if (selectedDateOnly.getTime() === today.getTime()) {
      if (validFromDate <= now) {
        setStartTimeError("Start time must be in the future for today's date");
        setShowStartTimePicker(false);
        return;
      }
    }

    setStartTime(newTime);
    setStartTimeError(""); // Clear error on valid selection
    setDateError(""); // Clear date error if time is valid
    setShowStartTimePicker(false);
  };

  const handleEndTimeDone = () => {
    const hours24 =
      tempEndAmPm === "PM" && tempEndHour !== 12
        ? tempEndHour + 12
        : tempEndAmPm === "AM" && tempEndHour === 12
        ? 0
        : tempEndHour;
    const newTime = new Date(endTime);
    newTime.setHours(hours24, tempEndMinute, 0, 0);

    // Validate that end time is after start time
    const validFromDate = new Date(date);
    validFromDate.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const validUntilDate = new Date(date);
    validUntilDate.setHours(hours24, tempEndMinute, 0, 0);

    if (validUntilDate <= validFromDate) {
      setEndTimeError("End time must be after start time");
      setShowEndTimePicker(false);
      return;
    }

    setEndTime(newTime);
    setEndTimeError(""); // Clear error on valid selection
    setShowEndTimePicker(false);
  };

  const handleGenerate = async () => {
    // Clear previous errors
    setVisitorNameError("");
    setMobileNumberError("");
    setIdentificationNumberError("");
    setPurposeError("");
    setDateError("");
    setStartTimeError("");
    setEndTimeError("");
    setNumberOfVisitorsError("");

    // Validate required fields
    let hasError = false;

    if (!visitorName.trim()) {
      setVisitorNameError("Visitor name is required");
      hasError = true;
    } else if (visitorName.trim().length < 2) {
      setVisitorNameError("Visitor name must be at least 2 characters");
      hasError = true;
    }

    if (!mobileNumber.trim()) {
      setMobileNumberError("Mobile number is required");
      hasError = true;
    } else if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
      setMobileNumberError("Mobile number must be exactly 10 digits");
      hasError = true;
    }

    if (!identificationNumber.trim()) {
      setIdentificationNumberError("Identification number is required");
      hasError = true;
    }

    if (!purpose.trim()) {
      setPurposeError("Purpose of visit is required");
      hasError = true;
    } else if (purpose.trim().length < 10) {
      setPurposeError("Purpose of visit must be at least 10 characters");
      hasError = true;
    }

    // Validate number of visitors (1-100)
    const visitorCount = parseInt(numberOfVisitors);
    if (!numberOfVisitors.trim()) {
      setNumberOfVisitorsError("Number of visitors is required");
      hasError = true;
    } else if (isNaN(visitorCount) || visitorCount < 1 || visitorCount > 100) {
      setNumberOfVisitorsError("Number of visitors must be between 1 and 100");
      hasError = true;
    }

    // Validate date (must be today or future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);

    if (selectedDateOnly < today) {
      setDateError("Please select today's date or a future date");
      hasError = true;
    }

    // Validate start time (must be in the future if date is today)
    const validFromDate = new Date(date);
    validFromDate.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const now = new Date();

    if (selectedDateOnly.getTime() === today.getTime()) {
      // If date is today, time must be in the future
      if (validFromDate <= now) {
        setStartTimeError("Start time must be in the future for today's date");
        hasError = true;
      }
    }

    // Validate end time (must be after start time)
    const validUntilDate = new Date(date);
    validUntilDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (validUntilDate <= validFromDate) {
      setEndTimeError("End time must be after start time");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      // Map pass type from UI to API format
      const passTypeMap: Record<
        string,
        "daily" | "single" | "multiple" | "event"
      > = {
        Daily: "daily",
        Weekly: "single", // Assuming Weekly maps to single
        Monthly: "multiple", // Assuming Monthly maps to multiple
        Yearly: "event", // Assuming Yearly maps to event
      };

      const apiPassType = passTypeMap[passType] || "daily";

      // Determine entry type based on number of visitors
      const entryType: "single" | "multiple" =
        parseInt(numberOfVisitors) === 1 ? "single" : "multiple";

      // Helper function to format date-time as ISO string in local time (no timezone conversion)
      const formatLocalISOString = (dateObj: Date): string => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
      };

      // Combine date and time into ISO date-time strings (treat as local time)
      const validFromDate = new Date(date);
      validFromDate.setHours(
        startTime.getHours(),
        startTime.getMinutes(),
        0,
        0
      );
      const validFrom = formatLocalISOString(validFromDate);

      const validUntilDate = new Date(date);
      validUntilDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      // If end time is before start time, assume it's the next day
      if (validUntilDate <= validFromDate) {
        validUntilDate.setDate(validUntilDate.getDate() + 1);
      }
      const validUntil = formatLocalISOString(validUntilDate);

      // Prepare form data according to API schema
      const formData = {
        full_name: visitorName.trim(),
        phone: mobileNumber.trim(),
        numberOfVisitors: parseInt(numberOfVisitors),
        purposeOfVisit: purpose.trim(),
        passType: apiPassType,
        entryType: entryType,
        validFrom: validFrom,
        validUntil: validUntil,
        identification_type: identificationType || null,
        identification_number: identificationNumber.trim() || null,
        email: null, // Optional field
        organization: null, // Optional field
        notes: null, // Optional field
      };

      // Call the API
      await api.createPass(formData);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create pass. Please try again.";

      // If authentication error, logout
      if (
        errorMessage.includes("Authentication") ||
        errorMessage.includes("login")
      ) {
        Alert.alert("Session Expired", errorMessage, [
          {
            text: "OK",
            onPress: async () => {
              navigation.replace("Login");
            },
          },
        ]);
      } else {
        // Parse API validation errors and show inline
        if (errorMessage.includes("purposeOfVisit")) {
          if (errorMessage.includes("at least 10 characters")) {
            setPurposeError("Purpose of visit must be at least 10 characters");
          }
        }
        if (
          errorMessage.includes("validFrom") &&
          errorMessage.includes("past")
        ) {
          setStartTimeError(
            "Start time must be in the future for today's date"
          );
        }

        // Show alert for other errors that aren't field-specific
        if (
          !errorMessage.includes("purposeOfVisit") &&
          !errorMessage.includes("validFrom")
        ) {
          Alert.alert("Error", errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <BackButtonIcon width={10} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Visitor Pass</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <LogOutIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

        <View style={[styles.graphicContainer, { marginTop: 10 }]}>
          <AssemblyIcon width={120} height={140} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Illustrative Graphic Section */}
          <View style={styles.graphicContainer}>
            <VisitorPassIcon width={200} height={125} />
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Visitor Name */}
            <Text style={styles.inputLabel}>Visitor Name</Text>
            <View
              style={[
                styles.inputContainer,
                visitorNameError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#ADAEBC"
                value={visitorName}
                onChangeText={(text) => {
                  setVisitorName(text);
                  if (visitorNameError) setVisitorNameError("");
                }}
              />
            </View>
            {visitorNameError ? (
              <Text style={styles.errorText}>{visitorNameError}</Text>
            ) : null}

            {/* Mobile Number */}
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View
              style={[
                styles.inputContainer,
                mobileNumberError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="10-digit number"
                placeholderTextColor="#ADAEBC"
                value={mobileNumber}
                onChangeText={(text) => {
                  // Only allow digits
                  const numericValue = text.replace(/[^0-9]/g, "");
                  setMobileNumber(numericValue);
                  if (mobileNumberError) setMobileNumberError("");
                }}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            {mobileNumberError ? (
              <Text style={styles.errorText}>{mobileNumberError}</Text>
            ) : null}

            {/* Identification Type */}
            <Text style={styles.inputLabel}>Identification Type</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowIdTypeModal(true)}
            >
              <Text
                style={[
                  styles.input,
                  !identificationType && styles.placeholderText,
                ]}
              >
                {identificationType || "Select Identification Type"}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>

            {/* Pass Type */}
            <Text style={styles.inputLabel}>Pass Type</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowPassTypeModal(true)}
            >
              <Text style={[styles.input, !passType && styles.placeholderText]}>
                {passType || "Select Pass Type"}
              </Text>
              <ChevronDownIcon width={20} height={20} />
            </TouchableOpacity>

            {/* Identification Number */}
            <Text style={styles.inputLabel}>Identification Number</Text>
            <View
              style={[
                styles.inputContainer,
                identificationNumberError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter Identification Number"
                placeholderTextColor="#ADAEBC"
                value={identificationNumber}
                onChangeText={(text) => {
                  setIdentificationNumber(text);
                  if (identificationNumberError)
                    setIdentificationNumberError("");
                }}
                keyboardType="default"
              />
            </View>
            {identificationNumberError ? (
              <Text style={styles.errorText}>{identificationNumberError}</Text>
            ) : null}

            {/* Purpose of Visit */}
            <Text style={styles.inputLabel}>Purpose of Visit</Text>
            <View
              style={[
                styles.inputContainer,
                purposeError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Brief description of the purpose"
                placeholderTextColor="#ADAEBC"
                value={purpose}
                onChangeText={(text) => {
                  setPurpose(text);
                  if (purposeError) setPurposeError("");
                }}
                multiline
                numberOfLines={3}
              />
            </View>
            {purposeError ? (
              <Text style={styles.errorText}>{purposeError}</Text>
            ) : null}

            {/* Date */}
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              style={[
                styles.inputContainer,
                dateError && styles.inputContainerError,
              ]}
              onPress={() => {
                setShowDatePicker(true);
                if (dateError) setDateError("");
              }}
              activeOpacity={0.7}
              disabled={showDatePicker}
            >
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#ADAEBC"
                value={formatDate(date)}
                editable={false}
                pointerEvents="none"
              />
              <CalendarIcon width={20} height={20} />
            </TouchableOpacity>
            {dateError ? (
              <Text style={styles.errorText}>{dateError}</Text>
            ) : null}

            {/* Time Row */}
            <View style={styles.timeRow}>
              {/* Start Time */}
              <View style={styles.timeContainer}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TouchableOpacity
                  style={[
                    styles.inputContainer,
                    startTimeError && styles.inputContainerError,
                  ]}
                  onPress={() => {
                    openStartTimePicker();
                    if (startTimeError) setStartTimeError("");
                  }}
                  activeOpacity={0.7}
                  disabled={showStartTimePicker}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="10:00 AM"
                    placeholderTextColor="#ADAEBC"
                    value={formatTime(startTime)}
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
              </View>

              {/* End Time */}
              <View style={styles.timeContainer}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={openEndTimePicker}
                  activeOpacity={0.7}
                  disabled={showEndTimePicker}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="12:00 PM"
                    placeholderTextColor="#ADAEBC"
                    value={formatTime(endTime)}
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
              </View>
            </View>
            {startTimeError ? (
              <Text style={styles.errorText}>{startTimeError}</Text>
            ) : null}
            {endTimeError ? (
              <Text style={styles.errorText}>{endTimeError}</Text>
            ) : null}

            {/* Number of Visitors */}
            <Text style={styles.inputLabel}>Number of Visitors</Text>
            <View
              style={[
                styles.inputContainer,
                numberOfVisitorsError && styles.inputContainerError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Enter number (1-100)"
                placeholderTextColor="#ADAEBC"
                value={numberOfVisitors}
                onChangeText={(text) => {
                  // Only allow digits
                  const numericValue = text.replace(/[^0-9]/g, "");
                  // Limit to 3 digits (max 100)
                  const limitedValue =
                    numericValue.length > 3
                      ? numericValue.slice(0, 3)
                      : numericValue;
                  setNumberOfVisitors(limitedValue);
                  if (numberOfVisitorsError) setNumberOfVisitorsError("");
                }}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            {numberOfVisitorsError ? (
              <Text style={styles.errorText}>{numberOfVisitorsError}</Text>
            ) : null}
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[
              styles.generateButton,
              loading && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.generateButtonText}>Generate</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Identification Type Modal */}
        <Modal
          visible={showIdTypeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowIdTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select Identification Type
                </Text>
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
                      setIdentificationType(type);
                      setShowIdTypeModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{type}</Text>
                    {identificationType === type && (
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
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {PASS_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.modalItem}
                    onPress={() => {
                      setPassType(type);
                      setShowPassTypeModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{type}</Text>
                    {passType === type && (
                      <Ionicons name="checkmark" size={20} color="#457E51" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={styles.datePickerModalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.datePickerModalContent}>
                  <View style={styles.datePickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={styles.datePickerCancelButton}
                    >
                      <Text style={styles.datePickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerModalTitle}>Select Date</Text>
                    <TouchableOpacity
                      onPress={handleDatePickerDone}
                      style={styles.datePickerDoneButton}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <Calendar
                    current={formatDate(date)}
                    onDayPress={onDateSelect}
                    markedDates={getMarkedDates()}
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
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Start Time Picker */}
        {showStartTimePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showStartTimePicker}
            onRequestClose={() => setShowStartTimePicker(false)}
          >
            <TouchableOpacity
              style={styles.datePickerModalOverlay}
              activeOpacity={1}
              onPress={() => setShowStartTimePicker(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.datePickerModalContent}>
                  <View style={styles.datePickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowStartTimePicker(false)}
                      style={styles.datePickerCancelButton}
                    >
                      <Text style={styles.datePickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerModalTitle}>
                      Select Start Time
                    </Text>
                    <TouchableOpacity
                      onPress={handleStartTimeDone}
                      style={styles.datePickerDoneButton}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timePickerContainer}>
                    <View style={styles.customTimePicker}>
                      {/* Hours */}
                      <View style={styles.timePickerColumn}>
                        <ScrollView
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={50}
                          decelerationRate="fast"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (hour) => (
                              <TouchableOpacity
                                key={hour}
                                style={[
                                  styles.timePickerItem,
                                  tempStartHour === hour &&
                                    styles.timePickerItemSelected,
                                ]}
                                onPress={() => setTempStartHour(hour)}
                              >
                                <Text
                                  style={[
                                    styles.timePickerText,
                                    tempStartHour === hour &&
                                      styles.timePickerTextSelected,
                                  ]}
                                >
                                  {hour.toString().padStart(2, "0")}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>

                      {/* Minutes */}
                      <View style={styles.timePickerColumn}>
                        <ScrollView
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={50}
                          decelerationRate="fast"
                        >
                          {Array.from({ length: 60 }, (_, i) => i).map(
                            (minute) => (
                              <TouchableOpacity
                                key={minute}
                                style={[
                                  styles.timePickerItem,
                                  tempStartMinute === minute &&
                                    styles.timePickerItemSelected,
                                ]}
                                onPress={() => setTempStartMinute(minute)}
                              >
                                <Text
                                  style={[
                                    styles.timePickerText,
                                    tempStartMinute === minute &&
                                      styles.timePickerTextSelected,
                                  ]}
                                >
                                  {minute.toString().padStart(2, "0")}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>

                      {/* AM/PM */}
                      <View style={styles.timePickerColumn}>
                        <ScrollView
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={50}
                          decelerationRate="fast"
                        >
                          {["AM", "PM"].map((amPm) => (
                            <TouchableOpacity
                              key={amPm}
                              style={[
                                styles.timePickerItem,
                                tempStartAmPm === amPm &&
                                  styles.timePickerItemSelected,
                              ]}
                              onPress={() =>
                                setTempStartAmPm(amPm as "AM" | "PM")
                              }
                            >
                              <Text
                                style={[
                                  styles.timePickerText,
                                  tempStartAmPm === amPm &&
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

        {/* End Time Picker */}
        {showEndTimePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showEndTimePicker}
            onRequestClose={() => setShowEndTimePicker(false)}
          >
            <TouchableOpacity
              style={styles.datePickerModalOverlay}
              activeOpacity={1}
              onPress={() => setShowEndTimePicker(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.datePickerModalContent}>
                  <View style={styles.datePickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowEndTimePicker(false)}
                      style={styles.datePickerCancelButton}
                    >
                      <Text style={styles.datePickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerModalTitle}>
                      Select End Time
                    </Text>
                    <TouchableOpacity
                      onPress={handleEndTimeDone}
                      style={styles.datePickerDoneButton}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timePickerContainer}>
                    <View style={styles.customTimePicker}>
                      {/* Hours */}
                      <View style={styles.timePickerColumn}>
                        <ScrollView
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={50}
                          decelerationRate="fast"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (hour) => (
                              <TouchableOpacity
                                key={hour}
                                style={[
                                  styles.timePickerItem,
                                  tempEndHour === hour &&
                                    styles.timePickerItemSelected,
                                ]}
                                onPress={() => setTempEndHour(hour)}
                              >
                                <Text
                                  style={[
                                    styles.timePickerText,
                                    tempEndHour === hour &&
                                      styles.timePickerTextSelected,
                                  ]}
                                >
                                  {hour.toString().padStart(2, "0")}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>

                      {/* Minutes */}
                      <View style={styles.timePickerColumn}>
                        <ScrollView
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={50}
                          decelerationRate="fast"
                        >
                          {Array.from({ length: 60 }, (_, i) => i).map(
                            (minute) => (
                              <TouchableOpacity
                                key={minute}
                                style={[
                                  styles.timePickerItem,
                                  tempEndMinute === minute &&
                                    styles.timePickerItemSelected,
                                ]}
                                onPress={() => setTempEndMinute(minute)}
                              >
                                <Text
                                  style={[
                                    styles.timePickerText,
                                    tempEndMinute === minute &&
                                      styles.timePickerTextSelected,
                                  ]}
                                >
                                  {minute.toString().padStart(2, "0")}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </ScrollView>
                      </View>

                      {/* AM/PM */}
                      <View style={styles.timePickerColumn}>
                        <ScrollView
                          style={styles.timePickerScroll}
                          showsVerticalScrollIndicator={false}
                          snapToInterval={50}
                          decelerationRate="fast"
                        >
                          {["AM", "PM"].map((amPm) => (
                            <TouchableOpacity
                              key={amPm}
                              style={[
                                styles.timePickerItem,
                                tempEndAmPm === amPm &&
                                  styles.timePickerItemSelected,
                              ]}
                              onPress={() =>
                                setTempEndAmPm(amPm as "AM" | "PM")
                              }
                            >
                              <Text
                                style={[
                                  styles.timePickerText,
                                  tempEndAmPm === amPm &&
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
  },
  headerButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 10,
  },
  graphicContainer: {
    alignItems: "center",
  },
  formContainer: {
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 15,
  },
  timeContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 8,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: "#FFFFFF",
    minHeight: 50,
  },
  inputContainerError: {
    borderColor: "#EF4444",
    borderWidth: 1.5,
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
  generateButton: {
    backgroundColor: "#457E51",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  generateButtonDisabled: {
    opacity: 0.6,
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
    width: "100%",
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 10,
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
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
});
