#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const FABRICA_TOOLBOX_BASE = 'http://localhost:3000/api/mcp/';


// Define a simpler type for the tool input schema
// Was: type ToolInput = z.infer<typeof ToolInputSchema>;
type ToolInput = Record<string, unknown>;

// Server setup
const server = new Server(
  {
    name: 'fabrica-stdio',
    version: '0.2.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ListTools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('Fetching tools list...');
  try {
    const response = await fetch(FABRICA_TOOLBOX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    });
    if (!response.ok) {
      console.error(
        `Error fetching tools list: ${response.status} ${response.statusText}`,
      );
      throw new Error(`Failed to fetch tools list: ${response.statusText}`);
    }
    const data = (await response.json()) as { result: { tools: any[] } };
    const tools = data.result.tools;
    console.error(`Tools list fetched: ${JSON.stringify(tools)}`);
    return { tools };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching tools list: ${errorMessage}`);
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

    console.error(`Calling tool: ${name} with args=${JSON.stringify(args)}`);
    const response = await fetch(FABRICA_TOOLBOX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    });
    if (!response.ok) {
      console.error(
        `Error fetching tools list: ${response.status} ${response.statusText}`,
      );
      throw new Error(`Failed to fetch tools list: ${response.statusText}`);
    }
    const data = (await response.json()) as { result: any };
    console.error(`Tool response: ${JSON.stringify(data)}`);
    return data.result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error processing request: ${errorMessage}`);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fabrica Bridge Server running on stdio');
}
// Parse command line arguments
const argv = process.argv.slice(2); // Remove node and script path
const utbid = argv[0]; // Extract the first argument

// Check if UTBID is provided
if (!utbid) {
  console.error(
    'Error: No UTBID provided. Please provide a UTBID as the first argument.',
  );
  process.exit(1);
}

// Set the full toolbox URL with the UTBID
let FABRICA_TOOLBOX_URL = `${FABRICA_TOOLBOX_BASE}${utbid}`;

runServer().catch((error) => {
  console.error(`Fatal error running server: ${error}`);
  process.exit(1);
});
