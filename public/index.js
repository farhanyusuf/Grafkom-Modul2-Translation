"use strict";

function main(idcanvas) {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#"+idcanvas);
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");

  // lookup uniforms
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var translationLocation = gl.getUniformLocation(program, "u_translation");

  // Create a buffer to put positions in
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put geometry data into buffer

  if (idcanvas == "canvas2"){
    setGeometry(gl);
  }
  
  var translation = [0, 0];
  if (idcanvas == "canvas1"){
    var width = 100;
    var height = 30;
  }
  var color = [Math.random(), Math.random(), Math.random(), 1];

  drawScene(idcanvas);

  // Setup a ui.
  setupSlider("#x"+idcanvas, {slide: updatePosition(0), max: gl.canvas.width });
  setupSlider("#y"+idcanvas, {slide: updatePosition(1), max: gl.canvas.height});

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene(idcanvas);
    };
  }

  // Draw a the scene.
  function drawScene(idcanvas) {
    resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Setup a rectangle
    if (idcanvas == "canvas1"){
      setRectangle(gl, translation[0], translation[1], width, height);
    }
    
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // set the color
    gl.uniform4fv(colorLocation, color);

    // Set the translation.
    if (idcanvas == "canvas2"){
      gl.uniform2fv(translationLocation, translation);
    }
    
    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    if (idcanvas == "canvas1"){
      var count = 6;
    }
    else{
      var count = 18;
    }
    
    gl.drawArrays(primitiveType, offset, count);
  }
}

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          x1, y1,
          x2, y1,
          x1, y2,
          x1, y2,
          x2, y1,
          x2, y2,
      ]),
      gl.STATIC_DRAW);
}

function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,
 
          // top rung
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,
 
          // middle rung
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
      ]),
      gl.STATIC_DRAW);
}

//----------------------------------------------------------------------------------------
//UTILITY CODE

//Creates and compiles a shader.
 function compileShader(gl, shaderSource, shaderType) {
  // Create the shader object
  var shader = gl.createShader(shaderType);
 
  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);
 
  // Compile the shader
  gl.compileShader(shader);
 
  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }
 
  return shader;
}

//Creates a program from 2 shaders
function createProgram(gl, vertexShader, fragmentShader) {
// create a program.
var program = gl.createProgram();

// attach the shaders.
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

// link the program.
gl.linkProgram(program);

// Check if it linked.
var success = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!success) {
    // something went wrong with the link
    throw ("program failed to link:" + gl.getProgramInfoLog (program));
}

return program;
};

//Creates a shader from the content of a script tag.
function createShaderFromScript(gl, scriptId, opt_shaderType) {
  // look up the script tag by id.
  var shaderScript = document.getElementById(scriptId);
  if (!shaderScript) {
    throw("*** Error: unknown script element" + scriptId);
  }
 
  // extract the contents of the script tag.
  var shaderSource = shaderScript.text;
 
  // If we didn't pass in a type, use the 'type' from
  // the script tag.
  if (!opt_shaderType) {
    if (shaderScript.type == "x-shader/x-vertex") {
      opt_shaderType = gl.VERTEX_SHADER;
    } else if (shaderScript.type == "x-shader/x-fragment") {
      opt_shaderType = gl.FRAGMENT_SHADER;
    } else if (!opt_shaderType) {
      throw("*** Error: shader type not set");
    }
  }
 
  return compileShader(gl, shaderSource, opt_shaderType);
};

//Creates a program from 2 script tags.
function createProgramFromScripts(
  gl, shaderScriptIds) {
var vertexShader = createShaderFromScript(gl, shaderScriptIds[0], gl.VERTEX_SHADER);
var fragmentShader = createShaderFromScript(gl, shaderScriptIds[1], gl.FRAGMENT_SHADER);
return createProgram(gl, vertexShader, fragmentShader);
};

function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
 
  // Check if the canvas is not the same size.
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;
 
  if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }
 
  return needResize;
};

const gopt = getQueryParams();

function setupSlider(selector, options) {
  var parent = document.querySelector(selector);
  if (!parent) {
    // like jquery don't fail on a bad selector
    return;
  }
  if (!options.name) {
    options.name = selector.substring(1);
  }
  return createSlider(parent, options); // eslint-disable-line
};

