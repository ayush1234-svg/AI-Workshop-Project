import express from "express";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { askFarmerQuestion } from "./client.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: "16kb" }));

app.post("/api/ask", async (request, response) => {
    const question =
        typeof request.body?.question === "string"
            ? request.body.question.trim()
            : "";

    if (!question) {
        response.status(400).json({ error: "Please enter a question." });
        return;
    }

    if (question.length > 2000) {
        response.status(400).json({
            error: "Please keep your question under 2,000 characters."
        });
        return;
    }

    try {
        const answer = await askFarmerQuestion(question);
        response.json({ answer });
    } catch (error) {
        console.error("Failed to answer farmer-data question:", error);
        response.status(500).json({
            error: "Could not answer your question. Check the server configuration and try again."
        });
    }
});

app.use(express.static(resolve(process.cwd(), "dist")));

app.listen(port, () => {
    console.log(`Sugarcane AI is running at http://localhost:${port}`);
});
