import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from ".";
import { toast } from "sonner";
import { handleTanstackError } from "./handlers/error";
import type {
  BookingDetailResponse,
  BookingsResponse,
} from "./types/booking.types";

interface BookResponse {
  checkoutUrl?: string;
  paymentMethod?: string;
  bookingId?: string;
  totalAmount?: number;
  success: boolean;
}
export const useBookNowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      roomId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      userId: string;
      additionalServices: { id: string }[] | null;
    }) => {
      const res = await api.post<BookResponse>(`/bookings`, data);
      return res.data;
    },
    onSuccess: (data: BookResponse) => {
      // Only show toast for manual bank transfer — Chapa redirect is handled in the component
      if (data.paymentMethod === "MANUAL_BANK_TRANSFER") {
        toast.success("Booking created! Please complete the bank transfer.", { position: "top-center" });
      }
      queryClient.invalidateQueries({ queryKey: ["user_bookings"] });
    },
    onError: (error) => handleTanstackError({ error }),
  });
};

export const useGetUserBookings = () => {
  return useQuery<BookingsResponse>({
    queryKey: ["user_bookings"],
    retry: false,
    staleTime: 0,
    queryFn: async () => {
      const res = await api.get<BookingsResponse>(`/bookings/user`);
      return res.data;
    },
  });
};

export const useGetSingleBookingDetail = ({ id }: { id: string }) => {
  return useQuery<BookingDetailResponse>({
    queryKey: ["bookings", id],
    queryFn: async () => {
      const res = await api.get<BookingDetailResponse>(
        `/bookings/user/${id}`
      );
      return res.data;
    },
  });
};
