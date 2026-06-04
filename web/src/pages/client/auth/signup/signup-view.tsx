"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Building2, Briefcase, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { useSignUpWithEmailMutation } from "@/hooks/api/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Role = "GUEST" | "OWNER" | "BROKER";

const SignupView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signUpMutation = useSignUpWithEmailMutation();

  const [role, setRole] = useState<Role>("GUEST");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [nationalIdUrl, setNationalIdUrl] = useState("");
  const [nationalIdUploading, setNationalIdUploading] = useState(false);

  const ROLES = [
    { value: "GUEST" as Role, label: t("auth.guest"), icon: User, description: t("auth.browseBook") },
    { value: "OWNER" as Role, label: t("auth.owner"), icon: Building2, description: t("auth.listProperties") },
    { value: "BROKER" as Role, label: t("auth.broker"), icon: Briefcase, description: t("auth.manageListings") },
  ];

  const uploadFile = async (file: File, setter: (url: string) => void, loadingSetter: (v: boolean) => void) => {
    loadingSetter(true);
    try {
      const { api } = await import("@/hooks/api");
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/users/upload-public", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = res.data?.url || res.data?.secure_url || "";
      if (url) { setter(url); toast.success("File uploaded"); }
      else toast.error("Upload failed");
    } catch { toast.error("Upload failed"); }
    finally { loadingSetter(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) { toast.error("Please fill in all required fields"); return; }
    if (phone && !/^[0-9]{10}$/.test(phone)) { toast.error("Phone number must be exactly 10 digits"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (role === "GUEST") {
        await signUpMutation.mutateAsync({ email, name, password, phone });
      } else {
        const { api } = await import("@/hooks/api");
        const payload: any = { contactName: name, email, password, phone, registrationType: role };
        if (role === "OWNER") { payload.companyName = companyName || name; payload.companyDescription = companyDescription; payload.businessFileUrl = licenseUrl; }
        else { payload.nationalId = nationalIdUrl; }
        await api.post("/registration-requests", payload);
        setSubmitted(true);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="space-y-6 w-[80%] sm:w-[300px] md:w-[400px] py-20 flex flex-col items-center text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        <h2 className="text-2xl font-bold">{t("auth.registrationSubmitted")}</h2>
        <p className="text-muted-foreground text-sm">
          {role === "OWNER" ? t("auth.ownerSubmittedMsg") : t("auth.brokerSubmittedMsg")}
        </p>
        <Button className="w-full py-5" onClick={() => navigate("/auth/signin")}>
          {t("auth.backToSignIn")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 w-[80%] sm:w-[300px] md:w-[400px] py-16">
      <Button className="rounded-full" variant="default" size="icon-lg" onClick={() => navigate(-1)}>
        <ArrowLeft />
      </Button>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("auth.createTitle")} <span className="text-primary font-semibold">Kuru Rent</span>
        </h1>
        <p className="text-muted-foreground text-sm">{t("auth.createSubtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-base">{t("auth.iAmA")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map(({ value, label, icon: Icon, description }) => (
            <button key={value} type="button" onClick={() => setRole(value)}
              className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                role === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
              <Icon className="h-5 w-5" />
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] leading-tight opacity-70 hidden sm:block">{description}</span>
            </button>
          ))}
        </div>
        {role !== "GUEST" && (
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            {role === "OWNER" ? t("auth.ownerApprovalNote") : t("auth.brokerApprovalNote")}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {role === "OWNER" && (
          <>
            <div className="flex flex-col gap-1">
              <Label>{t("auth.companyName")} *</Label>
              <Input className="py-5" placeholder={t("auth.companyNamePlaceholder")} value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("auth.companyDescription")}</Label>
              <Input className="py-5" placeholder={t("auth.companyDescPlaceholder")} value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("auth.businessLicense")}</Label>
              <label className="flex-1 cursor-pointer">
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={async e => {
                  const f = e.target.files?.[0];
                  if (f) await uploadFile(f, setLicenseUrl, setLicenseUploading);
                }} />
                <div className={cn("flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm transition-colors",
                  licenseUrl ? "border-emerald-500 text-emerald-600" : "border-border text-muted-foreground hover:border-primary/50")}>
                  {licenseUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : licenseUrl ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  {licenseUploading ? t("auth.uploading") : licenseUrl ? t("auth.licenseUploaded") : t("auth.uploadLicense")}
                </div>
              </label>
            </div>
          </>
        )}

        {role === "BROKER" && (
          <div className="flex flex-col gap-1">
            <Label>{t("auth.nationalIdDoc")}</Label>
            <label className="flex-1 cursor-pointer">
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={async e => {
                const f = e.target.files?.[0];
                if (f) await uploadFile(f, setNationalIdUrl, setNationalIdUploading);
              }} />
              <div className={cn("flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm transition-colors",
                nationalIdUrl ? "border-emerald-500 text-emerald-600" : "border-border text-muted-foreground hover:border-primary/50")}>
                {nationalIdUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : nationalIdUrl ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                {nationalIdUploading ? t("auth.uploading") : nationalIdUrl ? t("auth.nationalIdUploaded") : t("auth.uploadNationalId")}
              </div>
            </label>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Label>{role === "GUEST" ? t("auth.fullName") : t("auth.contactName")} *</Label>
          <Input className="py-5" placeholder={t("auth.fullName")} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t("auth.phoneNumber")} *</Label>
          <Input className="py-5" placeholder={t("auth.phonePlaceholder")} value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t("auth.email")} *</Label>
          <Input className="py-5" type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t("auth.password")} *</Label>
          <Input className="py-5" type="password" placeholder={t("auth.passwordPlaceholder")} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <Button className="mt-2 w-full py-5" type="submit" disabled={loading || signUpMutation.isPending || licenseUploading || nationalIdUploading}>
          {loading || signUpMutation.isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("auth.pleaseWait")}</>
            : role === "GUEST" ? t("auth.signUp")
            : role === "OWNER" ? t("auth.submitOwner")
            : t("auth.submitBroker")}
        </Button>
      </form>

      <div className="w-full flex justify-center items-center">
        <p className="text-sm">{t("auth.alreadyHaveAccount")}</p>
        <Button variant="link" className="underline" onClick={() => navigate("/auth/signin")}>
          {t("auth.signIn")}
        </Button>
      </div>
    </div>
  );
};

export default SignupView;
