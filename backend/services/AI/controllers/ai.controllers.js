import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { graph } from "../graph/graph.js";

const buildHistory = (history) => {
    if (!Array.isArray(history)) {
        return [];
    }
    // Take the latest 6 messages for context
    const recents = history.slice(-6);

    return recents
        .filter((recent) => recent?.content && (recent.role === "user" || recent.role === "assistant"))
        .map((msg) => {
            if (msg.role === "user") {
                return new HumanMessage(msg.content);
            }
            return new AIMessage(msg.content);
        });
};

const sendEvent = (res, type, data) => {
    if (!res || res.writableEnded || res.destroyed) {
        return false;
    }
    try {
        res.write(`event: ${type}\n`);
        res.write(`data: ${JSON.stringify(data ?? {})}\n\n`);
        if (typeof res.flush === "function") {
            res.flush();
        }
        return true;
    } catch (error) {
        console.error("SSE sendEvent error:", error?.message);
        return false;
    }
};

export const chat = async (req, res) => {
    let disconnected = false;

    try {
        const { projectId, message, history = [] } = req.body;
        const userId = req.headers["x-user-id"];

        if (!projectId) {
            return res.status(400).json({ message: "projectId is required" });
        }

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ message: "message is required" });
        }

        if (!userId) {
            return res.status(401).json({ message: "unauthorized: x-user-id header is missing" });
        }

        // Initialize Server-Sent Events (SSE) headers before streaming
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        res.flushHeaders?.();

        res.once("close", () => {
            disconnected = true;
            console.log("AI stream client disconnected");
        });

        // Notify client that AI processing has started
        sendEvent(res, "start", {
            success: true,
            message: "ai started working"
        });

        // Initialize LangGraph workflow with project and user context
        const graphData = graph({ projectId, userId });

        // Build conversation history and append current user prompt
        const messages = buildHistory(history);
        messages.push(new HumanMessage(message.trim()));

        const stream = await graphData.stream(
            { messages },
            {
                streamMode: "updates",
                recursionLimit: 40
            }
        );

        let finalMessage = "";

        // Iterate over stream updates from LangGraph
        for await (const chunk of stream) {
            if (disconnected || res.writableEnded) {
                break;
            }

            // 1. Agent node emitted updates (AIMessage, tool_calls, or final text)
            if (chunk.agent) {
                const agentMessages = chunk.agent?.messages || [];
                const lastMessage = agentMessages.at(-1);

                if (!lastMessage) continue;

                // If agent decides to call tools, stream tool_start events
                if (Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
                    for (const call of lastMessage.tool_calls) {
                        sendEvent(res, "tool_start", {
                            toolName: call.name,
                            args: call.args || {}
                        });
                    }
                    continue;
                }

                // Extract textual response from agent
                let content = "";
                if (typeof lastMessage.content === "string") {
                    content = lastMessage.content;
                } else if (Array.isArray(lastMessage.content)) {
                    content = lastMessage.content
                        .filter((item) => item.type === "text")
                        .map((item) => item.text)
                        .join("\n");
                }

                if (content) {
                    finalMessage = content;
                    sendEvent(res, "message", { content });
                }
            }

            // 2. Tools node emitted results (file operations)
            if (chunk.tools) {
                const toolMessages = chunk.tools?.messages || [];

                for (const toolMessage of toolMessages) {
                    let result = null;
                    try {
                        result = typeof toolMessage.content === "string"
                            ? JSON.parse(toolMessage.content)
                            : toolMessage.content;
                    } catch {
                        result = { raw: toolMessage.content };
                    }

                    // If tool returned a specific operation tag, stream it under that event name
                    if (result?.operation) {
                        sendEvent(res, result.operation, result);
                        continue;
                    }

                    // Default tool result stream
                    sendEvent(res, "tool_result", result || {});
                }
            }
        }

        // Stream completion event
        if (!disconnected && !res.writableEnded) {
            sendEvent(res, "done", {
                success: true,
                message: finalMessage || "done"
            });
            res.end();
        }

    } catch (error) {
        console.error("AI controller chat error:", error);

        if (disconnected) return;

        let cleanMessage = error?.message || "Internal AI stream error";
        if (error?.statusCode === 429 || error?.code === 429 || cleanMessage.includes("free-models-per-day")) {
            const resetMs = Number(error?.metadata?.headers?.["X-RateLimit-Reset"] || error?.headers?.["x-ratelimit-reset"]);
            const resetLabel = Number.isFinite(resetMs) && resetMs > 0
                ? new Date(resetMs).toLocaleString()
                : "tomorrow (UTC midnight)";
            cleanMessage = `Daily free-tier limit reached (50 requests/day on OpenRouter without credits). Quota resets at ${resetLabel}, or you can switch to another free provider/API key.`;
        } else if (cleanMessage.includes(" | metadata:")) {
            cleanMessage = cleanMessage.split(" | metadata:")[0].trim();
        }

        // If headers are already sent, stream error via SSE
        if (res.headersSent) {
            sendEvent(res, "error", {
                success: false,
                message: cleanMessage
            });
            res.end();
        } else {
            return res.status(error?.statusCode || 500).json({
                message: cleanMessage
            });
        }
    }
};
