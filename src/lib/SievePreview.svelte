<script>
  import { sieveCode } from './stores.js';
  import { highlightSieve } from './sieveHighlighter.js';

  $: highlighted = highlightSieve($sieveCode);
  $: lineCount = $sieveCode ? $sieveCode.split('\n').length : 0;
  $: hasCode = $sieveCode && $sieveCode.trim().length > 0;

  let copyLabel = 'Copia codice';
  let copyTimer = null;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText($sieveCode);
      copyLabel = 'Copiato!';
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyLabel = 'Copia codice';
      }, 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = $sieveCode;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyLabel = 'Copiato!';
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyLabel = 'Copia codice';
      }, 2000);
    }
  }
</script>

<div class="sieve-preview" aria-label="Anteprima codice Sieve">
  <div class="preview-header">
    <h3 class="preview-title">Anteprima Sieve</h3>
    {#if hasCode}
      <button
        class="btn-secondary btn-sm copy-btn"
        on:click={copyCode}
        type="button"
        aria-label={copyLabel}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M3 11V3a1 1 0 0 1 1-1h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        {copyLabel}
      </button>
    {/if}
  </div>

  <div class="code-container">
    {#if hasCode}
      <!-- Line numbers -->
      <div class="line-numbers" aria-hidden="true">
        {#each { length: lineCount } as _, i}
          <span class="line-num">{i + 1}</span>
        {/each}
      </div>

      <!-- Highlighted code -->
      <pre class="code-content"><code>{@html highlighted}</code></pre>
    {:else}
      <div class="empty-code">
        <p>Aggiungi almeno una condizione per vedere l'anteprima del codice Sieve.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .sieve-preview {
    background: var(--code-bg);
    border: 1px solid var(--code-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 300px;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--code-surface);
    border-bottom: 1px solid var(--code-border);
  }

  .preview-title {
    font-family: system-ui, sans-serif;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--code-text);
    letter-spacing: 0;
  }

  .copy-btn {
    color: var(--code-text) !important;
    border-color: var(--code-border) !important;
    background: var(--code-bg) !important;
    flex-shrink: 0;
  }

  .copy-btn:hover {
    background: var(--code-border) !important;
  }

  .code-container {
    display: flex;
    flex: 1;
    overflow: auto;
    font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.7;
    tab-size: 4;
  }

  .line-numbers {
    display: flex;
    flex-direction: column;
    padding: var(--space-3) var(--space-2) var(--space-3) var(--space-3);
    background: var(--code-surface);
    border-right: 1px solid var(--code-border);
    user-select: none;
    -webkit-user-select: none;
    text-align: right;
    min-width: 40px;
    flex-shrink: 0;
  }

  .line-num {
    font-size: 12px;
    color: #4A5568;
    min-height: 1.7em;
  }

  .code-content {
    flex: 1;
    padding: var(--space-3) var(--space-4);
    margin: 0;
    overflow: auto;
    color: var(--code-text);
    white-space: pre;
    background: var(--code-bg);
  }

  .code-content code {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    tab-size: inherit;
  }

  /* Syntax highlighting classes (global) */
  :global(.sieve-comment)     { color: var(--syn-comment); font-style: italic; }
  :global(.sieve-keyword)     { color: var(--syn-keyword); font-weight: 600; }
  :global(.sieve-string)      { color: var(--syn-string); }
  :global(.sieve-test)        { color: var(--syn-test); }
  :global(.sieve-comparator)  { color: var(--syn-comparator); }
  :global(.sieve-bracket)     { color: var(--syn-bracket); }
  :global(.sieve-number)      { color: var(--syn-number); }

  /* Empty state */
  .empty-code {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: #4A5568;
    font-size: var(--text-sm);
    font-family: system-ui, sans-serif;
  }

  .empty-code p {
    max-width: 260px;
  }

  @media (max-width: 767px) {
    .sieve-preview {
      min-height: 250px;
      border-radius: var(--radius-md);
    }

    .code-content {
      font-size: 12px;
      padding: var(--space-2) var(--space-3);
    }

    .line-numbers {
      padding: var(--space-2) var(--space-1) var(--space-2) var(--space-2);
    }
  }
</style>
