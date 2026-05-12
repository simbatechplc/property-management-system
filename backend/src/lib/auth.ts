import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { customSession, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email";
import { resetPasswordTemplate } from "../templates";

const CLIENT_FRONTEND_URL = process.env.CLIENT_FRONTEND_URL;
const ADMIN_FRONTEND_URL = process.env.ADMIN_FRONTEND_URL;

const trustedOrigins = [
  "http://localhost:4000",
  "http://localhost:5173",
  "https://solomongetnet.pro.et",
  "https://www.solomongetnet.pro.et",
  "https://property-admin-web.vercel.app",
  "https://property-booking-project-ui9i.vercel.app",
  "https://property-management-system-s61h-f20us0qvf.vercel.app",
  "https://property-management-system-6wk84gdqk-mohammed-ahmedins-projects.vercel.app",
  "https://property-management-system-ifoqipqs3-mohammed-ahmedins-projects.vercel.app",
  "https://property-management-system-s61h-2wxy4q7rh.vercel.app",
  "https://property-management-system-s61h-i1fy4jr1a.vercel.app",
  "https://property-management-system-if6x3e54y-mohammed-ahmedins-projects.vercel.app",
  "https://property-management-system-ifoqipqs3-mohammed-ahmedins-projects.vercel.app",
  "https://property-management-system-s61h.vercel.app",
  "https://property-management-system-cyan.vercel.app",
  "https://property-management-system-admin.vercel.app",
  "https://property-management-system-gules.vercel.app",
  "myapp://",
  ...(CLIENT_FRONTEND_URL ? [CLIENT_FRONTEND_URL] : []),
  ...(ADMIN_FRONTEND_URL ? [ADMIN_FRONTEND_URL] : []),
];

const BASE_URL = process.env.BASE_URL!;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins,

  baseURL: BASE_URL,
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {},
        after: async (user) => {},
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 4,
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-client-ip", "x-forwarded-for"],
      disableIpTracking: false,
    },
    useSecureCookies: true,
    cookies: {
      session_token: {
        attributes: {
          sameSite: "none",
          secure: true,
        },
      },
    },
  },
  session: {
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: false, // Disabled so profile updates reflect immediately
    },
    preserveSessionInDatabase: true,
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const userDoc = await prisma.user.findFirst({
        where: { id: user.id },
      });

      return {
        user: {
          ...user,
          role: userDoc?.role,
        },
        session,
      };
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          // Send the OTP for sign in
        } else if (type === "email-verification") {
          // Send the OTP for email verification
        } else {
          sendEmail({
            html: resetPasswordTemplate({
              otp,
              appName: "Property booking",
              expiryMinutes: 5,
              typeLabel: "",
            }),
            subject: "",
            to: email,
            from: "Property booking app",
          });
          // Send the OTP for password reset
        }
      },
      otpLength: 6,
      allowedAttempts: 100,
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
      phone: {
        type: "string",
        input: true,
      },
      status: {
        type: "string",
        input: true,
        required: false,
        defaultValue: "APPROVED",
      },
    },
  },
});

export const { getSession } = auth.api;
