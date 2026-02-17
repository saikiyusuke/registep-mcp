import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RegistepClient } from "../registep-client.js";
import { getToken } from "../token-store.js";

export function registerWeatherTools(server: McpServer, client: RegistepClient) {
  // 1. weather_history_list
  server.tool(
    "weather_history_list",
    "Get historical weather data for a store's location. Useful for correlating sales with weather conditions.",
    {
      store_id: z.number().describe("Store ID"),
      year: z.number().optional().describe("Year (default: current year)"),
      month: z.number().optional().describe("Month (1-12, omit for all months)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/weather-history.php", token, {
        store_id: params.store_id,
        year: params.year,
        month: params.month,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 2. weather_date_get
  server.tool(
    "weather_date_get",
    "Get weather data for a specific date at a store's location. Returns temperature, precipitation, and weather code.",
    {
      store_id: z.number().describe("Store ID"),
      date: z.string().describe("Date (YYYY-MM-DD)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/weather-history.php", token, {
        store_id: params.store_id,
        year: parseInt(params.date.split("-")[0]),
        month: parseInt(params.date.split("-")[1]),
        day: parseInt(params.date.split("-")[2]),
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );
}
