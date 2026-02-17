import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RegistepClient } from "../registep-client.js";
import { getToken } from "../token-store.js";

export function registerStoreTools(server: McpServer, client: RegistepClient) {
  // 1. store_list - List all stores
  server.tool(
    "store_list",
    "List all stores registered by the user, including store name, code, POS system type, and status.",
    {},
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (_params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/stores.php", token);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 2. store_create - Create a new store
  server.tool(
    "store_create",
    "Create a new store with the specified name, code, POS system, and optional address/phone.",
    {
      name: z.string().describe("Store name"),
      code: z.string().describe("Unique store code"),
      pos_system: z.string().optional().describe("POS system type: airregi, smaregi, base, square"),
      industry_category: z.string().optional().describe("Industry category"),
      industry_detail: z.string().optional().describe("Industry detail"),
      phone: z.string().optional().describe("Phone number"),
      postal_code: z.string().optional().describe("Postal code"),
      address: z.string().optional().describe("Store address"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/stores.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 3. store_update - Update an existing store
  server.tool(
    "store_update",
    "Update store details such as name, code, POS system, address, or enabled status.",
    {
      id: z.number().describe("Store ID to update"),
      name: z.string().optional().describe("New store name"),
      code: z.string().optional().describe("New store code"),
      enabled: z.boolean().optional().describe("Enable or disable the store"),
      pos_system: z.string().optional().describe("POS system type"),
      industry_category: z.string().optional().describe("Industry category"),
      industry_detail: z.string().optional().describe("Industry detail"),
      phone: z.string().optional().describe("Phone number"),
      postal_code: z.string().optional().describe("Postal code"),
      address: z.string().optional().describe("Store address"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.put("/stores.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 4. store_delete - Delete a store
  server.tool(
    "store_delete",
    "Permanently delete a store and all associated data. This action cannot be undone.",
    {
      id: z.number().describe("Store ID to delete"),
    },
    {
      readOnlyHint: false, destructiveHint: true, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.delete("/stores.php", token, { id: params.id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 5. store_settings_get - Get store settings
  server.tool(
    "store_settings_get",
    "Get detailed settings for a specific store including Airレジ credentials status, email recipients, delivery schedules, and POS configuration.",
    {
      store_id: z.number().describe("Store ID"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/store-save.php", token, { store_id: params.store_id, action: "get_settings" });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 6. store_settings_update - Update store settings
  server.tool(
    "store_settings_update",
    "Update store settings such as delivery schedule, email recipients, or POS credentials.",
    {
      store_id: z.number().describe("Store ID"),
      settings: z.record(z.unknown()).describe("Settings key-value pairs to update"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/update-settings.php", token, { store_id: params.store_id, ...params.settings });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 7. store_email_add - Add delivery email
  server.tool(
    "store_email_add",
    "Add a new email address to the store's sales report delivery list.",
    {
      store_id: z.number().describe("Store ID"),
      email: z.string().email().describe("Email address to add"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/store-save.php", token, { store_id: params.store_id, action: "email_add", email: params.email });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 8. store_email_remove - Remove delivery email
  server.tool(
    "store_email_remove",
    "Remove an email address from the store's sales report delivery list.",
    {
      store_id: z.number().describe("Store ID"),
      email: z.string().email().describe("Email address to remove"),
    },
    {
      readOnlyHint: false, destructiveHint: true, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/store-save.php", token, { store_id: params.store_id, action: "email_remove", email: params.email });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 9. store_schedule_set - Set delivery schedule
  server.tool(
    "store_schedule_set",
    "Set the daily sales report delivery schedule for a store. Specify times for each day of the week.",
    {
      store_id: z.number().describe("Store ID"),
      schedule: z.record(z.array(z.string())).describe("Schedule object: { monday: ['12:00', '18:00'], tuesday: ['12:00'], ... }"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/store-save.php", token, { store_id: params.store_id, action: "schedule", schedule: params.schedule });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 10. store_airregi_credentials_set - Set Airレジ credentials
  server.tool(
    "store_airregi_credentials_set",
    "Set the Airレジ (Air Regi) POS login credentials for automated sales data collection.",
    {
      store_id: z.number().describe("Store ID"),
      username: z.string().describe("Airレジ login email/username"),
      password: z.string().describe("Airレジ login password"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/store-save.php", token, {
        store_id: params.store_id,
        action: "airregi_credentials",
        airregi_username: params.username,
        airregi_password: params.password,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 11. schedule_list - List all delivery schedules
  server.tool(
    "schedule_list",
    "Get the delivery schedule configuration for all stores, showing which times reports are sent on each day.",
    {},
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (_params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/stores.php", token);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 12. notification_list - Get notification history
  server.tool(
    "notification_list",
    "Get the history of sent notifications (email and LINE), including delivery status and timestamps.",
    {
      limit: z.number().optional().describe("Maximum number of notifications to return (default: 50)"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/logs.php", token, { type: "notification", limit: params.limit ?? 50 });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 13. activity_log_list - Get user activity logs
  server.tool(
    "activity_log_list",
    "Get the user's activity logs (login, store creation, settings changes, etc.). Shows recent account actions with timestamps.",
    {
      days: z.number().optional().describe("Number of days to look back (default: 30, max: 90)"),
      limit: z.number().optional().describe("Maximum entries to return (default: 50, max: 200)"),
      action_filter: z.string().optional().describe("Filter by action type (e.g. 'login', 'store_created', 'store_updated')"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/activity-log.php", token, {
        days: params.days ?? 30,
        limit: params.limit ?? 50,
        action_filter: params.action_filter,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 14. sql_query - Execute custom SQL query
  server.tool(
    "sql_query",
    "Execute a custom read-only SQL query against the user's sales data. Only SELECT statements are allowed. Results are limited to 1,000 rows. The query is automatically scoped to the authenticated user's data.",
    {
      sql: z.string().describe("SQL SELECT query to execute"),
      max_rows: z.number().optional().describe("Maximum rows to return (default: 1000, max: 10000)"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: params.sql,
        max_rows: params.max_rows ?? 1000,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );
}
