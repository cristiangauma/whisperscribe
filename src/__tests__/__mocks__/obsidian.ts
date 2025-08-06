// Mock implementation of Obsidian API for testing

export class TFile {
  path: string;
  name: string;
  extension: string;
  stat: { size: number; ctime: number; mtime: number };
  basename: string;
  vault: any;
  parent: any;

  constructor(path: string, extension: string, size: number = 1024) {
    this.path = path;
    this.extension = extension;
    this.name = path.split('/').pop() || '';
    this.basename = this.name.replace(`.${extension}`, '');
    this.stat = { size, ctime: Date.now(), mtime: Date.now() };
  }
}

export class Plugin {
  app: any;
  manifest: any;
  settings: any = {};

  constructor(app: any, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  loadData = jest.fn().mockResolvedValue({});
  saveData = jest.fn().mockResolvedValue(undefined);
  addCommand = jest.fn();
  addSettingTab = jest.fn();
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: HTMLElement = document.createElement('div');

  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }

  display = jest.fn();
  hide = jest.fn();
}

export class Setting {
  containerEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
    this.nameEl = document.createElement('div');
    this.descEl = document.createElement('div');
  }

  setName(name: string) {
    this.nameEl.textContent = name;
    return this;
  }

  setDesc(desc: string) {
    this.descEl.textContent = desc;
    return this;
  }

  addText(cb: (text: any) => void) {
    const mockText = {
      setPlaceholder: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis()
    };
    cb(mockText);
    return this;
  }

  addToggle(cb: (toggle: any) => void) {
    const mockToggle = {
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis(),
      setDisabled: jest.fn().mockReturnThis()
    };
    cb(mockToggle);
    return this;
  }

  addDropdown(cb: (dropdown: any) => void) {
    const mockDropdown = {
      addOption: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      onChange: jest.fn().mockReturnThis()
    };
    cb(mockDropdown);
    return this;
  }
}

export class Notice {
  message: string;
  
  constructor(message: string) {
    this.message = message;
    // In tests, we can track notices
    (global as any).__notices = (global as any).__notices || [];
    (global as any).__notices.push(message);
  }
}

export class Editor {
  getValue = jest.fn().mockReturnValue('');
  setValue = jest.fn();
  getLine = jest.fn().mockReturnValue('');
  getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
  replaceRange = jest.fn();
  getSelection = jest.fn().mockReturnValue('');
}

export class MarkdownView {
  file: TFile;
  editor: Editor;

  constructor(file: TFile) {
    this.file = file;
    this.editor = new Editor();
  }
}

export const requestUrl = jest.fn().mockImplementation(async (options: any) => {
  return {
    status: 200,
    headers: {},
    arrayBuffer: new ArrayBuffer(0),
    json: {},
    text: '{}',
  };
});

// Mock App with necessary properties
export class App {
  vault = {
    readBinary: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
    read: jest.fn().mockResolvedValue('file content'),
    modify: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue(new TFile('test.md', 'md'))
  };
  
  metadataCache = {
    getFirstLinkpathDest: jest.fn().mockReturnValue(new TFile('test.mp3', 'mp3', 1024 * 1024))
  };
  
  workspace = {
    getActiveViewOfType: jest.fn()
  };
}