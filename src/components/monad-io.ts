import {Bot, Level, Top} from "./lattice";
import {Contravariant, toContravariant} from "../misc/subtyping";
import {LIO, ret} from "./monad";
import {label, Labeled} from "./label";

/**
 * Here we provide types & primitives to create sources and sinks,
 * and to perform I/O on these.
 * the idea is that the programmer must create sources and sinks,
 * and then use them in the monad.
 * why: there are so many libraries for doing I/O; we cannot
 * possibly support them all. we can support e.g. files & sockets.
 * for anything beyond that, we provide these constructs so that
 * the user of our library can themselves define the sources and
 * sinks.
 */
export type Src<L extends Level, I> = [L, Reader<I>];

/** The sink type, see the "Src" function for details. */
export type Snk<L extends Level, O> = [Contravariant<L>, Writer<O>];

export type Reader<I> = () => I;
export type Writer<O> = (_: O) => void;

export function src<L extends Level, I>(l: L, r: Reader<I>): Src<L, I> {
    return [l, r];
}

export function snk<L extends Level, O>(l: L, w: Writer<O>): Snk<L, O> {
    return [toContravariant(l), w];
}

/** Reads data from L-source. data is L-labeled. data can be up-classified by subtyping. */
export function input<L extends Level, I>([l, r]: Src<L, I>): LIO<Top, Bot, Labeled<L, I>> {
    const i = r();
    return ret(label(l, i));
}

/** Writes data to L-sink. data is L-labeled. data can be down-classified by subtyping. */
export function output<L extends Level, O>([lo, w]: Snk<L, O>): (_: Labeled<L, O>) => LIO<L, Bot, null> {
    return ([l, o]) => {
        w(o);
        return ret(null);
    }
}