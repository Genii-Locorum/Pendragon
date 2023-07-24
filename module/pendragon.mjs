import { PendragonActor } from "./actor/actor.mjs";
import { PendragonItem } from "./item/item.mjs";
import { preloadHandlebarsTemplates } from "./setup/templates.mjs";
import { PENDRAGON } from "./setup/config.mjs";
import { handlebarsHelper } from './setup/handlebar-helper.mjs';
import { PendragonHooks } from './hooks/index.mjs'
import { registerSettings } from './setup/register-settings.mjs';
import { PENLayer } from "./setup/layers.mjs"
import { PENWinter } from "./apps/winterPhase.mjs"
import { PENSystemSocket } from "./apps/socket.mjs"


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.Pendragon = {
    PendragonActor,
    PendragonItem,
    rollItemMacro
  };

  // Add custom constants for configuration.
  CONFIG.PENDRAGON = PENDRAGON;

  //Register Handlebar Helpers & settings
  handlebarsHelper();
  registerSettings();

  // Define custom Document classes
  CONFIG.Actor.documentClass = PendragonActor;
  CONFIG.Item.documentClass = PendragonItem;

  
  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

// Set Up Layers for Toolbar
const layers = { Pendragongmtools: { layerClass: PENLayer, group: "primary" } };
CONFIG.Canvas.layers = foundry.utils.mergeObject(Canvas.layers, layers);

Hooks.on('ready', async () => {
  game.socket.on('system.Pendragon', async data => {
    PENSystemSocket.callSocket(data)
  });
});


//Add sub-titles in Config Settings for Pendragon Game Settings
Hooks.on('renderSettingsConfig', (app, html, options) => {
  const systemTab = $(app.form).find('.tab[data-tab=system]')

  systemTab
    .find('input[name=Pendragon\\.gameYear]')
    .closest('div.form-group')
    .before(
      '<h3 class="setting-header">' +
        game.i18n.localize('PEN.Settings.gameSettings') +
        '</h3>'
    )
});

//Add GM controls to Scene - first bit is adding the GM Tools button
Hooks.on('getSceneControlButtons', (buttons) => {
  if(game.user.isGM) {
    const PendragonGMTool = {
      activeTool: "select",
      icon: "fas fa-tools",
      layer: "Pendragongmtools",
      name: "Pendragongmtools",
      title: game.i18n.localize('PEN.GMTools'),
      tools: [],
      visible: true
    };
    // This adds a sub-button - the Winter Phase
    PendragonGMTool.tools.push({
      name: "Session",
      icon: "fas fa-snowflake",
      title:  game.i18n.localize('PEN.winterPhase'),
      active: game.settings.get('Pendragon','winter'),
      toggle: true,
      onClick: async toggle => {await PENWinter.winterPhase(toggle)}

    });

    // This adds a sub-button - the Development Phase - same as WinterPhase but without the year and history changes
    PendragonGMTool.tools.push({
      name: "Development",
      icon: "fas fa-helmet-battle",
      title:  game.i18n.localize('PEN.developmentPhase'),
      active: game.settings.get('Pendragon','development'),
      toggle: true,
      onClick: async toggle => await PENWinter.developmentPhase(toggle)
    });

       buttons.push(PendragonGMTool);
    };
  })

  PendragonHooks.listen()

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Always reset GM Tool toggles to False
  if (game.user.isGM) {
    if (game.settings.get('Pendragon' , 'winter')) {game.settings.set('Pendragon','winter', false)};
    if (game.settings.get('Pendragon' , 'development')) {game.settings.set('Pendragon','development', false)};
  }  
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.pendragon.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "pendragon.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    // Trigger the item roll
    item.roll();
  });
}

