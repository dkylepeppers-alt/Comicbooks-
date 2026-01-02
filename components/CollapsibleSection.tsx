/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  children,
  defaultOpen = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 flex items-center justify-between gap-2 transition-colors touch-manipulation"
        aria-expanded={isOpen}
      >
        <div className="flex-1 text-left">
          <p className="font-comic text-sm sm:text-base text-gray-900 font-semibold">{title}</p>
          {description && <p className="text-[10px] sm:text-xs text-gray-600 leading-snug mt-0.5">{description}</p>}
        </div>
        <div className={`transform transition-transform duration-200 text-gray-600 text-lg ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>
      {isOpen && (
        <div className="px-3 sm:px-4 py-3 sm:py-4 bg-white border-t border-gray-200">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {children}
          </div>
        </div>
      )}
    </section>
  );
};
