# Fabrica MCP Stdio Bridge Server

## Description

This is a bridge for clients like **Claude Desktop**, **Cursor**, and **Windsurf** that do not support yet the new MCP HTTP Streamable transport used by the Fabrica gateway. It starts shim MCP server that uses stdio transport on the local host and proxies the request to Fabrica's gateway over HTTP.

## Installation

### pre-requisite
Get your unique Toolbox ID (utbid) from Fabrica's gateway UI.


### Install for Claude

Open a terminal and run:
```
npx -y @fabrica.work/cli@latest cli install claude <utbid>
```
This should add an entry to Claude's MCP config under:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```
Make sure to restart the Claude desktop app for the changes to take effect.

### Install for Cursor
Open a terminal and run:
```
npx -y @fabrica.work/cli@latest cli install cursor <utbid>
```

This should add an entry to Cursor's MCP config under:
```
~/.cursor/mcp.json
```
Make sure to restart the Cursor desktop app for the changes to take effect.

### Install for Windsurf
Open a terminal and run:
```
npx -y @fabrica.work/cli@latest cli install windsurf <utbid>
```

This should add an entry to Windsurf's MCP config under:
```
~/.codeium/windsurf/mcp_config.json
```
Make sure to restart the Windsurf desktop app for the changes to take effect.


### install for VSCode

Follow instructions at: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
The command to run to start the server is:
```
npx -y @fabrica.work/cli@latest server <utbid>>
```

Note: if installed as a global server (vs workspace), the settings are under
```
~/Library/Application Support/Code/User/settings.json
```

TODO

## Development

### Running from local sources

Compile:
```
pnpm run build
```

To run the server:
```
npm exec fabrica server
```

To run the installation
```
npm exec fabrica cli install claude <utbid>
```

To run under the MCP inspector, use the following command:

```bash
npx -y @modelcontextprotocol/inspector npx @fabrica.work/cli@latest server <utbid>
```

Replace `<utbid>` with the appropriate identifier for your use case.

### Environment variables

FABRICA_GATEWAY_URL
Set to something like `http://localhost:3000/api/mcp` to use a local gateway server during development.


### Publishing the npm package
Increment the version in package.json
```
pnpm publish
```

## Troubleshooting

### Logs

Check logs for troubleshooting under

  - Claude:
```
/Users/<username>/Library/Logs/Claude
```
  - Cursor
TBD
  - Windsurf
TBD

### General
Refer to https://modelcontextprotocol.io/docs/tools/debugging


## Contributing

If you'd like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request for review.

## License

This project is licensed under the [MIT License](LICENSE).

## Additional Resources

- [Fabrica Documentation](https://fabrica.work/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.org/spec)



