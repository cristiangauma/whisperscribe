/**
 * Prompt generation utilities for different AI providers and features
 */

/**
 * Settings interface for prompt generation (subset of AITranscriptionSettings)
 */
interface PromptSettings {
	includeSummary: boolean;
	summaryLength: 'short' | 'medium' | 'long' | 'bullet';
	proposeTags: boolean;
	generateDiagram: boolean;
	summaryLanguage?: 'same-as-audio' | 'separator' | 'english' | 'spanish' | 'french' | 'german' | 'italian' | 'portuguese' | 'russian' | 'japanese' | 'korean' | 'chinese' | 'hindi' | 'arabic' | 'dutch' | 'swedish' | 'polish' | 'turkish' | 'catalan' | 'custom';
	customLanguage?: string;
}

/**
 * Get language instruction for prompts
 * 
 * @param summaryLanguage - The configured summary language
 * @param customLanguage - Custom language if selected
 * @returns Language instruction string
 */
function getLanguageInstruction(summaryLanguage?: string, customLanguage?: string): string {
	if (!summaryLanguage || summaryLanguage === 'same-as-audio' || summaryLanguage === 'separator') {
		return '';
	}
	
	if (summaryLanguage === 'custom' && customLanguage) {
		return ` in ${customLanguage}`;
	}
	
	const languageMap: Record<string, string> = {
		'english': 'English',
		'spanish': 'Spanish',
		'french': 'French',
		'german': 'German',
		'italian': 'Italian',
		'portuguese': 'Portuguese',
		'russian': 'Russian',
		'japanese': 'Japanese',
		'korean': 'Korean',
		'chinese': 'Chinese',
		'hindi': 'Hindi',
		'arabic': 'Arabic',
		'dutch': 'Dutch',
		'swedish': 'Swedish',
		'polish': 'Polish',
		'turkish': 'Turkish',
		'catalan': 'Catalan'
	};
	
	const language = languageMap[summaryLanguage];
	return language ? ` in ${language}` : '';
}

/**
 * Get stronger language enforcement instruction
 * 
 * @param summaryLanguage - The configured summary language
 * @param customLanguage - Custom language if selected
 * @returns Strong language instruction string for the beginning of prompts
 */
function getStrongLanguageInstruction(summaryLanguage?: string, customLanguage?: string): string {
	if (!summaryLanguage || summaryLanguage === 'same-as-audio' || summaryLanguage === 'separator') {
		return '';
	}
	
	let language = '';
	let languagePrefix = '';
	if (summaryLanguage === 'custom' && customLanguage) {
		language = customLanguage;
		languagePrefix = customLanguage;
	} else {
		const languageMap: Record<string, string> = {
			'english': 'English',
			'spanish': 'Spanish (Español)',
			'french': 'French (Français)',
			'german': 'German (Deutsch)',
			'italian': 'Italian (Italiano)',
			'portuguese': 'Portuguese (Português)',
			'russian': 'Russian (Русский)',
			'japanese': 'Japanese (日本語)',
			'korean': 'Korean (한국어)',
			'chinese': 'Chinese (中文)',
			'hindi': 'Hindi (हिन्दी)',
			'arabic': 'Arabic (العربية)',
			'dutch': 'Dutch (Nederlands)',
			'swedish': 'Swedish (Svenska)',
			'polish': 'Polish (Polski)',
			'turkish': 'Turkish (Türkçe)',
			'catalan': 'Catalan (Català)'
		};
		const prefixMap: Record<string, string> = {
			'spanish': 'Español',
			'french': 'Français',
			'german': 'Deutsch',
			'italian': 'Italiano',
			'portuguese': 'Português',
			'catalan': 'Català'
		};
		language = languageMap[summaryLanguage] || '';
		languagePrefix = prefixMap[summaryLanguage] || language.split(' ')[0];
	}
	
	return language ? `Language: ${languagePrefix}\nIMPORTANT: You MUST provide ALL outputs (summary, tags, and diagram labels) ONLY in ${language}. Do NOT use any other language, regardless of the audio language.\n\n` : '';
}

/**
 * Get summary prompt description based on settings
 * 
 * @param summaryLength - The configured summary length
 * @returns Description string for the summary length
 */
export function getSummaryPrompt(summaryLength: 'short' | 'medium' | 'long' | 'bullet'): string {
	switch (summaryLength) {
		case 'short':
			return 'a brief 2-3 sentence summary';
		case 'medium':
			return 'a comprehensive paragraph summary';
		case 'long':
			return 'a detailed multi-paragraph summary';
		case 'bullet':
			return 'a summary as a maximum of 5 brief bullet points highlighting the most important things';
		default:
			return 'a comprehensive paragraph summary';
	}
}

