import verifyPlainObject from '../utils/verifyPlainObject'

export function defaultMergeProps(stateProps, dispatchProps, ownProps) {
  // 返回一个新对象
  return { ...ownProps, ...stateProps, ...dispatchProps }
}

export function wrapMergePropsFunc(mergeProps) {
  // initMergeProps
  return function initMergePropsProxy(
    dispatch,
    { displayName, pure, areMergedPropsEqual }
  ) {
    // 第一次运行，设置为false
    let hasRunOnce = false
    let mergedProps

    return function mergePropsProxy(stateProps, dispatchProps, ownProps) {
      // mergeProps的返回结果
      const nextMergedProps = mergeProps(stateProps, dispatchProps, ownProps)

      if (hasRunOnce) {
        // pure为fales 或者mergedProps为null
        if (!pure || !areMergedPropsEqual(nextMergedProps, mergedProps))
          mergedProps = nextMergedProps
      } else {
        // 不是第一次运行，hasRunOnce标记为false
        hasRunOnce = true
        // nextMergedProps赋值给mergedProps
        mergedProps = nextMergedProps

        if (process.env.NODE_ENV !== 'production')
          verifyPlainObject(mergedProps, displayName, 'mergeProps')
      }

     // 返回修改后的props
      return mergedProps
    }
  }
}

export function whenMergePropsIsFunction(mergeProps) {
  // 如果mergeProps为true且是function, 调用wrapMergePropsFunc返回function initMergePropsProxy(){}
  return typeof mergeProps === 'function'
    ? wrapMergePropsFunc(mergeProps)
    : undefined
}

export function whenMergePropsIsOmitted(mergeProps) {
  // mergeProps !== true retun () => { ...ownProps, ...stateProps, ...dispatchProps }
  return !mergeProps ? () => defaultMergeProps : undefined
}

// 后向前执行
export default [whenMergePropsIsFunction, whenMergePropsIsOmitted]

/**
 * [mergeProps(stateProps, dispatchProps, ownProps): props] (Function):
 *  如果指定了这个参数，mapStateToProps() 与 mapDispatchToProps() 的执行结果和组件自身的 props 将传入到这个回调函数中。
 *  该回调函数返回的对象将作为 props 传递到被包装的组件中
 */