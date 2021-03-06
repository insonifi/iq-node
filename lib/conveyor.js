/* global require, module, process, console */
/* jshint -W097 */
/* jshint esnext: true */
'use strict';
const SEP = '\t';
function mutantToString(mutant) {
  return mutant[0] + SEP + mutant[1] + SEP + mutant[2];
}
function messageToString(msg) {
  return msg.type + SEP + msg.action + SEP + msg.id;
}
function messageToString2(msg) {
  return (msg.type || '') + SEP + (msg.action || '') + SEP + (msg.id || '');
}

class Conveyor {
  constructor(isRegex) {
    this.subs = new Map();
    this.regex = isRegex;

    if (isRegex) {
      this.getHandlers = this.matchByRegex;
    } else {
      this.getHandlers = this.matchById;
    }
  }
  subscribe(m, fn) {
    const key = this.regex ? m : messageToString2(m);
    const subs = this.subs;

    if (this.regex && !(key instanceof RegExp)) {
      return false;
    }

    if (subs.has(key)) {
      let sub = subs.get(key);
      sub.push(fn);
      subs.set(key, sub);
    } else {
      subs.set(key, [fn]);
    }
  }
  unsubscribe(m, fn) {
    const key = this.regex ? m : messageToString2(m);
    const subs = this.subs;

    if (typeof fn == 'function') {
        let sub = subs.get(key);
        subs.set(key, subs.get(key).filter(f => f !== fn));
    } else {
        this.subs.delete(key);
    }
  }
  handle(msg) {
    const callbacks = this.getHandlers(msg);
    let i = callbacks.length;

    while (--i >= 0) {
      callbacks[i](msg);
    }
  }
  matchByRegex(msg) {
    const str = messageToString(msg);
    const subs = Array.from(this.subs); 
    const handlers = new Set();
    let i = subs.length;

    while (--i >= 0) {
      if (subs[i][0].test(str)) {
        const ls = subs[i][1];
        let j = ls.length;
        
        while (--j >= 0) {
          handlers.add(ls[j]);
        }
      }
    }
    return Array.from(handlers);
  }
  matchById(msg) {
    const candidates = this.mutate(msg);
    const subs = this.subs;
    const handlers = new Set();
    let i = candidates.length;

    while (--i >= 0) {
      const subKey = candidates[i];

      if (subs.has(subKey)) {
        const ls = subs.get(subKey);
        let j = ls.length;

        while (--j >= 0) {
          handlers.add(ls[j]);
        }
      }
    }
    return Array.from(handlers);
  }
  mutate(m) {
    const LEN = 3;
    let vals = [m.type, m.action, m.id];
    let mutant = [];
    let mutations = new Set();
    let j = 0;
    let i = 0;

    mutations.add(mutantToString(vals));
    for (j = 0 ; j < LEN; j += 1) {
      mutant = cloneArray3(vals);
      for (i = j; i < LEN; i += 1) {
        mutant[i] = '';
        mutations.add(mutantToString(mutant));
      }
      for (i = 0; i < j - 1; i += 1) {
        mutant[i] = '';
        mutations.add(mutantToString(mutant));
      }
    }
    return Array.from(mutations);
  }
}

function cloneArray3(array) {
  return [
    array[0],
    array[1],
    array[2],
  ];
}


module.exports = Conveyor;
