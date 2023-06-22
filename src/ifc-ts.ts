/* Information-Flow Control in TypeScript

The following is a proof-of-concept implementation of
ifc-ts. This file is structured as follows:

 - Lattice
 - Labels
 - Subtyping
 - LIO Monad
 - IO Examples
  
 */ 

// LATTICE_________________________________________________

// Our lattice is the standard powerset lattice.

// TODO: make our code instead be generic in the lattice.
// how to make a generic lattice at the type-level? 🤔

// We denote a principal by a string.
export type Principal = string

/* // A level is a set of principals.
type Level = Set<Principal> */

// A level is, in principle, a set of principals.
// but, since types are really just sets of values,
// union types & narrowing will make [the type that
// typescript infers] behave like a set of principals.
// (i.e. "Alice" | "Bob" ≈ { "Alice", "Bob" })
// so we can leave out the Set<...> indirection.
type Level = Principal

// Type-level function for least upper bound is just 
// a set union.
type LUB<L extends Level, R extends Level> = true extends true ? L | R : L | R

// note: this definition is equivalent to "... = L | R".
// why that redundant-looking "extends"? to force the 
// type-level thunk LUB<...> to be evaluated (i.e. to narrow 
// the type, so something of type LUB<L,R> will be inferred 
// to have type L|R, not LUB<L,R>. see e0 and b1 below)

// Value-level function for least upper bound.
function lub <L extends Level, R extends Level> ( l : L, r : R ) : LUB<L,R> {
    return l
    // the return type is actually L ; making it 
    // L | R is actually weakening the guarantee 
    // of the function. however, that's exactly 
    // what we want here.
    // if we need the implementation to compute
    // something of type L | R, then we can use 
    //return (Math.random() > 0.5) ? l : r
    // (but that's a runtime overhead that's 
    // unnecessary when we only need this for 
    // type checking)
}

// Type-level function for greatest lower bound is just 
// a set intersection.
type GLB<L extends Level, R extends Level> = true extends true ? L & R : never 

// note: this definition is equivalent to "... = L | R".
// see thunk-stuff above.

function glb <L extends Level, R extends Level> ( l : L, r : R ) : GLB<L,R> {
    return botlevel
    // idea: if l === r then return l else return botlevel.
    // if condition is true, then (typeof l) <: R and (typeof r) <: R.
    // that is, l is    in L & R.
    // botlevel is also in L & R.
    // sadly, there's a shortcoming in TypeScript's type system:
    // the type system does not consider that Level <: string, 
    // and thus won't produces a type error at l === r.
    // to get around this, I compare l and r as strings, and then
    // assert the type of the then-branch.
    // (so, while this is a hack, it is a sound one)
    /*
    const sl : string = l
    const sr : string = r
    if ( sl === sr ) {    
        return l as L & R // branch is true ==> l : L and l : R
    } else { 
        return botlevel
    }
    */
}

namespace example_lub_glb{
    const e0 = lub("Alice", "Bob") // "Alice" | "Bob"
    const e1 = lub(e0, "Eve")      // "Alice" | "Bob" | "Eve"
    const f0 = glb("Alice", "Bob") // never
    const f1 = glb("Alice", e0)    // "Alice"
    const f2 = glb("Alice", e1)    // "Alice"
    const f3 = glb(e0, e1)         // "Alice" | "Bob"
}

// Type-level less-than-or-equal.
// checks if L <: R. (IDE points out that L is unused; just ignore that)
type LEQ<L extends R, R extends Level> = true

// above is a neat hack that capitalizes on the fact that lattice 
// leq is modeled as typescript-subtyping. 
// if L <: R, then true, else type error.

// old implementation was considerably more elaborate:
// checks if left-hand-side equals the intersection of both sides.
//type LEQ<L extends Level, R extends Level> = 
//    true extends true ? Equal<L, GLB<L, R>> : never
//    [L, R] extends [Level, Level] ? Equal<L, GLB<L, R>> : never

namespace example_leq{
    const al = "Alice"
    const bo = "Bob"
    const w0 : LEQ<typeof al, typeof al | typeof bo> = true 
    // @ts-expect-error : if not a subtype, then type error 🎉 
    // (ignore w1 type; try wiping these comments & see what happens)
    const w1 : LEQ<typeof al | typeof bo, typeof al> = true    
}

