

var MAX_DEGREE = 8;
var MIN_DEGREE = 3;

var controls = [];
var renderer;

var BezierRenderer = function(canvas){
    BezierRenderer.canvas = canvas;
    BezierRenderer.degree = 3;
    BezierRenderer.ctx = canvas.getContext('2d');
    
    BezierRenderer.render = function() {
        ctx = BezierRenderer.ctx;
        
        ctx.clearRect(0,0,BezierRenderer.canvas.width,BezierRenderer.canvas.height);

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(controls[0].x,controls[0].y);
        
        var ptsList = [{x:controls[0].x,y:controls[0].y}];        
        for (var i = 1; i < controls.length && i <= BezierRenderer.degree; i++) {
            ctx.lineTo(controls[i].x,controls[i].y);
            ptsList.push({x:controls[i].x,y:controls[i].y});
        }
        ctx.stroke();

        ctx.beginPath();

        for (var u=0; u<1; u+=0.01){
            pl = ptsList;
            while(pl.length>1){
                lastPl = pl;
                pl = [];
                for (var i = 0; i < lastPl.length-1; i++) {
                    pl[i] = {x:lastPl[i].x*u + (lastPl[i+1].x * (1-u)),y:lastPl[i].y*u + (lastPl[i+1].y * (1-u))};
                }
            }
            ctx.lineTo(pl[0].x,pl[0].y);
        }
        ctx.stroke();
    }
}
var Control = function(parent) {
    this.controlWrap = document.createElement('div');
    this.controlWrap.className = "controlWrap";
    parent.append(this.controlWrap);

    this.elem = document.createElement('div');
    this.elem.className = "control";
    this.controlWrap.append(this.elem);

    this.x = this.y = 0;
    this.setPos = function(_x,_y){
        this.x = _x+11;
        this.y = _y+11;
    };
    var self = this
    $(this.elem).draggable({
        containment: "parent",
        drag: function(event,ui){
            self.setPos(ui.position.left,ui.position.top);
            BezierRenderer.render();
        }
    });
}
window.onload = function() {
  //Create canvas & wrap elements
    var canvasWrap = document.createElement('div');
    canvasWrap.id = "canvasWrap";
    document.body.appendChild(canvasWrap);

    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvasWrap.appendChild(canvas);
    ctx = canvas.getContext('2d');


    //Create controls and add to list
    for (var i = 0; i <= MAX_DEGREE; i++) {
        c = new Control(canvasWrap);
        controls.push(c);
        c.y  = Math.floor(Math.random() * 600);
        c.x = Math.floor(Math.random() * 800);
        $(c.elem).css("top",c.y-11);
        $(c.elem).css("left",c.x-11);
    }

    //Renderer object & GUI
    BezierRenderer(canvas);
    var gui = new dat.GUI();
    var degController = gui.add(BezierRenderer, 'degree',MIN_DEGREE,MAX_DEGREE,1);
    degController.onChange(function(value){
    for (var i = 0; i < controls.length; i++) {
        if(i<BezierRenderer.degree+1)
            $(controls[i].elem).removeClass("hidden");
        else
            $(controls[i].elem).addClass("hidden");
    }
    BezierRenderer.render();
    });
};