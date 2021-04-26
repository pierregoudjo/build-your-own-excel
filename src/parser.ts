import P from "parsimmon"

import type {Expression, Operator, Value, Reference, BinaryOperation } from './types'

const ExpressionParser: P.Parser<Expression> = P.lazy(() => P.alt(BinaryParser, TermParser))

const OperatorParser: P.Parser<Operator> = P.alt(P.string('+'), P.string('-'), P.string('*'), P.string('/'))

const ValueParser: P.Parser<Value> = P.digits.map(Number)

const ReferenceParser: P.Parser<Reference> = P.seq(P.letter, P.digits.map(Number))

const BracketParser: P.Parser<Expression> = P.string("(").then(P.optWhitespace).then(ExpressionParser).skip(P.optWhitespace).skip(P.string(")"))

const TermParser: P.Parser<Expression> = BracketParser.or(ReferenceParser).or(ValueParser)

const BinaryParser: P.Parser<BinaryOperation> = P.seq(TermParser.skip(P.optWhitespace), OperatorParser.skip(P.optWhitespace), TermParser.skip(P.optWhitespace))

const FormulaParser: P.Parser<Expression> = P.string('=').then(P.optWhitespace).then(ExpressionParser)
export const EquationParser: P.Parser<Expression> = P.optWhitespace.then(P.alt(FormulaParser, ValueParser)).skip(P.optWhitespace)