import Bus from '../../core/bus.ts';

const bus = new Bus();

/* eslint-disable */
let _MAP = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  20: 'capslock',
  27: 'esc',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'ins',
  46: 'del',
  91: 'meta',
  93: 'meta',
  224: 'meta'
};

let _KEYCODE_MAP = {
  106: '*',
  107: '+',
  109: '-',
  110: '.',
  111: '/',
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  220: '\\',
  221: ']',
  222: '\''
};

let _SHIFT_MAP = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  '$': '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  '_': '-',
  '+': '=',
  ':': ';',
  '\"': '\'',
  '<': ',',
  '>': '.',
  '?': '/',
  '|': '\\'
};

let _SPECIAL_ALIASES = {
  'option': 'alt',
  'command': 'meta',
  'return': 'enter',
  'escape': 'esc',
  'plus': '+',
  'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
};

let _REVERSE_MAP;

/**
 * loop through the f keys, f1 to f19 and add them to the map
 * programatically
 */
for (let i = 1; i < 20; ++i) {
  _MAP[111 + i] = 'f' + i;
}

/**
 * loop through to map numbers on the numeric keypad
 */
for (let i = 0; i <= 9; ++i) {
  _MAP[i + 96] = i;
}

/**
 * takes the event and returns the key character
 *
 * @param {Event} e
 * @return {string}
 */
function _characterFromEvent(e) {

  // for keypress events we should return the character as is
  if (e.type == 'keypress') {
    let character = String.fromCharCode(e.which);

    // if the shift key is not pressed then it is safe to assume
    // that we want the character to be lowercase.  this means if
    // you accidentally have caps lock on then your key bindings
    // will continue to work
    //
    // the only side effect that might not be desired is if you
    // bind something like 'A' cause you want to trigger an
    // event when capital A is pressed caps lock will no longer
    // trigger the event.  shift+a will though.
    if (!e.shiftKey) {
      character = character.toLowerCase();
    }

    return character;
  }

  // for non keypress events the special maps are needed
  if (_MAP[e.which]) {
    return _MAP[e.which];
  }

  if (_KEYCODE_MAP[e.which]) {
    return _KEYCODE_MAP[e.which];
  }

  // if it is not in the special map

  // with keydown and keyup events the character seems to always
  // come in as an uppercase character whether you are pressing shift
  // or not.  we should make sure it is always lowercase for comparisons
  return String.fromCharCode(e.which).toLowerCase();
}

/**
 * checks if two arrays are equal
 *
 * @param {Array} modifiers1
 * @param {Array} modifiers2
 * @returns {boolean}
 */
function _modifiersMatch(modifiers1, modifiers2) {
  return modifiers1.sort().join(',') === modifiers2.sort().join(',');
}

/**
 * takes a key event and figures out what the modifiers are
 *
 * @param {Event} e
 * @returns {Array}
 */
function _eventModifiers(e) {
  let modifiers = [];

  if (e.shiftKey) {
    modifiers.push('shift');
  }

  if (e.altKey) {
    modifiers.push('alt');
  }

  if (e.ctrlKey) {
    modifiers.push('ctrl');
  }

  if (e.metaKey) {
    modifiers.push('meta');
  }

  return modifiers;
}

/**
 * determines if the keycode specified is a modifier key or not
 *
 * @param {string} key
 * @returns {boolean}
 */
function _isModifier(key) {
  return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
}

/**
 * reverses the map lookup so that we can look for specific keys
 * to see what can and can't use keypress
 *
 * @return {Object}
 */
function _getReverseMap() {
  if (!_REVERSE_MAP) {
    _REVERSE_MAP = {};
    for (let key in _MAP) {

      // pull out the numeric keypad from here cause keypress should
      // be able to detect the keys from the character
      if (key > 95 && key < 112) {
        continue;
      }

      if (_MAP.hasOwnProperty(key)) {
        _REVERSE_MAP[_MAP[key]] = key;
      }
    }
  }
  return _REVERSE_MAP;
}

/**
 * picks the best action based on the key combination
 *
 * @param {string} key - character for key
 * @param {Array} modifiers
 * @param {string=} action passed in
 */
function _pickBestAction(key, modifiers, action) {

  // if no action was picked in we should try to pick the one
  // that we think would work best for this key
  if (!action) {
    action = _getReverseMap()[key] ? 'keydown' : 'keypress';
  }

  // modifier keys don't work as expected with keypress,
  // switch to keydown
  if (action == 'keypress' && modifiers.length) {
    action = 'keydown';
  }

  return action;
}

/**
 * Converts from a string key combination to an array
 *
 * @param  {string} combination like "command+shift+l"
 * @return {Array}
 */
function _keysFromString(combination) {
  if (combination === '+') {
    return ['+'];
  }

  combination = combination.replace(/\+{2}/g, '+plus');
  return combination.split('+');
}

