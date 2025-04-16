import { PENactorDetails } from "./actorDetails.mjs";
import { OPCard } from "../cards/opposed-card.mjs";
import { COCard } from "../cards/combat-card.mjs";

export class RollType {
  static CHARACTERISTIC = "CH";
  static SKILL = "SK";
  static PASSION = "PA";
  static GLORY = "GL";
  static SQUIRE = "SQ";
  static TRAIT = "TR";
  static DECISION = "DC";
  static DAMAGE = "DM";
  static COMBAT = "CM";
  static MOVE = "MV";
  static ALTMOVE = "AM";
}

export class CardType {
  static UNOPPOSED = "NO";
  static OPPOSED = "OP";
  static FIXED = "RE";
  static COMBAT = "CO";
}

export class RollResult {
  static FUMBLE = 0;
  static FAIL = 1;
  static SUCCESS = 2;
  static CRITICAL = 3;
}

export class PENCheck {
  //Start to prepare the config
  static async _trigger(options = {}) {
    const config = await PENCheck.normaliseRequest(options);
    if (config === false) {
      return;
    }
    const msgID = await PENCheck.startCheck(config);
    return msgID;
  }

  // shortcut to make direct roll (no dialog)
  static async makeDirectRoll(actor, rollType, cardType) {
    const options = {
      actor,
      rollType,
      cardType,
    };
    const config = await this.normaliseRequest(options);
    //Adjust target Score for check Bonus, reflexive Modifier and calculate critBonus where target score > 20 or <0
    config.targetScore =
      Number(config.targetScore) +
      Number(config.flatMod) +
      Number(config.reflexMod);
    config.grossTarget = config.targetScore;
    if (config.targetScore > 20) {
      config.critBonus = config.targetScore - 20;
      config.targetScore = 20;
    } else if (config.targetScore < 0) {
      config.critBonus = -config.targetScore;
      config.targetScore = 0;
    }

    // make the roll (which updates the config result values)
    await PENCheck.makeRoll(config);
    // TODO: we need a lot more if we're showing the result
    // which we almost definitely need for player-initiated rolls
    return config.resultLevel;
  }

