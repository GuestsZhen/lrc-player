import {
  require_react
} from "./chunk-WQJA6ET6.js";
import {
  __commonJS,
  __toESM
} from "./chunk-5WRI5ZAA.js";

// node_modules/.pnpm/react@18.3.1/node_modules/react/cjs/react-jsx-runtime.development.js
var require_react_jsx_runtime_development = __commonJS({
  "node_modules/.pnpm/react@18.3.1/node_modules/react/cjs/react-jsx-runtime.development.js"(exports) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        var React = require_react();
        var REACT_ELEMENT_TYPE = Symbol.for("react.element");
        var REACT_PORTAL_TYPE = Symbol.for("react.portal");
        var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
        var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
        var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
        var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
        var REACT_CONTEXT_TYPE = Symbol.for("react.context");
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
        var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
        var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        function error(format) {
          {
            {
              for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
              }
              printWarning("error", format, args);
            }
          }
        }
        function printWarning(level, format, args) {
          {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return String(item);
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
        var enableScopeAPI = false;
        var enableCacheElement = false;
        var enableTransitionTracing = false;
        var enableLegacyHidden = false;
        var enableDebugTracing = false;
        var REACT_MODULE_REFERENCE;
        {
          REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
        }
        function isValidElementType(type) {
          if (typeof type === "string" || typeof type === "function") {
            return true;
          }
          if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
            return true;
          }
          if (typeof type === "object" && type !== null) {
            if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
            // types supported by any Flight configuration anywhere since
            // we don't know which Flight build this will end up being used
            // with.
            type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
              return true;
            }
          }
          return false;
        }
        function getWrappedName(outerType, innerType, wrapperName) {
          var displayName = outerType.displayName;
          if (displayName) {
            return displayName;
          }
          var functionName = innerType.displayName || innerType.name || "";
          return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
        }
        function getContextName(type) {
          return type.displayName || "Context";
        }
        function getComponentNameFromType(type) {
          if (type == null) {
            return null;
          }
          {
            if (typeof type.tag === "number") {
              error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
            }
          }
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                  return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentNameFromType(init(payload));
                } catch (x) {
                  return null;
                }
              }
            }
          }
          return null;
        }
        var assign = Object.assign;
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;
        function disabledLog() {
        }
        disabledLog.__reactDisabledLog = true;
        function disableLogs() {
          {
            if (disabledDepth === 0) {
              prevLog = console.log;
              prevInfo = console.info;
              prevWarn = console.warn;
              prevError = console.error;
              prevGroup = console.group;
              prevGroupCollapsed = console.groupCollapsed;
              prevGroupEnd = console.groupEnd;
              var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
              };
              Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
              });
            }
            disabledDepth++;
          }
        }
        function reenableLogs() {
          {
            disabledDepth--;
            if (disabledDepth === 0) {
              var props = {
                configurable: true,
                enumerable: true,
                writable: true
              };
              Object.defineProperties(console, {
                log: assign({}, props, {
                  value: prevLog
                }),
                info: assign({}, props, {
                  value: prevInfo
                }),
                warn: assign({}, props, {
                  value: prevWarn
                }),
                error: assign({}, props, {
                  value: prevError
                }),
                group: assign({}, props, {
                  value: prevGroup
                }),
                groupCollapsed: assign({}, props, {
                  value: prevGroupCollapsed
                }),
                groupEnd: assign({}, props, {
                  value: prevGroupEnd
                })
              });
            }
            if (disabledDepth < 0) {
              error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
            }
          }
        }
        var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
        var prefix;
        function describeBuiltInComponentFrame(name, source, ownerFn) {
          {
            if (prefix === void 0) {
              try {
                throw Error();
              } catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
              }
            }
            return "\n" + prefix + name;
          }
        }
        var reentry = false;
        var componentFrameCache;
        {
          var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
          componentFrameCache = new PossiblyWeakMap();
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) {
            return "";
          }
          {
            var frame = componentFrameCache.get(fn);
            if (frame !== void 0) {
              return frame;
            }
          }
          var control;
          reentry = true;
          var previousPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher;
          {
            previousDispatcher = ReactCurrentDispatcher.current;
            ReactCurrentDispatcher.current = null;
            disableLogs();
          }
          try {
            if (construct) {
              var Fake = function() {
                throw Error();
              };
              Object.defineProperty(Fake.prototype, "props", {
                set: function() {
                  throw Error();
                }
              });
              if (typeof Reflect === "object" && Reflect.construct) {
                try {
                  Reflect.construct(Fake, []);
                } catch (x) {
                  control = x;
                }
                Reflect.construct(fn, [], Fake);
              } else {
                try {
                  Fake.call();
                } catch (x) {
                  control = x;
                }
                fn.call(Fake.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (x) {
                control = x;
              }
              fn();
            }
          } catch (sample) {
            if (sample && control && typeof sample.stack === "string") {
              var sampleLines = sample.stack.split("\n");
              var controlLines = control.stack.split("\n");
              var s2 = sampleLines.length - 1;
              var c3 = controlLines.length - 1;
              while (s2 >= 1 && c3 >= 0 && sampleLines[s2] !== controlLines[c3]) {
                c3--;
              }
              for (; s2 >= 1 && c3 >= 0; s2--, c3--) {
                if (sampleLines[s2] !== controlLines[c3]) {
                  if (s2 !== 1 || c3 !== 1) {
                    do {
                      s2--;
                      c3--;
                      if (c3 < 0 || sampleLines[s2] !== controlLines[c3]) {
                        var _frame = "\n" + sampleLines[s2].replace(" at new ", " at ");
                        if (fn.displayName && _frame.includes("<anonymous>")) {
                          _frame = _frame.replace("<anonymous>", fn.displayName);
                        }
                        {
                          if (typeof fn === "function") {
                            componentFrameCache.set(fn, _frame);
                          }
                        }
                        return _frame;
                      }
                    } while (s2 >= 1 && c3 >= 0);
                  }
                  break;
                }
              }
            }
          } finally {
            reentry = false;
            {
              ReactCurrentDispatcher.current = previousDispatcher;
              reenableLogs();
            }
            Error.prepareStackTrace = previousPrepareStackTrace;
          }
          var name = fn ? fn.displayName || fn.name : "";
          var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
          {
            if (typeof fn === "function") {
              componentFrameCache.set(fn, syntheticFrame);
            }
          }
          return syntheticFrame;
        }
        function describeFunctionComponentFrame(fn, source, ownerFn) {
          {
            return describeNativeComponentFrame(fn, false);
          }
        }
        function shouldConstruct(Component) {
          var prototype = Component.prototype;
          return !!(prototype && prototype.isReactComponent);
        }
        function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
          if (type == null) {
            return "";
          }
          if (typeof type === "function") {
            {
              return describeNativeComponentFrame(type, shouldConstruct(type));
            }
          }
          if (typeof type === "string") {
            return describeBuiltInComponentFrame(type);
          }
          switch (type) {
            case REACT_SUSPENSE_TYPE:
              return describeBuiltInComponentFrame("Suspense");
            case REACT_SUSPENSE_LIST_TYPE:
              return describeBuiltInComponentFrame("SuspenseList");
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render);
              case REACT_MEMO_TYPE:
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                } catch (x) {
                }
              }
            }
          }
          return "";
        }
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var loggedTypeFailures = {};
        var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame.setExtraStackFrame(null);
            }
          }
        }
        function checkPropTypes(typeSpecs, values, location, componentName, element) {
          {
            var has = Function.call.bind(hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has(typeSpecs, typeSpecName)) {
                var error$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error$1 = ex;
                }
                if (error$1 && !(error$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error("Failed %s type: %s", location, error$1.message);
                  setCurrentlyValidatingElement(null);
                }
              }
            }
          }
        }
        var isArrayImpl = Array.isArray;
        function isArray(a3) {
          return isArrayImpl(a3);
        }
        function typeName(value) {
          {
            var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
            var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            return type;
          }
        }
        function willCoercionThrow(value) {
          {
            try {
              testStringCoercion(value);
              return false;
            } catch (e3) {
              return true;
            }
          }
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
        var RESERVED_PROPS = {
          key: true,
          ref: true,
          __self: true,
          __source: true
        };
        var specialPropKeyWarningShown;
        var specialPropRefWarningShown;
        var didWarnAboutStringRefs;
        {
          didWarnAboutStringRefs = {};
        }
        function hasValidRef(config) {
          {
            if (hasOwnProperty.call(config, "ref")) {
              var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.ref !== void 0;
        }
        function hasValidKey(config) {
          {
            if (hasOwnProperty.call(config, "key")) {
              var getter = Object.getOwnPropertyDescriptor(config, "key").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.key !== void 0;
        }
        function warnIfStringRefCannotBeAutoConverted(config, self) {
          {
            if (typeof config.ref === "string" && ReactCurrentOwner.current && self && ReactCurrentOwner.current.stateNode !== self) {
              var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
              if (!didWarnAboutStringRefs[componentName]) {
                error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', getComponentNameFromType(ReactCurrentOwner.current.type), config.ref);
                didWarnAboutStringRefs[componentName] = true;
              }
            }
          }
        }
        function defineKeyPropWarningGetter(props, displayName) {
          {
            var warnAboutAccessingKey = function() {
              if (!specialPropKeyWarningShown) {
                specialPropKeyWarningShown = true;
                error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            };
            warnAboutAccessingKey.isReactWarning = true;
            Object.defineProperty(props, "key", {
              get: warnAboutAccessingKey,
              configurable: true
            });
          }
        }
        function defineRefPropWarningGetter(props, displayName) {
          {
            var warnAboutAccessingRef = function() {
              if (!specialPropRefWarningShown) {
                specialPropRefWarningShown = true;
                error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            };
            warnAboutAccessingRef.isReactWarning = true;
            Object.defineProperty(props, "ref", {
              get: warnAboutAccessingRef,
              configurable: true
            });
          }
        }
        var ReactElement = function(type, key, ref, self, source, owner, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            $$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner
          };
          {
            element._store = {};
            Object.defineProperty(element._store, "validated", {
              configurable: false,
              enumerable: false,
              writable: true,
              value: false
            });
            Object.defineProperty(element, "_self", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: self
            });
            Object.defineProperty(element, "_source", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: source
            });
            if (Object.freeze) {
              Object.freeze(element.props);
              Object.freeze(element);
            }
          }
          return element;
        };
        function jsxDEV(type, config, maybeKey, source, self) {
          {
            var propName;
            var props = {};
            var key = null;
            var ref = null;
            if (maybeKey !== void 0) {
              {
                checkKeyStringCoercion(maybeKey);
              }
              key = "" + maybeKey;
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            if (hasValidRef(config)) {
              ref = config.ref;
              warnIfStringRefCannotBeAutoConverted(config, self);
            }
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = config[propName];
              }
            }
            if (type && type.defaultProps) {
              var defaultProps = type.defaultProps;
              for (propName in defaultProps) {
                if (props[propName] === void 0) {
                  props[propName] = defaultProps[propName];
                }
              }
            }
            if (key || ref) {
              var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
              if (key) {
                defineKeyPropWarningGetter(props, displayName);
              }
              if (ref) {
                defineRefPropWarningGetter(props, displayName);
              }
            }
            return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
          }
        }
        var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
        var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement$1(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame$1.setExtraStackFrame(null);
            }
          }
        }
        var propTypesMisspellWarningShown;
        {
          propTypesMisspellWarningShown = false;
        }
        function isValidElement(object) {
          {
            return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
          }
        }
        function getDeclarationErrorAddendum() {
          {
            if (ReactCurrentOwner$1.current) {
              var name = getComponentNameFromType(ReactCurrentOwner$1.current.type);
              if (name) {
                return "\n\nCheck the render method of `" + name + "`.";
              }
            }
            return "";
          }
        }
        function getSourceInfoErrorAddendum(source) {
          {
            if (source !== void 0) {
              var fileName = source.fileName.replace(/^.*[\\\/]/, "");
              var lineNumber = source.lineNumber;
              return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
            }
            return "";
          }
        }
        var ownerHasKeyUseWarning = {};
        function getCurrentComponentErrorInfo(parentType) {
          {
            var info = getDeclarationErrorAddendum();
            if (!info) {
              var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
              if (parentName) {
                info = "\n\nCheck the top-level render call using <" + parentName + ">.";
              }
            }
            return info;
          }
        }
        function validateExplicitKey(element, parentType) {
          {
            if (!element._store || element._store.validated || element.key != null) {
              return;
            }
            element._store.validated = true;
            var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
            if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
              return;
            }
            ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
            var childOwner = "";
            if (element && element._owner && element._owner !== ReactCurrentOwner$1.current) {
              childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
            }
            setCurrentlyValidatingElement$1(element);
            error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
            setCurrentlyValidatingElement$1(null);
          }
        }
        function validateChildKeys(node, parentType) {
          {
            if (typeof node !== "object") {
              return;
            }
            if (isArray(node)) {
              for (var i3 = 0; i3 < node.length; i3++) {
                var child = node[i3];
                if (isValidElement(child)) {
                  validateExplicitKey(child, parentType);
                }
              }
            } else if (isValidElement(node)) {
              if (node._store) {
                node._store.validated = true;
              }
            } else if (node) {
              var iteratorFn = getIteratorFn(node);
              if (typeof iteratorFn === "function") {
                if (iteratorFn !== node.entries) {
                  var iterator = iteratorFn.call(node);
                  var step;
                  while (!(step = iterator.next()).done) {
                    if (isValidElement(step.value)) {
                      validateExplicitKey(step.value, parentType);
                    }
                  }
                }
              }
            }
          }
        }
        function validatePropTypes(element) {
          {
            var type = element.type;
            if (type === null || type === void 0 || typeof type === "string") {
              return;
            }
            var propTypes;
            if (typeof type === "function") {
              propTypes = type.propTypes;
            } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
            // Inner props are checked in the reconciler.
            type.$$typeof === REACT_MEMO_TYPE)) {
              propTypes = type.propTypes;
            } else {
              return;
            }
            if (propTypes) {
              var name = getComponentNameFromType(type);
              checkPropTypes(propTypes, element.props, "prop", name, element);
            } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
              propTypesMisspellWarningShown = true;
              var _name = getComponentNameFromType(type);
              error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
            }
            if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
              error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
            }
          }
        }
        function validateFragmentProps(fragment) {
          {
            var keys = Object.keys(fragment.props);
            for (var i3 = 0; i3 < keys.length; i3++) {
              var key = keys[i3];
              if (key !== "children" && key !== "key") {
                setCurrentlyValidatingElement$1(fragment);
                error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                setCurrentlyValidatingElement$1(null);
                break;
              }
            }
            if (fragment.ref !== null) {
              setCurrentlyValidatingElement$1(fragment);
              error("Invalid attribute `ref` supplied to `React.Fragment`.");
              setCurrentlyValidatingElement$1(null);
            }
          }
        }
        var didWarnAboutKeySpread = {};
        function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
          {
            var validType = isValidElementType(type);
            if (!validType) {
              var info = "";
              if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
              }
              var sourceInfo = getSourceInfoErrorAddendum(source);
              if (sourceInfo) {
                info += sourceInfo;
              } else {
                info += getDeclarationErrorAddendum();
              }
              var typeString;
              if (type === null) {
                typeString = "null";
              } else if (isArray(type)) {
                typeString = "array";
              } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
                typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
                info = " Did you accidentally export a JSX literal instead of a component?";
              } else {
                typeString = typeof type;
              }
              error("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
            }
            var element = jsxDEV(type, props, key, source, self);
            if (element == null) {
              return element;
            }
            if (validType) {
              var children = props.children;
              if (children !== void 0) {
                if (isStaticChildren) {
                  if (isArray(children)) {
                    for (var i3 = 0; i3 < children.length; i3++) {
                      validateChildKeys(children[i3], type);
                    }
                    if (Object.freeze) {
                      Object.freeze(children);
                    }
                  } else {
                    error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
                  }
                } else {
                  validateChildKeys(children, type);
                }
              }
            }
            {
              if (hasOwnProperty.call(props, "key")) {
                var componentName = getComponentNameFromType(type);
                var keys = Object.keys(props).filter(function(k) {
                  return k !== "key";
                });
                var beforeExample = keys.length > 0 ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
                if (!didWarnAboutKeySpread[componentName + beforeExample]) {
                  var afterExample = keys.length > 0 ? "{" + keys.join(": ..., ") + ": ...}" : "{}";
                  error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', beforeExample, componentName, afterExample, componentName);
                  didWarnAboutKeySpread[componentName + beforeExample] = true;
                }
              }
            }
            if (type === REACT_FRAGMENT_TYPE) {
              validateFragmentProps(element);
            } else {
              validatePropTypes(element);
            }
            return element;
          }
        }
        function jsxWithValidationStatic(type, props, key) {
          {
            return jsxWithValidation(type, props, key, true);
          }
        }
        function jsxWithValidationDynamic(type, props, key) {
          {
            return jsxWithValidation(type, props, key, false);
          }
        }
        var jsx = jsxWithValidationDynamic;
        var jsxs = jsxWithValidationStatic;
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.jsx = jsx;
        exports.jsxs = jsxs;
      })();
    }
  }
});

