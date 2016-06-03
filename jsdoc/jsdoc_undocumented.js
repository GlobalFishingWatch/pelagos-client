'use strict';

var jsdoc = {
    env: require('jsdoc/lib/jsdoc/env')
};
var path = require('jsdoc/lib/jsdoc/path');

function getSourcePaths() {
    var sourcePaths = jsdoc.env.sourceFiles.slice(0) || [];

    if (jsdoc.env.opts._) {
        jsdoc.env.opts._.forEach(function(sourcePath) {
            var resolved = path.resolve(jsdoc.env.pwd, sourcePath);
            if (sourcePaths.indexOf(resolved) === -1) {
                sourcePaths.push(resolved);
            }
        });
    }

    return sourcePaths;
}

function filepathMinusPrefix(filepath) {
    var sourcePaths = getSourcePaths();
    var commonPrefix = path.commonPrefix(sourcePaths);
    var result = '';

    if (filepath) {
        filepath = path.normalize(filepath);
        // always use forward slashes in the result
        result = (filepath + path.sep).replace(commonPrefix, '')
            .replace(/\\/g, '/');
    }

    if (result.length > 0 && result[result.length - 1] !== '/') {
        result += '/';
    }

    return result;
}


function addComment(node, comment) {
  if (!node.leadingComments) node.leadingComments = [];
  if (node.leadingComments.length < 1) {
    node.leadingComments.push({
      "type": "Block",
      "value": "",
      "raw": "",
      "range": node.range,
      "loc": node.loc
    });
  }

  var old = node.leadingComments[node.leadingComments.length - 1].raw.replace("*/", "");
  node.leadingComments[node.leadingComments.length - 1].raw = old + "\n* " + comment + " */";
}

function registerClassDeclarations(parser, node) {
  if (!node.leadingComments || !node.leadingComments.length) return;
  if (!parser.jsdoc_undocumented_registered_classes) parser.jsdoc_undocumented_registered_classes = {};
  node.leadingComments.map(function (cmt) {
    var matches = cmt.raw.match(/@class [^ \n*]*[ \n*]/g);
    if (matches) {
      matches.map(function (dcl) {
        return dcl.match(/@class ([^ \n*]*)[ \n*]/)[1];
      }).map(function (clsname) {
        parser.jsdoc_undocumented_registered_classes[clsname] = true;
      });
    }
  });
}

function isClassRegistered(parser, clsname) {
  return parser.jsdoc_undocumented_registered_classes[clsname];
}

exports.astNodeVisitor = {
    visitNode: function(node, e, parser, currentSourceName) {
      registerClassDeclarations(parser, node);

      var localName = filepathMinusPrefix(currentSourceName);
      localName = localName.substr(0, localName.length -1);

      if (node.type == 'CallExpression') {
        if (node.callee && node.callee.type == "Identifier") {
          if (false && node.callee.name == "define") {
            var module = localName.substr(0, localName.length - 3); // .replace(/\//g, '.');

            e.filename = currentSourceName;
            e.range = node.range;
            e.lineno =  node.loc.start.line;
            e.comment = '/** @module ' + module + ' */';
            e.event = 'jsdocCommentFound'; 

          } else if (node.callee.name == "Class") {
            var clsname = localName.substr(0, localName.length - 3); //.replace(/\//g, '.');
            var parents = [];
            var members = {};
            if (node.arguments.length == 1) {
              members = node.arguments[0];
            } else if (node.arguments.length == 2) {
              parents = node.arguments[0];
              members = node.arguments[1];
            }

            if (members && members.type == "ObjectExpression") {
              var names = members.properties.filter(function (property) { return property.key.name == 'name'; });
              if (names[0]) {
                var last_name = clsname.substr(clsname.lastIndexOf("/") + 1);
                if (names[0].value.value != last_name) {
                  clsname = clsname + ":" + names[0].value.value;
                }
              }

              addComment(members, "@lends " + clsname + ".prototype");

              members.properties.map(function (property) {
                if (!property.leadingComments) {
                  addComment(property, '');
                }
              });
            }

            if (!isClassRegistered(parser, clsname)) {
              if (!e.comment) e.comment = "";
              e.filename = currentSourceName;
              e.range = node.range;
              e.lineno =  node.loc.start.line;
              e.comment += '/** @class ' + clsname + ' */';
              e.event = 'jsdocCommentFound'; 
            }
          }
        }
      }
      if(e.comment==="@undocumented"){
          e.comment = '/** */';
      }
    }
};
