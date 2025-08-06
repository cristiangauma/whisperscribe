/**
 * Validation utilities for file processing and API keys
 */

import type { AIProvider, AITranscriptionSettings, ModelConfig } from '../types/index.js';
import { AI_PROVIDERS, PROVIDER_MODELS } from '../types/index.js';

/**
 * Validate that the required API key is present for a provider
 * 
 * @param provider - The AI provider to validate
 * @param settings - Plugin settings containing API keys
 * @returns The API key string or null if not found
 */
export function getApiKeyForProvider(provider: AIProvider, settings: AITranscriptionSettings): string | null {
	switch (provider) {
		case 'google':
			return settings.apiKey || null;
		case 'openai':
			return settings.openaiApiKey || null;
		default:
			return null;
	}
}

/**
 * Get the current model configuration for a provider
 * 
 * @param provider - The AI provider
 * @param settings - Plugin settings
 * @returns ModelConfig object with file size limits and features
 */
export function getModelConfigForProvider(provider: AIProvider, settings: AITranscriptionSettings): ModelConfig {
	const models = PROVIDER_MODELS[provider];
	if (!models) {
		throw new Error(`No model configuration found for provider: ${provider}`);
	}

	let currentModelId = '';
	let customName = '';
	let customLimit = 0;

	// Get the current model ID and custom settings
	switch (provider) {
		case 'google':
			currentModelId = settings.modelName;
			customName = settings.customModelName || '';
			customLimit = settings.customFileSizeLimitMB || 20;
			break;
		case 'openai':
			currentModelId = settings.openaiModel;
			customName = settings.customOpenaiModel || '';
			customLimit = settings.customOpenaiFileSizeLimitMB || 25;
			break;
	}

	// Find the model configuration
	const modelConfig = models.find(model => model.id === currentModelId);
	if (!modelConfig) {
		// Fallback to first model if current model not found
		return models[0];
	}

	// If custom model, create custom configuration
	if (modelConfig.isCustom && customName) {
		return {
			name: `Custom: ${customName}`,
			id: customName,
			fileSizeLimitMB: customLimit,
			supportsAdvancedFeatures: modelConfig.supportsAdvancedFeatures,
			description: `Custom ${AI_PROVIDERS[provider]?.name} model`
		};
	}

	return modelConfig;
}

/**
 * Get the model name for a provider, with validation
 * 
 * @param provider - The AI provider
 * @param settings - Plugin settings containing model names
 * @returns The model name string
 * @throws Error if model name is empty or invalid
 */
export function getModelForProvider(provider: AIProvider, settings: AITranscriptionSettings): string {
	const modelConfig = getModelConfigForProvider(provider, settings);
	
	// For custom models, return the actual custom name
	if (modelConfig.id === 'custom') {
		switch (provider) {
			case 'google':
				return settings.customModelName || settings.modelName;
			case 'openai':
				return settings.customOpenaiModel || settings.openaiModel;
		}
	}

	return modelConfig.id;
}

/**
 * Validate media file patterns and extract filename
 * 
 * @param line - Line of text to search for media references
 * @returns Extracted filename or null if not found
 */
export function extractMediaFileName(line: string): string | null {
	const audioRegex = /!\[\[([^|\]]+\.(mp3|wav|ogg|m4a)(\|[^\]]+)?)\]\]/gi;
	const embeddedRegex = /<audio[^>]*src=["']([^"']+)["'][^>]*>/gi;
	
	let match = audioRegex.exec(line) || embeddedRegex.exec(line);
	
	if (!match) {
		return null;
	}

	const fileName = match[1].split('|')[0].split('/').pop();
	return fileName || null;
}

/**
 * Validate file size against model-specific limits
 * 
 * @param size - File size in bytes
 * @param provider - The AI provider
 * @param settings - Plugin settings
 * @returns Validation result with specific error message
 */
export function validateFileSizeForModel(
	size: number, 
	provider: AIProvider, 
	settings: AITranscriptionSettings
): { isValid: boolean; errorMessage?: string; suggestedMaxSizeMB?: number } {
	try {
		const modelConfig = getModelConfigForProvider(provider, settings);
		const maxSizeBytes = modelConfig.fileSizeLimitMB * 1024 * 1024;
		const actualSizeMB = Math.round(size / (1024 * 1024) * 10) / 10; // Round to 1 decimal

		if (size > maxSizeBytes) {
			return {
				isValid: false,
				errorMessage: `File size (${actualSizeMB}MB) exceeds the ${modelConfig.name} model limit of ${modelConfig.fileSizeLimitMB}MB. Please use a smaller file or switch to a model with a higher limit.`,
				suggestedMaxSizeMB: modelConfig.fileSizeLimitMB
			};
		}

		return { isValid: true };
	} catch (error) {
		// Fallback to default validation
		return validateFileSize(size) ? 
			{ isValid: true } : 
			{ isValid: false, errorMessage: 'File size exceeds 50MB limit' };
	}
}

/**
 * Validate file size limits (50MB for most providers) - Legacy function
 * 
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes (default 50MB)
 * @returns True if file size is valid
 */
export function validateFileSize(size: number, maxSize: number = 50 * 1024 * 1024): boolean {
	return size <= maxSize;
}

/**
 * Validate provider-specific requirements
 * 
 * @param provider - The AI provider
 * @param settings - Plugin settings
 * @returns Validation result with error message if invalid
 */
export function validateProviderRequirements(
	provider: AIProvider, 
	settings: AITranscriptionSettings
): { isValid: boolean; errorMessage?: string } {
	// Validate API key for all providers
	const apiKey = getApiKeyForProvider(provider, settings);
	
	if (!apiKey) {
		const providerName = AI_PROVIDERS[provider]?.name || 'AI Provider';
		return {
			isValid: false,
			errorMessage: `Please set your ${providerName} API key in settings`
		};
	}

	try {
		getModelForProvider(provider, settings);
	} catch (error) {
		return {
			isValid: false,
			errorMessage: error.message
		};
	}

	return { isValid: true };
}