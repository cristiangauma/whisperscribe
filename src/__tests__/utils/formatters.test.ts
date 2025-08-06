import { formatTagsAsObsidianTags, arrayBufferToBase64, getMimeType } from '../../utils/formatters';

describe('formatters', () => {
  describe('formatTagsAsObsidianTags', () => {
    it('should format tags as array without # prefix', () => {
      const tags = ['technology', 'ai', 'machine-learning'];
      expect(formatTagsAsObsidianTags(tags)).toEqual(['technology', 'ai', 'machine-learning']);
    });

    it('should handle empty array', () => {
      expect(formatTagsAsObsidianTags([])).toEqual([]);
    });

    it('should handle tags with spaces by replacing with hyphens', () => {
      const tags = ['artificial intelligence', 'deep learning', 'neural networks'];
      expect(formatTagsAsObsidianTags(tags)).toEqual(['artificial-intelligence', 'deep-learning', 'neural-networks']);
    });

    it('should handle tags with special characters', () => {
      const tags = ['C++', 'Node.js', 'React/Vue'];
      const result = formatTagsAsObsidianTags(tags);
      expect(result).toEqual(['c', 'nodejs', 'react/vue']);
    });

    it('should preserve Unicode characters including accented letters', () => {
      const tags = ['transcripción', 'español', 'català', 'français', 'português'];
      const result = formatTagsAsObsidianTags(tags);
      expect(result).toEqual(['transcripción', 'español', 'català', 'français', 'português']);
    });

    it('should handle Spanish tags with tildes and accents', () => {
      const tags = ['España', 'niño', 'corazón', 'música', 'más'];
      const result = formatTagsAsObsidianTags(tags);
      expect(result).toEqual(['españa', 'niño', 'corazón', 'música', 'más']);
    });

    it('should handle Catalan tags with accents and special characters', () => {
      const tags = ['català', 'òbvia', 'què', 'això', 'número'];
      const result = formatTagsAsObsidianTags(tags);
      expect(result).toEqual(['català', 'òbvia', 'què', 'això', 'número']);
    });

    it('should handle mixed languages with diacritical marks', () => {
      const tags = ['café', 'naïve', 'résumé', 'jalapeño', 'piñata', 'açúcar'];
      const result = formatTagsAsObsidianTags(tags);
      expect(result).toEqual(['café', 'naïve', 'résumé', 'jalapeño', 'piñata', 'açúcar']);
    });

    it('should handle tags with both accents and problematic punctuation', () => {
      const tags = ['música.mp3', 'café & té', 'español (spain)', 'português@brasil'];
      const result = formatTagsAsObsidianTags(tags);
      expect(result).toEqual(['músicamp3', 'café-té', 'español-spain', 'portuguêsbrasil']);
    });

    it('should handle emojis and other Unicode symbols', () => {
      const tags = ['música🎵', 'café☕', 'español→english'];
      const result = formatTagsAsObsidianTags(tags);
      expect(result).toEqual(['música🎵', 'café☕', 'español→english']);
    });

    it('should trim whitespace from tags', () => {
      const tags = [' technology ', '  ai  ', 'machine-learning  '];
      expect(formatTagsAsObsidianTags(tags)).toEqual(['technology', 'ai', 'machine-learning']);
    });
  });

  describe('arrayBufferToBase64', () => {
    it('should convert ArrayBuffer to base64 string', () => {
      const text = 'Hello, World!';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text).buffer;
      
      const base64 = arrayBufferToBase64(buffer);
      expect(base64).toBe('SGVsbG8sIFdvcmxkIQ==');
    });

    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      expect(arrayBufferToBase64(buffer)).toBe('');
    });

    it('should handle binary data correctly', () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 0xFF;
      view[1] = 0xFE;
      view[2] = 0xFD;
      view[3] = 0xFC;
      
      const base64 = arrayBufferToBase64(buffer);
      expect(base64).toBe('//79/A==');
    });

    it('should handle large buffers without error', () => {
      const largeBuffer = new ArrayBuffer(1024 * 1024); // 1MB
      const view = new Uint8Array(largeBuffer);
      for (let i = 0; i < view.length; i++) {
        view[i] = i % 256;
      }
      
      expect(() => arrayBufferToBase64(largeBuffer)).not.toThrow();
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME types for audio formats', () => {
      expect(getMimeType('mp3')).toBe('audio/mpeg');
      expect(getMimeType('wav')).toBe('audio/wav');
      expect(getMimeType('ogg')).toBe('audio/ogg');
      expect(getMimeType('m4a')).toBe('audio/mp4');
    });


    it('should handle case insensitive extensions', () => {
      expect(getMimeType('MP3')).toBe('audio/mpeg');
      expect(getMimeType('WAV')).toBe('audio/wav');
      expect(getMimeType('OGG')).toBe('audio/ogg');
    });

    it('should return application/octet-stream for unknown extensions', () => {
      expect(getMimeType('xyz')).toBe('application/octet-stream');
      expect(getMimeType('unknown')).toBe('application/octet-stream');
      expect(getMimeType('')).toBe('application/octet-stream');
    });
  });
});