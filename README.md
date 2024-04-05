This is a quick example of combining a Pure Data patch (for audio) with a p5.js sketch (for visuals/interaction) in the browser, inspired by [Andrei Antonescu's workshop](https://github.com/andreiantonescu/purdue2024) at the Web Audio Conference on combining Max/RNBO and p5.js.

Basic steps involved:
- Install [PlugData](https://plugdata.org/) and create a Pd patch or open an existing one (e.g. `export-test.pd`)
- Export to C++ (via [Heavy](https://wasted-audio.github.io/hvcc/)): _Menu -> Compile... -> C++ Code_
- Compile C++ to Wasm + JS via [Emscripten](https://emscripten.org/)
- Wrap up generated JS in an AudioWorklet (see `post.js`)
- Send messages to patch from p5.js sketch (see `index.html`)

To try out this example, run e.g. `python3 -m http.server` and go to `http://localhost:8000`. Click anywhere to start the audio.

Further explanation and tutorial (possibly also featuring a version using [empd](https://mathr.co.uk/empd/) instead of [Heavy](https://wasted-audio.github.io/hvcc/)) to follow.
