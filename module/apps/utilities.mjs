

export class PENUtilities {

  
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