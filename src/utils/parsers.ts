/**
 * Response parsing utilities for different AI providers
 */

import { formatTagsAsObsidianTags } from './formatters.js';

/**
 * Parse Claude/AssemblyAI LeMUR response to extract structured content
 * 
 * @param response - Raw response string from Claude/LeMUR
 * @returns Parsed object with optional summary, tags, and diagram
 */
export function parseClaudeResponse(response: string): {summary?: string, tags?: string[], diagram?: string} {
	const result: {summary?: string, tags?: string[], diagram?: string} = {};
	
	const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=\n(?:TAGS|DIAGRAM):|$)/i);
	const tagsMatch = response.match(/TAGS:\s*([\s\S]*?)(?=\nDIAGRAM:|$)/i);
	const diagramMatch = response.match(/DIAGRAM:\s*([\s\S]*?)$/i);
	
	if (summaryMatch) {
		result.summary = summaryMatch[1].trim();
	}
	
	if (tagsMatch) {
		const tagsText = tagsMatch[1].trim();
		const rawTags = tagsText.split(/[,\n]/)
			.map(tag => tag.trim().replace(/^[-*•]\s*/, '').replace(/^#/, ''))
			.filter(tag => tag.length > 0)
			.slice(0, 5);
		result.tags = formatTagsAsObsidianTags(rawTags);
	}
	
	if (diagramMatch) {
		result.diagram = diagramMatch[1].trim()
			.replace(/^```mermaid\s*/i, '')
			.replace(/```\s*$/, '')
			.trim();
	}
	
	return result;
}

/**
 * Parse a general provider response to extract transcription and optional features
 * 
 * @param responseText - Raw response text from AI provider
 * @param includeFeatures - Whether to parse advanced features (summary, tags, diagram)
 * @returns Object with transcription and optional parsed features
 */
export function parseGeneralResponse(responseText: string, includeFeatures: boolean): {
	transcription: string;
	summary?: string;
	tags?: string[];
	diagram?: string;
} {
	if (!includeFeatures) {
		return { transcription: responseText };
	}

	const transcriptionMatch = responseText.match(/TRANSCRIPTION:\s*([\s\S]*?)(?=\n\n(?:SUMMARY|TAGS|DIAGRAM):|$)/i);
	const summaryMatch = responseText.match(/SUMMARY:\s*([\s\S]*?)(?=\n\n(?:TAGS|DIAGRAM):|$)/i);
	const tagsMatch = responseText.match(/TAGS:\s*([\s\S]*?)(?=\n\nDIAGRAM:|$)/i);
	const diagramMatch = responseText.match(/DIAGRAM:\s*([\s\S]*?)$/i);
	
	const transcription = transcriptionMatch?.[1]?.trim() || responseText;
	const summary = summaryMatch?.[1]?.trim();
	
	let tags: string[] | undefined;
	if (tagsMatch) {
		const tagsText = tagsMatch[1].trim();
		// Parse tags - they might be comma-separated or on separate lines
		const rawTags = tagsText.split(/[,\n]/)
			.map(tag => tag.trim().replace(/^[-*•]\s*/, '').replace(/^#/, ''))
			.filter(tag => tag.length > 0)
			.slice(0, 5);
		tags = formatTagsAsObsidianTags(rawTags);
	}
	
	let diagram: string | undefined;
	if (diagramMatch) {
		diagram = diagramMatch[1].trim()
			.replace(/^```mermaid\s*/i, '')
			.replace(/```\s*$/, '')
			.trim();
	}
	
	return { transcription, summary, tags, diagram };
}