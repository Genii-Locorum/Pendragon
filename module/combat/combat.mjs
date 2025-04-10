import { PENCheck, RollType, CardType, RollResult } from "../apps/checks.mjs";

export class PendragonCombat extends Combat {
  // for now we use 'skirmish' for standard Combat
  // and 'feast' for feast rules
  encounterType = "skirmish";

  isFeast() {
    return this.encounterType == "feast";
  }

  switchEncounterType() {
    if (this.isFeast()) {
      this.encounterType = "skirmish";
    }
    else{
      this.encounterType = "feast";
    }
    ui.combat.initialize();
  }

  async rollInitiative(
    ids,
    { formula = null, updateTurn = true, messageOptions = {} } = {},
  ) {
    // special rules for a feast
    if (this.isFeast()) {
      await this.rollFeastInitiative(ids, {
        formula,
        updateTurn,
        messageOptions,
      });
      return this;
    }
    await super.rollInitiative(ids, { formula, updateTurn, messageOptions });
    return this;
  }

  async rollFeastInitiative(
    ids,
    { formula = null, updateTurn = true, messageOptions = {} } = {},
  ) {
    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    //const currentId = this.combatant?.id;
    const updates = [];
    for (let [i, id] of ids.entries()) {
      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id);
      if (!combatant?.isOwner) continue;
      // unopposed glory roll
      let level = await PENCheck.makeDirectRoll(
        combatant.actor,
        RollType.GLORY,
        CardType.UNOPPOSED,
      );
      // Fumble = reroll but reduce level by 1
      if (level == RollResult.FUMBLE) {
        level = await PENCheck.makeDirectRoll(
          combatant.actor,
          RollType.GLORY,
          CardType.UNOPPOSED,
        );
        if (level > RollResult.FUMBLE) {
          level -= 1;
        }
      }
      // Above = crit
      // Closer = success
      // Further = fail
      // TODO: small feast move up one level of success
      // TODO: royal feast above and closer move down one level
      // we want to use glory as the tiebreaker
      const fractionalGlory = combatant.actor.system.glory / 10000;
      var gloryRoll = updates.push({
        _id: id,
        initiative: level + fractionalGlory,
      });
    }
    if (!updates.length) return this;

    // Update multiple combatants
    await this.updateEmbeddedDocuments("Combatant", updates);
    return this;
  }
}
