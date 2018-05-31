var Line = {
  init: function (container) {
    this.drawPathFlag = false;
    // path右键菜单
    this.pathMenu = document.getElementById('path-menu');
    // 左侧item
    this.item_left = document.querySelectorAll('.main .main-left .item');
    // 右侧item
    this.item_right = document.querySelectorAll('.main .main-right .item');
    //设置左右两侧区块的宽高
    this.initUnit(container);
    //初始化SVG画布
    this.initSVG(container);
    //初始化path
    this.initPath();
    //重绘path
    this.drawPath();
    //path鼠标右键事件
    this.pathContextMenu();
    //path鼠标右键菜单删除事件
    this.pathMenuRemove();
  },
  initUnit: function (container) {
    container = typeof container === 'string' ? document.querySelector(container) : container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.widthItem = 200;
    this.heightItem = 52;
    this.space = this.width - this.widthItem * 2;
  },
  initSVG: function (container) {
    container = typeof container === 'string' ? document.querySelector(container) : container;
    this.scale = 1;
    this.svg = SVG(container).size(this.width, this.height);
    this.svg.viewbox(0, 0, this.width, this.height);
    this.surface = this.svg
      .group()
      .width(100)
      .height(100)
      .addClass('surface')
      .viewbox(0, 0, 100, 100);
  },
  initPath: function () {
    var path = this.surface.path(this._getPathStr(200, 26, 200 + this.space, 26))
      .addClass('path-item')
      .attr({
        'pointer-events': 'auto'
      })
      .fill('none')
      .stroke({
        color: '#818181',
        width: 2,
        linecap: 'round',
        linejoin: 'round'
      })
      .marker('end', 8, 4, function (add) {
        add.path("M0 0 L4 2 L0 4 L0 0");
        this.fill('#818181')
          .size(10, 10)
      })
  },
  drawPath: function () {
    var _this = this;
    this.svg.on('mousedown', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();  //remind me
      _this.hidePathMenu();
      if (path) {
        path = null;
      }
      var startPos = this._transfromCoordination(e.offsetX, e.offsetY);
      //验证画线时，起点和终点不能超过指定区域
      var pathRangeValidResult = _this.pathRangeValid();
      if (startPos.x > _this.widthItem) {
        return;
      } else if (startPos.y > pathRangeValidResult.leftH) {
        return;
      }
      var startPosY = (Math.floor(startPos.y / _this.heightItem)) * (_this.heightItem) + _this.heightItem / 2;
      this.drawPathFlag = true;
      var path = this.surface.path(this._getPathStr(_this.widthItem, startPosY, _this.widthItem, startPos.y))
        .addClass('path-item')
        .attr('pointer-events', 'none')
        .fill('none')
        .stroke({
          color: '#818181',
          width: 2,
          linecap: 'round',
          linejoin: 'round'
        })
        .marker('end', 8, 4, function (add) {
          add.path("M0 0 L4 2 L0 4 L0 0");
          this.fill('#818181')
            .size(10, 10)
        });
      this.curPath = path;
      var onMouseMove = function (e) {
        if (this.drawPathFlag) {
          var movePos = this._transfromCoordination(e.offsetX, e.offsetY);
          this.curPath.plot(this._getPathStr(_this.widthItem, startPosY, movePos.x, movePos.y));
        }
      };
      this.svg.on('mousemove', onMouseMove, this);

      var onMouseUp = function (e) {
        this.svg.off('mousemove', onMouseMove);
        if (this.drawPathFlag) {
          var path = this.curPath;
          var endPos = this._transfromCoordination(e.offsetX, e.offsetY);
          //验证画线时，起点和终点不能超过指定区域
          var pathRangeValidResult = _this.pathRangeValid();
          if (endPos.x < this.space + this.widthItem) {
            this.curPath.remove();
          } else if (endPos.y > pathRangeValidResult.rightH) {
            this.curPath.remove();
          }
          var endPosX = _this.width - _this.widthItem;
          var endPosY = (Math.floor(endPos.y / _this.heightItem)) * (_this.heightItem) + _this.heightItem / 2;;
          if (endPos.x < endPosX) {
            this.curPath.remove();
          } else {
            this.curPath.plot(this._getPathStr(_this.widthItem, startPosY, endPosX, endPosY));
            path.attr('pointer-events', 'auto');
          }
          var path_d = this.curPath.node.getAttribute('d');
          var pathValidResult = _this.pathValid(path_d);
          if (!pathValidResult) {
            this.curPath.remove();
          }
        }
        this.drawPathFlag = false;
        this.svg.off('mouseup', onMouseUp, this);
      }
      this.svg.on('mouseup', onMouseUp, this);
    }, this);
  },
  _getPathStr: function (x1, y1, x2, y2) {
    var ratio = 0.5;
    var cx1 = x1;
    var offset = Math.sign(y1 - y2) * Math.max(Math.abs(y1 - y2), Math.abs(x1 - x2) * 0.5, 10) * ratio;
    var cy1 = y1 - offset;
    var cx2 = x2;
    var cy2 = y2 + offset;
    return "M" + x1 + " " + y1 + " " + x2 + " " + y2;
  },
  _transfromCoordination: function (x, y) {
    return {
      x: (x - this.surface.x()) / this.scale,
      y: (y - this.surface.y()) / this.scale
    }
  },
  pathContextMenu: function () {
    var _this = this;
    this.svg.on('contextmenu', function (event) {
      event.stopPropagation();
      event.preventDefault();
      _this.hidePathMenu();
      var isPath = event.target.tagName.toLowerCase() === 'path';
      if (isPath) {
        var x = event.clientX;
        var y = event.clientY;
        _this.showPathMenu(x, y);
        _this.curPath = event.target;
      }
    });
  },
  pathMenuRemove: function () {
    !!this.pathMenu && this.pathMenu.addEventListener('click', this.removePath.bind(this), false);
  },
  hidePathMenu: function () {
    this.pathMenu.classList.add('hide');
  },
  showPathMenu: function (x, y) {
    this.pathMenu.style.webkitTransform = " translate(" + x + "px," + y + "px)";
    this.pathMenu.classList.remove('hide');
  },
  removePath: function () {
    var _this = this;
    var curPathId = _this.curPath.getAttribute('id');
    var paths = document.querySelectorAll('.path-item');
    var pathsL = paths.length;
    _this.hidePathMenu();
    for (var i = 0; i < pathsL; i++) {
      var self_id = paths[i].getAttribute('id');
      if (self_id === curPathId) {
        _this.curPath.remove();
        break;
      }
    }
  },
  //匹配筛选连线的两侧数据
  getMatchData: function () {
    var arr = [];
    var _this = this;
    var paths = document.querySelectorAll('.path-item');
    var pathsL = paths.length;
    for(var i = 0; i < pathsL; i ++){
      var self_d = paths[i].getAttribute('d');
      var p_left = self_d.split(' ')[1];
      var p_right = self_d.split(' ')[3];
      var index_left = Math.floor(p_left / _this.heightItem);
      var index_right = Math.floor(p_right / _this.heightItem);
      var text_left = _this.item_left[index_left].firstChild.nodeValue;
      var text_right = _this.item_right[index_right].firstChild.nodeValue;
      var obj = {
        left: text_left,
        right: text_right
      };
      arr.push(obj);
    }
    return arr;
  },
  //验证两端之前，只能有一条连线
  pathValid: function (d) {
    var result = true;
    var arrStart = [];
    var arrEnd = [];
    var paths = document.querySelectorAll('.path-item');
    var pathsL = paths.length;
    for (var i = 0; i < pathsL; i++) {
      var self_d = paths[i].getAttribute('d');
      var startP = self_d.split(' ')[1];
      var endP = self_d.split(' ')[3];
      if (arrStart.indexOf(startP) !== -1) {
        result = false;
        break;
      } else {
        arrStart.push(startP);
      }
      if (arrEnd.indexOf(endP) !== -1) {
        result = false;
        break;
      } else {
        arrEnd.push(endP);
      }
    }
    return result;
  },
  //验证画线时，起点和终点不能超过指定区域
  pathRangeValid: function () {
    var obj = {};
    var eleLeft = '.main .main-left .item';
    var eleRight = '.main .main-right .item';
    var mainLeft = document.querySelectorAll(eleLeft);
    var mainRight = document.querySelectorAll(eleRight);
    var mainLeftL = mainLeft.length;
    var mainRightL = mainRight.length;
    var mainLeftH = mainLeftL * this.heightItem;
    var mainRightH = mainRightL * this.heightItem;
    obj['leftH'] = mainLeftH;
    obj['rightH'] = mainRightH;
    return obj;
  }
}
Line.init('.main');
// 提交保存，对两边连线的数据进行筛选匹配
document.querySelector('.submit').addEventListener('click', function () {
  var matchResult = Line.getMatchData();
  console.log(matchResult);
}, false);