import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { RegistepClient } from "./registep-client.js";
import { registerStoreTools } from "./tools/store-tools.js";
import { registerAirregiTools } from "./tools/airregi-tools.js";
import { registerSmaregiTools } from "./tools/smaregi-tools.js";
import { registerSettingsTools } from "./tools/settings-tools.js";
import { registerChatTools } from "./tools/chat-tools.js";
import { registerCsvTools } from "./tools/csv-tools.js";
import { registerWeatherTools } from "./tools/weather-tools.js";
import { registerBaseTools } from "./tools/base-tools.js";
import { setToken, deleteToken } from "./token-store.js";

const PORT = parseInt(process.env.PORT || "3001", 10);
const client = new RegistepClient(process.env.REGISTEP_API_URL);

function extractToken(req: Request): string {
  const auth = req.headers.authorization || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error("Missing or invalid Authorization header");
  }
  return match[1];
}

function createServer(): McpServer {
  const server = new McpServer({
    name: "Registep",
    version: "1.0.0",
  });

  registerStoreTools(server, client);
  registerAirregiTools(server, client);
  registerSmaregiTools(server, client);
  registerSettingsTools(server, client);
  registerChatTools(server, client);
  registerCsvTools(server, client);
  registerWeatherTools(server, client);
  registerBaseTools(server, client);

  return server;
}

const app = express();
app.use(cors());
app.use(express.json());

// Session storage for stateful connections
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: McpServer }>();

// MCP POST endpoint
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Existing session
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      // Update token for this request
      setToken(sessionId, token);
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    // New session - create server + transport
    const server = createServer();
    let newSessionId = "";

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => {
        newSessionId = randomUUID();
        return newSessionId;
      },
      onsessioninitialized: (sid: string) => {
        sessions.set(sid, { transport, server });
        // Store token for this session
        setToken(sid, token);
      },
    });

    transport.onclose = () => {
      if (newSessionId) {
        sessions.delete(newSessionId);
        deleteToken(newSessionId);
      }
    };

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err: any) {
    if (!res.headersSent) {
      res.setHeader(
        "WWW-Authenticate",
        `Bearer resource_metadata="https://registep.jp/.well-known/oauth-protected-resource"`
      );
      res.status(401).json({
        error: "unauthorized",
        error_description: err.message,
      });
    }
  }
});

// SSE endpoint for server-to-client notifications
app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const session = sessions.get(sessionId)!;
  await session.transport.handleRequest(req, res);
});

// Session cleanup
app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
    sessions.delete(sessionId);
    deleteToken(sessionId);
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    sessions: sessions.size,
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`Registep MCP Server running on port ${PORT}`);
});

export { client };
export type { RegistepClient };
