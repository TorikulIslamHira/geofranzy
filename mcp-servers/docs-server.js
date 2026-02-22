#!/usr/bin/env node
/**
 * Geofranzy Docs MCP Server
 *
 * Gives Copilot the ability to browse the internet for:
 *  - npm package info + peer deps  (live)
 *  - Expo SDK 51 compatibility table (live)
 *  - Any URL (docs pages, GitHub, changelogs)
 *  - React Native 0.74 release notes
 *  - EAS Build error reference
 *
 * Zero extra dependencies — uses Node 18+ built-in fetch.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fetch a URL, return text. Throws on non-2xx. */
async function fetchText(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Geofranzy MCP Docs Bot)",
      Accept: "text/html,application/json,*/*",
      ...headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return await res.text();
}

/** Fetch JSON from a URL. Throws on non-2xx. */
async function fetchJSON(url, headers = {}) {
  const text = await fetchText(url, { Accept: "application/json", ...headers });
  return JSON.parse(text);
}

/** Naïve HTML → readable text: strips tags, collapses whitespace. */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

/** Truncate long strings so they fit in context. */
function truncate(str, maxLen = 8000) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + `\n\n... [truncated — ${str.length - maxLen} more chars]`;
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "geofranzy-docs", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ──────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ── 1. fetch_url ────────────────────────────────────────────────────────
    {
      name: "fetch_url",
      description:
        "Fetch any URL and return its readable text content. Use for documentation pages, GitHub files, changelogs, or any web resource. HTML is stripped to readable text.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Full URL to fetch" },
          max_length: {
            type: "number",
            description: "Max characters to return (default 8000)",
          },
        },
        required: ["url"],
      },
    },

    // ── 2. check_npm_package ─────────────────────────────────────────────────
    {
      name: "check_npm_package",
      description:
        "Fetch live package info from the npm registry for any package. Returns latest version, all dist-tags, peerDependencies, peerDependenciesMeta, deprecation status, and homepage. Essential for debugging version conflicts.",
      inputSchema: {
        type: "object",
        properties: {
          package: {
            type: "string",
            description: "Package name, e.g. 'expo-modules-core' or '@sentry/react-native'",
          },
          version: {
            type: "string",
            description: "Specific version to inspect (optional, defaults to latest)",
          },
        },
        required: ["package"],
      },
    },

    // ── 3. check_expo_sdk51_compatibility ────────────────────────────────────
    {
      name: "check_expo_sdk51_compatibility",
      description:
        "Check the official Expo SDK 51 compatible version table. Returns the blessed/recommended version for a given package. Use this before adding any Expo-related dependency to avoid version mismatches that silently break Gradle.",
      inputSchema: {
        type: "object",
        properties: {
          package: {
            type: "string",
            description: "Package name to look up in the Expo SDK 51 compatibility table",
          },
        },
        required: ["package"],
      },
    },

    // ── 4. get_rn_upgrade_helper ─────────────────────────────────────────────
    {
      name: "get_rn_upgrade_helper",
      description:
        "Fetch the React Native upgrade helper diff between two versions. Useful for seeing exactly what android/ and ios/ files should look like for a given RN version.",
      inputSchema: {
        type: "object",
        properties: {
          from_version: { type: "string", description: "Current RN version, e.g. '0.73.0'" },
          to_version: { type: "string", description: "Target RN version, e.g. '0.74.1'" },
        },
        required: ["from_version", "to_version"],
      },
    },

    // ── 5. search_expo_docs ──────────────────────────────────────────────────
    {
      name: "search_expo_docs",
      description:
        "Fetch an Expo documentation page by its path slug. Returns the full doc page text. Examples: 'versions/v51.0.0/sdk/location', 'build-reference/eas-json', 'eas/build/internal-distribution'.",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "Expo docs path after https://docs.expo.dev/, e.g. 'build-reference/local-builds'",
          },
        },
        required: ["slug"],
      },
    },

    // ── 6. check_eas_build_error ─────────────────────────────────────────────
    {
      name: "check_eas_build_error",
      description:
        "Fetch EAS Build troubleshooting docs for a specific error code or search term. Current known codes: EAS_BUILD_UNKNOWN_GRADLE_ERROR, EAS_BUILD_GRADLE_CONFIGURATION_ERROR, INSTALL_DEPENDENCIES_FAILED.",
      inputSchema: {
        type: "object",
        properties: {
          error_code: {
            type: "string",
            description: "EAS error code or search term, e.g. 'EAS_BUILD_UNKNOWN_GRADLE_ERROR'",
          },
        },
        required: ["error_code"],
      },
    },

    // ── 7. compare_package_versions ─────────────────────────────────────────
    {
      name: "compare_package_versions",
      description:
        "Compare multiple npm packages at once — returns their latest versions and peer deps side by side. Useful for auditing the full Expo/RN dependency tree before a build.",
      inputSchema: {
        type: "object",
        properties: {
          packages: {
            type: "array",
            items: { type: "string" },
            description: "List of package names to compare",
          },
        },
        required: ["packages"],
      },
    },

    // ── 8. get_github_file ───────────────────────────────────────────────────
    {
      name: "get_github_file",
      description:
        "Fetch the raw content of any file from a public GitHub repository. Useful for reading upstream build.gradle, CHANGELOG.md, or package.json from library repos.",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "GitHub owner, e.g. 'expo'" },
          repo: { type: "string", description: "Repository name, e.g. 'expo'" },
          path: { type: "string", description: "File path in the repo, e.g. 'packages/expo-modules-core/android/build.gradle'" },
          ref: { type: "string", description: "Branch/tag/commit (default: HEAD)" },
        },
        required: ["owner", "repo", "path"],
      },
    },
  ],
}));

