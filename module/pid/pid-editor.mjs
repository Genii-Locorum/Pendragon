import { PENDRAGON } from '../setup/config.mjs'
import { PENUtilities } from '../apps/utilities.mjs'

export class PIDEditor extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['Pendragon', 'dialog', 'pid-editor'],
      template: 'systems/Pendragon/templates/pid/pid-editor.html',
      width: 900,
      height: 'auto',
      title: 'PEN.PIDFlag.title',
      closeOnSubmit: false,
      submitOnClose: true,
      submitOnChange: true
    })
  }

  async getData () {
    const sheetData = super.getData()

    sheetData.supportedLanguages = CONFIG.supportedLanguages

    this.options.editable = this.object.sheet.isEditable

    sheetData.guessCode = game.system.api.pid.guessId(this.object)
    sheetData.idPrefix = game.system.api.pid.getPrefix(this.object)

    sheetData.pidFlag = this.object.flags?.Pendragon?.pidFlag

    sheetData.id = sheetData.pidFlag?.id || ''
    sheetData.lang = sheetData.pidFlag?.lang || game.i18n.lang
    sheetData.priority = sheetData.pidFlag?.priority || 0

    const PIDKeys = foundry.utils.flattenObject(game.i18n.translations.PEN.PIDFlag.keys ?? {})
    const prefix = new RegExp('^' + PENUtilities.quoteRegExp(sheetData.idPrefix))
    sheetData.existingKeys = Object.keys(PIDKeys).reduce((obj, k) => {
      if (k.match(prefix)) {
        obj.push({ k, name: PIDKeys[k] })
      }
      return obj
    }, []).sort(PENUtilities.sortByNameKey)

    sheetData.isSystemID = (typeof PIDKeys[sheetData.id] !== 'undefined')
    const match = sheetData.id.match(/^([^\\.]+)\.([^\\.]*)\.(.+)/)
    sheetData._existing = (match && typeof match[3] !== 'undefined' ? match[3] : '')

    if (sheetData.id && sheetData.lang) {
      // Find out if there exists a duplicate PID
      const worldDocuments = await game.system.api.pid.fromPIDAll({
        pid: sheetData.id,
        lang: sheetData.lang,
        scope: 'world'
      })
      const uniqueWorldPriority = {}
      sheetData.worldDocumentInfo = await Promise.all(worldDocuments.map(async (d) => {
        return {
          priority: d.flags.Pendragon.pidFlag.priority,
          lang: d.flags.Pendragon.pidFlag.lang ?? 'en',
          link: await TextEditor.enrichHTML(d.link, { async: true }),
          folder: d?.folder?.name
        }
      }))
      const uniqueWorldPriorityCount = new Set(worldDocuments.map((d) => d.flags.Pendragon.pidFlag.priority)).size;
      if (uniqueWorldPriorityCount !== worldDocuments.length) {
        sheetData.warnDuplicateWorldPriority = true;
      }
      sheetData.worldDuplicates = worldDocuments.length ?? 0

      const compendiumDocuments = await game.system.api.pid.fromPIDAll({
        pid: sheetData.id,
        lang: sheetData.lang,
        scope: 'compendiums'
      })
      const uniqueCompendiumPriority = {}
      sheetData.compendiumDocumentInfo = await Promise.all(compendiumDocuments.map(async (d) => {
        return {
          priority: d.flags.Pendragon.pidFlag.priority,
          lang: d.flags.Pendragon.pidFlag.lang ?? 'en',
          link: await TextEditor.enrichHTML(d.link, { async: true }),
          folder: d?.folder?.name ?? ''
        }
      }))

      const uniqueCompendiumPriorityCount = new Set(compendiumDocuments.map((d) => d.flags.Pendragon.pidFlag.priority)).size;
      if (uniqueCompendiumPriorityCount !== compendiumDocuments.length) {
        sheetData.warnDuplicateCompendiumPriority = true;
      }
      sheetData.compendiumDuplicates = compendiumDocuments.length ?? 0
    } else {
      sheetData.compendiumDocumentInfo = []
      sheetData.worldDocumentInfo = []
      sheetData.worldDuplicates = 0
      sheetData.compendiumDuplicates = 0
      sheetData.warnDuplicateWorldPriority = false
      sheetData.warnDuplicateCompendiumPriority = false
    }
    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)

    html.find('a.copy-to-clipboard').click(function (e) {
      PENUtilities.copyToClipboard($(this).siblings('input').val())
    })

    if (!this.object.sheet.isEditable) return

    html.find('input[name=_existing').change(function (e) {
      const obj = $(this)
      const prefix = obj.data('prefix')
      let value = obj.val()
      if (value !== '') {
        value = prefix + PENUtilities.toKebabCase(value)
      }
      html.find('input[name=id]').val(value).trigger('change')
    })

    html.find('select[name=known]').change(function (e) {
      const obj = $(this)
      html.find('input[name=id]').val(obj.val())
    })

    html.find('a[data-guess]').click(async function (e) {
      e.preventDefault()
      const obj = $(this)
      const guess = obj.data('guess')
      html.find('input[name=id]').val(guess).trigger('change')
    })
  }

  async _updateObject (event, formData) {
    const id = formData.id || ''
    await this.object.update({
      'flags.Pendragon.pidFlag.id': id,
      'flags.Pendragon.pidFlag.lang': formData.lang || game.i18n.lang,
      'flags.Pendragon.pidFlag.priority': formData.priority || 0
    })
    const html = $(this.object.sheet.element).find('header.window-header a.header-button.edit-pid-warning,header.window-header a.header-button.edit-pid-exisiting')
    if (html.length) {
      html.css({
        color: (id ? 'var(--color-text-light-highlight)' : 'red')
      })
    }
    this.render()
  }

}  