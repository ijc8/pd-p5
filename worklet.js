// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = true;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = (f) => {
      const data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = (f) => {
    let data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer == 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data == 'object');
    return data;
  };

  readAsync = (f, onload, onerror) => {
    setTimeout(() => onload(readBinary(f)), 0);
  };

  if (typeof clearTimeout == 'undefined') {
    globalThis.clearTimeout = (id) => {};
  }

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit == 'function') {
    quit_ = (status, toThrow) => {
      // Unlike node which has process.exitCode, d8 has no such mechanism. So we
      // have no way to set the exit code and then let the program exit with
      // that code when it naturally stops running (say, when all setTimeouts
      // have completed). For that reason, we must call `quit` - the only way to
      // set the exit code - but quit also halts immediately.  To increase
      // consistency with node (and the web) we schedule the actual quit call
      // using a setTimeout to give the current stack and any exception handlers
      // a chance to run.  This enables features such as addOnPostRun (which
      // expected to be able to run code after main returns).
      setTimeout(() => {
        if (!(toThrow instanceof ExitStatus)) {
          let toLog = toThrow;
          if (toThrow && typeof toThrow == 'object' && toThrow.stack) {
            toLog = [toThrow, toThrow.stack];
          }
          err(`exiting due to exception: ${toLog}`);
        }
        quit(status);
      });
      throw toThrow;
    };
  }

  if (typeof print != 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console == 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr != 'undefined' ? printErr : print);
  }

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

if (Module['quit']) quit_ = Module['quit'];legacyModuleProp('quit', 'quit_');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('read', 'read_');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_WEB, "web environment detected but not enabled at build time.  Add 'web' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_WORKER, "worker environment detected but not enabled at build time.  Add 'worker' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add 'node' to `-sENVIRONMENT` to enable.");


// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');
var noExitRuntime = Module['noExitRuntime'] || true;legacyModuleProp('noExitRuntime', 'noExitRuntime');

if (typeof WebAssembly != 'object') {
  abort('no native wasm support detected');
}

// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}

assert(!Module['STACK_SIZE'], 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')

assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(!Module['INITIAL_MEMORY'], 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

// include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.
var wasmTable;

// end include: runtime_init_table.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}

// end include: runtime_stack_check.js
// include: runtime_assertions.js
// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;

var runtimeKeepaliveCounter = 0;

function keepRuntimeAlive() {
  return noExitRuntime || runtimeKeepaliveCounter > 0;
}

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  
  callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // defintion for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// show errors on likely calls to FS when it was not included
var FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

// include: URIUtils.js
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  // Prefix of data URIs emitted by SINGLE_FILE and related options.
  return filename.startsWith(dataURIPrefix);
}

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return filename.startsWith('file://');
}

// end include: URIUtils.js
/** @param {boolean=} fixedasm */
function createExportWrapper(name, fixedasm) {
  return function() {
    var displayName = name;
    var asm = fixedasm;
    if (!fixedasm) {
      asm = Module['asm'];
    }
    assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
    if (!asm[name]) {
      assert(asm[name], 'exported native function `' + displayName + '` not found');
    }
    return asm[name].apply(null, arguments);
  };
}

