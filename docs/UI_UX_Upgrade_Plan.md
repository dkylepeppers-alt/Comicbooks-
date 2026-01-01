# UI Upgrade and Configuration Panel Plan

## Objectives
- Modernize the experience so generation, navigation, and editing feel polished and predictable.
- Make configuration discoverable but unobtrusive via a toggleable control panel.
- Preserve performance by minimizing rerenders and heavy asset work on primary interaction paths.

## Current Pain Points to Address
- Loading states can feel opaque when multiple tasks run (generation, PDF export, image prep).
- Navigation between book pages occasionally triggers redundant renders and asset rework.
- Feature and model settings are scattered or implicit, making it hard for users to adjust behavior.

## Proposed UI Upgrade
1. **Layout & Structure**
   - Introduce a global top bar with quick access to Home, Library, Export, and Settings toggle.
   - Use a two-column canvas on desktop (page view + controls/outline), collapsing to stacked panels on mobile.
   - Keep the GlobalLoadingIndicator docked beneath the top bar for consistent visibility.
2. **Visual System**
   - Apply a tokenized theme (spacing, radii, typography scale) and a light/dark switch.
   - Standardize buttons, inputs, and toasts with consistent states (default/hover/active/disabled) and focus rings.
   - Add subtle motion (200ms ease) for panel slide-ins, page transitions, and toast entry.
3. **Navigation & Context**
   - Add a breadcrumb/locator showing the current chapter/page with quick jump dropdown.
   - Surface inline status chips on pages (Generating, Ready, Error) to reduce ambiguity.
   - Provide a mini-outline that collapses on small screens and defers heavy thumbnail rendering until visible.
4. **Feedback & Error UX**
   - Co-locate actionable recovery steps next to errors (retry, open logs, contact support link).
   - Expand logging surface with a lightweight log viewer (tail of recent entries) anchored near the loading indicator.
5. **Performance Considerations**
   - Continue memoizing page lookups and sheet construction; add lazy thumbnail loading and virtualization for long page lists.
   - Defer non-critical font/icon loads using `rel="preload"`/`rel="prefetch"` where applicable.
   - Gate expensive canvas redraws behind explicit user actions (e.g., "Refresh preview").

## Configuration Panel (Toggle Access)
- **Entry Point**: A persistent toggle button in the top bar labeled "Settings" with a gear icon; on click/tap, slide in a right-docked panel (modal on mobile with swipe-down to close). Keyboard shortcut: `S`.
- **State & Persistence**: Panel open/close state held in context so any page can open it. Settings saved to IndexedDB/localStorage with optimistic UI and reset-to-defaults support.
- **Sections & Controls**
  - **Models & Performance**: Model choice, max tokens/page length, temperature/creativity, batching size, image resolution, concurrent generation limit.
  - **Rendering**: Thumbnail quality, lazy load toggle, animation density, page prefetch depth.
  - **Accessibility & Theme**: Light/dark/auto theme, reduced motion toggle, font scaling (90–120%), high-contrast mode.
  - **Notifications & Logging**: Verbosity level, error toast persistence, download logs button.
  - **Exports**: PDF quality, include metadata toggle, page range selection defaults.
- **Behavioral Details**
  - Panel pushes the canvas on desktop (keeping context visible) and overlays on mobile with a dimmed scrim.
  - Unsaved changes indicator with a save/apply button and a revert link for each section.
  - Expose quick toggles for the most common switches (theme, reduced motion, model) at the top of the panel.

## Implementation Steps
1. **Scaffolding**: Add a `SettingsPanel` component with slide-in animation and global context for open state; wire the top-bar toggle and keyboard shortcut.
2. **Settings Storage**: Implement a typed settings model in context with load/save to IndexedDB; include migration hooks for future schema changes.
3. **Controls & Layout**: Build modular section components (e.g., `SettingsSection`, `SettingsRow`) to keep the panel consistent and easily extensible.
4. **Performance Hooks**: Add lazy thumbnail loading, virtualization for outlines, and defer heavy effects until the panel or outline is visible.
5. **QA & Accessibility**: Add focus traps inside the panel, ensure ESC/toggle closes it, and audit for keyboard navigation and ARIA labels.
6. **Documentation**: Update README with shortcut and settings descriptions; add a changelog entry when shipped.

## Success Criteria
- Users can open/close the configuration panel from anywhere via toggle or `S`, with state restored across sessions.
- Primary flows (generation, navigation, export) remain smooth, with no noticeable jank during panel interactions.
- Settings changes are immediately reflected in experience and remain after reload, with clear defaults and reset paths.