// bottom and top lattice element, type-level (empty-set & full-set)
type Bot = never
type Top = Level

// bottom and top lattice element (a hack, as I'm asserting the type).
const botlevel : Bot = "👇" as Bot // type represents empty set of principals
const toplevel : Top = "👆" as Top // type represents full  set of principals

// examples below.

// LABELS__________________________________________________

// Labeled value.
type Labeled<L extends Level, V extends any> = [L, V]

// no trick to force-evaluate the type-level thunk;
// we want to keep it, because we want this type to be opaque.

// note: while we introduce security levels to 
// check for information-flow security violations at *compile-time*,
// we do (sadly) need to keep levels at the value-level.
// this is because of structural types (duck typing).

// examples that illustrates why:
namespace examples_labels_as_values {
    const amy = "Amy"
    const bob = "Bob"
    // suppose we don't keep any levels at the value-level.
    type Lb<L extends Level, V> = V // type system remarks that L is redundant, but says OK.
    const x0 : Lb<typeof amy, number> = 4
    const x1 : Lb<typeof bob, number> = 4
    let x2 = x0
    // then the following succeeds (despite x2 being a Amy-container)
    x2 = x1
    // now suppose we keep levels at the value-level.
    const y0 : Labeled<typeof amy, number> = [amy, 4]
    const y1 : Labeled<typeof bob, number> = [bob, 4]
    let y2 = y0
    // @ts-expect-error : cannot assign Bob-labeled data to Amy-container 
    y2 = y1
}

// TODO: Do we actually need levels at the value-level? 🤔
// W: Yes (structural types / duck typing)

// TODO: Should we make this type opaque? 🤔
// W: yes; see the end.
//    read up on branded types, Singleton, closures, interfaces, modules, classes.

// LABELED_HACK: the [] on 'L' and 'Level', while theoretically redundant,
// are needed to avoid a 'never'-creep - see below.
// W: I have removed this hack, as it appears to be unnecessary at the moment.

// Attach a label to a value.
function label<L extends Level, V> ( l : L, v : V) : Labeled<L, V> {
    return [ l, v ]
}

// Project labeled-value to the value.
// internal use only; must NOT be part of the exposed API.
function unsafe_value_of<L extends Level, V> ( lv : Labeled<L, V> ) : V {
    const [ l, v ] = lv
    return v
}

// Project labeled-value to the label.
function label_of<L extends Level, V> ( lv : Labeled<L, V> ) : L {
    const [ l, v ] = lv
    return l
}

// Up-classify label on labled-value
function up_label<L extends L_, L_ extends Level, V> ( l_ : L_ ) : ( _ : Labeled<L, V> ) => Labeled<L_, V> {
    return ( [ _, v ] : Labeled<L, V>) => { return label(l_, v) }
}

namespace examples_label {
    
    // Here are two principals (they are strings)
    type Alice  = "Alice"
    type Bobby  = "Bobby"
    const alice : Alice = "Alice"
    const bobby : Bobby = "Bobby"

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
    const c1 = label(lub(alice,bobby), 5)
    // testing GLB:
    const c2 = label<GLB<Alice, Alice>, number>(alice, 5)
    // @ts-expect-error : GLB<Alice, Bobby> = never, Alice is not an element of never.
    const c3 = label<GLB<Alice, Bobby>, number>(alice, 5)

    const d0 = label_of(c0)
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
    const c3 = label<GLB<typeof amy, Bot>, number>(botlevel, 5)
    const c4 = label(botlevel, 5)

    const d1 = label_of(c4)
}

// SUBTYPING_______________________________________________

// we want to specify which (values of which) types can be
// substituted with   which (values of which) types.
// i.e. we want to specify how a type is subtyped.

// Covariance & Contravariance
// https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)

// subtyping in TypeScript is covariant by default.
// so, when we want to _preserve_ normal subtyping, we do nothing.
// (this type constructor is therefore completely superfluous; we don't use it)
type Covariant<T> = T

// sometimes, we'll need to _reverse_ the subtyping of a type, 
// i.e. make it contravariant. (PC, later).
// we model contravariance using function types, since 
// TypeScript subtyping for function arguments is already
// contravariant (as is standard for subtyping).
type Contravariant<T> = (_ : T) => null

