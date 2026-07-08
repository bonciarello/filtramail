/**
 * Sieve Filter Code Generator
 *
 * Converts condition blocks + action selection into valid Sieve code
 * (RFC 5228 and extensions).
 */

const FIELD_TO_HEADER = {
  from: 'From',
  subject: 'Subject',
  to: 'To',
  cc: 'Cc'
};

const OP_SIEVE_MAP = {
  contains: ':contains',
  notcontains: null, // handled specially
  is: ':is',
  starts: ':matches',
  ends: ':matches',
  over: ':over',
  under: ':under'
};

/**
 * Escape a string for safe inclusion in double-quoted Sieve strings.
 */
function escapeStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Build the Sieve test string for a single condition.
 */
function buildConditionTest(cond) {
  const val = cond.value.trim();
  if (!val) return null;

  const field = cond.field;
  const op = cond.operator;

  // --- Size test ---
  if (field === 'size') {
    const sizeNum = parseInt(val, 10) || 0;
    if (op === 'over') {
      return `size :over ${sizeNum}K`;
    }
    if (op === 'under') {
      return `size :under ${sizeNum}K`;
    }
    return `size :over ${sizeNum}K`;
  }

  // --- Body test ---
  if (field === 'body') {
    if (op === 'notcontains') {
      return `not body :contains "${escapeStr(val)}"`;
    }
    return `body :contains "${escapeStr(val)}"`;
  }

  // --- Header-based tests (from, subject, to, cc, custom) ---
  let headerName;
  if (field === 'custom') {
    headerName = cond.headerName ? cond.headerName.trim() : 'X-Custom';
  } else {
    headerName = FIELD_TO_HEADER[field] || field;
  }

  const sieveOp = OP_SIEVE_MAP[op] || ':contains';

  let matchVal = val;
  if (op === 'starts') {
    matchVal = `${val}*`;
  } else if (op === 'ends') {
    matchVal = `*${val}`;
  }

  const inner = `header ${sieveOp} "${escapeStr(headerName)}" "${escapeStr(matchVal)}"`;

  if (op === 'notcontains') {
    return `not ${inner}`;
  }
  return inner;
}

/**
 * Build the action line for Sieve.
 */
function buildActionLine(action) {
  switch (action.type) {
    case 'fileinto':
      return `fileinto "${escapeStr(action.value || 'INBOX')}";`;
    case 'discard':
      return 'discard;';
    case 'redirect':
      return `redirect "${escapeStr(action.value || '')}";`;
    case 'addflag_seen':
      return 'addflag "\\\\Seen";';
    case 'addflag_flagged':
      return 'addflag "\\\\Flagged";';
    case 'vacation':
      return `vacation :subject "${escapeStr(action.subject || 'Risposta automatica')}" "${escapeStr(action.value || '')}";`;
    case 'reject':
      return `reject "${escapeStr(action.value || 'Messaggio rifiutato')}";`;
    case 'stop':
      return 'stop;';
    default:
      return 'stop;';
  }
}

/**
 * Determine which Sieve extensions are needed.
 */
function getRequiredExtensions(conditions, action) {
  const exts = new Set();

  if (action.type === 'fileinto') exts.add('fileinto');
  if (action.type === 'addflag_seen' || action.type === 'addflag_flagged') exts.add('imap4flags');
  if (action.type === 'vacation') exts.add('vacation');
  if (action.type === 'reject') exts.add('reject');

  for (const cond of conditions) {
    if (cond.value.trim() && cond.field === 'body') {
      exts.add('body');
    }
  }

  return [...exts];
}

/**
 * Generate complete Sieve code from conditions and action.
 *
 * @param {Array} conditions - Array of condition objects { field, operator, value, connector }
 * @param {Object} action - Action object { type, value, subject? }
 * @returns {string} Valid Sieve filter code
 */
export function generateSieve(conditions, action) {
  const valid = conditions.filter(c => c.value && c.value.trim() !== '');

  const exts = getRequiredExtensions(conditions, action);

  const lines = [];

  // Require line
  if (exts.length > 0) {
    lines.push(`require [${exts.map(e => `"${e}"`).join(', ')}];`);
    lines.push('');
  }

  // No conditions — just the action
  if (valid.length === 0) {
    lines.push(buildActionLine(action));
    return lines.join('\n');
  }

  // Single condition
  if (valid.length === 1) {
    const test = buildConditionTest(valid[0]);
    lines.push(`if ${test} {`);
    lines.push(`    ${buildActionLine(action)}`);
    lines.push('}');
    return lines.join('\n');
  }

  // Collect connectors between consecutive conditions
  // connector[i] joins condition[i] to condition[i+1]
  const connectors = [];
  for (let i = 1; i < valid.length; i++) {
    connectors.push(valid[i].connector || 'AND');
  }

  const allAND = connectors.every(c => c === 'AND');
  const allOR = connectors.every(c => c === 'OR');

  if (allAND) {
    // --- All AND ---
    lines.push('if allof (');
    valid.forEach((c, i) => {
      const suffix = i < valid.length - 1 ? ',' : '';
      lines.push(`    ${buildConditionTest(c)}${suffix}`);
    });
    lines.push(') {');
    lines.push(`    ${buildActionLine(action)}`);
    lines.push('}');
  } else if (allOR) {
    // --- All OR ---
    lines.push('if anyof (');
    valid.forEach((c, i) => {
      const suffix = i < valid.length - 1 ? ',' : '';
      lines.push(`    ${buildConditionTest(c)}${suffix}`);
    });
    lines.push(') {');
    lines.push(`    ${buildActionLine(action)}`);
    lines.push('}');
  } else {
    // --- Mixed AND/OR ---
    // Group consecutive AND-chained conditions into allof blocks,
    // then join groups with anyof
    const groups = [];
    let currentGroup = [valid[0]];

    for (let i = 0; i < connectors.length; i++) {
      if (connectors[i] === 'AND') {
        currentGroup.push(valid[i + 1]);
      } else {
        groups.push(currentGroup);
        currentGroup = [valid[i + 1]];
      }
    }
    groups.push(currentGroup);

    lines.push('if anyof (');
    groups.forEach((group, gi) => {
      if (group.length === 1) {
        const suffix = gi < groups.length - 1 ? ',' : '';
        lines.push(`    ${buildConditionTest(group[0])}${suffix}`);
      } else {
        lines.push('    allof (');
        group.forEach((c, ci) => {
          const suffix = ci < group.length - 1 ? ',' : '';
          lines.push(`        ${buildConditionTest(c)}${suffix}`);
        });
        const suffix = gi < groups.length - 1 ? ',' : '';
        lines.push(`    )${suffix}`);
      }
    });
    lines.push(') {');
    lines.push(`    ${buildActionLine(action)}`);
    lines.push('}');
  }

  return lines.join('\n');
}
