(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.domainFromSelector = domainFromSelector;
    const selectors = Object.create(null);
    const domains = Object.create(null);
    const globalFilters = [];
    const domainFilters = Object.create(null);
    const selectorFilters = Object.create(null);
    const unsafeSelectors = Object.create(null);
    const DOMAIN_REGEX = /^[^/]+/;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function sbp(selector, ...data) {
        const domain = domainFromSelector(selector);
        const starSelector = `${domain}/*`;
        const selExists = !!selectors[selector];
        // Copy of the original selector
        let sel = selector;
        if (!selExists) {
            // If the selector doesn't exist and the start selector is defined,
            // use the star selector
            if (selectors[starSelector]) {
                sel = starSelector;
            }
            else {
                throw new Error(`SBP: selector not registered: ${selector}`);
            }
        }
        // Filters can perform additional functions, and by returning `false` they
        // can prevent the execution of a selector. Check the most specific filters first.
        for (const filters of [selectorFilters[selector], domainFilters[domain], globalFilters]) {
            if (filters) {
                for (const filter of filters) {
                    if (filter(domain, selector, data) === false)
                        return;
                }
            }
        }
        if (!selExists) {
            // When using the star selector, the first argument is the original selector
            // used when calling `sbp`.
            data.unshift(selector);
        }
        return selectors[sel].apply(domains[domain].state, data);
    }
    function domainFromSelector(selector) {
        const domainLookup = DOMAIN_REGEX.exec(selector);
        if (domainLookup === null) {
            throw new Error(`SBP: selector missing domain: ${selector}`);
        }
        return domainLookup[0];
    }
    const SBP_BASE_SELECTORS = {
        'sbp/selectors/register': (sels) => {
            const registered = [];
            for (const selector in sels) {
                const domainName = domainFromSelector(selector);
                // ensure each domain has a domain state associated with it
                const domain = domainName in domains ? domains[domainName] : (domains[domainName] = { state: Object.create(null), locked: false });
                if (domain.locked) {
                    (console.warn || console.log)(`[SBP WARN]: not registering selector on locked domain: '${selector}'`);
                }
                else if (selectors[selector]) {
                    (console.warn || console.log)(`[SBP WARN]: not registering already registered selector: '${selector}'`);
                }
                else if (typeof sels[selector] === 'function') {
                    if (unsafeSelectors[selector]) {
                        // important warning in case we loaded unknown malware beforehand and aren't expecting this
                        (console.warn || console.log)(`[SBP WARN]: registering unsafe selector: '${selector}' (remember to lock after overwriting)`);
                    }
                    const fn = selectors[selector] = sels[selector];
                    registered.push(selector);
                    // call the special _init function immediately upon registering
                    if (selector === `${domainName}/_init`) {
                        fn.call(domain.state);
                    }
                }
            }
            return registered;
        },
        'sbp/selectors/unregister': (sels) => {
            var _a;
            for (const selector of sels) {
                if (!unsafeSelectors[selector]) {
                    throw new Error(`SBP: can't unregister locked selector: ${selector}`);
                }
                if ((_a = domains[domainFromSelector(selector)]) === null || _a === void 0 ? void 0 : _a.locked) {
                    throw new Error(`SBP: can't unregister selector on a locked domain: '${selector}'`);
                }
                delete selectors[selector];
            }
        },
        'sbp/selectors/overwrite': (sels) => {
            sbp('sbp/selectors/unregister', Object.keys(sels));
            return sbp('sbp/selectors/register', sels);
        },
        'sbp/selectors/unsafe': (sels) => {
            for (const selector of sels) {
                if (selectors[selector]) {
                    throw new Error('unsafe must be called before registering selector');
                }
                unsafeSelectors[selector] = true;
            }
        },
        'sbp/selectors/lock': (sels) => {
            for (const selector of sels) {
                delete unsafeSelectors[selector];
            }
        },
        'sbp/selectors/fn': (sel) => {
            return selectors[sel];
        },
        'sbp/filters/global/add': (filter) => {
            globalFilters.push(filter);
        },
        'sbp/filters/domain/add': (domain, filter) => {
            if (!domainFilters[domain])
                domainFilters[domain] = [];
            domainFilters[domain].push(filter);
        },
        'sbp/filters/selector/add': (selector, filter) => {
            if (!selectorFilters[selector])
                selectorFilters[selector] = [];
            selectorFilters[selector].push(filter);
        },
        'sbp/domains/lock': (domainNames) => {
            // If no argument was given then locks every known domain.
            if (!domainNames) {
                for (const name in domains) {
                    domains[name].locked = true;
                }
            }
            else {
                for (const name of domainNames) {
                    if (!domains[name]) {
                        throw new Error(`SBP: cannot lock non-existent domain: ${name}`);
                    }
                    domains[name].locked = true;
                }
            }
        }
    };
    SBP_BASE_SELECTORS['sbp/selectors/register'](SBP_BASE_SELECTORS);
    exports.default = sbp;
});
