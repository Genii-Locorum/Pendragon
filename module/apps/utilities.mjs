

export class PENUtilities {

  //Generic Confirmation Dialogue Box
  static async confirmation(title) {
    let confirmation = await Dialog.confirm({
        title: title,
        content: game.i18n.localize('PEN.proceed')+"<div></div><br>",
        });
      return confirmation;
    }

  static async getDataFromDropEvent (event, entityType = 'Item') {
    if (event.originalEvent) return []
    try {
      const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
      if (dataList.type === 'Folder' && dataList.documentName === entityType) {
        const folder = await fromUuid(dataList.uuid)
        if (!folder) return []
        return folder.contents
      } else if (dataList.type === entityType) {
        const item = await fromUuid(dataList.uuid)
        if (!item) return []
        return [item]
      } else {
        return []
      }
    } catch (err) {
      return []
    }
  }

  static toKebabCase (s) {
    if (!s) {
      return ''
    }
    const match = s.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)

    if (!match) {
      return ''
    }

    return match.join('-').toLowerCase()
  }


  static async copyToClipboard (text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999px'
        textArea.style.top = '-999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        return new Promise((resolve, reject) => {
          document.execCommand('copy')
            ? resolve()
            : reject(
              new Error(game.i18n.localize('PEN.UnableToCopyToClipboard'))
            )
          textArea.remove()
        }).catch(err => ui.notifications.error(err))
      }
    } catch (err) {
      ui.notifications.error(game.i18n.localize('PEN.UnableToCopyToClipboard'))
    }
  }  


  static quoteRegExp (string) {
    // https://bitbucket.org/cggaertner/js-hacks/raw/master/quote.js
    const len = string.length
    let qString = ''

    for (let current, i = 0; i < len; ++i) {
      current = string.charAt(i)

      if (current >= ' ' && current <= '~') {
        if (current === '\\' || current === "'") {
          qString += '\\'
        }

        qString += current.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
      } else {
        switch (current) {
          case '\b':
            qString += '\\b'
            break

          case '\f':
            qString += '\\f'
            break

          case '\n':
            qString += '\\n'
            break

          case '\r':
            qString += '\\r'
            break

          case '\t':
            qString += '\\t'
            break

          case '\v':
            qString += '\\v'
            break

          default:
            qString += '\\u'
            current = current.charCodeAt(0).toString(16)
            for (let j = 4; --j >= current.length; qString += '0');
            qString += current
        }
      }
    }
    return qString
  }
  

  static sortByNameKey (a, b) {
    return a.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .localeCompare(
        b.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase()
      )
  }  

  //Make a dice roll, display it if Dice So Nice active and return the result
  static async simpleDiceRoll (formula) {
    let roll = new Roll (formula)
    await roll.evaluate()
    let result = roll.total  
    if (game.modules.get('dice-so-nice')?.active) {
      game.dice3d.showForRoll(roll,game.user,true,null,false)
    }
    return result
  }

  //Make a dice roll, display it if Dice So Nice active and return the whole roll
  static async complexDiceRoll (formula) {
    let roll = new Roll (formula)
    await roll.evaluate()
    if (game.modules.get('dice-so-nice')?.active) {
      game.dice3d.showForRoll(roll,game.user,true,null,false)
    }
    return roll
  }

  //Make a table roll display if Dice so Nice active and return the roll
  static async tableDiceRoll (table) {
    const tableResults = await table.roll();
    if (game.modules.get('dice-so-nice')?.active) {
      game.dice3d.showForRoll(tableResults.roll,game.user,true,null,false)
    }
    return tableResults
  }

}
