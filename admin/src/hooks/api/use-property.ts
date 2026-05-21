import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from ".";
import { toast } from "sonner";
import { SuccessResponse } from "./types/index";
import { useAuthSession } from "../use-auth-session";

export const useAddPropertyMutation = () => {
  return useMutation<SuccessResponse, any, any>({
    mutationFn: async (propertyData) => {
      const response = await api.post<SuccessResponse>("/properties", propertyData);
      return response.data;
    },
    onSuccess: ({ message }) => { toast.message(message); },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || "Failed to create property";
      toast.error(msg);
    },
  });
};

export const useGetPropertiesForManagmentQuery = () => {
  const { isAuthenticated } = useAuthSession();
  return useQuery({
    queryKey: ["properties"],
    enabled: isAuthenticated,
    retry: false,
    queryFn: async () => {
      const response = await api.get<any>(`/properties/management`);
      return response.data;
    },
  });
};

export const useGetPropertyDetailQuery = ({ id }: { id: string }) => {
  const { isAuthenticated } = useAuthSession();
  return useQuery({
    queryKey: ["guest_houses", id],
    enabled: isAuthenticated && !!id,
    retry: false,
    queryFn: async () => {
      const response = await api.get<any>(`/properties/management/${id}`);
      return response.data;
    },
  });
};

interface PropertyForList {
  createdAt: Date;
  id: string;
  name: string;
  updatedAt: Date;
  rooms: { id: string; name: string; roomId: string }[];
}

export const useGetProtectedPropertyForListQuery = (search?: string) => {
  const { isAuthenticated } = useAuthSession();
  return useQuery<PropertyForList[]>({
    queryKey: ["protected_properties_for_list"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const response = await api.get<PropertyForList[]>(`/properties/management/for-list`);
      return response.data;
    },
  });
};

interface PropertyStats {
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  totalRooms: number;
  totalReviews: number;
  totalLicensesApproved: number;
  totalFavorites: number;
}

export const useGetPropertyStats = (enabled = true) => {
  const { isAuthenticated } = useAuthSession();
  return useQuery<PropertyStats>({
    queryKey: ["property_stats"],
    enabled: isAuthenticated && enabled,
    retry: false,
    queryFn: async () => {
      const response = await api.get<PropertyStats>(`/properties/management/stats`);
      return response.data;
    },
  });
};

export const useDeletePropertyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, string>({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    },
    onSuccess: ({ message }) => {
      toast.message(message);
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || "Failed to delete property";
      toast.error(msg);
    },
  });
};

export const useUpdatePropertyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, { id: string; data: any }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/properties/${id}`, data);
      return response.data;
    },
    onSuccess: ({ message }, { id }) => {
      toast.message(message || "Property updated");
      queryClient.invalidateQueries({ queryKey: ["guest_houses", id] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update property");
    },
  });
};

export const useChangePropertyStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, { id: string; status: string; reason?: string }>({
    mutationFn: async ({ id, status, reason }) => {
      const response = await api.post(`/properties/${id}/status`, { status, reason });
      return response.data;
    },
    onSuccess: ({ message }) => {
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update property status");
    },
  });
};

export const useVoidPropertyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, string>({
    mutationFn: async (id: string) => {
      const response = await api.post(`/properties/${id}/void`);
      return response.data;
    },
    onSuccess: ({ message }) => {
      toast.success(message || "Property voided");
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to void property");
    },
  });
};

export const useSetPropertyDiscountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, { id: string; discountPercent: number }>({
    mutationFn: async ({ id, discountPercent }) => {
      const response = await api.post(`/properties/${id}/discount`, { discountPercent });
      return response.data;
    },
    onSuccess: ({ message }, { id }) => {
      toast.success(message || "Discount updated");
      queryClient.invalidateQueries({ queryKey: ["guest_houses", id] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update discount");
    },
  });
};

export const useSetRoomDiscountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, { roomId: string; discountPercent: number; propertyId?: string }>({
    mutationFn: async ({ roomId, discountPercent }) => {
      const response = await api.post(`/rooms/${roomId}/discount`, { discountPercent });
      return response.data;
    },
    onSuccess: ({ message }, { propertyId }) => {
      toast.success(message || "Room discount updated");
      if (propertyId) queryClient.invalidateQueries({ queryKey: ["guest_houses", propertyId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update room discount");
    },
  });
};

export const useRestorePropertyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, string>({
    mutationFn: async (id: string) => {
      const response = await api.post(`/properties/${id}/restore`);
      return response.data;
    },
    onSuccess: ({ message }, id) => {
      toast.success(message || "Property restored");
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["guest_houses", id] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to restore property");
    },
  });
};
