import {bind, LIO, ret, toLabeled, unLabel} from "../src/components/monad";
import {Bot, botLevel, Level, LUB, lub, Top, topLevel} from "../src/components/lattice";
import {toContravariant} from "../src/misc/subtyping";
import {downPC, upData} from "../src/components/monad-utility";
import {label, Labeled} from "../src/components/label";

namespace example_reclassify {
    const c0: LIO<Top, Bot, number> = [toContravariant(topLevel), botLevel, 5]

    const c1 = downPC(lub("Alice", "Bob"), c0)
    const c2 = downPC("Alice", c1)
    // @ts-expect-error : "Alice" | "Bob" PC not downgradable to "Eve"
    const c3 = downPC("Eve", c1)

    const c4 = upData("Alice", c0)
    const c5 = upData(lub("Alice", "Bob"), c4)
    // @ts-expect-error : "Alice" | "Bob" data not upgradable to "Alice"
    const c6 = upData("Alice", c5)
    // @ts-expect-error : "Alice" | "Bob" data not upgradable to "Eve"
    const c7 = upData("Eve", c5)
    const c8 = upData(lub(lub("Alice", "Bob"), "Eve"), c5)
}

namespace examples_unLabel {
    const amy = "Amy"
    const bob = "Bob"
    const c0 = label<LUB<typeof amy, typeof bob>, number>(amy, 5) // : Labeled<"Amy" | "Bob", number>
    const m0 = unLabel(c0) // : LIO<toplevel, "Amy" | "Bob", number>
}

namespace examples_ret {
    const r0 = ret(4) // most precise type inferred
    const amy = "Amy"
    // look, subtyping works; can upclassify data of ret.
    const f1: <V, >(v: V) => LIO<Top, typeof amy, V> = ret
    // look, subtyping works; can downclassify pc of ret.
    const f2: <V, >(v: V) => LIO<typeof amy, Bot, V> = ret
}

namespace example_bind {
    const amy = "Amy"
    const bob = "Bob"
    const lb = label(amy, 5)         // Labeled< "Amy", number >
    const m0 = ret(lb)               // LIO< string, never, Labeled<"Amy",number> >
    const f0 = ret
    const m1 = bind(m0, f0)           // LIO< string, never, Labeled<"Amy",number> > (c1 through a pipe; so far ok)
    const m2 = bind(m1, unLabel)      // LIO< string, "Amy", number > // data unlabeled properly; so far ok

    // FIXED: no longer an error.
    // ts-expect-error : ret creates monad w/ data_level = botlevel, but bind requires L <: Z; hence error.
    const m_ = bind(m2, ret)

    const f1: <V>(v: V) => LIO<Top, typeof amy, V> = ret
    const m3 = bind(m2, f1)          // 🎉
    const m4 = downPC(botLevel, m3)

    const m5 = downPC(amy, ret(5))
    const m6 = bind(m5, ret)
    const m7 = bind(m5, f1)          // 🎉
}

namespace example_to_labeled {
    const amy = "Amy"
    const bob = "Bob"

    // suppose we have some Amy-data sitting in our monad.
    const m0 = bind(ret(label(amy, 5)), unLabel)

    // what happens if we to_label it?
    // data becomes boxed (with data-level - amy), and data-level goes to bot.
    const m1 = toLabeled(m0)
}

// Concatenating labeled strings.
// Types are generic in labels on the strings,
// and say what the return type should be (lub).
namespace example_concat {
    // see page 3 of
    // https://people.kth.se/~buiras/publications/icfp2015.pdf
    const lconcat
        : <
        L1 extends Level,
        L2 extends Level
    >(
        lb1: Labeled<L1, string>,
        lb2: Labeled<L2, string>
    ) =>
        LIO<Top, LUB<L1, L2>, string>
        = <
        L1 extends Level,
        L2 extends Level
    >(
        lb1: Labeled<L1, string>,
        lb2: Labeled<L2, string>
    ) => {
        const m1 = unLabel(lb1)
        const m2 = unLabel(lb2)
        return bind(m1, (s1: string) => bind(m2, (s2: string) => ret(s1 + s2)))
    }

    const lconcat2
        : <L1 extends Level, L2 extends Level>(lb1: Labeled<L1, string>, lb2: Labeled<L2, string>)
        => LIO<Top, Bot, Labeled<LUB<L1, L2>, string>>
        = <L1 extends Level, L2 extends Level>(lb1: Labeled<L1, string>, lb2: Labeled<L2, string>) => {
        const m = lconcat(lb1, lb2)
        return toLabeled(m)
    }
}