const Module = require("module");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "server-only") {
    return require.resolve("./phase19-noop.cjs");
  }
  return originalResolve.call(this, request, ...args);
};
