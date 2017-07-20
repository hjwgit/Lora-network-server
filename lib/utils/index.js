var _ = require('lodash');

var _this = {
  isEmptyValue: function (value) {

    // 0, false is valid value in a shadow document
    if (value === null || value === undefined ||
        _this.isEmptyArray(value) ||
        _this.isEmptyObject(value)) {

      return true;
    }

    return false;
  },

  isString: function (value) {
    return typeof value === 'string';
  },

  isObject: function (value) {
    return (value && !Array.isArray(value) && typeof value === 'object');
  },

  isEmptyObject: function (obj) {
    return _this.isObject(obj) && Object.keys(obj).length === 0;
  },

  isArray: function (value) {
    return Array.isArray(value);
  },

  isEmptyArray: function (array) {
    return _this.isArray(array) && array.length === 0;
  },

  map2Obj: function (map) {
    var res = {};

    if (!_this.isObject(map)) {
      throw new Error('map2Obj: invalid input');
    }

    Object.keys(map).forEach(function (attr) {
      try {
        res[attr] = JSON.parse(map[attr]);
      } catch (ex) {
        res[attr] = map[attr];
        throw new Error('map2Obj: json parse error');
      }
    });

    return res;
  },

  obj2Map: function (obj) {
    var res = {};

    if (!_this.isObject(obj)) {
      throw new Error('obj2Map: invalid input');
    }

    Object.keys(obj).forEach(function (attr) {

      // stringify every type of value, include 'boolean', 'string', 'number', 'object'
      res[attr] = JSON.stringify(obj[attr]);
    });

    return res;
  },

  // join 2 arrays to obj. first array is key; second array is value;
  joinArray2Obj: function (keyArray, valArray) {
    var res = {};

    if (!_this.isArray(keyArray) || !_this.isArray(valArray)) {
      throw new Error('joinArray2Obj: invalid input');
    }

    keyArray.forEach(function (key, i) {
      res[key] = valArray[i];
    });

    return res;
  },

  cloneObj: function (obj) {
    if (!_this.isObject(obj) && !_this.isArray(obj)) {
      throw new Error('cloneObj: invalid input');
    }

    return JSON.parse(JSON.stringify(obj));
  },

  // return a promise or a callback
  functionReturn: function (promise, callback) {
    if (typeof callback === 'function') {
      return promise.then(function (data) {
        callback(null, data);
        return null;
      }).catch(callback);
    } else {
      return promise;
    }
  },
};

module.exports = _this;
