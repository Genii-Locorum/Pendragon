import { PendragonActor } from "./actor/actor.mjs";
import { PendragonItem } from "./item/item.mjs";
import { PendragonCombat } from "./combat/combat.mjs";
import { PendragonCombatant } from "./combat/combatant.mjs";
import { preloadHandlebarsTemplates } from "./setup/templates.mjs";
import { PENDRAGON } from "./setup/config.mjs";
import { handlebarsHelper } from "./setup/handlebar-helper.mjs";
import { PendragonHooks } from "./hooks/index.mjs";
import { registerSettings } from "./setup/register-settings.mjs";
//import { PENMenu, PENLayer } from "./setup/layers.mjs";
import { PENLayer } from "./setup/layers.mjs";
import { PENSystemSocket } from "./apps/socket.mjs";
import * as Chat from "./apps/chat.mjs";
import { PENTooltips } from "./apps/tooltips.mjs";
import { PENRollType } from "./cards/rollType.mjs";
import { migrateWorld } from "./setup/migrations.mjs";
import { PendragonCombatTracker } from "./apps/combat-tracker.mjs";
import { PendragonStatusEffects } from "./apps/status-effects.mjs";
import { PIDEditor } from "./pid/pid-editor.mjs";
import drawNote from "./hooks/draw-note.mjs";
import RenderNoteConfig from './hooks/render-note-config.mjs'
import ChaosiumCanvasInterfaceInit from './apps/chaosium-canvas-interface-init.mjs'
import RenderRegionBehaviorConfig from './hooks/render-region-behavior-config.mjs'
import RenderRegionConfig from './hooks/render-region-config.mjs'
import { PendragonCalendarWidget } from "./apps/pendragon-calendar.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.Pendragon = {
    PendragonActor,
    PendragonItem,
    rollItemMacro,
    GMRollMacro,
    ClickRegionLeftUuid: ChaosiumCanvasInterfaceInit.ClickRegionLeftUuid,
    ClickRegionRightUuid: ChaosiumCanvasInterfaceInit.ClickRegionRightUuid
  };
  //Add skill categories
  game.Pendragon.skillCategories = ["combat", "courtly", "minsterly", "knightly", "nonknightly", "ladies", "woodcraft"]


  // Add custom constants for configuration.
  CONFIG.PENDRAGON = PENDRAGON;

  //Register Handlebar Helpers & settings
  handlebarsHelper();
  registerSettings();

  // Define custom Document classes
  CONFIG.Actor.documentClass = PendragonActor;
  CONFIG.Item.documentClass = PendragonItem;
  CONFIG.Combat.documentClass = PendragonCombat;
  CONFIG.Combatant.documentClass = PendragonCombatant;

  CONFIG.statusEffects = PendragonStatusEffects.allStatusEffects;
  CONFIG.ui.combat = PendragonCombatTracker;
  CONFIG.Canvas.layers.pendragonmenu = { group: 'interface', layerClass: PENLayer };
  // hides the dummy menu item
  Hooks.on("renderSceneControls", PENLayer.renderControls);
  game.Pendragon.ui = { calendar: new PendragonCalendarWidget() };

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

Hooks.on("ready", async () => {
  game.socket.on("system.Pendragon", async (data) => {
    PENSystemSocket.callSocket(data);
  });
});

if (foundry.utils.isNewerVersion(game.version, '13')) {
  Hooks.on('drawNote', drawNote)
  Hooks.on('renderNoteConfig', RenderNoteConfig)
}

//Add sub-titles in Config Settings for Pendragon Game Settings
Hooks.on("renderSettingsConfig", (app, html, options) => {
  const systemTab = $(app.form).find(".tab[data-tab=system]");

  systemTab
    .find("input[name=Pendragon\\.autoXP]")
    .closest("div.form-group")
    .before(
      '<h3 class="setting-header">' +
      game.i18n.localize("PEN.Settings.xpCheck") +
      "</h3>",
    );

  systemTab
    .find("input[name=Pendragon\\.switchShift]")
    .closest("div.form-group")
    .before(
      '<h3 class="setting-header">' +
      game.i18n.localize("PEN.Settings.diceRolls") +
      "</h3>",
    );

  systemTab
    .find("input[name=Pendragon\\.tokenVision]")
    .closest("div.form-group")
    .before(
      '<h3 class="setting-header">' +
      game.i18n.localize("PEN.Settings.other") +
      "</h3>",
    );
});

