export class StatsSelectDialog extends Dialog {
    activateListeners (html) {
      super.activateListeners(html)
  
      html.find('.up.rollable').click(async event => this._onSelectArrowClicked(event,1))
      html.find('.down.rollable').click(async event => this._onSelectArrowClicked(event,-1))
      html.find('.closecard').click(async event => this._shutdialog(event))
    }
  
    async _onSelectArrowClicked (event,change) {
      const chosen = event.currentTarget.closest('.large-icon')
      let choice = chosen.dataset.set
      //Don't allow spend over pointsMax
      if (this.data.data.added+change>this.data.data.pointsMax) {change=0}
      //Stats only allowed in range 8-15  
      if ((this.data.data.stats[choice].value + change) <8 || (this.data.data.stats[choice].value + change) > 15) {change = 0}
      //Change the stat value & points spent
      this.data.data.stats[choice].value = this.data.data.stats[choice].value + change
      this.data.data.added = this.data.data.added + change

      //Update points spent and the stats value on the form
      const form = event.currentTarget.closest('.stats-input')
      const divCount = form.querySelector('.count')
      divCount.innerText = this.data.data.added
      const statVal = form.querySelector('.item-'+choice)
      statVal.innerText = this.data.data.stats[choice].value
      const closecard = form.querySelector('.closecard')
      if (this.data.data.added >= this.data.data.pointsMax) {
        closecard.innerHTML = "<button class='proceed cardbutton' type='button'>"+game.i18n.localize('PEN.confirm')+"</button>" 
      } else {
        closecard.innerHTML = "<button class='cardbutton' type='button'>"+game.i18n.localize('PEN.spendPoints')+"</button>" 
      }  
    }
  
    async _shutdialog(event) {
      if (this.data.data.added >= this.data.data.pointsMax) {
        this.close()
      }
    }

    static async create (culture) {
      let destination = 'systems/Pendragon/templates/dialog/statsInput.html';
      let winTitle = game.i18n.localize("PEN.inputStats");
      let data = {stats:{
        siz: {value:10, label :game.i18n.localize('PENDRAGON.StatSiz')},
        dex: {value:10, label :game.i18n.localize('PENDRAGON.StatDex')},
        str: {value:10, label :game.i18n.localize('PENDRAGON.StatStr')},
        con: {value:10, label :game.i18n.localize('PENDRAGON.StatCon')},
        app: {value:10, label :game.i18n.localize('PENDRAGON.StatApp')}
      },
        culture,
        pointsMax:60,
        added : 50
      }
      const html = await renderTemplate(destination,data);
      
      return new Promise(resolve => {
        const dlg = new StatsSelectDialog(
          {
            title: winTitle,
            content: html,
            data,
            buttons: {},
            close: () => {
              if (data.added < data.pointsMax) return resolve(false)
              const selected = [data.stats]
              return resolve(selected)
            }
          },
          { classes: ['Pendragon', 'dialog', 'stats-select'] }
        )
        dlg.render(true)
      })

    }
  }