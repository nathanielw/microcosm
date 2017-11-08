import Microcosm from 'microcosm'

let action = a => a

describe('Domain::register', function() {
  it.only('sends actions in the context of the domain', function() {
    let repo = new Microcosm()

    repo.addDomain('users', {
      test: true,

      register() {
        return {
          [action](changes) {
            changes.put('users', 1, 'name', 'billy')
          }
        }
      }
    })

    repo.push(action)

    expect(repo.database.get('users', 1, ['name'])).toEqual({ name: 'billy' })
  })

  it('returns the same state if a handler is not provided', function() {
    let repo = new Microcosm()

    repo.addDomain('test', {
      getInitialState() {
        return 'test'
      }
    })

    return repo.push(action).onDone(function() {
      expect(repo).toHaveState('test', 'test')
    })
  })

  describe('nesting', function() {
    it('allows domains nested registration methods', function() {
      let repo = new Microcosm()
      let handler = jest.fn()

      let domain = repo.addDomain('test', {
        register() {
          return {
            [action]: {
              open: handler,
              update: handler,
              reject: handler,
              resolve: handler,
              cancel: handler
            }
          }
        }
      })

      expect(domain).toRegister(action, 'open')
      expect(domain).toRegister(action, 'update')
      expect(domain).toRegister(action, 'reject')
      expect(domain).toRegister(action, 'resolve')
      expect(domain).toRegister(action, 'cancel')
    })
  })
})
