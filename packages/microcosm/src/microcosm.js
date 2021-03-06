// @flow
import { installDevtools } from './install-devtools'
import { History } from './history'
import { Subject } from './subject'
import { Observable } from './observable'
import { Domain } from './domain'
import { Effect } from './effect'
import { merge } from './data'
import { version } from '../package.json'
import { inherit } from './proto'

const DEFAULTS = {
  debug: false,
  parent: null
}

export class Microcosm extends Subject {
  history: History
  domains: { [string]: Subject }
  options: Object

  static defaults: Object
  static version: string

  constructor(preOptions?: ?Object) {
    super(null, { key: 'repo' })

    let options = merge(DEFAULTS, this.constructor.defaults, preOptions || {})
    let parent = options.parent

    this.history = parent ? parent.history : new History(options)
    this.domains = parent ? Object.create(parent.domains) : {}
    this.options = options

    this.subscribe({
      complete: this.teardown.bind(this, this.options)
    })

    this.setup(this.options)

    if (options.debug) {
      installDevtools(this)
    }
  }

  get state(): Object {
    let value = {}

    for (let key in this.domains) {
      value[key] = this.domains[key].valueOf()
    }

    return value
  }

  setup(options?: Object) {
    // NOOP
  }

  teardown(options?: Object) {
    // NOOP
  }

  addDomain(key: string, blueprint: *, options?: *): Subject {
    console.assert(
      key in this.domains === false,
      'Can not add domain for "' + key + '". This state is already managed.'
    )

    console.assert(key && key.length > 0, 'Can not add domain to root level.')

    console.assert(
      blueprint != null,
      `Unable to create domain using ` +
        `addDomain("${key}", ${String(blueprint)}). ` +
        `This often happens if you forget to add the second argument to ` +
        `addDomain, or if you imported the wrong namespace from a module.`
    )

    if (blueprint instanceof Observable) {
      this.domains[key] = Subject.hash(blueprint)
      this.subscribe({ complete: this.domains[key].complete })
    } else {
      let Entity = inherit(blueprint, Domain)

      this.domains[key] = new Entity(this, merge({ key }, options))
    }

    return this.domains[key]
  }

  addEffect(blueprint: *, options?: *): Effect {
    console.assert(
      blueprint != null,
      `Unable to create effect using ` +
        `addEffect(${String(blueprint)}). ` +
        `This often happens if you forget to add the second argument to ` +
        `addEffect, or if you imported the wrong namespace from a module.`
    )

    let Entity = inherit(blueprint, Effect)

    return new Entity(this, options)
  }

  push() {
    return this.history.append(this, ...arguments)
  }

  prepare() {
    return this.push.bind(this, ...arguments)
  }

  toJSON() {
    return merge({}, this.domains)
  }

  fork() {
    return new Microcosm({
      parent: this
    })
  }
}

Microcosm.version = version
