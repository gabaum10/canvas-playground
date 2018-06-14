/**
 * Essentially a wrapper collection around line segments to ease the line manipulation and allow
 * drawing with many segments
 * @param firstPoint
 * @param secondPoint (optional) - pass a second point to create an entier line segment on construction
 * @param canvasSize - maximum size of our canvas
 * @constructor
 */

const Line = function ({firstPoint, secondPoint, canvasSize}) {
  this.type = 'LINE';
  this.segments = [];
  this.firstPoint = firstPoint;
  this.selected = false;

  this.canvasSize = canvasSize;

  if (secondPoint) {
    this.addSegment(secondPoint);
  }
};

/**
 * Adds a new segment to our line
 * @param point
 */
Line.prototype.addSegment = function (point) {
  const lastSegment = this.segments[this.segments.length - 1];
  let firstPoint = {};
  if (lastSegment) {
    // if there is an existing line segment, add our new point to the end
    firstPoint.x = lastSegment.x2;
    firstPoint.y = lastSegment.y2;
  } else {
    // otherwise, add it to the first point
    firstPoint = this.firstPoint;
  }
  this.segments.push(new LineSegment(firstPoint, point, this.canvasSize));
};

Line.prototype.draw = function (ctx) {
  this.segments.forEach((segment) => {
    segment.draw(ctx);
  });
};

Line.prototype.move = function (dx, dy) {
  let segmentValid = true;
  this.segments.forEach((segment) => {
    const valid = segment.move(dx, dy);
    if (valid === false) {
      segmentValid = valid;
    }
    return false;
  });

  return segmentValid;
};

Line.prototype.setSelected = function (isSelected) {
  this.selected = isSelected;
  this.segments.forEach((segment) => {
    segment.setSelected(isSelected);
  });
};

Line.prototype.squareDistanceFrom = function(x, y) {
  let smallest = null;
  // figure out which of the segments is closest to the x,y point
  this.segments.forEach((segment) => {
    const distance = segment.squareDistanceFrom(x, y);
    if (!smallest || distance < smallest) {
      smallest = distance;
    }
  });

  return smallest;
};
