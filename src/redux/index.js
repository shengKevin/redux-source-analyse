import createStore from './createStore'
import combineReducers from './combineReducers'
import bindActionCreators from './bindActionCreators'
import applyMiddleware from './applyMiddleware'
import compose from './compose'
import warning from './utils/warning'
import __DO_NOT_USE__ActionTypes from './utils/actionTypes'

function isCrushed() {}
//  isCrushed.name !== 'isCrushed'用来判断是否压缩过
// 如果不是production环境且压缩了，给出warning
if (
  process.env.NODE_ENV !== 'production' &&
  typeof isCrushed.name === 'string' &&
  isCrushed.name !== 'isCrushed'
) {
  warning(
    'You are currently using minified code outside of NODE_ENV === "production". ' +
      'This means that you are running a slower development build of Redux. ' +
      'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' +
      'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' +
      'to ensure you have the correct code for your production build.'
  )
}
// 这就是我们的redux了， 看一下是不是很简单
// 好了，先看createStore ->去看createStore.js文件
// 看完createStore，已经对redux的大体实现有了一定的了解， 接下来我们看combineReducers -> 👀看文件
// 接着看bindActionCreators.js文件
// 看applyMiddleware.js文件
// 最后compose在applyMiddleware中用到的时候已经看过了， redux源码解析大功告成
export {
  createStore,  
  combineReducers,
  bindActionCreators,
  applyMiddleware,
  compose,
  __DO_NOT_USE__ActionTypes
}



/** 
 *   如果你阅读了源码的解析后， 不要以为这样就完了，我们在来看看redux的三大原则
 * 
 *   整个应用的state存储在store中，有且只存在一个store。
 *   store里面的state是只读的，唯一改变state的方法就是派发(dispatch)一个动作(action)。
 *   纯函数(reducer)修改state，每次返回一个新的state，不能直接修改原对象。
 *   
 *   为什么？ 为什么要这么设计
 *   未完待续...
*/