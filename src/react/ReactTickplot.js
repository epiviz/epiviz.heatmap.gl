import React, { useEffect, useRef } from "react";
import TickplotGL from "../index";

const ReactTickplot = ({ data, color, size }) => {
  const container = useRef();

  useEffect(() => {
    const containerEl = container.current;
    let plot = new TickplotGL(containerEl);

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

  return <div ref={container} style={{ height: "500px", width: "100%" }}></div>;
};

export default ReactTickplot;
