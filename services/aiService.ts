
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from '@google/genai';
import {
  Beat,
  Persona,
  ComicFace,
  StoryConfig,
  World,
  MAX_STORY_PAGES,
  LANGUAGES,
  TIMEOUT_CONFIG,
  AIProvider
} from '../types';
import { retryWithBackoff } from '../utils/performanceUtils';
import { OpenRouterService } from './openRouterService';

const MODEL_IMAGE_GEN_NAME = "gemini-3-pro-image-preview";
const MODEL_TEXT_NAME = "gemini-3-flash-preview";

// Base64 encoding adds ~33% overhead (4 bytes for every 3 bytes of data)
// So to estimate binary size from base64: multiply by 0.75 (or 3/4)
const BASE64_TO_BINARY_RATIO = 0.75;

// True LRU cache for beat generation to avoid regenerating same content
const beatCache = new Map<string, { beat: Beat; timestamp: number }>();
const BEAT_CACHE_MAX_SIZE = 20;
const BEAT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedBeat = (key: string): Beat | null => {
  const cached = beatCache.get(key);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > BEAT_CACHE_TTL) {
    beatCache.delete(key);
    return null;
  }
  
  // Move to end for LRU (re-insert)
  beatCache.delete(key);
  beatCache.set(key, cached);
  
  return cached.beat;
};

const setCachedBeat = (key: string, beat: Beat): void => {
  // True LRU: if at max capacity, remove least recently used (first entry) before adding
  if (beatCache.size >= BEAT_CACHE_MAX_SIZE) {
    const firstKey = beatCache.keys().next().value;
    if (firstKey) beatCache.delete(firstKey);
  }
  
  // Add new entry at the end (most recently used)
  beatCache.set(key, { beat, timestamp: Date.now() });
};

const getAI = () => {
  if (!navigator.onLine) {
    console.error("[AI Service] Network is offline");
    throw new Error("OFFLINE: Please check your internet connection.");
  }
  const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('userApiKey') : undefined;
  const apiKey = storedKey || process.env.API_KEY;

  if (!apiKey) {
    console.error("[AI Service] No API key found in localStorage or environment");
    throw new Error("API_KEY_INVALID");
  }
  
  console.log("[AI Service] API initialized successfully");
  return new GoogleGenAI({ apiKey });
};

/**
 * Creates an AbortSignal with a timeout. Combines manual abort control with automatic timeout.
 * @param timeoutMs - Timeout in milliseconds
 * @param externalSignal - Optional external AbortSignal to combine with timeout
 * @returns Object containing the signal and cleanup function
 */
const createTimeoutSignal = (
  timeoutMs: number,
  externalSignal?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Operation timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  // If external signal is provided, forward its abort
  const abortHandler = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', abortHandler);
    }
  }

  const cleanup = () => {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', abortHandler);
    }
  };

  return { signal: controller.signal, cleanup };
};

