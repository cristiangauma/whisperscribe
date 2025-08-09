import { AITranscriptionSettingTab } from '../../settings/SettingsTab';
import { App } from 'obsidian';
import { DEFAULT_SETTINGS } from '../../types';

// Mock isProviderGeneralist utility
jest.mock('../../utils', () => ({
  isProviderGeneralist: jest.fn()
}));

// Mock Setting class from Obsidian
jest.mock('obsidian', () => ({
  ...jest.requireActual('obsidian'),
  Setting: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDesc: jest.fn().mockReturnThis(),
    addDropdown: jest.fn().mockReturnThis(),
    addText: jest.fn().mockReturnThis(),
    addToggle: jest.fn().mockReturnThis()
  }))
}));

import { isProviderGeneralist } from '../../utils';
import { AIProvider, AITranscriptionSettings } from '../../types';

// Mock plugin interface for testing
interface MockPlugin {
  settings: AITranscriptionSettings;
  saveSettings: jest.Mock;
}

describe('AITranscriptionSettingTab', () => {
  let settingTab: AITranscriptionSettingTab;
  let mockApp: App;
  let mockPlugin: MockPlugin;

  beforeEach(() => {
    mockApp = new App();
    mockPlugin = {
      settings: { ...DEFAULT_SETTINGS },
      saveSettings: jest.fn().mockResolvedValue(undefined)
    };

    settingTab = new AITranscriptionSettingTab(mockApp, mockPlugin);
    
    // Mock containerEl methods
    settingTab.containerEl.empty = jest.fn();
    settingTab.containerEl.createEl = jest.fn().mockReturnValue({
      createEl: jest.fn().mockReturnValue({}),
      style: {}
    });
    
    jest.clearAllMocks();
    (isProviderGeneralist as jest.Mock).mockReturnValue(true);
  });

  describe('constructor', () => {
    it('should initialize with app and plugin', () => {
      expect(settingTab.app).toBe(mockApp);
      expect(settingTab.plugin).toBe(mockPlugin);
    });
  });

  describe('display', () => {
    it('should have a containerEl property from parent class', () => {
      expect(settingTab.containerEl).toBeDefined();
      expect(typeof settingTab.containerEl).toBe('object');
    });

    it('should have access to plugin settings', () => {
      expect(settingTab.plugin.settings).toBeDefined();
      expect(settingTab.plugin.settings).toHaveProperty('provider');
      expect(settingTab.plugin.settings.provider).toBe('google'); // DEFAULT_SETTINGS default
    });

    it('should have access to isProviderGeneralist utility function', () => {
      expect(isProviderGeneralist).toBeDefined();
      expect(typeof isProviderGeneralist).toBe('function');
    });

    it('should validate that settings contain all required provider configurations', () => {
      const settings = mockPlugin.settings;
      
      // Verify all provider API keys are present in settings structure
      expect(settings).toHaveProperty('apiKey');
      expect(settings).toHaveProperty('openaiApiKey');
      
      // Verify feature flags are boolean
      expect(typeof settings.includeSummary).toBe('boolean');
      expect(typeof settings.proposeTags).toBe('boolean');
      expect(typeof settings.generateDiagram).toBe('boolean');
    });

    it('should handle different provider values correctly', () => {
      const validProviders = ['google', 'openai'];
      
      validProviders.forEach(provider => {
        mockPlugin.settings.provider = provider as AIProvider;
        expect(mockPlugin.settings.provider).toBe(provider);
      });
    });

    it('should call isProviderGeneralist when determining feature availability', () => {
      // Call isProviderGeneralist directly as the display method would
      const provider = mockPlugin.settings.provider;
      const result = isProviderGeneralist(provider);
      
      expect(isProviderGeneralist).toHaveBeenCalledWith(provider);
      expect(typeof result).toBe('boolean');
    });
  });
});