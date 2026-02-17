import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RegistepClient } from "../registep-client.js";
import { getToken } from "../token-store.js";

export function registerSmaregiTools(server: McpServer, client: RegistepClient) {
  // 1. smaregi_store_list
  server.tool(
    "smaregi_store_list",
    "List all stores connected via Smaregi (スマレジ) POS, showing store IDs and names.",
    { store_id: z.number().describe("Registep Store ID linked to Smaregi") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/smaregi/fetch-sales.php", token, { store_id: params.store_id, action: "store_list" });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 2. smaregi_store_info
  server.tool(
    "smaregi_store_info",
    "Get detailed information about a specific Smaregi store including address, phone, and business hours.",
    {
      store_id: z.number().describe("Registep Store ID"),
      smaregi_store_id: z.string().describe("Smaregi internal store ID"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/smaregi/fetch-sales.php", token, { store_id: params.store_id, action: "store_info", smaregi_store_id: params.smaregi_store_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 3. smaregi_pos_stores
  server.tool(
    "smaregi_pos_stores",
    "List POS terminal devices registered in the Smaregi account.",
    { store_id: z.number().describe("Registep Store ID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/smaregi/fetch-sales.php", token, { store_id: params.store_id, action: "pos_stores" });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 4. smaregi_sales_summary
  server.tool(
    "smaregi_sales_summary",
    "Retrieve sales summary from Smaregi POS for a date range. Returns total revenue, transaction count, and daily breakdown.",
    {
      store_id: z.number().describe("Registep Store ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT sale_date, SUM(total_amount) as total_sales, COUNT(*) as transaction_count, SUM(customer_count) as total_customers FROM sales_data WHERE sale_date BETWEEN '${params.start_date}' AND '${params.end_date}' AND pos_type = 'smaregi' GROUP BY sale_date ORDER BY sale_date`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 5. smaregi_sales_today
  server.tool(
    "smaregi_sales_today",
    "Get today's real-time sales data from Smaregi POS.",
    { store_id: z.number().describe("Registep Store ID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const today = new Date().toISOString().split("T")[0];
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT sale_date, sale_time, product_name, category, quantity, total_amount, payment_method FROM sales_data WHERE sale_date = '${today}' AND pos_type = 'smaregi' ORDER BY sale_time DESC`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 6. smaregi_transaction_list
  server.tool(
    "smaregi_transaction_list",
    "List individual sales transactions from Smaregi POS for a date range.",
    {
      store_id: z.number().describe("Registep Store ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
      limit: z.number().optional().describe("Max results (default: 100)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT sale_date, sale_time, product_name, category, quantity, unit_price, total_amount, payment_method FROM sales_data WHERE sale_date BETWEEN '${params.start_date}' AND '${params.end_date}' AND pos_type = 'smaregi' ORDER BY sale_date DESC, sale_time DESC LIMIT ${params.limit ?? 100}`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 7. smaregi_transaction_get
  server.tool(
    "smaregi_transaction_get",
    "Get detailed information about a specific Smaregi transaction by transaction ID.",
    {
      store_id: z.number().describe("Registep Store ID"),
      transaction_id: z.number().describe("Transaction ID in sales_data table"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT * FROM sales_data WHERE id = ${params.transaction_id} AND pos_type = 'smaregi'`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 8. smaregi_product_list
  server.tool(
    "smaregi_product_list",
    "List all products sold through Smaregi POS, with total sales and quantities.",
    {
      store_id: z.number().describe("Registep Store ID"),
      start_date: z.string().optional().describe("Start date filter (YYYY-MM-DD)"),
      end_date: z.string().optional().describe("End date filter (YYYY-MM-DD)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      let dateFilter = "";
      if (params.start_date && params.end_date) {
        dateFilter = `AND sale_date BETWEEN '${params.start_date}' AND '${params.end_date}'`;
      }
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT product_name, category, SUM(quantity) as total_quantity, SUM(total_amount) as total_sales, AVG(unit_price) as avg_price FROM sales_data WHERE pos_type = 'smaregi' ${dateFilter} GROUP BY product_name, category ORDER BY total_sales DESC LIMIT 200`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 9. smaregi_product_get
  server.tool(
    "smaregi_product_get",
    "Get detailed sales data for a specific product from Smaregi POS.",
    {
      store_id: z.number().describe("Registep Store ID"),
      product_name: z.string().describe("Exact product name"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT sale_date, SUM(quantity) as quantity, SUM(total_amount) as total_sales, AVG(unit_price) as avg_price FROM sales_data WHERE product_name = '${params.product_name}' AND pos_type = 'smaregi' GROUP BY sale_date ORDER BY sale_date DESC LIMIT 90`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 10. smaregi_product_search
  server.tool(
    "smaregi_product_search",
    "Search for products in Smaregi POS sales data by keyword (partial match).",
    {
      store_id: z.number().describe("Registep Store ID"),
      keyword: z.string().describe("Search keyword (partial match on product name)"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT DISTINCT product_name, category, SUM(quantity) as total_quantity, SUM(total_amount) as total_sales FROM sales_data WHERE product_name LIKE '%${params.keyword}%' AND pos_type = 'smaregi' GROUP BY product_name, category ORDER BY total_sales DESC LIMIT 50`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 11. smaregi_category_list
  server.tool(
    "smaregi_category_list",
    "List all product categories from Smaregi POS with aggregated sales data.",
    { store_id: z.number().describe("Registep Store ID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT category, COUNT(DISTINCT product_name) as product_count, SUM(quantity) as total_quantity, SUM(total_amount) as total_sales FROM sales_data WHERE pos_type = 'smaregi' AND category IS NOT NULL GROUP BY category ORDER BY total_sales DESC`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 12. smaregi_stock_list
  server.tool(
    "smaregi_stock_list",
    "Get stock/inventory overview from Smaregi POS system.",
    { store_id: z.number().describe("Registep Store ID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/smaregi/fetch-sales.php", token, { store_id: params.store_id, action: "stock_list" });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 13. smaregi_stock_get
  server.tool(
    "smaregi_stock_get",
    "Get stock/inventory details for a specific product from Smaregi POS.",
    {
      store_id: z.number().describe("Registep Store ID"),
      product_id: z.string().describe("Smaregi product ID"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/smaregi/fetch-sales.php", token, { store_id: params.store_id, action: "stock_get", product_id: params.product_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );
}