  //Check the request and build out the config
  static async normaliseRequest(options) {
    //Set Basic Config
    let particName = "";
    let particId = "";
    let particType = "";
    let actorType = "";
    let particImg = "icons/svg/mystery-man.svg";
    let partic = "";
    let particActor = "";
    if (options.neutralRoll) {
      particName = options.gmRollName;
    } else {
      partic = await PENactorDetails._getParticipantId(
        options.token,
        options.actor,
      );
      particImg = await PENactorDetails.getParticImg(
        partic.particId,
        partic.particType,
      );
      particActor = await PENactorDetails._getParticipant(
        partic.particId,
        partic.particType,
      );
      particName = partic.particName;
      particId = partic.particId;
      particType = partic.particType;
      actorType = particActor.type;
    }
    let tempItem = "";
    let config = {
      rollType: options.rollType,
      cardType: options.cardType,
      subType: options.subType ?? "",
      dialogTemplate: "systems/Pendragon/templates/dialog/rollOptions.html",
      chatTemplate: "systems/Pendragon/templates/chat/roll-result.html",
      state: options.state ?? "open",
      reflex: options.reflex ?? false,
      decision: options.decision ?? "",
      reverseRoll: options.reverseRoll ?? false,
      oppLabel: options.oppLabel ?? "",
      oppRawScore: options.oppRawScore ?? 0,
      particName,
      particId,
      particType,
      actorType,
      particImg,
      characteristic: options.characteristic ?? false,
      skillId: options.skillId ?? false,
      itemId: options.itemId ?? false,
      targetScore: options.targetScore ?? 0,
      rawScore: options.rawScore ?? 0,
      rollFormula: options.rollFormula ?? "1D20",
      flatMod: options.flatMod ?? 0,
      critBonus: options.critBonus ?? 0,
      resultLevel: options.resultLevel ?? 0,
      reflexMod: options.reflexMod ?? 0,
      shiftKey: options.shiftKey ?? false,
      label: options.label ?? "",
      outcome: options.outcome ?? "",
      outcomeLabel: options.outcomeLabel ?? "",
      checkMsgId: options.checkMsgId ?? false,
      damRoll: options.damRoll ?? false,
      damCrit: options.damCrit ?? false,
      damShield: options.damShield ?? false,
      fixedOpp: options.fixedOpp ?? 0,
      inquiry: options.inquiry ?? "no",
      action: "attack",
      userID: game.user._id,
      gmRollScore: options.gmRollScore ?? 0,
      neutralRoll: options.neutralRoll ?? false,
    };

    //Adjust Config based on roll type
    switch (options.rollType) {
      case RollType.CHARACTERISTIC:
        config.label =
          particActor.system.stats[config.characteristic].labelShort ?? "";
        config.rawScore =
          particActor.system.stats[config.characteristic].total ?? 0;
        break;
      case RollType.SKILL:
        if (config.neutralRoll) {
          config.label = "";
          config.rawScore = config.gmRollScore ?? 0;
        } else {
          tempItem = particActor.items.get(config.skillId);
          config.label = tempItem.name ?? "";
          config.rawScore = tempItem.system.total ?? 0;
        }
        break;
      case RollType.PASSION:
        tempItem = particActor.items.get(config.skillId);
        config.label = tempItem.name ?? "";
        config.rawScore = tempItem.system.total ?? 0;
        break;
      case RollType.GLORY:
        config.label = game.i18n.localize("PEN.glory");
        if (particActor.type === "character") {
          config.rawScore = Math.round(particActor.system.glory / 1000) ?? 0;
        } else {
          config.rawScore =
            Math.round(particActor.system.gloryAward / 1000) ?? 0;
        }
        break;
      case RollType.SQUIRE:
        if (config.subType === "actorSquire") {
          let particActor = await PENactorDetails._getParticipant(
            config.particId,
            config.particType,
          );
          config.label = game.i18n.localize("PEN.squire");
          config.rawScore = particActor.system.squire ?? 0;
        } else if (config.subType === "actorAge") {
          let particActor = await PENactorDetails._getParticipant(
            config.particId,
            config.particType,
          );
          config.label = game.i18n.localize("PEN.age");
          config.rawScore =
            game.settings.get("Pendragon", "gameYear") -
              particActor.system.born -
              9 ?? 0;
        } else {
          tempItem = particActor.items.get(config.itemId);
          if (config.subType === "squire") {
            config.label =
              tempItem.name + "[" + game.i18n.localize("PEN.squire") + "]";
            config.rawScore = tempItem.system.skill ?? 0;
          } else if (config.subType === "squireAge") {
            config.label =
              tempItem.name + "[" + game.i18n.localize("PEN.age") + "]";
            config.rawScore = tempItem.system.age - 9 ?? 0;
          } else if (config.subType === "followerSquire") {
            config.label =
              tempItem.system.person1Name +
              "[" +
              game.i18n.localize("PEN.squire") +
              "]";
            config.rawScore = tempItem.system.squire ?? 0;
          } else if (config.subType === "followerAge") {
            config.label =
              tempItem.system.person1Name +
              "[" +
              game.i18n.localize("PEN.age") +
              "]";
            config.rawScore =
              game.settings.get("Pendragon", "gameYear") -
                tempItem.system.born -
                9 ?? 0;
          }
        }
        break;
      case RollType.TRAIT:
        tempItem = particActor.items.get(config.skillId);
        if (config.subType === "trait") {
          config.label = tempItem.name ?? "";
          config.rawScore = tempItem.system.total ?? 0;
        } else {
          config.label = tempItem.system.oppName ?? "";
          config.rawScore = tempItem.system.oppvalue ?? 0;
        }
        break;
      case RollType.DECISION:
        tempItem = particActor.items.get(config.skillId);
        config.rawScore = tempItem.system.total ?? 0;
        config.oppRawScore = tempItem.system.oppvalue ?? 0;
        config.label = tempItem.name ?? "";
        config.oppLabel = tempItem.system.oppName ?? "";
        config.reflex = true;
        config.subType = "trait";

        if (tempItem.system.oppvalue > 15) {
          config.rawScore = tempItem.system.oppvalue ?? 0;
          config.oppRawScore = tempItem.system.total ?? 0;
          config.label = tempItem.system.oppName ?? "";
          config.oppLabel = tempItem.name ?? "";
          config.decision = "opp";
          config.subType = "opptrait";
        } else if (tempItem.system.total < 16) {
          config.decision = "choose";
          config.shiftKey = false;
        }
        break;
      case RollType.DAMAGE:
        tempItem = particActor.items.get(config.itemId);
        config.label = tempItem.name ?? "";
        if (tempItem.type === "horse") {
          if (config.shiftKey) {
            config.rollFormula = tempItem.system.chargeDmg;
          } else {
            config.rollFormula = tempItem.system.damage;
          }
        } else {
          if (particActor.type === "character") {
            config.rollFormula = tempItem.system.damage;
          } else {
            config.rollFormula = tempItem.system.dmgForm;
          }
        }
        if (config.damCrit) {
          if (tempItem.system.damageChar === 'b') {
            config.rollFormula = config.rollFormula + "+2D6";
          } else {
            config.rollFormula = config.rollFormula + "+4D6";
          }
        }
        config.shiftKey = true;
        break;
      case RollType.COMBAT:
        if (config.neutralRoll) {
          config.label = "";
          config.rawScore = config.gmRollScore ?? 0;
        } else {
          tempItem = particActor.items.get(config.itemId);
          config.label = tempItem.name ?? "";
          config.skillId = tempItem.system.sourceId;
          config.rawScore = tempItem.system.total ?? 0;
          if (particActor.type != "character") {
            config.rawScore = tempItem.system.value;
          }
          if (tempItem.system.improv) {
            config.flatMod = -5;
          }
        }
        break;
      case RollType.MOVE:
        config.label = game.i18n.localize("PEN.move");
        if (particActor.type === "npc") {
          config.rawScore = particActor.system.manMove ?? 0;
        } else {
          config.rawScore = particActor.system.move ?? 0;
        }
        break;
      case RollType.ALTMOVE:
        config.label = particActor.system.altMoveTitle;
        config.rawScore = particActor.system.altMove ?? 0;
        break;
      default:
        ui.notifications.error(
          options.rollType + ": " + game.i18n.format("PEN.errorRollInvalid"),
        );
        return false;
    }
    config.targetScore = config.rawScore;

    //Check card type - config adjusted later
    switch (options.cardType) {
      case CardType.UNOPPOSED:
        config.state = "closed";
        //config.chatType = CONST.CHAT_MESSAGE_TYPES.ROLL
        config.chatTemplate =
          "systems/Pendragon/templates/chat/roll-result.html";
        break;
      case CardType.FIXED:
        config.state = "closed";
        //config.chatType = CONST.CHAT_MESSAGE_TYPES.ROLL
        config.chatTemplate =
          "systems/Pendragon/templates/chat/roll-fixed-result.html";
        break;
      case CardType.OPPOSED:
      case CardType.COMBAT:
        config.checkMsgId = await OPCard.checkNewMsg(config);
        if (config.checkMsgId === false) {
          config.reflex = true;
        } else {
          let targetMsg = await game.messages.get(config.checkMsgId);
          config.reflexMod = -targetMsg.flags.Pendragon.chatCard[0].reflexMod;
        }
        if (!foundry.utils.isNewerVersion(game.version, "11")) {
          config.chatType = CONST.CHAT_MESSAGE_STYLES.OTHER;
        } else {
          config.chatType = CONST.CHAT_MESSAGE_OTHER;
        }

        config.chatType = CONST.CHAT_MESSAGE_STYLES.OTHER;
        if (options.cardType === CardType.OPPOSED) {
          config.chatTemplate =
            "systems/Pendragon/templates/chat/roll-opposed.html";
        } else {
          config.chatTemplate =
            "systems/Pendragon/templates/chat/roll-combat.html";
        }
        break;
      default:
        ui.notifications.error(
          options.cardType + ": " + game.i18n.format("PEN.errorCardInvalid"),
        );
        return false;
    }
    return config;
  }

