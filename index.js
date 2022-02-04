// @flow

'use strict'

type TypeFilter = (domain: string, selector: string, data: any) => ?boolean

const selectors: {[string]: Function} = {}
const domains: {[string]: Object} = {}
const globalFilters: Array<TypeFilter> = []
const domainFilters: {[string]: Array<TypeFilter>} = {}
const selectorFilters: {[string]: Array<TypeFilter>} = {}
const unsafeSelectors: {[string]: boolean} = {}

const DOMAIN_REGEX = /^[^/]+/

function sbp (selector: string, ...data: any): any {
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

export function domainFromSelector (selector: string): string {
  const domainLookup = DOMAIN_REGEX.exec(selector)
  if (domainLookup === null) {
    throw new Error(`SBP: selector missing domain: ${selector}`)
  }
  return domainLookup[0]
}

const SBP_BASE_SELECTORS = {
  'sbp/selectors/register': function (sels: {[string]: Function}): Array<string> {
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
          domains[domain] = { state: {} }
        }
        // call the special _init function immediately upon registering
        if (selector === `${domain}/_init`) {
          fn.call(domains[domain].state)
        }
      }
    }
    return registered
  },
  'sbp/selectors/unregister': function (sels: [string]) {
    for (const selector of sels) {
      if (!unsafeSelectors[selector]) {
        throw new Error(`SBP: can't unregister locked selector: ${selector}`)
      }
      delete selectors[selector]
    }
  },
  'sbp/selectors/overwrite': function (sels: {[string]: Function}) {
    sbp('sbp/selectors/unregister', Object.keys(sels))
    return sbp('sbp/selectors/register', sels)
  },
  'sbp/selectors/unsafe': function (sels: [string]) {
    if (Object.keys(domains).length > 1) { // 1 because 'sbp' is registered first thing
      throw new Error('must be called before registering any selectors')
    }
    sels.forEach(s => { unsafeSelectors[s] = true })
  },
  'sbp/selectors/fn': function (sel: string): Function {
    return selectors[sel]
  },
  'sbp/filters/global/add': function (filter: TypeFilter) {
    globalFilters.push(filter)
  },
  'sbp/filters/domain/add': function (domain: string, filter: TypeFilter) {
    if (!domainFilters[domain]) domainFilters[domain] = []
    domainFilters[domain].push(filter)
  },
  'sbp/filters/selector/add': function (selector: string, filter: TypeFilter) {
    if (!selectorFilters[selector]) selectorFilters[selector] = []
    selectorFilters[selector].push(filter)
  }
}

SBP_BASE_SELECTORS['sbp/selectors/register'](SBP_BASE_SELECTORS)

export default sbp
