/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs.
 * @param {object} [options={}]
 * @param {boolean} [options.bypassVersionCheck=false]  Bypass certain migration restrictions gated behind system
 *                                                      version stored in item stats.
 * @returns {Promise}      A Promise which resolves once the migration is completed
 */
export async function migrateWorld({ bypassVersionCheck=false }={}) {
    const currentVersion = game.settings.get("Pendragon", "systemMigrationVersion");
    const targetVersion = game.system.version;
    console.log(`Migrate from ${currentVersion} to ${targetVersion}`);

   //Migrate if current system is less that Version 12.1.21
    if (foundry.utils.isNewerVersion('12.1.21', currentVersion ?? '0')) {
        const actors = game.actors.map(a => a);
        for (const actor of actors) {
            const updateData = migrateActor(actor);
            if(!foundry.utils.isEmpty(updateData)) {
                console.log(`Migrating Actor document ${actor.name}`);
                await actor.update(updateData);
            }
        }
    }

    //Migrate if current system is less that Version 13.1.36
    if (foundry.utils.isNewerVersion('13.1.36', currentVersion ?? '0')) {
        await migrateItems_13136();
    }

   await game.settings.set("Pendragon", "systemMigrationVersion",targetVersion)
  return 
}    


  //Update for version 12.1.21
    export async function migrateActor_12121(actor) {
        const updateData = {};

        // migrate Owned items
        const items = actor.items.reduce((arr, i) => {
            // Migrate the Owned Item
            const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
            const itemUpdate = migrateItemData_12121(i, itemData);
            if(!foundry.utils.isEmpty(itemUpdate))
            {
                arr.push({ ...itemUpdate, _id: itemData._id });
            }
            return arr;
        }, []);

        if ( items.length > 0 ) updateData.items = items;
        return updateData;
    }

    export async function migrateItemData_12121(item, itemData) {
        const updateData = {};
        if(itemData.type === 'history' && itemData.name === 'History') {
            if(itemData.system.description) {
                updateData["name"] = itemData.system.description.replace(/(<([^>]+)>)/gi, '');
            }
        }
        return updateData;
    }

    //Update for version 13.1.36
    export async function migrateItems_13136() {
      console.log("Migration to 13.1.36")
      const updateData = {};
      // Migrate World Items
      const items = game.items.filter(itm=> itm.type==="skill")
      for (let item of items) {
        await migrateItemData_13136(item)
      }

      //Migrate Actor Items
      for (let actor of game.actors) {
        const actoritems = actor.items.filter(itm=> itm.type==="skill")
        for (let item of actoritems) {
          await migrateItemData_13136(item)
        }
      }

      // Migrate Items in Scenes [Token] Actors
      for (const scene of game.scenes) {
        for (const token of scene.tokens) {
          if (token.actorLink) { continue }
          let tokenitems = token.delta.items.filter(itm=> itm.type==="skill")
          for (let item of tokenitems) {
            await migrateItemData_13136(item)
          }
        }
      }

      //Migrate Compendium Packs 
      for (const pack of game.packs) {
        if (!_shouldMigrateCompendium(pack)) {continue}
        // Unlock the pack for editing
        const wasLocked = pack.locked;
        await pack.configure({locked: false});
        // Begin by requesting server-side data model migration and get the migrated content
        const documents = await pack.getDocuments();    
        for ( let doc of documents ) {
          switch (pack.documentName) {
            case "Actor":
              break;
            case "Item":
              await migrateItemData_13136(doc)               
              break;
            case "Scene":
              break;    
          }  
        }    
        await pack.configure({locked: wasLocked}); 
      }
    }

    export async function migrateItemData_13136(item) {
      //If categories already set then don't migrate
      if ((item.system.categories).length > 0) {return}
      const updateData = [];
      if (item.system.combat) {
        updateData.push('combat')
      }
      if (item.system.nonknightly) {
        updateData.push('nonknightly')
      }
      await item.update({'system.categories': updateData})
      return;
    }

    /**
    * Determine whether a compendium pack should be migrated during `migrateWorld`.
    * @param {Compendium} pack
    * @returns {boolean}
    */
    function _shouldMigrateCompendium(pack) {
      // We only care about actor, item or scene migrations
      if ( !["Actor", "Item", "Scene"].includes(pack.documentName) ) return false;

      // World compendiums should all be migrated, system ones should never by migrated
      if ( pack.metadata.packageType === "world" ) return true;
      if ( pack.metadata.packageType === "system" ) return false;

      // Module compendiums should only be migrated if they don't have a download or manifest URL
      const module = game.modules.get(pack.metadata.packageName);
      return !module.download && !module.manifest;
    }