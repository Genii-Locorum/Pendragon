export class PENSelectLists {

  //
  //Weapon Types 
  //
  static getWeaponTypes () {
    let options = {
      "": game.i18n.localize("PEN.none"),
      "bow": game.i18n.localize("PEN.bow"),
      "brawling": game.i18n.localize("PEN.brawling"),
      "charge": game.i18n.localize("PEN.charge"),
      "crossbow": game.i18n.localize("PEN.crossbow"),
      "flail": game.i18n.localize("PEN.flail"),
      "hafted": game.i18n.localize("PEN.hafted"),
      "twoHand": game.i18n.localize("PEN.twoHand"),
      "spear": game.i18n.localize("PEN.spear"),
      "sword": game.i18n.localize("PEN.sword"),
      "thrown": game.i18n.localize("PEN.thrown"),
    };
    return options;
  } 

  //Weapon Usage
  static getWeaponUse () {
    let options = {
      "mounted": game.i18n.localize("PEN.mounted"),
      "unmounted": game.i18n.localize("PEN.unmounted"),
      "both": game.i18n.localize("PEN.both"),
    };
    return options;
  } 


  //Weapon Damage
  static getWeaponDmg () {
    let options = {
      "c": game.i18n.localize("PEN.character"),
      "b": game.i18n.localize("PEN.brawling"),
      "h": game.i18n.localize("PEN.horse"),
      "n": game.i18n.localize("PEN.none"),
    };
    return options;
  } 


  //Weapon Damage
  static getWeaponRange () {
    let options = {
      "s": game.i18n.localize("PEN.short"),
      "m": game.i18n.localize("PEN.medium"),
      "l": game.i18n.localize("PEN.long"),
    };
    return options;
  } 

  //Passion Types
  static getCourtType () {
    let options = {
      "adoratio": game.i18n.localize("PEN.adoratio"),
      "civilitas": game.i18n.localize("PEN.civilitas"),
      "fervor": game.i18n.localize("PEN.fervor"),
      "fidelitas": game.i18n.localize("PEN.fidelitas"),
      "honor": game.i18n.localize("PEN.honor")
    };
    return options;
  }

  //Stats List + None
  static getSkillAtt () {
    let options = {
      "none": game.i18n.localize("PEN.none"),
      "app": game.i18n.localize("PENDRAGON.StatAppAbbr"),
      "con": game.i18n.localize("PENDRAGON.StatConAbbr"),
      "dex": game.i18n.localize("PENDRAGON.StatDexAbbr"),
      "siz": game.i18n.localize("PENDRAGON.StatSizAbbr"),
      "str": game.i18n.localize("PENDRAGON.StatStrAbbr")
    };
    return options;
  }

  //Armour Type List
  static getArmourType () {
    let options = {
      "textile": game.i18n.localize("PEN.textile"),
      "mail": game.i18n.localize("PEN.mail"),
      "plate": game.i18n.localize("PEN.plate")
    };
    return options;
  }  

  //Damage Type List
  static getDamageType () {
    let options = {
      "wound" : game.i18n.localize('PEN.wound'),
      "cold" : game.i18n.localize('PEN.cold'),
      "disease" : game.i18n.localize('PEN.disease'),
      "fire" : game.i18n.localize('PEN.fire'),
      "fall" : game.i18n.localize('PEN.fall'),
      "poison" : game.i18n.localize('PEN.poison'),
      "suffocate" : game.i18n.localize('PEN.suffocate')
    };
    return options;
  }  

  //Stats List + HP
  static getDiseaseImpact () {
    let options = {
      "hp": game.i18n.localize("PEN.hp"),
      "app": game.i18n.localize("PENDRAGON.StatAppAbbr"),
      "con": game.i18n.localize("PENDRAGON.StatConAbbr"),
      "dex": game.i18n.localize("PENDRAGON.StatDexAbbr"),
      "siz": game.i18n.localize("PENDRAGON.StatSizAbbr"),
      "str": game.i18n.localize("PENDRAGON.StatStrAbbr")
    };
    return options;
  }  

  //Standards of Living List
  static getSOLType () {
    let options = {
      "impoverished" : game.i18n.localize('PEN.impoverished'),
      "poor" : game.i18n.localize('PEN.poor'),
      "ordinary" : game.i18n.localize('PEN.ordinary'),
      "rich": game.i18n.localize('PEN.rich'),
      "superlative": game.i18n.localize('PEN.superlative'),
    };
    return options;
  } 

  //relation Types
  static getRelationTypes () {
    let options = {
      "mother" : game.i18n.localize('PEN.mother'),
      "father" : game.i18n.localize('PEN.father'),
      "grandmother" : game.i18n.localize('PEN.grandmother'),
      "grandfather" : game.i18n.localize('PEN.grandfather'),
      "aunt" : game.i18n.localize('PEN.aunt'),
      "uncle" : game.i18n.localize('PEN.uncle'),
      "cousin" : game.i18n.localize('PEN.cousin'),
      "sibling" : game.i18n.localize('PEN.sibling'),
      "spouse" : game.i18n.localize('PEN.spouse'),
      "child" : game.i18n.localize('PEN.child'),
      "other": game.i18n.localize('PEN.other'),
    };
    return options;
  }

  //Squire Types
  static getSquireTypes () {
    let options = {
      "squire" : game.i18n.localize('PEN.squire'),
      "maiden" : game.i18n.localize('PEN.maiden'),
      "other": game.i18n.localize('PEN.other')
    };
    return options;
  } 

  //Horse Status
  static getHorseStatus () {
    let options = {
      "0" : game.i18n.localize('PEN.good'),
      "1" : game.i18n.localize('PEN.weak'),
      "2": game.i18n.localize('PEN.vweak')
    };
    return options;
  } 

  //Follwer Type
  static getFollowerType () {
    let options = {
      "squire" : game.i18n.localize('PEN.squire'),
      "family" : game.i18n.localize('PEN.family'),
      "retainer": game.i18n.localize('PEN.retainer')
    };
    return options;
  } 

}
