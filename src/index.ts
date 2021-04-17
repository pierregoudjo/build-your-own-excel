import "preact/debug"
import { createAction } from "@reduxjs/toolkit"
import {none, Option} from "fp-ts/es6/Option"
import {html} from "htm/preact"
import type {Render, Update} from "./boot"
import {app} from "./boot"

type Position = {col: string , row: number}
// type Position = [string, number]
const positionAsString = (position: Position) => `${position.col}${position.row}`

type State = {
  cols: string[]
  rows: number[]
  active: Option<Position>
  cells: Record<string, string>
}

const addTodo = createAction("ADD_TODO")

type Msg = typeof addTodo
const numericRange = (start:number, stop: number) => Array.from({length: (stop - start) + 1}, (_, i) => start + i)
const alphabeticRange = (start: string, stop: string) => numericRange(start.charCodeAt(0), stop.charCodeAt(0)).map( x => String.fromCharCode(x))


const initial: State = {
  cols: alphabeticRange("A", "Z"),
  rows: numericRange(1, 15),
  active: none,
  cells: {}
}

const renderCell = (state: State, position: Position) =>{
  const stringPosition = positionAsString(position)
  const cell = state.cells[stringPosition]

  return html`<td>${cell}</td>`
}

const App: Render<State> = (props) => {
  return (
    html`<table>
      <tr>
        <th></th>
        ${props.cols.map(col => html`<th>${col}</th>`)}
      </tr>
      ${props.rows.map(row => html`
        <tr>
          <th>${row}</th>
          ${props.cols.map(col => renderCell(props, {col, row}))}
        </tr>
      `)}
    </table>`
  );
};


const update: Update<State, Msg> = (state) => {
  return state as State
}

app ("main", initial, App, update)


