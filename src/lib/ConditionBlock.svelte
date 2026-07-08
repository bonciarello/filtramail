<script>
  import { FIELD_DEFS, OPERATOR_DEFS, conditions } from './stores.js';

  /** @type {{ id: number, field: string, operator: string, value: string, connector: string|null, headerName: string }} */
  export let condition;
  export let index = 0;

  $: fieldDef = FIELD_DEFS.find(f => f.value === condition.field);
  $: fieldType = fieldDef ? fieldDef.type : 'text';
  $: operators = OPERATOR_DEFS[fieldType] || OPERATOR_DEFS.text;
  $: showHeaderName = condition.field === 'custom';
  $: showSizeUnit = condition.field === 'size';

  function onFieldChange(e) {
    conditions.updateField(condition.id, e.target.value);
  }

  function onOperatorChange(e) {
    conditions.updateOperator(condition.id, e.target.value);
  }

  function onValueChange(e) {
    conditions.updateValue(condition.id, e.target.value);
  }

  function onHeaderNameChange(e) {
    conditions.updateHeaderName(condition.id, e.target.value);
  }

  function onRemove() {
    conditions.remove(condition.id);
  }
</script>

<div class="condition-block" role="group" aria-label="Blocco condizione {index + 1}">
  <!-- Drag handle -->
  <div
    class="drag-handle"
    draggable="true"
    tabindex="0"
    role="button"
    aria-label="Trascina per riordinare la condizione {index + 1}"
    title="Trascina per riordinare"
    on:dragstart
    on:dragend
  >
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
      <circle cx="4" cy="3" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="3" r="1.5" fill="currentColor"/>
      <circle cx="4" cy="9" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="9" r="1.5" fill="currentColor"/>
      <circle cx="4" cy="15" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
    </svg>
  </div>

  <!-- Field -->
  <div class="cond-field">
    <label for="field-{condition.id}" class="sr-only">Campo</label>
    <select
      id="field-{condition.id}"
      value={condition.field}
      on:change={onFieldChange}
      aria-label="Campo della condizione"
    >
      {#each FIELD_DEFS as f}
        <option value={f.value}>{f.label}</option>
      {/each}
    </select>
  </div>

  <!-- Operator -->
  <div class="cond-operator">
    <label for="op-{condition.id}" class="sr-only">Operatore</label>
    <select
      id="op-{condition.id}"
      value={condition.operator}
      on:change={onOperatorChange}
      aria-label="Operatore della condizione"
    >
      {#each operators as op}
        <option value={op.value}>{op.label}</option>
      {/each}
    </select>
  </div>

  <!-- Header name (only for custom field) -->
  {#if showHeaderName}
    <div class="cond-header-name">
      <label for="hdr-{condition.id}">Nome intestazione</label>
      <input
        id="hdr-{condition.id}"
        type="text"
        placeholder="es. X-Spam-Score"
        value={condition.headerName || ''}
        on:input={onHeaderNameChange}
      />
    </div>
  {/if}

  <!-- Value -->
  <div class="cond-value">
    <label for="val-{condition.id}" class="sr-only">Valore</label>
    {#if showSizeUnit}
      <span class="size-input-wrapper">
        <input
          id="val-{condition.id}"
          type="number"
          min="0"
          placeholder="es. 500"
          value={condition.value}
          on:input={onValueChange}
          aria-label="Dimensione in KB"
        />
        <span class="size-unit">KB</span>
      </span>
    {:else}
      <input
        id="val-{condition.id}"
        type="text"
        placeholder={fieldType === 'text' ? 'es. @azienda.it' : 'valore…'}
        value={condition.value}
        on:input={onValueChange}
        aria-label="Valore della condizione"
      />
    {/if}
  </div>

  <!-- Remove button -->
  <button
    class="btn-ghost btn-sm cond-remove"
    on:click={onRemove}
    aria-label="Rimuovi questa condizione"
    title="Rimuovi condizione"
    type="button"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>
</div>

<style>
  .condition-block {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--postal);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--duration-fast) var(--ease-out),
                border-color var(--duration-fast) var(--ease-out);
    position: relative;
  }

  .condition-block:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--postal);
  }

  /* Drag handle */
  .drag-handle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 40px;
    color: var(--ink-muted);
    cursor: grab;
    border-radius: var(--radius-sm);
    transition: color var(--duration-fast) var(--ease-out),
                background var(--duration-fast) var(--ease-out);
  }

  .drag-handle:hover {
    color: var(--postal);
    background: var(--postal-light);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  /* Condition parts */
  .cond-field {
    flex: 0 0 auto;
    min-width: 160px;
  }

  .cond-operator {
    flex: 0 0 auto;
    min-width: 140px;
  }

  .cond-header-name {
    flex: 0 0 auto;
    min-width: 120px;
  }

  .cond-value {
    flex: 1 1 auto;
    min-width: 140px;
  }

  .cond-remove {
    flex-shrink: 0;
    color: var(--ink-muted);
    padding: var(--space-1);
    min-width: 32px;
    min-height: 32px;
    opacity: 0.5;
    transition: opacity var(--duration-fast) var(--ease-out),
                color var(--duration-fast) var(--ease-out);
  }

  .condition-block:hover .cond-remove {
    opacity: 1;
  }

  .cond-remove:hover {
    color: var(--seal);
    background: var(--seal-light);
  }

  /* Size input with unit */
  .size-input-wrapper {
    display: flex;
    align-items: center;
    position: relative;
  }

  .size-input-wrapper input {
    padding-right: 36px;
  }

  .size-unit {
    position: absolute;
    right: 10px;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-muted);
    pointer-events: none;
  }

  /* Mobile: stack vertically */
  @media (max-width: 767px) {
    .condition-block {
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: var(--space-3);
    }

    .cond-field,
    .cond-operator {
      flex: 1 1 calc(50% - var(--space-2));
      min-width: 120px;
    }

    .cond-value {
      flex: 1 1 100%;
    }

    .cond-header-name {
      flex: 1 1 100%;
      min-width: 0;
    }

    .cond-remove {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      opacity: 1;
    }

    .drag-handle {
      position: absolute;
      top: var(--space-2);
      left: var(--space-2);
    }

    .condition-block {
      padding-left: 40px;
      padding-right: 36px;
    }
  }
</style>
