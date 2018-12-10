import React from 'react'
import Footer from './Footer'
import AddTodo from '../containers/AddTodo'
import VisibleTodoList from '../containers/VisibleTodoList'

const App = (props) => (
  <div>
    <AddTodo />
    <VisibleTodoList />
    <Footer />
    <button onClick={props.changeStore}>change store</button>
  </div>
)

export default App