import isPlainObject from './isPlainObject'
import warning from './warning'

// utils方法， 如果不是纯对象，抛出warning
export default function verifyPlainObject(value, displayName, methodName) {
  if (!isPlainObject(value)) {
    warning(
      `${methodName}() in ${displayName} must return a plain object. Instead received ${value}.`
    )
  }
}
