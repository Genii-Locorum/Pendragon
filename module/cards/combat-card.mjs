import { PENCheck, RollResult } from '../apps/checks.mjs';
import { OPCard } from "./opposed-card.mjs";
import { PENactorDetails } from "../apps/actorDetails.mjs";
import { CombatAction, CombatOutcome } from '../apps/combat-actions.mjs';

export class COCard {

  //Resolve a combined card - roll dice, update and close
  static async COResolve(config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    let chatCards = targetMsg.flags.Pendragon.chatCard
    if (chatCards.length < 2) {
      ui.notifications.warn(game.i18n.localize('PEN.resolveMore'))
      return
    }

    const result = this.compareCombatResults(chatCards[0], chatCards[1]);
    let newchatCards = []
    for (let cCount = 0; cCount < 2; cCount++) {
      chatCards[cCount].outcome = result[cCount]
      chatCards[cCount].outcomeLabel = game.i18n.localize('PEN.comRoll' + result[cCount])

      //If Critical, Tie or Win then allow Damage Roll
      if (['C', 'T', 'W'].includes(result[cCount])) {
        chatCards[cCount].damRoll = true
      }

      //If Critical then set Damage Roll to critical
      if (['C'].includes(result[cCount])) {
        chatCards[cCount].damCrit = true
      }

      //If made Dodge or Evade roll then don't cause damage
      if (['evade', 'dodge'].includes(chatCards[cCount].action)) {
        chatCards[cCount].damRoll = false
        chatCards[cCount].damCrit = false
      }

      //Set Shield Use if Partial Success or better and opponent is causing damage
      if (['C', 'T', 'W', 'P'].includes(result[cCount])) {
        if (['C', 'T', 'W'].includes(result[1 - cCount])) {
          chatCards[cCount].damShield = true

        }
      }


      newchatCards.push(chatCards[cCount])
      await OPCard.showDiceRoll(chatCards[cCount])
      if (game.settings.get('Pendragon', 'autoXP') && chatCards[cCount].resultLevel != 1) {
        await PENCheck.tickXP(chatCards[cCount])
      }
    }


    await targetMsg.update({
      'flags.Pendragon.chatCard': newchatCards,
      'flags.Pendragon.state': 'closed',
    })
    const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon)
    await targetMsg.update({ content: pushhtml })
    return
  }

  static async resolveCombatRolls(config) {
    const targetMsg = await game.messages.get(config.targetChatId);
    const chatCards = targetMsg.flags.Pendragon.chatCard;
    if (chatCards.length < 2) {
      ui.notifications.warn(game.i18n.localize('PEN.resolveMore'));
      return;
    }

    const [card1, card2] = chatCards;

    // adjust modifiers if needed
    //  reckless vs defend (treat as attack vs attack; cancel defend bonus)
    //  mounted vs foot (height advantage)
    //  foot using reach weapon vs mounted (cancels height advantage)
    //  opponent using reckless +5
    // re-eval results
    //  recalc targetScore, critBonus
    //  rollVal = rollResult + critBonus
    //  resultLevel = PENCheck.successLevel(card)

    // compare the results to determine the outcome
    const [r1, r2] = this.compareCombatResults(card1, card2);

    //map outcomes
    const updatedCard1 = this.mapOutcomeToCard(card1, r1, r2, card2.action);
    const updatedCard2 = this.mapOutcomeToCard(card2, r2, r1, card1.action);

    // show results
    await OPCard.showDiceRoll(updatedCard1);
    if (game.settings.get('Pendragon', 'autoXP') && updatedCard1.resultLevel != 1) {
      await PENCheck.tickXP(updatedCard1);
    }

    await OPCard.showDiceRoll(updatedCard2);
    if (game.settings.get('Pendragon', 'autoXP') && updatedCard2.resultLevel != 1) {
      await PENCheck.tickXP(updatedCard2);
    }

    await targetMsg.update({
      'flags.Pendragon.chatCard': [updatedCard1, updatedCard2],
      'flags.Pendragon.state': 'closed',
    })
    const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon);
    await targetMsg.update({ content: pushhtml });
  }

  // update a card
  static mapOutcomeToCard(card, myResult, otherResult, otherAction) {
    const updatedCard = { ...card };
    // reckless and defend cancel each other out and are treated like opposed attack
    if ((card.action == CombatAction.RECKLESS && otherAction == CombatAction.DEFEND)
      || (card.action == CombatAction.DEFEND && otherAction == CombatAction.RECKLESS)) {
      updatedCard.action = CombatAction.ATTACK;
      otherAction = CombatAction.ATTACK;
    }
    updatedCard.outcome = myResult;
    updatedCard.outcomeLabel = game.i18n.localize(`PEN.comRoll${myResult}`);
    // assume no damage
    updatedCard.damRoll = false;
    updatedCard.damCrit = false;
    // assume no shield/parry
    updatedCard.damShield = false;

    if (this.canInflictDamage(updatedCard.action)) {
      // inflict damage on a win or tie
      if ([CombatOutcome.WIN, CombatOutcome.TIE].includes(myResult)) {
        updatedCard.damRoll = true;
      }

      // inflict critical damage on a critical
      if (myResult == CombatOutcome.CRITICAL) {
        updatedCard.damRoll = true;
        updatedCard.damCrit = true;
      }

      // defend ignores damage on win or tie
      if (otherAction == CombatAction.DEFEND && [CombatOutcome.TIE, CombatOutcome.WIN, CombatOutcome.CRITICAL].includes(otherResult)) {
        updatedCard.damRoll = false;
        updatedCard.damCrit = false;
        updatedCard.outcomeNote = "Opponent does not take damage.";
      }

      // mount ignores damage on win
      if (otherAction == CombatAction.MOUNT && [CombatOutcome.WIN, CombatOutcome.CRITICAL].includes(otherResult)) {
        updatedCard.damRoll = false;
        updatedCard.damCrit = false;
      }
    }

    // check for shield/parry vs a damaging action
    if (this.canInflictDamage(otherAction) && [CombatOutcome.WIN, CombatOutcome.TIE, CombatOutcome.CRITICAL].includes(otherResult)) {
      // by default you get benefit of shield/parry on a partial or better
      if ([CombatOutcome.WIN, CombatOutcome.TIE, CombatOutcome.CRITICAL, CombatOutcome.PARTIAL].includes(myResult)) {
        updatedCard.damShield = true;
      }

      // denied if either party used a reckless attack
      if (updatedCard.action == CombatAction.RECKLESS || otherAction == CombatAction.RECKLESS) {
        updatedCard.damShield = false;
        updatedCard.outcomeNote = "Reckless attacks prevent the use of shields.";
      }

      // denied if mounting up
      if (updatedCard.action == CombatAction.MOUNT) {
        updatedCard.damShield = false;
        updatedCard.outcomeNote = "You may not use a shield when mounting.";
      }
    }

    //  can we adjust the damage formulas here?

    // check for weapon breakage
    //  will weapon break / be dropped?
    // if TIE, swords break most weapons; swords and daggers immune
    // if CRITICAL vs FUMBLE, loser's weapon breaks (even if sword)
    // otherwise, FUMBLE means sword dropped or weapon breaks

    return updatedCard;
  }

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

  static compareCombatResults(p1, p2) {
    // work around fact JS can't use tuple for case statement
    const k = (result1, result2) => `${result1}_${result2}`;
    switch (k(p1.resultLevel, p2.resultLevel)) {
      case k(RollResult.CRITICAL, RollResult.CRITICAL): return [CombatOutcome.TIE, CombatOutcome.TIE];
      case k(RollResult.CRITICAL, RollResult.SUCCESS): return [CombatOutcome.CRITICAL, CombatOutcome.PARTIAL];
      case k(RollResult.CRITICAL, RollResult.FAIL): return [CombatOutcome.CRITICAL, CombatOutcome.LOSE];
      case k(RollResult.CRITICAL, RollResult.FUMBLE): return [CombatOutcome.CRITICAL, CombatOutcome.FUMBLE];
      case k(RollResult.SUCCESS, RollResult.CRITICAL): return [CombatOutcome.PARTIAL, CombatOutcome.CRITICAL];
      // if both succeed, compare the rolls
      case k(RollResult.SUCCESS, RollResult.SUCCESS):
        if (p1.rollVal === p2.rollVal) {
          return [CombatOutcome.TIE, CombatOutcome.TIE];
        }
        else if (p1.rollVal > p2.rollVal) {
          return [CombatOutcome.WIN, CombatOutcome.PARTIAL];
        }
        else {
          return [CombatOutcome.PARTIAL, CombatOutcome.WIN];
        }
      case k(RollResult.SUCCESS, RollResult.FAIL): return [CombatOutcome.WIN, CombatOutcome.LOSE];
      case k(RollResult.SUCCESS, RollResult.FUMBLE): return [CombatOutcome.FUMBLE, CombatOutcome.FUMBLE];

      case k(RollResult.FAIL, RollResult.CRITICAL): return [CombatOutcome.LOSE, CombatOutcome.CRITICAL];
      case k(RollResult.FAIL, RollResult.SUCCESS): return [CombatOutcome.LOSE, CombatOutcome.WIN];
      case k(RollResult.FAIL, RollResult.FAIL): return [CombatOutcome.LOSE, CombatOutcome.LOSE];
      case k(RollResult.FAIL, RollResult.FUMBLE): return [CombatOutcome.LOSE, CombatOutcome.FUMBLE];

      case k(RollResult.FUMBLE, RollResult.CRITICAL): return [CombatOutcome.FUMBLE, CombatOutcome.CRITICAL];
      case k(RollResult.FUMBLE, RollResult.SUCCESS): return [CombatOutcome.FUMBLE, CombatOutcome.WIN];
      case k(RollResult.FUMBLE, RollResult.FAIL): return [CombatOutcome.FUMBLE, CombatOutcome.LOSE];
      case k(RollResult.FUMBLE, RollResult.FUMBLE): return [CombatOutcome.FUMBLE, CombatOutcome.FUMBLE];
    }
  }

  //Generate Damage Roll off the Combat Roll Damage Button
  static async combatDamageRoll(config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    let rank = config.dataset.rank

    //Turn off the DamageRoll button for the clicked button and update the existing chat message so the button disappears to prevent mutliple rerolls
    const chatCards = targetMsg.flags.Pendragon.chatCard
    chatCards[rank].damRoll = false
    const newChatCards = []
    for (let cCard of chatCards) {
      newChatCards.push(cCard)
    }
    await targetMsg.update({
      'flags.Pendragon.chatCard': newChatCards,
    });
    const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon);
    await targetMsg.update({ content: pushhtml });

    //Prep the damage roll with details from combat roll
    let actor = null
    let token = null
    if (targetMsg.flags.Pendragon.chatCard[rank].particType === 'actor') {
      actor = await PENactorDetails._getParticipant(targetMsg.flags.Pendragon.chatCard[rank].particId, targetMsg.flags.Pendragon.chatCard[rank].particType)
    } else if (targetMsg.flags.Pendragon.chatCard[rank].particType === 'token') {
      token = await PENactorDetails._getParticipant(targetMsg.flags.Pendragon.chatCard[rank].particId, targetMsg.flags.Pendragon.chatCard[rank].particType)
    } else { return }

    await PENCheck._trigger({
      rollType: 'DM',
      cardType: 'NO',
      shiftKey: true,
      damCrit: targetMsg.flags.Pendragon.chatCard[rank].damCrit,
      itemId: targetMsg.flags.Pendragon.chatCard[rank].itemId,
      damMod: targetMsg.flags.Pendragon.chatCard[rank].damMod,
      action: chatCards[rank].action,
      actor: actor,
      token: token
    });
    return
  }

}
