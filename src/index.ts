type Domain = {
  locked: boolean;
  state: object;
}
type Callable = typeof Function.prototype
type TypeFilter = (domain: string, selector: string, data: unknown) => boolean | null | undefined

const selectors: {[k: string]: Callable} = Object.create(null)
const domains: {[k: string]: Domain} = Object.create(null)
const globalFilters: TypeFilter[] = []
const domainFilters: {[k: string]: TypeFilter[]} = Object.create(null)
const selectorFilters: {[k: string]: TypeFilter[]} = Object.create(null)
const unsafeSelectors: {[k: string]: boolean} = Object.create(null)

const DOMAIN_REGEX = /^[^/]+/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sbp (selector: string, ...data: unknown[]): any {
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
  'sbp/selectors/register': (sels: typeof selectors): string[] => {
    const registered = []
    for (const selector in sels) {
      const domainName = domainFromSelector(selector)
      // ensure each domain has a domain state associated with it
      const domain = domainName in domains ? domains[domainName] : (domains[domainName] = { state: Object.create(null), locked: false })
      if (domain.locked) {
        (console.warn || console.log)(`[SBP WARN]: not registering selector on locked domain: '${selector}'`)
      } else if (selectors[selector]) {
        (console.warn || console.log)(`[SBP WARN]: not registering already registered selector: '${selector}'`)
      } else if (typeof sels[selector] === 'function') {
        if (unsafeSelectors[selector]) {
          // important warning in case we loaded unknown malware beforehand and aren't expecting this
          (console.warn || console.log)(`[SBP WARN]: registering unsafe selector: '${selector}' (remember to lock after overwriting)`)
        }
        const fn = selectors[selector] = sels[selector]
        registered.push(selector)
        // call the special _init function immediately upon registering
        if (selector === `${domainName}/_init`) {
          fn.call(domain.state)
        }
      }
    }
    return registered
  },
  'sbp/selectors/unregister': (sels: string[]) => {
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
  'sbp/selectors/overwrite': (sels: typeof selectors) => {
    sbp('sbp/selectors/unregister', Object.keys(sels))
    return sbp('sbp/selectors/register', sels)
  },
  'sbp/selectors/unsafe': (sels: string[]) => {
    for (const selector of sels) {
      if (selectors[selector]) {
        throw new Error('unsafe must be called before registering selector')
      }
      unsafeSelectors[selector] = true
    }
  },
  'sbp/selectors/lock': (sels: string[]) => {
    for (const selector of sels) {
      delete unsafeSelectors[selector]
    }
  },
  'sbp/selectors/fn': (sel: string): typeof selectors[string] => {
    return selectors[sel]
  },
  'sbp/filters/global/add': (filter: TypeFilter) => {
    globalFilters.push(filter)
  },
  'sbp/filters/domain/add': (domain: string, filter: TypeFilter) => {
    if (!domainFilters[domain]) domainFilters[domain] = []
    domainFilters[domain].push(filter)
  },
  'sbp/filters/selector/add': (selector: string, filter: TypeFilter) => {
    if (!selectorFilters[selector]) selectorFilters[selector] = []
    selectorFilters[selector].push(filter)
  },
  'sbp/domains/lock': (domainNames?: string[]) => {
    // If no argument was given then locks every known domain.
    if (!domainNames) {
      for (const name in domains) {
        domains[name].locked = true
      }
    } else {
      for (const name of domainNames) {
        if (!domains[name]) {
          throw new Error(`SBP: cannot lock non-existent domain: ${name}`)
        }
        domains[name].locked = true
      }
    }
  }
}

SBP_BASE_SELECTORS['sbp/selectors/register'](SBP_BASE_SELECTORS)

export default sbp
