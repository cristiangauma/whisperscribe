import { 
  cleanRepetitiveText, 
  detectHallucination, 
  cleanTranscription 
} from '../../utils/transcription-cleaner';

describe('Transcription Cleaner', () => {
  describe('cleanRepetitiveText', () => {
    it('should clean excessive single word repetitions', () => {
      const text = 'This is a test fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa';
      const cleaned = cleanRepetitiveText(text, 3);
      
      expect(cleaned).toContain('This is a test fa fa fa');
      expect(cleaned).toContain('[repetitive pattern truncated]');
      expect(cleaned.split('fa').length).toBeLessThan(text.split('fa').length);
    });

    it('should preserve normal repetitions within limit', () => {
      const text = 'He said no no no and walked away';
      const cleaned = cleanRepetitiveText(text, 3);
      
      expect(cleaned).toBe(text);
      expect(cleaned).not.toContain('[repetitive text truncated]');
    });

    it('should handle empty or invalid input', () => {
      expect(cleanRepetitiveText('')).toBe('');
      expect(cleanRepetitiveText('   ')).toBe('   ');
    });

    it('should clean repetitive phrases', () => {
      const text = 'The meeting starts and then and then and then and then and then we begin';
      const cleaned = cleanRepetitiveText(text, 2);
      
      expect(cleaned).toContain('and then and then');
      expect(cleaned).toContain('[repetitive pattern truncated]');
    });

    it('should handle mixed repetitions', () => {
      const text = 'Start here go go go go go and there there there there there there end';
      const cleaned = cleanRepetitiveText(text, 3);
      
      expect(cleaned).toContain('go go go');
      expect(cleaned).toContain('there there there');
      expect(cleaned).toContain('[repetitive pattern truncated]');
    });
  });

  describe('detectHallucination', () => {
    it('should detect high repetition ratio as hallucination', () => {
      const text = 'fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa';
      const isHallucination = detectHallucination(text, 0.3);
      
      expect(isHallucination).toBe(true);
    });

    it('should detect long sequences as hallucination', () => {
      const text = 'This is normal text but then fa ' + 'fa '.repeat(15) + 'and continues';
      const isHallucination = detectHallucination(text);
      
      expect(isHallucination).toBe(true);
    });

    it('should not flag normal text as hallucination', () => {
      const text = 'This is a normal conversation about various topics with different words and phrases';
      const isHallucination = detectHallucination(text);
      
      expect(isHallucination).toBe(false);
    });

    it('should handle short texts correctly', () => {
      const shortText = 'Hello world';
      const isHallucination = detectHallucination(shortText);
      
      expect(isHallucination).toBe(false);
    });

    it('should handle empty input', () => {
      expect(detectHallucination('')).toBe(false);
      expect(detectHallucination('   ')).toBe(false);
    });
  });

  describe('cleanTranscription', () => {
    it('should clean and detect hallucination', () => {
      const text = 'Normal text fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa more text';
      const result = cleanTranscription(text);
      
      expect(result.hadHallucination).toBe(true);
      expect(result.cleanedText).toContain('Normal text fa fa fa');
      expect(result.cleanedText).toContain('[repetitive pattern truncated]');
      expect(result.cleanedText).toContain('more text');
    });

    it('should handle normal text without changes', () => {
      const normalText = 'This is a completely normal transcription with various words and no repetitive patterns at all';
      const result = cleanTranscription(normalText);
      
      expect(result.hadHallucination).toBe(false);
      expect(result.cleanedText).toBe(normalText);
    });

    it('should handle empty input', () => {
      const result = cleanTranscription('');
      
      expect(result.hadHallucination).toBe(false);
      expect(result.cleanedText).toBe('');
    });

    it('should handle real-world Catalan example pattern', () => {
      const text = 'Això és una prova per veure com transcriu el plugin que fem de Obsidian fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa';
      const result = cleanTranscription(text);
      
      expect(result.hadHallucination).toBe(true);
      expect(result.cleanedText).toContain('Això és una prova');
      expect(result.cleanedText).toContain('fa fa fa');
      expect(result.cleanedText).toContain('[repetitive pattern truncated]');
    });

    it('should detect any word repetition dynamically', () => {
      const text = 'Normal text hello hello hello hello hello hello hello hello hello hello hello hello more text';
      const result = cleanTranscription(text);
      
      expect(result.hadHallucination).toBe(true);
      expect(result.cleanedText).toContain('Normal text hello hello hello');
      expect(result.cleanedText).toContain('[repetitive pattern truncated]');
      expect(result.cleanedText).toContain('more text');
    });

    it('should detect phrase repetition dynamically', () => {
      const text = 'Start here and then we go and then we go and then we go and then we go and then we go end';
      const result = cleanTranscription(text);
      
      expect(result.hadHallucination).toBe(true);
      expect(result.cleanedText).toContain('Start here');
      expect(result.cleanedText).toContain('and then we go and then we go and then we go');
      expect(result.cleanedText).toContain('[repetitive pattern truncated]');
    });

    it('should detect complex mixed patterns', () => {
      const text = 'Speech begins okay okay okay okay okay then it goes wrong wrong wrong wrong wrong wrong wrong wrong';
      const result = cleanTranscription(text);
      
      expect(result.hadHallucination).toBe(true);
      expect(result.cleanedText).toContain('Speech begins okay okay okay');
      expect(result.cleanedText).toContain('wrong wrong wrong');
      expect(result.cleanedText).toContain('[repetitive pattern truncated]');
    });

    it('should preserve normal speech patterns', () => {
      const text = 'He said no, no, I will not go there, there is no point';
      const result = cleanTranscription(text);
      
      expect(result.hadHallucination).toBe(false);
      expect(result.cleanedText).toBe(text);
    });
  });
});