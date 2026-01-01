
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Persona, NotificationType } from '../types';
import { compressImage, estimateBase64Size, formatBytes } from '../utils/imageCompression';

interface CharacterBuilderProps {
    existingCharacter?: (Persona & { id: string }) | null;
    onSave: (character: Persona & { id?: string }) => void;
    onDelete?: (id: string) => void;
    onCancel: () => void;
    addNotification: (type: NotificationType, message: string, duration?: number) => void;
}

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ 
    existingCharacter, 
    onSave, 
    onDelete,
    onCancel, 
    addNotification 
}) => {
    const [name, setName] = useState(existingCharacter?.name || "");
    const [description, setDescription] = useState(existingCharacter?.description || "");
    const [images, setImages] = useState<string[]>(existingCharacter?.images || (existingCharacter?.base64 ? [existingCharacter.base64] : []));

    const handleImageUpload = async (file: File) => {
        if (images.length >= 3) {
            addNotification('warning', 'Maximum 3 reference images allowed per character');
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
            // Compress image for better performance
            const base64 = await compressImage(file, 1024, 1024, 0.85);

            if (!base64) {
                throw new Error('Failed to process image data');
            }

            const compressedSize = estimateBase64Size(base64);
            setImages(prev => [...prev, base64]);
            addNotification('success', `Character image added! (${formatBytes(compressedSize)})`, 2000);
        } catch (error) {
            addNotification('error', `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const removeImage = (index: number) => {
        if (images.length === 1) {
            addNotification('warning', 'At least one image is required for a character');
            return;
        }
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            addNotification('warning', 'Character name is required');
            return;
        }
        if (images.length === 0) {
            addNotification('warning', 'At least one character image is required');
            return;
        }

        const character: Persona & { id?: string } = {
            name: name.trim(),
            description: description.trim(),
            base64: images[0], // First image is primary for backward compatibility
            images: images // All images
        };

        // If editing existing character, include ID
        if (existingCharacter?.id) {
            character.id = existingCharacter.id;
        }

        onSave(character);
    };

    const handleDelete = () => {
        if (!existingCharacter?.id) return;
        
        if (window.confirm(`Are you sure you want to delete "${existingCharacter.name}"? This action cannot be undone.`)) {
            onDelete?.(existingCharacter.id);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white border-[6px] border-black p-6 shadow-[16px_16px_0px_rgba(0,0,0,1)] relative flex flex-col gap-4 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                
                <h2 className="font-comic text-4xl text-blue-600 uppercase tracking-wide border-b-4 border-black pb-2">
                    {existingCharacter ? 'Edit Character' : 'Create Character'}
                </h2>

                <div className="flex flex-col gap-2">
                    <label className="font-comic text-xl">Character Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Captain Thunder, Shadow Knight"
                        className="border-2 border-black p-2 font-comic text-lg focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-comic text-xl">Description</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the character's appearance, personality, and abilities..."
                        className="border-2 border-black p-2 font-comic text-lg h-24 resize-none focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="font-comic text-xl">Character Images ({images.length}/3)</label>
                        {images.length < 3 && (
                            <label className="comic-btn bg-yellow-400 text-xs px-2 py-1 cursor-pointer hover:bg-yellow-300">
                                + ADD IMAGE
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-gray-600">
                        Add up to 3 reference images. Multiple angles/poses help Gemini 3 Pro generate more consistent characters.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {images.map((img, i) => (
                            <div key={i} className="relative group w-32 h-32 border-2 border-black">
                                <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" alt={`Character ref ${i + 1}`} />
                                <div className="absolute top-1 left-1 bg-blue-600 text-white px-2 py-1 text-xs font-bold">
                                    {i === 0 ? 'PRIMARY' : `REF ${i + 1}`}
                                </div>
                                <button 
                                    onClick={() => removeImage(i)} 
                                    className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs border border-black hover:bg-red-700"
                                    disabled={images.length === 1}
                                >
                                    X
                                </button>
                            </div>
                        ))}
                        {images.length === 0 && (
                            <div className="w-full p-4 border-2 border-dashed border-gray-300 text-center">
                                <p className="text-gray-400 italic text-sm">No images added yet. Add at least one character image.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 mt-4">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 comic-btn bg-gray-300 hover:bg-gray-200 py-3 text-xl"
                    >
                        CANCEL
                    </button>
                    {existingCharacter && onDelete && (
                        <button 
                            onClick={handleDelete} 
                            className="flex-1 comic-btn bg-red-500 text-white hover:bg-red-400 py-3 text-xl"
                        >
                            DELETE
                        </button>
                    )}
                    <button 
                        onClick={handleSubmit} 
                        disabled={!name.trim() || images.length === 0} 
                        className="flex-1 comic-btn bg-blue-500 text-white hover:bg-blue-400 py-3 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {existingCharacter ? 'UPDATE' : 'CREATE'}
                    </button>
                </div>
            </div>
        </div>
    );
};
