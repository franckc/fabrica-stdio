# Fabrica MCP Stdio Bridge Server

## Description

This is a bridge for clients like **Claude Desktop**, **Cursor**, and **Windsurf** that do not support yet the new MCP HTTP Streamable transport used by the Fabrica gateway. It starts shim MCP server that uses stdio transport on the local host and proxies the request to Fabrica's gateway over HTTP.

## Installation

### Install for Claude

Get your unique Toolbox ID (utbid) from Fabrica's gateway UI.
Then open a terminal and run:
```
npx @fabrica.work/cli@latest install claude <utbid>
```
This should add an entry to Claude's MCP config under:

```
/Users/<username>/Library/Application Support/Claude/claude_desktop_config.json
```

### Install for Cursor

TODO

### Install for Windsurf

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
npm exec fabrica cli install claude myutbid
```

To run under the MCP inspector, use the following command:

```bash
npx -y @modelcontextprotocol/inspector npx @fabrica.work/cli@latest <utbid>
```

Replace `<utbid>` with the appropriate identifier for your use case.

## Environment variables

FABRICA_TOOLBOX_BASEURL
Set to something like `http://localhost:3000/api/mcp` to use a local gateway server during development.

## Troubleshooting

### Logs

Check logs for troubleshooting under:

```
/Users/<username>/Library/Logs/Claude
```

### Common Issues



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



