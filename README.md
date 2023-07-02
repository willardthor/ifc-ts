# ifc-ts | Information-Flow Control in TypeScript

> 💡 Why use this library? It limits what you can do.
> 
> For the same reasons you wear safety gear when doing dangerous work: it is restricting and cumbersome, but you do it for protection. ⛑️🧑‍🚀

## Introduction
ifc-ts is a library that provides developers with an API
for specifying information-flow security constraints in
effectful code. These constraints are checked statically
by TypeScript's type checker. Consequently, if an effectful
computation, written using this API, is well-typed, then it
is information-flow secure (aka. noninterfering).

A developer specifies information-flow constraints by
assigning labels to information sources and sinks, and
by performing I/O on these sources and sinks using the
I/O operations of our labeled-I/O monad. Our monad
tracks the labels of I/O operations, and prohibits
chaining I/O operations that would leak information.

(This approach is in line with a long line of work on
using monads for information-flow control, popularized
by the LIO library in Haskell).

Our implementation reduces information-flow security
checks to checks performed by TypeScript's type checker.
Notably, we compute lattice operations and checks at the
type-level, by using type constraints (and narrowing),
conditional types, and subtyping.

## Quickstart
In your typescript project, run ```npm install ifc-ts```.
Then, in your code, import types and functions you need from the library like so:

```typescript
import {label} from 'ifc-ts';
import type {Label} from 'ifc-ts';

const myLabel: Label = label('my value');
```
And that's it, you're ready to go!

## Examples

We have various examples in the [examples/]() directory. Make sure to check them out to get the most out of this library.


## Build

To compile & run this file:

```sh
tsc
node ifc-ts
```

For this to work, you need the library ifc-ts depends on:
`@types/node`. Install it with

```sh
npm install @types/node
```

You also need `tsc` (TypeScript compiler), `node` (a 
JavaScript runtime), and possibly an updated `npm`.
(I personally installed `npm` through my package manager,
reconfigured -g to point inside ${HOME}, then installed 
latest version of `npm`, `node`, and `typescript`. details
[here](https://github.com/sindresorhus/guides/blob/main/npm-global-without-sudo.md))

