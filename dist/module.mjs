// 

'use strict'


const selectors = {}
const domains = {}
const globalFilters = []
const domainFilters = {}
const selectorFilters = {}
const unsafeSelectors = {}

const DOMAIN_REGEX = /^[^/]+/

function sbp (selector, ...data) {
  const domain = domainFromSelector(selector)
  if (!selectors[selector]) {
    throw new Error(`SBP: selector not registered: ${selector}`)
  }
  // Filters can perform additional functions, and by returning `false` they
  // can prevent the execution of a selector. Check the most specific filters first.
  for (const filters of [selectorFilters[selector], domainFilters[domain], globalFilters]) {
    if (filters) {
      for (const filter of filters) {
        if (filter(domain, selector, data) === false) return
      }
    }
  }
  return selectors[selector].call(domains[domain].state, ...data)
}

export function domainFromSelector (selector) {
  const domainLookup = DOMAIN_REGEX.exec(selector)
  if (domainLookup === null) {
    throw new Error(`SBP: selector missing domain: ${selector}`)
  }
  return domainLookup[0]
}

const SBP_BASE_SELECTORS = {
  'sbp/selectors/register': function (sels) {
    const registered = []
    for (const selector in sels) {
      const domainName = domainFromSelector(selector)
      // ensure each domain has a domain state associated with it
      const domain = domainName in domains ? domains[domainName] : (domains[domainName] = { state: {}, locked: false })
      if (domain.locked) {
        (console.warn || console.log)(`[SBP WARN]: not registering selector on locked domain: '${selector}'`)
      } else if (selectors[selector]) {
        (console.warn || console.log)(`[SBP WARN]: not registering already registered selector: '${selector}'`)
      } else if (typeof sels[selector] === 'function') {
        if (unsafeSelectors[selector]) {
          // important warning in case we loaded any malware beforehand and aren't expecting this
          (console.warn || console.log)(`[SBP WARN]: registering unsafe selector: '${selector}' (remember to lock after overwriting)`)
        }
        const fn = selectors[selector] = sels[selector]
        registered.push(selector)
        // call the special _init function immediately upon registering
        if (selector === `${domain}/_init`) {
          fn.call(domains[domain].state)
        }
      }
    }
    return registered
  },
  'sbp/selectors/unregister': function (sels) {
    for (const selector of sels) {
      if (!unsafeSelectors[selector]) {
        throw new Error(`SBP: can't unregister locked selector: ${selector}`)
      }
      if (domains[domainFromSelector(selector)]?.locked) {
        throw new Error(`SBP: can't unregister selector on a locked domain: '${selector}'`)
      }
      delete selectors[selector]
    }
  },
  'sbp/selectors/overwrite': function (sels) {
    sbp('sbp/selectors/unregister', Object.keys(sels))
    return sbp('sbp/selectors/register', sels)
  },
  'sbp/selectors/unsafe': function (sels) {
    for (const selector of sels) {
      if (selectors[selector]) {
        throw new Error('unsafe must be called before registering selector')
      }
      unsafeSelectors[selector] = true
    }
  },
  'sbp/selectors/lock': function (sels) {
    for (const selector of sels) {
      delete unsafeSelectors[selector]
    }
  },
  'sbp/selectors/fn': function (sel) {
    return selectors[sel]
  },
  'sbp/filters/global/add': function (filter) {
    globalFilters.push(filter)
  },
  'sbp/filters/domain/add': function (domain, filter) {
    if (!domainFilters[domain]) domainFilters[domain] = []
    domainFilters[domain].push(filter)
  },
  'sbp/filters/selector/add': function (selector, filter) {
    if (!selectorFilters[selector]) selectorFilters[selector] = []
    selectorFilters[selector].push(filter)
  },
  'sbp/domains/lock': function (domainNameOrNames) {
    // If no argument was given then locks every known domain.
    if (domainNameOrNames === undefined) {
      for (const domain of Object.values(domains)) {
        domain.locked = true
      }
    } else for (const name of typeof domainNameOrNames === 'string' ? [domainNameOrNames] : domainNameOrNames) {
      if (!domains[name]) {
        throw new Error(`SBP: unknown or invalid domain name: ${name}`)
      }
      domains[name].locked = true
    }
  }
}

SBP_BASE_SELECTORS['sbp/selectors/register'](SBP_BASE_SELECTORS)

export default sbp
