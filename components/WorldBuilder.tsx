
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { World, Persona, NotificationType } from '../types';
import { compressImage, estimateBase64Size, formatBytes } from '../utils/imageCompression';

interface WorldBuilderProps {
    existingWorld?: World | null;
    savedHeroes: (Persona & { id: string })[];
    onSave: (world: World) => void;
    onCancel: () => void;
    addNotification: (type: NotificationType, message: string, duration?: number) => void;
}

export const WorldBuilder: React.FC<WorldBuilderProps> = ({ existingWorld, savedHeroes, onSave, onCancel, addNotification }) => {
    const [name, setName] = useState(existingWorld?.name || "");
    const [description, setDescription] = useState(existingWorld?.description || "");
    const [images, setImages] = useState<string[]>(existingWorld?.images || []);
    const [linkedPersonaIds, setLinkedPersonaIds] = useState<string[]>(existingWorld?.linkedPersonaIds || []);

    const handleImageUpload = async (file: File) => {
        if (images.length >= 3) {
            addNotification('warning', 'Maximum 3 reference images allowed');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            addNotification('error', 'Please upload a valid image file (JPG, PNG, GIF, etc.)');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            addNotification('error', `File too large! Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
            return;
        }

        try {
            // Compress image for better performance (world images can be slightly smaller)
            const base64 = await compressImage(file, 800, 800, 0.80);

            if (!base64) {
                throw new Error('Failed to process image data');
            }

            const compressedSize = estimateBase64Size(base64);
            setImages(prev => [...prev, base64]);
            addNotification('success', `World image added! (${formatBytes(compressedSize)})`, 2000);
        } catch (error) {
            addNotification('error', `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const togglePersona = (id: string) => {
        setLinkedPersonaIds(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (!name || !description) return;
        const world: World = {
            id: existingWorld?.id || `world-${Date.now()}`,
            name,
            description,
            images,
            linkedPersonaIds
        };
        onSave(world);
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white border-[6px] border-black p-6 shadow-[16px_16px_0px_rgba(0,0,0,1)] relative flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                
                <h2 className="font-comic text-4xl text-blue-600 uppercase tracking-wide border-b-4 border-black pb-2">
                    {existingWorld ? 'Edit World' : 'Build A World'}
                </h2>

                <div className="flex flex-col gap-2">
                    <label className="font-comic text-xl">World Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Neo-Tokyo, The Whispering Woods"
                        className="border-2 border-black p-2 font-comic text-lg focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-comic text-xl">Environment Lore</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the atmosphere, lighting, and key features..."
                        className="border-2 border-black p-2 font-comic text-lg h-24 resize-none focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="font-comic text-xl">Visual References ({images.length}/3)</label>
                        {images.length < 3 && (
                            <label className="comic-btn bg-yellow-400 text-xs px-2 py-1 cursor-pointer hover:bg-yellow-300">
                                + ADD IMAGE
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                            </label>
                        )}
                    </div>
                    <div className="flex gap-2 h-20">
                        {images.map((img, i) => (
                            <div key={i} className="relative group w-20 h-20 border-2 border-black">
                                <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" alt="ref" />
                                <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 flex items-center justify-center rounded-full font-bold text-xs border border-black">X</button>
                            </div>
                        ))}
                        {images.length === 0 && <p className="text-gray-400 italic text-sm py-2">No visual references added. AI will rely on text.</p>}
                    </div>
                </div>

                {savedHeroes.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <label className="font-comic text-xl">Inhabitants (Linked Heroes)</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border-2 border-dashed border-gray-300">
                            {savedHeroes.map(hero => (
                                <button 
                                    key={hero.id}
                                    onClick={() => togglePersona(hero.id)}
                                    className={`px-2 py-1 border-2 border-black text-xs font-bold uppercase transition-all ${linkedPersonaIds.includes(hero.id) ? 'bg-green-400 shadow-[2px_2px_0px_black]' : 'bg-gray-100 opacity-60'}`}
                                >
                                    {hero.name} {linkedPersonaIds.includes(hero.id) && '✓'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mt-4">
                    <button onClick={onCancel} className="flex-1 comic-btn bg-gray-300 hover:bg-gray-200 py-3 text-xl">CANCEL</button>
                    <button onClick={handleSubmit} disabled={!name} className="flex-1 comic-btn bg-blue-500 text-white hover:bg-blue-400 py-3 text-xl disabled:opacity-50">
                        SAVE WORLD
                    </button>
                </div>
            </div>
        </div>
    );
};
