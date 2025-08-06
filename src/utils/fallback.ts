/**
 * Fallback utility functions for basic summarization and tag extraction
 * Used when AI providers don't support advanced features
 */

import { formatTagsAsObsidianTags } from './formatters.js';

/**
 * Settings interface for fallback functions
 */
interface FallbackSettings {
	includeSummary: boolean;
	summaryLength: 'short' | 'medium' | 'long' | 'bullet';
	proposeTags: boolean;
	generateDiagram: boolean;
}

/**
 * Generate basic summary and tags using simple text processing algorithms
 * Used as fallback when AI providers don't support advanced features
 * 
 * @param transcription - The transcription text to process
 * @param settings - Settings object or just summary length string for backward compatibility
 * @returns Object with optional summary, tags, and diagram
 */
export function generateGenericSummaryAndTags(
	transcription: string, 
	settings: FallbackSettings | 'short' | 'medium' | 'long' | 'bullet'
): {summary?: string, tags?: string[], diagram?: string} {
	const result: {summary?: string, tags?: string[], diagram?: string} = {};
	
	// Convert string settings to object for backward compatibility
	let settingsObj: FallbackSettings;
	if (typeof settings === 'string') {
		settingsObj = {
			includeSummary: true,
			summaryLength: settings,
			proposeTags: true,
			generateDiagram: false
		};
	} else {
		settingsObj = settings;
	}
	
	// Input validation
	if (!transcription || typeof transcription !== 'string') {
		if (settingsObj.includeSummary) {
			result.summary = 'No content provided for summarization.';
		}
		return result;
	}

	// Use a simple extractive summarization approach for providers without built-in summarization
	const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 10);
	
	if (sentences.length === 0) {
		if (settingsObj.includeSummary) {
			result.summary = 'No meaningful content to summarize.';
		}
		return result;
	}
	
	// Generate summary if requested
	if (settingsObj.includeSummary) {
		let summaryLength: number;
		switch (settingsObj.summaryLength) {
			case 'short':
				summaryLength = Math.min(2, Math.ceil(sentences.length * 0.1));
				break;
			case 'medium':
				summaryLength = Math.min(5, Math.ceil(sentences.length * 0.2));
				break;
			case 'long':
				summaryLength = Math.min(10, Math.ceil(sentences.length * 0.3));
				break;
			case 'bullet':
				summaryLength = Math.min(5, Math.ceil(sentences.length * 0.25));
				break;
			default:
				summaryLength = Math.min(5, Math.ceil(sentences.length * 0.2));
		}
		
		// Take first and last sentences, plus some from the middle
		const selectedSentences = [];
		selectedSentences.push(sentences[0]);
		
		if (summaryLength > 1 && sentences.length > 1) {
			selectedSentences.push(sentences[sentences.length - 1]);
		}
		
		if (summaryLength > 2) {
			const middleIndices = [];
			for (let i = 1; i < sentences.length - 1 && middleIndices.length < summaryLength - 2; i++) {
				middleIndices.push(i);
			}
			selectedSentences.splice(1, 0, ...middleIndices.map(i => sentences[i]));
		}
		
		if (settingsObj.summaryLength === 'bullet') {
			// Format as bullet points
			result.summary = selectedSentences.slice(0, summaryLength)
				.map(s => `• ${s.trim()}`)
				.join('\n');
		} else {
			result.summary = selectedSentences.slice(0, summaryLength).join('. ').trim() + '.';
		}
	}
	
	// Generate tags if requested
	if (settingsObj.proposeTags) {
		// Simple tag extraction based on common words
		const words = transcription.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter(w => w.length > 4);
		
		// Count word frequency
		const wordFreq: Record<string, number> = {};
		words.forEach(word => {
			if (!['the', 'this', 'that', 'with', 'from', 'about', 'would', 'could', 'should', 'where', 'when', 'which', 'while', 'their', 'there', 'these', 'those', 'through', 'being', 'doing', 'having'].includes(word)) {
				wordFreq[word] = (wordFreq[word] || 0) + 1;
			}
		});
		
		// Get top 5 most frequent meaningful words as tags
		const rawTags = Object.entries(wordFreq)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([word]) => word);
		result.tags = formatTagsAsObsidianTags(rawTags);
	}
	
	// Generate basic diagram if requested
	if (settingsObj.generateDiagram) {
		// Create a simple diagram based on sentence structure
		const mainSentences = sentences.slice(0, Math.min(6, sentences.length));
		let diagramNodes = '';
		let connections = '';
		
		if (mainSentences.length > 0) {
			// Create nodes
			for (let i = 0; i < mainSentences.length; i++) {
				const nodeId = `A${i + 1}`;
				const nodeText = mainSentences[i].substring(0, 40).trim() + (mainSentences[i].length > 40 ? '...' : '');
				diagramNodes += `    ${nodeId}["${nodeText}"]\n`;
			}
			
			// Create simple top-down flow
			for (let i = 0; i < mainSentences.length - 1; i++) {
				connections += `    A${i + 1} --> A${i + 2}\n`;
			}
			
			result.diagram = `flowchart TD\n${diagramNodes}${connections}`;
		}
	}
	
	return result;
}