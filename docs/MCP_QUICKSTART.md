# ✅ MCP Setup - Quick Start Guide  

Your Geofranzy project is now configured with Model Context Protocol (MCP) servers for Firebase integration!

## 📋 What's Been Set Up

✓ `.mcp.json` - Master MCP configuration  
✓ `.mcp.env` - Firebase credentials (in .gitignore)  
✓ `.mcp.env.example` - Template for sharing  
✓ `mcp-servers/` - MCP server directory  
✓ Credentials configured and ready  

## 🚀 Using MCP with Claude/Copilot

### Option 1: VS Code with Claude Extension (Recommended)

1. **Open VS Code Settings** (Ctrl+,)
2. **Search for "MCP"** in settings
3. **Configure Claude extension** to use your `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "geofranzy-firebase": {
         "type": "http",
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

4. **Ask Claude questions about your Firebase data:**
   - "Query all users from the Firestore Users collection"
   - "Get user profile for UID: abc123def"
   - "List all emergency SOS alerts"
   - "Check my current location data"

### Option 2: Direct API Integration

If you're deploying Firebase Cloud Functions, they can directly use the service account:

```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  })
});
```

## 🔑 Credentials Configured

Your `.mcp.env` contains:
- ✓ Firebase Project ID: `geofrenzy-28807`
- ✓ Service Account Email: `firebase-adminsdk-fbsvc@geofrenzy-28807.iam.gserviceaccount.com`
- ✓ Private Key: Configured
- ✓ Stitch API Key: Configured

## 🛡️ Security Checklist

- [x] `.mcp.env` created (excluded from git)
- [x] `.gitignore` updated to protect credentials
- [x] Credentials are environment-variable based (not hardcoded)
- [ ] **ACTION**: Rotate credentials periodically in Firebase Console
- [ ] **ACTION**: Monitor Firebase activity for unauthorized access

## 📝 Available Firebase Operations

Once connected, you can use Claude to:

### Firestore Queries
- List users, their locations, and meeting history
- Query SOS alerts, weather data, friend relationships
- Filter by location, timestamp, status

### User Management
- Look up user profiles by UID
- Check account status and creation date
- Verify email and authentication details

### Storage Operations
- List profile photos and media
- Check file sizes and metadata
- Manage user uploads

### Real-time Updates
- Monitor active location sharing
- Track proximity alerts
- Watch emergency broadcasts

## 📚 Example Queries

Try asking Claude:

```
"Show me all users who shared their location in the last hour"
"List all active SOS alerts"
"Who has been near user abc123?"
"Get the meeting history for the friend pair X and Y"
"What's the weather data shared by my friends?"
```

## ⚙️ Advanced: Running Local MCP Server

For local development with full MCP capabilities:

```bash
cd mcp-servers
npm install
npm run firebase
```

This starts a local MCP server that Claude can connect to directly.

## 🔗 Next Steps

1. **Test with Claude**: Ask Claude to query your Firestore data
2. **Monitor Firebase**: Watch Firebase Console for API activity
3. **Expand Tools**: Add more Firebase operations to `mcp-servers/firebase-server.js`
4. ** Optimize Queries**: Use Claude to help optimize your Firestore indexes
5. **Deploy Cloud Functions**: Use MCP to help develop and deploy Firebase Functions

## 📖 Additional Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Claude Documentation](https://claude.ai/docs)

## ❓ Troubleshooting

**MCP Not Responding**
- Check `.mcp.env` exists and is readable
- Verify credentials are correct in Firebase Console
- Check network connectivity

**Permission Denied Errors**
- Verify service account role is "Editor" or has Firebase permissions
- Regenerate service account credentials in Firebase Console

**Credential Issues**
- Ensure private key format is correct (starts with `-----BEGIN PRIVATE KEY-----`)
- Check newlines are escaped as `\n` not literal newlines

---

**Status**: ✅ MCP Configuration Complete  
**Last Updated**: February 22, 2026  
**Project**: Geofranzy (React Native + Firebase)
