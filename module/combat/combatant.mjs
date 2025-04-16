import { PENCheck } from "../apps/checks.mjs";

export class PendragonCombatant extends Combatant {
  // we don't really have initiative,
  // but actions should be declared from lowest DEX to highest
  getInitiativeRoll(formula) {
    return new Roll(`${this.actor.system.stats.dex.value}`);
  }
}
