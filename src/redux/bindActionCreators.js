function bindActionCreator(actionCreator, dispatch) {
  // 闭包
  return function() {
    // 执行后返回结果为传入的actionCreator直接调用arguments
    return dispatch(actionCreator.apply(this, arguments))
  }
}

 // 想必有点同学还不知道这个api，我先看看bindActionCreators作用
/**
 *
 * @export
 * @param {*} actionCreators  一个 action creator，或者一个 value 是 action creator 的对象。
 * @param {*} dispatch 一个由 Store 实例提供的 dispatch 函数。
 * @returns 一个与原对象类似的对象，只不过这个对象的 value 都是会直接 dispatch 原 action creator 返回的结果的函数。
 *          如果传入一个单独的函数作为 actionCreators，那么返回的结果也是一个单独的函数。
 * 
 * 场景： 惟一会使用到 bindActionCreators 的场景是当你需要把 action creator 往下传到一个组件上，
 *        却不想让这个组件觉察到 Redux 的存在，而且不希望把 dispatch 或 Redux store 传给它。
 * 
 * 好了， 我们来看实现
 */
export default function bindActionCreators(actionCreators, dispatch) {
  // actionCreators为function
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  // 不是object throw Error
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  // object 转为数组
  const keys = Object.keys(actionCreators)
  // 定义return 的props
  const boundActionCreators = {}
  for (let i = 0; i < keys.length; i++) {
    // actionCreators的key 通常为actionCreators function的name（方法名）
    const key = keys[i]
    // function => actionCreators工厂方法本身
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      // 参数为{actions：function xxx}是返回相同的类型
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  // return 的props
  return boundActionCreators
}
 