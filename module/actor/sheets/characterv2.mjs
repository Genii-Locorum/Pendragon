import { PENRollType } from "../../cards/rollType.mjs";
import { PENCombat } from "../../apps/combat.mjs";
import { PENWinter } from "../../apps/winterPhase.mjs";
import { PENCharCreate } from "../../apps/charCreate.mjs";
import { PENactorItemDrop } from "../actor-itemDrop.mjs";
import { PENUtilities } from "../../apps/utilities.mjs";
import { isCtrlKey } from "../../apps/helper.mjs";
import { PendragonActorSheet } from "./actor-sheet.mjs";
import { CardType, PENCheck, RollType } from "../../apps/checks.mjs";

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
      // probably should be implemented on a base class
      onEditImage: this._onEditImage,
      editPid: this._onEditPid,
      rollStat: this._onRollStat,
      rollTrait: this._onRollTrait,
      rollPassion: this._onRollPassion,
      rollSkill: this._onRollSkill,
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
  // this does the minimum currently, just sets the tab
  // could also prepare tab-specific fields
  async _preparePartContext(partId, context) {
    //context = super._preparePartContext(partId, context, options);
    switch (partId) {
      case "combat":
      case "traits":
      case "passions":
      case "skills":
      case "equipment":
      case "stable":
      case "events":
      case "house":
      case "biography":
        context.tab = context.tabs[partId];
        break;
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
    let sheetData = {
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
    const skills = [];
    const wounds = [];
    const history = [];
    const passions = [];
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
      } else if (i.type === "skill") {
        skills.push(i);
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
        history.push(i);
      } else if (i.type === "passion") {
        if (i.flags.Pendragon?.pidFlag.id === "i.passion.honour") {
          i.system.isHonour = true;
        } else {
          i.system.isHonour = false;
        }
        i.system.level = 1;
        passions.push(i);
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

    passions.push(
      {
        name: game.i18n.localize("PEN.adoratio"),
        system: {
          total: this.actor.system.adoratio,
          court: "adoratio",
          level: 0,
        },
      },
      {
        name: game.i18n.localize("PEN.civilitas"),
        system: {
          total: this.actor.system.civilitas,
          court: "civilitas",
          level: 0,
        },
      },
      {
        name: game.i18n.localize("PEN.fervor"),
        system: { total: this.actor.system.fervor, court: "fervor", level: 0 },
      },
      {
        name: game.i18n.localize("PEN.fidelitas"),
        system: {
          total: this.actor.system.fidelitas,
          court: "fidelitas",
          level: 0,
        },
      },
      {
        name: game.i18n.localize("PEN.honor"),
        system: { total: this.actor.system.honor, court: "honor", level: 0 },
      },
    );

    // Sort Gears
    gears.sort((a, b) => a.name.localeCompare(b.name));

    // Sort Traits
    traits.sort((a, b) => a.name.localeCompare(b.name));

    // Sort Skills
    skills.sort(function (a, b) {
      let x = a.name.toLowerCase();
      let y = b.name.toLowerCase();
      let p = a.system.combat;
      let q = b.system.combat;
      if (p < q) {
        return -1;
      }
      if (p > q) {
        return 1;
      }
      if (x < y) {
        return -1;
      }
      if (x > y) {
        return 1;
      }
      return 0;
    });

    // Sort History
    history.sort(function (a, b) {
      let x = a.system.year;
      let y = b.system.year;
      let p = a._stats.createdTime;
      let q = b._stats.createdTime;
      if (x < y) {
        return 1;
      }
      if (x > y) {
        return -1;
      }
      if (p < q) {
        return 1;
      }
      if (p > q) {
        return -1;
      }
      return 0;
    });

    // Sort Passions by Court, level and name
    passions.sort(function (a, b) {
      let x = a.name;
      let y = b.name;
      let p = a.system.court;
      let q = b.system.court;
      let r = a.system.level;
      let s = b.system.level;
      if (p < q) {
        return -1;
      }
      if (p > q) {
        return 1;
      }
      if (r < s) {
        return -1;
      }
      if (r > s) {
        return 1;
      }
      if (x < y) {
        return -1;
      }
      if (x > y) {
        return 1;
      }
      return 0;
    });

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

    // Assign and return
    context.gears = gears;
    context.traits = traits;
    context.skills = skills;
    context.wounds = wounds;
    context.history = history;
    context.passions = passions;
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
    console.log(effects);
    return context;
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

  static async _onRollStat(event, target) {}
  static async _onRollTrait(event, target) {
    const { itemid, type } = target.closest("[data-itemid]")?.dataset ?? {};
    //const cardType = PendragonCharacterSheetv2.#selectCardType(event);
    PendragonCharacterSheetv2.#triggerRoll(RollType.TRAIT, event, {
      subType: type,
      skillId: itemid,
      actor: this.actor,
      token: this.token,
    });
  }
  static async _onRollPassion(event, target) {}
  static async _onRollSkill(event, target) {}
}
