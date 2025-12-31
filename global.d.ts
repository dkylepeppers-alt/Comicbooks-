
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

interface Window {
  aistudio?: AIStudio;
}

// Ensure process.env.API_KEY is recognized if using Vite/Webpack define plugin
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY?: string;
  }
}
