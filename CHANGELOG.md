# CHANGELOG

## 12.1.12
- Added two new Icons to NPC sheet - close sheet and calculate NPC scores
- Close Icon closes the NPC sheet (sometimes the Close icon in the title bar can get hidden when run from a compendium)
- NPC secondary scores (max HP, Move, Damage etc) are now input fields rather than auto calcs to allow maximum flexibility and for potential future imports
- The NPC Calc Scores icon will auto calculate these scores for you - you can still then override them.  Note this will auto calc all scores
- Valorous Modifier now added to NPC sheet
- Alternative Movement is added to NPC sheet - you can edit the title and the value.  The value is not auto calculated
- Equipment Names on the equipment tab are now truncated to one line like the description - but the full name and descriptions are available as tooltips
- Deleting items (Equip, Traits, Skills etc) is now a Double Click not a single click - to prevent accidents
- Changed various items grids so "View" icon is visible when character sheet is unlocked as well as the "Delete" icon
- Added "Add Armour" option to the armour grid
- Description boxes are now rich text editors and the text is no longer displayed as bold by default
- A GM Roll option has been added to the GM Tools and as a macro.  This allows the GM to make rolls without an actor (character, NPC etc).
- "Notable" added to EN.json 
- PID icon moved to the first of the icons on the top right of the relevant sheet.


## 12.1.11
- "Opposing Name" on trait item sheet shows the input area if it is blank to make it easier to know where to enter the value
- Famous traits now have there score shown in Bold Italics, Exalted Traits are in Purple Bold Italics
- Religious traits (where the religious modifier is not zero) are underlined
- Passions are now grouped by Court
- Increased size of the "hit points" space to allow for values up to 999
- Changed Character Background & NPC Notes to a rich text editor to allow for [[/roll]] and hyperlinks


## 12.1.10
- Game mechanics updated to Core Rulebook for 6th Edition - PLEASE NOTE THIS IS A MAJOR CHANGE AND MAY BREAK YOUR PRE-EXISTING WORLDS SO MAKE BACKUPS BEFORE MIGRATING
- Add Pendragon ID (PID) - a wholesale lift and shift of the Call of Cthulhu ID implementation
- Added Fixed Opposed Roll (resistance roll), Inquiry (GM Rolls) and Friendly Opposed Rolls
- Expanded Opposed Rolls to allow up to 5 participants (but removed dice colours)
- Added option to reduce Critical Bonuses in Opposed rolls
- Added "flavour" labels to traits and passions for Unsung/Famous/Exalted as a tooltip
- Added FumbleXP Setting that works with AutomateXP so you can exclude Fumble rolls from XP checks
- Added family members as items and on the Bio tab on character sheet
- Character Creation Routine Added in steps