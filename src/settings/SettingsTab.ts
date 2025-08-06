import { App, PluginSettingTab, Setting } from 'obsidian';
import { AI_PROVIDERS, AITranscriptionSettings, PROVIDER_MODELS, ModelConfig, SummaryLanguage } from '../types';
import { isModelGeneralist } from '../utils';
import type AITranscriptionPlugin from '../index';

export class AITranscriptionSettingTab extends PluginSettingTab {
	plugin: AITranscriptionPlugin;

	constructor(app: App, plugin: AITranscriptionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Helper method to get the current model configuration for a provider
	 */
	private getCurrentModelConfig(provider: string, modelId: string): ModelConfig | null {
		const models = PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS];
		if (!models) return null;
		return models.find(model => model.id === modelId) || null;
	}

	/**
	 * Helper method to create model selection dropdown with custom option
	 */
	private createModelSelection(
		containerEl: HTMLElement, 
		provider: string, 
		currentModel: string, 
		onModelChange: (modelId: string) => Promise<void>
	): void {
		const models = PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS];
		if (!models) return;

		// Model selection dropdown
		new Setting(containerEl)
			.setName(`${AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]?.name} Model`)
			.setDesc('Choose a pre-configured model or select custom to specify your own')
			.addDropdown(dropdown => {
				models.forEach(model => {
					dropdown.addOption(model.id, model.name);
				});
				dropdown.setValue(currentModel)
					.onChange(async (value) => {
						await onModelChange(value);
						this.display(); // Refresh to show/hide custom fields
					});
			});

