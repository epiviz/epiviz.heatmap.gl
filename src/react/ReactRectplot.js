import React, { useEffect, useRef } from "react";
import RectplotGL from "../index";

const ReactRectplot = ({ data, color, size }) => {
  const container = useRef();

  useEffect(() => {
    const containerEl = container.current;
    let plot = new RectplotGL(containerEl);

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

export default ReactRectplot;
