testgl = {};

testgl.argsDefault = {
  pointsPerDataset: 1000000,
  datasets: 1,
  pointSize: 1.0,
  frames: 100,
  minFps: 30
};

testgl.addHeadScript = function(script, cb) {
  if (typeof(script) == "string") script = {url: script};
  var head = document.getElementsByTagName('head')[0];
  var tag = document.createElement('script');
  tag.type = script.type || 'text/javascript';
  tag.src = script.url;
  tag.onload = cb;
  head.appendChild(tag);
};

testgl.withJQuery = function(fn) {
  if (typeof($) == "undefined") {

    testgl.addHeadScript("http://code.jquery.com/jquery-1.11.0.min.js", function () {
      testgl.addHeadScript("http://code.jquery.com/jquery-migrate-1.2.1.min.js", function () {
        fn();
      });
    });
  } else {
    fn();
  }
};

testgl.withDocReady = function(fn) {
  testgl.withJQuery(function () {
    $(document).ready(function() {
      fn();
    });
  });
}

testgl.shader_vertex_source = [
  'attribute vec2 position;',
  'attribute vec3 color;',
  'uniform float ps;',
  'varying vec3 vColor;',
  '',
  'void main(void) {',
  '  gl_Position = vec4(position, 0., 1.);',
  '  gl_PointSize = ps;',
  '  vColor=color;',
  '}'
].join("\n");

testgl.shader_fragment_source = [
  'precision mediump float;',
  '',
  'varying vec3 vColor;',
  '',
  'void main(void) {',
  '  gl_FragColor = vec4(vColor, 0.);',
  '}'
].join("\n");


testgl.testGl = function(args, cb) {

  function performGlTest(args, cb) {
    var res = {errors: []};

    var canvas = $("<canvas>");

    canvas.css({
      position: "absolute",
      left: 0,
      top: 0
    });
    $("body").append(canvas);

    canvas = canvas[0];
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;

    var done = function() {
      canvas.remove();
      cb(res);
    };

    try {
      var GL = canvas.getContext("experimental-webgl", {antialias: true});
    } catch (e) {
      res.errors.push("Unable to enable context experimental-webgl");
      done(); return;
    } ;
    if (!GL) {
      res.errors.push("Unable to enable context experimental-webgl");
      done(); return;
    }

    function get_shader_program(GL) {
      var get_shader=function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
          res.errors.push("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
          done(); return;
        }
        return shader;
      };

      var shader_vertex=get_shader(testgl.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
      var shader_fragment=get_shader(testgl.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
      if (!shader_vertex || !shader_fragment) return;

      var program=GL.createProgram();
      GL.attachShader(program, shader_vertex);
      GL.attachShader(program, shader_fragment);

      GL.linkProgram(program);

      return program;
    }

    var program = get_shader_program(GL);
    if (!program) return;
    var _color = GL.getAttribLocation(program, "color");
    var _position = GL.getAttribLocation(program, "position");

    GL.enableVertexAttribArray(_color);
    GL.enableVertexAttribArray(_position);

    GL.useProgram(program);

    var datasets = [];

    for (var i = 0; i < args.datasets; i++) {
      var dataset = {};
      datasets.push(dataset);

      dataset.points = new Float32Array(2 * args.pointsPerDataset);
      dataset.color = new Float32Array(3 * args.pointsPerDataset);
      for (var j = 0; j < args.pointsPerDataset; j++) {
        dataset.points[j*2] = 2*Math.random()-1.0;
        dataset.points[j*2 + 1] = 2*Math.random()-1.;
        dataset.color[j*3] = 0.0;
        dataset.color[j*3+1] = 0.0;
        dataset.color[j*3+2] = 0.0;
/*
        dataset.color[j*3] = Math.random();
        dataset.color[j*3+1] = Math.random();
        dataset.color[j*3+2] = Math.random();
*/
      }
    }

    var start = performance.now();
    for (var i = 0; i < args.datasets; i++) {
      dataset = datasets[i];

      dataset.pointBuffer= GL.createBuffer();
      dataset.colorBuffer= GL.createBuffer();
      GL.bindBuffer(GL.ARRAY_BUFFER, dataset.pointBuffer);
      GL.bufferData(GL.ARRAY_BUFFER, dataset.points, GL.STATIC_DRAW);

      GL.bindBuffer(GL.ARRAY_BUFFER, dataset.colorBuffer);
      GL.bufferData(GL.ARRAY_BUFFER, dataset.color, GL.STATIC_DRAW);
    }
    var end = performance.now();

    res.load = end - start;


    GL.clearColor(0.0, 0.0, 0.0, 0.0);
    GL.viewport(0.0, 0.0, canvas.width, canvas.height);

    GL.uniform1f(GL.getUniformLocation(program, "ps"), args.pointSize);

    timings = {
      time: 0,
      count: 0
    };

    var wallTimeStart = performance.now();

    function renderFrame() {

      var start = performance.now();

      GL.clear(GL.COLOR_BUFFER_BIT);
      for (var i = 0; i < args.datasets; i++) {
        var dataset = datasets[i];

        GL.bindBuffer(GL.ARRAY_BUFFER, dataset.pointBuffer);
        GL.enableVertexAttribArray(_position);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 0, 0);
        GL.bindBuffer(GL.ARRAY_BUFFER, dataset.colorBuffer);
        GL.enableVertexAttribArray(_color);
        GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 0, 0);
        GL.drawArrays(GL.POINTS, 0, args.pointsPerDataset);
      }
      GL.flush();

      var end = performance.now();

      var duration = end - start;
      if (timings.min == undefined || timings.min > duration) timings.min = duration;
      if (timings.max == undefined || timings.max < duration) timings.max = duration;
      timings.time += duration;
      timings.count++;
      timings.avg = timings.time / timings.count;

      if (timings.count >= args.frames) {
        var wallTimeEnd = performance.now();
        timings.wallTime = wallTimeEnd - wallTimeStart;
        timings.fps = 1000 * timings.count / timings.wallTime;
        res.draw = timings;
        done();
      } else {
        window.requestAnimationFrame(renderFrame, canvas);
      }
    }

    renderFrame();
  };

  testgl.withDocReady(function () {
    args = $.extend(testgl.argsDefault, args);

    performGlTest(args, function (res) {
      if (res.draw && res.draw.fps < args.minFps) {
        res.errors.push("You're graphics card is too slow.");
      }
      console.log(res);

      cb(res);
    });
  });
};

testgl.testGlWidget = function(args) {
  testgl.withDocReady(function () {
    $(args.result).html("<h1>Testing your browser...</h1>");
    testgl.testGl(args, function (res) {
      if (res.errors.length == 0) {
        $(args.result).html("<h1 style='color:#00ff00'>Congratulations: Your browser supports WebGL</h1>");
      } else {
        $(args.result).html("<h1 style='color:#ff0000'>Unfourtunately, your browser does not support our animation:</h1><div>" + res.errors.join("</div><div>") + "</div>");
      }
    });
  });
}
