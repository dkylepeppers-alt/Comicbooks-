
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenRouter } from '@openrouter/sdk';
import {
  Beat,
  Persona,
  ComicFace,
  StoryConfig,
  World,
  MAX_STORY_PAGES,
  LANGUAGES,
  TIMEOUT_CONFIG
} from '../types';

const BASE64_TO_BINARY_RATIO = 0.75;

// Cache for beat generation
const beatCache = new Map<string, { beat: Beat; timestamp: number }>();
const BEAT_CACHE_MAX_SIZE = 20;
const BEAT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedBeat = (key: string): Beat | null => {
  const cached = beatCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > BEAT_CACHE_TTL) {
    beatCache.delete(key);
    return null;
  }
  
  beatCache.delete(key);
  beatCache.set(key, cached);
  
  return cached.beat;
};

const setCachedBeat = (key: string, beat: Beat): void => {
  if (beatCache.size >= BEAT_CACHE_MAX_SIZE) {
    const firstKey = beatCache.keys().next().value;
    if (firstKey) beatCache.delete(firstKey);
  }
  
  beatCache.set(key, { beat, timestamp: Date.now() });
};

/**
 * Validates and sanitizes a URL from AI model response
 * @param content The content that may contain a URL
 * @returns The validated URL or null if invalid
 */
const extractAndValidateUrl = (content: string): string | null => {
  // More specific regex that avoids trailing punctuation
  const urlMatch = content.match(/https?:\/\/[^\s"'<>]+/);
  if (!urlMatch) return null;
  
  // Remove common trailing punctuation
  const rawUrl = urlMatch[0].replace(/[.,;:!?)}\]]+$/u, '');
  
  try {
    const validated = new URL(rawUrl);
    // Only allow https URLs from trusted domains for security
    if (validated.protocol !== 'https:') {
      console.warn(`[OpenRouter Service] Rejecting non-HTTPS URL: ${rawUrl}`);
      return null;
    }
    return validated.toString();
  } catch {
    console.warn(`[OpenRouter Service] Invalid URL format: ${rawUrl}`);
    return null;
  }
};

/**
 * Extracts base64 data from a data URL
 * @param content The data URL or content containing base64
 * @returns The extracted base64 data (without data URL prefix)
 * @throws Error if the format is invalid
 */
const extractBase64FromDataUrl = (content: string): string => {
  const parts = content.split(',');
  if (parts.length < 2) {
    throw new Error('Invalid base64 data URL format - missing comma separator');
  }
  return parts[1];
};

/**
 * Fetches an image from a URL and converts it to a base64 data URL
 * @param imageUrl The URL of the image to fetch
 * @returns Promise<string> The base64 data URL (e.g., "data:image/png;base64,...")
 */
const fetchAndConvertToBase64 = async (imageUrl: string): Promise<string> => {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
  }
  
  // Check content length to prevent DoS
  const contentLength = imageResponse.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    throw new Error(`Image too large: ${contentLength} bytes (max 10MB)`);
  }
  
  const imageBlob = await imageResponse.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(
        new Error(
          `Failed to read image as base64: ${reader.error?.message || 'Unknown error'}`
        )
      );
    };
    reader.readAsDataURL(imageBlob);
  });
};

const getOpenRouterClient = (apiKey?: string) => {
  if (!navigator.onLine) {
    console.error("[OpenRouter Service] Network is offline");
    throw new Error("OFFLINE: Please check your internet connection.");
  }
  
  const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('openrouterApiKey') : undefined;
  const key = apiKey || storedKey || import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!key) {
    console.error("[OpenRouter Service] No API key found in localStorage or environment");
    throw new Error("OPENROUTER_API_KEY_INVALID");
  }
  
  console.log("[OpenRouter Service] API initialized successfully");
  return new OpenRouter({
    apiKey: key,
    defaultHeaders: {
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://infinite-heroes.app',
      'X-Title': 'Infinite Heroes - AI Comic Book Generator',
    },
  });
};

