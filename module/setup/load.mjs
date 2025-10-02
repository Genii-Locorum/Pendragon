//If a new world then create a default scene
Hooks.on('ready', () => {
  console.log("Adding a default scene")
  const isNewWorld = !(game.actors.size + game.items.size + game.journal.size);
  if (game.scenes.filter(doc => doc.id !== 'NUEDEFAULTSCENE0').length === 0) {
    Scene.create({
      name:'Default',
      height: 2061,
      width: 3350,
      active:true,
      background:{src:'systems/Pendragon/assets/KnightPendragon.jpg'},
      foregroundElevation:4,
      thumb:'systems/Pendragon/assets/KnightPendragon.jpg',
      grid:{type:0},
      tokenVision:false,
      fog:{exploration:false},
      initial:{
        scale: 0.5,
        x: 2947,
        y: 1572}
    })
  }
})
