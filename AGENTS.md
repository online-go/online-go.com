## Development Commands

### Setup

```bash
# Clone with submodules
git clone --recurse-submodules git@github.com:online-go/online-go.com.git

# Install dependencies
npx yarn install

# Install husky for pre-commit hooks
npx husky install

# Or use make to do all setup
make
```

### Development Server

```bash
npm run dev                    # Connect to beta server (default)
make dev                      # Same as above
make local-dev                # Connect to local backend
make point-to-production      # Connect to production server
make bot-dev                  # Special bot development mode
```

Development server runs on http://dev.beta.online-go.com:8080/

### Build and Type Checking

```bash
npm run build                 # Production build
npm run build:i18n           # Internationalization build
npm run type-check           # TypeScript type checking
```

### Code Quality

```bash
npm run lint                 # ESLint
npm run lint:fix             # ESLint with auto-fix
npm run prettier             # Format code with Prettier
npm run prettier:check       # Check formatting
npm run spellcheck           # Spell check TypeScript files
make pretty                  # Run prettier + lint:fix
```

### Testing

```bash
npm run test                 # Jest unit tests
npm run fresh-test           # Clear console and run tests
npm run test:e2e             # Playwright end-to-end tests
npm run test:e2e:quick       # E2E tests excluding smoke/slow
npm run test:e2e:smoke       # Smoke tests only
npm run test:e2e:ui          # E2E tests with UI
npm run test:e2e:debug       # E2E tests in debug mode
npm run test:ci              # Full CI test suite
```

### Analysis

```bash
npm run bundle-visualizer    # Analyze bundle size
npm run dependency-cruiser   # Check dependencies
```

## Architecture Overview

This is a React/TypeScript application for the Online-Go.com web client, a platform for playing the board game Go online.

### Key Directories

-   `src/components/` - React UI components
-   `src/views/` - Main page components/views
-   `src/lib/` - Core utilities and business logic
-   `src/models/` - TypeScript type definitions
-   `submodules/goban/` - Go board engine (git submodule)
-   `submodules/react-dynamic-help/` - Help system
-   `submodules/moderator-ui/` - Moderation interface

### Core Libraries and Systems

-   **Game Engine**: Uses custom `goban` library (submodule) for Go game logic
-   **Real-time**: WebSocket connections via `sockets.ts` and `chat_manager.ts`
-   **State Management**: Mix of React state and custom managers
-   **Styling**: Stylus (.styl files) for CSS preprocessing
-   **Testing**: Jest for unit tests, Playwright for E2E tests
-   **Build**: Vite for development and production builds

### Important Core Files

-   `src/main.tsx` - Application entry point
-   `src/routes.tsx` - React Router configuration
-   `src/lib/data.ts` - Main data management and API integration
-   `src/lib/preferences.ts` - User preferences management
-   `src/lib/sockets.ts` - WebSocket communication
-   `src/lib/GobanController.ts` - Game board state management
-   `src/lib/chat_manager.ts` - Chat system

### Path Aliases

The project uses TypeScript path mapping:

-   `@/*` → `src/*`
-   `goban` → `submodules/goban/src`
-   `goscorer` → `submodules/goban/src/third_party/goscorer/goscorer`
-   `react-dynamic-help` → `submodules/react-dynamic-help/src`

### Backend Integration

The client can connect to different backends via `OGS_BACKEND` environment variable:

-   `BETA` (default) - https://beta.online-go.com
-   `PRODUCTION` - https://online-go.com
-   `LOCAL` - http://127.0.0.1:1080

### Component Structure

Most components follow the pattern:

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.styl
└── index.ts
```

### Development Notes

-   Git submodules are required - clone with `--recurse-submodules`
-   Husky pre-commit hooks enforce linting and formatting
-   Development server hot-reloads on file changes
-   TypeScript strict mode is enabled with comprehensive type checking
-   Components are heavily modularized with 100+ individual components
-   The use of emojis is discouraged, they are unprofessional and tacky
-   Use comments sparingly but should be used to explain complex code or non-obvious code
-   Always ensure the code builds and passes linting and formatting

### Animation Guidelines

-   Avoid disorienting animations like continuous pulsing, throbbing, or looping effects
-   Do not use translate effects on hover
-   Keep animations subtle and purposeful - prefer opacity and shadow changes over position changes
