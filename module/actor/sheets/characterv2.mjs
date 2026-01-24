import { PENCombat } from "../../apps/combat.mjs";
import { PENWinter } from "../../apps/winterPhase.mjs";
import { PENCharCreate } from "../../apps/charCreate.mjs";
import { PENactorItemDrop } from "../actor-itemDrop.mjs";
import { PENUtilities } from "../../apps/utilities.mjs";
import { isCtrlKey } from "../../apps/helper.mjs";
import { PendragonActorSheet } from "./actor-sheet.mjs";
import { WoundTrackerDialog } from "./actor-wound-tracker.mjs";
import { CardType, PENCheck, RollType } from "../../apps/checks.mjs";
import { CombatAction } from "../../apps/combat-actions.mjs";

const { api } = foundry.applications;

export class PendragonCharacterSheetv2 extends PendragonActorSheet {
  constructor(options = {}) {
    super(options);
  }

  static DEFAULT_OPTIONS = {
    classes: ["Pendragon", "sheet", "actor", "character2"],
    position: {
      width: 900,
      height: 1000,
    },
    tag: "form",
    // automatically updates the item
    form: {
      submitOnChange: true,
    },
    actions: {
      onEditImage: this._onEditImage,
      editPid: this._onEditPid,
      rollStat: this._onRollStat,
      rollTrait: this._onRollTrait,
      rollDecision: this._onRollDecision,
      rollPassion: this._onRollPassion,
      rollSkill: this._onRollSkill,
      rollGlory: this._onRollGlory,
      showWounds: this._onShowWounds,
      toggleXP: this._onToggleXP,
      toggleOpposingXP: this._onToggleOpposingXP,
      addEffect: this.#onCreateActiveEffect,
      addItem: this.#onCreateItem,
      toggleEquip: this._onToggleEquip,
      switchHorse: this._onSwitchHorse,
      switchWeapon: this._onSwitchWeapon,
      // automated combat actions
      combatAction: this._declareCombatAction

    },
    window: {
      resizable: true,
    },
  };

