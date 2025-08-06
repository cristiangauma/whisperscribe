# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhisperScribe is an Obsidian plugin that provides AI-powered transcription for audio files using multiple providers. The plugin is built with TypeScript and uses the Obsidian API.

## Build Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Production build
npm run build

# Version bump (updates manifest.json and versions.json)
npm run version

# Testing
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Architecture

### Core Components

The plugin follows a modular architecture with code organized in the `src/` directory:

**main.ts** - Entry point that re-exports from `src/index.ts` for Obsidian compatibility

**src/index.ts** - Main plugin class (`AITranscriptionPlugin`) extending Obsidian's Plugin

**src/types/** - TypeScript interfaces and types
- `AIProvider`, `TranscriptionResult`, `AITranscriptionSettings`
- `DEFAULT_SETTINGS`, `AI_PROVIDERS` configuration

**src/providers/** - Provider-specific transcription implementations
- Individual files for each provider (`gemini.ts`, `openai.ts`, etc.)
- Central routing function `transcribeWithAI()` in `index.ts`

**src/utils/** - Utility functions organized by purpose
- `formatters.ts` - Tag formatting, base64 conversion, MIME types
- `parsers.ts` - Response parsing for different AI providers
- `prompts.ts` - Prompt generation for transcription and extras
- `validation.ts` - API key and file validation
- `output.ts` - Output formatting for transcriptions, summaries, tags
- `providers.ts` - Provider configuration helpers
- `fallback.ts` - Non-AI text processing fallbacks

**src/settings/** - Settings UI components
- `SettingsTab.ts` - Settings tab extending PluginSettingTab

### Provider Architecture

The plugin supports two provider categories:

1. **Generalist Providers** (`isGeneralist: true`)
   - Google Gemini, OpenAI, Anthropic Claude, AssemblyAI
   - Support full features: transcription + summarization + tags + diagrams
   - Use `getTranscriptionPrompt()` to build structured prompts

2. **Specialist Providers** (`isGeneralist: false`)
   - Azure Speech, Deepgram
   - Transcription only - advanced features automatically disabled
   - Return simple `TranscriptionResult` with transcription field only

### Key Architectural Patterns

**Provider Routing**: The `transcribeWithAI()` function in `src/providers/index.ts` routes to provider-specific methods based on `settings.provider`.

**Response Parsing**: 
- Generalist providers return structured responses with sections (TRANSCRIPTION:, SUMMARY:, TAGS:, DIAGRAM:)
- Parsing functions in `src/utils/parsers.ts` extract each section
- `parseClaudeResponse()` handles Claude/AssemblyAI LeMUR responses
- `parseGeneralResponse()` handles standard AI responses

**Error Handling**: Each provider method includes specific error handling for API failures, with user-friendly notices.

**File Processing Flow**:
1. Extract media file reference from editor cursor position (`extractMediaFileName()`)
2. Validate provider requirements (`validateProviderRequirements()`)
3. Validate file existence and size (<50MB) (`validateFileSize()`)
4. Pass TFile object to provider-specific method
5. Provider handles file reading and format conversion internally
6. Parse response and format output (`formatTranscriptionOutput()`)
7. Insert formatted text below media reference

### Settings Management

Settings are stored in `data.json` with the structure defined by `AITranscriptionSettings` interface. Each provider has its own API key field to support multi-provider usage.

## API Integration Specifics

### Google Gemini
- Uses multimodal API with inline_data for audio
- Requires base64 encoding of media files
- Single API call for all features

### OpenAI
- Uses Whisper API for transcription
- Separate ChatGPT call for advanced features
- FormData upload for media files

### AssemblyAI
- Upload file first, then poll for transcription status
- Uses LeMUR for Claude integration when advanced features enabled
- Falls back to basic summarization API when Claude not available

### Azure & Deepgram
- Direct streaming APIs
- No advanced feature support
- Return transcription only

## Testing Guidelines

### Test Coverage Requirements
- **Minimum 80% coverage** for all new code
- **Meaningful tests only** - no trivial or fake tests
- Tests must validate actual behavior, edge cases, and error conditions
- Integration tests for provider implementations
- Unit tests for utility functions with real-world scenarios

### Test Structure
- Tests are organized in `src/__tests__/` mirroring the source structure
- Each module has comprehensive test coverage:
  - **Types**: Validate interfaces, constants, and type safety
  - **Utils**: Test formatters, parsers, validators with edge cases
  - **Providers**: Test API integrations, error handling, response parsing
  - **Settings**: Test UI interactions and configuration validation
  - **Main Plugin**: Test command execution and file processing

### Testing Philosophy
**All tests must be meaningful and test real functionality:**
- ✅ Test actual behavior with realistic inputs
- ✅ Test error conditions and edge cases  
- ✅ Test integration between components
- ✅ Validate data transformation accuracy
- ❌ No trivial tests (like testing if 1 === 1)
- ❌ No fake tests that don't validate real behavior
- ❌ No tests that merely call functions without assertions

### Test-Driven Development
When implementing new features:
1. Write comprehensive tests first
2. Ensure tests fail initially  
3. Implement feature to make tests pass
4. Verify >80% coverage is maintained
5. All tests must pass before merging

## Version Management

When releasing:
1. Update version in `manifest.json`, `package.json`, and `versions.json`
2. Update `CHANGELOG.md` - move Unreleased items to new version section
3. Update JSDoc version in main.ts
4. **Run full test suite and ensure >80% coverage**
5. Commit with message: `chore(release): prepare v1.2.3`
6. Tag release to trigger GitHub Actions: `git tag 1.2.3`

## Commit Standards

This project uses **Conventional Commits** for consistent git history and automatic CHANGELOG generation.

### Format
```
<type>(<scope>): <subject>
```

### Types
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Maintenance (build process, dependencies, etc)

### Examples
```bash
feat(providers): add support for Gemini 2.0 model
fix(transcription): handle empty audio files gracefully
docs(readme): update API key setup instructions
test(gemini): add edge case tests for large files
chore(deps): update Obsidian API to latest version
```

### Using Commitizen
For guided commit message creation:
```bash
npm install -g commitizen
git cz
```

## CI/CD Workflows

### GitHub Actions Setup

**CI Workflow (`ci.yml`)**:
- Runs on all PRs to `main`/`master` branch
- Installs dependencies with `npm ci`
- Runs full test suite with `npm test`
- Simple, lightweight CI focusing on test validation

**Release Workflow (`release.yml`)**:
- Triggers automatically on git tags
- Installs dependencies and builds plugin with `npm run build`
- Creates `styles.css` if it doesn't exist
- Validates release files for Obsidian plugin standards:
  - Checks required files exist (`manifest.json`, `main.js`, `styles.css`)
  - Validates version consistency between tag and manifest
- Creates GitHub release with proper Obsidian plugin files:
  - `manifest.json` (metadata)
  - `main.js` (compiled plugin code)  
  - `styles.css` (styling, auto-created if missing)
- Generates release notes with installation instructions

### Branch Protection Rules

The `main` branch protection can be configured to **require**:
1. ✅ All CI checks must pass (tests)
2. ✅ Pull request reviews
3. ✅ Up-to-date branches before merging

**Note**: Currently no automated security scanning, quality checks, or advanced CI features are configured. The setup focuses on simplicity with basic test validation and reliable releases.

### Release Process for Obsidian Community Store

1. **Development**: Work in feature branches, PRs require CI passing
2. **Release**: Create git tag matching version in `manifest.json`
3. **Auto-packaging**: GitHub Actions creates release with required files
4. **Community Submission**: Manual PR to `obsidianmd/obsidian-releases`

### Required Files for Obsidian Plugin Distribution

**Essential Files (included in releases)**:
- `manifest.json` - Plugin metadata (id, name, version, description, author, minAppVersion)
- `main.js` - Compiled TypeScript bundle with all dependencies
- `styles.css` - Optional CSS styling (included if exists)

**Files NOT included in releases**:
- Source TypeScript files (`*.ts`)
- Test files (`__tests__/`, `*.test.ts`)  
- Development config (`package.json`, `tsconfig.json`, build configs)
- Documentation (`README.md`, `CLAUDE.md`)
- Node modules or development dependencies

## Security Guidelines

### Security Best Practices

**Note**: This project currently has **no automated security scanning** configured in CI/CD. Security relies on manual code review and developer awareness.

**Never commit**:
- Real API keys or credentials
- Personal access tokens
- Private keys or certificates
- Database passwords or connection strings

**Safe practices**:
- Use environment variables for secrets
- Add `.env` files to `.gitignore`
- Use placeholder values in documentation
- Test with mock/fake credentials only

**Test file allowlist**:
- Test files can contain fake credentials for testing
- Patterns like `test-api-key`, `fake-key` are ignored
- Mock credentials must be clearly identifiable as non-real

## Documentation Maintenance

**IMPORTANT**: When modifying CI/CD workflows, update this CLAUDE.md file to reflect the actual implementation.

### Files to Update

1. **`CLAUDE.md`** (this file)
   - Update when: Any workflow or architecture changes
   - Contains: Project structure, CI/CD details, guidelines

### Update Checklist

When modifying workflows:
- [ ] Update this CLAUDE.md file
- [ ] Ensure examples match actual implementation
- [ ] Verify workflow descriptions are accurate