// include: runtime_exceptions.js
// end include: runtime_exceptions.js
var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,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Qf8BcUGBgoQIbCIBNgIAIAMgAiAEa0F8cSIEaiICQXxqIAE2AgAgBEEJSQ0AIAMgATYCCCADIAE2AgQgAkF4aiABNgIAIAJBdGogATYCACAEQRlJDQAgAyABNgIYIAMgATYCFCADIAE2AhAgAyABNgIMIAJBcGogATYCACACQWxqIAE2AgAgAkFoaiABNgIAIAJBZGogATYCACAEIANBBHFBGHIiBWsiAkEgSQ0AIAGtQoGAgIAQfiEGIAMgBWohAQNAIAEgBjcDGCABIAY3AxAgASAGNwMIIAEgBjcDACABQSBqIQEgAkFgaiICQR9LDQALCyAAC00AAkAgABCcAUL///////////8Ag0KAgICAgICA+P8AVg0AIAAgACABpSABEJwBQv///////////wCDQoCAgICAgID4/wBWGyEBCyABCwUAIAC9CzkAAkAgABCeAUH/////B3FBgICA/AdLDQAgACAAIAGXIAEQngFB/////wdxQYCAgPwHSxshAQsgAQsFACAAvAtZAQJ/IAEtAAAhAgJAIAAtAAAiA0UNACADIAJB/wFxRw0AA0AgAS0AASECIAAtAAEiA0UNASABQQFqIQEgAEEBaiEAIAMgAkH/AXFGDQALCyADIAJB/wFxawuFAQEDfyAAIQECQAJAIABBA3FFDQACQCAALQAADQAgACAAaw8LIAAhAQNAIAFBAWoiAUEDcUUNASABLQAADQAMAgsACwNAIAEiAkEEaiEBIAIoAgAiA0F/cyADQf/9+3dqcUGAgYKEeHFFDQALA0AgAiIBQQFqIQIgAS0AAA0ACwsgASAAawv9AQEBfwJAAkACQAJAIAEgAHNBA3ENACACQQBHIQMCQCABQQNxRQ0AIAJFDQADQCAAIAEtAAAiAzoAACADRQ0FIABBAWohACACQX9qIgJBAEchAyABQQFqIgFBA3FFDQEgAg0ACwsgA0UNAiABLQAARQ0DIAJBBEkNAANAIAEoAgAiA0F/cyADQf/9+3dqcUGAgYKEeHENAiAAIAM2AgAgAEEEaiEAIAFBBGohASACQXxqIgJBA0sNAAsLIAJFDQELA0AgACABLQAAIgM6AAAgA0UNAiAAQQFqIQAgAUEBaiEBIAJBf2oiAg0ACwtBACECCyAAQQAgAhCaARogAAsOACAAIAEgAhChARogAAsGAEGMnQQLBABB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QXhxQYCfBGohAwJAAkBBACgC2J4EIgRBASABQQN2dCIBcQ0AQQAgBCABcjYC2J4EIAMhAQwBCyADKAIIIQELIAMgADYCCCABIAA2AgwgACADNgIMIAAgATYCCA8LQR8hAwJAIAFB////B0sNACABQSYgAUEIdmciA2t2QQFxIANBAXRrQT5qIQMLIAAgAzYCHCAAQgA3AhAgA0ECdEGIoQRqIQQCQAJAAkBBACgC3J4EIgZBASADdCICcQ0AQQAgBiACcjYC3J4EIAQgADYCACAAIAQ2AhgMAQsgAUEAQRkgA0EBdmsgA0EfRht0IQMgBCgCACEGA0AgBiIEKAIEQXhxIAFGDQIgA0EddiEGIANBAXQhAyAEIAZBBHFqQRBqIgIoAgAiBg0ACyACIAA2AgAgACAENgIYCyAAIAA2AgwgACAANgIIDwsgBCgCCCIBIAA2AgwgBCAANgIIIABBADYCGCAAIAQ2AgwgACABNgIICwtTAQF+AkACQCADQcAAcUUNACABIANBQGqthiECQgAhAQwBCyADRQ0AIAFBwAAgA2utiCACIAOtIgSGhCECIAEgBIYhAQsgACABNwMAIAAgAjcDCAtTAQF+AkACQCADQcAAcUUNACACIANBQGqtiCEBQgAhAgwBCyADRQ0AIAJBwAAgA2uthiABIAOtIgSIhCEBIAIgBIghAgsgACABNwMAIAAgAjcDCAvkAwICfwJ+IwBBIGsiAiQAAkACQCABQv///////////wCDIgRCgICAgICAwP9DfCAEQoCAgICAgMCAvH98Wg0AIABCPIggAUIEhoQhBAJAIABC//////////8PgyIAQoGAgICAgICACFQNACAEQoGAgICAgICAwAB8IQUMAgsgBEKAgICAgICAgMAAfCEFIABCgICAgICAgIAIUg0BIAUgBEIBg3whBQwBCwJAIABQIARCgICAgICAwP//AFQgBEKAgICAgIDA//8AURsNACAAQjyIIAFCBIaEQv////////8Dg0KAgICAgICA/P8AhCEFDAELQoCAgICAgID4/wAhBSAEQv///////7//wwBWDQBCACEFIARCMIinIgNBkfcASQ0AIAJBEGogACABQv///////z+DQoCAgICAgMAAhCIEIANB/4h/ahDMASACIAAgBEGB+AAgA2sQzQEgAikDACIEQjyIIAJB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bXNnX3NldEJhbmcAaW5mAGhUYWJsZV9yZXNpemUAbXFfaW5pdFdpdGhQb29sU2l6ZQBzZXRPdXRwdXRNZXNzYWdlUXVldWVTaXplAHNldElucHV0TWVzc2FnZVF1ZXVlU2l6ZQBtc2dfZ2V0Q29yZVNpemUAaHZfZ2V0U2FtcGxlUmF0ZQBtc2dfZ2V0VHlwZQBodl9wcm9jZXNzSW5saW5lAGhMcF9jb25zdW1lAGdldE5leHRTZW50TWVzc2FnZQBtcF9hZGRNZXNzYWdlAGhMcF9wcm9kdWNlAHByb2Nlc3NJbmxpbmVJbnRlcmxlYXZlZABIdk1lc3NhZ2VQb29sLmMASHZNZXNzYWdlUXVldWUuYwBIdkxpZ2h0UGlwZS5jAEh2VGFibGUuYwBIdk1lc3NhZ2UuYwBzZW5kTWVzc2FnZVRvUmVjZWl2ZXJWAE5BTgBzICE9IDBMAHEtPmJ1ZmZlciAhPSAwTABtcC0+YnVmZmVyICE9IDBMAG4gIT0gMEwAcS0+cG9vbCAhPSAwTABjICE9IDBMAGIgIT0gMEwASU5GAGkgPCA0AHNhbXBsZVJhdGUgPiAwLjAAZGVsYXlNcyA+PSAwLjAAbnVtRWxlbWVudHMgPiAwAHBvb2xLYiA+IDAAb3V0UXVldWVLYiA+IDAAaW5RdWV1ZUtiID4gMABwb29sU2l6ZUtCID4gMABvdXRRdWV1ZUtiID49IDAAKCooKHVpbnQzMl90ICopIChxLT5yZWFkSGVhZCkpKSAhPSAwAC4AbnVtQnl0ZXMgPj0gc2l6ZW9mKFJlY2VpdmVyTWVzc2FnZVBhaXIpAGluZGV4IDwgbXNnX2dldE51bUVsZW1lbnRzKG0pAGkgPCBtc2dfZ2V0TnVtRWxlbWVudHMobSkAKG51bGwpAG40ICYgfigxLTEpAHEtPnJlbWFpbmluZ0J5dGVzID49IChudW1CeXRlcyArIDIqc2l6ZW9mKHVpbnQzMl90KSkAIShuNCAmICgxLTEpKQAobnVtQnl0ZXMgPD0gbXNnTGVuZ3RoQnl0ZXMpICYmICI6OmdldE5leHRTZW50TWVzc2FnZSAtIHRoZSBzZW50IG1lc3NhZ2UgaXMgYmlnZ2VyIHRoYW4gdGhlIG1lc3NhZ2UgIiAicGFzc2VkIHRvIGhhbmRsZSBpdC4iAGZhbHNlICYmICI6OmRlZmF1bHRTZW5kSG9vayAtIFRoZSBvdXQgbWVzc2FnZSBxdWV1ZSBpcyBmdWxsIGFuZCBjYW5ub3QgYWNjZXB0IG1vcmUgbWVzc2FnZXMgdW50aWwgdGhleSAiICJoYXZlIGJlZW4gcHJvY2Vzc2VkLiBUcnkgaW5jcmVhc2luZyB0aGUgb3V0UXVldWVLYiBzaXplIGluIHRoZSBuZXdfd2l0aF9vcHRpb25zKCkgY29uc3RydWN0b3IuIgBmYWxzZSAmJiAiOjpzZW5kTWVzc2FnZVRvUmVjZWl2ZXIgLSBUaGUgaW5wdXQgbWVzc2FnZSBxdWV1ZSBpcyBmdWxsIGFuZCBjYW5ub3QgYWNjZXB0IG1vcmUgbWVzc2FnZXMgdW50aWwgdGhleSAiICJoYXZlIGJlZW4gcHJvY2Vzc2VkLiBUcnkgaW5jcmVhc2luZyB0aGUgaW5RdWV1ZUtiIHNpemUgaW4gdGhlIG5ld193aXRoX29wdGlvbnMoKSBjb25zdHJ1Y3Rvci4iAChzZW5kSG9vayA9PSAmZGVmYXVsdFNlbmRIb29rKSAmJiAiOjpnZXROZXh0U2VudE1lc3NhZ2UgLSB0aGlzIGZ1bmN0aW9uIHdvbid0IGRvIGFueXRoaW5nIGlmIHRoZSBtc2cgb3V0UXVldWUgIiAic2l6ZSBpcyAwLCBvciB5b3UndmUgb3ZlcnJpZGVuIHRoZSBkZWZhdWx0IHNlbmRob29rLiIAKHAgIT0gbnVsbHB0cikgJiYgIjo6Z2V0TmV4dFNlbnRNZXNzYWdlIC0gc29tZXRoaW5nIGJhZCBoYXBwZW5lZC4iAChuZXdJbmRleCA8PSBtcC0+YnVmZmVyU2l6ZSkgJiYgIlRoZSBtZXNzYWdlIHBvb2wgYnVmZmVyIHNpemUgaGFzIGJlZW4gZXhjZWVkZWQuIFRoZSBjb250ZXh0IGNhbm5vdCBzdG9yZSBtb3JlIG1lc3NhZ2VzLiAiICJUcnkgdXNpbmcgdGhlIG5ld193aXRoX29wdGlvbnMoKSBpbml0aWFsaXNlciB3aXRoIGEgbGFyZ2VyIHBvb2wgc2l6ZSAoZGVmYXVsdCBpcyAxMEtCKS4iAFB1cmUgdmlydHVhbCBmdW5jdGlvbiBjYWxsZWQhAGxpYmMrK2FiaTogAAAAAAAArAkBAAIAAAADAAAABAAAAAQAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAEAAAABAAAAAQAAAAQAAAAEQAAABIAAAATAAAAFAAAABUAAAAEAAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAB0AAAAeAAAABAAAAAQAAAAxMkhlYXZ5Q29udGV4dAAyMUhlYXZ5Q29udGV4dEludGVyZmFjZQAAXA0BAIsJAQCEDQEAfAkBAKQJAQAAAAAApAkBAB8AAAAgAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAAAAAAPwKAQAiAAAAJQAAACYAAAAnAAAAKAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAKQAAACoAAAArAAAAEAAAABEAAAASAAAAEwAAABQAAAAVAAAALAAAABYAAAAXAAAAGAAAABkAAAAaAAAAGwAAABwAAAAdAAAAHgAAAC0AAAAuAAAAMTdIZWF2eV9leHBvcnRfdGVzdACEDQEA6AoBAKwJAQAAAAAAAAAAABkACgAZGRkAAAAABQAAAAAAAAkAAAAACwAAAAAAAAAAGQARChkZGQMKBwABAAkLGAAACQYLAAALAAYZAAAAGRkZAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAABkACg0ZGRkADQAAAgAJDgAAAAkADgAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAATAAAAABMAAAAACQwAAAAAAAwAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAADwAAAAQPAAAAAAkQAAAAAAAQAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIAAAAAAAAAAAAAABEAAAAAEQAAAAAJEgAAAAAAEgAAEgAAGgAAABoaGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAGhoaAAAAAAAACQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAFwAAAAAXAAAAAAkUAAAAAAAUAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAAAAAAAAAAAAABUAAAAAFQAAAAAJFgAAAAAAFgAAFgAAMDEyMzQ1Njc4OUFCQ0RFRvgNAQBOMTBfX2N4eGFiaXYxMTZfX3NoaW1fdHlwZV9pbmZvRQAAAACEDQEA9AwBAOgNAQBOMTBfX2N4eGFiaXYxMTdfX2NsYXNzX3R5cGVfaW5mb0UAAACEDQEAJA0BABgNAQAAAAAASA0BADQAAAA1AAAANgAAADcAAAA4AAAAOQAAADoAAAA7AAAAAAAAAMwNAQA0AAAAPAAAADYAAAA3AAAAOAAAAD0AAAA+AAAAPwAAAE4xMF9fY3h4YWJpdjEyMF9fc2lfY2xhc3NfdHlwZV9pbmZvRQAAAACEDQEApA0BAEgNAQBTdDl0eXBlX2luZm8AAAAAXA0BANgNAQAAQfCbBAucAVARAQAAAAAABQAAAAAAAAAAAAAAMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMgAAADMAAABQEQEAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAP//////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+A0BAA==';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    var binary = tryParseAsDataURI(file);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise(binaryFile) {
  // If we don't have the binary yet, try to load it asynchronously.
  // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
  // See https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Cordova or Electron apps are typically loaded from a file:// url.
  // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == 'function'
    ) {
      return fetch(binaryFile, { credentials: 'same-origin' }).then((response) => {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + binaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(() => getBinary(binaryFile));
    }
  }

  // Otherwise, getBinary should be able to get it synchronously
  return Promise.resolve().then(() => getBinary(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile).then((binary) => {
    return WebAssembly.instantiate(binary, imports);
  }).then((instance) => {
    return instance;
  }).then(receiver, (reason) => {
    err('failed to asynchronously prepare wasm: ' + reason);

    // Warn on some common problems.
    if (isFileURI(wasmBinaryFile)) {
      err('warning: Loading from a file URI (' + wasmBinaryFile + ') is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing');
    }
    abort(reason);
  });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
  if (!binary &&
      typeof WebAssembly.instantiateStreaming == 'function' &&
      !isDataURI(binaryFile) &&
      typeof fetch == 'function') {
    return fetch(binaryFile, { credentials: 'same-origin' }).then((response) => {
      // Suppress closure warning here since the upstream definition for
      // instantiateStreaming only allows Promise<Repsponse> rather than
      // an actual Response.
      // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure is fixed.
      /** @suppress {checkTypes} */
      var result = WebAssembly.instantiateStreaming(response, imports);

      return result.then(
        callback,
        function(reason) {
          // We expect the most common failure cause to be a bad MIME type for the binary,
          // in which case falling back to ArrayBuffer instantiation should work.
          err('wasm streaming compile failed: ' + reason);
          err('falling back to ArrayBuffer instantiation');
          return instantiateArrayBuffer(binaryFile, imports, callback);
        });
    });
  } else {
    return instantiateArrayBuffer(binaryFile, imports, callback);
  }
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;

    Module['asm'] = exports;

    wasmMemory = Module['asm']['memory'];
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);
    updateMemoryViews();

    wasmTable = Module['asm']['__indirect_function_table'];
    assert(wasmTable, "table not found in wasm exports");

    addOnInit(Module['asm']['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
    return exports;
  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    receiveInstance(result['instance']);
  }

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {

    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
        return false;
    }
  }

  instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
  return {}; // no exports yet; we'll fill them in later
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// include: runtime_debug.js
function legacyModuleProp(prop, newName) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get: function() {
        abort('Module.' + prop + ' has been replaced with plain ' + newName + ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort('`Module.' + prop + '` was supplied but `' + prop + '` not included in INCOMING_MODULE_JS_API');
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingGlobal(sym, msg) {
  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get: function() {
        warnOnce('`' + sym + '` is not longer defined by emscripten. ' + msg);
        return undefined;
      }
    });
  }
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');

function missingLibrarySymbol(sym) {
  if (typeof globalThis !== 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get: function() {
        // Can't `abort()` here because it would break code that does runtime
        // checks.  e.g. `if (typeof SDL === 'undefined')`.
        var msg = '`' + sym + '` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line';
        // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
        // library.js, which means $name for a JS name with no prefix, or name
        // for a JS name like _name.
        var librarySymbol = sym;
        if (!librarySymbol.startsWith('_')) {
          librarySymbol = '$' + sym;
        }
        msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=" + librarySymbol + ")";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        warnOnce(msg);
        return undefined;
      }
    });
  }
  // Any symbol that is not included from the JS libary is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get: function() {
        var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(text) {
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn.apply(console, arguments);
}

