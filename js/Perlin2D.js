/*global canvas */
/*jslint browser: true, devel: true, passfail: false, eqeq: false, plusplus: true, sloppy: true, vars: true*/

var Perlin2D = function (config) {
    this.cellSize = config.cellSize || 100;
    this.colour = config.colour || false;
    this.ctx = config.ctx;
    this.canvas = config.canvas;
    this.showLattice = config.showLattice;
    this.height = this.canvas.height;
    this.width = this.canvas.width;

    this.createLatticeArray();
    this.drawPerlin();
    if (this.showLattice)
        this.drawLatticeVectors();
};

/*
 *  fdpoly: Fifth-dimensional polynomal interpolation
 *  More information here: https://en.wikipedia.org/wiki/Cubic_Hermite_spline
 *
 *  @param {number} a0 The lower bounding number of the range
 *  @param {number} a1 The higher bounding number of the range
 *  @param {number} w The percentage value (as a decimal between 0 and 1, inclusive) to find in the range [a0, a1].
 */

Perlin2D.fdpoly = function (a0, a1, w) {
    var iw = (6 * Math.pow(w, 5)) - (15 * Math.pow(w, 4)) + (10 * Math.pow(w, 3));
    var value = (1 - iw) * a0 + (iw * a1);
    return value;
}

/*
 *  dotProduct: returns the dot product of two vectors
 */

Perlin2D.prototype.dotProduct = function (ix, iy, x, y) {
    x /= this.cellSize;
    y /= this.cellSize;

    // Precomputed (or otherwise) gradient vectors at each grid point X,Y
    var gradient = this.lattice.grid;

    // Compute the distance vector
    var dx = x - ix;
    var dy = y - iy;

    var value = (dx * gradient[iy][ix][0] + dy * gradient[iy][ix][1]);

    // Compute the dot-product
    return value;
}

Perlin2D.prototype.createLatticeArray = function () {
    // Create a 2D array for the lattice
    this.lattice = {
        width: Math.ceil(this.width / this.cellSize) + 1,
        height: Math.ceil(this.height / this.cellSize) + 1
    };

    this.lattice.grid = new Array(this.lattice.height);
    for (var i = 0; i < this.lattice.height; i++) {
        this.lattice.grid[i] = new Array(this.lattice.width);
    }

    // Fill the lattice with random gradient vectors
    for (var cellY = 0; cellY < this.lattice.height; cellY++) {
        for (var cellX = 0; cellX < this.lattice.width; cellX++) {
            var angle = Math.floor(Math.random() * 16) / 16 * Math.PI * 2;
            this.lattice.grid[cellY][cellX] = [Math.cos(angle), Math.sin(angle)];
        }
    }
}

Perlin2D.prototype.calculatePoint = function (x, y) {
    // Calculate the displacement of the corners of the lattice cell relative to the current pixel
    var x0 = Math.floor(x / this.cellSize);
    var x1 = x0 + 1;
    var y0 = Math.floor(y / this.cellSize);
    var y1 = y0 + 1;

    // Interpolation weight
    var sx = x / this.cellSize - x0;
    var sy = y / this.cellSize - y0;

    // Calculate the gradient values at the sample point by taking the dot product of the displacement vectors and their respective gradient vectors
    var n00 = this.dotProduct(x0, y0, x, y);
    var n10 = this.dotProduct(x1, y0, x, y);
    var n01 = this.dotProduct(x0, y1, x, y);
    var n11 = this.dotProduct(x1, y1, x, y);

    // Interpolate the four gradient values at the current pixel
    var ix0 = Perlin2D.fdpoly(n00, n10, sx);
    var ix1 = Perlin2D.fdpoly(n01, n11, sx);
    var value = Perlin2D.fdpoly(ix0, ix1, sy);
    value += 1 / Math.sqrt(2)
    value /= (1 / Math.sqrt(2)) * 2;

    return value;
}

Perlin2D.prototype.drawPerlin = function () {
    var image = new ImageData(this.width, this.height);

    // Cycle through all pixels
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            var colour = this.calculatePoint(x, y) * 255;
            if (this.colour) {
                image.data[(x * 4) + (y * 4 * this.width) + 0] = 255 - (colour * (1 - x / canvas.width));
                image.data[(x * 4) + (y * 4 * this.width) + 1] = 255 - (colour * y / canvas.height);
                image.data[(x * 4) + (y * 4 * this.width) + 2] = 255 - (colour * 2 * x / canvas.width);
                image.data[(x * 4) + (y * 4 * this.width) + 3] = 255;
            } else {
                image.data[(x * 4) + (y * 4 * this.width) + 0] = colour;
                image.data[(x * 4) + (y * 4 * this.width) + 1] = colour;
                image.data[(x * 4) + (y * 4 * this.width) + 2] = colour;
                image.data[(x * 4) + (y * 4 * this.width) + 3] = 255;
            }
        }
    }
    this.ctx.putImageData(image, 0, 0);
}

Perlin2D.prototype.drawLatticeVectors = function () {
    this.ctx.strokeStyle = 'rgba(45, 161, 222, 0.53)';
    this.ctx.fillStyle = 'rgba(45, 161, 222, 0.53)';
    for (var cellY = 0; cellY < this.lattice.height; cellY++) {
        for (var cellX = 0; cellX < this.lattice.width; cellX++) {
            var vx = this.lattice.grid[cellY][cellX][0] * this.cellSize;
            var vy = this.lattice.grid[cellY][cellX][1] * this.cellSize;
            var x = cellX * this.cellSize;
            var y = cellY * this.cellSize;

            // Draw the vector
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + vx, y + vy);
            this.ctx.stroke();
            this.ctx.closePath();

            // Draw the dot
            this.ctx.beginPath();
            this.ctx.rect(x - 4, y - 4, 8, 8);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.closePath();

            // Draw the arrow dot
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(45, 161, 222, 0.53)';
            this.ctx.ellipse(x + vx, y + vy, 2.5, 2.5, 0, 0, Math.PI * 2)
            this.ctx.fill();
            this.ctx.closePath();
        }
    }
}
