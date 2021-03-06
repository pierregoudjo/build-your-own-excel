import "preact/debug"

import type {Trigger} from "./boot"
import type {FunctionComponent, AnyComponent, ComponentConstructor} from 'preact'
import type {Option} from "fp-ts/es6/Option"
import type {Expression, Value, Position, BinaryOperation, Reference} from "./types"

import {none, match, some, fromNullable, toUndefined} from "fp-ts/es6/Option"
import { pipe } from "fp-ts/es6/function"
import {html} from "htm/preact"
import {add, divide, minus, multiply, alphabeticRange, numericRange} from "./boot"
import {app} from "./boot"
import P from "parsimmon"
import { connect } from "unistore/preact"
import {EquationParser as Parser} from "./parser"

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

type State = {
  cols: string[]
  rows: number[]
  active: Option<Position>
  cells: Record<string, string>
}

const positionAsString = (position: Position) => `${position[0]}${position[1]}`
const positionEquals = (p1: Position, p2: Position) => p1[0] === p2[0] && p1[1] === p2[1]
const positionFromColAndRow = (col: string, row: number): Position => ([col, row])

const isValue = (expr: Expression): expr is Value => typeof expr == 'number'

const isBinary = (expr: Expression): expr is BinaryOperation => Array.isArray(expr) && expr.length == 3

const evaluate = (cells : Record<string, string>) => (expr: Expression): number => {
  if (isValue(expr)) {
    return expr
  } else if(isBinary(expr)) {
    const ops = {"+": add, "*": multiply, "-": minus, "/": divide}
    const [l, op, r] = expr
    const le = evaluate(cells)(l)
    const re = evaluate(cells)(r)
    return ops[op](le,re)
  } else {
    const code = cells[positionAsString(expr)]
    const newExpr = Parser.tryParse(code)
    return evaluate(cells)(newExpr)
  }
}

const actions = {
  startEdit: (_: State, payload: Position) => {
    return { active:some(payload) }
  },
  updateValue: (state: State, payload: [Position, string]) => {
    const [position, value] = payload
    const stringPosition = positionAsString(position)
    value !== '' ? value : undefined
    if (value !== '') {
      return {cells: {...state.cells, [stringPosition]: value}}
    } else {
      const cells = {...state.cells}
      delete cells[stringPosition]
      return {cells}
    }
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

const renderView = (cells: Record<string,string>, value: Option<string>, position: Position, trigger: Trigger) => {
  const result = pipe(
    value,
    match(
      () => ({status: true, value:""} as P.Result<string>),
      (v) => Parser.map(evaluate(cells)).map(String).parse(v)
    )
  )
  const displayValue = result.status ? result.value : "#ERROR"
  
  return html`
    <td class=${result.status ? "" : "error"} onclick=${() => trigger(position)}>${displayValue}</td>
  `
}

type CellProps = {
  position: Position
  active: boolean
  cell: Option<string>,
  cells: Record<string,string>
  startEdit: (payload: Position) => void
  updateValue: (payload: [Position, string]) => void
}

const Cell: FunctionComponent<CellProps> = ({position, cell: currentCell, active, startEdit, updateValue, cells}) =>{
  return active ? renderEditor(currentCell, position, updateValue) : renderView(cells, currentCell, position, startEdit)
}

const ConnectedCell = connect(
  (state: State, props: {position: Position}) => ({
    cell: fromNullable(state.cells[positionAsString(props.position)]), 
    cells: state.cells,
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

type CellComponent = 
  | ComponentConstructor<{position: Position}> 
  | AnyComponent<{position: Position}>

const Grid = (CellComponent: CellComponent) : FunctionComponent<GridProps> =>  ({cols, rows}) => {
  return (
    html`<table>
      <tr>
        <th></th>
        ${cols.map(col => html`<th>${col}</th>`)}
      </tr>
      ${rows.map(row => html`
        <tr>
          <th>${row}</th>  
          ${cols.map(col =>html`<${CellComponent} key=${positionAsString(positionFromColAndRow(col, row))} position=${positionFromColAndRow(col, row)} />`)}
        </tr>
      `)}
    </table>`
  );
};


app ("main", initial, connect(['cols', 'rows' ], {}) (Grid(ConnectedCell) as any), actions)


