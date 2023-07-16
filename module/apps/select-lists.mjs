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
      "hafted": game.i18n.localize("PEN.hafted"),
      "twoHand": game.i18n.localize("PEN.twoHand"),
      "spear": game.i18n.localize("PEN.spear"),
      "sword": game.i18n.localize("PEN.sword"),
      "thrown": game.i18n.localize("PEN.thrown"),
    };
    return options;
  } 

  //
  //Weapon Usage

  static getWeaponUse () {
    let options = {
      "mounted": game.i18n.localize("PEN.mounted"),
      "unmounted": game.i18n.localize("PEN.unmounted"),
      "both": game.i18n.localize("PEN.both"),
    };
    return options;
  } 

  //
  //Weapon Damage
  //
  static getWeaponDmg () {
    let options = {
      "c": game.i18n.localize("PEN.character"),
      "b": game.i18n.localize("PEN.brawling"),
      "h": game.i18n.localize("PEN.horse"),
      "n": game.i18n.localize("PEN.none"),
    };
    return options;
  } 

  //
  //Weapon Damage
  //
  static getWeaponRange () {
    let options = {
      "s": game.i18n.localize("PEN.short"),
      "m": game.i18n.localize("PEN.medium"),
      "l": game.i18n.localize("PEN.long"),
    };
    return options;
  } 

}