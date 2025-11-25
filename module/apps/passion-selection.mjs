// this dialog is used to allocate points to passions
// both raising and lowering passions costs points
export class PassionsSelectDialog extends Dialog {
  activateListeners(html) {
    super.activateListeners(html);

    html
      .find(".up.rollable")
      .click(async (event) => this._onSelectArrowClicked(event, 1));
    html
      .find(".down.rollable")
      .click(async (event) => this._onSelectArrowClicked(event, -1));
    html.find(".closecard").click(async (event) => this._shutdialog(event));
  }

  async _onSelectArrowClicked(event, change) {
    const chosen = event.currentTarget.closest(".large-icon");
    let choice = chosen.dataset.set;
    let newCap = 0;
    const chosenPassion = this.data.data.passions[choice];

    //Normally stats only allowed in range min - max
    // you can lower a passion that is already over the max
    if (
      chosenPassion.value + change <
        chosenPassion.min ||
      (chosenPassion.value + change >
        chosenPassion.max && chosenPassion.value > chosenPassion.origValue)
    ) {
      change = 0;
      return;
    }

    //Change the stat value & points spent
    if (chosenPassion.value + change == chosenPassion.origValue)
    {
      newCap = this.data.data.added - Math.abs(change);
      console.log(`cap: ${this.data.data.cap} change: ${change} newcap: ${newCap}`)
    }
    else
    {
      newCap = this.data.data.added + Math.abs(change);
      console.log(`cap: ${this.data.data.cap} change: ${change} newcap: ${newCap}`)
    }

    //If you don't breach the Max Points then update (otherwise ignore)
    if (newCap <= this.data.data.pointsMax) {
      chosenPassion.value =
        Number(chosenPassion.value) + change;
      this.data.data.added = newCap;

      //Update points spent and the stats value on the form
      const form = event.currentTarget.closest(".stats-input");
      const divCount = form.querySelector(".count");
      divCount.innerText = this.data.data.added;
      const statVal = form.querySelector(".item-" + choice);
      statVal.innerText = chosenPassion.value;
      const closecard = form.querySelector(".closecard");
      const upArrow = form.querySelector(".inc-" + choice);
      const downArrow = form.querySelector(".dec-" + choice);
      if (
        chosenPassion.value >=
        chosenPassion.max && chosenPassion.value >= chosenPassion.origValue
      ) {
        upArrow.innerHTML = "&nbsp";
      } else {
        upArrow.innerHTML = "<i class='fas fa-circle-up'></i>";
      }
      if (
        chosenPassion.value <=
        chosenPassion.min && chosenPassion.value <= chosenPassion.origValue
      ) {
        downArrow.innerHTML = "&nbsp";
      } else {
        downArrow.innerHTML = "<i class='fas fa-circle-down'></i>";
      }
      if (newCap >= this.data.data.pointsMax) {
        closecard.innerHTML =
          "<button class='proceed cardbutton' type='button'>" +
          game.i18n.localize("PEN.confirm") +
          "</button>";
      } else {
        closecard.innerHTML =
          "<button class='cardbutton' type='button'>" +
          game.i18n.localize("PEN.spendPoints") +
          "</button>";
      }
    }
  }

  async _shutdialog(event) {
    if (this.data.data.added >= this.data.data.pointsMax) {
      this.close();
    }
  }

  static async create(title, passions, points, cap) {
    let destination = "systems/Pendragon/templates/dialog/passionsInput.hbs";
    let winTitle = title;
    let data = {
      courts: [
        {name: "adoratio", label: game.i18n.localize("PEN.adoratio")},
        {name:"civilitas", label: game.i18n.localize("PEN.civilitas")},
        {name:"fervor", label: game.i18n.localize("PEN.fervor")},
        {name:"fidelitas", label: game.i18n.localize("PEN.fidelitas")},
        {name:"honor", label: game.i18n.localize("PEN.honor")}
      ],
      passions,
      pointsMax: points,
      added: 0,
      cap: cap,
    };
    const html = await foundry.applications.handlebars.renderTemplate(destination, data);

    return new Promise((resolve) => {
      const dlg = new PassionsSelectDialog(
        {
          title: winTitle,
          content: html,
          data,
          buttons: {},
          close: () => {
            if (data.added < data.pointsMax) return resolve(false);
            const selected = data.passions;
            return resolve(selected);
          },
        },
        { classes: ["Pendragon", "dialog", "stats-select"] }
      );
      dlg.render(true);
    });
  }
}
