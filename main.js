const http = new MyHttp;
// select * from weather.forecast where woeid in (select woeid from geo.places(1) where text in ("sarasota, fl", "seattle, wa", "edna, tx", "philadelphia, pa", "boston, ma", "minneapolis, mn"))
const myUrl = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%20in%20(%22sarasota%2C%20fl%22%2C%20%22seattle%2C%20wa%22%2C%20%22edna%2C%20tx%22%2C%20%22philadelphia%2C%20pa%22%2C%20%22boston%2C%20ma%22%2C%20%22minneapolis%2C%20mn%22))&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
const myAsiaUrl = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%20in%20(%22tokyo%22%2C%20%22sapporo%22%2C%20%22kyoto%22%2C%20%22fukuoka%22%2C%20%22nagoya%22%2C%20%22osaka%22))&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

let usingUs = true;

//#region Data Aquisition 
async function fetchData() {
  let data = await Promise.all([
    fetch(myUrl).then((response) => response.json()),
    fetch(myAsiaUrl).then((response) => response.json())
  ]);
  return data;
}


fetchData()
  .then(data => main(data[0], data[1]));

//#endregion
  
let main = function(asia, us) {
  const asiaData = asia.query.results.channel;
  const usData = us.query.results.channel;
  let myData = usData;

  let cityTemp = [];

  let t = d3.transition().duration(750);

  // Colors
  // const colorRange = d3.schemePuOr[10];
  // const colorScale = d3.scaleQuantile()
  //   .domain([0, d3.max(cityTemp, function(d) {
  //     return d[1]
  //   })])
  //   .range(colorRange);
  
  const colorScale = d3.scaleLinear()
    .range(["blue", "red"]);

  // Set margins
  let margin = { top: 10, right: 10, bottom: 150, left: 50 };

  // Set image area
  let width = 800 - margin.left - margin.right;
  let height = 600 - margin.top - margin.bottom;

  // Create svg group for full working area size

  let g = d3.select("#chart-area")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  let xAxisGroup = g.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(' + 0 + ',' + height + ')');


  let yAxisGroup = g.append('g')
    .attr('transform', 'translate(' + 50 + ',' + 0 + ')')
    .attr('class', 'y-axis');
    
    
  let x = d3.scaleBand()
    .range([50, width])
    .paddingInner(0.5)
    .paddingOuter(.2);

  let y = d3.scaleLinear()
    .range([height, 0])
    .nice();

    // LABELS
    // X Label Title
    xLabel = g.append("text")
      .attr('class', 'x axis-label')
      .attr('x', width / 2)
      .attr('y', height + 140)
      .attr('font-size', '20px')
      .attr('text-anchor', 'middle')
      .text('Temperature Comparisons');
  
    // Y Label Temperature
    yLabel = g.append('text')
      .attr('class', 'y axis-label')
      .attr('x', -(height/2))
      .attr('y', -0)
      .attr('font-size', '20px')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text('Current Temperature');

      function populateData () {
        myData.forEach(i => {
          const city = i.location.city;
          const temp = i.item.condition.temp;
          cityTemp.push([city, +temp]);
        });

      }
      // SET INTERVAL
      d3.interval(() => {
        cityTemp = [];
        if (usingUs) { myData = usData } else {  myData = asiaData };
        populateData();
        usingUs = !usingUs;
        update(cityTemp);
      }, 2000);
      
      update(cityTemp);
      
      function update(data) {
    // START REFRESH LOOP

      x.domain(data.map(function(d) { return d[0]}));
      y.domain([0, d3.max(data, function(d) {
        return d[1];
      })]);
      colorScale.domain([0, d3.max(cityTemp, function(d) {
        return d[1];
      })])
    
      
      // AXIS GENERATORS
      let xAxisCall = d3.axisBottom(x)
      xAxisGroup.call(xAxisCall)
      // Should this be here or above? Can I move it? Test.
      .selectAll('text')
      .attr('y', '10')
      .attr('x', '-10')
      .attr('text-anchor', 'end')
      .attr('transform', 'rotate(-40)')
      .attr('font-size', '15');
      
      let yAxisCall = d3.axisLeft(y)
      .tickFormat(function(d) { return d });
      yAxisGroup.call(yAxisCall)
      .append('text');


      // JOIN new data with old elements
      let rects = g.selectAll('rect')
        .data(data);
    
      // EXIT old elements not present in new data
      rects.exit()
        .transition(t)
          .attr("y", y(0))
          .attr("height", 0)
          .remove();
        
      // UPDATE old elements remaining in new data
      rects
        .transition(t)
          .attr('y', function(d) {return y(d[1]); })
          .attr('x', function(d) {return x(d[0])})
          .attr('width', x.bandwidth)
          .attr('height', function(d) { return height - y(d[1])});
      
      // ENTER new elements from new data
      rects.enter()
        .append('rect')
          .attr('y', 0)
        .transition(t)
          .attr('y', function(d) {return y(d[1]); })
          .attr('x', function(d) {return x(d[0])})
          .attr('width', x.bandwidth)
          .attr('height', function(d) { return height - y(d[1])})
          .attr('fill', function(d) { return colorScale(d[1])});

      let label = usingUs ? "Current Temperature in US Cities"
      : "Current Temperature in Japan Cities";    
      xLabel.text(label);
  }

























} // end main

  
