export interface ElectronAPI {
  saveFile: (content: string, defaultName: string) => Promise<string | null>
  openFile: () => Promise<string | null>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
