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

}    