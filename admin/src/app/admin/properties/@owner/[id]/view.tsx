"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  Building2, MapPin, Phone, Mail, Edit, Users,
  Bed, Calendar, Wifi, FileText, CheckCircle2, Clock, Plus, FileMinus, ArrowLeft, EyeOff, Eye,
} from "lucide-react";
import StaffsTab from "./staffs-tab";
import RoomsTab from "./rooms-tab";
import ImagesTab from "./images-tab";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { useUpdatePropertyMutation, useVoidPropertyMutation, useSetPropertyDiscountMutation, useSetRoomDiscountMutation, useRestorePropertyMutation } from "@/hooks/api/use-property";
import { CoordinateInput } from "@/components/shared/coordinate-input";
import { useAddBrokerToPropertyMutation, useRemoveStaffFromGHMutation, useGetGhStaffsQuery } from "@/hooks/api/use-staff";
import { Avatar } from "@/components/shared/avatar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { api } from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";
import { uploadToCloudinaryDirect } from "@/server/config/cloudinary";

interface PropertyData {
  id: string;
  name: string;
  address: string;
  type: string;
  about: { description: string };
  contact: { phone: string; email: string };
  location: { continent: string; country: string; city: string; subcity: string; nearby: string };
  facilities: Array<{ id: string; name: string; icon: string | null }>;
  rooms: Array<any>;
  bookings: Array<any>;
  staffs: Array<any>;
  license: { status: string; fileUrl: string; createdAt: string };
  images: Array<{ url: string; name: string; category?: string }>;
}

