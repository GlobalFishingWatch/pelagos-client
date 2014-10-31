

function testGl(args, cb) {
  if (!args.pointsPerDataset) args.pointsPerDataset = 1000000;
  if (!args.datasets) args.datasets = 1;
  if (!args.frames) args.frames = 100;


  var shader_vertex_source = [
    'attribute vec2 position;',
    'attribute vec3 color;',
    '',
    'varying vec3 vColor;',
    '',
    'void main(void) {',
    '  gl_Position = vec4(position, 0., 1.);',
    '  gl_PointSize = 10.0;',
    '  vColor=color;',
    '}'
  ].join("\n");

  var shader_fragment_source = [
    'precision mediump float;',
    '',
    'varying vec3 vColor;',
    '',
    'void main(void) {',
    '  gl_FragColor = vec4(vColor, 1.);',
    '}'
  ].join("\n");

  function performGlTest(args, cb) {
    var res = {errors: []};

    var canvas = $("<canvas style='position: absolute; background-color: black;'></canvas>");
    $("body").append(canvas);

    canvas = canvas[0];
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;

    try {
      var GL = canvas.getContext("experimental-webgl", {antialias: true});
    } catch (e) {
      res.errors.push("Unable to enable context experimental-webgl");
      cb(res); return;
    } ;

    function get_shader_program(GL) {
      var get_shader=function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
          res.errors.push("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
          cb(res); return;
        }
        return shader;
      };

      var shader_vertex=get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
      var shader_fragment=get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
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
        dataset.points[j*2] = Math.random()-0.5;
        dataset.points[j*2 + 1] = Math.random()-0.5;
        dataset.color[j*3] = Math.random();
        dataset.color[j*3+1] = Math.random();
        dataset.color[j*3+2] = Math.random();
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

    timings = {
      time: 0,
      count: 0
    };

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
        res.draw = timings;
        cb(res);
      } else {
        window.requestAnimationFrame(renderFrame, canvas);
      }
    }

    renderFrame();
  };




  var performGlTestOnPageLoad = function () {
    $(document).ready(function() {
      performGlTest(args, function (res) {
        console.log(res);

        cb(res);
      });
    });
  }

  if (typeof($) == "undefined") {
    var addHeadScript = function(script, cb) {
      if (typeof(script) == "string") script = {url: script};
      var head = document.getElementsByTagName('head')[0];
      var tag = document.createElement('script');
      tag.type = script.type || 'text/javascript';
      tag.src = script.url;
      tag.onload = cb;
      head.appendChild(tag);
    }

    addHeadScript("http://code.jquery.com/jquery-1.11.0.min.js", function () {
      addHeadScript("http://code.jquery.com/jquery-migrate-1.2.1.min.js", function () {
        performGlTestOnPageLoad();
      });
    });
  } else {
    performGlTestOnPageLoad();
  }
}

function testGlWidget(args) {
  testGl(args, function (res) {
    if (res.errors.length == 0) {
      $(args.result).html("<h1 style='color:#00ff00'>Congratulations: Your browser supports WebGL</h1>");
    } else {
      $(args.result).html("<h1 style='color:#ff0000'>Unfourtunately, your browser does not support our animation:</h1><div>" + res.errors.join("</div><div>") + "</div>");
    }
  });
}
