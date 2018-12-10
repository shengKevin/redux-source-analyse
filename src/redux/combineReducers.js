import ActionTypes from './utils/actionTypes'
import warning from './utils/warning'
import isPlainObject from './utils/isPlainObject'

/**
 *  先过一下文件最吸引我的是export default function combineReducers
 *  先看这个combineReducers function
 * 
 */
function getUndefinedStateErrorMessage(key, action) {
  const actionType = action && action.type
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || 'an action'

  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  )
}

function getUnexpectedStateShapeWarningMessage(
  inputState,
  reducers,
  action,
  unexpectedKeyCache
) {
  const reducerKeys = Object.keys(reducers)
  const argumentName =
    action && action.type === ActionTypes.INIT
      ? 'preloadedState argument passed to createStore'
      : 'previous state received by the reducer'

  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    )
  }

  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    )
  }

  const unexpectedKeys = Object.keys(inputState).filter(
    key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  )

  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true
  })

  if (action && action.type === ActionTypes.REPLACE) return

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key]
   // reducer返回值
    const initialState = reducer(undefined, { type: ActionTypes.INIT })
    // undefined throw Error
    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }

    // 很明显assertReducerShape是用于reducer的规范
    // 回到combineReducers
    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION()
      }) === 'undefined'
    ) {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${
            ActionTypes.INIT
          } or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

// 用于合并reducer 一般是这样combineReducers({a,b,c})
export default function combineReducers(reducers) {
  // reducers中key的数组
  const reducerKeys = Object.keys(reducers)
  // 最终的reducer
  const finalReducers = {}
  for (let i = 0; i < reducerKeys.length; i++) {
    // 接受当前的key
    const key = reducerKeys[i]

    // 如果不是生产环境， 当前的reducer是undefined会给出warning
    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }

    // reducer要是一个function
    if (typeof reducers[key] === 'function') {
      // 赋值给finalReducers
      finalReducers[key] = reducers[key]
    }
    // 循环结束， 目的为了给finalReducers赋值， 过虑了不符合规范的reudcer
  }
  // 符合规范的reducer的key数组
  const finalReducerKeys = Object.keys(finalReducers)

  // 意想不到的key， 先往下看看
  let unexpectedKeyCache
  if (process.env.NODE_ENV !== 'production') {
    // production环境为{}
    unexpectedKeyCache = {}
  }

  let shapeAssertionError

  try {
    // 看这个function
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }

  // 返回function， 即为createstore中的reducer参数既currentreducer
  // 自然有state和action两个参数， 可以回createstore文件看看currentReducer(currentState, action)
  return function combination(state = {}, action) {
    // reducer不规范报错
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    // 比较细致的❌信息，顺便看了一下getUndefinedStateErrorMessage，都是用于提示warning和error的， 不过多解释了
    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    let hasChanged = false
    const nextState = {}
    for (let i = 0; i < finalReducerKeys.length; i++) {
      // 获取finalReducerKeys的key和value（function）
      const key = finalReducerKeys[i]
      const reducer = finalReducers[key]
      // 当前key的state值
      const previousStateForKey = state[key]
      // 执行reducer， 返回当前state
      const nextStateForKey = reducer(previousStateForKey, action)
      // 不存在返回值报错
      if (typeof nextStateForKey === 'undefined') {
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      // 新的state放在nextState对应的key里
      nextState[key] = nextStateForKey
      // 判断新的state是不是同一引用， 以检验reducer是不是纯函数
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    // 改变了返回nextState
    return hasChanged ? nextState : state
  }
  /*
  *  新版本的redux这部分改变了实现方法
  *  老版本的redux使用的reduce函数实现的
  *  简单例子如下
  * function combineReducers(reducers) {
  *    return (state = {}, action) => {
  *        return Object.keys(reducers).reduce((currentState, key) => {
  *            currentState[key] = reducers[key](state[key], action);
  *             return currentState;
  *         }, {})
  *      };
  *    }
  * 
  * */
}
