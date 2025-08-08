import { 
  getApiKeyForProvider, 
  getModelForProvider, 
  extractMediaFileName, 
  validateFileSize,
  validateProviderRequirements 
} from '../../utils/validation';
import { AITranscriptionSettings } from '../../types';

describe('validation', () => {
  const mockSettings: AITranscriptionSettings = {
    provider: 'google',
    apiKey: 'google-key',
    modelName: 'gemini-2.5-flash-lite', // Updated to match PROVIDER_MODELS
    openaiApiKey: 'openai-key',
    openaiModel: 'gpt-5-nano',
    includeSummary: false,
    summaryLength: 'medium',
    proposeTags: false,
    generateDiagram: false,
    summaryLanguage: 'same-as-audio',
    customLanguage: ''
  };

  describe('getApiKeyForProvider', () => {
    it('should return correct API key for each provider', () => {
      expect(getApiKeyForProvider('google', mockSettings)).toBe('google-key');
      expect(getApiKeyForProvider('openai', mockSettings)).toBe('openai-key');
    });

    it('should return null for unknown provider', () => {
      expect(getApiKeyForProvider('unknown' as any, mockSettings)).toBe(null);
    });

    it('should handle missing API keys', () => {
      const emptySettings = { ...mockSettings, apiKey: '', openaiApiKey: '' };
      expect(getApiKeyForProvider('google', emptySettings)).toBe(null);
      expect(getApiKeyForProvider('openai', emptySettings)).toBe(null);
    });
  });

  describe('getModelForProvider', () => {
    it('should return correct model for each provider', () => {
      expect(getModelForProvider('google', mockSettings)).toBe('gemini-2.5-flash-lite');
      expect(getModelForProvider('openai', mockSettings)).toBe('gpt-5-nano');
    });

    it('should throw error for unknown provider', () => {
      expect(() => getModelForProvider('unknown' as any, mockSettings)).toThrow('No model configuration found for provider');
    });

    it('should fallback to first model for empty model names', () => {
      const emptyModel = { ...mockSettings, modelName: '' };
      // With the new system, empty model names fallback to the first model in PROVIDER_MODELS
      expect(() => getModelForProvider('google', emptyModel)).not.toThrow();
      expect(getModelForProvider('google', emptyModel)).toBe('gemini-2.5-flash-lite');
    });
  });

  describe('extractMediaFileName', () => {
    it('should extract embedded media files', () => {
      expect(extractMediaFileName('![[audio.mp3]]')).toBe('audio.mp3');
      expect(extractMediaFileName('![[audio.wav]]')).toBe('audio.wav');
      expect(extractMediaFileName('![[path/to/file.wav]]')).toBe('file.wav');
    });

    it('should only work with embedded format', () => {
      expect(extractMediaFileName('![](audio.mp3)')).toBe(null);
      expect(extractMediaFileName('![alt text](audio.ogg)')).toBe(null);
      expect(extractMediaFileName('![](path/to/file.wav)')).toBe(null);
    });

    it('should handle files with spaces', () => {
      expect(extractMediaFileName('![[my audio file.mp3]]')).toBe('my audio file.mp3');
      expect(extractMediaFileName('![[audio with spaces.m4a]]')).toBe('audio with spaces.m4a');
    });

    it('should handle HTML audio tags', () => {
      expect(extractMediaFileName('<audio src="test.mp3"></audio>')).toBe('test.mp3');
      expect(extractMediaFileName('<audio src="test.wav"></audio>')).toBe('test.wav');
    });

    it('should return null for non-media files', () => {
      expect(extractMediaFileName('![[document.pdf]]')).toBeNull();
      expect(extractMediaFileName('![](image.png)')).toBeNull();
      expect(extractMediaFileName('Regular text')).toBeNull();
    });

    it('should return null for invalid formats', () => {
      expect(extractMediaFileName('[[audio.mp3]]')).toBeNull();
      expect(extractMediaFileName('!(audio.mp3)')).toBeNull();
      expect(extractMediaFileName('')).toBeNull();
    });

    it('should handle various audio formats', () => {
      const formats = ['mp3', 'wav', 'ogg', 'm4a'];
      formats.forEach(format => {
        expect(extractMediaFileName(`![[file.${format}]]`)).toBe(`file.${format}`);
      });
    });
  });

  describe('validateFileSize', () => {
    it('should return true for files under default limit', () => {
      expect(validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(validateFileSize(25 * 1024 * 1024)).toBe(true); // 25MB
      expect(validateFileSize(50 * 1024 * 1024)).toBe(true); // 50MB
    });

    it('should return false for files over default limit', () => {
      expect(validateFileSize(51 * 1024 * 1024)).toBe(false); // 51MB
      expect(validateFileSize(100 * 1024 * 1024)).toBe(false); // 100MB
    });

    it('should respect custom size limit', () => {
      const customLimit = 10 * 1024 * 1024; // 10MB
      expect(validateFileSize(5 * 1024 * 1024, customLimit)).toBe(true);
      expect(validateFileSize(15 * 1024 * 1024, customLimit)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateFileSize(0)).toBe(true);
      expect(validateFileSize(-1)).toBe(true); // Negative sizes treated as 0
      expect(validateFileSize(50 * 1024 * 1024 + 1)).toBe(false);
    });
  });

  describe('validateProviderRequirements', () => {
    it('should validate Google provider requirements', () => {
      const result = validateProviderRequirements('google', mockSettings);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should fail when API key is missing', () => {
      const settingsNoKey = { ...mockSettings, apiKey: '' };
      const result = validateProviderRequirements('google', settingsNoKey);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('API key');
    });


    it('should validate all providers correctly', () => {
      const providers = ['google', 'openai'] as const;
      providers.forEach(provider => {
        const settings = { ...mockSettings, provider };
        const result = validateProviderRequirements(provider, settings);
        expect(result.isValid).toBe(true);
      });
    });


    it('should handle unknown provider gracefully', () => {
      const result = validateProviderRequirements('unknown' as any, mockSettings);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('API key');
    });
  });
});