import verifyPlainObject from '../utils/verifyPlainObject'

/**
 *
 * @export  mapstateToprops为undefined调用
 * @param {*} getConstant  () => ({})
 * @returns  function initConstantSelector(dispatch, options)
 */
export function wrapMapToPropsConstant(getConstant) {
  // 返回 initConstantSelector
  return function initConstantSelector(dispatch, options) {
    const constant = getConstant(dispatch, options) 

    function constantSelector() {
      return constant
    }
    constantSelector.dependsOnOwnProps = false
    return constantSelector
  }
}

// 用来判断是否存在ownProps 
// mapStateToProps(state, [ownProps])
export function getDependsOnOwnProps(mapToProps) {
  // 不是第一次调用直接返回Boolean
  return mapToProps.dependsOnOwnProps !== null &&
    mapToProps.dependsOnOwnProps !== undefined
    ? Boolean(mapToProps.dependsOnOwnProps)
    // 第一次调用时mapToProps的dependsOnOwnProps为undefined，直接判断参数个数
    : mapToProps.length !== 1  
}

/**
 * @export  mapstateToprops传递时调用
 * @param {*} mapToProps  使用connect是传递的mapStateToProprs
 * @param {*} methodName  名称  methodName = 'mapStatetoProps' || 'mapDispatchToProps'
 * @returns  返回initProxySelector(dispatch, { displayName })
 */
export function wrapMapToPropsFunc(mapToProps, methodName) {
  // 终于找到你！！ 返回initProxySelector function, 这个返回值会赋值给initMapStateToProps
  return function initProxySelector(dispatch, { displayName }) {
    // 定义proxy function，且作为返回值
    const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      return proxy.dependsOnOwnProps  // mapStateToProps计算是否依赖组件的props
        ? proxy.mapToProps(stateOrDispatch, ownProps) //  返回proxy.mapToProps，继续看一下他是什么鬼👻
        : proxy.mapToProps(stateOrDispatch)
    }
    // dependsOnOwnProps标记运行依赖组件的props为true
    proxy.dependsOnOwnProps = true

    // detectFactoryAndVerify为返回的function
    // 梳理一下,目前调用链是这样的
    // const initMapStateToProps = initProxySelector(dispatch, { displayName })=>
    //                             mapToPropsProxy(stateOrDispatch, ownProps) => detectFactoryAndVerify(stateOrDispatch, ownProps)
    // detectFactoryAndVerify赋值给proxy.mapToProps
    // 第一次调用 mapToPropsProxy时返回detectFactoryAndVerify(stateOrDispatch, ownProps)
    proxy.mapToProps = function detectFactoryAndVerify(
      stateOrDispatch,
      ownProps
    ) {
      // 调用的时候 mapToPropsfunction 赋值给 proxy.mapToProps
      // 也就是第一次除了调用到proxy.mapToProps之后, 以后在调用到proxy.mapToProps的时候则使用传递的mapToProps function
      proxy.mapToProps = mapToProps
      // 重新判断 dependsOnOwnProps(第一次默认true)
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)
      // 定义props为proxy(stateOrDispatch, ownProps)
      // 先看下执行顺序 第一次调用initProxySelector() => proxy() => 
      // 此时 proxy.mapToProps = detectFactoryAndVerify()
      // 再次调用 proxy(stateOrDispatch, ownProps)时 返回值为传递的mapToProps(...args)，也就是我们react组件需要的props
      let props = proxy(stateOrDispatch, ownProps)

      // 如果props为function再次执行
      if (typeof props === 'function') {
        proxy.mapToProps = props
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
        props = proxy(stateOrDispatch, ownProps)
      }

      // 非production环境检查
      if (process.env.NODE_ENV !== 'production')
        // verifyPlainObject是utils方法， 如果不是纯对象，抛出warning
        verifyPlainObject(props, displayName, methodName)

      // 返回最终的props
      return props
    }

    return proxy
  }
}
