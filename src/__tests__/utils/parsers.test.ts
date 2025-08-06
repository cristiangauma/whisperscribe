import { parseClaudeResponse, parseGeneralResponse } from '../../utils/parsers';

describe('parsers', () => {
  describe('parseClaudeResponse', () => {
    it('should parse complete Claude response with all sections', () => {
      const response = `Here is the transcription:

SUMMARY:
This is a brief summary of the content.

TAGS:
technology, ai, machine-learning

DIAGRAM:
graph TD
    A[Start] --> B[End]`;

      const result = parseClaudeResponse(response);
      
      expect(result.summary).toBe('This is a brief summary of the content.');
      expect(result.tags).toEqual(['technology', 'ai', 'machine-learning']);
      expect(result.diagram).toContain('graph TD');
    });

    it('should handle response without sections', () => {
      const response = `Just some text without any sections`;

      const result = parseClaudeResponse(response);
      
      expect(result.summary).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.diagram).toBeUndefined();
    });

    it('should handle multiline summaries', () => {
      const response = `SUMMARY:
Line 1 of summary.
Line 2 of summary.
Line 3 of summary.

TAGS:
tag1, tag2`;

      const result = parseClaudeResponse(response);
      
      expect(result.summary).toContain('Line 1 of summary.');
      expect(result.summary).toContain('Line 3 of summary.');
      expect(result.tags).toBeTruthy();
    });

    it('should parse tags with various formats', () => {
      const response = `TAGS:
tag1, tag-2, tag_3, "complex tag", 'another tag'`;

      const result = parseClaudeResponse(response);
      
      expect(result.tags).toEqual(['tag1', 'tag-2', 'tag_3', 'complex-tag', 'another-tag']);
    });

    it('should handle sections with only whitespace', () => {
      const response = `SUMMARY:
Some summary text

TAGS:
tag1, tag2

DIAGRAM:
graph TD
  A --> B`;

      const result = parseClaudeResponse(response);
      
      expect(result.summary).toBe('Some summary text');
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.diagram).toBe('graph TD\n  A --> B');
    });

    it('should handle response without section headers', () => {
      const response = 'Just plain text without any sections';
      
      const result = parseClaudeResponse(response);
      
      expect(result.summary).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.diagram).toBeUndefined();
    });
  });

  describe('parseGeneralResponse', () => {
    it('should parse complete response with all sections', () => {
      const responseText = `TRANSCRIPTION:
This is the transcribed text.

SUMMARY:
This is the summary.

TAGS:
tag1, tag2

DIAGRAM:
graph TD
  A --> B`;

      const result = parseGeneralResponse(responseText, true);
      
      expect(result.transcription).toBe('This is the transcribed text.');
      expect(result.summary).toBe('This is the summary.');
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.diagram).toBe('graph TD\n  A --> B');
    });

    it('should parse response with only transcription', () => {
      const responseText = 'Only transcription text';

      const result = parseGeneralResponse(responseText, false);
      
      expect(result.transcription).toBe('Only transcription text');
      expect(result.summary).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.diagram).toBeUndefined();
    });

    it('should handle plain text as transcription', () => {
      const responseText = 'This is plain transcription text';
      
      const result = parseGeneralResponse(responseText, false);
      
      expect(result.transcription).toBe('This is plain transcription text');
      expect(result.summary).toBeUndefined();
    });

    it('should handle response without transcription section', () => {
      const responseText = `SUMMARY:
Summary without transcription

TAGS:
tag1`;

      const result = parseGeneralResponse(responseText, true);
      
      expect(result.transcription).toBe(responseText);
      expect(result.summary).toBe('Summary without transcription');
      expect(result.tags).toEqual(['tag1']);
    });

    it('should handle sections with proper spacing', () => {
      const responseText = `TRANSCRIPTION:
The audio transcript text

SUMMARY:
A brief summary

TAGS:
audio, transcript

DIAGRAM:
flowchart TD
  A --> B`;

      const result = parseGeneralResponse(responseText, true);
      
      expect(result.transcription).toBe('The audio transcript text');
      expect(result.summary).toBe('A brief summary');
      expect(result.tags).toEqual(['audio', 'transcript']);
      expect(result.diagram).toBe('flowchart TD\n  A --> B');
    });

    it('should fallback to full text when no sections found with features enabled', () => {
      const responseText = 'Just plain text without any section headers';
      
      const result = parseGeneralResponse(responseText, true);
      
      expect(result.transcription).toBe('Just plain text without any section headers');
      expect(result.summary).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.diagram).toBeUndefined();
    });
  });
});