  static PARTS = {
    header: {
      template: "systems/Pendragon/templates/actor/character/header.hbs",
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    // each tab gets its own template
    combat: {
      template: "systems/Pendragon/templates/actor/character/combat.hbs",
    },
    traits: {
      template: "systems/Pendragon/templates/actor/character/traits.hbs",
    },
    passions: {
      template: "systems/Pendragon/templates/actor/character/passions.hbs",
    },
    skills: {
      template: "systems/Pendragon/templates/actor/character/skills.hbs",
    },
    equipment: {
      template: "systems/Pendragon/templates/actor/character/equipment.hbs",
    },
    stable: {
      template: "systems/Pendragon/templates/actor/character/stable.hbs",
    },
    events: {
      template: "systems/Pendragon/templates/actor/character/events.hbs",
    },
    house: {
      template: "systems/Pendragon/templates/actor/character/family.hbs",
    },
    biography: {
      template: "systems/Pendragon/templates/actor/character/bio.hbs",
    },
    effects: {
      template: "systems/Pendragon/templates/actor/character/effects.hbs",
    },
  };
  static TABS = {
    primary: {
      tabs: [
        { id: "combat" },
        { id: "traits" },
        { id: "passions" },
        { id: "skills" },
        { id: "equipment" },
        { id: "stable" },
        { id: "events" },
        { id: "house" },
        { id: "biography" },
        { id: "effects" },
      ],
      labelPrefix: "PEN",
      initial: "combat",
    },
  };

  async _preparePartContext(partId, context) {
    switch (partId) {
      case "equipment":
      case "stable":
      case "events":
      case "house":
        context.tab = context.tabs[partId];
        break;
      case "combat":
        return this._prepareCombatTab(context);
      case "skills":
        return this._prepareSkillsTab(context);
      case "biography":
        return this._prepareBioTab(context);
      case "passions":
        return this._preparePassionsTab(context);
      case "traits":
        return this._prepareTraitTab(context);
      case "effects":
        return this._prepareEffects(context);
      default:
    }
    return context;
  }

  async _prepareContext(options) {
    // Default tab for first time it's rendered this session
    if (!this.tabGroups.primary) this.tabGroups.primary = "combat";
    // if we had a base class, do this then mergeObject
    // let sheetData = await super._prepareContext(options);
    const sheetData = {
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      actor: this.actor,
      system: this.actor.system,
      flags: this.actor.flags,
      hasOwner: this.actor.isEmbedded === true,
      isGM: game.user.isGM,
      fields: this.document.schema.fields,
      // will not move to base class
      isLocked: this.actor.system.lock,
      isWinter: game.settings.get("Pendragon", "winter"),
      isDevelopment: game.settings.get("Pendragon", "development"),
      isCreation: game.settings.get("Pendragon", "creation"),
      useRelation: game.settings.get("Pendragon", "useRelation"),
      items: this.actor.items,
      tabs: this._prepareTabs("primary"),
    };
    // now organize the items belonging to the character
    this._prepareItems(sheetData);
    return sheetData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
    // Initialize containers.
    const gears = [];
    const traits = [];
    const wounds = [];
    const history = [];
    const horses = [];
    const squires = [];
    const armours = [];
    const weapons = [];
    const families = [];
    const ideals = [];
    const household = [];
    const followers = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === "gear") {
        i.system.cleanDesc = i.system.description.replace(/<[^>]+>/g, "");
        gears.push(i);
      } else if (i.type === "trait") {
        traits.push(i);
      } else if (i.type === "wound" && i.system.value > 0) {
        wounds.push(i);
      } else if (i.type === "history") {
        if (i.system.favour) {
          i.system.label =
            game.i18n.localize("PEN.favourShort") +
            i.system.favourLevel +
            " " +
            i.system.description;
        } else {
          i.system.label = i.system.description;
        }
        i.system.label = i.system.label.replace(/(<([^>]+)>)/gi, "");
        i.system.glory = Number(i.system.glory) || 0
        history.push(i);
      } else if (i.type === "horse") {
        i.system.careName = game.i18n.localize(
          "PEN.horseHealth." + i.system.horseCare,
        );
        i.system.healthName = game.i18n.localize(
          "PEN.horseHealth." + i.system.horseHealth,
        );
        i.system.totalAR = i.system.armour + i.system.horseArmour;
        i.system.label = i.name;
        if (i.system.horseName != "") {
          i.system.label = i.system.horseName;
        }
        horses.push(i);
      } else if (i.type === "squire") {
        i.system.squireType = game.i18n.localize("PEN." + i.system.category);
        if (i.system.category === "squire") {
          squires.push(i);
        } else {
          household.push(i);
        }
      } else if (i.type === "armour") {
        armours.push(i);
      } else if (i.type === "weapon") {
        weapons.push(i);
      } else if (i.type === "family") {
        i.system.typeName = game.i18n.localize("PEN." + i.system.relation);
        families.push(i);
      } else if (i.type === "ideal") {
        ideals.push(i);
      } else if (i.type === "relationship") {
        i.system.typeName = game.i18n.localize("PEN." + i.system.typeLabel);
        if (i.system.born > 0) {
          i.system.age =
            game.settings.get("Pendragon", "gameYear") - i.system.born;
        } else {
          i.system.age = "";
        }
        followers.push(i);
      }
    }

    // Sort Gears
    gears.sort((a, b) => a.name.localeCompare(b.name));

    // Sort Traits
    traits.sort((a, b) => a.name.localeCompare(b.name));

    // Sort History in reverse chronological order
    history.sort((a, b) => b.system.year - a.system.year || b._stats.createdTime - a._stats.createdTime);

    // Sort Horses with Warhorse at top
    horses.sort((a, b) => a.system.chargeDmg - b.system.chargeDmg);

    // Sort Squires by age
    squires.sort((a, b) => a.system.age - b.system.age);

    // Sort Wounds by damage, low first
    wounds.sort((a, b) => a.system.value - b.system.value);

    // Sort Weapons by melee/missile and name
    weapons.sort(
      (a, b) => a.system.melee - b.system.melee || a.name.localeCompare(b.name),
    );

    // Sort Ideals
    ideals.sort((a, b) => a.name.localeCompare(b.name));

