/* global Actor, Card, CONFIG, foundry, game, Item, JournalEntry, Macro, Playlist, RollTable, Scene, SceneNavigation, ui */
import { PENUtilities } from '../apps/utilities.mjs'

export class PID {
  static init () {
    CONFIG.Actor.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    CONFIG.Item.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    CONFIG.JournalEntry.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    // CONFIG.Macro.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    CONFIG.RollTable.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    game.system.api = { pid:PID }
  }



  
  static #newProgressBar () {
    /* // FoundryVTT V12 */
    if (foundry.utils.isNewerVersion(game.version, '13')) {
      return ui.notifications.notify('SETUP.PackagesLoading', null, { localize: true, progress: true })
    }
    SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: 0 })
    return true
  }

  static #setProgressBar (bar, current, max) {
    /* // FoundryVTT V12 */
    if (bar === true) {
      SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: Math.floor(current * 100 / max) })
    } else if (bar !== false) {
      bar.update({ pct: current / max })
    }
  }

  /**
   * Returns RegExp for valid type and format
   * @returns RegExp
   */
  static regExKey () {
    return new RegExp('^(' + Object.keys(PID.gamePropertyLookup).join('|') + ')\\.(.*?)\\.(.+)$')
  }

  /**
   * Get PID type.subtype. based on document
   * @param document
   * @returns string
   */
  static getPrefix (document) {
    for (const type in PID.documentNameLookup) {
      if (document instanceof PID.documentNameLookup[type]) {
        return type + '.' + (document.type ?? '') + '.'
      }
    }
    return ''
  }

 /**
   * Get PID type.subtype.name based on document
   * @param document
   * @returns string
   */
  static guessId (document) {
    return PID.getPrefix(document) + PENUtilities.toKebabCase(document.name)
  }

  /**
   * Get PID type.subtype.partial-name(-removed)
   * @param key
   * @returns string
   */
  static guessGroupFromKey (id) {
    if (id) {
      const key = id.replace(/([^\\.-]+)$/, '')
      if (key.substr(-1) === '-') {
        return key
      }
    }
    return ''
  }

  /**
   * Get PID type.subtype.partial-name(-removed)
   * @param document
   * @returns string
   */
  static guessGroupFromDocument (document) {
    return PID.guessGroupFromKey(document.flags?.Pendragon?.pidFlag?.id)
  }

  /**
   * Returns all items with matching PIDs and language
   * ui.notifications.warn for missing keys
   * @param itemList array of PIDs
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   * @returns array
   */
  static async expandItemArray ({ itemList, lang = game.i18n.lang, langFallback = true, showLoading = false } = {}) {
    let items = []
    const pids = itemList.filter(it => typeof it === 'string')
    items = itemList.filter(it => typeof it !== 'string')

    if (pids.length) {
      const found = await PID.fromPIDRegexBest({ pidRegExp: PID.makeGroupRegEx(pids), type: 'i', lang, langFallback, showLoading })
      const all = []
      for (const pid of pids) {
        const item = found.find(i => i.flags.Pendragon.pidFlag.id === pid)
        if (item) {
          all.push(item)
        }
      }
      if (all.length < pids.length) {
        const notmissing = []
        for (const doc of all) {
          notmissing.push(doc.flags.Pendragon.pidFlag.id)
        }
        ui.notifications.warn(game.i18n.format('PEN.PIDFlag.error.documents-not-found', { pids: pids.filter(x => !notmissing.includes(x)).join(', '), lang}))
      }
      items = items.concat(all)
    }
    return items
  }

  /**
   * Returns item with matching PIDs from list
   * Empty array return for missing keys
   * @param pid a single pid
   * @param list array of items
   * @returns array
   */
  static findPIdInList (pid, list) {
    let itemName = ''
    const PIDKeys = Object.assign(foundry.utils.flattenObject(game.i18n._fallback.PEN?.PIDFlag?.keys ?? {}), foundry.utils.flattenObject(game.i18n.translations.PEN?.PIDFlag?.keys ?? {}))
    if (typeof PIDKeys[pid] !== 'undefined') {
      itemName = PIDKeys[pid]
    }
    return (typeof list.filter === 'undefined' ? Object.values(list) : list).filter(i => i.flags?.Pendragon?.pidFlag?.id === pid || (itemName !== '' && itemName === i.name))
  }

  /**
   * Returns RegExp matching all strings in array
   * @param pids an array of PID strings
   * @param list array of items
   * @returns RegExp
   */
  static makeGroupRegEx (pids) {
    if (typeof pids === 'string') {
      pids = [pids]
    } else if (typeof pids === 'undefined' || typeof pids.filter !== 'function') {
      return undefined
    }
    const splits = {}
    const rgx = PID.regExKey()
    for (const i of pids) {
      const key = i.match(rgx)
      if (key) {
        if (typeof splits[key[1]] === 'undefined') {
          splits[key[1]] = {}
        }
        if (typeof splits[key[1]][key[2]] === 'undefined') {
          splits[key[1]][key[2]] = []
        }
        splits[key[1]][key[2]].push(key[3])
      } else {
        // Sliently error
      }
    }
    const regExParts = []
    for (const t in splits) {
      const row = []
      for (const s in splits[t]) {
        if (splits[t][s].length > 1) {
          row.push(s + '\\.' + '(' + splits[t][s].join('|') + ')')
        } else {
          row.push(s + '\\.' + splits[t][s].join(''))
        }
      }
      if (row.length > 1) {
        regExParts.push(t + '\\.' + '(' + row.join('|') + ')')
      } else {
        regExParts.push(t + '\\.' + row.join(''))
      }
    }
    if (regExParts.length > 1) {
      return new RegExp('^(' + regExParts.join('|') + ')$')
    }
    return new RegExp('^' + regExParts.join('') + '$')
  }

  /**
   * Returns all documents with an PID matching the regex and matching the document type and language.
   * Empty array return for no matches
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation 
   * @param scope defines where it will look:
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param showLoading Show loading bar
   * @returns array
   */
  static async fromPIDRegexAll ({ pidRegExp, type, lang = game.i18n.lang, langFallback = true, scope = 'all', showLoading = false } = {}) {
    let progressBar = false
    let progressCurrent = 0
    let progressMax = (1 + game.packs.size) * 2 // Guess at how far bar goes
    if (showLoading) {
      progressBar = PID.#newProgressBar()
    }
    let candidates = await PID.#getDataFromScopes({ pidRegExp, type, lang, langFallback, progressBar, progressCurrent, progressMax, scope })
    if (langFallback && lang !== 'en') {
      candidates = PID.#filterByLanguage(candidates, lang)
    }
    candidates.sort(PID.comparePIDPrio)
    const results = await PID.#onlyDocuments(candidates, progressBar, progressCurrent, progressMax)
    PID.#setProgressBar(progressBar, 1, 1)
    return results
  }

  /**
   * Returns all documents with a PID, and language.
   * Empty array return for no matches
   * @param pid a single pid
   * @param lang the language to match against ('en', 'es', ...)
   * @param scope defines where it will look:
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   * @returns array
   */
  static async fromPIDAll ({ pid, lang = game.i18n.lang, langFallback = true, scope = 'all', showLoading = false } = {}) {
    if (!pid || typeof pid !== 'string') {
      return []
    }
    const parts = pid.match(PID.regExKey())
    if (!parts) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }
    return PID.fromPIDRegexAll({ pidRegExp: new RegExp('^' + PENUtilities.quoteRegExp(pid) + '$'), type: parts[1], lang, langFallback, scope, showLoading })
  }

  /**
   * Gets only the highest priority documents for each PID that matches the RegExp and language
   * Empty array return for no matches
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ("en", "es", ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   */
  static async fromPIDRegexBest ({ pidRegExp, type, lang = game.i18n.lang, langFallback = true, showLoading = false } = {}) {
    let progressBar = false
    let progressCurrent = 0
    let progressMax = (1 + game.packs.size) * 2 // Guess at how far bar goes
    if (showLoading) {
      progressBar = PID.#newProgressBar()
    }
    let candidates = await this.#getDataFromScopes({ pidRegExp, type, lang, langFallback, progressBar, progressCurrent, progressMax })
    if (langFallback && lang !== 'en') {
      candidates = PID.#filterByLanguage(candidates, lang)
    }
    candidates.sort(PID.#comparePIDPrio)
    const ids = {}
    for (const candidate of candidates) {
      if (!Object.prototype.hasOwnProperty.call(ids, candidate.flags.Pendragon.pidFlag.id)) {
        ids[candidate.flags.Pendragon.pidFlag.id] = candidate
      }
    }
    const candidateIds = Object.values(ids)
    progressCurrent = candidateIds.length
    progressMax = progressCurrent * 2 // readjust max to give to leave progress at 50%
    const results = await PID.#onlyDocuments(candidateIds, progressBar, progressCurrent, progressMax)
    PID.#setProgressBar(progressBar, 1, 1)
    return results
  }

  /**
   * Gets only the highest priority document for PID that matches the language,
   * with the highest priority documents in the World taking precedence over
   * any documents
   * in compendium packs.
   * @param pid string PID
   * @param lang the language to match against ("en", "es", ...)
   * @param langFallback should the system fall back to en incase there is no translation
   */
  static fromPID (pid, lang = game.i18n.lang, langFallback = true) {
    return PID.fromPIDBest({ pid, lang, langFallback })
  }

  /**
   * Gets only the highest priority document for PID that matches the language
   * @param pid string PID
   * @param lang the language to match against ("en", "es", ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   */
  static fromPIDBest ({ pid, lang = game.i18n.lang, langFallback = true, showLoading = false } = {}) {
    if (!pid || typeof pid !== 'string') {
      return []
    }
    const type = pid.split('.')[0]
    const pidRegExp = new RegExp('^' + PENUtilities.quoteRegExp(pid) + '$')
    return PID.fromPIDRegexBest({ pidRegExp, type, lang, langFallback, showLoading })
  }

  /**
   * Returns all documents or indexes with an PID matching the regex and matching the document type and language.
   * Empty array return for no matches
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param progressBar If true show v12 progress bar, if not false show v13 progress bar
   * @param progressCurrent Current Progress
   * @param progressMax Max Progress
   * @param scope defines where it will look:
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @returns array
   */
  static async #getDataFromScopes ({ pidRegExp, type, lang, langFallback, progressBar, progressCurrent, progressMax, scope = 'all' } = {}) {
    if (!pidRegExp) {
      return []
    }

    let results = []
    if (['all', 'world'].includes(scope)) {
      results = results.concat(await PID.#docsFromWorld({ pidRegExp, type, lang, langFallback, progressBar, progressCurrent: 0, progressMax }))
    }
    if (['all', 'compendiums'].includes(scope)) {
      results = results.concat(await PID.#indexesFromCompendia({ pidRegExp, type, lang, langFallback, progressBar, progressCurrent: 1, progressMax }))
    }

    return results
  }

 /**
   * Get a list of all documents matching the PID regex and language from the world.
   * The document list is sorted with the highest priority first.
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param progressBar If true show v12 progress bar, if not false show v13 progress bar
   * @param progressCurrent Current Progress
   * @param progressMax Max Progress
   * @returns array
   */
  static async #docsFromWorld ({ pidRegExp, type, lang, langFallback, progressBar, progressCurrent, progressMax } = {}) {
    if (!pidRegExp) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }

    const gameProperty = PID.getGameProperty(`${type}..`)

    const candidateDocuments = game[gameProperty]?.filter((d) => {
      const pidFlag = d.getFlag('Pendragon', 'pidFlag')
      if (typeof pidFlag === 'undefined') {
        return false
      }
      return pidRegExp.test(pidFlag.id) && [lang, (langFallback ? 'en' : '-')].includes(pidFlag.lang)
    })

    progressCurrent++
    PID.#setProgressBar(progressBar, progressCurrent, progressMax)

    if (candidateDocuments === undefined) {
      return []
    }

    return candidateDocuments
  }

  /**
   * Get a list of all indexes matching the PID regex and language from the compendiums.
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param progressBar If true show v12 progress bar, if not false show v13 progress bar
   * @param progressCurrent Current Progress
   * @param progressMax Max Progress
   * @returns array
   */
  static async #indexesFromCompendia ({ pidRegExp, type, lang, langFallback, progressBar, progressCurrent, progressMax }) {
    if (!pidRegExp) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }

    const documentType = PID.getDocumentType(type).name
    let indexDocuments = []

    for (const pack of game.packs) {
      if (pack.documentName === documentType) {
        if (!pack.indexed) {
          await pack.getIndex()
        }
        indexDocuments = indexDocuments.concat(pack.index.filter((i) => {
          if (typeof i.flags?.Pendragon?.pidFlag?.id !== 'string') {
            return false
          }
          return pidRegExp.test(i.flags.Pendragon.pidFlag.id) && [lang, (langFallback ? 'en' : '-')].includes(i.flags.Pendragon.pidFlag.lang)
        }))
      }
      progressCurrent++
      PID.#setProgressBar(progressBar, progressCurrent, progressMax)
    }
    return indexDocuments
  }

  /**
   * Sort a list of document on PID priority - the highest first.
   * @example
   * aListOfDocuments.sort(PID.comparePIDPrio)
   */
  static #comparePIDPrio (a, b) {
    const ap = parseInt(a.flags.Pendragon.pidFlag.priority, 10)
    const bp = parseInt(b.flags.Pendragon.pidFlag.priority, 10)
    if (ap === bp) {
      const ao = a instanceof foundry.abstract.DataModel
      const bo = b instanceof foundry.abstract.DataModel
      if (ao === bo) {
        return 0
      } else {
        return (ao ? -1 : 1)
      }
    }
    return bp - ap
  }

  /**
   * Translates the first part of a PID to what those documents are called in the `game` object.
   * @param pid a single pid
   */
  static getGameProperty (pid) {
    const type = pid.split('.')[0]
    const gameProperty = PID.gamePropertyLookup[type]
    if (!gameProperty) {
      ui.notifications.warn(game.i18n.format('PEN.PIDFlag.error.incorrect.type'))
      console.log('Pendragon | ', pid)
      throw new Error()
    }
    return gameProperty
  }

  static get gamePropertyLookup () {
    return {
      a: 'actors',
      c: 'cards',
      i: 'items',
      je: 'journal',
      m: 'macros',
      p: 'playlists',
      rt: 'tables',
      s: 'scenes'
    }
  }

  /**
   * Translates the first part of a PID to what those documents are called in the `game` object.
   * @param pid a single pid
   */
  static getDocumentType (pid) {
    const type = pid.split('.')[0]
    const documentType = PID.documentNameLookup[type]
    if (!documentType) {
      ui.notifications.warn(game.i18n.format('PEN.PIDFlag.error.incorrect.type'))
      console.log('Pendragon | ', pid)
      throw new Error()
    }
    return documentType
  }

  static get documentNameLookup () {
    return {
      a: Actor,
      c: Card,
      i: Item,
      je: JournalEntry,
      m: Macro,
      p: Playlist,
      rt: RollTable,
      s: Scene
    }
  }

  /**
   * Replace indexes with their documents
   */
  static async #onlyDocuments (candidates, progressBar, progressCurrent, progressMax) {
    const len = candidates.length
    if (len > 0) {
      for (const offset in candidates) {
        if (!(candidates[offset] instanceof foundry.abstract.DataModel)) {
          candidates[offset] = await fromUuid(candidates[offset].uuid)
        }
        progressCurrent++
        PID.#setProgressBar(progressBar, progressCurrent, progressMax)
      }
    }
    return candidates
  }

  /**
   * Filter an array of index or documents.
   * If a PID has a version lang then remove the en versions
   */
  static #filterByLanguage (indexes, lang) {
    const ids = indexes.reduce((c, i) => {
      c[i.flags.Pendragon.pidFlag.id] = c[i.flags.Pendragon.pidFlag.id] || i.flags.Pendragon.pidFlag.lang === lang
      return c
    }, {})
    return indexes.filter(i => i.flags.Pendragon.pidFlag.lang !== 'en' || !ids[i.flags.Pendragon.pidFlag.id])
  }  

}  