function to_contravariant<T>( t : T ) : Contravariant<T> {
    return ( (_ : T) => null )
}

function from_contravariant<T>( ct : Contravariant<T>) : T {
    const r : T = botlevel as T // hack that only works with levels...
    return r
}

// finally, we may need to prohibit subtyping a type, 
// i.e. make it invariant.
// we model invariance using function types, by
// making the argument- and return-type of the function 
// be the same. that way, 
// covariably     modifying the type violate contravariance of the argument type, and 
// contravariably modifying the type violate covariance     of the return   type. 
type Invariant<T> = (_ : T) => T

namespace example_subtyping {
    // Covarance examples
    const cvn : never  = botlevel
    const cvs : string = "Falaffel"
    // never <: string, so we can assign a never to a string. (can up-classify type)
    const cv0 : string = cvn
    // @ts-expect-error : string </: never.
    const cv1 : never  = cvs

    // Contravariance examples
    const con : Contravariant<never>  = (_ : never) => null
    const cos : Contravariant<string> = (_ : string) => null
    // @ts-expect-error : string </: never. (cannot down-classify a never to a string)
    const co0 : Contravariant<string> = con
    // never <: string, so we can assign a string to a never (can down-classify type).
    const co1 : Contravariant<never>  = cos

    // Invariance examples
    const nvn : Invariant<never>  = (_ : never)  => { return _ }
    const nvs : Invariant<string> = (_ : string) => { return _ }
    // @ts-expect-error : cannot covariably modify the type.
    const nv0 : Invariant<string> = nvn
    // @ts-expect-error : cannot contravariably modify the type.
    const nv1 : Invariant<never>  = nvs
}

// LIO_MONAD_______________________________________________

// See figure captioned
// "CG’s language syntax and type system (selected rules)"
// in paper
// "Types for Information Flow Control: Labeling Granularity and Semantic Models"
// by Vineet Rajani and Deepak Garg.
// (page 8 of https://arxiv.org/pdf/1805.00120.pdf )

// API:
//  - label l e
//  - unlabel e
//  - toLabeled e
//  - ret e
//  - bind e f

// (I'll add I/O at the end of this source file)

// Labeled-I-O type - our monad.
// all it does is narrow Lpc and L.
// (no force-eval type-level-thunk; I want this opaque).
//type LIO<Lpc extends Level, L extends Level, V> = [Lpc, L, V]
//type LIOdg<Lpc extends Level, L extends Level, V> = true extends true ?  (x : Lpc) => [L, V]  :  (x : Lpc) => [L, V] 
type LIO<Lpc extends Level, L extends Level, V> = [ Contravariant<Lpc>, L, V ]

// TODO: Should we make this type opaque? 🤔
// W: yes; we don't want user of lib to pull stuff out of a monad willy nilly.

//

namespace example_contravariance_again {
    // shrinking the domain - that's OK
    const ssn : (x : string) => null = (x : string | number) => null
    // @ts-expect-error : function not defined on full domain string | number
    const sns : (x : string | number) => null = (x : string) => null

    const amy : "Amy" = "Amy"
    const bob : "Bob" = "Bob"

    // @ts-expect-error : Top not subtype of amy
    const cas : typeof amy = toplevel
    // amy <: Top ==> Top constant can house amy values 
    const csa : Top = amy
    // @ts-expect-error : bob not subtype of amy
    const cab : typeof amy = bob

    // shrinking the domain - that's OK
    const a_s : (x : typeof amy) => null = (x : Top) => null
    // @ts-expect-error : function not defined on full domain string
    const s_a : (x : Top) => null = (x : typeof amy) => null
    // @ts-expect-error : function not defined on full domain typeof amy (domains disjoint) 
    const a_b : (x : typeof amy) => null = (x : typeof bob) => null
}

// some utility functions to manually up-classify data and down-classify pc.
// these are not required to use! (since subtyping the monad works as intended).
// however, they are useful for debugging.

function up_data<
    Lpc extends Level, L extends L_, L_ extends Level, V
>( 
    l_ : L_,
    m : LIO<Lpc, L, V>
):
    LIO<Lpc, L_, V> 
{
    const [lpc,l,v] = m
    return [lpc, l_, v]
}

