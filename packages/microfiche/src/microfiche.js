function flatten(object) {
  let next = {}

  for (var key in object) {
    if (object[key] !== undefined) {
      next[key] = object[key]
    }
  }

  return next
}

const noop = () => {}

export class Database {
  constructor() {
    this.head = new Changeset({}, noop)
  }

  get() {
    return this.head.get.apply(this.head, arguments)
  }

  each() {
    return this.head.each.apply(this.head, arguments)
  }

  push(action, callback) {
    this.link(action(), callback)
  }

  link(observable, callback) {
    let next = this.head.spawn(callback)

    observable.subscribe(payload => next.apply(payload))

    this.head = next
  }

  transact(fn, payload) {
    this.head = this.head.spawn(fn)
    this.head.apply(payload)
  }

  compress() {
    this.head = this.head.compress()
  }
}

export class Changeset {
  constructor(last, executor) {
    this.last = last
    this.next = null
    this.facts = Object.create(last)
    this.executor = executor
  }

  compress() {
    return new Changeset(flatten(this.facts), noop)
  }

  spawn(fn) {
    this.next = new Changeset(this.facts, fn)

    return this.next
  }

  rollback() {
    for (var key in this.facts) {
      if (this.facts.hasOwnProperty(key)) {
        delete this.facts[key]
      }
    }
  }

  apply() {
    this.rollback()

    this.executor(this, ...arguments)

    if (this.next) {
      this.next.apply(...arguments)
    }
  }

  put(key, value) {
    let next = typeof value === 'function' ? value(this.facts[key]) : value

    if (this.facts[key] !== next) {
      this.facts[key] = next
    }
  }

  remove(search) {
    for (var term in this.facts) {
      if (term.indexOf(search) === 0) {
        this.facts[term] = undefined
      }
    }
  }

  get(resource, entity, attributes) {
    let record = null

    if (Array.isArray(attributes) === false) {
      attributes = [attributes]
    }

    for (var i = attributes.length - 1; i >= 0; i--) {
      var attribute = attributes[i]
      var key = resource + '.' + entity + '.' + attribute
      var value = this.facts[key]

      if (value !== undefined) {
        record = record || {}
        record[attribute] = value
      }
    }

    return record
  }

  each(search, fn) {
    for (var term in this.facts) {
      let value = this.facts[term]

      if (value === undefined) {
        continue
      }

      if (term.indexOf(search) === 0) {
        fn(term.split('.'), value)
      }
    }
  }
}
