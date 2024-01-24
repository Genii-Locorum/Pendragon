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

  game.settings.register('Pendragon', "oppDice1", {
    name: "PEN.Settings.oppDice1",
    hint: "PEN.Settings.oppDice1Hint",
    scope: "world",
    requiresReload: true,
    config: true,
    type: String,
    default: "bronze"
  });

  game.settings.register('Pendragon', "oppDice2", {
    name: "PEN.Settings.oppDice2",
    hint: "PEN.Settings.oppDice2Hint",
    scope: "world",
    requiresReload: true,
    config: true,
    type: String,
    default: "air"
  });

  game.settings.register('Pendragon', "switchShift", {
    name: "PEN.Settings.switchShift",
    hint: "PEN.Settings.switchShiftHint",
    scope: "client",
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