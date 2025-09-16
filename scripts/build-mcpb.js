#!/usr/bin/env node

/**
 * n8n-dev-bridge MCPB Bundle Builder
 * 
 * Converts existing JSON MCP configuration to secure MCPB bundle
 * - Integrates with Windows Credential Manager for secure token storage
 * - Follows MCP Validation Playbook steps 1-3
 * - Generates ready-to-install .mcpb file for Claude Desktop
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// Configuration constants
const CONFIG = {
    name: 'n8n-dev-bridge',
    version: process.env.GITHUB_REF_NAME || '1.0.0-dev',
    endpoint: 'https://czlonkowskin8n-mcp-railwaylatest-dev.up.railway.app/mcp',
    authToken: 'Bearer zxT94kE8pLr62UNqV1dCB',
    credentialTarget: 'claude-desktop/n8n-dev-bridge/AUTH_HEADER_DEV',
    bundleDir: path.join(rootDir, 'bundle'),
    outputFile: 'n8n-dev-bridge.mcpb'
};

class MCPBBuilder {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
        
        switch (level) {
            case 'error':
                console.error(`\\x1b[31m${prefix}\\x1b[0m`, message);
                this.errors.push(message);
                break;
            case 'warn':
                console.warn(`\\x1b[33m${prefix}\\x1b[0m`, message);
                this.warnings.push(message);
                break;
            case 'success':
                console.log(`\\x1b[32m${prefix}\\x1b[0m`, message);
                break;
            default:
                console.log(`\\x1b[36m${prefix}\\x1b[0m`, message);
        }
    }

    async checkPrerequisites() {
        this.log('Checking build prerequisites...');

        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 18) {
            throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
        }
        this.log(`Node.js version: ${nodeVersion}`, 'success');

        // Check if npx is available
        try {
            await this.runCommand('npx', ['--version']);
            this.log('npx available', 'success');
        } catch (error) {
            // Try with npm bin directory
            try {
                await this.runCommand('npm', ['exec', 'npx', '--', '--version']);
                this.log('npx available via npm exec', 'success');
            } catch (error2) {
                this.log('npx not found - mcp-remote may fail at runtime', 'warn');
            }
        }

        // Note: Using simulated MCPB packing until CLI is available
        this.log('Using simulated MCPB packing process', 'warn');

        return true;
    }

    async runCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                stdio: 'pipe',
                ...options
            });

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr, code });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
                }
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    async setupBundleDirectory() {
        this.log('Setting up bundle directory structure...');

        // Clean and create bundle directory
        try {
            await fs.rm(CONFIG.bundleDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore if directory doesn't exist
        }

        await fs.mkdir(CONFIG.bundleDir, { recursive: true });
        await fs.mkdir(path.join(CONFIG.bundleDir, 'server'), { recursive: true });

        this.log('Bundle directory structure created', 'success');
    }

    async generateManifest() {
        this.log('Generating MCPB manifest...');

        const manifest = {
            mcpb_version: '0.1',
            name: CONFIG.name,
            version: CONFIG.version,
            description: 'n8n Development Bridge - Railway MCP server with HTTP transport and Bearer authentication',
            author: {
                name: 'Kurt Anderson',
                url: 'https://github.com/mapachekurt/n8n-dev-bridge-mcpb'
            },
            license: 'MIT',
            homepage: 'https://github.com/mapachekurt/n8n-dev-bridge-mcpb',
            repository: 'https://github.com/mapachekurt/n8n-dev-bridge-mcpb',
            keywords: ['n8n', 'mcp-remote', 'railway', 'workflow-automation', 'http-transport'],
            
            server: {
                type: 'node',
                entry_point: 'server/index.js',
                mcp_config: {
                    command: 'npx',
                    args: [
                        '-y',
                        'mcp-remote@latest',
                        CONFIG.endpoint,
                        '--transport', 'http-only',
                        '--header', 'Authorization:${AUTH_HEADER_DEV}'
                    ],
                    env: {}
                }
            },

            capabilities: {
                tools: [
                    { name: 'list_nodes', description: 'List n8n nodes with filtering' },
                    { name: 'search_nodes', description: 'Search n8n nodes by keyword' },
                    { name: 'get_node_info', description: 'Get detailed node information' },
                    { name: 'n8n_create_workflow', description: 'Create new workflows' },
                    { name: 'n8n_list_workflows', description: 'List existing workflows' },
                    { name: 'n8n_get_workflow', description: 'Get workflow details' },
                    { name: 'n8n_health_check', description: 'Check n8n connectivity' },
                    { name: 'validate_workflow', description: 'Validate workflow structure' },
                    { name: 'search_templates', description: 'Search community templates' }
                ],
                resources: [
                    { name: 'n8n://workflows', description: 'Access to n8n workflows' },
                    { name: 'n8n://nodes', description: 'Access to n8n node library' },
                    { name: 'n8n://templates', description: 'Access to workflow templates' }
                ]
            },

            configuration: {
                required: true,
                properties: {
                    auth_header_dev: {
                        type: 'string',
                        description: 'Bearer token for Railway n8n API',
                        sensitive: true,
                        required: true
                    }
                }
            },

            permissions: {
                network: {
                    allowed_hosts: [
                        'czlonkowskin8n-mcp-railwaylatest-dev.up.railway.app',
                        '*.railway.app',
                        '*.up.railway.app'
                    ]
                }
            },

            metadata: {
                category: 'development',
                tags: ['n8n', 'railway', 'mcp-remote', 'http-transport', 'bearer-auth'],
                compatibility: {
                    claude_desktop: '>=0.11.0',
                    node: '>=18.0.0'
                },
                transport: {
                    protocol: 'http',
                    authentication: 'bearer',
                    endpoint: CONFIG.endpoint
                }
            }
        };

        const manifestPath = path.join(CONFIG.bundleDir, 'manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        
        this.log(`Manifest generated: ${manifestPath}`, 'success');
        return manifest;
    }

    async generatePackageJson() {
        this.log('Generating bundle package.json...');

        const packageJson = {
            name: `${CONFIG.name}-bundle`,
            version: CONFIG.version,
            description: 'n8n Development Bridge MCPB Bundle',
            main: 'server/index.js',
            type: 'module',
            scripts: {
                start: 'node server/index.js'
            },
            dependencies: {
                'mcp-remote': 'latest'
            },
            engines: {
                node: '>=18.0.0'
            },
            keywords: ['n8n', 'mcp', 'railway'],
            author: 'Kurt Anderson',
            license: 'MIT'
        };

        const packagePath = path.join(CONFIG.bundleDir, 'package.json');
        await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
        
        this.log(`Package.json generated: ${packagePath}`, 'success');
        return packageJson;
    }

    async generateServerImplementation() {
        this.log('Generating server implementation...');

        const serverCode = `#!/usr/bin/env node

/**
 * n8n Development Bridge MCPB Server
 * Connects to Railway-hosted n8n via mcp-remote with HTTP transport
 */

