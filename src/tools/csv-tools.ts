import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RegistepClient } from "../registep-client.js";
import { getToken } from "../token-store.js";

export function registerCsvTools(server: McpServer, client: RegistepClient) {
  // 1. csv_history_list
  server.tool(
    "csv_history_list",
    "List CSV sales report files downloaded from the POS system for a specific store. Filter by year and month.",
    {
      store_id: z.number().describe("Store ID"),
      year: z.number().optional().describe("Year filter (default: current year)"),
      month: z.number().optional().describe("Month filter (1-12, omit for all months)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/csv-history.php", token, {
        store_id: params.store_id,
        year: params.year,
        month: params.month,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 2. csv_content_get
  server.tool(
    "csv_content_get",
    "Get the parsed content of a specific CSV sales report file. Returns individual transaction rows.",
    {
      store_id: z.number().describe("Store ID"),
      filename: z.string().describe("CSV filename (e.g., airregi_20260120_1830.csv)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/csv-content.php", token, {
        store_id: params.store_id,
        filename: params.filename,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );
}
