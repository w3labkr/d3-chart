/**
 * D3 Chart Pie
 *
 * @version 1.0.0
 * @author W3LabKr
 * @license MIT License
 */

// the semi-colon before the function invocation is a safety net against concatenated
// scripts and/or other plugins that are not closed properly
(function ($, window, document, undefined) {
  var ChartPie = function (element, options) {
    this.element = element;
    this.$element = $(element);
    this.options = options;
    this.metadata = this.$element.data("chart-pie");
    this.init(this.element, this.options);
  };

  // Default Options
  ChartPie.defaults = {
    // Mode
    chartMode: "pie",

    // Combine
    combineDataLength: 0,
    combineDataLabel: "Other",

    // Margin
    marginTop: 70,
    marginRight: 50,
    marginBottom: 50,
    marginLeft: 125,

    // Size
    width: 546,
    height: 295,
    thickness: 40,
    radius: 97.5,

    // Color
    color: ["#3ea3dc", "#ffcb00", "#e64d3c", "#ffa801", "#f16522"],

    // Sorting
    sort: "descending", // (string) ascending, descending

    // Tooltip
    tooltipFormat: "%",
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

  ChartPie.prototype = {
    defaults: ChartPie.defaults,
    init: function (element, options) {
      this._core = ChartPie.prototype;

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

  ChartPie.prototype.onInit = function (element, settings) {
    var dataset = settings.data,
      keys = Object.keys(dataset[0]);

    /**
     * Scale
     */
    var scale = d3.sum(
      dataset.map(function (d, i) {
        return Object.values(d)[1];
      })
    );

    for (var i in dataset) {
      dataset[i][keys[1]] = ((dataset[i][keys[1]] / scale) * 100).toFixed(0);
    }

    /**
     * Combine Data
     */
    var combineDataObj = {},
      combineDataValue = [];

    if (
      dataset.length > settings.combineDataLength &&
      settings.combineDataLength !== 0
    ) {
      // update
      for (var i in dataset) {
        i > settings.combineDataLength - 1
          ? combineDataValue.push(dataset[i][keys[1]])
          : null;
      }
      combineDataObj[keys[0]] = settings.combineDataLabel;
      combineDataObj[keys[1]] = combineDataValue
        .reduce(function (acc, cur) {
          return parseFloat(acc) + parseFloat(cur);
        }, 0)
        .toFixed(0);

      // delete
      dataset.splice(settings.combineDataLength, dataset.length);

      // update
      dataset.push(combineDataObj);
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
     * Donut
     */
    var pie = d3
      .pie()
      .sort(function (a, b) {
        var objA = Object.values(a)[1],
          objB = Object.values(b)[1];
        switch (settings.sort) {
          case "ascending":
            return d3.ascending(objA, objB);
          case "descending":
            return d3.descending(objA, objB);
          case "":
            return;
        }
      })
      .value(function (d) {
        return Object.values(d)[1];
      });

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
      var tooltipData = Object.values(d.data);

      // set the tooltip coodinate
      tooltip.style("top", d3.event.pageY - 10 + "px");
      tooltip.style("left", d3.event.pageX + 10 + "px");

      // add the tooltip html
      tooltipIcon.style("background-color", color(d.index));
      tooltipText.html(
        tooltipData[0] +
          " " +
          formatComma(tooltipData[1]) +
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
        .sort(function (a, b) {
          var objA = Object.values(a)[1],
            objB = Object.values(b)[1];
          return d3.ascending(objA, objB);
        })
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
              return Object.values(d.data)[0];
            });
        })
        .call(function (g) {
          var translates = [],
            translateX = 0,
            translateY = 0;
          g.attr("transform", function (d, i) {
            switch (settings.legendDirection) {
              case "horizontal":
                var bbox = this.getBBox();
                translates[i] =
                  parseInt(bbox.width) + settings.legendHorizontalGutter;
                translateX = d3.sum(translates) - translates[i];
                // TODO: SUPPORT MULTILINE LEGEND
                return "translate(" + translateX + "," + translateY + ")";
              case "vertical":
                return (
                  "translate(0, " + i * settings.legendVerticalGutter * 2 + ")"
                );
            }
          });
        });
    };

    /**
     * Label
     */
    var label = function (g) {
      g.attr("font-family", settings.legendFontFamily)
        .attr("font-size", settings.legendFontSize)
        .attr("color", settings.legendColor)
        .sort(function (a, b) {
          var objA = Object.values(a)[1],
            objB = Object.values(b)[1];
          return d3.ascending(objA, objB);
        })
        .call(function (g) {
          g.append("text")
            .attr("x", function (d, i) {
              console.log(d);
              return (d.endAngle + d.startAngle) * 20 + settings.radius;
            })
            .attr("y", function (d, i) {
              return (d.endAngle + d.startAngle) * 5 + settings.radius;
            })
            .attr("font-family", settings.legendFontFamily)
            .attr("font-size", settings.legendFontSize)
            .attr("color", settings.legendColor)
            .text(function (d) {
              return Object.values(d.data)[0];
            });
        })
        .call(function (g) {});
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

    // Chart
    var arc = d3
      .arc()
      .innerRadius(settings.radius - settings.thickness)
      .outerRadius(settings.radius);

    svg
      .append("g")
      .attr("class", "chart")
      .attr("transform", function () {
        var pieX = Math.abs(settings.radius - margin.left) + margin.left,
          pieY = Math.abs(settings.radius - margin.top) + margin.top;
        return "translate(" + pieX + "," + pieY + ")";
      })
      .selectAll("g")
      .data(pie(dataset))
      .join("path")
      .attr("d", arc)
      .attr("fill", function (d, i) {
        return color(d.index);
      })
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
      .data(pie(dataset))
      .join("g")
      .call(legend);

    // Label
    svg
      .append("g")
      .attr("class", "label")
      .attr("transform", function () {
        var legendX = -margin.left + settings.legendMarginLeft,
          legendY = -margin.top + settings.legendMarginTop;
        return "translate(" + legendX + "," + legendY + ")";
      })
      .selectAll("g")
      .data(pie(dataset))
      .join("g")
      .call(label);
  };

  // jQuery plugin implementation
  $.fn.ChartPie = function (options) {
    return this.each(function () {
      new ChartPie(this, options);
    });
  };

  window.ChartPie = ChartPie;
})(jQuery, window, document);
