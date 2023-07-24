
export class WinterSelectDialog extends Dialog {
    activateListeners (html) {
      super.activateListeners(html)
  
      html
        .find('.winter-choice').click(async event => this._onSelectChoice(event))
    }
  
    async _onSelectChoice (event) {
      const li = event.currentTarget
      const chosen = Number(li.dataset.index)
      
      //Check that the choice does not exceed the max/min allowed
      let newScore = Number(this.data.data.options[chosen].choice) + Number(this.data.data.options[chosen].value) + Number(li.dataset.choice);
      if (newScore < this.data.data.options[chosen].min || newScore > this.data.data.options[chosen].max) {
        return
      }


      //Set the skill etc that's chosen and update the points spent
      this.data.data.options[chosen].choice = Number(this.data.data.options[chosen].choice) + Number(li.dataset.choice)
      this.data.data.added = Number(this.data.data.added) + Number(li.dataset.choice)
      
      //Find the value and the points spent on the Form and update them
      const form = event.currentTarget.closest('.winter-selector')
      const divCount = form.querySelector('.count')
      const lineChoice = form.querySelector("[data-line=" + CSS.escape(chosen) + "]");
      divCount.innerText = this.data.data.added
      lineChoice.innerText = Number(this.data.data.options[chosen].choice) + Number(this.data.data.options[chosen].value)
      
      //If the absolute value of points spent >= the amount allowed to be spent then close the form
      if (Math.abs(this.data.data.added) >= this.data.data.amount) {
        this.close()
      }
    }  
  
    static async create (title,options, actorName, amount){
      let data = {
        speaker: ChatMessage.getSpeaker({ actor: actorName }),
        options: options,
        amount: amount,
        added: 0
      }
      const html = await renderTemplate(
        'systems/Pendragon/templates/dialog/winterOptions.html',
        data
      )       
      return new Promise(resolve => {
        let formData = null
        const dlg = new WinterSelectDialog({
          title: title,
          content: html,
          data,
          buttons: {},
        default: '',
        close: () => {
          if (!Math.abs(data.added) >= data.amount) return resolve(false)
          const selected = data.options.filter(option => (option.choice != 0))
          return resolve(selected)  
        }
        },{classes: ["Pendragon", "sheet"], width: 430})
        dlg.render(true);
      })
    }
  }