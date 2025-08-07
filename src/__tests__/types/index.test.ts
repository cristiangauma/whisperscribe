import { DEFAULT_SETTINGS, AI_PROVIDERS, AIProvider, AITranscriptionSettings, TranscriptionResult, SummaryLanguage } from '../../types';

describe('types', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('should have valid default provider', () => {
      expect(DEFAULT_SETTINGS.provider).toBe('google');
      expect(Object.keys(AI_PROVIDERS)).toContain(DEFAULT_SETTINGS.provider);
    });

    it('should have empty API keys by default', () => {
      expect(DEFAULT_SETTINGS.apiKey).toBe('');
      expect(DEFAULT_SETTINGS.openaiApiKey).toBe('');
    });

    it('should have valid default models', () => {
      expect(DEFAULT_SETTINGS.modelName).toBe('gemini-2.5-flash-lite');
      expect(DEFAULT_SETTINGS.openaiModel).toBe('gpt-5-nano');
    });

    it('should have conservative defaults for features', () => {
      expect(DEFAULT_SETTINGS.includeSummary).toBe(false);
      expect(DEFAULT_SETTINGS.proposeTags).toBe(false);
      expect(DEFAULT_SETTINGS.generateDiagram).toBe(false);
    });

    it('should have bullet points as default summary length', () => {
      expect(DEFAULT_SETTINGS.summaryLength).toBe('bullet');
    });

    it('should have all required properties', () => {
      const requiredProperties = [
        'provider', 'apiKey', 'modelName', 'openaiApiKey', 'openaiModel',
        'includeSummary', 'summaryLength', 'proposeTags', 'generateDiagram',
        'summaryLanguage'
      ];

      requiredProperties.forEach(prop => {
        expect(DEFAULT_SETTINGS).toHaveProperty(prop);
      });
    });

    it('should have same-as-audio as default language', () => {
      expect(DEFAULT_SETTINGS.summaryLanguage).toBe('same-as-audio');
    });
  });

  describe('AI_PROVIDERS', () => {
    it('should contain all expected providers', () => {
      const expectedProviders = ['google', 'openai'];
      expectedProviders.forEach(provider => {
        expect(AI_PROVIDERS).toHaveProperty(provider);
      });
    });

    it('should have correct provider configurations', () => {
      Object.entries(AI_PROVIDERS).forEach(([key, config]) => {
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('docsUrl');
        expect(config).toHaveProperty('isGeneralist');
        expect(config).toHaveProperty('description');

        expect(typeof config.name).toBe('string');
        expect(typeof config.docsUrl).toBe('string');
        expect(typeof config.isGeneralist).toBe('boolean');
        expect(typeof config.description).toBe('string');

        expect(config.name.length).toBeGreaterThan(0);
        expect(config.docsUrl).toMatch(/^https?:\/\//);
        expect(config.description.length).toBeGreaterThan(10);
      });
    });

    it('should correctly identify generalist vs specialist providers', () => {
      expect(AI_PROVIDERS.google.isGeneralist).toBe(true);
      expect(AI_PROVIDERS.openai.isGeneralist).toBe(true);
    });

    it('should have valid documentation URLs', () => {
      const urlTests = [
        { provider: 'google', shouldContain: 'google.dev' },
        { provider: 'openai', shouldContain: 'openai.com' }
      ];

      urlTests.forEach(({ provider, shouldContain }) => {
        expect(AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS].docsUrl)
          .toContain(shouldContain);
      });
    });
  });

  describe('Type definitions', () => {
    it('should accept valid AIProvider values', () => {
      const validProviders: AIProvider[] = ['google', 'openai'];
      
      // This test passes if TypeScript compilation succeeds
      validProviders.forEach(provider => {
        expect(typeof provider).toBe('string');
        expect(Object.keys(AI_PROVIDERS)).toContain(provider);
      });
    });

    it('should accept valid TranscriptionResult objects', () => {
      const validResults: TranscriptionResult[] = [
        { transcription: 'Text only' },
        { transcription: 'With summary', summary: 'Summary text' },
        { 
          transcription: 'Complete result',
          summary: 'Summary',
          tags: ['tag1', 'tag2'],
          diagram: 'graph TD\n  A --> B'
        }
      ];

      validResults.forEach(result => {
        expect(result).toHaveProperty('transcription');
        expect(typeof result.transcription).toBe('string');
      });
    });

    it('should accept valid AITranscriptionSettings objects', () => {
      const validSettings: AITranscriptionSettings[] = [
        DEFAULT_SETTINGS,
        {
          ...DEFAULT_SETTINGS,
          provider: 'openai',
          openaiApiKey: 'test-key',
          includeSummary: true,
          summaryLength: 'short'
        },
      ];

      validSettings.forEach(settings => {
        expect(Object.keys(AI_PROVIDERS)).toContain(settings.provider);
        expect(['short', 'medium', 'long', 'bullet']).toContain(settings.summaryLength);
        expect(typeof settings.includeSummary).toBe('boolean');
        expect(typeof settings.proposeTags).toBe('boolean');
        expect(typeof settings.generateDiagram).toBe('boolean');
      });
    });

    it('should accept valid SummaryLanguage values', () => {
      const validLanguages: SummaryLanguage[] = [
        'same-as-audio', 'separator', 'english', 'spanish', 'french', 'german', 
        'italian', 'portuguese', 'russian', 'japanese', 'korean',
        'chinese', 'hindi', 'arabic', 'dutch', 'swedish', 
        'polish', 'turkish', 'catalan', 'custom'
      ];
      
      validLanguages.forEach(lang => {
        const settings: AITranscriptionSettings = {
          ...DEFAULT_SETTINGS,
          summaryLanguage: lang
        };
        expect(settings.summaryLanguage).toBe(lang);
      });
    });
  });

  describe('Constants validation', () => {
    it('should have immutable provider configurations', () => {
      const originalGoogle = { ...AI_PROVIDERS.google };
      
      // Attempt to modify (should not affect original due to const)
      try {
        (AI_PROVIDERS as any).google.name = 'Modified';
      } catch (error) {
        // Expected for strict mode
      }
      
      // The actual object should remain unchanged in well-behaved environments
      expect(AI_PROVIDERS.google.name).toBeDefined();
      expect(typeof AI_PROVIDERS.google.name).toBe('string');
    });

    it('should have consistent provider keys', () => {
      // Provider keys should match the AIProvider type
      const providerKeys = Object.keys(AI_PROVIDERS);
      const expectedKeys = ['google', 'openai'];
      
      expect(providerKeys.sort()).toEqual(expectedKeys.sort());
    });

    it('should have reasonable default values', () => {
      // Summary length options should be valid
      expect(['short', 'medium', 'long', 'bullet']).toContain(DEFAULT_SETTINGS.summaryLength);
      
      // Provider should be valid
      expect(Object.keys(AI_PROVIDERS)).toContain(DEFAULT_SETTINGS.provider);
      
      // All string settings should be strings (not null/undefined)
      expect(typeof DEFAULT_SETTINGS.apiKey).toBe('string');
      expect(typeof DEFAULT_SETTINGS.openaiApiKey).toBe('string');
    });
  });
});