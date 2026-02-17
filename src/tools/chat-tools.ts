import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RegistepClient } from "../registep-client.js";
import { getToken } from "../token-store.js";

export function registerChatTools(server: McpServer, client: RegistepClient) {
  // 1. chat_send
  server.tool(
    "chat_send",
    "Send a message to the Registep AI assistant for sales data analysis. The AI can query your POS data, generate insights, and answer questions about your business.",
    {
      message: z.string().describe("Question or message to send to the AI assistant"),
      session_id: z.string().optional().describe("Chat session ID (creates new session if omitted)"),
      store_id: z.number().optional().describe("Store ID for context"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-chat.php", token, {
        message: params.message,
        session_id: params.session_id,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 2. chat_session_create
  server.tool(
    "chat_session_create",
    "Create a new AI chat session with an optional title.",
    {
      title: z.string().optional().describe("Session title (auto-generated if omitted)"),
      folder_id: z.string().optional().describe("Folder ID to place the session in"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-chat.php", token, { action: "create_session", ...params });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 3. chat_session_load
  server.tool(
    "chat_session_load",
    "Load an existing chat session and its message history.",
    {
      session_id: z.string().describe("Session ID to load"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/ai-chat.php", token, { action: "load_session", session_id: params.session_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 4. chat_session_list
  server.tool(
    "chat_session_list",
    "List all AI chat sessions, optionally filtered by folder.",
    {
      folder_id: z.string().optional().describe("Filter by folder ID"),
      limit: z.number().optional().describe("Max sessions to return (default: 50)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/ai-chat.php", token, { action: "list_sessions", folder_id: params.folder_id, limit: params.limit ?? 50 });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 5. chat_session_delete
  server.tool(
    "chat_session_delete",
    "Permanently delete a chat session and all its messages. This cannot be undone.",
    {
      session_id: z.string().describe("Session ID to delete"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-chat.php", token, { action: "delete_session", session_id: params.session_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 6. chat_session_update_title
  server.tool(
    "chat_session_update_title",
    "Rename a chat session.",
    {
      session_id: z.string().describe("Session ID"),
      title: z.string().describe("New title for the session"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-chat.php", token, { action: "update_title", session_id: params.session_id, title: params.title });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 7. chat_session_move
  server.tool(
    "chat_session_move",
    "Move a chat session to a different folder.",
    {
      session_id: z.string().describe("Session ID to move"),
      folder_id: z.string().describe("Target folder ID"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-chat.php", token, { action: "move_session", session_id: params.session_id, folder_id: params.folder_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 8. chat_folder_list
  server.tool(
    "chat_folder_list",
    "List all chat folders.",
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (_params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/ai-chat.php", token, { action: "list_folders" });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 9. chat_folder_create
  server.tool(
    "chat_folder_create",
    "Create a new folder to organize chat sessions.",
    {
      name: z.string().describe("Folder name"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-chat.php", token, { action: "create_folder", name: params.name });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 10. chat_folder_rename
  server.tool(
    "chat_folder_rename",
    "Rename an existing chat folder.",
    {
      folder_id: z.string().describe("Folder ID"),
      name: z.string().describe("New folder name"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-chat.php", token, { action: "rename_folder", folder_id: params.folder_id, name: params.name });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 11. chat_folder_delete
  server.tool(
    "chat_folder_delete",
    "Delete a chat folder. Sessions inside will be moved to the root level.",
    {
      folder_id: z.string().describe("Folder ID to delete"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-chat.php", token, { action: "delete_folder", folder_id: params.folder_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 12. chat_usage_get
  server.tool(
    "chat_usage_get",
    "Check AI chat usage statistics including daily usage count, remaining quota, and plan limits.",
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (_params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/ai-usage-stats.php", token);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );
}
