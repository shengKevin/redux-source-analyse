// hoist-non-react-statics组件，这个组件会自动把所有绑定在对象上的非React方法都绑定到新的对象上
import hoistStatics from 'hoist-non-react-statics'
// 提示信息插件
import invariant from 'invariant'
import React, { Component, PureComponent } from 'react'
import { isValidElementType } from 'react-is'

import { ReactReduxContext } from './Context'

/**
 *
 * @export  介绍下connectAdvanced
 *  connect() 的基础，真正将 React 组件连接到 Redux store 的函数
 * @param {*} selectorFactory function  selectorFactory(dispatch, factoryOptions)
 *  初始化选择器函数,该选择器函数是在 connector 组件需要重新计算一个新的 props 时调用
 *  作为 store 的 state 改变或者接收到一个新的 props 的结果。selector 的结果应该是一个普通对象，
 *  作为被包裹的组件的 props 传递。如果连续调用 selector 都返回与上一次调用相同的对象(===)，
 *  则不会重新渲染该组件。selector 的责任是在适当的时候返回以前的对象。
 * @param {*} [{
 *     getDisplayName = name => `ConnectAdvanced(${name})`,  DisplayName
 *     methodName = 'connectAdvanced',
 *     renderCountProp = undefined,
 *     shouldHandleStateChanges = true,
 *     storeKey = 'store',
 *     withRef = false,
 *     context = ReactReduxContext,
 *     ...connectOptions
 *   }={}]
 * @returns
 */
export default function connectAdvanced(

  selectorFactory,
  // options object:
  {
    // 被包裹的组件的 DisplayName 属性
    getDisplayName = name => `ConnectAdvanced(${name})`,
    // 显示在错误消息中
    methodName = 'connectAdvanced',
    // 组件是否订阅 redux store 的 state 更改
    shouldHandleStateChanges = true,
    renderCountProp = undefined, // 传递给内部组件的props键，表示render方法调用次数
    // 可以获取 store 的 props/context key
    storeKey = 'store',
    // 如果为 true，则将一个引用存储到被包裹的组件实例中，并通过 getWrappedInstance() 方法使其可用
    withRef = false,
    // 看到这个变量我的第一反应是ref的转发， 不了解的同学去看一下React.forwardRef()
    forwardRef = false,
    // provider的ReactReduxContext方法
    context = ReactReduxContext,
    ...connectOptions
  } = {}
) {
  // invariant 一个只在development环境的error
  // When process.env.NODE_ENV is not production, the message is required.
  // 这几个配置参数别使用的时候会有warnning，直接跳过这部分
  invariant(
    renderCountProp === undefined,
    `renderCountProp is removed. render counting is built into the latest React dev tools profiling extension`
  )

  invariant(
    !withRef,
    'withRef is removed. To access the wrapped instance, use a ref on the connected component'
  )

  const customStoreWarningMessage =
    'To use a custom Redux store for specific components,  create a custom React context with ' +
    "React.createContext(), and pass the context object to React-Redux's Provider and specific components" +
    ' like:  <Provider context={MyContext}><ConnectedComponent context={MyContext} /></Provider>. ' +
    'You may also pass a {context : MyContext} option to connect'

  invariant(
    storeKey === 'store',
    'storeKey has been removed and does not do anything. ' +
      customStoreWarningMessage
  )

  // 定义Context
  const Context = context

  // 返回react高阶组件,  WrappedComponent既包装的react组件
  return function wrapWithConnect(WrappedComponent) {
    // 参数检验
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        isValidElementType(WrappedComponent),
        `You must pass a component to the function returned by ` +
          `${methodName}. Instead received ${JSON.stringify(WrappedComponent)}`
      )
    }

    // 组件的displayName，默认Component
    const wrappedComponentName =
      WrappedComponent.displayName || WrappedComponent.name || 'Component'

    // 拼接下displayName
    const displayName = getDisplayName(wrappedComponentName)

    // 定义selectorFactoryOptions对象，包含了connect和connectAdvanced的所有参数
    const selectorFactoryOptions = {
      // connectOptions为initMapStateToProps,initMapDispatchToProps,pure等参数
      ...connectOptions,
      getDisplayName,
      methodName,
      renderCountProp,
      shouldHandleStateChanges,
      storeKey,
      displayName,
      wrappedComponentName,
      WrappedComponent
    }

    // pure决定shouldComponentUpdate是否进行shwoEqual
    const { pure } = connectOptions

    // Component赋值给OuterBaseComponent, 用react高阶的继承
    let OuterBaseComponent = Component
    // 定义FinalWrappedComponent
    let FinalWrappedComponent = WrappedComponent

    if (pure) {
      // 为true用PureComponent
      OuterBaseComponent = PureComponent
    }
    // 接下来直接看 class Connect extends OuterBaseComponent

