import { PriceTag } from "@/src/components/shared/price-tag";
import { useBookNowMutation } from "@/src/hooks/api/use-bookings";
import { authClient } from "@/src/lib/auth-client";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import PaymentScreen from "./payment-container";

const PRIMARY_COLOR = "#3B82F6";

type Service = {
  id: string;
  name: string;
  price: number;
  selected: boolean;
};

type DateSelectorType = "checkIn" | "checkOut" | null;

export type BookingModalProps = {
  visible: boolean;
  onClose: () => void;
  roomName: string;
  roomPrice: number;
  roomDescription?: string;
  roomId: string;
  discountPercent?: number;
  availableServices?: Omit<Service, "selected">[];
  onBookingComplete?: (bookingData: BookingData) => void;
};

export type BookingData = {
  roomName: string;
  roomPrice: number;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  additionalServices: { id: string; name: string; price: number }[];
  subtotal: number;
  discount: number;
  roomId: string;
  total: number;
  userId: string;
};

export default function BookingModal({
  visible,
  onClose,
  roomName,
  roomPrice,
  roomDescription,
  roomId,
  discountPercent = 10,
  availableServices = [],
  onBookingComplete,
}: BookingModalProps) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState("1");
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [showCalendar, setShowCalendar] = useState<DateSelectorType>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>(
    availableServices?.map((s) => ({ ...s, selected: false }))
  );
  const [checkoutUrl, setCheckOutUrl] = useState<string | null>(null);

  const getDateGap = () => {
    if (!checkInDate || !checkOutDate) return 0;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Calculate difference in milliseconds
    const diffInMs = (checkOut as any) - (checkIn as any);

    // Convert to days
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    // Avoid negative values
    return diffInDays > 0 ? diffInDays : 0;
  };
  const { data: userData, isPending: userDataIsPending } =
    authClient.useSession();
  const bookNowMutation = useBookNowMutation();

  useEffect(() => {
    if (visible) {
      setServices(availableServices.map((s) => ({ ...s, selected: false })));
    }
  }, [visible, availableServices]);

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id
          ? { ...service, selected: !service.selected }
          : service
      )
    );
  };

  const calculateTotals = () => {
    const servicesTotal = services
      .filter((s) => s.selected)
      .reduce((sum, s) => sum + s.price, 0);
    const subtotal = roomPrice + servicesTotal;
    const discount = 0;
    const totalDates = getDateGap();
    const total = subtotal * totalDates - discount;
    return { subtotal, discount, total, servicesTotal };
  };

  const resetModal = () => {
    setCurrentStep(1);
    setCheckInDate("");
    setCheckOutDate("");
    setGuests("1");
    setServicesExpanded(false);
    setShowCalendar(null);
    setValidationErrors([]);
    setServices((prev) => prev.map((s) => ({ ...s, selected: false })));
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300);
  };

  const validateStep1 = (): boolean => {
    const errors: string[] = [];

    if (!checkInDate) {
      errors.push("Please select a check-in date");
    }

    if (!checkOutDate) {
      errors.push("Please select a check-out date");
    }

    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        errors.push("Check-in date cannot be in the past");
      }

      if (checkOut <= checkIn) {
        errors.push("Check-out date must be after check-in date");
      }
    }

    if (!guests || guests === "0") {
      errors.push("Please enter number of guests");
    }

    const guestNum = parseInt(guests);
    if (isNaN(guestNum) || guestNum < 1 || guestNum > 10) {
      errors.push("Number of guests must be between 1 and 10");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        if (Platform.OS === "web") {
          alert(validationErrors.join("\n"));
        } else {
          Alert.alert("Validation Error", validationErrors.join("\n"));
        }
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setValidationErrors([]);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setValidationErrors([]);
    }
  };

  const handleProceedPayment = () => {
    handlePayment();
  };

  const handlePayment = () => {
    if (userDataIsPending || !userData?.user?.id) return;
    const { subtotal, discount, total } = calculateTotals();
    const bookingData: BookingData = {
      roomName,
      roomPrice,
      checkInDate,
      checkOutDate,
      guests: parseInt(guests),
      additionalServices: services
        .filter((s) => s.selected)
        .map(({ id, name, price }) => ({ id, name, price })),
      subtotal,
      discount,
      total,
      roomId,
      userId: userData?.user.id!,
    };

    userData &&
      bookNowMutation
        .mutateAsync({
          checkIn: bookingData.checkInDate as any,
          checkOut: bookingData.checkOutDate as any,
          guests: bookingData.guests,
          roomId: bookingData.roomId,
          userId: userData?.user?.id!,
          additionalServices: services.filter((s) => s.selected === true),
        })
        .then((response) => {
          // handleClose();
          console.log({ response: response.data });
          if (response.data.checkoutUrl) {
            setCurrentStep(3);
            setCheckOutUrl(response.data.checkoutUrl);
          }
        })
        .catch((error: any) => {
          const errMsg =
            error?.response?.data?.message ||
            error.message ||
            "Something went wrong";
          alert(errMsg);
        });
  };

  const handleDateSelect = (date: string) => {
    if (showCalendar === "checkIn") {
      setCheckInDate(date);
      if (checkOutDate && new Date(date) >= new Date(checkOutDate)) {
        setCheckOutDate("");
      }
    } else if (showCalendar === "checkOut") {
      setCheckOutDate(date);
    }
    setShowCalendar(null);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getCheckOutMinDate = () => {
    if (checkInDate) {
      const checkIn = new Date(checkInDate);
      checkIn.setDate(checkIn.getDate() + 1);
      return checkIn.toISOString().split("T")[0];
    }
    return getMinDate();
  };

  const { subtotal, discount, total } = calculateTotals();

  const fontFamily = fontsLoaded ? "Inter_400Regular" : undefined;
  const fontFamilyMedium = fontsLoaded ? "Inter_500Medium" : undefined;
  const fontFamilySemiBold = fontsLoaded ? "Inter_600SemiBold" : undefined;
  const fontFamilyBold = fontsLoaded ? "Inter_700Bold" : undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontFamily: fontFamilyBold }]}>
              {currentStep === 1 && "Booking Details"}
              {currentStep === 2 && "Review Booking"}
              {currentStep === 3 && "Payment"}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressStep,
                  step <= currentStep && styles.progressStepActive,
                ]}
              />
            ))}
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {currentStep === 1 && (
              <View style={styles.stepContainer}>
                {validationErrors.length > 0 && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={20} color="#ef4444" />
                    <View style={styles.errorTextContainer}>
                      {validationErrors.map((error, index) => (
                        <Text
                          key={index}
                          style={[styles.errorText, { fontFamily: fontFamily }]}
                        >
                          • {error}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <CalendarIcon size={20} color={PRIMARY_COLOR} />
                    <Text
                      style={[
                        styles.inputLabelText,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      Check-in Date
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowCalendar("checkIn")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dateButtonText,
                        { fontFamily: fontFamily },
                        !checkInDate && styles.dateButtonPlaceholder,
                      ]}
                    >
                      {checkInDate || "Select check-in date"}
                    </Text>
                    <CalendarIcon size={20} color={PRIMARY_COLOR} />
                  </TouchableOpacity>
                </View>

                {showCalendar === "checkIn" && (
                  <View style={styles.calendarContainer}>
                    <Calendar
                      onDayPress={(day) => handleDateSelect(day.dateString)}
                      markedDates={
                        checkInDate
                          ? {
                              [checkInDate]: {
                                selected: true,
                                selectedColor: PRIMARY_COLOR,
                                disableTouchEvent: false,
                              },
                            }
                          : {}
                      }
                      minDate={getMinDate()}
                      disableAllTouchEventsForDisabledDays={true}
                      theme={{
                        selectedDayBackgroundColor: PRIMARY_COLOR,
                        todayTextColor: PRIMARY_COLOR,
                        arrowColor: PRIMARY_COLOR,
                        textDayFontFamily: fontFamily,
                        textMonthFontFamily: fontFamilySemiBold,
                        textDayHeaderFontFamily: fontFamilyMedium,
                      }}
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <CalendarIcon size={20} color={PRIMARY_COLOR} />
                    <Text
                      style={[
                        styles.inputLabelText,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      Check-out Date
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      !checkInDate && styles.dateButtonDisabled,
                    ]}
                    onPress={() => checkInDate && setShowCalendar("checkOut")}
                    activeOpacity={0.7}
                    disabled={!checkInDate}
                  >
                    <Text
                      style={[
                        styles.dateButtonText,
                        { fontFamily: fontFamily },
                        !checkOutDate && styles.dateButtonPlaceholder,
                      ]}
                    >
                      {checkOutDate || "Select check-out date"}
                    </Text>
                    <CalendarIcon
                      size={20}
                      color={checkInDate ? PRIMARY_COLOR : "#d1d5db"}
                    />
                  </TouchableOpacity>
                </View>

                {showCalendar === "checkOut" && (
                  <View style={styles.calendarContainer}>
                    <Calendar
                      onDayPress={(day) => handleDateSelect(day.dateString)}
                      markedDates={{
                        ...(checkInDate
                          ? {
                              [checkInDate]: {
                                selected: true,
                                selectedColor: "#93c5fd",
                                disableTouchEvent: false,
                              },
                            }
                          : {}),
                        ...(checkOutDate
                          ? {
                              [checkOutDate]: {
                                selected: true,
                                selectedColor: PRIMARY_COLOR,
                                disableTouchEvent: false,
                              },
                            }
                          : {}),
                      }}
                      minDate={getCheckOutMinDate()}
                      disableAllTouchEventsForDisabledDays={true}
                      theme={{
                        selectedDayBackgroundColor: PRIMARY_COLOR,
                        todayTextColor: PRIMARY_COLOR,
                        arrowColor: PRIMARY_COLOR,
                        textDayFontFamily: fontFamily,
                        textMonthFontFamily: fontFamilySemiBold,
                        textDayHeaderFontFamily: fontFamilyMedium,
                      }}
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <Users size={20} color={PRIMARY_COLOR} />
                    <Text
                      style={[
                        styles.inputLabelText,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      Number of Guests
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.input, { fontFamily: fontFamily }]}
                    placeholder="Enter number of guests (1-10)"
                    value={guests}
                    onChangeText={setGuests}
                    keyboardType="number-pad"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.accordionContainer}>
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => setServicesExpanded(!servicesExpanded)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.accordionTitle,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      Additional Services
                    </Text>
                    {servicesExpanded ? (
                      <ChevronUp size={20} color={PRIMARY_COLOR} />
                    ) : (
                      <ChevronDown size={20} color={PRIMARY_COLOR} />
                    )}
                  </TouchableOpacity>

                  {servicesExpanded && (
                    <View style={styles.accordionContent}>
                      {services.map((service) => (
                        <TouchableOpacity
                          key={service.id}
                          style={styles.serviceItem}
                          onPress={() => toggleService(service.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.serviceInfo}>
                            <Text
                              style={[
                                styles.serviceName,
                                { fontFamily: fontFamily },
                              ]}
                            >
                              {service.name}
                            </Text>
                            <Text
                              style={[
                                styles.servicePrice,
                                { fontFamily: fontFamilySemiBold },
                              ]}
                            >
                              +{service.price} ETB
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.checkbox,
                              service.selected && styles.checkboxSelected,
                            ]}
                          >
                            {service.selected && (
                              <Check size={16} color="#fff" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {currentStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.summaryCard}>
                  <Text
                    style={[
                      styles.summaryTitle,
                      { fontFamily: fontFamilyBold },
                    ]}
                  >
                    Room Details
                  </Text>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { fontFamily: fontFamily }]}
                    >
                      Room Type
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      {roomName}
                    </Text>
                  </View>
                  {roomDescription && (
                    <View style={styles.summaryRow}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { fontFamily: fontFamily },
                        ]}
                      >
                        Description
                      </Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          { fontFamily: fontFamilySemiBold },
                        ]}
                      >
                        {roomDescription}
                      </Text>
                    </View>
                  )}
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { fontFamily: fontFamily }]}
                    >
                      Check-in
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      {checkInDate}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { fontFamily: fontFamily }]}
                    >
                      Check-out
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      {checkOutDate}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { fontFamily: fontFamily }]}
                    >
                      Guests
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      {guests}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text
                      style={[styles.summaryLabel, { fontFamily: fontFamily }]}
                    >
                      Total days
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      {getDateGap()}
                    </Text>
                  </View>
                </View>

                {services.some((s) => s.selected) && (
                  <View style={styles.summaryCard}>
                    <Text
                      style={[
                        styles.summaryTitle,
                        { fontFamily: fontFamilyBold },
                      ]}
                    >
                      Selected Services
                    </Text>
                    {services
                      .filter((s) => s.selected)
                      .map((service) => (
                        <View key={service.id} style={styles.summaryRow}>
                          <Text
                            style={[
                              styles.summaryLabel,
                              { fontFamily: fontFamily },
                            ]}
                          >
                            {service.name}
                          </Text>
                          <Text
                            style={[
                              styles.summaryValue,
                              { fontFamily: fontFamilySemiBold },
                            ]}
                          >
                            {service.price} ETB
                          </Text>
                        </View>
                      ))}
                  </View>
                )}

                <View style={styles.totalCard}>
                  <View style={styles.totalRow}>
                    <Text
                      style={[styles.totalLabel, { fontFamily: fontFamily }]}
                    >
                      Subtotal
                    </Text>
                    <Text
                      style={[
                        styles.totalValue,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      <PriceTag style={{}} amount={subtotal} color="white" />
                    </Text>
                  </View>
                  {/* <View style={styles.totalRow}>
                    <Text
                      style={[styles.totalLabel, { fontFamily: fontFamily }]}
                    >
                      Discount ({discountPercent}%)
                    </Text>
                    <Text
                      style={[
                        styles.discountValue,
                        { fontFamily: fontFamilySemiBold },
                      ]}
                    >
                      - <PriceTag style={{}} amount={discount} color="white" />
                    </Text>
                  </View> */}
                  <View style={styles.divider} />
                  <View style={styles.totalRow}>
                    <Text
                      style={[
                        styles.grandTotalLabel,
                        { fontFamily: fontFamilyBold },
                      ]}
                    >
                      Total
                    </Text>
                    <Text
                      style={[
                        styles.grandTotalValue,
                        { fontFamily: fontFamilyBold },
                      ]}
                    >
                      <PriceTag style={{}} amount={total} color="white" />
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {currentStep === 3 && (
            <View style={{ height: "100%", width: "100%" }}>
              <PaymentScreen
                checkoutUrl={checkoutUrl as any}
                setCheckOutUrl={setCheckOutUrl}
                onClose={() => {
                  resetModal();
                  onClose();
                }}
              />
            </View>
          )}

          <View style={styles.modalFooter}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.backButtonText,
                    { fontFamily: fontFamilySemiBold },
                  ]}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}
            {currentStep == 1 && (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  currentStep === 1 && styles.nextButtonFull,
                ]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.nextButtonText,
                    { fontFamily: fontFamilySemiBold },
                  ]}
                >
                  {"Next"}
                </Text>
              </TouchableOpacity>
            )}

            {currentStep === 2 && (
              <TouchableOpacity
                style={[styles.nextButton]}
                onPress={() => handleProceedPayment()}
                activeOpacity={0.8}
                disabled={bookNowMutation.isPending}
              >
                <Text
                  style={[
                    styles.nextButtonText,
                    { fontFamily: fontFamilySemiBold },
                  ]}
                >
                  {bookNowMutation.isPending
                    ? "Loading..."
                    : "Proceed to Payment"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    color: "#1a1a1a",
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 24,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    paddingBottom: 24,
  },
  errorContainer: {
    flexDirection: "row",
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  errorTextContainer: {
    flex: 1,
    gap: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#991b1b",
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  inputLabelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#333",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  dateButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateButtonDisabled: {
    opacity: 0.5,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  dateButtonPlaceholder: {
    color: "#999",
  },
  calendarContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  accordionContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#333",
  },
  accordionContent: {
    backgroundColor: "#fff",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "600" as const,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  summaryCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    color: "#1a1a1a",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#666",
    flex: 1,
  },
  summaryValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600" as const,
    flex: 1,
    textAlign: "right",
  },
  totalCard: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    padding: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    color: "#dbeafe",
  },
  totalValue: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600" as const,
  },
  discountValue: {
    fontSize: 15,
    color: "#86efac",
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: "#60a5fa",
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    color: "#fff",
  },
  grandTotalValue: {
    fontSize: 24,
    color: "#fff",
  },
  paymentContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  paymentIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 24,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  paymentSubtitle: {
    fontSize: 18,
    color: PRIMARY_COLOR,
    fontWeight: "600" as const,
    marginBottom: 16,
  },
  paymentDescription: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  payNowButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
      },
    }),
  },
  payNowButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  backButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  backButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  nextButton: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
