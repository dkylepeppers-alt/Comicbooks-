
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import jsPDF from 'jspdf';
import { TOTAL_PAGES } from './types';
import { Panel } from './Panel';
import { useBook } from './context/BookContext';
import { DirectorInput } from './components/DirectorInput';

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
            // Only allow flip if page is ready OR it's the director page
            const currentFace = state.comicFaces.find(f => f.pageIndex === index);
            // Allow flipping if it's the director page (which might be index > maxFaceIndex)
            const maxFaceIndex = Math.max(...state.comicFaces.map(f => f.pageIndex || 0));
            
            // Allow flip if:
            // 1. The face exists and has an image
            // 2. OR we are flipping TO the director page (which is conceptually 'after' the last generated page)
            if (currentFace?.imageUrl || index > maxFaceIndex) {
                 actions.setSheetIndex(state.currentSheetIndex + 1);
            }
        }
    };

    // Construct Sheets
    const sheetsToRender = [];
    
    // 1. Cover Sheet (0)
    sheetsToRender.push({ 
        front: state.comicFaces.find(f => f.pageIndex === 0), 
        back: state.comicFaces.find(f => f.pageIndex === 1) 
    });

    // 2. Calculate remaining pages
    const maxGeneratedPage = Math.max(0, ...state.comicFaces.map(f => f.pageIndex || 0));
    
    // Add story sheets
    for (let i = 2; i <= TOTAL_PAGES; i += 2) {
        const front = state.comicFaces.find(f => f.pageIndex === i);
        const back = state.comicFaces.find(f => f.pageIndex === i + 1);
        
        // Only render sheet if at least one side exists or we are anticipating it
        if (front || back || i <= maxGeneratedPage + 2) {
             sheetsToRender.push({ front, back });
        }
    }

    // 3. Check if we need the Director Sheet
    // It should appear after the last generated page, IF we aren't at the end
    const lastSheetIndex = sheetsToRender.length - 1;
    const lastSheet = sheetsToRender[lastSheetIndex];
    const isBookFinished = maxGeneratedPage >= TOTAL_PAGES;

    // Logic: If the last sheet has a back page that is rendered, we need a new sheet for Director
    // If the last sheet has a front page but no back, the Director goes on the back.
    
    // Actually, simpler logic:
    // We just render sheets based on pages. The 'Director Mode' is a special component 
    // that replaces the 'Empty' or 'Loading' state of the NEXT ungenerated page.

    const isSetup = state.status === 'setup';

    return (
        <div className={`book ${state.currentSheetIndex > 0 ? 'opened' : ''} transition-all duration-1000 ease-in-out`}
           style={ isSetup ? { transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)', filter: 'blur(6px) brightness(0.7)', pointerEvents: 'none' } : {}}>
          {sheetsToRender.map((sheet, i) => {
              // Determine logic for Director Mode
              // Ideally, Director Input shows up on the Right Page (Front of next sheet) 
              // when we are at the end of content.
              
              // Calculate page numbers for this sheet
              const frontPageNum = i === 0 ? 0 : i * 2;
              const backPageNum = frontPageNum + 1;

              // Check if we should show Director Input on the Front of this sheet
              // Show if: 
              // 1. This sheet's front page doesn't exist yet
              // 2. The previous page (back of i-1) exists
              // 3. We are not finished with the book
              const showDirectorFront = !sheet.front && !isBookFinished && maxGeneratedPage < frontPageNum;
              
              // Check if we should show Director Input on the Back of this sheet
              // Show if:
              // 1. Front exists
              // 2. Back doesn't exist
              // 3. Not finished
              const showDirectorBack = sheet.front && !sheet.back && !isBookFinished && maxGeneratedPage < backPageNum;

              return (
                  <div key={i} className={`paper ${i < state.currentSheetIndex ? 'flipped' : ''}`} style={{ zIndex: i < state.currentSheetIndex ? i : sheetsToRender.length - i }}
                       onClick={() => handleSheetClick(i)}>
                      <div className="front">
                          {showDirectorFront ? (
                              <DirectorInput onContinue={actions.continueStory} />
                          ) : (
                              <Panel face={sheet.front} allFaces={state.comicFaces} onOpenBook={() => actions.setSheetIndex(1)} onDownload={downloadPDF} />
                          )}
                      </div>
                      <div className="back">
                           {showDirectorBack ? (
                              <DirectorInput onContinue={actions.continueStory} />
                          ) : (
                              <Panel face={sheet.back} allFaces={state.comicFaces} onOpenBook={() => actions.setSheetIndex(1)} onDownload={downloadPDF} />
                          )}
                      </div>
                  </div>
              );
          })}
      </div>
    );
}
