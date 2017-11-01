function clone(obj) {
  let copy = {}

  for (var key in obj) {
    copy[key] = obj[key]
  }

  return copy
}

export class Database {
  constructor() {
    this.head = new Changeset()
  }

  get() {
    return this.head.get.apply(this.head, arguments)
  }

  each() {
    return this.head.each.apply(this.head, arguments)
  }

  rollback() {
    this.head = this.head.parent || new Changeset()
  }

  transact(fn) {
    let draft = new Changeset(this.head)

    fn(draft)

    this.head = draft
  }

  compress() {
    this.head = this.head.compress()
  }
}

export class Changeset {
  constructor(parent, facts) {
    this.parent = parent || null
    this.facts = Object.create(parent ? parent.facts : facts || null)
  }

  compress() {
    return new Changeset(null, clone(this.facts))
  }

  put(resource, entity, attribute, value) {
    let key = resource + '.' + entity + '.' + attribute

    this.facts[key] = value
  }

  merge(resource, entity, attributes) {
    for (var key in attributes) {
      this.put(resource, entity, key, attributes[key])
    }
  }

  get(resource, entity, attributes) {
    let record = {}

    if (Array.isArray(attributes) === false) {
      attributes = [attributes]
    }

    for (var i = attributes.length - 1; i >= 0; i--) {
      var attribute = attributes[i]
      var key = resource + '.' + entity + '.' + attribute

      record[attribute] = this.facts[key]
    }

    return record
  }

  each(search, fn) {
    for (var term in this.facts) {
      if (term.indexOf(search) === 0) {
        fn(term.split('.'), this.facts[term])
      }
    }
  }
}
