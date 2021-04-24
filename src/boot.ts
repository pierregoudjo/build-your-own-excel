import type {FunctionComponent} from 'preact'
import type {ActionMap} from 'unistore'

// import {configureStore, Dispatch, Reducer} from "@reduxjs/toolkit"
import {render} from "preact"
import { html } from 'htm/preact'

import createStore from 'unistore'
import { Provider, connect } from 'unistore/preact'
import devtools from 'unistore/devtools'

// import {connect, Provider} from "react-redux"


export type Render<S> = FunctionComponent<S>

// export type Update<S> = Reducer<S>
export type Update<S> = ActionMap<S>


// export type Trigger = Dispatch<any>
export type Trigger = (s: any) => any

export const add = (a: number, b: number) => a + b
export const multiply = (a: number, b: number) => a * b
export const minus = (a: number, b: number) => a - b
export const divide = (a: number, b: number) => a / b

export const numericRange = (start:number, stop: number) => Array.from({length: (stop - start) + 1}, (_, i) => start + i)
export const alphabeticRange = (start: string, stop: string) => numericRange(start.charCodeAt(0), stop.charCodeAt(0)).map( x => String.fromCharCode(x))
export const app = <T, A>(name: string, initialState: T, renderFn: any, updateFn: ActionMap<T>) => {
  // const store = configureStore<T>({
  //   preloadedState: initialState,
  //   reducer: updateFn
  // })



  const store = devtools(createStore(initialState))

  // const ConnectedElement = connect((state: T) => state, updateFn) (renderFn)
  const element = document.getElementById(name)
  if (element) {
    render(html
      `
        <${Provider} store=${store}>
          <${renderFn} />
        <//>
      `
      , element
    )
  } else {
    console.error(`Element of id ${name} doesnt exist`)
  }
}