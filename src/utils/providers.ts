/**
 * Provider utility functions for determining capabilities and routing
 */

import type { AIProvider, AITranscriptionSettings } from '../types/index.js';
import { AI_PROVIDERS } from '../types/index.js';
import { getModelConfigForProvider } from './validation.js';

/**
 * Check if a model supports advanced features (summary, tags, diagrams) based on current settings
 * 
 * @param provider - The AI provider
 * @param settings - Plugin settings to get current model configuration
 * @returns True if the current model supports advanced features
 */
export function isModelGeneralist(provider: AIProvider, settings: AITranscriptionSettings): boolean {
	try {
		const modelConfig = getModelConfigForProvider(provider, settings);
		return modelConfig.supportsAdvancedFeatures;
	} catch {
		// Fallback to provider-level check
		return isProviderGeneralist(provider);
	}
}

/**
 * Check if a provider supports advanced features (summary, tags, diagrams) - Legacy function
 * 
 * @param provider - The AI provider to check
 * @returns True if provider supports advanced features, false for transcription-only
 */
export function isProviderGeneralist(provider: AIProvider): boolean {
	return AI_PROVIDERS[provider]?.isGeneralist || false;
}

/**
 * Get provider configuration
 * 
 * @param provider - The AI provider
 * @returns Provider configuration object
 */
export function getProviderConfig(provider: AIProvider) {
	return AI_PROVIDERS[provider];
}

/**
 * Get all available providers
 * 
 * @returns Record of all provider configurations
 */
export function getAllProviders() {
	return AI_PROVIDERS;
}

// Re-export AI_PROVIDERS for convenience
export { AI_PROVIDERS };