#!/usr/bin/env node
/**
 * Geofranzy Project Memory MCP Server
 *
 * Persists full project context across sessions to a local JSON file.
 * Pre-seeded with everything known about the project: build history,
 * dependency decisions, architecture, blockers, and fixes tried.
 *
 * Memory file: mcp-servers/.project-memory.json  (gitignored)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE = join(__dirname, ".project-memory.json");

// ── Default project memory (pre-seeded with full project context) ─────────────

const DEFAULT_MEMORY = {
  _meta: {
    project: "geofranzy-rn",
    description: "React Native friend-tracking app with geofencing, maps, and notifications",
    created: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },

  project_overview: {
    name: "Geofranzy",
    slug: "geofranzy",
    package_id: "com.geofranzy.app",
    version: "1.0.0",
    stack: "React Native 0.74.1 + Expo SDK 51 + Firebase JS SDK v10 + Sentry 8.x",
    entry_point: "index.js -> App.tsx",
    expo_sdk: "51",
    react_native_version: "0.74.1",
    node_requirement: ">=18.0.0",
    expo_project_id: "d3631605-7999-4833-b5b9-140d2c4cc9cb",
    eas_account: "tori.islam.hira",
    firebase_project_id: "geofrenzy-28807",
    github_repo: "https://github.com/TorikulIslamHira/geofranzy",
    workspace_path: "D:\\Github\\geofranzy-rn",
  },

  architecture: {
    entry: "index.js → App.tsx",
    navigation: "@react-navigation/stack + @react-navigation/bottom-tabs",
    state_management: "Zustand stores (src/)",
    authentication: "Firebase Auth (email/password)",
    database: "Firestore (JS SDK, NOT native @react-native-firebase)",
    realtime_location: "expo-location + expo-task-manager (background task)",
    notifications: "expo-notifications + Firebase Cloud Messaging (FCM via Expo)",
    maps: "react-native-maps 1.10.0",
    error_tracking: "Sentry @sentry/react-native 8.1.0",
    offline_caching: "AsyncStorage + custom Zustand persistence",
    web_app: "Separate Vite/React app in web/ folder",
    theme: "Dark mode support (src/theme/)",
    testing: "Jest (mobile) + Vitest (web)",
    src_structure: "src/{components,context,hooks,navigation,screens,services,tests,theme,types,utils}",
  },

  build_configuration: {
    build_system: "EAS Build (Expo Application Services)",
    eas_json_profiles: {
      preview: "android APK + iOS simulator, env=preview",
      production: "store build, env=production",
    },
    android_build_type: "apk (preview profile)",
    android_architectures: "arm64-v8a only (set via expo-build-properties buildArchs)",
    gradle_version: "8.8",
    agp_version: "8.2.1 (from react-native gradle catalog)",
    kotlin_version: "1.9.23",
    compile_sdk: "34",
    min_sdk: "23",
    target_sdk: "34",
    hermes_enabled: true,
    new_arch_enabled: false,
    java_required: "JDK 17",
    java_installed: "Microsoft OpenJDK 17.0.18 at C:\\Program Files\\Microsoft\\jdk-17.0.18.8-hotspot",
    npmrc: "legacy-peer-deps=true (required to resolve expo peer conflicts on npm install)",
  },

  dependencies: {
    critical_note: "expo-modules-core is NOT auto-installed by expo@51. Must be explicit in package.json.",
    expo_modules_core: "^1.12.26 — MANUALLY ADDED Feb 22 2026 (was missing, caused Gradle 'expo-modules-core project not found' error)",
    sentry: "@sentry/react-native@^8.1.0 — no Expo plugin needed for v8.x",
    firebase: "firebase@^10.14.1 — JS SDK only (no native firebase packages)",
    react_native_maps: "react-native-maps@^1.10.0",
    graphql: "graphql@^16.12.0 — kept because @urql/core (Expo CLI dep) requires it",
    expo_build_properties: "^1.0.10 — used to set buildArchs and compileSdkVersion",
    expo_location: "^17.0.0",
    expo_notifications: "^0.28.0",
    expo_task_manager: "^11.0.0",
    expo_splash_screen: "^0.27.0",
    react_native_reanimated: "^3.8.0",
    react_native_gesture_handler: "^2.14.0",
    react_native_screens: "^3.29.0",
    react_native_safe_area_context: "^4.8.0",
    zustand: "^4.4.0",
    async_storage: "@react-native-async-storage/async-storage@^2.2.0",
  },

  removed_packages: {
    canvas: "Removed — caused native build failure, not needed",
    sharp: "Removed — caused native build failure, not needed",
    "@react-native-firebase_app": "Removed — required google-services.json, caused AAPT2 resource errors",
    "@react-native-firebase_messaging": "Removed — same reason as above",
    "@react-native-firebase_firestore": "Removed — same reason as above",
  },

  assets: {
    all_pngs: "69-byte minimal valid 1×1 PNG placeholders (have valid PNG signature 89 50 4E 47)",
    files: ["icon.png", "adaptive-icon.png", "splash.png", "favicon.png", "notification-icon.png"],
    notification_wav: "61484 bytes — valid WAV file",
    note: "expo prebuild generates proper sized icons from these placeholders",
    action_needed: "Replace placeholder PNGs with real artwork before production",
  },

  eas_build_history: {
    all_statuses: "ALL builds have errored",
    latest_build_id: "26d33bc3-b14c-40ed-9dc5-36e04bb7c418",
    latest_error_code: "EAS_BUILD_UNKNOWN_GRADLE_ERROR",
    latest_error_msg: "Gradle build failed with unknown error. See logs for 'Run gradlew' phase.",
    root_cause_identified: "expo-modules-core was missing from node_modules (not in package.json, expo@51 expects it as peer dep)",
    fix_committed: "expo-modules-core@^1.12.26 added to package.json, package-lock.json regenerated",
    post_fix_status: "New build (26d33bc3) triggered with fix — still errored, still under investigation",
    build_ids_tried: [
      "26d33bc3-b14c-40ed-9dc5-36e04bb7c418 — after expo-modules-core fix (errored)",
      "bde64d9a-70e4-4bbd-9385-1628d75a6b53 — after buildArchs limit (errored)",
      "da746ac5-6bcf-404c-845b-6e8c975881ef — after restoring graphql (errored)",
      "dd3c573-... — without @react-native-firebase packages (errored)",
      "6904a9f2-... — with .npmrc legacy-peer-deps (errored)",
    ],
    local_gradle_test: "Local ./gradlew assembleRelease also fails — confirms it is a real dependency/config issue, not EAS infra",
    local_gradle_error_1: "Project with path ':expo-modules-core' could not be found in project ':expo' (FIXED by adding expo-modules-core)",
    local_gradle_error_2: "com.android.builder.errors.EvalIssueException: compileSdkVersion is not specified (relates to expo-modules-core setup order)",
    local_gradle_error_3: "SDK location not found — ANDROID_HOME not set locally (fine on EAS where SDK is provided)",
  },

  ci_cd: {
    github_actions_workflows: {
      "ci.yml": "TypeScript check + Jest + Vitest + web build — runs on every push/PR",
      "eas-build.yml": "EAS Android/iOS builds — triggers on main push + manual workflow_dispatch",
      "release.yml": "Full release pipeline — web deploy to Firebase Hosting + production EAS build",
    },
    dependabot: ".github/dependabot.yml — weekly npm + GitHub Actions updates",
    required_github_secrets: [
      "EXPO_TOKEN — for EAS builds in CI",
      "VITE_FIREBASE_API_KEY — web app build",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_APP_ID",
      "FIREBASE_SERVICE_ACCOUNT — for firebase hosting deploy",
    ],
    git_remote_status: "NOT YET CONFIGURED — no origin set. Repo: https://github.com/TorikulIslamHira/geofranzy",
    current_branch: "master",
  },

  mcp_servers: {
    location: "mcp-servers/ directory",
    firebase_server: "mcp-servers/firebase-server.js — Firestore, Auth, Storage access via Firebase Admin SDK",
    docs_server: "mcp-servers/docs-server.js — npm registry + URL fetcher + Expo docs + GitHub raw files",
    memory_server: "mcp-servers/memory-server.js — THIS file, local JSON project memory",
    config: ".vscode/mcp.json — registers all three servers with VS Code Copilot",
    env_file: ".mcp.env — Firebase Admin credentials (gitignored)",
  },

  current_blockers: {
    gradle_build: "EAS build still failing with UNKNOWN_GRADLE_ERROR after expo-modules-core fix. Need to see full Gradle log from EAS dashboard to determine next step.",
    git_remote: "GitHub remote not configured. Need: git remote add origin https://github.com/TorikulIslamHira/geofranzy.git",
    env_variables: "Firebase env vars not set for production — needed for web build in CI",
    apk_on_phone: "Cannot test on physical device until EAS build succeeds",
  },

  next_actions: [
    "1. Open EAS build logs at https://expo.dev/accounts/tori.islam.hira/projects/geofranzy/builds/26d33bc3-b14c-40ed-9dc5-36e04bb7c418 and read the 'Run gradlew' phase logs",
    "2. git remote add origin https://github.com/TorikulIslamHira/geofranzy.git && git push -u origin master",
    "3. Add EXPO_TOKEN to GitHub Actions secrets so CI can trigger EAS builds",
    "4. Replace placeholder PNG assets with real app icons",
    "5. Test app locally with: expo start + Expo Go app on phone",
  ],

  environment: {
    os: "Windows 11",
    node_version: "v25.2.1 (installed)",
    java: "Microsoft OpenJDK 17.0.18 at C:\\Program Files\\Microsoft\\jdk-17.0.18.8-hotspot",
    android_sdk: "Not locally installed (ANDROID_HOME not set) — builds happen on EAS",
    expo_cli: "eas-cli installed globally",
  },
};

// ── Memory helpers ─────────────────────────────────────────────────────────────

function loadMemory() {
  if (!existsSync(MEMORY_FILE)) {
    writeFileSync(MEMORY_FILE, JSON.stringify(DEFAULT_MEMORY, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_MEMORY));
  }
  return JSON.parse(readFileSync(MEMORY_FILE, "utf8"));
}

function saveMemory(data) {
  data._meta.last_updated = new Date().toISOString();
  writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function setByPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof cur[keys[i]] !== "object" || cur[keys[i]] === null) {
      cur[keys[i]] = {};
    }
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function deleteByPath(obj, path) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) return false;
    cur = cur[keys[i]];
  }
  if (!(keys[keys.length - 1] in cur)) return false;
  delete cur[keys[keys.length - 1]];
  return true;
}

// ── MCP Server setup ──────────────────────────────────────────────────────────

const server = new Server(
  { name: "geofranzy-memory", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "recall_all",
      description:
        "Return the complete project memory. ALWAYS call this at the start of a new session to restore full project context before doing anything else.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "recall",
      description:
        "Get a specific value from memory using dot-notation key path. Examples: 'build_configuration', 'eas_build_history.root_cause_identified', 'current_blockers.gradle_build'",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Dot-notation key path, e.g. 'dependencies.expo_modules_core'" },
        },
        required: ["key"],
      },
    },
    {
      name: "remember",
      description:
        "Store a value in memory at a dot-notation key path. Creates nested objects as needed. Use this to save new findings, fixes, and decisions so they persist across sessions.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Dot-notation key, e.g. 'eas_build_history.latest_build_id'" },
          value: { description: "Value to store (string, number, object, array, boolean)" },
        },
        required: ["key", "value"],
      },
    },
    {
      name: "forget",
      description: "Remove a key from memory by dot-notation path.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string" },
        },
        required: ["key"],
      },
    },
    {
      name: "list_sections",
      description: "List all top-level memory section names.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "append_to_list",
      description:
        "Append an item to an array stored at a key. Creates the array if it does not exist.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Dot-notation key pointing to an array" },
          item: { description: "Item to append (any type)" },
        },
        required: ["key", "item"],
      },
    },
    {
      name: "log_build_event",
      description:
        "Append a structured build event to the build_log[] array. Automatically timestamped. Types: error | fix | success | info.",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["error", "fix", "success", "info"] },
          build_id: { type: "string", description: "EAS build ID (if applicable)" },
          message: { type: "string", description: "Human-readable description of the event" },
          details: { type: "object", description: "Optional extra key/value details" },
        },
        required: ["type", "message"],
      },
    },
    {
      name: "reset_to_defaults",
      description:
        "Reset the memory file to the built-in project defaults. WARNING: destroys all remembered updates. Use only if memory is corrupted.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {

      case "recall_all": {
        const memory = loadMemory();
        const display = { ...memory };
        delete display._internal;
        return {
          content: [{ type: "text", text: JSON.stringify(display, null, 2) }],
        };
      }

      case "recall": {
        const memory = loadMemory();
        const value = getByPath(memory, args.key);
        if (value === undefined) {
          const sections = Object.keys(memory).filter((k) => !k.startsWith("_"));
          return {
            content: [
              {
                type: "text",
                text: `Key "${args.key}" not found.\n\nAvailable top-level sections:\n${sections.map((s) => `  • ${s}`).join("\n")}`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
            },
          ],
        };
      }

      case "remember": {
        const memory = loadMemory();
        setByPath(memory, args.key, args.value);
        saveMemory(memory);
        const preview =
          typeof args.value === "string"
            ? args.value.slice(0, 80)
            : JSON.stringify(args.value).slice(0, 80);
        return {
          content: [{ type: "text", text: `✓ Saved: ${args.key} = ${preview}` }],
        };
      }

      case "forget": {
        const memory = loadMemory();
        const deleted = deleteByPath(memory, args.key);
        if (deleted) saveMemory(memory);
        return {
          content: [
            {
              type: "text",
              text: deleted ? `✓ Deleted: ${args.key}` : `Key "${args.key}" not found — nothing deleted.`,
            },
          ],
        };
      }

      case "list_sections": {
        const memory = loadMemory();
        const sections = Object.keys(memory).filter((k) => !k.startsWith("_"));
        return {
          content: [
            {
              type: "text",
              text: `Memory sections (${sections.length}):\n${sections.map((s) => `  • ${s}`).join("\n")}`,
            },
          ],
        };
      }

      case "append_to_list": {
        const memory = loadMemory();
        const existing = getByPath(memory, args.key);
        if (!Array.isArray(existing)) {
          setByPath(memory, args.key, [args.item]);
        } else {
          existing.push(args.item);
        }
        saveMemory(memory);
        return {
          content: [{ type: "text", text: `✓ Appended to ${args.key}` }],
        };
      }

      case "log_build_event": {
        const memory = loadMemory();
        if (!Array.isArray(memory.build_log)) {
          memory.build_log = [];
        }
        memory.build_log.push({
          timestamp: new Date().toISOString(),
          type: args.type,
          build_id: args.build_id ?? null,
          message: args.message,
          details: args.details ?? {},
        });
        // Cap at 100 entries
        if (memory.build_log.length > 100) {
          memory.build_log = memory.build_log.slice(-100);
        }
        saveMemory(memory);
        return {
          content: [
            {
              type: "text",
              text: `✓ Logged [${args.type.toUpperCase()}]: ${args.message}`,
            },
          ],
        };
      }

      case "reset_to_defaults": {
        const fresh = JSON.parse(JSON.stringify(DEFAULT_MEMORY));
        fresh._meta.created = new Date().toISOString();
        fresh._meta.last_updated = new Date().toISOString();
        writeFileSync(MEMORY_FILE, JSON.stringify(fresh, null, 2));
        return {
          content: [{ type: "text", text: "✓ Memory reset to built-in project defaults." }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// Expose memory as a readable resource
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "memory://geofranzy/project-context",
      name: "Geofranzy Full Project Context",
      description:
        "Complete project memory: stack, build history, dependency decisions, blockers, and next actions",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "memory://geofranzy/project-context") {
    const memory = loadMemory();
    return {
      contents: [
        {
          uri: "memory://geofranzy/project-context",
          mimeType: "application/json",
          text: JSON.stringify(memory, null, 2),
        },
      ],
    };
  }
  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[Memory MCP] Geofranzy project memory server running");
console.error(`[Memory MCP] Memory file: ${MEMORY_FILE}`);
