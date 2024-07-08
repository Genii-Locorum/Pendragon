import { PendragonActor } from "./actor/actor.mjs";
import { PendragonItem } from "./item/item.mjs";
import { preloadHandlebarsTemplates } from "./setup/templates.mjs";
import { PENDRAGON } from "./setup/config.mjs";
import { handlebarsHelper } from './setup/handlebar-helper.mjs';
import { PendragonHooks } from './hooks/index.mjs'
import { registerSettings } from './setup/register-settings.mjs';
import { PENMenu } from "./setup/layers.mjs"
import { PENSystemSocket } from "./apps/socket.mjs"
import * as Chat from "./apps/chat.mjs";
import { PENTooltips } from './apps/tooltips.mjs';
import { PENRollType } from "./cards/rollType.mjs";


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.Pendragon = {
    PendragonActor,
    PendragonItem,
    rollItemMacro,
    GMRollMacro
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

Hooks.on('ready', async () => {
  game.socket.on('system.Pendragon', async data => {
    PENSystemSocket.callSocket(data)
  });
});


//Remove certain Items types from the list of options to create under the items menu (can still be created directly from the character sheet)
Hooks.on("renderDialog", (dialog, html) => {
  let deprecatedTypes = ["wound", "squire", "family"]; // 
  Array.from(html.find("#document-create option")).forEach(i => {
      if (deprecatedTypes.includes(i.value))
      {
          i.remove()
      }
  })
})

//Add sub-titles in Config Settings for Pendragon Game Settings
Hooks.on('renderSettingsConfig', (app, html, options) => {
  const systemTab = $(app.form).find('.tab[data-tab=system]')

  systemTab
    .find('input[name=Pendragon\\.autoXP]')
    .closest('div.form-group')
    .before(
      '<h3 class="setting-header">' +
        game.i18n.localize('PEN.Settings.xpCheck') +
        '</h3>'
    )  

  systemTab
    .find('input[name=Pendragon\\.switchShift]')
    .closest('div.form-group')
    .before(
      '<h3 class="setting-header">' +
        game.i18n.localize('PEN.Settings.diceRolls') +
        '</h3>'
    )      

    systemTab
    .find('input[name=Pendragon\\.tokenVision]')
    .closest('div.form-group')
    .before(
      '<h3 class="setting-header">' +
        game.i18n.localize('PEN.Settings.other') +
        '</h3>'
    ) 

});

PendragonHooks.listen()

//Add Chat Log Hooks
Hooks.on("renderChatLog", (app, html, data) => Chat.addChatListeners(html));

//Add GM Tool Layer
Hooks.on('getSceneControlButtons', PENMenu.getButtons)
Hooks.on('renderSceneControls', PENMenu.renderControls)

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Always reset GM Tool toggles to False and ensyre actors training is false
  if (game.user.isGM) {
    if (game.settings.get('Pendragon' , 'winter')) {game.settings.set('Pendragon','winter', false)};
    if (game.settings.get('Pendragon' , 'development')) {game.settings.set('Pendragon','development', false)};
    if (game.settings.get('Pendragon' , 'creation')) {game.settings.set('Pendragon','creation', false)};
    for (const a of game.actors.contents) {
      if(a.type === 'character') {
        await a.update({'system.status.train': false});
      }
    } 
  } 
  game.PENTooltips = new PENTooltips()

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (game.user) {
      createItemMacro(data, slot);
      return false;
    }
  });
});

//  Hotbar Macros                             
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(game.i18n.localize('PEN.noMacroItemOwner'));
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.Pendragon.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "Pendragon.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

//Create a Macro from an Item drop.
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
      return ui.notifications.warn(game.i18n.format('PEN.noMacroItemFound', { itemName }));
    }

    // Trigger the item roll
    item.roll();
  });
}

//Allow GM Roll functionality
function GMRollMacro() {
  PENRollType._onGMRoll()
}