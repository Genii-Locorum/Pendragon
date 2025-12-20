const { api, sheets } = foundry.applications;
import { PIDEditor } from "../../pid/pid-editor.mjs";
import { PendragonActor } from "../actor.mjs";


export class PendragonEncounterSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
    constructor(options = {}) {
        super(options);
        this._dragDrop = this._createDragDropHandlers();
    }

    static DEFAULT_OPTIONS = {
        classes: ['Pendragon', 'sheet', 'actor', 'encounter'],
        position: {
            width: 400,
            height: 550
        },
        window: {
            resizable: true,
        },
        tag: "form",
        dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
        form: {
            submitOnChange: true,
        },
        actions: {
            editPid: this._onEditPid,
            noteView: this._noteView,
            toggleActor: this._onToggleActor,
            deleteNPC: this._deleteNPC,
            viewNPC: this._viewFromUuid,
            addToken: this._addToken,
            moraleloss: this._moraleLoss,            
        }
    }

    static PARTS = {
        header: {
            template: 'systems/Pendragon/templates/actor/encounter.header.hbs',
            scrollable: ['']
        },
        notes: {
            template: 'systems/Pendragon/templates/actor/encounter.notes.hbs',
            scrollable: [''],
        },
        npc: {
            template: 'systems/Pendragon/templates/actor/encounter.npc.hbs',
            scrollable: [''],
        },        
    }

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
        //Common parts to the character - this is the order they are show on the sheet
        options.parts = ['header', 'notes','npc'];
    }

    _getTabs(parts) {
    }

    async _prepareContext(options) {
        const context = {
          editable: this.isEditable,
          owner: this.document.isOwner,
          limited: this.document.limited,
          actor: this.actor,
          flags: this.actor.flags,
          isGM: game.user.isGM,
          system: this.actor.system,
          isLocked: this.actor.system.lock
    };
        //context.tabs = this._getTabs(options.parts);
        context.displayNotes = this.actor.system.noteView;
        context.showHPVal = await game.settings.get('Pendragon', "showParty");
        context.showNPC = this.actor.system.npcView
        if (game.user.isGM) { context.showHPVal = true };        

        context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            this.actor.system.description,
            {
                async: true,
                secrets: this.document.isOwner,
                rollData: this.actor.getRollData(),
                relativeTo: this.actor,
            }
        );
        context.enrichedNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            this.actor.system.notes,
            {
                async: true,
                secrets: this.document.isOwner,
                rollData: this.actor.getRollData(),
                relativeTo: this.actor,
            }
        );

        let npcs = []
        for (let npcPid of this.actor.system.npcs) {
          let npc = (await game.system.api.pid.fromPIDBest({pid: npcPid.pid}))[0]
          if (npc) {
            let skills= ""
            let armour = ""
            for (let itm of npc.items) {
              if (['skill','trait','passion'].includes(itm.type)) {
                let label = itm.name +" "+itm.system.total 
                if(skills.length === 0) {
                    skills = skills + label
                } else {
                    skills=  skills + ", " + label
                }
              } else if (itm.type === 'armour'){
                if(armour.length === 0) {
                    armour = armour + itm.name
                } else {
                    armour=  armour + ", " + itm.name
                }
              }
            }

            npcs.push({
                name: npc.name,
                uuid: npcPid.uuid,
                pid: npcPid.pid,
                actr: npc,
                skills: skills,
                armour: armour
            })
          } else {
            npcs.push({
                name: game.i18n.localize('PEN.invalid'),
                uuid: npcPid.uuid,
                npcPid: npcPid.pid,
                actr: false,
                skills: "",
                armour: ""
            })
          }
        }
        context.npcs = npcs
        return context
    }

    /** @override */
    async _preparePartContext(partId, context) {
        switch (partId) {
        }
        return context;
    }

  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    //define button
    const sheetPID = this.actor.flags?.Pendragon?.pidFlag;
    const noId = (typeof sheetPID === 'undefined' || typeof sheetPID.id === 'undefined' || sheetPID.id === '');
    //add button
    const label = game.i18n.localize("PEN.PIDFlag.id");
    const pidEditor = `<button type="button" class="header-control fa-solid fa-fingerprint icon ${noId ? 'edit-pid-warning' : 'edit-pid-exisiting'}"
        data-action="editPid" data-tooltip="${label}" aria-label="${label}"></button>`;
    let el = this.window.close;
    while (el.previousElementSibling.localName === 'button') {
      el = el.previousElementSibling;
    }
    el.insertAdjacentHTML("beforebegin", pidEditor);
    return frame;
  }

    //------------ACTIONS-------------------

    // Handle editPid action
  static _onEditPid(event) {
    event.stopPropagation(); // Don't trigger other events
    if ( event.detail > 1 ) return; // Ignore repeated clicks
        new PIDEditor({document: this.document }, {}).render(true, { focus: true })
  }

  static async _noteView(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    await this.actor.update({'system.noteView' : !this.actor.system.noteView})
    await this.render["notes"]    
  }

  static async _onToggleActor(event, target) {
    if (event.detail === 2) {  //Only perform on double click
      event.stopPropagation(); // Don't trigger other events    
      let checkProp={}
      let prop = target.dataset.property
      if (['lock','opportunity','used'].includes(prop)) {
      checkProp = { [`system.${prop}`]: !this.actor.system[prop] }
      } else {
        return
      }
      this.actor.update(checkProp)
    }    
  }
 
  //Delete an NPC from encounter
  static async _deleteNPC(event,target) {
    if (event.detail === 2) {  //Only perform on double click
        event.preventDefault();
        event.stopImmediatePropagation();
        const itemId = target.closest(".partic-cell").dataset.property;
        const npcsIndex = this.actor.system.npcs.findIndex(i => (itemId && i.uuid === itemId))
        if (npcsIndex > -1) {
        const npcs = this.actor.system.npcs ? foundry.utils.duplicate(this.actor.system.npcs) : []
        npcs.splice(npcsIndex, 1)
        await this.actor.update({ 'system.npcs': npcs })
        }
      }    
  }  

  //View NPC details
  static async _viewFromUuid(event, target){
    event.preventDefault();
    event.stopImmediatePropagation();
    const npcIndex = Number(target.closest(".partic-cell").dataset.index)
    const itemId = target.closest(".partic-cell").dataset.property;
    if (npcIndex === this.actor.system.npcView) {
        await this.actor.update({'system.npcView': 99})
    } else {
        await this.actor.update({'system.npcView': npcIndex})
    }
    await this.render["npc"]   
  }

  //Add Tokens to Current Scene
  static async _addToken(event, target) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const itemId = target.closest(".partic-cell").dataset.property;
    const pid = target.closest(".partic-cell").dataset.pid;    
    let count = target.dataset.count;

    //Check Scene is present
    if (!canvas.scene) {
      ui.notifications.error(game.i18n.localize('PEN.noScene'));
      return;
    }

    // Get the actor by UUID
    //let actor = await fromUuid(itemId); 

    let actor = (await game.system.api.pid.fromPIDBest({pid: pid}))[0]
    if (!actor) {
      //ui.notifications.error(game.i18n.format('PEN.actorNotFound',{ type: itemId }));
      ui.notifications.error(game.i18n.format('PEN.actorNotFound',{ type: pid }));      
      return;
    }

    // Check actor exists in the game world and if not create it
    let tempActor = await (game.actors.filter(actr => actr.flags?.Pendragon?.pidFlag?.id === actor.flags?.Pendragon?.pidFlag?.id && 
        actr.flags?.Pendragon?.pidFlag?.priority === actor.flags?.Pendragon?.pidFlag?.priority))[0];
    if (tempActor) {
      actor = tempActor
    } else {    
      tempActor = await PendragonActor.create(actor)  
      actor = tempActor
    }

    let newTokens = [];
    let current = (await game.canvas.scene.tokens.filter(t=>t.actorId === actor.id)).length;
    let placeY=800
    for (let yc = 800; yc<=2000; yc=yc+200) {
      let occupied = (await game.canvas.scene.tokens.filter(t=>t.y === yc)).length;
      if (occupied === 0) {
        placeY = yc
        yc=3000
      }
    }

    for (let ctr=1; ctr<=count; ctr++) {
        let counter = ctr + current
        let tokenName = actor.name + "(" + counter + ")"
        // Define token data
        const tokenData = {
        name: tokenName,
        actorId: actor.id,
        x: 900 + (200 * ctr), // X position in pixels
        y: placeY, // Y position in pixels
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE, // Hostile, Neutral, Friendly
        displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        lockRotation: true,
        vision: true,
        actorLink: false,
        texture : {
            src: actor.prototypeToken.texture.src
        }
        };
        newTokens.push(tokenData)
    }
    // Create the token in the current scene
    await canvas.scene.createEmbeddedDocuments("Token", newTokens);
  }

  //Roll Morale Loss
  static async _moraleLoss(event,target) {
    if (!Roll.validate(this.actor.system.moraleLoss)) {
      ui.notifications.error(game.i18n.format('PEN.formulaError', { formula: this.actor.system.moraleLoss }))
      return    
    }    
    let roll = new Roll(this.actor.system.moraleLoss)
    await roll.evaluate();
    await roll.toMessage({
        flavor: "<strong style='color:black; font-size:14px; font-family:`Signika`;'>" + game.i18n.localize('PEN.moraleLoss') + ": " + this.actor.name + "</strong>"
    })
  }  

    //-------------Drag and Drop--------------

    // Define whether a user is able to begin a dragstart workflow for a given drag selector
    _canDragStart(selector) {
        return this.isEditable;
    }

    //Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
    _canDragDrop(selector) {
        return this.isEditable;
    }

    //Callback actions which occur at the beginning of a drag start workflow.
    _onDragStart(event) {
        const docRow = event.currentTarget.closest('li');
        if ('link' in event.target.dataset) return;
        // Chained operation
        let dragData = this._getEmbeddedDocument(docRow)?.toDragData();
        if (!dragData) return;
        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    //Callback actions which occur when a dragged element is over a drop target.
    _onDragOver(event) { }

    //Callback actions which occur when a dragged element is dropped on a target.
    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        const actor = this.actor;
        const allowed = Hooks.call('dropActorSheetData', actor, this, data);
        if (allowed === false) return;

        // Handle different data types
        switch (data.type) {
            case 'ActiveEffect':
                return this._onDropActiveEffect(event, data);
            case 'Actor':
                return this._onDropActor(event, data);
            case 'Item':
                return this._onDropItem(event, data);
            case 'Folder':
                return this._onDropFolder(event, data);
        }
    }

    //Handle the dropping of ActiveEffect data onto an Actor Sheet
    async _onDropActiveEffect(event, data) {
        return false
    }

    //Handle dropping of an Actor data onto another Actor sheet
    async _onDropActor(event, data) {
        if (!this.actor.isOwner) return false;
        await this.DropActor(data);
    }

    //Handle dropping of an item reference or item data onto an Actor Sheet
    async _onDropItem(event, data) {
        return false
    }

    //Handle dropping of a Folder on an Actor Sheet.
    async _onDropFolder(event, data) {
        return false
    }

    //Returns an array of DragDrop instances
    get dragDrop() {
        return this._dragDrop;
    }

    _dragDrop;

    //Create drag-and-drop workflow handlers for this Application
    _createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this),
            };
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: this._onDrop.bind(this),
            };
            return new foundry.applications.ux.DragDrop(d);
        });
    }

    //Drop Actor on to an Actor Sheet
    async DropActor(data) {
        let newActor = await fromUuid(data.uuid)
        if (!newActor) { return }
        let npid = newActor.flags.Pendragon?.pidFlag?.id
        if (!npid) {
          ui.notifications.warn(game.i18n.format('PEN.PIDFlag.noPIDFlag' ,{itemName: newActor.name}));
          return;
        } 
        if (['npc'].includes(newActor.type)) {
            const npcs = this.actor.system.npcs ? foundry.utils.duplicate(this.actor.system.npcs) : []
            if (npcs.length > 3) {
              ui.notifications.warn(game.i18n.localize('PEN.encounterMax'));
              return;                
            }
            //Check npc is not in npcs list
            if (npcs.find(el => el.uuid === newActor.uuid)) {
                ui.notifications.warn(game.i18n.localize('PEN.dupNPC'));
                return
            }
            npcs.push({ uuid: newActor.uuid, pid:newActor.flags.Pendragon.pidFlag.id })
            await this.actor.update({ 'system.npcs': npcs })
        } else {
            ui.notifications.warn(game.i18n.format('PEN.cantDropActor'))
            return
        }
    }

    
}
