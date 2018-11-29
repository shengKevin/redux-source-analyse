import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose } from './redux'
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
function Compose(...funcs){
  if (funcs.length === 0) {
    return args => args;
  }
  if (funcs.length === 1) {
    return funcs[0]
  }
  const arr = funcs;
  let firstFun = arr[0];
  let len = arr.length;
  let i = 1;
  while(i !== len) {
    firstFun = firstFun(arr[i]);
    i++;
  }
  return firstFun;
}
const a = function(a){return a};
const b = function(b){return b*2};
console.log('compose==', compose(a,b)(1));
console.log('compose==', Compose(a,b)(1));

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