// node_modules/.pnpm/react@18.3.1/node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "node_modules/.pnpm/react@18.3.1/node_modules/react/jsx-runtime.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_jsx_runtime_development();
    }
  }
});

// node_modules/.pnpm/@wavesurfer+react@1.0.11_react@18.3.1_wavesurfer.js@7.11.1/node_modules/@wavesurfer/react/dist/index.js
var import_jsx_runtime = __toESM(require_jsx_runtime());
var import_react = __toESM(require_react());

// node_modules/.pnpm/wavesurfer.js@7.11.1/node_modules/wavesurfer.js/dist/wavesurfer.esm.js
function t(t3, e3, i3, n3) {
  return new (i3 || (i3 = Promise))(function(s2, r3) {
    function o3(t4) {
      try {
        h2(n3.next(t4));
      } catch (t5) {
        r3(t5);
      }
    }
    function a3(t4) {
      try {
        h2(n3.throw(t4));
      } catch (t5) {
        r3(t5);
      }
    }
    function h2(t4) {
      var e4;
      t4.done ? s2(t4.value) : (e4 = t4.value, e4 instanceof i3 ? e4 : new i3(function(t5) {
        t5(e4);
      })).then(o3, a3);
    }
    h2((n3 = n3.apply(t3, e3 || [])).next());
  });
}
var e = class {
  constructor() {
    this.listeners = {};
  }
  on(t3, e3, i3) {
    if (this.listeners[t3] || (this.listeners[t3] = /* @__PURE__ */ new Set()), null == i3 ? void 0 : i3.once) {
      const i4 = (...n3) => {
        this.un(t3, i4), e3(...n3);
      };
      return this.listeners[t3].add(i4), () => this.un(t3, i4);
    }
    return this.listeners[t3].add(e3), () => this.un(t3, e3);
  }
  un(t3, e3) {
    var i3;
    null === (i3 = this.listeners[t3]) || void 0 === i3 || i3.delete(e3);
  }
  once(t3, e3) {
    return this.on(t3, e3, { once: true });
  }
  unAll() {
    this.listeners = {};
  }
  emit(t3, ...e3) {
    this.listeners[t3] && this.listeners[t3].forEach((t4) => t4(...e3));
  }
};
var i = { decode: function(e3, i3) {
  return t(this, void 0, void 0, function* () {
    const t3 = new AudioContext({ sampleRate: i3 });
    try {
      return yield t3.decodeAudioData(e3);
    } finally {
      t3.close();
    }
  });
}, createBuffer: function(t3, e3) {
  if (!t3 || 0 === t3.length) throw new Error("channelData must be a non-empty array");
  if (e3 <= 0) throw new Error("duration must be greater than 0");
  if ("number" == typeof t3[0] && (t3 = [t3]), !t3[0] || 0 === t3[0].length) throw new Error("channelData must contain non-empty channel arrays");
  !function(t4) {
    const e4 = t4[0];
    if (e4.some((t5) => t5 > 1 || t5 < -1)) {
      const i4 = e4.length;
      let n3 = 0;
      for (let t5 = 0; t5 < i4; t5++) {
        const i5 = Math.abs(e4[t5]);
        i5 > n3 && (n3 = i5);
      }
      for (const e5 of t4) for (let t5 = 0; t5 < i4; t5++) e5[t5] /= n3;
    }
  }(t3);
  const i3 = t3.map((t4) => t4 instanceof Float32Array ? t4 : Float32Array.from(t4));
  return { duration: e3, length: i3[0].length, sampleRate: i3[0].length / e3, numberOfChannels: i3.length, getChannelData: (t4) => {
    const e4 = i3[t4];
    if (!e4) throw new Error(`Channel ${t4} not found`);
    return e4;
  }, copyFromChannel: AudioBuffer.prototype.copyFromChannel, copyToChannel: AudioBuffer.prototype.copyToChannel };
} };
function n(t3, e3) {
  const i3 = e3.xmlns ? document.createElementNS(e3.xmlns, t3) : document.createElement(t3);
  for (const [t4, s2] of Object.entries(e3)) if ("children" === t4 && s2) for (const [t5, e4] of Object.entries(s2)) e4 instanceof Node ? i3.appendChild(e4) : "string" == typeof e4 ? i3.appendChild(document.createTextNode(e4)) : i3.appendChild(n(t5, e4));
  else "style" === t4 ? Object.assign(i3.style, s2) : "textContent" === t4 ? i3.textContent = s2 : i3.setAttribute(t4, s2.toString());
  return i3;
}
function s(t3, e3, i3) {
  const s2 = n(t3, e3 || {});
  return null == i3 || i3.appendChild(s2), s2;
}
var r = Object.freeze({ __proto__: null, createElement: s, default: s });
var o = { fetchBlob: function(e3, i3, n3) {
  return t(this, void 0, void 0, function* () {
    const s2 = yield fetch(e3, n3);
    if (s2.status >= 400) throw new Error(`Failed to fetch ${e3}: ${s2.status} (${s2.statusText})`);
    return function(e4, i4) {
      t(this, void 0, void 0, function* () {
        if (!e4.body || !e4.headers) return;
        const t3 = e4.body.getReader(), n4 = Number(e4.headers.get("Content-Length")) || 0;
        let s3 = 0;
        const r3 = (t4) => {
          s3 += (null == t4 ? void 0 : t4.length) || 0;
          const e5 = Math.round(s3 / n4 * 100);
          i4(e5);
        };
        try {
          for (; ; ) {
            const e5 = yield t3.read();
            if (e5.done) break;
            r3(e5.value);
          }
        } catch (t4) {
          console.warn("Progress tracking error:", t4);
        }
      });
    }(s2.clone(), i3), s2.blob();
  });
} };
var a = class extends e {
  constructor(t3) {
    super(), this.isExternalMedia = false, t3.media ? (this.media = t3.media, this.isExternalMedia = true) : this.media = document.createElement("audio"), t3.mediaControls && (this.media.controls = true), t3.autoplay && (this.media.autoplay = true), null != t3.playbackRate && this.onMediaEvent("canplay", () => {
      null != t3.playbackRate && (this.media.playbackRate = t3.playbackRate);
    }, { once: true });
  }
  onMediaEvent(t3, e3, i3) {
    return this.media.addEventListener(t3, e3, i3), () => this.media.removeEventListener(t3, e3, i3);
  }
  getSrc() {
    return this.media.currentSrc || this.media.src || "";
  }
  revokeSrc() {
    const t3 = this.getSrc();
    t3.startsWith("blob:") && URL.revokeObjectURL(t3);
  }
  canPlayType(t3) {
    return "" !== this.media.canPlayType(t3);
  }
  setSrc(t3, e3) {
    const i3 = this.getSrc();
    if (t3 && i3 === t3) return;
    this.revokeSrc();
    const n3 = e3 instanceof Blob && (this.canPlayType(e3.type) || !t3) ? URL.createObjectURL(e3) : t3;
    if (i3 && this.media.removeAttribute("src"), n3 || t3) try {
      this.media.src = n3;
    } catch (e4) {
      this.media.src = t3;
    }
  }
  destroy() {
    this.isExternalMedia || (this.media.pause(), this.revokeSrc(), this.media.removeAttribute("src"), this.media.load(), this.media.remove());
  }
  setMediaElement(t3) {
    this.media = t3;
  }
  play() {
    return t(this, void 0, void 0, function* () {
      try {
        return yield this.media.play();
      } catch (t3) {
        if (t3 instanceof DOMException && "AbortError" === t3.name) return;
        throw t3;
      }
    });
  }
  pause() {
    this.media.pause();
  }
  isPlaying() {
    return !this.media.paused && !this.media.ended;
  }
  setTime(t3) {
    this.media.currentTime = Math.max(0, Math.min(t3, this.getDuration()));
  }
  getDuration() {
    return this.media.duration;
  }
  getCurrentTime() {
    return this.media.currentTime;
  }
  getVolume() {
    return this.media.volume;
  }
  setVolume(t3) {
    this.media.volume = t3;
  }
  getMuted() {
    return this.media.muted;
  }
  setMuted(t3) {
    this.media.muted = t3;
  }
  getPlaybackRate() {
    return this.media.playbackRate;
  }
  isSeeking() {
    return this.media.seeking;
  }
  setPlaybackRate(t3, e3) {
    null != e3 && (this.media.preservesPitch = e3), this.media.playbackRate = t3;
  }
  getMediaElement() {
    return this.media;
  }
  setSinkId(t3) {
    return this.media.setSinkId(t3);
  }
};
function h(t3) {
  return t3 < 0 ? 0 : t3 > 1 ? 1 : t3;
}
function l({ maxTop: t3, maxBottom: e3, halfHeight: i3, vScale: n3 }) {
  const s2 = Math.round(t3 * i3 * n3);
  return { topHeight: s2, totalHeight: s2 + Math.round(e3 * i3 * n3) || 1 };
}
function c({ barAlign: t3, halfHeight: e3, topHeight: i3, totalHeight: n3, canvasHeight: s2 }) {
  return "top" === t3 ? 0 : "bottom" === t3 ? s2 - n3 : e3 - i3;
}
function d(t3, e3, i3) {
  const n3 = e3 - t3.left, s2 = i3 - t3.top;
  return [n3 / t3.width, s2 / t3.height];
}
function u(t3) {
  return Boolean(t3.barWidth || t3.barGap || t3.barAlign);
}
function p(t3, e3) {
  if (!u(e3)) return t3;
  const i3 = e3.barWidth || 0.5, n3 = i3 + (e3.barGap || i3 / 2);
  return 0 === n3 ? t3 : Math.floor(t3 / n3) * n3;
}
function m({ scrollLeft: t3, totalWidth: e3, numCanvases: i3 }) {
  if (0 === e3) return [0];
  const n3 = t3 / e3, s2 = Math.floor(n3 * i3);
  return [s2 - 1, s2, s2 + 1];
}
function f({ scrollLeft: t3, clientWidth: e3, scrollWidth: i3 }) {
  if (0 === i3) return { startX: 0, endX: 0 };
  return { startX: t3 / i3, endX: (t3 + e3) / i3 };
}
var g = class extends e {
  constructor(t3, e3) {
    super(), this.timeouts = [], this.isScrollable = false, this.audioData = null, this.resizeObserver = null, this.lastContainerWidth = 0, this.isDragging = false, this.subscriptions = [], this.unsubscribeOnScroll = [], this.dragUnsubscribe = null, this.subscriptions = [], this.options = t3;
    const i3 = this.parentFromOptionsContainer(t3.container);
    this.parent = i3;
    const [n3, s2] = this.initHtml();
    i3.appendChild(n3), this.container = n3, this.scrollContainer = s2.querySelector(".scroll"), this.wrapper = s2.querySelector(".wrapper"), this.canvasWrapper = s2.querySelector(".canvases"), this.progressWrapper = s2.querySelector(".progress"), this.cursor = s2.querySelector(".cursor"), e3 && s2.appendChild(e3), this.initEvents();
  }
  parentFromOptionsContainer(t3) {
    let e3;
    if ("string" == typeof t3 ? e3 = document.querySelector(t3) : t3 instanceof HTMLElement && (e3 = t3), !e3) throw new Error("Container not found");
    return e3;
  }
  initEvents() {
    if (this.wrapper.addEventListener("click", (t3) => {
      const e3 = this.wrapper.getBoundingClientRect(), [i3, n3] = d(e3, t3.clientX, t3.clientY);
      this.emit("click", i3, n3);
    }), this.wrapper.addEventListener("dblclick", (t3) => {
      const e3 = this.wrapper.getBoundingClientRect(), [i3, n3] = d(e3, t3.clientX, t3.clientY);
      this.emit("dblclick", i3, n3);
    }), true !== this.options.dragToSeek && "object" != typeof this.options.dragToSeek || this.initDrag(), this.scrollContainer.addEventListener("scroll", () => {
      const { scrollLeft: t3, scrollWidth: e3, clientWidth: i3 } = this.scrollContainer, { startX: n3, endX: s2 } = f({ scrollLeft: t3, scrollWidth: e3, clientWidth: i3 });
      this.emit("scroll", n3, s2, t3, t3 + i3);
    }), "function" == typeof ResizeObserver) {
      const t3 = this.createDelay(100);
      this.resizeObserver = new ResizeObserver(() => {
        t3().then(() => this.onContainerResize()).catch(() => {
        });
      }), this.resizeObserver.observe(this.scrollContainer);
    }
  }
  onContainerResize() {
    const t3 = this.parent.clientWidth;
    t3 === this.lastContainerWidth && "auto" !== this.options.height || (this.lastContainerWidth = t3, this.reRender(), this.emit("resize"));
  }
  initDrag() {
    this.dragUnsubscribe || (this.dragUnsubscribe = function(t3, e3, i3, n3, s2 = 3, r3 = 0, o3 = 100) {
      if (!t3) return () => {
      };
      const a3 = /* @__PURE__ */ new Map(), h2 = matchMedia("(pointer: coarse)").matches;
      let l3 = () => {
      };
      const c3 = (c4) => {
        if (c4.button !== r3) return;
        if (a3.set(c4.pointerId, c4), a3.size > 1) return;
        let d2 = c4.clientX, u3 = c4.clientY, p3 = false;
        const m2 = Date.now(), f3 = (n4) => {
          if (n4.defaultPrevented || a3.size > 1) return;
          if (h2 && Date.now() - m2 < o3) return;
          const r4 = n4.clientX, l4 = n4.clientY, c5 = r4 - d2, f4 = l4 - u3;
          if (p3 || Math.abs(c5) > s2 || Math.abs(f4) > s2) {
            n4.preventDefault(), n4.stopPropagation();
            const s3 = t3.getBoundingClientRect(), { left: o4, top: a4 } = s3;
            p3 || (null == i3 || i3(d2 - o4, u3 - a4), p3 = true), e3(c5, f4, r4 - o4, l4 - a4), d2 = r4, u3 = l4;
          }
        }, g2 = (e4) => {
          if (a3.delete(e4.pointerId), p3) {
            const i4 = e4.clientX, s3 = e4.clientY, r4 = t3.getBoundingClientRect(), { left: o4, top: a4 } = r4;
            null == n3 || n3(i4 - o4, s3 - a4);
          }
          l3();
        }, v2 = (t4) => {
          a3.delete(t4.pointerId), t4.relatedTarget && t4.relatedTarget !== document.documentElement || g2(t4);
        }, b2 = (t4) => {
          p3 && (t4.stopPropagation(), t4.preventDefault());
        }, y2 = (t4) => {
          t4.defaultPrevented || a3.size > 1 || p3 && t4.preventDefault();
        };
        document.addEventListener("pointermove", f3), document.addEventListener("pointerup", g2), document.addEventListener("pointerout", v2), document.addEventListener("pointercancel", v2), document.addEventListener("touchmove", y2, { passive: false }), document.addEventListener("click", b2, { capture: true }), l3 = () => {
          document.removeEventListener("pointermove", f3), document.removeEventListener("pointerup", g2), document.removeEventListener("pointerout", v2), document.removeEventListener("pointercancel", v2), document.removeEventListener("touchmove", y2), setTimeout(() => {
            document.removeEventListener("click", b2, { capture: true });
          }, 10);
        };
      };
      return t3.addEventListener("pointerdown", c3), () => {
        l3(), t3.removeEventListener("pointerdown", c3), a3.clear();
      };
    }(this.wrapper, (t3, e3, i3) => {
      const n3 = this.wrapper.getBoundingClientRect().width;
      this.emit("drag", h(i3 / n3));
    }, (t3) => {
      this.isDragging = true;
      const e3 = this.wrapper.getBoundingClientRect().width;
      this.emit("dragstart", h(t3 / e3));
    }, (t3) => {
      this.isDragging = false;
      const e3 = this.wrapper.getBoundingClientRect().width;
      this.emit("dragend", h(t3 / e3));
    }), this.subscriptions.push(this.dragUnsubscribe));
  }
  initHtml() {
    const t3 = document.createElement("div"), e3 = t3.attachShadow({ mode: "open" }), i3 = this.options.cspNonce && "string" == typeof this.options.cspNonce ? this.options.cspNonce.replace(/"/g, "") : "";
    return e3.innerHTML = `
      <style${i3 ? ` nonce="${i3}"` : ""}>
        :host {
          user-select: none;
          min-width: 1px;
        }
        :host audio {
          display: block;
          width: 100%;
        }
        :host .scroll {
          overflow-x: auto;
          overflow-y: hidden;
          width: 100%;
          position: relative;
        }
        :host .noScrollbar {
          scrollbar-color: transparent;
          scrollbar-width: none;
        }
        :host .noScrollbar::-webkit-scrollbar {
          display: none;
          -webkit-appearance: none;
        }
        :host .wrapper {
          position: relative;
          overflow: visible;
          z-index: 2;
        }
        :host .canvases {
          min-height: ${this.getHeight(this.options.height, this.options.splitChannels)}px;
          pointer-events: none;
        }
        :host .canvases > div {
          position: relative;
        }
        :host canvas {
          display: block;
          position: absolute;
          top: 0;
          image-rendering: pixelated;
        }
        :host .progress {
          pointer-events: none;
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 0;
          height: 100%;
          overflow: hidden;
        }
        :host .progress > div {
          position: relative;
        }
        :host .cursor {
          pointer-events: none;
          position: absolute;
          z-index: 5;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 2px;
        }
      </style>

      <div class="scroll" part="scroll">
        <div class="wrapper" part="wrapper">
          <div class="canvases" part="canvases"></div>
          <div class="progress" part="progress"></div>
          <div class="cursor" part="cursor"></div>
        </div>
      </div>
    `, [t3, e3];
  }
  setOptions(t3) {
    if (this.options.container !== t3.container) {
      const e3 = this.parentFromOptionsContainer(t3.container);
      e3.appendChild(this.container), this.parent = e3;
    }
    true !== t3.dragToSeek && "object" != typeof this.options.dragToSeek || this.initDrag(), this.options = t3, this.reRender();
  }
  getWrapper() {
    return this.wrapper;
  }
  getWidth() {
    return this.scrollContainer.clientWidth;
  }
  getScroll() {
    return this.scrollContainer.scrollLeft;
  }
  setScroll(t3) {
    this.scrollContainer.scrollLeft = t3;
  }
  setScrollPercentage(t3) {
    const { scrollWidth: e3 } = this.scrollContainer, i3 = e3 * t3;
    this.setScroll(i3);
  }
  destroy() {
    var t3;
    this.subscriptions.forEach((t4) => t4()), this.container.remove(), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), null === (t3 = this.unsubscribeOnScroll) || void 0 === t3 || t3.forEach((t4) => t4()), this.unsubscribeOnScroll = [];
  }
  createDelay(t3 = 10) {
    let e3, i3;
    const n3 = () => {
      e3 && (clearTimeout(e3), e3 = void 0), i3 && (i3(), i3 = void 0);
    };
    return this.timeouts.push(n3), () => new Promise((s2, r3) => {
      n3(), i3 = r3, e3 = setTimeout(() => {
        e3 = void 0, i3 = void 0, s2();
      }, t3);
    });
  }
  getHeight(t3, e3) {
    var i3;
    const n3 = (null === (i3 = this.audioData) || void 0 === i3 ? void 0 : i3.numberOfChannels) || 1;
    return function({ optionsHeight: t4, optionsSplitChannels: e4, parentHeight: i4, numberOfChannels: n4, defaultHeight: s2 = 128 }) {
      if (null == t4) return s2;
      const r3 = Number(t4);
      if (!isNaN(r3)) return r3;
      if ("auto" === t4) {
        const t5 = i4 || s2;
        return (null == e4 ? void 0 : e4.every((t6) => !t6.overlay)) ? t5 / n4 : t5;
      }
      return s2;
    }({ optionsHeight: t3, optionsSplitChannels: e3, parentHeight: this.parent.clientHeight, numberOfChannels: n3, defaultHeight: 128 });
  }
  convertColorValues(t3) {
    return function(t4, e3) {
      if (!Array.isArray(t4)) return t4 || "";
      if (0 === t4.length) return "#999";
      if (t4.length < 2) return t4[0] || "";
      const i3 = document.createElement("canvas"), n3 = i3.getContext("2d"), s2 = i3.height * e3, r3 = n3.createLinearGradient(0, 0, 0, s2 || e3), o3 = 1 / (t4.length - 1);
      return t4.forEach((t5, e4) => {
        r3.addColorStop(e4 * o3, t5);
      }), r3;
    }(t3, this.getPixelRatio());
  }
  getPixelRatio() {
    return t3 = window.devicePixelRatio, Math.max(1, t3 || 1);
    var t3;
  }
  renderBarWaveform(t3, e3, i3, n3) {
    const { width: s2, height: r3 } = i3.canvas, { halfHeight: o3, barWidth: a3, barRadius: h2, barIndexScale: d2, barSpacing: u3 } = function({ width: t4, height: e4, length: i4, options: n4, pixelRatio: s3 }) {
      const r4 = e4 / 2, o4 = n4.barWidth ? n4.barWidth * s3 : 1, a4 = n4.barGap ? n4.barGap * s3 : n4.barWidth ? o4 / 2 : 0, h3 = o4 + a4 || 1;
      return { halfHeight: r4, barWidth: o4, barGap: a4, barRadius: n4.barRadius || 0, barIndexScale: i4 > 0 ? t4 / h3 / i4 : 0, barSpacing: h3 };
    }({ width: s2, height: r3, length: (t3[0] || []).length, options: e3, pixelRatio: this.getPixelRatio() }), p3 = function({ channelData: t4, barIndexScale: e4, barSpacing: i4, barWidth: n4, halfHeight: s3, vScale: r4, canvasHeight: o4, barAlign: a4 }) {
      const h3 = t4[0] || [], d3 = t4[1] || h3, u4 = h3.length, p4 = [];
      let m2 = 0, f3 = 0, g2 = 0;
      for (let t5 = 0; t5 <= u4; t5++) {
        const u5 = Math.round(t5 * e4);
        if (u5 > m2) {
          const { topHeight: t6, totalHeight: e5 } = l({ maxTop: f3, maxBottom: g2, halfHeight: s3, vScale: r4 }), h4 = c({ barAlign: a4, halfHeight: s3, topHeight: t6, totalHeight: e5, canvasHeight: o4 });
          p4.push({ x: m2 * i4, y: h4, width: n4, height: e5 }), m2 = u5, f3 = 0, g2 = 0;
        }
        const v2 = Math.abs(h3[t5] || 0), b2 = Math.abs(d3[t5] || 0);
        v2 > f3 && (f3 = v2), b2 > g2 && (g2 = b2);
      }
      return p4;
    }({ channelData: t3, barIndexScale: d2, barSpacing: u3, barWidth: a3, halfHeight: o3, vScale: n3, canvasHeight: r3, barAlign: e3.barAlign });
    i3.beginPath();
    for (const t4 of p3) h2 && "roundRect" in i3 ? i3.roundRect(t4.x, t4.y, t4.width, t4.height, h2) : i3.rect(t4.x, t4.y, t4.width, t4.height);
    i3.fill(), i3.closePath();
  }
  renderLineWaveform(t3, e3, i3, n3) {
    const { width: s2, height: r3 } = i3.canvas, o3 = function({ channelData: t4, width: e4, height: i4, vScale: n4 }) {
      const s3 = i4 / 2, r4 = t4[0] || [];
      return [r4, t4[1] || r4].map((t5, i5) => {
        const r5 = t5.length, o4 = r5 ? e4 / r5 : 0, a3 = s3, h2 = 0 === i5 ? -1 : 1, l3 = [{ x: 0, y: a3 }];
        let c3 = 0, d2 = 0;
        for (let e5 = 0; e5 <= r5; e5++) {
          const i6 = Math.round(e5 * o4);
          if (i6 > c3) {
            const t6 = a3 + (Math.round(d2 * s3 * n4) || 1) * h2;
            l3.push({ x: c3, y: t6 }), c3 = i6, d2 = 0;
          }
          const r6 = Math.abs(t5[e5] || 0);
          r6 > d2 && (d2 = r6);
        }
        return l3.push({ x: c3, y: a3 }), l3;
      });
    }({ channelData: t3, width: s2, height: r3, vScale: n3 });
    i3.beginPath();
    for (const t4 of o3) if (t4.length) {
      i3.moveTo(t4[0].x, t4[0].y);
      for (let e4 = 1; e4 < t4.length; e4++) {
        const n4 = t4[e4];
        i3.lineTo(n4.x, n4.y);
      }
    }
    i3.fill(), i3.closePath();
  }
  renderWaveform(t3, e3, i3) {
    if (i3.fillStyle = this.convertColorValues(e3.waveColor), e3.renderFunction) return void e3.renderFunction(t3, i3);
    const n3 = function({ channelData: t4, barHeight: e4, normalize: i4 }) {
      var n4;
      const s2 = e4 || 1;
      if (!i4) return s2;
      const r3 = t4[0];
      if (!r3 || 0 === r3.length) return s2;
      let o3 = 0;
      for (let t5 = 0; t5 < r3.length; t5++) {
        const e5 = null !== (n4 = r3[t5]) && void 0 !== n4 ? n4 : 0, i5 = Math.abs(e5);
        i5 > o3 && (o3 = i5);
      }
      return o3 ? s2 / o3 : s2;
    }({ channelData: t3, barHeight: e3.barHeight, normalize: e3.normalize });
    u(e3) ? this.renderBarWaveform(t3, e3, i3, n3) : this.renderLineWaveform(t3, e3, i3, n3);
  }
  renderSingleCanvas(t3, e3, i3, n3, s2, r3, o3) {
    const a3 = this.getPixelRatio(), h2 = document.createElement("canvas");
    h2.width = Math.round(i3 * a3), h2.height = Math.round(n3 * a3), h2.style.width = `${i3}px`, h2.style.height = `${n3}px`, h2.style.left = `${Math.round(s2)}px`, r3.appendChild(h2);
    const l3 = h2.getContext("2d");
    if (e3.renderFunction ? (l3.fillStyle = this.convertColorValues(e3.waveColor), e3.renderFunction(t3, l3)) : this.renderWaveform(t3, e3, l3), h2.width > 0 && h2.height > 0) {
      const t4 = h2.cloneNode(), i4 = t4.getContext("2d");
      i4.drawImage(h2, 0, 0), i4.globalCompositeOperation = "source-in", i4.fillStyle = this.convertColorValues(e3.progressColor), i4.fillRect(0, 0, h2.width, h2.height), o3.appendChild(t4);
    }
  }
  renderMultiCanvas(t3, e3, i3, n3, s2, r3) {
    const o3 = this.getPixelRatio(), { clientWidth: a3 } = this.scrollContainer, h2 = i3 / o3, l3 = function({ clientWidth: t4, totalWidth: e4, options: i4 }) {
      return p(Math.min(8e3, t4, e4), i4);
    }({ clientWidth: a3, totalWidth: h2, options: e3 });
    let c3 = {};
    if (0 === l3) return;
    const d2 = (i4) => {
      if (i4 < 0 || i4 >= u3) return;
      if (c3[i4]) return;
      c3[i4] = true;
      const o4 = i4 * l3;
      let a4 = Math.min(h2 - o4, l3);
      if (a4 = p(a4, e3), a4 <= 0) return;
      const d3 = function({ channelData: t4, offset: e4, clampedWidth: i5, totalWidth: n4 }) {
        return t4.map((t5) => {
          const s3 = Math.floor(e4 / n4 * t5.length), r4 = Math.floor((e4 + i5) / n4 * t5.length);
          return t5.slice(s3, r4);
        });
      }({ channelData: t3, offset: o4, clampedWidth: a4, totalWidth: h2 });
      this.renderSingleCanvas(d3, e3, a4, n3, o4, s2, r3);
    }, u3 = Math.ceil(h2 / l3);
    if (!this.isScrollable) {
      for (let t4 = 0; t4 < u3; t4++) d2(t4);
      return;
    }
    if (m({ scrollLeft: this.scrollContainer.scrollLeft, totalWidth: h2, numCanvases: u3 }).forEach((t4) => d2(t4)), u3 > 1) {
      const t4 = this.on("scroll", () => {
        const { scrollLeft: t5 } = this.scrollContainer;
        Object.keys(c3).length > 10 && (s2.innerHTML = "", r3.innerHTML = "", c3 = {}), m({ scrollLeft: t5, totalWidth: h2, numCanvases: u3 }).forEach((t6) => d2(t6));
      });
      this.unsubscribeOnScroll.push(t4);
    }
  }
  renderChannel(t3, e3, i3, n3) {
    var { overlay: s2 } = e3, r3 = function(t4, e4) {
      var i4 = {};
      for (var n4 in t4) Object.prototype.hasOwnProperty.call(t4, n4) && e4.indexOf(n4) < 0 && (i4[n4] = t4[n4]);
      if (null != t4 && "function" == typeof Object.getOwnPropertySymbols) {
        var s3 = 0;
        for (n4 = Object.getOwnPropertySymbols(t4); s3 < n4.length; s3++) e4.indexOf(n4[s3]) < 0 && Object.prototype.propertyIsEnumerable.call(t4, n4[s3]) && (i4[n4[s3]] = t4[n4[s3]]);
      }
      return i4;
    }(e3, ["overlay"]);
    const o3 = document.createElement("div"), a3 = this.getHeight(r3.height, r3.splitChannels);
    o3.style.height = `${a3}px`, s2 && n3 > 0 && (o3.style.marginTop = `-${a3}px`), this.canvasWrapper.style.minHeight = `${a3}px`, this.canvasWrapper.appendChild(o3);
    const h2 = o3.cloneNode();
    this.progressWrapper.appendChild(h2), this.renderMultiCanvas(t3, r3, i3, a3, o3, h2);
  }
  render(e3) {
    return t(this, void 0, void 0, function* () {
      var t3;
      this.timeouts.forEach((t4) => t4()), this.timeouts = [], this.canvasWrapper.innerHTML = "", this.progressWrapper.innerHTML = "", null != this.options.width && (this.scrollContainer.style.width = "number" == typeof this.options.width ? `${this.options.width}px` : this.options.width);
      const i3 = this.getPixelRatio(), n3 = this.scrollContainer.clientWidth, { scrollWidth: s2, isScrollable: r3, useParentWidth: o3, width: a3 } = function({ duration: t4, minPxPerSec: e4 = 0, parentWidth: i4, fillParent: n4, pixelRatio: s3 }) {
        const r4 = Math.ceil(t4 * e4), o4 = r4 > i4, a4 = Boolean(n4 && !o4);
        return { scrollWidth: r4, isScrollable: o4, useParentWidth: a4, width: (a4 ? i4 : r4) * s3 };
      }({ duration: e3.duration, minPxPerSec: this.options.minPxPerSec || 0, parentWidth: n3, fillParent: this.options.fillParent, pixelRatio: i3 });
      if (this.isScrollable = r3, this.wrapper.style.width = o3 ? "100%" : `${s2}px`, this.scrollContainer.style.overflowX = this.isScrollable ? "auto" : "hidden", this.scrollContainer.classList.toggle("noScrollbar", !!this.options.hideScrollbar), this.cursor.style.backgroundColor = `${this.options.cursorColor || this.options.progressColor}`, this.cursor.style.width = `${this.options.cursorWidth}px`, this.audioData = e3, this.emit("render"), this.options.splitChannels) for (let i4 = 0; i4 < e3.numberOfChannels; i4++) {
        const n4 = Object.assign(Object.assign({}, this.options), null === (t3 = this.options.splitChannels) || void 0 === t3 ? void 0 : t3[i4]);
        this.renderChannel([e3.getChannelData(i4)], n4, a3, i4);
      }
      else {
        const t4 = [e3.getChannelData(0)];
        e3.numberOfChannels > 1 && t4.push(e3.getChannelData(1)), this.renderChannel(t4, this.options, a3, 0);
      }
      Promise.resolve().then(() => this.emit("rendered"));
    });
  }
  reRender() {
    if (this.unsubscribeOnScroll.forEach((t4) => t4()), this.unsubscribeOnScroll = [], !this.audioData) return;
    const { scrollWidth: t3 } = this.scrollContainer, { right: e3 } = this.progressWrapper.getBoundingClientRect();
    if (this.render(this.audioData), this.isScrollable && t3 !== this.scrollContainer.scrollWidth) {
      const { right: t4 } = this.progressWrapper.getBoundingClientRect(), i3 = function(t5) {
        const e4 = 2 * t5;
        return (e4 < 0 ? Math.floor(e4) : Math.ceil(e4)) / 2;
      }(t4 - e3);
      this.scrollContainer.scrollLeft += i3;
    }
  }
  zoom(t3) {
    this.options.minPxPerSec = t3, this.reRender();
  }
  scrollIntoView(t3, e3 = false) {
    const { scrollLeft: i3, scrollWidth: n3, clientWidth: s2 } = this.scrollContainer, r3 = t3 * n3, o3 = i3, a3 = i3 + s2, h2 = s2 / 2;
    if (this.isDragging) {
      const t4 = 30;
      r3 + t4 > a3 ? this.scrollContainer.scrollLeft += t4 : r3 - t4 < o3 && (this.scrollContainer.scrollLeft -= t4);
    } else {
      (r3 < o3 || r3 > a3) && (this.scrollContainer.scrollLeft = r3 - (this.options.autoCenter ? h2 : 0));
      const t4 = r3 - i3 - h2;
      e3 && this.options.autoCenter && t4 > 0 && (this.scrollContainer.scrollLeft += t4);
    }
    {
      const t4 = this.scrollContainer.scrollLeft, { startX: e4, endX: i4 } = f({ scrollLeft: t4, scrollWidth: n3, clientWidth: s2 });
      this.emit("scroll", e4, i4, t4, t4 + s2);
    }
  }
  renderProgress(t3, e3) {
    if (isNaN(t3)) return;
    const i3 = 100 * t3;
    this.canvasWrapper.style.clipPath = `polygon(${i3}% 0%, 100% 0%, 100% 100%, ${i3}% 100%)`, this.progressWrapper.style.width = `${i3}%`, this.cursor.style.left = `${i3}%`, this.cursor.style.transform = this.options.cursorWidth ? `translateX(-${t3 * this.options.cursorWidth}px)` : "", this.isScrollable && this.options.autoScroll && this.scrollIntoView(t3, e3);
  }
  exportImage(e3, i3, n3) {
    return t(this, void 0, void 0, function* () {
      const t3 = this.canvasWrapper.querySelectorAll("canvas");
      if (!t3.length) throw new Error("No waveform data");
      if ("dataURL" === n3) {
        const n4 = Array.from(t3).map((t4) => t4.toDataURL(e3, i3));
        return Promise.resolve(n4);
      }
      return Promise.all(Array.from(t3).map((t4) => new Promise((n4, s2) => {
        t4.toBlob((t5) => {
          t5 ? n4(t5) : s2(new Error("Could not export image"));
        }, e3, i3);
      })));
    });
  }
};
var v = class extends e {
  constructor() {
    super(...arguments), this.animationFrameId = null, this.isRunning = false;
  }
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const t3 = () => {
      this.isRunning && (this.emit("tick"), this.animationFrameId = requestAnimationFrame(t3));
    };
    t3();
  }
  stop() {
    this.isRunning = false, null !== this.animationFrameId && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = null);
  }
  destroy() {
    this.stop();
  }
};
var b = class extends e {
  constructor(t3 = new AudioContext()) {
    super(), this.bufferNode = null, this.playStartTime = 0, this.playedDuration = 0, this._muted = false, this._playbackRate = 1, this._duration = void 0, this.buffer = null, this.currentSrc = "", this.paused = true, this.crossOrigin = null, this.seeking = false, this.autoplay = false, this.addEventListener = this.on, this.removeEventListener = this.un, this.audioContext = t3, this.gainNode = this.audioContext.createGain(), this.gainNode.connect(this.audioContext.destination);
  }
  load() {
    return t(this, void 0, void 0, function* () {
    });
  }
  get src() {
    return this.currentSrc;
  }
  set src(t3) {
    if (this.currentSrc = t3, this._duration = void 0, !t3) return this.buffer = null, void this.emit("emptied");
    fetch(t3).then((e3) => {
      if (e3.status >= 400) throw new Error(`Failed to fetch ${t3}: ${e3.status} (${e3.statusText})`);
      return e3.arrayBuffer();
    }).then((e3) => this.currentSrc !== t3 ? null : this.audioContext.decodeAudioData(e3)).then((e3) => {
      this.currentSrc === t3 && (this.buffer = e3, this.emit("loadedmetadata"), this.emit("canplay"), this.autoplay && this.play());
    }).catch((t4) => {
      console.error("WebAudioPlayer load error:", t4);
    });
  }
  _play() {
    if (!this.paused) return;
    this.paused = false, this.bufferNode && (this.bufferNode.onended = null, this.bufferNode.disconnect()), this.bufferNode = this.audioContext.createBufferSource(), this.buffer && (this.bufferNode.buffer = this.buffer), this.bufferNode.playbackRate.value = this._playbackRate, this.bufferNode.connect(this.gainNode);
    let t3 = this.playedDuration * this._playbackRate;
    (t3 >= this.duration || t3 < 0) && (t3 = 0, this.playedDuration = 0), this.bufferNode.start(this.audioContext.currentTime, t3), this.playStartTime = this.audioContext.currentTime, this.bufferNode.onended = () => {
      this.currentTime >= this.duration && (this.pause(), this.emit("ended"));
    };
  }
  _pause() {
    var t3;
    this.paused = true, null === (t3 = this.bufferNode) || void 0 === t3 || t3.stop(), this.playedDuration += this.audioContext.currentTime - this.playStartTime;
  }
  play() {
    return t(this, void 0, void 0, function* () {
      this.paused && (this._play(), this.emit("play"));
    });
  }
  pause() {
    this.paused || (this._pause(), this.emit("pause"));
  }
  stopAt(t3) {
    const e3 = t3 - this.currentTime, i3 = this.bufferNode;
    null == i3 || i3.stop(this.audioContext.currentTime + e3), null == i3 || i3.addEventListener("ended", () => {
      i3 === this.bufferNode && (this.bufferNode = null, this.pause());
    }, { once: true });
  }
  setSinkId(e3) {
    return t(this, void 0, void 0, function* () {
      return this.audioContext.setSinkId(e3);
    });
  }
  get playbackRate() {
    return this._playbackRate;
  }
  set playbackRate(t3) {
    this._playbackRate = t3, this.bufferNode && (this.bufferNode.playbackRate.value = t3);
  }
  get currentTime() {
    return (this.paused ? this.playedDuration : this.playedDuration + (this.audioContext.currentTime - this.playStartTime)) * this._playbackRate;
  }
  set currentTime(t3) {
    const e3 = !this.paused;
    e3 && this._pause(), this.playedDuration = t3 / this._playbackRate, e3 && this._play(), this.emit("seeking"), this.emit("timeupdate");
  }
  get duration() {
    var t3, e3;
    return null !== (t3 = this._duration) && void 0 !== t3 ? t3 : (null === (e3 = this.buffer) || void 0 === e3 ? void 0 : e3.duration) || 0;
  }
  set duration(t3) {
    this._duration = t3;
  }
  get volume() {
    return this.gainNode.gain.value;
  }
  set volume(t3) {
    this.gainNode.gain.value = t3, this.emit("volumechange");
  }
  get muted() {
    return this._muted;
  }
  set muted(t3) {
    this._muted !== t3 && (this._muted = t3, this._muted ? this.gainNode.disconnect() : this.gainNode.connect(this.audioContext.destination));
  }
  canPlayType(t3) {
    return /^(audio|video)\//.test(t3);
  }
  getGainNode() {
    return this.gainNode;
  }
  getChannelData() {
    const t3 = [];
    if (!this.buffer) return t3;
    const e3 = this.buffer.numberOfChannels;
    for (let i3 = 0; i3 < e3; i3++) t3.push(this.buffer.getChannelData(i3));
    return t3;
  }
  removeAttribute(t3) {
    switch (t3) {
      case "src":
        this.src = "";
        break;
      case "playbackRate":
        this.playbackRate = 0;
        break;
      case "currentTime":
        this.currentTime = 0;
        break;
      case "duration":
        this.duration = 0;
        break;
      case "volume":
        this.volume = 0;
        break;
      case "muted":
        this.muted = false;
    }
  }
};
var y = { waveColor: "#999", progressColor: "#555", cursorWidth: 1, minPxPerSec: 0, fillParent: true, interact: true, dragToSeek: false, autoScroll: true, autoCenter: true, sampleRate: 8e3 };
var C = class _C extends a {
  static create(t3) {
    return new _C(t3);
  }
  constructor(t3) {
    const e3 = t3.media || ("WebAudio" === t3.backend ? new b() : void 0);
    super({ media: e3, mediaControls: t3.mediaControls, autoplay: t3.autoplay, playbackRate: t3.audioRate }), this.plugins = [], this.decodedData = null, this.stopAtPosition = null, this.subscriptions = [], this.mediaSubscriptions = [], this.abortController = null, this.options = Object.assign({}, y, t3), this.timer = new v();
    const i3 = e3 ? void 0 : this.getMediaElement();
    this.renderer = new g(this.options, i3), this.initPlayerEvents(), this.initRendererEvents(), this.initTimerEvents(), this.initPlugins();
    const n3 = this.options.url || this.getSrc() || "";
    Promise.resolve().then(() => {
      this.emit("init");
      const { peaks: t4, duration: e4 } = this.options;
      (n3 || t4 && e4) && this.load(n3, t4, e4).catch((t5) => {
        this.emit("error", t5 instanceof Error ? t5 : new Error(String(t5)));
      });
    });
  }
  updateProgress(t3 = this.getCurrentTime()) {
    return this.renderer.renderProgress(t3 / this.getDuration(), this.isPlaying()), t3;
  }
  initTimerEvents() {
    this.subscriptions.push(this.timer.on("tick", () => {
      if (!this.isSeeking()) {
        const t3 = this.updateProgress();
        this.emit("timeupdate", t3), this.emit("audioprocess", t3), null != this.stopAtPosition && this.isPlaying() && t3 >= this.stopAtPosition && this.pause();
      }
    }));
  }
  initPlayerEvents() {
    this.isPlaying() && (this.emit("play"), this.timer.start()), this.mediaSubscriptions.push(this.onMediaEvent("timeupdate", () => {
      const t3 = this.updateProgress();
      this.emit("timeupdate", t3);
    }), this.onMediaEvent("play", () => {
      this.emit("play"), this.timer.start();
    }), this.onMediaEvent("pause", () => {
      this.emit("pause"), this.timer.stop(), this.stopAtPosition = null;
    }), this.onMediaEvent("emptied", () => {
      this.timer.stop(), this.stopAtPosition = null;
    }), this.onMediaEvent("ended", () => {
      this.emit("timeupdate", this.getDuration()), this.emit("finish"), this.stopAtPosition = null;
    }), this.onMediaEvent("seeking", () => {
      this.emit("seeking", this.getCurrentTime());
    }), this.onMediaEvent("error", () => {
      var t3;
      this.emit("error", null !== (t3 = this.getMediaElement().error) && void 0 !== t3 ? t3 : new Error("Media error")), this.stopAtPosition = null;
    }));
  }
  initRendererEvents() {
    this.subscriptions.push(this.renderer.on("click", (t3, e3) => {
      this.options.interact && (this.seekTo(t3), this.emit("interaction", t3 * this.getDuration()), this.emit("click", t3, e3));
    }), this.renderer.on("dblclick", (t3, e3) => {
      this.emit("dblclick", t3, e3);
    }), this.renderer.on("scroll", (t3, e3, i3, n3) => {
      const s2 = this.getDuration();
      this.emit("scroll", t3 * s2, e3 * s2, i3, n3);
    }), this.renderer.on("render", () => {
      this.emit("redraw");
    }), this.renderer.on("rendered", () => {
      this.emit("redrawcomplete");
    }), this.renderer.on("dragstart", (t3) => {
      this.emit("dragstart", t3);
    }), this.renderer.on("dragend", (t3) => {
      this.emit("dragend", t3);
    }), this.renderer.on("resize", () => {
      this.emit("resize");
    }));
    {
      let t3;
      const e3 = this.renderer.on("drag", (e4) => {
        var i3;
        if (!this.options.interact) return;
        this.renderer.renderProgress(e4), clearTimeout(t3);
        let n3 = 0;
        const s2 = this.options.dragToSeek;
        this.isPlaying() ? n3 = 0 : true === s2 ? n3 = 200 : s2 && "object" == typeof s2 && (n3 = null !== (i3 = s2.debounceTime) && void 0 !== i3 ? i3 : 200), t3 = setTimeout(() => {
          this.seekTo(e4);
        }, n3), this.emit("interaction", e4 * this.getDuration()), this.emit("drag", e4);
      });
      this.subscriptions.push(() => {
        clearTimeout(t3), e3();
      });
    }
  }
  initPlugins() {
    var t3;
    (null === (t3 = this.options.plugins) || void 0 === t3 ? void 0 : t3.length) && this.options.plugins.forEach((t4) => {
      this.registerPlugin(t4);
    });
  }
  unsubscribePlayerEvents() {
    this.mediaSubscriptions.forEach((t3) => t3()), this.mediaSubscriptions = [];
  }
  setOptions(t3) {
    this.options = Object.assign({}, this.options, t3), t3.duration && !t3.peaks && (this.decodedData = i.createBuffer(this.exportPeaks(), t3.duration)), t3.peaks && t3.duration && (this.decodedData = i.createBuffer(t3.peaks, t3.duration)), this.renderer.setOptions(this.options), t3.audioRate && this.setPlaybackRate(t3.audioRate), null != t3.mediaControls && (this.getMediaElement().controls = t3.mediaControls);
  }
  registerPlugin(t3) {
    if (this.plugins.includes(t3)) return t3;
    t3._init(this), this.plugins.push(t3);
    const e3 = t3.once("destroy", () => {
      this.plugins = this.plugins.filter((e4) => e4 !== t3), this.subscriptions = this.subscriptions.filter((t4) => t4 !== e3);
    });
    return this.subscriptions.push(e3), t3;
  }
  unregisterPlugin(t3) {
    this.plugins = this.plugins.filter((e3) => e3 !== t3), t3.destroy();
  }
  getWrapper() {
    return this.renderer.getWrapper();
  }
  getWidth() {
    return this.renderer.getWidth();
  }
  getScroll() {
    return this.renderer.getScroll();
  }
  setScroll(t3) {
    return this.renderer.setScroll(t3);
  }
  setScrollTime(t3) {
    const e3 = t3 / this.getDuration();
    this.renderer.setScrollPercentage(e3);
  }
  getActivePlugins() {
    return this.plugins;
  }
  loadAudio(e3, n3, s2, r3) {
    return t(this, void 0, void 0, function* () {
      var t3;
      if (this.emit("load", e3), !this.options.media && this.isPlaying() && this.pause(), this.decodedData = null, this.stopAtPosition = null, null === (t3 = this.abortController) || void 0 === t3 || t3.abort(), this.abortController = null, !n3 && !s2) {
        const t4 = this.options.fetchParams || {};
        window.AbortController && !t4.signal && (this.abortController = new AbortController(), t4.signal = this.abortController.signal);
        const i3 = (t5) => this.emit("loading", t5);
        n3 = yield o.fetchBlob(e3, i3, t4);
        const s3 = this.options.blobMimeType;
        s3 && (n3 = new Blob([n3], { type: s3 }));
      }
      this.setSrc(e3, n3);
      const a3 = yield new Promise((t4) => {
        const e4 = r3 || this.getDuration();
        e4 ? t4(e4) : this.mediaSubscriptions.push(this.onMediaEvent("loadedmetadata", () => t4(this.getDuration()), { once: true }));
      });
      if (!e3 && !n3) {
        const t4 = this.getMediaElement();
        t4 instanceof b && (t4.duration = a3);
      }
      if (s2) this.decodedData = i.createBuffer(s2, a3 || 0);
      else if (n3) {
        const t4 = yield n3.arrayBuffer();
        this.decodedData = yield i.decode(t4, this.options.sampleRate);
      }
      this.decodedData && (this.emit("decode", this.getDuration()), this.renderer.render(this.decodedData)), this.emit("ready", this.getDuration());
    });
  }
  load(e3, i3, n3) {
    return t(this, void 0, void 0, function* () {
      try {
        return yield this.loadAudio(e3, void 0, i3, n3);
      } catch (t3) {
        throw this.emit("error", t3), t3;
      }
    });
  }
  loadBlob(e3, i3, n3) {
    return t(this, void 0, void 0, function* () {
      try {
        return yield this.loadAudio("", e3, i3, n3);
      } catch (t3) {
        throw this.emit("error", t3), t3;
      }
    });
  }
  zoom(t3) {
    if (!this.decodedData) throw new Error("No audio loaded");
    this.renderer.zoom(t3), this.emit("zoom", t3);
  }
  getDecodedData() {
    return this.decodedData;
  }
  exportPeaks({ channels: t3 = 2, maxLength: e3 = 8e3, precision: i3 = 1e4 } = {}) {
    if (!this.decodedData) throw new Error("The audio has not been decoded yet");
    const n3 = Math.min(t3, this.decodedData.numberOfChannels), s2 = [];
    for (let t4 = 0; t4 < n3; t4++) {
      const n4 = this.decodedData.getChannelData(t4), r3 = [], o3 = n4.length / e3;
      for (let t5 = 0; t5 < e3; t5++) {
        const e4 = n4.slice(Math.floor(t5 * o3), Math.ceil((t5 + 1) * o3));
        let s3 = 0;
        for (let t6 = 0; t6 < e4.length; t6++) {
          const i4 = e4[t6];
          Math.abs(i4) > Math.abs(s3) && (s3 = i4);
        }
        r3.push(Math.round(s3 * i3) / i3);
      }
      s2.push(r3);
    }
    return s2;
  }
  getDuration() {
    let t3 = super.getDuration() || 0;
    return 0 !== t3 && t3 !== 1 / 0 || !this.decodedData || (t3 = this.decodedData.duration), t3;
  }
  toggleInteraction(t3) {
    this.options.interact = t3;
  }
  setTime(t3) {
    this.stopAtPosition = null, super.setTime(t3), this.updateProgress(t3), this.emit("timeupdate", t3);
  }
  seekTo(t3) {
    const e3 = this.getDuration() * t3;
    this.setTime(e3);
  }
  play(e3, i3) {
    const n3 = Object.create(null, { play: { get: () => super.play } });
    return t(this, void 0, void 0, function* () {
      null != e3 && this.setTime(e3);
      const t3 = yield n3.play.call(this);
      return null != i3 && (this.media instanceof b ? this.media.stopAt(i3) : this.stopAtPosition = i3), t3;
    });
  }
  playPause() {
    return t(this, void 0, void 0, function* () {
      return this.isPlaying() ? this.pause() : this.play();
    });
  }
  stop() {
    this.pause(), this.setTime(0);
  }
  skip(t3) {
    this.setTime(this.getCurrentTime() + t3);
  }
  empty() {
    this.load("", [[0]], 1e-3);
  }
  setMediaElement(t3) {
    this.unsubscribePlayerEvents(), super.setMediaElement(t3), this.initPlayerEvents();
  }
  exportImage() {
    return t(this, arguments, void 0, function* (t3 = "image/png", e3 = 1, i3 = "dataURL") {
      return this.renderer.exportImage(t3, e3, i3);
    });
  }
  destroy() {
    var t3;
    this.emit("destroy"), null === (t3 = this.abortController) || void 0 === t3 || t3.abort(), this.plugins.forEach((t4) => t4.destroy()), this.subscriptions.forEach((t4) => t4()), this.unsubscribePlayerEvents(), this.timer.destroy(), this.renderer.destroy(), super.destroy();
  }
};
C.BasePlugin = class extends e {
  constructor(t3) {
    super(), this.subscriptions = [], this.isDestroyed = false, this.options = t3;
  }
  onInit() {
  }
  _init(t3) {
    this.isDestroyed && (this.subscriptions = [], this.isDestroyed = false), this.wavesurfer = t3, this.onInit();
  }
  destroy() {
    this.emit("destroy"), this.subscriptions.forEach((t3) => t3()), this.subscriptions = [], this.isDestroyed = true, this.wavesurfer = void 0;
  }
}, C.dom = r;

