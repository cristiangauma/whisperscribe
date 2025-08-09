/**
 * Google Gemini provider for AI transcription
 * Supports multimodal transcription with advanced features
 */

import { requestUrl, TFile, App } from 'obsidian';
import type { TranscriptionResult, AITranscriptionSettings } from '../types/index.js';
import {
	arrayBufferToBase64,
	getMimeType,
	getTranscriptionPrompt,
	parseGeneralResponse,
	cleanTranscription
} from '../utils/index.js';

/**
 * Transcribe audio using Google Gemini multimodal AI
 * 
 * @param file - The media file to transcribe
 * @param settings - Plugin settings for API key and model configuration
 * @param app - Obsidian app instance for file reading
 * @returns Promise resolving to transcription result with optional summary, tags, and diagram
 */
export async function transcribeWithGemini(
    file: TFile,
    settings: AITranscriptionSettings,
    app: App,
    progressCb?: (stage: string) => void
): Promise<TranscriptionResult> {
    const arrayBuffer = await app.vault.readBinary(file);
    const base64 = arrayBufferToBase64(arrayBuffer);
	
	const mimeType = getMimeType(file.extension);
	
	const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${settings.modelName}:generateContent?key=${settings.apiKey}`;
	
	const requestBody = {
		contents: [{
			parts: [
				{
					text: getTranscriptionPrompt({
						includeSummary: settings.includeSummary,
						summaryLength: settings.summaryLength,
						proposeTags: settings.proposeTags,
						generateDiagram: settings.generateDiagram,
						summaryLanguage: settings.summaryLanguage,
						customLanguage: settings.customLanguage
					})
				},
				{
					inline_data: {
						mime_type: mimeType,
						data: base64
					}
				}
			]
		}],
		generationConfig: {
			temperature: 0.05,  // Very low temperature for consistent language output
			topK: 1,
			topP: 0.8,  // Lower top-p to reduce randomness and potential repetition
			maxOutputTokens: 8192,
			// Removed hardcoded stopSequences - using dynamic pattern detection instead
		}
	};

    let response;
    try {
        progressCb?.('Sending audio to Gemini…');
        response = await requestUrl({
            url: apiUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
    } catch (error) {
        throw new Error(`Network error: ${error.message}`);
    }

	if (response.status !== 200) {
		let errorMessage = 'Failed to transcribe';
		try {
			const errorData = JSON.parse(response.text);
			errorMessage = errorData.error?.message || errorMessage;
		} catch {
			// If parsing fails, use the raw response text or default message
			errorMessage = response.text || errorMessage;
		}
		throw new Error(`Gemini API error (${response.status}): ${errorMessage}`);
	}

    progressCb?.('Parsing Gemini response…');
    const data = JSON.parse(response.text);
	
	if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
		throw new Error('No transcription received from Gemini');
	}
	
    const responseText = data.candidates[0].content.parts[0].text;
	
	// Use the advanced features based on settings
	const hasAdvancedFeatures = settings.includeSummary || settings.proposeTags || settings.generateDiagram;
    const parsedResult = parseGeneralResponse(responseText, hasAdvancedFeatures);
	
	// Clean the transcription to remove repetitive patterns/hallucinations
    if (parsedResult.transcription) {
        progressCb?.('Cleaning transcription…');
        const { cleanedText, hadHallucination } = cleanTranscription(parsedResult.transcription);
        parsedResult.transcription = cleanedText;
		
		// If hallucination was detected, add a note to the result
		if (hadHallucination) {
			// Add a subtle note that doesn't interfere with the transcription
			parsedResult.transcription += '\n\n*[Note: Some repetitive content was automatically cleaned from this transcription]*';
		}
	}
	
    return parsedResult;
}
