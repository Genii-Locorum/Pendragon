# CHANGELOG

## 11.0.9
- Fixed a bug with damage maxing out at 20
- Added URL in system.json to github


## 11.0.8
- Added opposed rolls.  Only the first roll added to card enters the Reflex Modifier.
- Refactored other rolls to adjust for the new opposed rolls
- Added tooltips for various roll options
- Added a game setting at user level to determine whether a roll is made with or without a dialogue box
  Default is a dialogue box appears and SHIFT means no dialogue box.  Turning this on reverses this position.
- Added combat rolls from weapons, similar to opposed rolls, which in turn allows a follow on damage roll for the succesful parties.
- AutoXP added - if the GM selects this in game settings then you XP checkboxes will be automatically ticked on a Successful roll or a Fumble. 
  In the case of traits a Fumble grants a tick to the opposing trat.  For combat rolls the underlying skill is ticked
- Hotbar macros enabled for Skills, Traits, Passions and Weapons (from the combat tab)  

## 11.0.7
- On creating a new character, linking, bars etc are now visible on token by default
- On creating a new character all traits and skills are added by default (not passions) and doesn't apply to NPCS


## 11.0.6
- Distinctive Features moved to just under Heraldry on the Biograpghy tab, but as a single line.
- Move corrected to be based on STR & DEX (not STR & SIZ)

## 11.0.5
- Character image changed to a square (150 * 150)
- Typo in Heraldry fixed
- Horses can now be created by the "+" icon added to the horse section of the companions tab
- Fair appeal now grants passive glory
- Right side traits now add passive glory
- "Events" section of the Biography tab now renamed to "Background" to avoid confusion with the Events section
- Hopefully fixed some odd formatting with the "item" description in the Equipment tab

## 11.0.4
- Item types of wound, squire and history no longer available in the Create Item menu - they can still be created on the character sheet
- Squire skill roll added to Companions tab
- Horse damage rolls added to Companions tab
- For skills etc with target score < 0, make the negative amount a CritBonus (i.e added to dice roll and increses fumble range)
- Added Glory roll to Character
- Added a second squire skill roll based on Age - 11
- Removed cap on Trait, but kept minimum as 0 for Opposite trait
- Deleted packs for horses, armour and weapons
- Added Trait Decision Rolls
- Chat Log message now includes Roll Type

## 11.0.3
- Added Socket functionality - doesn't do anything yet but added for future development
- GM Tools added as a scene button at the top left
- Winter Phase GM Tool added, creates a History Event for each character with passive glory score, increases age by 1 and game year by 1
- In Winter Phase players can automate the XP Checks and spend Prestige/Training Points
- Development Phase GM Tool added - allows characters to carry out Winter Phase steps without changing age, Game Year or adding History events
- Added equipped to horses and only allows one horse to be ridden - this then determines horse damage.
- Horse damage for equipment changed to use horse charge damage
- Added game setting for "AutoXP" - when On if skill, trait, passion or weapon roll made and is Fumble/Success/Critical XP box automatically checked


## 11.0.2
- Added basic rolls for Stats, Skills, Traits, Passions and Equipment skill check (not damage)
- Expanded horses to include charge damage
- Added treat wound and natural healing automation
- Added game year as a setting which will be prepopulated in new history events (it can still be changed)
- Added a Chirurgery check status on the Combat tab.  This is involved in the automatic checking to remove the debilitated status.
- Instructions updated

## 11.0.1

- Initial development
  Character & NPC Character Sheets for entry
  Items sheets for Armour, Gear (Equipment), History (Events), Horses, Passions, Skills, Squires, Traits, Weapons and Wounds
  Derived stats calculated
  Current HP, Glory, Armour Points auto calculated
  