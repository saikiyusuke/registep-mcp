import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RegistepClient } from "../registep-client.js";
import { getToken } from "../token-store.js";

export function registerSettingsTools(server: McpServer, client: RegistepClient) {
  // 1. settings_company_update
  server.tool(
    "settings_company_update",
    "Update company information including company name, address, phone number, and contact person.",
    {
      company_name: z.string().optional().describe("Company name"),
      postal_code: z.string().optional().describe("Postal code"),
      address: z.string().optional().describe("Company address"),
      phone: z.string().optional().describe("Phone number"),
      department: z.string().optional().describe("Department name"),
      position: z.string().optional().describe("Job position/title"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/update-settings.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 2. settings_line_get
  server.tool(
    "settings_line_get",
    "Get current LINE notification settings, including whether LINE notifications are enabled and the connected LINE user/group.",
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (_params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/line-settings.php", token, { action: "get" });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 3. settings_line_update
  server.tool(
    "settings_line_update",
    "Update LINE notification settings. Enable or disable LINE sales report delivery.",
    {
      enabled: z.boolean().describe("Enable or disable LINE notifications"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/line-settings.php", token, { action: "update", ...params });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 4. settings_line_test
  server.tool(
    "settings_line_test",
    "Send a test notification to the connected LINE account to verify the setup is working correctly.",
    {},
    { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async (_params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/line-settings.php", token, { action: "test" });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 5. settings_credit_get
  server.tool(
    "settings_credit_get",
    "Check the current AI credit balance and usage statistics. Shows remaining credits for AI chat and analysis features.",
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (_params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/credit-status.php", token);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );
}
