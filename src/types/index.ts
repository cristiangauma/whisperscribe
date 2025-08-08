export type AIProvider = 'google' | 'openai';

export interface TranscriptionResult {
	transcription: string;
	summary?: string;
	tags?: string[];
	diagram?: string;
}

export interface ModelConfig {
	name: string;
	id: string;
	fileSizeLimitMB: number;
	isCustom?: boolean;
	supportsAdvancedFeatures: boolean; // summary, tags, diagrams
	description: string;
}

export type SummaryLanguage = 'same-as-audio' | 'separator' | 'english' | 'spanish' | 'french' | 'german' | 'italian' | 'portuguese' | 'russian' | 'japanese' | 'korean' | 'chinese' | 'hindi' | 'arabic' | 'dutch' | 'swedish' | 'polish' | 'turkish' | 'catalan' | 'custom';

export interface AITranscriptionSettings {
	provider: AIProvider;
	apiKey: string;
	modelName: string;
	customModelName?: string;
	customFileSizeLimitMB?: number;
	openaiApiKey: string;
	openaiModel: string;
	customOpenaiModel?: string;
	customOpenaiFileSizeLimitMB?: number;
	includeSummary: boolean;
	summaryLength: 'short' | 'medium' | 'long' | 'bullet';
	proposeTags: boolean;
	generateDiagram: boolean;
	summaryLanguage: SummaryLanguage;
	customLanguage?: string;
}

export const DEFAULT_SETTINGS: AITranscriptionSettings = {
	provider: 'google',
	apiKey: '',
	modelName: 'gemini-2.5-flash-lite',
	openaiApiKey: '',
	openaiModel: 'gpt-5-nano',
	includeSummary: false,
	summaryLength: 'bullet',
	proposeTags: false,
	generateDiagram: false,
	summaryLanguage: 'same-as-audio'
}

// Pre-configured models with file size limits and feature support
export const PROVIDER_MODELS: Record<AIProvider, ModelConfig[]> = {
	google: [
		{
			name: 'Gemini 2.5 Flash-Lite (Recommended)',
			id: 'gemini-2.5-flash-lite',
			fileSizeLimitMB: 20,
			supportsAdvancedFeatures: true,
			description: 'Lightweight, ultra-fast, and most cost-effective for transcription'
		},
		{
			name: 'Gemini 2.5 Flash',
			id: 'gemini-2.5-flash',
			fileSizeLimitMB: 20,
			supportsAdvancedFeatures: true,
			description: 'Standard performance model, higher cost than Flash-Lite'
		},
		{
			name: 'Custom Model',
			id: 'custom',
			fileSizeLimitMB: 20,
			isCustom: true,
			supportsAdvancedFeatures: true,
			description: 'Specify your own Gemini model with custom file size limit'
		}
	],
	openai: [
		{
			name: 'Whisper + GPT-5 Nano (Recommended)',
			id: 'gpt-5-nano',
			fileSizeLimitMB: 25,
			supportsAdvancedFeatures: true,
			description: 'Whisper transcribes (cheap, all formats) + GPT-5 Nano for summaries/tags/diagrams'
		},
		{
			name: 'Whisper + GPT-5 Mini',
			id: 'gpt-5-mini',
			fileSizeLimitMB: 25,
			supportsAdvancedFeatures: true,
			description: 'Whisper transcribes + GPT-5 Mini for advanced features (balanced cost & performance)'
		},
		{
			name: 'Whisper + GPT-5',
			id: 'gpt-5',
			fileSizeLimitMB: 25,
			supportsAdvancedFeatures: true,
			description: 'Whisper transcribes + GPT-5 for advanced features (premium reasoning & analysis)'
		},
		{
			name: 'Whisper-1 (Transcription Only)',
			id: 'whisper-1',
			fileSizeLimitMB: 25,
			supportsAdvancedFeatures: false,
			description: 'OpenAI Whisper only - transcription without summaries/tags/diagrams'
		},
		{
			name: 'Whisper + Custom Model',
			id: 'custom',
			fileSizeLimitMB: 25,
			isCustom: true,
			supportsAdvancedFeatures: true,
			description: 'Whisper transcribes + your custom OpenAI model for advanced features'
		}
	]
};

export const AI_PROVIDERS = {
	google: {
		name: 'Google Gemini',
		docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
		isGeneralist: true,
		description: 'Advanced multimodal AI with excellent summarization and analysis capabilities'
	},
	openai: {
		name: 'OpenAI',
		docsUrl: 'https://platform.openai.com/docs/models',
		isGeneralist: true,
		description: 'Hybrid approach: Whisper for transcription (cheap, all formats) + chosen model for analysis'
	}
};