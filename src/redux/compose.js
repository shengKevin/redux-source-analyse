/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

 // 其实这个很有意思，是函数编程中的方法
//  我们来做一到题
//  实现这个样一个function -> compose(funcA, funcB, funcC) 形象为 compose(funcA(funcB(funcC())))）
//  返回值为一个(...args)=>(funcA(funcB(funcC(...args)))))
/**
 *
 * 你可能会这样写， 或者是for循环 
 * 
 *  function Compose(...funcs){
      if (funcs.length === 0) {
        return args => args;
      }
      if (funcs.length === 1) {
        return funcs[0]
      }
      const arr = funcs;
      let firstFun = arr[0];
      let len = arr.length;
      let i = 1;
      while(i !== len) {
        firstFun = firstFun(arr[i]);
        i++;
      }
      return firstFun;
    }
 * 
 * 
 */
// 好啦， 我们看看优秀的答案吧 👇

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  // 是不是很巧妙
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}