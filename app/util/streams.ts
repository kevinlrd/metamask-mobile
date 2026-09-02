/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports -- TODO: Type the legacy stream bridge and replace CommonJS loading. */
/* eslint-disable import-x/no-commonjs */
const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream() {
  return Through.obj(function (this: any, serialized: any, _: any, cb: any) {
    this.push(JSON.parse(serialized));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @return {stream.Transform} the stream transform
 */
function jsonStringifyStream() {
  return Through.obj(function (this: any, obj: any, _: any, cb: any) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param {any} connectionStream - the stream to mux
 * @return {stream.Stream} the multiplexed stream
 */
function setupMultiplex(connectionStream: any) {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err: any) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