// node_modules/.pnpm/@wavesurfer+react@1.0.11_react@18.3.1_wavesurfer.js@7.11.1/node_modules/@wavesurfer/react/dist/index.js
function i2(t3, e3) {
  const [n3, i3] = (0, import_react.useState)(null), a3 = (0, import_react.useMemo)(() => Object.entries(e3).flat(), [e3]);
  return (0, import_react.useEffect)(() => {
    if (!(null == t3 ? void 0 : t3.current)) return;
    const n4 = C.create(Object.assign(Object.assign({}, e3), { container: t3.current }));
    return i3(n4), () => {
      n4.destroy();
    };
  }, [t3, ...a3]), n3;
}
var a2 = /^on([A-Z])/;
var u2 = (t3) => a2.test(t3);
function f2(t3, e3) {
  const n3 = (0, import_react.useMemo)(() => Object.entries(e3).flat(), [e3]);
  (0, import_react.useEffect)(() => {
    if (!t3) return;
    const n4 = Object.entries(e3);
    if (!n4.length) return;
    const r3 = n4.map(([e4, n5]) => {
      const r4 = e4.replace(a2, (t4, e5) => e5.toLowerCase());
      return t3.on(r4, (...e5) => n5(t3, ...e5));
    });
    return () => {
      r3.forEach((t4) => t4());
    };
  }, [t3, ...n3]);
}
var l2 = (0, import_react.memo)((e3) => {
  const r3 = (0, import_react.useRef)(null), [c3, s2] = function(t3) {
    return (0, import_react.useMemo)(() => {
      const e4 = Object.assign({}, t3), n3 = Object.assign({}, t3);
      for (const t4 in e4) u2(t4) ? delete e4[t4] : delete n3[t4];
      return [e4, n3];
    }, [t3]);
  }(e3);
  return f2(i2(r3, c3), s2), (0, import_jsx_runtime.jsx)("div", { ref: r3 });
});
function p2(t3) {
  var { container: e3 } = t3;
  const n3 = i2(e3, function(t4, e4) {
    var n4 = {};
    for (var r3 in t4) Object.prototype.hasOwnProperty.call(t4, r3) && e4.indexOf(r3) < 0 && (n4[r3] = t4[r3]);
    if (null != t4 && "function" == typeof Object.getOwnPropertySymbols) {
      var o3 = 0;
      for (r3 = Object.getOwnPropertySymbols(t4); o3 < r3.length; o3++) e4.indexOf(r3[o3]) < 0 && Object.prototype.propertyIsEnumerable.call(t4, r3[o3]) && (n4[r3[o3]] = t4[r3[o3]]);
    }
    return n4;
  }(t3, ["container"])), s2 = function(t4) {
    const [e4, n4] = (0, import_react.useState)(false), [s3, i3] = (0, import_react.useState)(false), [a3, u3] = (0, import_react.useState)(false), [f3, l3] = (0, import_react.useState)(0);
    return (0, import_react.useEffect)(() => {
      if (!t4) return;
      const e5 = [t4.on("load", () => {
        n4(false), i3(false), l3(0);
      }), t4.on("ready", () => {
        n4(true), i3(false), u3(false), l3(0);
      }), t4.on("finish", () => {
        u3(true);
      }), t4.on("play", () => {
        i3(true);
      }), t4.on("pause", () => {
        i3(false);
      }), t4.on("timeupdate", () => {
        l3(t4.getCurrentTime());
      }), t4.on("destroy", () => {
        n4(false), i3(false);
      })];
      return () => {
        e5.forEach((t5) => t5());
      };
    }, [t4]), (0, import_react.useMemo)(() => ({ isReady: e4, isPlaying: s3, hasFinished: a3, currentTime: f3 }), [s3, a3, f3, e4]);
  }(n3);
  return (0, import_react.useMemo)(() => Object.assign(Object.assign({}, s2), { wavesurfer: n3 }), [s2, n3]);
}
export {
  l2 as default,
  p2 as useWavesurfer
};
/*! Bundled license information:

react/cjs/react-jsx-runtime.development.js:
  (**
   * @license React
   * react-jsx-runtime.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

@wavesurfer/react/dist/index.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)
*/
//# sourceMappingURL=@wavesurfer_react.js.map