/**
 * Generate comprehensive transcription prompt for multimodal AI providers (like Gemini)
 * 
 * @param settings - Plugin settings to determine which features to include
 * @returns Complete prompt string for transcription with optional features
 */
export function getTranscriptionPrompt(settings: PromptSettings): string {
	const parts = [];
	
	// Add strong language instruction at the very beginning for Gemini
	const strongLangInstruction = getStrongLanguageInstruction(settings.summaryLanguage, settings.customLanguage);
	if (strongLangInstruction && settings.summaryLanguage !== 'same-as-audio' && settings.summaryLanguage !== 'separator' && 
	    (settings.includeSummary || settings.proposeTags || settings.generateDiagram)) {
		parts.push(strongLangInstruction);
	}
	
	parts.push("Transcribe this audio completely and accurately. IMPORTANT: If you encounter unclear audio, silence, background noise, or music, do NOT repeat words or create repetitive text patterns. Only transcribe clearly audible speech. If a section is unclear, use '[unclear]' instead of repeating text or creating hallucinated content.");
	
	if (settings.includeSummary || settings.proposeTags || settings.generateDiagram) {
		const langInstruction = getLanguageInstruction(settings.summaryLanguage, settings.customLanguage);
		
		parts.push(" then provide:");
		
		if (settings.includeSummary) {
			const summaryPrompt = getSummaryPrompt(settings.summaryLength);
			if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
				parts.push(`\n- ${summaryPrompt} in the same language as the audio`);
			} else {
				parts.push(`\n- ${summaryPrompt}${langInstruction}`);
			}
		}
		
		if (settings.proposeTags) {
			if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
				parts.push("\n- A maximum of 5 relevant tags for categorizing this content (use simple words, avoid spaces) in the same language as the audio");
			} else {
				parts.push(`\n- A maximum of 5 relevant tags for categorizing this content (use simple words, avoid spaces)${langInstruction}`);
			}
		}
		
		if (settings.generateDiagram) {
			if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
				parts.push("\n- A Mermaid diagram (flowchart TD format) that organizes the main ideas and their relationships from top to bottom. Use clear, concise node labels and logical connections. Keep it simple with 5-10 nodes maximum. Label nodes in the same language as the audio.");
			} else {
				parts.push(`\n- A Mermaid diagram (flowchart TD format) that organizes the main ideas and their relationships from top to bottom. Use clear, concise node labels${langInstruction} and logical connections. Keep it simple with 5-10 nodes maximum.`);
			}
		}
		
		parts.push("\n\nFormat your response as:");
		parts.push("\n\nTRANSCRIPTION:\n[exact transcription in its original language]");
		
		if (settings.includeSummary) {
			const langNote = (settings.summaryLanguage !== 'same-as-audio' && settings.summaryLanguage !== 'separator') ? `${langInstruction}` : '';
			parts.push(`\n\nSUMMARY:\n[${settings.summaryLength === 'bullet' ? 'bullet points' : 'summary'}${langNote}]`);
		}
		
		if (settings.proposeTags) {
			const langNote = (settings.summaryLanguage !== 'same-as-audio' && settings.summaryLanguage !== 'separator') ? `${langInstruction}` : '';
			parts.push(`\n\nTAGS:\n[tag1, tag2, tag3, ...${langNote}]`);
		}
		
		if (settings.generateDiagram) {
			const langNote = (settings.summaryLanguage !== 'same-as-audio' && settings.summaryLanguage !== 'separator') ? ` with labels${langInstruction}` : '';
			parts.push(`\n\nDIAGRAM:\n[mermaid flowchart TD code without backticks${langNote}]`);
		}
	} else {
		parts.push(". Output ONLY the raw transcription text without any introductions, explanations, formatting, timestamps, or commentary. Just the spoken words exactly as they are said.");
	}
	
	return parts.join("");
}

/**
 * Build Claude-specific prompt for AssemblyAI LeMUR integration
 * 
 * @param settings - Plugin settings to determine which features to include
 * @returns Prompt string for Claude processing via LeMUR
 */
