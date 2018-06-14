var LineSegment = function(point1, point2, canvasSize) {
  this.type = 'SEGMENT';
  this.x1 = point1.x;
  this.y1 = point1.y;
  this.x2 = point2.x;
  this.y2 = point2.y;
  this.length = Geometry.squareDistance(this.x1, this.y1, this.x2, this.y2);

  this.canvasSize = canvasSize;

  this.selected = false;
};

LineSegment.prototype.draw = function(ctx) {
  this.path = new Path2D();
  this.path.strokeStyle = '#000';
  this.path.lineWidth = 1;
  this.path.moveTo(this.x1, this.y1);
  this.path.lineTo(this.x2, this.y2);
  ctx.stroke(this.path);

  if (this.selected) {
    this.drawEnds(ctx);
  }
};

LineSegment.prototype.drawEnds = function(ctx) {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  var drawEnd = function(x, y) {
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 5, 0, 0, 2 * Math.PI);
    ctx.stroke();
  };
  drawEnd(this.x1, this.y1);
  drawEnd(this.x2, this.y2);
};

LineSegment.prototype.move = function(dx, dy) {
  console.log(this.x1 + dy );
  // this is kinda "dumb", but I'm running out of time.
  // TODO: clean this up.
  const validMin = this.x1 + dx >= 0 && this.x1 + dx >= 0 && this.y1 + dy >= 0 && this.y2 + dy >= 0;
  const validMax = this.x1 + dx <= this.canvasSize.width && this.x2 + dx <= this.canvasSize.width &&
    this.y1 + dy <= this.canvasSize.height && this.y2 + dy <= this.canvasSize.height;
  if (!validMin || !validMax) {
    return false; // this would put it outside the canvas, reject it
  }
  this.x1 += dx;
  this.y1 += dy;
  this.x2 += dx;
  this.y2 += dy;
};

LineSegment.prototype.setSelected = function (isSelected) {
  this.selected = isSelected;
};

LineSegment.prototype.squareDistanceFrom = function(x, y) {
  var x1 = this.x1, y1 = this.y1, x2 = this.x2, y2 = this.y2;
  return Geometry.squareDistanceToSegment(x, y, x1, y1, x2, y2);
};
