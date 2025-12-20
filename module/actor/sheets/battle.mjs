const { api, sheets } = foundry.applications;
import { PIDEditor } from "../../pid/pid-editor.mjs";
import { PendragonActor } from "../actor.mjs";
import { PENSelectLists } from "../../apps/select-lists.mjs";
import { RollType, PENCheck, CardType } from "../../apps/checks.mjs";

export class PendragonBattleSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
    constructor(options = {}) {
        super(options);
        this._dragDrop = this._createDragDropHandlers();
    }

    static DEFAULT_OPTIONS = {
        classes: ['Pendragon', 'sheet', 'actor', 'battle'],
        position: {
            width: 400,
            height: 710
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
            deleteActr: this._deleteActr,
            battleTurn: this._battleTurn,
            viewEnc: this._viewEnc,
            viewKnight: this._viewKnight,
            resetPosture: this._resetPosture,
            gmRoll: this._gmRoll,
            clearBattle: this._clearBattle,
            addTokensCombat: this._addTokensCombat,
            resultsView: this._resultsView,
        }
    }

    static PARTS = {
        header: {
            template: 'systems/Pendragon/templates/actor/battle.header.hbs',
            scrollable: [''],
        },
        notes: {
            template: 'systems/Pendragon/templates/actor/battle.notes.hbs',
            scrollable: [''],
        },   
        results: {
            template: 'systems/Pendragon/templates/actor/battle.results.hbs',
            scrollable: [''],
        },              
    }

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
        //Common parts to the character - this is the order they are show on the sheet
        options.parts = ['header','results'];
        
        //GM only tabs
        if (game.user.isGM) {
          options.parts.push('notes');
        }
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
        context.displayResults = this.actor.system.resultsView;        
        context.showHPVal = await game.settings.get('Pendragon', "showParty");
        context.showNPC = this.actor.system.npcView        
        if (game.user.isGM) { context.showHPVal = true };   
        context.fieldPosType = await PENSelectLists.getFieldPos() ;     

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

        let encounters = []
        let knights= []
        for (let encPid of this.actor.system.encounters) {
          let enc = (await game.system.api.pid.fromPIDBest({pid: encPid.pid}))[0]
          if (enc) {
          let morale = true
          if (this.actor.system.currMorale < enc.system.moraleMin && context.isGM) {morale = false}
            encounters.push({
                name: enc.name,
                uuid: encPid.uuid,
                pid: encPid.pid,
                actr: enc,
                morale: morale              
            });
          } else {
            encounters.push({
                name: game.i18n.localize('PEN.invalid'),
                uuid: encPid.uuid,
                npcPid: encPid.pid,
                actr: false,
                morale: false
            });
          }
        }   
        for (let encPid of this.actor.system.knights) {
          let enc = (await game.system.api.pid.fromPIDBest({pid: encPid.pid}))[0]
          if (enc) {
            knights.push({
                name: enc.name,
                uuid: encPid.uuid,
                pid: encPid.pid,
                pos: game.i18n.localize('PEN.battlePos.'+enc.system.battlePos),
                fieldPos: game.i18n.localize('PEN.fieldPos.'+enc.system.fieldPos),
                fieldPosAbbr: game.i18n.localize('PEN.fieldPosAbbr.'+enc.system.fieldPos),                
                actr: enc              
            });
          } else {
            knights.push({
                name: game.i18n.localize('PEN.invalid'),
                uuid: encPid.uuid,
                npcPid: encPid.pid,
                pos: "",
                fieldPos: "",
                fieldPosAbbr: "",
                actr: false
            });
          }
        }

      //Sort Encounters on Enc/Opp then name
        encounters.sort(function (a, b) {
          let x = a.name;
          let y = b.name;
          let r = a.actr.system?.opportunity
          let s = b.actr.system?.opportunity
          if (r < s) { return -1 };
          if (r > s) { return 1 };
          if (x < y) { return -1 };
          if (x > y) { return 1 };
          return 0;
        })
        context.encounters = encounters
        context.knights = knights

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

  static async _resultsView(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    await this.actor.update({'system.resultsView' : !this.actor.system.resultsView})
    await this.render["results"]    
  }  

  static async _onToggleActor(event, target) {
    if (event.detail === 2) {  //Only perform on double click
      event.stopPropagation(); // Don't trigger other events    
      let checkProp={}
      let prop = target.dataset.property
      if (['lock'].includes(prop)) {
      checkProp = { [`system.${prop}`]: !this.actor.system[prop] }
      } else {
        return
      }
      this.actor.update(checkProp)
    }    
  }
 
  //Delete an Encounter or Knight from battle
  static async _deleteActr(event,target) {
    if (event.detail === 2) {  //Only perform on double click
        event.preventDefault();
        event.stopImmediatePropagation();
        const collectionName = target.closest(".partic-item").dataset.coll;
        if(!collectionName) {return}
        const itemId = target.closest(".partic-item").dataset.property;
        const actrIndex = this.actor.system[collectionName].findIndex(i => (itemId && i.uuid === itemId))
        if (actrIndex > -1) {
        const collection = this.actor.system[collectionName] ? foundry.utils.duplicate(this.actor.system[collectionName]) : []
        collection.splice(actrIndex, 1)
        await this.actor.update({ [`system.${collectionName}`]: collection })
        }
      }    
  }  

  //Change Battle Turn
  static async _battleTurn(event, target) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const change = Number(target.dataset.property)    
    if (change + this.actor.system.currTurn < 1) {
      await this.actor.update ({'system.currTurn':1});
    } else if (change + this.actor.system.currTurn > this.actor.system.maxTurns) {
      await this.actor.update ({'system.currTurn':this.actor.system.maxTurns});
    }  else {
      await this.actor.update ({'system.currTurn':change + this.actor.system.currTurn})
    }
  }

  //View Encounter
  static async _viewEnc(event, target) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!game.user.isGM) {return}
    const pid = target.closest(".partic-item").dataset.pid;
    //Check to see if Encounter is in game world
    let enc = await game.actors.filter(actr=>actr.flags.Pendragon?.pidFlag?.id === pid)[0]
    //If not in game then check compendiums as well
    if (!enc) {
      enc = (await game.system.api.pid.fromPIDBest({pid: pid}))[0]
      if (enc) {
        let tempActor = await PendragonActor.create(enc)
        enc = tempActor
      }  
    }
    if (enc) {
      enc.sheet.render(true)
    }
  }

  //View Knight
  static async _viewKnight(event, target) {
    event.preventDefault();
    event.stopImmediatePropagation();    
    const pid = target.closest(".partic-item").dataset.pid;    
    //Check to see if Encounter is in game world
    let enc = await game.actors.filter(actr=>actr.flags.Pendragon?.pidFlag?.id === pid)[0]
    if (enc) {
      enc.sheet.render(true)
    } else {
      ui.notifications.warn(game.i18n.format('PEN.noWorldActor' ,{pid: pid}));      
    }   
  }

  //Reset Battle Posture for all Knights
  static async _resetPosture(event, target) {
    if (event.detail === 2) {  //Only perform on double click
      event.preventDefault();
      event.stopImmediatePropagation(); 
      for (let actr of this.actor.system.knights) {
        let knight = await fromUuid(actr.uuid);
        if (knight) {
          await knight.update({'system.battlePos': 0});
        }
      }
    }
  }

  //Battle Intensity Roll
  static async _gmRoll (event, target) {
    event.preventDefault();
    event.stopImmediatePropagation(); 
    let property = target.dataset.property;
    let gmRollName = game.i18n.localize('PEN.battleIntensity');
    let gmRollScore = this.actor.system.intensity
    if (property === 'battle') {
      gmRollName = game.i18n.localize('PEN.battleScore');
      gmRollScore = this.actor.system.battleScore;
    }
    PENCheck._trigger({
      rollType: RollType.SKILL,
      cardType: CardType.UNOPPOSED,
      gmRollName,
      gmRollScore: this.actor.system.intensity,
      shiftKey: false,
      neutralRoll: true,
    });    
  }

  //Reset Battle Encounters
  static async resetEnc(event) {
    let enctrs = await game.actors.filter(a=>a.type === 'encounter').filter(a=>a.system.used)
    for (let enc of enctrs) {
      await enc.update({'system.used':false})
    }
  }

  //Clear BattleField of NPC tokens
  static async _clearBattle(event) {
    if (event.detail === 2) {  //Only perform on double click
    let tokens = canvas.tokens.placeables.filter(t => t.actor?.type === 'npc').map(itm=>itm.id);  
    if (tokens) {
      await canvas.scene.deleteEmbeddedDocuments("Token", tokens);
    }
    }
  }

  //Static Add Tokens to Combat
  static async _addTokensCombat(event,target) {
    let tokens = canvas.scene.tokens
    if (tokens) {
      TokenDocument.createCombatants(tokens)
    }  
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
        if (['character','encounter'].includes(newActor.type)) {
          let collectionName = "knights"
          if (newActor.type === 'encounter') {collectionName = 'encounters'}
          const collection = this.actor.system[collectionName] ? foundry.utils.duplicate(this.actor.system[collectionName]) : []
            //Check encounter/knight is not in the relevant list
            if (collection.find(el => el.pid === npid)) {
                ui.notifications.warn(game.i18n.localize('PEN.dupNPC'));
                return
            }
            collection.push({ uuid: newActor.uuid, pid:npid })
            await this.actor.update({[`system.${collectionName}`]: collection })
        }else {
            ui.notifications.warn(game.i18n.format('PEN.cantDropActor'))
            return
        }
    }
    
}
