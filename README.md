# n8n-dev-bridge MCPB Bundle

[![Build MCPB Bundle](https://github.com/mapachekurt/n8n-dev-bridge-mcpb/actions/workflows/build-mcpb.yml/badge.svg)](https://github.com/mapachekurt/n8n-dev-bridge-mcpb/actions/workflows/build-mcpb.yml)

Automated GitHub Actions workflow that builds secure MCPB bundles for the n8n-dev-bridge MCP server, converting JSON configuration to ready-to-install Claude Desktop extensions.

## 🚀 What This Does

Converts your existing n8n-dev-bridge JSON configuration:
```json
{
  "mcpServers": {
    "n8n-dev-bridge": {
      "command": "C:\\\\Program Files\\\\nodejs\\\\npx.cmd",
      "args": ["-y", "mcp-remote@latest", "https://czlonkowskin8n-mcp-railwaylatest-dev.up.railway.app/mcp", "--transport", "http-only", "--header", "Authorization:${AUTH_HEADER_DEV}"],
      "env": {"AUTH_HEADER_DEV": "Bearer zxT94kE8pLr62UNqV1dCB"}
    }
  }
}
```

Into a secure MCPB bundle with:
- 🔐 **Secure token storage** via Windows Credential Manager
- 🎯 **One-click installation** in Claude Desktop Extensions
- 🛠️ **Automatic updates** and enhanced error handling
- 🌐 **HTTP transport** to Railway-hosted n8n instance

## 📦 Installation (End Users)

### Quick Setup (3 steps):
1. **Download** latest [release artifacts](https://github.com/mapachekurt/n8n-dev-bridge-mcpb/releases/latest)
2. **Run** `setup-windows-credentials.ps1` as Administrator
3. **Install** `n8n-dev-bridge.mcpb` in Claude Desktop Extensions
4. **Remove** old JSON configuration from `claude_desktop_config.json`

### Detailed Instructions:

#### Step 1: Download Files
From the [latest release](https://github.com/mapachekurt/n8n-dev-bridge-mcpb/releases/latest), download:
- `n8n-dev-bridge.mcpb` - MCPB bundle
- `setup-windows-credentials.ps1` - Credential setup script
- `INSTALLATION.md` - Complete guide

#### Step 2: Setup Credentials
```powershell
# Run PowerShell as Administrator
.\setup-windows-credentials.ps1
```

This securely stores your Bearer token in Windows Credential Manager.

#### Step 3: Install in Claude Desktop
1. Open Claude Desktop
2. Go to **Settings → Extensions**
3. Drag `n8n-dev-bridge.mcpb` into the "Drag .MCPB files here" area
4. Follow installation prompts

#### Step 4: Clean up JSON Config
Edit your `claude_desktop_config.json` to remove the old n8n-dev-bridge entry:
```json
{
  "mcpServers": {
    // Remove the entire n8n-dev-bridge section
  }
}
```

#### Step 5: Test Installation
In Claude Desktop, try:
- "Check n8n health status"
- "List my n8n workflows"
- "Show available n8n nodes"

## 🛠️ Development

### For Developers:
```bash
# Clone repository
git clone https://github.com/mapachekurt/n8n-dev-bridge-mcpb.git
cd n8n-dev-bridge-mcpb

# Install dependencies
npm ci

# Build MCPB bundle locally
npm run build

# Setup credentials (Windows)
npm run credential-setup
```

### Build Process:
1. **Automated**: Push changes to trigger GitHub Actions build
2. **Manual**: Run `npm run build` locally
3. **Release**: Create version tags (`v1.0.0`) for automatic releases

### Repository Structure:
```
n8n-dev-bridge-mcpb/
├── .github/workflows/build-mcpb.yml  # GitHub Actions workflow
├── scripts/
│   ├── build-mcpb.js                 # Main build script
│   └── setup-windows-credentials.ps1 # Windows credential setup
├── package.json                      # Project configuration
├── README.md                         # This file
└── .gitignore                        # Git ignore rules
```

## ⚙️ Configuration

### Current Settings:
- **Endpoint**: `https://czlonkowskin8n-mcp-railwaylatest-dev.up.railway.app/mcp`
- **Transport**: HTTP-only via mcp-remote
- **Authentication**: Bearer token (Windows Credential Manager)
- **Node.js**: >=18.0.0 required

### Available n8n Tools:
- `list_nodes` - List n8n nodes with filtering
- `search_nodes` - Search nodes by keyword  
- `get_node_info` - Get detailed node information
- `n8n_create_workflow` - Create new workflows
- `n8n_list_workflows` - List existing workflows
- `n8n_get_workflow` - Get workflow details
- `n8n_health_check` - Check connectivity
- `validate_workflow` - Validate workflow structure
- `search_templates` - Search community templates

## 🔧 Troubleshooting

### Common Issues:

**1. "AUTH_HEADER_DEV not found"**
- Solution: Run `setup-windows-credentials.ps1` as Administrator
- Verify: Check Windows Credential Manager for stored token

**2. "MCPB bundle not found"**
- Solution: Run `npm run build` to generate bundle
- Check: Ensure Node.js 18+ is installed

**3. "Failed to start mcp-remote"**
- Solution: Verify Railway endpoint is accessible
- Check: Network connectivity and firewall settings

**4. Build fails in GitHub Actions**
- Solution: Check [Actions logs](https://github.com/mapachekurt/n8n-dev-bridge-mcpb/actions)
- Verify: All required files are committed

### Support:
- 🐛 **Report bugs**: [GitHub Issues](https://github.com/mapachekurt/n8n-dev-bridge-mcpb/issues)
- 📖 **Documentation**: See `INSTALLATION.md` in releases
- 🔄 **Updates**: Watch repository for new releases

## 📋 Requirements

### System Requirements:
- **OS**: Windows 10/11 (for Windows Credential Manager)
- **Node.js**: 18.0.0 or higher
- **Claude Desktop**: 0.11.0 or higher
- **PowerShell**: 5.1 or higher (for credential setup)

### Network Requirements:
- Access to `*.railway.app` domains
- HTTPS connectivity to Railway endpoints
- Port 443 outbound (standard HTTPS)

## 🚦 Build Status

- ✅ **Automated builds** on push to main/develop
- ✅ **Artifact uploads** for all successful builds  
- ✅ **GitHub releases** for version tags
- ✅ **Windows Credential Manager** integration
- ✅ **Enhanced error handling** and validation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ for the n8n and Claude Desktop communities**
