import { PENCombat } from "../../apps/combat.mjs";
import { PENUtilities } from "../../apps/utilities.mjs";
import { PendragonStatusEffects } from "../../apps/status-effects.mjs";

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
  static async #applyFirstAid(event, target) {
    const { itemid } = target.closest("[data-itemid]")?.dataset ?? {};
    const wound = this.actor.items.get(itemid);
    const result = await api.DialogV2.wait({
      window: { title: "Treat Wound" },
      content: "<p>What is the result of the First Aid check?</p>",
      buttons: [
        {
          label: "Critical",
          action: "critical",
        },
        {
          label: "Success",
          action: "success",
        },
        {
          label: "Failure",
          action: "fail",
          default: true
        },
        {
          label: "Fumble",
          action: "fumble",
        },
      ]
    });
    let healing = 0;
    const healingRate = this.actor.system.healRate;
    switch (result) {
      case "critical":
        healing = 2 * healingRate;
        break;
      case "success":
        healing = healingRate;
        break;
      case "fail":
        break;
      case "fumble":
        const dmg = await PENUtilities.simpleDiceRoll("1d3");
        healing = -1 * Number(dmg);
        // on a fumble, the patient is debilitated
        await this.actor.addStatus(PendragonStatusEffects.DEBILITATED);
        break;
      default:
        // unrecognized or null - do nothing
        return;
    }
    // if enough to heal the entire wound, just delete it and finish
    if (healing >= wound.system.value) {
      wound.delete();
      return;
    }
    // apply healing and mark treated
    wound.update({
      'system.value': wound.system.value - healing,
      'system.treated': true
    });
  }
  // apply one week natural healing
  static async #naturalHealing(event, target) {
    const debilitated = this.actor.statuses.has(PendragonStatusEffects.DEBILITATED);
    let deterioration = 0;
    let markSuccessfulChirurgery = false;
    if (debilitated) {
      let healing = 0;
      const healingRate = this.actor.system.healRate;
      const result = await api.DialogV2.wait({
        window: { title: "Chirurgery" },
        content: "<p>What is the result of this week's Chirurgery check?</p>",
        buttons: [
          {
            label: "Critical",
            action: "critical",
          },
          {
            label: "Success",
            action: "success",
          },
          {
            label: "Failure",
            action: "fail",
            default: true
          },
          {
            label: "Fumble",
            action: "fumble",
          },
        ]
      });
      switch (result) {
        case "critical":
          await PENCombat.applyNaturalHealing(this.actor);
          markSuccessfulChirurgery = true;
          break;
        case "success":
          markSuccessfulChirurgery = true;
          break;
        case "fail":
          const dmg = await PENUtilities.simpleDiceRoll("1d6");
          deterioration = Number(dmg);
          break;
        case "fumble":
          const fumble_dmg = await PENUtilities.simpleDiceRoll("2d6");
          deterioration = Number(fumble_dmg);
          break;
        default:
          // unrecognized or null - do nothing
          return;
      }
    }
    await PENCombat.applyNaturalHealing(this.actor, deterioration, markSuccessfulChirurgery);
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
    context.conditions = CONFIG.statusEffects.map(c => {
      // check to see if the status effect has been applied to the actor
      const hasCondition = this.actor.statuses.has(c.id);
      return {
        id: c.id,
        name: game.i18n.localize(`PEN.${c.name}`),
        img: c.img,
        active: hasCondition
      }
    }).reduce((acc, o, index) => { acc[o.id] = o; return acc; }, {});
    return context;
  }
}
