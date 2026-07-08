<script>
  import ConditionList from './lib/ConditionList.svelte';
  import ActionSelector from './lib/ActionSelector.svelte';
  import SievePreview from './lib/SievePreview.svelte';
</script>

<header class="app-header">
  <div class="header-inner">
    <div class="header-text">
      <p class="header-eyebrow">Filtri email lato server</p>
      <h1>Costruttore di regole Sieve</h1>
      <p class="header-desc">
        Descrivi le condizioni con blocchi trascinabili, scegli l'azione e
        ottieni subito il codice Sieve da copiare nel tuo client o server di posta.
      </p>
    </div>
  </div>
</header>

<main class="app-main">
  <div class="main-grid">
    <!-- Builder column -->
    <section class="builder-col" aria-label="Costruttore regole">
      <h2 class="section-title">Condizioni</h2>
      <ConditionList />

      <ActionSelector />
    </section>

    <!-- Preview column -->
    <section class="preview-col" aria-label="Anteprima codice">
      <SievePreview />
    </section>
  </div>
</main>

<footer class="app-footer">
  <p>
    Il codice generato segue lo standard
    <a href="https://datatracker.ietf.org/doc/html/rfc5228" target="_blank" rel="noopener noreferrer">Sieve (RFC 5228)</a>.
    Compatibile con Dovecot, Cyrus IMAP, e client come Thunderbird, Roundcube e SOGo.
  </p>
</footer>

<style>
  /* --- Header --- */
  .app-header {
    padding: var(--space-6) var(--space-4) var(--space-4);
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .header-inner {
    max-width: 1160px;
    margin: 0 auto;
  }

  .header-eyebrow {
    font-family: system-ui, sans-serif;
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--postal);
    margin-bottom: var(--space-2);
  }

  .header-text h1 {
    margin-bottom: var(--space-2);
  }

  .header-desc {
    font-size: var(--text-sm);
    color: var(--ink-light);
    max-width: 560px;
  }

  /* --- Main grid --- */
  .app-main {
    max-width: 1160px;
    margin: 0 auto;
    padding: var(--space-4);
  }

  @media (min-width: 768px) {
    .app-main {
      padding: var(--space-6);
    }
  }

  .main-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  @media (min-width: 860px) {
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      align-items: start;
    }
  }

  .builder-col {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  .preview-col {
    position: sticky;
    top: var(--space-4);
    min-width: 0;
  }

  @media (max-width: 859px) {
    .preview-col {
      position: static;
    }
  }

  .section-title {
    font-family: Georgia, serif;
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--ink);
    margin-bottom: var(--space-3);
  }

  /* --- Footer --- */
  .app-footer {
    max-width: 1160px;
    margin: 0 auto;
    padding: var(--space-4) var(--space-4) var(--space-8);
    text-align: center;
    font-size: var(--text-xs);
    color: var(--ink-muted);
    line-height: 1.6;
  }

  @media (min-width: 768px) {
    .app-footer {
      padding: var(--space-4) var(--space-6) var(--space-10);
    }
  }

  .app-footer a {
    color: var(--postal);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .app-footer a:hover {
    color: var(--postal-dark);
  }
</style>
