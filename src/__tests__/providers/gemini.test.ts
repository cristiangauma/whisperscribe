import { transcribeWithGemini } from '../../providers/gemini';
import { TFile } from 'obsidian';
import { AITranscriptionSettings } from '../../types';

// Mock requestUrl from obsidian
jest.mock('obsidian', () => ({
  ...jest.requireActual('obsidian'),
  requestUrl: jest.fn()
}));

import { requestUrl } from 'obsidian';
const mockRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

// Mock app
const mockApp = {
  vault: {
    readBinary: jest.fn()
  }
};

describe('transcribeWithGemini', () => {
  const mockSettings: AITranscriptionSettings = {
    provider: 'google',
    apiKey: 'test-api-key',
    modelName: 'gemini-1.5-flash',
    openaiApiKey: '',
    openaiModel: '',
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

  it('should successfully transcribe with complete response', async () => {
    const mockResponse = {
      status: 200,
      text: JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: `TRANSCRIPTION:
This is the transcribed audio content.

SUMMARY:
A brief summary of the audio.

TAGS:
technology, ai, speech-recognition

DIAGRAM:
graph TD
  A[Audio] --> B[AI Model]
  B --> C[Transcription]`
            }]
          }
        }]
      })
    };

    mockRequestUrl.mockResolvedValueOnce(mockResponse);

    const result = await transcribeWithGemini(mockFile, mockSettings, mockApp);

    expect(result.transcription).toBe('This is the transcribed audio content.');
    expect(result.summary).toBe('A brief summary of the audio.');
    expect(result.tags).toEqual(['technology', 'ai', 'speech-recognition']);
    expect(result.diagram).toContain('graph TD');

    // Verify API call was made correctly
    expect(mockRequestUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('generativelanguage.googleapis.com'),
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('inline_data')
      })
    );
  });

  it('should handle response with only transcription', async () => {
    const mockResponse = {
      status: 200,
      text: JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: 'TRANSCRIPTION:\nJust the transcription text.'
            }]
          }
        }]
      })
    };

    mockRequestUrl.mockResolvedValueOnce(mockResponse);

    const result = await transcribeWithGemini(mockFile, mockSettings, mockApp);

    expect(result.transcription).toBe('Just the transcription text.');
    expect(result.summary).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.diagram).toBeUndefined();
  });

  it('should handle API error responses', async () => {
    const mockResponse = {
      status: 400,
      text: JSON.stringify({ error: { message: 'Bad Request' } })
    };

    mockRequestUrl.mockResolvedValueOnce(mockResponse);

    await expect(transcribeWithGemini(mockFile, mockSettings, mockApp))
      .rejects.toThrow('Gemini API error (400): Bad Request');
  });

  it('should handle network errors', async () => {
    mockRequestUrl.mockRejectedValueOnce(new Error('Network error'));

    await expect(transcribeWithGemini(mockFile, mockSettings, mockApp))
      .rejects.toThrow('Network error: Network error');
  });

  it('should handle malformed API response', async () => {
    const mockResponse = {
      status: 200,
      text: JSON.stringify({
        candidates: []
      })
    };

    mockRequestUrl.mockResolvedValueOnce(mockResponse);

    await expect(transcribeWithGemini(mockFile, mockSettings, mockApp))
      .rejects.toThrow('No transcription received from Gemini');
  });

  it('should use correct API endpoint and parameters', async () => {
    const mockResponse = {
      status: 200,
      text: JSON.stringify({
        candidates: [{
          content: {
            parts: [{ text: 'TRANSCRIPTION:\nTest transcription' }]
          }
        }]
      })
    };

    mockRequestUrl.mockResolvedValueOnce(mockResponse);

    await transcribeWithGemini(mockFile, mockSettings, mockApp);

    const requestCall = mockRequestUrl.mock.calls[0][0];

    expect(requestCall.url).toContain('generativelanguage.googleapis.com');
    expect(requestCall.url).toContain('gemini-1.5-flash');
    expect(requestCall.url).toContain('test-api-key');

    const body = JSON.parse(requestCall.body);
    expect(body.contents[0].parts[1]).toHaveProperty('inline_data');
    expect(body.contents[0].parts[1].inline_data).toHaveProperty('mime_type');
    expect(body.contents[0].parts[1].inline_data).toHaveProperty('data');
  });

  it('should handle different file formats correctly', async () => {
    const formats = [
      { file: new TFile('test.mp3', 'mp3'), expectedMime: 'audio/mpeg' },
      { file: new TFile('test.wav', 'wav'), expectedMime: 'audio/wav' },
      { file: new TFile('test.ogg', 'ogg'), expectedMime: 'audio/ogg' }
    ];

    const mockResponse = {
      status: 200,
      text: JSON.stringify({
        candidates: [{
          content: {
            parts: [{ text: 'TRANSCRIPTION:\nTest' }]
          }
        }]
      })
    };

    for (const format of formats) {
      mockRequestUrl.mockResolvedValueOnce(mockResponse);
      
      await transcribeWithGemini(format.file, mockSettings, mockApp);
      
      const body = JSON.parse(mockRequestUrl.mock.calls[mockRequestUrl.mock.calls.length - 1][0].body);
      expect(body.contents[0].parts[1].inline_data.mime_type).toBe(format.expectedMime);
    }
  });

  it('should include correct prompt based on settings', async () => {
    const settingsNoExtras = {
      ...mockSettings,
      includeSummary: false,
      proposeTags: false,
      generateDiagram: false
    };

    const mockResponse = {
      status: 200,
      text: JSON.stringify({
        candidates: [{
          content: {
            parts: [{ text: 'TRANSCRIPTION:\nTest' }]
          }
        }]
      })
    };

    mockRequestUrl.mockResolvedValueOnce(mockResponse);

    await transcribeWithGemini(mockFile, settingsNoExtras, mockApp);

    const body = JSON.parse(mockRequestUrl.mock.calls[0][0].body);
    const prompt = body.contents[0].parts[0].text;

    // When no advanced features are enabled, the prompt asks for raw transcription only
    expect(prompt).toContain('Transcribe this audio completely and accurately');
    expect(prompt).toContain('Output ONLY the raw transcription text');
    expect(prompt).not.toContain('SUMMARY:');
    expect(prompt).not.toContain('TAGS:');
    expect(prompt).not.toContain('DIAGRAM:');
  });
});