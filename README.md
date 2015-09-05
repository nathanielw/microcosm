![Microcososm](http://f.cl.ly/items/36051G3A2M443z3v3U3b/microcososm.svg)
---

A variant of [Flux](https://facebook.github.io/flux/) with
central, isolated state.

Microcosm makes it easier to control and modify state in a pure,
centralized way. It thinks of stores and actions as stateless, collections of pure functions, keeping all data encapsulated in one place.

This design seeks to achieve a
reasonable trade off between the simplicity of singletons and the
privacy of class instances.

For a deeper dive, check out the [docs](./docs) or continue below.

---

[![Circle CI](https://circleci.com/gh/vigetlabs/microcosm.svg?style=svg)](https://circleci.com/gh/vigetlabs/microcosm)

---

## Overview

Microcosm treats actions and stores as singletons, however they do not contain any state.

Actions are called within the context of a particular instance of Microcosm:

```javascript
let addPlanet = function (params) {
  return params
}

app.push(addPlanet, params)
```

Stores hold no state. Stores are collections of functions that transform
old data into new data, with a hook that `register`s them with the Microcosm.

```javascript
let Planets = {
  register() {
    return {
      [addPlanet] : this.add
    }
  },
  add(planets, props) {
    return planets.concat(props)
  }
}

let app = new Microcosm()

// All state is contained in `app`, but transformed with `Planets`
app.addStore(Planets, 'planets')
```

From there, an app's state can be sent down your React component tree:

``` javascript
React.render(<SolarSystem app={ app } planets={ app.get('planets') } />, document.body)
```

## Opinions

1. Action CONSTANTS are automatically generated by assigning
   each Action function a unique `toString` signature under the hood.
3. Actions dispatch parameters by returning a value or a promise (only
   dispatching when it is resolved)
3. Actions handle all asynchronous operations. Stores are
   synchronous.
4. Stores do not contain data, they _transform_ it.

## What is it trying to solve?

1. State isolation. Requests to render applications server-side should
   be as stateless as possible. Client-side libraries (such as
   [Colonel Kurtz](https://github.com/vigetlabs/colonel-kurtz)) need easy
   containment from other instances on the page.
2. Singletons are simple, but make it easy to accidentally share
   state. Microcosm keeps data in one place, operating on it
   statelessly in other entities.
3. Easy extension of core API and layering of features out of the
   framework's scope.

## What is it probably not good for?

Large applications. There's nothing stopping you from doing it, but Microcosm is tested against small to medium sized apps. If the ideas in Microcosm are attractive for your large application, check out [NuclearJS](https://github.com/optimizely/nuclear-js/).

## Tutorials

[The Overview](docs/guides/01-overview.md) is a great place to
start. With that background, [Design](docs/design.md) may help to
provide an additional high level overview of how things work. Beyond
that, check out [the example apps](examples).

## Examples

Examples can be found in the [`./examples`](./examples) directory. To run these examples:

```bash
npm install
npm start
```

This will run [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server) at [http://localhost:8080](http://localhost:8080). From there, examples can be viewed by navigating to their associated path, such as [http://localhost:8080/simple-svg](http://localhost:8080/simple-svg).

## Documentation

There is documentation [here](docs). This includes high level
overviews of framework architecture, guides, and API documentation for
the individual components of Microcosm.

## Inspiration

- [Worlds](http://www.vpri.org/pdf/rn2008001_worlds.pdf)
- [Om](https://github.com/omcljs/om)
- [Elm Language](https://elm-lang.org)
- [Flummox](https://github.com/acdlite/flummox)
- [But the world is mutable](http://www.lispcast.com/the-world-is-mutable)
- [Event Sourcing Pattern](http://martinfowler.com/eaaDev/EventSourcing.html)
