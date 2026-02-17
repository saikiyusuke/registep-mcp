import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RegistepClient } from "../registep-client.js";
import { getToken } from "../token-store.js";

export function registerBaseTools(server: McpServer, client: RegistepClient) {
  // 1. base_shop_info - Get BASE shop connection status
  server.tool(
    "base_shop_info",
    "Get BASE shop connection status including shop name, URL, and token validity for a specific store",
    {
      store_id: z.string().describe("Store ID"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/base/status.php", token, { store_id: params.store_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 2. base_store_list - List all BASE-connected stores
  server.tool(
    "base_store_list",
    "List all BASE-connected stores with connection status, shop names, and URLs",
    {},
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/base/status.php", token);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 3. base_sales_today - Get today's sales data from BASE
  server.tool(
    "base_sales_today",
    "Get today's real-time sales data from BASE store, including total revenue, number of transactions, and product details",
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
        sql: `SELECT sale_date, sale_time, product_name, category, quantity, total_amount FROM sales_data WHERE sale_date = '${today}' AND pos_type = 'base' ORDER BY sale_time DESC`,
        store_id: params.store_id,
      });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 4. base_item_list - List products from BASE store
  server.tool(
    "base_item_list",
    "List products from BASE store with filtering and pagination. Supports category, stock level, and keyword search filters",
    {
      store_id: z.string().describe("Store ID"),
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().optional().describe("Items per page (max: 100)"),
      category_id: z.string().optional().describe("Filter by category ID"),
      stock_filter: z.enum(["out_of_stock", "low_stock", "in_stock", "unlimited"]).optional().describe("Filter by stock status"),
      search: z.string().optional().describe("Search by product title (partial match)"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/base/items.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 5. base_stock_update - Update inventory stock for BASE product
  server.tool(
    "base_stock_update",
    "Update inventory stock quantity for a BASE product. Supports both single SKU and variation updates",
    {
      store_id: z.string().describe("Store ID"),
      item_id: z.string().describe("Item ID to update"),
      stock: z.number().describe("New stock quantity"),
      variation_id: z.string().optional().describe("Variation ID if updating a specific variation"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.put("/base/items.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 6. base_item_get - Get detailed product information
  server.tool(
    "base_item_get",
    "Get detailed information about a specific BASE product including title, price, stock, description, and images",
    {
      store_id: z.string().describe("Store ID"),
      item_id: z.string().describe("Item ID"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/base/items.php", token, { store_id: params.store_id, item_id: params.item_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 7. base_item_create - Create a new product
  server.tool(
    "base_item_create",
    "Create a new product in the BASE store with title, price, and optional details like description, stock, and visibility",
    {
      store_id: z.string().describe("Store ID"),
      title: z.string().describe("Product title"),
      price: z.number().describe("Product price in JPY"),
      detail: z.string().optional().describe("Product description"),
      stock: z.number().optional().describe("Initial stock quantity"),
      visible: z.boolean().optional().describe("Whether the product is visible (default: true)"),
      identifier: z.string().optional().describe("Product identifier/SKU"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/base/items.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 8. base_item_update - Update an existing product
  server.tool(
    "base_item_update",
    "Update an existing BASE product's title, price, description, stock, or visibility",
    {
      store_id: z.string().describe("Store ID"),
      item_id: z.string().describe("Item ID to update"),
      title: z.string().optional().describe("New product title"),
      price: z.number().optional().describe("New price in JPY"),
      detail: z.string().optional().describe("New product description"),
      stock: z.number().optional().describe("New stock quantity"),
      visible: z.boolean().optional().describe("Visibility status"),
      identifier: z.string().optional().describe("Product identifier/SKU"),
      variation_id: z.string().optional().describe("Variation ID if updating stock for a specific variation"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.put("/base/items.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 9. base_item_delete - Delete a product
  server.tool(
    "base_item_delete",
    "Permanently delete a product from the BASE store. This action cannot be undone",
    {
      store_id: z.string().describe("Store ID"),
      item_id: z.string().describe("Item ID to delete"),
    },
    {
      readOnlyHint: false, destructiveHint: true, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.delete("/base/items.php", token, { store_id: params.store_id, item_id: params.item_id });
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 10. base_order_list - List orders from BASE store
  server.tool(
    "base_order_list",
    "List orders from BASE store with status and date filtering. Supports pagination and multiple status filters",
    {
      store_id: z.string().describe("Store ID"),
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().optional().describe("Orders per page (default: 50, max: 100)"),
      status: z.string().optional().describe("Filter by order status: ordered, shipped, delivered, cancelled, refunded"),
      date_from: z.string().optional().describe("Start date YYYY-MM-DD"),
      date_to: z.string().optional().describe("End date YYYY-MM-DD"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/base/orders.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 7. base_order_get - Get detailed order information
  server.tool(
    "base_order_get",
    "Get detailed order information including ordered items, shipping address, and payment details from BASE store",
    {
      store_id: z.string().describe("Store ID"),
      unique_key: z.string().describe("Order unique key (order identifier)"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/base/orders.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 8. base_category_list - List product categories
  server.tool(
    "base_category_list",
    "List product categories from BASE store with item counts and category hierarchy",
    {
      store_id: z.string().describe("Store ID"),
    },
    {
      readOnlyHint: true, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.get("/base/categories.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );

  // 9. base_category_create - Create new product category
  server.tool(
    "base_category_create",
    "Create a new product category in BASE store. Category name must be unique within the store",
    {
      store_id: z.string().describe("Store ID"),
      name: z.string().describe("Category name (max 100 characters)"),
    },
    {
      readOnlyHint: false, destructiveHint: false, openWorldHint: false,
    },
    async (params, extra) => {
      const token = getToken(extra.sessionId || "");
      const res = await client.post("/base/categories.php", token, params);
      return { content: [{ type: "text", text: JSON.stringify(res.data ?? res) }] };
    }
  );
}
