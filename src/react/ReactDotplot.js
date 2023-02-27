import React, { useEffect } from "react";
import DotplotGL from "../DotplotGL";

const ReactDotplot = ({ id, data, color, size }) => {
  useEffect(() => {
    let plot = new DotplotGL(`#${id}`);

    plot.setInput({
      x: [...data.x],
      y: [...data.y],
      xlabels: data.xlabels,
      ylabels: data.ylabels,
    });

    plot.setState({
      size,
      color,
    });

    plot.render();
  }, []);

  return <div id={id} style={{ height: "500px", width: "100%" }}></div>;
};

export default ReactDotplot;
