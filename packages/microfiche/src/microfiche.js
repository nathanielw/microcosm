function assign(a, b) {
  for (var key in a) {
    if (a[key] !== undefined) {
      b[key] = a[key]
    }
  }

  return a
}

export class Database {
  constructor() {
    this.head = new Changeset({})
  }

  get() {
    return this.head.get.apply(this.head, arguments)
  }

  each() {
    return this.head.each.apply(this.head, arguments)
  }

  rollback() {
    this.head = this.head.rollback()
  }

  transact(fn) {
    let draft = this.head.spawn()

    fn(draft)

    this.head = draft
  }

  compress() {
    this.head = this.head.compress()
  }
}

export class Changeset {
  constructor(last) {
    this.last = last
    this.facts = Object.create(last)
  }

  compress() {
    return new Changeset(assign({}, this.facts))
  }

  rollback() {
    return new Changeset(this.last)
  }

  spawn() {
    return new Changeset(this.facts)
  }

  put(resource, entity, attribute, value) {
    let key = resource + '.' + entity + '.' + attribute

    if (this.facts[key] !== value) {
      this.facts[key] = value
    }
  }

  putMany(items) {
    items.forEach(items => this.put(...items), this)
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
