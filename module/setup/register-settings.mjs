export function registerSettings () {

 //Game Settings

 game.settings.register('Pendragon', "gameYear", {
    name: "PEN.Settings.gameYear",
    hint: "PEN.Settings.gameYearHint",
    scope: "world",
    requiresReload: true,
    config: true,
    type: Number,
    default: 509
  });

  game.settings.register('Pendragon', "autoXP", {
    name: "PEN.Settings.autoXP",
    hint: "PEN.Settings.autoXPHint",
    scope: "world",
    requiresReload: true,
    config: true,
    type: Boolean,
    default: false
  });

  //Invisible Game Settings 

  game.settings.register('Pendragon', "winter", {
    name: "",
    hint: "",
    scope: "world",
    requiresReload:false,
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register('Pendragon', "development", {
    name: "",
    hint: "",
    scope: "world",
    requiresReload:false,
    config: false,
    type: Boolean,
    default: false
  });

}    