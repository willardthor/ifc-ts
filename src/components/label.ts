import {Level} from "./lattice";

// LABELS__________________________________________________

/** A labeled value. */
export type Labeled<L extends Level, V extends any> = [L, V];

// no trick to force-evaluate the type-level thunk;
// we want to keep it, because we want this type to be opaque.

// note: while we introduce security levels to
// check for information-flow security violations at *compile-time*,
// we do (sadly) need to keep levels at the value-level.
// this is because of structural types (duck typing).

// TODO: Do we actually need levels at the value-level? 🤔
// W: Yes (structural types / duck typing)

// TODO: Should we make this type opaque? 🤔
// W: yes; see the end.
//    read up on branded types, Singleton, closures, interfaces, modules, classes.

// LABELED_HACK: the [] on 'L' and 'Level', while theoretically redundant,
// are needed to avoid a 'never'-creep - see below.
// W: I have removed this hack, as it appears to be unnecessary at the moment.

/** Attaches a label to a value. */
export function label<L extends Level, V>(l: L, v: V): Labeled<L, V> {
    return [l, v];
}

/** Project labeled-value to the value. WARNING: this is UNSAFE because it circumvents information flow control. */
export function unsafe_valueOf<L extends Level, V>(lv: Labeled<L, V>): V {
    const [l, v] = lv;
    return v;
}

/** Projects labeled-value to the label. */
export function labelOf<L extends Level, V>(lv: Labeled<L, V>): L {
    const [l, v] = lv;
    return l;
}

/** Up-classify label on labeled-value. */
export function upLabel<L extends L_, L_ extends Level, V>(l_: L_): (_: Labeled<L, V>) => Labeled<L_, V> {
    return ([_, v]: Labeled<L, V>) => {
        return label(l_, v);
    }
}