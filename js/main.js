
  var GUI, RadialNav, animate, describeArc, describeSector, gui, polarToCartesian, random;

  Snap.plugin(function(Snap, Element) {
    return Element.prototype.hover = function(f_in, f_out, s_in, s_out) {
      return this.mouseover(f_in, s_in).mouseout(f_out || f_in, s_out || s_in);
    };
  });

  polarToCartesian = function(cx, cy, r, angle) {
    angle = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  describeArc = function(x, y, r, startAngle, endAngle, continueLine, alter) {
    var end, start;
    start = polarToCartesian(x, y, r, startAngle %= 360);
    end = polarToCartesian(x, y, r, endAngle %= 360);
    return "" + (continueLine ? 'L' : 'M') + start.x + " " + start.y + " A" + r + " " + r + ", 0, " + (endAngle - startAngle >= 180 ? 1 : 0) + ", " + (alter ? 0 : 1) + ", " + end.x + " " + end.y;
  };

  describeSector = function(x, y, r, r2, startAngle, endAngle) {
    return "" + (describeArc(x, y, r, startAngle, endAngle)) + " " + (describeArc(x, y, r2, endAngle, startAngle, true, true)) + "Z";
  };

  random = function(min, max) {
    return Math.random() * (max - min) + min;
  };

  animate = function(obj, index, start, end, duration, easing, fn, cb) {
    var _ref;
    if ((_ref = (obj.animation != null ? obj.animation : obj.animation = [])[index]) != null) {
      _ref.stop();
    }
    return obj.animation[index] = Snap.animate(start, end, fn, duration, easing, cb);
  };

  GUI = (function() {
    function GUI(buttons) {
      this.paper = Snap(window.innerWidth, window.innerHeight).attr({id: 'parent'});
      this.nav = new RadialNav(this.paper, buttons);
      this.nav.show();
      return this._bindEvents();
    }

    GUI.prototype._bindEvents = function() {
      window.addEventListener('resize', (function(_this) {
        return function() {
          _this.nav.area.attr({
            x: (window.innerWidth / 2) - _this.nav.c,
            y: (window.innerHeight / 2) - _this.nav.c
          });
          return _this.paper.attr({
            width: window.innerWidth,
            height: window.innerHeight
          });
        };
      })(this));
    };

    return GUI;

  })();

  RadialNav = (function() {
    function RadialNav(paper, buttons) {
      this.area = paper.svg(0, 0, this.size = 500, this.size).addClass('radialnav').attr({id: 'radialnav'});
      this.c = this.size / 2;
      this.r = this.size * .25;
      this.r2 = this.r * .35;
      this.animDuration = 300;
      this.angle = 360 / buttons.length;
      this.container = this.area.g();
      this.container.transform("s0");
      this.updateButtons(buttons);
    }

    RadialNav.prototype._animateContainer = function(start, end, duration, easing) {
      return animate(this, 0, start, end, duration, easing, (function(_this) {
        return function(val) {
          return _this.container.transform("r" + (90 - 90 * val) + "," + _this.c + "," + _this.c + "s" + val + "," + val + "," + _this.c + "," + _this.c);
        };
      })(this));
    };

    RadialNav.prototype._animateButtons = function(start, end, min, max, easing) {
      var anim, el, i, _ref, _results;
      anim = (function(_this) {
        return function(i, el) {
          return animate(el, 0, start, end, random(min, max), easing, function(val) {
            return el.transform("r" + (_this.angle * i) + "," + _this.c + "," + _this.c + "s" + val + "," + val + "," + _this.c + "," + _this.c);
          });
        };
      })(this);
      _ref = this.container;
      _results = [];
      for (i in _ref) {
        el = _ref[i];
        if (!isNaN(+i)) {
          _results.push(anim(i, el));
        }
      }
      return _results;
    };

    RadialNav.prototype._animateButtonHover = function(button, start, end, duration, easing, cb) {
      return animate(button, 1, start, end, duration, easing, ((function(_this) {
        return function(val) {
          button[0].attr({
            d: describeSector(_this.c, _this.c, _this.r - val * 10, _this.r2, 0, _this.angle)
          });
        };
      })(this)), cb);
    };

    RadialNav.prototype._sector = function(color) {
      return this.area.path(describeSector(this.c, this.c, this.r, this.r2, 0, this.angle)).addClass('radialnav-sector').attr("fill", color);
    };

    RadialNav.prototype._rotateContainer = function(start, end, duration, easing, angel, c) {
      return animate(this, 0, start, end, duration, easing, (function(_this) {
        return function(val) {
          return _this.container.transform("r"+angel*val+","+c+","+c);
        };
      })(this));
    };

    RadialNav.prototype._button = function(btn, sector, btn_cnt) {
      var container = this;
      return this.area.g(sector).data('cb', btn.action).click(function() { 
        angel = Math.round(((360 / btn_cnt) * btn.num) - ((360 / btn_cnt) / 2));
        angel = angel * -1;
        c = container.c;
        container._rotateContainer(0, 1, 4000, mina.elastic, angel, c);

        colorSplash(btn.color); // User Function

      }).mouseup(function() {
        var _base;
        return typeof (_base = this.data('cb')) === "function" ? _base() : void 0;
      }).hover(function() {
        var el, _i, _len, _ref, _results;
        _ref = [this[0], this[1], this[2]];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          el = _ref[_i];
          (el === undefined) ? ' ' : _results.push(el.toggleClass('active'));
        }
        return _results;
      }).hover(this._buttonOver(this), this._buttonOut(this));
    };

    RadialNav.prototype._buttonOver = function(nav) {
      return function() {
        nav._animateButtonHover(this, 0, 1, 200, mina.easeinout);
      };
    };

    RadialNav.prototype._buttonOut = function(nav) {
      return function() {
        return nav._animateButtonHover(this, 1, 0, 2000, mina.elastic, (function() {
        }).bind(this[2]));
      };
    };

    RadialNav.prototype.updateButtons = function(buttons, icons) {
      var btn, _i, _len, _results;
      this.container.clear();
      _results = [];
      for (_i = 0, _len = buttons.length; _i < _len; _i++) {
        btn = buttons[_i];
        btn.num = _i + 1;
        _results.push(this.container.add(this._button(btn, this._sector(buttons[_i].color), buttons.length)));
      }

      return _results;
    };

    RadialNav.prototype.show = function(e) {
      this.area.attr({
        x: (window.innerWidth / 2) - this.c,
        y: (window.innerHeight / 2) - this.c
      });

      this._animateContainer(0, 1, this.animDuration * 8, mina.elastic);
      return this._animateButtons(0, 1, this.animDuration, this.animDuration * 8, mina.elastic);
    };

    RadialNav.prototype.hide = function() {
      this._animateContainer(1, 0, this.animDuration, mina.easeinout);
      return this._animateButtons(1, 0, this.animDuration, this.animDuration, mina.easeinout);
    };

    return RadialNav;

  })();

  gui = new GUI([
    {
      color: '#FF0000',
      action: function() {
        return false;
      }
    }, {
      color: '#FFE700',
      action: function() {
        return false;
      }
    }, {
      color: '#E87B04',
      action: function() {
        return false;
      }
    }, {
      color: '#AA5AE8',
      action: function() {
        return false;
      }
    }, {
      color: '#0066FF',
      action: function() {
        return false;
      }
    }, {
      color: '#560CE8',
      action: function() {
        return false;
      }
    }, {
      color: '#C2FF0D',
      action: function() {
        return false;
      }
    }
  ]);

var colorSplash = function(newColor){
  (newColor == undefined) ? newColor = '#FFFFFF' : newColor;
  var newCircles = {}, x, y, circle;
  for (var j = 50; j >= 0; j--) {
    newCircles[j] = { element: circle = gui.paper.circle(random(50, window.innerWidth), random(50, window.innerHeight), 0) };
    newCircles[j].element.animate({r: random(50, 300), fill: newColor}, random(2500, 6500), mina.backout);
  };
  setTimeout(function() { 
    gui.nav.hide();
    
    //rectangle.animate({fill: newColor});
    setTimeout(function() { 
      rectangle = gui.paper.rect(0, 0, window.innerWidth, window.innerHeight).attr({fill: newColor});
      document.getElementById('parent').appendChild(document.getElementById('radialnav'));
      gui.nav.show();
      var oldCircles = document.getElementsByTagName("circle");
      for (index = oldCircles.length - 1; index >= 0; index--) {
          oldCircles[index].parentNode.removeChild(oldCircles[index]);
      }
    }, 3500);
  }, 3000);
};


