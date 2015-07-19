/*global canvas */
/*jslint browser: true, devel: true, passfail: false, eqeq: false, plusplus: true, sloppy: true, vars: true*/

var Perlin = function (config) {
    this.dimensions = config.dimensions || 2;
    this.cellSize = config.cellSize || 100;
    this.colour = config.colour || false;
    this.ctx = config.ctx;
    this.canvas = config.canvas;
    this.showLattice = config.showLattice;
    this.height = this.canvas.height;
    this.width = this.canvas.width;
    this.depth = this.canvas.width;

    this.createLatticeArray();
    this.drawPerlin2D();
    if (this.showLattice)
        this.drawLatticeVectors();
};

Perlin.gradients3D = [
    [0, 1, 1],
    [0, 1, -1],
    [0, -1, 1],
    [0, -1, -1],
    [1, 0, 1],
    [1, 0, -1],
    [-1, 0, 1],
    [-1, 0, -1],
    [1, 1, 0],
    [1, -1, 0],
    [-1, 1, 0],
    [-1, -1, 0]
];

/*
 *  fdpoly: Fifth-dimensional polynomal interpolation
 *  More information here: https://en.wikipedia.org/wiki/Cubic_Hermite_spline
 *
 *  @param {number} a0 The lower bounding number of the range
 *  @param {number} a1 The higher bounding number of the range
 *  @param {number} w The percentage value (as a decimal between 0 and 1, inclusive) to find in the range [a0, a1].
 */

Perlin.fdpoly = function (a0, a1, w) {
    var iw = (6 * Math.pow(w, 5)) - (15 * Math.pow(w, 4)) + (10 * Math.pow(w, 3));
    var value = (1 - iw) * a0 + (iw * a1);
    return value;
}

/*
 *  dotProduct: returns the dot product of two vectors
 */

Perlin.prototype.dotProduct = function (ix, iy, iz, x, y, z) {
    x /= this.cellSize;
    y /= this.cellSize;
    if (this.dimensions === 3)
        z /= this.cellSize;

    // Precomputed (or otherwise) gradient vectors at each grid point X,Y
    var gradient = this.lattice.grid;

    // Compute the distance vector
    var dx = x - ix;
    var dy = y - iy;
    if (this.dimensions === 3)
        var dz = z - iz;

    if (this.dimensions === 3)
        var value = (dx * gradient[iy][ix][iz][0] + dy * gradient[iy][ix][iz][1] + dz * gradient[iy][ix][iz][2]);

    if (this.dimensions === 2)
        var value = (dx * gradient[iy][ix][0] + dy * gradient[iy][ix][1]);

    return value;

}

Perlin.prototype.createLatticeArray = function () {
    // Create a 3D array for the lattice
    this.lattice = {
        width: Math.ceil(this.width / this.cellSize) + 1,
        height: Math.ceil(this.height / this.cellSize) + 1,
        depth: Math.ceil(this.depth / this.cellSize) + 1
    };

    this.lattice.grid = new Array(this.lattice.height);
    for (var i = 0; i < this.lattice.height; i++) {
        this.lattice.grid[i] = new Array(this.lattice.width);
        for (var j = 0; j < this.lattice.width; j++) {
            this.lattice.grid[i][j] = new Array(this.lattice.depth);
        }
    }

    // Fill the lattice with random gradient vectors
    if (this.dimensions === 3) {
        for (var cellY = 0; cellY < this.lattice.height; cellY++) {
            for (var cellX = 0; cellX < this.lattice.width; cellX++) {
                for (var cellZ = 0; cellZ < this.lattice.depth; cellZ++) {
                    this.lattice.grid[cellY][cellX][cellZ] = Perlin.gradients3D[Math.floor(Math.random() * 12)];
                }
            }
        }
    } else if (dimensions === 2) {
        for (var cellY = 0; cellY < this.lattice.height; cellY++) {
            for (var cellX = 0; cellX < this.lattice.width; cellX++) {
                var angle = Math.floor(Math.random() * 16) / 16 * Math.PI * 2;
                this.lattice.grid[cellY][cellX] = [Math.cos(angle), Math.sin(angle)];
            }
        }
    }
}
Perlin.prototype.calculatePoint = function (x, y, z) {
    // Calculate the displacement of the corners of the lattice cell relative to the current pixel
    var x0 = Math.floor(x / this.cellSize);
    var x1 = x0 + 1;
    var y0 = Math.floor(y / this.cellSize);
    var y1 = y0 + 1;
    var z0 = Math.floor(z / this.cellSize);
    var z1 = z0 + 1;

    // Interpolation weight
    var sx = x / this.cellSize - x0;
    var sy = y / this.cellSize - y0;
    var sz = z / this.cellSize - z0;

    // Calculate the gradient values at the sample point by taking the dot product of the displacement vectors and their respective gradient vectors
    if (this.dimensions === 2) {
        var n000 = this.dotProduct(x0, y0, x, y);
        var n100 = this.dotProduct(x1, y0, x, y);
        var n010 = this.dotProduct(x0, y1, x, y);
        var n110 = this.dotProduct(x1, y1, x, y);
    } else if (this.dimensions === 3) {
        var n000 = this.dotProduct(x0, y0, z0, x, y, z);
        var n100 = this.dotProduct(x1, y0, z0, x, y, z);
        var n010 = this.dotProduct(x0, y1, z0, x, y, z);
        var n110 = this.dotProduct(x1, y1, z0, x, y, z);
        var n001 = this.dotProduct(x0, y0, z1, x, y, z);
        var n101 = this.dotProduct(x1, y0, z1, x, y, z);
        var n011 = this.dotProduct(x0, y1, z1, x, y, z);
        var n111 = this.dotProduct(x1, y1, z1, x, y, z);
    }

    // Interpolate the four gradient values at the current pixel
    var ix00 = Perlin.fdpoly(n000, n100, sx);
    var ix10 = Perlin.fdpoly(n010, n110, sx);
    var ix01 = Perlin.fdpoly(n001, n101, sx);
    var ix11 = Perlin.fdpoly(n011, n111, sx);
    var iy0 = Perlin.fdpoly(ix00, ix10, sy);
    var iy1 = Perlin.fdpoly(ix01, ix11, sy);
    var iz = Perlin.fdpoly(iy0, iy1, sz);
    iz += 1 / Math.sqrt(3)
    iz /= (1 / Math.sqrt(3)) * 2;

    return iz;
}

Perlin.prototype.drawPerlin2D = function (speed) {
    speed = speed || 1;
    this.currentSlice = ((this.currentSlice + speed) % this.depth) || 0;
    console.log(this.currentSlice);

    var image = new ImageData(this.width, this.height);

    // Cycle through all pixels
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            var colour = this.calculatePoint(x, y, this.currentSlice) * 255;
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.putImageData(image, 0, 0);
}

Perlin.prototype.advance = function (speed) {
    this.drawPerlin2D(speed);
}

Perlin.prototype.drawLatticeVectors = function () {
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
