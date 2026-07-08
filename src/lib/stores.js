import { writable, derived } from 'svelte/store';
import { generateSieve } from './sieveGenerator.js';

/**
 * Available condition fields with their labels and default operators.
 */
export const FIELD_DEFS = [
  { value: 'from',     label: 'Mittente (From)',         type: 'text',   defaultOp: 'contains' },
  { value: 'subject',  label: 'Oggetto (Subject)',       type: 'text',   defaultOp: 'contains' },
  { value: 'to',       label: 'Destinatario (To)',       type: 'text',   defaultOp: 'contains' },
  { value: 'cc',       label: 'CC',                      type: 'text',   defaultOp: 'contains' },
  { value: 'body',     label: 'Corpo del messaggio',     type: 'text',   defaultOp: 'contains' },
  { value: 'size',     label: 'Dimensione',              type: 'size',   defaultOp: 'over' },
  { value: 'custom',   label: 'Intestazione personalizzata', type: 'custom', defaultOp: 'contains' },
];

/**
 * Available operators per field type.
 */
export const OPERATOR_DEFS = {
  text: [
    { value: 'contains',    label: 'contiene' },
    { value: 'notcontains', label: 'non contiene' },
    { value: 'is',          label: 'è uguale a' },
    { value: 'starts',      label: 'inizia con' },
    { value: 'ends',        label: 'finisce con' },
  ],
  size: [
    { value: 'over',  label: 'maggiore di' },
    { value: 'under', label: 'minore di' },
  ],
  custom: [
    { value: 'contains',    label: 'contiene' },
    { value: 'notcontains', label: 'non contiene' },
    { value: 'is',          label: 'è uguale a' },
    { value: 'starts',      label: 'inizia con' },
    { value: 'ends',        label: 'finisce con' },
  ],
};

/**
 * Connector options (AND / OR between conditions).
 */
export const CONNECTOR_DEFS = [
  { value: 'AND', label: 'E (AND)' },
  { value: 'OR',  label: 'O (OR)' },
];

/**
 * Action type definitions.
 */
export const ACTION_DEFS = [
  { value: 'fileinto',        label: 'Sposta in cartella',     hasValue: true,  valuePlaceholder: 'Nome cartella (es. Lavoro)', valueType: 'text' },
  { value: 'discard',         label: 'Cestina / Elimina',      hasValue: false },
  { value: 'redirect',        label: 'Inoltra a',              hasValue: true,  valuePlaceholder: 'email@esempio.com', valueType: 'email' },
  { value: 'addflag_seen',    label: 'Segna come letto',       hasValue: false },
  { value: 'addflag_flagged', label: 'Contrassegna con flag',  hasValue: false },
  { value: 'vacation',        label: 'Rispondi automaticamente', hasValue: true, valuePlaceholder: 'Testo della risposta…', valueType: 'text', hasSubject: true, subjectPlaceholder: 'Oggetto risposta' },
  { value: 'reject',          label: 'Rifiuta messaggio',      hasValue: true,  valuePlaceholder: 'Motivo del rifiuto…', valueType: 'text' },
  { value: 'stop',            label: 'Ferma elaborazione',     hasValue: false },
];

// --- Helpers ---

let nextId = 1;

function getFieldType(field) {
  const def = FIELD_DEFS.find(f => f.value === field);
  return def ? def.type : 'text';
}

function getDefaultOp(field) {
  const def = FIELD_DEFS.find(f => f.value === field);
  return def ? def.defaultOp : 'contains';
}

function createBlankCondition() {
  return {
    id: nextId++,
    field: 'from',
    operator: 'contains',
    value: '',
    connector: null,
    headerName: '',
  };
}

// --- Condition Store ---

function createConditionStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,

    /** Add a new blank condition at the end. */
    add() {
      update(conds => {
        const blank = createBlankCondition();
        if (conds.length > 0) {
          blank.connector = 'AND';
        }
        return [...conds, blank];
      });
    },

    /** Remove a condition by id and fix connectors. */
    remove(id) {
      update(conds => {
        const filtered = conds.filter(c => c.id !== id);
        // Fix connectors: first element must have connector = null
        if (filtered.length > 0) {
          filtered[0] = { ...filtered[0], connector: null };
        }
        return filtered;
      });
    },

    /** Update a single field on a condition. */
    updateField(id, field) {
      update(conds => conds.map(c => {
        if (c.id !== id) return c;
        const newType = getFieldType(field);
        const newOp = getDefaultOp(field);
        return {
          ...c,
          field,
          operator: newOp,
          // reset headerName if switching away from custom
          headerName: field === 'custom' ? c.headerName : '',
        };
      }));
    },

    updateOperator(id, operator) {
      update(conds => conds.map(c => c.id === id ? { ...c, operator } : c));
    },

    updateValue(id, value) {
      update(conds => conds.map(c => c.id === id ? { ...c, value } : c));
    },

    updateConnector(id, connector) {
      update(conds => conds.map(c => c.id === id ? { ...c, connector } : c));
    },

    updateHeaderName(id, headerName) {
      update(conds => conds.map(c => c.id === id ? { ...c, headerName } : c));
    },

    /**
     * Move a condition from one index to another.
     * @param {number} fromIndex
     * @param {number} toIndex
     */
    move(fromIndex, toIndex) {
      update(conds => {
        if (fromIndex < 0 || fromIndex >= conds.length) return conds;
        if (toIndex < 0 || toIndex >= conds.length) return conds;
        if (fromIndex === toIndex) return conds;

        const arr = [...conds];
        const [item] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, item);

        // Fix connectors
        for (let i = 0; i < arr.length; i++) {
          if (i === 0) {
            arr[i] = { ...arr[i], connector: null };
          } else if (arr[i].connector === null) {
            arr[i] = { ...arr[i], connector: 'AND' };
          }
        }

        return arr;
      });
    },

    /** Clear all conditions. */
    clear() {
      set([]);
      nextId = 1;
    },
  };
}

export const conditions = createConditionStore();

// --- Action Store ---

function createActionStore() {
  const { subscribe, set, update } = writable({
    type: 'fileinto',
    value: 'INBOX',
    subject: '',
  });

  return {
    subscribe,
    set,
    update,

    updateType(type) {
      update(a => {
        const def = ACTION_DEFS.find(d => d.value === type);
        return {
          type,
          value: def && def.hasValue ? (a.value || '') : '',
          subject: '',
        };
      });
    },

    updateValue(value) {
      update(a => ({ ...a, value }));
    },

    updateSubject(subject) {
      update(a => ({ ...a, subject }));
    },
  };
}

export const action = createActionStore();

// --- Derived Sieve Code ---

export const sieveCode = derived(
  [conditions, action],
  ([$conditions, $action]) => {
    return generateSieve($conditions, $action);
  }
);
