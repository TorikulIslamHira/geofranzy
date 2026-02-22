#!/usr/bin/env node
/**
 * Firebase MCP Server
 * Provides Model Context Protocol access to Firebase services
 */

import {
  Server,
  StdioServerTransport,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".mcp.env" });

const server = new Server({
  name: "firebase-mcp-server",
  version: "1.0.0",
});

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

function initializeFirebase() {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!privateKey || !projectId || !clientEmail) {
      throw new Error("Missing Firebase credentials in .mcp.env");
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      } as admin.ServiceAccount),
    });

    console.error("[Firebase] Initialized successfully");
  } catch (error) {
    console.error("[Firebase] Initialization failed:", error);
    process.exit(1);
  }
}

// Tool implementations
const tools = {
  firestore_query: {
    description: "Query Firestore database",
    inputSchema: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: "Firestore collection name",
        },
        filter: {
          type: "object",
          description: "Query filter conditions",
        },
        limit: {
          type: "number",
          description: "Limit number of results",
        },
      },
      required: ["collection"],
    },
  },
  firestore_write: {
    description: "Write data to Firestore",
    inputSchema: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: "Firestore collection name",
        },
        docId: {
          type: "string",
          description: "Document ID (optional, auto-generated if omitted)",
        },
        data: {
          type: "object",
          description: "Data to write",
        },
        merge: {
          type: "boolean",
          description: "Merge with existing data (default: false)",
        },
      },
      required: ["collection", "data"],
    },
  },
  firestore_delete: {
    description: "Delete document from Firestore",
    inputSchema: {
      type: "object",
      properties: {
        collection: {
          type: "string",
          description: "Firestore collection name",
        },
        docId: {
          type: "string",
          description: "Document ID",
        },
      },
      required: ["collection", "docId"],
    },
  },
  auth_user_info: {
    description: "Get Firebase Auth user information",
    inputSchema: {
      type: "object",
      properties: {
        uid: {
          type: "string",
          description: "User UID",
        },
      },
      required: ["uid"],
    },
  },
  storage_list: {
    description: "List files in Firebase Storage bucket",
    inputSchema: {
      type: "object",
      properties: {
        prefix: {
          type: "string",
          description: "File path prefix",
        },
      },
    },
  },
};

// Tool handlers
async function handleFirestoreQuery(params: {
  collection: string;
  filter?: Record<string, unknown>;
  limit?: number;
}): Promise<string> {
  const db = admin.firestore();
  let query: admin.firestore.Query = db.collection(params.collection);

  if (params.filter) {
    for (const [field, value] of Object.entries(params.filter)) {
      query = query.where(field, "==", value);
    }
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return JSON.stringify(docs, null, 2);
}

async function handleFirestoreWrite(params: {
  collection: string;
  docId?: string;
  data: Record<string, unknown>;
  merge?: boolean;
}): Promise<string> {
  const db = admin.firestore();
  const ref = params.docId
    ? db.collection(params.collection).doc(params.docId)
    : db.collection(params.collection).doc();

  await ref.set(params.data, { merge: params.merge ?? false });

  return JSON.stringify({
    success: true,
    docId: ref.id,
    collection: params.collection,
  });
}

async function handleFirestoreDelete(params: {
  collection: string;
  docId: string;
}): Promise<string> {
  const db = admin.firestore();
  await db.collection(params.collection).doc(params.docId).delete();

  return JSON.stringify({
    success: true,
    docId: params.docId,
    collection: params.collection,
  });
}

async function handleAuthUserInfo(params: { uid: string }): Promise<string> {
  const auth = admin.auth();
  const user = await auth.getUser(params.uid);

  return JSON.stringify({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    disabled: user.disabled,
    emailVerified: user.emailVerified,
    createdAt: user.metadata?.creationTime,
  });
}

async function handleStorageList(params: { prefix?: string }): Promise<string> {
  const storage = admin.storage();
  const bucket = storage.bucket();
  const [files] = await bucket.getFiles({
    prefix: params.prefix || "",
  });

  return JSON.stringify(
    files.map((file) => ({
      name: file.name,
      size: file.metadata.size,
      updated: file.metadata.updated,
      contentType: file.metadata.contentType,
    })),
    null,
    2
  );
}

// Register tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: params } = request.params;

  try {
    let result: string;

    switch (name) {
      case "firestore_query":
        result = await handleFirestoreQuery(
          params as Parameters<typeof handleFirestoreQuery>[0]
        );
        break;
      case "firestore_write":
        result = await handleFirestoreWrite(
          params as Parameters<typeof handleFirestoreWrite>[0]
        );
        break;
      case "firestore_delete":
        result = await handleFirestoreDelete(
          params as Parameters<typeof handleFirestoreDelete>[0]
        );
        break;
      case "auth_user_info":
        result = await handleAuthUserInfo(
          params as Parameters<typeof handleAuthUserInfo>[0]
        );
        break;
      case "storage_list":
        result = await handleStorageList(
          params as Parameters<typeof handleStorageList>[0]
        );
        break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    return { content: [{ type: "text", text: result }] };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, message);
  }
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(tools).map(([name, config]) => ({
      name,
      ...config,
    })),
  };
});

// Start server
async function main() {
  initializeFirebase();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[Firebase MCP Server] Started on stdio");
}

main().catch(console.error);
