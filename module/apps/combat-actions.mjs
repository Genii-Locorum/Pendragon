import { ChatCardState, ChatCardTemplate } from "./chat.mjs";
import { CardType, RollType } from "./checks.mjs";

export class CombatAction {
  static ATTACK = "attack";
  static RECKLESS = "recklessAttack";
  static SQUIRE = "callSquire";
  static DEFEND = "defend";
  static DISARM = "disarm";
  static EVADE = "evade";
  static PRISONER = "claimPrisoner";
  static PICKUP = "pickUp";
  static SACRIFICE = "selfSacrifice";
  static STUDY = "study";
  static WITHHOLD = "withholdDamage";
  static ZIGZAG = "zigzag";
  static CHARGE = "charge";
  static CONTROL_MOUNT = "controlMount";
  static TRAMPLE = "trample";
  static DISMOUNT = "dismount";
  static QUICK_DISMOUNT = "quickDismount";
  static DODGE = "dodge";
  static ARMOUR = "donArmour";
  static HOOK = "hook";
  static SET_SPEAR = "setSpear";

  static applyHorsemanshipCap(actor, weapon) {
    const targetScore = weapon.total;
    // apply horsemanship cap if mounted
    if (actor.isMounted()) {
      const horsemanship = actor.getSkillTotal("i.skill.horsemanship");
      return Math.min(targetScore, horsemanship);
    }
    return targetScore;
  }

  static getRollModifiers() {
    // then +10 if taking defend action
    //  magic bonus
    // THEN multiple target modifier
    //  number of targets (n -1) * -5
    // THEN combat modifiers
    //  cover?
    //  height advantage/penalty
    //  immobile advantage/penalty
    // THEN passion modifier
    // THEN other
    return 0;
  }

  static attack(actor, unopposed = false) {
    // default to unarmed
    let currentWeapon = { id: null, name: "Unarmed", total: actor.getSkillTotal("i.skill.brawling"), damage: actor.system.damage };
    // determine skill based on current weapon
    const weapon = actor.currentWeapon();
    if (weapon) {
      currentWeapon = { id: weapon.id, name: weapon.name, total: weapon.system.total, damage: weapon.system.damage };
    }
    const targetScore = this.applyHorsemanshipCap(actor, weapon);
    // will use as flatMod but later calculate
    const modifier = getRollModifiers();
    const grossTarget = targetScore + modifier;
    // opposed roll by default
    const options = {
      actor,
      rollType: RollType.COMBAT,
      cardType: CardType.COMBAT,
      itemId: currentWeapon?.id,
      flatMod: modifier,
      state: ChatCardState.OPEN,
      chatTemplate: ChatCardTemplate.COMBAT,
      chatType: CONST.CHAT_MESSAGE_STYLES.OTHER,
      grossTarget,
      targetScore: grossTarget,
      label: currentWeapon.name,
      rawScore: currentWeapon.total,
      skillId: weapon?.system.skillId ?? "i.skill.brawling"
    }
    // calculate crit bonus if needed
    if (grossTarget > 20) {
      options.critBonus = grossTarget - 20;
      options.targetScore = 20;
    } else if (grossTarget < 0) {
      options.critBonus = -grossTarget;
      options.targetScore = 0;
    }
    if (unopposed) {
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
      options.chatTemplate = ChatCardTemplate.UNOPPOSED;
    }
  }
}