export default function PropertyView({ data }: { data: PropertyData }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [addBrokerOpen, setAddBrokerOpen] = useState(false);
  const [brokerEmail, setBrokerEmail] = useState("");
  const [form, setForm] = useState({
    name: data.name,
    address: data.address,
    type: (data as any).type || "HOTEL",
    furnishingStatus: (data as any).furnishingStatus || "",
    description: data.about?.description || "",
    phone: data.contact?.phone || "",
    email: data.contact?.email || "",
    city: data.location?.city || "",
    subcity: data.location?.subcity || "",
    country: data.location?.country || "",
    nearby: data.location?.nearby || "",
    latitude: (data.location as any)?.latitude || "",
    longitude: (data.location as any)?.longitude || "",
  });

  const updateMutation = useUpdatePropertyMutation();
  const voidMutation = useVoidPropertyMutation();
  const restoreMutation = useRestorePropertyMutation();
  const addBrokerMutation = useAddBrokerToPropertyMutation();
  const removeStaffMutation = useRemoveStaffFromGHMutation();
  const queryClient = useQueryClient();
  const [addFacilityName, setAddFacilityName] = useState("");
  const [addFacilityOpen, setAddFacilityOpen] = useState(false);
  const [addingFacility, setAddingFacility] = useState(false);
  const setPropertyDiscount = useSetPropertyDiscountMutation();
  const setRoomDiscount = useSetRoomDiscountMutation();
  const [propertyDiscountInput, setPropertyDiscountInput] = useState(String((data as any).discountPercent ?? 0));
  const [roomDiscountInputs, setRoomDiscountInputs] = useState<Record<string, string>>({});
  const [pricePerNightInput, setPricePerNightInput] = useState(String((data as any).pricePerNight ?? ""));
  const [savingPrice, setSavingPrice] = useState(false);
  const isPrivate = ["VILLA", "GUEST_HOUSE"].includes((data as any).type || "");  const [policies, setPolicies] = useState<Array<{ key: string; value: string }>>(
    (() => {
      const p = (data as any).policies;
      if (!p) return [
        { key: "Check-in", value: "15:00" },
        { key: "Check-out", value: "12:00" },
        { key: "Cancellation", value: "Free cancellation available" },
        { key: "Children", value: "All children welcome" },
        { key: "Pets", value: "Not allowed" },
      ];
      if (Array.isArray(p)) return p;
      // Legacy object format → convert to array
      return Object.entries(p).map(([key, value]) => ({ key, value: String(value) }));
    })()
  );
  const [newPolicyKey, setNewPolicyKey] = useState("");
  const [newPolicyValue, setNewPolicyValue] = useState("");
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Use live query for staffs so broker shows immediately after add
  const { data: liveStaffs } = useGetGhStaffsQuery({ propertyId: data.id });
  const allStaffs = liveStaffs || data.staffs || [];
  const staffMembers = allStaffs.filter((s: any) => s.role !== "BROKER");
  const brokerMembers = allStaffs.filter((s: any) => s.role === "BROKER");

  const handleAddFacility = async () => {
    if (!addFacilityName.trim()) return;
    setAddingFacility(true);
    try {
      await api.post(`/properties/${data.id}/facilities`, { name: addFacilityName.trim() });
      toast.success("Facility added");
      queryClient.invalidateQueries({ queryKey: ["guest_houses", data.id] });
      setAddFacilityName("");
      setAddFacilityOpen(false);
    } catch {
      toast.error("Failed to add facility");
    } finally {
      setAddingFacility(false);
    }
  };

  const handleSave = async () => {
    updateMutation.mutate({
      id: data.id,
      data: {
        name: form.name,
        address: form.address,
        type: form.type as any,
        ...(form.furnishingStatus ? { furnishingStatus: form.furnishingStatus as any } : {}),
        about: { description: form.description },
        contact: { phone: form.phone, email: form.email },
        location: { city: form.city, subcity: form.subcity, country: form.country, nearby: form.nearby, continent: data.location?.continent || "", latitude: form.latitude, longitude: form.longitude },
      },
    }, {
      onSuccess: async () => {
        // Save villa price if set — do this BEFORE closing dialog
        if (form.type === "VILLA" && pricePerNightInput) {
          try {
            await api.post(`/properties/${data.id}/price`, { pricePerNight: Number(pricePerNightInput) });
            toast.success(`Villa price saved: ETB ${Number(pricePerNightInput).toLocaleString()}/night`);
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to save villa price");
          }
        }
        setEditOpen(false);
        // Refresh data after dialog closes — won't reset input since dialog is closed
        queryClient.invalidateQueries({ queryKey: ["guest_houses", data.id] });
      }
    });
  };

  const handleVoid = () => {
    voidMutation.mutate(data.id, { onSuccess: () => setVoidOpen(false) });
  };

  const handleAddBroker = () => {
    if (!brokerEmail.trim()) return toast.error("Email is required");
    addBrokerMutation.mutate(
      { propertyId: data.id, email: brokerEmail.trim() },
      { onSuccess: () => { setAddBrokerOpen(false); setBrokerEmail(""); } }
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link href="/admin/properties">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Properties</Button>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setVoidOpen(true)}>
            <EyeOff className="mr-2 h-4 w-4" /> Void Property
          </Button>
          {!(data as any).visibility && (
            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => restoreMutation.mutate(data.id)} disabled={restoreMutation.isPending}>
              <Eye className="mr-2 h-4 w-4" /> {restoreMutation.isPending ? "Restoring..." : "Restore Property"}
            </Button>
          )}
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Property
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Property</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Property Type</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                {["HOTEL","GUEST_HOUSE","APARTMENT","RESORT","VILLA","HOSTEL","LODGE"].map(t => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            {/* Furnishing status — only for APARTMENT and VILLA */}
            {(form.type === "APARTMENT" || form.type === "VILLA") && (
              <div className="space-y-1">
                <Label>Furnishing Status</Label>
                <select value={form.furnishingStatus} onChange={e => setForm(f => ({ ...f, furnishingStatus: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="">Not specified</option>
                  <option value="FURNISHED">Furnished</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                  <option value="PARTIALLY_FURNISHED">Partially Furnished</option>
                </select>
              </div>
            )}
            {/* Villa price — per month and per year */}
            {form.type === "VILLA" && (
              <div className="space-y-2 md:col-span-2 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
                <Label className="text-primary font-semibold">🏡 Villa Pricing (whole property)</Label>
                <p className="text-xs text-muted-foreground">Set the rental price for the entire villa. Enter the per-night price and click Save Changes.</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Price Per Night (ETB) *</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 5000"
                      value={pricePerNightInput}
                      onChange={e => setPricePerNightInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">This price will be shown to guests on the property page.</p>
                  </div>
                </div>
              </div>
            )}            <div className="space-y-1 md:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Subcity</Label><Input value={form.subcity} onChange={e => setForm(f => ({ ...f, subcity: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Nearby</Label><Input value={form.nearby} onChange={e => setForm(f => ({ ...f, nearby: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Latitude</Label>
              <CoordinateInput type="latitude" value={form.latitude} onChange={v => setForm(f => ({ ...f, latitude: v }))} />
            </div>
            <div className="space-y-1"><Label>Longitude</Label>
              <CoordinateInput type="longitude" value={form.longitude} onChange={v => setForm(f => ({ ...f, longitude: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Void Property</DialogTitle>
            <DialogDescription>This will hide the property from the client page. It can be restored later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleVoid} disabled={voidMutation.isPending}>
              {voidMutation.isPending ? <Spinner /> : "Void Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Broker Dialog */}
      <Dialog open={addBrokerOpen} onOpenChange={setAddBrokerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Broker</DialogTitle>
            <DialogDescription>Enter the email of an approved broker to assign them to this property.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Broker Email</Label>
              <Input placeholder="broker@example.com" value={brokerEmail} onChange={e => setBrokerEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBrokerOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBroker} disabled={addBrokerMutation.isPending}>
              {addBrokerMutation.isPending ? <Spinner /> : "Add Broker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard title="Staff members" value={staffMembers.length} icon={Users} />
        <DashboardCard title="Rooms" value={data.rooms.length} icon={Bed} />
        <DashboardCard title="Bookings" value={data.bookings.length} icon={Calendar} />
        <DashboardCard title="Facilities" value={data.facilities.length} icon={Wifi} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-y-1 h-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="brokers">Brokers</TabsTrigger>
          {/* Hide Rooms tab for Villa — villas are booked as whole units */}
          {(data as any).type !== "VILLA" && <TabsTrigger value="rooms">Rooms</TabsTrigger>}
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>About</CardTitle><CardDescription>Property description</CardDescription></CardHeader>
              <CardContent>
                <h1 className="text-2xl font-bold">{data?.name}</h1>
                <span className="text-sm text-muted-foreground">{data.location.city}, {data.location.country}</span>
                <p className="text-foreground leading-relaxed mt-2">{data.about?.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3"><div className="p-2 bg-muted rounded-md"><Phone className="h-4 w-4" /></div><div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{data.contact?.phone}</p></div></div>
                <div className="flex items-center gap-3"><div className="p-2 bg-muted rounded-md"><Mail className="h-4 w-4" /></div><div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{data.contact?.email}</p></div></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Location</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[["Country", data.location?.country], ["City", data.location?.city], ["Subcity", data.location?.subcity], ["Nearby", data.location?.nearby]].map(([label, val]) => (
                    <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="font-medium">{val}</p></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>License Status</CardTitle></CardHeader>
              {data?.license ? (
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    {data.license.status === "PENDING" ? <><Clock className="h-5 w-5 text-amber-500" /><Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge></> : <><CheckCircle2 className="h-5 w-5 text-emerald-500" /><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge></>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4"><FileText className="h-4 w-4" /><span>Submitted on {new Date(data.license.createdAt).toLocaleDateString()}</span></div>
                  <div className="flex gap-2">
                    <a href={data.license.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-2" />View File</Button>
                    </a>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      try {
                        await api.delete(`/properties/${data.id}/license`);
                        toast.success("License removed");
                        queryClient.invalidateQueries({ queryKey: ["guest_houses", data.id] });
                      } catch { toast.error("Failed to remove license"); }
                    }}>Remove</Button>
                  </div>
                </CardContent>
              ) : (
                <EmptyState title="No license registered" description="Add a license below." icon={<FileMinus className="h-12 w-12 text-muted-foreground" />} primaryActions={
                  <Button size="sm" onClick={() => setLicenseOpen(true)}><Plus className="h-4 w-4 mr-2" />Add License</Button>
                } />
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <StaffsTab propertyId={data?.id} />

        {/* Brokers Tab */}
        <TabsContent value="brokers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Brokers</CardTitle><CardDescription>Approved brokers assigned to this property</CardDescription></div>
                <Button size="sm" onClick={() => setAddBrokerOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Broker</Button>
              </div>
            </CardHeader>
            <CardContent>
              {brokerMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No brokers assigned yet</p>
                  <Button size="sm" className="mt-4" onClick={() => setAddBrokerOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Broker</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {brokerMembers.map((broker: any) => (
                    <div key={broker.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex gap-3 items-center">
                        <Avatar name={broker.name} src={broker.image} />
                        <div>
                          <p className="font-medium">{broker.name}</p>
                          <p className="text-sm text-muted-foreground">{broker.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Broker</Badge>
                        <Button variant="ghost" size="sm" onClick={() => removeStaffMutation.mutate({ propertyId: data.id, userId: broker.id })} disabled={removeStaffMutation.isPending}>
                          {removeStaffMutation.isPending ? <Spinner /> : "Remove"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms */}
        <RoomsTab propertyId={data.id} propertyType={(data as any).type} />

        {/* Bookings */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader><CardTitle>Bookings</CardTitle><CardDescription>View reservations</CardDescription></CardHeader>
            <CardContent>
              {data.bookings.length === 0 ? (
                <div className="text-center py-12"><Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No bookings yet</p></div>
              ) : (
                <div className="space-y-3">
                  {data.bookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.guestName || booking.user?.name || "Guest"}</p>
                        <p className="text-sm text-muted-foreground">{booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : "â€”"} â†’ {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : "â€”"}</p>
                      </div>
                      <Badge variant="outline">{booking.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facilities */}
        <TabsContent value="facilities">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Facilities</CardTitle><CardDescription>Amenities offered</CardDescription></div>
                <Button size="sm" onClick={() => setAddFacilityOpen(true)}><Wifi className="h-4 w-4 mr-2" />Add Facility</Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.facilities.length === 0 ? (
                <div className="text-center py-12"><Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No facilities added</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.facilities.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Facility Dialog */}
        <Dialog open={addFacilityOpen} onOpenChange={setAddFacilityOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add Facility</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <Label>Facility Name</Label>
              <Input placeholder="e.g. Free Wi-Fi, Parking, Pool" value={addFacilityName} onChange={e => setAddFacilityName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddFacility()} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddFacilityOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFacility} disabled={addingFacility || !addFacilityName.trim()}>
                {addingFacility ? <Spinner /> : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Discounts */}
        <TabsContent value="discounts">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Discounts</CardTitle>
              <CardDescription>
                {(data as any).type === "VILLA"
                  ? "Set the villa rental price and discount"
                  : "Set discount percentages for the property or individual rooms"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Property price — for VILLA and GUEST_HOUSE */}
              {isPrivate && (
                <div className="p-4 border-2 border-primary/30 bg-primary/5 rounded-xl">
                  <p className="font-semibold mb-1 text-primary">
                    {(data as any).type === "VILLA" ? "🏡 Villa Price per Night" : "Property Price per Night"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {(data as any).type === "VILLA"
                      ? "Guests pay this price to rent the entire villa per night."
                      : "Guests pay this price to book the entire property per night."}
                    {(data as any).pricePerNight
                      ? ` Currently: ETB ${Number((data as any).pricePerNight).toLocaleString()}/night`
                      : " Not set yet."}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-44">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">ETB</span>
                      <Input
                        type="number" min={0}
                        value={pricePerNightInput}
                        onChange={e => setPricePerNightInput(e.target.value)}
                        className="pl-12"
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={savingPrice || !pricePerNightInput}
                      onClick={async () => {
                        const newPrice = Number(pricePerNightInput);
                        setSavingPrice(true);
                        try {
                          await api.post(`/properties/${data.id}/price`, { pricePerNight: newPrice });
                          toast.success(`Price saved: ETB ${newPrice.toLocaleString()}/night`);
                          // Don't invalidate query here — it would reset the input
                        } catch (err: any) {
                          toast.error(err?.response?.data?.message || "Failed to save price");
                        } finally { setSavingPrice(false); }
                      }}>
                      {savingPrice ? "Saving..." : "Save Price"}
                    </Button>                    {(data as any).pricePerNight > 0 && (
                      <span className="text-sm text-emerald-600 font-medium">
                        ✓ ETB {Number((data as any).pricePerNight).toLocaleString()}/night
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Property-wide discount */}
              <div className="p-4 border border-border rounded-xl">
                <p className="font-semibold mb-1">
                  {(data as any).type === "VILLA" ? "Villa Discount" : "Property-wide discount"}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {(data as any).type === "VILLA"
                    ? "Apply a discount percentage to the villa price"
                    : "Applies to the average price shown on the client page"}
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative w-32">
                    <Input
                      type="number" min={0} max={100}
                      value={propertyDiscountInput}
                      onChange={e => setPropertyDiscountInput(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                  <Button size="sm" onClick={() => setPropertyDiscount.mutate({ id: data.id, discountPercent: Number(propertyDiscountInput) })} disabled={setPropertyDiscount.isPending}>
                    {setPropertyDiscount.isPending ? "Saving..." : "Save"}
                  </Button>
                  {(data as any).discountPercent > 0 && (
                    <span className="text-sm text-emerald-600 font-medium">Active: {(data as any).discountPercent}% off</span>
                  )}
                </div>
              </div>

              {/* Per-room discounts — hidden for Villa */}
              {(data as any).type !== "VILLA" && (
                <div>
                  <p className="font-semibold mb-3">Per-room discounts</p>
                  <div className="space-y-3">
                    {data.rooms.map((room: any) => (
                      <div key={room.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                        <div>
                          <p className="font-medium text-sm">{room.name}</p>
                          <p className="text-xs text-muted-foreground">ETB {room.price?.toLocaleString()}/night</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative w-24">
                            <Input
                              type="number" min={0} max={100}
                              value={roomDiscountInputs[room.id] ?? String(room.discountPercent ?? 0)}
                              onChange={e => setRoomDiscountInputs(prev => ({ ...prev, [room.id]: e.target.value }))}
                              className="pr-7 text-sm h-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                          </div>
                          <Button size="sm" className="h-8 text-xs" onClick={() => setRoomDiscount.mutate({ roomId: room.id, discountPercent: Number(roomDiscountInputs[room.id] ?? room.discountPercent ?? 0), propertyId: data.id })} disabled={setRoomDiscount.isPending}>
                            Save
                          </Button>
                          {(room.discountPercent ?? 0) > 0 && (
                            <span className="text-xs text-emerald-600">{room.discountPercent}% off</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {data.rooms.length === 0 && <p className="text-sm text-muted-foreground">No rooms added yet.</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies */}
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Property Policies</CardTitle>
              <CardDescription>Add, edit, or remove policies shown to guests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing policies */}
              <div className="space-y-3">
                {policies.map((policy, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      className="w-36 shrink-0 text-sm"
                      placeholder="Label"
                      value={policy.key}
                      onChange={e => setPolicies(prev => prev.map((p, i) => i === idx ? { ...p, key: e.target.value } : p))}
                    />
                    <Input
                      className="flex-1 text-sm"
                      placeholder="Value"
                      value={policy.value}
                      onChange={e => setPolicies(prev => prev.map((p, i) => i === idx ? { ...p, value: e.target.value } : p))}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => setPolicies(prev => prev.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add new policy */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Input
                  className="w-36 shrink-0 text-sm"
                  placeholder="Label (e.g. Pets)"
                  value={newPolicyKey}
                  onChange={e => setNewPolicyKey(e.target.value)}
                />
                <Input
                  className="flex-1 text-sm"
                  placeholder="Value (e.g. Not allowed)"
                  value={newPolicyValue}
                  onChange={e => setNewPolicyValue(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={!newPolicyKey.trim() || !newPolicyValue.trim()}
                  onClick={() => {
                    setPolicies(prev => [...prev, { key: newPolicyKey.trim(), value: newPolicyValue.trim() }]);
                    setNewPolicyKey("");
                    setNewPolicyValue("");
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              <Button
                onClick={async () => {
                  setSavingPolicies(true);
                  try {
                    await updateMutation.mutateAsync({ id: data.id, data: { policies } });
                    toast.success("Policies saved");
                  } catch { toast.error("Failed to save policies"); }
                  finally { setSavingPolicies(false); }
                }}
                disabled={savingPolicies}
              >
                {savingPolicies ? "Saving..." : "Save Policies"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Upload Dialog */}
        <Dialog open={licenseOpen} onOpenChange={setLicenseOpen}>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Add License</DialogTitle>
              <DialogDescription>Upload a license file for this property.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>Upload from device</Label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    e.target.value = "";
                    setUploadingLicense(true);
                    try {
                      const result = await uploadToCloudinaryDirect(file);
                      setLicenseUrl(result.secure_url);
                      toast.success("File uploaded");
                    } catch { toast.error("Upload failed"); }
                    finally { setUploadingLicense(false); }
                  }}
                />
                {uploadingLicense && <p className="text-xs text-muted-foreground">Uploading...</p>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" /> or paste URL <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-1.5">
                <Label>License URL</Label>
                <Input placeholder="https://..." value={licenseUrl} onChange={e => setLicenseUrl(e.target.value)} className="text-xs" />
              </div>
              {licenseUrl && (
                <p className="text-xs text-emerald-600 truncate max-w-full">✓ Uploaded successfully</p>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setLicenseOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button
                disabled={!licenseUrl.trim() || uploadingLicense}
                className="w-full sm:w-auto"
                onClick={async () => {
                  setUploadingLicense(true);
                  try {
                    await api.post(`/properties/${data.id}/license`, { fileUrl: licenseUrl });
                    toast.success("License added");
                    queryClient.invalidateQueries({ queryKey: ["guest_houses", data.id] });
                    setLicenseOpen(false);
                    setLicenseUrl("");
                  } catch { toast.error("Failed to add license"); }
                  finally { setUploadingLicense(false); }
                }}
              >
                {uploadingLicense ? "Saving..." : "Save License"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ImagesTab images={data.images} propertyId={data.id} />
      </Tabs>
    </div>
  );
}
