// the semi-colon before the function invocation is a safety net against concatenated
// scripts and/or other plugins that are not closed properly
(function (window, document, undefined) {
  $("#stackbar1, #stackbar2").ChartStackbar({
    width: 546,
    height: 295,
    axisFontFamily: "NanumBarunGothic, sans-serif",
    axisFontSize: "13px",
    axisColor: "#757575",
  });

  $("#donut").ChartPie({
    combineDataLabel: "기타",
  });
})(window, document);
