"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  User,
  Home,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Users,
  Bed,
  DollarSign,
  Receipt,
  FileText,
  ActivityIcon,
  Download,
  Printer,
  MoreHorizontal,
} from "lucide-react";
import { type Booking, BookingStatus, PaymentStatus } from "@/types/booking";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BookingDetailContentProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (bookingId: string) => void;
  onReject?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onRefund?: (bookingId: string) => void;
}

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  [BookingStatus.PENDING]: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  [BookingStatus.PENDING_OWNER_APPROVAL]: {
    label: "Pending Owner Approval",
    icon: Clock,
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  [BookingStatus.PENDING_OWNER_REJECTION]: {
    label: "Pending Owner Rejection",
    icon: Clock,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  [BookingStatus.APPROVED]: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  [BookingStatus.REJECTED]: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  [BookingStatus.CANCELLED]: {
    label: "Cancelled",
    icon: AlertCircle,
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  },
};

const paymentStatusConfig = {
  [PaymentStatus.PENDING]: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  [PaymentStatus.SUCCESS]: {
    label: "Success",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  [PaymentStatus.FAILED]: {
    label: "Failed",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  [PaymentStatus.CANCELLED]: {
    label: "Cancelled",
    className:
      "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  },
  [PaymentStatus.REFUNDED]: {
    label: "Refunded",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
};

export function BookingDetailContent({
  booking,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onCancel,
  onRefund,
}: BookingDetailContentProps) {
  if (!booking) return null;

  const statusInfo = statusConfig[booking.status];
  const StatusIcon = statusInfo.icon;
  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() -
      new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const guestInfo = booking.user
    ? {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone,
      }
    : {
        name: booking.guestName,
        email: booking.guestEmail,
        phone: booking.guestPhone,
      };

  return (
    <div className="p-6">
      <TabsContent value="overview" className="mt-0 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Check-in
                    </p>
                    <p className="text-lg font-semibold">
                      {format(new Date(booking.checkIn), "PPP")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.checkIn), "p")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Guests</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-semibold">{booking.guests}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Check-out
                    </p>
                    <p className="text-lg font-semibold">
                      {format(new Date(booking.checkOut), "PPP")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.checkOut), "p")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Duration
                    </p>
                    <p className="text-lg font-semibold">
                      {nights} {nights === 1 ? "Night" : "Nights"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Bed className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Room</p>
                    <p className="font-semibold text-lg">{booking.room.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Room #{booking.room.roomNumber}</span>
                      <span>•</span>
                      <span>{booking.room.type}</span>
                      <span>•</span>
                      <span>Capacity: {booking.room.capacity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="font-semibold text-lg">
                      {booking.property.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>
                        {booking.property.address}, {booking.property.city}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {booking.approvedBy && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Approved By
                      </p>
                      <p className="font-semibold">{booking.approvedBy.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.approvedBy.email}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Base Price
                  </span>
                  <span className="font-medium">
                    {booking.currency} {booking.basePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax</span>
                  <span className="font-medium">
                    {booking.currency} {booking.taxAmount.toFixed(2)}
                  </span>
                </div>
                {booking.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span className="text-sm">Discount</span>
                    <span className="font-medium">
                      -{booking.currency} {booking.discount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  {booking.currency} {booking.totalAmount.toFixed(2)}
                </span>
              </div>

              {booking.additionalServices.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Additional Services</p>
                    {booking.additionalServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-muted-foreground">
                          {service.name} x{service.quantity}
                        </span>
                        <span className="font-medium">
                          {booking.currency}{" "}
                          {(service.price * service.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="guest" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Full Name
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{guestInfo.name || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Email Address
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="font-medium truncate">{guestInfo.email || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Phone Number
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{guestInfo.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Booking Type
                  </p>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Badge
                      variant={booking.manualBooked ? "secondary" : "default"}
                    >
                      {booking.manualBooked
                        ? "Manual Booking"
                        : "Online Booking"}
                    </Badge>
                  </div>
                </div>
                {booking.userId && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      User ID
                    </p>
                    <div className="p-3 rounded-lg bg-muted/50 overflow-hidden">
                      <p className="font-mono text-sm break-all">{booking.userId}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Number of Guests
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-2xl">{booking.guests}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Phone className="h-4 w-4 mr-2" />
                Call Guest
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payment" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {booking.payment ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
                      <Badge variant="outline" className={cn("text-base px-4 py-2", paymentStatusConfig[booking.payment.status]?.className)}>
                        {paymentStatusConfig[booking.payment.status]?.label || booking.payment.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {(booking as any).paymentSubmission ? "Manual Bank Transfer" : booking.payment.method}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Amount Paid</p>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-xl">
                          {booking.currency} {((booking as any).paymentSubmission?.amountPaid || booking.payment.amount)?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {booking.payment.transactionRef && !(booking as any).paymentSubmission && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Transaction Reference</p>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="font-mono text-sm break-all">{booking.payment.transactionRef}</p>
                        </div>
                      </div>
                    )}
                    {booking.payment.phoneNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Phone Number</p>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{booking.payment.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Payment Date</p>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm">{format(new Date(booking.payment.createdAt), "PPP 'at' p")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Bank Transfer Submission Details */}
                {(booking as any).paymentSubmission && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        Bank Transfer Submission
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="font-medium">{(booking as any).paymentSubmission.fullName}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Reference Number</p>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="font-mono font-medium">{(booking as any).paymentSubmission.referenceNumber}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Amount Transferred</p>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="font-bold text-lg text-primary">ETB {(booking as any).paymentSubmission.amountPaid?.toLocaleString()}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Submission Status</p>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <Badge variant={
                              (booking as any).paymentSubmission.status === "APPROVED" ? "default" :
                              (booking as any).paymentSubmission.status === "REJECTED" ? "destructive" : "secondary"
                            }>
                              {(booking as any).paymentSubmission.status}
                            </Badge>
                          </div>
                        </div>
                        {(booking as any).paymentSubmission.screenshotUrl && (
                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground mb-1">Payment Screenshot</p>
                            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                              <a
                                href={(booking as any).paymentSubmission.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary underline hover:no-underline"
                              >
                                <FileText className="h-4 w-4" />
                                View Screenshot
                              </a>
                              <div className="mt-2">
                                <img
                                  src={(booking as any).paymentSubmission.screenshotUrl}
                                  alt="Payment screenshot"
                                  className="max-h-48 rounded-lg border border-border object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {booking.payment.status === PaymentStatus.SUCCESS && (
                  <>
                    <Separator />
                    <Button variant="destructive" className="w-full" onClick={() => onRefund?.(booking.id)}>
                      Process Refund
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No Payment Information</p>
                <p className="text-sm text-muted-foreground">Payment details will appear here once processed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5 text-primary" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {booking.activities.length > 0 ? (
              <div className="space-y-6">
                {booking.activities.map((activity, index) => (
                  <div key={activity.id} className="relative pl-8">
                    {index !== booking.activities.length - 1 && (
                      <div className="absolute left-2 top-8 bottom-0 w-px bg-border" />
                    )}
                    <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "PPp")}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      {activity.performedBy && (
                        <p className="text-xs text-muted-foreground">
                          by {activity.performedBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No Activity Yet</p>
                <p className="text-sm text-muted-foreground">
                  Activity logs will appear here as actions are performed
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
}
