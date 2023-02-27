import React, { useEffect } from "react";
import TickplotGL from "../index";

const ReactTickplot = ({ id, data, color, size }) => {
  useEffect(() => {
    let plot = new TickplotGL(`#${id}`);

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

    return () => {
      plot?.plot.dataWorker.terminate();
      plot?.plot.webglWorker.terminate();
    };
  }, []);

  return <div id={id} style={{ height: "500px", width: "100%" }}></div>;
};

export default ReactTickplot;
