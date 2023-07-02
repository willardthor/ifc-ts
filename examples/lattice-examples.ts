import {glb, LEQ, lub} from "../src/components/lattice";

namespace example_lub_glb {
    const e0 = lub("Alice", "Bob") // "Alice" | "Bob"
    const e1 = lub(e0, "Eve")      // "Alice" | "Bob" | "Eve"
    const f0 = glb("Alice", "Bob") // never
    const f1 = glb("Alice", e0)    // "Alice"
    const f2 = glb("Alice", e1)    // "Alice"
    const f3 = glb(e0, e1)         // "Alice" | "Bob"
}

namespace example_leq {
    const al = "Alice"
    const bo = "Bob"
    const w0: LEQ<typeof al, typeof al | typeof bo> = true
    // @ts-expect-error : if not a subtype, then type error 🎉
    // (ignore w1 type; try wiping these comments & see what happens)
    const w1: LEQ<typeof al | typeof bo, typeof al> = true
}
