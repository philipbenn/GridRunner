// Controller
"use strict";

class Controller {
  constructor() {
    this.model = new Model();
    this.view = new View(this);
  }

  startGame() {
    document.addEventListener("keydown", this.keyDown.bind(this));
    document.addEventListener("keyup", this.keyUp.bind(this)); // Add keyup event listener
    let payload = { row: this.height / 2 - 1, col: this.width / 2 - 1 };

    this.model.queue.addFirst(payload);
    this.generateGoal();
    this.tick();
  }

  numTicks = 0;
  dead = false;
  tick() {
    this.numTicks++;
    const run = setTimeout(this.tick.bind(this), 300);

    this.model.updateModel(0);

    if (this.model.controls.left) {
      this.model.direction = "left";
    } else if (this.model.controls.right) {
      this.model.direction = "right";
    } else if (this.model.controls.up) {
      this.model.direction = "up";
    } else if (this.model.controls.down) {
      this.model.direction = "down";
    }

    const head = this.model.queue.getFirst().data;
    const payload = {
      row: head.row,
      col: head.col
    };

    switch (this.model.direction) {
      case "left":
        payload.col--;
        if (payload.col < 0) {
          payload.col = this.width - 1;
        }
        break;
      case "right":
        payload.col++;
        if (payload.col >= this.width) {
          payload.col = 0;
        }
        break;
      case "up":
        payload.row--;
        if (payload.row < 0) {
          payload.row = this.height - 1;
        }
        break;
      case "down":
        payload.row++;
        if (payload.row >= this.height) {
          payload.row = 0;
        }
        break;
    }

    this.model.queue.addFirst(payload);

    if (this.model.readFromCell(payload.row, payload.col) === 2) {
      this.goalEaten = true;
      this.model.writeToCell(payload.row, payload.col, 0);
    } else {
      this.model.queue.removeLast();
    }

    if (this.goalEaten) {
      this.timer++;
      if (this.timer === 3) {
        this.goalEaten = false;
        this.generateGoal();
        this.timer = 0;
      }
    }
    if (this.model.checkForDeath()) {
      console.log("You died!");
      clearTimeout(run);
      return;
    }
    this.model.updateModel(1);
    this.updateView();
  }

  timer = 0;
  goalEaten = false;

  previusDirection = null;
  keyDown(event) {
    if (event.key === "w" || event.key === "a" || event.key === "s" || event.key === "d") {
      event.preventDefault(); // Prevent default behavior of arrow keys or scrolling
    }

    if (
      (this.model.direction === "left" && event.key === "ArrowRight") ||
      (this.model.direction === "right" && event.key === "ArrowLeft") ||
      (this.model.direction === "up" && event.key === "ArrowDown") ||
      (this.model.direction === "down" && event.key === "ArrowUp")
    ) {
      return;
    } else {
      this.model.controls.left = false;
      this.model.controls.right = false;
      this.model.controls.up = false;
      this.model.controls.down = false;

      if (event.key === "ArrowLeft" || event.key === "a") {
        this.model.controls.left = true;
      } else if (event.key === "ArrowRight" || event.key === "d") {
        this.model.controls.right = true;
      } else if (event.key === "ArrowUp" || event.key === "w") {
        this.model.controls.up = true;
      } else if (event.key === "ArrowDown" || event.key === "s") {
        this.model.controls.down = true;
      }
    }
  }

  keyUp(event) {
    if (event.key === "ArrowLeft" || event.key === "a") {
      this.model.controls.left = false;
    } else if (event.key === "ArrowRight" || event.key === "d") {
      this.model.controls.right = false;
    } else if (event.key === "ArrowUp" || event.key === "w") {
      this.model.controls.up = false;
    } else if (event.key === "ArrowDown" || event.key === "s") {
      this.model.controls.down = false;
    }
  }

  setGrid(height, width) {
    this.model.createModel(height, width);
    this.view.setSize(height, width);
    this.view.createView();
    this.height = height;
    this.width = width;
  }

  height = 0;
  width = 0;

  updateView() {
    this.view.displayBoard(this.model);
  }