		// Show current model info
		const currentConfig = this.getCurrentModelConfig(provider, currentModel);
		if (currentConfig && !currentConfig.isCustom) {
			const infoEl = containerEl.createEl('div', {
				cls: 'setting-item-description',
				text: `📊 ${currentConfig.description}`
			});
			infoEl.style.backgroundColor = '#f8f9fa';
			infoEl.style.padding = '8px';
			infoEl.style.borderRadius = '4px';
			infoEl.style.marginBottom = '12px';
			
			containerEl.createEl('p', {
				cls: 'setting-item-description',
				text: `File size limit: ${currentConfig.fileSizeLimitMB}MB | Advanced features: ${currentConfig.supportsAdvancedFeatures ? '✅' : '❌'}`
			});
		}
	}

	/**
	 * Helper method to create custom model fields when "custom" is selected
	 */
	private createCustomModelFields(
		containerEl: HTMLElement,
		provider: string,
		currentCustomName: string | undefined,
		currentCustomLimit: number | undefined,
		onCustomNameChange: (name: string) => Promise<void>,
		onCustomLimitChange: (limit: number) => Promise<void>
	): void {
		// Custom model name input
		new Setting(containerEl)
			.setName('Custom Model Name')
			.setDesc(`Enter the exact model name for ${AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]?.name}`)
			.addText(text => text
				.setPlaceholder('e.g., gemini-1.5-pro, gpt-4-turbo')
				.setValue(currentCustomName || '')
				.onChange(onCustomNameChange));

		// Custom file size limit input
		new Setting(containerEl)
			.setName('File Size Limit (MB)')
			.setDesc('Maximum file size this model can handle (used for validation)')
			.addText(text => text
				.setPlaceholder('e.g., 25')
				.setValue(currentCustomLimit?.toString() || '')
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0) {
						await onCustomLimitChange(numValue);
					}
				}));
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'WhisperScribe Settings'});

		new Setting(containerEl)
			.setName('AI Provider')
			.setDesc('Select which AI service to use for transcription')
			.addDropdown(dropdown => {
				Object.entries(AI_PROVIDERS).forEach(([key, provider]) => {
					dropdown.addOption(key, provider.name);
				});
				dropdown.setValue(this.plugin.settings.provider)
					.onChange(async (value) => {
						this.plugin.settings.provider = value as any;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		const provider = this.plugin.settings.provider;

		if (provider === 'google') {
			new Setting(containerEl)
				.setName('Google Gemini API Key')
				.setDesc('Enter your Google AI Studio API key')
				.addText(text => text
					.setPlaceholder('Enter your API key')
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					}));

			// Model selection with pre-configured options
			this.createModelSelection(
				containerEl,
				'google',
				this.plugin.settings.modelName,
				async (modelId) => {
					this.plugin.settings.modelName = modelId;
					await this.plugin.saveSettings();
				}
			);

			// Show custom model fields if "custom" is selected
			if (this.plugin.settings.modelName === 'custom') {
				this.createCustomModelFields(
					containerEl,
					'google',
					this.plugin.settings.customModelName,
					this.plugin.settings.customFileSizeLimitMB,
					async (name) => {
						this.plugin.settings.customModelName = name;
						await this.plugin.saveSettings();
					},
					async (limit) => {
						this.plugin.settings.customFileSizeLimitMB = limit;
						await this.plugin.saveSettings();
					}
				);
			}
			
			containerEl.createEl('p', {
				text: '📚 View available models: ',
				cls: 'setting-item-description'
			}).createEl('a', {
				text: 'Gemini Models Documentation',
				href: AI_PROVIDERS.google.docsUrl
			});
		}

		if (provider === 'openai') {
			new Setting(containerEl)
				.setName('OpenAI API Key')
				.setDesc('Enter your OpenAI API key')
				.addText(text => text
					.setPlaceholder('Enter your API key')
					.setValue(this.plugin.settings.openaiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.openaiApiKey = value;
						await this.plugin.saveSettings();
					}));

			// Model selection with pre-configured options
			this.createModelSelection(
				containerEl,
				'openai',
				this.plugin.settings.openaiModel,
				async (modelId) => {
					this.plugin.settings.openaiModel = modelId;
					await this.plugin.saveSettings();
				}
			);

			// Show custom model fields if "custom" is selected
			if (this.plugin.settings.openaiModel === 'custom') {
				this.createCustomModelFields(
					containerEl,
					'openai',
					this.plugin.settings.customOpenaiModel,
					this.plugin.settings.customOpenaiFileSizeLimitMB,
					async (name) => {
						this.plugin.settings.customOpenaiModel = name;
						await this.plugin.saveSettings();
					},
					async (limit) => {
						this.plugin.settings.customOpenaiFileSizeLimitMB = limit;
						await this.plugin.saveSettings();
					}
				);
			}
			
			containerEl.createEl('p', {
				text: '📚 View available models: ',
				cls: 'setting-item-description'
			}).createEl('a', {
				text: 'OpenAI Models Documentation',
				href: AI_PROVIDERS.openai.docsUrl
			});
		}






		// Advanced features section
		containerEl.createEl('h3', {text: 'Advanced Features'});
		
		const isGeneralist = isModelGeneralist(provider, this.plugin.settings);
		
		if (!isGeneralist) {
			const warningDiv = containerEl.createEl('div', {
				cls: 'setting-item-description'
			});
			warningDiv.style.backgroundColor = '#f0f8ff';
			warningDiv.style.border = '1px solid #add8e6';
			warningDiv.style.borderRadius = '4px';
			warningDiv.style.padding = '8px';
			warningDiv.style.marginBottom = '12px';
			
			let currentModelId = '';
			switch (provider) {
				case 'google': currentModelId = this.plugin.settings.modelName; break;
				case 'openai': currentModelId = this.plugin.settings.openaiModel; break;
			}
			const modelConfig = this.getCurrentModelConfig(provider, currentModelId);
			const warningText = warningDiv.createEl('p', {
				text: `ℹ️ The selected model (${modelConfig?.name || 'current model'}) specializes in transcription only. Advanced features (summary, tags, diagrams) are not available.`
			});
			warningText.style.margin = '0';
			warningText.style.fontSize = '0.9em';
			warningText.style.color = '#0066cc';
		}
		
		// Summary setting
		const summarySetting = new Setting(containerEl)
			.setName('Include Summary')
			.setDesc(isGeneralist ? 'Generate a summary in addition to the full transcription' : 'Summarization not available with this provider');
		
		if (isGeneralist) {
			summarySetting.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeSummary)
				.onChange(async (value) => {
					this.plugin.settings.includeSummary = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide summary length setting
				}));
		} else {
			// Disable the feature and reset if enabled
			if (this.plugin.settings.includeSummary) {
				this.plugin.settings.includeSummary = false;
				this.plugin.saveSettings();
			}
			summarySetting.addToggle(toggle => toggle
				.setValue(false)
				.setDisabled(true));
		}
		
		if (this.plugin.settings.includeSummary && isGeneralist) {
			new Setting(containerEl)
				.setName('Summary Length')
				.setDesc('Choose the length of the generated summary')
				.addDropdown(dropdown => dropdown
					.addOption('bullet', 'Bullet Points (max 5 key points)')
					.addOption('short', 'Short (2-3 sentences)')
					.addOption('medium', 'Medium (1 paragraph)')
					.addOption('long', 'Long (multiple paragraphs)')
					.setValue(this.plugin.settings.summaryLength)
					.onChange(async (value) => {
						this.plugin.settings.summaryLength = value as 'short' | 'medium' | 'long' | 'bullet';
						await this.plugin.saveSettings();
					}));
			
			// Language selection for summaries, tags, and diagrams
			new Setting(containerEl)
				.setName('Summary Language')
				.setDesc('Choose the language for summaries, tags, and diagrams')
				.addDropdown(dropdown => {
					// Add same-as-audio first
					dropdown.addOption('same-as-audio', 'Same as audio');
					dropdown.addOption('separator', '──────────────');
					
					// Alphabetically sorted languages
					const languages: Array<[string, string]> = [
						['arabic', 'Arabic (العربية)'],
						['catalan', 'Catalan (Català)'],
						['chinese', 'Chinese (中文)'],
						['dutch', 'Dutch (Nederlands)'],
						['english', 'English'],
						['french', 'French (Français)'],
						['german', 'German (Deutsch)'],
						['hindi', 'Hindi (हिन्दी)'],
						['italian', 'Italian (Italiano)'],
						['japanese', 'Japanese (日本語)'],
						['korean', 'Korean (한국어)'],
						['polish', 'Polish (Polski)'],
						['portuguese', 'Portuguese (Português)'],
						['russian', 'Russian (Русский)'],
						['spanish', 'Spanish (Español)'],
						['swedish', 'Swedish (Svenska)'],
						['turkish', 'Turkish (Türkçe)']
					];
					
					languages.forEach(([key, label]) => {
						dropdown.addOption(key, label);
					});
					
					dropdown.addOption('custom', 'Custom language');
					
					dropdown.setValue(this.plugin.settings.summaryLanguage)
						.onChange(async (value) => {
							// Handle separator selection by defaulting to same-as-audio
							if (value === 'separator') {
								value = 'same-as-audio';
								dropdown.setValue(value);
							}
							this.plugin.settings.summaryLanguage = value as SummaryLanguage;
							await this.plugin.saveSettings();
							this.display(); // Refresh to show/hide custom language field
						});
				});
			
			// Custom language input field
			if (this.plugin.settings.summaryLanguage === 'custom') {
				new Setting(containerEl)
					.setName('Custom Language')
					.setDesc('Enter the language name (e.g., "Swahili", "Esperanto")')
					.addText(text => text
						.setPlaceholder('Enter language name')
						.setValue(this.plugin.settings.customLanguage || '')
						.onChange(async (value) => {
							this.plugin.settings.customLanguage = value;
							await this.plugin.saveSettings();
						}));
			}
		}
		
		// Tags setting
		const tagsSetting = new Setting(containerEl)
			.setName('Propose Tags')
			.setDesc(isGeneralist ? 'Generate up to 5 relevant tags for categorizing the content' : 'Tag generation not available with this provider');
		
		if (isGeneralist) {
			tagsSetting.addToggle(toggle => toggle
				.setValue(this.plugin.settings.proposeTags)
				.onChange(async (value) => {
					this.plugin.settings.proposeTags = value;
					await this.plugin.saveSettings();
				}));
		} else {
			// Disable the feature and reset if enabled
			if (this.plugin.settings.proposeTags) {
				this.plugin.settings.proposeTags = false;
				this.plugin.saveSettings();
			}
			tagsSetting.addToggle(toggle => toggle
				.setValue(false)
				.setDisabled(true));
		}
		
		if (this.plugin.settings.proposeTags && isGeneralist) {
			containerEl.createEl('p', {
				text: 'Tags will be added at the end of the transcription in the format: #tag1 #tag2 #tag3',
				cls: 'setting-item-description'
			});
		}
		
		// Diagram setting
		const diagramSetting = new Setting(containerEl)
			.setName('Generate Mermaid Diagram')
			.setDesc(isGeneralist ? 'Create a flowchart diagram organizing the main ideas and their relationships (top to bottom)' : 'Diagram generation not available with this provider');
		
		if (isGeneralist) {
			diagramSetting.addToggle(toggle => toggle
				.setValue(this.plugin.settings.generateDiagram)
				.onChange(async (value) => {
					this.plugin.settings.generateDiagram = value;
					await this.plugin.saveSettings();
				}));
		} else {
			// Disable the feature and reset if enabled
			if (this.plugin.settings.generateDiagram) {
				this.plugin.settings.generateDiagram = false;
				this.plugin.saveSettings();
			}
			diagramSetting.addToggle(toggle => toggle
				.setValue(false)
				.setDisabled(true));
		}
		
		if (this.plugin.settings.generateDiagram && isGeneralist) {
			containerEl.createEl('p', {
				text: 'A Mermaid diagram will be generated showing the flow of ideas from the transcription.',
				cls: 'setting-item-description'
			});
		}

		containerEl.createEl('h3', {text: 'Instructions'});
		
		const instructions = containerEl.createEl('ol', {
			cls: 'setting-item-description'
		});
		
		instructions.createEl('li', {text: 'Select your preferred AI provider and configure the API key'});
		instructions.createEl('li', {text: 'Place your cursor on or select an audio file link in your note'});
		instructions.createEl('li', {text: 'Run the "Transcribe audio with AI" command'});
		instructions.createEl('li', {text: 'The transcription will appear below the media file'});

		containerEl.createEl('h3', {text: 'Supported Formats'});
		containerEl.createEl('p', {
			text: 'Audio: MP3, WAV, OGG, M4A',
			cls: 'setting-item-description'
		});
	}
}