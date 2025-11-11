import { yearToPeriodName } from "./chronology.mjs";
const { api } = foundry.applications;
export class PendragonCalendarWidget extends api.HandlebarsApplicationMixin(api.ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: "pendragon-calendar",
    classes: ["pendragon", "flexcol", "themed", "ui-control"],
    tag: "aside",
    window: {
      frame: false,
      positioned: false
    },
  }
  static PARTS = {
    controls: {
      id: "controls",
      template: "systems/Pendragon/templates/apps/calendar.hbs"
    },
  }

  async _prepareContext(options) {
    return {
      currentDate: this.#getCurrentDate()
    }
  }

  // insert into the UI layer
  _insertElement(element) {
    const parent = document.getElementById("ui-top");
    parent.prepend(element);
  }

  // since we aren't linked to a document, the lifecycle seems wonky
  // call when year changes to update the date label directly
  updateDate() {
    const label = this.element.querySelector('#pendragon-calendar-date');
    label.innerText = this.#getCurrentDate();
  }

  #getCurrentDate() {
    // TODO: this should come from game.time
    const currentYear = game.settings.get('Pendragon', "gameYear");
    const period = yearToPeriodName(currentYear);
    return `Year ${currentYear} - ${period}`;

  }
}
