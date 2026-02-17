import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RegistepClient } from "../registep-client.js";
import { getToken } from "../token-store.js";

export function registerAirregiTools(server: McpServer, client: RegistepClient) {
  // 1. airregi_sales_summary - Period-based sales summary
  server.tool(
    "airregi_sales_summary",
    "Retrieve daily, weekly, or monthly sales summary from Airレジ POS for a specified store and date range. Returns total revenue, customer count, and average transaction amount.",
    {
      store_id: z.number().describe("Store ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
      period: z.enum(["daily", "weekly", "monthly"]).optional().describe("Aggregation period (default: daily)"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT sale_date, SUM(total_amount) as total_sales, COUNT(*) as transaction_count, SUM(customer_count) as total_customers, AVG(total_amount) as avg_transaction FROM sales_data WHERE sale_date BETWEEN '${params.start_date}' AND '${params.end_date}' AND pos_type = 'airregi' GROUP BY sale_date ORDER BY sale_date`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 2. airregi_sales_today - Today's sales
  server.tool(
    "airregi_sales_today",
    "Get today's real-time sales data from Airレジ POS, including total revenue, number of transactions, and top-selling items.",
    {
      store_id: z.number().describe("Store ID"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const today = new Date().toISOString().split("T")[0];
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT sale_date, sale_time, product_name, category, quantity, total_amount, payment_method FROM sales_data WHERE sale_date = '${today}' AND pos_type = 'airregi' ORDER BY sale_time DESC`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 3. airregi_transaction_list - Transaction list
  server.tool(
    "airregi_transaction_list",
    "List individual sales transactions from Airレジ POS for a date range, with optional category filter.",
    {
      store_id: z.number().describe("Store ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
      category: z.string().optional().describe("Filter by product category"),
      limit: z.number().optional().describe("Max results (default: 100)"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      let sql = `SELECT sale_date, sale_time, product_name, category, quantity, unit_price, total_amount, payment_method FROM sales_data WHERE sale_date BETWEEN '${params.start_date}' AND '${params.end_date}' AND pos_type = 'airregi'`;
      if (params.category) sql += ` AND category = '${params.category}'`;
      sql += ` ORDER BY sale_date DESC, sale_time DESC LIMIT ${params.limit ?? 100}`;
      const res = await client.post("/ai-sql-query.php", token, { sql, store_id: params.store_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 4. airregi_category_sales - Category breakdown
  server.tool(
    "airregi_category_sales",
    "Analyze sales by product category from Airレジ POS. Shows revenue, quantity, and percentage breakdown for each category.",
    {
      store_id: z.number().describe("Store ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT category, SUM(total_amount) as total_sales, SUM(quantity) as total_quantity, COUNT(*) as transaction_count, ROUND(SUM(total_amount) * 100.0 / (SELECT SUM(total_amount) FROM sales_data WHERE sale_date BETWEEN '${params.start_date}' AND '${params.end_date}' AND pos_type = 'airregi'), 1) as percentage FROM sales_data WHERE sale_date BETWEEN '${params.start_date}' AND '${params.end_date}' AND pos_type = 'airregi' GROUP BY category ORDER BY total_sales DESC`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 5. airregi_product_sales - Product ranking
  server.tool(
    "airregi_product_sales",
    "Get product-level sales ranking from Airレジ POS. Shows top-selling products by revenue or quantity.",
    {
      store_id: z.number().describe("Store ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
      sort_by: z.enum(["revenue", "quantity"]).optional().describe("Sort by revenue or quantity (default: revenue)"),
      limit: z.number().optional().describe("Number of products to return (default: 20)"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const orderCol = params.sort_by === "quantity" ? "total_quantity" : "total_sales";
      const res = await client.post("/ai-sql-query.php", token, {
        sql: `SELECT product_name, category, SUM(total_amount) as total_sales, SUM(quantity) as total_quantity, AVG(unit_price) as avg_price FROM sales_data WHERE sale_date BETWEEN '${params.start_date}' AND '${params.end_date}' AND pos_type = 'airregi' GROUP BY product_name, category ORDER BY ${orderCol} DESC LIMIT ${params.limit ?? 20}`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 6. airregi_sales - Generic sales query
  server.tool(
    "airregi_sales",
    "Flexible sales data query for Airレジ POS. Supports filtering by date range, category, product name, and payment method.",
    {
      store_id: z.number().describe("Store ID"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      end_date: z.string().describe("End date (YYYY-MM-DD)"),
      category: z.string().optional().describe("Filter by category"),
      product_name: z.string().optional().describe("Filter by product name (partial match)"),
      payment_method: z.string().optional().describe("Filter by payment method"),
      group_by: z.enum(["date", "category", "product", "payment_method"]).optional().describe("Group results by field"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      let conditions = [`sale_date BETWEEN '${params.start_date}' AND '${params.end_date}'`, "pos_type = 'airregi'"];
      if (params.category) conditions.push(`category = '${params.category}'`);
      if (params.product_name) conditions.push(`product_name LIKE '%${params.product_name}%'`);
      if (params.payment_method) conditions.push(`payment_method = '${params.payment_method}'`);

      let groupBy = "";
      let select = "sale_date, sale_time, product_name, category, quantity, total_amount, payment_method";
      if (params.group_by) {
        const col = params.group_by === "date" ? "sale_date" : params.group_by === "product" ? "product_name" : params.group_by;
        groupBy = `GROUP BY ${col}`;
        select = `${col}, SUM(total_amount) as total_sales, SUM(quantity) as total_quantity, COUNT(*) as count`;
      }

      const sql = `SELECT ${select} FROM sales_data WHERE ${conditions.join(" AND ")} ${groupBy} ORDER BY ${params.group_by ? "total_sales DESC" : "sale_date DESC, sale_time DESC"} LIMIT 500`;
      const res = await client.post("/ai-sql-query.php", token, { sql, store_id: params.store_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );
}
