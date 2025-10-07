(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Alwan = factory());
})(this, (function () { 'use strict';

    const version = "2.2.0";

    const alwanDefaults = {
      id: "",
      classname: "",
      theme: "light",
      parent: "",
      toggle: true,
      popover: true,
      position: "bottom-start",
      margin: 4,
      preset: true,
      color: "#000",
      default: "#000",
      target: "",
      disabled: false,
      format: "rgb",
      singleInput: false,
      inputs: true,
      opacity: true,
      preview: true,
      copy: true,
      swatches: [],
      toggleSwatches: false,
      closeOnScroll: false,
      i18n: {
        picker: "Color picker",
        buttons: {
          copy: "Copy color to clipboard",
          changeFormat: "Change color format",
          swatch: "Color swatch",
          toggleSwatches: "Toggle Swatches"
        },
        sliders: {
          hue: "Change hue",
          alpha: "Change opacity"
        }
      }
    };

    const ROOT = document;
    const DOC_ELEMENT = ROOT.documentElement;
    const DEFAULT_COLOR = "#000";
    const BUTTON = "button";
    const OPEN = "open";
    const CLOSE = "close";
    const COLOR = "color";
    const CLICK = "click";
    const POINTER_DOWN = "pointerdown";
    const POINTER_MOVE = "pointermove";
    const POINTER_UP = "pointerup";
    const SCROLL = "scroll";
    const RESIZE = "resize";
    const KEY_DOWN = "keydown";
    const INPUT = "input";
    const CHANGE = "change";
    const BLUR = "blur";
    const FOCUS_IN = "focusin";
    const MOUSE_LEAVE = "mouseleave";
    const HEX_FORMAT = "hex";
    const RGB_FORMAT = "rgb";
    const HSL_FORMAT = "hsl";
    const TAB = "Tab";
    const ESCAPE = "Escape";
    const ENTER = "Enter";
    const CAPTURE_PHASE = {
      capture: true
    };
    const COLOR_FORMATS = [HEX_FORMAT, RGB_FORMAT, HSL_FORMAT];

    const isString = value => typeof value === "string";
    const isElement = value => value instanceof Element;
    const isNumber = value => Number.isFinite(isString(value) && value.trim() !== "" ? +value : value);
    const getColorObjectFormat = colorObj => [HSL_FORMAT, RGB_FORMAT].find(format => [...format].every(channel => isNumber(colorObj[channel])));

    const {
      keys,
      assign: merge,
      setPrototypeOf,
      prototype
    } = Object;
    const {
      isArray
    } = Array;
    const isPlainObject = obj => obj != null && typeof obj === "object" && !isArray(obj) && !isElement(obj);
    const ObjectForEach = (object, callbackFn) => keys(object).forEach(key => callbackFn(key, object[key]));
    const deepMerge = (target, source) => {
      ObjectForEach(source, (key, value) => {
        merge(target, {
          [key]: isPlainObject(value) ? deepMerge(target[key] || {}, value) : value
        });
      });
      return target;
    };

    const getBody = () => ROOT.body;
    const getElements = (reference, context = DOC_ELEMENT) => {
      if (isString(reference) && reference.trim()) {
        return [...context.querySelectorAll(reference)];
      }
      // Reference must be an element in the page.
      if (isElement(reference)) {
        return [reference];
      }
      return [];
    };
    const getInteractiveElements = context => getElements(`${INPUT},${BUTTON},[tabindex]`, context);
    const createElement = (tagName, className, content, attributes = {}, ariaLabel) => {
      const element = ROOT.createElement(tagName);
      if (className) {
        element.className = className.trim();
      }
      if (content) {
        if (isString(content)) {
          element.innerHTML = content;
        } else {
          element.append(...(isArray(content) ? content : [content]).filter(child => !!child));
        }
      }
      ObjectForEach(ariaLabel ? {
        ...attributes,
        "aria-label": ariaLabel
      } : attributes, (name, value) => {
        if (isNumber(value) || value) {
          element.setAttribute(name, value + "");
        }
      });
      return element;
    };
    const createDivElement = (children, className, ariaLabel) => createElement("div", className, children, {}, ariaLabel);
    const replaceElement = (element, replacement) => {
      if (element && element !== replacement) {
        element.replaceWith(replacement);
      }
      return replacement;
    };
    const createButton = (label = "", className = "", content, title = label) => {
      return createElement(BUTTON, "alwan__button " + className, content, {
        type: BUTTON,
        title
      }, label);
    };
    const createSlider = (ariaLabel, sliderName, max, step = 1) => createElement(INPUT, "alwan__slider alwan__" + sliderName, "", {
      type: "range",
      max,
      step
    }, ariaLabel);
    const setColorProperty = (element, color) => element.style.setProperty("--color", color);
    const toggleModifierClass = (element, token, forced) => element.classList.toggle("alwan--" + token, forced);
    const translate = (element, x, y) => {
      element.style.transform = `translate(${x}px,${y}px)`;
    };
    const getBoundingRectArray = (element, isContentBox) => {
      let {
        x,
        y,
        width,
        height
      } = element.getBoundingClientRect();
      if (isContentBox) {
        x += element.clientLeft - element.scrollLeft;
        y += element.clientTop - element.scrollTop;
      }
      return [x, y, width, height, width + x, height + y];
    };
    const createContainer = children => createDivElement(children, "alwan__container");
    const hideElement = (element, hidden) => element.style.display = hidden ? "none" : "";
    const isContainingBlock = ({
      transform,
      perspective,
      filter,
      containerType,
      backdropFilter,
      willChange,
      contain
    }) => transform !== "none" || perspective !== "none" || containerType !== "normal" || backdropFilter !== "none" || filter !== "none" || willChange && /\b(transform|perspective|filter)\b/.test(willChange) || contain && /\b(paint|layout|strict|content)\b/.test(contain);
    const topLayerSelectors = [":popover-open", ":modal"];
    const isTopLayer = node => isElement(node) && topLayerSelectors.some(selector => {
      try {
        return node.matches(selector);
      } catch (_) {
        return false;
      }
    });
    const getOffsetParentBoundingRect = (node, root) => {
      node = node && node.parentNode;
      if (!node || node === ROOT || isTopLayer(node)) {
        return [0, 0];
      }
      if (node === root) {
        node = root.host;
      }
      if (isElement(node) && isContainingBlock(getComputedStyle(node))) {
        return getBoundingRectArray(node, true);
      }
      return getOffsetParentBoundingRect(node, root);
    };
    const addEvent = (target, type, listener, options) => target.addEventListener(type, listener, options);
    const removeEvent = (target, type, listener) => target.removeEventListener(type, listener);

    const clipboardSVG = `<svg width="18" height="18" viewBox="0 0 24 24" aria-role="none"><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"></path></svg>`;
    const checkSVG = `<svg width="18" height="18" viewBox="0 0 24 24" aria-role="none"><path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"></path></svg>`;
    const switchInputsSVG = `<svg width="15" height="15" viewBox="0 0 20 20" aria-role="none"><path d="M10 1L5 8h10l-5-7zm0 18l5-7H5l5 7z"></path></svg>`;
    const caretSVG = `<svg width="20" height="20" viewBox="0 0 24 24" aria-role="none"><path d="M6.984 14.016l5.016-5.016 5.016 5.016h-10.031z"></path></svg>`;

    const stringify = (color, format = RGB_FORMAT) => format + (format === RGB_FORMAT ? `(${color.r}, ${color.g}, ${color.b}` : `(${color.h}, ${color.s}%, ${color.l}%`) + (color.a < 1 ? `, ${color.a})` : ")");

    const {
      min,
      max,
      abs,
      round,
      PI
    } = Math;
    const clamp = (value, end = 100, start = 0) => value > end ? end : value < start ? start : value;
    const normalizeAngle = angle => {
      angle %= 360;
      return round(angle < 0 ? angle + 360 : angle);
    };
    const toDecimal = hex => parseInt(hex, 16);

    const Inputs = alwan => {
      let {
        config,
        s: colorState
      } = alwan;
      let inputsMap;
      let inputsFormat;
      let isChanged = false;
      const handleChange = () => {
        const color = {};
        if (!isChanged) {
          colorState._cache();
          isChanged = true;
        }
        ObjectForEach(inputsMap, (key, input) => color[key] = input.value);
        colorState._parse(color[inputsFormat] || stringify(color, inputsFormat), true);
      };
      const build = () => {
        inputsMap = {};
        const fields = inputsFormat === HEX_FORMAT || config.singleInput ? [inputsFormat] : [...(inputsFormat + (config.opacity ? "a" : ""))];
        /**
         * returns:
         *
         * <div class="alwan__inputs">
         *     <label>
         *          <input type="text" class="alwan__input">
         *          <span>color component or format</span>
         *     </label>
         *     ...
         * </div>
         */
        return createDivElement(fields.map(field => createElement("label", "", [inputsMap[field] = createElement(INPUT, "alwan__input", [], {
          type: "text",
          value: colorState._value[field]
        }), createElement("span", "", field)])), "alwan__inputs");
      };
      return {
        _render({
          inputs,
          format,
          i18n
        }) {
          let inputsGroup;
          let inputsWrapper;
          let formats = COLOR_FORMATS;
          let switchBtn;
          let inputCount;
          if (inputs !== true) {
            inputs = inputs || {};
            formats = formats.filter(format => inputs[format]);
          }
          inputCount = formats.length;
          // validate the format option.
          formats = inputCount ? formats : COLOR_FORMATS;
          inputsFormat = formats[max(formats.indexOf(format), 0)];
          colorState._setFormat(inputsFormat);
          if (!inputCount) {
            return null;
          }
          if (inputCount > 1) {
            switchBtn = createButton(i18n.buttons.changeFormat, "", switchInputsSVG);
            addEvent(switchBtn, CLICK, () => {
              inputsFormat = formats[(formats.indexOf(inputsFormat) + 1) % inputCount];
              colorState._setFormat(inputsFormat);
              inputsGroup = replaceElement(inputsGroup, build());
            });
          }
          inputsGroup = build();
          inputsWrapper = createDivElement(inputsGroup);
          addEvent(inputsWrapper, INPUT, handleChange);
          addEvent(inputsWrapper, CHANGE, () => {
            colorState._change();
            isChanged = false;
          });
          addEvent(inputsWrapper, FOCUS_IN, e => e.target.select());
          // Pressing Enter causes the picker to close.
          addEvent(inputsWrapper, KEY_DOWN, e => e.key === ENTER && alwan.c._toggle(false));
          return createContainer([inputsWrapper, switchBtn]);
        },
        _setValues(color) {
          if (!isChanged) {
            ObjectForEach(inputsMap || {}, (key, input) => input.value = color[key] + "");
          }
        }
      };
    };

    const ARROW_KEYS_X = {
      ArrowLeft: -1,
      ArrowRight: 1
    };
    const ARROW_KEYS_Y = {
      ArrowUp: -1,
      ArrowDown: 1
    };
    const Selector = ({
      s: colorState
    }) => {
      let selectorEl;
      let cursor;
      let cursorX;
      let cursorY;
      let selectorBounds;
      const sl = {
        s: 0,
        l: 0
      };

      /**
       * Moves curosr using a pointer (mouse, touch or pen) or keyboard arrow keys.
       */
      const moveCursor = (x, y) => {
        let [,, width, height] = selectorBounds;
        let v, l;
        cursorX = x = clamp(x, width);
        cursorY = y = clamp(y, height);
        translate(cursor, x, y);
        v = 1 - y / height;
        l = v * (1 - x / (2 * width));
        sl.s = l === 1 || l === 0 ? 0 : (v - l) / min(l, 1 - l) * 100;
        sl.l = l * 100;
        colorState._update(sl);
      };
      const dragMove = ({
        x,
        y,
        buttons
      }) => {
        if (buttons) {
          moveCursor(x - selectorBounds[0], y - selectorBounds[1]);
        } else {
          dragEnd();
        }
      };
      const dragEnd = () => {
        colorState._change();
        removeEvent(ROOT, POINTER_MOVE, dragMove);
        removeEvent(ROOT, POINTER_UP, dragEnd);
      };
      const dragStart = e => {
        selectorEl.setPointerCapture(e.pointerId);
        colorState._cache();
        selectorBounds = getBoundingRectArray(selectorEl);
        moveCursor(e.x - selectorBounds[0], e.y - selectorBounds[1]);
        addEvent(ROOT, POINTER_MOVE, dragMove);
        addEvent(ROOT, POINTER_UP, dragEnd);
      };
      const handleKeyboard = e => {
        const key = e.key;
        const stepX = ARROW_KEYS_X[key] || 0;
        const stepY = ARROW_KEYS_Y[key] || 0;
        if (stepX || stepY) {
          e.preventDefault();
          selectorBounds = getBoundingRectArray(selectorEl);
          colorState._cache();
          moveCursor(cursorX + stepX * selectorBounds[2] / 100, cursorY + stepY * selectorBounds[3] / 100);
          colorState._change();
        }
      };
      return {
        _render({
          i18n,
          disabled
        }) {
          cursor = createDivElement("", "alwan__cursor");
          selectorEl = createDivElement(cursor, "alwan__selector", i18n.picker || i18n.palette);
          if (!disabled) {
            selectorEl.tabIndex = 0;
            addEvent(selectorEl, POINTER_DOWN, dragStart);
            addEvent(selectorEl, KEY_DOWN, handleKeyboard);
          }
          return selectorEl;
        },
        _updateCursor(s, l) {
          l /= 100;
          s = l + s / 100 * min(l, 1 - l);
          selectorBounds = getBoundingRectArray(selectorEl);
          cursorX = (s ? 2 * (1 - l / s) : 0) * selectorBounds[2];
          cursorY = (1 - s) * selectorBounds[3];
          translate(cursor, cursorX, cursorY);
        }
      };
    };

    const Sliders = ({
      s: colorState,
      e: _events
    }) => {
      let hue;
      let alpha;
      let container;
      return {
        _render({
          opacity,
          i18n: {
            sliders
          }
        }) {
          hue = createSlider(sliders.hue, "hue", 360);
          alpha = opacity ? createSlider(sliders.alpha, "alpha", 1, 0.01) : null;
          container = createDivElement([hue, alpha]);
          addEvent(container, CHANGE, () => _events._emit(CHANGE));
          addEvent(container, INPUT, ({
            target
          }) => colorState._update({
            [target === hue ? "h" : "a"]: target.value
          }));
          return container;
        },
        _setValues(h, a) {
          hue.value = h + "";
          if (alpha) {
            alpha.value = a + "";
          }
        }
      };
    };

    const isCombinedColorLabelObject = value => typeof value === "object" && value !== null && "color" in value;
    const Swatches = alwan => {
      let isCollapsed = false;
      return {
        _render({
          swatches,
          toggleSwatches,
          i18n: {
            buttons
          }
        }) {
          let container;
          let collapseButton;
          let collapseFn;
          if (!isArray(swatches) || !swatches.length) {
            return container;
          }
          container = createDivElement(swatches.map(swatch => {
            const {
              color,
              label
            } = isCombinedColorLabelObject(swatch) ? swatch : {
              color: swatch,
              label: undefined
            };
            const str = isString(color) ? color : stringify(color, getColorObjectFormat(color));
            const button = createButton(buttons.swatch, "alwan__swatch", "", label !== null && label !== void 0 ? label : str);
            setColorProperty(button, str);
            addEvent(button, CLICK, () => alwan.s._parse(str, true, true));
            return button;
          }), "alwan__swatches");
          if (!toggleSwatches) {
            return container;
          }
          collapseFn = (collapse = !isCollapsed) => {
            isCollapsed = collapse;
            toggleModifierClass(container, "collapse", isCollapsed);
            alwan.c._reposition();
          };
          collapseButton = createButton(buttons.toggleSwatches, "alwan__toggle-button", caretSVG);
          addEvent(collapseButton, CLICK, () => collapseFn());
          collapseFn(isCollapsed);
          return createDivElement([container, collapseButton]);
        }
      };
    };

    /**
     * Color preview and copy Button.
     */
    const Utility = alwan => ({
      _render({
        preview,
        copy,
        i18n
      }) {
        let copyButton;
        let setIcon;
        let clipboardIcon;
        let checkIcon;
        let clipboard;
        if (copy) {
          copyButton = createButton(i18n.buttons.copy, "alwan__cp", clipboardSVG + checkSVG);
          [clipboardIcon, checkIcon] = copyButton.children;
          setIcon = isCopied => {
            hideElement(clipboardIcon, isCopied);
            hideElement(checkIcon, !isCopied);
          };
          setIcon(false);
          clipboard = navigator.clipboard;
          if (clipboard) {
            addEvent(copyButton, CLICK, () => clipboard.writeText(alwan.s._toString()).then(() => setIcon(true)));
            addEvent(copyButton, BLUR, () => setIcon());
            addEvent(copyButton, MOUSE_LEAVE, () => copyButton.blur());
          }
        }
        return preview ? createDivElement(copyButton, "alwan__preview") : copyButton;
      }
    });

    const createComponents = alwan => [Selector, Utility, Sliders, Inputs, Swatches].map(component => component(alwan));
    const renderComponents = (components, config) => components.map(component => isArray(component) ? createContainer(renderComponents(component, config)) : component._render(config));

    // Indexes in the DOMRectArray.
    const LEFT = 0; // Also the x coordinate.
    const TOP = 1; // Also the y coordinate.
    const HEIGHT = 3;
    const RIGHT = 4;
    const BOTTOM = 5;
    const START = 0;
    const CENTER = 1;
    const END = 2;
    // Margin between the popover and the window edges.
    const GAP = 3;

    // Sides to fallback to for each side.
    const fallbackSides = {
      top: [TOP, BOTTOM, RIGHT, LEFT],
      bottom: [BOTTOM, TOP, RIGHT, LEFT],
      right: [RIGHT, LEFT, TOP, BOTTOM],
      left: [LEFT, RIGHT, TOP, BOTTOM]
    };

    // Alignments to fallback to for each alignment.
    const fallbackAlignments = {
      start: [START, CENTER, END],
      center: [CENTER, START, END],
      end: [END, CENTER, START]
    };
    const createPopover = (target, floating, ref, {
      margin,
      position,
      closeOnScroll,
      toggle,
      disabled
    }, {
      _toggle,
      _isOpen
    }) => {
      margin = isNumber(margin) ? +margin : 0;
      let isTargetVisible;
      let isFloatingVisible = _isOpen();
      let rootNode = target.getRootNode();
      const [side, alignment] = isString(position) ? position.split("-") : [];
      const floatingStyle = floating.style;
      const shadowRoot = rootNode instanceof ShadowRoot ? rootNode : null;
      const focusableElements = getInteractiveElements(floating);
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements.pop();
      const updatePosition = () => {
        const viewport = [DOC_ELEMENT.clientWidth, DOC_ELEMENT.clientHeight];
        const targetRect = getBoundingRectArray(target);
        const floatingRect = getBoundingRectArray(floating);
        const offsetParentRect = getOffsetParentBoundingRect(floating, shadowRoot);
        const coordinates = [-1, -1];
        floatingStyle.height = "";

        // No need to update if the target element is not in the viewport.
        if (!isFloatingVisible || !isTargetVisible || targetRect[RIGHT] < 0 || targetRect[BOTTOM] < 0 || targetRect[LEFT] > viewport[0] /* viewport width */ || targetRect[TOP] > viewport[1] /* viewport height */) {
          return;
        }
        (fallbackSides[side] || fallbackSides.bottom).some(side => {
          // side is number:
          // 0 -> Left.
          // 1 -> Top.
          // 4 -> Right.
          // 5 -> Bottom.
          // axis can be 0 (x) or 1 (y).
          // axis + 2 -> width or height.
          // axis + 4 -> Right or Left bounds.
          let axis = side % 2;
          let point = targetRect[side] + (side <= 1 ? -floatingRect[axis + 2] - margin : margin);
          if (point < 0 || point + floatingRect[axis + 2] + margin > viewport[axis]) {
            return false;
          }
          coordinates[axis] = point;
          // Reverse the axis for the alignments.
          axis = +!axis;
          return (fallbackAlignments[alignment] || fallbackAlignments.center).some(alignment => {
            point = alignment === START ? targetRect[axis] : targetRect[axis + 4] - (alignment === END ? floatingRect[axis + 2] : (floatingRect[axis + 2] + targetRect[axis + 2]) / 2);
            if (point < 0 || point + floatingRect[axis + 2] > viewport[axis]) {
              return false;
            }
            coordinates[axis] = point;
            return true;
          });
        });
        translate(floating, ...coordinates.map((value, axis) => {
          // Set a dynamic height if the popover height is greater than
          // the viewport height.
          if (axis && value === -1 && floatingRect[HEIGHT] > viewport[axis]) {
            floatingStyle.height = viewport[axis] - GAP * 2 + "px";
            floatingRect[HEIGHT] = viewport[axis] - GAP;
          }
          return round((value >= 0 ? value :
          // center the popover relative to the viewport.
          (viewport[axis] - floatingRect[axis + 2]) / 2) - offsetParentRect[axis]);
        }));
      };
      if (toggle) {
        addEvent(floating, KEY_DOWN, e => {
          let {
            key,
            target,
            shiftKey
          } = e;
          let focusElement;
          if (key === ESCAPE) {
            _toggle(false);
          } else if (key === TAB) {
            if (target === firstFocusableElement && shiftKey) {
              focusElement = lastFocusableElement;
            } else if (target === lastFocusableElement && !shiftKey) {
              focusElement = firstFocusableElement;
            }
            if (focusElement) {
              focusElement.focus();
              e.preventDefault();
            }
          }
        });
      }

      // We don't close if one of these elements is in the event's composed path.
      const excludedTargets = [floating, ref, ...(ref.labels || [])];
      const closeByPointer = e => {
        const path = e.composedPath();
        if (isFloatingVisible && !excludedTargets.some(el => path.includes(el))) {
          _toggle(false);
        }
      };
      const observer = new IntersectionObserver(([entry]) => {
        isTargetVisible = entry.isIntersecting;
        // When the popover target becomes visible:
        //   - Open it if toggle is false, otherwise restore its previous state.
        // otherwise:
        //   - Close it.
        _toggle(!disabled && isTargetVisible && (!toggle || isFloatingVisible), true);
      });
      const updatePositionOnScroll = ({
        target: t
      }) => {
        if (shadowRoot && t.contains(shadowRoot.host) || t.contains(target)) {
          updatePosition();
          if (closeOnScroll) {
            _toggle(false);
          }
        }
      };

      /**
       * Adds/Removes events.
       */
      const bindEventListeners = fn => {
        fn(window, RESIZE, updatePosition);
        fn(ROOT, SCROLL, updatePositionOnScroll, CAPTURE_PHASE);
        fn(ROOT, POINTER_DOWN, closeByPointer);
        if (shadowRoot) {
          fn(shadowRoot, SCROLL, updatePositionOnScroll, CAPTURE_PHASE);
        }
      };
      observer.observe(target);
      bindEventListeners(addEvent);
      return {
        _isVisible: () => isTargetVisible,
        _reposition(isOpenNow, wasOpenBefore) {
          isFloatingVisible = isOpenNow;
          if (isTargetVisible) {
            updatePosition();
            if (toggle && wasOpenBefore !== isOpenNow) {
              (isOpenNow ? firstFocusableElement : ref).focus();
            }
          }
        },
        _destroy() {
          floatingStyle.cssText = "";
          observer.unobserve(target);
          bindEventListeners(removeEvent);
        }
      };
    };

    const refController = (userRef, toggleFn) => {
      const button = createButton();
      const className = button.className + " alwan__ref ";
      let ref;
      if (userRef && userRef.id) {
        button.id = userRef.id;
      }
      return {
        _getEl(config) {
          ref = replaceElement(ref || userRef, config.preset || !userRef ? button : userRef);
          if (ref === button) {
            ref.className = (className + config.classname).trim();
            if (!ref.parentNode) {
              getBody().append(ref);
            }
          }
          addEvent(ref, CLICK, toggleFn);
          return ref;
        },
        _remove() {
          if (userRef) {
            removeEvent(userRef, CLICK, toggleFn);
            replaceElement(ref, userRef);
          } else {
            ref.remove();
          }
        }
      };
    };

    const controller = (alwan, userRef) => {
      let innerEl = createDivElement();
      let isOpen = false;
      let popoverInstance = null;
      let ref;
      const {
        config,
        s: colorState
      } = alwan;
      const refCtrl = refController(userRef, () => alwan.toggle());
      const root = createDivElement(innerEl, "alwan");
      const [selector, utility, sliders, inputs, swatches] = createComponents(alwan);
      colorState._setHooks(
      // On update.
      color => {
        setColorProperty(ref, color.rgb);
        innerEl.style.cssText = `--rgb:${color.r},${color.g},${color.b};--a:${color.a};--h:${color.h}`;
        inputs._setValues(color);
      },
      // On setcolor.
      ({
        a,
        h,
        s,
        l
      }) => {
        sliders._setValues(h, a);
        selector._updateCursor(s, l);
      });
      return {
        _setup(options) {
          const self = this;
          const {
            id,
            color = colorState._value.hsl
          } = options;
          const {
            theme,
            parent,
            toggle,
            popover,
            target,
            disabled
          } = deepMerge(config, options);
          ref = refCtrl._getEl(config);
          let parentEl = getElements(parent)[0];
          let targetEl = getElements(target)[0] || ref;
          id && (root.id = id);
          toggleModifierClass(root, "dark", theme === "dark");
          toggleModifierClass(root, "block", !popover);
          innerEl = replaceElement(innerEl, createDivElement(renderComponents([selector, [utility, sliders], inputs, swatches], config)));

          // Hide reference element if both toggle and popover options are set to false,
          hideElement(ref, !popover && !toggle);
          if (popoverInstance) {
            popoverInstance._destroy();
            popoverInstance = null;
          }
          if (popover) {
            parentEl = parentEl || toggle && getBody();
            popoverInstance = createPopover(targetEl, root, ref, config, self);
          } else {
            // Open if toggle is false, or leave it as the previous state if
            // the color picker is not disabled.
            self._toggle(!toggle || !disabled && isOpen, true);
          }
          parentEl ? parentEl.append(root) : targetEl.after(root);
          if (disabled) {
            [ref, ...getInteractiveElements(root)].forEach(element => {
              element.disabled = true;
            });
          }
          colorState._parse(color);
        },
        _toggle(state = !isOpen, forced = false) {
          if (state !== isOpen && (!popoverInstance || popoverInstance._isVisible()) && !config.disabled && config.toggle || forced) {
            toggleModifierClass(root, OPEN, state);
            if (popoverInstance) {
              popoverInstance._reposition(state, isOpen);
            }
            isOpen = state;
            alwan.e._emit(isOpen ? OPEN : CLOSE);
          }
        },
        _isOpen: () => isOpen,
        _reposition() {
          if (popoverInstance) {
            popoverInstance._reposition(isOpen, isOpen);
          }
        },
        _destroy() {
          root.remove();
          if (popoverInstance) {
            popoverInstance._destroy();
          }
          refCtrl._remove();
        }
      };
    };

    const decimalToHex = decimal => (decimal < 16 ? "0" : "") + decimal.toString(16);
    const RGBToHEX = ({
      r,
      g,
      b,
      a
    }) => "#" + decimalToHex(r) + decimalToHex(g) + decimalToHex(b) + (a < 1 ? decimalToHex(round(a * 255)) : "");

    /**
     * Helper function used for converting HSL to RGB.
     */
    const fn = (k, s, l) => {
      k %= 12;
      return round((l - s * min(l, 1 - l) * max(-1, min(k - 3, 9 - k, 1))) * 255);
    };
    const HSLToRGB = ({
      h,
      s,
      l,
      a
    }) => {
      h /= 30;
      s /= 100;
      l /= 100;
      return {
        r: fn(h, s, l),
        g: fn(h + 8, s, l),
        b: fn(h + 4, s, l),
        a
      };
    };
    const RGBToHSL = ({
      r,
      g,
      b,
      a
    }) => {
      r /= 255;
      g /= 255;
      b /= 255;
      const cMax = max(r, g, b);
      const cMin = min(r, g, b);
      const d = cMax - cMin;
      const l = (cMax + cMin) / 2;
      const h = d === 0 ? 0 : cMax === r ? (g - b) / d % 6 : cMax === g ? (b - r) / d + 2 : cMax === b ? (r - g) / d + 4 : 0;
      return {
        h: normalizeAngle(h * 60),
        s: d ? d / (1 - abs(2 * l - 1)) * 100 : 0,
        l: l * 100,
        a
      };
    };

    const ctx = createElement("canvas").getContext("2d");
    const ANGLE_COEFFICIENT_MAP = {
      turn: 360,
      rad: 180 / PI,
      grad: 0.9
    };
    const HSL_REGEX = /a?\(\s*([+-]?\d*\.?\d+)(\w*)?\s*[\s,]\s*([+-]?\d*\.?\d+)%?\s*,?\s*([+-]?\d*\.?\d+)%?(?:\s*[\/,]\s*([+-]?\d*\.?\d+)(%)?)?\s*\)?$/;
    const parseColor = (color, opacity) => {
      let rgb;
      let hsl;
      let format;
      let str = "";
      if (isString(color)) {
        str = color.trim();
      } else if (isPlainObject(color)) {
        format = getColorObjectFormat(color);
        if (format) {
          str = stringify(color, format);
        }
      }
      if (/^hsl/.test(str)) {
        const [isHSL, h, angle, s, l, a = "1", percentage] = HSL_REGEX.exec(str) || [];
        if (isHSL) {
          hsl = {
            h: normalizeAngle(+h * (ANGLE_COEFFICIENT_MAP[angle] || 1)),
            s: clamp(+s),
            l: clamp(+l),
            a: clamp(+a / (percentage ? 100 : 1), 1)
          };
        }
      }
      if (!hsl) {
        // # is optional.
        if (/^[\da-f]+$/i.test(str)) {
          str = "#" + str;
        }
        ctx.fillStyle = DEFAULT_COLOR;
        ctx.fillStyle = str;
        str = ctx.fillStyle;
        if (str[0] === "#") {
          rgb = {
            r: toDecimal(str[1] + str[2]),
            g: toDecimal(str[3] + str[4]),
            b: toDecimal(str[5] + str[6]),
            a: 1
          };
        } else {
          const [r, g, b, a] = str.match(/[\d\.]+/g).map(Number);
          rgb = {
            r,
            g,
            b,
            a
          };
        }
        hsl = RGBToHSL(rgb);
      }
      hsl.a = opacity ? round(hsl.a * 100) / 100 : 1;
      if (rgb) {
        rgb.a = hsl.a;
      }
      return [hsl, rgb];
    };

    const colorState = alwan => {
      const state = {
        h: 0,
        s: 0,
        l: 0,
        r: 0,
        g: 0,
        b: 0,
        a: 1,
        rgb: "",
        hsl: "",
        hex: ""
      };
      const config = alwan.config;
      const emitEvent = alwan.e._emit;
      let onUpdate;
      let onSetColor;
      let currentFormat;
      let cashedColor;
      return {
        _value: state,
        _toString: () => state[currentFormat],
        _setHooks(onUpdateFn, onSetColorFn) {
          onUpdate = onUpdateFn;
          onSetColor = onSetColorFn;
        },
        _setFormat(format) {
          currentFormat = config.format = format;
        },
        _update(hsl, rgb, emitColor = true, emitChange) {
          const previousHex = state.hex;
          merge(state, hsl);
          merge(state, rgb || HSLToRGB(state));
          state.s = round(state.s);
          state.l = round(state.l);
          state.rgb = stringify(state);
          state.hsl = stringify(state, HSL_FORMAT);
          state.hex = RGBToHEX(state);
          onUpdate(state);
          if (previousHex !== state.hex) {
            emitColor && emitEvent(COLOR, state);
            emitChange && emitEvent(CHANGE, state);
          }
        },
        _parse(color, emitColor = false, emitChange) {
          this._update(...parseColor(color, config.opacity), emitColor, emitChange);
          onSetColor(state);
        },
        _cache() {
          cashedColor = state[currentFormat];
        },
        /**
         * Emit change event if the color have changed compared to the cashed color.
         */
        _change() {
          if (cashedColor !== state[currentFormat]) {
            emitEvent(CHANGE, state);
          }
        }
      };
    };

    const eventEmitter = alwan => {
      const listeners = {
        [OPEN]: [],
        [CLOSE]: [],
        [CHANGE]: [],
        [COLOR]: []
      };
      return {
        _emit(type, value = alwan.s._value) {
          (listeners[type] || []).forEach(listener => listener(merge({
            type,
            source: alwan
          }, value)));
        },
        _on(event, listener) {
          if (listener && !(listeners[event] || []).includes(listener)) {
            listeners[event].push(listener);
          }
        },
        _off(event, listener) {
          if (!event) {
            // Remove all listeners.
            ObjectForEach(listeners, event => {
              listeners[event] = [];
            });
          } else if (listeners[event]) {
            if (listener) {
              listeners[event] = listeners[event].filter(fn => fn !== listener);
            } else {
              // Remove all listeners of the given event.
              listeners[event] = [];
            }
          }
        }
      };
    };

    class Alwan {
      static version() {
        return version;
      }
      static setDefaults(defaults) {
        deepMerge(alwanDefaults, defaults);
      }
      constructor(reference, options) {
        this.config = deepMerge({}, alwanDefaults);
        this.e = eventEmitter(this);
        this.s = colorState(this);
        this.c = controller(this, getElements(reference)[0]);
        this.c._setup(options || {});
      }
      setOptions(options) {
        options && this.c._setup(options);
      }
      setColor(color) {
        this.s._parse(color);
        return this;
      }
      getColor() {
        return {
          ...this.s._value
        };
      }
      isOpen() {
        return this.c._isOpen();
      }
      open() {
        this.c._toggle(true);
      }
      close() {
        this.c._toggle(false);
      }
      toggle() {
        this.c._toggle();
      }
      on(type, listener) {
        this.e._on(type, listener);
      }
      off(type, listener) {
        this.e._off(type, listener);
      }
      addSwatches(...swatches) {
        this.c._setup({
          swatches: this.config.swatches.concat(swatches)
        });
      }
      removeSwatches(...swatches) {
        this.c._setup({
          swatches: this.config.swatches.filter((swatch, index) => !swatches.some(item => isNumber(item) ? +item === index : item === swatch))
        });
      }
      enable() {
        this.c._setup({
          disabled: false
        });
      }
      disable() {
        this.c._setup({
          disabled: true
        });
      }
      reset() {
        this.s._parse(this.config.default);
      }
      reposition() {
        this.c._reposition();
      }
      trigger(type) {
        this.e._emit(type);
      }
      destroy() {
        this.c._destroy();
        ObjectForEach(this, key => {
          this[key] = null;
        });
        setPrototypeOf(this, prototype);
      }
    }

    return Alwan;

}));