export const AiService = {
  async generatePersona(
    desc: string,
    genre: string,
    signal?: AbortSignal,
    provider: AIProvider = 'gemini',
    imageModel?: string
  ): Promise<Persona> {
    // Route to appropriate provider
    if (provider === 'openrouter') {
      const model = imageModel || 'openai/gpt-4-turbo-preview';
      return OpenRouterService.generatePersona(desc, genre, model, signal);
    }

    // Default to Gemini
    const style = genre === 'Custom' ? "Modern American comic book art" : `${genre} comic`;
    const startTime = Date.now();
    
    console.log(`[AI Service] Starting persona generation - Genre: ${genre}, Description: ${desc}`);
    
    const ai = getAI();

    // Create timeout signal
    const { signal: timeoutSignal, cleanup } = createTimeoutSignal(
      TIMEOUT_CONFIG.PERSONA_GENERATION,
      signal
    );

    try {
      // Check if already aborted
      if (timeoutSignal.aborted) {
        console.warn("[AI Service] Persona generation aborted before API call");
        throw timeoutSignal.reason || new Error('Operation aborted');
      }

      console.log(`[AI Service] Calling Gemini API - Model: ${MODEL_IMAGE_GEN_NAME}, Timeout: ${TIMEOUT_CONFIG.PERSONA_GENERATION}ms`);
      
      const res = await ai.models.generateContent({
        model: MODEL_IMAGE_GEN_NAME,
        contents: { text: `STYLE: Masterpiece ${style} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}` },
        config: { imageConfig: { aspectRatio: '1:1' } }
      });

      const elapsed = Date.now() - startTime;
      console.log(`[AI Service] Persona generation completed in ${elapsed}ms`);

      const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData?.data) {
        const sizeKB = Math.round(part.inlineData.data.length * BASE64_TO_BINARY_RATIO / 1024);
        console.log(`[AI Service] Persona image generated successfully - Size: ~${sizeKB}KB`);
        return { base64: part.inlineData.data, name: "Sidekick", description: desc };
      }
      
      console.error("[AI Service] No image data in API response", { candidates: res.candidates });
      throw new Error("Failed to generate persona image");
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[AI Service] Persona generation failed after ${elapsed}ms`, error);
      throw error;
    } finally {
      cleanup();
    }
  },

  async generateBeat(
    history: ComicFace[],
    pageNum: number,
    isDecisionPage: boolean,
    config: StoryConfig,
    hero: Persona,
    friend: Persona | null,
    world: World | null,
    userGuidance?: string, // Direct user control
    signal?: AbortSignal // AbortSignal for cancellation/timeout
  ): Promise<Beat> {
    // Route to appropriate provider
    if (config.aiProvider === 'openrouter') {
      return OpenRouterService.generateBeat(
        history,
        pageNum,
        isDecisionPage,
        config,
        hero,
        friend,
        world,
        userGuidance,
        signal
      );
    }

    // Default to Gemini
    // Create cache key from page number and history length
    // Only cache when no user guidance (deterministic generation)
    const cacheKey = !userGuidance ? `beat-${pageNum}-${history.length}-${config.genre}-${config.language}` : null;
    
    // Check cache first if no user guidance
    if (cacheKey) {
      const cached = getCachedBeat(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === config.language)?.name || "English";
    const textModel = config.modelPresetModel || MODEL_TEXT_NAME;

    // Get relevant history
    const relevantHistory = history
        .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    const lastBeat = relevantHistory[relevantHistory.length - 1]?.narrative;
    const lastFocus = lastBeat?.focus_char || 'none';

    const historyText = relevantHistory.map(p => 
      `[Page ${p.pageIndex}] [Focus: ${p.narrative?.focus_char}] (Caption: "${p.narrative?.caption || ''}") (Dialogue: "${p.narrative?.dialogue || ''}") (Scene: ${p.narrative?.scene}) ${p.resolvedChoice ? `-> USER CHOICE: "${p.resolvedChoice}"` : ''}`
    ).join('\n');

    // Aggressive Co-Star Injection Logic
    let friendInstruction = "Not yet introduced.";
    if (friend) {
        friendInstruction = `ACTIVE. Name: "${friend.name}". ${friend.description}.`;
        if (lastFocus !== 'friend' && Math.random() > 0.4) {
             friendInstruction += " MANDATORY: FOCUS ON THE CO-STAR FOR THIS PANEL.";
        } else {
             friendInstruction += " Ensure they are woven into the scene even if not the main focus.";
        }
    }

    // World Injection Logic
    let worldInstruction = "Generic fitting environment.";
    if (world) {
        worldInstruction = `SETTING: "${world.name}". LORE: ${world.description}. THE SCENE MUST TAKE PLACE HERE.`;
    }

    // Hero Definition
    const heroInstruction = `Active. Name: "${hero.name || 'Hero'}". ${hero.description ? `Profile: ${hero.description}` : ''}`;

    // Determine Core Story Driver
    let coreDriver = `GENRE: ${config.genre}. TONE: ${config.tone}.`;
    if (config.genre === 'Custom') {
        coreDriver = `STORY PREMISE: ${config.customPremise || "A totally unique, unpredictable adventure"}.`;
    }

    const foundationalPrompt = config.openingPrompt?.trim();
    
    // User Guidance - The most important input
    let directionInstruction = "";
    if (userGuidance) {
        directionInstruction = `
        CRITICAL - DIRECTIVE FROM THE DIRECTOR:
        The user explicitly demands the following happens on this page: "${userGuidance}".
        YOU MUST ADHERE TO THIS DIRECTION ABOVE ALL ELSE. Do not deviate.
        `;
    }

    // Base Instruction
    let instruction = `Continue the story. ALL OUTPUT TEXT (Captions, Dialogue, Choices) MUST BE IN ${langName.toUpperCase()}. ${coreDriver}`;
    if (foundationalPrompt) {
        instruction += ` HONOR THE ORIGINAL STORY REQUEST: ${foundationalPrompt}.`;
    }
    if (config.modelPresetPrompt) {
        instruction += ` PRESET GUIDANCE: ${config.modelPresetPrompt}`;
    }
    if (config.richMode) {
        instruction += " RICH/NOVEL MODE ENABLED. Prioritize deeper character thoughts, descriptive captions, and meaningful dialogue exchanges over short punchlines.";
    }

    if (isFinalPage) {
        instruction += " FINAL PAGE. KARMIC CLIFFHANGER REQUIRED. Text must end with 'TO BE CONTINUED...' (or localized equivalent).";
    } else if (isDecisionPage) {
        instruction += " End with a PSYCHOLOGICAL choice about VALUES, RELATIONSHIPS, or RISK. (e.g., Truth vs. Safety, Forgive vs. Avenge). The options must NOT be simple physical actions like 'Go Left'.";
    } else {
        if (pageNum === 1) {
            instruction += " INCITING INCIDENT. An event disrupts the status quo. Establish the genre's intended mood.";
        }
    }

    const capLimit = config.richMode ? "max 35 words. Detailed narration" : "max 15 words";
    const diaLimit = config.richMode ? "max 30 words. Rich, character-driven" : "max 12 words";

    const prompt = `
You are writing a comic book script. PAGE ${pageNum} of ${MAX_STORY_PAGES}.
TARGET LANGUAGE FOR TEXT: ${langName} (CRITICAL: CAPTIONS, DIALOGUE, CHOICES MUST BE IN THIS LANGUAGE).
${coreDriver}

CHARACTERS:
- HERO: ${heroInstruction}
- CO-STAR: ${friendInstruction}
- WORLD/SETTING: ${worldInstruction}

PREVIOUS PANELS (READ CAREFULLY):
${historyText.length > 0 ? historyText : "Start the adventure."}

${directionInstruction}

RULES:
1. NO REPETITION. Do not use the same captions or dialogue from previous pages.
2. IF CO-STAR IS ACTIVE, THEY MUST APPEAR FREQUENTLY.
3. LANGUAGE: All user-facing text MUST be in ${langName}.
4. Avoid saying "CO-star" and "hero" in the text captions. Use names if established.

INSTRUCTION: ${instruction}

OUTPUT STRICT JSON ONLY (No markdown formatting):
{
  "caption": "Unique narrator text in ${langName}. (${capLimit}).",
  "dialogue": "Unique speech in ${langName}. (${diaLimit}). Optional.",
  "scene": "Vivid visual description (ALWAYS IN ENGLISH for the artist model). MUST mention 'HERO' or 'CO-STAR' if they are present. Describe the background based on the WORLD SETTING.",
  "focus_char": "hero" OR "friend" OR "other",
  "choices": ["Option A in ${langName}", "Option B in ${langName}"] (Only if decision page)
}
`;
    // Create timeout signal
    const { signal: timeoutSignal, cleanup } = createTimeoutSignal(
      TIMEOUT_CONFIG.BEAT_GENERATION,
      signal
    );

    const startTime = Date.now();
    console.log(`[AI Service] Starting beat generation - Page: ${pageNum}, Model: ${textModel}, Has guidance: ${!!userGuidance}`);

    try {
        // Check if already aborted
        if (timeoutSignal.aborted) {
          console.warn("[AI Service] Beat generation aborted before API call");
          throw timeoutSignal.reason || new Error('Operation aborted');
        }

        const ai = getAI();
    const res = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const elapsed = Date.now() - startTime;
        console.log(`[AI Service] Beat generation API call completed in ${elapsed}ms`);

        let rawText = res.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed: Beat;

        try {
          parsed = JSON.parse(rawText) as Beat;
          console.log(`[AI Service] Beat parsed successfully - Focus: ${parsed.focus_char}, Has dialogue: ${!!parsed.dialogue}`);
        } catch (parseError) {
          // Note: we intentionally avoid logging rawText/story content here to protect user privacy.
          // Logging only the error object and minimal metadata (like length) is sufficient for debugging.
          console.error("[AI Service] Beat parsing failed; using fallback beat", {
            parseError,
            rawTextLength: rawText.length
          });
          parsed = {
            scene: "Unexpected twist to keep the story moving forward.",
            caption: "The story stumbles but keeps going…",
            dialogue: "We improvise when the script goes missing!",
            choices: isDecisionPage ? ["Push ahead", "Change course"] : [],
            focus_char: 'hero'
          };
        }

        if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = parsed.caption.replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!isDecisionPage) parsed.choices = [];
        if (isDecisionPage && !isFinalPage && (!parsed.choices || parsed.choices.length < 2)) parsed.choices = ["Option A", "Option B"];
        if (!['hero', 'friend', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';

        // Cache the result if applicable
        if (cacheKey) {
          setCachedBeat(cacheKey, parsed);
          console.log(`[AI Service] Beat cached with key: ${cacheKey}`);
        }

        return parsed;
    } catch (e) {
        const elapsed = Date.now() - startTime;
        console.error(`[AI Service] Beat generation failed after ${elapsed}ms`, e);
        throw e;
    } finally {
        cleanup();
    }
  },

  async generateImage(
    beat: Beat,
    type: ComicFace['type'],
    config: StoryConfig,
    hero: Persona,
    friend: Persona | null,
    world: World | null,
    signal?: AbortSignal // AbortSignal for cancellation/timeout
  ): Promise<string> {
    // Route to appropriate provider
    if (config.aiProvider === 'openrouter') {
      return OpenRouterService.generateImage(
        beat,
        type,
        config,
        hero,
        friend,
        world,
        signal
      );
    }

    // Default to Gemini
    const startTime = Date.now();
    
    return retryWithBackoff(
      async () => {
        const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        
        // 1. Hero References (multiple images if available)
        if (hero?.images && hero.images.length > 0) {
            // Use all available hero images for better character consistency
            hero.images.forEach((img, i) => {
                contents.push({ text: `REFERENCE [HERO ${i === 0 ? 'PRIMARY' : `ANGLE ${i}`}]:` });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
            });
        } else if (hero?.base64) {
            // Fallback for backward compatibility
            contents.push({ text: "REFERENCE [HERO]:" });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: hero.base64 } });
        }
        
        // 2. Co-Star References (multiple images if available)
        if (friend?.images && friend.images.length > 0) {
            // Use all available co-star images for better character consistency
            friend.images.forEach((img, i) => {
                contents.push({ text: `REFERENCE [CO-STAR ${i === 0 ? 'PRIMARY' : `ANGLE ${i}`}]:` });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
            });
        } else if (friend?.base64) {
            // Fallback for backward compatibility
            contents.push({ text: "REFERENCE [CO-STAR]:" });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: friend.base64 } });
        }
        
        // 3. World References (Max 3)
        if (world?.images && world.images.length > 0) {
            world.images.forEach((img, i) => {
                contents.push({ text: `REFERENCE [WORLD ENVIRONMENT ${i+1}]:` });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
            });
        }

        const styleEra = config.genre === 'Custom' ? "Modern American" : config.genre;
        let promptText = `STYLE: ${styleEra} comic book art, detailed ink, vibrant colors. `;
        
        if (type === 'cover') {
            const langName = LANGUAGES.find(l => l.code === config.language)?.name || "English";
            promptText += `TYPE: Comic Book Cover. TITLE: "INFINITE HEROES" (OR LOCALIZED TRANSLATION IN ${langName.toUpperCase()}). Main visual: Dynamic action shot of [HERO] (Use ALL REFERENCE [HERO] images to ensure character consistency).`;
            if (world) {
                promptText += ` BACKGROUND: Must match REFERENCE [WORLD ENVIRONMENT] strictly. Setting: ${world.name}.`;
            }
        } else if (type === 'back_cover') {
            promptText += `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser. Text: "NEXT ISSUE SOON".`;
        } else {
            promptText += `TYPE: Vertical comic panel. SCENE: ${beat.scene}. `;
            promptText += `INSTRUCTIONS: Maintain strict character likeness using ALL provided reference images. If scene mentions 'HERO', you MUST use ALL REFERENCE [HERO] images. If scene mentions 'CO-STAR' or 'SIDEKICK', you MUST use ALL REFERENCE [CO-STAR] images.`;
            if (world) {
                promptText += ` BACKGROUND: Must match REFERENCE [WORLD ENVIRONMENT] aesthetic. Setting: ${world.name}.`;
            }
            if (beat.caption) promptText += ` INCLUDE CAPTION BOX: "${beat.caption}"`;
            if (beat.dialogue) promptText += ` INCLUDE SPEECH BUBBLE: "${beat.dialogue}"`;
        }

        contents.push({ text: promptText });

        // Create timeout signal
        const { signal: timeoutSignal, cleanup } = createTimeoutSignal(
          TIMEOUT_CONFIG.IMAGE_GENERATION,
          signal
        );

        const refCount = contents.filter(c => c.inlineData).length;
        console.log(`[AI Service] Starting image generation - Type: ${type}, References: ${refCount}, Model: ${MODEL_IMAGE_GEN_NAME}`);

        try {
            // Check if already aborted
            if (timeoutSignal.aborted) {
              console.warn("[AI Service] Image generation aborted before API call");
              throw timeoutSignal.reason || new Error('Operation aborted');
            }

            const ai = getAI();
            const res = await ai.models.generateContent({
              model: MODEL_IMAGE_GEN_NAME,
              contents: contents,
              config: { imageConfig: { aspectRatio: '2:3' } }
            });
            
            const elapsed = Date.now() - startTime;
            console.log(`[AI Service] Image generation API call completed in ${elapsed}ms`);
            
            const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (part?.inlineData?.data) {
              const sizeKB = Math.round(part.inlineData.data.length * BASE64_TO_BINARY_RATIO / 1024);
              console.log(`[AI Service] Image generated successfully - Size: ~${sizeKB}KB`);
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            
            console.error("[AI Service] No image data in API response", { candidates: res.candidates });
            return '';
        } catch (e) {
            const elapsed = Date.now() - startTime;
            console.error(`[AI Service] Image generation failed after ${elapsed}ms`, e);
            throw e;
        } finally {
            cleanup();
        }
      },
      {
        maxRetries: 2,
        initialDelay: 2000,
        onRetry: (attempt, error) => {
          console.warn(`[AI Service] Image generation retry attempt ${attempt}:`, error.message);
        }
      }
    );
  }
};
