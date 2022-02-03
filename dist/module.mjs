// 

'use strict'


const selectors = {}
const domains = {}
const globalFilters = []
const domainFilters = {}
const selectorFilters = {}

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
  // TODO: implement 'sbp/domains/lock' to prevent further selectors from being registered
  //       for that domain, and to prevent selectors from being overwritten for that domain.
  //       Once a domain is locked it cannot be unlocked.
  'sbp/selectors/register': function (sels) {
    const registered = []
    for (const selector in sels) {
      const domain = domainFromSelector(selector)
      if (selectors[selector]) {
        (console.warn || console.log)(`[SBP WARN]: not registering already registered selector: ${selector}`)
      } else if (typeof sels[selector] === 'function') {
        const fn = selectors[selector] = sels[selector]
        registered.push(selector)
        // ensure each domain has a domain state associated with it
        if (!domains[domain]) {
          domains[domain] = { state: {}, locked: false }
        }
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
      if (domains[domainFromSelector(selector)].locked) {
        throw new Error(`SBP: domain locked for: ${selector}`)
      }
      delete selectors[selector]
    }
  },
  'sbp/selectors/overwrite': function (sels) {
    sbp('sbp/selectors/unregister', Object.keys(sels))
    return sbp('sbp/selectors/register', sels)
  },
  'sbp/domains/lock': function (doms) {
    for (const domain of doms) {
      domains[domain].locked = true
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
  }
}

SBP_BASE_SELECTORS['sbp/selectors/register'](SBP_BASE_SELECTORS)
sbp('sbp/domains/lock', ['sbp'])

export default sbp
