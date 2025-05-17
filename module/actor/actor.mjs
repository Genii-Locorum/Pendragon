import {PENSelectLists}  from "../apps/select-lists.mjs";
import { PendragonStatusEffects } from "../apps/status-effects.mjs";
import { PENUtilities } from "../apps/utilities.mjs";

//Extend the base Actor Class
export class PendragonActor extends Actor {

 /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCommonData(actorData);
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);

  }

  // Prepare Character type specific data
  async _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;
    const systemData = actorData.system;
    //Set basic object IDs
    systemData.cultureID = ""
    systemData.homelandID = ""
    systemData.classID = ""
    systemData.religionID = ""
    systemData.statTotal = 0
    systemData.fidelitas = 0
    systemData.fervor = 0
    systemData.adoratio = 0
    systemData.civilitas = 0
    systemData.honor = 0
    systemData.age = game.settings.get('Pendragon' , 'gameYear') - systemData.born


    //Set Culture ID and add stats max
    let culture = actorData.items.filter(itm =>itm.type==='culture')[0]
    if (culture) {systemData.cultureID = culture._id
                  systemData.cultureName = culture.name
    }
    for (let [key, stat] of Object.entries(actorData.system.stats)) {
      stat.max = 18 + stat.culture
      if (culture) {stat.max = culture.system.stats[key].max ?? 18}
      stat.total = Math.min(stat.total,stat.max)
      systemData.statTotal = systemData.statTotal + Number(stat.value)
    }

    //Set Homeland ID
    let homeland = actorData.items.filter(itm =>itm.type==='homeland')[0]
    if (homeland) {systemData.homelandID = homeland._id
      systemData.homelandName = homeland.name
    }

    //Set Class ID
    let actClass = actorData.items.filter(itm =>itm.type==='class')[0]
    if (actClass) {systemData.classID = actClass._id
      systemData.className = actClass.name
    }

    //Set Religion ID
    let religion = actorData.items.filter(itm =>itm.type==='religion')[0]
    if (religion) {
      systemData.religionID = religion._id
      systemData.religionName = religion.name

    }

    //Actor only Adjustments
    systemData.damage = systemData.damage + systemData.damAdj
    systemData.move = systemData.move + systemData.moveAdj
    systemData.armour = systemData.armour + systemData.armourAdj


    //Calculate passive Glory
    systemData.appeal = 0;
    systemData.trait = 0;
    systemData.passion = 0;
    systemData.solVal = 0;
    systemData.obese = 0
    systemData.damageMod = 0;

    //Calculate passive Glory for Fair Appeal
    if (systemData.stats.app.total >18 ) {
      systemData.appeal = 50
    } else if (systemData.stats.app.total >15 ) {
      systemData.appeal = 25
    } else if (systemData.stats.app.total >12 ) {
      systemData.appeal = 10
    }

    //Calculate passive Glory for Standard of Living
    if (systemData.sol === 'ordinary') {
      systemData.solVal = 10
    } else if (systemData.sol === 'rich') {
      systemData.solVal = 20
    } else if (systemData.sol === 'superlative') {
      systemData.solVal = 20
    }

    //Calculate passive Glory for obese
    if (systemData.stats.siz.growth > 2) {
      systemData.obese = 20
    }

    for (let i of actorData.items) {
      if (i.type === "trait") {
        let tempTotal = Number(i.system.value) + Number(i.system.religious) + Number(i.system.winter)
        if ((tempTotal) > 20) {
          i.system.total = tempTotal
          i.system.oppvalue = 0
        } else if ((tempTotal)<0){
          i.system.total = 0
          i.system.oppvalue = 20 - tempTotal
        } else {
          i.system.total = tempTotal
          i.system.oppvalue = 20 - tempTotal
        }

        if (i.system.total > 19 || i.system.oppvalue > 19) {
          systemData.trait = systemData.trait + 25;
        } else if (i.system.total > 15 || i.system.oppvalue > 15) {
          systemData.trait = systemData.trait + 15;
        }
      } else if (i.type === "passion") {
        i.system.total = Number(i.system.value) + Number(i.system.inherit) + Number(i.system.sol) + Number(i.system.homeland) + Number(i.system.winter)
        systemData[i.system.court] = systemData[i.system.court] + Math.min(20,Number(i.system.total))
        if (i.system.total > 19) {
          systemData.passion = systemData.passion + 25
        } else if (i.system.total > 15) {
          systemData.passion = systemData.passion + 15
        }
      } else if (i.type === "skill") {
        i.system.total =Number(i.system.value) + Number(i.system.culture) + Number(i.system.family) + Number(i.system.create) + Number(i.system.winter)
      }

      if (['trait','passion'].includes(i.type)){
        if (i.system.total <5) {i.system.flavour = game.i18n.localize('PEN.unsung')}
        else if (i.system.total >20) {i.system.flavour = game.i18n.localize('PEN.exalted')}
        else if (i.system.total >15) {i.system.flavour = game.i18n.localize('PEN.famous')}
        else {i.system.flavour =""}

        if (i.type === 'trait') {
          if (i.system.oppvalue <5) {i.system.oppFlavour = game.i18n.localize('PEN.unsung')}
          else if (i.system.oppvalue >20) {i.system.oppFlavour = game.i18n.localize('PEN.exalted')}
          else if (i.system.oppvalue >15) {i.system.oppFlavour = game.i18n.localize('PEN.famous')}
          else {i.system.oppFlavour =""}
        }
      }
    }

    //Check that Ideals are active and apply benefits
    systemData.passglory.ideals = 0
    for (let i of actorData.items) {
      if (i.type ==='ideal') {
        i.system.active = true
          for (let rItm of i.system.require) {
            let actItm = actorData.items.filter(itm=>itm.flags.Pendragon.pidFlag.id === rItm.pid)[0]
            if (rItm.score <0) {
              if (actItm.system.total > 20+rItm.score) {i.system.active = false}
            } else {
              if (actItm.system.total < rItm.score) {i.system.active = false}
            }
          }
        if (i.system.active) {
          systemData.passglory.ideals = systemData.passglory.ideals +  i.system.glory
          systemData.armour = systemData.armour + i.system.armour
          let damAdj = (i.system.dam).toUpperCase()
          if (damAdj.split("D").length > 1) {
            systemData.damage = systemData.damage + Number(damAdj.split("D")[0])
          } else {
            systemData.damageMod = systemData.damageMod + i.system.dam
          }
          systemData.move = systemData.move + i.system.move
          systemData.hp.max = systemData.hp.max + i.system.hp
          systemData.healRate = systemData.healRate + i.system.hr

        }
      }
    }


    //Convert skilltype to the name of the Skill
    let skillType = PENSelectLists.getWeaponTypes();
    let rangeType = PENSelectLists.getWeaponRange();
    for (let i of actorData.items) {
      if (i.type === "weapon") {
        i.system.skillName = skillType[i.system.skill]
        if (i.system.melee) {
          i.system.rangeName = "";
        } else {
          i.system.rangeName = rangeType[i.system.range].charAt(0);
        }

        //Add the skill score to the weapon matched on skill/weaponType and add the skill ID to the weapon
        for (let j of actorData.items) {
          if (j.type === 'skill' && j.system.weaponType === i.system.skill) {
            i.system.total = j.system.total;
            i.system.sourceID = j._id;
          }
        }

        //Calculate the damage for the weapon for the actor
        let damageDice = 0;
        let damageFlatMod = 0;
        let damageFormula = "";
        if(i.system.damageChar === 'h') {                   //If damage source is horse use the horse's charge damage
          damageFormula = systemData.horseChgDam
        } else {

          if(i.system.damageChar === 'c') {                 //If damage source is character use the character Dam as number of D6
            damageDice = systemData.damage
          } else if (i.system.damageChar === 'b') {          //If damage source is brawling use the character Dam as flat mod
            damageFlatMod = systemData.damage
          }

          damageFlatMod = Number(damageFlatMod) + Number(i.system.damageBonus) + Number(systemData.damageMod)

          damageDice = Math.min(Number(damageDice) + Number(i.system.damageMod), Number(i.system.damageMax));
          damageFormula = damageDice+"D6+"+damageFlatMod;
        }
        i.system.damage = damageFormula;
      }
    }

    systemData.hp.value = systemData.hp.max - systemData.totalWounds - systemData.aggravDam - systemData.deterDam;
    systemData.hp.unconscious = Math.round(systemData.hp.max/4);
    systemData.tap = Math.min(100,systemData.passion) + Math.min(100,systemData.trait)
    systemData.passive = Number(systemData.tap) + Number(systemData.appeal) + Number(systemData.passglory.ideals) + Number(systemData.passglory.estate) + Number(systemData.passglory.other) + Number(systemData.solVal) + Number(systemData.obese)

    // If hp <=0 we probably should do something
    // code used to set DYING/DEBILITATED/UNCONSCIOUS etc here but creating effects during prepare can end up with duplicates or cycles
    // TOR2E emits a warning to chat 'actor expected to have STATUS' which if we don't spam chat at wrong time may be useful

    //Check debilitated status
    if (this.statuses.has(PendragonStatusEffects.DEBILITATED) && systemData.status.chirurgery && systemData.hp.value >= Math.floor(systemData.hp.max/2)) {
      //TODO - review in case deleting effect during prepare is a problem
      this.removeStatus(PendragonStatusEffects.DEBILITATED);
      systemData.status.chirurgery = false;
    }

  }

  // Prepare NPC and follower type specific data.
  _prepareNpcData(actorData) {
    if (!['npc','follower'].includes(actorData.type) ) return;

    // Make modifications to data here. For example:
    for (let i of actorData.items) {
      if (i.type === "trait") {
        i.system.total = i.system.value
      } else if (i.type === "passion") {
        i.system.total = i.system.value
      } else if (i.type === "skill") {
        i.system.total =i.system.value
      }
    }





  }

  // Prepare Common type specific data.
  async _prepareCommonData(actorData) {
    if (!['npc','character','follower'].includes(actorData.type)) return;
    actorData.system.statTotal = 0
    // Handle stats scores, adding labels to stats
    for (let [key, stat] of Object.entries(actorData.system.stats)) {
      stat.label = game.i18n.localize(CONFIG.PENDRAGON.stats[key]) ?? key;
      stat.labelShort = game.i18n.localize(CONFIG.PENDRAGON.statsAbbreviations[key]) ?? key;
      stat.total = Number(stat.value) + Number(stat.culture) + Number(stat.create) + Number(stat.poison) + Number(stat.disease) + Number(stat.sol) + Number(stat.age) + Number(stat.major) + Number(stat.winter)
    }

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.hp.knockdown = systemData.stats.siz.total;
    systemData.hp.majorWnd = systemData.stats.con.total;

    //If NPC or follower, and manual HP have been entered then override max HP calc
    if (['npc','follower'].includes(actorData.type)) {
      if (systemData.manMaxHP != 0) {
        systemData.hp.max = systemData.manMaxHP
      } else {
        systemData.hp.max = systemData.stats.siz.total + systemData.stats.con.total + systemData.hp.adj;
      }
      if (systemData.manUnconscious != 0) {
        systemData.hp.unconscious = systemData.manUnconscious
      } else {
        systemData.hp.unconscious = Math.round(systemData.hp.max/4);
      }
    } else {
      systemData.hp.max = systemData.stats.siz.total + systemData.stats.con.total + systemData.hp.adj;
      systemData.hp.unconscious = Math.round(systemData.hp.max/4);
    }


    systemData.damage = Math.round((systemData.stats.str.total + systemData.stats.siz.total)/6);
    systemData.horseDam = "";
    systemData.horseChgDam = "";
    systemData.healRate = Math.round(systemData.stats.con.total/5);
    systemData.move = Math.round((systemData.stats.str.total + systemData.stats.dex.total)/2)+5;
    systemData.reputation = ""



    //Loop through all items to see if they have impact
    systemData.totalWounds=0;
    let glory = 0;
    let armour = 0;
    let shield = 0;
    for (let i of actorData.items) {
       if (i.type === 'wound') {
        //Ignore wounds with a negative value
        systemData.totalWounds = systemData.totalWounds + Math.max(i.system.value,0);
       } else if (i.type === "history") {
        glory = Number(glory) + Number(i.system.glory)
       } else if (i.type === "armour" && i.system.equipped){    //If armour is equipped
        if (i.system.type) {                                  //And type = true then add AP to armour
          armour = armour + Number(i.system.ap)
        } else {                                              //Otherwise type = false then add AP to shield
          shield = shield + Number(i.system.ap)
        }
       } else if (i.type === "horse" && i.system.equipped) {    //Get horse damage from an equipped horse,
        systemData.horseDam = i.system.damage;
        systemData.horseChgDam = i.system.chargeDmg;
       }
    }
    //Calculate current HP then check for Near Death
    systemData.hp.value = systemData.hp.max - (systemData.woundTotal ? systemData.woundTotal : 0);
    if (glory < 3000) {
      systemData.reputation = game.i18n.localize('PEN.unproven')
    } else if (glory < 4000) {
      systemData.reputation = game.i18n.localize('PEN.veteran')
    }  else if (glory < 6000) {
      systemData.reputation = game.i18n.localize('PEN.respected')
    }  else if (glory < 8000) {
      systemData.reputation = game.i18n.localize('PEN.notable')
    }  else if (glory < 12000) {
      systemData.reputation = game.i18n.localize('PEN.renowned')
    }  else if (glory < 16000) {
      systemData.reputation = game.i18n.localize('PEN.illustrious')
    }  else if (glory < 32000) {
      systemData.reputation = game.i18n.localize('PEN.extraordinary')
    } else if (glory >=32000) {
      systemData.reputation = game.i18n.localize('PEN.legendary')
    }

    systemData.glory = glory;
    systemData.gloryPrestige = Math.floor(glory/1000) - systemData.prestige
    systemData.armour = armour;
    systemData.shield = shield;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.stats) {
      for (let [key, stat] of Object.entries(data.stats)) {
        data[key] = foundry.utils.deepClone(stat);
      }
    }

    // Add level for easier access, or fall back to 0.

  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /** @override */
  static async create (data, options = {}) {
    let vision = game.settings.get('Pendragon' , 'tokenVision')
    //When creating an actor set basics including tokenlink, bars, displays sight
    if (data.type === 'character') {
      data.prototypeToken = foundry.utils.mergeObject( {
        actorLink: true,
        disposition: 1,
        displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        sight: {
          enabled: vision
        },
        detectionModes: [{
          id: 'basicSight',
          range: 30,
          enabled: true
        }]
      },data.prototypeToken || {})
    } else if (data.type === 'npc') {
      data.prototypeToken = foundry.utils.mergeObject( {
        actorLink: true,
        disposition: 0,
        displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        sight: {
          enabled: vision
        },
        bar1: {
          attribute: "hp"
        },
        bar2: {
          attribute: "woundTotal"
        },
        detectionModes: [{
          id: 'basicSight',
          range: 30,
          enabled: true
        }]
      },data.prototypeToken || {})
    } else if (data.type === 'follower') {
      data.prototypeToken = foundry.utils.mergeObject( {
        actorLink: true,
        disposition: 1,
        displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        displayBars: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        sight: {
          enabled: vision
        },
        bar1: {
          attribute: "hp"
        },
        bar2: {
          attribute: "woundTotal"
        },
        detectionModes: [{
          id: 'basicSight',
          range: 30,
          enabled: true
        }]
      },data.prototypeToken || {})
    }

    let actor = await super.create(data, options)

    if (data.type === 'character') {
      //If an actor now add all skills to the sheet
        //Get list of skills and add to actor
        let skillList = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: /^i.skill\./, type: 'i' })
        let knightSkillList = await skillList.filter(itm=>!itm.system.nonknightly)
        await actor.createEmbeddedDocuments("Item", knightSkillList);

        //Get list of traits and add to actor
        let traitList = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: /^i.trait\./, type: 'i' })
        await actor.createEmbeddedDocuments("Item", traitList);

        //Get list of passions and add to actor
        let passionList = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: /^i.passion\./, type: 'i' })
        await actor.createEmbeddedDocuments("Item", passionList);
    }
    return actor
  }

  async addStatus(statusId) {
    // if we already have the status, nothing to do
    if(this.statuses.has(statusId)) return;
    // just in case
    const existing = this.effects.getName(statusId);
    if ( existing ) return;
    // otherwise add the status effect
    const effect = await ActiveEffect.implementation.fromStatusEffect(statusId);
    return ActiveEffect.implementation.create(effect, { parent: this });
  }
  removeStatus(statusId) {
    const existing = this.effects.getName(statusId);
    if ( existing ) return existing.delete();
  }

}