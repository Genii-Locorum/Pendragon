import { PENCombat } from "../../apps/combat.mjs";

const { api } = foundry.applications;

export class WoundTrackerDialog extends api.HandlebarsApplicationMixin(
  api.DocumentSheetV2
) {
  constructor(actor, options = {}) {
    options.document = actor;
    super(options);
    this.actor = actor;
  }
  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'wound-tracker', 'character2'],
    tag: "form",
    // automatically updates the item
    form: {
      submitOnChange: false,
      closeOnSubmit: false,
      handler: WoundTrackerDialog.#savePointSpend
    },
    window: {
      resizable: true,
      title: "PEN.wounds"
    },
    actions: {
      addWound: WoundTrackerDialog.#addWound,
      editWound: WoundTrackerDialog.#editWound,
      deleteWound: WoundTrackerDialog.#deleteWound,
      directDamage: WoundTrackerDialog.#directDamage,
      applyFirstAid: WoundTrackerDialog.#applyFirstAid,
      naturalHealing: WoundTrackerDialog.#naturalHealing,
      healOverTime: WoundTrackerDialog.#healOverTime,
    }
  }

  static PARTS = {
    form: {
      template: "systems/Pendragon/templates/actor/character/wounds.hbs"
    },
  }

  // add a new wound
  static #addWound(event, target) {
    const dmg = target.previousElementSibling;
    if (dmg.value > 0) {
      const val = Number(dmg.value);
      // add the wound
      PENCombat.addStandardWound(this.actor, val);
      dmg.value = "";
    }
  }
  // edit a wound (change the damage)
  static #editWound(event, target) {
  }
  // add a new wound
  static #deleteWound(event, target) {
  }
  // take aggravation or other direct damage
  static async #directDamage(event, target) {
    const dmg = target.nextElementSibling;
    if (dmg.value > 0) {
      const val = Number(dmg.value);
      // add the wound
      await this.actor.update({ 'system.aggravDam': this.actor.system.aggravDam + val });
      dmg.value = "";
    }
  }
  // apply the results of first aid to a wound
  static #applyFirstAid(event, target) {
    // dialog: first aid result: Crit/Success/Fail/Fumble
    // 2*hr/hr/0/-1d3, also debilitated
  }
  // apply one week natural healing
  static #naturalHealing(event, target) {
    //if debilitated, then dialog: chirurgery result: crit/success/failure/Fumble
    // hr/0/-1d6/-2d6
    // +hr
    // if at least one success since becoming debilitated AND > 1/2 hp, recover
  }
  // apply multiple weeks of natural healing
  static #healOverTime(event, target) {
    // dialog: chirurgery skill, number of weeks
  }


  // save the point spend
  static async #savePointSpend(event, form, formData) {

  }

  async _prepareContext(options) {
    const context = {
      ...await super._prepareContext(options),
      system: this.actor.system,
      wounds: this.actor.items.filter(itm => itm.type === 'wound'),
      buttons: [
        { type: "submit", label: "PEN.spendPoints" },
      ]
    }
    return context;
  }
}
