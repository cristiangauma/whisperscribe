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
	openaiModel: 'o4-mini-2025-04-16',
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
			name: 'Whisper-1 (Audio Only)',
			id: 'whisper-1',
			fileSizeLimitMB: 25,
			supportsAdvancedFeatures: false,
			description: 'OpenAI\'s dedicated audio transcription model (no AI features)'
		},
		{
			name: 'o4-mini (Recommended)',
			id: 'o4-mini-2025-04-16',
			fileSizeLimitMB: 25,
			supportsAdvancedFeatures: true,
			description: 'Latest reasoning model - best smart analysis at low cost (90% cheaper than o3)'
		},
		{
			name: 'GPT-4o Mini',
			id: 'gpt-4o-mini-transcribe',
			fileSizeLimitMB: 25,
			supportsAdvancedFeatures: true,
			description: 'Previous generation - good but o4-mini is smarter and cheaper'
		},
		{
			name: 'GPT-4o',
			id: 'gpt-4o-transcribe',
			fileSizeLimitMB: 25,
			supportsAdvancedFeatures: true,
			description: 'Premium model - more expensive than o4-mini with similar capabilities'
		},
		{
			name: 'Custom Model',
			id: 'custom',
			fileSizeLimitMB: 25,
			isCustom: true,
			supportsAdvancedFeatures: true,
			description: 'Specify your own OpenAI model with custom file size limit'
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
		description: 'Powerful language models with strong text processing capabilities'
	}
};