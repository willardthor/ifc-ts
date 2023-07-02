import {label, Labeled, labelOf} from "../components/label";
import {Bot, botLevel, GLB, Level, lub, LUB, Top} from "../components/lattice";

namespace examples_labels_as_values {
    const amy = "Amy"
    const bob = "Bob"
    // suppose we don't keep any levels at the value-level.
    type Lb<L extends Level, V> = V // type system remarks that L is redundant, but says OK.
    const x0: Lb<typeof amy, number> = 4
    const x1: Lb<typeof bob, number> = 4
    let x2 = x0
    // then the following succeeds (despite x2 being a Amy-container)
    x2 = x1
    // now suppose we keep levels at the value-level.
    const y0: Labeled<typeof amy, number> = [amy, 4]
    const y1: Labeled<typeof bob, number> = [bob, 4]
    let y2 = y0
    // @ts-expect-error : cannot assign Bob-labeled data to Amy-container
    y2 = y1
}

namespace examples_label {

    // Here are two principals (they are strings)
    type Alice = "Alice"
    type Bobby = "Bobby"
    const alice: Alice = "Alice"
    const bobby: Bobby = "Bobby"

    // We can label a number with the principal
    const a0: Labeled<Alice, number> = label<Alice, number>("Alice", 3)
    // @ts-expect-error : cannot assign Alice-labeled data to
    // a placeholder of Bobby-labeled data
    const a1: Labeled<Bobby, number> = label<Alice, number>("Alice", 3)

    // We can't use types as values (hence we passed "Alice" as input to 'labeled' above)
    // But we can use values as types (with 'typeof').
    const a2: Labeled<Alice, number> = label<Alice, number>(alice, 3)

    // Alice-labeled data can be stored in
    // a placeholder for Alice-or-Bobby-labeled data
    const b0: Labeled<Alice | Bobby, number> = label<Alice, number>(alice, 4)
    // above is the same as using least upper bound.
    const b1: Labeled<LUB<Alice, Bobby>, number> = label(alice, 5) // LUB gone due to narrowing!
    // @ts-expect-error : cannot assign Alice-or-Bobby-labeled data to
    // a placeholder of Alice-labeled data
    const b2: Labeled<Alice, number> = label<LUB<Alice, Bobby>, number>(alice, 5)

    // TypeScript can infer the type of variables (tightly), from other type information you provide.
    // here the type is inferred to Labeled<Alice|Bob, number>
    const c0 = label<LUB<Alice, Bobby>, number>(alice, 5)
    // here the type is inferred, despite generics not being provided explicitly.
    const c1 = label(lub(alice, bobby), 5)
    // testing GLB:
    const c2 = label<GLB<Alice, Alice>, number>(alice, 5)
    // @ts-expect-error : GLB<Alice, Bobby> = never, Alice is not an element of never.
    const c3 = label<GLB<Alice, Bobby>, number>(alice, 5)

    const d0 = labelOf(c0)
}

namespace examples_bot_top {
    const amy = "Amy"
    const bob = "Bob"
    const c0 = label<LUB<typeof amy, typeof bob>, number>(amy, 5)
    const c1 = label<LUB<typeof amy, Top>, number>(amy, 5)
    const c2 = label<GLB<typeof amy, Top>, number>(amy, 5)
    // LABELED_HACK - here is where we needed it.
    // w/o the hack, we would get a 'never'-creep;
    // the type would be 'never' instead of [never, number]
    const c3 = label<GLB<typeof amy, Bot>, number>(botLevel, 5)
    const c4 = label(botLevel, 5)

    const d1 = labelOf(c4)
}