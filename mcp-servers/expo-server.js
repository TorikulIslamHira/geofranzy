#!/usr/bin/env node
/**
 * Geofranzy — Expo.dev MCP Server
 *
 * Provides direct access to EAS Build, EAS Update, and Expo project data
 * via the Expo GraphQL API for the geofranzy project.
 *
 * Tools:
 *  list_builds            – List recent EAS builds (with filters)
 *  get_build              – Full build details + error + log URLs
 *  get_build_logs         – Download & surface build log content
 *  trigger_build          – Kick off a new EAS build via CLI
 *  cancel_build           – Cancel an in-progress build
 *  get_project_info       – App metadata, owner account, icon
 *  list_update_branches   – EAS Update branches + recent updates
 *  list_submissions       – App Store / Play Store submissions
 *
 * Configuration (env vars, set in .vscode/mcp.json):
 *   EXPO_TOKEN    – Expo personal/project access token
 *   EXPO_APP_ID   – EAS app UUID (default: geofranzy project ID)
 *   EXPO_ACCOUNT  – Expo account name (default: tori.islam.hira)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { spawnSync } from 'node:child_process';

// ── Config ────────────────────────────────────────────────────────────────────
const TOKEN    = process.env.EXPO_TOKEN    || 'eTrx_tGrgUXG4MONQXZZJX6w8cPb6WNk_FVsZ82d';
const APP_ID   = process.env.EXPO_APP_ID   || 'd3631605-7999-4833-b5b9-140d2c4cc9cb';
const ACCOUNT  = process.env.EXPO_ACCOUNT  || 'tori.islam.hira';
const GQL_URL  = 'https://api.expo.dev/graphql';

// ── GraphQL helper ─────────────────────────────────────────────────────────────
async function gql(query, variables = {}) {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'expo-platform': 'web',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    const msgs = json.errors.map(e => e.message).join('; ');
    throw new Error(`Expo GQL error: ${msgs}`);
  }
  return json.data;
}

// ── GraphQL fragments ──────────────────────────────────────────────────────────
const BUILD_FRAGMENT = `
  id
  status
  platform
  buildProfile
  createdAt
  completedAt
  updatedAt
  appVersion
  sdkVersion
  gitCommitHash
  gitCommitMessage
  error { message errorCode }
  artifacts { buildUrl applicationArchiveUrl buildArtifactsUrl xcodeBuildLogsUrl }
  metrics { buildWaitTime buildQueueTime buildDuration }
`;

// ── Tools definition ───────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'list_builds',
    description:
      'List recent EAS builds for the geofranzy project. Returns status, platform, profile, commit, error message, and download URL.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max builds to return (default 10, max 50)',
        },
        platform: {
          type: 'string',
          enum: ['ANDROID', 'IOS', 'ALL'],
          description: 'Filter by platform (default ALL)',
        },
        status: {
          type: 'string',
          enum: ['FINISHED', 'ERRORED', 'IN_PROGRESS', 'CANCELED', 'NEW'],
          description: 'Filter by build status',
        },
        profile: {
          type: 'string',
          description: 'Filter by build profile (e.g. preview, production)',
        },
      },
    },
  },
  {
    name: 'get_build',
    description:
      'Get full details of a specific EAS build including error, artifacts, log file URLs, and metrics.',
    inputSchema: {
      type: 'object',
      required: ['buildId'],
      properties: {
        buildId: {
          type: 'string',
          description: 'EAS build UUID (e.g. 77b0096a-758f-4003-9892-8a7c1d235d14)',
        },
        includeLogs: {
          type: 'boolean',
          description: 'Include signed log file URLs (default true)',
        },
      },
    },
  },
  {
    name: 'get_build_logs',
    description:
      'Download and return the text content of EAS build logs. Automatically surfaces the most relevant section for errors (Run gradlew, npm install, etc.). Useful for diagnosing Gradle or npm failures without opening a browser.',
    inputSchema: {
      type: 'object',
      required: ['buildId'],
      properties: {
        buildId: {
          type: 'string',
          description: 'EAS build UUID',
        },
        maxChars: {
          type: 'number',
          description: 'Max characters to return per log file (default 8000)',
        },
        filter: {
          type: 'string',
          description: 'Search string to filter log lines (e.g. "FAILURE", "error", "gradlew")',
        },
      },
    },
  },
  {
    name: 'trigger_build',
    description:
      'Trigger a new EAS build for geofranzy. Uses the EAS CLI (must be installed). Returns the build URL.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['android', 'ios', 'all'],
          description: 'Target platform (default android)',
        },
        profile: {
          type: 'string',
          enum: ['preview', 'preview2', 'preview3', 'production'],
          description: 'Build profile from eas.json (default preview)',
        },
        clearCache: {
          type: 'boolean',
          description: 'Pass --clear-cache flag to EAS build (default false)',
        },
      },
    },
  },
  {
    name: 'cancel_build',
    description: 'Cancel an in-progress EAS build.',
    inputSchema: {
      type: 'object',
      required: ['buildId'],
      properties: {
        buildId: {
          type: 'string',
          description: 'EAS build UUID to cancel',
        },
      },
    },
  },
  {
    name: 'get_project_info',
    description:
      'Get geofranzy project metadata from Expo: app ID, slug, icon, owner account. Useful to verify project linkage and overview.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_update_branches',
    description:
      'List EAS Update branches (channels) for geofranzy and their most recent updates.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max branches to return (default 10)',
        },
        updatesPerBranch: {
          type: 'number',
          description: 'Recent updates to show per branch (default 3)',
        },
      },
    },
  },
  {
    name: 'list_submissions',
    description:
      'List recent App Store / Play Store submissions for geofranzy.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max submissions to return (default 5)',
        },
      },
    },
  },
];

// ── Tool Handlers ──────────────────────────────────────────────────────────────
async function listBuilds({ limit = 10, platform, status, profile } = {}) {
  const lim = Math.min(limit, 50);
  const data = await gql(
    `query($id:String!, $limit:Int!){
      app { byId(appId:$id) {
        builds(limit:$limit, offset:0) {
          ${BUILD_FRAGMENT}
        }
      } }
    }`,
    { id: APP_ID, limit: lim }
  );
  let builds = data.app.byId.builds;
  if (platform && platform !== 'ALL') builds = builds.filter(b => b.platform === platform);
  if (status)   builds = builds.filter(b => b.status === status);
  if (profile)  builds = builds.filter(b => b.buildProfile === profile);

  return builds.map(b => ({
    id: b.id,
    status: b.status,
    platform: b.platform,
    profile: b.buildProfile,
    appVersion: b.appVersion,
    sdkVersion: b.sdkVersion,
    commit: b.gitCommitHash?.slice(0, 8),
    commitMessage: b.gitCommitMessage,
    error: b.error?.message ?? null,
    downloadUrl: b.artifacts?.applicationArchiveUrl ?? b.artifacts?.buildUrl ?? null,
    createdAt: b.createdAt,
    completedAt: b.completedAt,
    durationSeconds: b.metrics?.buildDuration ?? null,
    logsUrl: `https://expo.dev/accounts/${ACCOUNT}/projects/geofranzy/builds/${b.id}`,
  }));
}

async function getBuild({ buildId, includeLogs = true } = {}) {
  const query = `query($id:ID!){
    builds { byId(buildId:$id) {
      ${BUILD_FRAGMENT}
      ${includeLogs ? 'logFiles' : ''}
      runFromCI
      priority
      queuePosition
      estimatedWaitTimeLeftSeconds
      canRetry
    } }
  }`;
  const data = await gql(query, { id: buildId });
  const b = data.builds.byId;
  return {
    id: b.id,
    status: b.status,
    platform: b.platform,
    profile: b.buildProfile,
    appVersion: b.appVersion,
    sdkVersion: b.sdkVersion,
    gitCommitHash: b.gitCommitHash,
    gitCommitMessage: b.gitCommitMessage,
    error: b.error ?? null,
    artifacts: {
      buildUrl: b.artifacts?.buildUrl ?? null,
      applicationArchiveUrl: b.artifacts?.applicationArchiveUrl ?? null,
      buildArtifactsUrl: b.artifacts?.buildArtifactsUrl ?? null,
      xcodeBuildLogsUrl: b.artifacts?.xcodeBuildLogsUrl ?? null,
    },
    metrics: b.metrics ?? null,
    logFileUrls: includeLogs ? (b.logFiles ?? []) : [],
    timeline: {
      createdAt: b.createdAt,
      completedAt: b.completedAt,
      updatedAt: b.updatedAt,
    },
    logsUrl: `https://expo.dev/accounts/${ACCOUNT}/projects/geofranzy/builds/${b.id}`,
    canRetry: b.canRetry ?? false,
    runFromCI: b.runFromCI ?? false,
  };
}

async function getBuildLogs({ buildId, maxChars = 8000, filter } = {}) {
  // First get log file URLs
  const data = await gql(
    'query($id:ID!){ builds { byId(buildId:$id) { status error { message errorCode } logFiles } } }',
    { id: buildId }
  );
  const build = data.builds.byId;
  const logUrls = build.logFiles ?? [];

  if (logUrls.length === 0) {
    return {
      buildId,
      status: build.status,
      error: build.error ?? null,
      message: 'No log files available for this build.',
      logs: [],
    };
  }

  // Download each log file and collect results
  const logs = [];
  for (let i = 0; i < logUrls.length; i++) {
    const url = logUrls[i];
    try {
      const res = await fetch(url);
      if (!res.ok) {
        logs.push({ index: i, error: `HTTP ${res.status}`, url });
        continue;
      }
      let text = await res.text();
      // Filter lines if requested
      if (filter) {
        const re = new RegExp(filter, 'i');
        const filtered = text.split('\n').filter(l => re.test(l));
        text = filtered.join('\n');
      }
      // Truncate to maxChars
      if (text.length > maxChars) {
        text = '...[truncated to last ' + maxChars + ' chars]...\n' + text.slice(-maxChars);
      }
      logs.push({ index: i, content: text, url });
    } catch (err) {
      logs.push({ index: i, error: err.message, url });
    }
  }

  return {
    buildId,
    status: build.status,
    error: build.error ?? null,
    logCount: logUrls.length,
    logs,
  };
}

function triggerBuild({ platform = 'android', profile = 'preview', clearCache = false } = {}) {
  const args = ['eas', 'build', '--platform', platform, '--profile', profile, '--non-interactive'];
  if (clearCache) args.push('--clear-cache');

  const result = spawnSync('npx', args, {
    cwd: process.env.WORKSPACE_ROOT || process.cwd(),
    env: { ...process.env, EXPO_TOKEN: TOKEN },
    encoding: 'utf8',
    timeout: 60000,
  });

  const output = (result.stdout || '') + (result.stderr || '');
  // Extract build URL from output
  const urlMatch = output.match(/https:\/\/expo\.dev\/accounts\/[^\s]+\/builds\/[a-f0-9-]+/);
  return {
    success: result.status === 0,
    buildUrl: urlMatch ? urlMatch[0] : null,
    output: output.slice(-4000),
    exitCode: result.status,
  };
}

async function cancelBuild({ buildId } = {}) {
  const data = await gql(
    'mutation($id:ID!){ buildCancel(buildId:$id) { id status } }',
    { id: buildId }
  );
  return data.buildCancel;
}

async function getProjectInfo() {
  const data = await gql(
    `query($id:String!){
      app { byId(appId:$id) {
        id slug name
        icon { url }
        ownerAccount { id name }
        updateBranches(limit:5,offset:0) { id name }
        submissions(limit:3,offset:0,filter:{}) { id status platform createdAt }
      } }
    }`,
    { id: APP_ID }
  );
  const app = data.app.byId;
  return {
    id: app.id,
    slug: app.slug,
    name: app.name,
    iconUrl: app.icon?.url ?? null,
    ownerAccount: app.ownerAccount?.name ?? ACCOUNT,
    updateBranches: (app.updateBranches ?? []).map(b => b.name),
    recentSubmissions: (app.submissions ?? []).map(s => ({
      id: s.id,
      status: s.status,
      platform: s.platform,
      createdAt: s.createdAt,
    })),
    dashboardUrl: `https://expo.dev/accounts/${ACCOUNT}/projects/geofranzy`,
  };
}

async function listUpdateBranches({ limit = 10, updatesPerBranch = 3 } = {}) {
  const data = await gql(
    `query($id:String!, $limit:Int!, $offset:Int!, $uLimit:Int!){
      app { byId(appId:$id) {
        updateBranches(limit:$limit, offset:$offset) {
          id name
          updates(limit:$uLimit, offset:0) {
            id message createdAt runtimeVersion
          }
        }
      } }
    }`,
    { id: APP_ID, limit, offset: 0, uLimit: updatesPerBranch }
  );
  return (data.app.byId.updateBranches ?? []).map(b => ({
    id: b.id,
    name: b.name,
    recentUpdates: (b.updates ?? []).map(u => ({
      id: u.id,
      message: u.message,
      createdAt: u.createdAt,
      runtimeVersion: u.runtimeVersion,
    })),
  }));
}

async function listSubmissions({ limit = 5 } = {}) {
  const data = await gql(
    `query($id:String!, $limit:Int!, $offset:Int!){
      app { byId(appId:$id) {
        submissions(limit:$limit, offset:$offset, filter:{}) {
          id status platform createdAt
        }
      } }
    }`,
    { id: APP_ID, limit, offset: 0 }
  );
  return data.app.byId.submissions ?? [];
}

// ── MCP Server ─────────────────────────────────────────────────────────────────
const server = new Server(
  { name: 'geofranzy-expo', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  let result;
  try {
    switch (name) {
      case 'list_builds':           result = await listBuilds(args);          break;
      case 'get_build':             result = await getBuild(args);            break;
      case 'get_build_logs':        result = await getBuildLogs(args);        break;
      case 'trigger_build':         result = triggerBuild(args);              break;
      case 'cancel_build':          result = await cancelBuild(args);         break;
      case 'get_project_info':      result = await getProjectInfo(args);      break;
      case 'list_update_branches':  result = await listUpdateBranches(args);  break;
      case 'list_submissions':      result = await listSubmissions(args);     break;
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error calling ${name}: ${err.message}` }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
});

// ── Start ──────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
