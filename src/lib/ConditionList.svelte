<script>
  import { conditions } from './stores.js';
  import ConditionBlock from './ConditionBlock.svelte';

  let dragSourceIndex = -1;
  let dragOverIndex = -1;
  let dragOverPosition = 'after'; // 'before' or 'after'

  $: conds = $conditions;
  $: hasConditions = conds.length > 0;

  function handleDragStart(e, index) {
    dragSourceIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Make drag image semi-transparent
    if (e.target.closest('.condition-block')) {
      e.target.closest('.condition-block').style.opacity = '0.4';
    }
  }

  function handleDragEnd(e) {
    dragSourceIndex = -1;
    dragOverIndex = -1;
    // Reset opacity on all blocks
    const blocks = document.querySelectorAll('.condition-block');
    blocks.forEach(b => b.style.opacity = '1');
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverIndex = index;

    // Determine if we're over the top or bottom half
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    dragOverPosition = e.clientY < midY ? 'before' : 'after';
  }

  function handleDragLeave() {
    dragOverIndex = -1;
  }

  function handleDrop(e, index) {
    e.preventDefault();
    if (dragSourceIndex === -1 || dragSourceIndex === index) {
      dragSourceIndex = -1;
      dragOverIndex = -1;
      return;
    }

    let toIndex = index;
    if (dragOverPosition === 'after' && dragSourceIndex < index) {
      // Moving down: after element i means position i
      toIndex = index;
    } else if (dragOverPosition === 'before' && dragSourceIndex > index) {
      // Moving up: before element i means position i
      toIndex = index;
    } else if (dragOverPosition === 'after') {
      toIndex = index;
    } else {
      toIndex = Math.max(0, index - 1);
    }

    // Adjust for the removal
    if (dragSourceIndex < toIndex) {
      toIndex = Math.max(0, toIndex - 1);
    }

    conditions.move(dragSourceIndex, toIndex);
    dragSourceIndex = -1;
    dragOverIndex = -1;
  }

  function handleConnectorDrop(e, index) {
    e.preventDefault();
    if (dragSourceIndex === -1) return;

    // Dropping on connector[i] means move source to position i+1
    let toIndex = index + 1;
    if (dragSourceIndex < toIndex) {
      toIndex = Math.max(0, toIndex - 1);
    }
    conditions.move(dragSourceIndex, toIndex);
    dragSourceIndex = -1;
    dragOverIndex = -1;
  }

  function handleConnectorDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function toggleConnector(index) {
    // Toggle connector for condition at index (connects index-1 to index)
    const current = conds[index].connector;
    conditions.updateConnector(conds[index].id, current === 'AND' ? 'OR' : 'AND');
  }

  function addCondition() {
    conditions.add();
  }

  function moveUp(index) {
    if (index > 0) {
      conditions.move(index, index - 1);
    }
  }

  function moveDown(index) {
    if (index < conds.length - 1) {
      conditions.move(index, index + 1);
    }
  }

  // Keyboard handler for drag handle
  function handleDragKeydown(e, index) {
    if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      moveUp(index);
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      moveDown(index);
    }
  }
</script>

