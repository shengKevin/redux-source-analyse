/**
 *  react-redux 暴露的api, connectAdvanced(selectorFactory, [connectOptions])
 *  连接react组件和redux的store, 这个参数是connect的基础
*/
import connectAdvanced from '../components/connectAdvanced'
import shallowEqual from '../utils/shallowEqual'
// 先回顾一下connect的参数connect([mapStateToProps], [mapDispatchToProps], [mergeProps], [options])
// 作用：连接 React 组件与 Redux store
// mapDispatchToProps(dispatch, [ownProps])
import defaultMapDispatchToPropsFactories from './mapDispatchToProps'
// mapStateToProps(state, ownProps)
// 只要 Redux store 发生改变,mapStateToProps 函数就会被调用, 
// 或者如果有ownProps参数组件接收到新的props,mapStateToProps同样会被调用
import defaultMapStateToPropsFactories from './mapStateToProps'
// mapStateToProps() 与 mapDispatchToProps() 的执行结果和组件自身的 props 将传入到这个回调函数中
import defaultMergePropsFactories from './mergeProps'
// 定制 connector 如 pure = true...
import defaultSelectorFactory from './selectorFactory'

/**
 *
 * 以mapStatetoProps为例子， 其他的同理
 * @param {*} arg  使用时传进来的mapStatetoProps
 * @param {*} factories  array[function, function]
 * 默认工厂defaultMapStateToPropsFactories, [whenMapStateToPropsIsFunction, whenMapStateToPropsIsMissing]
 * @param {*} name  string
 * @returns  function
 */
function match(arg, factories, name) {
  // 后到前遍历factories
  for (let i = factories.length - 1; i >= 0; i--) {
    // 调用factories， 返回值赋值给result -> mapStateToProps.js
    const result = factories[i](arg)
    // result为true返回result, result为(dispatch, options) => function(){...}的function
    if (result) return result
  }
  // 不符合connect方法规则throw Error
  return (dispatch, options) => {
    throw new Error(
      `Invalid value of type ${typeof arg} for ${name} argument when connecting component ${
        options.wrappedComponentName
      }.`
    )
  }
}

// 判断对象的索引是否相同
function strictEqual(a, b) {
  return a === b
}

// 暴露createConnect
export function createConnect({
  // 一些带有默认值的参数， 我们看下面， 具体用到了在看👀
  connectHOC = connectAdvanced, // connectAdvanced(selectorFactory, [connectOptions])
  mapStateToPropsFactories = defaultMapStateToPropsFactories, // array[function, function]
  mapDispatchToPropsFactories = defaultMapDispatchToPropsFactories,
  mergePropsFactories = defaultMergePropsFactories,
  selectorFactory = defaultSelectorFactory
} = {}) {
  // 返回的connect function
  return function connect(
    // connect的四个可选参数
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    // 配置参数
    {
      pure = true, // 是否就行浅比较的配置
      // 其他的下面讲解👇
      areStatesEqual = strictEqual, 
      areOwnPropsEqual = shallowEqual,
      areStatePropsEqual = shallowEqual,
      areMergedPropsEqual = shallowEqual,
      ...extraOptions
    } = {}
  ) {
    // mapStateToProps初始化
    const initMapStateToProps = match(
      // 使用时传递的mapStateToProps function
      mapStateToProps,
      // 默认值 -> 先看match方法， 然后我们来看mapStateToProps.js
      mapStateToPropsFactories,
      'mapStateToProps'
    )
    // mapDispatchToProps初始化
    const initMapDispatchToProps = match(
      mapDispatchToProps,
      mapDispatchToPropsFactories,
      'mapDispatchToProps'
    )
    // mergeProps的初始化
    const initMergeProps = match(mergeProps, mergePropsFactories, 'mergeProps')

    // return connectHOC function，将 React 组件连接到 Redux store 的函数
    // 先来看看他的参数
    // selectorFactory函数返回一个selector函数，根据store state, 展示型组件props,和dispatch计算得到新props，最后注入容器组件
    // selectorFactory  -> defaultSelectorFactory
    // 其实很熟悉react-redux api的同学应该很熟悉connectHOC的参数， 因为他就是connectAdvanced方法啊， 建议先看看api
    return connectHOC(selectorFactory, {
      // 用于错位信息
      methodName: 'connect',
      // 用Connect包装getDisplayName
      getDisplayName: name => `Connect(${name})`,
      // mapStateToProps是否为undefined，shouldHandleStateChanges为false则不监听store state
      shouldHandleStateChanges: Boolean(mapStateToProps),

      // selectorFactory需要的几个参数
      initMapStateToProps,     // (dispatch, options) => initProxySelector(dispatch, { displayName }){...}
      initMapDispatchToProps,
      initMergeProps,
      pure, // 默认true
      // strictEqual， 这里很容易想到用于判断this.state是不是都一份引用
      areStatesEqual,  
      // shallowEqual浅比较
      // 插个题外话，熟悉react PureComponent的同学应该可以快速反应过来!shallowEqual(instance.props, nextProps) || !shallowEqual(instance.state, nextState)
      // 不熟悉的同学看过来 -> shallowEqual.js
      areOwnPropsEqual,  
      areStatePropsEqual,
      areMergedPropsEqual,
      // 容错处理, 其他的配置项
      ...extraOptions
    })
  }
}

// connect方法 直接调用createConnect
export default createConnect()