    // Used wherever we need to show a particular status
    // The effects tab renders the full list of conditions slightly differently
    context.statuses = CONFIG.statusEffects.map(c => {
      const hasCondition = this.actor.statuses.has(c.id);
      return {
        id: c.id,
        name: game.i18n.localize(`PEN.${c.name}`),
        img: c.img,
        active: hasCondition
      }
    }).reduce((acc, o, index) => { acc[o.id] = o; return acc; }, {});
    // Assign and return
    context.gears = gears;
    context.traits = traits;
    context.wounds = wounds;
    context.history = history;
    context.horses = horses;
    context.armours = armours;
    context.weapons = weapons;
    context.ideals = ideals;
    context.household = household;
    context.followers = followers;
    context.house = await this.prepareHousehold(families, followers, squires);
  }

  // rebuild family and station
  // this will eventually become a migration script
  async prepareHousehold(families, followers, squires) {
    const familyv2 = { parents: [], spouses: [], children: [], others: [] };
    const station = { lords: [], vassals: [], squires: [], retainers: [] };
    for (const f of families) {
      const person = {
        name: f.name,
        died: Number(f.system.died ?? 0),
        born: Number(f.system.born ?? 0),
        age:
          f.system.died > 0
            ? f.system.died - f.system.born
            : game.settings.get("Pendragon", "gameYear") - f.system.born,
        glory: Number(f.system.glory),
        type: "storyNPC",
      };

      switch (f.system.relation) {
        case "parent":
          familyv2.parents.push(person);
          break;
        case "child":
          familyv2.children.push(person);
          break;
        case "spouse":
          familyv2.spouses.push(person);
          break;
        default:
          familyv2.others.push(person);
          break;
      }
    }
    for (const s of squires) {
      // why do we store age instead of born?
      s.system.born = game.settings.get("Pendragon", "gameYear") - s.system.age;
      const person = {
        name: s.name,
        died: Number(s.system.died ?? 0),
        born: Number(s.system.born ?? 0),
        age:
          s.system.died > 0
            ? s.system.died - s.system.born
            : game.settings.get("Pendragon", "gameYear") - s.system.born,
        glory: Number(s.system.glory),
        type: "storyNPC",
      };
      station.squires.push(person);
    }
    for (const f of followers) {
      const otherActor = await fromUuid(f.system.sourceUuid);
      const person = {
        name: otherActor.name,
        died: Number(f.system.died ?? 0),
        born: Number(f.system.born ?? 0),
        age:
          f.system.died > 0
            ? f.system.died - f.system.born
            : game.settings.get("Pendragon", "gameYear") - f.system.born,
        glory: Number(otherActor.system.glory ?? 0),
        type: f.system.typeLabel,
        uuid: f.system.sourceUuid,
      };

      switch (f.system.connection) {
        case "parent":
        case "Mother":
        case "Father":
          familyv2.parents.push(person);
          break;
        case "child":
          familyv2.children.push(person);
          break;
        case "spouse":
        case "Spouse":
          familyv2.spouses.push(person);
          break;
        default:
          familyv2.others.push(person);
          break;
      }
    }
    return { family: familyv2, station: station };
  }

  async _prepareEffects(context) {
    context.tab = context.tabs.effects;
    const effectList = await this.actor.allApplicableEffects();
    const effects = [];
    for (const e of effectList) effects.push(e);
    context.effects = effects;
    context.conditions = CONFIG.statusEffects.map(c => {
      // check to see if the status effect has been applied to the actor
      const hasCondition = this.actor.statuses.has(c.id);
      return {
        id: c.id,
        name: game.i18n.localize(`PEN.${c.name}`),
        img: c.img,
        active: hasCondition
      }
    }).sort((a, b) => a.name.localeCompare(b.name));
    return context;
  }

  async _prepareTraitTab(context) {
    // trait tab has ideals which has special prep steps
    context.tab = context.tabs.traits;
    for (const i of context.ideals) {
      i.description = await TextEditor.enrichHTML(i.system.description, {
        async: true,
        secrets: false,
        relativeTo: i,
      });
      i.requirements = i.system.require.map(r => this.checkRequirement(r));
    }
    return context;
  }

  checkRequirement(rItm) {
    let actItm = this.actor.items.filter(itm => itm.flags.Pendragon?.pidFlag?.id === rItm.pid)[0];
    if (rItm.score < 0) {
      return { name: actItm.system.oppName, score: -rItm.score, active: actItm.system.total <= 20 + rItm.score }
    } else {
      return { name: actItm.name, score: rItm.score, active: actItm.system.total >= rItm.score }
    }
  }

  async _prepareSkillsTab(context) {
    context.tab = context.tabs.skills;
    const skills = context.items.filter(i => i.type == "skill").map(s => ({ _id: s._id, name: s.name, critical: s.system.total - 20, system: s.system, flags: s.flags }));
    skills.sort(
      (a, b) =>
        a.system.combat - b.system.combat || a.name.localeCompare(b.name),
    );
    context.skills = skills;
    return context;
  }

  async _preparePassionsTab(context) {
    context.tab = context.tabs.passions;
    const passions = context.items.filter(i => i.type == "passion").map(p => ({ _id: p._id, name: p.name, critical: p.system.total - 20, system: p.system, flags: p.flags }));
    passions.sort(
      (a, b) =>
        a.system.court.localeCompare(b.system.court) || a.name.localeCompare(b.name),
    );
    const courts = Object.groupBy(passions, i => i.system.court);
    for (const [k, v] of Object.entries(courts)) {
      courts[k] = { name: game.i18n.localize(`PEN.${k}`), items: v };
    }
    context.courts = courts;
    return context;
  }

  async _prepareBioTab(context) {
    context.tab = context.tabs.biography;
    context.enrichedBackgroundValue = await TextEditor.enrichHTML(
      this.actor.system.background,
      {
        async: true,
        secrets: context.editable,
        relativeTo: this.actor
      }
    )

    context.age = this.actor.system.died > 0
      ? this.actor.system.died - this.actor.system.born
      : game.settings.get("Pendragon", "gameYear") - this.actor.system.born;
    return context;
  }

  async _prepareCombatTab(context) {
    context.tab = context.tabs.combat;
    const horse = this.actor.currentHorse();
    if (horse) {
      const name = horse.getName();
      const classification = horse.name;
      context.currentHorse = { name, system: horse.system, classification };
    }
    const weapon = this.actor.currentWeapon();
    if (weapon) {
      context.currentWeapon = { name: weapon.name, total: weapon.system.total, damage: weapon.system.damage };
    }
    else {
      context.currentWeapon = this.#unarmed();
    }
    return context;
  }

  #unarmed() {
    return { name: "Unarmed", total: this.actor.getSkillTotal("i.skill.brawling"), damage: this.actor.system.damage };
  }

  static async _onToggleEquip(event, target) {
    const { itemid } = target.closest("[data-itemid]")?.dataset ?? {};
    const item = this.actor.items.get(itemid);
    await item.update({ 'system.equipped': !item.system.equipped });
  }

  static async _onToggleXP(event, target) {
    const { itemid } = target.closest("[data-itemid]")?.dataset ?? {};
    const item = this.actor.items.get(itemid);
    await item.update({ 'system.XP': !item.system.XP });
  }

  // used for opposing traits
  static async _onToggleOpposingXP(event, target) {
    const { itemid } = target.closest("[data-itemid]")?.dataset ?? {};
    const item = this.actor.items.get(itemid);
    await item.update({ 'system.oppXP': !item.system.oppXP });
  }

  static #selectCardType(event) {
    const ctrlKey = isCtrlKey(event ?? false);
    let cardType = CardType.UNOPPOSED;
    if (event.altKey) {
      cardType = CardType.OPPOSED;
    } else if (ctrlKey) {
      cardType = CardType.FIXED;
    }
    return cardType;
  }

  static #triggerRoll(rollType, event, options = {}) {
    PENCheck._trigger({
      rollType,
      cardType: PendragonCharacterSheetv2.#selectCardType(event),
      shiftKey: event.shiftKey,
      ...options,
    });
  }

  static async _onRollGlory(event, target) {
    PendragonCharacterSheetv2.#triggerRoll(RollType.GLORY, event, {
      actor: this.actor,
      token: this.token,
    });
  }
  static async _onRollStat(event, target) {
    const { itemid } = target.closest("[data-itemid]")?.dataset ?? {};
    PendragonCharacterSheetv2.#triggerRoll(RollType.CHARACTERISTIC, event, {
      characteristic: itemid,
      actor: this.actor,
      token: this.token,
    });
  }
  static async _onRollTrait(event, target) {
    const { itemid, type } = target.closest("[data-itemid]")?.dataset ?? {};
    PendragonCharacterSheetv2.#triggerRoll(RollType.TRAIT, event, {
      subType: type,
      skillId: itemid,
      actor: this.actor,
      token: this.token,
    });
  }
  static async _onRollDecision(event, target) {
    const { itemid } = target.closest("[data-itemid]")?.dataset ?? {};
    PENCheck._trigger({
      rollType: RollType.DECISION,
      cardType: CardType.UNOPPOSED,
      shiftKey: event.shiftKey,
      skillId: itemid,
      actor: this.actor,
      token: this.token,
    });
  }

  static async _onRollPassion(event, target) {
    const { itemid, dishonour } = target.closest("[data-itemid]")?.dataset ?? {};
    PendragonCharacterSheetv2.#triggerRoll(RollType.PASSION, event, {
      skillId: itemid,
      flatMod: Number(dishonour || 0),
      actor: this.actor,
      token: this.token,
    });
  }
  static async _onRollSkill(event, target) {
    const { itemid } = target.closest("[data-itemid]")?.dataset ?? {};
    PendragonCharacterSheetv2.#triggerRoll(RollType.SKILL, event, {
      skillId: itemid,
      actor: this.actor,
      token: this.token,
    });
  }

  static async _onShowWounds(event, target) {
    const dlg = new WoundTrackerDialog(this.actor);
    dlg.render(true);
  }

  static #onCreateActiveEffect(event, target) {
    const cls = foundry.utils.getDocumentClass("ActiveEffect");
    cls.createDialog({}, { parent: this.document });
  }
  static #onCreateItem(event, target) {
    const { itemType } = target.closest("[data-item-type]")?.dataset ?? {};
    Item.implementation.createDialog({ type: itemType }, { parent: this.document });
  }
  static async _onSwitchHorse(event, target) {
    const horses = this.actor.items.filter(itm => itm.type === 'horse');
    horses.sort((a, b) => a.system.chargeDmg - b.system.chargeDmg);
    const currentHorse = this.actor.currentHorse();
    const content = horses.map(h => `<label><input type='radio' name='horse' value='${h.id}' ${h.id == currentHorse?.id ? "checked" : ""}>${h.getName()}</label>`).join("");
    const result = await api.DialogV2.wait({
      window: { title: "Select Horse" },
      content: content,
      buttons: [{ label: "Switch", action: "switch", callback: (_, button) => button.form.elements.horse.value }],
    });
    // no result or missing horse id
    if (!result || result === "switch") return;
    this.actor.setFlag("Pendragon", "currentHorse", result);
  }
  static async _onSwitchWeapon(event, target) {
    const weapons = this.actor.items.filter(itm => itm.type === 'weapon');
    weapons.sort(
      (a, b) => a.system.melee - b.system.melee || a.name.localeCompare(b.name),
    );
    const currentWeapon = this.actor.currentWeapon();
    const content = weapons.map(w => `<label><input type='radio' name='weapon' value='${w.id}' ${w.id == currentWeapon?.id ? "checked" : ""}>${w.name}</label>`).join("");
    const result = await api.DialogV2.wait({
      window: { title: "Select Weapon" },
      content: content,
      buttons: [{ label: "Switch", action: "switch", callback: (_, button) => button.form.elements.weapon.value }],
    });
    // no result or missing weapon id
    if (!result || result === "switch") return;
    this.actor.setFlag("Pendragon", "currentWeapon", result);
  }
  static async _declareCombatAction(event, target) {
    const { combatAction } = target.closest("[data-combat-action]")?.dataset ?? {};
    switch (combatAction) {
      case CombatAction.ATTACK:
        CombatAction.attack(this.actor);
        break;
      default:
        console.warn(`Unknown combat action ${combatAction}`);
    }
  }
}