function down_pc<
    Lpc_ extends Lpc, Lpc extends Level, L extends Level, V
>( 
    lpc_ : Lpc_,
    m : LIO<Lpc, L, V> 
):
    LIO<Lpc_, L, V>
{
    const [lpc, l, v] = m
    return [to_contravariant(lpc_), l, v]
}

namespace example_reclassify{
    const c0 : LIO<Top, Bot, number> = [to_contravariant(toplevel), botlevel, 5]

    const c1 = down_pc(lub("Alice", "Bob"), c0)
    const c2 = down_pc("Alice", c1)
    // @ts-expect-error : "Alice" | "Bob" PC not downgradable to "Eve"
    const c3 = down_pc("Eve", c1)

    const c4 = up_data("Alice", c0)
    const c5 = up_data(lub("Alice", "Bob"), c4)
    // @ts-expect-error : "Alice" | "Bob" data not upgradable to "Alice"
    const c6 = up_data("Alice", c5)
    // @ts-expect-error : "Alice" | "Bob" data not upgradable to "Eve"
    const c7 = up_data("Eve", c5)
    const c8 = up_data(lub(lub("Alice", "Bob"), "Eve"), c5)
}

// Our unlabel statement.
// typically, given Labeled<L,V>, the return type is LIO<PC, L, V> for any PC.
// instead, I make the type be the strongest guarantee, and will use
// subtyping to weaken this guarantee where needed.
function unlabel<L extends Level, V> ( lv : Labeled<L, V> ) : LIO<Top, L, V> {
    const [l, v] = lv
    return [to_contravariant(toplevel), l, v]
}

namespace examples_unlabel {
    const amy = "Amy"
    const bob = "Bob"
    const c0 = label<LUB<typeof amy, typeof bob>, number>(amy, 5) // : Labeled<"Amy" | "Bob", number>
    const m0 = unlabel(c0) // : LIO<toplevel, "Amy" | "Bob", number>
}

// Type for our ret statement.
// typically, its type is LIO<Lpc,L,V> for any Lpc and L.
// instead, I make the type be the strongest guarantee, and will use
// subtyping to weaken this guarantee where needed.
function ret<V>( v : V ) : LIO<Top, Bot, V> {    
    return [to_contravariant(toplevel), botlevel, v]
}

namespace examples_ret {
    const r0 = ret(4) // most precise type inferred
    const amy = "Amy"
    // look, subtyping works; can upclassify data of ret.
    const f1 : <V,>(v : V) => LIO<Top, typeof amy, V> = ret
    // look, subtyping works; can downclassify pc of ret.
    const f2 : <V,>(v : V) => LIO<typeof amy, Bot, V> = ret
}


// Type for our bind statement.
// it requires that Lo <= Ri (in addition to what LIO requires)
//type LIO_BIND<Lpc extends Level, L extends Level, Rpc extends Level, R extends Level, W> =
//    [LEQ<L, Rpc>, LEQ<L, R>] extends [true, true] ? LIO<GLB<Lpc, Rpc>, LUB<L,R>, W> : never 
//    LIO<GLB<Lpc,Rpc>, LUB<L,R>, W>
//    LIO<Rpc, R, W>

/*
// first working definition of bind. too algorithmic.
function bind0<
    Lpc extends Level, 
    V,
    Rpc extends Level, 
    R   extends Level,
    W
> ( 
    [lpc, l, v] : LIO<Lpc, GLB<Rpc, R>, V>,
    f : (_ : V) => LIO<Rpc, R, W>
) : 
    LIO< GLB<Lpc, Rpc>, R, W> 
{
    const [rpc, r, w] : LIO<Rpc, R, W> = f(v)
    //return down_pc(lpc, [rpc, r, w])
    return [to_contravariant( glb( from_contravariant(lpc), from_contravariant(rpc) ) ), r, w]
}
*/

/*
// A bind that's more in spirit with the paper. Does not type check for some reason...
function bind2<
    Lpc extends Level,
    L   extends Level,
    V,
    Rpc extends Level,
    R   extends Level,
    W,
    Zpc extends Level,
    Z   extends Level
> (
    [lpc, l, v] :   LIO<Lpc, L, V> ,
    fr : (_ : V) => LIO<Rpc, R, W>
) : 
    [Zpc, Zpc, L, L] extends [Lpc, Rpc, Rpc, R] ? LIO<Zpc, Z, W> : never
{
    const [rpc, r, w] : LIO<Rpc, R, W> = fr(v)
    return [rpc, r, w]
}
*/