// ── Tool handlers ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {

      // ── fetch_url ─────────────────────────────────────────────────────────
      case "fetch_url": {
        const text = await fetchText(args.url);
        const cleaned = text.trim().startsWith("<")
          ? htmlToText(text)
          : text;
        return {
          content: [{ type: "text", text: truncate(cleaned, args.max_length ?? 8000) }],
        };
      }

      // ── check_npm_package ─────────────────────────────────────────────────
      case "check_npm_package": {
        const pkg = args.package;
        const encoded = pkg.replace("/", "%2F");
        const data = await fetchJSON(`https://registry.npmjs.org/${encoded}`);

        const version = args.version ?? data["dist-tags"]?.latest;
        const vData = data.versions?.[version] ?? {};

        const result = {
          name: data.name,
          description: data.description?.slice(0, 200),
          latest: data["dist-tags"]?.latest,
          queried_version: version,
          dist_tags: data["dist-tags"],
          deprecated:
            vData.deprecated ??
            data.versions?.[data["dist-tags"]?.latest]?.deprecated ??
            null,
          peerDependencies: vData.peerDependencies ?? null,
          peerDependenciesMeta: vData.peerDependenciesMeta ?? null,
          dependencies: vData.dependencies ?? null,
          engines: vData.engines ?? null,
          homepage: data.homepage ?? vData.homepage ?? null,
          repository: typeof data.repository === "object"
            ? data.repository?.url
            : data.repository ?? null,
          all_versions: Object.keys(data.versions ?? {}).slice(-20),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ── check_expo_sdk51_compatibility ────────────────────────────────────
      case "check_expo_sdk51_compatibility": {
        // Expo publishes a compatibility data file for each SDK
        const data = await fetchJSON(
          "https://api.expo.dev/v2/sdks/51/dependencies"
        ).catch(() => null);

        // Fallback: fetch from the npm package itself
        if (!data) {
          const encoded = args.package.replace("/", "%2F");
          const npmData = await fetchJSON(
            `https://registry.npmjs.org/${encoded}`
          );
          const latest = npmData["dist-tags"]?.latest;
          const sdk51Tags = Object.keys(npmData["dist-tags"] ?? {}).filter(
            (t) => t.includes("sdk-51") || t.includes("51")
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    package: args.package,
                    latest,
                    sdk51_tags: sdk51Tags,
                    note: "Expo compatibility API unavailable — showing npm data",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const pkgMatch = (data.dependencies ?? []).find(
          (d) =>
            d.packageName === args.package ||
            d.packageName?.toLowerCase() === args.package?.toLowerCase()
        );

        return {
          content: [
            {
              type: "text",
              text: pkgMatch
                ? JSON.stringify(pkgMatch, null, 2)
                : `Package "${args.package}" not found in Expo SDK 51 compatibility table.\n\nAll packages:\n${(data.dependencies ?? [])
                    .map((d) => `${d.packageName}: ${d.version}`)
                    .join("\n")}`,
            },
          ],
        };
      }

      // ── get_rn_upgrade_helper ─────────────────────────────────────────────
      case "get_rn_upgrade_helper": {
        const url = `https://react-native-community.github.io/upgrade-helper/?from=${args.from_version}&to=${args.to_version}`;
        // The helper is a SPA — fetch the underlying diff JSON from the GH releases
        const diffUrl = `https://raw.githubusercontent.com/react-native-community/rn-diff-purge/main/diffs/${args.from_version}..${args.to_version}.diff`;
        let text;
        try {
          text = await fetchText(diffUrl);
        } catch {
          text = `Diff not found at ${diffUrl}.\nTry opening the upgrade helper at:\n${url}`;
        }
        return {
          content: [{ type: "text", text: truncate(text, 10000) }],
        };
      }

      // ── search_expo_docs ──────────────────────────────────────────────────
      case "search_expo_docs": {
        const slug = args.slug.replace(/^\//, "");
        const url = `https://docs.expo.dev/${slug}`;
        const html = await fetchText(url);
        const text = htmlToText(html);
        return {
          content: [{ type: "text", text: truncate(text) }],
        };
      }

      // ── check_eas_build_error ─────────────────────────────────────────────
      case "check_eas_build_error": {
        const slug = "build-reference/build-errors";
        const url = `https://docs.expo.dev/${slug}`;
        const html = await fetchText(url);
        const full = htmlToText(html);

        // Try to surface the relevant section
        const errorCode = args.error_code.toUpperCase();
        const idx = full.toUpperCase().indexOf(errorCode);
        const snippet =
          idx !== -1
            ? full.slice(Math.max(0, idx - 200), idx + 2000)
            : `Error code "${args.error_code}" not found in docs page.\n\nFull page (truncated):\n${truncate(full, 5000)}`;

        return {
          content: [{ type: "text", text: snippet }],
        };
      }

      // ── compare_package_versions ──────────────────────────────────────────
      case "compare_package_versions": {
        const results = await Promise.allSettled(
          args.packages.map(async (pkg) => {
            const encoded = pkg.replace("/", "%2F");
            const data = await fetchJSON(
              `https://registry.npmjs.org/${encoded}`
            );
            const latest = data["dist-tags"]?.latest;
            const vData = data.versions?.[latest] ?? {};
            return {
              name: pkg,
              latest,
              deprecated: vData.deprecated ?? null,
              peerDeps: vData.peerDependencies ?? null,
              engines: vData.engines ?? null,
            };
          })
        );

        const output = results.map((r, i) =>
          r.status === "fulfilled"
            ? r.value
            : { name: args.packages[i], error: r.reason?.message }
        );

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        };
      }

      // ── get_github_file ───────────────────────────────────────────────────
      case "get_github_file": {
        const ref = args.ref ?? "HEAD";
        const url = `https://raw.githubusercontent.com/${args.owner}/${args.repo}/${ref}/${args.path}`;
        const text = await fetchText(url);
        return {
          content: [{ type: "text", text: truncate(text, 10000) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [
        { type: "text", text: `Error: ${err.message}\n\nStack: ${err.stack ?? ""}` },
      ],
      isError: true,
    };
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[Docs MCP] Geofranzy docs & npm browser running");
