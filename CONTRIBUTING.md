# Contributing to WhisperScribe

Thank you for your interest in contributing! This document covers how to set up the project locally, coding and commit standards, and the checks to run before opening a pull request.

## Development

> Note: This plugin was developed with the assistance of Claude Code, an AI-powered coding assistant. While the implementation prioritizes functionality and follows Obsidian plugin best practices, the code architecture reflects an iterative development approach. The plugin is fully functional and tested, though there may be opportunities for further optimization and refinement in future releases.

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/whisperscribe.git

# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Quality Checks

Before submitting a PR, ensure:

```bash
# All tests pass
npm test
```

### Commit Standards

This project uses Conventional Commits to maintain a clean git history and automatically generate CHANGELOGs. We recommend using Commitizen (Python) installed via pipx.

#### Using Commitizen via pipx (Recommended)

```bash
# Install Commitizen globally (isolated) with pipx
pipx install commitizen

# Make your changes, then commit using the guided prompt
cz commit
# or the shortcut
cz c

# Upgrade when needed
pipx upgrade commitizen
```

The interactive prompt will guide you to create a properly formatted commit message.

#### Manual Commit Format

If you prefer manual commits, follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code changes that neither fix bugs nor add features
- test: Adding or updating tests
- chore: Maintenance tasks

Examples:
```bash
git commit -m "feat(providers): add support for new Gemini model"
git commit -m "fix(transcription): handle empty audio files gracefully"
git commit -m "docs(readme): update API key instructions"
```

## Pull Requests

- Ensure commits follow Conventional Commits
- Keep PRs focused and small when possible
- Add or update tests when changing behavior
- Update documentation if needed

## Contributing

Contributions are welcome! Please follow the commit standards above and ensure all tests pass before submitting a pull request.


