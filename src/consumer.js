import { delayUpdate } from "./ethereum";

const consume = () => {
  delayUpdate((error, result) => {
    console.log("NEW DELAY DATA EVENT ON SMART CONTRACT");
    console.log("BLOCK NUMBER: ");
    console.log("  " + result.blockNumber)
    console.log("DELAY DATA: ");
    console.log(result.args);
    console.log("\n");
  });
};

export default consume;
