import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { prisma } from "@/lib/prisma";

// Type-safe WebSocket with optional userId
interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  isAgent?: boolean;
}

// Active connections map
const clients = new Map<string, ExtendedWebSocket>();
const agents = new Map<string, ExtendedWebSocket>();

function broadcastToAgents(message: string) {
  const parsed = JSON.parse(message);
  const agentList = [...agents.values()];
  agentList.forEach((agent) => {
    if (agent.readyState === WebSocket.OPEN) {
      agent.send(JSON.stringify({
        type: "AGENT_BROADCAST",
        data: parsed.data,
      }));
    }
  });
}

export function initLiveChatServer(server: ReturnType<typeof createServer>) {
  const wss = new WebSocketServer({
    server,
    path: "/api/chat",
  });

  wss.on("connection", (ws: ExtendedWebSocket, req: { url?: string; headers: { host?: string } }) => {
    // Extract userId from query params or auth header
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");
    const isAgent = url.searchParams.get("isAgent") === "true";
    const sessionId = url.searchParams.get("sessionId");

    if (userId) {
      ws.userId = userId;
      ws.isAgent = isAgent;
      clients.set(userId, ws);

      // If agent, add to agents map
      if (isAgent) {
        agents.set(userId, ws);
      }
    }

    // Send welcome message
    ws.send(JSON.stringify({
      type: "CONNECTED",
      message: "WebSocket connected",
      userId,
      sessionId,
    }));

    // Notify agents of new connection
    if (!isAgent && userId) {
      broadcastToAgents(JSON.stringify({
        type: "USER_CONNECTED",
        userId,
      }));
    }

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "CHAT_MESSAGE": {
            // Save message to database
            const dbMessage = await prisma.liveChatMessage.create({
              data: {
                sessionId: message.sessionId,
                senderId: message.senderId,
                isAgent: message.isAgent || false,
                message: message.text,
              },
            });

            // Send to recipient
            const recipientId = message.isAgent ? message.customerId : message.agentId;
            const recipient = clients.get(recipientId) || agents.get(recipientId);

            if (recipient?.readyState === WebSocket.OPEN) {
              recipient.send(JSON.stringify({
                type: "CHAT_MESSAGE",
                data: {
                  id: dbMessage.id,
                  sessionId: dbMessage.sessionId,
                  senderId: dbMessage.senderId,
                  isAgent: dbMessage.isAgent,
                  message: dbMessage.message,
                  createdAt: dbMessage.createdAt,
                },
              }));
            }

            // Also send to any other agent watching the same session
            if (message.isAgent) {
              broadcastToAgents(JSON.stringify({
                type: "MESSAGE_SEEN_BY_AGENT",
                sessionId: message.sessionId,
                message: message.text,
              }));
            }

            break;
          }

          case "CREATE_SESSION": {
            // Create new chat session
            const session = await prisma.liveChatSession.create({
              data: {
                userId: message.userId,
                status: "ACTIVE",
                productId: message.productId,
                orderId: message.orderId,
              },
            });

            // Assign to available agent
            if (agents.size > 0) {
              const [agentId] = agents.keys();
              await prisma.liveChatSession.update({
                where: { id: session.id },
                data: { agentId },
              });

              const agent = agents.get(agentId);
              if (agent?.readyState === WebSocket.OPEN) {
                agent.send(JSON.stringify({
                  type: "SESSION_ASSIGNED",
                  data: session,
                }));
              }
            }

            ws.send(JSON.stringify({
              type: "SESSION_CREATED",
              data: session,
            }));
            break;
          }

          case "TYPING": {
            // Broadcast typing indicator to the other party
            const targetId = message.isAgent ? message.customerId : message.agentId;
            const target = clients.get(targetId) || agents.get(targetId);
            if (target?.readyState === WebSocket.OPEN) {
              target.send(JSON.stringify({
                type: "TYPING",
                data: { isAgent: message.isAgent, userId: message.senderId },
              }));
            }
            break;
          }

          case "CLOSE_SESSION": {
            await prisma.liveChatSession.update({
              where: { id: message.sessionId },
              data: { status: "CLOSED" },
            });
            ws.send(JSON.stringify({
              type: "SESSION_CLOSED",
              data: { sessionId: message.sessionId },
            }));
            break;
          }
        }
      } catch (err) {
        ws.send(JSON.stringify({
          type: "ERROR",
          message: (err instanceof Error ? err.message : String(err)),
        }));
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        agents.delete(ws.userId);
      }
    });
  });

  return wss;
}
