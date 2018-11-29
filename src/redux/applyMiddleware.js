import compose from './compose'

/***
 * 
 * middleware既中间件，简单说在redux中作为扩展 dispatch 的唯一标准的方式。
 * 不熟悉的同学自行去api了解一下， 大致结构是这样的
 *  middleware = （store) => (next) =>(action) =>{ [return next(action)]}
 *  为了方便debugger我们先自己写一个简单的logger middleware，看->src/index.js
*/
// applyMiddleware用来添加中间件，在修改数据的时候redux通过改造dispatch来实现中间件.
// 来吧，揭开applyMiddleware的神秘面纱
export default function applyMiddleware(...middlewares) {
  // 返回一个名为createStore的function
  // 不知道你还是否记得createStore.js开头的这段代码
  /*
    if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }
    return enhancer(createStore)(reducer, preloadedState)
    }
    嗯哼？对上了吧， 有applyMiddleware的时候直接先执行这里， 没绕过来的同学debugger一下
  * */
  // 直接return createStore function
  // 这里我们看下执行顺序， 我们写一点伪代码,每一个变量是代码中debugger的位置
  /**
   *   createStore.js 
   *   d1 = createStore(reducer, initstate, enhancer){ ... debugger if (typeof enhancer !== 'undefined')}
   * 
   *   d2 =  if (typeof enhancer !== 'undefined') {
                      if (typeof enhancer !== 'function') {
                        throw new Error('Expected the enhancer to be a function.')
                      }
                      debugger
                    return enhancer(createStore)(reducer, preloadedState)
                    }
   *   d3 = if (typeof enhancer !== 'undefined') {} debugger
   *   
   *   d4 = applyMiddleware.js中注释的debugger
   *   
   *   顺序
   *   d1 -> d2 -> d1 -> d3 -> d4 看明白了流程没有？
   */
  return createStore => (...args) => {
    // 保存createStore(reducer, initstate) || createStore(reducer), 赋值给store
    const store = createStore(...args)
    // 定义了一个dispatch， 调用会 throw new Error（dispatching虽然构造middleware但不允许其他middleware应用 ）
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }

    // 定义middlewareAPI, 中间件中的store  eg ->  logger(store)
    const middlewareAPI = {
      // copy getState
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    // 调用每一个middleware 中间件串联
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    // compose看 -> compose.js文件
    // compose(...chain)会形成一个调用链, next指代下一个函数的注册, 如果执行到了最后next就是原生的store.dispatch方法
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
