import "@michaelmcdaniel/wc-toggle-switch";
import "./style.css";

document.querySelector("#app").innerHTML = `
  <h1>&lt;wc-toggle-switch&gt; demo</h1>
  <wc-toggle-switch label-on="On" label-off="Off"></wc-toggle-switch>
  <wc-toggle-switch checked label-on="On" label-off="Off"></wc-toggle-switch>
  <wc-toggle-switch indeterminate label-on="On" label-off="Off"></wc-toggle-switch>
`;
