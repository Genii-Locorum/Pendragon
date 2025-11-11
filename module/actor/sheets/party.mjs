import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'
import { PENactorItemDrop } from '../actor-itemDrop.mjs';


/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PendragonPartySheet extends ActorSheet {

  //Add PID buttons to sheet
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addPIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["Pendragon", "sheet", "actor","party"],
      template: "systems/Pendragon/templates/actor/party-sheet.hbs",
      width: 1200,
      height: 157
    });
  }


  // -------------------------------------------- 

  //@override
  async getData() {

    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    context.isGM = game.user.isGM;
    context.showHPVal = await game.settings.get('Pendragon', "showParty");
    if (game.user.isGM) {context.showHPVal = true};

    
    //Prepare Party Members  
    const members = [];
 
    // Not strictly items but get party members
    for (let memberUuid of this.actor.system.members) {
      let member = await fromUuid(memberUuid.uuid)
      let highScoreLabel = "";
      if (!member) {
        members.push ({
          'name': "Invalid",
          'uuid': memberUuid.uuid,
          'image': "icons/svg/mystery-man.svg",
          'hpLabel': "0/0",
          'hpPerc': "0%",
          'highScoreLabel': highScoreLabel,
        })
      } else {
        let hpLabel = member.system.hp.value + "/" + member.system.hp.max
        let hpPerc =  Number(100*member.system.hp.value / member.system.hp.max)+"%"
        let bigScores = await member.items.filter(i=>['skill','passion','trait'].includes(i.type))

        let tempList = []
        for (let bScore of bigScores) {
          if (bScore.type === "skill" && bScore.system.total>15) {
            tempList.push({name: bScore.name, value: bScore.system.total, priority: 3})
          } else if (bScore.type === "passion" && bScore.system.total>15) {
            tempList.push({name: bScore.name, value: bScore.system.total, priority: 2})
          } else if (bScore.type === "trait" && bScore.system.total>15) {
            tempList.push({name: bScore.name, value: bScore.system.total, priority: 1})
          } else if (bScore.type === "trait" && bScore.system.total<5) {
            tempList.push({name: bScore.system.oppName, value: bScore.system.oppvalue, priority: 1})
          }
        }
       // Sort TempList to prioritise Traits, then Passions, then Skills
      tempList.sort(function(a, b){
        let x = a.priority;
        let y = b.priority;
        let p = a.value;
        let q = b.value;
        if (x < y) {return -1};
        if (x > y) {return 1};
        if (p < q) {return 1};
        if (p > q) {return -1};


        return 0;
      });
        let count = 0;
      for (let tItm of tempList) {
        count++;
        if (count ===1) {
          highScoreLabel = highScoreLabel + tItm.name; 
        } else {
          highScoreLabel = highScoreLabel + ", " + tItm.name;          
        }
      }

        members.push( {
          'name': member.name,
          'uuid': member.uuid,
          'image': member.img,
          'hpLabel': hpLabel,
          'hpPerc': hpPerc,
          'highScoreLabel': highScoreLabel,
        });
      }
    }
    //context.members = members.sort(function (a, b) {return a.name.localeCompare(b.name)});
    context.members = members

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare actor data and items.
      this._prepareItems(context);

    return context;
  }



  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
  return
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemid"));
      if (item.type === 'relationship') {
        this._updateRelationship(li.data("itemid"), item.system.person1Name)
        return
      }
      item.sheet.render(true);
    });
    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
     html.find(".viewFromUuid").click(this.#viewFromUuid.bind(this));                  
    html.find(".deleteMember").dblclick(this.#deleteMember.bind(this));                          
    
  }




  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */

  //View Party Member
  async #viewFromUuid(event){
    event.preventDefault();
    event.stopImmediatePropagation();
    const itemId = event.currentTarget.closest(".party-member").dataset.itemId;
    console.log("PING", itemId)
    let viewDoc = await fromUuid(itemId)
    if (viewDoc) viewDoc.sheet.render(true)
  }

  //Delete a Party Member
  async #deleteMember(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const itemId = event.currentTarget.closest(".party-member").dataset.itemId;
    const membersIndex = this.actor.system.members.findIndex(i => (itemId && i.uuid === itemId))
    if (membersIndex > -1) {
      const members = this.actor.system.members ? foundry.utils.duplicate(this.actor.system.members) : []
      members.splice(membersIndex, 1)
      await this.actor.update({ 'system.members': members })
    }
    return
  }


  // Change default on Drop Item Create routine for requirements (single items and folder drop)-----------------------------------------------------------------
  async _onDropItemCreate(itemData) {
    const newItemData = await PENactorItemDrop._PENonDropItemCreate(this.actor,itemData);
    return this.actor.createEmbeddedDocuments("Item", newItemData);
  }


    //Handle dropping of an Actor data onto another Actor sheet
  async _onDropActor(event, data) {
    if (!this.actor.isOwner) return false;
    await this.DropActor(data);
    return
  }

  //Drop Actor on to an Actor Sheet
  async DropActor(data) {
    let newActor = await fromUuid(data.uuid)
    if (this.actor.type === 'party' && (['character'].includes(newActor.type))) {
      const members = this.actor.system.members ? foundry.utils.duplicate(this.actor.system.members) : []
      //Check member is not in members list
      if (members.find(el => el.uuid === newActor.uuid)) {
        ui.notifications.warn(game.i18n.format('PEN.dupParty', { name: (newActor.name +"(" + newActor.uuid +")") }));
        return
      }
      members.push({uuid:newActor.uuid})
      await this.actor.update({'system.members': members})
      return
    } else {
      ui.notifications.warn(game.i18n.format('AOV.ErrorMsg.cantDropActor', { itemType: game.i18n.localize('TYPES.Actor.'+ newActor.type), actorType: game.i18n.localize('TYPES.Actor.'+ this.actor.type) }))
      return
    }
  }  
}
