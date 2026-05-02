/**
 * wc-toggle-switch
 *
 * A custom toggle switch web component with perceptually-aware color handling
 * 
 * Vue 2 and Vue 3 thin wrappers are included
 *
 * This component is designed to behave correctly across:
 * - light and dark themes
 * - saturated colors (red, yellow, green, etc.)
 * - neutral colors (white, gray, black)
 * - accessibility-focused size and contrast adjustments
 *
 * Rather than relying on fixed color mixes, the control uses OKLCH-based
 * color math to adapt borders and backgrounds based on lightness (L),
 * chroma (C), and theme context.
 *
 * ─────────────────────────────────────────────────────────────
 * COLOR MODEL & DESIGN PRINCIPLES
 * ─────────────────────────────────────────────────────────────
 *
 * 1. Control Color (`--color`)
 *    The `--color` (or state-specific variants like `--control-color-left`
 *    and `--control-color-right`) represents the *semantic* color of the 
 *    control (e.g. primary, info, success). This color is used directly
 *    for the knob and as the source for derived track and border colors.
 *
 * 2. Track (Background) Color
 *    The track background is derived from the control color using:
 *    - OKLCH relative color syntax
 *    - alpha transparency instead of heavy color mixing
 *
 *    This allows:
 *    - saturated colors (e.g. red) to appear as soft tints (pink)
 *    - the page background to participate naturally in the final color
 *
 *    Special handling is applied at perceptual extremes:
 *    - Near-white colors are gently pulled darker toward neutral gray
 *    - Near-black colors are gently lifted in dark mode
 *    - High-chroma colors (like yellow) are *not* desaturated unless they
 *      are also near-neutral
 *
 * 3. Border Color
 *    Borders are intentionally more structured than backgrounds:
 *    - White controls in light mode get a visible light-gray border
 *    - Black controls in dark mode get a visible lifted border
 *    - Dark saturated colors (e.g. dark red) avoid collapsing to near-black
 *
 *    Border colors adapt based on:
 *    - lightness thresholds
 *    - chroma (to distinguish neutral vs vivid colors)
 *    - theme (light vs dark)
 *
 * 4. Knob
 *    The knob uses the raw control color for clarity and affordance.
 *    Its border contrast adapts to size and interaction state
 *    (hover/focus) to maintain consistent perceived weight.
 *
 * 5. Size Awareness
 *    Contrast and border intensity subtly adapt to control size
 *    so larger controls do not appear overly heavy and smaller
 *    controls remain legible.
 *
 * ─────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────
 *
 * ```html
 * <!-- Basic usage -->
 * <wc-toggle-switch></wc-toggle-switch>
 *
 * <!-- With labels -->
 * <wc-toggle-switch label-on="On" label-off="Off"></wc-toggle-switch>
 *
 * <!-- Checked by default -->
 * <wc-toggle-switch checked></wc-toggle-switch>
 *
 * <!-- Disabled / readonly -->
 * <wc-toggle-switch disabled></wc-toggle-switch>
 * <wc-toggle-switch readonly></wc-toggle-switch>
 *
 * <!-- Indeterminate state/Required -->
 * <wc-toggle-switch indeterminate required></wc-toggle-switch>
 *
 * <!-- Reverse direction -->
 * <wc-toggle-switch reverse></wc-toggle-switch>
 *
 * <!-- Inset style -->
 * <wc-toggle-switch inset></wc-toggle-switch>
 *
 * <!-- Semantic color styles -->
 * <wc-toggle-switch class="on-primary off-primary"></wc-toggle-switch>
 * <wc-toggle-switch class="on-success off-success"></wc-toggle-switch>
 * <wc-toggle-switch class="on-info off-info"></wc-toggle-switch>
 * <wc-toggle-switch class="on-warning off-warning"></wc-toggle-switch>
 * <wc-toggle-switch class="on-danger off-danger"></wc-toggle-switch>
 * <wc-toggle-switch class="indeterminate-warning"></wc-toggle-switch>
 *
 * <!-- Theme override -->
 * <wc-toggle-switch class="light"></wc-toggle-switch>
 * <div style="color-scheme:light"><wc-toggle-switch></wc-toggle-switch></div>
 * <wc-toggle-switch class="dark"></wc-toggle-switch>
 * <div style="color-scheme:dark"><wc-toggle-switch></wc-toggle-switch></div>
 * ```
 *
 * ─────────────────────────────────────────────────────────────
 * ATTRIBUTES
 * ─────────────────────────────────────────────────────────────
 *
 * - `checked`       : Boolean — sets the switch to the on state
 * - `disabled`      : Boolean — disables interaction
 * - `readonly`      : Boolean — prevents state changes but keeps focus
 * - `indeterminate` : Boolean — mixed/undefined state
 * - `required`      : Boolean — required form control
 * - `label-on`      : String  — label for the on state
 * - `label-off`     : String  — label for the off state
 * - `reverse`       : Boolean — reverses toggle direction
 * - `inset`         : Boolean/Class — inset visual style
 * - `name`          : String  — form name
 * - `value`         : String  — form value
 * - `tabindex`      : Number  — tab order
 *
 * ─────────────────────────────────────────────────────────────
 * EVENTS
 * ─────────────────────────────────────────────────────────────
 *
 * - `change`              : Fired when the checked state changes
 * - `update:modelValue`  : Fired for framework bindings (Vue)
 *
 * ─────────────────────────────────────────────────────────────
 * NOTES
 * ─────────────────────────────────────────────────────────────
 *
 * This component intentionally avoids hard-coded color rules.
 * All visual behavior emerges from perceptual color math so that
 * new themes or custom colors behave predictably without special cases.
 */

