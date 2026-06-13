import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import fileUpload from "express-fileupload";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import rootRouter from "./routes";
import errorHandlerMiddleware from "./middleware/error-handler";
import { registerChatSocket } from "./sockets/chat.socket";

const swaggerOutput = require("../swagger-output.json");

const app = express();
const server = http.createServer(app);

// ---------- Middleware ----------
app.set("trust proxy", 1);

const CLIENT_FRONTEND_URL = process.env.CLIENT_FRONTEND_URL;
const ADMIN_FRONTEND_URL = process.env.ADMIN_FRONTEND_URL;

const allowedOriginPatterns = [
  /^https:\/\/property-management-system[\w-]*\.vercel\.app$/,
  /^https:\/\/property-management-system[\w-]*-mohammed-ahmedins-projects\.vercel\.app$/,
  /^https:\/\/solomongetnet\.pro\.et$/,
  /^https:\/\/kururent\.com$/,
  /^https:\/\/www\.kururent\.com$/,
  /^https:\/\/admin\.kururent\.com$/,
  /^http:\/\/localhost:(4000|5173|3000)$/,
];

const staticOrigins = [
  CLIENT_FRONTEND_URL,
  ADMIN_FRONTEND_URL,
].filter(Boolean) as string[];

const corsOriginFn = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);
  if (staticOrigins.includes(origin)) return callback(null, true);
  if (allowedOriginPatterns.some((p) => p.test(origin))) return callback(null, true);
  callback(new Error(`CORS blocked: ${origin}`));
};

app.use(cors({ origin: corsOriginFn, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], credentials: true }));

// ---------- Socket.IO ----------
export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => corsOriginFn(origin, callback),
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

registerChatSocket(io);

app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

// ---------- Swagger ----------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerOutput));

// ---------- Routes ----------
app.use(rootRouter);

// ---------- Error Handler ----------
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;

async function autoApproveProperties() {
  try {
    const { prisma } = await import("./lib/prisma");
    const result = await prisma.property.updateMany({
      where: { status: "PENDING" },
      data: { status: "APPROVED", visibility: true },
    });
    if (result.count > 0) console.log(`✅ Auto-approved ${result.count} pending properties`);
  } catch (e) {
    console.error("Auto-approve failed:", e);
  }
}

server.listen(PORT as any, "0.0.0.0", async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📖 Swagger Docs: http://localhost:${PORT}/api-docs`);
  await autoApproveProperties();
});
