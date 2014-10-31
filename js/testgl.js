datasetsnr = 1;
datasetpointsnr = 1000000;

function addHeadScript(script, cb) {
  if (typeof(script) == "string") script = {url: script};
  var head = document.getElementsByTagName('head')[0];
  var tag = document.createElement('script');
  tag.type = script.type || 'text/javascript';
  tag.src = script.url;
  tag.onload = cb;
  head.appendChild(tag);
}

shader_vertex_source = [
  'attribute vec2 position;',
  'attribute vec3 color;',
  '',
  'varying vec3 vColor;',
  '',
  'void main(void) {',
  '  gl_Position = vec4(position, 0., 1.);',
  '  gl_PointSize = 20.0;',
  '  vColor=color;',
  '}'
].join("\n");

shader_fragment_source = [
  'precision mediump float;',
  '',
  'varying vec3 vColor;',
  '',
  'void main(void) {',
  '  gl_FragColor = vec4(vColor, 1.);',
  '}'
].join("\n");


addHeadScript("http://code.jquery.com/jquery-1.11.0.min.js", function () {
  addHeadScript("http://code.jquery.com/jquery-migrate-1.2.1.min.js", function () {
 

    $(document).ready(function() {
      $("body").append("<canvas id='your_canvas' style='position: absolute; background-color: black;'></canvas>");
      $("body").append("<div class='test' style='position: absolute; bottom: 0; right: 0; background: red;'></div>");

      var CANVAS=$("#your_canvas")[0];
      CANVAS.width=window.innerWidth;
      CANVAS.height=window.innerHeight;

      var c = 0;
      setInterval(function () {
        c++;
        $(".test").html(c.toString());
      }, 100);

      try {
        var GL = CANVAS.getContext("experimental-webgl", {antialias: true});
      } catch (e) {
        alert("You are not webgl compatible :(") ;
        return false;
      } ;

      function get_shader_program(GL) {
        var get_shader=function(source, type, typeString) {
          var shader = GL.createShader(type);
          GL.shaderSource(shader, source);
          GL.compileShader(shader);
          if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
            return false;
          }
          return shader;
        };

        var shader_vertex=get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
        var shader_fragment=get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

        var SHADER_PROGRAM=GL.createProgram();
        GL.attachShader(SHADER_PROGRAM, shader_vertex);
        GL.attachShader(SHADER_PROGRAM, shader_fragment);

        GL.linkProgram(SHADER_PROGRAM);

        return SHADER_PROGRAM;
      }

      var SHADER_PROGRAM = get_shader_program(GL);
      var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
      var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");

      GL.enableVertexAttribArray(_color);
      GL.enableVertexAttribArray(_position);

      GL.useProgram(SHADER_PROGRAM);

      var datasets = [];

      for (var i = 0; i < datasetsnr; i++) {
        var dataset = {};
        datasets.push(dataset);

        dataset.points = new Float32Array(2 * datasetpointsnr);
        dataset.color = new Float32Array(3 * datasetpointsnr);
        for (var j = 0; j < datasetpointsnr; j++) {
          dataset.points[j*2] = Math.random()-0.5;
          dataset.points[j*2 + 1] = Math.random()-0.5;
          dataset.color[j*3] = Math.random();
          dataset.color[j*3+1] = Math.random();
          dataset.color[j*3+2] = Math.random();
        }
      }

      var start = performance.now();
      for (var i = 0; i < datasetsnr; i++) {
        dataset = datasets[i];

        dataset.pointBuffer= GL.createBuffer();
        dataset.colorBuffer= GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, dataset.pointBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, dataset.points, GL.STATIC_DRAW);

        GL.bindBuffer(GL.ARRAY_BUFFER, dataset.colorBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, dataset.color, GL.STATIC_DRAW);
      }
      var end = performance.now();

      console.log("Load time for " + datasetsnr + " arrays of " + datasetpointsnr + " points = " + (end - start));



      GL.clearColor(0.0, 0.0, 0.0, 0.0);
      GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);

      timings = {
        time: 0,
        count: 0
      };

      function renderFrame() {

        var start = performance.now();

        GL.clear(GL.COLOR_BUFFER_BIT);
        for (var i = 0; i < datasetsnr; i++) {
          var dataset = datasets[i];

          GL.bindBuffer(GL.ARRAY_BUFFER, dataset.pointBuffer);
          GL.enableVertexAttribArray(_position);
          GL.vertexAttribPointer(_position, 2, GL.FLOAT, false, 0, 0);
          GL.bindBuffer(GL.ARRAY_BUFFER, dataset.colorBuffer);
          GL.enableVertexAttribArray(_color);
          GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 0, 0);

          GL.drawArrays(GL.POINTS, 0, datasetpointsnr);
        }
        GL.flush();

        var end = performance.now();

        timings.time += end - start;
        timings.count++;

        if (timings.count % 100 == 0) {
          console.log("Avg. JS draw time: " + (timings.time / timings.count));
        }

        window.requestAnimationFrame(renderFrame, CANVAS);
      }

      renderFrame();
    });



  });
});
