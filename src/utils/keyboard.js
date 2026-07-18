import globalModule from 'global';

let gmInstance = null;

export function getGlobalModule() {
  if (gmInstance) return gmInstance;
  if (globalModule && typeof globalModule.Global === 'function') {
    gmInstance = new globalModule.Global();
  }
  return gmInstance;
}

export function isKeyboardAvailable() {
  const gm = getGlobalModule();
  return !!(gm && typeof gm.startTextEdit === 'function');
}
