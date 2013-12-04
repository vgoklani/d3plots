function DrawSparkline(elementSelector, lines, options){

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

$(elementSelector).html("<div id='sparkPlot'></div><div id='sparkBars'></div>");

function findYIntercept(line,threshold){
    for(var i=0; i<line.length-1; i++){
        if((line[i][1]<threshold && line[i+1][1]<threshold) || (line[i][1]>threshold && line[i+1][1]>threshold)){
            continue;
        }
        
        var xIntercept = line[i][0] + (line[i+1][0] - line[i][0])/(line[i+1][1] - line[i][1])*(threshold - line[i][1]);
        var yIntercept = threshold;
        return {"breakStep":i,"breakPoint":[xIntercept,yIntercept]};
    }
    // didn't intercept
    return null;    
}

var yScale=null;
function plotTimeseries(){
    $(elementSelector).width(opts.width+200);

    var xMin = d3.min(lines, function(d){return d3.min(d,function(d){return d[0];})});
    var xMax = d3.max(lines, function(d){return d3.max(d,function(d){return d[0];})});
    var yMin = d3.min(lines, function(d){return d3.min(d,function(d){return d[1];})});
    var yMax = d3.max(lines, function(d){return d3.max(d,function(d){return d[1];})});
    yMax = yMax*1.01;
    
    var h=opts.height;
    var w=opts.width;
	var margin = opts.margin;
	yScale = d3.scale.linear().domain([yMin, yMax]).range([h - margin, 0 + margin]);
	var xScale = d3.scale.linear().domain([xMin, xMax]).range([0 + margin, w - margin]);
	var colourScale = d3.scale.linear().domain([0, lines.length]).range([0,360]);

    var theThreshold = yMax;

	var g = d3.select(elementSelector+" #sparkPlot").append("svg:svg")
        .attr("width", w)
        .attr("height", h)
		.append("svg:g")
        .attr("id","sparklineGroup");

	var line = d3.svg.line()
        .x(function(d) { return xScale(d[0]); })
        .y(function(d) { return yScale(d[1]); })
	
    // initialise the histogram
    initHistogram(getSojournHistogram(lines[0],1,yScale));
    
    g.selectAll('path.mouseCatcher')
        .data(lines)
        .enter()
            .append("svg:path")
            .attr("d", line)
            .attr("id",function(d,i){
                d.target_id = "line_"+i;
                return "catcher_"+i;
            })
            .attr("class","mouseCatcher")
            .on("mouseover",function(d,i){
						var lineId = "line_"+i;
                        d3.select(elementSelector+" #"+lineId).classed("hovering",true);
                    }
                )
            .on("mouseout",function(d,i){
                        var lineId = "line_"+i;
                        d3.select(elementSelector+" #"+lineId).classed("hovering",false);
                })
            .on("click",function(d){
                    // clear all active classes on a click
                    d3.selectAll(elementSelector+" .activeLine").classed("activeLine",false);
                    d3.select(elementSelector+" #"+d.target_id).classed("activeLine",true);
                    updateHistogram(getSojournHistogram(d,1,yScale));
                });

    g.selectAll('path.sparkline')
        .data(lines)
        .enter()
            .append("svg:path")
            .attr("d", line)            
            .attr("id",function(d,i){return "line_"+i;})
            .attr("class","sparkline")
            .on("click",function(d,i){
                    // clear all active classes on a click
                    d3.selectAll(elementSelector+" .activeLine").classed("activeLine",false);
                    d3.select(elementSelector+" #line_"+i).classed("activeLine",true);
                    updateHistogram(getSojournHistogram(d,1,yScale));
                });

    var xAxis = d3.svg.axis()
                        .scale(xScale)
                        .orient("bottom")
                        .ticks(5);
    var yAxis = d3.svg.axis()
                        .scale(yScale)
                        .orient("left")
                        .ticks(5);
    
    g.append("g")
        .attr("class", "axis")  //Assign "axis" class
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
            .attr("x", w/2.0)
            .attr("y", h-5)
            .text(opts.xlabel);
    }
    if(opts.ylabel){
        g.append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("y", +5)
            .attr("dy", ".75em")
            .attr("x", -h/2.0)
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
    $(elementSelector+" #sparkBars").empty();
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

	var svg = d3.select(elementSelector+" #sparkBars").append("svg")
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

    var svg = d3.select(elementSelector+" #sparkBars svg g");

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

    var svg = d3.select(elementSelector+" #sparkBars svg g");

    var bar = svg.selectAll(".bar")
        .data(data)
            .select("rect")
            .transition()
                .duration(1000)
                .attr("width", function(d) { return y(d.y); });

}

plotTimeseries();

}
