import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content: string, defaultName: string) => ipcRenderer.invoke('save-file', content, defaultName),
  openFile: () => ipcRenderer.invoke('open-file'),
})