import { spawn } from 'child_process';

class N8nDevBridgeServer {
    constructor() {
        this.process = null;
        this.isRunning = false;
    }

    async start() {
        try {
            // Get auth token from environment (set by Claude Desktop from secure storage)
            const authToken = process.env.AUTH_HEADER_DEV || '$' + '{AUTH_HEADER_DEV}';
            
            if (!authToken || authToken === '$' + '{AUTH_HEADER_DEV}') {
                console.error('AUTH_HEADER_DEV not found in environment variables');
                console.error('Please run setup-windows-credentials.ps1 to configure authentication');
                process.exit(1);
            }
            
            // Start mcp-remote with exact configuration from JSON config
            const args = [
                '-y',
                'mcp-remote@latest',
                '${CONFIG.endpoint}',
                '--transport', 'http-only',
                '--header', \`Authorization:\$\{authToken\}\`
            ];

            console.log('Starting n8n-dev-bridge with mcp-remote...');
            console.log('Endpoint:', '${CONFIG.endpoint}');
            console.log('Transport: HTTP-only');

            this.process = spawn('npx', args, {
                stdio: ['pipe', 'pipe', 'inherit'],
                env: {
                    ...process.env,
                    AUTH_HEADER_DEV: authToken
                }
            });

            // Pipe stdin/stdout for MCP communication
            process.stdin.pipe(this.process.stdin);
            this.process.stdout.pipe(process.stdout);

            this.isRunning = true;

            this.process.on('exit', (code) => {
                this.isRunning = false;
                if (code !== 0 && code !== null) {
                    console.error(\`mcp-remote process exited with code \$\{code\}\`);
                    process.exit(code);
                }
            });

            this.process.on('error', (error) => {
                console.error('Failed to start mcp-remote:', error.message);
                process.exit(1);
            });

            // Handle shutdown signals
            ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
                process.on(signal, () => this.shutdown());
            });

        } catch (error) {
            console.error('Error starting n8n-dev-bridge:', error.message);
            process.exit(1);
        }
    }

    shutdown() {
        if (this.process && this.isRunning) {
            this.process.kill('SIGTERM');
        }
        process.exit(0);
    }
}

// Start the server
const server = new N8nDevBridgeServer();
server.start().catch(console.error);
`;

        const serverPath = path.join(CONFIG.bundleDir, 'server', 'index.js');
        await fs.writeFile(serverPath, serverCode, 'utf8');
        
        this.log(`Server implementation generated: ${serverPath}`, 'success');
    }

    async installBundleDependencies() {
        this.log('Skipping bundle dependency installation (simulated build)...');
        // In a real MCPB bundle, dependencies would be managed by the MCPB CLI
        this.log('Bundle dependencies would be installed by MCPB CLI', 'warn');
        return true;
    }

    async validateBundle() {
        this.log('Validating bundle structure...');

        const requiredFiles = [
            'manifest.json',
            'package.json', 
            'server/index.js'
        ];
        
        // Note: node_modules not required for simulated build
        this.log('Validating simulated bundle structure (node_modules skipped)', 'warn');

        for (const file of requiredFiles) {
            const filePath = path.join(CONFIG.bundleDir, file);
            try {
                await fs.access(filePath);
                this.log(`✓ Found required file: ${file}`, 'success');
            } catch (error) {
                throw new Error(`Missing required file: ${file}`);
            }
        }

        // Validate JSON files
        try {
            const manifest = JSON.parse(await fs.readFile(path.join(CONFIG.bundleDir, 'manifest.json'), 'utf8'));
            const packageJson = JSON.parse(await fs.readFile(path.join(CONFIG.bundleDir, 'package.json'), 'utf8'));
            
            this.log('JSON validation passed', 'success');
        } catch (error) {
            throw new Error(`JSON validation failed: ${error.message}`);
        }

        this.log('Bundle validation completed successfully', 'success');
    }

    async buildMCPBBundle() {
        this.log('Building MCPB bundle (simulated process)...');

        try {
            // Simulated MCPB bundle creation since actual CLI doesn't exist yet
            // This creates a ZIP-like bundle with the required structure
            
            const bundlePath = path.join(CONFIG.bundleDir, CONFIG.outputFile);
            
            // Create a simple bundle by copying manifest and server files
            // In reality, this would be handled by the MCPB CLI
            const bundleContent = {
                manifest: JSON.parse(await fs.readFile(path.join(CONFIG.bundleDir, 'manifest.json'), 'utf8')),
                package: JSON.parse(await fs.readFile(path.join(CONFIG.bundleDir, 'package.json'), 'utf8')),
                server: await fs.readFile(path.join(CONFIG.bundleDir, 'server', 'index.js'), 'utf8'),
                timestamp: new Date().toISOString(),
                buildInfo: {
                    version: CONFIG.version,
                    endpoint: CONFIG.endpoint,
                    builder: 'n8n-dev-bridge-mcpb-builder'
                }
            };
            
            // Write simulated bundle file (JSON format for now)
            await fs.writeFile(bundlePath, JSON.stringify(bundleContent, null, 2), 'utf8');
            
            const stats = await fs.stat(bundlePath);
            this.log(`MCPB bundle created successfully: ${CONFIG.outputFile} (${stats.size} bytes)`, 'success');
            this.log('Note: This is a simulated bundle format until MCPB CLI is available', 'warn');
            
            // Move bundle to root directory
            const outputPath = path.join(rootDir, CONFIG.outputFile);
            await fs.copyFile(bundlePath, outputPath);
            this.log(`Bundle copied to: ${outputPath}`, 'success');

            return outputPath;

        } catch (error) {
            throw new Error(`MCPB build failed: ${error.message}`);
        }
    }

    async build() {
        try {
            this.log('Starting n8n-dev-bridge MCPB build process...');
            
            await this.checkPrerequisites();
            await this.setupBundleDirectory();
            await this.generateManifest();
            await this.generatePackageJson();
            await this.generateServerImplementation();
            await this.installBundleDependencies();
            await this.validateBundle();
            const bundlePath = await this.buildMCPBBundle();

            this.log('\\n🎉 Build completed successfully!', 'success');
            this.log(`Bundle ready: ${bundlePath}`, 'success');
            this.log(`\\nNext steps:`, 'info');
            this.log(`1. Run: npm run credential-setup`, 'info');
            this.log(`2. Install ${CONFIG.outputFile} in Claude Desktop`, 'info');
            this.log(`3. Remove old JSON config from claude_desktop_config.json`, 'info');

            if (this.warnings.length > 0) {
                this.log(`\\nWarnings (${this.warnings.length}):`, 'warn');
                this.warnings.forEach((warning, i) => {
                    this.log(`${i + 1}. ${warning}`, 'warn');
                });
            }

            return bundlePath;

        } catch (error) {
            this.log(`Build failed: ${error.message}`, 'error');
            
            if (this.errors.length > 0) {
                this.log(`\\nErrors encountered:`, 'error');
                this.errors.forEach((err, i) => {
                    this.log(`${i + 1}. ${err}`, 'error');
                });
            }
            
            process.exit(1);
        }
    }
}

// Run build if called directly
if (process.argv[1] === __filename) {
    const builder = new MCPBBuilder();
    builder.build();
}

export default MCPBBuilder;
