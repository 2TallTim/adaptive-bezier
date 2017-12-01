

var MAX_DEGREE = 9;
var MIN_DEGREE = 3;

var MAX_DEPTH = 8;

var controls = [];
var renderer;
var preset = 0;

function recursiveBezier(ptsList,stopCond,depth=0) {

    if(depth>=MAX_DEPTH || stopCond(ptsList)){
        return [ptsList[0]]; //always return start point of seg
    }else{
        u = 0.5; //Split in the middle
        let pl = ptsList;
        let leftPts = [pl[0]];
        let rightPts = [pl[pl.length-1]];
        while(pl.length>1){
            lastPl = pl;
            pl = [];
            for (var i = 0; i < lastPl.length-1; i++) {
                //eval deCasteljau
                pl[i] = {x:lastPl[i].x*u + (lastPl[i+1].x * (1-u)),
                         y:lastPl[i].y*u + (lastPl[i+1].y * (1-u))};
            }
            leftPts.push(pl[0]);
            rightPts.push(pl[pl.length-1]);
        }
        let leftRec  = recursiveBezier(leftPts, stopCond, depth+1);
        let rightRec = recursiveBezier(rightPts, stopCond, depth+1);
        rightRec.reverse();
        return leftRec.concat(rightRec);
    }
}

function dot(a,b){ //vector dot product
    return (a.x*b.x + a.y*b.y);
}
function vecsub(a,b){
    return {x:a.x - b.x,y:a.y - b.y} 
}

var sumDist = function(ptsList){ //Sum of distances adaptive method
    sum = 0;
    b = vecsub(ptsList[0],ptsList[ptsList.length-1]);
    for (var i = 1; i < ptsList.length-1; i++) {
        a = vecsub(ptsList[0],ptsList[i]);
        q = dot(a,b)/dot(b,b);
        q = {x:b.x*q,y:b.y*q};
        rej = vecsub(a,q);
        sum+= Math.sqrt(dot(rej,rej));
    }
    return (sum<BezierRenderer.DISTANCE_EPSILON);
}

var uniform = function(ptsList){
    return false;
}

var sumAngles = function(ptsList) {
    sum = 0;
    for (var i = 1; i < ptsList.length-1; i++ ){
        a = vecsub(ptsList[i],ptsList[i-1]);
        b = vecsub(ptsList[i+1],ptsList[i]);
        sum+= Math.abs(Math.atan2(a.y,a.x) - Math.atan2(b.y,b.x));
    }
    return (sum<BezierRenderer.ANGLE_EPSILON);
}

function orient(a,b,c){
    //Orientation predicate
    return val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

var convHull = function(ptsList){
    //Generate hull with "gift wrap" algorithm.

    hull = [];
    l = 0;
    for (var i = 0; i < ptsList.length; i++) {
        if (ptsList[i].x < ptsList[l].x)
            l = i;
    }
    p = l;
    do{
        hull.push(ptsList[p]);
        q = (p+1)%(ptsList.length);
        for (var i = 0; i < ptsList.length; i++) {
            if(orient(ptsList[p],ptsList[i],ptsList[q])<0)
                q = i;
        }
        p = q;
    }while(p!=l);
    //Calculate area
    areasum = 0;
    n = hull.length
    for (var i = 0; i < n; i++) {
        areasum+= (hull[i].x*hull[(i+1)%n].y - hull[(i+1)%n].x*hull[i].y );
    }
    return (areasum<BezierRenderer.AREA_EPSILON*2);

}

var BezierRenderer = function(canvas){
    BezierRenderer.canvas = canvas;
    BezierRenderer.degree = 5;
    BezierRenderer.ctx = canvas.getContext('2d');
    BezierRenderer.demoU = 0.5;
    BezierRenderer.showDCsubdiv = false;
    BezierRenderer.animDemoU = false;
    BezierRenderer.animHandle = -1;
    BezierRenderer.alternateColors = true;
    BezierRenderer.DISTANCE_EPSILON = 0.25;
    BezierRenderer.ANGLE_EPSILON = 0.1;
    BezierRenderer.AREA_EPSILON = 0.5;
    BezierRenderer.adaptiveFunc = uniform;
    BezierRenderer.adaptiveFuncName = "uniform";

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
        var period = 6000;
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
        
        //deCasteljau
        var dcpt;

        if(BezierRenderer.showDCsubdiv){
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

            dcpt = pl[0];
        }

        //Control Polygon

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#999";
        ctx.setLineDash([10,15]);
           
        for (var i = 1; i < controls.length && i <= BezierRenderer.degree; i++) {
            ctx.beginPath();
            ctx.moveTo(controls[i-1].x,controls[i-1].y);
            ctx.lineTo(controls[i].x,controls[i].y);
            ctx.stroke();
        }

        //The actual bezier curve

        bez_pts = recursiveBezier(ptsList,BezierRenderer.adaptiveFunc);
        bez_pts_dup = [bez_pts[0]];

        //deduplicate bez_pts
        for (var i = 1; i < bez_pts.length; i++) {
            if(bez_pts[i].x != bez_pts[i-1].x || bez_pts[i].y != bez_pts[i-1].y){
                bez_pts_dup.push(bez_pts[i]);
            } 
        }
        bez_pts = bez_pts_dup;


        ctx.lineWidth = 13;
        ctx.setLineDash([0]);
        ctx.lineCap = 'round';

        for (var i = 1; i < bez_pts.length; i++) {
            if (BezierRenderer.alternateColors && i%2 == 0) {
                ctx.strokeStyle = "#0F0";
            }else{
                ctx.strokeStyle = "#000";
            }
            ctx.beginPath();
            ctx.moveTo(bez_pts[i-1].x,bez_pts[i-1].y);
            ctx.lineTo(bez_pts[i].x,bez_pts[i].y);
            ctx.stroke();
        }

        $("#segcount").text(""+(bez_pts.length-1)+" segments");
        if(BezierRenderer.showDCsubdiv){
            ctx.fillStyle = "#F00";
            ctx.beginPath();
            ctx.arc(pl[0].x,pl[0].y,11,0,Math.PI*2);
            ctx.fill();
        }
    }

}



