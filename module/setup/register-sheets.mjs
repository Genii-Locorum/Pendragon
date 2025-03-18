import { PendragonCharacterSheet } from '../actor/sheets/character.mjs';
import { PendragonNPCSheetv2 } from '../actor/sheets/npcV2.mjs';
import { PendragonFollowerSheet } from '../actor/sheets/follower.mjs';
import { PendragonPartySheet } from '../actor/sheets/party.mjs';
import { PendragonEncounterSheet } from '../actor/sheets/encounter.mjs';
import { PendragonBattleSheet } from '../actor/sheets/battle.mjs';
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
import { PENJournalSheet } from '../sheets/pen-journal-sheet.mjs'
import { PendragonCharacterSheetv2 } from '../actor/sheets/characterv2.mjs';
//const {Actors, Items, Journal} = foundry.documents.collections;

export function registerSheets () {
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
    foundry.documents.collections.Actors.registerSheet('Pendragon', PendragonCharacterSheet, {
      types: ['character'],
      makeDefault: true
    })

    Actors.registerSheet('Pendragon', PendragonCharacterSheetv2, {
      types: ['character'],
    })

    foundry.documents.collections.Actors.registerSheet('Pendragon', PendragonNPCSheetv2, {
      types: ['npc'],
      makeDefault: true
    })    

    foundry.documents.collections.Actors.registerSheet('Pendragon', PendragonFollowerSheet, {
      types: ['follower'],
      makeDefault: true
    })

    foundry.documents.collections.Actors.registerSheet('Pendragon', PendragonPartySheet, {
      types: ['party'],
      makeDefault: true
    })  
    
    foundry.documents.collections.Actors.registerSheet('Pendragon', PendragonEncounterSheet, {
      types: ['encounter'],
      makeDefault: true
    }) 

    foundry.documents.collections.Actors.registerSheet('Pendragon', PendragonBattleSheet, {
      types: ['battle'],
      makeDefault: true
    }) 

  foundry.documents.collections.Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet)
    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonSkillSheet, {
      types: ['skill'],
      makeDefault: true
    })    

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonTraitSheet, {
      types: ['trait'],
      makeDefault: true
    })   

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonHistorySheet, {
      types: ['history'],
      makeDefault: true
    })  

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonWoundSheet, {
      types: ['wound'],
      makeDefault: true
    })
    
    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonPassionSheet, {
      types: ['passion'],
      makeDefault: true
    })  
    
    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonHorseSheet, {
      types: ['horse'],
      makeDefault: true
    }) 
    
    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonSquireSheet, {
      types: ['squire'],
      makeDefault: true
    }) 
    
    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonArmourSheet, {
      types: ['armour'],
      makeDefault: true
    }) 

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonWeaponSheet, {
      types: ['weapon'],
      makeDefault: true
    }) 

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonGearSheet, {
      types: ['gear'],
      makeDefault: true
    }) 
    
    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonFamilySheet, {
      types: ['family'],
      makeDefault: true
    }) 

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonCultureSheet, {
      types: ['culture'],
      makeDefault: true
    }) 

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonReligionSheet, {
      types: ['religion'],
      makeDefault: true
    }) 

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonClassSheet, {
      types: ['class'],
      makeDefault: true
    }) 

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonHomelandSheet, {
      types: ['homeland'],
      makeDefault: true
    }) 
    
    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonIdealSheet, {
      types: ['ideal'],
      makeDefault: true
    }) 

    foundry.documents.collections.Items.registerSheet('Pendragon', PendragonRelationshipSheet, {
      types: ['relationship'],
      makeDefault: true
    }) 

    foundry.documents.collections.Journal.unregisterSheet('core', foundry.appv1.sheets.JournalSheet)
    foundry.documents.collections.Journal.registerSheet('Pendragon', PENJournalSheet, {
      makeDefault: true
    })

  }