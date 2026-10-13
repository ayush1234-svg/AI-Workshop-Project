import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
const mongo = new MongoClient(process.env.MONGODB_URL!);

await mongo.connect();

const db = mongo.db("sugarcane_db");
const farmers = db.collection("farmers");

const server = new McpServer({
    name: "sugarcane-farmer-server",
    version: "1.0.0"
});

server.tool(
    "get_farmer_data",
    "Retrieve all farmers, their villages, sugarcane supplied, pending payments, and amounts paid.",
    {},
    async () => {
        const data = await farmers
            .find({})
            .sort({ payment_pending: -1 })
            .toArray();

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data)
                }
            ]
        };
    }
);

const transport = new StdioServerTransport();

await server.connect(transport);