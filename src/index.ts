import { App, Editor, MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, AITranscriptionSettings } from './types';
import { AITranscriptionSettingTab } from './settings';
import { transcribeWithAI } from './providers';
import { 
	extractMediaFileName, 
	validateFileSizeForModel, 
	validateProviderRequirements,
	formatTranscriptionOutput 
} from './utils';

/**
 * WhisperScribe Plugin for Obsidian
 * 
 * Provides AI-powered transcription of audio files using Google Gemini and OpenAI.
 * 
 * @author WhisperScribe Team
 * @version 0.1.0
 */
export default class AITranscriptionPlugin extends Plugin {
	settings: AITranscriptionSettings;

	async onload() {
		await this.loadSettings();

		// Add command for AI transcription
		this.addCommand({
			id: 'transcribe-media-with-ai',
			name: 'Transcribe audio with AI',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.transcribeMediaFile(editor, view);
			}
		});

		// Add settings tab
		this.addSettingTab(new AITranscriptionSettingTab(this.app, this));
	}

	/**
	 * Main method to handle media file transcription
	 * @param editor The current editor instance
	 * @param view The current markdown view
	 */
	async transcribeMediaFile(editor: Editor, view: MarkdownView) {
		try {
			const line = editor.getLine(editor.getCursor().line);
			const mediaFileName = extractMediaFileName(line);
			
			if (!mediaFileName) {
				new Notice('Please place your cursor on a line with an audio file link');
				return;
			}
			
			// Validate provider requirements
			const validationResult = validateProviderRequirements(this.settings.provider, this.settings);
			if (!validationResult.isValid) {
				new Notice(validationResult.errorMessage || 'Invalid provider configuration');
				return;
			}

			const file = this.app.metadataCache.getFirstLinkpathDest(mediaFileName, view.file.path);
			if (!file) {
				new Notice(`File not found: ${mediaFileName}`);
				return;
			}

			// Check file size against model limits
			if (!(file instanceof TFile)) {
				new Notice('Invalid file type');
				return;
			}
			
			const stat = file.stat;
			const fileSizeValidation = validateFileSizeForModel(stat.size, this.settings.provider, this.settings);
			if (!fileSizeValidation.isValid) {
				new Notice(fileSizeValidation.errorMessage || 'File size exceeds model limit');
				return;
			}

			new Notice('Starting transcription...');
			
			// Process with the selected AI provider
			const result = await transcribeWithAI(file, this.settings, this.app);
			
			// Insert transcription after the media file line
			const insertPosition = {
				line: editor.getCursor().line + 1,
				ch: 0
			};
			
			// Format output using utility function
			const outputText = formatTranscriptionOutput(result, this.settings);
			
			editor.replaceRange(outputText, insertPosition);
			
			new Notice('Transcription completed!');
		} catch (error) {
			new Notice(`Transcription failed: ${error.message}`);
		}
	}

	onunload() {
	}

	/**
	 * Load plugin settings from storage, merging with defaults
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Save current plugin settings to storage
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}