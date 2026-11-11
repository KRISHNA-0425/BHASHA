const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000").replace(/\/+$/, "");

/**
 * Parse a single raw SSE event block into { type, data }
 */
const parseSSEBlock = (eventText) => {
    if (!eventText || !eventText.trim()) return null;

    let eventType = "message";
    const dataLines = [];

    const lines = eventText.split(/\r?\n/);
    for (const line of lines) {
        if (!line || line.startsWith(":")) continue;

        if (line.startsWith("event:")) {
            eventType = line.slice(6).trim() || "message";
        } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
        }
    }

    const dataText = dataLines.join("\n").trim();
    if (!dataText) return null;

    let parsedData;
    try {
        parsedData = JSON.parse(dataText);
    } catch {
        parsedData = { content: dataText };
    }

    return { type: eventType, data: parsedData };
};

/**
 * Stream chat and autonomous filesystem operations from the AI microservice via SSE.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.message
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} [params.history=[]]
 * @param {(event: { type: string, data: any }) => void} [params.onEvent]
 * @param {AbortSignal} [params.signal]
 */
export const chat = async ({ projectId, message, history = [], onEvent, signal }) => {
    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        },
        body: JSON.stringify({ projectId, message, history }),
        signal
    });

    if (!response.ok) {
        let errorMessage = `AI request failed (${response.status})`;
        try {
            const errBody = await response.json();
            errorMessage = errBody?.message || errorMessage;
        } catch {
            // Fallback to default message if response body is not JSON
        }
        throw new Error(errorMessage);
    }

    if (!response.body) {
        throw new Error("Streaming is not supported in this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            const { value, done } = await reader.read();

            if (done) {
                buffer += decoder.decode();
                break;
            }

            buffer += decoder.decode(value, { stream: true });

            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() || "";

            for (const block of blocks) {
                const parsed = parseSSEBlock(block);
                if (parsed) {
                    onEvent?.(parsed);
                }
            }
        }

        // Flush any remaining trailing event block
        if (buffer.trim()) {
            const parsed = parseSSEBlock(buffer);
            if (parsed) {
                onEvent?.(parsed);
            }
        }

        return { success: true };
    } catch (error) {
        if (error?.name === "AbortError") {
            return { success: false, aborted: true };
        }
        throw error;
    } finally {
        try {
            reader.releaseLock();
        } catch {
            // Ignore if already released
        }
    }
};