/*
// A bind that's between bind2 and bind0. readable, but has redundant type arguments.
function bindZ<
    Lpc extends Level,
    L   extends GLB<Rpc,R>,   // L   <: Rpc and L   <: R
    V,
    Rpc extends Level,
    R   extends Level,
    W,
    Zpc extends GLB<Lpc,Rpc>, // Zpc <: Lpc and Zpc <: Rpc
> (
    [lpc, l, v] :   LIO<Lpc, L, V> ,
    fr : (_ : V) => LIO<Rpc, R, W>
) : 
    LIO<Zpc, R, W>
{
    const [rpc, r, w] : LIO<Rpc, R, W> = fr(v)
    return [rpc, r, w]
}
*/

/*
// A refinement of bindZ, w/ redundant type arguments removed.
function bindF<
    Lpc extends Level, 
    V,
    Rpc extends Level, 
    R   extends Level,
    W
> ( 
    m : LIO<Lpc, GLB<Rpc, R>, V>, // L   <: Rpc and L   <: R
    f : (_ : V) => LIO<Rpc, R, W>
) : 
    //LIO< GLB<Lpc, Rpc>, R, W>     // Zpc <: Lpc and Zpc <: Rpc
    LIO< GLB<Lpc, Rpc>, R, W>     // Zpc <: Lpc and Zpc <: Rpc
{
    const [lpc, l, v] = m
    const [rpc, r, w] : LIO<Rpc, R, W> = f(v)
    return [rpc, r, w]
}
*/

// while TypeScript can check that A <: B,
// TypeScript cannot "magically" find a B
// s.t. A <: B holds (like a human can) (*).
// this caused issues when I was using
// e.g. 'ret' on the rhs of bind in my above
// 'bind' implementations; TypeScript would 
// not automatically up-classify the data-level
// to make the other checks pass.
// the below implementation requires no such magic;
// it tells TypeScript how to compute the levels 
// of the resulting monad (using the 'GLB', 'LUB' 
// type constructors). 
// now the only way to get a type error when attempting 
// to construct a bind, is if L <: Rpc does not hold.
function bind<
    Lpc extends Level,
    L   extends Rpc,                // L <: Rpc
    V,
    Rpc extends Level, 
    R   extends Level,
    W
> ( 
    m : LIO<Lpc, L, V>,
    f : (_ : V) => LIO<Rpc, R, W>
) : 
    LIO< GLB<Lpc, Rpc>, LUB<L,R>, W> // Zpc <: Lpc , Zpc <: Rpc , L <: Z , R <: Z
{
    const [lpc, l, v] = m
    return f(v)
}


namespace example_bind {
    const amy = "Amy"
    const bob = "Bob"
    const lb = label(amy, 5)         // Labeled< "Amy", number >
    const m0 = ret(lb)               // LIO< string, never, Labeled<"Amy",number> >
    const f0 = ret
    const m1 = bind(m0,f0)           // LIO< string, never, Labeled<"Amy",number> > (c1 through a pipe; so far ok)
    const m2 = bind(m1,unlabel)      // LIO< string, "Amy", number > // data unlabeled properly; so far ok

    // FIXED: no longer an error.
    // ts-expect-error : ret creates monad w/ data_level = botlevel, but bind requires L <: Z; hence error.
    const m_ = bind(m2, ret)          

    const f1 : <V>(v : V) => LIO<Top, typeof amy, V> = ret
    const m3 = bind(m2, f1)          // 🎉
    const m4 = down_pc(botlevel, m3)

    const m5 = down_pc(amy, ret(5))
    const m6 = bind(m5, ret)
    const m7 = bind(m5, f1)          // 🎉
}

// if you have data in the monad,
// and you wish to write it to someplace,
// you'll need to box it.
// to_labeled will automatically assign 
// the appropriate label 
// to the box (i.e. the data-level).
// the pc does not go away; it might forbid
// writing this boxed value in a "next step".
function to_labeled <
    PC extends Level, 
    L  extends Level, 
    V
