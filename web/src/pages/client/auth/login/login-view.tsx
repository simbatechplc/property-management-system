"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useSignInWithEmailMutation } from "@/hooks/api/use-auth";
import { ArrowLeft, User, Building2 } from "lucide-react";
import { useState } from "react";

const validationSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required().min(4).max(12),
});

type FormType = yup.InferType<typeof validationSchema>;

const ADMIN_AUTH_URL = "https://admin.kururent.com/auth";

const LoginView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callBackUrl = searchParams.get("callBackUrl");
  const location = useLocation();
  const [userType, setUserType] = useState<"guest" | "owner">("guest");

  const { register, formState: { errors }, handleSubmit } = useForm({
    defaultValues: { email: "", password: "" },
    resolver: yupResolver(validationSchema),
  });

  const signInWithEmailMutation = useSignInWithEmailMutation();
  const onSubmit = async (data: FormType) => { await signInWithEmailMutation.mutateAsync(data); };

  return (
    <div className="space-y-6 w-[80%] sm:w-[300px] md:w-[400px] py-20">
      <Button className="rounded-full" variant="default" size="icon-lg"
        onClick={() => { if (location.state === "booking") navigate(-1); else navigate("/"); }}>
        <ArrowLeft />
      </Button>

      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("auth.welcomeTitle")} <span className="text-primary font-semibold">Kuru Rent</span>
        </h1>
        <p className="text-muted-foreground">{t("auth.welcomeSubtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setUserType("guest")}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            userType === "guest" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
          }`}>
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">{t("auth.guest")}</span>
        </button>
        <button type="button" onClick={() => window.location.href = ADMIN_AUTH_URL}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border text-muted-foreground hover:border-primary/50 transition-all">
          <Building2 className="h-5 w-5" />
          <span className="text-sm font-medium">{t("auth.ownerBroker")}</span>
        </button>
      </div>

      <div className="space-y-3">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-base">{t("auth.email")}</Label>
            <Input className="py-5 w-full" placeholder={t("auth.emailPlaceholder")}
              disabled={signInWithEmailMutation.isPending} {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <Label className="text-base">{t("auth.password")}</Label>
              <Button variant="link" className="text-xs" type="button"
                onClick={() => navigate("/auth/forgot-password")}>{t("auth.forgotPassword")}</Button>
            </div>
            <Input className="py-5 w-full" placeholder="******" type="password"
              disabled={signInWithEmailMutation.isPending} {...register("password")} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <Button className="mt-1 w-full py-5" disabled={signInWithEmailMutation.isPending}>
            {signInWithEmailMutation.isPending ? t("auth.pleaseWait") : t("auth.loginNow")}
          </Button>
        </form>
        <div className="w-full flex justify-center items-center">
          <p className="text-sm">{t("auth.noAccount")}</p>
          <Button variant="link" className="underline"
            onClick={() => navigate(callBackUrl ? `/auth/register?callBackUrl=${callBackUrl}` : "/auth/register")}>
            {t("auth.register")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
