

export class PENUtilities {

  //
  //Winter Phase
  //
  static async winterPhase() {
    // Get the game year from settings and increase it by 1
    let year = game.settings.get('Pendragon',"gameYear") + 1;
    game.settings.set('Pendragon',"gameYear",year)
  }  


  //
  //Generic Confirmation Dialogue Box
  //
  static async confirmation(title) {
    let confirmation = await Dialog.confirm({
        title: title,
        content: game.i18n.localize('PEN.proceed')+"<div></div><br>",
        });
      return confirmation;
    }


}