<script>
  import { ACTION_DEFS, action } from './stores.js';

  $: currentAction = $action;
  $: selectedDef = ACTION_DEFS.find(d => d.value === currentAction.type);

  function onTypeChange(e) {
    action.updateType(e.target.value);
  }

  function onValueChange(e) {
    action.updateValue(e.target.value);
  }

  function onSubjectChange(e) {
    action.updateSubject(e.target.value);
  }
</script>

<div class="action-selector" role="group" aria-label="Selezione azione del filtro">
  <h3 class="action-title">Azione</h3>
  <p class="action-hint">Cosa deve fare il filtro quando le condizioni sono soddisfatte.</p>

  <div class="action-controls">
    <!-- Action type -->
    <div class="action-type-field">
      <label for="action-type">Tipo di azione</label>
      <select
        id="action-type"
        value={currentAction.type}
        on:change={onTypeChange}
        aria-label="Tipo di azione del filtro"
      >
        {#each ACTION_DEFS as def}
          <option value={def.value}>{def.label}</option>
        {/each}
      </select>
    </div>

    <!-- Action value (if needed) -->
    {#if selectedDef && selectedDef.hasValue}
      <div class="action-value-field">
        {#if selectedDef.valueType === 'email'}
          <label for="action-value">Indirizzo email</label>
          <input
            id="action-value"
            type="email"
            placeholder={selectedDef.valuePlaceholder || 'valore…'}
            value={currentAction.value || ''}
            on:input={onValueChange}
            aria-label="Valore dell'azione"
          />
        {:else}
          <label for="action-value">{selectedDef.valueType === 'text' && selectedDef.value === 'vacation' ? 'Messaggio di risposta' : 'Valore'}</label>
          <input
            id="action-value"
            type="text"
            placeholder={selectedDef.valuePlaceholder || 'valore…'}
            value={currentAction.value || ''}
            on:input={onValueChange}
            aria-label="Valore dell'azione"
          />
        {/if}
      </div>
    {/if}

    <!-- Vacation subject (if needed) -->
    {#if selectedDef && selectedDef.hasSubject}
      <div class="action-value-field">
        <label for="action-subject">Oggetto della risposta</label>
        <input
          id="action-subject"
          type="text"
          placeholder={selectedDef.subjectPlaceholder || 'Oggetto…'}
          value={currentAction.subject || ''}
          on:input={onSubjectChange}
          aria-label="Oggetto della risposta automatica"
        />
      </div>
    {/if}
  </div>

  <!-- Quick action summary -->
  <div class="action-summary" aria-live="polite">
    {#if currentAction.type === 'fileinto'}
      <span class="summary-icon">📁</span>
      Sposta i messaggi nella cartella <strong>{currentAction.value || '…'}</strong>
    {:else if currentAction.type === 'discard'}
      <span class="summary-icon">🗑️</span>
      Cestina / elimina i messaggi
    {:else if currentAction.type === 'redirect'}
      <span class="summary-icon">↗️</span>
      Inoltra i messaggi a <strong>{currentAction.value || '…'}</strong>
    {:else if currentAction.type === 'addflag_seen'}
      <span class="summary-icon">👁️</span>
      Segna i messaggi come letti
    {:else if currentAction.type === 'addflag_flagged'}
      <span class="summary-icon">🚩</span>
      Contrassegna i messaggi con flag
    {:else if currentAction.type === 'vacation'}
      <span class="summary-icon">✉️</span>
      Rispondi automaticamente con un messaggio
    {:else if currentAction.type === 'reject'}
      <span class="summary-icon">🚫</span>
      Rifiuta il messaggio
    {:else if currentAction.type === 'stop'}
      <span class="summary-icon">⏹️</span>
      Ferma l'elaborazione (non applicare altri filtri)
    {/if}
  </div>
</div>

<style>
  .action-selector {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--seal);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
    margin-top: var(--space-4);
  }

  .action-title {
    font-family: Georgia, serif;
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--ink);
    margin-bottom: var(--space-1);
  }

  .action-hint {
    font-size: var(--text-sm);
    color: var(--ink-light);
    margin-bottom: var(--space-4);
  }

  .action-controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .action-type-field {
    flex: 0 0 auto;
    min-width: 200px;
  }

  .action-value-field {
    flex: 1 1 auto;
    min-width: 180px;
  }

  .action-summary {
    margin-top: var(--space-4);
    padding: var(--space-3);
    background: var(--paper);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    line-height: 1.5;
  }

  .summary-icon {
    font-size: 1.2em;
    flex-shrink: 0;
  }

  .action-summary strong {
    color: var(--postal);
    font-weight: 600;
  }

  @media (max-width: 767px) {
    .action-selector {
      padding: var(--space-3);
    }

    .action-controls {
      flex-direction: column;
    }

    .action-type-field,
    .action-value-field {
      min-width: 0;
      flex: 1 1 auto;
    }
  }
</style>