(function () {

const template = document.createElement('template');

const templateHTML  = `
<div id="container">
    <label id="label-left" part="label-left"></label>
    <span id="control"></span>
    <label id="label-right" part="label-right"></label>
</div>
<style>
    :host {
        display: inline-block;
        --control-primary: var(--color-primary, #0d6efd);
        --control-info: var(--color-info, #ffc107);
        --control-success: var(--color-success, #37db55);
        --control-warning: var(--color-warning, #fd7e14);
        --control-danger: var(--color-danger, #dc3545);

        --border-width: 1px;
        --border-width-min: 1px;

        --knob-border-width-hover: 0.1em;
        --knob-border-width-focus: 0.15em;
        --knob-border-width: var(--border-width-min);

        --track-border-width-hover: 0.08em;
        --track-border-width-focus: 0.08em;
        --track-border-width: var(--border-width-min);

        --cursor: var(--toggle-switch-cursor, pointer);

        --label-opacity-unchecked: var(--toggle-switch-label-opacity-unchecked, 0.6);
        --label-margin: var(--toggle-switch-label-margin, 0.23em);

        --control-width: var(--toggle-switch-control-width, 1.25em);
        --control-height: 0.68em;
        --control-offset-top: 0.34em;
        --control-border-radius: 0.35em;

        --knob-size: 0.9em;
        --knob-offset-left: 0;
        --knob-offset-right: 0.75em;
        --knob-offset-indeterminate: 0.375em;
    }

    :host(.inset) {
        --knob-size: 0.65em;
        --control-height: 0.9em;
        --control-offset-top: 0.34em;
        --control-border-radius: 0.5em;
        --knob-offset-left: 0.19em;
        --knob-offset-right: 0.78em;
        --knob-offset-indeterminate: 0.5em;
    }

    :host(:focus) {
        outline:none;
    }

    :host([disabled]), :host([readonly]) {
        --cursor: default;
    }

    /* THEME: default */
    :host {
        --control-color-left: var(--color, var(--color-left, light-dark(#fff, #ccc)));
        --control-color-right: var(--color, var(--color-right, light-dark(#fff, #ccc)));
        --control-color-indeterminate: var(--color-indeterminate, light-dark(#fff, #ccc));
        --control-color-disabled: var(--color-disabled, light-dark(#f2f2f2, #333));
        --control-border-color-disabled: var(--color-disabled-border, light-dark(#e9e9e9, #303030));
        --control-border-color-required: var(--color-required, light-dark(#d2322d,#d2322d));
    }

    :host([inset]) {
        --control-color-left: var(--color, var(--color-left, light-dark(#777, #ccc)));
        --control-color-right: var(--color, var(--color-right, light-dark(#777, #ccc)));
        --control-color-indeterminate: var(--color-indeterminate, light-dark(#777, #ccc));
    }

    /* THEME: force light/dark */
    :host(.light) { color-scheme: light; }
    :host(.dark)  { color-scheme: dark; }

    /* THEME: color styles */
    :host(.on-primary)  { --control-color-left: var(--control-primary); }
    :host(.on-info)     { --control-color-left: var(--control-info); }
    :host(.on-success)  { --control-color-left: var(--control-success); }
    :host(.on-warning)  { --control-color-left: var(--control-warning); }
    :host(.on-danger)   { --control-color-left: var(--control-danger); }
    :host(.off-primary) { --control-color-right: var(--control-primary); }
    :host(.off-info)    { --control-color-right: var(--control-info); }
    :host(.off-success) { --control-color-right: var(--control-success); }
    :host(.off-warning) { --control-color-right: var(--control-warning); }
    :host(.off-danger)  { --control-color-right: var(--control-danger); }
    :host(.indeterminate-primary)   { --control-color-indeterminate: var(--control-primary); }
    :host(.indeterminate-info)      { --control-color-indeterminate: var(--control-info); }
    :host(.indeterminate-success)   { --control-color-indeterminate: var(--control-success); }
    :host(.indeterminate-warning)   { --control-color-indeterminate: var(--control-warning); }
    :host(.indeterminate-danger)    { --control-color-indeterminate: var(--control-danger); }

    /* hide input checkbox */
    #input-checkbox { margin:0; padding:0; visibility:hidden; width:0; height:0; }
        
    #container
    {
        display:flex;
        width: fit-content;
        justify-content: flex-start;
        align-items: baseline;
        font-family:inherit;
        white-space:nowrap;
        user-select:none; 
    }

    /* label (left/right): default style */
    label { 
        cursor: var(--cursor); 
        user-select:none; 
        display:inline-block; 
        margin-left: 0;
        margin-right: var(--label-margin);
        opacity: 1;
        transition: 0.2s ease all; 
        font: inherit;
        line-height: 1;
        white-space: nowrap;
    }

    /* Label right: reverse margin */
    label#label-right
    {
        margin-left: var(--label-margin);
        margin-right: 0;
    }

    #control{
        position: relative; 
        display: inline-block; 
        min-width: var(--control-width); 
        cursor: var(--cursor); 
        font-weight: 500; 
        text-align: left; 
        margin: 0.315em 0px 0.05em 0px; 
        padding: 0 0 0.69em 0.4em; 
        outline:none;
    }

    /* control slider */
    :host #container > #control::before {
        --control-border-l-contrast: clamp(0, (l / var(--l-threshold, 0.623) - 1) * -infinity, 1);

        /* alpha for normal colors */
        --control-bg-alpha-light: 0.26;
        --control-bg-alpha-dark: 0.40;
        --control-bg-edge-strength: 0.2;

        /* treat colors with low chroma as “neutral-ish” */
        --control-bg-neutral-chroma: 0.06;

        /* 1 when c is small (white/gray), 0 when c is vivid (yellow) */
        --control-bg-neutral-pull: calc( var(--control-bg-white-pull) * clamp(0, (var(--control-bg-neutral-chroma) - c) / var(--control-bg-neutral-chroma), 1) );

        --control-bg-white-pull: clamp(0, (l - 0.90) * 10, 1);
        --control-bg-black-pull: clamp(0, (0.12 - l) * 10, 1);

        /* LIGHT MODE: if near-white, darken + neutralize */
        --control-bg-l-light: calc(l - var(--control-bg-neutral-pull) * var(--control-bg-edge-strength));
        --control-bg-c-light: calc(c * (1 - var(--control-bg-neutral-pull)));

        /* DARK MODE: if near-black, lighten + neutralize */
        --control-bg-l-dark:  calc(l + var(--control-bg-black-pull) * var(--control-bg-edge-strength));
        --control-bg-c-dark:  calc(c * (1 - var(--control-bg-black-pull)));

        /* final track background */
        --control-background-color: light-dark(
          oklch(from var(--control-color, var(--control-color-right))
            var(--control-bg-l-light) var(--control-bg-c-light) h / var(--control-bg-alpha-light)
          ),
          oklch(from var(--control-color, var(--control-color-right))
            var(--control-bg-l-dark) var(--control-bg-c-dark) h / var(--control-bg-alpha-dark)
          )
        );
    
        /* base alphas */
        --control-border-alpha-light: 0.50;
        --control-border-alpha-dark:  0.40;

        /* detect near-white / near-black */
        --control-border-white-pull: clamp(0, (l - 0.88) * 12, 1);
        --control-border-black-pull: clamp(0, (0.14 - l) * 10, 1);

        /* stronger lightness pull for white */
        --control-border-edge-strength: 0.22;

        /* LIGHT MODE: darker + neutral gray for white */
        --control-border-l-light: calc( l - var(--control-border-white-pull) * var(--control-border-edge-strength) );
        /* DARK MODE: lift black slightly */
        --control-border-l-dark: calc( l + var(--control-border-black-pull) * 0.16 );

        /* kill chroma completely for white/black so it reads neutral */
        --control-border-c-light: calc( c * (1 - var(--control-border-white-pull)) );
        --control-border-c-dark: calc( c * (1 - var(--control-border-black-pull)) );

        /* EXTRA: boost opacity ONLY for near-white in light mode */
        --control-border-alpha-light-final: calc( var(--control-border-alpha-light) + var(--control-border-white-pull) * 0.25 );

        /* final color */
        --control-border-color: light-dark(
          oklch(
            from var(--control-color, var(--control-color-right))
            var(--control-border-l-light)
            var(--control-border-c-light)
            h / var(--control-border-alpha-light-final)
          ),
          oklch(
            from var(--control-color, var(--control-color-right))
            var(--control-border-l-dark)
            var(--control-border-c-dark)
            h / var(--control-border-alpha-dark)
          )
        );      

        content: ""; position: absolute; margin: 0; outline: 0; top: var(--control-offset-top); transform: translate(0, -50%);
        border: var(--track-border-width) solid var(--control-border-color);
		background-color: var(--control-background-color);
        box-sizing:border-box;
		left: 0px; width: 100%; height: var(--control-height);  border-radius: var(--control-border-radius); 
    }

    /* control knob */
    :host #container > #control::after {
        --knob-ref-size: 1em;
        --knob-size-factor: clamp( 0.7, calc(var(--knob-ref-size) / var(--knob-size)), 1.2 );
        --knob-l-threshold-sized: calc(var(--l-threshold, 0.823) * var(--knob-size-factor));
        --knob-border-l-contrast:  clamp( 0, (l / var(--knob-l-threshold-sized) - 1) * -infinity, 1 );

        /* size-scaled defaults */
        --knob-border-mix-amount-light-base: calc(80% * var(--knob-size-factor));
        --knob-border-mix-amount-dark-base:  calc(80% * var(--knob-size-factor));

        /* allow hover/focus to override without getting clobbered */
        --knob-border-mix-amount-light: var(--knob-border-mix-amount-light-override, var(--knob-border-mix-amount-light-base));
        --knob-border-mix-amount-dark:  var(--knob-border-mix-amount-dark-override,  var(--knob-border-mix-amount-dark-base));

        /* Darken knob border as knob size increases (e.g. 1.5em+) */
        --knob-border-large-start: 1.15em; /* where darkening begins */
        --knob-border-large-end:   1.50em; /* where it reaches max */
        --knob-border-darken-max:  0.12;   /* max L drop (0.08–0.16 is typical) */

        /* 0..1 ramp based on knob size */
        --knob-border-large-t: clamp( 0, calc((var(--knob-size) - var(--knob-border-large-start)) / (var(--knob-border-large-end) - var(--knob-border-large-start))), 1 );

        /* apply an L drop to the border source color */
        --knob-border-color-source: oklch( from var(--control-color, var(--control-color-right)) calc(l - var(--knob-border-large-t) * var(--knob-border-darken-max)) calc(c * (1 - var(--knob-border-large-t) * 0.35)) h );

        --knob-border-color: light-dark(
            color-mix(
                in oklch, 
                var(--control-color, var(--control-color-right)) var(--knob-border-mix-amount-light, 80%), 
                var(--knob-mix-color-light, black)), 
            color-mix(
                in oklch,
                var(--knob-border-color-source) var(--knob-border-mix-amount-dark),
                var(--knob-mix-color-dark,
                  oklch(from var(--knob-border-color-source) var(--knob-border-l-contrast) 0 0)
                ))        
        );
        transition: 0.2s ease transform, 0.2s ease border-color, 0.2s ease background-color, 0.05s ease border-width;
        content: ""; position: absolute; margin: 0; outline: 0; top: 0.34em;


        border: var(--knob-border-width) solid var(--knob-border-color);
		background-color: var(--control-color, var(--control-color-right)); 
		box-sizing:border-box;
        transform: translate(var(--knob-offset-right), -50%);
		left: 0px; 
        height: var(--knob-size); 
        width: var(--knob-size); 
        border-radius: 50%; 
        box-shadow: 
            0 3px 1px -2px light-dark(rgba(0, 0, 0, 0.099), rgba(255, 255, 255, 0.099)), 
            0 2px 2px 0    light-dark(rgba(0, 0, 0, 0.088), rgba(255, 255, 255, 0.088)), 
            0 1px 5px 0    light-dark(rgba(0, 0, 0, 0.074), rgba(255, 255, 255, 0.074)); 
    }

    :host([checked]) #container > #control::before, 
    :host([checked]) #container > #control::after {
        --control-color: var(--control-color-left);
    }


    /* control knob positions */
    :host([reverse]) #container > #control::after           { transform: translate(var(--knob-offset-left), -50%); }
    :host([checked]) #container > #control::after           { transform: translate(var(--knob-offset-left), -50%); }
    :host([reverse][checked]) #container > #control::after  { transform: translate(var(--knob-offset-right), -50%); }

    /* control knob: hover */
    :host(:not([disabled]):not([readonly])) #container:hover {
        --knob-border-mix-amount-light-override: 55%;
        --knob-border-mix-amount-dark-override: 25%;
        --knob-border-width: max(var(--border-width-min), var(--knob-border-width-hover));
        --track-border-width: max(var(--border-width-min), var(--track-border-width-hover));
   }

    /* control knob: focus */
    :host(:focus:not([disabled])) #container > #control::after {
        --knob-border-mix-amount-light-override: 55%;
        --knob-border-mix-amount-dark-override: 55%;
        --knob-border-width: max(var(--border-width-min), var(--knob-border-width-focus));
   }

   :host(:focus:not([disabled])) #container > #control::before {
        --track-border-width: max(var(--border-width-min), var(--track-border-width-focus));
   }

    /* control knob: indeterminate */
    :host([indeterminate]) #container > #control::after, 
    :host([indeterminate][checked]) #container > #control::after,
    :host([indeterminate][reverse]) #container > #control::after,
    :host([indeterminate][reverse][checked]) #container > #control::after,
    :host([indeterminate]) #container:hover > #control::after,
    :host([indeterminate]:focus) #container > #control::after, 
    :host([indeterminate]:focus) #container:hover > #control::after {
        --knob-background-color: var(--knob-background-color-indeterminate);
        transform: translate(var(--knob-offset-indeterminate), -50%);
    }

    /* control slider: indeterminate */
    :host([indeterminate]), 
    :host([indeterminate]) #container > #control::before, 
    :host([indeterminate]) #container > #control::after{
        --control-color: var(--control-color-indeterminate);
    }

    :host(:invalid) #container > #control::before {
        --control-border-color: var(--control-border-color-required);
    }

    :host(:invalid:not(:focus)) #container:not(:hover) > #control::after {
        --knob-border-color: var(--control-border-color-required);
    }

    /* Labels & control: DISABLED */
    :host([disabled]) #container > #control::before, :host([disabled]) #container > #control::after {
        --control-color: var(--control-color-disabled);
        --control-background-color: var(--control-color-disabled);
        --control-border-color: var(--control-border-color-disabled);
        --knob-border-color: var(--control-border-color-disabled);
    }

    /* Control knob: No shadow (disabled || inset) */
    :host([disabled]) #container > #control::after,
    :host(.inset) #container > #control::after {
        box-shadow: none;
    }


    /* Label: opacity for checked/indeterminate */
    :host label#label-left  { opacity: var(--label-opacity-unchecked); }
    :host label#label-right { opacity: 1; }
    :host([checked]) label#label-left  { opacity: 1; }
    :host([checked]) label#label-right { opacity: var(--label-opacity-unchecked); }
    :host([reverse]) label#label-left   { opacity: 1; }
    :host([reverse]) label#label-right   { opacity: var(--label-opacity-unchecked); }
    :host([reverse][checked]) label#label-left   { opacity: var(--label-opacity-unchecked); }
    :host([reverse][checked]) label#label-right  { opacity: 1; }
    :host(:not([readonly]):not([disabled])) label:hover { opacity: 1!important; }

    :host([indeterminate]:not([checked])) label#label-right:not(:hover),
    :host([indeterminate]) label#label-right:not(:hover),
    :host([indeterminate]) label#label-left:not(:hover) {
        opacity: var(--label-opacity-unchecked);
    }
    :host([disabled]) label { opacity: var(--label-opacity-unchecked)!important; }

</style>`;


class Togglecontrol extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return ["modelvalue", "checked", "disabled","title","label-on","title-on","value-on","value-off","label-off","title-off","name","value","tabindex", "indeterminate","reverse","inset","required","readonly"];
    }

    constructor() {
        super();
        
        var shadowElement = this.attachShadow({ mode: 'open' })
        this.internals = this.attachInternals();
        template.innerHTML = templateHTML;
        shadowElement.appendChild(template.content.cloneNode(true));
        this._initial = { checked: false, indeterminate: false };
        this._tabindex = '0';
        this._reverse = false;
        this._inset = false;
        this._value = "on";
        this._valueOn = null;
        this._valueOff = null;
        this._root = shadowElement.getElementById('container');
        this._toggleCtrl = shadowElement.getElementById('control');
        this._labelRight = shadowElement.getElementById('label-right');
        this._labelLeft = shadowElement.getElementById('label-left');
        this._dragging = false;
        this._dragStartX = 0;
        this._initialChecked = false;
        this._cancelClick = false;
        this._fireChangeEvent = true;
        this._bindings = [];
    }
    connectedCallback() {

        if (this.hasAttribute('checked')) {
            this._initial.checked = true;
        }
        if (this.hasAttribute('indeterminate')) {
            this._initial.indeterminate = true;
        }

        if (!this.hasAttribute('tabindex') && !this.hasAttribute('disabled')) {
            this.setAttribute('tabindex', this._tabindex);
        }

        if (!this.hasAttribute('role')) {
            this.setAttribute('role', 'switch');
        }
        this.addBinding(this._toggleCtrl, 'click', this._handleClickAndToggle.bind(this));
        this.addBinding(this._toggleCtrl, 'pointerdown', this._onPointerDown.bind(this));
        this.addBinding(this._toggleCtrl, 'pointermove', this._onPointerMove.bind(this));
        this.addBinding(this._toggleCtrl, 'pointerup', this._onPointerUp.bind(this));
        this.addBinding(this._toggleCtrl, 'pointercancel', this._onPointerUp.bind(this));
        this.addBinding(this, 'keydown', this._handleKeyPress);
        this.addBinding(this._labelRight, 'click', this._handleClickAndToggle.bind(this, false));
        this.addBinding(this._labelLeft, 'click', this._handleClickAndToggle.bind(this, true));

        this._syncAria();
        this._validate();
    }
    disconnectedCallback() {
        for(var i = 0; i < this._bindings.length; i++) {
            this._bindings[i].ctl.removeEventListener(this._bindings[i].type, this._bindings[i].method);
        }
        this._bindings=[];
    }
    formDisabledCallback(disabled) {
        this.disabled = disabled;
    }
    formResetCallback() {
        this.checked = this._initial.checked;
        this.indeterminate = this._initial.indeterminate;
    }
    addBinding(ctl, type, method)
    {
        if (ctl && ctl.addEventListener) {
            ctl.addEventListener(type, method);
            this._bindings.push({ctl:ctl, type:type, method:method});
        }
    }

    get checked() { return this.hasAttribute('checked'); }
    set checked(value) {
        value = (value === true || value === "true" || value === "");
        if (this.hasAttribute('checked') == value) return;
        if (value) {
            this.internals.setFormValue(this.valueOn==null||this.valueOn==''?this.value:this.valueOn);
            this.setAttribute('checked', "");
        } else {
            this.internals.setFormValue(this.valueOff==null?'':this.valueOff);
            this.removeAttribute('checked');
        }
        this._syncAria();
        if (this._fireChangeEvent) { this.dispatchEvent(new Event('change', { bubbles: true, composed: true })); }
    }

    get name() { return this.getAttribute('name'); }
    set name(value) {
        if (this.getAttribute('name') == value) return;
        if (value === null || value === '') {
            this.removeAttribute('name');
        } else {
            this.setAttribute('name', value);
        }
    }

    get required() { return this.hasAttribute('required'); }
    set required(value) {
        value = (value === true || value === "true" || value === "");
        if (this.hasAttribute('required') == value) return;
        if (value) {
            this.setAttribute("required", "");
        } else {
            this.removeAttribute("required");
        }
    }

    get readonly() { return this.hasAttribute('readonly'); }
    set readonly(value) {
        value = (value === true || value === "true" || value === "");
        if (this.hasAttribute('readonly') == value) return;
        if (value) {
            this.setAttribute("readonly", "");
        } else {
            this.removeAttribute("readonly");
        }
        this._syncAria();
    }

    get form() { return this.internals.form; }
    get type() { return this.localName; }
    get validity() { return this.internals.validity; }
    get validationMessage() { return this.internals.validationMessage; }
    get willValidate() { return this.internals.willValidate; }

    checkValidity() { return this.internals.checkValidity(); }
    reportValidity() { return this.internals.reportValidity(); }

    get indeterminate() {
        return this.hasAttribute('indeterminate');
    }
    set indeterminate(value) {
        value = (value === true || value === "true" || value === "");
        if (this.hasAttribute('indeterminate') == value) return;
        if (value) {
            this.setAttribute("indeterminate", "");
            this.internals.setFormValue('');
        } else {
            this.removeAttribute("indeterminate");
            this.internals.setFormValue(this.value);
        }
        if (this._fireChangeEvent) { this.dispatchEvent(new Event('change', { bubbles: true, composed: true })); }
        this._syncAria();
    }
    get disabled() { return this.hasAttribute('disabled'); }

    set disabled(value) {
        value = (value === true || value === "true" || value === "");
        if (this.hasAttribute('disabled') == value) return;
        if (value) {
            this.setAttribute('disabled', "");
            this.tabindex = null;
            this.internals.setFormValue('');
        } else {
            this.removeAttribute('disabled');
            this.tabindex = this._tabindex;
            this.internals.setFormValue(this.value);
        }
        this._syncAria();
    }

    get tabindex() { return this._tabindex; }
    set tabindex (value) { 
        if (value == this.getAttribute('tabindex') && value == this._tabindex) return;
        if (value !== null) { this._tabindex = value; }
        if (!this.disabled && !(typeof value == 'undefined') && value!=='' && (value === 0 || (value && !isNaN(parseInt(value))))) {
            this.setAttribute('tabindex', this._tabindex);
        } else {
            this.removeAttribute('tabindex');
            this.blur();
        }
    }

    get title() { return this._root.title; }
    set title (text) { this._root.title = text; }

    get labelOff() { return (this.reverse?this._labelLeft:this._labelRight).innerText; }
    set labelOff (text) { (this.reverse?this._labelLeft:this._labelRight).innerText = text; }

    get titleOff() { return (this.reverse?this._labelLeft:this._labelRight).title; }
    set titleOff (text) { (this.reverse?this._labelLeft:this._labelRight).title = text; }

    get labelOn() { return (!this.reverse?this._labelLeft:this._labelRight).innerText; }
    set labelOn (text) { (!this.reverse?this._labelLeft:this._labelRight).innerText = text; }

    get titleOn() { return (!this.reverse?this._labelLeft:this._labelRight).title; }
    set titleOn (text) { (!this.reverse?this._labelLeft:this._labelRight).title = text; }

    get value() { return this.checked?(this._valueOn==null?this._value:this._valueOn):this._valueOff; }
    set value(value) { this._value = value; }

    get valueOn() { return this._valueOn==null?this._value:this._valueOn; }
    set valueOn(value) { 
        this._valueOn = value;
        if (this.checked) {
            this.internals.setFormValue((this._valueOn==null||this._valueOn=='')?this._value:this._valueOn);
        }
    }

    get valueOff() { return this._valueOff; }
    set valueOff(value) { 
        this._valueOff = value; 
        if (!this.checked) this.internals.setFormValue(this._valueOff==null?'':this._valueOff);
    }

    get reverse() { return this._reverse; }
    set reverse(value) {
        value = (value === true || value === "true" || value === "");
        if (this._reverse == value) return;
        const labelOn  = this.labelOn;
        const labelOff = this.labelOff;
        const titleOn  = this.titleOn;
        const titleOff = this.titleOff;

        this._reverse = value;

        if (this._reverse) {
            this.setAttribute('reverse', "");
        } else {
            this.removeAttribute('reverse');
        }
        
        this.labelOn  = labelOn;
        this.labelOff = labelOff;
        this.titleOn  = titleOn;
        this.titleOff = titleOff;
    }

    get inset() { return this.classList.contains('inset'); }
    set inset(value) {
        value = (value === true || value === "true" || value === "");
        const isInset = this.classList.contains('inset');
        if (isInset !== value) {
            if (value) {
                this.classList.add('inset');
            } else {
                this.classList.remove('inset');
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const hasValue = newValue !== null;
        switch (name) {
            case 'checked':
                this.checked = hasValue && newValue !== false;
                break;
            case 'disabled':
                this.disabled = hasValue && newValue !== false;
                break;
            case 'required':
                this.required = hasValue && newValue !== false;
                break;
            case 'readonly':
                this.readonly = hasValue && newValue !== false;
                break;
            case 'tabindex':
                this.tabindex = newValue;
                break;
            case 'title':
                this.title = newValue;
                break;
            case 'value':
                this.value = newValue;
                break;
            case 'label-on':
                this.labelOn = newValue;
                break;
            case 'value-on':
                this.valueOn = newValue;
                break;
            case 'title-on':
                this.titleOn = newValue;
                break;
            case 'label-off':
                this.labelOff = newValue;
                break;
            case 'title-off':
                this.titleOff = newValue;
                break;
            case 'value-off':
                this.valueOff = newValue;
                break;
            case 'indeterminate':
                this.indeterminate = hasValue && newValue !== false;
                break;
            case 'reverse':
                this.reverse = hasValue && newValue !== false;
                break;
            case 'inset':
                this.inset = hasValue && newValue !== false;
                break;
            case 'name':
                this.name = newValue;
                break;
        }
        this._validate();
    }

    _validate() {
        if (this.disabled || this.readonly) {
            this.internals.setValidity({});
            return;
        }
        if (this.required && this.indeterminate) {
            this.internals.setValidity({customError:true}, 'A value must be selected before submission');
        } else {
            this.internals.setValidity({});
        }
    }

    _syncAria() {
      // switch expects aria-checked true/false, and "mixed" for indeterminate is commonly used
      if (this.indeterminate) {
        this.setAttribute('aria-checked', 'mixed');
      } else {
        this.setAttribute('aria-checked', this.checked ? 'true' : 'false');
      }
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      this.setAttribute('aria-readonly', this.readonly ? 'true' : 'false');
    }

    _handleClickAndToggle(value) {
        if (this.disabled || this.readonly) return;
        if (!this._cancelClick) {
            if (this.indeterminate) {
                this.indeterminate = false;
            } else {
                let newValue = (value instanceof Event)?!(this.checked === true):value === !this.reverse;
                this.checked = newValue;
            }
        }
        this._cancelClick = false;
    }
    _handleKeyPress(event) {
        if (event.altKey || event.ctrlKey || this.disabled || this.readonly) return;
        if (event.keyCode == 32 /*space*/) {
            event.preventDefault();
            event.stopPropagation();
            this._handleClickAndToggle(event);
        } else if (event.keyCode == 37 /* left arrow */) {
            event.preventDefault();
            event.stopPropagation();
            this._handleClickAndToggle(true);
        } else if (event.keyCode == 39 /* right arrow */) {
            event.preventDefault();
            event.stopPropagation();
            this._handleClickAndToggle(false);
        }
    }
    _onPointerDown(e) {
        if (this.disabled || this.readonly) return;
        this._dragging = true;
        this._dragStartX = e.clientX;
        this._initialChecked = this.checked;
        this._toggleCtrl.setPointerCapture(e.pointerId);
    }

    _onPointerMove(e) {
        if (!this._dragging || this.disabled || this.readonly) return;
        const dx = e.clientX - this._dragStartX;
        let rect = this._toggleCtrl.getBoundingClientRect();
        const threshold = 3;
        if (Math.abs(dx) > threshold) {
            this._cancelClick = true;
            const dragLeft = e.clientX < rect.left + (rect.width/2) + (dx<0?3:-3);
            const willBeChecked = this.reverse ? !dragLeft : dragLeft;
            this.checked = willBeChecked;
            this.indeterminate = false;
            this._dragStartX = e.clientX;
        }
    }

    _onPointerUp(e) {
        if (!this._dragging || this.disabled || this.readonly) return;
        this._dragging = false;
        this._toggleCtrl.releasePointerCapture(e.pointerId);
    }
    _upgradeProperty(prop,defaultValue) {
        if (this.hasOwnProperty(prop)) {
            let value = this[prop]||defaultValue;
            delete this[prop];
            this[prop] = value;
        } else if(typeof defaultValue != 'undefined') {
            this[prop] = defaultValue;
        }
    }

}
if (window.customElements) {
    customElements.define('wc-toggle-switch', Togglecontrol);
}

if (typeof Vue !== 'undefined' && /^2\./i.test(Vue.version)) {

    // prevent Vue 2 from treating custom element as unknown component
    Vue.config.ignoredElements = Vue.config.ignoredElements || [];
    if (!Vue.config.ignoredElements.includes('wc-toggle-switch')) {  Vue.config.ignoredElements.push('wc-toggle-switch'); }

    const VueToggleSwitch = {
        inheritAttrs: false,
        props: {
            value:   { default: false },  // v-model for Vue2
            indeterminate: { default: false },
            valueOn: { default: 'on' },
            valueOff:{ default: '' }
        },
        computed: {
            modelIsValue() { const v = this.value; return !(v === true || v === false); },
            checked: {
                get() { return this.modelIsValue ? this.value === this.valueOn : this.value === true; },
                set(isChecked) {
                    const next = this.modelIsValue ? (isChecked ? this.valueOn : this.valueOff) : !!isChecked;
                    if (next !== this.value) {
                        this.$emit('input', next);     // Vue2 v-model
                        this.$emit('modified');
                    }
                    this.$emit('change', next);
                }
            }
        },
        methods: {
            onChange(e) { 
                if (e.target.indeterminate !== this.indeterminate) {
                    this.$emit('update:indeterminate', e.target.indeterminate);
                }
                this.checked = !!e.target.checked; 
            }
        },
        template: `<wc-toggle-switch v-bind="$attrs" v-on="$listeners" :indeterminate="indeterminate" :checked="checked" :value-on="valueOn" :value-off="valueOff" @change="onChange"></wc-toggle-switch>`
    };

    if (typeof window !== 'undefined' && window.Vue && typeof window.Vue.component === 'function') { window.Vue.component('wcv-toggle-switch', VueToggleSwitch); }
    window.VueToggleSwitch = { component: VueToggleSwitch, install: function(app) { if (app && typeof app.component === 'function') { app.component('wcv-toggle-switch', VueToggleSwitch); } } };
}
else if (typeof Vue !== 'undefined' && /^3\./i.test(Vue.version)) 
{
    const VueToggleSwitch = {
        inheritAttrs: false,
        emits: ['update:modelValue', 'update:indeterminate', 'change', 'modified'],
        props: {
            modelValue: { default: false },
            indeterminate: { default: false },
            valueOn: { default: 'on' },
            valueOff: { default: '' }
        },
        computed: {
            modelIsValue() { const v = this.modelValue; return !(v === true || v === false); },
            checked: {
                get() { return this.modelIsValue ? this.modelValue === this.valueOn : this.modelValue === true; },
                set(isChecked) {
                    const next = this.modelIsValue ? (isChecked ? this.valueOn : this.valueOff) : !!isChecked;
                    if (next !== this.modelValue) {
                        this.$emit('update:modelValue', next);
                        this.$emit('modified');
                    }
                    this.$emit('change', next);
                    
                }
            }
        },

        methods: {
            onChange(e) { 
                if (e.target.indeterminate !== this.indeterminate) {
                    this.$emit('update:indeterminate', e.target.indeterminate);
                }
                this.checked = !!e.target.checked; 
            }
        },

        template: `<wc-toggle-switch v-bind="$attrs" :indeterminate="indeterminate" :checked="checked" :value-on="valueOn" :value-off="valueOff" @change="onChange"></wc-toggle-switch>`
    };
    window.VueToggleSwitch = { component: VueToggleSwitch, install: function(app) { if (app && typeof app.component === 'function') { app.component('wcv-toggle-switch', VueToggleSwitch); } } };
    if (typeof window !== 'undefined' && window.Vue && typeof window.Vue.component === 'function') { window.Vue.component('wcv-toggle-switch', VueToggleSwitch); }
    else {
        (function autoInstall() {
          if (window.Vue && window.Vue.createApp && window.VueToggleSwitch) {
            const originalCreateApp = window.Vue.createApp;

            window.Vue.createApp = function (...args) {
              const app = originalCreateApp.apply(this, args);

              app.config.compilerOptions ||= {};
              const prev = app.config.compilerOptions.isCustomElement;

              app.config.compilerOptions.isCustomElement = (tag) => {
                // true custom elements you want Vue to ignore
                if (tag === 'wc-toggle-switch') return true;       // web component tag

                // preserve any earlier behavior
                return typeof prev === 'function' ? prev(tag) : false;
              };

              // auto-register Vue component wrapper plugin
              app.use(window.VueToggleSwitch);

              return app;
            };
          }
        })();
    }
}
})();