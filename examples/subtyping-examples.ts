import {botLevel, Top, topLevel} from "../src/components/lattice";
import {Contravariant, Invariant} from "../src/misc/subtyping";

namespace example_subtyping {
    // Covarance examples
    const cvn: never = botLevel
    const cvs: string = "Falaffel"
    // never <: string, so we can assign a never to a string. (can up-classify type)
    const cv0: string = cvn
    // @ts-expect-error : string </: never.
    const cv1: never = cvs

    // Contravariance examples
    const con: Contravariant<never> = (_: never) => null
    const cos: Contravariant<string> = (_: string) => null
    // @ts-expect-error : string </: never. (cannot down-classify a never to a string)
    const co0: Contravariant<string> = con
    // never <: string, so we can assign a string to a never (can down-classify type).
    const co1: Contravariant<never> = cos

    // Invariance examples
    const nvn: Invariant<never> = (_: never) => {
        return _
    }
    const nvs: Invariant<string> = (_: string) => {
        return _
    }
    // @ts-expect-error : cannot covariably modify the type.
    const nv0: Invariant<string> = nvn
    // @ts-expect-error : cannot contravariably modify the type.
    const nv1: Invariant<never> = nvs
}



// TODO: Should we make this type opaque? 🤔
// W: yes; we don't want user of lib to pull stuff out of a monad willy nilly.

namespace example_contravariance_again {
    // shrinking the domain - that's OK
    const ssn: (x: string) => null = (x: string | number) => null
    // @ts-expect-error : function not defined on full domain string | number
    const sns: (x: string | number) => null = (x: string) => null

    const amy: "Amy" = "Amy"
    const bob: "Bob" = "Bob"

    // @ts-expect-error : Top not subtype of amy
    const cas: typeof amy = topLevel
    // amy <: Top ==> Top constant can house amy values
    const csa: Top = amy
    // @ts-expect-error : bob not subtype of amy
    const cab: typeof amy = bob

    // shrinking the domain - that's OK
    const a_s: (x: typeof amy) => null = (x: Top) => null
    // @ts-expect-error : function not defined on full domain string
    const s_a: (x: Top) => null = (x: typeof amy) => null
    // @ts-expect-error : function not defined on full domain typeof amy (domains disjoint)
    const a_b: (x: typeof amy) => null = (x: typeof bob) => null
}