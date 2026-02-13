import { OPCard } from "../cards/opposed-card.mjs";
import { ChatCardState, ChatCardTemplate } from "./chat.mjs";
import { CardType, RollType, PENCheck, RollResult } from "./checks.mjs";

const { api, fields } = foundry.applications;

export class CombatOutcome {
  static CRITICAL = "C";
  static WIN = "W";
  static TIE = "T";
  static PARTIAL = "P";
  static LOSE = "L";
  static FUMBLE = "F";
}

export class CombatAction {
  static ATTACK = "attack";
  static UNOPPOSED_ATTACK = "unoppAtt";
  static RECKLESS = "reckless";
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
  static MOUNT = "mount";

  // apply Horsemanship cap to combat rolls if mounted
  static applyHorsemanshipCap(actor, weapon) {
    const targetScore = weapon.total;
    // apply horsemanship cap if mounted
    if (actor.isMounted()) {
      const horsemanship = actor.getSkillTotal("i.skill.horsemanship");
      return Math.min(targetScore, horsemanship);
    }
    return targetScore;
  }

  static getRollModifiers(action) {
    let total = 0;
    // +10 if taking defend action
    if (action == CombatAction.DEFEND) {
      total += 10;
    }
    //  magic bonus
    // THEN multiple target modifier
    //  number of targets (n -1) * -5
    // THEN combat modifiers
    //  cover?
    //  height advantage/penalty
    //  immobile advantage/penalty
    // THEN passion modifier
    // THEN other
    return total;
  }

  static async requestRollModifiers(action, currentWeapon) {
    const bonuses = this.getRollModifiers(action);
    const textInput = fields.createNumberInput({
      name: 'checkBonus',
      value: bonuses
    });
    const textGroup = fields.createFormGroup({
      input: textInput,
      label: game.i18n.localize("PEN.checkBonus"),
      hint: game.i18n.localize("PEN.checkBonusHint")
    });
    const content = `${textGroup.outerHTML}`;
    const data = await api.DialogV2.input({
      window: { title: `PEN.actions.${action}` },
      content: content,
      ok: { label: "Roll" },
    });
    return data.checkBonus;
  }

  static async opposedWeaponRollOptions(actor, action) {
    // default to unarmed
    let currentWeapon = { id: null, name: "Unarmed", total: actor.getSkillTotal("i.skill.brawling"), damage: actor.system.damage };
    // determine skill based on current weapon
    const weapon = actor.currentWeapon();
    if (weapon) {
      currentWeapon = { id: weapon.id, name: weapon.name, total: weapon.system.total, damage: weapon.system.damage };
    }
    const targetScore = this.applyHorsemanshipCap(actor, currentWeapon);
    // will use as flatMod but later make more granular
    const modifier = await this.requestRollModifiers(action);
    const grossTarget = targetScore + modifier;
    // opposed roll by default
    const options = {
      actor,
      particName: actor.name,
      particId: actor.id,
      particImg: actor.img,
      particType: "actor",
      actorType: actor.type,
      action: action,
      rollType: RollType.COMBAT,
      cardType: CardType.COMBAT,
      itemId: currentWeapon?.id,
      flatMod: modifier,
      reflexMod: 0,
      state: ChatCardState.OPEN,
      chatTemplate: ChatCardTemplate.COMBAT,
      chatType: CONST.CHAT_MESSAGE_STYLES.OTHER,
      grossTarget,
      targetScore: grossTarget,
      critBonus: 0,
      label: currentWeapon.name,
      rollFormula: "1D20",
      rawScore: currentWeapon.total,
      skillId: weapon?.system.sourceId ?? "i.skill.brawling",
    }
    // calculate crit bonus if needed
    if (grossTarget > 20) {
      options.critBonus = grossTarget - 20;
      options.targetScore = 20;
    } else if (grossTarget < 0) {
      options.critBonus = -grossTarget;
      options.targetScore = 0;
    }
    return options;
  }

