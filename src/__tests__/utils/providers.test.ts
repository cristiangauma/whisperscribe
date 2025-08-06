import { 
  isProviderGeneralist, 
  getProviderConfig, 
  getAllProviders 
} from '../../utils/providers';
import { AI_PROVIDERS } from '../../types';

describe('providers', () => {
  describe('isProviderGeneralist', () => {
    it('should correctly identify generalist providers', () => {
      expect(isProviderGeneralist('google')).toBe(true);
      expect(isProviderGeneralist('openai')).toBe(true);
    });


    it('should return false for unknown providers', () => {
      expect(isProviderGeneralist('unknown' as any)).toBe(false);
      expect(isProviderGeneralist('' as any)).toBe(false);
    });

    it('should handle null/undefined gracefully', () => {
      expect(isProviderGeneralist(null as any)).toBe(false);
      expect(isProviderGeneralist(undefined as any)).toBe(false);
    });
  });

  describe('getProviderConfig', () => {
    it('should return correct config for valid providers', () => {
      const googleConfig = getProviderConfig('google');
      expect(googleConfig).toEqual(AI_PROVIDERS.google);
      expect(googleConfig.name).toBe('Google Gemini');
      expect(googleConfig.isGeneralist).toBe(true);

      const openaiConfig = getProviderConfig('openai');
      expect(openaiConfig).toEqual(AI_PROVIDERS.openai);
      expect(openaiConfig.name).toBe('OpenAI');
      expect(openaiConfig.isGeneralist).toBe(true);

    });

    it('should return undefined for unknown providers', () => {
      expect(getProviderConfig('unknown' as any)).toBeUndefined();
      expect(getProviderConfig('' as any)).toBeUndefined();
    });

    it('should return correct URLs for each provider', () => {
      expect(getProviderConfig('google')?.docsUrl).toContain('google.dev');
      expect(getProviderConfig('openai')?.docsUrl).toContain('openai.com');
    });

    it('should include descriptions for all providers', () => {
      const providers = ['google', 'openai'] as const;
      providers.forEach(provider => {
        const config = getProviderConfig(provider);
        expect(config?.description).toBeTruthy();
        expect(config?.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('getAllProviders', () => {
    it('should return all provider configurations', () => {
      const allProviders = getAllProviders();
      
      expect(Object.keys(allProviders)).toHaveLength(2);
      expect(allProviders).toHaveProperty('google');
      expect(allProviders).toHaveProperty('openai');
    });

    it('should return the same object as AI_PROVIDERS', () => {
      const allProviders = getAllProviders();
      expect(allProviders).toBe(AI_PROVIDERS);
    });

    it('should contain valid provider configurations', () => {
      const allProviders = getAllProviders();
      
      Object.entries(allProviders).forEach(([key, config]) => {
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('docsUrl');
        expect(config).toHaveProperty('isGeneralist');
        expect(config).toHaveProperty('description');
        expect(typeof config.name).toBe('string');
        expect(typeof config.docsUrl).toBe('string');
        expect(typeof config.isGeneralist).toBe('boolean');
        expect(typeof config.description).toBe('string');
      });
    });

    it('should reference the same object as AI_PROVIDERS', () => {
      const providers = getAllProviders();
      
      expect(providers).toBe(AI_PROVIDERS);
      expect(providers.google.name).toBe('Google Gemini');
    });
  });
});