Hooks.on('renderRegionConfig', RenderRegionConfig);

PendragonHooks.listen();

// Add PID to roll tables (for v13)
Hooks.on('renderRollTableSheet', (application, element) =>
  PIDEditor.addPIDSheetHeaderButton(application, element)
);

// Customize combat tracker
Hooks.on("renderCombatTracker", async (combatTracker, html, combatData) =>
  combatTracker.renderTracker(html instanceof HTMLElement ? html : html[0]),
);

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // Always reset GM Tool toggles to False and ensure actors training is false
  if (game.user.isGM) {
    if (game.settings.get("Pendragon", "winter")) {
      game.settings.set("Pendragon", "winter", false);
    }
    if (game.settings.get("Pendragon", "development")) {
      game.settings.set("Pendragon", "development", false);
    }
    if (game.settings.get("Pendragon", "creation")) {
      game.settings.set("Pendragon", "creation", false);
    }
    for (const a of game.actors.contents) {
      if (a.type === "character") {
        await a.update({ "system.status.train": false });
      }
    }
  }
  game.PENTooltips = new PENTooltips();

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (game.user) {
      createItemMacro(data, slot);
      return false;
    }
  });
  console.log(game.Pendragon.ui);
  game.Pendragon.ui?.calendar.render({ force: true });

  if (!game.user.isGM) return;
  // Determine if a system update has occured
  const currentVersion = game.settings.get(
    "Pendragon",
    "systemMigrationVersion",
  );
  const needsMigration =
    !currentVersion || foundry.utils.isNewerVersion(game.system.version, currentVersion);
  if (needsMigration) {
    migrateWorld();
  }
});

//  Hotbar Macros
async function createItemMacro(data, slot) {
  let command = ""
  let macro = ""
  switch (data.type) {
    case "Item":
      // First, determine if this is a valid owned item.
      if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
        return ui.notifications.warn(game.i18n.localize("PEN.noMacroItemOwner"));
      }
      // If it is, retrieve it based on the uuid.
      const item = await Item.fromDropData(data);

      // Create the macro command using the uuid.
      command = `game.Pendragon.rollItemMacro("${data.uuid}");`;
      macro = game.macros.find(
        (m) => m.name === item.name && m.command === command,
      );
      if (!macro) {
        macro = await Macro.create({
          name: item.name,
          type: "script",
          img: item.img,
          command: command,
          flags: { "Pendragon.itemMacro": true },
        });
      }
      game.user.assignHotbarMacro(macro, slot);
      return false;
      break;

    case "JournalEntry":
    case "JournalEntryPage":
      command = `await Hotbar.toggleDocumentSheet("${data.uuid}");`;
      const journal = await fromUuid(data.uuid)
      macro = game.macros.find(
        (m) => m.name === journal.name && m.command === command,
      );
      if (!macro) {
        macro = await Macro.create({
          name: journal.name,
          type: "script",
          img: "systems/Pendragon/assets/Icons/bookmarklet.svg",
          command: command,
        });
      }
      game.user.assignHotbarMacro(macro, slot);
      return false;
      break;

    case "Macro":
      let tempMacro = await fromUuid(data.uuid)
      macro = game.macros.find(
        (m) => m.name === tempMacro.name && m.command === command,
      );
      if (!macro) {
        macro = await Macro.create({
          name: tempMacro.name,
          type: "script",
          img: "icons/svg/d20.svg",
          command: tempMacro.command,
        });
      }
      game.user.assignHotbarMacro(macro, slot);
      return false;
      break;

    default:
      return;
      break;
  }
}

//Create a Macro from an Item drop.
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: "Item",
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        game.i18n.format("PEN.noMacroItemFound", { itemName }),
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

//Allow GM Roll functionality
function GMRollMacro() {
  PENRollType._onGMRoll();
}
