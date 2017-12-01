export const throttle = (span, func, thisArg) => {
  let last = 0;
  let context = thisArg || null;
  return function throttler(...args) {
    let now = Date.now();
    if (now - last >= span) {
      last = now;
      return func.apply(context, args);
    }
  }
};

export const values = (obj = {}) =>
  Object.keys(obj).map(function value(key) {
    return obj[key];
  });

export const $id = (id) => document.getElementById(id);
export const $disabled = (elem) => elem.hasAttribute("disabled");

export const defaultMergeProps = (stateProps, dispatchProps, ownProps) =>
  Object.assign({}, ownProps, stateProps, dispatchProps);