(function () {
  var controls = document.getElementById("noise-controls");
  var pointsCanvas = document.getElementById("noise-points");
  var fieldCanvas = document.getElementById("noise-field");
  var scaleCanvas = document.getElementById("noise-scale");
  var turbulenceCanvas = document.getElementById("noise-turbulence");
  if (!controls || !pointsCanvas || !fieldCanvas || !scaleCanvas || !turbulenceCanvas) return;

  var noiseTypes = [["0", "0 Perlin"], ["1", "1 Caustic"], ["2", "2 Voronoi"], ["3", "3 Brownian"], ["4", "4 edge"]];
  var groups = [
    {
      label: "Scatter Mode Settings",
      fields: [
        { id: "gx", label: "Grid Size X", min: 10, max: 400, step: 1, value: 100, tip: "Full width of the planting area, in centimeters. The patch stays centered on the origin, so each side sits at half this distance." },
        { id: "gy", label: "Grid Size Y", min: 10, max: 400, step: 1, value: 100, tip: "Full depth of the planting area, in centimeters. In the editor, Grid Size Z does not move these points. They stay on the ground." },
        { id: "scatter", label: "Scatter Grid Size", min: 0.1, max: 4, step: 0.1, value: 2, tip: "Multiplies both side lengths. 1 leaves Grid Size as it is. 2 doubles the sides and the gap between candidate spots." },
        { id: "resolution", label: "Resolution", min: 2, max: 48, step: 1, value: 32, tip: "How many candidate spots fit along each side. The gap is (Grid Size × Scatter Grid Size) ÷ Resolution. Num Points still decides how many of those spots are kept." },
        { id: "shape", label: "Shape Type", select: [["0", "0 rectangle"], ["1", "1 circle"]], value: "1", tip: "0 keeps the rectangle. 1 drops the corners and keeps a circle. The radius is half of the shorter side." },
        { id: "num", label: "Num Points", min: 1, max: 80, step: 1, value: 20, tip: "How many starting points to keep. With Density Noise Effect above 0, the highest scores stay. At 0 the editor draws a random set instead, so the markers on this page stay off." }
      ]
    },
    {
      label: "Density",
      fields: [
        { id: "border", label: "Density Border Reduction", min: 0, max: 1, step: 0.01, value: 0, tip: "Multiplies the score by a weight that stays high in the middle and drops toward the rim. 0 leaves every spot equal. Raising it presses the rim down. The falloff uses distance ÷ 100 cm, and that 100 does not follow Grid Size. At Effect 0 the editor still picks at random, but this weight is already on the spots, so a new random draw can land somewhere else." },
        { id: "effect", label: "Density Noise Effect", min: 0, max: 1, step: 0.01, value: 0.04, tip: "0 picks at random in the editor. Above 0, the highest scores are kept, up to Num Points. The same slider mixes a flat value with the pattern: just above 0 the pattern barely tilts the order, and at 1 the scores follow it. With Border at 0, anything above 0 already ranks spots in pattern order, so dragging further does not change which spots win." }
      ]
    },
    {
      label: "Density Noise",
      fields: [
        { id: "type", label: "Type", select: noiseTypes, value: "0", tip: "0 Perlin is smooth clouds. 1 Caustic is swirling ridges. 2 Voronoi is cells with hard borders, and it ignores Turbulance. 3 fractional Brownian stacks broad Perlin with finer layers. 4 fades toward the edge of the area." },
        { id: "frequency", label: "Frequency", min: 0.1, max: 12, step: 0.1, value: 5, tip: "Size of the pattern’s features. Lower values make broad regions. Higher values pack smaller changes into the same patch. This does not set how many plants you get." },
        { id: "offset", label: "Offset", min: -4, max: 4, step: 0.05, value: 0, tip: "Slides the pattern across the patch. 0 lines up with the editor. A nonzero Offset there is also scaled by a hidden seed, so the blobs will not land in the same place." },
        { id: "amplitude", label: "Amplitude", min: 0, max: 4, step: 0.05, value: 1, tip: "Contrast between high and low parts of the pattern. A stronger contrast does not always change the chosen spots: if the score order stays the same, the same highest spots still win." },
        { id: "turbulance", label: "Turbulance", min: 1, max: 8, step: 1, value: 2, tip: "Adds layers of smaller detail. The editor spells it Turbulance. Voronoi, Type 2, ignores this slider." }
      ]
    },
    {
      label: "Scale",
      fields: [
        { id: "pointScale", label: "Point Scale", min: 0, max: 4, step: 0.05, value: 1, tip: "Multiplies the size value stored on each point. Grower can turn that into a larger or smaller plant, depending on Seed Scale Effect. It does not move the point. Marker size on the canvases uses this value." },
        { id: "scaleBorder", label: "Scale Border Reduction", min: 0, max: 1, step: 0.01, value: 0, tip: "Shrinks size values near the edge of the patch. It does not move the points, and it does not change which spots were selected." },
        { id: "nose", label: "Scale Nose Effect", min: 0, max: 1, step: 0.01, value: 0, tip: "How much the size pattern changes those values. The editor spells this field Nose. 0 adds no size variation. 1 uses the pattern fully. Which spots are kept still comes from Num Points and the density settings." }
      ]
    },
    {
      label: "Scale Noise",
      fields: [
        { id: "scaleType", label: "Scale Noise Type", select: noiseTypes, value: "0", tip: "Same five patterns as density Type, but they change size values instead of which spots are kept. Set Scale Nose Effect above 0 or the pattern stays out of the size." },
        { id: "scaleFrequency", label: "Scale Noise Frequency", min: 0.1, max: 12, step: 0.1, value: 5, tip: "How large the regions of similar size are. Raise it to fit more, smaller size changes into the same area." },
        { id: "scaleOffset", label: "Scale Noise Offset", min: -4, max: 4, step: 0.05, value: 0, tip: "Slides the size pattern across the selected points. Positions stay put. A point can move from a low part of the pattern to a high one. Nonzero Offset will not match the editor’s hidden seed." },
        { id: "scaleAmplitude", label: "Scale Noise Amplitude", min: 0, max: 4, step: 0.05, value: 1, tip: "Contrast between larger and smaller size values in the pattern. The finished plant still depends on Grower’s Seed Scale Effect." },
        { id: "scaleTurbulance", label: "Scale Noise Turbulance", min: 1, max: 8, step: 1, value: 2, tip: "Adds smaller variations to the size pattern. Spelled Turbulance in the editor. Voronoi ignores it." }
      ]
    }
  ];

  var inputs = {};
  function closeMenus() {
    var lists = controls.querySelectorAll(".menu-list");
    var i;
    for (i = 0; i < lists.length; i++) lists[i].hidden = true;
  }

  function addSelect(field) {
    var value = String(field.value);
    var wrap = document.createElement("div");
    wrap.className = "menu";
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "menu-trigger";
    trigger.id = "noise-" + field.id;
    var triggerLabel = document.createElement("span");
    var chevron = document.createElement("span");
    chevron.className = "menu-chevron";
    chevron.setAttribute("aria-hidden", "true");
    trigger.appendChild(triggerLabel);
    trigger.appendChild(chevron);
    var list = document.createElement("div");
    list.className = "menu-list";
    list.hidden = true;
    list.setAttribute("role", "listbox");
    function labelFor(next) {
      var i;
      for (i = 0; i < field.select.length; i++) {
        if (field.select[i][0] === String(next)) return field.select[i][1];
      }
      return String(next);
    }
    function paint() {
      triggerLabel.textContent = labelFor(value);
      var items = list.querySelectorAll(".menu-item");
      var i;
      for (i = 0; i < items.length; i++) {
        items[i].setAttribute("aria-selected", items[i].dataset.value === value ? "true" : "false");
      }
    }
    field.select.forEach(function (option) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "menu-item";
      item.dataset.value = option[0];
      item.setAttribute("role", "option");
      item.textContent = option[1];
      item.addEventListener("click", function () {
        value = option[0];
        paint();
        list.hidden = true;
        draw();
      });
      list.appendChild(item);
    });
    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      var opening = list.hidden;
      closeMenus();
      list.hidden = !opening;
    });
    wrap.appendChild(trigger);
    wrap.appendChild(list);
    paint();
    return {
      el: wrap,
      tagName: "SELECT",
      options: field.select.map(function (option) { return { value: option[0] }; }),
      get value() { return value; },
      set value(next) {
        value = String(next);
        paint();
      }
    };
  }

  function addField(field) {
    var row = document.createElement("div");
    row.className = "field";
    var label = document.createElement("label");
    label.textContent = field.label;
    label.setAttribute("for", "noise-" + field.id);
    row.appendChild(label);
    var control;
    if (field.select) {
      var picker = addSelect(field);
      control = picker;
      row.appendChild(picker.el);
    } else {
      var range = document.createElement("input");
      range.type = "range";
      range.min = field.min;
      range.max = field.max;
      range.step = field.step;
      range.value = field.value;
      range.setAttribute("aria-label", field.label);
      control = document.createElement("input");
      control.type = "number";
      control.min = field.min;
      control.max = field.max;
      control.step = field.step;
      control.value = field.value;
      range.addEventListener("input", function () {
        control.value = range.value;
        draw();
      });
      control.addEventListener("input", function () {
        range.value = control.value;
        draw();
      });
      row.appendChild(range);
    }
    if (!field.select) {
      control.id = "noise-" + field.id;
      row.appendChild(control);
    }
    if (field.tip) {
      var tip = document.createElement("p");
      tip.className = "tip";
      tip.id = "tip-" + field.id;
      tip.setAttribute("role", "tooltip");
      tip.textContent = field.tip;
      label.setAttribute("aria-describedby", tip.id);
      label.appendChild(tip);
    }
    controls.appendChild(row);
    inputs[field.id] = control;
  }

  document.addEventListener("click", closeMenus);

  groups.forEach(function (group) {
    var heading = document.createElement("p");
    heading.className = "noise-group";
    heading.textContent = group.label;
    controls.appendChild(heading);
    group.fields.forEach(addField);
  });

  function num(id) {
    return Number(inputs[id].value);
  }

  function fract(x) {
    return x - Math.floor(x);
  }

  function valueHash(x, y) {
    x = 50 * fract(x * 0.3183099 + 0.71);
    y = 50 * fract(y * 0.3183099 + 0.113);
    return -1 + 2 * fract(x * y * (x + y));
  }

  function noise2D(x, y) {
    var fx = Math.floor(x);
    var fy = Math.floor(y);
    var ux = x - fx;
    var uy = y - fy;
    var sx = ux * ux * (3 - 2 * ux);
    var sy = uy * uy * (3 - 2 * uy);
    return (1 - sy) * ((1 - sx) * valueHash(fx, fy) + sx * valueHash(fx + 1, fy)) +
      sy * ((1 - sx) * valueHash(fx, fy + 1) + sx * valueHash(fx + 1, fy + 1));
  }

  function mul(x, y, m00, m01, m10, m11) {
    return [x * m00 + y * m10, x * m01 + y * m11];
  }

  function perlin(x, y, iterations) {
    var value = 0;
    var strength = 1;
    var i;
    for (i = 0; i < iterations; i++) {
      strength *= 0.5;
      value += strength * noise2D(x, y);
      var next = mul(x, y, 1.6, 1.2, -1.2, 1.6);
      x = next[0];
      y = next[1];
    }
    return 0.5 + 0.5 * value;
  }

  function brownian(x, y, iterations) {
    var z = 0.5;
    var result = 0;
    var i;
    for (i = 0; i < iterations; i++) {
      result += Math.abs(noise2D(x, y)) * z;
      z *= 0.5;
      var next = mul(x, y, 1.910673, -0.5910404, 0.5910404, 1.910673);
      x = next[0];
      y = next[1];
    }
    return result;
  }

  function caustic(x, y, iterations) {
    var px = fract(x * 0.2) * (Math.PI * 2) - 250;
    var py = fract(y * 0.2) * (Math.PI * 2) - 250;
    var ix = px;
    var iy = py;
    var value = 0;
    var n;
    for (n = 0; n < iterations; n++) {
      var t = 1 - 3.5 / (n + 1);
      var nx = px + Math.cos(t - ix) + Math.sin(t + iy);
      var ny = py + Math.sin(t - iy) + Math.cos(t + ix);
      ix = nx;
      iy = ny;
      var s = Math.sin(ix + t);
      var c = Math.cos(iy + t);
      if (Math.abs(s) <= 0.0001 || Math.abs(c) <= 0.0001) continue;
      var tx = px / s;
      var ty = py / c;
      value += 1 / Math.sqrt(tx * tx + ty * ty);
    }
    return value / (0.003 * iterations);
  }

  function voronoiHash(cx, cy) {
    var p2x = cx * 127.1 + cy * 311.7;
    var p2y = cx * 269.5 + cy * 183.3;
    return [fract(Math.sin(p2x) * 17.1717) - 0.5, fract(Math.sin(p2y) * 17.1717) - 0.5];
  }

  function voronoi(x, y) {
    var wx = Math.floor(x + 0.5);
    var wy = Math.floor(y + 0.5);
    var best = Infinity;
    var cellX = 0;
    var cellY = 0;
    var hx = 0;
    var hy = 0;
    var iy;
    var ix;
    for (iy = wy - 1; iy <= wy + 1; iy++) {
      for (ix = wx - 1; ix <= wx + 1; ix++) {
        var hash = voronoiHash(ix, iy);
        var px = ix + hash[0];
        var py = iy + hash[1];
        var dx = px - x;
        var dy = py - y;
        var dist = dx * dx + dy * dy;
        if (dist < best) {
          best = dist;
          cellX = ix;
          cellY = iy;
          hx = px;
          hy = py;
        }
      }
    }
    var edge = Infinity;
    for (iy = cellY - 2; iy <= cellY + 2; iy++) {
      for (ix = cellX - 2; ix <= cellX + 2; ix++) {
        if (ix === cellX && iy === cellY) continue;
        var hash2 = voronoiHash(ix, iy);
        var ox = ix + hash2[0];
        var oy = iy + hash2[1];
        var ex = ox - hx;
        var ey = oy - hy;
        var len = Math.sqrt(ex * ex + ey * ey);
        if (len < 1e-8) continue;
        var midX = hx + ex * 0.5;
        var midY = hy + ey * 0.5;
        var distEdge = Math.abs((x - midX) * (ex / len) + (y - midY) * (ey / len));
        if (distEdge < edge) edge = distEdge;
      }
    }
    return edge / 0.0001;
  }

  function contrast(value, amount) {
    if (amount === 1) return value;
    if (amount <= 0) return 0.5;
    value = Math.min(1, Math.max(0, value));
    if (value === 1) return 1;
    return 1 / (1 + Math.pow(value / (1 - value), -amount));
  }

  function sample(worldX, worldY, settings) {
    var scale = 0.01 * settings.frequency;
    var x = scale * worldX + settings.offset;
    var y = scale * worldY + settings.offset;
    var iterations = Math.max(1, Math.round(settings.turbulance));
    var value;
    if (settings.type === 1) value = caustic(x, y, iterations);
    else if (settings.type === 2) value = voronoi(x, y);
    else if (settings.type === 3) value = brownian(x, y, iterations);
    else if (settings.type === 4) return edgeMask(worldX, worldY, x, y, iterations, settings);
    else value = perlin(x, y, iterations);
    return contrast(value, settings.amplitude);
  }

  function edgeMask(worldX, worldY, noiseX, noiseY, iterations, settings) {
    var scale = 0.01 * settings.frequency;
    var left = (worldX + settings.halfX) * scale;
    var right = (worldX - settings.halfX) * scale;
    var top = (worldY + settings.halfY) * scale;
    var bottom = (worldY - settings.halfY) * scale;
    var useX = Math.abs(left) < Math.abs(right) ? left : right;
    var useY = Math.abs(top) < Math.abs(bottom) ? top : bottom;
    var current = Math.min(Math.abs(useX), Math.abs(useY));
    var blend = current < 1 ? 1 - current : 0;
    if (blend <= 0.0001) return 1;
    var noiseValue = contrast(perlin(noiseX, noiseY, iterations), 1);
    var offsetAmount = blend;
    var noised = noiseValue * offsetAmount + (1 - offsetAmount) * (1 - (1 - noiseValue) * (1 - offsetAmount));
    return 1 - Math.min(1, Math.max(0, contrast(noised, settings.amplitude)));
  }

  function candidates(settings) {
    var width = settings.gx * settings.scatter;
    var depth = settings.gy * settings.scatter;
    var resolution = Math.max(1, Math.round(settings.resolution));
    var cellX = width / resolution;
    var cellY = depth / resolution;
    var halfX = width / 2;
    var halfY = depth / 2;
    var radius = Math.min(halfX, halfY);
    var points = [];
    var iy;
    var ix;
    for (iy = 0; iy < resolution; iy++) {
      for (ix = 0; ix < resolution; ix++) {
        var x = -halfX + cellX * (ix + 0.5);
        var y = -halfY + cellY * (iy + 0.5);
        if (settings.shape === 1 && Math.hypot(x, y) > radius) continue;
        points.push({ x: x, y: y });
      }
    }
    return { points: points, halfX: halfX, halfY: halfY };
  }

  function readSettings() {
    return {
      gx: num("gx"),
      gy: num("gy"),
      scatter: num("scatter"),
      resolution: num("resolution"),
      shape: Number(inputs.shape.value),
      num: Math.max(1, Math.round(num("num"))),
      border: num("border"),
      effect: num("effect"),
      type: Number(inputs.type.value),
      frequency: num("frequency"),
      offset: num("offset"),
      amplitude: num("amplitude"),
      turbulance: num("turbulance"),
      pointScale: num("pointScale"),
      scaleBorder: num("scaleBorder"),
      nose: num("nose"),
      scaleType: Number(inputs.scaleType.value),
      scaleFrequency: num("scaleFrequency"),
      scaleOffset: num("scaleOffset"),
      scaleAmplitude: num("scaleAmplitude"),
      scaleTurbulance: num("scaleTurbulance")
    };
  }

  function scaleSettings(settings) {
    return {
      type: settings.scaleType,
      frequency: settings.scaleFrequency,
      offset: settings.scaleOffset,
      amplitude: settings.scaleAmplitude,
      turbulance: settings.scaleTurbulance,
      halfX: settings.halfX,
      halfY: settings.halfY
    };
  }

  function withTurbulance(settings, iterations) {
    return {
      type: settings.type,
      frequency: settings.frequency,
      offset: settings.offset,
      amplitude: settings.amplitude,
      turbulance: iterations,
      halfX: settings.halfX,
      halfY: settings.halfY
    };
  }

  function sampleDetail(worldX, worldY, settings) {
    if (settings.type === 2 || settings.turbulance <= 1) return 0;
    return sample(worldX, worldY, settings) - sample(worldX, worldY, withTurbulance(settings, 1));
  }

  function pointSize(point, settings) {
    var noise = sample(point.x, point.y, scaleSettings(settings));
    var edge = 1 - Math.min(1, Math.max(0, Math.hypot(point.x, point.y) / 100));
    var mix = (1 - settings.nose) + settings.nose * noise;
    var edgeMix = (1 - settings.scaleBorder) + settings.scaleBorder * edge;
    return settings.pointScale * mix * edgeMix;
  }

  function scored(settings) {
    var grid = candidates(settings);
    settings.halfX = grid.halfX;
    settings.halfY = grid.halfY;
    var effect = settings.effect;
    var border = settings.border;
    var points = grid.points.map(function (point, index) {
      var noise = sample(point.x, point.y, settings);
      var edge = 1 - Math.min(1, Math.max(0, Math.hypot(point.x, point.y) / 100));
      var noiseMix = (1 - effect) + effect * noise;
      var score = noiseMix * ((1 - border) + border * edge);
      var sizeValue = pointSize(point, settings);
      return { x: point.x, y: point.y, noise: noise, score: score, sizeValue: sizeValue, index: index };
    });
    var kept = [];
    if (effect > 0) {
      kept = points.slice().sort(function (a, b) {
        return b.score - a.score || a.index - b.index;
      }).slice(0, settings.num);
    }
    return { settings: settings, points: points, kept: kept, halfX: grid.halfX, halfY: grid.halfY };
  }

  function worldToCanvas(x, y, halfX, halfY, size, pad) {
    var spanX = Math.max(halfX, 1);
    var spanY = Math.max(halfY, 1);
    var inner = size - pad * 2;
    return [
      pad + (0.5 - y / spanY * 0.5) * inner,
      pad + (0.5 + x / spanX * 0.5) * inner
    ];
  }

  function canvasToWorld(px, py, halfX, halfY, size, pad) {
    var inner = size - pad * 2;
    return [
      ((py - pad) / inner - 0.5) * 2 * halfX,
      (0.5 - (px - pad) / inner) * 2 * halfY
    ];
  }

  function drawMarker(ctx, x, y, scale) {
    var radius = Math.max(1.5, Math.min(16, scale * 5));
    ctx.fillStyle = "#2f6fdb";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAxes(ctx, size) {
    var ox = 54;
    var oy = size - 44;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#5cb82e";
    ctx.beginPath();
    ctx.moveTo(ox - 22, oy);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.strokeStyle = "#e23b2c";
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy + 18);
    ctx.stroke();
    ctx.fillStyle = "#6e6e6e";
    ctx.fillRect(ox - 3, oy - 3, 6, 6);
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#3d9a18";
    ctx.fillText("Y", ox - 26, oy);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#d42316";
    ctx.fillText("X", ox, oy + 20);
    ctx.lineWidth = 1;
  }

  function drawCross(ctx, halfX, halfY, size, pad) {
    var origin = worldToCanvas(0, 0, halfX, halfY, size, pad);
    ctx.strokeStyle = "#4a4a4a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(origin[0] - 10, origin[1]);
    ctx.lineTo(origin[0] + 10, origin[1]);
    ctx.moveTo(origin[0], origin[1] - 10);
    ctx.lineTo(origin[0], origin[1] + 10);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawField(ctx, sampleSettings, halfX, halfY, size, pad, read) {
    var image = ctx.createImageData(size, size);
    var values = new Float64Array(size * size);
    var min = Infinity;
    var max = -Infinity;
    var py;
    var px;
    read = read || sample;
    for (py = 0; py < size; py++) {
      for (px = 0; px < size; px++) {
        var world = canvasToWorld(px, py, halfX, halfY, size, pad);
        var value = read(world[0], world[1], sampleSettings);
        values[py * size + px] = value;
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    var span = max - min;
    var flat = span < 1e-8;
    var i;
    for (i = 0; i < values.length; i++) {
      var shade = flat ? 185 : Math.round((values[i] - min) / span * 255);
      var pixel = i * 4;
      image.data[pixel] = shade;
      image.data[pixel + 1] = shade;
      image.data[pixel + 2] = shade;
      image.data[pixel + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    drawCross(ctx, halfX, halfY, size, pad);
  }

  function draw() {
    var model = scored(readSettings());
    var size = pointsCanvas.width;
    var pad = 16;
    var pointsCtx = pointsCanvas.getContext("2d");
    var fieldCtx = fieldCanvas.getContext("2d");
    var scaleCtx = scaleCanvas.getContext("2d");
    var turbulenceCtx = turbulenceCanvas.getContext("2d");
    pointsCtx.fillStyle = "#b9b9b9";
    pointsCtx.fillRect(0, 0, size, size);
    drawCross(pointsCtx, model.halfX, model.halfY, size, pad);
    drawField(fieldCtx, model.settings, model.halfX, model.halfY, size, pad);
    drawField(scaleCtx, scaleSettings(model.settings), model.halfX, model.halfY, size, pad);
    drawField(turbulenceCtx, model.settings, model.halfX, model.halfY, size, pad, sampleDetail);

    model.kept.forEach(function (point) {
      var at = worldToCanvas(point.x, point.y, model.halfX, model.halfY, size, pad);
      drawMarker(pointsCtx, at[0], at[1], point.sizeValue);
      drawMarker(fieldCtx, at[0], at[1], point.sizeValue);
      drawMarker(scaleCtx, at[0], at[1], point.sizeValue);
      drawMarker(turbulenceCtx, at[0], at[1], point.sizeValue);
    });
    drawAxes(pointsCtx, size);
    drawAxes(fieldCtx, size);
    drawAxes(scaleCtx, size);
    drawAxes(turbulenceCtx, size);
    var status = document.getElementById("points-status");
    if (status) {
      status.textContent = model.settings.effect > 0
        ? "Markers are the highest scores, up to Num Points. Their size is the scale value."
        : "Density Noise Effect is 0, so the editor picks at random. Markers stay off here.";
    }
    saveStored();
  }

  var storageKey = "pve-point-scatter-lab";

  function applyStored(input, raw) {
    if (input.tagName === "SELECT") {
      var matched = false;
      var i;
      for (i = 0; i < input.options.length; i++) {
        if (input.options[i].value === String(raw)) matched = true;
      }
      if (!matched) return;
      input.value = String(raw);
      return;
    }
    var value = Number(raw);
    if (!isFinite(value)) return;
    if (input.min !== "" && value < Number(input.min)) value = Number(input.min);
    if (input.max !== "" && value > Number(input.max)) value = Number(input.max);
    input.value = String(value);
    var range = input.previousElementSibling;
    if (range && range.type === "range") range.value = input.value;
  }

  function restoreStored() {
    var values;
    try {
      values = JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (error) {
      return;
    }
    Object.keys(values).forEach(function (id) {
      if (inputs[id]) applyStored(inputs[id], values[id]);
    });
  }

  function saveStored() {
    var values = {};
    Object.keys(inputs).forEach(function (id) {
      values[id] = inputs[id].value;
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
    } catch (error) {}
  }

  restoreStored();
  draw();
})();
