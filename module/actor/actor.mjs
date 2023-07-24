import {PENSelectLists}  from "../apps/select-lists.mjs";

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
    const systemData = actorData.system;
    const flags = actorData.flags.Pendragon || {};

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

    //Calcualte passive Glory
    systemData.appeal = 0;
    systemData.trait = 0;
    systemData.passion = 0;

    //Calcualte passive Glory for Fair Appeal
    if (systemData.stats.app.value >18 ) {
      systemData.appeal = 50
    } else if (systemData.stats.app.value >15 ) {
      systemData.appeal = 25
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
            i.system.value = j.system.value;
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

          damageFlatMod = Number(damageFlatMod) + Number(i.system.damageBonus)

          damageDice = Math.min(Number(damageDice) + Number(i.system.damageMod), Number(i.system.damageMax));
          damageFormula = damageDice+"D6+"+damageFlatMod;
        }
        i.system.damage = damageFormula;
      } else if (i.type === "trait") {
        i.system.oppvalue = 20 - i.system.value;
        if (i.system.value > 19) {
          systemData.trait = systemData.trait + 25; 
        } else if (i.system.value > 15) {
          systemData.trait = systemData.trait + 15;
        } 
      } else if (i.type === "passion") {
        if (i.system.value > 19) {
          systemData.passion = systemData.passion + 25 
        } else if (i.system.value > 15) {
          systemData.passion = systemData.passion + 15 
        } 
      }
    }  
    systemData.tap = Math.min(100,systemData.passion) + Math.min(100,systemData.trait)
    systemData.passive = Number(systemData.tap) + Number(systemData.appeal) + Number(systemData.passglory.ideals) + Number(systemData.passglory.estate)

    //Check debilitated status
    if (systemData.status.debilitated && systemData.status.chirurgery && systemData.hp.value >= Math.floor(systemData.hp.max/2)) {
      systemData.status.debilitated = false;
      systemData.status.chirurgery = false;
    }

  }

  // Prepare NPC type specific data.
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
  }

  // Prepare Common type specific data.
  async _prepareCommonData(actorData) {
    if (actorData.type !== 'npc' && actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.hp.knockdown = systemData.stats.siz.value;
    systemData.hp.majorWnd = systemData.stats.con.value;
    systemData.hp.max = systemData.stats.siz.value + systemData.stats.con.value;
    systemData.hp.unconscious = Math.round(systemData.hp.max/4);

    systemData.damage = Math.round((systemData.stats.str.value + systemData.stats.siz.value)/6);
    systemData.horseDam = "";
    systemData.horseChgDam = "";
    systemData.healRate = Math.round(systemData.stats.con.value/5);
    systemData.move = Math.round((systemData.stats.str.value + systemData.stats.siz.value)/2)+5;
    systemData.knockdown = systemData.stats.siz;


    // Handle stats scores, adding labels to stats
      for (let [k, v] of Object.entries(actorData.system.stats)) {
        v.label = game.i18n.localize(CONFIG.PENDRAGON.stats[k]) ?? k;
        v.labelShort = game.i18n.localize(CONFIG.PENDRAGON.statsAbbreviations[k]) ?? k;
      }
        
    //Loop through all items to see if they have impact
    let totalWounds=0;
    let glory = 0;
    let armour = 0;
    let shield = 0;
    for (let i of actorData.items) {    
       if (i.type === 'wound') {                  
        //Ignore wounds with a negative value
        totalWounds = totalWounds + Math.max(i.system.value,0);
       } else if (i.type === "history") {
        glory = glory + i.system.glory
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
    systemData.hp.value = systemData.hp.max - totalWounds - (systemData.aggravDam ? systemData.aggravDam : 0) - (systemData.deterDam ? systemData.deterDam : 0) - (systemData.woundTotal ? systemData.woundTotal : 0);  
    if (systemData.hp.value <=0 && actorData.type === 'character') {
      systemData.status.nearDeath = true;
      systemData.status.unconscious = true;
      systemData.status.debilitated = true;
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

}