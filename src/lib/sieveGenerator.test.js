import { describe, it, expect } from 'vitest';
import { generateSieve } from './sieveGenerator.js';

// Helper to normalize whitespace for comparison
function norm(s) {
  return s.replace(/[ \t]+/g, ' ').trim();
}

describe('generateSieve', () => {
  const baseAction = { type: 'fileinto', value: 'INBOX', subject: '' };

  it('genera solo require e fileinto senza condizioni', () => {
    const result = generateSieve([], baseAction);
    expect(result).toContain('require ["fileinto"];');
    expect(result).toContain('fileinto "INBOX";');
    expect(result).not.toContain('if ');
  });

  it('genera una singola condizione correttamente', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@azienda.it', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('header :contains "From" "@azienda.it"');
    expect(result).toContain('if ');
    expect(result).toContain('fileinto "INBOX";');
  });

  it('genera due condizioni AND con allof annidato', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@azienda.it', connector: null, id: 1 },
      { field: 'subject', operator: 'contains', value: 'Report', connector: 'AND', id: 2 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('if allof (');
    expect(result).toContain('header :contains "From" "@azienda.it",');
    expect(result).toContain('header :contains "Subject" "Report"');
    expect(result).toContain('fileinto "INBOX";');
  });

  it('genera due condizioni OR con anyof', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@personale.it', connector: null, id: 1 },
      { field: 'from', operator: 'contains', value: '@lavoro.it', connector: 'OR', id: 2 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('if anyof (');
    expect(result).not.toContain('allof');
  });

  it('genera struttura annidata corretta con AND+OR misti', () => {
    // A AND B OR C → anyof(allof(A, B), C)
    const conds = [
      { field: 'from', operator: 'contains', value: '@a.it', connector: null, id: 1 },
      { field: 'subject', operator: 'contains', value: 'X', connector: 'AND', id: 2 },
      { field: 'to', operator: 'contains', value: '@b.it', connector: 'OR', id: 3 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('if anyof (');
    expect(result).toContain('allof (');
  });

  it('genera azione discard correttamente', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@spam.it', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, { type: 'discard', value: '', subject: '' });
    expect(result).toContain('discard;');
    expect(result).not.toContain('fileinto');
  });

  it('genera azione redirect correttamente', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@importante.it', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, { type: 'redirect', value: 'boss@azienda.it', subject: '' });
    expect(result).toContain('redirect "boss@azienda.it";');
  });

  it('gestisce not contains con sintassi corretta', () => {
    const conds = [
      { field: 'from', operator: 'notcontains', value: '@spam.it', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('not header :contains "From" "@spam.it"');
  });

  it('genera test dimensione con size', () => {
    const conds = [
      { field: 'size', operator: 'over', value: '500', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('size :over 500K');
  });

  it('genera test dimensione minore di', () => {
    const conds = [
      { field: 'size', operator: 'under', value: '100', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('size :under 100K');
  });

  it('genera body test correttamente', () => {
    const conds = [
      { field: 'body', operator: 'contains', value: 'password', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('require');
    expect(result).toContain('"body"');
    expect(result).toContain('body :contains "password"');
  });

  it('aggiunge estensione imap4flags per addflag', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@test.it', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, { type: 'addflag_flagged', value: '', subject: '' });
    expect(result).toContain('"imap4flags"');
    expect(result).toContain('addflag "\\\\Flagged";');
  });

  it('genera vacation con subject', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@test.it', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, {
      type: 'vacation',
      value: 'Sono fuori ufficio.',
      subject: 'Fuori ufficio'
    });
    expect(result).toContain('"vacation"');
    expect(result).toContain('vacation :subject "Fuori ufficio" "Sono fuori ufficio.";');
  });

  it('genera reject correttamente', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@spam.it', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, {
      type: 'reject',
      value: 'Non si accettano messaggi da questo mittente',
      subject: ''
    });
    expect(result).toContain('"reject"');
    expect(result).toContain('reject "Non si accettano messaggi da questo mittente";');
  });

  it('genera stop action', () => {
    const result = generateSieve([], { type: 'stop', value: '', subject: '' });
    expect(result).toContain('stop;');
  });

  it('ignora condizioni con valore vuoto', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '', connector: null, id: 1 },
      { field: 'subject', operator: 'contains', value: 'Report', connector: 'AND', id: 2 }
    ];
    const result = generateSieve(conds, baseAction);
    // Should only use the non-empty condition
    expect(result).toContain('header :contains "Subject" "Report"');
    expect(result).not.toContain('allof');
  });

  it('gestisce operatori starts e ends con :matches', () => {
    const conds = [
      { field: 'subject', operator: 'starts', value: 'RE:', connector: null, id: 1 }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain(':matches');
    expect(result).toContain('"RE:*"');
  });

  it('gestisce campo custom header', () => {
    const conds = [
      { field: 'custom', operator: 'contains', value: 'spam', connector: null, id: 1, headerName: 'X-Spam-Flag' }
    ];
    const result = generateSieve(conds, baseAction);
    expect(result).toContain('header :contains "X-Spam-Flag" "spam"');
  });

  it('tre condizioni tutte AND producono un unico allof', () => {
    const conds = [
      { field: 'from', operator: 'contains', value: '@a.it', connector: null, id: 1 },
      { field: 'subject', operator: 'contains', value: 'Report', connector: 'AND', id: 2 },
      { field: 'to', operator: 'contains', value: '@b.it', connector: 'AND', id: 3 }
    ];
    const result = generateSieve(conds, baseAction);
    const lines = result.split('\n');
    const allofLines = lines.filter(l => l.includes('allof'));
    expect(allofLines.length).toBe(1);
  });
});
