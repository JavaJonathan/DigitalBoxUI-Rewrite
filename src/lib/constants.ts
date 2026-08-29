/** App-wide constants shared across pages and components. */

/** Orders per page in the queue and history lists. */
export const PAGE_SIZE = 50;

/** Debounce before a search keystroke triggers a refetch. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Max length of an order note (matches the server-side cap). */
export const NOTE_MAX_LENGTH = 500;

/**
 * Max PDFs accepted in one upload selection. Client-side guard only — the server caps each
 * *request* separately (`MaxUploadFiles`), and the uploader sends these in small sequential
 * batches. Sized for "an operator drops a week of slips at once".
 */
export const UPLOAD_MAX_FILES = 1000;

/** How many individual file rows the upload dialog renders before collapsing the rest to a count. */
export const UPLOAD_LIST_PREVIEW = 80;

/** Max length of a user's display name (matches the server-side cap). */
export const DISPLAY_NAME_MAX_LENGTH = 120;

/** Shared "back-out" easing for the entrance animations (toast, selection bar, nav accent). */
export const EASE_BACK_OUT = 'cubic-bezier(0.34, 1.4, 0.64, 1)';
