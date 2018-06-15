var app = {
  // App attributes
  initDone: false,
  mode: 'INPUT',
  lines: [],
  firstPoint: null,
  SELECTOR_DISTANCE: 10, // controls how sensitive we want the selector to be
  canvas: document.getElementById('canvas'),
  canvasSize: {
    width: self.canvas.width,
    height: self.canvas.height
  },

  /**
   * Initialize the app
   */
  init: function() {
    var self = this;
    if(self.initDone)
      return;
    self.bindToolbarEvents();
    self.bindDrawAreaEvents();
    self.initDone = true;
  },

  /**
   * Sets up the toolbar button events
   */
  bindToolbarEvents: function() {
    var self = this;
    // helper to set the application state on button change
    const resetState = function (mode) {
      self.mode = mode;
      self.firstPoint = null;
      self.resetSelections();
      self.updateToolbarState();
    };

    document.getElementById('btn-erase').addEventListener('click', function() {
      self.deleteSelection();
    });

    document.getElementById('btn-line').addEventListener('click', function() {
      resetState('INPUT');
    });

    document.getElementById('btn-select').addEventListener('click', function() {
      resetState('SELECT');
    });
    document.getElementById('btn-move').addEventListener('click', function() {
      resetState('MOVE');
    });

    document.getElementById('btn-pencil').addEventListener('click', function() {
      resetState('DRAW');
    });
  },

  /**
   * When the toolbar state updates, update the UI
   */
  updateToolbarState: function() {
    const self = this;
    document.getElementById('btn-erase').style.display = 'none';
    [].forEach.call(document.getElementsByClassName('top-button'), (button) => {
      button.classList.remove('active');
    });
    document.getElementById('btn-erase').className = self.mode === 'ERASE' ? 'active' : '';
    document.getElementById('btn-line').className = self.mode === 'INPUT'? 'active' : '';
    document.getElementById('btn-select').className = self.mode === 'SELECT' ? 'active' : '';
    document.getElementById('btn-move').className = self.mode === 'MOVE' ? 'active' : '';
    document.getElementById('btn-pencil').className = self.mode === 'DRAW' ? 'active' : '';
  },

  /**
   * Sets up the canvas events
   */
  bindDrawAreaEvents: function() {
    const self = this;
    let drawing = false;
    let drawPoints = null;

    self.canvas.addEventListener('mousedown', function(e) {
      var x = e.offsetX, y = e.offsetY;
      if (self.mode === 'MOVE') {
        // we need to figure out which one we're going to move.
        // Use the existing selection logic for that
        self.selectLine(x, y);
      } else if (self.mode === 'DRAW') {
        drawing = true;
        // pass the first point to our line constructor to create the first segment
        drawPoints = new Line({
          firstPoint: {x, y},
          canvasSize: self.canvasSize
        });
        self.lines.push(drawPoints);
      } else if(self.mode === 'SELECT') {
        self.selectLine(x, y);
      } else if (self.mode === 'INPUT'){
        if(!self.firstPoint) {
          // save first click of the line segment
          self.firstPoint = {x, y};
        } else {
          // create the line and add to the list
          const line = new Line({
            firstPoint: self.firstPoint,
            secondPoint: {x, y},
            canvasSize: self.canvasSize
          });
          self.lines.push(line);
          self.firstPoint = null;
        }
      }
      self.render();
    });

    self.canvas.addEventListener('mouseup', function() {
      if (self.mode === 'MOVE') {
        // when we start moving, reset any old selections we may have
        self.resetSelections();
      } else if (self.mode === 'DRAW') {
        // done drawing
        drawing = false;
        drawPoints = null;
      }
    });

    self.canvas.addEventListener('mousemove', function (e) {
      let selectedLine = false;
      self.lines.forEach(function(line) {
        if (line.selected) {
          selectedLine = line;
        }
      });

      if (selectedLine && self.mode === 'MOVE') {
        const valid = selectedLine.move(e.movementX/2, e.movementY/2);
        if (valid) {
          self.render();
        } else {
          console.log('invalid move');
        }
      } else if (drawing && self.mode === 'DRAW') {
        drawPoints.addSegment({
          x: e.offsetX,
          y: e.offsetY
        });
        self.render();
      }
    })
  },

  /**
   * Renders the line components in our canvas
   */
  render: function() {
    const self = this;
    const ctx = self.canvas.getContext('2d');
    ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
    let hasSelected = false;

    // draw each line
    self.lines.forEach(function(line) {
      line.draw(ctx);
      if (line.selected) {
        hasSelected = true;
      }
    });

    // if we have lines, then we need to show the select button
    if (self.lines.length) {
      document.getElementById('btn-move').style.display = 'block';
      document.getElementById('btn-select').style.display = 'block';
    } else {
      document.getElementById('btn-select').style.display = 'none';
      document.getElementById('btn-move').style.display = 'none';
    }

    // if we're in select mode, and one is selected, show the erase button
    if (hasSelected && this.mode === 'SELECT') {
      document.getElementById('btn-erase').style.display = 'block';
    } else {
      document.getElementById('btn-erase').style.display = 'none';
    }
  },

  /**
   * Selects a single line
   * @param x
   * @param y
   */
  selectLine: function (x, y) {
    const self = this;
    if (self.lines.length > 0) {
      let minSquareDistance, closestIndex;
      self.lines.forEach(function(line, index) {
        const squareDistance = line.squareDistanceFrom(x, y);
        if (squareDistance == null)
          return;
        // SELECTOR_DISTANCE is a constant defined at the top level of our application
        // to allow for easy modification of the click "sensitivity"
        if(squareDistance <= self.SELECTOR_DISTANCE &&
          (minSquareDistance === undefined || squareDistance < minSquareDistance)) {
          minSquareDistance = squareDistance;
          closestIndex = index;
        }
      });

      if (self.lines[closestIndex]) {
        if (self.lines[closestIndex].selected) {
          // the user clicked on an already selected line.  Deselect it.
          self.lines[closestIndex].setSelected(false);
        } else {
          // clear other lines that are selected and highlight the currently selected one
          self.resetSelections();
          self.lines[closestIndex].setSelected(true);
        }
      } else {
        // clear all selections, nothing is withing our SELECTOR_DISTANCE
        this.resetSelections();
      }
    }
  },

  /**
   * Resets any currently selected lines
   */
  resetSelections: function () {
    this.lines.forEach(function(line) {
      line.setSelected(false);
    });
    this.render();
  },

  /**
   * Deletes the currently "selected" line from our collection
   */
  deleteSelection: function () {
    let selectionIndex = null;
    this.lines.forEach(function(line, index) {
      if (line.selected) {
        selectionIndex = index;
        return false;
      }
    });

    // only do this if there is a selected line in case the delete button shows when it shouldn't
    if (selectionIndex >= 0) {
      this.lines.splice(selectionIndex, 1);
      this.render();
    }
  }
};