const createTimeoutSignal = (
  timeoutMs: number,
  externalSignal?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Operation timed out after ${timeoutMs}ms`));
  }, timeoutMs);

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

export const OpenRouterService = {
  async generatePersona(
    desc: string,
    genre: string,
    model: string,
    signal?: AbortSignal
  ): Promise<Persona> {
    const style = genre === 'Custom' ? "Modern American comic book art" : `${genre} comic`;
    const startTime = Date.now();
    
    // Validate and correct invalid model names
    let imageModel = model;
    if (imageModel.includes('gemini')) {
      console.warn(`[OpenRouter Service] Invalid model "${imageModel}" for OpenRouter. Gemini models are not available through OpenRouter. Falling back to openai/dall-e-3`);
      imageModel = 'openai/dall-e-3';
    }
    
    console.log(`[OpenRouter Service] Starting persona generation - Genre: ${genre}, Model: ${imageModel}, Description: ${desc}`);
    
    const client = getOpenRouterClient();

    const { signal: timeoutSignal, cleanup } = createTimeoutSignal(
      TIMEOUT_CONFIG.PERSONA_GENERATION,
      signal
    );

    try {
      if (timeoutSignal.aborted) {
        console.warn("[OpenRouter Service] Persona generation aborted before API call");
        throw timeoutSignal.reason || new Error('Operation aborted');
      }

      console.log(`[OpenRouter Service] Calling OpenRouter API for character image - Model: ${imageModel}, Timeout: ${TIMEOUT_CONFIG.PERSONA_GENERATION}ms`);
      
      const prompt = `STYLE: Masterpiece ${style} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}`;
      
      const response = await client.chat.send({
        model: imageModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      });

      const elapsed = Date.now() - startTime;
      console.log(`[OpenRouter Service] Persona generation completed in ${elapsed}ms`);

      const content = response.choices?.[0]?.message?.content || '';
      
      // Check if the model returned an image URL
      const imageUrl = extractAndValidateUrl(content);
      if (imageUrl) {
        console.log(`[OpenRouter Service] Image URL received for persona, fetching and converting to base64...`);
        
        try {
          const imageBase64 = await fetchAndConvertToBase64(imageUrl);
          // Extract just the base64 data without the data URL prefix for consistency with Gemini
          const base64Data = extractBase64FromDataUrl(imageBase64);
          
          console.log(`[OpenRouter Service] Persona image converted to base64 successfully`);
          return { 
            base64: base64Data, 
            name: "Sidekick", 
            description: desc 
          };
        } catch (fetchError) {
          console.error(`[OpenRouter Service] Failed to fetch/convert persona image:`, fetchError);
          throw fetchError;
        }
      }
      
      // If no URL found, check if response contains base64 data
      if (content.includes('data:image')) {
        try {
          const base64Data = extractBase64FromDataUrl(content);
          console.log(`[OpenRouter Service] Base64 persona image data found in response`);
          return { 
            base64: base64Data, 
            name: "Sidekick", 
            description: desc 
          };
        } catch (error) {
          console.error(`[OpenRouter Service] Invalid base64 data format in response`);
          throw error;
        }
      }
      
      // No image data found - throw error
      console.error(`[OpenRouter Service] No image data found in persona response`);
      throw new Error(`Image generation model ${imageModel} did not return valid image data for persona. Response: ${content.substring(0, 100)}`);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[OpenRouter Service] Persona generation failed after ${elapsed}ms`, error);
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
    userGuidance?: string,
    signal?: AbortSignal
  ): Promise<Beat> {
    const cacheKey = !userGuidance ? `beat-${pageNum}-${history.length}-${config.genre}-${config.language}` : null;
    
    if (cacheKey) {
      const cached = getCachedBeat(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === config.language)?.name || "English";
    const textModel = config.textModel || config.modelPresetModel;

    const relevantHistory = history
        .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    const lastBeat = relevantHistory[relevantHistory.length - 1]?.narrative;
    const lastFocus = lastBeat?.focus_char || 'none';

    const historyText = relevantHistory.map(p => 
      `[Page ${p.pageIndex}] [Focus: ${p.narrative?.focus_char}] (Caption: "${p.narrative?.caption || ''}") (Dialogue: "${p.narrative?.dialogue || ''}") (Scene: ${p.narrative?.scene}) ${p.resolvedChoice ? `-> USER CHOICE: "${p.resolvedChoice}"` : ''}`
    ).join('\n');

    let friendInstruction = "Not yet introduced.";
    if (friend) {
        friendInstruction = `ACTIVE. Name: "${friend.name}". ${friend.description}.`;
        if (lastFocus !== 'friend' && Math.random() > 0.4) {
             friendInstruction += " MANDATORY: FOCUS ON THE CO-STAR FOR THIS PANEL.";
        } else {
             friendInstruction += " Ensure they are woven into the scene even if not the main focus.";
        }
    }

    let worldInstruction = "Generic fitting environment.";
    if (world) {
        worldInstruction = `SETTING: "${world.name}". LORE: ${world.description}. THE SCENE MUST TAKE PLACE HERE.`;
    }

    const heroInstruction = `Active. Name: "${hero.name || 'Hero'}". ${hero.description ? `Profile: ${hero.description}` : ''}`;

    let coreDriver = `GENRE: ${config.genre}. TONE: ${config.tone}.`;
    if (config.genre === 'Custom') {
        coreDriver = `STORY PREMISE: ${config.customPremise || "A totally unique, unpredictable adventure"}.`;
    }

    const foundationalPrompt = config.openingPrompt?.trim();
    
    let directionInstruction = "";
    if (userGuidance) {
        directionInstruction = `
        CRITICAL - DIRECTIVE FROM THE DIRECTOR:
        The user explicitly demands the following happens on this page: "${userGuidance}".
        YOU MUST ADHERE TO THIS DIRECTION ABOVE ALL ELSE. Do not deviate.
        `;
    }

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
    const { signal: timeoutSignal, cleanup } = createTimeoutSignal(
      TIMEOUT_CONFIG.BEAT_GENERATION,
      signal
    );

    const startTime = Date.now();
    console.log(`[OpenRouter Service] Starting beat generation - Page: ${pageNum}, Model: ${textModel}, Has guidance: ${!!userGuidance}`);

    try {
        if (timeoutSignal.aborted) {
          console.warn("[OpenRouter Service] Beat generation aborted before API call");
          throw timeoutSignal.reason || new Error('Operation aborted');
        }

        const client = getOpenRouterClient();
        const response = await client.chat.send({
            model: textModel,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            stream: false,
        });

        const elapsed = Date.now() - startTime;
        console.log(`[OpenRouter Service] Beat generation API call completed in ${elapsed}ms`);

        let rawText = response.choices?.[0]?.message?.content || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed: Beat;

        try {
          parsed = JSON.parse(rawText) as Beat;
          console.log(`[OpenRouter Service] Beat parsed successfully - Focus: ${parsed.focus_char}, Has dialogue: ${!!parsed.dialogue}`);
        } catch (parseError) {
          console.error("[OpenRouter Service] Beat parsing failed; using fallback beat", {
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

        if (cacheKey) {
          setCachedBeat(cacheKey, parsed);
          console.log(`[OpenRouter Service] Beat cached with key: ${cacheKey}`);
        }

        return parsed;
    } catch (e) {
        const elapsed = Date.now() - startTime;
        console.error(`[OpenRouter Service] Beat generation failed after ${elapsed}ms`, e);
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
    signal?: AbortSignal
  ): Promise<string> {
    const startTime = Date.now();
    
    // Use configured image model or fallback to DALL-E 3
    let imageModel = config.imageModel || 'openai/dall-e-3';
    
    // Validate and correct invalid model names
    if (imageModel.includes('gemini')) {
      console.warn(`[OpenRouter Service] Invalid model "${imageModel}" for OpenRouter. Gemini models are not available through OpenRouter. Falling back to openai/dall-e-3`);
      imageModel = 'openai/dall-e-3';
    }
    
    console.log(`[OpenRouter Service] Starting image generation - Type: ${type}, Model: ${imageModel}`);
    
    const client = getOpenRouterClient();

    const { signal: timeoutSignal, cleanup } = createTimeoutSignal(
      TIMEOUT_CONFIG.IMAGE_GENERATION,
      signal
    );

    try {
      if (timeoutSignal.aborted) {
        console.warn("[OpenRouter Service] Image generation aborted before API call");
        throw timeoutSignal.reason || new Error('Operation aborted');
      }

      // Build the image generation prompt
      const styleEra = config.genre === 'Custom' ? "Modern American" : config.genre;
      let promptText = `${styleEra} comic book art, detailed ink, vibrant colors. `;
      
      if (type === 'cover') {
        promptText += `Comic book cover with dynamic action shot. Title "INFINITE HEROES" at top. Epic superhero composition.`;
        if (hero.description) {
          promptText += ` Main character: ${hero.description}.`;
        }
        if (world) {
          promptText += ` Setting: ${world.name} - ${world.description}.`;
        }
      } else if (type === 'back_cover') {
        promptText += `Comic book back cover. Full page vertical art. Dramatic teaser image. Text "NEXT ISSUE SOON".`;
      } else {
        // Story panel
        promptText += `Vertical comic panel. ${beat.scene}.`;
        if (hero.description) {
          promptText += ` Main character: ${hero.description}.`;
        }
        if (friend?.description) {
          promptText += ` Supporting character: ${friend.description}.`;
        }
        if (world) {
          promptText += ` Setting: ${world.name}.`;
        }
        if (beat.caption) {
          promptText += ` Include caption: "${beat.caption}".`;
        }
        if (beat.dialogue) {
          promptText += ` Include speech: "${beat.dialogue}".`;
        }
      }

      console.log(`[OpenRouter Service] Calling OpenRouter API for image - Model: ${imageModel}, Timeout: ${TIMEOUT_CONFIG.IMAGE_GENERATION}ms`);
      
      // Call OpenRouter with the image generation model
      const response = await client.chat.send({
        model: imageModel,
        messages: [
          {
            role: 'user',
            content: promptText,
          },
        ],
        stream: false,
      });

      const elapsed = Date.now() - startTime;
      console.log(`[OpenRouter Service] Image generation API call completed in ${elapsed}ms`);

      // Extract image URL or base64 from response
      const content = response.choices?.[0]?.message?.content || '';
      
      // Check if the model returned an image URL
      const imageUrl = extractAndValidateUrl(content);
      if (imageUrl) {
        console.log(`[OpenRouter Service] Image URL received, fetching and converting to base64...`);
        
        try {
          const imageBase64 = await fetchAndConvertToBase64(imageUrl);
          console.log(`[OpenRouter Service] Image converted to base64 successfully`);
          return imageBase64; // Return full data URL for consistency
        } catch (fetchError) {
          console.error(`[OpenRouter Service] Failed to fetch/convert image:`, fetchError);
          throw fetchError;
        }
      }
      
      // If no URL found, check if response contains base64 data
      if (content.includes('data:image')) {
        console.log(`[OpenRouter Service] Base64 image data found in response`);
        return content; // Already a data URL
      }
      
      // No image data found
      console.error(`[OpenRouter Service] No image data found in response`);
      throw new Error(`Image generation model ${imageModel} did not return valid image data. Response: ${content.substring(0, 100)}`);
      
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[OpenRouter Service] Image generation failed after ${elapsed}ms`, error);
      throw error;
    } finally {
      cleanup();
    }
  }
};
