#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const FABRICA_GATEWAY_URL = process.env.FABRICA_GATEWAY_URL || 'https://app.fabrica.work/api/mcp';
let FABRICA_BEARER_TOKEN = '';

type ToolInput = Record<string, unknown>;

// Logging function. Note: we log to stderr to avoid interfering with stdout since that's
// used as the MCP transport between the local client and this server.
function log(message: string): void {
  console.error(`[Fabrica Bridge]: ${message}`);
}

// Server setup
const server = new Server(
  {
    name: 'fabrica-stdio',
    version: '0.9.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ListTools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log('Fetching tools list...');
  try {
    const response = await fetch(FABRICA_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
        Authorization: `Bearer ${FABRICA_BEARER_TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    });
    if (!response.ok) {
      log(`Error fetching tools list: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch tools list: ${response.statusText}`);
    }
    const data = (await response.json()) as { result: { tools: any[] } };
    const tools = data.result.tools;
    log(`Tools list fetched: ${JSON.stringify(tools)}`);
    return { tools };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error fetching tools list: ${errorMessage}`);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// CallTool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    log(`Calling tool: ${name} with args=${JSON.stringify(args)}`);
    const response = await fetch(FABRICA_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
        Authorization: `Bearer ${FABRICA_BEARER_TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    });
    if (!response.ok) {
      log(`Error calling tool: ${response.status} ${response.statusText}`);
      throw new Error(`Failed calling tool: ${response.statusText}`);
    }
    const data = (await response.json()) as { result: any };
    log(`Tool response: ${JSON.stringify(data)}`);
    return data.result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error processing request: ${errorMessage}`);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Function to start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('Fabrica Bridge Server running on stdio');
}


// Function to install Fabrica Bridge for specified client
async function runInstall(clientName: string, utbid: string) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const os = await import('node:os');

  let configPath: string;
  if (clientName === 'claude') {
    configPath = path.join(os.homedir(), '/Library/Application Support/Claude/claude_desktop_config.json');
  } else if (clientName === 'cursor') {
    configPath = path.join(os.homedir(), '/.cursor/mcp.json');
  } else if (clientName === 'windsurf') {
    configPath = path.join(os.homedir(), '/.codeium/windsurf/mcp_config.json');
  } else {
    log(`Installation not yet implemented for client: ${clientName}`);
    throw new Error(`Installation not yet implemented for client: ${clientName}`);
  }

  // Update the client's config file with the new mcpServers entry.
  try {
    // Try to read the existing config file if it exists
    let config: Record<string, any> = {};
    let configData: string;
    try {
      configData = await fs.readFile(configPath, 'utf8');
    } catch (error) {
      // If file doesn't exist, create a new empty one
      log(`Config file doesn't exist. Creating new config at ${configPath}.`)
      const configDir = path.dirname(configPath);
      await fs.mkdir(configDir, { recursive: true });
      configData = '{}';
    }

    // Parse the existing config file
    try {
      config = JSON.parse(configData);
    } catch (error) {
      // Exit the process if the config file is not valid JSON
      log(`Error parsing the JSON config file ${configPath}`)
      log(error instanceof Error ? error.message : String(error));
      log(`Please fix the error in the JSON config file (or alternatively delete it), then retry.`);
      log(`Exiting.`);
      process.exit(1);
    }

    // Ensure mcpServers object exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    // Add or update the Fabrica-stdio entry
    config.mcpServers["Fabrica-stdio"] = {
      "command": "npx",
      "args": [
      "-y",
      "@fabrica.work/cli@latest",
      "server",
      utbid
      ]
    };
    
    // Write the updated config back to the file
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    log(`Successfully updated ${clientName} config file at ${configPath}`);
    log(`Fabrica Bridge installed for ${clientName}`);
    log(`Please restart ${clientName} for the changes to take effect.`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error installing for Claude: ${errorMessage}`);
    throw error;
  }

}

// Help message function
function printHelp() {
  const cmd = 'npx -y @fabrica.work/cli@latest';
  console.log(`
Fabrica Bridge CLI Usage:

  ${cmd} server <UTBID>
    Start the Fabrica Bridge server with the given UTBID (Fabrica Toolbox Bearer Token).

  ${cmd} cli install <client> <UTBID>
    Install Fabrica Bridge for a supported client (claude, cursor, windsurf) with the given UTBID.

Options:
  --help    Show this help message.

Examples:
  ${cmd} server <UTBID>
  ${cmd} cli install claude <UTBID>
`);
}

// Parse command line arguments
const argv = process.argv.slice(2); // Remove node and script path
const command = argv[0]; // Extract the command (server or cli)

// Show help if no command, or --help is provided as the only argument
if (!command || command === '--help') {
  printHelp();
  process.exit(0);
}

// Show help if 'cli --help' or 'server --help' is provided
if ((command === 'cli' || command === 'server') && (argv.length < 2 || argv[1] === '--help')) {
  console.log('Missing required arguments for the command.');
  printHelp();
  process.exit(0);
}

if (command === 'server') {
  const utbid = argv[1]; // Extract the UTBID (2nd argument)  
  if (!utbid) {
    log('Error: No UTBID provided. Please provide a UTBID as the second argument when using "server" command.');
    process.exit(1);
  }
  
  // Set the full toolbox URL with the UTBID
  FABRICA_BEARER_TOKEN = utbid;
  
  runServer().catch((error) => {
    log(`Fatal error running server: ${error}`);
    process.exit(1);
  });

} else if (command === 'cli') {
  const action = argv[1]; // Extract the action (2nd argument)
  if (!action) {
    log('Error: No action provided. Please specify an action (e.g., "install") as the second argument when using "cli" command.');
    process.exit(1);
  }
  
  if (action === 'install') {
    const clientName = argv[2];
    const utbid = argv[3];
    if (!['claude', 'cursor', 'windsurf'].includes(clientName)) {
      log('Error: Invalid client name. Supported clients are: claude, cursor, windsurf');
      process.exit(1);
    }
    if (!utbid) {
      log('Error: No Fabrica Toolbox ID provided.');
      process.exit(1);
    }
    
    log(`Installing for client: ${clientName}`);
    runInstall(clientName, argv[3])
  } else {
    log(`Error: Unsupported action "${action}". Currently only "install" is supported.`);
    process.exit(1);
  }

} else {
  log(`Error: Invalid command "${command}". Please specify either "server" or "cli".`);
  process.exit(1);
}

