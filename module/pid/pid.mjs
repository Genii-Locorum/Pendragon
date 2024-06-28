/* global Actor, Card, CONFIG, foundry, game, Item, JournalEntry, Macro, Playlist, RollTable, Scene, SceneNavigation, ui */
import { PENDRAGON } from '../setup/config.mjs'
import { PENUtilities } from '../apps/utilities.mjs'

export class PID {
  static init () {
    CONFIG.Actor.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    CONFIG.Item.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    CONFIG.JournalEntry.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    // CONFIG.Macro.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    CONFIG.RollTable.compendiumIndexFields.push('flags.Pendragon.pidFlag')
    game.system.api = {
      pid: PID
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
   * Returns all items with matching PIDs, and language
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
        ui.notifications.warn(game.i18n.format('PEEN.PIDFlag.error.documents-not-found', { pids: pids.filter(x => !notmissing.includes(x)).join(', '), lang}))
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
    const PIDKeys = foundry.utils.flattenObject(game.i18n.translations.PEN.PIDFlag.keys)
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
   * Returns all documents with an PID matching the regex and matching the document type
   * and language, from the specified scope.
   * Empty array return for no matches
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ('en', 'es', ...)
   * @param scope defines where it will look:
   * **match** same logic as fromPID function,
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   * @returns array
   */
  static async fromPIDRegexAll ({ pidRegExp, type, lang = game.i18n.lang, scope = 'match', langFallback = true, showLoading = false } = {}) {
    if (!pidRegExp) {
      return []
    }
    const result = []

    let count = 0
    if (showLoading) {
      if (['match', 'all', 'world'].includes(scope)) {
        count++
      }
      if (['match', 'all', 'compendiums'].includes(scope)) {
        count = count + game.packs.size
      }
    }

    if (['match', 'all', 'world'].includes(scope)) {
      const worldDocuments = await PID.documentsFromWorld({ pidRegExp, type, lang, langFallback, progressBar: count })
      if (scope === 'match' && worldDocuments.length) {
        if (showLoading) {
          SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: 100 })
        }
        return this.filterAllPID(worldDocuments, langFallback && lang !== 'en')
      }
      result.splice(0, 0, ...worldDocuments)
    }

    if (['match', 'all', 'compendiums'].includes(scope)) {
      const compendiaDocuments = await PID.documentsFromCompendia({ pidRegExp, type, lang, langFallback, progressBar: count })
      result.splice(result.length, 0, ...compendiaDocuments)
    }

    if (showLoading) {
      SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: 100 })
    }

    return this.filterAllPID(result, langFallback && lang !== 'en')
  }

  /**
   * Returns all documents with a PID, and language.
   * Empty array return for no matches
   * @param pid a single pid
   * @param lang the language to match against ('en', 'es', ...)
   * @param scope defines where it will look:
   * **match** same logic as fromPID function,
   * **all**: find in both world & compendia,
   * **world**: only search in world,
   * **compendiums**: only search in compendiums
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   * @returns array
   */
  static async fromPIDAll ({ pid, lang = game.i18n.lang, scope = 'match', langFallback = true, showLoading = false } = {}) {
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
    return PID.fromPIDRegexAll({ pidRegExp: new RegExp('^' + PENUtilities.quoteRegExp(pid) + '$'), type: parts[1], lang, scope, langFallback, showLoading })
  }

  /**
   * Gets only the highest priority documents for each PID that matches the RegExp and
   * language, with the highest priority documents in the World taking precedence over
   * any documents in compendium packs.
   * Empty array return for no matches
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ("en", "es", ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param showLoading Show loading bar
   */
  static async fromPIDRegexBest ({ pidRegExp, type, lang = game.i18n.lang, langFallback = true, showLoading = false } = {}) {

    const allDocuments = await this.fromPIDRegexAll({ pidRegExp, type, lang, scope: 'all', langFallback, showLoading })
    const bestDocuments = this.filterBestPID(allDocuments)
    return bestDocuments
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
   * Gets only the highest priority document for PID that matches the language,
   * with the highest priority documents in the World taking precedence over
   * any documents
   * in compendium packs.
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
   * For an array of documents already processed by filterAllPID, returns only those that are the "best" version of their PID
   * @param documents
   * @returns
   */
  static filterBestPID (documents) {
    const bestMatchDocuments = new Map()
    for (const doc of documents) {
      const docPID = doc.getFlag('Pendragon', 'pidFlag')?.id
      if (docPID) {
        const currentDoc = bestMatchDocuments.get(docPID)
        if (typeof currentDoc === 'undefined') {
          bestMatchDocuments.set(docPID, doc)
          continue
        }

        // Prefer pack === '' if possible
        const docPack = (doc.pack ?? '')
        const existingPack = (currentDoc?.pack ?? '')
        const preferWorld = docPack === '' || existingPack !== ''
        if (!preferWorld) {
          continue
        }

        // Prefer highest priority
        let docPriority = parseInt(doc.getFlag('Pendragon', 'pidFlag')?.priority ?? Number.MIN_SAFE_INTEGER, 10)
        docPriority = isNaN(docPriority) ? Number.MIN_SAFE_INTEGER : docPriority
        let existingPriority = parseInt(currentDoc.getFlag('Pendragon', 'pidFlag')?.priority ?? Number.MIN_SAFE_INTEGER, 10)
        existingPriority = isNaN(existingPriority) ? Number.MIN_SAFE_INTEGER : existingPriority
        const preferPriority = docPriority >= existingPriority
        if (!preferPriority) {
          continue
        }

        bestMatchDocuments.set(docPID, doc)
      }
    }
    return [...bestMatchDocuments.values()]
  }

  /**
   * For an array of documents, returns filter out en documents if a translated one exists
   * @param documents
   * @param langFallback should the system fall back to en in case there is no translation
   * @returns
   */
  static filterAllPID (documents, langFallback) {
    if (!langFallback) {
      return documents
    }
    const bestMatchDocuments = new Map()
    for (const doc of documents) {
      const docPID = doc.getFlag('Pendragon', 'pidFlag')?.id
      if (docPID) {
        let docPriority = parseInt(doc.getFlag('Pendragon', 'pidFlag')?.priority ?? Number.MIN_SAFE_INTEGER, 10)
        docPriority = isNaN(docPriority) ? Number.MIN_SAFE_INTEGER : docPriority
        const key = docPID + '/' + (isNaN(docPriority) ? Number.MIN_SAFE_INTEGER : docPriority)

        const currentDoc = bestMatchDocuments.get(key)
        if (typeof currentDoc === 'undefined') {
          bestMatchDocuments.set(key, doc)
          continue
        }

        const docLang = doc.getFlag('Pendragon', 'pidFlag')?.lang ?? 'en'
        const existingLang = currentDoc?.getFlag('Pendragon', 'pidFlag')?.lang ?? 'en'
        if (existingLang === 'en' && existingLang !== docLang) {
          bestMatchDocuments.set(key, doc)
        }
      }
    }
    return [...bestMatchDocuments.values()]
  }

  /**
   * Get a list of all documents matching the PID regex, and language.
   * The document list is sorted with the highest priority first.
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param progressBar If greater than zero show percentage
   * @returns array
   */
  static async documentsFromWorld ({ pidRegExp, type, lang = game.i18n.lang, langFallback = true, progressBar = 0 } = {}) {
    if (!pidRegExp) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }

    if (progressBar > 0) {
      SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: Math.floor(100 / progressBar) })
    }

    const gameProperty = PID.getGameProperty(`${type}..`)

    const candidateDocuments = game[gameProperty]?.filter((d) => {
      const pidFlag = d.getFlag('Pendragon', 'pidFlag')
      if (typeof pidFlag === 'undefined') {
        return false
      }
      return pidRegExp.test(pidFlag.id) && [lang, (langFallback ? 'en' : '-')].includes(pidFlag.lang)
    })

    if (candidateDocuments === undefined) {
      return []
    }

    return candidateDocuments.sort(PID.comparePIDPrio)
  }
  
  /**
   * Get a list of all documents matching the PID regex, and language from the compendiums.
   * The document list is sorted with the highest priority first.
   * @param pidRegExp regex used on the PID
   * @param type the first part of the wanted PID, for example 'i', 'a', 'je'
   * @param lang the language to match against ('en', 'es', ...)
   * @param langFallback should the system fall back to en incase there is no translation
   * @param progressBar If greater than zero show percentage
   * @returns array
   */
  static async documentsFromCompendia ({ pidRegExp, type, lang = game.i18n.lang, langFallback = true, progressBar = 0 }) {
    if (!pidRegExp) {
      return []
    }
    if (lang === '') {
      lang = game.i18n.lang
    }

    const documentType = PID.getDocumentType(type).name
    const candidateDocuments = []

    let count = 1
    for (const pack of game.packs) {
      if (progressBar > 0) {
        SceneNavigation.displayProgressBar({ label: game.i18n.localize('SETUP.PackagesLoading'), pct: Math.floor(count * 100 / progressBar) })
        count++
      }
      if (pack.documentName === documentType) {
        if (!pack.indexed) {
          await pack.getIndex()
        }
        const indexInstances = pack.index.filter((i) => {
          const pidFlag = i.flags?.Pendragon?.pidFlag
          if (typeof pidFlag === 'undefined') {
            return false
          }
          return pidRegExp.test(pidFlag.id) && [lang, (langFallback ? 'en' : '-')].includes(pidFlag.lang)
        })
        for (const index of indexInstances) {
          const document = await pack.getDocument(index._id)
          if (!document) {
            const msg = game.i18n.format('PEN.PIDFlag.error.document-not-found', {
              pid: pidRegExp,
              lang,
            })
            ui.notifications.error(msg)
            console.log('Pendragon |', msg, index)
            throw new Error()
          } else {
            candidateDocuments.push(document)
          }
        }
      }
    }
    return candidateDocuments.sort(PID.comparePIDPrio)
  }  

  /**
   * Sort a list of document on PID priority - the highest first.
   * @example
   * aListOfDocuments.sort(PID.comparePIDPrio)
   */
  static comparePIDPrio (a, b) {
    return (
      b.getFlag('Pendragon', 'pidFlag')?.priority -
      a.getFlag('Pendragon', 'pidFlag')?.priority
    )
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
}  