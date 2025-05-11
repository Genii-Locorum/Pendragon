import { RollType, PENCheck, CardType } from "../apps/checks.mjs";
import { isCtrlKey } from "../apps/helper.mjs";

export class PENRollType {
  //Roll Types
  //CH = Characteristic
  //SK = Skill
  //PA = Passion
  //GL = Glory Roll
  //SQ = Squire Roll
  //TR = Trait
  //DC = Decision (Trait)
  //DM = Damage
  //CM = Combat
  //MV = Move
  //AM = Alternative Move

  //Card Types
  //NO = Normal Roll (unopposed)
  //OP = Opposed Roll
  //CO = Combat Roll
  //RE = Resistance (Fixed Opposed Roll)

  //Start a Stat Check
  static async _onStatCheck(event) {
    let ctrlKey = isCtrlKey(event ?? false);
    let cardType = CardType.UNOPPOSED;
    let characteristic = event.currentTarget.dataset.stat;
    if (event.altKey) {
      cardType = CardType.OPPOSED;
    } else if (ctrlKey) {
      cardType = CardType.FIXED;
    }
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType: RollType.CHARACTERISTIC,
      cardType,
      characteristic,
      shiftKey: event.shiftKey,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a GM Roll
  static async _onGMRoll(event) {
    let shiftKey = event?.shiftKey;
    if (!game.user.isGM) {
      ui.notifications.error(game.i18n.format("PEN.notGM"));
      return;
    }
    let cardType = CardType.OPPOSED;
    let gmRollName = "GM";
    let gmRollScore = 10;
    let rollType = RollType.SKILL;

    let usage = await PENRollType.GMRollDialog();
    if (usage) {
      cardType = usage.get("rollType");
      gmRollName = usage.get("particName");
      gmRollScore = usage.get("score");
    } else {
      return;
    }
    if (game.settings.get("Pendragon", "switchShift")) {
      shiftKey = !shiftKey;
    }

    if (cardType === "CO") {
      rollType = RollType.COMBAT;
    }

    PENCheck._trigger({
      rollType,
      cardType,
      gmRollName,
      gmRollScore,
      shiftKey: shiftKey,
      neutralRoll: true,
    });
  }

  //Start a Skill Check
  static async _onSkillCheck(event) {
    let ctrlKey = isCtrlKey(event ?? false);
    let cardType = CardType.UNOPPOSED;
    let skillId = event.currentTarget.dataset.itemid;
    if (event.altKey) {
      cardType = CardType.OPPOSED;
    } else if (ctrlKey) {
      cardType = CardType.FIXED;
    }
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType: RollType.SKILL,
      cardType,
      skillId,
      shiftKey: event.shiftKey,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a Passion Check
  static async _onPassionCheck(event) {
    let ctrlKey = isCtrlKey(event ?? false);
    let cardType = CardType.UNOPPOSED;
    let skillId = event.currentTarget.dataset.itemid;
    let flatMod = 0;
    let passion = this.actor.items.get(skillId);
    if (passion.flags.Pendragon.pidFlag.id === "i.passion.honour") {
      flatMod = passion.system.dishonour;
    }
    if (event.altKey) {
      cardType = CardType.OPPOSED;
    } else if (ctrlKey) {
      cardType = CardType.FIXED;
    }
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType: RollType.PASSION,
      cardType,
      skillId,
      flatMod,
      shiftKey: event.shiftKey,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a Glory Check
  static async _onGloryCheck(event) {
    let ctrlKey = isCtrlKey(event ?? false);
    let cardType = CardType.UNOPPOSED;
    if (event.altKey) {
      cardType = CardType.OPPOSED;
    } else if (ctrlKey) {
      cardType = CardType.FIXED;
    }
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType: RollType.GLORY,
      cardType,
      shiftKey: event.shiftKey,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a Move Check
  static async _onMoveCheck(event) {
    let ctrlKey = isCtrlKey(event ?? false);
    let cardType = CardType.UNOPPOSED;
    let rollType = RollType.MOVE;
    if (event.currentTarget.dataset.property === "altmove") {
      rollType = RollType.ALTMOVE;
    }
    if (event.altKey) {
      cardType = CardType.OPPOSED;
    } else if (ctrlKey) {
      cardType = CardType.FIXED;
    }
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType,
      cardType,
      shiftKey: event.shiftKey,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a Squire Check
  static async _onSquireCheck(event) {
    let ctrlKey = isCtrlKey(event ?? false);
    let subType = event.currentTarget.dataset.type;
    let cardType = CardType.UNOPPOSED;
    let itemId = event.currentTarget.dataset.itemid;
    if (event.altKey) {
      cardType = CardType.OPPOSED;
    } else if (ctrlKey) {
      cardType = CardType.FIXED;
    }
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType: RollType.SQUIRE,
      cardType,
      shiftKey: event.shiftKey,
      itemId,
      subType,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a Trait Check
  static async _onTraitCheck(event) {
    let ctrlKey = isCtrlKey(event ?? false);
    let cardType = "NO";
    let subType = event.currentTarget.dataset.type;
    let skillId = event.currentTarget.dataset.itemid;
    if (event.altKey) {
      cardType = "OP";
    } else if (ctrlKey) {
      cardType = "RE";
    }
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType: RollType.TRAIT,
      cardType,
      subType,
      shiftKey: event.shiftKey,
      skillId,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a Decision Trait Check
  static async _onDecisionCheck(event) {
    let cardType = "NO";
    let skillId = event.currentTarget.dataset.itemid;
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType: RollType.DECISION,
      cardType,
      shiftKey: event.shiftKey,
      skillId,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a Damage Roll
  static async _onDamageRoll(event) {
    let damCrit = false;
    if (event.altKey) {
      damCrit = true;
    }
    let cardType = "NO";
    let itemId = event.currentTarget.dataset.itemid;
    PENCheck._trigger({
      rollType: RollType.DAMAGE,
      cardType,
      shiftKey: event.shiftKey,
      itemId,
      damCrit,
      actor: this.actor,
      token: this.token,
    });
  }

  //Start a Combat Check
  static async _onCombatCheck(event) {
    let cardType = "CO";
    let itemId = event.currentTarget.dataset.itemid;
    if (game.settings.get("Pendragon", "switchShift")) {
      event.shiftKey = !event.shiftKey;
    }
    PENCheck._trigger({
      rollType: RollType.COMBAT,
      cardType,
      shiftKey: event.shiftKey,
      itemId,
      actor: this.actor,
      token: this.token,
    });
  }

  //Function to call the GM Roll Dialog box
  static async GMRollDialog(options) {
    const data = {};
    const html = await renderTemplate(
      "systems/Pendragon/templates/dialog/gmRollOptions.html",
      data,
    );
    return new Promise((resolve) => {
      let formData = null;
      const dlg = new Dialog(
        {
          title: game.i18n.localize("PEN.gmRoll"),
          content: html,
          buttons: {
            roll: {
              label: game.i18n.localize("PEN.rollDice"),
              callback: (html) => {
                formData = new FormData(
                  html[0].querySelector("#check-gmroll-form"),
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
}
