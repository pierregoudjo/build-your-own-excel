import "preact/debug"

import type {Render, Update, Trigger} from "./boot"
import type {FunctionComponent} from 'preact'
import type {Option} from "fp-ts/es6/Option"
import type { Parser } from "parsimmon"

import {none, match, some, fromNullable, toUndefined} from "fp-ts/es6/Option"
import { pipe } from "fp-ts/es6/function"
import {html} from "htm/preact"
import {add, divide, minus, multiply, alphabeticRange, numericRange} from "./boot"
import {app} from "./boot"
import P from "parsimmon"
import { connect } from "unistore/preact"

//
// Step 1: Define early domain model
//      1 => declare type Position for a position inside the spreadsheet
//      2 => declare type State which contain cols, rows, active cell and value of the cells
//      3 => render the cells
//

//
// Step 2: Allow update of the state via trigger
//      1 => Define action creators: startEdit and updateValue
//      2 => Get the dispatch via useDispatch and pass it to renderCell function
//      3 => Render editor if the cell is the active one otherwise render a simple view (use snippet)
//

//
// Step 3: Parser combinators
//      1 => Define Expr that is either a *Number* or a *Binary* (expr, *Operator*, expr)
//      2 => Define operator parser, number parser and expression parser
//      3 => Update 
//

//
// Step 4: Evaluate expression
//      1 => let ops = {"+": add, "*": multiply, "-": minus, "/": divide}
//      2 => Write a recursive function that can evaluate the expression
//

type Position = [string, number]
const positionAsString = (position: Position) => `${position[0]}${position[1]}`
const positionEquals = (p1: Position, p2: Position) => p1[0] === p2[0] && p1[1] === p2[1]
const positionFromColAndRow = (col: string, row: number): Position => ([col, row])

type State = {
  cols: string[]
  rows: number[]
  active: Option<Position>
  cells: Record<string, string>
}

type Operator = "+" | "*" | "-" | "/"
type Binary = [ Expr, Operator, Expr ] // A binary operation is a tuple of an expression, an operator and another expression

type Value = number

const Value = Number

const isValue = (expr: Expr): expr is Value => typeof expr == 'number'

type Expr = 
  | Value
  | Binary 


let operator = P.alt(
  P.string("+"),
  P.string("*"),
  P.string("-"),
  P.string("/")
)


const value: Parser<Value> = P.digits.map(Value)

const binary: Parser<Binary> = P.seq(value, operator, value)

const expr: Parser<Expr> = P.alt(binary, value)

const evaluate = (expr: Expr): Value => {
  if (isValue(expr)) {
    return expr
  } else {
    let ops = {"+": add, "*": multiply, "-": minus, "/": divide}
    const [l, op, r] = expr
    const le = evaluate(l)
    const re = evaluate(r)
    return ops[op](le,re)
  }
}

const actions = {
  startEdit: (_: State, payload: Position) => {
    return { active:some(payload) }
  },
  updateValue: (state: State, payload: [Position, string]) => {
    const [position, value] = payload
    const stringPosition = positionAsString(position)
    return {cells: {...state.cells, [stringPosition]: value}}
  }
}

const initial: State = {
  cols: alphabeticRange("A", "Z"),
  rows: numericRange(1, 15),
  active: none,
  cells: {}
}

const renderEditor = (value: Option<string>, position: Position, updateValue: Trigger) => {
  return html`
    <td class="selected">
     <input 
     value=${toUndefined(value)} 
      onblur=${(e: { target: HTMLInputElement; }) => updateValue([position, e.target.value])} />
    </td>
  `
}

const renderView = (value: Option<string>, position: Position, trigger: Trigger) => {
  const displayValue = pipe(
    value,
    match(
      () => "",
      (v) => expr.map(evaluate).tryParse(v).toString()
    )
  )
  
  return html`
    <td onclick=${() => trigger(position)}>${displayValue}</td>
  `
}

type CellProps = {
  position: Position
  active: boolean
  cell: Option<string>
  startEdit: (payload: Position) => void
  updateValue: (payload: [Position, string]) => void
}

const Cell: FunctionComponent<CellProps> = ({position, cell, active, startEdit, updateValue}) =>{
  return active ? renderEditor(cell, position, updateValue) : renderView(cell, position, startEdit)
}

const ConnectedCell = connect(
  (state: State, props: Pick<CellProps, 'position'>) => ({
    cell: fromNullable(state.cells[positionAsString(props.position)]), 
    active: pipe(
      state.active,
      match(
        () => false,
        (activeCellPosition) => positionEquals(activeCellPosition, props.position)
      )
    )
  }), 
  actions 
) (Cell as any)

type GridProps = {
  cols: string[]
  rows: number[]
}

const Grid: FunctionComponent<GridProps> = ({cols, rows}) => {
  return (
    html`<table>
      <tr>
        <th></th>
        ${cols.map(col => html`<th>${col}</th>`)}
      </tr>
      ${rows.map(row => html`
        <tr>
          <th>${row}</th>  
          ${cols.map(col =>html`<${ConnectedCell} position=${positionFromColAndRow(col, row)} />`)}
        </tr>
      `)}
    </table>`
  );
};


app ("main", initial, connect(['cols', 'rows' ], {}) (Grid as any), actions)


