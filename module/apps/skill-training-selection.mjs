const { api } = foundry.applications;

export class SkillTrainingDialog extends api.HandlebarsApplicationMixin(
  api.ApplicationV2
) {
  constructor(actor, skills, trainingRoute, points, options = {}) {
    super(options);
    this.actor = actor;
    this.skills = skills;
    this.amount = {points: points, spent: 0, remaining: points};
    this.trainingRoute = trainingRoute;
  }
  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'winter-selector'],
    tag: "form",
    // automatically updates the item
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: SkillTrainingDialog.#savePointSpend
    },
    window: {
      resizable: true,
      title: "PEN.training"
    },
    actions: {
      spendPoint: SkillTrainingDialog.#spendPoint,
      refundPoint: SkillTrainingDialog.#refundPoint,
    }
  }

  static PARTS = {
    form: {
      template: "systems/Pendragon/templates/dialog/skillsInput.hbs"
    },
    footer: {
        template: "templates/generic/form-footer.hbs",
    }
  }

  // spend a training point
  static #spendPoint(event, target) {
    const chosen = target;
    const choice = chosen.dataset.set;
    const skill = this.skills[choice];
    if(skill.cost > this.amount.remaining) {
      // don't spend it if we can't afford it
      return;
    }
    skill.value += 1;
    this.amount.spent += skill.cost;
    this.amount.remaining -= skill.cost;
    this.render();
  }
  
  // refund a training point
  static #refundPoint(event, target) {
    if(this.amount.spent <= 0) {
      // can't refund points that weren't spent
      return;
    }
    const chosen = target;
    const choice = chosen.dataset.set;
    const skill = this.skills[choice];
    skill.value -= 1;
    this.amount.spent -= skill.cost;
    this.amount.remaining += skill.cost;
    this.render();
  }

  // save the point spend
  static async #savePointSpend(event, form, formData) {
    const selected = this.skills.filter(s => s.value != s.orig);
    if (selected.length < 1) {
      ui.notifications.warn(game.i18n.localize('PEN.noSelection'));
      return;
    }

    const historyChanges = [];
    for (const picked of selected) {
      const item = this.actor.items.get(picked.itemID);
      const delta = picked.value - picked.orig;
      historyChanges.push(`${item.name}(${delta})`);
      await item.update({'system.winter': Number(item.system.winter) + Number(delta)});
    }
    // record that training has taken place
    const isPrestige = this.trainingRoute === "prestige";
    if(isPrestige) {
      await this.actor.update({'system.prestige': this.actor.system.prestige + 1});
    } else {
      await this.actor.update ({'system.status.train' :false});

    }
    const eventLabel = isPrestige ? game.i18n.localize("PEN.prestigeAward") : game.i18n.localize("PEN.training");
    const history = `${eventLabel}: ${historyChanges.join(", ")}`;
    await this.actor.addHistoryEvent(history, history, 0);
  }

  async _prepareContext (options) {
    const context = {
      ...await super._prepareContext(options),
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      options: this.skills,
      amount: this.amount,
      prestige: this.trainingRoute === 'prestige',
      buttons: [
          { type: "submit", label: "PEN.spendPoints" },
      ]
    }

    return context;
  }
}