import { transcribeWithAI } from '../../providers';
import { TFile } from 'obsidian';
import { AITranscriptionSettings } from '../../types';

// Mock all provider modules
jest.mock('../../providers/gemini', () => ({
  transcribeWithGemini: jest.fn()
}));

jest.mock('../../providers/openai', () => ({
  transcribeWithOpenAI: jest.fn()
}));

import { transcribeWithGemini } from '../../providers/gemini';
import { transcribeWithOpenAI } from '../../providers/openai';

describe('transcribeWithAI', () => {
  const mockFile = new TFile('test.mp3', 'mp3');
  const mockApp = { vault: { readBinary: jest.fn() } } as any;
  const mockResult = {
    transcription: 'Test transcription',
    summary: 'Test summary',
    tags: ['test'],
    diagram: 'graph TD\n  A --> B'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should route to Google Gemini provider', async () => {
    const settings: AITranscriptionSettings = {
      provider: 'google',
      apiKey: 'test-key',
      modelName: 'gemini-1.5-flash',
      openaiApiKey: '',
      openaiModel: '',
      includeSummary: true,
      summaryLength: 'medium',
      proposeTags: true,
      generateDiagram: true
    };

    (transcribeWithGemini as jest.Mock).mockResolvedValue(mockResult);

    const result = await transcribeWithAI(mockFile, settings, mockApp);

    expect(transcribeWithGemini).toHaveBeenCalled();
    const gArgs = (transcribeWithGemini as jest.Mock).mock.calls[0];
    expect(gArgs[0]).toBe(mockFile);
    expect(gArgs[1]).toBe(settings);
    expect(gArgs[2]).toBe(mockApp);
    expect(result).toEqual(mockResult);
  });

  it('should route to OpenAI provider', async () => {
    const settings: AITranscriptionSettings = {
      provider: 'openai',
      apiKey: '',
      modelName: '',
      openaiApiKey: 'test-key',
      openaiModel: 'whisper-1',
      includeSummary: true,
      summaryLength: 'medium',
      proposeTags: true,
      generateDiagram: true
    };

    (transcribeWithOpenAI as jest.Mock).mockResolvedValue(mockResult);

    const result = await transcribeWithAI(mockFile, settings, mockApp);

    expect(transcribeWithOpenAI).toHaveBeenCalled();
    const oArgs = (transcribeWithOpenAI as jest.Mock).mock.calls[0];
    expect(oArgs[0]).toBe(mockFile);
    expect(oArgs[1]).toBe(settings);
    expect(oArgs[2]).toBe(mockApp);
    expect(result).toEqual(mockResult);
  });

  it('should throw error for unknown provider', async () => {
    const settings = {
      provider: 'unknown',
      apiKey: '',
      modelName: '',
      openaiApiKey: '',
      openaiModel: '',
      includeSummary: false,
      summaryLength: 'medium',
      proposeTags: false,
      generateDiagram: false
    };

    await expect(transcribeWithAI(mockFile, settings, mockApp))
      .rejects.toThrow('Invalid provider selected');
  });

  it('should propagate provider errors', async () => {
    const settings: AITranscriptionSettings = {
      provider: 'google',
      apiKey: 'test-key',
      modelName: 'gemini-1.5-flash',
      openaiApiKey: '',
      openaiModel: '',
      includeSummary: true,
      summaryLength: 'medium',
      proposeTags: true,
      generateDiagram: true
    };

    const providerError = new Error('Provider-specific error');
    (transcribeWithGemini as jest.Mock).mockRejectedValue(providerError);

    await expect(transcribeWithAI(mockFile, settings, mockApp))
      .rejects.toThrow('Provider-specific error');
  });

  it('should handle all provider types correctly', async () => {
    const providers: Array<{
      provider: 'google' | 'openai';
      mockFn: jest.Mock;
      expectedResult: typeof mockResult;
    }> = [
      { provider: 'google', mockFn: transcribeWithGemini as jest.Mock, expectedResult: mockResult },
      { provider: 'openai', mockFn: transcribeWithOpenAI as jest.Mock, expectedResult: mockResult }
    ];

    for (const { provider, mockFn, expectedResult } of providers) {
      jest.clearAllMocks();
      mockFn.mockResolvedValue(expectedResult);

      const settings: AITranscriptionSettings = {
        provider,
        apiKey: 'test-key',
        modelName: 'test-model',
        openaiApiKey: 'openai-key',
        openaiModel: 'whisper-1',
        includeSummary: true,
        summaryLength: 'medium',
        proposeTags: true,
        generateDiagram: true
      };

      const result = await transcribeWithAI(mockFile, settings, mockApp);

      expect(mockFn).toHaveBeenCalled();
      const args = mockFn.mock.calls[0];
      expect(args[0]).toBe(mockFile);
      expect(args[1]).toBe(settings);
      expect(args[2]).toBe(mockApp);
      expect(result).toEqual(expectedResult);
    }
  });
});
