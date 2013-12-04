function DrawQuantilePlot(elementSelector,lines,options){
    
var opts = {
    "width":550,
    "height":350,
    "margin":40,
    "xlabel":"",
    "ylabel":"",
    "title":""
};

for(var k in options){
    if(k in opts){
        opts[k]=options[k];
    }
}
$(elementSelector).empty();
$(elementSelector).html("<div id='areaPlot'></div><div id='areaBars'></div>");

var yScale=null;

function plotBands(bands){
    $(elementSelector).width(opts.width+200);
    var xMin = lines[0][0][0];
	var xMax = lines[0][lines[0].length-1][0];
	var yMin = d3.min(lines[0], function(d){return d[1];});
	var yMax = d3.max(lines[lines.length-1], function(d){return d[1];});
	
	var w = opts.width;
	var h = opts.height;
	var margin = opts.margin;
	yScale = d3.scale.linear().domain([yMin, yMax]).range([h - margin, 0 + margin]);
	var xScale = d3.scale.linear().domain([xMin, xMax]).range([0 + margin, w - margin]);

	var g = d3.select(elementSelector+" #areaPlot").append("svg:svg")
        .attr("width", w)
        .attr("height", h)
		.append("svg:g");

	var line = d3.svg.line()
        .x(function(d) { return xScale(d[0]); })
        .y(function(d) { return yScale(d[1]); })
	
    var fillPaths=[];
    for(var i=0; i<bands.innerBands.length; i++){
        // check it's an array
        if( Object.prototype.toString.call( bands.innerBands[i] ) === '[object Array]' ) {
            var fillPath = bands.innerBands[i][0].concat(bands.innerBands[i][1].reverse());
            fillPaths.push(fillPath);
        }
    }

    var mouseovers = ["95th percentile", "90th percentile", "50th percentile"];

    g.selectAll('path.sparkline')
        .data(fillPaths)
        .enter()
            .append("svg:path")
            .attr("d", line)
            .attr("class","filledLine")
            .append("svg:title")
                .text(function(d,i){return mouseovers[i];});

    // initialise the histogram
    initHistogram(getSojournHistogram(lines[0],1,yScale));
    
    if(bands.median){
        g.selectAll('path.sparkline')
            .data([bands.median])
            .enter()
                .append("svg:path")
                .attr("d", line)
                .attr("class","medianLine")
                .on("click",function(d){
                        updateHistogram(getSojournHistogram(d,1,yScale));
                    })
                    .append("svg:title").text("median");
    }	

	var theOuterBands = [];
    for(var i in bands.outerBands){
        if( Object.prototype.toString.call( bands.outerBands[i] ) === '[object Array]' ) {
            theOuterBands.push(bands.outerBands[i][0]);
            theOuterBands.push(bands.outerBands[i][1]);
        }
    }
    g.selectAll('path.sparkline')
        .data(theOuterBands)
        .enter()
            .append("svg:path")
            .attr("d", line)
            .attr("stroke-dasharray","5,5")
            .attr("class","outlierLine")
            .append("svg:title")
                .text("99th percentile");

    var xAxis = d3.svg.axis()
                        .scale(xScale)
                        .orient("bottom")
                        .ticks(5);
    var yAxis = d3.svg.axis()
                        .scale(yScale)
                        .orient("left")
                        .ticks(5);
    
    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + yScale(yMin) + ")")
        .call(xAxis);
	g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate("+xScale(xMin)+",0)")
        .call(yAxis);
    if(opts.xlabel){
        g.append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("x", opts.width/2.0)
            .attr("y", opts.height-5)
            .text(opts.xlabel);
    }
    if(opts.ylabel){
        g.append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("y", +5)
            .attr("dy", ".75em")
            .attr("x", -opts.height/2.0)
            .attr("transform", "rotate(-90)")
            .text(opts.ylabel);
    }
    if(opts.title){
        g.append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", w/2.0)
            .attr("y", margin/2.0)
            .text(opts.title);        
    }

}

function getSojournHistogram(line,key,yScale){
    var values=line.map(function(d){return d[key]});
    var data = d3.layout.histogram()
        .bins(yScale.ticks(30))
        (values);
    return data;
}

function initHistogram(data){
    $(elementSelector+" #areaBars").empty();
    var margin = 40,
        w = 200,
        h = opts.height;
        
    var xMin = d3.min(data,function(d){return d.x;});
    var xMax = d3.max(data,function(d){return d.x + d.dx;});
    
    var x = d3.scale.linear()
        .domain([xMin, xMax])
        .range([h - margin, 0 + margin]);

    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([0, w-2*margin]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select(elementSelector+" #areaBars").append("svg")
        .attr("width", w)
        .attr("height", h)
    .append("g");

    var bar = svg.selectAll(".bar")
        .data(data)
    .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d,i) {
                if(i===0){return "translate(0,"+x(0)+")";}
                else{return "translate(" + 0 + "," + (x(d.x)) + ")";}
            });

    bar.append("rect")
        .attr("y", 1)
        .attr("height", x(xMin) - x(xMin+data[0].dx)-1)
        .attr("width", function(d) { return y(0); })
            .append("svg:title")
                .text(function(d) { return d.x; });

    svg.append("text")
        .attr("x", 0)
        .attr("y", margin/2.0)
        .text("x")
        .attr("style","cursor:pointer; cursor: hand; font-weight:bold;")
        .on("click",function(){resetHistogram();});

}

function resetHistogram(){
    var data = getSojournHistogram(lines[0],1,yScale);
    
    var margin = 30,
        w = 200,
        h = opts.height;
    var xMin = d3.min(data,function(d){return d.x;});
    var xMax = d3.max(data,function(d){return d.x + d.dx;});
    
    var x = d3.scale.linear()
        .domain([xMin, xMax])
        .range([h - margin, 0 + margin]);

    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([0, w-2*margin]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select(elementSelector+" #areaBars svg g");

    var bar = svg.selectAll(".bar")
        .data(data)
            .select("rect")
            .transition()
                .duration(1000)
                .attr("width", function(d) { return y(0); });

}
function updateHistogram(data){
    
    var margin = 30,
        w = 200,
        h = opts.height;
    var xMin = d3.min(data,function(d){return d.x;});
    var xMax = d3.max(data,function(d){return d.x + d.dx;});
    
    var x = d3.scale.linear()
        .domain([xMin, xMax])
        .range([h - margin, 0 + margin]);

    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([0, w-2*margin]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select(elementSelector+" #areaBars svg g");

    var bar = svg.selectAll(".bar")
        .data(data)
            .select("rect")
            .transition()
                .duration(1000)
                .attr("width", function(d) { return y(d.y); });

}

var hasMedian=false;
if(lines.length%2 == 1){
    hasMedian=true;
}

var bands={
    "innerBands":[],
    "outerBands":[]
};
for(var i=0; i<Math.floor(lines.length/2.0); i++){
    if(i===0){
        bands.outerBands.push([lines[i],lines[lines.length-i-1]]);
    }
    else{
        bands.innerBands.push([lines[i],lines[lines.length-i-1]]);
    }
}
if(hasMedian){
    bands.median=lines[Math.floor(lines.length/2.0)];
}

plotBands(bands);

}















