import { log } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "../entities/const";

import { RJLaunchEventCreated as RJLaunchEventCreatedEvent } from "../../generated/RocketJoeFactory/RocketJoeFactory";
import { LaunchEvent as LaunchEventTemplate } from "../../generated/templates";
import { LaunchEvent } from "../../generated/schema";
import { getDecimals } from "../entities";

export function handleRJLaunchEventCreated(
  event: RJLaunchEventCreatedEvent
): void {
  LaunchEventTemplate.create(event.params.launchEvent);

  log.debug("[handleRJLaunchEventCreated] {}", [
    event.params.launchEvent.toHexString(),
  ]);
  const launchEvent = new LaunchEvent(event.params.launchEvent.toHex());
  launchEvent.issuer = event.params.issuer;
  launchEvent.token = event.params.token;
  launchEvent.tokenDecimals = getDecimals(event.params.token);
  launchEvent.phaseOneStartTime = event.params.phaseOneStartTime;
  launchEvent.phaseTwoStartTime = event.params.phaseTwoStartTime;
  launchEvent.phaseThreeStartTime = event.params.phaseThreeStartTime;
  launchEvent.timestamp = event.block.timestamp;
  launchEvent.tokenReserve = BIG_DECIMAL_ZERO;
  launchEvent.avaxReserve = BIG_DECIMAL_ZERO;
  launchEvent.volumeToken0 = BIG_DECIMAL_ZERO;
  launchEvent.volumeToken1 = BIG_DECIMAL_ZERO;
  launchEvent.txCount = BIG_INT_ZERO;
  launchEvent.save();
}
