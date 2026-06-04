import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, KeyRound, Lock, CheckCircle2 } from "lucide-react";
import axios from "axios";

const SERVER = import.meta.env.VITE_SERVER_BASE_URL;
type Step = "email" | "code" | "password" | "done";

const ForgotPasswordView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) return toast.error(t("auth.email"));
    setLoading(true);
    try {
      await axios.post(`${SERVER}/api/v1/auth/forgot-password`, { email });
      toast.success("Reset code sent — check your inbox");
      setStep("code");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send code.");
    } finally { setLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    setLoading(true);
    try {
      await axios.post(`${SERVER}/api/v1/auth/verify-reset-code`, { email, code });
      toast.success("Code verified");
      setStep("password");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Invalid or expired code");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 4) return toast.error("Password must be at least 4 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await axios.post(`${SERVER}/api/v1/auth/reset-password`, { email, code, newPassword });
      toast.success("Password reset successfully");
      setStep("done");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to reset password");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" size="icon" className="rounded-full"
          onClick={() => step === "email" ? navigate("/auth/signin") : setStep(step === "code" ? "email" : step === "password" ? "code" : "email")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {step === "email" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("forgotPassword.title")}</h1>
              <p className="text-muted-foreground mt-2">{t("forgotPassword.subtitle")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("forgotPassword.emailAddress")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 py-5" type="email" placeholder={t("forgotPassword.emailPlaceholder")}
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendCode()} autoFocus />
              </div>
            </div>
            <Button className="w-full py-5" onClick={handleSendCode} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("forgotPassword.sending")}</> : t("forgotPassword.sendCode")}
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("forgotPassword.enterCode")}</h1>
              <p className="text-muted-foreground mt-2">{t("forgotPassword.codeSentTo", { email })}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("forgotPassword.verificationCode")}</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 py-5 text-center tracking-[0.5em] text-lg font-mono" placeholder="000000"
                  maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && handleVerifyCode()} autoFocus />
              </div>
            </div>
            <Button className="w-full py-5" onClick={handleVerifyCode} disabled={loading || code.length !== 6}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("forgotPassword.verifying")}</> : t("forgotPassword.verify")}
            </Button>
            <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setStep("email")}>
              {t("forgotPassword.resendCode")}
            </button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("forgotPassword.newPassword")}</h1>
              <p className="text-muted-foreground mt-2">{t("forgotPassword.newPasswordSubtitle")}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("forgotPassword.newPasswordLabel")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 py-5" type="password" placeholder={t("forgotPassword.minChars")}
                    autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("forgotPassword.confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 py-5" type="password" placeholder={t("forgotPassword.repeatPassword")}
                    autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleResetPassword()} />
                </div>
              </div>
            </div>
            <Button className="w-full py-5" onClick={handleResetPassword}
              disabled={loading || newPassword.length < 4 || newPassword !== confirmPassword}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("forgotPassword.resetting")}</> : t("forgotPassword.resetPassword")}
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{t("forgotPassword.passwordReset")}</h1>
              <p className="text-muted-foreground">{t("forgotPassword.passwordResetMsg")}</p>
            </div>
            <Button className="w-full py-5" onClick={() => navigate("/auth/signin")}>{t("forgotPassword.backToLogin")}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordView;
