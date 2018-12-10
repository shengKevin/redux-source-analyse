import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { ReactReduxContext } from './Context'

class Provider extends Component {
  constructor(props) {
    super(props)

    // 获取store
    const { store } = props

    // 初始化state, storeState为初始的redux state
    this.state = {
      storeState: store.getState(),
      // 保存init store
      store
    }
  }

  componentDidMount() {
    // 文件收索_isMounted， 共三处， componentWillUnmount中赋值为false
    // 先假设为标记componentDidMount -> componentWillUnmount中
    this._isMounted = true
    // 来看下subscribe
    this.subscribe()
  }

  componentWillUnmount() {
    // 取消监听subscribe
    if (this.unsubscribe) this.unsubscribe()
    // 生命周期结束this._isMounted 赋值为false =》_isMounted假设成立✅
    this._isMounted = false
  }

  componentDidUpdate(prevProps) {
    // 如果更新的过程中store改变引用
    if (this.props.store !== prevProps.store) {
      // 如果存在监听则取消
      if (this.unsubscribe) this.unsubscribe()
      // 更新storeState
      this.subscribe()
    }
    /*
    *   这里一开始我没看懂， 因为在我的理解中redux的store应该是不变的，主要就是为了提供"全局变量"
    *   既然作者这样写了我们来思考一下
    *   一般store应该是这样 let store = createStore(rootReducer, initState,  applyMiddleware(xxx));
    *   this.props.store !== prevProps.store说明全局的store发生了变化。既createStore方法的参数发生了变化，
    *   阅读过redux源码的同学应该知道, 这样会使"全局的state"发生变化
    *   所有这里再次调用subscribe更新state里面的storeState
    *
    * * */

  }

  // 使用store.subscribe方法，保证storeState的最新
  subscribe() {
    const { store } = this.props
    // 监听subscribe
    this.unsubscribe = store.subscribe(() => {
     // 获取最新的state赋值给newStoreState
      const newStoreState = store.getState()
      // 不在本次生命周期中return
      if (!this._isMounted) {
        return
      }

      this.setState(providerState => {
        // If the value is the same, skip the unnecessary state update.
        // 如果state是相同的引用， 直接跳过state的更新
        if (providerState.storeState === newStoreState) {
          return null
        }

        // 更新当前storeState
        return { storeState: newStoreState }
      })
    })

    // Actions might have been dispatched between render and mount - handle those
    const postMountStoreState = store.getState()
    if (postMountStoreState !== this.state.storeState) {
      this.setState({ storeState: postMountStoreState })
    }
  }

  render() {
    // ReactReduxContext为默认context， 点过去看一下默认值。 看 -> context.js 是null
    const Context = this.props.context || ReactReduxContext

    // value 为this.state
    return (
      <Context.Provider value={this.state}>
        {this.props.children}
      </Context.Provider>
    )
  }
}

Provider.propTypes = {
  // 接受store做为props， 并规定store必要的方法，既redux createStore的返回值
  store: PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired
  }),
  // 接受自定义context
  context: PropTypes.object,
  // children， 通常为根容器<app />
  children: PropTypes.any
}

export default Provider

/**
 *  provider总结
 * 
 *  provider是react-redux提供是react应用的入口组件， 一般为顶层组件<Provider store={store}><App /></Provider>
 *  使用react的context传递store， 老版本的provider用的getChildContext方法， 随着react context的api变更为生产者消费者模式的新api
 *  provider的源码已经重构， 提供的context为{ store, storeState: state}，state保存为最新
 * 
 * * */