<div class="condition-list" aria-label="Lista delle condizioni">
  {#if !hasConditions}
    <!-- Empty state -->
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
        <path d="M4 12L24 26L44 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="16" y1="20" x2="16" y2="28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="32" y1="20" x2="32" y2="28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>Nessuna condizione. Aggiungi la prima per iniziare a costruire il tuo filtro.</p>
      <button class="btn-primary" on:click={addCondition} type="button">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Aggiungi condizione
      </button>
    </div>
  {:else}
    <!-- Connected blocks -->
    <div class="blocks-container" role="list">
      {#each conds as cond, i (cond.id)}
        <!-- Connector pill above (except first) -->
        {#if i > 0}
          <div
            class="connector-shell"
            class:drop-target={dragOverIndex === -1 && dragSourceIndex !== -1}
            on:dragover={(e) => handleConnectorDragOver(e, i - 1)}
            on:drop={(e) => handleConnectorDrop(e, i - 1)}
            role="presentation"
          >
            <button
              class="connector-pill"
              class:connector-and={cond.connector === 'AND'}
              class:connector-or={cond.connector === 'OR'}
              on:click={() => toggleConnector(i)}
              type="button"
              aria-label="Connettore logico: {cond.connector === 'AND' ? 'E (AND)' : 'O (OR)'}. Clicca per cambiare."
              title="Clicca per cambiare tra AND e OR"
            >
              <span class="connector-label">{cond.connector === 'AND' ? 'E' : 'O'}</span>
              <span class="connector-full">{cond.connector === 'AND' ? 'AND' : 'OR'}</span>
            </button>
          </div>
        {/if}

        <!-- Condition block -->
        <div
          class="block-wrapper"
          class:drag-over-before={dragOverIndex === i && dragOverPosition === 'before'}
          class:drag-over-after={dragOverIndex === i && dragOverPosition === 'after'}
          on:dragstart={(e) => handleDragStart(e, i)}
          on:dragend={handleDragEnd}
          on:dragover={(e) => handleDragOver(e, i)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, i)}
          role="listitem"
          aria-label="Condizione {i + 1}"
        >
          <!-- Drop indicator line -->
          {#if dragOverIndex === i && dragOverPosition === 'before'}
            <div class="drop-indicator drop-before"></div>
          {/if}

          <div class="block-row">
            <span class="block-number" aria-hidden="true">{i + 1}</span>

            <!-- Move buttons (mobile-friendly) -->
            <div class="move-buttons" role="group" aria-label="Riordina condizione {i + 1}">
              <button
                class="btn-ghost btn-sm move-btn"
                on:click={() => moveUp(i)}
                disabled={i === 0}
                aria-label="Sposta su"
                title="Sposta su (Ctrl+↑)"
                type="button"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M6 3L2 8h8L6 3z" fill="currentColor"/>
                </svg>
              </button>
              <button
                class="btn-ghost btn-sm move-btn"
                on:click={() => moveDown(i)}
                disabled={i === conds.length - 1}
                aria-label="Sposta giù"
                title="Sposta giù (Ctrl+↓)"
                type="button"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M6 9L10 4H2l4 5z" fill="currentColor"/>
                </svg>
              </button>
            </div>

            <div class="condition-block-shell">
              <ConditionBlock condition={cond} index={i} />
            </div>
          </div>

          {#if dragOverIndex === i && dragOverPosition === 'after'}
            <div class="drop-indicator drop-after"></div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Add button -->
    <button class="add-condition-btn" on:click={addCondition} type="button">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Aggiungi condizione
    </button>
  {/if}
</div>

<style>
  .condition-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* --- Empty state --- */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-10) var(--space-4);
    text-align: center;
    color: var(--ink-muted);
    background: var(--surface);
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
  }

  .empty-state p {
    color: var(--ink-light);
    font-size: var(--text-sm);
    max-width: 280px;
  }

  /* --- Blocks container --- */
  .blocks-container {
    display: flex;
    flex-direction: column;
  }

  /* --- Block wrapper --- */
  .block-wrapper {
    position: relative;
    transition: padding var(--duration-fast) var(--ease-out);
  }

  .block-row {
    display: flex;
    align-items: stretch;
    gap: var(--space-2);
  }

  /* Block number badge */
  .block-number {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    width: 24px;
    padding-top: var(--space-3);
    font-family: Georgia, serif;
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--ink-muted);
    user-select: none;
  }

  /* Move buttons (visible on all devices, primary on touch) */
  .move-buttons {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 2px;
  }

  .move-btn {
    width: 24px;
    height: 20px;
    padding: 0;
    min-height: 20px;
    color: var(--ink-muted);
    border-radius: 3px;
  }

  .move-btn:hover:not(:disabled) {
    color: var(--postal);
    background: var(--postal-light);
  }

  .move-btn:disabled {
    opacity: 0.25;
    cursor: default;
  }

  /* Hide move buttons on wider screens (drag is primary) */
  @media (min-width: 768px) {
    .move-buttons {
      display: none;
    }
  }

  .condition-block-shell {
    flex: 1;
    min-width: 0;
  }

  /* --- Connector pill --- */
  .connector-shell {
    position: relative;
    display: flex;
    justify-content: center;
    padding: 0;
    height: 28px;
    z-index: 2;
  }

  .connector-shell.drop-target {
    background: var(--postal-light);
    border-radius: var(--radius-sm);
  }

  .connector-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 52px;
    height: 28px;
    padding: var(--space-1) var(--space-3);
    border: none;
    border-radius: 14px;
    font-family: system-ui, sans-serif;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease-out),
                transform var(--duration-fast) var(--ease-out),
                box-shadow var(--duration-fast) var(--ease-out);
    /* Center within the shell, offset to align with blocks */
    position: relative;
    z-index: 3;
  }

  .connector-pill:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-md);
  }

  .connector-pill:active {
    transform: scale(0.97);
  }

  .connector-and {
    background: var(--postal-light);
    color: var(--postal);
    border: 1.5px solid var(--postal);
  }

  .connector-or {
    background: var(--amber-light);
    color: var(--amber);
    border: 1.5px solid var(--amber);
  }

  .connector-label {
    /* Short label for narrow screens */
  }

  .connector-full {
    display: none;
  }

  @media (min-width: 480px) {
    .connector-label {
      display: none;
    }
    .connector-full {
      display: inline;
    }
  }

  /* --- Drop indicator --- */
  .drop-indicator {
    height: 3px;
    background: var(--postal);
    border-radius: 2px;
    margin: 0 var(--space-2);
    animation: dropPulse 0.6s ease-in-out infinite alternate;
  }

  @keyframes dropPulse {
    from { opacity: 0.6; transform: scaleX(0.95); }
    to   { opacity: 1;   transform: scaleX(1); }
  }

  /* --- Add button --- */
  .add-condition-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    padding: var(--space-2) var(--space-4);
    min-height: 40px;
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--postal);
    background: var(--postal-light);
    border: 1.5px dashed var(--postal);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease-out),
                transform var(--duration-fast) var(--ease-out);
    align-self: flex-start;
  }

  .add-condition-btn:hover {
    background: var(--postal);
    color: #fff;
    border-style: solid;
    transform: translateY(-1px);
  }

  .add-condition-btn:active {
    transform: translateY(0);
  }

  @media (max-width: 767px) {
    .add-condition-btn {
      align-self: stretch;
      justify-content: center;
    }

    /* Hide drag handle on mobile (use buttons instead) */
    :global(.drag-handle) {
      display: none !important;
    }
  }
</style>