> ( m : LIO<PC, L, V> 
) : LIO<PC, Bot, Labeled<L, V>> {
    const [pc, l, v] = m
    return [pc, botlevel, label(l, v)]
}

namespace example_to_labeled {
    const amy = "Amy"
    const bob = "Bob"
 
    // suppose we have some Amy-data sitting in our monad.
    const m0 = bind(ret(label(amy, 5)), unlabel)

    // what happens if we to_label it?
    // data becomes boxed (with data-level - amy), and data-level goes to bot.
    const m1 = to_labeled(m0)
}

// QUALITY_OF_LIFE_________________________________________

// getting a value out of the monad
function unsafe_run_lio<Lpc extends Level, L extends Level, V>( m : LIO<Lpc, L, V> ) : V {
    const [lpc, l, v] = m
    return v
}

// quality of life: get the PC-level of the monad
function level_of_pc<Lpc extends Level, L extends Level, V>( m : LIO<Lpc, L, V> ) : LIO<Lpc, L, Lpc> {
    const [lpc, l, v] = m
    return ret( from_contravariant(lpc) )
}

// quality of life: get the data-level of the monad
function level_of_data<Lpc extends Level, L extends Level, V>( m : LIO<Lpc, L, V> ) : LIO<Lpc,L,L> {
    const [lpc, l, v] = m
    return ret( l )
}

// Implementing functions from fp-ts:

// https://github.com/gcanti/fp-ts/blob/master/src/
// monadC = chainC + applicativeC
// applicativeC = applyC + ofF
// ofF : <A>(a: A) => HKT<F, HKT<G, A>>
// i.e.: of: (a:A) => LIO<...,A>
// applyC = apF ( + FunctorC ?)
// apF : ap: <A, B>(fab: HKT<F, (a: A) => B>, fa: HKT<F, A>) => HKT<F, B>
// i.e.: ap: (mfab : LIO<..., A=>B>, ma : LIO<...,A>) => LIO<...,B>
// i.e.  apply f to arg under type constructor
// FunctorC = mapF
// mapF: map: <A, B>(fa: HKT<F, A>, f: (a: A) => B) => HKT<F, B>
// i.e.: map: (ma: LIO<...,A>, fab : (a:A)=>B ) => LIO<...,B>
// chainC = chainF
// chainF: <A, B>(fa: HKT<F, A>, f: (a: A) => HKT<F, B>) => HKT<F, B>
// i.e.: chain: <A,B>(ma:LIO<...,A>, famb : (a:A)=>LIO<...,B>) => LIO<...,B>

const of = ret

// aka. lift
function map<A,B,Lpc extends Level,L extends Level>(ma : LIO<Lpc,L,A>, fab : (a:A) => B) : LIO<Lpc,L,B> {
    const [lpc,l,a] = ma
    return [lpc,l,fab(a)]
}

const chain = bind

function ap<
    A,
    B,
    LFpc extends Level,
    LF extends Level,
    LApc extends Level,
    LA extends Level
> (
    mfab : LIO<LFpc,LF,(a:A)=>B>,
    ma : LIO<LApc,LA,A>
) : LIO<GLB<LFpc,LApc>, LUB<LF,LA>, B> {
    const [lfpc,lf,f] = mfab
    return map(ma,f)
}

// Why use this library? It limits what you can do.
// For the same reasons you wear safety gear when doing
// dangerous work: it is restricting and cumbersome, but
// you do it for protection.

// EXAMPLES________________________________________________

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
            lb1 : Labeled<L1, string>, 
            lb2 : Labeled<L2, string>
        ) => 
            LIO< Top, LUB<L1,L2>, string > 
        = <
            L1 extends Level,
            L2 extends Level
        >(
            lb1 : Labeled<L1, string>, 
            lb2 : Labeled<L2, string>
        ) => 
        {
            const m1 = unlabel( lb1 )
            const m2 = unlabel( lb2 )
            return bind( m1, (s1 : string) => bind( m2, (s2 : string) => ret(s1 + s2) ))
        }

    const lconcat2 
        :  <L1 extends Level,L2 extends Level>(lb1 : Labeled<L1, string>, lb2 : Labeled<L2, string>) 
        => LIO< Top, Bot, Labeled< LUB<L1,L2>, string> > 
        = <L1 extends Level,L2 extends Level>(lb1 : Labeled<L1, string>, lb2 : Labeled<L2, string>) => {
            const m = lconcat(lb1,lb2)
            return to_labeled(m)
           }
}

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
type Src<L extends Level, I> = [ L, Reader<I> ]
type Snk<L extends Level, O> = [ Contravariant<L>, Writer<O> ]

