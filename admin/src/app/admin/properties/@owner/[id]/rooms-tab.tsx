"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Bed, Edit, Trash2 } from "lucide-react";
import { useRoomsForList, useDeleteRoomMutation } from "@/hooks/api/use-rooms";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import FormatedAmount from "@/components/shared/formatted-amount";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RoomsTab = ({ propertyId, propertyType }: { propertyId: string; propertyType?: string }) => {
  const { data: rooms, isFetching, isError } = useRoomsForList({ propertyId });
  const router = useRouter();
  const deleteMutation = useDeleteRoomMutation();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const showPerNight = ["HOTEL", "APARTMENT"].includes(propertyType || "");
  const isVilla = propertyType === "VILLA";

  return (
    <TabsContent value="rooms">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rooms</CardTitle>
              <CardDescription>Manage your property rooms</CardDescription>
            </div>
            {isVilla ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                  🏡 Villas are booked as whole units — rooms cannot be added
                </span>
              </div>
            ) : (
              <Button size="sm" onClick={() => router.push("/admin/rooms/create")}>
                <Bed className="h-4 w-4 mr-2" /> Add Room
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : isError ? (
            <div className="text-center py-12 text-red-500">Failed to load rooms.</div>
          ) : !rooms?.length ? (
            <div className="text-center py-12">
              <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rooms added yet</h3>
              <p className="text-muted-foreground mb-4">Add your first room to start accepting bookings</p>
              <Button variant="outline" onClick={() => router.push("/admin/rooms/create")}>Add Room</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const today = new Date(); today.setHours(0,0,0,0);
                const activeBookings = ((room as any).bookings || []).filter(
                  (b: any) => b.checkIn && b.checkOut && new Date(b.checkOut) >= today && ["PENDING","APPROVED"].includes(b.status)
                );
                const isAvailable = activeBookings.length === 0 && (room as any).availability;
                const latestCheckout = activeBookings.reduce((latest: Date | null, b: any) => {
                  const co = new Date(b.checkOut); return !latest || co > latest ? co : latest;
                }, null);
                return (
                  <Card key={room.id} className="pt-0 overflow-hidden">
                    {(room as any).images?.[0]?.url && (
                      <img src={(room as any).images[0].url} alt={room.name} className="w-full h-32 object-cover" />
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{room.name}</CardTitle>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <CardDescription>{room.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isAvailable && latestCheckout && (
                        <p className="text-xs text-red-500 mb-2">
                          Booked until {latestCheckout.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <FormatedAmount amount={room.price} suffix={showPerNight ? "/night" : ""} />
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/rooms/${room.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(room.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the room and all its data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmId) deleteMutation.mutate(confirmId, { onSuccess: () => setConfirmId(null) });
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabsContent>
  );
};

export default RoomsTab;
