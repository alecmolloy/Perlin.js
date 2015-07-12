var dpr = window.devicePixelRatio || 1;

var canvas = document.getElementById('canvas');
//canvas.width = canvas.width * dpr;
//canvas.height = canvas.height * dpr;
//canvas.style.width = (canvas.width / dpr) + 'px';
//canvas.style.height = (canvas.height / dpr) + 'px';

var ctx = canvas.getContext('2d');

var perlin = new Perlin2D({
    width: canvas.width,
    height: canvas.height,
    cellSize: 64
})
