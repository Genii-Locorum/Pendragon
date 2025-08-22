import { PENUtilities } from "./utilities.mjs"
import { ItemsSelectDialog } from "./item-selection.mjs"
import {PassionsSelectDialog} from "./passion-selection.mjs"
import { StatsSelectDialog } from "./stat-selection.mjs"
import { TraitsSelectDialog } from "./trait-selection.mjs"
import { PENCheck } from "./checks.mjs"

export class PENCharCreate {

  static async creationPhase(toggle) {
    if (toggle) {
      ui.notifications.warn(game.i18n.localize('PEN.creationPhaseStart'))
    }else{
      ui.notifications.warn(game.i18n.localize('PEN.creationPhaseEnd'))
    }

    await game.settings.set('Pendragon', 'creation', toggle)

    for (const a of game.actors) {
      if(a.type === 'character') {
        await a.update({'system.create.toggle': !a.system.create.toggle,})
      }
    }
  }

  static async startCreate (event){
    let actor = this.actor

    //If ALT key pressed then look to Undo a single step
    if (event.altKey) {
      await PENCharCreate.undoCreate(actor)
      return
    }

    //If creation complete or this isn't a character then return
    if (actor.system.create.complete || actor.type != 'character'){return}

    //CHECK THAT ALL THE NECESSARY COMPONENTS ARE IN PLACE
    let confirm = await PENCharCreate.validate()
    if (!confirm) {return}

    //STEP 1: Select creation method
    if (actor.system.create.step === 1) {
      let result = await PENCharCreate.step1(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 2})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step1'))
    }

    //STEP 2:  Add family
    if (actor.system.create.step === 2) {
        let result = await PENCharCreate.step2(actor)
        if (!result) {return}
        await actor.update({'system.create.step': 3})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step2'))
      }

    //STEP 3: Add Culture
    if (actor.system.create.step === 3) {
      //If actor has a culture then update to say step completed
      if (actor.system.cultureID != "") {
        await actor.update({'system.create.step': 4})
      } else {
        // Call Step 3
        let result = await PENCharCreate.step3(actor)
        if(!result) {return}
        await actor.update({'system.create.step': 4})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step3'))
      }
    }

