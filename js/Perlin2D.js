/*global canvas */
/*jslint browser: true, devel: true, passfail: false, eqeq: false, plusplus: true, sloppy: true, vars: true*/


var Perlin2D = function (config) {
    this.width = config.width || canvas.width;
    this.height = config.height || canvas.height;
    this.cellSize = config.cellSize || 100;

    this.createLatticeArray();
    this.drawPixels();
//    this.drawLatticeVectors();
};

Perlin2D.prototype.createLatticeArray = function () {
    // Create a 2D array for the lattice
    this.lattice = {
        x: Math.ceil(this.width / this.cellSize) + 1,
        y: Math.ceil(this.height / this.cellSize) + 1
    };

    this.lattice.grid = new Array(this.lattice.x);
    for (var i = 0; i < this.lattice.x; i++) {
        this.lattice.grid[i] = new Array(this.lattice.y);
    }

    // Seed the lattice with random gradient vectors
    for (var m = 0; m < this.lattice.x; m++) {
        for (var n = 0; n < this.lattice.y; n++) {
            this.lattice.grid[m][n] = [Math.random() * 2 - 1, Math.random() * 2 - 1];
        }
    }
}

Perlin2D.prototype.drawLatticeVectors = function () {
    ctx.fillStyle = '#626770';
    ctx.strokeStyle = '#626770';
    for (var m = 0; m < this.lattice.x; m++) {
        for (var n = 0; n < this.lattice.y; n++) {
            var vx = this.lattice.grid[m][n][0] * 30;
            var vy = this.lattice.grid[m][n][1] * 30;
            var x = m * this.cellSize;
            var y = n * this.cellSize;

            // Draw the vector
            ctx.beginPath()
            ctx.moveTo(x, y);
            ctx.lineTo(x + vx, y + vy);
            ctx.stroke();
            ctx.closePath();

            // Draw the dot
            ctx.beginPath()
            ctx.ellipse(x, y, 4, 4, 0, 0, Math.PI * 2)
            ctx.fill();
            ctx.closePath();

            // Draw the arrow dot
            ctx.beginPath()
            ctx.ellipse(x + vx, y + vy, 2.5, 2.5, 0, 0, Math.PI * 2)
            ctx.fill();
            ctx.closePath();
        }
    }
}

Perlin2D.prototype.drawPixels = function () {
    var image = new ImageData(canvas.width, canvas.height);

    // Cycle through all pixels
    for (var x = 0; x < canvas.width; x++) {
        for (var y = 0; y < canvas.width; y++) {
            var cellM = Math.floor(x / this.cellSize);
            var cellN = Math.floor(y / this.cellSize);

            var c00 = this.lattice.grid[cellM][cellN];
            var c01 = this.lattice.grid[cellM + 1][cellN];
            var c10 = this.lattice.grid[cellM][cellN + 1];
            var c11 = this.lattice.grid[cellM + 1][cellN + 1];


            // Calculate the displacement of the corners of the lattice cell relative to the current pixel
            var dv00 = [x - c00[0], y - c00[1]];
            var dv01 = [x - c01[0], y - c01[1]];
            var dv10 = [x - c10[0], y - c10[1]];
            var dv11 = [x - c11[0], y - c11[1]];

            // Calculate the gradient values at the sample point by taking the dot product of the displacement vectors and their respective gradient vectors
            var dp00 = Math.dotProduct(dv00, c00);
            var dp01 = Math.dotProduct(dv01, c01);
            var dp10 = Math.dotProduct(dv10, c10);
            var dp11 = Math.dotProduct(dv11, c11);

            // Interpolate the four gradient values at the current pixel
            image.data[((x * 4) + (canvas.width * y))] = Math.floor(Math.abs(dp00));
            image.data[((x * 4) + (canvas.width * y)) + 1] = Math.floor(Math.abs(dp10));
            image.data[((x * 4) + (canvas.width * y)) + 2] = Math.floor(Math.abs(dp01));
            image.data[((x * 4) + (canvas.width * y)) + 3] = Math.floor(Math.abs(dp11));
        }
    }
    console.log(image);
    ctx.putImageData(image, 0, 0);
}