// end include: runtime_debug.js
// === Body ===


// end include: preamble.js

  /** @constructor */
  function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }

  function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    }

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': abort('to do getValue(i64) use WASM_BIGINT');
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      var chr = array[i];
      if (chr > 0xFF) {
        assert(false, `Character code ${chr} (${String.fromCharCode(chr)}) at offset ${i} not in 0x00-0xFF.`);
        chr &= 0xFF;
      }
      ret.push(String.fromCharCode(chr));
    }
    return ret.join('');
  }

  function ptrToString(ptr) {
      assert(typeof ptr === 'number');
      return '0x' + ptr.toString(16).padStart(8, '0');
    }

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[((ptr)>>0)] = value; break;
      case 'i8': HEAP8[((ptr)>>0)] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': abort('to do setValue(i64) use WASM_BIGINT');
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  function warnOnce(text) {
      if (!warnOnce.shown) warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    }

  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
  function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.  Also, use the length info to avoid running tiny
      // strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation,
      // so that undefined means Infinity)
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      // If building with TextDecoder, we have already computed the string length
      // above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    }
  
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
  function UTF8ToString(ptr, maxBytesToRead) {
      assert(typeof ptr == 'number');
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    }
  function ___assert_fail(condition, filename, line, func) {
      abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
    }

  function _abort() {
      abort('native code called abort()');
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  function getHeapMax() {
      return HEAPU8.length;
    }
  
  function abortOnCannotGrowMemory(requestedSize) {
      abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`);
    }
  function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }

  var SYSCALLS = {varargs:undefined,get:function() {
        assert(SYSCALLS.varargs != undefined);
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      }};
  function _fd_close(fd) {
      abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
    }

  function convertI32PairToI53Checked(lo, hi) {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    }
  
  
  
  
  function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
      return 70;
    }

  var printCharBuffers = [null,[],[]];
  
  function printChar(stream, curr) {
      var buffer = printCharBuffers[stream];
      assert(buffer);
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    }
  
  function flush_NO_FILESYSTEM() {
      // flush anything remaining in the buffers during shutdown
      _fflush(0);
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    }
  
  
  function _fd_write(fd, iov, iovcnt, pnum) {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    }

  function getCFunc(ident) {
      var func = Module['_' + ident]; // closure exported function
      assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
      return func;
    }
  
  function writeArrayToMemory(array, buffer) {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
      HEAP8.set(array, buffer);
    }
  
  function lengthBytesUTF8(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    }
  
  function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
      assert(typeof str === 'string');
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) {
          var u1 = str.charCodeAt(++i);
          u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
        }
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    }
  function stringToUTF8(str, outPtr, maxBytesToWrite) {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
    }
  function stringToUTF8OnStack(str) {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    }
  
  
    /**
     * @param {string|null=} returnType
     * @param {Array=} argTypes
     * @param {Arguments|Array=} args
     * @param {Object=} opts
     */
  function ccall(ident, returnType, argTypes, args, opts) {
      // For fast lookup of conversion functions
      var toC = {
        'string': (str) => {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) { // null string
            // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
            ret = stringToUTF8OnStack(str);
          }
          return ret;
        },
        'array': (arr) => {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        }
      };
  
      function convertReturnValue(ret) {
        if (returnType === 'string') {
          
          return UTF8ToString(ret);
        }
        if (returnType === 'boolean') return Boolean(ret);
        return ret;
      }
  
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      assert(returnType !== 'array', 'Return type should not be "array".');
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var ret = func.apply(null, cArgs);
      function onDone(ret) {
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
      }
  
      ret = onDone(ret);
      return ret;
    }
// include: base64Utils.js
// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob == 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


// end include: base64Utils.js
function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var wasmImports = {
  "__assert_fail": ___assert_fail,
  "abort": _abort,
  "emscripten_memcpy_big": _emscripten_memcpy_big,
  "emscripten_resize_heap": _emscripten_resize_heap,
  "fd_close": _fd_close,
  "fd_seek": _fd_seek,
  "fd_write": _fd_write
};
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors");
/** @type {function(...*):?} */
var _hv_export_test_new = Module["_hv_export_test_new"] = createExportWrapper("hv_export_test_new");
/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = createExportWrapper("malloc");
/** @type {function(...*):?} */
var _free = Module["_free"] = createExportWrapper("free");
/** @type {function(...*):?} */
var _hv_stringToHash = Module["_hv_stringToHash"] = createExportWrapper("hv_stringToHash");
/** @type {function(...*):?} */
var _hv_sendFloatToReceiver = Module["_hv_sendFloatToReceiver"] = createExportWrapper("hv_sendFloatToReceiver");
/** @type {function(...*):?} */
var _hv_processInline = Module["_hv_processInline"] = createExportWrapper("hv_processInline");
/** @type {function(...*):?} */
var _hv_delete = Module["_hv_delete"] = createExportWrapper("hv_delete");
/** @type {function(...*):?} */
var ___errno_location = createExportWrapper("__errno_location");
/** @type {function(...*):?} */
var _fflush = Module["_fflush"] = createExportWrapper("fflush");
/** @type {function(...*):?} */
var _emscripten_stack_init = function() {
  return (_emscripten_stack_init = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_free = function() {
  return (_emscripten_stack_get_free = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_base = function() {
  return (_emscripten_stack_get_base = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_end = function() {
  return (_emscripten_stack_get_end = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackSave = createExportWrapper("stackSave");
/** @type {function(...*):?} */
var stackRestore = createExportWrapper("stackRestore");
/** @type {function(...*):?} */
var stackAlloc = createExportWrapper("stackAlloc");
/** @type {function(...*):?} */
var _emscripten_stack_get_current = function() {
  return (_emscripten_stack_get_current = Module["asm"]["emscripten_stack_get_current"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

Module["ccall"] = ccall;
var missingLibrarySymbols = [
  'zeroMemory',
  'exitJS',
  'emscripten_realloc_buffer',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'setErrNo',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'getHostByName',
  'initRandomFill',
  'randomFill',
  'traverseStack',
  'getCallstack',
  'emscriptenLog',
  'convertPCtoSourceLocation',
  'readEmAsmArgs',
  'jstoi_q',
  'jstoi_s',
  'getExecutableName',
  'listenOnce',
  'autoResumeAudioContext',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'handleException',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'safeSetTimeout',
  'asmjsMangle',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'HandleAllocator',
  'getNativeTypeSize',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertU32PairToI53',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'intArrayFromString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'stringToNewUTF8',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'demangle',
  'demangleAll',
  'jsStackTrace',
  'stackTrace',
  'getEnvStrings',
  'checkWasiClock',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'createDyncallWrapper',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'polyfillSetImmediate',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'ExceptionInfo',
  'setMainLoop',
  'getSocketFromFD',
  'getSocketAddress',
  'FS_createPreloadedFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'heapAccessShiftForWebGLHeap',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  '__glGenObject',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'SDL_unicode',
  'SDL_ttfContext',
  'SDL_audio',
  'GLFW_Window',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

var unexportedSymbols = [
  'run',
  'addOnPreRun',
  'addOnInit',
  'addOnPreMain',
  'addOnExit',
  'addOnPostRun',
  'addRunDependency',
  'removeRunDependency',
  'FS_createFolder',
  'FS_createPath',
  'FS_createDataFile',
  'FS_createLazyFile',
  'FS_createLink',
  'FS_createDevice',
  'FS_unlink',
  'out',
  'err',
  'callMain',
  'abort',
  'keepRuntimeAlive',
  'wasmMemory',
  'stackAlloc',
  'stackSave',
  'stackRestore',
  'getTempRet0',
  'setTempRet0',
  'writeStackCookie',
  'checkStackCookie',
  'intArrayFromBase64',
  'tryParseAsDataURI',
  'ptrToString',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'ENV',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'ERRNO_CODES',
  'ERRNO_MESSAGES',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'UNWIND_CACHE',
  'readEmAsmArgsArray',
  'convertI32PairToI53Checked',
  'getCFunc',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayToString',
  'UTF16Decoder',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'JSEvents',
  'specialHTMLTargets',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'ExitStatus',
  'flush_NO_FILESYSTEM',
  'dlopenMissingError',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'Browser',
  'wget',
  'SYSCALLS',
  'preloadPlugins',
  'FS',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'emscripten_webgl_power_preferences',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'GLFW',
  'allocateUTF8',
  'allocateUTF8OnStack',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);



var calledRun;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {

  if (runDependencies > 0) {
    return;
  }

    stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    flush_NO_FILESYSTEM();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();


// end include: postamble.js
// include: /home/ian/Documents/plugdata/c/post.js
class CustomProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.setup()
    }

    async setup() {
        console.log("hey")
        await new Promise(resolve => { Module.onRuntimeInitialized = resolve })
        // const ctx = Module.ccall("hv_export_test_new", "number", ["number"], 48000);
        this.ctx = Module._hv_export_test_new(48000);
        console.log(this.ctx)

        const receiverHash = Module.ccall("hv_stringToHash", "number", ["string"], ["freq"])
        Module._hv_sendFloatToReceiver(this.ctx, receiverHash, 440);

        const block_size = 128;
        const num_channels = 2;
        this.buffer = Module._malloc(block_size * num_channels & Float32Array.BYTES_PER_ELEMENT)
        this.port.onmessage = e => {
            Module._hv_sendFloatToReceiver(this.ctx, receiverHash, e.data);
        }
    }

    process(inputs, outputs, parameters) {
        if (this.buffer === undefined) return
        const array = outputs[0][0]
        Module.HEAPF32.set(array, this.buffer / Float32Array.BYTES_PER_ELEMENT)
        const n = Module._hv_processInline(this.ctx, this.buffer, this.buffer, array.length)
        array.set(new Float32Array(Module.HEAP32.buffer, this.buffer, array.length))
        console.log(n)
        return true
    }
}

registerProcessor("custom-processor", CustomProcessor)

// end include: /home/ian/Documents/plugdata/c/post.js