// 
function makeDerivedPropsSelector() {
      // 定义变量, 用来保存上一次makeDerivedPropsSelector中的值
      // 变量语义化我们不难猜出意义
      let lastProps
      let lastState
      let lastDerivedProps
      let lastStore
      let sourceSelector
      return function selectDerivedProps(state, props, store) {  // props为父组件的props
        // pure为true时，props和state的引用都没有变化, 直接返回lastDerivedProps(第一次肯定不会成立)
        // 这里不难理解, 就是要求你用"纯"的state和props
        if (pure && lastProps === props && lastState === state) {
          return lastDerivedProps
        }

        if (store !== lastStore) {
          // store赋值lastStore, 更新lastStore
          // 除第一次调用外一般不会
          lastStore = store
          // selectorFactory为connect传入的function，默认值来自selsctorFactory.js的export default
          sourceSelector = selectorFactory(
            store.dispatch,
            selectorFactoryOptions  // 所有参数集合
          )
        }

        // props赋值给lastProps
        lastProps = props
        // state赋值给lastState
        lastState = state

        // 调用sourceSelector参入redux state和props, 得到最新的props
        // 不难看出selectorFactory的返回值为一个function, 目前我们可以猜测到
        // selsctorFactory.js的export default function 大体结构是这样(dispatch, option)=>(state, props) => newProps
        const nextProps = sourceSelector(state, props)

        // 新旧props引用相同
        if (lastDerivedProps === nextProps) {
          // 直接返回
          return lastDerivedProps
        }
        // 新旧props引用不相同， nextProps赋值给lastDerivedProps
        lastDerivedProps = nextProps
        // 返回lastDerivedProps
        return lastDerivedProps
        // 最后我们去看selsctorFactory.js到底如何合并的state和props
      }
    }

    function makeChildElementSelector() {
      // 定义props, ref, element变量
      let lastChildProps, lastForwardRef, lastChildElement
      // 返回function
      return function selectChildElement(childProps, forwardRef) {
        // 判断新旧props， hre， elelment是否相同
        if (childProps !== lastChildProps || forwardRef !== lastForwardRef) {
          // 如果不同重新赋值
          lastChildProps = childProps
          lastForwardRef = forwardRef
          lastChildElement = (
            // return FinalWrappedComponent, 改变props和ref
            <FinalWrappedComponent {...childProps} ref={forwardRef} />
          )
        }
        // react组件
        return lastChildElement
      }
    }

    class Connect extends OuterBaseComponent {
      constructor(props) {
        super(props)
        invariant(
          forwardRef ? !props.wrapperProps[storeKey] : !props[storeKey],
          'Passing redux store in props has been removed and does not do anything. ' +
            customStoreWarningMessage
        )
        // 添加selectDerivedProps和selectChildElement方法
        // selectDerivedProps为function是makeDerivedPropsSelector的返回值
        this.selectDerivedProps = makeDerivedPropsSelector()
        // selectChildElement为function
        this.selectChildElement = makeChildElementSelector()
        // bind this
        this.renderWrappedComponent = this.renderWrappedComponent.bind(this)
      }

      // value为context,既provider中的{storeState: store.getState(),store}
      renderWrappedComponent(value) {
        invariant(
          value,
          `Could not find "store" in the context of ` +
            `"${displayName}". Either wrap the root component in a <Provider>, ` +
            `or pass a custom React context provider to <Provider> and the corresponding ` +
            `React context consumer to ${displayName} in connect options.`
        )

        // 获取redux state和store
        const { storeState, store } = value

        // 定义wrapperProps为this.props
        let wrapperProps = this.props
        let forwardedRef
        // forwardRef为真时, Connect组件提供了forwardedRef = {ref}
        if (forwardRef) {
          // wrapperProps为props中的wrapperProps
          wrapperProps = this.props.wrapperProps
          // forwardedRef赋值为props的forwardedRef, 传递的是ref
          // 用于传递给子组件WrappedComponent既let FinalWrappedComponent = WrappedComponent中的FinalWrappedComponent
          forwardedRef = this.props.forwardedRef
        }

        // 导出props
        let derivedProps = this.selectDerivedProps(
          storeState,
          wrapperProps,
          store
        )

        // 返回最终的组件,传入最终的props和ref -> 看selectChildElement发放
        return this.selectChildElement(derivedProps, forwardedRef)
      }

      render() {
        // 默认情况下公用的ReactReduxContext
        const ContextToUse = this.props.context || Context

        return (
          // <Privoder />的消费者
          <ContextToUse.Consumer>
            {this.renderWrappedComponent}
          </ContextToUse.Consumer>
        )
      }
    }

    // 相当于插件
    // 包装的组件赋值给Connect.WrappedComponent
    Connect.WrappedComponent = WrappedComponent
    // 添加displayName
    Connect.displayName = displayName

    // forwardRef为true时
    if (forwardRef) {
      // 使用react.forwardRef为connect生成的组件的父组件提供孙子(传递给connect的组件)组件
      const forwarded = React.forwardRef(function forwardConnectRef(
        props,
        ref
      ) {
        return <Connect wrapperProps={props} forwardedRef={ref} />
      })

      // 此时connect()(<xx />)的生成组件为forwarded， 从新挂载displayName和WrappedComponent
      forwarded.displayName = displayName
      forwarded.WrappedComponent = WrappedComponent
      return hoistStatics(forwarded, WrappedComponent)
    }

    // 将子组件的非React的static(静态)属性或方法合并到父组件
    // 返回拓展过props属性的Connect组件
    return hoistStatics(Connect, WrappedComponent)
  }
}
