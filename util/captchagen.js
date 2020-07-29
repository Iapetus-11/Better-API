const Canvas = require("canvas");
// Canvas.registerFont("./assets/Swift.ttf", { family: "swift" });

function randomText() {
  return [...Array(4)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

class Captcha {
  constructor(x, y) {

    // Initialize canvas
    this.canvas = Canvas.createCanvas(x, y);
    let ctx = this.canvas.getContext('2d');

    // Set background color
    ctx.globalAlpha = 1;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.fillRect(0, 0, x, y);

    for (let i = 0; i < 10 * ((x + y) / 2); i++) {
      ctx.beginPath();
      let color = "#112";
      ctx.fillStyle = color;
      ctx.arc(
        Math.round(Math.random() * x), // X coordinate
        Math.round(Math.random() * y), // Y coordinate
        Math.random(), // Radius
        0, // Start angle
        Math.PI * 2 // End angle
      );
      ctx.fill();
    }

    // Set style for circles
    ctx.fillStyle = "#222";
    ctx.lineWidth = 0;

    // Draw 80 circles
    for (let i = 0; i < 150; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.round(Math.random() * 360) + 20, // X coordinate
        Math.round(Math.random() * 360) + 20, // Y coordinate
        Math.round(Math.random() * 8), // Radius
        0, // Start angle
        Math.PI * 2 // End angle
      );
      ctx.fill();
    }

    // Set style for lines
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 3;

    // draw some lines
    ctx.beginPath();
    let coords = [];
    for (let i = 0; i < 4; i++) {
      if (!coords[i]) coords[i] = [];
      for (let j = 0; j < 5; j++) coords[i][j] = Math.round(Math.random() * 80) + (j * 80);
      if (!(i % 2)) coords[i] = shuffle(coords[i]);
    }

    for (let i = 0; i < coords.length; i++) {
      if (!(i % 2)) {
        for (let j = 0; j < coords[i].length; j++) {
          if (!i) {
            ctx.moveTo(coords[i][j], 0);
            ctx.lineTo(coords[i + 1][j], y);
          } else {
            ctx.moveTo(0, coords[i][j]);
            ctx.lineTo(x, coords[i + 1][j]);
          }
        }
      }
    }

    // Fill all the plotted line strokes
    ctx.stroke();

    // Set position for text
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.translate(Math.floor(x/2), Math.floor(y/2));

    ctx.beginPath();

    // Set style for text
    ctx.font = `bold ${Math.floor(((x + y) / 2) / 2.5)}px serif`;
    ctx.fillStyle = '#222';
    ctx.translate((Math.random() - .5)*(x/4), (Math.random() - .5)*(y/4) + y/6);
    ctx.rotate(Math.random() - .5);

    ctx.beginPath(); // draw to canvas
    this.value = randomText();
    ctx.fillText(this.value, 0, 0);
  };
}

module.exports = Captcha;
