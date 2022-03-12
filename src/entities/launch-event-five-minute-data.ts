import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { BIG_INT_ZERO } from "./const";
import { LaunchEventFiveMinuteData } from "../../generated/schema";
import { LaunchEvent } from "../../generated/schema";

export function updateLaunchEventFiveMinuteData(event: ethereum.Event): void {
  const timestamp = event.block.timestamp.toI32();
  const SECONDS_PER_FIVE_MINUTE_INTERVAL = 300;
  const fiveMinuteInterval = timestamp / SECONDS_PER_FIVE_MINUTE_INTERVAL;
  const date = fiveMinuteInterval * SECONDS_PER_FIVE_MINUTE_INTERVAL;

  const id = event.address
    .toHex()
    .concat("-")
    .concat(BigInt.fromI32(fiveMinuteInterval).toString());

  const launchEvent = LaunchEvent.load(event.address.toHex());

  if (launchEvent === null) {
    log.warning(
      "launch event was null when updating launch event five minute data: {}",
      [event.address.toString()]
    );
    return;
  }

  let launchEventFiveMinuteData = LaunchEventFiveMinuteData.load(id);

  if (launchEventFiveMinuteData === null) {
    launchEventFiveMinuteData = new LaunchEventFiveMinuteData(id);
    launchEventFiveMinuteData.date = date;
    launchEventFiveMinuteData.launchEvent = launchEvent.id;
    launchEventFiveMinuteData.txCount = BIG_INT_ZERO;
  }

  launchEventFiveMinuteData.tokenReserve = launchEvent.tokenReserve;
  launchEventFiveMinuteData.avaxReserve = launchEvent.avaxReserve;
  launchEventFiveMinuteData.txCount = launchEventFiveMinuteData.txCount.plus(
    BigInt.fromI32(1)
  );
  launchEventFiveMinuteData.save();
}
