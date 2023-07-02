import {readFileSync, writeFileSync} from 'fs';
import {input, output, snk, Snk, src, Src} from "../../components/monad-io";
import {label} from "../../components/label";
import {bind} from "../../components/monad";

// IO_EXAMPLES_____________________________________________

// here I provide types & primitives to create sources and sinks,
// and to perform I/O on these.
// the idea is that the programmer must create sources and sinks,
// and then use them in the monad.
// why: there are so many libraries for doing I/O; we cannot
// possibly support them all. we can support e.g. files & sockets.
// for anything beyond that, we provide these constructs so that
// the user of our library can themselves define the sources and
// sinks.

// Ref<L,V> : L cannot be fiddled with.
// how to hack that constraint in TypeScript's subtyping:
// (_ : L) => L ; this cannot be sub- or supertyped!
// but, why did we need that for Ref<...>?
// because you can do both input and output on references. surely,
// I am allowed to up-classify sources and down-classify sinks.
// since you rarely do I/O on the exact same thing,
// I'm modeling sources and sinks separately.
// Src<L,V>, and Snk<L,V>.
// (I'm modeling the down-classifiability using PC; should really be renamed,
// e.g. to Contra<L>)

namespace example_io {
    // first, our two principals:
    const amy = "Amy"
    const bob = "Bob"
    type Amy = typeof amy
    type Bob = typeof bob

    // next, a source and sink for each of them.
    const src_amy: Src<Amy, string> = src(amy, () => {
        const b = readFileSync("amy-src.txt");
        return b.toString()
    })
    const src_bob: Src<Bob, string> = src(bob, () => {
        const b = readFileSync("bob-src.txt");
        return b.toString()
    })
    const snk_amy: Snk<Amy, string> = snk(amy, (s) => {
        writeFileSync("amy-snk.txt", s)
    })
    const snk_bob: Snk<Bob, string> = snk(bob, (s) => {
        writeFileSync("bob-snk.txt", s)
    })

    // finally, some I/O:

    // can read from a source; that's a monad.
    const mar = input(src_amy)
    // can write to a sink; that's a monad.
    const mbw = output(snk_bob)(label(bob, "Hello from Bob!\n"))

    // can read from amy-source, and write what's read to amy-sink.
    const bd0 = bind(input(src_amy), output(snk_amy))

    // cannot write amy-labeled data to bob-labeled sink
    //const bd1 = bind( inp(src_amy), out(snk_bob) )

    // WOOPS; deconstructing Labeled<L,V> (pattern match "([l,s]) =>" aka destructuring assignm.)
    // w/o using API primitives (unlabel), then I completely circumvent IFC altogether!
    // looks like we need Labeled<...> to be opaque to prevent this.
    // (encapsulation? i.e. classes, function closures, private variables, etc.?)
    //const bd2 = bind( mar, ([l,s]) => out(snk_bob)([bob,s]) )
}
