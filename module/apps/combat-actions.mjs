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

  // check whether the action inflicts damage
  static canInflictDamage(action) {
    // opposed actions that don't roll damage on win:
    // defend, disarm, dodge, evade, hook, mount, pickup
    const nonDamagingActions = [
      CombatAction.DEFEND, CombatAction.DISARM, CombatAction.DODGE, CombatAction.EVADE,
      CombatAction.HOOK, CombatAction.MOUNT, CombatAction.PICKUP
    ];
    if (nonDamagingActions.includes(action))
      return false;
    return true;
  }

  // apply Horsemanship cap to combat rolls if mounted
  static applyHorsemanshipCap(actor, skill) {
    const targetScore = skill.total;
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

  static async requestRollModifiers(action) {
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

  static defaultOptions(actor, action) {
    return {
      actor,
      particName: actor.name,
      particId: actor.id,
      particImg: actor.img,
      particType: "actor",
      actorType: actor.type,
      rollType: RollType.COMBAT,
      cardType: CardType.COMBAT,
      rollFormula: "1D20",
      state: ChatCardState.OPEN,
      chatTemplate: ChatCardTemplate.COMBAT,
      chatType: CONST.CHAT_MESSAGE_STYLES.OTHER,
      action,
      flatMod: 0,
      reflexMod: 0,
    }
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
    // opposed roll by default
    const options = {
      ...this.defaultOptions(actor, action),
      ...this.calcTargets(targetScore, modifier),
      itemId: currentWeapon?.id,
      flatMod: modifier,
      label: currentWeapon.name,
      rawScore: currentWeapon.total,
      skillId: weapon?.system.sourceId ?? actor.getItemByPid("i.skill.brawling")?.id,
    }
    return options;
  }

  static calcTargets(targetScore, modifier) {
    const grossTarget = targetScore + modifier;
    const options = {
      grossTarget,
      targetScore: grossTarget,
      critBonus: 0,
    }
    if (grossTarget > 20) {
      options.critBonus = grossTarget - 20;
      options.targetScore = 20;
    } else if (grossTarget < 0) {
      options.critBonus = -grossTarget;
      options.targetScore = 0;
    }
    return options;
  }

  // adjust modifiers based on opponent
  // these should alway be applied after opposed roll is made
  // but before outcome is calculated
  static adjustOpposingModifiers(config, opponent) {
    const originalTarget = config.grossTarget - config.flatMod;
    //  reckless vs defend (treat as attack vs attack; cancel defend bonus)
    if (config.action == CombatAction.DEFEND && opponent.action == this.RECKLESS) {
      config.flatMod -= 10;
    }
    //  mounted vs foot or foot vs prone(height advantage)
    //  foot using reach weapon vs mounted (cancels height advantage)
    //  opponent using reckless +5
    if (config.action != CombatAction.DEFEND && opponent.action == this.RECKLESS) {
      config.flatMod += 5;
    }

    // recalculate the gross target
    const grossTarget = originalTarget + config.flatMod;
    // if this hasn't changed, we don't need to do anything
    if (grossTarget == config.grossTarget) {
      return;
    }
    // re-calculate target and crit bonus
    if (grossTarget > 20) {
      config.critBonus = grossTarget - 20;
      config.targetScore = 20;
    } else if (grossTarget < 0) {
      config.critBonus = -grossTarget;
      config.targetScore = 0;
    } else {
      config.targetScore = grossTarget;
      config.critBonus = 0;
    }
    config.grossTarget = grossTarget;

    config.rollVal = config.rollResult + config.critBonus;
    config.resultLevel = PENCheck.successLevel(config);
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

  // Standard Attack
  static async attack(actor, unopposed = false) {
    // standard opposed weapon roll
    const options = await this.opposedWeaponRollOptions(actor, CombatAction.ATTACK);

    // allow for unopposed roll
    if (unopposed) {
      options.action = CombatAction.UNOPPOSED_ATTACK;
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
    }

    // make the roll
    await PENCheck.makeRoll(options);

    // set the outcome if unopposed
    if (unopposed) {
      this.applyUnopposedOutcome(options);
    }

    await this.createChatCard(options);
  }

  // Reckless Attack
  static async recklessAttack(actor, unopposed = false) {
    // standard opposed weapon roll
    const options = await this.opposedWeaponRollOptions(actor, CombatAction.RECKLESS);

    // allow for unopposed roll
    if (unopposed) {
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
    }

    // make the roll
    await PENCheck.makeRoll(options);

    // set the outcome if unopposed
    if (unopposed) {
      this.applyUnopposedOutcome(options);
    }

    await this.createChatCard(options);
  }

  // DEFEND
  static async defend(actor, unopposed = false) {
    // standard opposed weapon roll
    const options = await this.opposedWeaponRollOptions(actor, CombatAction.DEFEND);

    // allow for unopposed roll
    if (unopposed) {
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
    }

    // make the roll
    await PENCheck.makeRoll(options);

    // set the outcome if unopposed
    if (unopposed) {
      this.applyUnopposedOutcome(options);
    }

    await this.createChatCard(options);
  }

  static async mount(actor, unopposed = false) {
    const targetScore = this.applyHorsemanshipCap(actor, { total: actor.system.move });
    // will use as flatMod but later make more granular
    const modifier = await this.requestRollModifiers(action);
    // opposed roll by default
    const options = {
      ...this.defaultOptions(actor, CombatAction.MOUNT),
      ...this.calcTargets(targetScore, modifier),
      flatMod: modifier,
      label: game.i18n.localize("PEN.move"),
      rawScore: actor.system.move,
    }
    // allow for unopposed roll
    if (unopposed) {
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
      // leap into saddle requires a roll
      // or mount carefully unopposed
      actor.mountCurrentHorse();
      await this.createDeclarationCard(options, `${options.particName} mounts their horse.`);
      return;
    }
    // make the roll
    await PENCheck.makeRoll(options);
    await this.createChatCard(options);
  }

  static async dismount(actor, unopposed = false) {
    const targetScore = this.applyHorsemanshipCap(actor, { total: actor.system.move });
    // will use as flatMod but later make more granular
    const modifier = await this.requestRollModifiers(action);
    // opposed roll by default
    const options = {
      ...this.defaultOptions(actor, CombatAction.MOUNT),
      ...this.calcTargets(targetScore, modifier),
      flatMod: modifier,
      label: game.i18n.localize("PEN.move"),
      rawScore: actor.system.move,
    }
    // allow for unopposed roll
    if (unopposed) {
      options.cardType = CardType.UNOPPOSED;
      options.state = ChatCardState.CLOSED;
      // leap out of saddle requires a roll
      // or mount carefully unopposed
      actor.dismountCurrentHorse();
      await this.createDeclarationCard(options, `${options.particName} dismounts their horse.`);
      return;
    }
    // make the roll
    await PENCheck.makeRoll(options);
    await this.createChatCard(options);
  }

  static async claimPrisoner(actor) {
    const options = {
      ...this.defaultOptions(actor, CombatAction.PRISONER),
      ...this.calcTargets(0, 0),
      cardType: CardType.UNOPPOSED,
      state: ChatCardState.CLOSED,
    };
    console.log(options);
    // TODO: we only do this because we're using common code that expects a roll
    // we may need to clean that up a bit
    await PENCheck.makeRoll(options);
    await this.createDeclarationCard(options, `${options.particName} claims a prisoner.`);
  }

  // used to declare an unopposed action with an automatic success
  // examples: don armor, study, pick up, claim prisoner
  static async createDeclarationCard(config, message) {
    const chatMsgData = {
      rollType: config.rollType,
      cardType: config.cardType,
      chatType: config.chatType,
      chatTemplate: ChatCardTemplate.DECLARE,
      state: config.state,
      rolls: config.roll,
      resultLevel: config.resultLevel,
      rollResult: config.rollResult,
      inquiry: config.inquiry,
      card: {
        particId: config.particId,
        particType: config.particType,
        particName: config.particName,
        particImg: config.particImg,
        action: config.action,
        actionLabel: game.i18n.localize(`PEN.actions.${config.action}`),
        content: message,
      }
    };
    chatMsgData.chatCard = [chatMsgData.card];
    const html = await PENCheck.startChat(chatMsgData);
    const msgID = await PENCheck.showChat(html, chatMsgData);
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
