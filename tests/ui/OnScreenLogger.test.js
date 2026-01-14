/**
 * OVERLAY ARTEFACT — SAFE TO APPLY (FIX IMPORT PATH)
 * Target file (repo-relative): tests/ui/OnScreenLogger.test.js
 * Purpose: Correct relative import path to src/ui/OnScreenLogger.js from tests/ui/.
 * How to use: Replace your current import with the two lines below; the first preserves original as comment.
 */
// import OnScreenLogger from '../../../src/ui/OnScreenLogger.js'; // original (off-by-one level)
import OnScreenLogger from '../../src/ui/OnScreenLogger.js';
