import { PENCheck, RollType, CardType, RollResult } from "../apps/checks.mjs";

export class PendragonCombat extends Combat {

  // for now we use 'skirmish' for standard Combat
  // and 'feast' for feast rules
  isFeast() {
    return this.getFlag("Pendragon", "encounterType") == "feast";
  }

  switchEncounterType() {
    if (this.isFeast()) {
      this.setFlag("Pendragon", "encounterType", "skirmish");
    }
    else{
      this.setFlag("Pendragon", "encounterType", "feast");
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
    const messages = [];
    for (let [i, id] of ids.entries()) {
      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id);
      if (!combatant?.isOwner) continue;
      // unopposed glory roll
      const rolldata = await PENCheck.makeDirectRoll(
        combatant.actor,
        RollType.GLORY,
        CardType.UNOPPOSED,
      );
      let level = rolldata.resultLevel;
      // Fumble = reroll but reduce level by 1
      if (level == RollResult.FUMBLE) {
        rolldata.firstRoll = rolldata.rollVal;
        rolldata.firstResultLabel = game.i18n.localize('PEN.resultLevel.'+ level);;
        rolldata.firstRollResult = rolldata.rollResult;
        const reroll = await PENCheck.makeDirectRoll(
          combatant.actor,
          RollType.GLORY,
          CardType.UNOPPOSED,
        );
        rolldata.rollVal = reroll.rollVal;
        rolldata.rollResult = reroll.rollResult;
        level = reroll.resultLevel;
        if (level > RollResult.FUMBLE) {
          level -= 1;
        }
      }
      // Above = crit
      // Closer = success
      // Further = fail
      // using glory as the tiebreaker
      const fractionalGlory = combatant.actor.system.glory / 100_000;
      updates.push({
        _id: id,
        initiative: level + fractionalGlory,
      });

      // Construct chat message data
      const messageData = foundry.utils.mergeObject({
        speaker: ChatMessage.getSpeaker({
          actor: combatant.actor,
          token: combatant.token,
          alias: combatant.name
        }),
        flavor: game.i18n.format("COMBAT.RollsInitiative", {name: combatant.name}),
        flags: {"core.initiativeRoll": true}
      }, messageOptions);
      // ensure we use the adjusted result level
      rolldata.resultLabel = game.i18n.localize('PEN.resultLevel.'+ level);
      rolldata.resultLevel = level;
      rolldata.seatingLabel = game.i18n.localize('PEN.feast.resultLevel.'+ level);
    // Prepare chat data
      const chatData = foundry.utils.mergeObject({
        author: game.user.id,
        content: await renderTemplate('systems/Pendragon/templates/chat/feast-seating.hbs', {chatCard: [rolldata]}),
        // Play 1 sound for the whole rolled set
        sound: i == 0 ? CONFIG.sounds.dice : null
      }, messageData);

      messages.push(chatData);
    }
    if (!updates.length) return this;

    // Update multiple combatants
    await this.updateEmbeddedDocuments("Combatant", updates);
    // publish the roll results
    await ChatMessage.implementation.create(messages);
    return this;
  }

  async startCombat()
  {
    // set combatants to initial geniality
    this.combatants.forEach(c => c.initGeniality());
    // update on next round / previous round
    super.startCombat();
  }

  nextRound()
  {
    if(this.isFeast()) {
      this.combatants.forEach(c => c.addGeniality(Math.floor(c.initiative) - 1));
    }
    super.nextRound();
  }
}
