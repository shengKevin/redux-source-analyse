// 象自身属性中是否具有指定的属性
const hasOwn = Object.prototype.hasOwnProperty

// 判断两个值是否是相同的值
// 笔者一直觉得这是一段神奇的代码，如有大神了解原理，跪求告知
function is(x, y) {
   // SameValue algorithm
   if (x === y) { 
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

// 浅比较 只会比较到两个对象的 ownProperty 是否符合 Object.is 判等，不会递归地去深层比较
//    shallowEqual({x:{}},{x:{}}) // false
//    shallowEqual({x:1},{x:1}) // true
export default function shallowEqual(objA, objB) {
  // 相同值直接返回true，shallowEqual返回值为boolean
  if (is(objA, objB)) return true

  // 在objA和objB不是相同值的前提下， 如果objA，objB为null或非object可以判定返回false
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false
  }

  // 定义objA，objB的key数组
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  // length不同说明object不同
  if (keysA.length !== keysB.length) return false

  // 循环遍历keysA
  for (let i = 0; i < keysA.length; i++) {
    // 如果objB不含有objA的key且objA与objB的value不同, 返回false
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false
    }
  }

  // 如果通过了for循环， 说明objA， objB中的第一层key和value都相同，恭喜通过
  return true
}
