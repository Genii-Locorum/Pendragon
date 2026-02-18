import { PIDEditor } from "../../pid/pid-editor.mjs";
import { PENactorItemDrop } from "../actor-itemDrop.mjs";
import { PENRollType } from "../../cards/rollType.mjs";
import  PENDialog  from "../../setup/pen-dialog.mjs";
import { PendragonItemSheet } from "../../item/sheets/item-sheet.mjs";
const { api, sheets } = foundry.applications;

export class PendragonNPCSheetv2 extends api.HandlebarsApplicationMixin(
    sheets.ActorSheetV2) {
    constructor(options = {}) {
        super(options);
        this._dragDrop = this._createDragDropHandlers();
    }

    static DEFAULT_OPTIONS = {
        classes: ["Pendragon", "sheet", "actor", "npcv2","theme-light"],
        position: {
            width: 420,
            height: 750,
        },
        tag: "form",
        dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
        form: {
            submitOnChange: true,
        },
        actions: {
            onEditImage: this._onEditImage,
            editPid: this._onEditPid,
            noteView: this._noteView,
            actorToggle: this._onActorToggle,
            autoCalc: this._onAutoCalc,
            listExp: this._onListExpand,
            createDoc: this._createDoc,
            deleteDoc: this._deleteDoc,
            viewDoc: this._viewDoc,
            baseStats: this._onBaseStats,

        },
        window: {
            resizable: true,
        },
    };

    static PARTS = {
        header: {
            template: 'systems/Pendragon/templates/actor/npc.header.hbs',
            scrollable: [''],
        },
        details: {
            template: 'systems/Pendragon/templates/actor/npc.details.hbs',
            scrollable: [''],
        },        
        notes: {
            template: 'systems/Pendragon/templates/actor/npc.notes.hbs',
            scrollable: [''],
        },
    }

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
        //Common parts to the character - this is the order they are show on the sheet
        options.parts = ['header', 'details','notes'];
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
            isLocked: this.actor.system.lock,
            displayNotes: this.actor.system.noteView
        };

        //context.tabs = this._getTabs(options.parts);
        context.unlocked = !this.actor.system.lock
        context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            context.system.description,
            {
                async: true,
                secrets: context.editable
            }
        )
        await this._prepareItems(context);
        return context
    }

    /** @override */
    async _preparePartContext(partId, context) {
        switch (partId) {
        }
        return context;
    }

    async _prepareItems(context) {
        // Initialize containers.
        const gears = [];
        const weapons = [];
        const armours = [];
        const traits = [];
        const skills = [];
        const passions = [];
        const horses = [];
        const talents = [];
        const randoms = [];

        //Iterate through collections
        context.hasRandoms = false
        for (let random of this.document.system.random) {
          context.hasRandoms = true      
          let itemType = ""
          let tempLoc = (await game.system.api.pid.fromPIDBest({ pid: random.pid }))[0]
          if (tempLoc) {
            itemType = game.i18n.localize('TYPES.Item.'+tempLoc.type)
            randoms.push({ uuid: random.uuid, pid: random.pid, name: tempLoc.name, value: random.value, type:itemType})
          } else {
            randoms.push({ uuid: random.uuid, pid: random.pid, name: game.i18n.localize("PEN.invalid"), value: random.value, type: itemType})
          }    
        }

        // Iterate through items, allocating to containers
        for (let i of this.document.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type === 'gear') {
                i.system.cleanDesc = i.system.description.replace(/<[^>]+>/g, "") //await this.convertToPlain(i.system.description)
                gears.push(i);
            } else if (i.type === 'weapon') {
                weapons.push(i);
            } else if (i.type === 'armour') {
                armours.push(i);
            } else if (i.type === 'trait') {
                traits.push(i);
            } else if (i.type === 'skill') {
                if (i.system.magical) {
                    talents.push(i);
                } else {
                    skills.push(i);
                }
            } else if (i.type === 'passion') {
                passions.push(i);
            } else if (i.type === 'horse') {
                horses.push(i);
            }
        }

        // Assign and return
        context.noSkill = (skills.length < 1);
        context.noWeapon = (weapons.length < 1);
        context.noArmour = (armours.length < 1);
        context.noTrait = (traits.length < 1);
        context.noPassion = (passions.length < 1);
        context.noHorse = (horses.length < 1);
        context.noTalent = (talents.length < 1);
        context.gears = gears.sort(function (a, b) {return a.name.localeCompare(b.name)});;
        context.weapons = weapons.sort(function (a, b) {return a.name.localeCompare(b.name)});;
        context.armours = armours;
        context.traits = traits.sort(function (a, b) {return a.name.localeCompare(b.name)});;
        context.skills = skills.sort(function (a, b) {return a.name.localeCompare(b.name)});;
        context.passions = passions.sort(function (a, b) {return a.name.localeCompare(b.name)});;
        context.horses = horses;
        context.talents = talents.sort(function (a, b) {return a.name.localeCompare(b.name)});;
        context.randoms = randoms.sort(function (a, b) {return a.name.localeCompare(b.name)});
    }



    // adds the PID editor to the sheet frame
    async _renderFrame(options) {
        const frame = await super._renderFrame(options);
        //define button
        const sheetPID = this.actor.flags?.Pendragon?.pidFlag;
        const noId =
            typeof sheetPID === "undefined" ||
            typeof sheetPID.id === "undefined" ||
            sheetPID.id === "";
        //add button
        const label = game.i18n.localize("PEN.PIDFlag.id");
        const pidEditor = `<button type="button" class="header-control fa-solid fa-fingerprint icon ${noId ? "edit-pid-warning" : "edit-pid-exisiting"}"
        data-action="editPid" data-tooltip="${label}" aria-label="${label}"></button>`;
        let el = this.window.close;
        while (el.previousElementSibling.localName === "button") {
            el = el.previousElementSibling;
        }
        el.insertAdjacentHTML("beforebegin", pidEditor);
        return frame;
    }



    //Activate event listeners using the prepared sheet HTML
    _onRender(context, _options) {
        this._dragDrop.forEach((d) => d.bind(this.element));
        this.element.querySelectorAll('.inline-edit').forEach(n => n.addEventListener("change", this._onInlineEdit.bind(this)))
        this.element.querySelectorAll('.item-toggle').forEach(n => n.addEventListener("dblclick", this._onItemToggle.bind(this)))
        this.element.querySelectorAll('.rollable.skill-name').forEach(n => n.addEventListener("click", PENRollType._onSkillCheck.bind(this)))       
        this.element.querySelectorAll('.rollable.passion-name').forEach(n => n.addEventListener("click", PENRollType._onPassionCheck.bind(this)))       
        this.element.querySelectorAll('.rollable.glory').forEach(n => n.addEventListener("click", PENRollType._onGloryCheck.bind(this)))       
        this.element.querySelectorAll('.rollable.move').forEach(n => n.addEventListener("click", PENRollType._onMoveCheck.bind(this)))       
        this.element.querySelectorAll('.rollable.damage').forEach(n => n.addEventListener("click", PENRollType._onDamageRoll.bind(this)))       
        this.element.querySelectorAll('.rollable.combat').forEach(n => n.addEventListener("click", PENRollType._onCombatCheck.bind(this)))        
        this.element.querySelectorAll('.rollable.stat').forEach(n => n.addEventListener("click", PENRollType._onStatCheck.bind(this)))   
        this.element.querySelectorAll('.rollable.trait').forEach(n => n.addEventListener("click", PENRollType._onTraitCheck.bind(this)))     
        this.element.querySelectorAll('.item-delete').forEach(n => n.addEventListener("dblclick", this._onItemDelete.bind(this)))                        
    }
    //LISTENERS
    // Update traits, skills etc without opening the item sheet
    async _onInlineEdit(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const li = $(event.currentTarget).closest(".item");
        const item = this.actor.items.get(li.data("itemid"));
        const field = li.data("field");
        let newScore = element.value;
        let target = "";
        if (field === 'score' || field === 'value') {
            target = "system.value";
            newScore = Number(newScore)
        } else if (field === 'name') {
            target = "name";
        } else if (field === 'damage') {
            target = "system.dmgForm";
        } else if (field === 'ap') {
            target = "system.ap";
            newScore = Number(newScore)
        } else if (field ==='mainname') {
            target = "system.mainName"
        } else if (field ==='specname') {
            target = "system.specName"
        }
        await item.update({ [target]: newScore });

        if (field === 'mainname' || field ==='specname') {
          await PendragonItemSheet.skillChangeName(item)
        }         

        this.actor.render(false);
        return;
    }

    //Toggle Items
    async _onItemToggle(event){
        const prop= event.currentTarget.dataset.property;
        const itemID = event.currentTarget.dataset.itemid;
        const item = this.actor.items.get(itemID);
        let checkProp={};
        if (prop === "armour") {
            checkProp = {'system.type': !item.system.type}
        } 
        await item.update(checkProp);
        return
    }    


    //ACTIONS

    // View Embedded Document
    static async _viewDoc(event, target) {
        const doc = this._getEmbeddedDocument(target);
        doc.sheet.render(true);
    }

    //Create an Embedded Document
    static async _createDoc(event, target) {
        let type = target.dataset.type
        if (type === 'talent') { type = "skill" }
        const docCls = getDocumentClass(target.dataset.documentClass);
        const docData = {
            name: docCls.defaultName({
                type: type,
                parent: this.actor,
            }),
        };
        foundry.utils.setProperty(docData, 'type', type);
        // Loop through the dataset and add it to our docData
        for (const [dataKey, value] of Object.entries(target.dataset)) {
            // Ignore data attributes that are reserved for action handling
            if (['action', 'documentClass', 'type'].includes(dataKey)) continue;
            foundry.utils.setProperty(docData, dataKey, value);
        }
        if (target.dataset.type === "talent") {
            foundry.utils.setProperty(docData, 'system.magical', true);
            foundry.utils.setProperty(docData, 'name', game.i18n.localize('PEN.magicalTalent'));
        }

        // Create the embedded document
        const newItem = await docCls.create(docData, { parent: this.actor });

        //And in certain circumstances render the new item sheet
        if (['history', 'wound', 'horse', 'squire', 'gear'].includes(newItem.type)) {
            newItem.sheet.render(true);
        }
    }

    static async _deleteDoc(event, target) {
        if (event.detail === 2) {  //Only perform on double click
            const doc = this._getEmbeddedDocument(target);
            await doc.delete();
        }
    }

    //Get Embedded Document
    _getEmbeddedDocument(target) {
        const docRow = target.closest('.item');
        if (docRow.dataset.documentClass === 'Item') {
            return this.actor.items.get(docRow.dataset.itemid);
        } else if (docRow.dataset.documentClass === 'ActiveEffect') {
            const parent =
                docRow.dataset.parentId === this.actor.id
                    ? this.actor
                    : this.actor.items.get(docRow?.dataset.parentId);
            return parent.effects.get(docRow?.dataset.effectId);
        } else return console.warn('Could not find document class');
    }

    static async _onEditImage(event, target) {
        const attr = target.dataset.edit;
        const current = foundry.utils.getProperty(this.document, attr);
        const { img } =
            this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
            {};
        const fp = new foundry.applications.apps.FilePicker.implementation({
            current,
            type: "image",
            redirectToRoot: img ? [img] : [],
            callback: (path) => {
                this.document.update({ [attr]: path });
            },
            top: this.position.top + 40,
            left: this.position.left + 10,
        });
        return fp.browse();
    }

    // Handle editPid action
    static _onEditPid(event) {
        event.stopPropagation(); // Don't trigger other events
        if (event.detail > 1) return; // Ignore repeated clicks
        new PIDEditor({document: this.document }, {}).render(true, { focus: true })
    }

    //Show or hide notes
    static async _noteView(event, target) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await this.actor.update({ 'system.noteView': !this.actor.system.noteView })
        await this.render["notes"]
    }

    //Toggle Actor on Double
    static async _onActorToggle(event, target) {
        if (event.detail === 2) {  //Only perform on double click    
            const prop = target.dataset.property;
            let checkProp = {};
            if (prop === "lock") {
                checkProp = { 'system.lock': !this.actor.system.lock }
            }
            await this.actor.update(checkProp);
        }
        return
    }

    //Auto Calc NPC Scores
    static async _onAutoCalc(event, target) {
        await this.actor.update({
            'system.manMove': this.actor.system.move,
            'system.manArm': this.actor.system.armour,
            'system.manShd': this.actor.system.shield,
            'system.manMjrWnd': this.actor.system.hp.majorWnd,
            'system.manDmg': this.actor.system.damage,
            'system.manHealRate': this.actor.system.healRate,
            'system.manMaxHP': 0,
            'system.manUnconscious': 0
        })
    }

    //Expand/Collapse List sections
    static async _onListExpand(event, target) {
        event.preventDefault();
        const prop = target.dataset.section;
        if (['weaponExp', 'armorExp', 'skillExp', 'traitExp', 'passionExp', 'horseExp', 'talentExp'].includes(prop)) {
            await this.actor.update({ [`system.${prop}`]: !this.actor.system[prop] })
        }
    }

    //Toggle between Skills etc and Base Stats
    static async _onBaseStats(event, target) {
        await this.actor.update({'system.baseStats': !this.actor.system.baseStats})
    }

    //Add Variable Items to Base Stats
    async _addVariable(item) {
        const collection = this.actor.system.random ? foundry.utils.duplicate(this.actor.system.random) : []
        //Dropping in item list - check the item doesn't already exist
        if (collection.find(el => el.pid === item.flags.Pendragon?.pidFlag?.id)) {
          ui.notifications.warn(game.i18n.localize('PEN.dupItem'));
        return
        }    
        let inpVal = await this.inpValue(game.i18n.localize('PEN.startingFormula'))
        collection.push({ uuid: item.uuid, pid: item.flags.Pendragon.pidFlag.id, value: inpVal.inpvalue})        
        await this.actor.update({'system.random': collection})
    }

    //Delete's a skill etc in the main  list
    async _onItemDelete(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      let collectionName = 'random'
      const item = $(event.currentTarget).closest('.item')
      const itemId = item.data('item-id')
      const itemIndex = this.actor.system[collectionName].findIndex(i => (itemId && i.uuid === itemId))
      if (itemIndex > -1) {
        const collection = this.actor.system[collectionName] ? foundry.utils.duplicate(this.actor.system[collectionName]) : []
        collection.splice(itemIndex, 1)
        await this.actor.update({ [`system.${collectionName}`]: collection })
      }
    }

  //Get value input
  async inpValue(title) {
    let inpVal = await PENDialog.input({
      window: { title: title },
      content: `<input class="centre" type="text" name="inpvalue">`,
    })
    return inpVal
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
        return false
    }

    //Handle dropping of an item reference or item data onto an Actor Sheet
    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;
        const item = await Item.implementation.fromDropData(data);
        // Handle item sorting within the same Actor
        if (this.actor.uuid === item.parent?.uuid)
            return this._onSortItem(event, item);
        //Check to see if the item is already on the actor in some circumstances to add it to base stats tab
        if (['skill','passion','trait'].includes(item.type)) {
          let list = await this.actor.items.filter(i=>i.flags.Pendragon?.pidFlag?.id === item.flags.Pendragon?.pidFlag?.id)  
          if (list.length>0) {
            await  this._addVariable(item);
            return false
          }
        }

        // Create the owned item
        return this._onDropItemCreate(item, event);
    }

    //Handle dropping of a Folder on an Actor Sheet.
    async _onDropFolder(event, data) {
        if (!this.actor.isOwner) return [];
        const folder = await Folder.implementation.fromDropData(data);
        if (folder.type !== 'Item') return [];
        const droppedItemData = await Promise.all(
            folder.contents.map(async (item) => {
                if (!(document instanceof Item)) item = await fromUuid(item.uuid);
                return item;
            })
        );
        return this._onDropItemCreate(droppedItemData, event);
    }

    //Handle the final creation of dropped Item data on the Actor.
    async _onDropItemCreate(itemData, event) {
        itemData = await PENactorItemDrop._PENonDropItemCreate(this.actor, itemData)
        const list = await this.actor.createEmbeddedDocuments('Item', itemData);
        return list;
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

}