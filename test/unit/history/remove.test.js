import History from '../../../src/history'
import Microcosm from '../../../src/microcosm'

describe('History::remove', function() {

  it('resets when there are no actions left', function() {
    let history = new History({ maxHistory: Infinity })
    let root = history.root

    expect(history.size).toBe(1)

    history.remove(history.root)

    expect(history.root).not.toEqual(root)

    expect(history.root.command.name).toEqual('$start')
  })

  it('does not remove the root when given a node outside the tree', function () {
    let history = new History()
    let action = history.append('test')

    history.remove(action)

    jest.spyOn(history, 'clean')

    history.remove(action)

    expect(history.clean).not.toHaveBeenCalled()
  })

  describe('removing the head', function () {

    it('adjusts the head to the prior node', function() {
      let history = new History({ maxHistory: Infinity })

      history.append(function one () {}, 'resolve')
      history.append(function two () {}, 'resolve')
      history.append(function three () {}, 'resolve')

      let head = history.head
      let prior = head.parent

      history.remove(head)

      expect(history.head.id).toBe(prior.id)
    })

    it('removes the node from the active branch', function() {
      let history = new History({ maxHistory: Infinity })

      let one = history.append(function one () {}, 'resolve')
      let two = history.append(function two () {}, 'resolve')
      let three = history.append(function three () {}, 'resolve')

      history.archive()

      history.remove(three)

      expect(history.map(a => a.command.name)).toEqual(['$start', 'one', 'two'])
    })

    it('removing the head node eliminates the reference to "next"', function() {
      let history = new History({ maxHistory: Infinity })

      let one = history.append(function one () {}, 'resolve')
      let two = history.append(function two () {}, 'resolve')
      let three = history.append(function three () {}, 'resolve')

      history.archive()

      history.remove(three)

      expect(history.head.next).toBe(null)
    })
  })

  describe('removing the root', function () {

    it('adjusts the root to the next node', function() {
      let history = new History({ maxHistory: Infinity })

      history.append(function one () {}, 'resolve')
      history.append(function two () {}, 'resolve')
      history.append(function three () {}, 'resolve')

      let root = history.root
      let next = root.next

      history.remove(root)

      expect(history.root.id).toBe(next.id)
    })

    it('updates the active branch', function() {
      let history = new History({ maxHistory: Infinity })

      let one = history.append(function one () {}, 'resolve')
      let two = history.append(function two () {}, 'resolve')
      let three = history.append(function three () {}, 'resolve')

      history.archive()

      history.remove(history.root)

      expect(history.map(a => a.command.name)).toEqual(['one', 'two', 'three'])
    })

  })

  describe('removing an intermediary node', function () {

    it('joins the parent and child', function() {
      let history = new History({ maxHistory: Infinity })

      let one = history.append(function one () {}, 'resolve')
      let two = history.append(function two () {}, 'resolve')
      let three = history.append(function three () {}, 'resolve')

      history.archive()

      history.remove(two)

      expect(history.map(a => a.command.name)).toEqual(['$start', 'one', 'three'])
    })

  })

  describe('children', function () {

    it('eliminates references to removed on the left', function() {
      let history = new History({ maxHistory: Infinity })

      let one = history.append(function one () {}, 'resolve')
      let two = history.append(function two () {}, 'resolve')

      history.checkout(one)

      let three = history.append(function three () {}, 'resolve')

      history.remove(two)

      expect(one.children.map(i => i.command.name)).toEqual(['three'])
    })

  })

})
