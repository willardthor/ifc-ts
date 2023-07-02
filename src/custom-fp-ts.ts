import {bind, LIO, ret} from "./components/monad";
import {GLB, Level, LUB} from "./components/lattice";

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

const of = ret;

// aka. lift
function map<A, B, Lpc extends Level, L extends Level>(ma: LIO<Lpc, L, A>, fab: (a: A) => B): LIO<Lpc, L, B> {
    const [lpc, l, a] = ma
    return [lpc, l, fab(a)]
}

const chain = bind

function ap<
    A,
    B,
    LFpc extends Level,
    LF extends Level,
    LApc extends Level,
    LA extends Level
>(
    mfab: LIO<LFpc, LF, (a: A) => B>,
    ma: LIO<LApc, LA, A>
): LIO<GLB<LFpc, LApc>, LUB<LF, LA>, B> {
    const [lfpc, lf, f] = mfab
    return map(ma, f)
}

