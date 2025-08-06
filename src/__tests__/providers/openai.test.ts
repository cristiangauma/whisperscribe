import { transcribeWithOpenAI } from '../../providers/openai';
import { TFile } from 'obsidian';
import { AITranscriptionSettings } from '../../types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock app
const mockApp = {
  vault: {
    readBinary: jest.fn()
  }
};

describe('transcribeWithOpenAI', () => {
  const mockSettings: AITranscriptionSettings = {
    provider: 'openai',
    apiKey: '',
    modelName: '',
    openaiApiKey: 'test-openai-key',
    openaiModel: 'whisper-1',
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

  const mockFile = new TFile('test.mp3', 'mp3', 1024);
  const mockAudioBuffer = new ArrayBuffer(1024);

  beforeEach(() => {
    jest.clearAllMocks();
    mockApp.vault.readBinary.mockResolvedValue(mockAudioBuffer);
  });

  it('should transcribe with Whisper and generate extras with ChatGPT', async () => {
    // Mock Whisper transcription response
    const whisperResponse = {
      ok: true,
      json: async () => ({
        text: 'This is the transcribed audio content from Whisper.'
      })
    };

    // Mock ChatGPT extras response
    const chatgptResponse = {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: `SUMMARY:
A summary of the transcribed content.

TAGS:
audio, transcription, openai

DIAGRAM:
graph TD
  A[Audio] --> B[Whisper]
  B --> C[ChatGPT]`
          }
        }]
      })
    };

    mockFetch
      .mockResolvedValueOnce(whisperResponse)  // Whisper call
      .mockResolvedValueOnce(chatgptResponse); // ChatGPT call

    const result = await transcribeWithOpenAI(mockFile, mockSettings, mockApp);

    expect(result.transcription).toBe('This is the transcribed audio content from Whisper.');
    expect(result.summary).toBe('A summary of the transcribed content.');
    expect(result.tags).toEqual(['audio', 'transcription', 'openai']);
    expect(result.diagram).toContain('graph TD');

    // Verify two API calls were made
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify Whisper API call
    const [whisperUrl, whisperOptions] = mockFetch.mock.calls[0];
    expect(whisperUrl).toContain('openai.com/v1/audio/transcriptions');
    expect(whisperOptions.method).toBe('POST');
    expect(whisperOptions.headers.Authorization).toBe('Bearer test-openai-key');

    // Verify ChatGPT API call
    const [chatUrl, chatOptions] = mockFetch.mock.calls[1];
    expect(chatUrl).toContain('openai.com/v1/chat/completions');
    expect(chatOptions.method).toBe('POST');
  });

  it('should return only transcription when extras are disabled', async () => {
    const settingsNoExtras = {
      ...mockSettings,
      includeSummary: false,
      proposeTags: false,
      generateDiagram: false
    };

    const whisperResponse = {
      ok: true,
      json: async () => ({
        text: 'Only transcription from Whisper.'
      })
    };

    mockFetch.mockResolvedValueOnce(whisperResponse);

    const result = await transcribeWithOpenAI(mockFile, settingsNoExtras, mockApp);

    expect(result.transcription).toBe('Only transcription from Whisper.');
    expect(result.summary).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.diagram).toBeUndefined();

    // Should only make one API call (Whisper)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle Whisper API errors', async () => {
    const whisperResponse = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: { message: 'Whisper API request failed: 401 Unauthorized' }
      })
    };

    mockFetch.mockResolvedValueOnce(whisperResponse);

    await expect(transcribeWithOpenAI(mockFile, mockSettings, mockApp))
      .rejects.toThrow('Whisper API request failed: 401 Unauthorized');
  });

  it('should handle ChatGPT API errors gracefully', async () => {
    const whisperResponse = {
      ok: true,
      json: async () => ({
        text: 'Transcription successful.'
      })
    };

    const chatgptResponse = {
      ok: false,
      status: 429,
      statusText: 'Rate Limit Exceeded',
      json: async () => ({
        error: { message: 'Rate limit exceeded' }
      })
    };

    mockFetch
      .mockResolvedValueOnce(whisperResponse)
      .mockResolvedValueOnce(chatgptResponse);

    // Should throw error when ChatGPT fails
    await expect(transcribeWithOpenAI(mockFile, mockSettings, mockApp))
      .rejects.toThrow('Failed to generate summary with OpenAI');
  });

  it('should use FormData for Whisper API request', async () => {
    const whisperResponse = {
      ok: true,
      json: async () => ({ text: 'Test transcription' })
    };

    const chatgptResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'SUMMARY:\nTest summary' } }]
      })
    };

    mockFetch
      .mockResolvedValueOnce(whisperResponse)
      .mockResolvedValueOnce(chatgptResponse);

    await transcribeWithOpenAI(mockFile, mockSettings, mockApp);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeInstanceOf(FormData);

    // Verify FormData contains required fields
    const formData = options.body as FormData;
    expect(formData.get('model')).toBe('whisper-1');
    expect(formData.get('file')).toBeInstanceOf(Blob);
  });

  it('should handle different audio formats', async () => {
    const formats = [
      new TFile('test.wav', 'wav'),
      new TFile('test.mp3', 'mp3'),
      new TFile('test.m4a', 'm4a')
    ];

    const whisperResponse = {
      ok: true,
      json: async () => ({ text: 'Test' })
    };

    const chatgptResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'SUMMARY:\nTest' } }]
      })
    };

    for (const file of formats) {
      mockFetch
        .mockResolvedValueOnce(whisperResponse)
        .mockResolvedValueOnce(chatgptResponse);
      
      await transcribeWithOpenAI(file, mockSettings, mockApp);
      
      // Check the Whisper call (first call of each pair)
      const whisperCallIndex = (mockFetch.mock.calls.length - 2);
      const [, options] = mockFetch.mock.calls[whisperCallIndex];
      const formData = options.body as FormData;
      const fileBlob = formData.get('file') as Blob;
      
      expect(fileBlob).toBeInstanceOf(Blob);
    }
  });

  it('should handle malformed ChatGPT JSON response', async () => {
    const whisperResponse = {
      ok: true,
      json: async () => ({ text: 'Test transcription' })
    };

    const chatgptResponse = {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'Invalid JSON content'
          }
        }]
      })
    };

    mockFetch
      .mockResolvedValueOnce(whisperResponse)
      .mockResolvedValueOnce(chatgptResponse);

    const result = await transcribeWithOpenAI(mockFile, mockSettings, mockApp);

    expect(result.transcription).toBe('Test transcription');
    expect(result.summary).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.diagram).toBeUndefined();
  });

  it('should generate appropriate ChatGPT prompt based on settings', async () => {
    const whisperResponse = {
      ok: true,
      json: async () => ({ text: 'Test transcription' })
    };

    const chatgptResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'SUMMARY:\nTest summary' } }]
      })
    };

    mockFetch
      .mockResolvedValueOnce(whisperResponse)
      .mockResolvedValueOnce(chatgptResponse);

    await transcribeWithOpenAI(mockFile, mockSettings, mockApp);

    const chatBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    const prompt = chatBody.messages[0].content;

    expect(prompt).toContain('Test transcription');
    expect(prompt).toContain('summary');
    expect(prompt).toContain('tags');
    expect(prompt).toContain('diagram');
    expect(prompt).toContain('Format your response as:');
  });
});