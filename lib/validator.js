"use strict";

const constants = require('./constants');
const ValidationError = require('./error/validation-error');

class Validator {

  /**
   *
   * @param {RegExp|Function|Number} validator
   * @param {Program} programr
   */
  constructor(validator, program) {
    this._validator = validator;
    this._program = program;

    if (typeof this._validator === 'number') {
      this._checkFlagValidator();
    } else {
      this._checkOtherValidator();
    }
  }

  _checkOtherValidator() {
    if (typeof this._validator !== 'function' && !(this._validator instanceof RegExp)) {
      const err = new ValidationError(
        "Caporal setup error - Invalid validator setup.",
        {validator: this._validator},
        this._program
      );
      this._program.fatalError(err);
    }
  }

  _checkFlagValidator() {
    const isValidatorInvalid = Object.keys(constants).every(v => {
      return ((constants[v] & this._validator) === 0)
    });
    if (isValidatorInvalid) {
      const err = new ValidationError(
        "Caporal setup error - Invalid flag validator setup.",
        {validator: this._validator},
        this._program
      );
      this._program.fatalError(err);
    }
  }


  validate(value) {

    if (typeof this._validator === 'function') {
      return this._validateWithFunction(value);
    }
    else if (this._validator instanceof RegExp) {
      return this._validateWithRegExp(value);
    }
    // Caporal flag validator
    else if(typeof this._validator === 'number') {
      return this._validateWithFlags(value);
    }
  }

  /**
   *
   * @returns {*}
   * @private
   */
  _validateWithFlags(value, unary) {
    if (!unary && this._validator & constants.ARRAY) {

      if (typeof value === 'string') {
        value = value.split(',');
      }

      return value.map(function (el) {
        return this._validateWithFlags(el, true);
      }, this);
    }

    if (this._validator & constants.INT) {
      if (!Validator.isNumber(value)) {
        throw new ValidationError("Type (INT) validation failed", {value}, this._program);
      }
      return parseInt(value);
    }
    else if (this._validator & constants.FLOAT) {
      if (!Validator.isNumber(value)) {
        throw new ValidationError("Type (FLOAT) validation failed", {value}, this._program);
      }
      return parseFloat(value);
    }
    else if (this._validator & constants.BOOL) {
      if (typeof value === 'boolean') {
        return value;
      } else if (/^(true|false|yes|no|0|1)$/i.test(value) === false) {
        throw new ValidationError("Type (BOOL) validation failed", {value}, this._program);
      } else {
        return !(value === '0' || value === 'no' || value === 'false');
      }
    }
  }

  /**
   *
   * @returns {*}
   * @private
   */
  _validateWithFunction(value) {
    try {
      return this._validator(value);
    } catch(e) {
      throw new ValidationError(
        "Function validation failed",
        {validator: this._validator, value, originalError: e},
        this._program
      );
    }
  }
  /**
   *
   * @returns {*}
   * @private
   */
  _validateWithRegExp(value) {
    if (!this._validator.test(value)) {
      throw new ValidationError(
        "RegExp validation failed",
        {validator: this._validator, value},
        this._program
      );
    }
    return value;
  }

  static isNumber(obj) {
    return !isNaN(parseFloat(obj));
  }
}

module.exports = Validator;