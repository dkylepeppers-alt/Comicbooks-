
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import jsPDF from 'jspdf';
import { TOTAL_PAGES } from './types';
import { Panel } from './Panel';
import { useBook } from './context/BookContext';

export const Book: React.FC = () => {
    const { state, actions } = useBook();
    
    // PDF Generation
    const downloadPDF = () => {
        const PAGE_WIDTH = 480;
        const PAGE_HEIGHT = 720;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
        const pagesToPrint = state.comicFaces.filter(face => face.imageUrl && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

        pagesToPrint.forEach((face, index) => {
            if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
            if (face.imageUrl) doc.addImage(face.imageUrl, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        });
        doc.save('Infinite-Heroes-Issue.pdf');
    };

    const handleSheetClick = (index: number) => {
        if (state.status !== 'reading') return;
        if (index === 0 && state.currentSheetIndex === 0) return;
        
        if (index < state.currentSheetIndex) {
             actions.setSheetIndex(index);
        } else if (index === state.currentSheetIndex) {
            // Only allow flip if page is ready
            const currentFace = state.comicFaces.find(f => f.pageIndex === index);
            if (currentFace?.imageUrl) {
                 actions.setSheetIndex(state.currentSheetIndex + 1);
            }
        }
    };

    const sheetsToRender = [];
    if (state.comicFaces.length > 0) {
        // Front cover (0) and Inside Cover (1)
        sheetsToRender.push({ 
            front: state.comicFaces.find(f => f.pageIndex === 0), 
            back: state.comicFaces.find(f => f.pageIndex === 1) 
        });
        // Rest of pages (2-11)
        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            sheetsToRender.push({ 
                front: state.comicFaces.find(f => f.pageIndex === i), 
                back: state.comicFaces.find(f => f.pageIndex === i + 1) 
            });
        }
    } else {
        // Placeholder for initial state
        sheetsToRender.push({ front: undefined, back: undefined });
    }

    const isSetup = state.status === 'setup';

    return (
        <div className={`book ${state.currentSheetIndex > 0 ? 'opened' : ''} transition-all duration-1000 ease-in-out`}
           style={ isSetup ? { transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)', filter: 'blur(6px) brightness(0.7)', pointerEvents: 'none' } : {}}>
          {sheetsToRender.map((sheet, i) => (
              <div key={i} className={`paper ${i < state.currentSheetIndex ? 'flipped' : ''}`} style={{ zIndex: i < state.currentSheetIndex ? i : sheetsToRender.length - i }}
                   onClick={() => handleSheetClick(i)}>
                  <div className="front">
                      <Panel face={sheet.front} allFaces={state.comicFaces} onOpenBook={() => actions.setSheetIndex(1)} onDownload={downloadPDF} />
                  </div>
                  <div className="back">
                      <Panel face={sheet.back} allFaces={state.comicFaces} onOpenBook={() => actions.setSheetIndex(1)} onDownload={downloadPDF} />
                  </div>
              </div>
          ))}
      </div>
    );
}
