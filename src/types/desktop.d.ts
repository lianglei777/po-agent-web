export {};

declare global {
  interface Window {
    poAgentDesktop?: {
      selectProjectDirectory: () => Promise<string | null>;
    };
  }
}
