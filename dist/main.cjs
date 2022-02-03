(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.index = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  'use strict';

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  _exports.domainFromSelector = domainFromSelector;

  function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

  var selectors = {};
  var domains = {};
  var globalFilters = [];
  var domainFilters = {};
  var selectorFilters = {};
  var DOMAIN_REGEX = /^[^/]+/;

  function sbp(selector) {
    var _selectors$selector;

    var domain = domainFromSelector(selector);

    if (!selectors[selector]) {
      throw new Error("SBP: selector not registered: ".concat(selector));
    } // Filters can perform additional functions, and by returning `false` they
    // can prevent the execution of a selector. Check the most specific filters first.


    for (var _len = arguments.length, data = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      data[_key - 1] = arguments[_key];
    }

    for (var _i = 0, _arr = [selectorFilters[selector], domainFilters[domain], globalFilters]; _i < _arr.length; _i++) {
      var filters = _arr[_i];

      if (filters) {
        var _iterator = _createForOfIteratorHelper(filters),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var filter = _step.value;
            if (filter(domain, selector, data) === false) return;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }

    return (_selectors$selector = selectors[selector]).call.apply(_selectors$selector, [domains[domain].state].concat(data));
  }

  function domainFromSelector(selector) {
    var domainLookup = DOMAIN_REGEX.exec(selector);

    if (domainLookup === null) {
      throw new Error("SBP: selector missing domain: ".concat(selector));
    }

    return domainLookup[0];
  }

  var SBP_BASE_SELECTORS = {
    // TODO: implement 'sbp/domains/lock' to prevent further selectors from being registered
    //       for that domain, and to prevent selectors from being overwritten for that domain.
    //       Once a domain is locked it cannot be unlocked.
    'sbp/selectors/register': function sbpSelectorsRegister(sels) {
      var registered = [];

      for (var _selector in sels) {
        var _domain = domainFromSelector(_selector);

        if (selectors[_selector]) {
          (console.warn || console.log)("[SBP WARN]: not registering already registered selector: ".concat(_selector));
        } else if (typeof sels[_selector] === 'function') {
          var fn = selectors[_selector] = sels[_selector];
          registered.push(_selector); // ensure each domain has a domain state associated with it

          if (!domains[_domain]) {
            domains[_domain] = {
              state: {},
              locked: false
            };
          } // call the special _init function immediately upon registering


          if (_selector === "".concat(_domain, "/_init")) {
            fn.call(domains[_domain].state);
          }
        }
      }

      return registered;
    },
    'sbp/selectors/unregister': function sbpSelectorsUnregister(sels) {
      var _iterator2 = _createForOfIteratorHelper(sels),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _selector2 = _step2.value;

          if (domains[domainFromSelector(_selector2)].locked) {
            throw new Error("SBP: domain locked for: ".concat(_selector2));
          }

          delete selectors[_selector2];
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    },
    'sbp/selectors/overwrite': function sbpSelectorsOverwrite(sels) {
      sbp('sbp/selectors/unregister', Object.keys(sels));
      return sbp('sbp/selectors/register', sels);
    },
    'sbp/domains/lock': function sbpDomainsLock(doms) {
      var _iterator3 = _createForOfIteratorHelper(doms),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var _domain2 = _step3.value;
          domains[_domain2].locked = true;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    },
    'sbp/selectors/fn': function sbpSelectorsFn(sel) {
      return selectors[sel];
    },
    'sbp/filters/global/add': function sbpFiltersGlobalAdd(filter) {
      globalFilters.push(filter);
    },
    'sbp/filters/domain/add': function sbpFiltersDomainAdd(domain, filter) {
      if (!domainFilters[domain]) domainFilters[domain] = [];
      domainFilters[domain].push(filter);
    },
    'sbp/filters/selector/add': function sbpFiltersSelectorAdd(selector, filter) {
      if (!selectorFilters[selector]) selectorFilters[selector] = [];
      selectorFilters[selector].push(filter);
    }
  };
  SBP_BASE_SELECTORS['sbp/selectors/register'](SBP_BASE_SELECTORS);
  sbp('sbp/domains/lock', ['sbp']);
  var _default = sbp;
  _exports.default = _default;
});
