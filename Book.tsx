
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import jsPDF from 'jspdf';
import React, { useCallback, useMemo } from 'react';
import { DirectorInput } from './components/DirectorInput';
import { useBook } from './context/BookContext';
import { Panel } from './Panel';
import { TOTAL_PAGES } from './types';

export const Book: React.FC = () => {
    const { state, actions } = useBook();

    // Memoized map for faster lookup - only recompute when faces change meaningfully
    const pageMap = useMemo(() => {
        const map = new Map<number, typeof state.comicFaces[number]>();
        state.comicFaces.forEach(face => {
            if (typeof face.pageIndex === 'number') {
                map.set(face.pageIndex, face);
            }
        });
        return map;
    }, [state.comicFaces]);

    // PDF Generation - memoize heavy operations
    const downloadPDF = useCallback(() => {
        const PAGE_WIDTH = 480;
        const PAGE_HEIGHT = 720;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
        
        // Pre-filter and sort only completed pages
        const pagesToPrint = state.comicFaces
          .filter(face => face.imageUrl && !face.isLoading)
          .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

        pagesToPrint.forEach((face, index) => {
            if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
            if (face.imageUrl) doc.addImage(face.imageUrl, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        });
        doc.save('Infinite-Heroes-Issue.pdf');
    }, [state.comicFaces]);

    const handleSheetClick = useCallback((index: number) => {
        if (state.status !== 'reading') return;
        if (index === 0 && state.currentSheetIndex === 0) return;

        if (index < state.currentSheetIndex) {
             actions.setSheetIndex(index);
        } else if (index === state.currentSheetIndex) {
            const currentFace = pageMap.get(index);
            const maxFaceIndex = Math.max(...state.comicFaces.map(f => f.pageIndex || 0));

            if (currentFace?.imageUrl || index > maxFaceIndex) {
                 actions.setSheetIndex(state.currentSheetIndex + 1);
            }
        }
    }, [actions, pageMap, state.comicFaces, state.currentSheetIndex, state.status]);

    const handleCornerClick = useCallback((event: React.MouseEvent, sheetIndex: number) => {
        event.stopPropagation();
        handleSheetClick(sheetIndex);
    }, [handleSheetClick]);

    // Construct Sheets
    const sheetsToRender = useMemo(() => {
        const sheets: { front?: typeof state.comicFaces[number]; back?: typeof state.comicFaces[number] }[] = [];

        sheets.push({
            front: pageMap.get(0),
            back: pageMap.get(1)
        });

        const maxGeneratedPage = Math.max(0, ...state.comicFaces.map(f => f.pageIndex || 0));

        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            const front = pageMap.get(i);
            const back = pageMap.get(i + 1);

            if (front || back || i <= maxGeneratedPage + 2) {
                 sheets.push({ front, back });
            }
        }

        return { sheets, maxGeneratedPage };
    }, [pageMap, state.comicFaces]);

    // 3. Check if we need the Director Sheet
    // It should appear after the last generated page, IF we aren't at the end
    const isBookFinished = sheetsToRender.maxGeneratedPage >= TOTAL_PAGES;

    // Logic: If the last sheet has a back page that is rendered, we need a new sheet for Director
    // If the last sheet has a front page but no back, the Director goes on the back.
    
    // Actually, simpler logic:
    // We just render sheets based on pages. The 'Director Mode' is a special component 
    // that replaces the 'Empty' or 'Loading' state of the NEXT ungenerated page.

    const isSetup = state.status === 'setup';

    return (
        <div className={`book ${state.currentSheetIndex > 0 ? 'opened' : ''} transition-all duration-1000 ease-in-out`}
           style={ isSetup ? { transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)', filter: 'blur(6px) brightness(0.7)', pointerEvents: 'none' } : {}}>
          {sheetsToRender.sheets.map((sheet, i) => {
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
              const showDirectorFront = !sheet.front && !isBookFinished && sheetsToRender.maxGeneratedPage < frontPageNum;

              // Check if we should show Director Input on the Back of this sheet
              // Show if:
              // 1. Front exists
              // 2. Back doesn't exist
              // 3. Not finished
              const showDirectorBack = sheet.front && !sheet.back && !isBookFinished && sheetsToRender.maxGeneratedPage < backPageNum;

              // Check if currently generating to disable director input
              const isGenerating = state.loadingProgress !== null || state.comicFaces.some(face => face.isLoading);

              return (
                  <div key={i} className={`paper ${i < state.currentSheetIndex ? 'flipped' : ''}`} style={{ zIndex: i < state.currentSheetIndex ? i : sheetsToRender.sheets.length - i }}>
                      <div className="front">
                          {showDirectorFront ? (
                              <DirectorInput onContinue={actions.continueStory} isGenerating={isGenerating} />
                          ) : (
                              <Panel face={sheet.front} allFaces={state.comicFaces} onOpenBook={() => actions.setSheetIndex(1)} onDownload={downloadPDF} />
                          )}
                          <button
                              type="button"
                              className="page-turn-handle page-turn-handle-front"
                              aria-label="Turn page"
                              onClick={(event) => handleCornerClick(event, i)}
                          >
                              <span className="page-turn-icon">↷</span>
                              <span className="page-turn-text">Turn</span>
                          </button>
                      </div>
                      <div className="back">
                           {showDirectorBack ? (
                              <DirectorInput onContinue={actions.continueStory} isGenerating={isGenerating} />
                          ) : (
                              <Panel face={sheet.back} allFaces={state.comicFaces} onOpenBook={() => actions.setSheetIndex(1)} onDownload={downloadPDF} />
                          )}
                          <button
                              type="button"
                              className="page-turn-handle page-turn-handle-back"
                              aria-label="Turn page"
                              onClick={(event) => handleCornerClick(event, i)}
                          >
                              <span className="page-turn-icon">↶</span>
                              <span className="page-turn-text">Turn</span>
                          </button>
                      </div>
                  </div>
              );
          })}
      </div>
    );
}
