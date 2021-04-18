import type {FunctionComponent} from 'preact'
import {configureStore, Dispatch, Reducer} from "@reduxjs/toolkit"
import {render} from "preact"
import { html } from 'htm/preact'
import {connect, Provider} from "react-redux"


export type Render<S> = FunctionComponent<S>

export type Update<S> = Reducer<S>

export type Trigger = Dispatch<any>
export const app = <T, A>(name: string, initialState: T, renderFn: Render<T>, updateFn: Update<T>) => {
  const store = configureStore<T>({
    preloadedState: initialState,
    reducer: updateFn
  })

  const ConnectedElement = connect(
    (state: T) => state,
    {}
  )(renderFn as any)
  const element = document.getElementById(name)
  if (element) {
    render(html
      `
        <${Provider} store=${store}>
          <${ConnectedElement} />
        <//>
      `
      , element
    )
  } else {
    console.error(`Element of id ${name} doesnt exist`)
  }
}