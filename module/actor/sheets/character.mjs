import { PENRollType } from "../../cards/rollType.mjs";
import { PENCombat } from "../../apps/combat.mjs";
import { PENWinter } from "../../apps/winterPhase.mjs";
import { PENCharCreate } from "../../apps/charCreate.mjs"
import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'
import { PENactorItemDrop } from '../actor-itemDrop.mjs';
import { PENUtilities } from "../../apps/utilities.mjs";


/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PendragonCharacterSheet extends ActorSheet {

  //Add PID buttons to sheet
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addPIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["Pendragon", "sheet", "actor","character"],
      template: "systems/Pendragon/templates/actor/character-sheet.html",
      width: 840,
      height: 655,
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
    context.isLocked = actorData.system.lock
    context.hasCulture = false
    context.hasHomeland = false
    context.hasClass = false
    context.hasReligion = false
    if (actorData.system.cultureID != "") {context.hasCulture = true}  
    if (actorData.system.homelandID != "") {context.hasHomeland = true} 
    if (actorData.system.classID != "") {context.hasClass = true}
    if (actorData.system.religionID != "") {context.hasReligion = true}
    context.hasFamily = false
    if (actorData.items.filter(itm =>itm.type==='skill' && itm.system.family > 0).length >0) {context.hasFamily = true}
    if (actorData.system.beauty > 0) {context.hasFamily = true}
    context.isWinter = game.settings.get('Pendragon' , 'winter')
    context.isDevelopment = game.settings.get('Pendragon' , 'development')
    context.isCreation = game.settings.get('Pendragon' , 'creation')
    context.useRelation = game.settings.get('Pendragon' , 'useRelation')
    context.statTotal = actorData.system.statTotal    
    context.solLabel = game.i18n.localize('PEN.'+actorData.system.sol)
    context.sizLabel = game.i18n.localize('PEN.sizInc.'+actorData.system.stats.siz.growth)
    context.enrichedBackgroundValue = await TextEditor.enrichHTML(
      context.system.background,
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
    const traits = [];
    const skills = [];
    const wounds = [];
    const history = [];
    const passions = [];
    const horses = [];
    const squires = [];
    const armours = [];
    const weapons = [];
    const families = [];
    const ideals = [];
    const household = [];
    const followers = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'gear') {
        i.system.cleanDesc =  i.system.description.replace(/<[^>]+>/g, "") 
        gears.push(i);
      } else if (i.type === 'trait') {
        traits.push(i);
      } else if (i.type === 'skill'){
        skills.push(i);
      } else if (i.type === 'wound' && i.system.value >0) {
        wounds.push(i);
      } else if (i.type === 'history') {
        if (i.system.favour) {
          i.system.label = game.i18n.localize("PEN.favourShort")+ i.system.favourLevel + " " + i.system.description
        } else {
          i.system.label = i.system.description
        }
        i.system.label = (i.system.label).replace(/(<([^>]+)>)/gi, '')
        history.push(i);
      } else if (i.type === 'passion') {
        if (i.flags.Pendragon?.pidFlag.id === 'i.passion.honour') {
          i.system.isHonour = true
        } else {
          i.system.isHonour = false
        }
          i.system.level = 1
        passions.push(i);
      } else if (i.type === 'horse') {
        i.system.careName = game.i18n.localize('PEN.horseHealth.'+i.system.horseCare)
        i.system.healthName = game.i18n.localize('PEN.horseHealth.'+i.system.horseHealth)
        i.system.totalAR = i.system.armour + i.system.horseArmour
        i.system.label = i.name
        if (i.system.horseName !="") {i.system.label = i.system.horseName}
        horses.push(i);
      } else if (i.type === 'squire') {
        i.system.squireType = game.i18n.localize('PEN.'+i.system.category)
        if (i.system.category === 'squire') {
          squires.push(i);
        } else {
          household.push(i);
        }
      } else if (i.type === 'armour') {
        armours.push(i);
      } else if (i.type === 'weapon') {
        weapons.push(i);
      } else if (i.type === 'family') {
        i.system.typeName = game.i18n.localize('PEN.'+i.system.relation)
        families.push(i);
      } else if (i.type === 'ideal') {
        ideals.push(i);
      } else if (i.type === 'relationship') {
        i.system.typeName = game.i18n.localize('PEN.' + i.system.typeLabel)
        if (i.system.born > 0) {
          i.system.age = game.settings.get('Pendragon','gameYear') - i.system.born  
        } else {
          i.system.age=""
        }
        followers.push(i)
      }
    }

    passions.push(
      {
        'name': game.i18n.localize('PEN.adoratio'),
        'system': {'total': this.actor.system.adoratio,
                   'court':'adoratio',
                   'level':0}
      },
      {
        'name': game.i18n.localize('PEN.civilitas'),
        'system': {'total': this.actor.system.civilitas,
                   'court':'civilitas',
                   'level':0}    
      },
      {
        'name': game.i18n.localize('PEN.fervor'),
        'system': {'total': this.actor.system.fervor,
                    'court':'fervor',
                    'level':0}
      },
      {
        'name': game.i18n.localize('PEN.fidelitas'),
        'system': {'total': this.actor.system.fidelitas,
                   'court':'fidelitas',
                   'level':0}
      },
      {
        'name': game.i18n.localize('PEN.honor'),
        'system': {'total': this.actor.system.honor,
                   'court': 'honor',
                   'level':0}
      }      
  )

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

    // Sort Passions by Court, level and name
    passions.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      let p = a.system.court
      let q = b.system.court
      let r = a.system.level
      let s = b.system.level      
      if (p < q) {return -1};
      if (p > q) {return 1};
      if (r < s) {return -1};
      if (r > s) {return 1};
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

    // Sort Ideals
    ideals.sort(function(a, b){
      let x = a.name;
      let y = b.name;
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
    context.families = families;
    context.ideals = ideals;
    context.household = household;
    context.followers = followers;
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
    if (!this.isEditable) return;


    //Clickable and hoverable events
    html.find('.item-create').click(this._onItemCreate.bind(this));                         // Add Inventory Item
    html.find(".inline-edit").change(this._onInlineEdit.bind(this));                        // Inline Edit
    html.find(".item-toggle").dblclick(this._onItemToggle.bind(this));                      // Item Toggle
    html.find(".actor-toggle").dblclick(this._onActorToggle.bind(this));                    // Actor Toggle
    html.find(".clickable.viewItem").click(this._viewItem.bind(this));                      // View Item
    html.find(".rollable.stat").click(PENRollType._onStatCheck.bind(this));                 // Stats check
    html.find(".rollable.skill-name").click(PENRollType._onSkillCheck.bind(this));          // Skill check
    html.find(".rollable.passion-name").click(PENRollType._onPassionCheck.bind(this));      // Passion check
    html.find(".rollable.glory").click(PENRollType._onGloryCheck.bind(this));               // Glory check
    html.find(".rollable.move").click(PENRollType._onMoveCheck.bind(this));                 // Glory check
    html.find(".rollable.squire").click(PENRollType._onSquireCheck.bind(this));             // Squire check
    html.find(".rollable.trait").click(PENRollType._onTraitCheck.bind(this));               // Trait check 
    html.find(".rollable.decision").click(PENRollType._onDecisionCheck.bind(this));         // Decision Trait check
    html.find(".rollable.damage").click(PENRollType._onDamageRoll.bind(this));              // Damage roll
    html.find(".rollable.combat").click(PENRollType._onCombatCheck.bind(this));             // Combat roll
    html.find(".treat-wound").dblclick(PENCombat.treatWound.bind(this));                    // Treat a wound
    html.find(".natural-heal").dblclick(PENCombat.naturalHealing.bind(this));               // Natural Healing
    html.find(".xp-check").click(PENWinter.xpCheck.bind(this));                             // XP Rolls
    html.find(".economic").click(PENWinter.economic.bind(this));                            // Set economic circumstances
    html.find(".aging").click(PENWinter.aging.bind(this));                                  // Check aging
    html.find(".squireAge").click(PENWinter.squireWinter.bind(this));                       // Squire and Maiden Winter checks
    html.find(".horseSurvival").click(PENWinter.horseSurvival.bind(this,"single"));         // Check Horse Survival
    html.find(".prestige-trait").click(PENWinter.winterImproveTrait.bind(this,"prestige")); // Spend prestige on a trait
    html.find(".prestige-passion").click(PENWinter.winterImprovePassion.bind(this,"prestige")); // Spend prestige on a passion
    html.find(".prestige-check").click(PENWinter.winterImprov.bind(this,"prestige"));       // Spend prestige on a characteristic or skill
    html.find(".train-trait").click(PENWinter.winterImproveTrait.bind(this,"single"));      // Spend training on a trait
    html.find(".train-passion").click(PENWinter.winterImprovePassion.bind(this,"single"));  // Spend training on a passion
    html.find(".train-single").click(PENWinter.winterImprov.bind(this,"single"));           // Spend training as a single point
    html.find(".train-multiple").click(PENWinter.winterImprov.bind(this,"multiple"));       // Spend training spread across multiple skills
    html.find(".familyRoll").click(PENWinter.familyRoll.bind(this,"single"));               // Family Rolls
    html.find(".charcreate").click(PENCharCreate.startCreate.bind(this));                   // Start Character Creation
    html.find(".addWound").click(PENCombat.addWound.bind(this));                            // Add a Wound/Damage
    html.find(".reset-culture").click(this._onUndoCulture.bind(this));                      // Delete Culture
    html.find(".reset-homeland").click(this._onUndoHomeland.bind(this));                    // Delete Homeland
    html.find(".reset-class").click(this._onUndoClass.bind(this));                          // Delete Class
    html.find(".reset-religion").click(this._onUndoReligion.bind(this));                    // Delete Religion
    html.find(".stat-roll").click(this._statRoll.bind(this));                               // Roll Stats
    html.find(".genSkills").click(this._genSkills.bind(this));                              // Reset Base Score
    html.find(".trait-roll").click(this._traitRoll.bind(this));                             // Roll Traits
    html.find(".openActor").click(this._openActor.bind(this));                              // Open Relationship Actor
    html.find('.charcreate.rollable')                                                       //Character Create Tooltip
      .mouseenter(this.toolTipCharCreateEnter.bind(this))
      .mouseleave(game.PENTooltips.toolTipLeave.bind(this))
    

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
      html.find('.item-delete').dblclick(ev => {
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
    let key = await game.system.api.pid.guessId(item)
    await item.update({'flags.Pendragon.pidFlag.id': key,
                         'flags.Pendragon.pidFlag.lang': game.i18n.lang,
                         'flags.Pendragon.pidFlag.priority': 0})
    if (['history', 'wound', 'horse','squire','gear','family','armour'].includes(type)) {
      if(type === "history"){
        await item.update({'system.year' : game.settings.get('Pendragon',"gameYear"),
                           'system.source': "manual" })
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
    if (['skill','passion','trait'].includes(field)) {
      const att = li.data("att");
      target = "system."+att;
    } else if (field === 'wound'){
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
    } else {
      return
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

    if(['lock','heir'].includes(prop)){
      checkProp = {[`system.${prop}`]: !this.actor.system[prop]}
    } else if(['chirurgery','unconscious','nearDeath','madness','melancholy','misery','barren'].includes(prop)){
      checkProp = {[`system.status.${prop}`]: !this.actor.system.status[prop]}
    } else if (prop === "debilitated") {
      checkProp = {'system.status.debilitated': !this.actor.system.status.debilitated,
                   'system.status.chirurgery': false}
    } else {
      return
    }
    await this.actor.update(checkProp);
    return
  }


  // Change default on Drop Item Create routine for requirements (single items and folder drop)-----------------------------------------------------------------
  async _onDropItemCreate(itemData) {
    const newItemData = await PENactorItemDrop._PENonDropItemCreate(this.actor,itemData);
    return this.actor.createEmbeddedDocuments("Item", newItemData);
  }  


  //Dropping an actor on to character
  async _onDropActor(event,data) {
    event.preventDefault()
    if (!game.settings.get('Pendragon','useRelation')) {
      ui.notifications.warn(game.i18n.localize('PEN.noRelation'))
      return
    }
    const dataList = await PENUtilities.getDataFromDropEvent(event, 'Actor')
    for (const companion of dataList) {
      let present = (this.actor.items.filter(itm =>itm.type === 'relationship').filter(nitm=>nitm.system.sourceUuid === companion.uuid)).length
      if (present>0) {
        ui.notifications.warn(game.i18n.format('PEN.relationPresent',{name: companion.name}))
        continue
      }


      let actr1 = companion.uuid
      let actr2 = this.actor.uuid
      if(actr1 === actr2) {continue}
      let name = companion.name + "-" + this.actor.name
      let typeLabel = companion.type
      let born = 0
      let squire = 0
      if (companion.type == 'follower') {
        typeLabel = companion.system.subtype
        born = companion.system.born
        if (companion.system.subtype === 'squire') {
          squire = companion.system.squire
        }
      } else if (companion.type === 'character') {
        born = companion.system.born
      }

      const itemData = {
        name: name,
        type: "relationship",
        system: {
          sourceUuid: actr1,
          targetUuid: actr2,
          person1Name: companion.name,
          person2Name: this.actor.name ,
          typeLabel: typeLabel,
          born: born,
          squire:squire
        }
      };
  
      // Finally, create the item!
      let item = await Item.create(itemData, {parent: this.actor});
      let key = await game.system.api.pid.guessId(item)
      await item.update({'flags.Pendragon.pidFlag.id': key,
                           'flags.Pendragon.pidFlag.lang': game.i18n.lang,
                           'flags.Pendragon.pidFlag.priority': 0})
        item.sheet.render(true);
    }
    return false
  }

  // Tooltip for Character Creation
  async toolTipCharCreateEnter (event) {
    let actor = this.actor
    let steps = 15   //Number of character creation steps
    const delay = parseInt(game.settings.get('Pendragon', 'toolTipDelay'))
    if (delay > 0) {
      game.PENTooltips.ToolTipHover = event.currentTarget
      game.PENTooltips.toolTipTimer = setTimeout(function () {
        if (
          typeof game.PENTooltips.ToolTipHover !== 'undefined' &&
          game.PENTooltips.ToolTipHover !== null
        ) {
          let status =""
          let check = ""
          let toolTip = "<strong>" + game.i18n.localize('PEN.creation') + "</strong>"
          for (let sCount = 1; sCount <=steps; sCount++) {
            if (sCount === 1 && actor.system.create.step>1) {
              if(actor.system.create.random) {
                status = "<strong>" + game.i18n.localize('PEN.roll') + "</strong>"
              }else {
                status = "<strong>" + game.i18n.localize('PEN.construct') + "</strong>"
              }
            } else {
            status = game.i18n.localize('PEN.incomplete')
            check = "step" + sCount
            if (actor.system.create.step> sCount) {status = "<strong>"+game.i18n.localize('PEN.complete')+"</strong>"}
            }    
            toolTip = toolTip + "<div>" + game.i18n.localize('PEN.step.'+sCount)+ " - " + status + "</div>"
          }
          game.PENTooltips.displayToolTip(toolTip)
        }
      }, delay)
    }
  }

  //Trigger Culture Deletion
  async _onUndoCulture(event){
    await PENCharCreate.undoCulture(this.actor)
  }

  //Trigger Homeland Deletion
  async _onUndoHomeland(event){
    await PENCharCreate.undoHomeland(this.actor)
  }

  //Trigger Class Deletion
  async _onUndoClass(event){
    await PENCharCreate.undoClass(this.actor)
  }

  //Trigger Religion Deletion
  async _onUndoReligion(event){
    await PENCharCreate.undoReligion(this.actor)
  }

  //Trigger a Stat Creation Roll
  async _statRoll(event) {
    if (this.actor.system.create.stats) {
      await PENCharCreate.rollStats(this.actor)
      await this.actor.update({'system.create.stats': false})
    } else if(game.user.isGM) {
      await this.actor.update({'system.create.stats': true})
    }
  }

  //Trigger Skills Base Score Calculation 
  async _genSkills(event){
    await PENCharCreate.baseSkillScore(this.actor)
  }

  //Trigger Trait Rolls 
  async _traitRoll(event){
    if (this.actor.system.create.traits) {
      await PENCharCreate.rollTraits(this.actor)
      await this.actor.update({'system.create.traits': false})
    } else if(game.user.isGM) {
      await this.actor.update({'system.create.traits': true})
    }
  }

  //View Homeland etc
  async _viewItem(event) {
    const li = event.currentTarget.dataset.itemId
    const item = this.actor.items.get(li);
    item.sheet.render(true);
  }

  //Update Relationship
  async _updateRelationship(itemid, person1Name) {
    let item = await this.actor.items.get(itemid);
    let tempActr = await fromUuid(item.system.sourceUuid)
    if (!tempActr) {
      ui.notifications.warn(game.i18n.format('PEN.noActor', {actr: person1Name}))
      return
    }
    let name1 = tempActr.name
    let born = 0
    let squire = 0
    let typeLabel = tempActr.type
    if (['follower','character'].includes(tempActr.type)) {
      born = tempActr.system.born
    }
    if(tempActr.type === 'follower') {
      typeLabel = tempActr.system.subtype
      if (tempActr.system.subtype === 'squire') {
        squire = tempActr.system.squire
      }
    }
    await item.update({
        'system.person1Name' : name1,
        'system.born': born,
        'system.squire' : squire,
        'system.typeLabel': typeLabel
      })
    item.sheet.render(true);
  }

  //Open Relationship Actor Sheet
  async _openActor(event) {
    const sourceUuid= event.currentTarget.dataset.actoruuid;
    if (sourceUuid) {
      let tempActor = await fromUuid(sourceUuid)
      tempActor.sheet.render(true)
    } 
  }

}