/**
 * Gets info for a specific key combination
 *
 * @param  {string} combination key combination ("command+s" or "a" or "*")
 * @param  {string=} action
 * @returns {Object}
 */
function _getKeyInfo(combination, action) {
  let keys;
  let key;
  let i;
  let modifiers = [];

  // take the keys from this pattern and figure out what the actual
  // pattern is all about
  keys = _keysFromString(combination);

  for (i = 0; i < keys.length; ++i) {
    key = keys[i];

    // normalize key names
    if (_SPECIAL_ALIASES[key]) {
      key = _SPECIAL_ALIASES[key];
    }

    // if this is not a keypress event then we should
    // be smart about using shift keys
    // this will only work for US keyboards however
    if (action && action != 'keypress' && _SHIFT_MAP[key]) {
      key = _SHIFT_MAP[key];
      modifiers.push('shift');
    }

    // if this key is a modifier then add it to the list of modifiers
    if (_isModifier(key)) {
      modifiers.push(key);
    }
  }

  // depending on what the key combination is
  // we will try to pick the best event for it
  action = _pickBestAction(key, modifiers, action);

  return {
    key: key,
    modifiers: modifiers,
    action: action
  };
}

function HotKey() {
  let self = this;

  /**
   * element to attach key events to
   *
   * @type {Element}
   */
  self.target = document;

  /**
   * a list of all the callbacks setup via HotKey.bind()
   *
   * @type {Object}
   */
  self._callbacks = {};

  /**
   * direct map of string combinations to callbacks used for trigger()
   *
   * @type {Object}
   */
  self._directMap = {};

  /**
   * keeps track of what level each sequence is at since multiple
   * sequences can start out with the same sequence
   *
   * @type {Object}
   */
  let _sequenceLevels = {};

  /**
   * letiable to store the setTimeout call
   *
   * @type {null|number}
   */
  let _resetTimer;

  /**
   * temporary state where we will ignore the next keyup
   *
   * @type {boolean|string}
   */
  let _ignoreNextKeyup = false;

  /**
   * temporary state where we will ignore the next keypress
   *
   * @type {boolean}
   */
  let _ignoreNextKeypress = false;

  /**
   * are we currently inside of a sequence?
   * type of action ("keyup" or "keydown" or "keypress") or false
   *
   * @type {boolean|string}
   */
  let _nextExpectedAction = false;

  /**
   * resets all sequence counters except for the ones passed in
   *
   * @param {Object} doNotReset
   * @returns void
   */
  function _resetSequences(doNotReset) {
    doNotReset = doNotReset || {};

    let activeSequences = false,
      key;

    for (key in _sequenceLevels) {
      if (doNotReset[key]) {
        activeSequences = true;
        continue;
      }
      _sequenceLevels[key] = 0;
    }

    if (!activeSequences) {
      _nextExpectedAction = false;
    }
  }

  /**
   * finds all callbacks that match based on the keycode, modifiers,
   * and action
   *
   * @param {string} character
   * @param {Array} modifiers
   * @param {Event|Object} e
   * @param {string=} sequenceName - name of the sequence we are looking for
   * @param {string=} combination
   * @param {number=} level
   * @returns {Array}
   */
  function _getMatches(character, modifiers, e, sequenceName, combination, level) {
    let i;
    let callback;
    let matches = [];
    let action = e.type;

    // if there are no events related to this keycode
    if (!self._callbacks[character]) {
      return [];
    }

    // if a modifier key is coming up on its own we should allow it
    if (action == 'keyup' && _isModifier(character)) {
      modifiers = [character];
    }

    // loop through all callbacks for the key that was pressed
    // and see if any of them match
    for (i = 0; i < self._callbacks[character].length; ++i) {
      callback = self._callbacks[character][i];

      // if a sequence name is not specified, but this is a sequence at
      // the wrong level then move onto the next match
      if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
        continue;
      }

      // if the action we are looking for doesn't match the action we got
      // then we should keep going
      if (action != callback.action) {
        continue;
      }

      // if this is a keypress event and the meta key and control key
      // are not pressed that means that we need to only look at the
      // character, otherwise check the modifiers as well
      //
      // chrome will not fire a keypress if meta or control is down
      // safari will fire a keypress if meta or meta+shift is down
      // firefox will fire a keypress if meta or control is down
      if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || _modifiersMatch(modifiers, callback.modifiers)) {
        let deleteCombo = !sequenceName && callback.combo == combination;
        let deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
        if (deleteCombo || deleteSequence) {
          self._callbacks[character].splice(i, 1);
        }

        matches.push(callback);
      }
    }

    return matches;
  }

  /**
   * actually calls the callback function
   *
   * if your callback function returns false this will use the jquery
   * convention - prevent default and stop propogation on the event
   *
   * @param {Function} callback
   * @param {Event} e
   * @returns void
   */
  function _fireCallback(callback, e, combo, sequence) {
    if (callback(e, combo) === false) {
      e.preventDefault();
      e.stopPropagation();
    }
    bus.emit('ve.hotkey.callback.call', {
      callback,
      e,
      combo,
      sequence,
    });
  }

  function _handleKey(character, modifiers, e) {
    let callbacks = _getMatches(character, modifiers, e);
    let i;
    let doNotReset = {};
    let maxLevel = 0;
    let processedSequenceCallback = false;

    // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
    for (i = 0; i < callbacks.length; ++i) {
      if (callbacks[i].seq) {
        maxLevel = Math.max(maxLevel, callbacks[i].level);
      }
    }

    // loop through matching callbacks for this key event
    for (i = 0; i < callbacks.length; ++i) {

      // fire for all sequence callbacks
      // this is because if for example you have multiple sequences
      // bound such as "g i" and "g t" they both need to fire the
      // callback for matching g cause otherwise you can only ever
      // match the first one
      if (callbacks[i].seq) {

        // only fire callbacks for the maxLevel to prevent
        // subsequences from also firing
        //
        // for example 'a option b' should not cause 'option b' to fire
        // even though 'option b' is part of the other sequence
        //
        // any sequences that do not match here will be discarded
        // below by the _resetSequences call
        if (callbacks[i].level != maxLevel) {
          continue;
        }

        processedSequenceCallback = true;

        // keep a list of which sequences were matches for later
        doNotReset[callbacks[i].seq] = 1;
        _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
        continue;
      }

      // if there were no sequence matches but we are still here
      // that means this is a regular match so we should fire that
      if (!processedSequenceCallback) {
        _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
      }
    }

    let ignoreThisKeypress = e.type == 'keypress' && _ignoreNextKeypress;
    if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
      _resetSequences(doNotReset);
    }

    _ignoreNextKeypress = processedSequenceCallback && e.type == 'keydown';
  };

  function _handleKeyEvent(e) {

    if (typeof e.which !== 'number') {
      e.which = e.keyCode;
    }

    let character = _characterFromEvent(e);

    // no character found then stop
    if (!character) {
      return;
    }

    // need to use === for the character check because the character can be 0
    if (e.type == 'keyup' && _ignoreNextKeyup === character) {
      _ignoreNextKeyup = false;
      return;
    }

    _handleKey(character, _eventModifiers(e), e);
  }

  function _resetSequenceTimer() {
    clearTimeout(_resetTimer);
    _resetTimer = setTimeout(_resetSequences, 1000);
  }

  function _bindSequence(combo, keys, callback, action) {

    _sequenceLevels[combo] = 0;

    function _increaseSequence(nextAction) {
      return function () {
        _nextExpectedAction = nextAction;
        ++_sequenceLevels[combo];
        _resetSequenceTimer();
      };
    }

    function _callbackAndReset(e) {
      _fireCallback(callback, e, combo);

      if (action !== 'keyup') {
        _ignoreNextKeyup = _characterFromEvent(e);
      }

      setTimeout(_resetSequences, 10);
    }

    for (let i = 0; i < keys.length; ++i) {
      let isFinal = i + 1 === keys.length;
      let wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
      _bindSingle(keys[i], wrappedCallback, action, combo, i);
    }
  }

  function _bindSingle(combination, callback, action, sequenceName, level) {

    // store a direct mapped reference for use with HotKey.trigger
    self._directMap[combination + ':' + action] = callback;

    // make sure multiple spaces in a row become a single space
    combination = combination.replace(/\s+/g, ' ');

    let sequence = combination.split(' ');
    let info;

    // if this pattern is a sequence of keys then run through this method
    // to reprocess each pattern one key at a time
    if (sequence.length > 1) {
      _bindSequence(combination, sequence, callback, action);
      return;
    }

    info = _getKeyInfo(combination, action);

    // make sure to initialize array if this is the first time
    // a callback is added for this key
    self._callbacks[info.key] = self._callbacks[info.key] || [];

    // remove an existing match if there is one
    _getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);

    // add this call back to the array
    // if it is a sequence put it at the beginning
    // if not put it at the end
    //
    // this is important because the way these are processed expects
    // the sequence ones to come first
    self._callbacks[info.key][sequenceName ? 'unshift' : 'push']({
      callback: callback,
      modifiers: info.modifiers,
      action: info.action,
      seq: sequenceName,
      level: level,
      combo: combination
    });
  }

  function _bindMultiple(combinations, callback, action) {
    for (let i = 0; i < combinations.length; ++i) {
      _bindSingle(combinations[i], callback, action);
    }
  };

  this.bind = function (keys, callback, action) {
    _bindMultiple(Array.isArray(keys) ? keys : [keys], callback, action);
    return this;
  };

  this.handle = _handleKeyEvent;

  document.addEventListener('keypress', _handleKeyEvent, false);
  document.addEventListener('keydown', _handleKeyEvent, false);
  document.addEventListener('keyup', _handleKeyEvent, false);
}

module.exports = new HotKey;
