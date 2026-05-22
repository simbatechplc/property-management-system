"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/hooks/api";
import { Palette, Youtube, Send, Instagram, Globe, Type, ChevronDown, ChevronUp, Upload, Loader2, Plus, Trash2, Link } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { uploadToCloudinaryDirect } from "@/server/config/cloudinary";

const TIKTOK_ICON = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

const SOCIAL_FIELDS = [
  { key: "youtube", label: "YouTube", icon: <Youtube className="w-4 h-4 text-red-500" />, placeholder: "https://youtube.com/@yourhandle" },
  { key: "tiktok", label: "TikTok", icon: <TIKTOK_ICON />, placeholder: "https://tiktok.com/@yourhandle" },
  { key: "telegram", label: "Telegram", icon: <Send className="w-4 h-4 text-blue-500" />, placeholder: "https://t.me/yourhandle" },
  { key: "instagram", label: "Instagram", icon: <Instagram className="w-4 h-4 text-pink-500" />, placeholder: "https://instagram.com/yourhandle" },
];

interface ExtraSocial { label: string; url: string }

export default function CustomizationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    siteName: "Kuru Rent", logoUrl: "", tagline: "",
    heroTitle: "", heroSubtitle: "",
    youtube: "", tiktok: "", telegram: "", instagram: "",
    contactPhone: "", contactEmail: "", contactAddress: "",
    bankName: "", bankAccountHolder: "", bankAccountNumber: "", bankInstructions: "",
  });
  const [extraSocials, setExtraSocials] = useState<ExtraSocial[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<Array<{id: string; name: string; accountHolder: string; accountNumber: string; type: string; instructions: string}>>([]);

  useEffect(() => {
    api.get("/site-config").then(res => {
      const d = res.data;
      setForm({
        siteName: d.siteName || "Kuru Rent", logoUrl: d.logoUrl || "", tagline: d.tagline || "",
        heroTitle: d.heroTitle || "", heroSubtitle: d.heroSubtitle || "",
        youtube: d.youtube || "", tiktok: d.tiktok || "", telegram: d.telegram || "", instagram: d.instagram || "",
        contactPhone: d.contactPhone || "", contactEmail: d.contactEmail || "", contactAddress: d.contactAddress || "",
        bankName: d.bankName || "", bankAccountHolder: d.bankAccountHolder || "",
        bankAccountNumber: d.bankAccountNumber || "", bankInstructions: d.bankInstructions || "",
      });
      if (Array.isArray(d.extraSocials)) setExtraSocials(d.extraSocials);
      if (Array.isArray(d.paymentAccounts)) setPaymentAccounts(d.paymentAccounts);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingLogo(true);
    try {
      const data = await uploadToCloudinaryDirect(file);
      setForm(f => ({ ...f, logoUrl: data.secure_url }));
      toast.success("Logo uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploadingLogo(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/site-config", { ...form, extraSocials, paymentAccounts });
      toast.success("Site settings saved successfully");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const addExtraSocial = () => setExtraSocials(prev => [...prev, { label: "", url: "" }]);
  const removeExtraSocial = (i: number) => setExtraSocials(prev => prev.filter((_, idx) => idx !== i));
  const updateExtraSocial = (i: number, field: "label" | "url", value: string) =>
    setExtraSocials(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner className="size-8" /></div>;

  const activeSocialCount = SOCIAL_FIELDS.filter(f => (form as any)[f.key]).length + extraSocials.filter(s => s.url).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10"><Palette className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-xl font-bold">Site Customization</h1>
            <p className="text-sm text-muted-foreground">Edit site name, logo and social media links</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4 text-primary" /> Branding</CardTitle>
              <CardDescription>Site name and logo shown across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Site Name</Label>
                <Input value={form.siteName} onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))} placeholder="e.g. Kuru Rent" />
                <p className="text-xs text-muted-foreground">Shown in the header, footer and browser tab</p>
              </div>

              <div className="space-y-1.5">
                <Label>Tagline / Description</Label>
                <Input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="e.g. Discover and book the best properties across Ethiopia." />
                <p className="text-xs text-muted-foreground">Short description shown below the logo in the footer</p>
              </div>

              <div className="space-y-1.5">
                <Label>Hero Title</Label>
                <Input value={form.heroTitle} onChange={e => setForm(f => ({ ...f, heroTitle: e.target.value }))} placeholder="Find Your Perfect Stay, Anywhere" />
                <p className="text-xs text-muted-foreground">Large heading shown on the home page hero section</p>
              </div>

              <div className="space-y-1.5">
                <Label>Hero Subtitle</Label>
                <Input value={form.heroSubtitle} onChange={e => setForm(f => ({ ...f, heroSubtitle: e.target.value }))} placeholder="Discover cozy properties across Ethiopia..." />
                <p className="text-xs text-muted-foreground">Smaller text below the hero title</p>
              </div>

              {/* Logo upload */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/30 shrink-0 overflow-hidden">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-primary">{form.siteName?.[0] || "B"}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                        : <><Upload className="w-3.5 h-3.5" /> Upload from device</>}
                    </Button>
                    <Input
                      value={form.logoUrl}
                      onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                      placeholder="Or paste image URL..."
                      className="text-xs"
                    />
                    {form.logoUrl && (
                      <Button variant="ghost" size="sm" className="text-xs text-destructive h-6 px-2" onClick={() => setForm(f => ({ ...f, logoUrl: "" }))}>
                        Remove logo
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Recommended: square image, at least 64×64px.</p>
              </div>
            </CardContent>
          </Card>

          {/* Social Media — collapsible */}
          <Card>
            <button className="w-full text-left" onClick={() => setSocialOpen(o => !o)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Social Media Links</CardTitle>
                    {activeSocialCount > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{activeSocialCount} active</span>
                    )}
                  </div>
                  {socialOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
                <CardDescription>Links shown in the footer. Leave empty to hide.</CardDescription>
              </CardHeader>
            </button>
            {socialOpen && (
              <CardContent className="space-y-4 pt-0">
                {/* Fixed social fields */}
                {SOCIAL_FIELDS.map(({ key, label, icon, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="flex items-center gap-2">{icon} {label}</Label>
                    <div className="relative">
                      <Input
                        value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className={cn((form as any)[key] && "border-primary/50 bg-primary/5")}
                      />
                      {(form as any)[key] && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-medium">✓</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Extra / custom social links */}
                {extraSocials.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Links</p>
                    {extraSocials.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={s.label}
                          onChange={e => updateExtraSocial(i, "label", e.target.value)}
                          placeholder="Label (e.g. Facebook)"
                          className="w-32 shrink-0 text-sm"
                        />
                        <div className="relative flex-1">
                          <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            value={s.url}
                            onChange={e => updateExtraSocial(i, "url", e.target.value)}
                            placeholder="https://..."
                            className={cn("pl-8 text-sm", s.url && "border-primary/50 bg-primary/5")}
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive h-9 w-9" onClick={() => removeExtraSocial(i)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full gap-2 mt-2" onClick={addExtraSocial}>
                  <Plus className="w-3.5 h-3.5" /> Add another social link
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Contact Us</CardTitle>
              <CardDescription>Contact information shown in the footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+251 911 000 000" />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="info@kururent.et" />
              </div>
              <div className="space-y-1.5">
                <Label>Address / Location</Label>
                <Input value={form.contactAddress} onChange={e => setForm(f => ({ ...f, contactAddress: e.target.value }))} placeholder="Bole, Addis Ababa, Ethiopia" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Accounts for Manual Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-lg">💳</span> Payment Accounts
              </CardTitle>
              <CardDescription>Add bank accounts and mobile payment options (Telebirr, Awash Bank, etc.) that guests can choose from during booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentAccounts.map((acc, i) => (
                <div key={acc.id} className="p-4 border border-border rounded-xl space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">{acc.name || `Account ${i + 1}`}</span>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 px-2"
                      onClick={() => setPaymentAccounts(prev => prev.filter((_, idx) => idx !== i))}>
                      ✕ Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Payment Method Name *</Label>
                      <Input placeholder="e.g. Awash Bank, Telebirr, CBE" value={acc.name}
                        onChange={e => setPaymentAccounts(prev => prev.map((a, idx) => idx === i ? { ...a, name: e.target.value } : a))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <select value={acc.type}
                        onChange={e => setPaymentAccounts(prev => prev.map((a, idx) => idx === i ? { ...a, type: e.target.value } : a))}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                        <option value="bank">Bank Account</option>
                        <option value="mobile">Mobile Money (Telebirr, etc.)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Account Holder Name *</Label>
                      <Input placeholder="e.g. Kuru Rent PLC" value={acc.accountHolder}
                        onChange={e => setPaymentAccounts(prev => prev.map((a, idx) => idx === i ? { ...a, accountHolder: e.target.value } : a))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Account Number / Phone *</Label>
                      <Input placeholder="e.g. 1000123456789 or 0912345678" value={acc.accountNumber}
                        onChange={e => setPaymentAccounts(prev => prev.map((a, idx) => idx === i ? { ...a, accountNumber: e.target.value } : a))} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Additional Instructions (optional)</Label>
                      <Input placeholder="e.g. Include booking ID in transfer note" value={acc.instructions}
                        onChange={e => setPaymentAccounts(prev => prev.map((a, idx) => idx === i ? { ...a, instructions: e.target.value } : a))} />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full gap-2"
                onClick={() => setPaymentAccounts(prev => [...prev, { id: Date.now().toString(), name: "", accountHolder: "", accountNumber: "", type: "bank", instructions: "" }])}>
                <Plus className="w-3.5 h-3.5" /> Add Payment Account
              </Button>
            </CardContent>
          </Card>

          {/* Bank Account for Manual Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-lg">🏦</span> Bank Account for Payments
              </CardTitle>
              <CardDescription>Bank account details guests use for manual bank transfer payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Bank Name <span className="text-red-500">*</span></Label>
                <Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. Commercial Bank of Ethiopia" />
              </div>
              <div className="space-y-1.5">
                <Label>Account Holder Name <span className="text-red-500">*</span></Label>
                <Input value={form.bankAccountHolder} onChange={e => setForm(f => ({ ...f, bankAccountHolder: e.target.value }))} placeholder="e.g. Kuru Rent PLC" />
              </div>
              <div className="space-y-1.5">
                <Label>Account Number <span className="text-red-500">*</span></Label>
                <Input value={form.bankAccountNumber} onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))} placeholder="e.g. 1000123456789" />
              </div>
              <div className="space-y-1.5">
                <Label>Additional Instructions (optional)</Label>
                <Input value={form.bankInstructions} onChange={e => setForm(f => ({ ...f, bankInstructions: e.target.value }))} placeholder="e.g. Include your booking ID in the transfer note" />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full h-11 font-semibold">
            {saving ? <><Spinner className="mr-2 size-4" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
