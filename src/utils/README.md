# Utility Functions

This directory contains utility functions extracted from the main plugin file to improve code organization and reusability.

## File Organization

### `formatters.ts`
**Data formatting and conversion utilities**
- `formatTagsAsObsidianTags(tags: string[])` - Converts raw tags to Obsidian-compatible format
- `arrayBufferToBase64(buffer: ArrayBuffer)` - Converts ArrayBuffer to base64 string
- `getMimeType(extension: string)` - Maps file extensions to MIME types

### `parsers.ts`
**Response parsing utilities for AI providers**
- `parseClaudeResponse(response: string)` - Parses Claude/AssemblyAI LeMUR responses
- `parseGeneralResponse(responseText: string, includeFeatures: boolean)` - Parses general AI provider responses

### `prompts.ts`
**Prompt generation utilities**
- `getSummaryPrompt(summaryLength: string)` - Generates summary prompt descriptions
- `getTranscriptionPrompt(settings: PromptSettings)` - Creates comprehensive transcription prompts
- `buildClaudePrompt(settings: PromptSettings)` - Builds Claude-specific prompts for LeMUR
- `generateOpenAIExtrasPrompt(settings: PromptSettings, transcription: string)` - Creates OpenAI extras prompts

### `providers.ts`
**Provider configuration and capability utilities**
- `isProviderGeneralist(provider: AIProvider)` - Checks if provider supports advanced features
- `getProviderConfig(provider: AIProvider)` - Gets provider configuration
- `getAllProviders()` - Returns all provider configurations
- `AI_PROVIDERS` - Re-exported provider configurations

### `validation.ts`
**Validation utilities for API keys and requirements**
- `getApiKeyForProvider(provider: AIProvider, settings: AITranscriptionSettings)` - Retrieves API key for provider
- `getModelForProvider(provider: AIProvider, settings: AITranscriptionSettings)` - Gets and validates model name
- `extractMediaFileName(line: string)` - Extracts filename from media references
- `validateFileSize(size: number, maxSize?: number)` - Validates file size limits
- `validateProviderRequirements(provider: AIProvider, settings: AITranscriptionSettings)` - Comprehensive provider validation

### `fallback.ts`
**Fallback processing utilities**
- `generateGenericSummaryAndTags(transcription: string, settings: FallbackSettings)` - Basic text processing for non-AI features

### `output.ts`
**Output formatting utilities**
- `formatTranscriptionOutput(result: TranscriptionResult, settings: AITranscriptionSettings)` - Formats complete transcription output
- `formatTagsForDisplay(tags: string[])` - Formats tags for display
- `formatDiagramOutput(diagram: string)` - Formats Mermaid diagrams

### `index.ts`
**Central export file**
Exports all utility functions for easy importing throughout the application.

## Usage

Import utilities in your code:

```typescript
import {
  formatTagsAsObsidianTags,
  parseClaudeResponse,
  getTranscriptionPrompt,
  isProviderGeneralist,
  validateProviderRequirements,
  formatTranscriptionOutput
} from './src/utils/index.js';
```

## Benefits

- **Modularity**: Functions are grouped by purpose and responsibility
- **Reusability**: Common functions can be used across multiple providers
- **Testability**: Individual utility functions can be easily unit tested
- **Maintainability**: Changes to utility functions don't require modifying the main plugin file
- **Type Safety**: All utilities are properly typed with TypeScript