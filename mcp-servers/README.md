# MCP Servers for Geofranzy

This directory contains Model Context Protocol (MCP) server implementations for integrating with Claude/Copilot.

## Overview

- **firebase-server.ts** - Firebase MCP server with Firestore, Auth, and Storage access
- Supporting tools for database queries, writes, user auth lookups, and cloud storage

## Installation

```bash
cd mcp-servers
npm install
```

## Running the Servers

### Firebase Server (Recommended)

```bash
# On macOS/Linux
./start-firebase.sh

# On Windows PowerShell
.\start-firebase.ps1

# Or directly with npm
npm run firebase
```

### Watch Mode (Development)

```bash
npm run firebase:watch
```

## Available Tools

### Firestore Tools

**firestore_query**
- Query documents from any collection
- Filter by field conditions
- Limit results
- Example: Get all active SOS alerts

**firestore_write**
- Create or update documents
- Merge with existing data
- Auto-generate document IDs or use custom

**firestore_delete**
- Delete specific documents from collections

### Authentication Tools

**auth_user_info**
- Get user profile information
- Email, display name, creation date
- Verification status

### Storage Tools

**storage_list**
- List files in Firebase Storage
- Browse by prefix/folder
- Get file metadata (size, type, last updated)

## Environment Variables

The MCP servers read from `.mcp.env` in the project root:

```env
FIREBASE_PROJECT_ID=geofrenzy-28807
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@geofrenzy-28807.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
STITCH_API_KEY=your_stitch_api_key
```

## Integration with VS Code

1. Start the Firebase MCP server in a terminal:
   ```bash
   npm run firebase
   ```

2. The server will connect on stdio and await connections from Claude/Copilot

3. Ask Claude questions like:
   - "Query all users from Firestore"
   - "Get user info for UID: abc123"
   - "List profile photos in storage"

## Troubleshooting

### Server fails to start
- Check `.mcp.env` exists and has correct Firebase credentials
- Verify Node.js and npm are installed
- Clear node_modules: `rm -rf node_modules && npm install`

### Connection refused
- Ensure another instance isn't already running on the same port
- Check firewall settings
- Verify `.mcp.env` permissions are readable

### Firebase authentication fails
- Rotate credentials in Firebase Console
- Ensure service account has Editor role
- Verify private key format (should have `-----BEGIN` and `-----END`)

## Development

Edit `firebase-server.ts` to add new tools or modify existing ones. Tools must follow the MCP tool schema:

```typescript
{
  name: "tool_name",
  description: "What the tool does",
  inputSchema: {
    type: "object",
    properties: { /* parameters */ },
    required: ["required_param"]
  }
}
```

## Production Deployment

For production use:

1. Use a dedicated service account in Firebase
2. Restrict API key permissions in Google Cloud Console
3. Consider running MCPs in a separate secure environment
4. Monitor Firebase operations for unauthorized access
5. Implement audit logging
