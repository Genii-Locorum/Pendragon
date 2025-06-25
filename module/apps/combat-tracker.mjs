import { RollResult } from "./checks.mjs";

export class PendragonCombatTracker extends (foundry.applications?.sidebar?.tabs?.CombatTracker ?? CombatTracker) {
  // override the render for customization
  renderTracker(html) {
    // actual combat - do the standard thing
    if (!this.viewed) return;

    // V12 = data-control / V13 data-action
    const combatControl = html.querySelector("[data-action='startCombat']");
    const combatControlNav = html.querySelector("nav.combat-controls");
    const hasextraControl = html.querySelector(".pendragon-combat-extras");
    if(combatControl && combatControlNav && !hasextraControl) {
      combatControlNav.before(this.#addEncounterTypeControl(this.viewed));
    }
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
        const init = row.querySelector(".token-initiative span");
        if (init) {
          init.innerText = combatant.actor.system.glory.toLocaleString();
          this.#addGenialityVal(init, combatant);
        }
        // Adjust controls with system extensions
        for (const controlIcon of row.querySelectorAll(".combatant-control.icon")) {

          controlIcon.classList.add("fa-fw");

          if (controlIcon.dataset.action === "pingCombatant") {
            // Use an icon for the `pingCombatant` control that looks less like a targeting reticle
            controlIcon.classList.remove("fa-bullseye-arrow");
            controlIcon.classList.add("fa-signal-stream");
          }
        }
      }
    }
  }

  #addGenialityVal(selectedElement, combatant) {
    const d = document.createElement("div");
    const geniality = combatant.getGeniality();
    d.classList.add("token-geniality");
    d.innerHTML = `<span>${geniality}</span>`;
    selectedElement.insertAdjacentElement("afterend", d);
  }

  #addSeating(list, label, combatants, rollNeeded) {
    const seatingArea = document.createElement("li");
    const above = combatants.filter(c => Math.floor(c.initiative) == rollNeeded);
    const children = above.length ? list.querySelectorAll(Array.from(above).map(c => `[data-combatant-id="${c.id}"]`).join(", ")) : [];
    seatingArea.classList.add("seating");
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
    a.dataset.action = "switchEncounterType";
    if (encounter.isFeast()) {
      a.innerText = game.i18n.localize("PEN.encounterSwitchSkirmish");
    }
    else {
      a.innerText = game.i18n.localize("PEN.encounterSwitchFeast");
    }
    // a.addEventListener("click", event => {
    //   encounter.switchEncounterType();
    //   if (encounter.isFeast()) {
    //     event.target.innerText = game.i18n.localize("PEN.encounterSwitchSkirmish");
    //   }
    //   else {
    //     event.target.innerText = game.i18n.localize("PEN.encounterSwitchFeast");
    //   }
    // });
    nav.append(a);
    return nav;
  }
}
