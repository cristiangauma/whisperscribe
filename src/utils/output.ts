/**
 * Output formatting utilities for transcription results
 */

import type { TranscriptionResult, AITranscriptionSettings } from '../types/index.js';

/**
 * Format transcription result into markdown output
 * 
 * @param result - The transcription result with optional features
 * @param settings - Plugin settings to determine which features to include
 * @returns Formatted markdown string ready for insertion
 */
export function formatTranscriptionOutput(result: TranscriptionResult, settings: AITranscriptionSettings): string {
	let outputText = '';
	
	if (settings.includeSummary && result.summary) {
		outputText = `\n## Summary\n${result.summary}\n\n## Transcription\n${result.transcription}\n`;
	} else {
		outputText = `\n## Transcription\n${result.transcription}\n`;
	}
	
	if (settings.proposeTags && result.tags && result.tags.length > 0) {
		outputText += `\n## Tags\n${result.tags.map(tag => `#${tag}`).join(' ')}\n`;
	}
	
	if (settings.generateDiagram && result.diagram) {
		outputText += `\n## Chart\n\`\`\`mermaid\n${result.diagram}\n\`\`\`\n`;
	}
	
	return outputText;
}

/**
 * Format just the tags portion for display
 * 
 * @param tags - Array of tag strings
 * @returns Formatted tags string with # prefixes
 */
export function formatTagsForDisplay(tags: string[]): string {
	return tags.map(tag => `#${tag}`).join(' ');
}

/**
 * Format diagram output with proper markdown code blocks
 * 
 * @param diagram - Mermaid diagram code
 * @returns Formatted diagram string with markdown code blocks
 */
export function formatDiagramOutput(diagram: string): string {
	return `\`\`\`mermaid\n${diagram}\n\`\`\``;
}