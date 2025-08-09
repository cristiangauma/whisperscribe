import { transcribeWithOpenAI } from '../../providers/openai';
import { TFile, App } from 'obsidian';
import { AITranscriptionSettings } from '../../types';

// Mock both requestUrl and fetch
jest.mock('obsidian', () => ({
  ...jest.requireActual('obsidian'),
  requestUrl: jest.fn()
}));

// Mock global fetch
global.fetch = jest.fn();

import { requestUrl } from 'obsidian';
const mockRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock app
const mockApp = new App();

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
    // Mock Whisper transcription response (fetch)
    const whisperResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        text: 'This is the transcribed audio content from Whisper.'
      })
    };

    // Mock ChatGPT extras response (requestUrl)
    const chatgptResponse = {
      status: 200,
      json: {
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
      }
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);  // Whisper call uses fetch
    mockRequestUrl.mockResolvedValueOnce(chatgptResponse);    // ChatGPT call uses requestUrl

    const result = await transcribeWithOpenAI(mockFile, mockSettings, mockApp);

    expect(result.transcription).toBe('This is the transcribed audio content from Whisper.');
    expect(result.summary).toBe('A summary of the transcribed content.');
    expect(result.tags).toEqual(['audio', 'transcription', 'openai']);
    expect(result.diagram).toContain('graph TD');

    // Verify two API calls were made - one fetch, one requestUrl
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockRequestUrl).toHaveBeenCalledTimes(1);

    // Verify Whisper API call (fetch)
    const [whisperUrl, whisperOptions] = mockFetch.mock.calls[0];
    expect(whisperUrl).toContain('openai.com/v1/audio/transcriptions');
    expect(whisperOptions.method).toBe('POST');
    expect(whisperOptions.headers.Authorization).toBe('Bearer test-openai-key');

    // Verify ChatGPT API call (requestUrl)
    const [chatOptions] = mockRequestUrl.mock.calls[0];
    expect(chatOptions.url).toContain('openai.com/v1/chat/completions');
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
      status: 200,
      json: async () => ({
        text: 'Only transcription from Whisper.'
      })
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);

    const result = await transcribeWithOpenAI(mockFile, settingsNoExtras, mockApp);

    expect(result.transcription).toBe('Only transcription from Whisper.');
    expect(result.summary).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.diagram).toBeUndefined();

    // Should only make one API call (Whisper using fetch)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockRequestUrl).toHaveBeenCalledTimes(0);
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

    mockFetch.mockResolvedValueOnce(whisperResponse as any);

    await expect(transcribeWithOpenAI(mockFile, mockSettings, mockApp))
      .rejects.toThrow('Whisper API request failed: 401 Unauthorized');
  });

  it('should handle ChatGPT API errors gracefully', async () => {
    const whisperResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        text: 'Transcription successful.'
      })
    };

    const chatgptResponse = {
      status: 429,
      statusText: 'Rate Limit Exceeded',
      json: {
        error: { message: 'Rate limit exceeded' }
      }
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);  // Whisper uses fetch
    mockRequestUrl.mockResolvedValueOnce(chatgptResponse);    // ChatGPT uses requestUrl

    // Should throw error when ChatGPT fails
    await expect(transcribeWithOpenAI(mockFile, mockSettings, mockApp))
      .rejects.toThrow('Failed to generate summary with OpenAI');
  });

  it('should use FormData for Whisper API request', async () => {
    const whisperResponse = {
      ok: true,
      status: 200,
      json: async () => ({ text: 'Test transcription' })
    };

    const chatgptResponse = {
      status: 200,
      json: {
        choices: [{ message: { content: 'SUMMARY:\nTest summary' } }]
      }
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);  // Whisper uses fetch
    mockRequestUrl.mockResolvedValueOnce(chatgptResponse);    // ChatGPT uses requestUrl

    await transcribeWithOpenAI(mockFile, mockSettings, mockApp);

    // Verify Whisper API call (fetch) uses FormData
    const [whisperUrl, whisperOptions] = mockFetch.mock.calls[0];
    expect(whisperOptions.body).toBeInstanceOf(FormData);

    // Verify FormData contains required fields
    const formData = whisperOptions.body as FormData;
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
      status: 200,
      json: async () => ({ text: 'Test' })
    };

    const chatgptResponse = {
      status: 200,
      json: {
        choices: [{ message: { content: 'SUMMARY:\nTest' } }]
      }
    };

    for (const file of formats) {
      mockFetch.mockResolvedValueOnce(whisperResponse as any);   // Whisper uses fetch
      mockRequestUrl.mockResolvedValueOnce(chatgptResponse);     // ChatGPT uses requestUrl
      
      await transcribeWithOpenAI(file, mockSettings, mockApp);
      
      // Check the Whisper call (fetch)
      const fetchCallIndex = mockFetch.mock.calls.length - 1;
      const [whisperUrl, whisperOptions] = mockFetch.mock.calls[fetchCallIndex];
      const formData = whisperOptions.body as FormData;
      const fileBlob = formData.get('file') as Blob;
      
      expect(fileBlob).toBeInstanceOf(Blob);
    }
  });

  it('should handle malformed ChatGPT JSON response', async () => {
    const whisperResponse = {
      ok: true,
      status: 200,
      json: async () => ({ text: 'Test transcription' })
    };

    const chatgptResponse = {
      status: 200,
      json: {
        choices: [{
          message: {
            content: 'Invalid JSON content'
          }
        }]
      }
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);  // Whisper uses fetch
    mockRequestUrl.mockResolvedValueOnce(chatgptResponse);    // ChatGPT uses requestUrl

    const result = await transcribeWithOpenAI(mockFile, mockSettings, mockApp);

    expect(result.transcription).toBe('Test transcription');
    expect(result.summary).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.diagram).toBeUndefined();
  });

  it('should generate appropriate ChatGPT prompt based on settings', async () => {
    const whisperResponse = {
      ok: true,
      status: 200,
      json: async () => ({ text: 'Test transcription' })
    };

    const chatgptResponse = {
      status: 200,
      json: {
        choices: [{ message: { content: 'SUMMARY:\nTest summary' } }]
      }
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);  // Whisper uses fetch
    mockRequestUrl.mockResolvedValueOnce(chatgptResponse);    // ChatGPT uses requestUrl

    await transcribeWithOpenAI(mockFile, mockSettings, mockApp);

    const chatBody = JSON.parse(mockRequestUrl.mock.calls[0][0].body);
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

    // Mock Whisper transcription response (uses fetch)
    const whisperResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        text: 'This is the transcribed content from Whisper.'
      })
    };

    // Mock GPT-5 extras response (uses requestUrl)
    const gpt5Response = {
      status: 200,
      json: {
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
      }
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);  // Whisper uses fetch
    mockRequestUrl.mockResolvedValueOnce(gpt5Response);       // GPT-5 uses requestUrl

    const result = await transcribeWithOpenAI(mockFile, gpt5Settings, mockApp);

    expect(result.transcription).toBe('This is the transcribed content from Whisper.');
    expect(result.summary).toBe('A summary generated by GPT-5.');
    expect(result.tags).toEqual(['gpt5', 'whisper', 'hybrid']);
    expect(result.diagram).toContain('graph TD');

    // Verify two API calls: Whisper (fetch) + GPT-5 (requestUrl)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockRequestUrl).toHaveBeenCalledTimes(1);
    
    // Verify Whisper API call (fetch)
    const [whisperUrl, whisperOptions] = mockFetch.mock.calls[0];
    expect(whisperUrl).toContain('openai.com/v1/audio/transcriptions');
    expect(whisperOptions.method).toBe('POST');
    expect(whisperOptions.headers.Authorization).toBe('Bearer test-openai-key');
    
    // Verify GPT-5 API call for extras (requestUrl)
    const [gpt5Options] = mockRequestUrl.mock.calls[0];
    expect(gpt5Options.url).toContain('openai.com/v1/chat/completions');
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

    // Mock Whisper transcription response (uses fetch)
    const whisperResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        text: 'Transcription from M4A file using Whisper.'
      })
    };

    // Mock GPT-5 extras response (uses requestUrl)
    const gpt5Response = {
      status: 200,
      json: {
        choices: [{
          message: {
            content: `SUMMARY:
Summary of M4A content.`
          }
        }]
      }
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);  // Whisper uses fetch
    mockRequestUrl.mockResolvedValueOnce(gpt5Response);       // GPT-5 uses requestUrl

    const m4aFile = new TFile('test.m4a', 'm4a', 1024);
    const result = await transcribeWithOpenAI(m4aFile, gpt5Settings, mockApp);

    expect(result.transcription).toBe('Transcription from M4A file using Whisper.');
    expect(result.summary).toBe('Summary of M4A content.');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockRequestUrl).toHaveBeenCalledTimes(1);
  });

  it('should use max_tokens for older models', async () => {
    const gpt35Settings = {
      ...mockSettings,
      openaiModel: 'gpt-3.5-turbo'
    };

    // Mock Whisper transcription response (uses fetch)
    const whisperResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        text: 'Test transcription.'
      })
    };

    // Mock GPT-3.5 extras response (uses requestUrl)
    const gpt35Response = {
      status: 200,
      json: {
        choices: [{
          message: {
            content: `SUMMARY:
Test summary from GPT-3.5.`
          }
        }]
      }
    };

    mockFetch.mockResolvedValueOnce(whisperResponse as any);  // Whisper uses fetch
    mockRequestUrl.mockResolvedValueOnce(gpt35Response);      // GPT-3.5 uses requestUrl

    const result = await transcribeWithOpenAI(mockFile, gpt35Settings, mockApp);

    expect(result.transcription).toBe('Test transcription.');
    expect(result.summary).toBe('Test summary from GPT-3.5.');

    // Verify GPT-3.5 uses max_tokens (not max_completion_tokens)
    const [gpt35Options] = mockRequestUrl.mock.calls[0];
    const body = JSON.parse(gpt35Options.body);
    expect(body.model).toBe('gpt-3.5-turbo');
    expect(body.max_tokens).toBe(350); // Older models use max_tokens
    expect(body.max_completion_tokens).toBeUndefined();
    expect(body.temperature).toBe(0.1); // Older models support custom temperature
  });

});