  generateGoal() {
    let row = Math.floor(Math.random() * this.height);
    let col = Math.floor(Math.random() * this.width);
    while (this.model.readFromCell(row, col) !== 0) {
      row = Math.floor(Math.random() * this.height);
      col = Math.floor(Math.random() * this.width);
    }
    this.model.writeToCell(row, col, 2);
  }
}

// Model
"use strict";

class Model {
  constructor() {
    this.model = [];
    this.queue = new Queue();
  }

  direction = null;

  controls = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  writeToCell(row, col, value) {
    this.model[row][col] = value;
  }

  readFromCell(row, col) {
    return this.model[row][col];
  }

  createModel(gridheight, gridwidth) {
    for (let row = 0; row < gridheight; row++) {
      const newRow = [];
      for (let col = 0; col < gridwidth; col++) {
        newRow[col] = 0;
      }
      this.model[row] = newRow;
    }
  }

  updateModel(value) {
    for (let i = 0; i < this.queue.size; i++) {
      let part = this.queue.get(i);
      this.writeToCell(part.row, part.col, value);
    }
  }

  checkForDeath() {
    const head = this.queue.getFirst().data;
    for (let i = 1; i < this.queue.size; i++) {
      let part = this.queue.get(i);
      if (head.row == part.row && head.col == part.col) {
        return true;
      }
    }
    return false;
  }
}

// Queue
"use strict";

class Queue {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  addFirst(payload) {
    let new_node = {
      prev: null,
      next: null,
      data: payload
    };

    if (this.head == null) {
      this.head = new_node;
      this.tail = new_node;
      this.size++;
      return new_node;
    }

    let first_node = this.head;
    first_node.prev = new_node;
    new_node.next = first_node;
    this.head = new_node;
    this.size++;
    return new_node;
  }

  removeLast() {
    if (this.head == null) {
      return "List is empty!";
    }
    let last_node = this.tail;
    if (last_node.prev == null) {
      this.head = null;
      this.tail = null;
      this.size--;
      return last_node;
    } else {
      let prev_node = last_node.prev;
      prev_node.next = null;
      this.tail = prev_node;
      if (prev_node.prev == null) {
        this.head = prev_node;
      }
      this.size--;
      return last_node;
    }
  }

  get(index) {
    if (this.head == null) {
      return null;
    }
    let a_node;
    let i;
    if (index << Math.floor(this.size / 2)) {
      a_node = this.tail;
      i = this.size - 1;
      while (a_node != null) {
        if (i == index) {
          return a_node.data;
        }
        a_node = a_node.prev;
        i--;
      }
    } else {
      i = 0;
      a_node = this.head;
      while (a_node != null) {
        if (i == index) {
          return a_node.data;
        }
        a_node = a_node.next;
        i++;
      }
    }
    return null;
  }

  getFirst() {
    if (this.head == null) {
      return null;
    }
    return this.head;
  }
}

// Snake
"use strict";

window.addEventListener("load", start);

function start() {
  let controller = new Controller();
  controller.setGrid(20, 30);
  controller.startGame();
}

// View
"use strict";

class View {
  constructor(controller) {
    this.controller = controller;
  }

  gridheight = 0;
  gridwidth = 0;

  setSize(height, width) {
    this.gridheight = height;
    this.gridwidth = width;
  }

  displayBoard(model) {
    const cells = document.querySelectorAll("#grid .cell");
    for (let row = 0; row < this.gridheight; row++) {
      for (let col = 0; col < this.gridwidth; col++) {
        const index = row * this.gridwidth + col;

        switch (model.readFromCell(row, col)) {
          case 0:
            cells[index].classList.remove("player", "goal");
            break;
          case 1:
            cells[index].classList.add("player");
            cells[index].classList.remove("goal");
            break;
          case 2:
            cells[index].classList.add("goal");
            break;
        }
      }
    }
  }

  createView() {
    const board = document.querySelector("#grid");
    board.style.setProperty("--GRID_WIDTH", this.gridwidth);
    for (let row = 0; row < this.gridheight; row++) {
      for (let col = 0; col < this.gridwidth; col++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        board.appendChild(cell);
      }
    }
  }
}