  //Start the check now that the config has been prepared
  static async startCheck(config) {
    let particActor = await PENactorDetails._getParticipant(
      config.particId,
      config.particType,
    );
    //If Shift key has been held then accept the defaults above otherwise call a Dialog box for Difficulty, Modifier etc
    if (config.shiftKey) {
    } else {
      let usage = await PENCheck.RollDialog(config);
      if (usage) {
        config.flatMod = Number(usage.get("checkBonus"));
        if (config.reflex) {
          config.reflexMod = Number(usage.get("reflexMod"));
        }
        if (config.cardType === CardType.FIXED) {
          config.fixedOpp = Number(usage.get("fixedOpp"));
        }
        config.inquiry = usage.get("inquiry");
        let tempDecision = usage.get("decisionChoice");
        if (tempDecision == "main") {
          config.decision = tempDecision;
          config.subType = "trait";
        } else if (tempDecision === "opp") {
          config.decision = tempDecision;
          config.subType = "opptrait";
          let tempRaw = config.rawScore;
          config.rawScore = config.oppRawScore;
          config.oppRawScore = tempRaw;
          let tempLabel = config.label;
          config.label = config.oppLabel;
          config.oppLabel = tempLabel;
          config.targetScore = config.rawScore;
        }
        config.action = usage.get("action");
      }
    }

    //Adjust scores etc based on combat action
    switch (config.action) {
      case "mounted":
        let horsemanship = (
          await particActor.items.filter(
            (itm) => itm.flags.Pendragon.pidFlag.id === "i.skill.horsemanship",
          )
        )[0];
        if (!horsemanship) {
          config.targetScore = 0;
        } else if (particActor.type === "character") {
          config.targetScore = Math.min(
            config.targetScore,
            horsemanship.system.total,
          );
        } else {
          config.targetScore = Math.min(
            config.targetScore,
            horsemanship.system.value,
          );
        }
        break;
      case "charge":
        let charge = (
          await particActor.items.filter(
            (itm) => itm.flags.Pendragon.pidFlag.id === "i.skill.charge",
          )
        )[0];
        if (!charge) {
          config.targetScore = 0;
        } else if (particActor.type === "character") {
          config.targetScore = Math.min(
            config.targetScore,
            charge.system.total,
          );
        } else {
          config.targetScore = Math.min(
            config.targetScore,
            charge.system.value,
          );
        }
        break;
      case "evade":
      case "dodge":
        config.targetScore = particActor.system.move;
        break;
      case "unoppAtt":
        config.checkMsgId = false;
        config.reflexMod = 0;
        config.state = "closed";
        config.cardType = CardType.UNOPPOSED;
      //config.chatType = CONST.CHAT_MESSAGE_TYPES.ROLL
    }

    //Adjust target Score for check Bonus, reflexive Modifier and calculate critBonus where target score > 20 or <0
    config.targetScore =
      Number(config.targetScore) +
      Number(config.flatMod) +
      Number(config.reflexMod);
    config.grossTarget = config.targetScore;
    if (config.targetScore > 20) {
      config.critBonus = config.targetScore - 20;
      config.targetScore = 20;
    } else if (config.targetScore < 0) {
      config.critBonus = -config.targetScore;
      config.targetScore = 0;
    }

    await PENCheck.makeRoll(config);

    //If this is an unopposed Combat Roll then set outcomes
    if (
      config.cardType === CardType.UNOPPOSED &&
      config.rollType === RollType.COMBAT
    ) {
      if (config.resultLevel === RollResult.CRITICAL) {
        config.damCrit = true;
      }
      if (config.resultLevel > RollResult.FAIL) {
        config.damRoll = true;
        config.outcome = "W";
        config.outcomeLabel = game.i18n.localize("PEN.comRollW");
      } else {
        config.outcome = "L";
        config.outcomeLabel = game.i18n.localize("PEN.comRollL");
      }
    }

    //Format the data so it's in the same format as will be held in the Chat Message when saved
    let chatMsgData = {
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
          resultLabel: game.i18n.localize(
            "PEN.resultLevel." + config.resultLevel,
          ),
          outcome: config.outcome,
          outcomeLabel: config.outcomeLabel,
          damRoll: config.damRoll,
          damCrit: config.damCrit,
          damShield: config.damShield,
          subType: config.subType,
          fixedOpp: config.fixedOpp,
          action: config.action,
          actionLabel: game.i18n.localize("PEN." + config.action),
          userID: config.userID,
          neutralRoll: config.neutralRoll,
        },
      ],
    };

    //If there is an Open Chat Card for this role to be added to then go to the Add option
    if (config.checkMsgId != false) {
      //Trigger adding check to the card.
      await OPCard.OPAdd(chatMsgData, config.checkMsgId);
      return;
    }

    //Create the ChatMessage and Roll Dice
    const html = await PENCheck.startChat(chatMsgData);
    let msgID = await PENCheck.showChat(html, chatMsgData);

    //Check for adding Improvement tick
    if (
      game.settings.get("Pendragon", "autoXP") &&
      chatMsgData.resultLevel != 1
    ) {
      if (config.cardType === "NO" && config.inquiry != "yes")
        await PENCheck.tickXP(chatMsgData.chatCard[0]);
    }

    //If this is an Unopposed Combat Roll then trigger resolution
    if (config.cardType === "CO" && config.action === "unoppAtt") {
    }

    return msgID;
  }

  //Function to call the Modifier Dialog box
  //
  static async RollDialog(options) {
    const data = {
      cardType: options.cardType,
      label: options.label,
      rollType: options.rollType,
      oppLabel: options.oppLabel,
      decision: options.decision,
      reflex: options.reflex,
      flatMod: options.flatMod,
    };
    const html = await renderTemplate(options.dialogTemplate, data);
    return new Promise((resolve) => {
      let formData = null;
      const dlg = new Dialog(
        {
          title: options.winTitle,
          content: html,
          buttons: {
            roll: {
              label: game.i18n.localize("PEN.rollDice"),
              callback: (html) => {
                formData = new FormData(
                  html[0].querySelector("#check-roll-form"),
                );
                return resolve(formData);
              },
            },
          },
          default: "roll",
          close: () => {},
        },
        { classes: ["Pendragon", "sheet"] },
      );
      dlg.render(true);
    });
  }

  //Call Dice Roll, calculate Result and store original results in rollVal
  static async makeRoll(config) {
    let roll = new Roll(config.rollFormula);
    await roll.evaluate();
    config.roll = roll;
    config.rollResult = Number(roll.total);

    //Cap the roll result at 20
    if (config.rollType === RollType.DAMAGE) {
      config.rollVal = config.rollResult;
    } else {
      config.rollVal = Math.min(
        Number(config.rollResult + config.critBonus),
        20,
      );
    }
    //Don't need success levels in some cases
    if ([RollType.DAMAGE].includes(config.rollType)) {
      return;
    }
    //Get the level of Success
    config.resultLevel = await PENCheck.successLevel(config);

    //If this is a decisionTrait roll and it was failed then consider activating the reverseRoll option
    if (
      config.rollType === RollType.DECISION &&
      config.resultLevel === RollResult.FAIL &&
      !config.reverseRoll
    ) {
      config.reverseRoll = true;
    }

    return;
  }

  // Calculate Success Level
  static async successLevel(config) {
    let resultLevel = -1;
    //Calculate result level
    if (config.rollVal === config.targetScore) {
      resultLevel = RollResult.CRITICAL;
    } else if (config.rollVal < config.targetScore) {
      resultLevel = RollResult.SUCCESS;
    } else if (config.rollVal >= 20) {
      resultLevel = RollResult.FUMBLE;
    } else {
      resultLevel = RollResult.FAIL;
    }

    //If this is a resistance roll and the dice roll is less than the Opposition Value then set result level to 1 Max
    if (
      config.cardType === RollType.FIXED &&
      config.rollVal <= config.fixedOpp
    ) {
      resultLevel = Math.min(resultLevel, RollResult.FAIL);
    }
    return resultLevel;
  }

  // Prep the chat card
  static async startChat(chatMsgData) {
    let html = await renderTemplate(chatMsgData.chatTemplate, chatMsgData);
    return html;
  }

  // Display the chat card and roll the dice
  static async showChat(html, chatMsgData) {
    let alias = game.i18n.localize("PEN.card." + chatMsgData.cardType);
    if (chatMsgData.rollType === RollType.DAMAGE) {
      alias = game.i18n.localize("PEN.damage");
    } else if (chatMsgData.inquiry === "yes") {
      alias = game.i18n.localize("PEN.card.IN");
    }

    let chatData = {};
    chatData = {
      user: game.user.id,
      type: chatMsgData.chatType,
      content: html,
      flags: {
        Pendragon: {
          initiator: chatMsgData.chatCard[0].particId,
          initiatorType: chatMsgData.chatCard[0].particType,
          chatTemplate: chatMsgData.chatTemplate,
          state: chatMsgData.state,
          cardType: chatMsgData.cardType,
          rollType: chatMsgData.rollType,
          successLevel: chatMsgData.successLevel,
          inquiry: chatMsgData.inquiry,
          chatCard: chatMsgData.chatCard,
        },
      },

      speaker: {
        actor: chatMsgData.chatCard[0].particId,
        alias: alias,
      },
    };

    if (chatMsgData.inquiry === "yes") {
      chatData.whisper = ChatMessage.getWhisperRecipients("GM");
      //chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
      chatData.blind = true;
      chatData.rollMode = "blindroll";
    }
    if (["NO", "OP", "RE"].includes(chatMsgData.cardType)) {
      chatData.rolls = [chatMsgData.rolls];
    }
    let msg = await ChatMessage.create(chatData);
    return msg._id;
  }

  //Check to see if can add XP check.  For characters only
  static async tickXP(chatCard) {
    if (chatCard.neutralRoll) {
      return;
    }
    //If Fumble and FumbleXP game setting is false don't make roll
    if (
      chatCard.resultLevel === 0 &&
      !game.settings.get("Pendragon", "fumbleXP")
    ) {
      return;
    }
    //If an evade or dodge action then no tick.
    if (["dodge", "evade"].includes(chatCard.action)) {
      return;
    }
    let actor = await PENactorDetails._getParticipant(
      chatCard.particId,
      chatCard.particType,
    );
    if (actor.type != "character") {
      return;
    }
    let checkProp = "";
    switch (chatCard.rollType) {
      case RollType.SKILL:
      case RollType.PASSION:
        checkProp = { "system.XP": true };
        break;
      case RollType.TRAIT:
      case RollType.DECISION:
        if (chatCard.subType === "trait" && chatCard.resultLevel > 0) {
          checkProp = { "system.XP": true };
        } else if (chatCard.subType === "trait" && chatCard.resultLevel === 0) {
          checkProp = { "system.oppXP": true };
        } else if (chatCard.subType != "trait" && chatCard.resultLevel > 0) {
          checkProp = { "system.oppXP": true };
        } else if (chatCard.subType != "trait" && chatCard.resultLevel === 0) {
          checkProp = { "system.XP": true };
        }
        break;
      case RollType.COMBAT:
        checkProp = { "system.XP": true };
        break;
      default:
        return;
    }
    if (checkProp != "") {
      let item = "";
      if (chatCard.rollType === RollType.COMBAT) {
        item = actor.items.get(
          actor.items.get(chatCard.itemId).system.sourceID,
        );
      } else {
        item = actor.items.get(chatCard.skillId);
      }
      await item.update(checkProp);
    }
  }

  //Function when Chat Message buttons activated to call socket
  static async triggerChatButton(event) {
    const targetElement = event.currentTarget;
    const presetType = targetElement.dataset?.preset;
    const dataset = targetElement.dataset;
    const targetChat = $(targetElement).closest(".message");
    let targetChatId = targetChat[0].dataset.messageId;
    let origin = game.user.id;
    let originGM = game.user.isGM;

    if (game.user.isGM) {
      PENCheck.handleChatButton({
        presetType,
        targetChatId,
        origin,
        originGM,
        event,
        dataset,
      });
    } else {
      const availableGM = game.users.find((d) => d.active && d.isGM)?.id;
      if (availableGM) {
        game.socket.emit("system.Pendragon", {
          type: "chatUpdate",
          to: availableGM,
          value: { presetType, targetChatId, origin, originGM, event, dataset },
        });
      } else {
        ui.notifications.warn(game.i18n.localize("PEN.noAvailableGM"));
      }
    }
  }

  //Handle changes to Cards based on the presetType value - will be carried out by a GM
  static async handleChatButton(data) {
    const presetType = data.presetType;
    let targetMsg = await game.messages.get(data.targetChatId);

    switch (presetType) {
      case "close-card":
        await OPCard.OPClose(data);
        break;
      case "remove-op-roll":
        await OPCard.OPRemove(data);
        break;
      case "resolve-op-card":
        await OPCard.OPResolve(data);
        break;
      case "resolve-co-card":
        await COCard.COResolve(data);
        break;
      case "reverseRoll":
        await PENCheck.reverseTrait(targetMsg);
        return;
        break;
      case "dam-co-card":
        await COCard.combatDamageRoll(data);
        return;
        break;

      default:
        return;
    }
    const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon);
    await targetMsg.update({ content: pushhtml });
    return;
  }

  //Routine to close existing Decision Trait roll on a "fail" and trigger new Trait roll with the opposite trait
  static async reverseTrait(targetMsg) {
    //Turn off the revereRoll indicator and update the existing chat message so the button disappears to prevent mutliple rerolls
    let chatCards = targetMsg.flags.Pendragon.chatCard;
    let newChatCards = [];
    for (let cCard of chatCards) {
      cCard.reverseRoll = false;
      newChatCards.push(cCard);
    }
    await targetMsg.update({
      "flags.Pendragon.chatCard": newChatCards,
    });
    const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon);
    await targetMsg.update({ content: pushhtml });
    //PREP A HAND IN TO A NEW TRAIT WITH OPPOSITE CHARACTERISTICS
    let actor = await PENactorDetails._getParticipant(
      targetMsg.flags.Pendragon.chatCard[0].particId,
      targetMsg.flags.Pendragon.chatCard[0].particType,
    );
    let subType = "trait";
    if (targetMsg.flags.Pendragon.chatCard[0].subType === "trait") {
      subType = "oppTrait";
    }
    await PENCheck._trigger({
      rollType: RollType.TRAIT,
      cardType: CardType.UNOPPOSED,
      subType,
      shiftKey: true,
      reflex: true,
      skillId: targetMsg.flags.Pendragon.chatCard[0].skillId,
      reflexMod: -targetMsg.flags.Pendragon.chatCard[0].reflexMod,
      actor: actor,
      token: null,
    });
  }
}