  static applyUnopposedOutcome(options) {
    if (options.resultLevel === RollResult.CRITICAL) {
      options.damCrit = true;
    }

    if (options.resultLevel > RollResult.FAIL) {
      options.damRoll = true;
      options.outcome = CombatOutcome.WIN;
      options.outcomeLabel = game.i18n.localize("PEN.comRollW");
    } else {
      options.outcome = CombatAction.LOSE;
      options.outcomeLabel = game.i18n.localize("PEN.comRollL");
    }
  }


  static async attack(actor, unopposed = false) {
    // standard opposed weapon roll
    const options = await this.opposedWeaponRollOptions(actor, CombatAction.ATTACK);

    // allow for unopposed roll
    if (unopposed) {
      options.action = CombatAction.UNOPPOSED_ATTACK;
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
      options.chatTemplate = ChatCardTemplate.UNOPPOSED;
    }

    // make the roll
    await PENCheck.makeRoll(options);

    // set the outcome if unopposed
    if (unopposed) {
      this.applyUnopposedOutcome(options);
    }

    await this.createChatCard(options);
  }

  static async recklessAttack(actor, unopposed = false) {
    // standard opposed weapon roll
    const options = await this.opposedWeaponRollOptions(actor, CombatAction.RECKLESS);

    // allow for unopposed roll
    if (unopposed) {
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
      options.chatTemplate = ChatCardTemplate.UNOPPOSED;
    }

    // make the roll
    await PENCheck.makeRoll(options);

    // set the outcome if unopposed
    if (unopposed) {
      this.applyUnopposedOutcome(options);
    }

    await this.createChatCard(options);
  }

  static async defend(actor, unopposed = false) {
    // standard opposed weapon roll
    const options = await this.opposedWeaponRollOptions(actor, CombatAction.DEFEND);

    // allow for unopposed roll
    if (unopposed) {
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
      options.chatTemplate = ChatCardTemplate.UNOPPOSED;
    }

    // make the roll
    await PENCheck.makeRoll(options);

    // set the outcome if unopposed
    if (unopposed) {
      this.applyUnopposedOutcome(options);
    }

    await this.createChatCard(options);
  }

  static async createChatCard(config) {
    const chatMsgData = {
      rollType: config.rollType,
      cardType: config.cardType,
      chatType: config.chatType,
      chatTemplate: config.chatTemplate,
      state: config.state,
      rolls: config.roll,
      resultLevel: config.resultLevel,
      rollResult: config.rollResult,
      inquiry: config.inquiry,
      chatCard: [
        {
          rollType: config.rollType,
          particId: config.particId,
          particType: config.particType,
          particName: config.particName,
          particImg: config.particImg,
          actorType: config.actorType,
          characteristic: config.characteristic ?? false,
          label: config.label,
          oppLabel: config.oppLabel,
          oppRawScore: config.oppRawScore,
          decision: config.decision,
          reverseRoll: config.reverseRoll,
          reflex: config.reflex,
          skillId: config.skillId,
          itemId: config.itemId,
          targetScore: config.targetScore,
          grossTarget: config.grossTarget,
          rawScore: config.rawScore,
          rollFormula: config.rollFormula,
          flatMod: config.flatMod,
          reflexMod: config.reflexMod,
          critBonus: config.critBonus,
          rollResult: config.rollResult,
          rollVal: config.rollVal,
          roll: config.roll,
          resultLevel: config.resultLevel,
          resultLabel: game.i18n.localize(`PEN.resultLevel.${config.resultLevel}`),
          outcome: config.outcome,
          outcomeLabel: config.outcomeLabel,
          damRoll: config.damRoll,
          damCrit: config.damCrit,
          damShield: config.damShield,
          damMod: config.damMod,
          subType: config.subType,
          fixedOpp: config.fixedOpp,
          action: config.action,
          actionLabel: game.i18n.localize(`PEN.actions.${config.action}`),
          userID: config.userID,
          neutralRoll: config.neutralRoll,
        },
      ],
    };

    // updated existing card, if any
    const existingOpenCard = await OPCard.checkNewMsg(config);
    if (existingOpenCard) {
      await OPCard.OPAdd(chatMsgData, existingOpenCard);
      return;
    }
    // create a new card
    const html = await PENCheck.startChat(chatMsgData);
    const msgID = await PENCheck.showChat(html, chatMsgData);
    return msgID;
  }
}
