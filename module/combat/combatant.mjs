import { PENCheck } from "../apps/checks.mjs";

export class PendragonCombatant extends Combatant {
  // we don't really have initiative,
  // but actions should be declared from lowest DEX to highest
  getInitiativeRoll(formula) {
    return new Roll(`${this.actor.system.stats.dex.value}`);
  }

  _onCreate(data, options, userID) {
    super._onCreate(data, options, userID);
    this.setFlag("Pendragon", "geniality", 1);
  }

  initGeniality() {
    // based on clothing, setting to one to reflect
    // ordinary standard of living
    this.setFlag("Pendragon", "geniality", 1);
  }
  getGeniality() {
    return this.getFlag("Pendragon", "geniality") || 0;
  }
  addGeniality(val) {
    const curr = this.getFlag("Pendragon", "geniality") || 0;
    this.setFlag("Pendragon", "geniality", curr + val);
  }

}
