// Actor template paths

 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/Pendragon/templates/actor/parts/actor-traits.html",
    "systems/Pendragon/templates/actor/parts/actor-biography.html",
    "systems/Pendragon/templates/actor/parts/actor-items.html",
    "systems/Pendragon/templates/actor/parts/actor-combat.html",
    "systems/Pendragon/templates/actor/parts/actor-skills.html",
    "systems/Pendragon/templates/actor/parts/actor-history.html",
    "systems/Pendragon/templates/actor/parts/actor-passions.html",
    "systems/Pendragon/templates/actor/parts/actor-companions.html",
    "systems/Pendragon/templates/actor/parts/actor-winter.html",
    "systems/Pendragon/templates/actor/parts/actor-stats.html",
    "systems/Pendragon/templates/actor/parts/actor-house.html",
    "systems/Pendragon/templates/actor/parts/actor-follower.html",
  ]);
};
