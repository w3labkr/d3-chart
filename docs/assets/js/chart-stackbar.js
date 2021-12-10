/**
 * D3 Chart Stackbar
 *
 * @version 1.0.0
 * @author W3LabKr
 * @license MIT License
 */

// the semi-colon before the function invocation is a safety net against concatenated
// scripts and/or other plugins that are not closed properly
(function ($, window, document, undefined) {
  var ChartStackbar = function (element, options) {
    this.element = element;
    this.$element = $(element);
    this.options = options;
    this.metadata = this.$element.data("chart-stackbar");
    this.init(this.element, this.options);
  };

  // Default Options
  ChartStackbar.defaults = {
    // Mode
    chartMode: "stackbar",

    // Combine
    combineDataLength: 0,
    combineDataLabel: "Other",

    // Margin
    marginTop: 70,
    marginRight: 50,
    marginBottom: 50,
    marginLeft: 150,

    // Size
    width: 546,
    height: 295,

    // Color
    color: ["#3ea3dc", "#ffcb00", "#e64d3c", "#ffa801", "#f16522"],

    // Scale
    xScalePadding: 0.6,

    // Axis
    axisFontFamily: "sans-serif",
    axisFontSize: "13px",
    axisColor: "#757575",
    yDomainMarginTop: 1.2, // (float)
    xAxisTick: 0,
    yAxisTick: 4,
    yAxisLineWidth: true, // (boolean)
    yAxisLineStrokeWidth: 1,
    yAxisLineStroke: "#d8dde2",

    // Tooltip
    tooltipFormat: "km",
    tooltipClass: "chart-tooltip",
    tooltipFontFamily: "sans-serif",
    tooltipFontSize: "13px",
    tooltipColor: "#ffffff",
    tooltipBgColor: "rgba(0,0,0,0.7)",
    tooltipPadding: "10px 15px",
    tooltipIconSize: "10px",
    tooltipIconRadius: "0",
    tooltipIconMarginRight: "10px",

    // Legend
    legendMarginTop: 10,
    legendMarginLeft: 10,
    legendDirection: "horizontal", // (string) horizontal, vertical
    legendHorizontalGutter: 10,
    legendVerticalGutter: 10,
    legendFontFamily: "sans-serif",
    legendFontSize: "12px",
    legendColor: "#757575",
    legendIconSize: 12,
    legendTextX: 15,
    legendTextY: 10,
  };

  ChartStackbar.prototype = {
    defaults: ChartStackbar.defaults,
    init: function (element, options) {
      this._core = ChartStackbar.prototype;

      // the added first parameter of TRUE to signify a DEEP COPY:
      this.settings = $.extend(
        true,
        {},
        this.defaults,
        this.options,
        this.metadata
      );

      this.onInit(element, this.settings);

      return this;
    },
  };

  ChartStackbar.prototype.onInit = function (element, settings) {
    var dataset = settings.data;

    /**
     * Combine Data
     */
    var keys = Object.keys(dataset[0]).slice(1),
      combineDataKeys = [],
      combineDataLength = settings.combineDataLength,
      combineDataLabel = settings.combineDataLabel;

    if (keys.length > combineDataLength && combineDataLength !== 0) {
      // key
      for (var i in keys) {
        i > combineDataLength - 1 ? combineDataKeys.push(keys[i]) : null;
      }
      // update
      for (var j in dataset) {
        var combineDataValue = [];
        for (var k in combineDataKeys) {
          combineDataValue.push(dataset[j][combineDataKeys[k]]);
        }
        if (!!(dataset[j][combineDataLabel] == undefined)) {
          dataset[j][combineDataLabel] = combineDataValue.reduce(function (
            acc,
            cur
          ) {
            return acc + cur;
          },
          0);
        } else {
          console.log(
            "" +
              element.getAttribute("id") +
              " : " +
              "combineDataLabel is aleady exist."
          );
        }
      }
      // delete
      for (var x in dataset) {
        for (var y in combineDataKeys) {
          delete dataset[x][combineDataKeys[y]];
        }
      }
    }

    /**
     * Init
     */

    // Margin
    var margin = {
      top: settings.marginTop,
      right: settings.marginRight,
      bottom: settings.marginBottom,
      left: settings.marginLeft,
    };
    (margin.x = margin.left + margin.right),
      (margin.y = margin.top + margin.bottom);

    // Size
    var width = settings.width - margin.x,
      height = settings.height - margin.y;

    // format
    var formatComma = d3.format(","),
      formatDecimal = d3.format(".1f"),
      formatDecimalComma = d3.format(",.2f"),
      formatSuffix = d3.format("s"),
      formatSuffixDecimal1 = d3.format(".1s"),
      formatSuffixDecimal2 = d3.format(".2s"),
      formatMoney = function (d) {
        return "$" + formatDecimalComma(d);
      },
      formatPercent = d3.format(",.2%");

    // Unique
    var unique = function (d) {
      return d.filter(function (el, idx) {
        return d.indexOf(el) == idx;
      });
    };

    /*
     * D3 Scale Chromatic
     * @link https://github.com/d3/d3-scale-chromatic
     */
    var colors = settings.color.concat(d3.schemeSet2),
      colors = unique(colors),
      color = d3.scaleOrdinal(colors);

    /**
     * Stackbar
     */
    var keys = Object.keys(dataset[0]).slice(1);
    var stack = d3
      .stack()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    var series = stack(dataset);

    /**
     * Scale
     */

    // Domain
    var xDomain = dataset.map(function (d) {
        return Object.values(d)[0];
      }),
      yDomain =
        settings.yDomainMarginTop *
        d3.max(series, function (d) {
          return d3.max(d, function (d) {
            return d[1];
          });
        });

    // Scale
    var xScale = d3
      .scaleBand()
      .domain(xDomain)
      .range([0, width])
      .padding(settings.xScalePadding);

    var yScale = d3.scaleLinear().domain([0, yDomain]).rangeRound([height, 0]);

    /**
     * Axis
     */

    // Tick
    var yTickValues = function (yAxisTick) {
      var values = [],
        tick = yDomain / yAxisTick;
      for (var i = 0; i < yAxisTick + 1; i++) {
        values.push(i * tick);
      }
      return values;
    };

    // Axis
    var xAxis = function (g) {
      g.attr("class", "axis axis-x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).ticks(settings.xAxisTick).tickSizeOuter(0))
        .call(function (g) {
          g.selectAll(".domain").remove();
        })
        .call(function (g) {
          g.selectAll("line").remove();
        })
        .call(function (g) {
          g.selectAll("text")
            .attr("font-family", settings.axisFontFamily)
            .attr("font-size", settings.axisFontSize)
            .attr("color", settings.axisColor);
        });
    };

    var yAxis = function (g) {
      g.attr("class", "axis axis-y")
        .attr("transform", "translate(0,0)")
        .call(
          d3.axisLeft(yScale).tickValues(yTickValues(settings.yAxisTick))
          // .tickFormat(d3.format(',.1r'))
        )
        .call(function (g) {
          g.selectAll(".domain").remove();
        })
        .call(function (g) {
          g.selectAll("line")
            .attr("x1", 0)
            .attr("x2", settings.yAxisLineWidth ? width : 0)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke-width", settings.yAxisLineStrokeWidth)
            .attr("stroke", settings.yAxisLineStroke);
        })
        .call(function (g) {
          g.selectAll("text")
            .attr("font-family", settings.axisFontFamily)
            .attr("font-size", settings.axisFontSize)
            .attr("color", settings.axisColor);
        });
    };

    /**
     * Tooltip
     */

    // init
    var tooltip = document.getElementsByClassName(settings.tooltipClass);

    if (!tooltip.length) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("class", settings.tooltipClass)
        .style("display", "none")
        .style("cursor", "auto")
        .style("position", "fixed")
        .style("padding", settings.tooltipPadding)
        .style("background-color", settings.tooltipBgColor)
        .style("font-family", settings.tooltipFontFamily)
        .style("font-size", settings.tooltipFontSize)
        .style("color", settings.tooltipColor);

      // icon
      tooltip
        .append("i")
        .style("display", "inline-block")
        .style("margin-right", settings.tooltipIconMarginRight)
        .style("border-radius", settings.tooltipIconRadius)
        .style("width", settings.tooltipIconSize)
        .style("height", settings.tooltipIconSize);

      // text
      tooltip.append("span");
    } else {
      tooltip = d3.select(tooltip[0]);
    }

    var tooltipIcon = tooltip.select("i"),
      tooltipText = tooltip.select("span");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function (d) {
      tooltip.style("display", "block");
    };

    var mousemove = function (d) {
      var _this = {};
      _this.datum = d3.select(this.parentNode).datum();
      _this.index = _this.datum.index;
      _this.key = _this.datum.key;
      _this.value = d.data[_this.key];

      // set the tooltip coodinate
      tooltip.style("top", d3.event.pageY - 10 + "px");
      tooltip.style("left", d3.event.pageX + 10 + "px");

      // add the tooltip html
      tooltipIcon.style("background-color", color(_this.index));
      tooltipText.html(
        _this.key +
          " " +
          formatComma(_this.value) +
          " " +
          settings.tooltipFormat
      );
    };

    var mouseleave = function (d) {
      tooltip.style("display", "none");
    };

    /**
     * Legend
     */
    var legend = function (g) {
      g.attr("font-family", settings.legendFontFamily)
        .attr("font-size", settings.legendFontSize)
        .attr("color", settings.legendColor)
        .call(function (g) {
          g.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", settings.legendIconSize)
            .attr("height", settings.legendIconSize)
            .attr("fill", function (d, i) {
              return color(i);
            });
        })
        .call(function (g) {
          g.append("text")
            .attr("x", settings.legendTextX)
            .attr("y", settings.legendTextY)
            .attr("font-family", settings.legendFontFamily)
            .attr("font-size", settings.legendFontSize)
            .attr("color", settings.legendColor)
            .text(function (d) {
              return d.key;
            });
        })
        .call(function (g) {
          var xWidth = [];
          g.attr("transform", function (d, i) {
            switch (settings.legendDirection) {
              case "horizontal":
                xWidth[i] =
                  parseInt(this.getBBox().width) +
                  settings.legendHorizontalGutter;
                return "translate(" + (d3.sum(xWidth) - xWidth[i]) + ", 0)";
              case "vertical":
                return (
                  "translate(0, " + i * settings.legendVerticalGutter * 2 + ")"
                );
            }
          });
        });
    };

    /**
     * Create element DOM Node
     */

    // Svg
    var svg = d3
      .select(element)
      .append("svg")
      .attr("viewBox", [0, 0, width + margin.x, height + margin.y])
      // .attr('width', width + margin.x)
      // .attr('height', height + margin.y)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Axis
    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // Chart
    svg
      .append("g")
      .attr("class", "chart")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", function (d, i) {
        return color(i);
      })
      .selectAll("rect")
      .data(function (d) {
        return d;
      })
      .join("rect")
      .attr("x", function (d, i) {
        return xScale(Object.values(d.data)[0]);
      })
      .attr("y", function (d) {
        return yScale(d[1]);
      })
      .attr("width", xScale.bandwidth())
      .attr("height", function (d) {
        return yScale(d[0]) - yScale(d[1]);
      })

      // Tooltip
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

    // Legend
    svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", function () {
        var legendX = -margin.left + settings.legendMarginLeft,
          legendY = -margin.top + settings.legendMarginTop;
        return "translate(" + legendX + "," + legendY + ")";
      })
      .selectAll("g")
      .data(series)
      .join("g")
      .call(legend);
  };

  // jQuery plugin implementation
  $.fn.ChartStackbar = function (options) {
    return this.each(function () {
      new ChartStackbar(this, options);
    });
  };

  window.ChartStackbar = ChartStackbar;
})(jQuery, window, document);
