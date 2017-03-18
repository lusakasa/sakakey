import codeToKeyMap from './codeToKeyMap.json';

/** Returns true if the given key event is ONLY a modifier key, false otherwise */
export function isModifierKey (event) {
  switch (event.key) {
    case 'Shift':
    case 'Alt':
    case 'Control':
    case 'Meta':
      return true;
    default:
      return false;
  }
}

/**
 * Converts a KeyboardEvent to its string representation.
 * This representation is used for internal processing.
 */
export function keyboardEventString (event) {
  return (event.ctrlKey || event.altKey || event.metaKey)
    ? (event.code + '+' +
      (event.shiftKey ? 'S' : '') +
      (event.ctrlKey ? 'C' : '') +
      (event.altKey ? 'A' : '') +
      (event.metaKey ? 'M' : ''))
    : event.key;
};

/**
 * Converts a KeyboardEvent to its user-friendly string representation.
 * This representation is used for user-facing keyboard strings
 * element.g. the help menu.
 */
export function friendlyKeyboardEventString (event) {
  return (event.ctrlKey || event.altKey || event.metaKey)
    ? (event.metaKey ? 'meta+' : '') +
      (event.ctrlKey ? 'ctrl+' : '') +
      (event.altKey ? 'alt+' : '') +
      (event.shiftKey ? 'shift+' : '') +
      friendlyCodeString(event.code, event.shiftKey)
    : friendlyKeyString(event.key);
};

/**
 * Given a key string, gives a user friendlier version.
 */
function friendlyKeyString (key) {
  if (key.toLowerCase() !== key) {
    return 'shift+' + key.toLowerCase();
  }
  return key;
}

/**
 * Given a code string, element.g. KeyZ or Digit1, returns a friendlier string,
 * element.g. 'z' or '1'.
 * If no simpler string determined, just returns the code string passed in.
 */
function friendlyCodeString (code, shift) {
  if (codeToKeyMap.hasOwnProperty(code)) {
    if (shift && codeToKeyMap[code].hasOwnProperty('shift')) {
      return codeToKeyMap[code].shift;
    } else {
      return codeToKeyMap[code].value;
    }
  }
  return code;
}

/**
 * Validates a user-defined keyboard event. Do not mistakenly call
 * this function on a 'natural' keyboard event. It is only valid for
 * synthetic KeyboardEvents generated by Saka Key.
 *
 * A user-defined KeyboardEvent must be of the form:
 *   1. If the KeyboardEvent is special (ctrl, alt or meta is pressed):
 *      { code, shiftKey, ctrlKey, altKey, metaKey }
 *   2. Otherwise:
 *      { key }
 */
export function validateKeyboardEvent (event) {
  if (event.hasOwnProperty('code') === event.hasOwnProperty('key')) {
    throw Error('Either the key or the code property must be specified, but not both');
  }
  if (event.hasOwnProperty('code')) {
    for (const [key, value] of Object.entries(event)) {
      if (key === 'shiftKey' || key === 'ctrlKey' || key === 'altKey' || key === 'metaKey') {
        if (typeof value !== 'boolean') {
          throw Error(`Property ${key} must be a boolean (true or false)`);
        }
      } else if (key === 'code') {
        if (typeof value !== 'string') {
          throw Error('Property code must be a string');
        }
      } else {
        throw Error(`Invalid property ${key}`);
      }
    }
  } else {
    for (const [key, value] of Object.entries(event)) {
      if (key === 'shiftKey' || key === 'ctrlKey' || key === 'altKey' || key === 'metaKey') {
        throw Error(`No modifier properties, (element.g. ${key}) allowed if 'key' is specified`);
      } else if (key === 'key') {
        if (typeof value !== 'string') {
          throw Error('Property code must be a string');
        }
      } else {
        throw Error(`Invalid property ${key}`);
      }
    }
  }
}
