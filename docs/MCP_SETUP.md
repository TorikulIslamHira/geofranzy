# MCP (Model Context Protocol) Configuration Guide

## Overview

This project is configured to use two Model Context Protocol servers:
1. **Stitch with Google** - For Google services integration
2. **Firebase** - For cloud function and database operations

## Files

- `.mcp.json` - MCP server definitions
- `.mcp.env.example` - Template for environment variables
- `.mcp.env` - Your actual credentials (⚠️ DO NOT COMMIT)

## Quick Setup

### 1. Create .mcp.env file

Copy the example and add your credentials:

```bash
cp .mcp.env.example .mcp.env
```

Edit `.mcp.env` and add your actual credentials:

```env
STITCH_API_KEY=your_actual_stitch_api_key
FIREBASE_PROJECT_ID=geofrenzy-28807
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@geofrenzy-28807.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Use in VS Code

The MCP configuration is automatically available when using Claude/Copilot tools within VS Code.

## Security Best Practices

⚠️ **CRITICAL SECURITY NOTES**:

1. **Never commit `.mcp.env`** - It's in `.gitignore` to prevent accidental exposure
2. **Rotate credentials** - If ever exposed in git, regenerate in Google Cloud Console
3. **Use service account roles** - Restrict Firebase service account to minimum required permissions
4. **Monitor API usage** - Check Google Cloud Console for unauthorized usage

## Firebase MCP Capabilities

With Firebase MCP connected, Claude can help with:

- Firestore database operations and queries
- Cloud Functions deployment and debugging
- Authentication rule updates
- Real-time database operations
- Storage rule management
- Field indexing optimization

## Stitch MCP Capabilities

With Stitch MCP connected, Claude can help with:

- Google API integrations
- Google Workspace integration
- Google Cloud resources management
- Service-to-service communication

## Troubleshooting

### MCP not responding
- Verify `.mcp.env` exists and has correct values
- Check API key is valid in Google Cloud Console
- Ensure Firebase service account has required IAM permissions

### Permission denied errors
- In Firebase Console → Service Accounts, update the service account role
- Required roles: `Editor` or custom role with `firebase.*` permissions

### Private key format issues
- Private key must start with `-----BEGIN PRIVATE KEY-----`
- Ensure newlines are represented as `\n` in `.mcp.env`

## Updating Credentials

If you need to rotate credentials:

1. **Google API Key**: Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services
2. **Firebase Service Account**: Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts

Then update `.mcp.env` with new values.

## More Information

- [MCP Specification](https://modelcontextprotocol.io)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Cloud APIs](https://cloud.google.com/docs)
