import "preact/debug"
import { AnyAction, createAction, createReducer, Dispatch } from "@reduxjs/toolkit"
import {none, match, Option, some} from "fp-ts/es6/Option"
import {html} from "htm/preact"
import type {Render, Trigger, Update} from "./boot"
import {app} from "./boot"
import { pipe } from "fp-ts/lib/function"
import { useDispatch } from "react-redux"

//
// Step 1: Display a spreasheet
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

type Position = [string, number]
const positionAsString = (position: Position) => `${position[0]}${position[1]}`
const positionEquals = (p1: Position, p2: Position) => p1[0] === p2[0] && p1[1] === p2[1]

type State = {
  cols: string[]
  rows: number[]
  active: Option<Position>
  cells: Record<string, string>
}

const startEdit = createAction<Position, "START_EDIT">("START_EDIT")
const updateValue = createAction<[Position, string], "UPDATE_VALUE">("UPDATE_VALUE")

const numericRange = (start:number, stop: number) => Array.from({length: (stop - start) + 1}, (_, i) => start + i)
const alphabeticRange = (start: string, stop: string) => numericRange(start.charCodeAt(0), stop.charCodeAt(0)).map( x => String.fromCharCode(x))


const initial: State = {
  cols: alphabeticRange("A", "Z"),
  rows: numericRange(1, 15),
  active: none,
  cells: {}
}

const renderEditor = (value: String, position: Position, trigger: Trigger) => {
  return html`
    <td class="selected">
     <input 
      id="celled" 
      value=${value} 
      oninput=${(e: { target: HTMLInputElement; }) => trigger(updateValue([position, e.target.value]))} />
    </td>
  `
}

const renderView = (value: String, position: Position, trigger: Trigger) => {
  return html`
    <td onclick=${() => trigger(startEdit(position))}>${value}</td>
  `
}

const renderCell = (state: State, position: Position, trigger: Trigger) =>{
  const stringPosition = positionAsString(position)
  const cell = state.cells[stringPosition]

  return pipe(
    state.active, 
    match(
      () => renderView(cell, position, trigger),
      (active) => positionEquals(active, position) ? renderEditor(cell, position, trigger) : renderView(cell, position, trigger)
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


