#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import path from "path";


const FABRICA_TOOLBOX_BASE = 'http://localhost:3000/api/mcp/';

// Set up file logging
const LOG_PATH=  '/Users/franck/src/fabrica/stdio_connector/';
const LOG_FILE = 'fabrica.log';
const logFile = path.join(LOG_PATH, LOG_FILE);

// Ensure log directory exists
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH, { recursive: true });
}

// Create a logging function
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
}


// Define a simpler type for the tool input schema
// Was: type ToolInput = z.infer<typeof ToolInputSchema>;
type ToolInput = Record<string, unknown>;

// Server setup
const server = new Server(
  {
    name: "fabrica-stdio",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ListTools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logToFile("Fetching tools list...");
  try {
    const response = await fetch(FABRICA_TOOLBOX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json'
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list",
        "params": {}
      })
    });
    if (!response.ok) {
      logToFile(`Error fetching tools list: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch tools list: ${response.statusText}`);
    }
    const data = await response.json();
    const tools = data.result.tools;
    logToFile(`Tools list fetched: ${JSON.stringify(tools)}`);
    return { tools };
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToFile(`Error fetching tools list: ${errorMessage}`);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }

});


// CallTool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    logToFile(`Calling tool: ${name} with args=${JSON.stringify(args)}`);
    const response = await fetch(FABRICA_TOOLBOX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json'
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": { name, arguments: args }
      })
    });
    if (!response.ok) {
      logToFile(`Error fetching tools list: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch tools list: ${response.statusText}`);
    }
    const data = await response.json();
    logToFile(`Tool response: ${JSON.stringify(data)}`);
    return data.result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToFile(`Error processing request: ${errorMessage}`);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  console.log("Starting server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logToFile("Fabrica Bridge Server running on stdio");
}
// Parse command line arguments
const argv = process.argv.slice(2); // Remove node and script path
const utbid = argv[0]; // Extract the first argument

// Check if UTBID is provided
if (!utbid) {
  logToFile("Error: No UTBID provided. Please provide a UTBID as the first argument.");
  console.error("Error: No UTBID provided. Please provide a UTBID as the first argument.");
  process.exit(1);
}

// Set the full toolbox URL with the UTBID
let FABRICA_TOOLBOX_URL = `${FABRICA_TOOLBOX_BASE}${utbid}`;

runServer().catch((error) => {
  logToFile(`Fatal error running server: ${error}`);
  process.exit(1);
});