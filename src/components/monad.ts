import {Bot, botLevel, GLB, Level, LUB, Top, topLevel} from "./lattice";
import {Contravariant, toContravariant} from "../misc/subtyping";
import {label, Labeled} from "./label";

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

/** Labeled-I-O, our Monad type. */
export type LIO<Lpc extends Level, L extends Level, V> = [Contravariant<Lpc>, L, V];

// Our unlabel statement.
// typically, given Labeled<L,V>, the return type is LIO<PC, L, V> for any PC.
// instead, I make the type be the strongest guarantee, and will use
// subtyping to weaken this guarantee where needed.

/** Unlabel a labeled statement. */
export function unLabel<L extends Level, V>(lv: Labeled<L, V>): LIO<Top, L, V> {
    const [l, v] = lv
    return [toContravariant(topLevel), l, v]
}

// Type for our ret statement.
// typically, its type is LIO<Lpc,L,V> for any Lpc and L.
// instead, I make the type be the strongest guarantee, and will use
// subtyping to weaken this guarantee where needed.

/** Return a value. */
export function ret<V>(v: V): LIO<Top, Bot, V> {
    return [toContravariant(topLevel), botLevel, v]
}

/** The bind statement */
export function bind<
    Lpc extends Level,
    L extends Rpc,                // L <: Rpc
    V,
    Rpc extends Level,
    R extends Level,
    W
>(
    m: LIO<Lpc, L, V>,
    f: (_: V) => LIO<Rpc, R, W>
):
    LIO<GLB<Lpc, Rpc>, LUB<L, R>, W> // Zpc <: Lpc , Zpc <: Rpc , L <: Z , R <: Z
{
    const [lpc, l, v] = m
    return f(v)
}
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

/**
 * if you have data in the monad,
 * and you wish to write it to someplace,
 * you'll need to box it.
 * to_labeled will automatically assign
 * the appropriate label
 * to the box (i.e. the data-level).
 * the pc does not go away; it might forbid
 * writing this boxed value in a "next step".
 */
export function toLabeled<
    PC extends Level,
    L extends Level,
    V
>(m: LIO<PC, L, V>
): LIO<PC, Bot, Labeled<L, V>> {
    const [pc, l, v] = m
    return [pc, botLevel, label(l, v)]
}

/** Gets a value out of the monad. WARNING: this is unsafe! */
export function unsafe_runLIO<Lpc extends Level, L extends Level, V>(m: LIO<Lpc, L, V>): V {
    const [lpc, l, v] = m
    return v
}