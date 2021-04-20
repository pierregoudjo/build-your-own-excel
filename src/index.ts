import "preact/debug"

import type {Render, Update, Trigger} from "./boot"
import type {Option} from "fp-ts/es6/Option"
import type { Parser } from "parsimmon"

import { createAction, createReducer } from "@reduxjs/toolkit"
import {none, match, some} from "fp-ts/es6/Option"
import {html} from "htm/preact"
import {add, divide, minus, multiply, alphabeticRange, numericRange} from "./boot"
import {app} from "./boot"
import { pipe } from "fp-ts/lib/function"
import { useDispatch } from "react-redux"

import P from "parsimmon"


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


const startEdit = createAction<Position, "START_EDIT">("START_EDIT")
const updateValue = createAction<[Position, string], "UPDATE_VALUE">("UPDATE_VALUE")

const initial: State = {
  cols: alphabeticRange("A", "Z"),
  rows: numericRange(1, 15),
  active: none,
  cells: {}
}

const renderEditor = (value: string, position: Position, trigger: Trigger) => {
  return html`
    <td class="selected">
     <input 
      value=${value} 
      oninput=${(e: { target: HTMLInputElement; }) => trigger(updateValue([position, e.target.value]))} />
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
    <td onclick=${() => trigger(startEdit(position))}>${displayValue}</td>
  `
}

const renderCell = (state: State, position: Position, trigger: Trigger) =>{
  const stringPosition = positionAsString(position)
  const cell = state.cells[stringPosition]

  const cellValue = cell ? some(cell) : none

  return pipe(
    state.active, 
    match(
      () => renderView(cellValue, position, trigger),
      (active) => positionEquals(active, position) ? renderEditor(cell, position, trigger) : renderView(cellValue, position, trigger)
    )
  )
}

const App: Render<State> = (props) => {
  const trigger = useDispatch()
  return (
    html`<table>
      <tr>
        <th></th>
        ${props.cols.map(col => html`<th>${col}</th>`)}
      </tr>
      ${props.rows.map(row => html`
        <tr>
          <th>${row}</th>
          ${props.cols.map(col => renderCell(props, [col, row], trigger))}
        </tr>
      `)}
    </table>`
  );
};


const update: Update<State> = createReducer(initial, (builder) => {
  builder.addCase(startEdit, (state, action) => ({...state, active:some(action.payload)}))
  builder.addCase(updateValue, (state, action) => {
    const [position, value] = action.payload
    const stringPosition = positionAsString(position)
    return {...state, cells: {...state.cells, [stringPosition]: value}}
  })
})


app ("main", initial, App, update)


