import { PendragonCharacterSheet } from '../actor/sheets/character.mjs';
import { PendragonNPCSheet } from '../actor/sheets/npc.mjs';
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

  }