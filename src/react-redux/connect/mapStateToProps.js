import { wrapMapToPropsConstant, wrapMapToPropsFunc } from './wrapMapToProps'

// 当mapStateToProps为function时调用wrapMapToPropsFunc
export function whenMapStateToPropsIsFunction(mapStateToProps) {
  return typeof mapStateToProps === 'function'
    // 看wrapMapToPropsFunc -> wrapMapToProps.js
    ? wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')
    : undefined
}

// match中的数组倒着遍历先看这里
// 容错处理, 判断是否传递mapStateToProps参数
export function whenMapStateToPropsIsMissing(mapStateToProps) {
  // 如果传递了mapStateToProps参数且!mapStateToProps = true返回undefined，此时result为undefined，无效调用
  // 没有传递mapStateToProps参数或mapStateToProps=false -> wrapMapToPropsConstant
  return !mapStateToProps ? wrapMapToPropsConstant(() => ({})) : undefined
}

// export default是array 元素为function
export default [whenMapStateToPropsIsFunction, whenMapStateToPropsIsMissing]

// 可以mapstateToprops参数可执行时调用wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps')
// 不传递mapstateToprops参数时 wrapMapToPropsConstant(() => ({}))
// 我们接着刨根问底 看->wrapMapToProps.js
