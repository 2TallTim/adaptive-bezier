

var MAX_DEGREE = 8;
var MIN_DEGREE = 3;

var controls = [];
var renderer;


var BezierRenderer = function(canvas){
    BezierRenderer.canvas = canvas;
    BezierRenderer.degree = 5;
    BezierRenderer.ctx = canvas.getContext('2d');
    BezierRenderer.demoU = 0.5;
    BezierRenderer.showDCsubdiv = false;
    BezierRenderer.animDemoU = false;
    BezierRenderer.animHandle = -1;

    BezierRenderer.toggleAnimDemoU = function() {
        if (BezierRenderer.animDemoU) {
            BezierRenderer.animHandle = window.setInterval(BezierRenderer.pingPongDemoU,50);
        }else{
            clearInterval(BezierRenderer.animHandle);
        }
        BezierRenderer.animDemoU = !BezierRenderer.animDemoU;
    }

    //#############################################################################

    BezierRenderer.pingPongDemoU = function(){ //Animate the demoU for the deCasteljau parameter
        var d = new Date();
        var period = 4000;
        if(d.getTime()%(period)>period/2){
            BezierRenderer.demoU = ((period) - d.getTime()%(period))/(period/2);
        }else{
            BezierRenderer.demoU = (d.getTime()%(period))/(period/2);
        }
        BezierRenderer.render();
    }

    //##############################################################################

    BezierRenderer.render = function() {
        ctx = BezierRenderer.ctx;
        
        ctx.clearRect(0,0,BezierRenderer.canvas.width,BezierRenderer.canvas.height);

        //Populate points list
        var ptsList = [];
        for (var i = 0; i <= BezierRenderer.degree; i++) {
            ptsList.push({x:controls[i].x,y:controls[i].y});
        }
        
        if(BezierRenderer.showDCsubdiv){
            //the demo deCasteljau lines
            u = BezierRenderer.demoU;
            pl = ptsList;
            ctx.lineWidth = 3;
            depth = 0;
            while(pl.length>1){
                depth++;
                ctx.strokeStyle = "hsl("+(360 * pl.length/ptsList.length)+",100%,50%";
                lastPl = pl;
                pl = [];
                for (var i = 0; i < lastPl.length-1; i++) {
                    if(depth>1){ //Draw lines, but not control poly lines
                        ctx.beginPath();
                        ctx.moveTo(lastPl[i].x,lastPl[i].y);
                        ctx.lineTo(lastPl[i+1].x,lastPl[i+1].y);
                        ctx.stroke();
                    }
                    pl[i] = {x:lastPl[i].x*u + (lastPl[i+1].x * (1-u)),y:lastPl[i].y*u + (lastPl[i+1].y * (1-u))};
                }

            }
            ctx.strokeStyle = "#000";
            ctx.beginPath();
            ctx.arc(pl[0].x,pl[0].y,8,0,Math.PI*2);
            ctx.fill();
        }

        //Control Polygon

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#888"; 
        ctx.setLineDash([10,10]);
           
        for (var i = 1; i < controls.length && i <= BezierRenderer.degree; i++) {
            ctx.beginPath();
            ctx.moveTo(controls[i-1].x,controls[i-1].y);
            ctx.lineTo(controls[i].x,controls[i].y);
            ctx.stroke();
        }


        //The actual bezier curvef
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#000";
        ctx.setLineDash([0]);
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



var randomize = function(){  //Randomize curve point positions
    for (var i = 0; i < controls.length; i++) {
        c = controls[i]
        c.y  = Math.floor(Math.random() * 600);
        c.x = Math.floor(Math.random() * 800);
        $(c.elem).css("top",c.y-11);
        $(c.elem).css("left",c.x-11);
    }
    BezierRenderer.render();
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

    }
    
    //Renderer object & GUI
    BezierRenderer(canvas);
    var gui = new dat.GUI();

    var degController = gui.add(BezierRenderer, 'degree',MIN_DEGREE,MAX_DEGREE,1);
    var onClickFunc = function(value){
        for (var i = 0; i < controls.length; i++) {
            if(i<BezierRenderer.degree+1)
                $(controls[i].elem).removeClass("hidden");
            else
                $(controls[i].elem).addClass("hidden");
        }
        BezierRenderer.render();
    }
    degController.onChange(onClickFunc);//Redraw when the parameters are changed
    
    gui.add(this, 'randomize');

    var du = gui.add(BezierRenderer,'demoU',0,1,0.01).listen();

    du.onChange(function(value){
        BezierRenderer.render();
    });

    gui.add(BezierRenderer,'showDCsubdiv').onChange(function(value){
        BezierRenderer.render();
    });

    gui.add(BezierRenderer,'toggleAnimDemoU');
    randomize();
    onClickFunc(0); //Redraw when we load the page

};