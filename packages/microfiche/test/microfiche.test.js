import { Database } from '../src/microfiche'

function seed(changes) {
  changes.merge('author', 0, {
    id: 0,
    name: 'Billy Booster',
    email: 'billy@booster.com'
  })

  changes.merge('author', 1, {
    id: 1,
    name: 'Sally Forth',
    email: 'sally@forth.com'
  })

  changes.merge('post', 0, {
    id: 0,
    title: 'Blockchain analysis',
    content: 'Block chains are cool.',
    author: 0
  })

  changes.merge('post', 1, {
    id: 1,
    title: 'Fun with JavaScript',
    content: 'JavaScript. JavaScript. JavaScript.',
    author: 1
  })

  changes.merge('post', 2, {
    id: 2,
    title: 'Elixir for Rubyists',
    content: 'Elixir is not Ruby.',
    author: 1
  })
}

describe('QueryLog', function() {
  beforeEach(() => {
    this.DB = new Database()

    this.DB.transact(seed)
  })

  it('can fetch content', () => {
    let billy = this.DB.get('author', 0, ['name', 'id', 'email'])

    expect(billy).toHaveProperty('id', 0)
    expect(billy).toHaveProperty('name', 'Billy Booster')
    expect(billy).toHaveProperty('email', 'billy@booster.com')
  })

  it('can update records', () => {
    this.DB.transact(changes => {
      changes.put('author', 1, 'name', 'Shirly Forth')
    })

    let shirly = this.DB.get('author', 1, ['name'])

    expect(shirly).toHaveProperty('name', 'Shirly Forth')
  })

  it('can reverse changes', () => {
    this.DB.transact(changes => {
      changes.put('author', 1, 'name', 'Shirly Forth')
    })

    let shirly = this.DB.get('author', 1, ['name'])

    expect(shirly).toHaveProperty('name', 'Shirly Forth')

    this.DB.rollback()

    let sally = this.DB.get('author', 1, ['name'])

    expect(sally).toHaveProperty('name', 'Sally Forth')
  })

  it('can compress history', () => {
    this.DB.transact(changes => {
      changes.put('author', 1, 'name', 'Shirly Forth')
    })

    this.DB.transact(changes => {
      changes.put('author', 1, 'name', 'Cindy Forth')
    })

    this.DB.transact(changes => {
      changes.put('author', 1, 'name', 'Sharill Forth')
    })

    expect(this.DB.head.parent).not.toBe(null)

    this.DB.compress()

    expect(this.DB.head.parent).toBe(null)

    let sharill = this.DB.get('author', 1, ['name'])

    expect(sharill).toHaveProperty('name', 'Sharill Forth')

    expect(this.DB.head.parent).toBe(null)
  })

  it('can enumerate over records', () => {
    let billy = {}

    this.DB.each('author.0', function(path, value) {
      const [_resource, _entity, attribute] = path

      billy[attribute] = value
    })

    expect(billy).toEqual({
      id: 0,
      name: 'Billy Booster',
      email: 'billy@booster.com'
    })
  })
})
