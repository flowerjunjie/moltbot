# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Moltbot is a personal AI assistant platform with a Gateway-based architecture. The Gateway acts as a WebSocket control plane that connects channels (WhatsApp, Telegram, Slack, Discord, etc.) to agent sessions, tools, and companion apps (macOS, iOS, Android).

## Common Commands

### Development
```bash
# Build TypeScript to dist/
pnpm build

# Build and bundle Canvas A2UI vendor assets
pnpm canvas:a2ui:bundle

# Development loop with auto-reload on TS changes
pnpm gateway:watch

# Run TypeScript directly without building (via tsx)
pnpm dev
pnpm start
pnpm moltbot <command>
```

### UI
```bash
# Build the web UI
pnpm ui:build
# (automatically installs UI deps on first run)
```

### Testing
```bash
# Run all tests in parallel
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch

# Run a single test file
pnpm test src/path/to/test.test.ts

# E2E tests (Docker-based)
pnpm test:e2e

# Live API tests
pnpm test:live

# Run all test suites
pnpm test:all
```

### Linting and Formatting
```bash
# Lint with oxlint
pnpm lint

# Lint and auto-fix issues
pnpm lint:fix

# Format check with oxfmt
pnpm format

# Format and write changes
pnpm format:fix

# Run all linters (TypeScript + Swift)
pnpm lint:all
pnpm format:all
```

### Protocol Generation
```bash
# Generate Gateway protocol schema
pnpm protocol:gen

# Generate Swift protocol bindings for iOS/macOS apps
pnpm protocol:gen:swift

# Check protocol schema is up-to-date
pnpm protocol:check
```

### Docker Tests
```bash
# Run all Docker-based E2E tests
pnpm test:docker:all
```

### Misc
```bash
# Sync plugin versions with main package
pnpm plugins:sync

# Check for release issues
pnpm release:check
```

## High-Level Architecture

### Gateway (`src/gateway/`)

The Gateway is the central WebSocket server that all clients connect to. It's started via `startGatewayServer()` in `src/gateway/server.impl.ts`.

Key responsibilities:
- **WebSocket server** - Serves WS clients on port 18789 (default)
- **Channel registry** - Manages channel plugins (WhatsApp, Telegram, etc.)
- **Session management** - Tracks agent sessions, routing, and state
- **Tool execution** - Handles requests for bash, browser, canvas, nodes, etc.
- **Event broadcast** - Distributes events to connected clients
- **HTTP endpoints** - Serves Control UI, OpenAI chat completions, OpenResponses

**Gateway Protocol (`src/gateway/protocol/`)**: Defines the WebSocket message schema (request/response, events, and typed payloads). All client-server communication follows this protocol.

### Channels (`src/channels/`)

Channel plugins connect messaging platforms to the Gateway. Each channel:
- Connects to its platform's API (WhatsApp via Baileys, Telegram via grammY, etc.)
- Normalizes incoming messages to Gateway protocol
- Handles message delivery, reactions, typing indicators
- Manages allowlists, mention gating, and group policies

**Channel registry (`src/channels/plugins/`)**: Loads and manages channel plugins. Core channels are built-in; additional channels are in `extensions/*/`.

### Agent Runtime (`src/agents/`)

The agent runtime manages AI agent sessions:
- **Pi agent integration** - Uses `@mariozechner/pi-ai` for agent execution
- **RPC mode** - Agent runs in separate process, communicates via stdio
- **Auth profiles** - Manages API keys and OAuth tokens with rotation
- **Bash tools** - Executes shell commands with PTY support and background process registry
- **Skills** - Loads workspace skills from `~/clawd/skills/`

**Agent Client Protocol (`src/acp/`)**: Implements the ACP protocol for agent communication, translating between Gateway events and ACP messages.

### Tools

**Browser (`src/browser/`)**: Chromium/Chrome automation via CDP (Chrome DevTools Protocol)
- Playwright-based session management
- Screenshot, navigation, interaction tools
- Profile management and extensions

**Canvas (`src/canvas-host/`)**: Live Canvas rendering via A2UI
- Pushes Canvas updates to connected nodes
- Handles A2UI evaluation and snapshots

**Bash (`src/agents/bash-tools.ts`)**: Shell command execution
- PTY-based command execution with `@lydell/node-pty`
- Background process management
- Environment variable handling

**Nodes**: Device-local actions (iOS/Android/macOS)
- Camera, screen recording, notifications
- Exposed via Gateway protocol when devices pair

### Configuration (`src/config/`)

- **Config file**: `~/.clawdbot/moltbot.json` (JSON5 + JSON schema validation)
- **Environment substitution**: Supports `${VAR}` syntax in config values
- **Legacy migrations**: Auto-migrates old config entries on startup
- **Session store**: SQLite-backed session state management

### Plugins (`src/plugins/`)

Extension system for channels, auth providers, and features:
- **Discovery**: Scans `extensions/` for plugin manifests
- **Loading**: Dynamic imports with dependency injection
- **Hooks**: Plugin hooks for event interception
- **HTTP registry**: Plugins can add HTTP routes

### CLI (`src/commands/`)

Command-line interface via Commander.js:
- `moltbot gateway` - Start the Gateway server
- `moltbot agent` - Send a message to the agent
- `moltbot channels` - Manage channels
- `moltbot configure` - Run configuration wizard
- `moltbot doctor` - Diagnose and fix issues

## Key Patterns

### Session Management

Sessions represent isolated agent conversations:
- `main` session for direct user interaction
- Group sessions for each group/chat
- Per-agent session isolation via routing

Session keys: `{channelId}/{peerId}` or `main` for direct CLI interaction.

### Message Routing

Inbound messages flow: `Channel -> Gateway -> Agent Session -> Tools -> Response -> Gateway -> Channel`

The Gateway routes messages to sessions based on:
- Channel and peer IDs
- Group membership
- Agent routing configuration

### Testing

- **Unit tests**: `src/**/*.test.ts` - Vitest with `test()` helper
- **E2E tests**: `vitest.e2e.config.ts` - Full integration tests
- **Live tests**: `vitest.live.config.ts` - Tests against real APIs
- Set `CLAWDBOT_LIVE_TEST=1` to enable live tests

### Extensions

Extensions live in `extensions/*/` and can provide:
- Additional channels (e.g., `extensions/discord/`, `extensions/whatsapp/`)
- Auth providers (e.g., `extensions/google-antigravity-auth/`)
- Tool extensions (e.g., `extensions/memory-lancedb/`)

Each extension has a `package.json` with a `moltbot.extensions` array pointing to entry modules.

## TypeScript Configuration

- Target: ES2022
- Module: NodeNext (ESM)
- Strict mode enabled
- Output: `dist/` directory
- Source files: `src/` directory

## Important File Locations

- `src/gateway/server.impl.ts` - Gateway server entry point
- `src/gateway/protocol/schema/` - Gateway protocol type definitions
- `src/channels/plugins/index.ts` - Channel plugin loader
- `src/agents/bash-tools.ts` - Bash tool implementation
- `src/browser/server.ts` - Browser control HTTP server
- `src/config/config.ts` - Config loading and validation
- `src/commands/agent.ts` - CLI agent command
- `moltbot.mjs` - CLI entry point
