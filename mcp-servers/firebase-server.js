#!/usr/bin/env node
/**
 * Firebase MCP Server (JavaScript version)
 * Run with: node firebase-server.js
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Server, StdioServerTransport } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

dotenv.config({ path: "../.mcp.env" });

const server = new Server({
  name: "firebase-mcp-server",
  version: "1.0.0",
});

// Initialize Firebase Admin SDK
function initializeFirebase() {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!privateKey || !projectId || !clientEmail) {
      throw new Error(
        `Missing Firebase credentials. Check .mcp.env file.
       Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY`
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.error("[Firebase] ✓ Initialized successfully");
  } catch (error) {
    console.error("[Firebase] ✗ Initialization failed:", error.message);
    process.exit(1);
  }
}

// Tool handlers
async function handleFirestoreQuery(params) {
  const db = admin.firestore();
  let query = db.collection(params.collection);

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

async function handleFirestoreWrite(params) {
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

async function handleFirestoreDelete(params) {
  const db = admin.firestore();
  await db.collection(params.collection).doc(params.docId).delete();

  return JSON.stringify({
    success: true,
    docId: params.docId,
    collection: params.collection,
  });
}

async function handleAuthUserInfo(params) {
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

async function handleStorageList(params) {
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

// Tool definitions
const tools = {
  firestore_query: {
    description: "Query documents from Firestore collection",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name" },
        filter: { type: "object", description: "Query filters" },
        limit: { type: "number", description: "Result limit" },
      },
      required: ["collection"],
    },
  },
  firestore_write: {
    description: "Write/update document in Firestore",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name" },
        docId: { type: "string", description: "Document ID (auto if omitted)" },
        data: { type: "object", description: "Data to write" },
        merge: { type: "boolean", description: "Merge with existing" },
      },
      required: ["collection", "data"],
    },
  },
  firestore_delete: {
    description: "Delete document from Firestore",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name" },
        docId: { type: "string", description: "Document ID" },
      },
      required: ["collection", "docId"],
    },
  },
  auth_user_info: {
    description: "Get Firebase Auth user information",
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string", description: "User UID" },
      },
      required: ["uid"],
    },
  },
  storage_list: {
    description: "List files in Firebase Storage",
    inputSchema: {
      type: "object",
      properties: {
        prefix: { type: "string", description: "File path prefix" },
      },
    },
  },
};

// Register tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: params } = request.params;

  try {
    let result;

    switch (name) {
      case "firestore_query":
        result = await handleFirestoreQuery(params);
        break;
      case "firestore_write":
        result = await handleFirestoreWrite(params);
        break;
      case "firestore_delete":
        result = await handleFirestoreDelete(params);
        break;
      case "auth_user_info":
        result = await handleAuthUserInfo(params);
        break;
      case "storage_list":
        result = await handleStorageList(params);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [{ type: "text", text: result }] };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error.message}`, isError: true }] };
  }
});

// Register tools list
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

  console.error("[Firebase MCP Server] ✓ Started on stdio!");
  console.error("[Firebase MCP Server] Ready to receive requests...");
}

main().catch((error) => {
  console.error("[Firebase MCP Server] ✗ Fatal error:", error);
  process.exit(1);
});
