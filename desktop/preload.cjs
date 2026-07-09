const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("poAgentDesktop", {
  selectProjectDirectory: () => ipcRenderer.invoke("project:select-directory"),
});
