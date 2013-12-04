function DrawSparklineWithThreshold(elementSelector, lines, options){

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

$(elementSelector).html("<div id='sparkPlot'></div>");

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



function plotTimeseries(data){
    var xMin = d3.min(data, function(d){return d3.min(d,function(d){return d[0];})});
    var xMax = d3.max(data, function(d){return d3.max(d,function(d){return d[0];})});
    var yMin = d3.min(data, function(d){return d3.min(d,function(d){return d[1];})});
	var yMax = d3.max(data, function(d){return d3.max(d,function(d){return d[1];})});
    yMax = yMax*1.01;
    
	var w = opts.width;
	var h = opts.height;
	var margin = opts.margin;
	var yScale = d3.scale.linear().domain([yMin, yMax]).range([h - margin, 0 + margin]);
	var xScale = d3.scale.linear().domain([xMin, xMax]).range([0 + margin, w - margin]);
	var colourScale = d3.scale.linear().domain([0, data.length]).range([0,360]);

    var theThreshold = yMax;

    var bar_drag = d3.behavior.drag()
            .on("drag", function() {
                var increment = yScale.invert(d3.event.y + d3.event.dy) - yScale.invert(d3.event.y);
                theThreshold = (theThreshold+increment>yMax)?yMax:theThreshold+increment;
                theThreshold = (theThreshold<yMin)?yMin:theThreshold;
                
                d3.selectAll(elementSelector+" line.threshold")
                    .attr("y1", yScale(theThreshold))
                    .attr("y2", yScale(theThreshold));

                plotPostThresholdLines(theThreshold,data);
                //$("#the_date").html(dates[current_date]);
            });


	var g = d3.select(elementSelector+" #sparkPlot").append("svg:svg")
        .attr("width", w)
        .attr("height", h)
		.append("svg:g")
        .attr("id","sparklineGroup");

	var line = d3.svg.line()
        .x(function(d) { return xScale(d[0]); })
        .y(function(d) { return yScale(d[1]); })
	
    g.selectAll('path.mouseCatcher')
        .data(data)
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
                });
    g.selectAll('path.sparkline')
        .data(data)
        .enter()
            .append("svg:path")
            .attr("d", line)
            .attr("id",function(d,i){
                return "line_"+i;
            })
            .attr("class","sparkline");
            
	g.append("svg:line")
		.attr("class","axis")
        .attr("x1", xScale(xMin))
        .attr("y1", yScale(yMin))
        .attr("x2", xScale(xMax))
        .attr("y2", yScale(yMin));

	g.append("svg:line")
		.attr("class","axis")
        .attr("x1", xScale(xMin))
        .attr("y1", yScale(yMin))
        .attr("x2", xScale(xMin))
        .attr("y2", yScale(yMax));

	g.append("svg:line")
		.attr("class","threshold")
        .attr("x1", xScale(xMin))
        .attr("y1", yScale(yMax))
        .attr("x2", xScale(xMax))
        .attr("y2", yScale(yMax))
		.call(bar_drag);

    function plotPostThresholdLines(thresh,lines){
        var newLines=[];
        for(var ix in lines){
            if(lines[ix].length){
                // first check the 0th point. If it's above threshold, we're good to go.
                if(lines[ix][0][1]>=thresh){
                    newLines.push(lines[ix])
                }
                else{
                    var intercept = findYIntercept(lines[ix],thresh);
                    if(intercept){
                        var newline = [intercept["breakPoint"]]
                                        .concat(lines[ix]
                                                .slice(
                                                    intercept["breakStep"]+1)
                                                );
                        newLines.push(newline);
                    }
                    /*else{
                        newLines.push([]);
                    }*/
                }
            }
        }
        
        g.selectAll("path.sparklineOverlay").remove();
        g.selectAll('path.sparklineOverlay')
            .data(newLines)
            .enter()
                .append("svg:path")
                .attr("d", line)
                .attr("class","sparklineOverlay")
            /*.update()
                .attr("d", line)
            .exit()
                .remove();*/
    }
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
    //Create Y axis
	g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate("+xScale(xMin)+",0)")
        .call(yAxis);

    /*$(".axis path").css("fill","none");
    $(".axis path").css("stroke","black");
    $(".axis path").css("shape-rendering","crisp-edges");
    $(".axis text").css("font-size","8pt");*/
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

plotTimeseries(lines);

}

























