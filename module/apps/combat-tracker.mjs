import { RollResult } from "./checks.mjs";

export class PendragonCombatTracker extends (foundry.applications?.sidebar?.tabs
  ?.CombatTracker ?? CombatTracker) {
  // override the render for customization
  renderTracker(html) {
    // actual combat - do the standard thing
    if (!this.viewed) return;

    const combatControl = html.querySelector("[data-control='startCombat']");
    const combatControlNav = html.querySelector("#combat-controls");
    if(combatControl && combatControlNav) combatControlNav.before(this.#addEncounterTypeControl(this.viewed));
    // TODO: allow GM to drag and drop actors to reflect new seats
    const combatants = this.viewed.combatants;
    // feast - add the seating areas
    if (this.viewed.isFeast()) {
      const list = html.querySelector(".directory-list, .combat-tracker");
      this.#addSeating(list, game.i18n.localize("PEN.feast.onFloor"), combatants, RollResult.FUMBLE);
      this.#addSeating(list, game.i18n.localize("PEN.feast.farSalt"), combatants, RollResult.FAIL);
      this.#addSeating(list, game.i18n.localize("PEN.feast.closeSalt"), combatants, RollResult.SUCCESS);
      this.#addSeating(list, game.i18n.localize("PEN.feast.aboveSalt"), combatants, RollResult.CRITICAL);
      
      const combatantRows = html.querySelectorAll("li.combatant[data-combatant-id]");
      for (const row of combatantRows) {
        const combatantId = row.dataset.combatantId ?? "";
        const combatant = this.viewed.combatants.get(combatantId, { strict: true });
        const init = row.querySelector(".initiative");
        if (init) init.innerText = combatant.actor.system.glory.toLocaleString();
        // Adjust controls with system extensions
        for (const control of row.querySelectorAll("a.combatant-control")) {
          const controlIcon = control.querySelector("i");
          if (!controlIcon) continue;

          // Ensure even spacing between combatant controls
          controlIcon.classList.remove("fas");
          controlIcon.classList.add("fa-solid", "fa-fw");

          if (control.dataset.control === "pingCombatant") {
            // Use an icon for the `pingCombatant` control that looks less like a targeting reticle
            controlIcon.classList.remove("fa-bullseye-arrow");
            controlIcon.classList.add("fa-signal-stream");
          }
        }
      }
    }
  }

  #addSeating(list, label, combatants, rollNeeded) {
    const seatingArea = document.createElement("li");
    const above = combatants.filter(c => Math.floor(c.initiative) == rollNeeded);
    const children = above.length ? list.querySelectorAll(Array.from(above).map(c => `[data-combatant-id="${c.id}"]`).join(", ")) : [];
    seatingArea.classList.add("combatant");
    seatingArea.innerHTML = `<h3 class="combat-tracker-header">${label}</h3><ol class="seating-list"></ol>`;
    list.prepend(seatingArea);
    seatingArea.querySelector("ol").replaceChildren(...children);
  }

  #addEncounterTypeControl(encounter) {
    const nav = document.createElement("nav");
    nav.classList.add("directory-footer", "flexrow", "pendragon-combat-extras");
    const a = document.createElement("a");
    a.classList.add("combat-control", "center");
    a.setAttribute("role", "button");
    a.dataset.control = "switchEncounterType";
    if (encounter.isFeast()) {
      a.innerText = game.i18n.localize("PEN.encounterSwitchSkirmish");
    }
    else {
      a.innerText = game.i18n.localize("PEN.encounterSwitchFeast");
    }
    a.addEventListener("click", event => {
      this.viewed.switchEncounterType();
    });
    nav.append(a);
    return nav;
  }
}