var randomize = function(){  //Randomize curve point positions
    for (var i = 0; i < controls.length; i++) {
        c = controls[i]
        c.y  = Math.floor(Math.random() * (canvas.height - 20))+ 10;
        c.x = Math.floor(Math.random() * (canvas.width - 20))+ 10;
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

function exportPreset(){
    psx = [];
    psy = [];
    for (var i = 0; i < controls.length; i++) {
        psx.push(controls[i].x);
        psy.push(controls[i].y);
    }
    console.log("psx = ["+psx+"];\npsy = ["+psy+"];");
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

    var segcount = document.createElement('p');
    segcount.id = "segcount";
    canvasWrap.appendChild(segcount);

    //GUI Controls

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
    degController.listen();


    redrawFunc = function(value){
        BezierRenderer.render();
    };

    gui.add(window,"MAX_DEPTH",3,10,1).onChange(redrawFunc).name("Max subdivison depth");

    gui.add(BezierRenderer,"DISTANCE_EPSILON",0.001,1).onChange(redrawFunc).name("Distance Epsilon");

    gui.add(BezierRenderer,"ANGLE_EPSILON",0.01,0.3).onChange(redrawFunc).name("Angle Epsilon");

    gui.add(BezierRenderer,"AREA_EPSILON",0.01,1).onChange(redrawFunc).name("Area Epsilon");

    gui.add(BezierRenderer,'alternateColors').onChange(redrawFunc).name("Alternate colors");

    gui.add(this, 'randomize');

    gui.add(BezierRenderer, 'adaptiveFuncName', { "Uniform": "uniform", "Sum Of Distances": "sumDist", "Sum of Angles": "sumAngles", "Hull Area":"convHull"} ).onChange(function(value){
        if(value=="uniform"){
            BezierRenderer.adaptiveFunc = uniform;
        }else if(value == "sumDist"){
            BezierRenderer.adaptiveFunc = sumDist;
        }else if(value == "sumAngles"){
            BezierRenderer.adaptiveFunc = sumAngles;
        }else if(value == "convHull"){
            BezierRenderer.adaptiveFunc = convHull;
        }
        BezierRenderer.render();

    }).name("Adaptive Criterion");

    gui.add(window,'preset',
    {
        "---select---":0,
        "Cusp":1,
        "Zig-Zag":2,
        "Knot":3,
        "Crossed Arrow":4,
        "High Degr Straight Line":5,
        "Out of Order Line":6,
        "Sharp Turns":7,
        "Angle Worst":8
    }).onChange(function(value){
        if(value == 1){
            BezierRenderer.degree = 3;
            psy = [0,580,0,580];
            psx = [780,0,0,780];
        }else if (value == 2){
            psy = [0, 580, 0,  580, 0,   580, 0,   580, 0,   580];
            psx = [0, 80, 160, 240, 320, 400, 480, 560, 640, 720];
        }else if (value == 3) {
            BezierRenderer.degree = 9;
            psy = [341,446,76,41,204,544,372,220,192,341];
            psx = [475,481,86,631,696,360,80,305,455,475];
        }else if (value == 4){
            BezierRenderer.degree = 4;
            psx = [780,0,780,0,780];
            psy = [0,580,300,0,580];
        }else if (value == 5){
            BezierRenderer.degree = 9;
            psx = [780,709,628,487,337,287,217,138,60,11];
            psy = [11,70,136,242,345,394,447,503,559,580];
        }else if (value == 6){
            BezierRenderer.degree = 9;
            psx = [791,92,172,549,363,470,265,650,742,11];
            psy = [300,300,300,300,300,300,300,300,300,300];
        }else if (value == 7){
            BezierRenderer.degree = 9;
            psx = [0,771,748,721,691,780,780,780,780,780];
            psy = [0,574,555,533,513,11,80,33,56,580];
        }else if (value == 8){
            BezierRenderer.degree = 5;
            psx = [1,781,370,372,781,1,769,499,205,83];
            psy = [581,90,581,1,495,1,1,411,102,94];
        }
        if(value!= 0){
            for (var i = 0; i < psx.length; i++) {
                c = controls[i]
                c.y  = psy[i]+11;
                c.x = psx[i]+11;
                $(c.elem).css("top",psy[i]);
                $(c.elem).css("left",psx[i]);
            }
            for (var i = 0; i < controls.length; i++) {
                if(i<BezierRenderer.degree+1)
                    $(controls[i].elem).removeClass("hidden");
                else
                    $(controls[i].elem).addClass("hidden");
            }
            BezierRenderer.render();
        }
    }).name("Presets");

    var dcFolder = gui.addFolder('deCasteljau Visualizer');

    dcFolder.add(BezierRenderer,'demoU',0,1,0.01).listen().onChange(redrawFunc).name("Subdivision u");

    dcFolder.add(BezierRenderer,'showDCsubdiv').onChange(redrawFunc).name("Show deCasteljau");

    dcFolder.add(BezierRenderer,'toggleAnimDemoU').name("Toggle animation");
    randomize();
    onClickFunc(0); //Redraw when we load the page

};