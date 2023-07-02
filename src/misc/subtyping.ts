import {botLevel} from "../components/lattice";

// SUBTYPING_______________________________________________

// we want to specify which (values of which) types can be
// substituted with   which (values of which) types.
// i.e. we want to specify how a type is subtyped.

// Covariance & Contravariance
// https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)

// subtyping in TypeScript is covariant by default.
// so, when we want to _preserve_ normal subtyping, we do nothing.
// (this type constructor is therefore completely superfluous; we don't use it)

export type Covariant<T> = T

// sometimes, we'll need to _reverse_ the subtyping of a type,
// i.e. make it contravariant. (PC, later).
// we model contravariance using function types, since
// TypeScript subtyping for function arguments is already
// contravariant (as is standard for subtyping).
export type Contravariant<T> = (_: T) => null;

export function toContravariant<T>(t: T): Contravariant<T> {
    return ((_: T) => null);
}

export function fromContravariant<T>(ct: Contravariant<T>): T {
    const r: T = botLevel as T // hack that only works with levels...
    return r;
}

// finally, we may need to prohibit subtyping a type,
// i.e. make it invariant.
// we model invariance using function types, by
// making the argument- and return-type of the function
// be the same. that way,
// covariably     modifying the type violate contravariance of the argument type, and
// contravariably modifying the type violate covariance     of the return   type.
export type Invariant<T> = (_: T) => T