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

    const actors = game.actors.map(a => a);
    for (const actor of actors) {
        const updateData = migrateActor(actor);
        if(!foundry.utils.isEmpty(updateData)) {
            console.log(`Migrating Actor document ${actor.name}`);
            await actor.update(updateData);
        }
    }
    await game.settings.set("Pendragon", "systemMigrationVersion",targetVersion)
}

function migrateActor(actor) {
    const updateData = {};

    // migrate Owned items
    const items = actor.items.reduce((arr, i) => {
        // Migrate the Owned Item
        const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
        const itemUpdate = migrateItemData(i, itemData);
        if(!foundry.utils.isEmpty(itemUpdate))
        {
            arr.push({ ...itemUpdate, _id: itemData._id });
        }
        return arr;
    }, []);

    if ( items.length > 0 ) updateData.items = items;
    return updateData;
}

function migrateItemData(item, itemData) {
    const updateData = {};
    if(itemData.type === 'history' && itemData.name === 'History') {
        if(itemData.system.description) {
            updateData["name"] = itemData.system.description.replace(/(<([^>]+)>)/gi, '');
        }
    }
    return updateData;
}