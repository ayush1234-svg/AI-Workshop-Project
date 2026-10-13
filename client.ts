import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

export async function askFarmerQuestion(question: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_API;

    if (!apiKey) {
        throw new Error("Set OPENAI_API_KEY or OPENAI_API in the project .env file.");
    }

    const openai = new OpenAI({ apiKey });
    const mcpClient = new Client({
        name: "sugarcane-ai-client",
        version: "1.0.0"
    });

    const transport = new StdioClientTransport({
        command: process.execPath,
        args: ["--import", "tsx", "server.ts"]
    });

    try {
        await mcpClient.connect(transport);

        const response = await openai.responses.create({
            model: "gpt-5.5",
            input: question,
            tools: [
                {
                    type: "function",
                    name: "get_farmer_data",
                    description:
                        "Retrieve all farmer records from the MongoDB database.",
                    parameters: {
                        type: "object",
                        properties: {},
                        required: [],
                        additionalProperties: false
                    },
                    strict: true
                }
            ],
            tool_choice: {
                type: "function",
                name: "get_farmer_data"
            }
        });

        const call = response.output.find(
            item =>
                item.type === "function_call" &&
                item.name === "get_farmer_data"
        );

        if (!call || call.type !== "function_call") {
            throw new Error("OpenAI did not request the farmer data tool.");
        }

        const result = await mcpClient.callTool({
            name: "get_farmer_data",
            arguments: {}
        });

        const finalResponse = await openai.responses.create({
            model: "gpt-5.5",
            previous_response_id: response.id,
            input: [
                {
                    type: "function_call_output",
                    call_id: call.call_id,
                    output: JSON.stringify(result.content)
                }
            ]
        });

        return finalResponse.output_text;
    } finally {
        await mcpClient.close();
    }
}
