"use client";

import { useState, useEffect } from "react";
import LoaderState from "@/components/shared/loader-state";
import { useGetPayments } from "@/hooks/api/use-payment";
import { PaymentTable } from "./payments-table";
import StatsCards from "./stats-cards";
import { api } from "@/hooks/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function PendingSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = () => {
    setLoading(true);
    api.get("/payments/submissions")
      .then(res => setSubmissions(res.data?.data || []))
      .catch(() => toast.error("Failed to load submissions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/payments/submissions/${id}/approve`);
      toast.success("Payment approved");
      fetchSubmissions();
    } catch { toast.error("Failed to approve"); }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/payments/submissions/${id}/reject`);
      toast.success("Payment rejected");
      fetchSubmissions();
    } catch { toast.error("Failed to reject"); }
  };

  if (loading) return <LoaderState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Pending Payment Submissions</h2>
        <Badge variant="secondary">{submissions.filter(s => s.status === "PENDING").length} pending</Badge>
      </div>
      {submissions.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No payment submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s: any) => (
            <div key={s.id} className="border border-border rounded-xl p-4 space-y-3 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{s.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.booking?.property?.name} · {s.booking?.room?.name}
                  </p>
                </div>
                <Badge variant={s.status === "PENDING" ? "secondary" : s.status === "APPROVED" ? "default" : "destructive"}>
                  {s.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Reference</span>
                  <p className="font-medium">{s.referenceNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Amount Paid</span>
                  <p className="font-medium text-green-600">ETB {s.amountPaid?.toLocaleString()}</p>
                </div>
              </div>
              {s.screenshotUrl && (
                <a href={s.screenshotUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary underline">View Screenshot</a>
              )}
              {s.status === "PENDING" && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" className="flex-1" onClick={() => handleApprove(s.id)}>Approve</Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleReject(s.id)}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const { data, isFetching, error } = useGetPayments();
  const [tab, setTab] = useState<"payments" | "submissions">("payments");

  if (isFetching) return <LoaderState />;
  if (error) return <div><p>Something went wrong please try again</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <StatsCards />
      <main className="container mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setTab("payments")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            All Payments
          </button>
          <button
            onClick={() => setTab("submissions")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "submissions" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Pending Submissions
          </button>
        </div>
        {tab === "payments" ? (
          <PaymentTable payments={data as any} />
        ) : (
          <PendingSubmissions />
        )}
      </main>
    </div>
  );
}

