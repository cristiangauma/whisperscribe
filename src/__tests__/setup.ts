// Test setup file
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Add Node.js globals to jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add btoa/atob for base64 operations
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

// Global test utilities
beforeEach(() => {
  // Clear any notices from previous tests
  (global as any).__notices = [];
  
  // Reset all mocks
  jest.clearAllMocks();
});

// Helper to get notices from tests
(global as any).getNotices = () => (global as any).__notices || [];

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock FormData
global.FormData = class FormData {
  private data: Map<string, any> = new Map();
  
  append(key: string, value: any) {
    this.data.set(key, value);
  }
  
  get(key: string) {
    return this.data.get(key);
  }
} as any;

// Mock Blob
global.Blob = class Blob {
  constructor(public parts: any[], public options?: any) {}
} as any;

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  
  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      this.result = 'data:audio/mp3;base64,mock';
      if (this.onload) {
        this.onload({ target: { result: this.result } } as any);
      }
    }, 0);
  }
  
  onload: ((event: any) => void) | null = null;
} as any;