import { PendragonCharacterSheet } from '../actor/sheets/character.mjs';
import { PendragonNPCSheet } from '../actor/sheets/npc.mjs';
import { PendragonFollowerSheet } from '../actor/sheets/follower.mjs';
import { PendragonSkillSheet } from '../item/sheets/skill.mjs';
import { PendragonTraitSheet } from '../item/sheets/trait.mjs';
import { PendragonHistorySheet } from '../item/sheets/history.mjs';
import { PendragonWoundSheet } from '../item/sheets/wound.mjs';
import { PendragonPassionSheet } from '../item/sheets/passion.mjs';
import { PendragonHorseSheet } from '../item/sheets/horse.mjs';
import { PendragonSquireSheet } from '../item/sheets/squire.mjs';
import { PendragonArmourSheet } from '../item/sheets/armour.mjs';
import { PendragonWeaponSheet } from '../item/sheets/weapon.mjs';
import { PendragonGearSheet } from '../item/sheets/gear.mjs';
import { PendragonFamilySheet } from '../item/sheets/family.mjs';
import { PendragonCultureSheet } from '../item/sheets/culture.mjs';
import { PendragonReligionSheet } from '../item/sheets/religion.mjs';
import { PendragonClassSheet } from '../item/sheets/class.mjs';
import { PendragonHomelandSheet } from '../item/sheets/homeland.mjs';
import { PendragonIdealSheet } from '../item/sheets/ideal.mjs';
import { PendragonRelationshipSheet } from '../item/sheets/relationship.mjs';
import { PENRollTableConfig } from '../sheets/pen-roll-table-config.mjs'
import { PENJournalSheet } from '../sheets/pen-journal-sheet.mjs'
const {Actors, Items, Journal} = foundry.documents.collections;

export function registerSheets () {
  Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet('Pendragon', PendragonCharacterSheet, {
      types: ['character'],
      makeDefault: true
    })

    Actors.registerSheet('Pendragon', PendragonNPCSheet, {
      types: ['npc'],
      makeDefault: true
    })

    Actors.registerSheet('Pendragon', PendragonFollowerSheet, {
      types: ['follower'],
      makeDefault: true
    })

  Items.unregisterSheet('core', ItemSheet)
    Items.registerSheet('Pendragon', PendragonSkillSheet, {
      types: ['skill'],
      makeDefault: true
    })    

    Items.registerSheet('Pendragon', PendragonTraitSheet, {
      types: ['trait'],
      makeDefault: true
    })   

    Items.registerSheet('Pendragon', PendragonHistorySheet, {
      types: ['history'],
      makeDefault: true
    })  

    Items.registerSheet('Pendragon', PendragonWoundSheet, {
      types: ['wound'],
      makeDefault: true
    })
    
    Items.registerSheet('Pendragon', PendragonPassionSheet, {
      types: ['passion'],
      makeDefault: true
    })  
    
    Items.registerSheet('Pendragon', PendragonHorseSheet, {
      types: ['horse'],
      makeDefault: true
    }) 
    
    Items.registerSheet('Pendragon', PendragonSquireSheet, {
      types: ['squire'],
      makeDefault: true
    }) 
    
    Items.registerSheet('Pendragon', PendragonArmourSheet, {
      types: ['armour'],
      makeDefault: true
    }) 

    Items.registerSheet('Pendragon', PendragonWeaponSheet, {
      types: ['weapon'],
      makeDefault: true
    }) 

    Items.registerSheet('Pendragon', PendragonGearSheet, {
      types: ['gear'],
      makeDefault: true
    }) 
    
    Items.registerSheet('Pendragon', PendragonFamilySheet, {
      types: ['family'],
      makeDefault: true
    }) 

    Items.registerSheet('Pendragon', PendragonCultureSheet, {
      types: ['culture'],
      makeDefault: true
    }) 

    Items.registerSheet('Pendragon', PendragonReligionSheet, {
      types: ['religion'],
      makeDefault: true
    }) 

    Items.registerSheet('Pendragon', PendragonClassSheet, {
      types: ['class'],
      makeDefault: true
    }) 

    Items.registerSheet('Pendragon', PendragonHomelandSheet, {
      types: ['homeland'],
      makeDefault: true
    }) 
    
    Items.registerSheet('Pendragon', PendragonIdealSheet, {
      types: ['ideal'],
      makeDefault: true
    }) 

    Items.registerSheet('Pendragon', PendragonRelationshipSheet, {
      types: ['relationship'],
      makeDefault: true
    }) 

    RollTables.unregisterSheet('core', RollTableConfig)
    RollTables.registerSheet('Pendragon', PENRollTableConfig, {
      makeDefault: true
    })

    Journal.unregisterSheet('core', JournalSheet)
    Journal.registerSheet('Pendragon', PENJournalSheet, {
      makeDefault: true
    })



  }