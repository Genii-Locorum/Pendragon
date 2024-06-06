export class TraitsSelectDialog extends Dialog {
    activateListeners (html) {
      super.activateListeners(html)
  
      html.find('.up.rollable').click(async event => this._onSelectArrowClicked(event,1))
      html.find('.down.rollable').click(async event => this._onSelectArrowClicked(event,-1))
      html.find('.closecard').click(async event => this._shutdialog(event))
    }
  
    async _onSelectArrowClicked (event,change) {
      const chosen = event.currentTarget.closest('.large-icon')
      let choice = chosen.dataset.set
      let newCap = 0

      

      //Stats only allowed in range min - max  
      if (this.data.data.cap && (this.data.data.traits[choice].value + change) < this.data.data.traits[choice].origVal) {change = 0}
      if ((this.data.data.traits[choice].value + change) <this.data.data.traits[choice].minVal || (this.data.data.traits[choice].value + change) > this.data.data.traits[choice].maxVal) {change = 0}
      
      //Change the stat value & points spent
      if (this.data.data.cap) {
        newCap = this.data.data.added + change
      } else {
        for (let itm of this.data.data.traits) {
          newCap = newCap + Math.abs(Number(itm.value)-Number(itm.origVal))    
        }
        if (this.data.data.traits[choice].value > this.data.data.traits[choice].origVal) {
          newCap = newCap + change
        } else if (this.data.data.traits[choice].value < this.data.data.traits[choice].origVal) {
          newCap = newCap - change
        } else {
          newCap = newCap + Math.abs(change)
        }  
      }

      //If you don't breach the Max Points then update (otherwise ignore)
      if (newCap <= this.data.data.pointsMax) {
        this.data.data.traits[choice].value = Number(this.data.data.traits[choice].value) + change
        this.data.data.added = newCap
      
        //Update points spent and the stats value on the form
        const form = event.currentTarget.closest('.stats-input')
        const divCount = form.querySelector('.count')
        divCount.innerText = this.data.data.added
        const statVal = form.querySelector('.item-'+choice)
        statVal.innerText = this.data.data.traits[choice].value
        const closecard = form.querySelector('.closecard')
        const upArrow = form.querySelector('.inc-'+choice)
        const downArrow = form.querySelector('.dec-'+choice)
        if (this.data.data.traits[choice].value >= this.data.data.traits[choice].maxVal){
          upArrow.innerHTML = "&nbsp"
        }else {
          upArrow.innerHTML = "<i class='fas fa-circle-up'></i>"
        }
        if (this.data.data.traits[choice].value <= this.data.data.traits[choice].minVal){
          downArrow.innerHTML = "&nbsp"
        }else {
          downArrow.innerHTML = "<i class='fas fa-circle-down'></i>"
        }
        if (newCap >= this.data.data.pointsMax) {
          closecard.innerHTML = "<button class='proceed cardbutton' type='button'>"+game.i18n.localize('PEN.confirm')+"</button>" 
        } else {
          closecard.innerHTML = "<button class='cardbutton' type='button'>"+game.i18n.localize('PEN.spendPoints')+"</button>" 
        }  
      }

    }

    async _shutdialog(event) {
      if (this.data.data.added >= this.data.data.pointsMax) {
        this.close()
      }
    }
  
    static async create (traits,points,cap,name) {
      let destination = 'systems/Pendragon/templates/dialog/traitsInput.html';
      let winTitle = game.i18n.format("PEN.inputTraits",{name: name});
      let data = {
        traits,
        pointsMax: points,
        added : 0,
        cap: cap
      }
      const html = await renderTemplate(destination,data);
      
      return new Promise(resolve => {
        const dlg = new TraitsSelectDialog(
          {
            title: winTitle,
            content: html,
            data,
            buttons: {},
            close: () => {
              if (data.added < data.pointsMax) return resolve(false)
              const selected = data.traits
              return resolve(selected)
            }
          },
          { classes: ['Pendragon', 'dialog', 'stats-select'] }
        )
        dlg.render(true)
      })

    }
  }