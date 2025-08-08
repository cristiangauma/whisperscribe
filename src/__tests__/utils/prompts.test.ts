import { 
  getSummaryPrompt, 
  getTranscriptionPrompt, 
  generateOpenAIExtrasPrompt 
} from '../../utils/prompts';
import { AITranscriptionSettings } from '../../types';

describe('prompts', () => {
  const mockSettings: AITranscriptionSettings = {
    provider: 'google',
    apiKey: 'test-key',
    modelName: 'test-model',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini-transcribe',
    includeSummary: true,
    summaryLength: 'medium',
    proposeTags: true,
    generateDiagram: true,
    summaryLanguage: 'same-as-audio'
  };

  describe('getSummaryPrompt', () => {
    it('should generate short summary prompt', () => {
      const prompt = getSummaryPrompt('short');
      expect(prompt).toContain('2-3 sentence');
      expect(prompt).toContain('brief');
    });

    it('should generate medium summary prompt', () => {
      const prompt = getSummaryPrompt('medium');
      expect(prompt).toContain('comprehensive');
      expect(prompt).toContain('paragraph');
    });

    it('should generate long summary prompt', () => {
      const prompt = getSummaryPrompt('long');
      expect(prompt).toContain('detailed');
      expect(prompt).toContain('multi-paragraph');
    });

    it('should generate bullet points summary prompt', () => {
      const prompt = getSummaryPrompt('bullet');
      expect(prompt).toContain('bullet points');
      expect(prompt).toContain('maximum of 5');
      expect(prompt).toContain('most important');
    });

    it('should default to medium for unknown length', () => {
      const prompt = getSummaryPrompt('unknown' as any);
      expect(prompt).toContain('comprehensive');
    });
  });

  describe('getTranscriptionPrompt', () => {
    it('should include all sections when all features enabled', () => {
      const prompt = getTranscriptionPrompt(mockSettings);
      
      expect(prompt).toContain('TRANSCRIPTION:');
      expect(prompt).toContain('SUMMARY:');
      expect(prompt).toContain('TAGS:');
      expect(prompt).toContain('DIAGRAM:');
    });

    it('should only include transcription when features disabled', () => {
      const settings = {
        ...mockSettings,
        includeSummary: false,
        proposeTags: false,
        generateDiagram: false
      };
      
      const prompt = getTranscriptionPrompt(settings);
      
      expect(prompt).toContain('Output ONLY the raw transcription text');
      expect(prompt).not.toContain('SUMMARY:');
      expect(prompt).not.toContain('TAGS:');
      expect(prompt).not.toContain('DIAGRAM:');
    });

    it('should include correct summary type based on length', () => {
      const bulletSettings = { ...mockSettings, summaryLength: 'bullet' };
      const bulletPrompt = getTranscriptionPrompt(bulletSettings);
      expect(bulletPrompt).toContain('[bullet points]');

      const paragraphSettings = { ...mockSettings, summaryLength: 'long' };
      const paragraphPrompt = getTranscriptionPrompt(paragraphSettings);
      expect(paragraphPrompt).toContain('[summary]');
    });

    it('should include structured format when features enabled', () => {
      const prompt = getTranscriptionPrompt(mockSettings);
      expect(prompt).toContain('Format your response as:');
      expect(prompt).toContain('TRANSCRIPTION:');
    });

    it('should include diagram instruction when enabled', () => {
      const prompt = getTranscriptionPrompt(mockSettings);
      expect(prompt).toContain('Mermaid diagram');
      expect(prompt).toContain('flowchart TD format');
      expect(prompt).toContain('DIAGRAM:');
    });
  });


  describe('generateOpenAIExtrasPrompt', () => {
    const transcription = 'This is the transcribed text.';

    it('should generate complete extras prompt', () => {
      const prompt = generateOpenAIExtrasPrompt(mockSettings, transcription);
      
      expect(prompt).toContain(transcription);
      expect(prompt).toContain('Please provide');
      expect(prompt).toContain('summary');
      expect(prompt).toContain('tags');
      expect(prompt).toContain('diagram');
    });

    it('should specify summary length correctly', () => {
      const shortSettings = { ...mockSettings, summaryLength: 'short' };
      const shortPrompt = generateOpenAIExtrasPrompt(shortSettings, transcription);
      expect(shortPrompt).toContain('2-3 sentence');

      const bulletSettings = { ...mockSettings, summaryLength: 'bullet' };
      const bulletPrompt = generateOpenAIExtrasPrompt(bulletSettings, transcription);
      expect(bulletPrompt).toContain('bullet points');
    });

    it('should only include enabled features', () => {
      const settings = {
        ...mockSettings,
        includeSummary: false,
        proposeTags: true,
        generateDiagram: false
      };
      
      const prompt = generateOpenAIExtrasPrompt(settings, transcription);
      
      expect(prompt).not.toContain('summary');
      expect(prompt).toContain('tags');
      expect(prompt).not.toContain('diagram');
    });

    it('should return empty string when no features enabled', () => {
      const settings = {
        ...mockSettings,
        includeSummary: false,
        proposeTags: false,
        generateDiagram: false
      };
      
      const prompt = generateOpenAIExtrasPrompt(settings, transcription);
      expect(prompt).toBe('');
    });

    it('should include JSON format instruction', () => {
      const prompt = generateOpenAIExtrasPrompt(mockSettings, transcription);
      expect(prompt).toContain('Format your response as:');
    });
  });

  describe('language support', () => {
    it('should handle same-as-audio language setting', () => {
      const settings = { ...mockSettings, summaryLanguage: 'same-as-audio' as const };
      const prompt = getTranscriptionPrompt(settings);
      
      expect(prompt).toContain('in the same language as the audio');
    });

    it('should handle specific language settings', () => {
      const spanishSettings = { ...mockSettings, summaryLanguage: 'spanish' as const };
      const spanishPrompt = getTranscriptionPrompt(spanishSettings);
      
      expect(spanishPrompt).toContain('in Spanish');
      expect(spanishPrompt).toContain('You MUST provide ALL outputs (summary, tags, and diagram labels) ONLY in Spanish');
    });

    it('should handle custom language with custom language name', () => {
      const customSettings = { 
        ...mockSettings, 
        summaryLanguage: 'custom' as const,
        customLanguage: 'Esperanto'
      };
      const customPrompt = getTranscriptionPrompt(customSettings);
      
      expect(customPrompt).toContain('in Esperanto');
    });


    it('should include language instructions in OpenAI extras prompts', () => {
      const catalanSettings = { ...mockSettings, summaryLanguage: 'catalan' as const };
      const prompt = generateOpenAIExtrasPrompt(catalanSettings, 'test transcription');
      
      expect(prompt).toContain('in Catalan');
      expect(prompt).toContain('You MUST provide ALL outputs (summary, tags, and diagram labels) ONLY in Catalan');
    });

    it('should handle tags with language settings', () => {
      const germanSettings = { ...mockSettings, summaryLanguage: 'german' as const };
      const prompt = getTranscriptionPrompt(germanSettings);
      
      expect(prompt).toContain('tags for categorizing this content (use simple words, avoid spaces) in German');
    });

    it('should handle diagrams with language settings', () => {
      const japaneseSettings = { ...mockSettings, summaryLanguage: 'japanese' as const };
      const prompt = getTranscriptionPrompt(japaneseSettings);
      
      expect(prompt).toContain('node labels in Japanese');
    });
  });
});