    //STEP 4: Set Characteristics
    if (actor.system.create.step === 4) {
      let result = await PENCharCreate.step4(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 5})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step4'))
    }

    //STEP 5: Add Religion
    if (actor.system.create.step === 5) {
      //If there is a religion then update to say step completed
      if (actor.items.filter(itm =>itm.type==='religion').length >0 ) {
        await actor.update({'system.create.step': 6})
      } else {
        let result = await PENCharCreate.step5(actor)
        if (!result) {return}
        await actor.update({'system.create.step': 6})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step5'))
      }
    }

    //STEP 6:Set Traits
    if (actor.system.create.step === 6) {
      let result = await PENCharCreate.step6(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 7})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step6'))
    }

    //STEP 7: Select Class
    if (actor.system.create.step === 7) {
      //If actor has a class then update to say step completed
      if (actor.system.classID != "") {
        await actor.update({'system.create.step': 8})
      } else {
        let result = await PENCharCreate.step7(actor)
        if (!result) {return}
      await actor.update({'system.create.step': 8})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step7'))
      }
    }

    //STEP 8: Select Homeland
    if (actor.system.create.step === 8) {
      //If actor has a homeland then update to say step completed
      if (actor.system.homelandID != "") {
        await actor.update({'system.create.step': 9})
      } else {
        let result = await PENCharCreate.step8(actor)
        if (!result) {return}
        await actor.update({'system.create.step': 9})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step8'))
      }
    }

    //STEP 9:  Set Passions
    if (actor.system.create.step === 9) {
      let result = await PENCharCreate.step9(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 10})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step9'))
    }

    //STEP 10: Set Skills
    if (actor.system.create.step === 10) {
      let result = await PENCharCreate.baseSkillScore(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 11})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step10'))
    }

    //STEP 11: Family Characteristic
    if (actor.system.create.step === 11) {
      let result = await PENCharCreate.step11(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 12})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step11'))
    }

    //STEP 12: Skill Points Spend
    if (actor.system.create.step === 12) {
      let result = await PENCharCreate.step12(actor,10)
      if (!result) {
        await PENCharCreate.undostep13(actor)
        return}
      await actor.update({'system.create.step': 13})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step12'))
    }

    //STEP 13: Skill Points Spend
    if (actor.system.create.step === 13) {
      let result = await PENCharCreate.step13(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 14})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step13'))
    }

    //STEP 14: Luck Benefit
    if (actor.system.create.step === 14) {
      let result = await PENCharCreate.step14(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 15})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step14'))
    }

    //STEP 15: Knighted
    if (actor.system.create.step === 15) {
      let result = await PENCharCreate.step15(actor)
      if (!result) {return}
      await actor.update({'system.create.step': 16,
                          'system.create.complete': true})
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.create.step15'))
    }

  }
  //----------------END OF CHAR CREATION--------------------


  //----------------UNDO STEPS------------------------------
  //Undo Create routine
  static async undoCreate (actor){
    //If not GM then return
    if (!game.user.isGM){return}
    let lastStep = actor.system.create.step - 1
    if(lastStep <1) {
      ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.noUndo'))
    } else {
    let confirmation = await PENUtilities.confirmation(game.i18n.localize("PEN.step." + lastStep) + " " + game.i18n.localize('PEN.undoStep'))
    if (!confirmation){return}

    switch (lastStep) {

      //Reset creation method
      case 1:
        await actor.update({'system.create.random': false,
                            'system.create.step': 1})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step1'))
        break

      //Remove parents and glory award
      case 2:
        await PENCharCreate.undostep2(actor)
        await actor.update({'system.create.step': 2})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step2'))
        break

      //Remove culture and delete the culture name
      case 3:
        await PENCharCreate.undoCulture(actor)
        await actor.update({'system.create.step': 3})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step3'))
        break

      //Reset the stats to 10
      case 4:
        await PENCharCreate.undostep4(actor)
        await actor.update({'system.create.step': 4})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step4'))
        break

      //Remove religion and delete the religion name
      case 5:
        await PENCharCreate.undoReligion(actor)
        await actor.update({'system.create.step': 5})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step5'))
        break

      //Reset the trait scores to 10
      case 6:
        await PENCharCreate.undostep6(actor)
        await actor.update({'system.create.step': 6})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step6'))
        break

      //Remove class
      case 7:
        await PENCharCreate.undoClass(actor)
        await actor.update({'system.create.step': 7})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step7'))
        break

      //Remove culture
      case 8:
        await PENCharCreate.undoHomeland(actor)
        await actor.update({'system.create.step': 8})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step8'))
        break

      //Reset passion scores
      case 9:
        await PENCharCreate.undostep9(actor)
        await actor.update({'system.create.step': 9})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step9'))
        break

      //Reset skill scores
        case 10:
          await PENCharCreate.resetBaseSkillScores(actor)
          await actor.update({'system.create.step': 10})
          ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step10'))
          break

      //Reset family characteristic
      case 11:
        await PENCharCreate.undostep11(actor)
        await actor.update({'system.create.step': 11})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step11'))
        break

      //Reset skill points spent
      case 12:
        await PENCharCreate.undostep12(actor)
        await actor.update({'system.create.step': 12})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step12'))
        break

      //Reset training and development points spent
      case 13:
        await PENCharCreate.undostep13(actor)
        await actor.update({'system.create.step': 13})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step13'))
        break

      //Reset Luck Benefit
      case 14:
        await PENCharCreate.undostep14(actor)
        await actor.update({'system.create.step': 14})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step14'))
        break

      //Reset Knighting
      case 15:
        await PENCharCreate.undostep15(actor)
        await actor.update({'system.create.step': 15,
                            'system.create.complete': false})
        ui.notifications.warn(actor.name + ": " + game.i18n.localize('PEN.undo.step15'))
        break

      }
    }
    return
  }


  //Choose Creation Method - step 1--------------------------------------------
  //
  static async step1(actor) {
    let data = {msg: game.i18n.localize('PEN.rollWrite'),
    title: game.i18n.localize("PEN.creationMethod"),
    button1: {label:game.i18n.localize("PEN.roll"),
              icon: `<i class="fas fa-dice"></i>`},
    button2: {label:game.i18n.localize("PEN.construct"),
              icon: `<i class="fas fa-book-open-cover"></i>`}
    }
    let usage = await PENCharCreate.twoOptions(data)

    //Get age
    let age = Number(await PENCharCreate.inpValue(game.i18n.localize('PEN.ageInput')))
    if(!age){return false}

    if (age<14) {
      ui.notifications.error(game.i18n.localize('PEN.ageMin'))
      return false
    }
    //Calc birth year and create history event
    let birth = game.settings.get("Pendragon","gameYear") - Number(age)
    await PENCharCreate.createHistory (
      actor,
      game.i18n.localize('PEN.born'),
      birth,
      0,
      'born'
    )
    await actor.update({'system.create.random': usage,
                        'system.born' : birth})
    return true
  }


  //Create Parent - step 2------------------------------------------------
  //
  static async step2(actor) {
    let glory = 0
    let heroic = 0
    let result = ""
    let maxGlory = 0
    let maxHeroic = 0
    let options = {
        dialogTemplate : 'systems/Pendragon/templates/dialog/familyInput.html'
    }
    let usage = await PENCharCreate.familyDialog(options)
    if (!usage) {return false}
    let familyName = [usage.get('familyName1'),usage.get('familyName2')]
    let gender = [usage.get('gender1'),usage.get('gender2')]
    let born = [Number(usage.get('born1')), Number(usage.get('born2'))]
    let died = [Number(usage.get('died1')), Number(usage.get('died2'))]
    let knight = [usage.get('knight1'),usage.get('knight2')]
    //Loop through each potential parent
    for ( let pCount=0; pCount<2; pCount++) {
      //If the parent has a name then create the family member
      if (familyName[pCount] !="") {
        //If Knight then make two Glory rolls
        if (knight[pCount] === 'on') {
          result = await PENCharCreate.gloryRoll(familyName[pCount],actor)
          glory = result.glory
          heroic = result.heroic
        }  else {
          glory = 0
          heroic = 0
        }

        const itemData = {
          name: familyName[pCount],
          type: 'family',
          system: {
            relation: "parent",
            gender: gender[pCount],
            born: born[pCount],
            died: died[pCount],
            glory,
            heroic,
          }
        }
        // Finally, create the item and add the PID details.
        let family = await Item.create(itemData, {parent: actor});
        let key = await game.system.api.pid.guessId(family)
        await family.update({'flags.Pendragon.pidFlag.id': key,
                             'flags.Pendragon.pidFlag.lang': game.i18n.lang,
                             'flags.Pendragon.pidFlag.priority': 0})
        if (glory > maxGlory) {
          maxGlory = glory
          maxHeroic = heroic
        }
      }
    }
    //Create History Item for the actor for Inheritance
    maxGlory = Math.min(Math.round(maxGlory/4),4000)

    await PENCharCreate.createHistory (
      actor,
      game.i18n.localize('PEN.squired'),
      actor.system.born+14,
      maxGlory,
      'born'
    )

    //Create the heroic event histories and add the PID details
    for (let cCount=1; cCount <= maxHeroic; cCount++) {
      await PENCharCreate.createHistory (
        actor,
        game.i18n.localize('PEN.heroicEvent'),
        game.settings.get('Pendragon','gameYear'),
        0,
        'inherited'
      )
    }
    return true
  }


  //Select Culture and update stats bonus- step 3 ----------------------------------------------
  static async step3(actor){
    //Open dialog and select the culture
    const itemData = await PENCharCreate.selectItem('culture',false)
    if (!itemData) {
      ui.notifications.error(game.i18n.localize('PEN.noCultures'))
    return false
    }
    let culture = await actor.createEmbeddedDocuments("Item", itemData)
    await PENCharCreate.addCulture(actor,culture[0])
    return true
  }



  //Create Stats - step 4--------------------------------------------------------------
  static async step4(actor) {
    //If not culture then revert progress to previous step
    if(actor.system.cultureID ==="") {
      await actor.update({'system.create.step': 3})
      ui.notifications.error(actor.name + ": " + game.i18n.localize('PEN.noCulture'))
      return false
    }
    let culture = actor.items.get(actor.system.cultureID)
    let stats = []
    //If creation method is random then roll stats
    if (actor.system.create.random) {
      await PENCharCreate.rollStats (actor)


      //If creation method is constructed then choose stats
    } else {
        stats = await StatsSelectDialog.create(culture)
        if (!stats) {return false}
        await actor.update({
          'system.stats.siz.value': Number(stats[0].siz.value),
          'system.stats.dex.value': Number(stats[0].dex.value),
          'system.stats.str.value': Number(stats[0].str.value),
          'system.stats.con.value': Number(stats[0].con.value),
          'system.stats.app.value': Number(stats[0].app.value)
        })
    }
    //Calculate distrinctive features
    let disFeat = "4pos"
    let app = Number(actor.system.stats.app.value)
    if (app <= 5) {disFeat = "deathdoor"}
    else if (app <=7) {disFeat = "3neg"}
    else if (app <=9) {disFeat = "2neg"}
    else if (app <=12) {disFeat = "negpos"}
    else if (app <=15) {disFeat = "2pos"}
    else if (app <=18) {disFeat = "3pos"}

    //Update Stats and features
    await actor.update({'system.features': game.i18n.localize('PEN.app.'+disFeat)})
    return true
  }


  //GET RELIGION - Step 5--------------------------------------------------------
  static async step5(actor) {
    let itemData = ""
    //If creation method is random then roll for religion
    if (actor.system.create.random) {
      let results=[]
      let table= (await game.system.api.pid.fromPIDBest({pid:'rt..religion'}))[0]
      const religResults = await PENUtilities.tableDiceRoll (table)
      const res = religResults.results[0]
      let rUUID=""
      switch (res.type) {
      case CONST.TABLE_RESULT_TYPES.DOCUMENT:
        rUUID = `${res.documentCollection}.${res.documentId}`;
        break
      case CONST.TABLE_RESULT_TYPES.COMPENDIUM:
        rUUID = `Compendium.${res.documentCollection}.Item.${res.documentId}`;
        break
      default:
        ui.notifications.error(actor.name + ": " + game.i18n.localize('PEN.notReligDoc'))
        return false
      }
      const doc = await fromUuidSync(rUUID)
      itemData = await game.system.api.pid.fromPIDBest({pid:doc.flags.Pendragon.pidFlag.id})

      results.push({
        name: doc.name,
        rollVal: religResults.roll.total,
        form: religResults.roll.formula,
        dice: religResults.roll.dice[0].results[0].result
      })
     //Call Chat Card
    const html = await PENCharCreate.charGenRollChatCard (results,game.i18n.localize('PEN.religion'), actor.name)
    let msg = await PENCharCreate.showCharGenRollChat(html,actor)
    } else {
      //The creation method is constructed so pick the religion
      itemData = await PENCharCreate.selectItem('religion',false)
    }
    //In either case if itemData not present then error out
    if (!itemData) {
      ui.notifications.error(game.i18n.localize('PEN.noReligions'))
      return false
    }
    let newItem = await actor.createEmbeddedDocuments("Item", itemData)
    await PENCharCreate.addReligion (actor,newItem[0])
    return true
  }


  //Set trait values -Step 6-----------------------------------------------------------------------------------------
  static async step6(actor){
    let title = game.i18n.localize('PEN.selectTrait')
    let changes = []
    //If creation method is random
    if (actor.system.create.random) {
      await PENCharCreate.rollTraits(actor)
    } else {
      //If creation method is constructed
      let traits = actor.items.filter(item => item.type === 'trait')
        .sort((a, b) => a.name.localeCompare(b.name));

      //Set trait scores to 15 for Valorous
      let valor = traits.find(uTrait => uTrait.flags.Pendragon.pidFlag.id === 'i.trait.valorous');
      await valor.update({'system.value': 15})

      let [sTrait, opposed] = await PENCharCreate.selectActorTrait(actor, title)
      // if no trait selected, error out
      if(!sTrait) {return false;}

      const option = opposed ? 4 : 16;
      // subtract the religious bonus so base value+religious = selected option
      await sTrait.update({'system.value': Number(option) - sTrait.system.religious})

      let optTraits = traits.map(uTrait => {
        return { 
          id: uTrait.id,
          name: uTrait.name,
          value: uTrait.system.total,
          origVal:uTrait.system.total,
          base: uTrait.system.value,
          minVal:5,
          maxVal:15,
          religious: uTrait.system.religious,
          oppName: uTrait.system.oppName,
          oppValue: uTrait.system.oppvalue,
          disabled: uTrait.id === sTrait.id
        }
      });
      //Get the points spend
      let traitVal = await TraitsSelectDialog.create(optTraits,6,false,game.i18n.localize('PEN.Entities.Trait'));
      if (!traitVal) {return false;}

      for (let uTrait of traitVal) {
        let delta = Number(uTrait.value) - Number(uTrait.origVal)
        changes.push({
          _id: uTrait.id,
          'system.value': Number(uTrait.base) + delta
        })
      }
      await Item.updateDocuments(changes, {parent: actor})
    }

    return true
  }


  //Get character class - step7-------------------------------------------------------------------------------------------
  static async step7(actor){
    //Open dialog and select the class  (not optional)
    let itemData = await PENCharCreate.selectItem('class',false)
    if (!itemData) {
      ui.notifications.error(game.i18n.localize('PEN.noClasses'));
      return false;
    }
    await PENCharCreate. addClass (actor, itemData[0],false)
    return true
  }


  //Get Homeland - step8-----------------------------------------------------------------------------------------------
  static async step8(actor) {
    //Open dialog and select the class (not optional)
    const itemData = await PENCharCreate.selectItem('homeland',false)
    if (!itemData) {
      ui.notifications.error(game.i18n.localize('PEN.noHomelands'))
      return false
    }
    await PENCharCreate.addHomeland(actor,itemData[0])
    let newItem = await actor.createEmbeddedDocuments("Item", itemData)
    return true
  }


  //Set Parent Passion - step9------------------------------------------------------------------------------------------------
  static async step9(actor){
    const parentPass = await PENCharCreate.selectItem('passion',true,"",game.i18n.localize('PEN.parentPass'))

    let passionPID = ""
    let bonus = 0
    if (parentPass != false) {
      bonus = Number(await PENCharCreate.inpValue(game.i18n.localize('PEN.parentPassion')))
      if (bonus > 15) {
        passionPID = parentPass[0].flags.Pendragon.pidFlag.id
        bonus=Math.min(bonus-15,5)
        //Update the passion values
        let pPas = actor.items.filter(itm=>itm.flags.Pendragon.pidFlag.id === passionPID)[0]
        await pPas.update ({'system.inherit': bonus})
      }
    }
    return true
  }

  //Update skills - step 10--------------------------------------------------------------------------
  static async baseSkillScore(actor){
    //Go through actors skills and calculate the base score
    let changes=[]
    for (let item of actor.items) {
      if (item.type === 'skill') {
        let score = item.system.base.mod
        if (item.system.base.stat != 'none') {
          score = Number(score) + Number(Math.round((actor.system[item.system.base.stat].value + actor.system[item.system.base.stat].culture)  * item.system.base.multi))
        }
        score = Math.max(score,0)
        const change = {
          _id: item.id,
          'system.value':score,
        }
        changes.push(change)
      }
    }
    await Item.updateDocuments(changes, {parent: actor})
    return true
  }


  //Get Family Characteristic - step 11-------------------------------------------------------------
  static async step11(actor) {
    let results=[]
    let table= (await game.system.api.pid.fromPIDBest({pid:'rt..family-characteristic'}))[0]
    let selected = ""
    let fUUID= []
    let beauty = 0
    //If random rolls
    if (actor.system.create.random) {
      //Make first roll
      let tableOut = await PENCharCreate.makeTableRoll(table)
      let fRoll = tableOut.res
      let dRoll = tableOut.tableResults
      results.push({
        name: game.i18n.localize('PEN.roll'),
        rollVal: dRoll.roll.total,
        form: dRoll.roll.formula,
        dice: dRoll.roll.dice[0].results[0].result
      })

      if (fRoll.toLowerCase() === 'gifted') {
        //If roll is gifted make two more rolls
        for (let rCount = 1; rCount<3; rCount++) {
          let stableOut = await PENCharCreate.makeTableRoll(table)
          let sRoll = stableOut.res
          let d2Roll = stableOut.tableResults
          results.push({
            name: game.i18n.localize('PEN.roll'),
            rollVal: d2Roll.roll.total,
            form: d2Roll.roll.formula,
            dice: d2Roll.roll.dice[0].results[0].result
          })
          if (sRoll.toLowerCase() != 'gifted') {
            fUUID.push(sRoll)
          } else {
            //If second or third rolls are gifted then become Transcendent Beauty
            beauty = beauty + 5
          }
        }
      } else {
        fUUID.push(fRoll)
      }
    //Else if constructed

     //Call Chat Card
     const html = await PENCharCreate.charGenRollChatCard (results,game.i18n.localize('PEN.familyChar'), actor.name)
     let msg = await PENCharCreate.showCharGenRollChat(html,actor)


    } else {
      let results =  await Promise.all(table.results.toObject(false).filter (itm=>(itm.type != 'text')).map(async itm=> {
        const doclookup = await PENCharCreate.documentFromResult(itm);
        const itemlookup = await actor.items.find(itm2 => (itm2.flags.Pendragon.pidFlag.id === doclookup.flags.Pendragon.pidFlag.id));
        return { name: `${itemlookup.system.familyChar} (${itm.text})`, pid: itm._id}
      }));
      console.log(results);
      selected = await PENCharCreate.selectFromRadio ('list',false,results)
      let res = table.results.toObject(false).filter (itm=>(itm._id === selected))[0]
      switch (res.type) {
        case CONST.TABLE_RESULT_TYPES.DOCUMENT:
          fUUID.push(`${res.documentCollection}.${res.documentId}`)
          break
        case CONST.TABLE_RESULT_TYPES.COMPENDIUM:
          fUUID.push(`Compendium.${res.documentCollection}.Item.${res.documentId}`)
          break
        default:
          ui.notifications.error(game.i18n.localize('PEN.religDocGone'))
          return false
      }
    }
    for (let fRes of fUUID) {
      const doc = await fromUuidSync(fRes)
      if (!doc) {
        ui.notifications.error(game.i18n.localize('PEN.religDocGone'))
        return false
      }
      let item = await actor.items.find(itm => (itm.flags.Pendragon.pidFlag.id === doc.flags.Pendragon.pidFlag.id));
      await item.update({'system.family': Number(item.system.family) + 3})
      if (actor.system.family === "") {
        await actor.update({'system.family': item.system.familyChar})
      } else {
        await actor.update({'system.family': actor.system.family + ", " + item.system.familyChar})
      }
    }
    if (beauty > 0) {
      if (actor.system.family === "") {
        await actor.update({'system.family': game.i18n.localize('PEN.transcendent') +" (+"+beauty+")"})
      } else {
        await actor.update({'system.family': game.i18n.localize('PEN.transcendent') +" (+"+beauty+"), "+ actor.system.family})
      }
    }
    await actor.update({'system.beauty': beauty})
    return true
  }


  //Spend Skill Points - step 12-------------------------------------------------------------
  static async step12(actor,points) {
    let skills = await (actor.items.filter(itm =>itm.type==='skill')).filter(itm => itm.system.total>0 && itm.system.total<15).map(itm=>{return {
      id: itm.id, name: itm.name, value: itm.system.total, origVal:itm.system.total, minVal:0, maxVal:15, stat:itm.system.base.stat, bonus:Number(itm.system.family) + Number(itm.system.culture)
    }})

    skills.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });

    //Adjust min score for APP skills
    for (let sItm of skills) {
      if (sItm.stat === 'app'){
        sItm.maxVal = actor.system.stats.app.total+ sItm.bonus
      }
    }
    let skillVal = await ItemsSelectDialog.create(skills,points,true,game.i18n.localize('PEN.Entities.Skill'))
    if (!skillVal) {return false}
    let changes=[]
    for (let uSkill of skillVal) {
      changes.push({
        _id: uSkill.id,
        'system.create': Number(uSkill.value) - Number(uSkill.origVal)
      })
    }
    await Item.updateDocuments(changes, {parent: actor})
    return true
  }



  //Spend Development Points - step 13-------------------------------------------------------------
  static async step13(actor) {
    let expYears = Math.min(7,game.settings.get('Pendragon' , 'gameYear') - actor.system.born -14)
    let changes=[]
    //Reset any winter training (for partially failed Step 13)
    await PENCharCreate.undostep13(actor)

    if (expYears>0) {
      for (let ageCount = 1; ageCount<=expYears; ageCount++){
        let title = game.i18n.format("PEN.trainPrac",{curr: ageCount, max: expYears });
        let trainOpt =[
          {name: game.i18n.localize('PEN.skills'), pid: "1"},
          {name: game.i18n.localize('PEN.traits'), pid: "2"},
          {name: game.i18n.localize('PEN.passions'), pid: "3"},
          {name: game.i18n.localize('PEN.characteristic'), pid: "4"}
        ]
        let option = await PENCharCreate.selectItem("list",false,trainOpt,title)
        changes=[]
        switch (option) {
          //Option 1: Improve skills by 5 points
          case "1":
            let skills = await (actor.items.filter(itm =>itm.type==='skill')).filter(itm => itm.system.total>0 && itm.system.total<15).map(itm=>{return {
              id: itm.id, name: itm.name, value: itm.system.total, origVal:itm.system.total, minVal:itm.system.total, maxVal:15, winter: itm.system.winter, stat:itm.system.base.stat, bonus:Number(itm.system.family) + Number(itm.system.culture)
            }})
            skills.sort(function(a, b){
              let x = a.name;
              let y = b.name;
              if (x < y) {return -1};
              if (x > y) {return 1};
            return 0;
            });
            //Adjust min score for APP skills
            for (let sItm of skills) {
              if (sItm.stat === 'app'){
                sItm.maxVal = Math.max(Number(actor.system.stats.app.total)+ Number(sItm.bonus),15)
              }
            }
            let skillVal = await ItemsSelectDialog.create(skills,5,true,game.i18n.localize('PEN.Entities.Skill'))
            if (!skillVal) {return false}

            changes = await skillVal.filter(itm=>itm.value > itm.origVal).map(itm=>{return{_id: itm.id, 'system.winter': Number(itm.winter) + Number(itm.value)-Number(itm.origVal)}})
            await Item.updateDocuments(changes, {parent: actor})
            break

          //Option 2: Improve Traits
          case "2":
            let traits = await (actor.items.filter(itm =>itm.type==='trait')).map(itm=>{return {
              id: itm.id, name: itm.name, value: itm.system.total, origVal:itm.system.total,
              religious: itm.system.religious,
              oppName: itm.system.oppName,
              oppValue: itm.system.oppvalue,
              minVal:1, maxVal:19, winter:itm.system.winter
            }})
            traits.sort(function(a, b){
              let x = a.name;
              let y = b.name;
              if (x < y) {return -1};
              if (x > y) {return 1};
            return 0;
            });
            let traitVal = await TraitsSelectDialog.create(traits,1,false,game.i18n.localize('PEN.Entities.Trait'))
            if (!traitVal) {return false}
            changes = await traitVal.filter(itm=>itm.value != itm.origVal).map(itm=>{return{_id: itm.id, 'system.winter': Number(itm.winter) + Number(itm.value)-Number(itm.origVal)}})
            await Item.updateDocuments(changes, {parent: actor})
            break


          //Option 3: Improve Passions
          case "3":
            let passions = await (actor.items.filter(itm =>itm.type==='passion')).filter(itm => itm.system.total>0 && itm.system.total<20).map(itm=>{return {
              'type': itm.type,
              'label': game.i18n.localize("PEN."+itm.type),
              'itemID': itm._id,
              'name' : itm.name,
              'value': itm.system.total,
              'origValue': itm.system.total,
              'court': itm.system.court,
              'level': itm.system.level,
              'choice': "",
              'max': 20,
              'min': itm.system.total,
              winter:itm.system.winter
            }})
            // Sort Options
            passions.sort(function(a, b){
              return a.court.localeCompare(b.court) || a.label.localeCompare(b.label) || a.name.localeCompare(b.name);
            });
            const passVal = await PassionsSelectDialog.create (title, passions, 1, 1);
            if (!passVal || passVal.length <1) {
              return false;
            }
            changes = await passVal.filter(itm=>itm.value != itm.origValue).map(itm=>{return{_id: itm.itemID, 'system.winter': Number(itm.winter) + Number(itm.value)-Number(itm.origValue)}})
            await Item.updateDocuments(changes, {parent: actor})
            break

          //Option 3: Improve a stat
          case "4":
            let stats=[]
            for (let [key, stat] of Object.entries(actor.system.stats)) {
              if(stat.value < stat.max) {
                stats.push( {
                  id: key,
                  name: stat.label,
                  value: stat.total,
                  origVal: stat.total,
                  minVal: stat.total,
                  maxVal: stat.max,
                })
              }
            }
            const chosen = await  ItemsSelectDialog.create (stats, 1, true,game.i18n.localize('PEN.characteristic'));
            if (!chosen) {
              await PENCharCreate.undostep13(actor)
              return false}
            for (let selected of chosen){
              if (selected.value > selected.origVal) {
                let target = 'system.stats.' + selected.id + '.winter';
                await actor.update({[target] : actor.system.stats[selected.id].winter + 1});
              }
            }
            break
        }
      }
    }
    return true
  }


  //Luck Benefit - step 14-------------------------------------------------------------
  static async step14(actor) {
    let data = {msg: game.i18n.localize('PEN.luckBenItem'),
                title: game.i18n.localize("PEN.luckBen"),
                button1: {label:game.i18n.localize("PEN.yes"),
                          icon: `<i class="fas fa-swords"></i>`},
                button2: {label:game.i18n.localize("PEN.no"),
                          icon: `<i class="fas fa-shield"></i>`}
                }
    let usage = await PENCharCreate.twoOptions(data)
    if (!usage) {return true}

    let results=[]
    let table= (await game.system.api.pid.fromPIDBest({pid:'rt..luck-benefits'}))[0]
    const luckResults = await PENUtilities.tableDiceRoll (table)
    const res = luckResults.results[0]
    let rUUID=""
    switch (res.type) {
    case CONST.TABLE_RESULT_TYPES.DOCUMENT:
      rUUID = `${res.documentCollection}.${res.documentId}`;
      break
    case CONST.TABLE_RESULT_TYPES.COMPENDIUM:
      rUUID = `Compendium.${res.documentCollection}.Item.${res.documentId}`;
      break
    default:
      ui.notifications.error(actor.name + ": " + game.i18n.format('PEN.notTableDoc',{name: game.i18n.localize('PEN.luckBen')}))
      return false
    }
    const doc = await fromUuidSync(rUUID)
    let itemData = await game.system.api.pid.fromPIDBest({pid:doc.flags.Pendragon.pidFlag.id})

    results.push({
      name: doc.name,
      rollVal: luckResults.roll.total,
      form: luckResults.roll.formula,
      dice: luckResults.roll.dice[0].results[0].result
    })
    //Call Chat Card
    const html = await PENCharCreate.charGenRollChatCard (results,game.i18n.localize('PEN.luckBen'), actor.name)
    let msg = await PENCharCreate.showCharGenRollChat(html,actor)
    let luck = await actor.createEmbeddedDocuments("Item", itemData)
    await luck[0].update({'system.source': 'luck'})
    return true
  }


  //Knighted - step 15-----------------------------------------------------------------
  static async step15(actor) {
    let data = {msg: game.i18n.localize('PEN.beKnighted'),
                title: game.i18n.localize("PEN.knighted"),
                button1: {label:game.i18n.localize("PEN.yes"),
                          icon: `<i class="fas fa-swords"></i>`},
                button2: {label:game.i18n.localize("PEN.no"),
                          icon: `<i class="fas fa-shield"></i>`}
                }
    let usage = await PENCharCreate.twoOptions(data)
    if (!usage) {return true}
    let lord = Number(await PENCharCreate.inpValue(game.i18n.localize('PEN.lordsGlory')))
    let glory = 1000 + Math.min(Math.round(lord/100),1000)

    //Make the Leap
    let msgID = await PENCheck._trigger({
      rollType: 'CH',
      cardType: "NO",
      characteristic: "dex",
      shiftKey: true,
      actor: actor,
      token: ""
    })

    //Make the leap
    let level = await game.messages.get(msgID).flags.Pendragon.chatCard[0].resultLevel
    if (level === 3) {
      glory = glory + 50
    } else if (level ===2) {
      glory = glory + 25}
    let msg = game.i18n.localize("PEN.leap."+level)


    await PENCharCreate.createHistory (
      actor,
      game.i18n.localize('PEN.knighted') + " (" + msg + ")",
      game.settings.get('Pendragon','gameYear'),
      glory,
      'knighted'
    )
    return true
  }



  //Choose Item Dialog
  //source = item type or "list"
  //optional - if true add a "none" option
  //list - prepopulated list (name,pid) only used where source = "list"
  //winTitle - title of the selection box
  static async selectItem(source,optional,list,winTitle){
  //Get list of items
  let newList = []
  if (source === 'list') {
    newList = list
  }  else {
    let mainList = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: new RegExp('^i.' + PENUtilities.quoteRegExp(source) + '.+$'), type: 'i' })
    newList = mainList.map(itm=>{return{name:itm.name, pid: itm.flags.Pendragon.pidFlag.id}})
    if (!winTitle) {
      winTitle = game.i18n.format("PEN.selectItem",{type:  game.i18n.localize("PEN.Entities." + `${source.capitalize()}`)});
    }
  }
  if (optional) {
    newList.push ( {
      name : game.i18n.localize('PEN.none'),
      pid:"none"
    })
  }
  let itemPID = ""
  if (newList.length <1) {return false}
  if (newList.length === 1) {
    itemPID = newList[0].pid
  } else {
    let destination = 'systems/Pendragon/templates/dialog/selectItem.html';
    let data = {
      newList,
    }
    const html = await renderTemplate(destination,data);
    let usage = await new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: winTitle,
        content: html,
        buttons: {
          roll: {
            label: game.i18n.localize("PEN.confirm"),
            callback: html => {
            formData = new FormData(html[0].querySelector('#selectItem'))
            return resolve(formData)
            }
          }
        },
        default: 'roll',
        close: () => {}
        },{classes: ["Pendragon", "sheet"],width:500})
        dlg.render(true);
      })

      //Get the PID from the form
      if (usage) {
        itemPID = usage.get('selectItem');
      }
    }
    if (itemPID === "" || itemPID === 'none') {return false}
    if (["1","2","3","4","16"].includes(itemPID)) {return itemPID}
    //Get the item details and return them

    const itemData = await game.system.api.pid.fromPIDBest({pid:itemPID})
    return itemData
  }

  //Choose Item Dialog
  static async selectActorItem(actor,type,title){
    //Get list of items
    let newList = await actor.items.filter(itm => itm.type === type).map(itm=> {return {name:itm.name, pid:itm.flags.Pendragon.pidFlag.id,system:{value: itm.system.total}}})

    //If traits then set all to 10
    if(type === 'trait') {
      for (let itm of newList) {
        itm.system.value = itm.system.value + 10
      }
    }

    let destination = 'systems/Pendragon/templates/dialog/selectItem.html';
    let winTitle = title;
    let data = {
      newList,
    }
    const html = await renderTemplate(destination,data);
    let usage = await new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: winTitle,
        content: html,
        buttons: {
          roll: {
            label: game.i18n.localize("PEN.confirm"),
            callback: html => {
            formData = new FormData(html[0].querySelector('#selectItem'))
            return resolve(formData)
            }
          }
        },
        default: 'roll',
        close: () => {}
        },{classes: ["Pendragon", "sheet"]})
        dlg.render(true);
      })

      //Get the UUID from the form
      let itemPID = ""
      if (usage) {
        itemPID = usage.get('selectItem');
      }
      if (itemPID === "") {return false}
      //Get the item details and return them
      const item = await actor.items.filter(itm => itm.flags.Pendragon.pidFlag.id === itemPID);
      return item[0]
    }

  static async selectActorTrait(actor, title){
    //Get list of items
    let newList = await actor.items
      .filter(itm => itm.type === 'trait')
      .sort((a, b) => a.name.localeCompare(b.name));

    let destination = 'systems/Pendragon/templates/dialog/selectTrait.html';
    let winTitle = title;
    let data = {
      newList,
    }
    const html = await renderTemplate(destination,data);
    let usage = await new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: winTitle,
        content: html,
        buttons: {
          roll: {
            label: game.i18n.localize("PEN.confirm"),
            callback: html => {
            formData = new FormData(html[0].querySelector('#selectItem'))
            return resolve(formData)
            }
          }
        },
        default: 'roll',
        close: () => {}
        },{classes: ["Pendragon", "sheet"]})
        dlg.render(true);
      })

      //Get the UUID from the form
      let itemPID = ""
      let opposed = false;
      if (usage) {
        itemPID = usage.get('selectItem');
      }
      if (itemPID === "") {return [false, false]}
      if (itemPID.startsWith('OPPOSED')) {
        itemPID = itemPID.substring(7);
        opposed = true;
      }
      //Get the item details and return them
      const item = await actor.items.filter(itm => itm.flags.Pendragon.pidFlag.id === itemPID);
      return [item[0], opposed];
    }







  //VALIDATE THAT ALL THE COMPONENTS FOR CHARACTER CREATION ARE IN PLACE
  static async validate(){
    //Check that Cultures Exist
    let list = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: new RegExp('^i.' + PENUtilities.quoteRegExp('culture') + '.+$'), type: 'i' })
    if (list.length < 1) {
      ui.notifications.error(game.i18n.localize('PEN.noCultures'))
      return false
    }
    //Check that Classes Exist
    list = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: new RegExp('^i.' + PENUtilities.quoteRegExp('class') + '.+$'), type: 'i' })
    if (list.length < 1) {
      ui.notifications.error(game.i18n.localize('PEN.noClasses'))
      return false
    }
    //Check that Homelands Exist
    list = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: new RegExp('^i.' + PENUtilities.quoteRegExp('homeland') + '.+$'), type: 'i' })
    if (list.length < 1) {
      ui.notifications.error(game.i18n.localize('PEN.noHomelands'))
      return false
    }
    //Check that Religions Exist
    list = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: new RegExp('^i.' + PENUtilities.quoteRegExp('religion') + '.+$'), type: 'i' })
    if (list.length < 1) {
      ui.notifications.error(game.i18n.localize('PEN.noReligions'))
      return false
    }

    //Check that the religion table exists
    for (let tableCheck = 1; tableCheck<=2; tableCheck++) {
      let tablePID = 'rt..religion'
      let name = game.i18n.localize('PEN.religion')
      if (tableCheck === 2) {
        tablePID = 'rt..family-characteristic'
        name = game.i18n.localize('PEN.familyChar')
      }
      let table= (await game.system.api.pid.fromPIDBest({pid:tablePID}))
      if (table.length < 1) {
        ui.notifications.error(game.i18n.format('PEN.noNamedTable',{name: name}))
        return false
      }
      //Check that the table only has Item/Compendia results and that the documents exist - exception for family table
      let results = table[0].results
      if (results.contents.length<1) {
        ui.notifications.error(game.i18n.format('PEN.noTableDocs',{name: name}))
        return false
      }
      if (results.filter(itm => (itm.type === 0)).length >0 && tableCheck!=2) {
        ui.notifications.error(game.i18n.format('PEN.notTableDoc',{name: name}))
        return false
      }
      if(!PENCharCreate.documentReferencesExist(name, results)) return false;
    }
    return true
  }

  static async documentReferencesExist(name, results) {
    const V13 = game.release.generation >= 13;
    for (const res of results) {
      let rUUID="";
      switch (res.type) {
      case CONST.TABLE_RESULT_TYPES.DOCUMENT:
        rUUID = V13 ? res.documentUuid : `${res.documentCollection}.${res.documentId}`;
        break;
      case CONST.TABLE_RESULT_TYPES.COMPENDIUM:
        rUUID = V13 ? res.documentUuid : `Compendium.${res.documentCollection}.Item.${res.documentId}`;
        break;
      case CONST.TABLE_RESULT_TYPES.TEXT:
        rUUID = "bypass"
      break;
      default:
        ui.notifications.error(actor.name + ": " + game.i18n.localize('PEN.notReligDoc'))
        return false;
      }
      if (rUUID !="bypass") {
        const doc = await fromUuidSync(rUUID);
        if (!doc) {
          ui.notifications.error(game.i18n.format('PEN.religDocGone',{doc:rUUID, table:name}))
        return false;
        }
      }
    }
    return true;
  }


  //Choose Item Dialog
  static async selectFromRadio(source,optional,list,title){
    //Get list of items
    let newList = [];
    if (source != 'list'){
      newList = await game.system.api.pid.fromPIDRegexBest({ pidRegExp: new RegExp('^i.' + PENUtilities.quoteRegExp(source) + '.+$'), type: 'i' })
    } else {
      newList = list
    }

    //If optional = true add "none" as an option
    if (optional) {
        newList.unshift ( {
          name : game.i18n.localize('PEN.none'),
          pid:"none"
        })
      }

    //If there's only one item on the list then return it
    let itemPID = ""
    if (newList.length <1) {return false}
    if (newList.length === 1) {
      itemPID = newList[0].flags.Pendragon.pidFlag.id

    //Otherwise call the dialog selection
    } else {
      let destination = 'systems/Pendragon/templates/dialog/selectItem.html';
      let winTitle = game.i18n.format("PEN.selectItem",{type:  game.i18n.localize("PEN.Entities." + `${source.capitalize()}`)});
      let data = {
        headTitle: title,
        newList,
      }
      const html = await renderTemplate(destination,data);
      let usage = await new Promise(resolve => {
        let formData = null
        const dlg = new Dialog({
          title: winTitle,
          content: html,
          buttons: {
            roll: {
              label: game.i18n.localize("PEN.confirm"),
              callback: html => {
              formData = new FormData(html[0].querySelector('#selectItem'))
              return resolve(formData)
              }
            }
          },
          default: 'roll',
          close: () => {}
          },{classes: ["Pendragon", "sheet"]})
          dlg.render(true);
        })

        //Get the PID from the form
        if (usage) {
          itemPID = usage.get('selectItem');
        }
      }
      if (itemPID === "") {return false}
      return itemPID
    }


 //Function to call the Family Create Dialog box
  //
  static async familyDialog (options) {
    const data = {}
    const html = await renderTemplate(options.dialogTemplate,data);
    return new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: game.i18n.localize("PEN.parents"),
        content: html,
        buttons: {
          roll: {
            label: game.i18n.localize("PEN.addParents"),
            callback: html => {
            formData = new FormData(html[0].querySelector('#family-input-form'))
            return resolve(formData)
            }
          }
        },
      default: 'roll',
      close: () => {}
      },{classes: ["Pendragon", "sheet"]})
      dlg.render(true);
    })
  }

  //Glory Roll
  static async gloryRoll (parentName,actor) {
    let results = []
    let roll1 = await PENUtilities.complexDiceRoll('2D6')
    let roll2 = await PENUtilities.complexDiceRoll('2D6')
    let glory = (Number(roll1.total)*100)+2000 + (Number(roll2.total)*100)+500
    let heroic = Math.floor(((Number(roll2.total)*100)+500)/500)
    let result = ({glory,heroic})

    let rollStr=""
    for (let dCount=0; dCount<roll1.dice[0].results.length; dCount++)
      if (dCount === 0){
        rollStr = roll1.dice[0].results[dCount].result
      } else {
        rollStr = rollStr + "+" + roll1.dice[0].results[dCount].result
      }
    for (let dCount=0; dCount<roll2.dice[0].results.length; dCount ++) {
      rollStr = rollStr + "+" + roll2.dice[0].results[dCount].result
    }

    results.push({
      name: parentName,
      rollVal: Number(roll1.total) + Number(roll2.total),
      form: "2d6 + 3d6",
      dice: rollStr
    })

  //Call Chat Card
  const html = await PENCharCreate.charGenRollChatCard (results,game.i18n.localize('PEN.gloryRoll'), parentName)
  let msg = await PENCharCreate.showCharGenRollChat(html,actor)



    return result
  }


  //Family table roll
  static async makeTableRoll(table) {
    const tableResults = await PENUtilities.tableDiceRoll(table)
    //const tableResults = await table.roll()
    //if (game.modules.get('dice-so-nice')?.active) {
    //  game.dice3d.showForRoll(tableResults.roll)
    //}
    const res = tableResults.results[0]
  switch (res.type) {
    case CONST.TABLE_RESULT_TYPES.DOCUMENT:
      return ({res:`${res.documentCollection}.${res.documentId}`, tableResults: tableResults}) ;
    case CONST.TABLE_RESULT_TYPES.COMPENDIUM:
      return ({res:`Compendium.${res.documentCollection}.Item.${res.documentId}`, tableResults: tableResults})
    default:
      return ({res: res.text, tableResults: tableResults})
    }
  }


  //Undo parent creation step 2
  static async undostep2(actor) {
    let parents = await (actor.items.filter(itm =>itm.type==='family')).filter(itm =>itm.system.relation==='parent').map(itm => {return (itm.id)})
    let history = await (actor.items.filter(itm =>itm.type==='history')).filter(itm =>['inherited','born',"squired"].includes(itm.system.source)).map(itm => {return (itm.id)})
    await Item.deleteDocuments(parents, {parent: actor});
    await Item.deleteDocuments(history, {parent: actor});
    return
  }



  //Add a culture
  static async addCulture (actor,culture) {
    let cPIDs = (culture.system.skills).filter(itm => itm).map(itm => {return (itm.pid)})
    let changes=[]
    for (let item of actor.items) {
      if (item.type === 'skill') {
        //Add 3 for any cultural skills
        if (cPIDs.includes(item.flags.Pendragon.pidFlag.id)) {
          const change = {
            _id: item.id,
            'system.culture': 3,
          }
          changes.push(change)
        }
      }
      await Item.updateDocuments(changes, {parent: actor})
      await actor.update({'system.stats.siz.culture': Number(culture.system.stats.siz.bonus),
                          'system.stats.dex.culture': Number(culture.system.stats.dex.bonus),
                          'system.stats.str.culture': Number(culture.system.stats.str.bonus),
                          'system.stats.con.culture': Number(culture.system.stats.con.bonus),
                          'system.stats.app.culture': Number(culture.system.stats.app.bonus)
      })
  }
  return
  }

  //Undo culture creation step 3
  static async undoCulture(actor){
    let cultures = actor.items.filter(itm =>itm.type==='culture').map(itm => {return (itm.id)})
    await Item.deleteDocuments(cultures, {parent: actor});
    await actor.update({'system.stats.siz.culture': 0,
                        'system.stats.dex.culture': 0,
                        'system.stats.str.culture': 0,
                        'system.stats.con.culture': 0,
                        'system.stats.app.culture': 0})
    let skills = actor.items.filter(itm =>itm.type==='skill').map(itm => {return { _id: itm.id, 'system.culture': 0}})
    await Item.updateDocuments(skills, {parent: actor})
    return
  }

  //undo setting characteristics step 4
  static async undostep4(actor) {
    await actor.update({
      'system.stats.siz.value': 10,
      'system.stats.dex.value': 10,
      'system.stats.str.value': 10,
      'system.stats.con.value': 10,
      'system.stats.app.value': 10,
      'system.features': ""})
    return
  }


  //Add a religion
  static async addReligion (actor,religion) {
    //Set trait religious modifier to +3/-3
    let theseTraits = []
    let adj = 3
    for (let tCount =0; tCount<2; tCount++) {
      if (tCount === 0) {
        theseTraits = religion.system.positive
      } else {
        theseTraits = religion.system.negative
        adj = -3
      }
      let list = []
      for (let thisTrait of theseTraits) {list.push(thisTrait.pid)}
        let traits = (actor.items).filter(itm => itm.type === 'trait');
        let changes = traits.filter(rTrait=> list.includes(rTrait.flags.Pendragon.pidFlag.id)).map(rTrait => {return { _id: rTrait.id, 'system.religious': adj}})
        await Item.updateDocuments(changes, {parent: actor})
      }
    return
  }

  //Undo religion creation step 5
  static async undoReligion (actor) {
    let religions = actor.items.filter(itm =>itm.type==='religion').map(itm => {return (itm.id)})
    await Item.deleteDocuments(religions, {parent: actor});
    let traits = actor.items.filter(itm => itm.type==='trait').map(itm => {return { _id: itm.id, 'system.religious': 0}})
    await Item.updateDocuments(traits, {parent: actor})
    return
  }


  //Undo trait value setting - step 6
  static async undostep6(actor){
    let traits = actor.items.filter(itm => itm.type==='trait').map(itm => {return { _id: itm.id, 'system.value': 10}})
    await Item.updateDocuments(traits, {parent: actor})
    return
  }


  //Add a class
  static async addClass (actor, actClass,ask) {
    let newItems = []
    //Add Class Item to newItems array
    newItems.push(actClass)
    //Add Class Gear to newItems array
    for (let newItm of actClass.system.gear) {
      let nItm = await game.system.api.pid.fromPIDBest({pid:newItm.pid})
      if (nItm.length > 0) {
        newItems.push(nItm[0])
      }
    }

    //If ask = true then ask if Roll/Choose and update the actor
    if (ask) {
      let data = {msg: game.i18n.localize('PEN.rollWrite'),
      title: game.i18n.localize("PEN.creationMethod"),
      button1: {label:game.i18n.localize("PEN.roll"),
                icon: `<i class="fas fa-dice"></i>`},
      button2: {label:game.i18n.localize("PEN.construct"),
                icon: `<i class="fas fa-book-open-cover"></i>`}
      }
      let usage = await PENCharCreate.twoOptions(data)
      await actor.update({'system.create.random': usage})
    }

    //Get points available to spend on passions
    let available = 15
    let rollStr=""
    let results =[]
    //If creation method is random roll for available points
    if (actor.system.create.random) {
      let roll = await PENUtilities.complexDiceRoll ('4D6+1')
      //let roll = await new Roll("4D6+1").evaluate({ async: true})
      //if (game.modules.get('dice-so-nice')?.active) {
      //  game.dice3d.showForRoll(roll)
      //}
      available = roll.total
      for (let dCount=0; dCount<roll.dice[0].results.length; dCount++)
      if (dCount === 0){
        rollStr = roll.dice[0].results[dCount].result
      } else {
        rollStr = rollStr + "+" + roll.dice[0].results[dCount].result
      }
      results.push({
        name: game.i18n.localize("PEN.devPoints"),
        rollVal: roll.total,
        form: roll.formula,
        dice: rollStr
      })
    }

    //Get the list of passions off the actor
    let optPassions = await actor.items.filter(itm => itm.type === 'passion').map (itm => {
      return { id: itm.id, name: itm.name, value: itm.system.total, origVal:itm.system.total, pid: itm.flags.Pendragon.pidFlag.id, homeland: itm.system.homeland, source:"", minVal:itm.system.total, maxVal:15 }
    })

    //Loop through the new Class passions & update source from optPassions
    let pPIDs = await actClass.system.passions.map(itm=> {return(itm.pid)})
      for (let optPassion of optPassions) {
      if((pPIDs).includes(optPassion.pid)){
        optPassion.source = actClass.system.passions.filter(itm=>itm.pid === optPassion.pid)[0].subType
      }
    }

    //For each passion
    for (let aPass of optPassions) {
      if (actor.system.create.random) {
        //If random creation then roll the dice based on the class modifier (primary, secondary or tertiary) or homeland
        if (aPass.source != "") {
          //Set the dice if source is populated
          let formula = "1D6+2"
          if (aPass.source === 'primary') {formula="2D6+8"}
          else if (aPass.source === 'secondary') {formula="2D6+3"}
          //Roll and display dice
          let roll = await PENUtilities.complexDiceRoll (formula)
          //let roll = await new Roll(formula).evaluate({ async: true})
          //if (game.modules.get('dice-so-nice')?.active) {
          //  game.dice3d.showForRoll(roll)
          //}
          aPass.value = Number(roll.total)
          aPass.origVal = Number(roll.total)
          aPass.minVal = Number(roll.total)

          for (let dCount=0; dCount<roll.dice[0].results.length; dCount++)
            if (dCount === 0){
              rollStr = roll.dice[0].results[dCount].result
            } else {
              rollStr = rollStr + "+" + roll.dice[0].results[dCount].result
            }
          results.push({
            name: aPass.name,
            rollVal: roll.total,
            form: roll.formula,
            dice: rollStr
          })
        }

      } else {
        //If constructed method then set the values using the class/homeland modifiers
        if (aPass.source != "") {
          let val = 5
          if (aPass.source === 'primary') {val=15}
          else if (aPass.source === 'secondary') {val=10}
          aPass.value = val
          aPass.origVal = val
          aPass.minVal = val
        }
      }
    }
    if (results.length > 0) {
      //Call Chat Card
      const html = await PENCharCreate.charGenRollChatCard (results,game.i18n.localize('PEN.passions'), actor.name)
      let msg = await PENCharCreate.showCharGenRollChat(html,actor)
    }

    //Pass the data to trait select
    let passionVal = await ItemsSelectDialog.create(optPassions, available,true,game.i18n.localize('PEN.Entities.Passion'))
    if (!passionVal) {return false}

    //Update starting values
    for (let pItm of passionVal) {
      let item = actor.items.get(pItm.id)
      await item.update ({'system.value': Number(pItm.value)-Number(pItm.homeland)})
    }
    //Create Item classes & Update Source
    let classItems = await Item.createDocuments(newItems, {parent: actor})
    //let classItems = await actor.createEmbeddedDocuments("Item", newItems)
    let updateItems = classItems.map(itm => {return { _id: itm.id, 'system.source': "class"}})
    await Item.updateDocuments(updateItems, {parent: actor})
    return true
  }

  //Undo set class - step 7
  static async undoClass(actor) {
    let classes = await (actor.items.filter(itm =>['class','horse','armour','weapon','gear'].includes(itm.type))).filter(itm=>itm.system.source==='class'|| itm.type==='class').map(itm => {return (itm.id)})
    await Item.deleteDocuments(classes, {parent: actor});
    let passions = actor.items.filter(itm =>itm.type==='passion').map(itm => {return { _id: itm.id, 'system.source': "", 'system.value': 0}})
    await Item.updateDocuments(passions, {parent: actor})
    return
  }

  //Add a homeland
  static async addHomeland (actor,homeland) {
    let hPIDs = (homeland.system.passions).filter(itm => itm).map(itm => {return (itm.pid)})
    let changes=[]
    for (let item of actor.items) {
      if (item.type === 'passion') {
        //Add 5 for any homeland passions
        if (hPIDs.includes(item.flags.Pendragon.pidFlag.id)) {
          const change = {
            _id: item.id,
            'system.homeland': 5,
          }
          changes.push(change)
        }
      }
    }
      await Item.updateDocuments(changes, {parent: actor})
  return
  }


  //Undo add homeland- step 8
  static async undoHomeland(actor) {
    let homelands = actor.items.filter(itm =>itm.type==='homeland').map(itm => {return (itm.id)})
    await Item.deleteDocuments(homelands, {parent: actor});
    let passions = actor.items.filter(itm =>itm.type==='passion').map(itm => {return { _id: itm.id, 'system.homeland': 0}})
    await Item.updateDocuments(passions, {parent: actor})
    return
  }


  //Undo set parent passion- step 9
  static async undostep9(actor){
    let passions = actor.items.filter(itm =>itm.type==='passion').map(itm => {return { _id: itm.id, 'system.inherit': 0}})
    await Item.updateDocuments(passions, {parent: actor})
    return
  }


  //Undo set skill scores - step 10
  static async resetBaseSkillScores(actor) {
    let skills = actor.items.filter(itm =>itm.type==='skill').map(itm => {return { _id: itm.id, 'system.value': 0}})
    await Item.updateDocuments(skills, {parent: actor})
    return
  }


  //Undo set skill scores - step 11
  static async undostep11(actor) {
    let skills = actor.items.filter(itm =>itm.type==='skill').map(itm => {return { _id: itm.id, 'system.family': 0}})
    await Item.updateDocuments(skills, {parent: actor})
    await actor.update({'system.family': "",
                        'system.beauty':0})
    return
  }


  //Undo set skill scores - step 12
  static async undostep12(actor) {
    let skills = actor.items.filter(itm =>itm.type==='skill').map(itm => {return { _id: itm.id, 'system.create': 0}})
    await Item.updateDocuments(skills, {parent: actor})
    return
  }


  //Undo training and development - step 13
  static async undostep13(actor) {
    let skills = actor.items.filter(itm =>['skill','passion','trait'].includes(itm.type)).map(itm => {return { _id: itm.id, 'system.winter': 0}})
    await Item.updateDocuments(skills, {parent: actor})
    await actor.update({
      'system.stats.siz.winter': 0,
      'system.stats.dex.winter': 0,
      'system.stats.str.winter': 0,
      'system.stats.con.winter': 0,
      'system.stats.app.winter': 0,
      'system.features': ""})
  }

  //Undo set skill scores - step 14
  static async undostep14(actor) {
  //Get ready to delete items
    let startItems = (actor.items.filter(itm =>["gear"].includes(itm.type))).filter(itm=>itm.system.source==='luck').map(itm => {return (itm.id)})
    await Item.deleteDocuments(startItems, {parent: actor});
    return
  }

  //Undo set skill scores - step 15
  static async undostep15(actor) {
    let history = (actor.items.filter(itm =>["history"].includes(itm.type))).filter(itm=>itm.system.source==='knighted').map(itm => {return (itm.id)})
    await Item.deleteDocuments(history, {parent: actor});
    return
  }


  //Prepare Random Roll Chat Card
  static async charGenRollChatCard (list,type, actorName) {
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actorName }),
      list: list,
      type: type
    }
      const messageTemplate = 'systems/Pendragon/templates/chat/charGenRoll.html'
      let html = await renderTemplate (messageTemplate, messageData);

     return html;

  }

  // Display the random roll chat card
  static async showCharGenRollChat(html, actor) {

    let chatData={};
      chatData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER,
        content: html,
        speaker: {
          actor: actor._id,
          alias: actor.name,
        },
      }
    let msg = await ChatMessage.create(chatData);
    return
  }

  //Display two button chat window
  //Data should contain
  //msg = message to appear on the form
  //title = to appear on the dialog box
  //button1 (label & icon)
  //button2 (label & icon)
  static async twoOptions(data) {
    const html = await renderTemplate('systems/Pendragon/templates/dialog/2buttons.html',data)
    let usage = await new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: data.title,
        content: html,
        buttons: {
          button1: {
            label: data.button1.label,
            callback: () => {return resolve(true)},
            icon: data.button1.icon
          },
          button2: {
            label: data.button2.label,
            callback: () => {return resolve(false)},
            icon: data.button2.icon
          }
        },
        default: 'button1',
        close: () => {}
      },{classes: ["Pendragon", "sheet"]})
      dlg.render(true);
    })
    return usage
  }

  //Get value input
  static async inpValue (title){
    let inpVal = await new Promise(resolve => {
      const dlg = new Dialog({
        title: title,
        content:  `<input class="centre" type="text" name="age">`,
        buttons: {
          roll: {
            label: game.i18n.localize("PEN.confirm"),
            callback: html => {
            let inpB = html.find('[name="age"]').val()
            resolve (inpB)
            }
          }
        },
        default: 'roll',
        close: () => {}
        },{classes: ["Pendragon", "sheet"]})
        dlg.render(true);
      })
      return inpVal
  }


  //Create history item
  static async createHistory (actor, name, year, glory, source) {
    const itemData = {
      name: name,
      type: 'history',
      system: {
        year: year,
        description: name,
        glory: glory,
        source: source
      }
    }
    let histItem = await Item.create(itemData, {parent: actor});
    let key = await game.system.api.pid.guessId(histItem)
    await histItem.update({'flags.Pendragon.pidFlag.id': key,
                         'flags.Pendragon.pidFlag.lang': game.i18n.lang,
                         'flags.Pendragon.pidFlag.priority': 0})
    return
  }

  //Roll Traits
  static async rollTraits (actor) {
    let changes=[]
    let results=[]
    let rTraits = actor.items.filter(item => item.type === 'trait')
    for (let rTrait of rTraits) {
      //Set dice formula
      let formula = "2D6+3"
      if (rTrait.flags.Pendragon.pidFlag.id === 'i.trait.valorous') {
        formula = "2D6+8"
      }
      //Roll and display dice
      let roll = await PENUtilities.complexDiceRoll (formula)
      //let roll = await new Roll(formula).evaluate({ async: true})
      //if (game.modules.get('dice-so-nice')?.active) {
      //  game.dice3d.showForRoll(roll)
      //}
      rTrait.system.value = Number(roll.total)
      changes.push({
        _id: rTrait.id,
        'system.value': rTrait.system.value
      })
      let rollStr=""
      for (let dCount=0; dCount<roll.dice[0].results.length; dCount++)
        if (dCount === 0){
          rollStr = roll.dice[0].results[dCount].result
        } else {
          rollStr = rollStr + "+" + roll.dice[0].results[dCount].result
        }
      results.push({
        name: rTrait.name,
        rollVal: roll.total,
        form: roll.formula,
        dice: rollStr
      })
    }
    //Call Chat Card
    const html = await PENCharCreate.charGenRollChatCard (results,game.i18n.localize('PEN.traits'), actor.name)
    let msg = await PENCharCreate.showCharGenRollChat(html,actor)
    await Item.updateDocuments(changes, {parent: actor})
    return
  }

  //Roll Characteristics
  static async rollStats(actor) {

    //Calculate distrinctive features
    let results=[]
    for (let [key, stat] of Object.entries(actor.system.stats)) {
      //Set default formula and adjust if there is a culture
      let formula = "2D6+5"
      if (actor.system.cultureID !="") {
        formula = actor.items.get(actor.system.cultureID).system.stats[key].formula
      }
      let roll = await PENUtilities.complexDiceRoll (formula)
      //let roll = await new Roll(formula).evaluate({ async: true})
      //if (game.modules.get('dice-so-nice')?.active) {
      //  game.dice3d.showForRoll(roll)
      //}
      let target = "system.stats."+key+".value"
      let rollStr=""
      for (let dCount=0; dCount<roll.dice[0].results.length; dCount++)
        if (dCount === 0){
          rollStr = roll.dice[0].results[dCount].result
        } else {
          rollStr = rollStr + "+" + roll.dice[0].results[dCount].result
        }
      results.push({
        name: stat.label,
        rollVal: roll.total,
        form: formula,
        dice: rollStr
      })
      await actor.update({[target]:Number(roll.total)})
    }
    const html = await PENCharCreate.charGenRollChatCard (results,game.i18n.localize('PEN.characteristic'), actor.name)
    let msg = await PENCharCreate.showCharGenRollChat(html,actor)
    return
  }

 static async documentFromResult(res){
      let uuid = "";
      switch (res.type) {
        case CONST.TABLE_RESULT_TYPES.DOCUMENT:
          uuid =`${res.documentCollection}.${res.documentId}`;
          break
        case CONST.TABLE_RESULT_TYPES.COMPENDIUM:
          uuid = `Compendium.${res.documentCollection}.Item.${res.documentId}`;
          break
        default:
          ui.notifications.error(game.i18n.localize('PEN.religDocGone'))
          return false
      }
      return await fromUuidSync(uuid)
    }
}


