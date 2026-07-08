/**
 * Simple Sieve syntax highlighter.
 * Returns HTML with <span> elements for syntax coloring.
 */

const TOKENS = [
  // Comments (must be first so # inside strings isn't matched)
  { pattern: /#.*$/gm, cls: 'sieve-comment' },
  // Strings (double-quoted with escape support)
  { pattern: /"((?:[^"\\]|\\.)*)"/g, cls: 'sieve-string', wrap: true },
  // Keywords
  { pattern: /\b(require|if|elsif|else|allof|anyof|not|true|false)\b/g, cls: 'sieve-keyword' },
  // Test identifiers
  { pattern: /\b(header|address|envelope|size|body|exists|date|currentdate|redirect|fileinto|discard|stop|addflag|setflag|removeflag|vacation|reject|keep)\b/g, cls: 'sieve-test' },
  // Comparators / tagged arguments
  { pattern: /:[a-zA-Z][a-zA-Z0-9-]*/g, cls: 'sieve-comparator' },
  // Size suffixes (numbers followed by K/M/G)
  { pattern: /\b\d+(?:K|M|G)\b/g, cls: 'sieve-number' },
  // Brackets and punctuation
  { pattern: /[{}()[\],;]/g, cls: 'sieve-bracket' },
];

/**
 * Highlight a Sieve code string.
 * @param {string} code - Raw Sieve code
 * @returns {string} HTML with syntax highlighting spans
 */
export function highlightSieve(code) {
  if (!code) return '';

  // First, build an array of "segments" that tracks which parts are already highlighted
  // We'll use a single string and replace tokens in order, being careful not to
  // re-match inside already-wrapped spans.

  // Escape HTML
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply each token rule sequentially.
  // Since comments & strings come first and wrap entire spans,
  // later rules won't match inside them because they contain no angle brackets.
  for (const token of TOKENS) {
    if (token.wrap) {
      // For string tokens, wrap the entire match including quotes
      html = html.replace(token.pattern, (match) => {
        return `<span class="${token.cls}">${match}</span>`;
      });
    } else {
      html = html.replace(token.pattern, (match) => {
        return `<span class="${token.cls}">${match}</span>`;
      });
    }
  }

  return html;
}
