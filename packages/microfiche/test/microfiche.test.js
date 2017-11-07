import { Database } from '../src/microfiche'

function seed(changes) {
  changes.putMany([
    ['author', 0, 'id', 0],
    ['author', 0, 'name', 'Billy Booster'],
    ['author', 0, 'email', 'billy@booster.com'],
    //
    ['author', 1, 'id', 1],
    ['author', 1, 'name', 'Sally Forth'],
    ['author', 1, 'email', 'sally@forth.com'],
    //
    ['post', 0, 'id', 0],
    ['post', 0, 'title', 'Blockchain analysis'],
    ['post', 0, 'content', 'Block chains are cool.'],
    ['post', 0, 'author', 0],
    //
    ['post', 1, 'id', 1],
    ['post', 1, 'title', 'Fun with JavaScript'],
    ['post', 1, 'content', 'JavaScript. JavaScript. JavaScript.'],
    ['post', 1, 'author', 1],
    //
    ['post', 2, 'id', 2],
    ['post', 2, 'title', 'Elixir for Rubyists'],
    ['post', 2, 'content', 'Elixir is not Ruby.'],
    ['post', 2, 'author', 1]
  ])
}

describe('Microfiche', function() {
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

    this.DB.compress()

    let sharill = this.DB.get('author', 1, ['name'])

    this.DB.rollback()

    expect(sharill).toBe(null)
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

  it('can remove records', () => {
    this.DB.transact(changeset => {
      changeset.remove('author.0')
    })

    expect(this.DB.get('author', '0', ['id', 'name', 'email'])).toEqual(null)
  })
})
