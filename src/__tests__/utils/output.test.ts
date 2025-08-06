import { 
  formatTranscriptionOutput, 
  formatTagsForDisplay, 
  formatDiagramOutput 
} from '../../utils/output';
import { TranscriptionResult, AITranscriptionSettings } from '../../types';

describe('output', () => {
  const mockSettings: AITranscriptionSettings = {
    provider: 'google',
    apiKey: 'test',
    modelName: 'test',
    openaiApiKey: '',
    openaiModel: '',
    anthropicApiKey: '',
    anthropicModel: '',
    azureApiKey: '',
    azureEndpoint: '',
    azureDeploymentName: '',
    deepgramApiKey: '',
    deepgramModel: '',
    assemblyaiApiKey: '',
    includeSummary: true,
    summaryLength: 'medium',
    proposeTags: true,
    generateDiagram: true
  };

  describe('formatTranscriptionOutput', () => {
    it('should format complete transcription result', () => {
      const result: TranscriptionResult = {
        transcription: 'This is the transcribed text.',
        summary: 'This is a summary.',
        tags: ['tag1', 'tag2', 'tag3'],
        diagram: 'graph TD\n  A --> B'
      };

      const output = formatTranscriptionOutput(result, mockSettings);

      expect(output).toContain('## Transcription');
      expect(output).toContain('This is the transcribed text.');
      expect(output).toContain('## Summary');
      expect(output).toContain('This is a summary.');
      expect(output).toContain('## Tags');
      expect(output).toContain('#tag1 #tag2 #tag3');
      expect(output).toContain('## Chart');
      expect(output).toContain('```mermaid');
      expect(output).toContain('graph TD');
    });

    it('should only include enabled sections', () => {
      const result: TranscriptionResult = {
        transcription: 'Text only',
        summary: 'Summary text',
        tags: ['tag1'],
        diagram: 'graph'
      };

      const settings = {
        ...mockSettings,
        includeSummary: false,
        proposeTags: false,
        generateDiagram: false
      };

      const output = formatTranscriptionOutput(result, settings);

      expect(output).toContain('## Transcription');
      expect(output).toContain('Text only');
      expect(output).not.toContain('## Summary');
      expect(output).not.toContain('## Tags');
      expect(output).not.toContain('## Diagram');
    });

    it('should handle missing optional fields', () => {
      const result: TranscriptionResult = {
        transcription: 'Only transcription'
      };

      const output = formatTranscriptionOutput(result, mockSettings);

      expect(output).toContain('## Transcription');
      expect(output).toContain('Only transcription');
      expect(output).not.toContain('## Summary');
      expect(output).not.toContain('## Tags');
      expect(output).not.toContain('## Diagram');
    });

    it('should add proper spacing between sections', () => {
      const result: TranscriptionResult = {
        transcription: 'Text',
        summary: 'Summary'
      };

      const output = formatTranscriptionOutput(result, mockSettings);
      
      // Check for proper section order
      expect(output).toMatch(/## Summary[\s\S]*## Transcription/);
    });

    it('should handle empty transcription', () => {
      const result: TranscriptionResult = {
        transcription: ''
      };

      const output = formatTranscriptionOutput(result, mockSettings);

      expect(output).toContain('## Transcription');
      expect(output.trim()).toBe('## Transcription');
    });
  });

  describe('formatTagsForDisplay', () => {
    it('should format tags with # prefix', () => {
      const tags = ['technology', 'ai', 'machine-learning'];
      expect(formatTagsForDisplay(tags)).toBe('#technology #ai #machine-learning');
    });

    it('should handle empty array', () => {
      expect(formatTagsForDisplay([])).toBe('');
    });

    it('should handle single tag', () => {
      expect(formatTagsForDisplay(['single'])).toBe('#single');
    });

    it('should handle tags with spaces', () => {
      const tags = ['multi word', 'another phrase'];
      expect(formatTagsForDisplay(tags)).toBe('#multi word #another phrase');
    });

    it('should handle tags with special characters', () => {
      const tags = ['C++', 'Node.js', '.NET'];
      expect(formatTagsForDisplay(tags)).toBe('#C++ #Node.js #.NET');
    });

    it('should handle whitespace in tags', () => {
      const tags = [' tag1 ', '  tag2  ', 'tag3   '];
      expect(formatTagsForDisplay(tags)).toBe('# tag1  #  tag2   #tag3   ');
    });
  });

  describe('formatDiagramOutput', () => {
    it('should wrap diagram in mermaid code block', () => {
      const diagram = 'graph TD\n  A[Start] --> B[End]';
      const output = formatDiagramOutput(diagram);

      expect(output).toBe('```mermaid\ngraph TD\n  A[Start] --> B[End]\n```');
    });

    it('should handle empty diagram', () => {
      expect(formatDiagramOutput('')).toBe('```mermaid\n\n```');
    });

    it('should preserve diagram formatting', () => {
      const diagram = `graph TD
    A[Complex Node] --> B{Decision}
    B -->|Yes| C[Result 1]
    B -->|No| D[Result 2]
    C --> E[End]
    D --> E`;

      const output = formatDiagramOutput(diagram);

      expect(output).toContain('A[Complex Node] --> B{Decision}');
      expect(output).toContain('B -->|Yes| C[Result 1]');
      expect(output).toContain('D --> E');
    });

    it('should handle diagrams with special characters', () => {
      const diagram = 'graph TD\n  A["Node with quotes"] --> B[Node with & symbol]';
      const output = formatDiagramOutput(diagram);

      expect(output).toContain('"Node with quotes"');
      expect(output).toContain('Node with & symbol');
    });

    it('should handle multi-line node labels', () => {
      const diagram = `graph TD
    A[Line 1<br/>Line 2] --> B[Single line]`;
      
      const output = formatDiagramOutput(diagram);
      expect(output).toContain('Line 1<br/>Line 2');
    });
  });
});