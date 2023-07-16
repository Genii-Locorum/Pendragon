

export class BRPUtilities {

  static async winterPhase() {
    // Get the game year from settings and increase it by 1
    let year = game.settings.get('Pendragon',"gameYear") + 1;
    game.settings.set('Pendragon',"gameYear",year)
  }  

}