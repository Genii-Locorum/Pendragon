export class PendragonStatusEffects {
    static MOUNTED = "mounted";
    static PRONE = "prone";
    static DEBILITATED = "debilitated";
    static UNCONSCIOUS = "unconscious";
    static DYING = "dying";
    static DEFEATED = "defeated";
    static MADDENED = "maddened";
    static MELANCHOLIC = "melancholic";
    static MISERABLE = "miserable";
    static IMPASSIONED = "impassioned";
    static INSPIRED = "inspired";

    static allStatusEffects = [
        // this one first to be extra familiar and useful
        {
            id: "dead",
            name: PendragonStatusEffects.DEFEATED,
            img: "icons/svg/skull.svg"
        },
        {
            id: PendragonStatusEffects.MOUNTED,
            name: PendragonStatusEffects.MOUNTED,
            img: "systems/Pendragon/assets/Icons/mounted.svg"
        },
        {
            id: PendragonStatusEffects.PRONE,
            name: PendragonStatusEffects.PRONE,
            img: "icons/svg/falling.svg"
        },
        {
            id: PendragonStatusEffects.DEBILITATED,
            name: PendragonStatusEffects.DEBILITATED,
            img: "icons/svg/degen.svg"
        },
        {
            id: PendragonStatusEffects.UNCONSCIOUS,
            name: PendragonStatusEffects.UNCONSCIOUS,
            img: "icons/svg/unconscious.svg"
        },
        {
            id: PendragonStatusEffects.DYING,
            name: PendragonStatusEffects.DYING,
            img: "systems/Pendragon/assets/Icons/dying.svg"
        },
        {
            id: PendragonStatusEffects.MADDENED,
            name: PendragonStatusEffects.MADDENED,
            img: "systems/Pendragon/assets/Icons/maddened.svg"
        },
        {
            id: PendragonStatusEffects.MELANCHOLIC,
            name: PendragonStatusEffects.MELANCHOLIC,
            img: "systems/Pendragon/assets/Icons/melancholic.svg"
        },
        {
            id: PendragonStatusEffects.MISERABLE,
            name: PendragonStatusEffects.MISERABLE,
            img: "systems/Pendragon/assets/Icons/miserable.svg"
        },
        {
            id: PendragonStatusEffects.IMPASSIONED,
            name: PendragonStatusEffects.IMPASSIONED,
            img: "systems/Pendragon/assets/Icons/impassioned.svg"
        },
        {
            id: PendragonStatusEffects.INSPIRED,
            name: PendragonStatusEffects.INSPIRED,
            img: "systems/Pendragon/assets/Icons/inspired.svg"
        },
    ];
}