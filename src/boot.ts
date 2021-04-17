import type {FunctionComponent} from 'preact'
import type {Option} from "fp-ts/lib/Option"
import {AnyAction, configureStore} from "@reduxjs/toolkit"
import {render} from "preact"
import { html } from 'htm/preact'
import {connect, Matching, Provider} from "react-redux"


export type Render<State> = FunctionComponent<State>

export type Update<T, Action> = (state: T, action: Action) => T
export type Optional<T> = Option<T>

export const app = <T>(name: string, initialState: T, renderFn: Render<T>, updateFn: Update<T, AnyAction>) => {
  const store = configureStore<T>({
    preloadedState: initialState,
    reducer: updateFn
  })


  const ConnectedElement = connect(
    (state: T) => state,
    {}
  )(renderFn as any)
  render(html
    `
      <${Provider} store=${store}>
        <${ConnectedElement} />
      <//>
    `
    , document.body
  )

  // render(html`<${renderFn} />`, document.body)
}

export {}