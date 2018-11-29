import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from './redux'
import rootReducer from './reducers'
import App from './components/App'

const logger = (store) => (next) => (action) => {
  console.group(action.type);
  console.info('dispatching', action)
  let result = next(action);
  console.log('next state', store.getState())
  console.groupEnd(action.type)
  return result
}

const store = createStore(rootReducer, applyMiddleware(logger));

let unsubscribe = store.subscribe(() => {
  console.log('subscribe getState: ', store.getState())
})
// unsubscribe();

store.dispatch({
  type: 'ADD_TODO',
  id: 111,
  text: 'asd'});


store.dispatch({
  type: 'ADD_TODO',
  id: 123,
  text: 'asd'});
render(
  // <Provider store={store}>
  //   <App />
  // </Provider>,
  <div></div>,
  document.getElementById('root')
)