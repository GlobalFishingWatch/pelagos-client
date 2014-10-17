define(["app/Class", "async", "jQuery", "app/Data/Ajax"], function(Class, async, $, Ajax) {
  var Shader = Class({name: "Shader"});

  var range = function(lower, upper, fn) {
    res = [];
    for (var i = lower; i < upper; i++) {
      res.push(fn(i));
    }
    return res;
  }

  /* Load array data into gl buffers and bind that buffer to a shader
   * program attribute */
  Shader.programLoadArray = function(gl, glbuffer, arraydata, program) {
    gl.bindBuffer(gl.ARRAY_BUFFER, glbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, arraydata, gl.STATIC_DRAW);
  };

  Shader.programBindArray = function(gl, glbuffer, program, attrname, size, type, stride, offset) {
    if (program.attributes[attrname] == undefined) {
      console.warn(["Attempted to set an non-existent attribute " + attrname + ".", program]);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, glbuffer);
      gl.enableVertexAttribArray(program.attributes[attrname]);
      gl.vertexAttribPointer(program.attributes[attrname], size, type, false, stride || 0, offset || 0);
    }
  };

  Shader.preprocess = function(src, context, cb) {
    // FIXME: Async + $.get(require.toUrl()) stuff

    async.map(src.split("\n"), function (line, cb) {
      if (line.indexOf('#pragma include') == -1) return cb(null, line);

      var key = line.match(/#pragma include '(.*)';/)[1];
      if (context[key] != undefined) return cb(null, context[key]);

      var url = require.toUrl(key);
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onreadystatechange = function() {
        if (request.readyState === 4) {
          if (Ajax.isSuccess(request, url)) {
            cb(null, request.responseText);
          } else {
            var e = Ajax.makeError(request, url, "shader include from ");
            e.source = self;
            cb(e, null);
          }
        }
      };
      request.send(null);
    }, function (err, results) {
      cb(results.join('\n'));
    });
  };

  Shader.createShaderProgramFromUrl = function(gl, vertexShaderUrl, fragmentShaderUrl, context, cb) {
    var vertexSrc;
    var fragmentSrc;
    async.series([
      function (cb) { $.get(vertexShaderUrl, function (data) { Shader.preprocess(data, context, function (data) { vertexSrc = data; cb(); }); }, "text"); },
      function (cb) { $.get(fragmentShaderUrl, function (data) { Shader.preprocess(data, context, function (data) { fragmentSrc = data; cb(); }); }, "text"); },
        function (dummy) { cb(Shader.createShaderProgramFromSource(gl, vertexSrc, fragmentSrc, context.attr0)); }
    ]);
  }

  Shader.formatError = function(log, src) {
    var match = log.match(/ERROR: [0-9]*:([0-9]*): (.*)/);
    var line = parseInt(match[1]);
    var msg = match[2];

    var lines = src.split('\n');
    return [].concat(
      lines.slice(0, line),
      ['/********************************',
       ' * ',
       ' * ' + msg,
       ' * ',
       ' ********************************/',
       ''],
      lines.slice(line)
    ).join('\n');
  };

  Shader.createShaderProgramFromSource = function(gl, vertexSrc, fragmentSrc, attr0) {
    // create vertex shader
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSrc);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      var err = Shader.formatError(gl.getShaderInfoLog(vertexShader), vertexSrc);
      console.error(err);
      throw err;
    }

    // create fragment shader
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSrc);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      var err = Shader.formatError(gl.getShaderInfoLog(fragmentShader), fragmentSrc);
      console.error(err);
      throw err;
    }

    // link shaders to create our program
    var program = gl.createProgram();
    program.gl = gl;
    program.vertexSrc = vertexSrc;
    program.fragmentSrc = fragmentSrc;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.bindAttribLocation(program, 0, attr0);

    gl.linkProgram(program);

    gl.useProgram(program);

    // Collect attribute locations to make binding easier in the code using this program
    program.attributes = {};
    for (var i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); i++) {
      var name = gl.getActiveAttrib(program, i).name;
      program.attributes[name] = gl.getAttribLocation(program, name);
    }

    program.uniforms = {};
    for (var i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
      var name = gl.getActiveUniform(program, i).name;
      program.uniforms[name] = gl.getUniformLocation(program, name);
    }

    return program;
  };

  Shader.compileMapping = function(dataView) {
    var selectionsMappingDec = Shader.compileSelectionsMappingDeclarations(dataView);
    var selectionsDec = Shader.compileSelectionsDeclarations(dataView);
    var selectionsMapper = Shader.compileSelectionsMapper(dataView);

    var srcCols = Object.keys(dataView.source.header.colsByName);
    var dstCols = Object.keys(dataView.header.colsByName);
    var selCols = Object.keys(dataView.selections);

    var sourceMapper = Shader.compileSourceMapper(dataView.source.header.colsByName);

    var srcDec = Shader.compileSrcDeclarations(srcCols);
    var scaledSrcDec = Shader.compileScaledSrcDeclarations(srcCols);
    var dstDec = Shader.compileDstDeclarations(dstCols);
    var columnMappingDec = Shader.compileColumnMappingDeclarations(srcCols.concat(selCols), dstCols);
    var columnMapper = Shader.compileColumnMapper(srcCols.concat(selCols), dstCols);

    var mapper =
      'void mapper() {\n' +
      '  selectionmapper();\n' +
      '  sourcemapper();\n' +
      '  attrmapper();\n' +
      '}\n';

    return [
      selectionsMappingDec,
      selectionsDec,
      srcDec,
      scaledSrcDec,
      dstDec,
      columnMappingDec,
      selectionsMapper,
      sourceMapper,
      columnMapper,
      mapper].join("\n");
  };

  Shader.compileSelectionsDeclarations = function (dataView) {
    return Object.items(dataView.selections).map(function (item) {
      return 'float scaled_' + item.key + ';';
    }).join('\n') + '\n';
  };

  Shader.compileSelectionsMappingDeclarations = function (dataView) {
    return Object.items(dataView.selections).map(function (item) {
      return range(0, item.value.max_range_count, function (rangeidx) {
        return item.value.sortcols.filter(function (sortcol) {
          return dataView.source.header.colsByName[sortcol] != undefined;
        }).map(function (sortcol) {
          return (
            'uniform float selectionmap_' + item.key + '_from_' + sortcol + '_' + rangeidx + '_lower;\n' +
            'uniform float selectionmap_' + item.key + '_from_' + sortcol + '_' + rangeidx + '_upper;');
        }).join('\n');
      }).join('\n');
    }).join('\n') + '\n';
  };

  Shader.compileSelectionsMapper = function (dataView) {
    return 'void selectionmapper() {\n' +
      Object.items(dataView.selections).map(function (item) {
        var cols = item.value.sortcols.filter(function (col) {
          return dataView.source.header.colsByName[col] != undefined;
        });
        var res = '  scaled_' + item.key + ' = ';
        if (cols.length == 0) {
          res += '1.0;';
        } else {
          res += '(\n' +
            range(0, item.value.max_range_count, function (rangeidx) {
              return "    (\n" + cols.map(function (sortcol) {
                  return '      selectionmap_' + item.key + '_from_' + sortcol + '_' + rangeidx + '_lower <= ' + sortcol + ' &&\n' +
                         '      selectionmap_' + item.key + '_from_' + sortcol + '_' + rangeidx + '_upper >= ' + sortcol;
              }).join(' &&\n') + ")"
            }).join(' ||\n') + ') ? 1.0 : 0.0;';
        }
        return res;
      }).join('\n') +
      '\n}\n';
  };

  Shader.compileSourceMapper = function(srcColumns) {
    function formatFloat(x) {
      var res = x.toString();
      if (res.indexOf('.') == -1) {
        res += '.0';
      }
      return res;
    }

    return 'void sourcemapper() {\n' +
      Object.items(srcColumns).map(function (item) {
        var res = item.key;
        if (item.value.multiplier != undefined) {
          res = '(' + res + ' * ' + formatFloat(item.value.multiplier) + ')';
        }
        if (item.value.offset != undefined) {
          res = res + ' + ' + formatFloat(item.value.offset);
        }
        return '  scaled_' + item.key + ' = ' + res + ';';
      }).join('\n') +
      '\n}\n';
  };

  Shader.compileSrcDeclarations = function(srcColumns) {
    return srcColumns.map(function (srcName) {
      return 'attribute float ' + srcName + ';'
    }).join('\n') + '\n';
  };

  Shader.compileScaledSrcDeclarations = function(srcColumns) {
    return srcColumns.map(function (srcName) {
      return 'float scaled_' + srcName + ';'
    }).join('\n') + '\n';
  };

  Shader.compileDstDeclarations = function(dstColumns) {
    return dstColumns.map(function (dstName) {
      return 'float _' + dstName + ';'
    }).join('\n') + '\n';
  };

  Shader.compileColumnMappingDeclarations = function(srcColumns, dstColumns) {
    return dstColumns.map(function (dstName) {
      return 'uniform float attrmap_' + dstName + '_from_const;' +
        srcColumns.map(function (srcName) {
          return 'uniform float attrmap_' + dstName + '_from_' + srcName + ';'
        }).join('\n');
    }).join('\n') + '\n';
  };

  Shader.compileColumnMapper = function(srcColumns, dstColumns) {
    return 'void attrmapper() {\n' +
      dstColumns.map(function (dstName) {
        return '  _' + dstName + ' = ' +
          ['attrmap_' + dstName + '_from_const'].concat(
            srcColumns.map(function (srcName) {
              return '    attrmap_' + dstName + '_from_' + srcName + ' * scaled_' + srcName
            })).join(' +\n') + ';';
      }).join('\n') +
      '\n}\n';
  };

  Shader.setMappingUniforms = function (program, dataView) {
    Object.items(dataView.header.colsByName).map(function (column) {
      Object.items(column.value.source).map(function (source) {
        var srcKey = source.key;
        var value = source.value;
        if (srcKey == '_') {
          srcKey = 'const';
          if (value == null) {
            value = Object.keys(column.value.source).length - 1;
          }
        }
        program.gl.uniform1f(program.uniforms['attrmap_' + column.key + '_from_' + srcKey], value);
      });
    });
    Object.items(dataView.selections).map(function (item) {
      item.value.sortcols.map(function (sortcol) {
        for (var rangeidx = 0; rangeidx < item.value.max_range_count; rangeidx++) {
          var lower = undefined;
          var upper = undefined;
          if (item.value.data[sortcol].length >= 2 * rangeidx) {
            lower = item.value.data[sortcol][rangeidx * 2];
            upper = item.value.data[sortcol][rangeidx * 2 + 1];
          }
          program.gl.uniform1f(program.uniforms['selectionmap_' + item.key + '_from_' + sortcol + '_' + rangeidx + '_lower'], lower);
          program.gl.uniform1f(program.uniforms['selectionmap_' + item.key + '_from_' + sortcol + '_' + rangeidx + '_upper'], upper);
        };
      });
    });
  }

  return Shader;
});
