/**
 * Utility functions for WhisperScribe plugin
 * Centralized export of all utility modules
 */

// Formatting utilities
export {
	formatTagsAsObsidianTags,
	arrayBufferToBase64,
	getMimeType
} from './formatters.js';

// Response parsing utilities
export {
	parseClaudeResponse,
	parseGeneralResponse
} from './parsers.js';

// Prompt generation utilities
export {
	getSummaryPrompt,
	getTranscriptionPrompt,
	generateOpenAIExtrasPrompt
} from './prompts.js';

// Provider utilities
export {
	AI_PROVIDERS,
	isProviderGeneralist,
	isModelGeneralist,
	getProviderConfig,
	getAllProviders
} from './providers.js';

// Fallback utilities
export {
	generateGenericSummaryAndTags
} from './fallback.js';

// Validation utilities
export {
	getApiKeyForProvider,
	getModelForProvider,
	getModelConfigForProvider,
	extractMediaFileName,
	validateFileSize,
	validateFileSizeForModel,
	validateProviderRequirements
} from './validation.js';

// Output formatting utilities
export {
	formatTranscriptionOutput,
	formatTagsForDisplay,
	formatDiagramOutput
} from './output.js';

// Transcription cleaning utilities
export {
	cleanRepetitiveText,
	detectHallucination,
	cleanTranscription
} from './transcription-cleaner.js';