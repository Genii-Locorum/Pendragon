export function yearToPeriod(year) {
    if (year < 415)
        return 'PEN.period.all';
    switch (true) {
        case (year >= 415 && year <= 438):
            return "PEN.period.constantin";
        case (year >= 439 && year <= 450):
            return "PEN.period.vortigern";
        case (year >= 451 && year <= 460):
            return "PEN.period.tyrant";
        case (year >= 461 && year <= 468):
            return "PEN.period.uprising";
        case (year >= 469 && year <= 479):
            return "PEN.period.aurelius";
        case (year >= 480 && year <= 495):
            return "PEN.period.uther";
        case (year >= 496 && year <= 509):
            return "PEN.period.anarchy";
        case (year >= 510 && year <= 514):
            return "PEN.period.boyKing";
       case (year >= 515 && year <= 518):
            return "PEN.period.lateboyKing";            
        case (year >= 519 && year <= 528):
            return "PEN.period.conquest";
        case (year >= 529 && year <= 539):
            return "PEN.period.romance";
        case (year >= 540 && year <= 547):
            return "PEN.period.tournament";
        case (year >= 548 && year <= 557):
            return "PEN.period.grailQuest";
        case (year >= 558 && year <= 566):
            return "PEN.period.twilight";
        default:
            return "PEN.period.twilight";
    }
}

export function yearToPeriodName(year) {
    return game.i18n.localize(yearToPeriod(year))
}