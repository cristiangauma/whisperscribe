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

describe('transcribeWithOpenAI (Hybrid: Whisper + Selected Model)', () => {
  const mockSettings: AITranscriptionSettings = {
    provider: 'openai',
    apiKey: '',
    modelName: '',
    openaiApiKey: 'test-openai-key',
    openaiModel: 'whisper-1',
    includeSummary: true,
    summaryLength: 'medium',
    proposeTags: true,
    generateDiagram: true,
    summaryLanguage: 'same-as-audio',
    customLanguage: ''
  };

  const mockFile = new TFile('test.mp3', 'mp3', 1024);
  const mockAudioBuffer = new ArrayBuffer(1024);

  beforeEach(() => {
    jest.clearAllMocks();
    mockApp.vault.readBinary.mockResolvedValue(mockAudioBuffer);
  });

  it('should transcribe with Whisper and generate extras with selected model', async () => {
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

  it('should use Whisper for transcription and GPT-5 for advanced features', async () => {
    const gpt5Settings = {
      ...mockSettings,
      openaiModel: 'gpt-5-nano'
    };

    // Mock Whisper transcription response
    const whisperResponse = {
      ok: true,
      json: async () => ({
        text: 'This is the transcribed content from Whisper.'
      })
    };

    // Mock GPT-5 extras response
    const gpt5Response = {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: `SUMMARY:
A summary generated by GPT-5.

TAGS:
gpt5, whisper, hybrid

DIAGRAM:
graph TD
  A[Audio] --> B[Whisper]
  B --> C[GPT-5]`
          }
        }]
      })
    };

    mockFetch
      .mockResolvedValueOnce(whisperResponse)  // Whisper call
      .mockResolvedValueOnce(gpt5Response);    // GPT-5 call for extras

    const result = await transcribeWithOpenAI(mockFile, gpt5Settings, mockApp);

    expect(result.transcription).toBe('This is the transcribed content from Whisper.');
    expect(result.summary).toBe('A summary generated by GPT-5.');
    expect(result.tags).toEqual(['gpt5', 'whisper', 'hybrid']);
    expect(result.diagram).toContain('graph TD');

    // Verify two API calls: Whisper + GPT-5
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    // Verify Whisper API call
    const [whisperUrl, whisperOptions] = mockFetch.mock.calls[0];
    expect(whisperUrl).toContain('openai.com/v1/audio/transcriptions');
    expect(whisperOptions.method).toBe('POST');
    
    // Verify GPT-5 API call for extras
    const [gpt5Url, gpt5Options] = mockFetch.mock.calls[1];
    expect(gpt5Url).toContain('openai.com/v1/chat/completions');
    expect(gpt5Options.headers['Content-Type']).toBe('application/json');
    
    const body = JSON.parse(gpt5Options.body);
    expect(body.model).toBe('gpt-5-nano');
    expect(body.messages[0].content).toContain('This is the transcribed content from Whisper.');
    expect(body.max_completion_tokens).toBeUndefined(); // GPT-5 reasoning model has no token limits
    expect(body.max_tokens).toBeUndefined();
    expect(body.temperature).toBeUndefined(); // GPT-5 doesn't support custom temperature
  });


  it('should handle all audio formats with Whisper', async () => {
    const gpt5Settings = {
      ...mockSettings,
      openaiModel: 'gpt-5-nano'
    };

    // Mock Whisper transcription response
    const whisperResponse = {
      ok: true,
      json: async () => ({
        text: 'Transcription from M4A file using Whisper.'
      })
    };

    // Mock GPT-5 extras response
    const gpt5Response = {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: `SUMMARY:
Summary of M4A content.`
          }
        }]
      })
    };

    mockFetch
      .mockResolvedValueOnce(whisperResponse)  // Whisper handles M4A
      .mockResolvedValueOnce(gpt5Response);    // GPT-5 for extras

    const m4aFile = new TFile('test.m4a', 'm4a', 1024);
    const result = await transcribeWithOpenAI(m4aFile, gpt5Settings, mockApp);

    expect(result.transcription).toBe('Transcription from M4A file using Whisper.');
    expect(result.summary).toBe('Summary of M4A content.');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should use max_tokens for older models', async () => {
    const gpt35Settings = {
      ...mockSettings,
      openaiModel: 'gpt-3.5-turbo'
    };

    // Mock Whisper transcription response
    const whisperResponse = {
      ok: true,
      json: async () => ({
        text: 'Test transcription.'
      })
    };

    // Mock GPT-3.5 extras response
    const gpt35Response = {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: `SUMMARY:
Test summary from GPT-3.5.`
          }
        }]
      })
    };

    mockFetch
      .mockResolvedValueOnce(whisperResponse)
      .mockResolvedValueOnce(gpt35Response);

    const result = await transcribeWithOpenAI(mockFile, gpt35Settings, mockApp);

    expect(result.transcription).toBe('Test transcription.');
    expect(result.summary).toBe('Test summary from GPT-3.5.');

    // Verify GPT-3.5 uses max_tokens (not max_completion_tokens)
    const [, gpt35Options] = mockFetch.mock.calls[1];
    const body = JSON.parse(gpt35Options.body);
    expect(body.model).toBe('gpt-3.5-turbo');
    expect(body.max_tokens).toBe(350); // Older models use max_tokens
    expect(body.max_completion_tokens).toBeUndefined();
    expect(body.temperature).toBe(0.1); // Older models support custom temperature
  });

});