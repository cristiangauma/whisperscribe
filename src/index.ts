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
	private statusEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		// Create a status bar item for live feedback
		this.statusEl = this.addStatusBarItem();
		this.clearStatus();

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

			// Show live indicators (status bar + in-note placeholder)
			this.updateStatus(`WhisperScribe: preparing ${file.name}...`);
			const insertPosition = {
				line: editor.getCursor().line + 1,
				ch: 0
			};
			const providerLabel = this.settings.provider === 'google' ? 'Gemini' : 'OpenAI';
			// Ensure exactly two blank lines before the progress block
			const progressBlock = `\n\n<!-- WhisperScribe:START -->\n> [!info] WhisperScribe\n> Transcribing "${file.name}" with ${providerLabel}…\n> Status: preparing…\n<!-- WhisperScribe:END -->\n`;
			editor.replaceRange(progressBlock, insertPosition);
			new Notice('Starting transcription...');
			
			// Process with the selected AI provider
			this.updateStatus(`WhisperScribe: sending audio to ${providerLabel}...`);
			this.updateProgressBlock(editor, `Transcribing "${file.name}" with ${providerLabel}…`, 'sending audio...');
			const result = await transcribeWithAI(file, this.settings, this.app, (stage) => {
				this.updateStatus(`WhisperScribe: ${stage}`);
				this.updateProgressBlock(editor, `Transcribing "${file.name}" with ${providerLabel}…`, stage);
			});
			
			// Format output using utility function
			const outputText = formatTranscriptionOutput(result, this.settings);
			this.updateStatus('WhisperScribe: inserting results...');
			this.updateProgressBlock(editor, `Transcribing "${file.name}" with ${providerLabel}…`, 'inserting results...');

			// Replace the in-note progress block with final output
			const range = this.findProgressBlockRange(editor);
			if (range) {
				// Strip any leading newlines from output to keep exactly two blank lines preserved before it
				const normalizedOutput = outputText.replace(/^\n+/, '');
				editor.replaceRange(normalizedOutput, range.from, range.to);
			} else {
				// Fallback: insert where we planned originally (no extra leading newlines to satisfy tests)
				const normalizedOutput = outputText.replace(/^\n+/, '');
				editor.replaceRange(normalizedOutput, insertPosition);
			}
			
			new Notice('Transcription completed!');
			this.clearStatus();
		} catch (error) {
			this.showFailure(error);
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

	// ---------- UI helpers (status bar + in-note placeholder handling) ----------

	private updateStatus(text: string) {
		if (this.statusEl) {
			this.statusEl.setText(text);
		}
	}

	private clearStatus() {
		if (this.statusEl) {
			this.statusEl.setText('');
		}
	}

	private showFailure(error: any) {
		const message = error?.message || String(error);
		new Notice(`Transcription failed: ${message}`);
		// If we left a placeholder block, replace it with an error callout
		const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = mdView?.editor;
		if (editor) {
			const range = this.findProgressBlockRange(editor);
			if (range) {
				const errBlock = `> [!error] WhisperScribe\n> Transcription failed: ${message}\n`;
				editor.replaceRange(errBlock, range.from, range.to);
			}
		}
		this.clearStatus();
	}

	private findProgressBlockRange(editor: Editor): { from: { line: number; ch: number }, to: { line: number; ch: number } } | null {
		const total = editor.lineCount();
		let startLine: number | null = null;
		let endLine: number | null = null;
		for (let i = 0; i < total; i++) {
			const line = editor.getLine(i);
			if (startLine === null && line.includes('<!-- WhisperScribe:START -->')) {
				startLine = i;
			}
			if (line.includes('<!-- WhisperScribe:END -->')) {
				endLine = i;
				// We can break after finding end if start was already found
				if (startLine !== null) break;
			}
		}
		if (startLine === null || endLine === null) return null;
		return {
			from: { line: startLine, ch: 0 },
			to: { line: endLine + 1, ch: 0 }
		};
	}

	private updateProgressBlock(editor: Editor, headerLine: string, statusLine: string) {
		const range = this.findProgressBlockRange(editor);
		if (!range) return;
		const block = `<!-- WhisperScribe:START -->\n> [!info] WhisperScribe\n> ${headerLine}\n> Status: ${statusLine}\n<!-- WhisperScribe:END -->\n`;
		editor.replaceRange(block, range.from, range.to);
	}
}
