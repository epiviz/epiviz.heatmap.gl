import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

class Tooltip {
  constructor() {
    if (!Tooltip.instance) {
      Tooltip.instance = this;
      this.createSingletonTooltip();
    }
    return Tooltip.instance;
  }

  createSingletonTooltip() {
    // Create an invisible, persistent tooltip
    this.currentTooltip = tippy(document.body, {
      content: "",
      trigger: "manual",
      arrow: true,
      placement: "right",
    });
  }

  updateTooltip(content, x, y, options = {}) {
    this.currentTooltip.setContent(content);
    this.currentTooltip.setProps({
      getReferenceClientRect: () => ({
        width: 0,
        height: 0,
        top: y,
        left: x,
        right: x,
        bottom: y,
      }),
      ...options,
    });
    if (!this.currentTooltip.state.isVisible) {
      this.currentTooltip.show();
    }
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.hide();
    }
  }
}

export default Tooltip;
