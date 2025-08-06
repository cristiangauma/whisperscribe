/**
 * Centralized export of all AI transcription providers
 * 
 * This file provides a single import point for all provider implementations
 * and includes the main transcription routing logic.
 */

import type { TFile } from 'obsidian';
import type { AIProvider, TranscriptionResult, AITranscriptionSettings } from '../types/index.js';

// Provider implementations
export { transcribeWithGemini } from './gemini.js';
export { transcribeWithOpenAI } from './openai.js';

// Import individual providers for routing
import { transcribeWithGemini } from './gemini.js';
import { transcribeWithOpenAI } from './openai.js';

/**
 * Main transcription routing function that delegates to appropriate provider
 * 
 * @param file - The media file to transcribe
 * @param settings - Plugin settings including provider selection
 * @param app - Obsidian app instance for file operations
 * @returns Promise resolving to transcription result with optional advanced features
 * @throws Error if invalid provider is selected
 */
export async function transcribeWithAI(
	file: TFile, 
	settings: AITranscriptionSettings, 
	app: any
): Promise<TranscriptionResult> {
	switch (settings.provider) {
		case 'google':
			return transcribeWithGemini(file, settings, app);
		case 'openai':
			return transcribeWithOpenAI(file, settings, app);
		default:
			throw new Error('Invalid provider selected');
	}
}