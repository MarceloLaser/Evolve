// Fork-only mobile support helpers. Keep upstream files untouched beyond single-line
// hooks; see .claude/docs/mobile-ui.md for the compartmentalization policy.

// True on touch-primary devices (phones/tablets on any browser engine). Standard
// media-query detection, not UA sniffing: correctly includes iPads (whose UA lacks
// "Mobi") and excludes touchscreen laptops (which have hover). Replaces the game's
// broken "Touch Device" setting gates — touch mode now auto-enables.
let touchModeCache = null;
export function touchMode(){
    if (touchModeCache === null){
        touchModeCache = typeof window.matchMedia === 'function'
            && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    }
    return touchModeCache;
}

// Wraps each <span> label + following dropdown in the settings tab's dropdown groups
// inside a .setPair span, BEFORE the template is Vue-compiled. This gives mobile CSS
// an atomic unit so label/dropdown pairs flow inline and wrap between pairs, never
// between a label and its dropdown. Plain inline wrapper: desktop rendering unchanged.
export function pairSettingDropdowns(settings){
    settings.find('.theme, .localization, .queue').each(function(){
        $(this).children('span').each(function(){
            let label = $(this);
            let drop = label.next();
            if (drop.length){
                label.add(drop).wrapAll('<span class="setPair"></span>');
            }
        });
    });
}