type Reader<I> = () => I
type Writer<O> = (_ : O) => void

function src<L extends Level, I>( l : L, r : Reader<I>) : Src<L,I> {
    return [ l, r ]
}

function snk<L extends Level, O>( l : L, w : Writer<O>) : Snk<L,O> {
    return [ to_contravariant(l), w ]
}

// reads data from L-source. data is L-labeled. data can be up-classified by subtyping.
function inp<L extends Level, I>( [l, r] : Src<L,I>) : LIO<Top, Bot, Labeled<L, I>> {
    const i = r()
    return ret( label(l, i) )
}

//function out<L extends Lo, Lo extends Level, O>( [l, o] : Labeled<L, O>,  [lo, w] : Snk<Lo,O>) : LIO<Lo, Bot, null> {
function out<L extends Level, O>( [lo, w] : Snk<L,O> ) : (_ : Labeled<L, O>) => LIO<L, Bot, null> {
    return ([l, o]) => { w(o) ; return ret ( null ) }
}

import { readFileSync, writeFileSync } from 'fs';

namespace example_io {
    // first, our two principals:
    const amy = "Amy"
    const bob = "Bob"    
    type Amy = typeof amy
    type Bob = typeof bob

    // next, a source and sink for each of them.
    const src_amy : Src<Amy, string> = src(amy,  () => { const b = readFileSync("amy-src.txt"); return b.toString() } )
    const src_bob : Src<Bob, string> = src(bob,  () => { const b = readFileSync("bob-src.txt"); return b.toString() } )
    const snk_amy : Snk<Amy, string> = snk(amy, (s) => { writeFileSync("amy-snk.txt", s) } )
    const snk_bob : Snk<Bob, string> = snk(bob, (s) => { writeFileSync("bob-snk.txt", s) } )

    // finally, some I/O:

    // can read from a source; that's a monad.
    const mar = inp( src_amy )
    // can write to a sink; that's a monad.
    const mbw = out( snk_bob )( label(bob, "Hello from Bob!\n") )

    // can read from amy-source, and write what's read to amy-sink.
    const bd0 = bind( inp(src_amy), out(snk_amy) )

    // cannot write amy-labeled data to bob-labeled sink
    //const bd1 = bind( inp(src_amy), out(snk_bob) )

    // WOOPS; deconstructing Labeled<L,V> (pattern match "([l,s]) =>" aka destructuring assignm.)
    // w/o using API primitives (unlabel), then I completely circumvent IFC altogether!
    // looks like we need Labeled<...> to be opaque to prevent this.
    // (encapsulation? i.e. classes, function closures, private variables, etc.?)
    //const bd2 = bind( mar, ([l,s]) => out(snk_bob)([bob,s]) )
}

// ________________________________________________________
// ________________________________________________________
// ________________________________________________________
// END_OF_FILE_____________________________________________
// (the rest is trash)

// node.js modules that matter:
//  - os
//  - fs
//     - readFile("./blah.txt", (err, data) => e) -- relative path to file, and function that fires on completion
//                                                   (it's asynchronous!). data.toString()
//     - writeFile("./blah.txt", "What to write!", () => e)
// const fs = require('fs')
// const http = require('http')
// const server = http.createServer( (req, res) => { } )
// server.listen(3000, 'localhost', () => { console.log('listening 3000') } )

// fp-ts is inspired by:
// https://www.cl.cam.ac.uk/~jdy22/papers/lightweight-higher-kinded-polymorphism.pdf

// data constructors in typescript:
// https://v5.chriskrycho.com/journal/data-constructors-part-2-better-typescript/

// a deep type-level-typescript journey into currying:
// https://www.freecodecamp.org/news/typescript-curry-ramda-types-f747e99744ab/

/*
function curry<R>( f : (x : any, ...xs : any[]) => R ) {
    return (x : any) => (...xs : any[]) => f(x, xs)
}
const blah = curry(down_pc)("Amy")(ret(4))
*/
