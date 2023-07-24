import { PENChecks } from "../../apps/checks.mjs";
import { PENCombat } from "../../apps/combat.mjs";
import { PENWinter } from "../../apps/winterPhase.mjs";
import { PENUtilities } from "../../apps/utilities.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PendragonCharacterSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["Pendragon", "sheet", "actor","character"],
      template: "systems/Pendragon/templates/actor/character-sheet.html",
      width: 825,
      height: 640,
      scrollY: ['.bottom-panel'],
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "combat" }]
    });
  }


  // -------------------------------------------- 

  //@override
  getData() {

    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    context.isGM = game.user.isGM;
    context.isWinter = game.settings.get('Pendragon' , 'winter')
    context.isDevelopment = game.settings.get('Pendragon' , 'development')
    

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
    const traits = [];
    const skills = [];
    const wounds = [];
    const history = [];
    const passions = [];
    const horses = [];
    const squires = [];
    const armours = [];
    const weapons = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'gear') {
        i.system.cleanDesc =  i.system.description.replace(/<[^>]+>/g, "") //await this.convertToPlain(i.system.description)
        gears.push(i);
      } else if (i.type === 'trait') {
        traits.push(i);
      } else if (i.type === 'skill'){
        skills.push(i);
      } else if (i.type === 'wound' && i.system.value >0) {
        wounds.push(i);
      } else if (i.type === 'history') {
        history.push(i);
      } else if (i.type === 'passion') {
        passions.push(i);
      } else if (i.type === 'horse') {
        horses.push(i);
      } else if (i.type === 'squire') {
        squires.push(i);
      } else if (i.type === 'armour') {
        armours.push(i);
      } else if (i.type === 'weapon') {
        weapons.push(i);
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
      let x = a.name.toLowerCase();
      let y = b.name.toLowerCase();
      let p = a.system.combat;
      let q = b.system.combat;
      if (p < q) {return -1};
      if (p > q) {return 1};
      if (x < y) {return -1};
      if (x > y) {return 1};
      return 0;
    });  

    // Sort History
    history.sort(function(a, b){
      let x = a.system.year;
      let y = b.system.year;
      let p = a._stats.createdTime;
      let q = b._stats.createdTime;
      if (x < y) {return 1};
      if (x > y) {return -1};
      if (p < q) {return 1};
      if (p > q) {return -1};
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

    // Sort Horses with Warhorse at top
    horses.sort(function(a, b){
      let x = a.system.chargeDmg;
      let y = b.system.chargeDmg;
      if (x < y) {return 1};
      if (x > y) {return -1};
      return 0;
    });

    // Sort Squires by age
    squires.sort(function(a, b){
      let x = a.system.age;
      let y = b.system.age;
      if (x < y) {return 1};
      if (x > y) {return -1};
    return 0;
    });

    // Sort Wounds by damage, low first
    wounds.sort(function(a, b){
      let x = a.system.value;
      let y = b.system.value;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });

    // Sort Weapons by melee/missile and name
    weapons.sort(function(a, b){
      let x = a.name.toLowerCase();
      let y = b.name.toLowerCase();
      let p = a.system.melee;
      let q = b.system.melee;
      if (p < q) {return 1};
      if (p > q) {return -1};
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });

    // Assign and return
    context.gears = gears;
    context.traits = traits;
    context.skills = skills;
    context.wounds = wounds;
    context.history = history;
    context.passions = passions;
    context.horses = horses;
    context.squires = squires;
    context.armours = armours;
    context.weapons = weapons;
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

    html.find('.item-create').click(this._onItemCreate.bind(this));                     // Add Inventory Item
    html.find(".inline-edit").change(this._onInlineEdit.bind(this));                    // Inline Edit
    html.find(".item-toggle").dblclick(this._onItemToggle.bind(this));                  // Item Toggle
    html.find(".actor-toggle").dblclick(this._onActorToggle.bind(this));                // Actor Toggle
    html.find(".rollable").click(PENChecks._onRollable.bind(this));                     // Dice Roll from stat etc
    html.find(".treat-wound").dblclick(PENCombat.treatWound.bind(this));                // Treat a wound
    html.find(".natural-heal").dblclick(PENCombat.naturalHealing.bind(this));           // Natural Healing
    html.find(".xp-check").click(PENWinter.xpCheck.bind(this));                         // XP Rolls
    html.find(".prestige-check").click(PENWinter.winterImprov.bind(this,"prestige"));   // Spend prestige
    html.find(".train-single").click(PENWinter.winterImprov.bind(this,"single"));       // Spend training as a single point
    html.find(".train-multiple").click(PENWinter.winterImprov.bind(this,"multiple"));   // Spend training spread across multiple skills
    
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
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);
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
      if(type === "history"){
        await item.update({'system.year' : game.settings.get('Pendragon',"gameYear")})
      }
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
    let newScore = Number(element.value);
    let target = "";
    if (field === 'trait') {
      target = "system.value";
      newScore=Math.min(newScore,20);
    } else if (field === 'skill' || field === 'wound' || field === 'passion'){
      target = "system.value";
    } else if (field === 'horse'){
      target = "system.hp";
    } else if (field === 'armour'){
      target = "system.ap";
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
    if (prop === "XP") {
      checkProp = {'system.XP': !item.system.XP}
    } else if (prop === "oppXP") {
      checkProp = {'system.oppXP': !item.system.oppXP}
    } else if (prop === "wound") {
      checkProp = {'system.treated': !item.system.treated}
    } else if (prop === "equipped") {
      checkProp = {'system.equipped': !item.system.equipped}
    }
    await item.update(checkProp);

    //If toggle was to equip a horse then uneqip all other horses
    if (item.type === 'horse' && item.system.equipped) {
      for (let i of this.actor.items){
        if (i.type === 'horse' && i._id != itemID){
          await i.update({'system.equipped' : false})
        }
      }
    }

  return
}

//Toggle Actor
  async _onActorToggle(event){
    const prop= event.currentTarget.dataset.property;
    let checkProp={};
    if (prop === "lock") {
      checkProp = {'system.lock': !this.actor.system.lock}
    } else if (prop === "debilitated") {
      checkProp = {'system.status.debilitated': !this.actor.system.status.debilitated,
                   'system.status.chirurgery': false}
    } else if (prop === "chirurgery") {
      checkProp = {'system.status.chirurgery': !this.actor.system.status.chirurgery}
    } else if (prop === "unconscious") {
      checkProp = {'system.status.unconscious': !this.actor.system.status.unconscious}
    } else if (prop === "nearDeath") {
      checkProp = {'system.status.nearDeath': !this.actor.system.status.nearDeath}
    } else if (prop === "madness") {
      checkProp = {'system.status.madness': !this.actor.system.status.madness}
    } else if (prop === "melancholy") {
      checkProp = {'system.status.melancholy': !this.actor.system.status.melancholy}
    } else if (prop === "misery") {
      checkProp = {'system.status.misery': !this.actor.system.status.misery}
    } 

  await this.actor.update(checkProp);
  return
}




}
