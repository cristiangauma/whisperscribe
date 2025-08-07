/**
 * OpenAI provider for AI transcription
 * Uses Whisper API for transcription and ChatGPT for advanced features
 */

import { TFile } from 'obsidian';
import type { TranscriptionResult, AITranscriptionSettings } from '../types/index.js';
import {
	getMimeType,
	generateOpenAIExtrasPrompt,
	parseClaudeResponse,
	cleanTranscription
} from '../utils/index.js';

/**
 * Transcribe audio using OpenAI Whisper API
 * 
 * @param file - The media file to transcribe
 * @param settings - Plugin settings for API key and model configuration
 * @param app - Obsidian app instance for file reading
 * @returns Promise resolving to transcription result with optional summary, tags, and diagram
 */
export async function transcribeWithOpenAI(
	file: TFile, 
	settings: AITranscriptionSettings, 
	app: any
): Promise<TranscriptionResult> {
	const arrayBuffer = await app.vault.readBinary(file);
	const blob = new Blob([arrayBuffer], { type: getMimeType(file.extension) });
	
	// Use Whisper for audio-only models, GPT-5 for generalist models
	const isWhisperModel = settings.openaiModel === 'whisper-1';
	const formData = new FormData();
	formData.append('file', blob, file.name);
	formData.append('model', isWhisperModel ? 'whisper-1' : settings.openaiModel);
	// Anti-hallucination prompt for Whisper
	formData.append('prompt', 'Transcribe clearly audible speech only. Ignore background music, noise, and silence. Do not repeat words or create repetitive patterns. Use [unclear] for inaudible sections.');
	// Additional parameters to reduce hallucinations
	formData.append('temperature', '0.0');  // Lower temperature for more deterministic output
	
	const apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
	
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${settings.openaiApiKey}`
		},
		body: formData
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error?.message || 'Failed to transcribe with OpenAI');
	}

	const data = await response.json();
	let transcription = data.text;
	
	// Clean the transcription to remove repetitive patterns/hallucinations
	const { cleanedText, hadHallucination } = cleanTranscription(transcription);
	transcription = cleanedText;
	
	// If hallucination was detected, add a note
	if (hadHallucination) {
		console.warn('WhisperScribe: Repetitive patterns detected and cleaned from OpenAI transcription');
		transcription += '\n\n*[Note: Some repetitive content was automatically cleaned from this transcription]*';
	}
	
	if (settings.includeSummary || settings.proposeTags || settings.generateDiagram) {
		const extras = await generateExtrasWithOpenAI(transcription, settings);
		return { transcription, ...extras };
	} else {
		return { transcription };
	}
}

/**
 * Generate advanced features using OpenAI ChatGPT
 * 
 * @param transcription - The transcription text to process
 * @param settings - Plugin settings for feature configuration
 * @returns Promise resolving to optional summary, tags, and diagram
 */
async function generateExtrasWithOpenAI(
	transcription: string, 
	settings: AITranscriptionSettings
): Promise<{summary?: string, tags?: string[], diagram?: string}> {
	const promptText = generateOpenAIExtrasPrompt({
		includeSummary: settings.includeSummary,
		summaryLength: settings.summaryLength,
		proposeTags: settings.proposeTags,
		generateDiagram: settings.generateDiagram,
		summaryLanguage: settings.summaryLanguage,
		customLanguage: settings.customLanguage
	}, transcription);
	
	if (!promptText) {
		return {};
	}
	
	const apiUrl = 'https://api.openai.com/v1/chat/completions';
	
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${settings.openaiApiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: settings.openaiModel.startsWith('gpt-5') ? settings.openaiModel : 'gpt-3.5-turbo',
			messages: [
				...(settings.summaryLanguage && settings.summaryLanguage !== 'same-as-audio' && settings.summaryLanguage !== 'separator' ? [{
					role: 'system',
					content: `You are a helpful assistant that ALWAYS responds in ${
						settings.summaryLanguage === 'custom' ? settings.customLanguage : 
						settings.summaryLanguage.charAt(0).toUpperCase() + settings.summaryLanguage.slice(1)
					}. Never use any other language in your responses.`
				}] : []),
				{
					role: 'user',
					content: promptText
				}
			],
			max_tokens: settings.summaryLength === 'short' ? 150 : 
				settings.summaryLength === 'medium' ? 350 : 
				settings.summaryLength === 'bullet' ? 250 : 650,
			temperature: 0.1  // Lower temperature for more consistent language output
		})
	});
	
	if (!response.ok) {
		throw new Error('Failed to generate summary with OpenAI');
	}
	
	const data = await response.json();
	const responseContent = data.choices[0].message.content;
	
	// Parse using the same logic as Claude responses
	return parseClaudeResponse(responseContent);
}