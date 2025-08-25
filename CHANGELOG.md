# CHANGELOG

## 13.1.34
- Update character creation for Foundry V13 roll tables

## 13.1.33
- Reworked winter skill training dialog
- Clarified wording around winter characteristic training
- Fix missing PID editor on rollable tables
- French translation provided by Kyllianm85

## 13.1.32
- Fixed issue with GM Tools menu causing tokens not to drag properly on the canvas

## 13.1.31
- Remember if an encounter is a skirmish or a feast
- Show the initiative roll for feast seating in the chat
- Allow GM to move feast participant seating via context menu
- Track geniality via the combat tracker during a feast

## 13.1.30
- Complete migration of item sheets to V2 Application
- Ensure all V2 item sheets can be resized like their V1 counterparts
- Bump verified compatibility version to 13.345
- Rebuilds the instructions compendium, fixing all the broken links and ordering of journals
- Empty droppable areas on item sheets now have an instruction and slightly larger drop target
- To align with the core rules, the default grid size is now 1 yard. As always, you can adjust this in the scene settings

## 13.1.29
- Adjusting selectivity of Dark Mode override (we are effectively ignoring Dark Mode and trying not to affect things that aren't part of the Pendragon system)
- Adjusted svg files to have an explicit height and width

## 13.1.28
- Updated to work with Foundry V13
- Anyone being able to expand a dice roll is a known issue
- Please report any other issues at https://github.com/Genii-Locorum/Pendragon/issues
- And PLEASE do back up your worlds before migrating to Foundry V13 and/or Pendragon 13.1.28


## 12.1.27
- History, Traits, Passions and Weapons have now been moved over to V2 Application
- Combat Tracker now has two types of Combat - Feast and Skirmish - with a button to switch between the two modes
- In feast mode, group the participants by seating area; sort by and display Glory instead of the raw initiative score.
- Uses DEX for initiative in skirmish mode (allowing for a functional combat tracker) and seating rolls for initiative in feast mode.
- Adds "enums" for the roll types, card types, and roll results, making it easier to avoid confusion in some places.


## 12.1.26
- You can once again add PIDs to armour

## 12.1.25
Some colour changes so that even if using Dark mode the text will still be black and therefore visible.  If I've missed any instances then please let me know.
When dropping traits, passions, skills etc to other items (e.g. adding Traits to a Religion) you will get a message if the item doesn't have a PID and therefore can't be dropped

## 12.1.24
- Corrected a typo causing Critical Damage to not roll correctly.  Thank you to Razage.
- The Armour sheet now has an "Available Year" input field on the Description tab, which then shows the period the item is available in. This is part of moving to Application V2 and will be 
  extended to other items as we migrate them.  Only GMs can alter the year.  Thanks to jbowtie.

## 12.1.23
All of this is the hardwork of jbowtie - all thanks and credit to him
- When you select a religious trait or it's opposite as your famous trait during character creation, it now becomes 16, not 19.
- Use the new passion selection dialog during the character creation training phase (step 13). Passions may only be raised, not lowered, during this step. (As opposed to Winter, when they may also be lowered).
- You can turn off child mortality in the game settings - this will skip child survival rolls and causes any "tragedy" result during childbirth to be treated as "no conception".

## 12.1.22
All of this is the hardwork of jbowtie - all thanks and credit to him
-	Update the history dialog to ApplicationV2.
-	Remove the (currently broken) favour checkbox. You can rename the event if you need to track favour.
-	Remove the misleading read-only "description" label on the attributes tab.
-	On the character sheet, swap the "Year" and "Event" columns, to read more naturally.
-	On the character sheet, fix the broken 'delete event' functionality when the sheet is unlocked, allowing mistaken and blank entries to be cleaned up.
-	During character creation, do not delete events when resetting step 13. This fixes the deletion of the 'born' and 'squired' events.
-	During the winter phase, name events more precisely (not just 'History').
-	Add infrastructure to support migrations, and use it to rename events named "History" that have a non-empty description.

## 12.1.21
- Winter phase passion dialog updated: Specific instruction at the top of the page, Group existing passions by courts, Correctly allow raising and lowering of existing passions, Capped at twenty for winter training, uncapped for prestige training (thanks to jbowtie)
- Skills now display the Description and GM Description properly.

## 12.1.20
- Fix issue with Winterphase not resetting some of the rolls, thus prevented them from being repeated.

## 12.1.19
- First toe in the water moving to V2 Application.  Armour Sheet is now on V2.  Please report any odd behavious
- Directed passions can be easily gained during play, by adding a "+" button next to each court.
- Passions with a zero score are now hidden when the sheet is locked (they are shown when the sheet is unlocked).
- Now shows the opposing traits and religious marker when you choose to train a trait.
- Uses the characteristic names in the stat selection dialog (one of the first dialogs a new player will see).
- Shows the name of the family characteristic in corresponding selection dialog (not just the skill name).
-Training and prestige dialogs now broken up into more granular choices - addresses Redo training and practice dialog #17
- All this hard work is by jbowtie, thank you so much.

## 12.1.18
- Changes thanks to 'jbowtie' - now added as an author
- Religious traits are now marked as such.
- Appearance renamed to Appeal as per Pendragon 6E.
- Fixed an error where many traits were incorrectly being set to 0 when using constructed method.
- Single dialog for picking famous trait, showing the trait pairs.
- Trait pairs are sorted by name, always showing the correct order.
- Cannot choose Cowardly as a famous trait (due to valorous needing to be 15).
- Now shows the famous trait pair during point allocation (however cannot allocate points to either side).
- Now marks religious traits during point allocation.
- Existing "TraitsSelectDialog" named to "ItemsSelectDialog", reflecting its more generic usage.

## 12.1.17
- Players can now edit their horses - not just limited to GMs
- You can now give owned horses a name, colour, breed, cost, age, features and personality
- There is a new actor type - Follower.  This is very much like an NPC but with a few of the Character background items.  They also have a sub-type - Squire, Family, Retainer.  
- Squire sub-types have a Squire score, which can be rolled, along with their age (on the personal details tab)
  They are designed to be converted in the longer term to characters and offer more detail than the "items" on the character sheet.  You can use whichever option you want.
- There's a new game setting - "Use Reputation" which if active adds a new tab to the character sheet "Follower"
- GMs can drag other actors to a character sheet (only a character sheet), creating a "relationship" between the two actors - if the "Use Reputation" game setting is active - these relationships appear on the Follower tab
- Players can edit the title of the relationship or delete it.
- By clicking on the person's name in the follower tab (not the relationship item) you can open the relevant actor sheet if you have the right permissions
- If the actor is a Follower with sub-type "squire" you can make Squire and Age rolls from the follower tab.

## 12.1.16
- Squire age roles changed to age-9 per 6th Ed Core Rulebook (changed from age-11 in Starter Set)

## 12.1.15
- Corrected a couple of typos on "Oppossed" or "Oppossing" - to a single s - - thank you to John Barstow
- Changed code on select item dialog and radio buttons - thank you to John Barstow

## 12.1.14
- Change to manifest URL to correct where it points

## 12.1.13
- NPC sheets, when locked, only show the headings for Skills, Weapons etc when there are relevant contents.  Heading always shown when the skill sheet is unlocked

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