export function buildClaudePrompt(settings: PromptSettings): string {
	const parts = [];
	const langInstruction = getLanguageInstruction(settings.summaryLanguage, settings.customLanguage);
	
	// Add strong language instruction if not "same-as-audio" or "separator"
	const strongLangInstruction = getStrongLanguageInstruction(settings.summaryLanguage, settings.customLanguage);
	if (strongLangInstruction && settings.summaryLanguage !== 'same-as-audio' && settings.summaryLanguage !== 'separator' && 
	    (settings.includeSummary || settings.proposeTags || settings.generateDiagram)) {
		parts.push(strongLangInstruction);
		parts.push(`Remember: ALL outputs MUST be${langInstruction} ONLY.`);
	}
	
	if (settings.includeSummary) {
		const summaryPrompt = getSummaryPrompt(settings.summaryLength);
		if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
			parts.push(`Please provide ${summaryPrompt} of this transcription in the same language as the transcription.`);
		} else {
			parts.push(`Please provide ${summaryPrompt} of this transcription${langInstruction}.`);
		}
	}
	
	if (settings.proposeTags) {
		if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
			parts.push('Also provide a maximum of 5 relevant tags for categorizing this content (use simple words, avoid spaces) in the same language as the transcription.');
		} else {
			parts.push(`Also provide a maximum of 5 relevant tags for categorizing this content (use simple words, avoid spaces)${langInstruction}.`);
		}
	}
	
	if (settings.generateDiagram) {
		if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
			parts.push('Create a Mermaid diagram (flowchart TD format) that organizes the main ideas and their relationships from top to bottom. Use clear, concise node labels in the same language as the transcription and logical connections. Keep it simple with 5-10 nodes maximum.');
		} else {
			parts.push(`Create a Mermaid diagram (flowchart TD format) that organizes the main ideas and their relationships from top to bottom. Use clear, concise node labels${langInstruction} and logical connections. Keep it simple with 5-10 nodes maximum.`);
		}
	}
	
	if (settings.includeSummary || settings.proposeTags || settings.generateDiagram) {
		parts.push('\n\nFormat your response as:');
		if (settings.includeSummary) {
			parts.push(`\nSUMMARY:\n[${settings.summaryLength === 'bullet' ? 'bullet points' : 'summary'}]`);
		}
		if (settings.proposeTags) {
			parts.push('\nTAGS:\n[tag1, tag2, tag3, ...]');
		}
		if (settings.generateDiagram) {
			parts.push('\nDIAGRAM:\n[mermaid flowchart TD code without backticks]');
		}
	}
	
	return parts.join(' ');
}

/**
 * Generate OpenAI-specific extras prompt for post-transcription processing
 * 
 * @param settings - Plugin settings to determine which features to include
 * @param transcription - The transcription text to process
 * @returns Complete prompt for OpenAI ChatGPT processing
 */
export function generateOpenAIExtrasPrompt(settings: PromptSettings, transcription: string): string {
	const parts = [];
	const langInstruction = getLanguageInstruction(settings.summaryLanguage, settings.customLanguage);
	
	// Add strong language instruction if not "same-as-audio" or "separator"
	const strongLangInstruction = getStrongLanguageInstruction(settings.summaryLanguage, settings.customLanguage);
	if (strongLangInstruction && settings.summaryLanguage !== 'same-as-audio' && settings.summaryLanguage !== 'separator' && 
	    (settings.includeSummary || settings.proposeTags || settings.generateDiagram)) {
		parts.push(strongLangInstruction);
		parts.push(`Remember: ALL outputs MUST be${langInstruction} ONLY.`);
	}
	
	if (settings.includeSummary) {
		const summaryPrompt = getSummaryPrompt(settings.summaryLength);
		if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
			parts.push(`Please provide ${summaryPrompt} of the following transcription in the same language as the transcription.`);
		} else {
			parts.push(`Please provide ${summaryPrompt} of the following transcription${langInstruction}.`);
		}
	}
	
	if (settings.proposeTags) {
		if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
			parts.push('Also provide a maximum of 5 relevant tags for categorizing this content (use simple words, avoid spaces) in the same language as the transcription.');
		} else {
			parts.push(`Also provide a maximum of 5 relevant tags for categorizing this content (use simple words, avoid spaces)${langInstruction}.`);
		}
	}
	
	if (settings.generateDiagram) {
		if (settings.summaryLanguage === 'same-as-audio' || settings.summaryLanguage === 'separator') {
			parts.push('Create a Mermaid diagram (flowchart TD format) that organizes the main ideas and their relationships from top to bottom. Use clear, concise node labels in the same language as the transcription and logical connections. Keep it simple with 5-10 nodes maximum.');
		} else {
			parts.push(`Create a Mermaid diagram (flowchart TD format) that organizes the main ideas and their relationships from top to bottom. Use clear, concise node labels${langInstruction} and logical connections. Keep it simple with 5-10 nodes maximum.`);
		}
	}
	
	if (parts.length === 0) {
		return '';
	}
	
	parts.push('\n\nFormat your response as:');
	if (settings.includeSummary) {
		parts.push(`\nSUMMARY:\n[${settings.summaryLength === 'bullet' ? 'bullet points' : 'summary'}]`);
	}
	if (settings.proposeTags) {
		parts.push('\nTAGS:\n[tag1, tag2, tag3, ...]');
	}
	if (settings.generateDiagram) {
		parts.push('\nDIAGRAM:\n[mermaid flowchart TD code without backticks]');
	}
	
	parts.push(`\n\nTranscription:\n${transcription}`);
	
	return parts.join('');
}