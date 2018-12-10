import verifySubselectors from './verifySubselectors'

export function impureFinalPropsSelectorFactory(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  dispatch
) {
  return function impureFinalPropsSelector(state, ownProps) {
    // 执行mergePropsProxy，返回修改后的props
    return mergeProps(
      mapStateToProps(state, ownProps),  // mapStateToProps执行结果
      mapDispatchToProps(dispatch, ownProps), // mapDispatchToProps的执行结果
      ownProps // 自身的props
    )
  }
}

export function pureFinalPropsSelectorFactory(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  dispatch,
  // areStatesEqual判断是否是相同的引用
  // areOwnPropsEqual, areStatePropsEqual为shallowEqual
  { areStatesEqual, areOwnPropsEqual, areStatePropsEqual }
) {
  // hasRunAtLeastOnce标记第一次执行
  // 先看return的function，再看其他的function都做了什么
  let hasRunAtLeastOnce = false
  let state
  let ownProps
  let stateProps
  let dispatchProps
  let mergedProps

  // 第一次执行时
  function handleFirstCall(firstState, firstOwnProps) {
    // 直接赋值以下结果
    state = firstState
    ownProps = firstOwnProps
    stateProps = mapStateToProps(state, ownProps)
    dispatchProps = mapDispatchToProps(dispatch, ownProps)
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    // hasRunAtLeastOnce标记为true
    hasRunAtLeastOnce = true
    // 返回mergedProps
    return mergedProps
  }

  function handleNewPropsAndNewState() {
    // 获取当前新的的state
    stateProps = mapStateToProps(state, ownProps)

    if (mapDispatchToProps.dependsOnOwnProps)
      dispatchProps = mapDispatchToProps(dispatch, ownProps)

    // 返回mergedProps function内部为新的object
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    return mergedProps
  }

  // 自身props改变
  function handleNewProps() {
    // dependsOnOwnProps之前介绍过，判断是否有第一个参数ownprops
    // 如果存在需要重新执行，获取新的stateProps和mapDispatchToProps，因为自身的props改变了
    if (mapStateToProps.dependsOnOwnProps)
      stateProps = mapStateToProps(state, ownProps)

    if (mapDispatchToProps.dependsOnOwnProps)
      dispatchProps = mapDispatchToProps(dispatch, ownProps)

    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    return mergedProps
  }

  // redux state改变
  function handleNewState() {
    const nextStateProps = mapStateToProps(state, ownProps)
    // 浅比较nextStateProps和stateProps
    const statePropsChanged = !areStatePropsEqual(nextStateProps, stateProps)
    // 更新stateProps
    stateProps = nextStateProps

    //statePropsChanged为ture，浅比较失败，mergedProps需要重新计算，mergedProps返回新对象
    if (statePropsChanged)
      mergedProps = mergeProps(stateProps, dispatchProps, ownProps)

    return mergedProps
  }

  function handleSubsequentCalls(nextState, nextOwnProps) {
    // 执行的时候ownProps浅比较
    const propsChanged = !areOwnPropsEqual(nextOwnProps, ownProps)
    // 比较redux state的引用
    const stateChanged = !areStatesEqual(nextState, state)
    // nextState赋值给state
    state = nextState
    // nextOwnProps赋值给onwProps
    ownProps = nextOwnProps

    // props && state change
    // 看不同情况对应的return function
    if (propsChanged && stateChanged) return handleNewPropsAndNewState()
    // props change
    if (propsChanged) return handleNewProps()
    // state change
    if (stateChanged) return handleNewState()
    // propsChanged, stateChanged为true认为props，state没有改变，return mergedProps
    return mergedProps
  }

  return function pureFinalPropsSelector(nextState, nextOwnProps) {  // state props
    return hasRunAtLeastOnce // 默认值为false
      ? handleSubsequentCalls(nextState, nextOwnProps)
      : handleFirstCall(nextState, nextOwnProps)
  }
}

// 找到export default
/**
 *
 *
 * @export
 * @param {*} dispatch // store.dispatch
 * @param {*} { 
 *    initMapStateToProps // 结构initProxySelector(dispatch, { displayName }) => proxy
 *    initMapDispatchToProps, // 结构 initMergePropsProxy(dispatch, options) => mergePropsProxy 
 *    initMergeProps, 
 *    ...options    其他配置
 *  }
 * @returns  selectorFactory function 
 */
// finalPropsSelectorFactory和我们的设想结构一致
export default function finalPropsSelectorFactory(
  dispatch,
  
  { initMapStateToProps, initMapDispatchToProps, initMergeProps, ...options }
) {
  // 调用initProxySelector得到proxy function, proxy包含mapToProps, dependsOnOwnProps属性
  const mapStateToProps = initMapStateToProps(dispatch, options)
  const mapDispatchToProps = initMapDispatchToProps(dispatch, options)
  // mergePropsProxy为function
  // 返回值为connect(mapstate,mapdispatch,function mergeProps(){})()中mergeProps的返回值
  const mergeProps = initMergeProps(dispatch, options)

  // 非production环境检验 mapStateToProps,mapDispatchToProps,mergeProps
  if (process.env.NODE_ENV !== 'production') {
    verifySubselectors(
      mapStateToProps,
      mapDispatchToProps,
      mergeProps,
      options.displayName
    )
  }

  // pure为true时表示selectorFactory的返回值缓存, 根据当前的redux state和ownProps的变化尽量做最出小的改变
  // 详情看pureFinalPropsSelectorFactory
  // 否则返回新对象
  const selectorFactory = options.pure
    ? pureFinalPropsSelectorFactory
    : impureFinalPropsSelectorFactory

  // 执行selectorFactory
  // selectorFactory为工厂函数，返回selector
  return selectorFactory(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps, // function mergePropsProxy
    dispatch,
    options
  )
}