function createSlider(parent, options) {
  var precision = options.precision || 0;
  var min = options.min || 0;
  var step = options.step || 1;
  var value = options.value || 0;
  var max = options.max || 1;
  var fn = options.slide;
  var name = gopt["ui-" + options.name] || options.name;
  var uiPrecision = options.uiPrecision === undefined ? precision : options.uiPrecision;
  var uiMult = options.uiMult || 1;

  min /= step;
  max /= step;
  value /= step;

  parent.innerHTML = `
    <div class="gman-widget-outer">
      <div class="gman-widget-label">${name}</div>
      <div class="gman-widget-value"></div>
      <input class="gman-widget-slider" type="range" min="${min}" max="${max}" value="${value}" />
    </div>
  `;
  var valueElem = parent.querySelector(".gman-widget-value");
  var sliderElem = parent.querySelector(".gman-widget-slider");

  function updateValue(value) {
    valueElem.textContent = (value * step * uiMult).toFixed(uiPrecision);
  }

  updateValue(value);

  function handleChange(event) {
    var value = parseInt(event.target.value);
    updateValue(value);
    fn(event, { value: value * step });
  }

  sliderElem.addEventListener('input', handleChange);
  sliderElem.addEventListener('change', handleChange);

  return {
    elem: parent,
    updateValue: (v) => {
      v /= step;
      sliderElem.value = v;
      updateValue(v);
    },
  };
}

function makeSlider(options) {
  const div = document.createElement("div");
  return createSlider(div, options);
}

var widgetId = 0;
function getWidgetId() {
  return "__widget_" + widgetId++;
}

function makeCheckbox(options) {
  const div = document.createElement("div");
  div.className = "gman-widget-outer";
  const label = document.createElement("label");
  const id = getWidgetId();
  label.setAttribute('for', id);
  label.textContent = gopt["ui-" + options.name] || options.name;
  label.className = "gman-checkbox-label";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = options.value;
  input.id = id;
  input.className = "gman-widget-checkbox";
  div.appendChild(label);
  div.appendChild(input);
  input.addEventListener('change', function(e) {
     options.change(e, {
       value: e.target.checked,
     });
  });

  return {
    elem: div,
    updateValue: function(v) {
      input.checked = !!v;
    },
  };
}

function makeOption(options) {
  const div = document.createElement("div");
  div.className = "gman-widget-outer";
  const label = document.createElement("label");
  const id = getWidgetId();
  label.setAttribute('for', id);
  label.textContent = gopt["ui-" + options.name] || options.name;
  label.className = "gman-widget-label";
  const selectElem = document.createElement("select");
  options.options.forEach((name, ndx) => {
    const opt = document.createElement("option");
    opt.textContent = gopt["ui-" + name] || name;
    opt.value = ndx;
    opt.selected = ndx === options.value;
    selectElem.appendChild(opt);
  });
  selectElem.className = "gman-widget-select";
  div.appendChild(label);
  div.appendChild(selectElem);
  selectElem.addEventListener('change', function(e) {
     options.change(e, {
       value: selectElem.selectedIndex,
     });
  });

  return {
    elem: div,
    updateValue: function(v) {
      selectElem.selectedIndex = v;
    },
  };
}

function noop() {
}

function genSlider(object, ui) {
  const changeFn = ui.change || noop;
  ui.name = ui.name || ui.key;
  ui.value = object[ui.key];
  ui.slide = ui.slide || function(event, uiInfo) {
    object[ui.key] = uiInfo.value;
    changeFn();
  };
  return makeSlider(ui);
}

function genCheckbox(object, ui) {
  const changeFn = ui.change || noop;
  ui.value = object[ui.key];
  ui.name = ui.name || ui.key;
  ui.change = function(event, uiInfo) {
    object[ui.key] = uiInfo.value;
    changeFn();
  };
  return makeCheckbox(ui);
}

function genOption(object, ui) {
  const changeFn = ui.change || noop;
  ui.value = object[ui.key];
  ui.name = ui.name || ui.key;
  ui.change = function(event, uiInfo) {
    object[ui.key] = uiInfo.value;
    changeFn();
  };
  return makeOption(ui);
}

const uiFuncs = {
  slider: genSlider,
  checkbox: genCheckbox,
  option: genOption,
};

function setupUI(parent, object, uiInfos) {
  const widgets = {};
  uiInfos.forEach(function(ui) {
    const widget = uiFuncs[ui.type](object, ui);
    parent.appendChild(widget.elem);
    widgets[ui.key] = widget;
  });
  return widgets;
}

function updateUI(widgets, data) {
  Object.keys(widgets).forEach(key => {
    const widget = widgets[key];
    widget.updateValue(data[key]);
  });
}

function getQueryParams() {
  var params = {};
  if (window.hackedParams) {
    Object.keys(window.hackedParams).forEach(function(key) {
      params[key] = window.hackedParams[key];
    });
  }
  if (window.location.search) {
    window.location.search.substring(1).split("&").forEach(function(pair) {
      var keyValue = pair.split("=").map(function(kv) {
        return decodeURIComponent(kv);
      });
      params[keyValue[0]] = keyValue[1];
    });
  }
  return params;
}

main("canvas1");
main("canvas2");
