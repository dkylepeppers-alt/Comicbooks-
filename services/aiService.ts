
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
  LANGUAGES 
} from '../types';

const MODEL_IMAGE_GEN_NAME = "gemini-3-pro-image-preview";
const MODEL_TEXT_NAME = "gemini-3-flash-preview";

const getAI = () => {
  if (!navigator.onLine) {
    throw new Error("OFFLINE: Please check your internet connection.");
  }
  if (!process.env.API_KEY) {
    throw new Error("API_KEY_INVALID");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const AiService = {
  async generatePersona(desc: string, genre: string): Promise<Persona> {
    const style = genre === 'Custom' ? "Modern American comic book art" : `${genre} comic`;
    const ai = getAI();
    
    const res = await ai.models.generateContent({
        model: MODEL_IMAGE_GEN_NAME,
        contents: { text: `STYLE: Masterpiece ${style} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}` },
        config: { imageConfig: { aspectRatio: '1:1' } }
    });
    
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return { base64: part.inlineData.data, name: "Sidekick", description: desc };
    }
    throw new Error("Failed to generate persona image");
  },

  async generateBeat(
    history: ComicFace[],
    pageNum: number,
    isDecisionPage: boolean,
    config: StoryConfig,
    hero: Persona,
    friend: Persona | null,
    world: World | null
  ): Promise<Beat> {
    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === config.language)?.name || "English";

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
        coreDriver = `STORY PREMISE: ${config.customPremise || "A totally unique, unpredictable adventure"}. (Follow this premise strictly over standard genre tropes).`;
    }
    
    // Guardrails
    const guardrails = `
    NEGATIVE CONSTRAINTS:
    1. UNLESS GENRE IS "Dark Sci-Fi" OR "Superhero Action" OR "Custom": DO NOT use technical jargon like "Quantum", "Timeline", "Portal", "Multiverse", or "Singularity".
    2. IF GENRE IS "Teen Drama" OR "Lighthearted Comedy": The "stakes" must be SOCIAL, EMOTIONAL, or PERSONAL. Do NOT make it life-or-death. Keep it grounded.
    3. Avoid "The artifact" or "The device" unless established earlier.
    `;

    // Base Instruction
    let instruction = `Continue the story. ALL OUTPUT TEXT (Captions, Dialogue, Choices) MUST BE IN ${langName.toUpperCase()}. ${coreDriver} ${guardrails}`;
    if (config.richMode) {
        instruction += " RICH/NOVEL MODE ENABLED. Prioritize deeper character thoughts, descriptive captions, and meaningful dialogue exchanges over short punchlines.";
    }

    if (isFinalPage) {
        instruction += " FINAL PAGE. KARMIC CLIFFHANGER REQUIRED. You MUST explicitly reference the User's choice from PAGE 3 in the narrative and show how that specific philosophy led to this conclusion. Text must end with 'TO BE CONTINUED...' (or localized equivalent).";
    } else if (isDecisionPage) {
        instruction += " End with a PSYCHOLOGICAL choice about VALUES, RELATIONSHIPS, or RISK. (e.g., Truth vs. Safety, Forgive vs. Avenge). The options must NOT be simple physical actions like 'Go Left'.";
    } else {
        if (pageNum === 1) {
            instruction += " INCITING INCIDENT. An event disrupts the status quo. Establish the genre's intended mood.";
        } else if (pageNum <= 4) {
            instruction += " RISING ACTION. The heroes engage with the new situation. Focus on dialogue, character dynamics, and initial challenges.";
        } else if (pageNum <= 8) {
            instruction += " COMPLICATION. A twist occurs! A secret is revealed, a misunderstanding deepens, or the path is blocked.";
        } else {
            instruction += " CLIMAX. The confrontation with the main conflict.";
        }
    }

    const capLimit = config.richMode ? "max 35 words. Detailed narration or internal monologue" : "max 15 words";
    const diaLimit = config.richMode ? "max 30 words. Rich, character-driven speech" : "max 12 words";

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

RULES:
1. NO REPETITION. Do not use the same captions or dialogue from previous pages.
2. IF CO-STAR IS ACTIVE, THEY MUST APPEAR FREQUENTLY.
3. VARIETY. If page ${pageNum-1} was an action shot, make this one a reaction or wide shot.
4. LANGUAGE: All user-facing text MUST be in ${langName}.
5. Avoid saying "CO-star" and "hero" in the text captions. Use names if established, or generic descriptors.

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
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ 
            model: MODEL_TEXT_NAME, 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        
        let rawText = res.text || "{}";
        // Clean markdown code blocks if present
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(rawText);
        
        // Sanitize output
        if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = parsed.caption.replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!isDecisionPage) parsed.choices = [];
        if (isDecisionPage && !isFinalPage && (!parsed.choices || parsed.choices.length < 2)) parsed.choices = ["Option A", "Option B"];
        if (!['hero', 'friend', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';

        return parsed as Beat;
    } catch (e) {
        console.error("Beat generation failed", e);
        throw e;
    }
  },

  async generateImage(
    beat: Beat,
    type: ComicFace['type'],
    config: StoryConfig,
    hero: Persona,
    friend: Persona | null,
    world: World | null
  ): Promise<string> {
    const contents: any[] = [];
    
    // 1. Hero Reference
    if (hero?.base64) {
        contents.push({ text: "REFERENCE [HERO]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: hero.base64 } });
    }
    // 2. Co-Star Reference
    if (friend?.base64) {
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
        promptText += `TYPE: Comic Book Cover. TITLE: "INFINITE HEROES" (OR LOCALIZED TRANSLATION IN ${langName.toUpperCase()}). Main visual: Dynamic action shot of [HERO] (Use REFERENCE [HERO]).`;
        if (world) {
            promptText += ` BACKGROUND: Must match REFERENCE [WORLD ENVIRONMENT] strictly. Setting: ${world.name}.`;
        }
    } else if (type === 'back_cover') {
        promptText += `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser. Text: "NEXT ISSUE SOON".`;
    } else {
        promptText += `TYPE: Vertical comic panel. SCENE: ${beat.scene}. `;
        promptText += `INSTRUCTIONS: Maintain strict character likeness. If scene mentions 'HERO', you MUST use REFERENCE [HERO]. If scene mentions 'CO-STAR' or 'SIDEKICK', you MUST use REFERENCE [CO-STAR].`;
        if (world) {
            promptText += ` BACKGROUND: Must match REFERENCE [WORLD ENVIRONMENT] aesthetic. Setting: ${world.name}.`;
        }
        if (beat.caption) promptText += ` INCLUDE CAPTION BOX: "${beat.caption}"`;
        if (beat.dialogue) promptText += ` INCLUDE SPEECH BUBBLE: "${beat.dialogue}"`;
    }

    contents.push({ text: promptText });

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
          model: MODEL_IMAGE_GEN_NAME,
          contents: contents,
          config: { imageConfig: { aspectRatio: '2:3' } }
        });
        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return part?.inlineData?.data ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : '';
    } catch (e) { 
        console.error("Image generation failed", e);
        throw e;
    }
  }
};
