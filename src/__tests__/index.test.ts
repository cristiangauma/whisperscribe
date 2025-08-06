import AITranscriptionPlugin from '../index';
import { App, Editor, MarkdownView, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from '../types';

// Mock the providers
jest.mock('../providers', () => ({
  transcribeWithAI: jest.fn()
}));

// Mock utilities
jest.mock('../utils', () => ({
  extractMediaFileName: jest.fn(),
  validateProviderRequirements: jest.fn(),
  validateFileSizeForModel: jest.fn(),
  formatTranscriptionOutput: jest.fn()
}));

import { transcribeWithAI } from '../providers';
import { 
  extractMediaFileName, 
  validateProviderRequirements, 
  validateFileSizeForModel,
  formatTranscriptionOutput 
} from '../utils';

describe('AITranscriptionPlugin', () => {
  let plugin: AITranscriptionPlugin;
  let mockApp: App;
  let mockEditor: Editor;
  let mockView: MarkdownView;
  let mockFile: TFile;

  beforeEach(() => {
    // Clear notices from previous tests
    (global as any).__notices = [];

    mockApp = new App();
    mockEditor = new Editor();
    mockView = new MarkdownView(new TFile('note.md', 'md'));
    mockFile = new TFile('audio.mp3', 'mp3', 1024 * 1024);

    plugin = new AITranscriptionPlugin(mockApp, { id: 'test', name: 'Test', version: '1.0.0' });
    
    jest.clearAllMocks();
  });

  describe('onload', () => {
    it('should load settings and add command', async () => {
      jest.spyOn(plugin, 'loadData').mockResolvedValue({});
      const addCommandSpy = jest.spyOn(plugin, 'addCommand');
      const addSettingTabSpy = jest.spyOn(plugin, 'addSettingTab');

      await plugin.onload();

      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
      expect(addCommandSpy).toHaveBeenCalledWith({
        id: 'transcribe-media-with-ai',
        name: 'Transcribe audio with AI',
        editorCallback: expect.any(Function)
      });
      expect(addSettingTabSpy).toHaveBeenCalled();
    });

    it('should merge saved settings with defaults', async () => {
      const savedSettings = {
        provider: 'openai',
        openaiApiKey: 'saved-key',
        includeSummary: true
      };

      jest.spyOn(plugin, 'loadData').mockResolvedValue(savedSettings);
      jest.spyOn(plugin, 'addCommand').mockImplementation();
      jest.spyOn(plugin, 'addSettingTab').mockImplementation();

      await plugin.onload();

      expect(plugin.settings).toEqual({
        ...DEFAULT_SETTINGS,
        ...savedSettings
      });
    });
  });

  describe('loadSettings', () => {
    it('should merge saved data with defaults', async () => {
      const savedData = { provider: 'openai', apiKey: 'test-key' };
      jest.spyOn(plugin, 'loadData').mockResolvedValue(savedData);

      await plugin.loadSettings();

      expect(plugin.settings).toEqual({
        ...DEFAULT_SETTINGS,
        ...savedData
      });
    });

    it('should use defaults when no saved data', async () => {
      jest.spyOn(plugin, 'loadData').mockResolvedValue({});

      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('should save current settings', async () => {
      const saveDataSpy = jest.spyOn(plugin, 'saveData').mockResolvedValue();
      plugin.settings = { ...DEFAULT_SETTINGS, provider: 'openai' };

      await plugin.saveSettings();

      expect(saveDataSpy).toHaveBeenCalledWith(plugin.settings);
    });
  });

  describe('transcribeMediaFile', () => {
    beforeEach(() => {
      plugin.settings = { ...DEFAULT_SETTINGS, provider: 'google', apiKey: 'test-key' };
      mockEditor.getCursor.mockReturnValue({ line: 5, ch: 10 });
      mockEditor.getLine.mockReturnValue('![[audio.mp3]]');
    });

    it('should successfully transcribe media file', async () => {
      // Setup mocks
      (extractMediaFileName as jest.Mock).mockReturnValue('audio.mp3');
      (validateProviderRequirements as jest.Mock).mockReturnValue({ 
        isValid: true 
      });
      (validateFileSizeForModel as jest.Mock).mockReturnValue({ isValid: true });
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(mockFile);
      
      const transcriptionResult = {
        transcription: 'Test transcription',
        summary: 'Test summary'
      };
      (transcribeWithAI as jest.Mock).mockResolvedValue(transcriptionResult);
      (formatTranscriptionOutput as jest.Mock).mockReturnValue(
        '## Transcription\n\nTest transcription\n\n## Summary\n\nTest summary'
      );

      await plugin.transcribeMediaFile(mockEditor, mockView);

      expect(extractMediaFileName).toHaveBeenCalledWith('![[audio.mp3]]');
      expect(validateProviderRequirements).toHaveBeenCalledWith('google', plugin.settings);
      expect(validateFileSizeForModel).toHaveBeenCalledWith(mockFile.stat.size, 'google', plugin.settings);
      expect(transcribeWithAI).toHaveBeenCalledWith(mockFile, plugin.settings, mockApp);
      expect(mockEditor.replaceRange).toHaveBeenCalledWith(
        '## Transcription\n\nTest transcription\n\n## Summary\n\nTest summary',
        { line: 6, ch: 0 }
      );

      const notices = (global as any).getNotices();
      expect(notices).toContain('Starting transcription...');
      expect(notices).toContain('Transcription completed!');
    });

    it('should show error when no media file found in line', async () => {
      mockEditor.getLine.mockReturnValue('Regular text without media');
      (extractMediaFileName as jest.Mock).mockReturnValue(null);

      await plugin.transcribeMediaFile(mockEditor, mockView);

      const notices = (global as any).getNotices();
      expect(notices).toContain('Please place your cursor on a line with an audio file link');
      expect(transcribeWithAI).not.toHaveBeenCalled();
    });

    it('should show error when provider requirements not met', async () => {
      (extractMediaFileName as jest.Mock).mockReturnValue('audio.mp3');
      (validateProviderRequirements as jest.Mock).mockReturnValue({ 
        isValid: false, 
        errorMessage: 'API key missing' 
      });

      await plugin.transcribeMediaFile(mockEditor, mockView);

      const notices = (global as any).getNotices();
      expect(notices).toContain('API key missing');
      expect(transcribeWithAI).not.toHaveBeenCalled();
    });

    it('should show error when file not found', async () => {
      (extractMediaFileName as jest.Mock).mockReturnValue('audio.mp3');
      (validateProviderRequirements as jest.Mock).mockReturnValue({ isValid: true });
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(null);

      await plugin.transcribeMediaFile(mockEditor, mockView);

      const notices = (global as any).getNotices();
      expect(notices).toContain('File not found: audio.mp3');
      expect(transcribeWithAI).not.toHaveBeenCalled();
    });

    it('should show error when file size exceeds limit', async () => {
      (extractMediaFileName as jest.Mock).mockReturnValue('audio.mp3');
      (validateProviderRequirements as jest.Mock).mockReturnValue({ isValid: true });
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(mockFile);
      (validateFileSizeForModel as jest.Mock).mockReturnValue({ 
        isValid: false, 
        errorMessage: 'File size exceeds model limit'
      });

      await plugin.transcribeMediaFile(mockEditor, mockView);

      const notices = (global as any).getNotices();
      expect(notices).toContain('File size exceeds model limit');
      expect(transcribeWithAI).not.toHaveBeenCalled();
    });

    it('should handle transcription errors gracefully', async () => {
      (extractMediaFileName as jest.Mock).mockReturnValue('audio.mp3');
      (validateProviderRequirements as jest.Mock).mockReturnValue({ isValid: true });
      (validateFileSizeForModel as jest.Mock).mockReturnValue({ isValid: true });
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(mockFile);
      
      const transcriptionError = new Error('API error occurred');
      (transcribeWithAI as jest.Mock).mockRejectedValue(transcriptionError);

      await plugin.transcribeMediaFile(mockEditor, mockView);

      const notices = (global as any).getNotices();
      expect(notices).toContain('Transcription failed: API error occurred');
      expect(mockEditor.replaceRange).not.toHaveBeenCalled();
    });

    it('should insert transcription at correct position', async () => {
      mockEditor.getCursor.mockReturnValue({ line: 10, ch: 5 });
      (extractMediaFileName as jest.Mock).mockReturnValue('audio.mp3');
      (validateProviderRequirements as jest.Mock).mockReturnValue({ isValid: true });
      (validateFileSizeForModel as jest.Mock).mockReturnValue({ isValid: true });
      mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(mockFile);
      (transcribeWithAI as jest.Mock).mockResolvedValue({ transcription: 'Test' });
      (formatTranscriptionOutput as jest.Mock).mockReturnValue('Formatted output');

      await plugin.transcribeMediaFile(mockEditor, mockView);

      expect(mockEditor.replaceRange).toHaveBeenCalledWith(
        'Formatted output',
        { line: 11, ch: 0 } // Line after cursor
      );
    });

    it('should handle different file extensions', async () => {
      const extensions = ['mp3', 'wav', 'ogg', 'm4a'];
      
      for (const ext of extensions) {
        jest.clearAllMocks();
        const testFile = new TFile(`test.${ext}`, ext, 1024);
        
        (extractMediaFileName as jest.Mock).mockReturnValue(`test.${ext}`);
        (validateProviderRequirements as jest.Mock).mockReturnValue({ isValid: true });
        (validateFileSizeForModel as jest.Mock).mockReturnValue({ isValid: true });
        mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(testFile);
        (transcribeWithAI as jest.Mock).mockResolvedValue({ transcription: 'Test' });
        (formatTranscriptionOutput as jest.Mock).mockReturnValue('Output');

        await plugin.transcribeMediaFile(mockEditor, mockView);

        expect(transcribeWithAI).toHaveBeenCalledWith(testFile, plugin.settings, mockApp);
      }
    });

    it('should work with different markdown link formats', async () => {
      const linkFormats = [
        '![[audio.mp3]]',
        '![](audio.mp3)',
        '![[path/to/audio.mp3]]',
        '![Audio file](./audio.mp3)'
      ];

      for (const format of linkFormats) {
        jest.clearAllMocks();
        mockEditor.getLine.mockReturnValue(format);
        
        (extractMediaFileName as jest.Mock).mockReturnValue('audio.mp3');
        (validateProviderRequirements as jest.Mock).mockReturnValue({ isValid: true });
        (validateFileSizeForModel as jest.Mock).mockReturnValue({ isValid: true });
        mockApp.metadataCache.getFirstLinkpathDest.mockReturnValue(mockFile);
        (transcribeWithAI as jest.Mock).mockResolvedValue({ transcription: 'Test' });
        (formatTranscriptionOutput as jest.Mock).mockReturnValue('Output');

        await plugin.transcribeMediaFile(mockEditor, mockView);

        expect(extractMediaFileName).toHaveBeenCalledWith(format);
      }
    });
  });
});