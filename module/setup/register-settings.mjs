export function registerSettings () {

 //Game Settings

 game.settings.register('Pendragon', "gameYear", {
    name: "PEN.Settings.gameYear",
    hint: "PEN.Settings.gameYearHint",
    scope: "world",
    requiresReload: true,
    config: true,
    type: Number,
    default: 508
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

  game.settings.register('Pendragon', "fumbleXP", {
    name: "PEN.Settings.fumbleXP",
    hint: "PEN.Settings.fumbleXPHint",
    scope: "world",
    requiresReload: true,
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register('Pendragon', "switchShift", {
    name: "PEN.Settings.switchShift",
    hint: "PEN.Settings.switchShiftHint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register('Pendragon', "critAdj", {
    name: "PEN.Settings.critAdj",
    hint: "PEN.Settings.critAdjHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register('Pendragon', "toolTipDelay", {
    name: "PEN.Settings.toolTipDelay",
    hint: "PEN.Settings.toolTipDelayHint",
    scope: "world",
    config: true,
    type: Number,
    default: 2000
  });

  game.settings.register('Pendragon', "tokenVision", {
    name: "PEN.Settings.tokenVision",
    hint: "PEN.Settings.tokenVisionHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register('Pendragon', "useRelation", {
    name: "PEN.Settings.useRelation",
    hint: "PEN.Settings.useRelationHint",
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

  game.settings.register('Pendragon', "creation", {
    name: "",
    hint: "",
    scope: "world",
    requiresReload:false,
    config: false,
    type: Boolean,
    default: false
  });

  // used by migration script
  game.settings.register('Pendragon', "systemMigrationVersion", {
    config: false,
    scope: "world",
    type: String,
    default: ""
  });
}