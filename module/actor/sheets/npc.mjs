import { PENRollType } from "../../cards/rollType.mjs";
import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PendragonNPCSheet extends ActorSheet {

  //Add PID buttons to sheet
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addPIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["Pendragon", "sheet", "actor","npc"],
      template: "systems/Pendragon/templates/actor/npc-sheet.html",
      width: 380,
      height: 730,
      scrollY: ['.bottom-panel'],
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "combat" }]
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
    context.enrichedDescriptionValue = await TextEditor.enrichHTML(
      context.system.description,
      {
        async: true,
        secrets: context.editable
      }
    )

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {


  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
    // Initialize containers.
    const gears = [];
    const weapons = [];
    const armours = [];
    const traits =[];
    const skills = [];
    const passions = [];
    const horses = [];
 
    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'gear') {
        i.system.cleanDesc =  i.system.description.replace(/<[^>]+>/g, "") //await this.convertToPlain(i.system.description)
        gears.push(i);
      } else if (i.type === 'weapon') {
        weapons.push(i);
      } else if (i.type === 'armour') {
        armours.push(i);
      } else if (i.type === 'trait') {
        traits.push(i);
      } else if (i.type === 'skill') {
        skills.push(i);
      } else if (i.type === 'passion') {
        passions.push(i);
      } else if (i.type === 'horse') {
        horses.push(i);
      }
    }
    // Sort Gears
    gears.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });

    // Sort weapons
    weapons.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });

    // Sort Traits
    traits.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });    


    // Sort Skills
    skills.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });

    // Sort Passions
    passions.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });     


    // Assign and return
    context.noSkill = (skills.length<1);
    context.noWeapon = (weapons.length<1);
    console.log(context.noWeapon)
    context.noArmour = (armours.length<1);
    context.noTrait = (traits.length<1);
    context.noPassion = (passions.length<1);
    context.noHorse = (horses.length<1);
    context.gears = gears;
    context.weapons = weapons;
    context.armours = armours;
    context.traits = traits;
    context.skills = skills;
    context.passions = passions;
    context.horses = horses;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemid"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.find(".close-sheet").dblclick(this._onCloseSheet.bind(this));                   // Close Sheet  
    html.find('.item-create').click(this._onItemCreate.bind(this));                  // Add Inventory Item
    html.find(".inline-edit").change(this._onInlineEdit.bind(this));                 // Inline Edit
    html.find(".actor-toggle").dblclick(this._onActorToggle.bind(this));             // Actor Toggle
    html.find(".item-toggle").dblclick(this._onItemToggle.bind(this));               // Item Toggle
    html.find(".npcAutoCalc").dblclick(this._onAutoCalc.bind(this));                 // Auto Calc Scores
    html.find(".rollable.stat").click(PENRollType._onStatCheck.bind(this));             // Stat Check
    html.find(".rollable.skill-name").click(PENRollType._onSkillCheck.bind(this));      // Skill Check
    html.find(".rollable.passion-name").click(PENRollType._onPassionCheck.bind(this));  // Passion check
    html.find(".rollable.glory").click(PENRollType._onGloryCheck.bind(this));           // Glory check
    html.find(".rollable.move").click(PENRollType._onMoveCheck.bind(this));             // Move check
    html.find(".rollable.trait").click(PENRollType._onTraitCheck.bind(this));           // Trait check    
    html.find(".rollable.damage").click(PENRollType._onDamageRoll.bind(this));          // Damage roll  
    html.find(".rollable.combat").click(PENRollType._onCombatCheck.bind(this));         // Combat roll            
        
    
    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  
    // Delete Inventory Item
      html.find('.item-delete').click(ev => {
        const li = $(ev.currentTarget).closest(".item");
        const item = this.actor.items.get(li.data("itemid"));
        item.delete();
        li.slideUp(200, () => this.render(false));
      });
  }




  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */

  async _onCloseSheet(event) {
    this.close();
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = foundry.utils.duplicate(header.dataset);
    const name = `${type.capitalize()}`;
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];
  

    // Finally, create the item!
    let item = await Item.create(itemData, {parent: this.actor});
    if (type === "history" || type === "wound" || type === "horse" || type === "squire" || type ==="gear") {
      item.sheet.render(true);
    }
    return
  }

// Update traits, skills etc without opening the item sheet
async _onInlineEdit(event){
  event.preventDefault();
    const element = event.currentTarget;
    const li = $(event.currentTarget).closest(".item");
    const item = this.actor.items.get(li.data("itemid"));
    const field = li.data("field");
    let newScore = element.value;
    let target = "";
    if (field === 'score'  || field === 'value') {
      target = "system.value";
      newScore=Number(newScore)
    } else if (field === 'name') {
      target = "name";
    } else if (field === 'damage') {
      target = "system.dmgForm";
    } else if (field === 'ap') {
      target = "system.ap";
      newScore=Number(newScore)
    }

    await item.update ({ [target]: newScore});
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

//Toggle Actor
async _onActorToggle(event){
  const prop= event.currentTarget.dataset.property;
  let checkProp={};
  if (prop === "lock") {
    checkProp = {'system.lock': !this.actor.system.lock}
  } 
await this.actor.update(checkProp);
return
}

//Auto Calc NPC Scores
async _onAutoCalc(event) {
  await this.actor.update({
    'system.manMove': this.actor.system.move,
    'system.manArm': this.actor.system.armour,
    'system.manShd': this.actor.system.shield,
    "system.manKnockdown": this.actor.system.hp.knockdown,
    "system.manMjrWnd": this.actor.system.hp.majorWnd,
    "system.manDmg": this.actor.system.damage,
    "system.manHealRate": this.actor.system.healRate,
    'system.manMaxHP': 0,
    'system.manUnconscious': 0
  })
}


}
