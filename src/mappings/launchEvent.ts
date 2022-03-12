import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import {
  AvaxEmergencyWithdraw as AvaxEmergencyWithdrawEvent,
  UserParticipated as UserParticipatedEvent,
  UserWithdrawn as UserWithdrawnEvent,
  LaunchEventInitialized as LaunchEventInitializedEvent,
} from "../../generated/templates/LaunchEvent/LaunchEvent";

import { Withdraw, Deposit, LaunchEvent } from "../../generated/schema";
import {
  convertAmountToDecimal,
  updateLaunchEventFiveMinuteData
} from "../entities";
import { BIG_DECIMAL_ZERO } from "../entities/const";

export function handleLaunchEventInitialized(
  event: LaunchEventInitializedEvent
): void {
  const launchEvent = LaunchEvent.load(event.address.toHex());
  if (launchEvent == null) {
    log.error(
      "handleLaunchEventInitialized couldn't find launch event address: {}",
      [event.address.toHexString()]
    );
    return;
  }

  launchEvent.tokenReserve = convertAmountToDecimal(
    event.params.tokenReserve,
    launchEvent.tokenDecimals
  );
  launchEvent.tokenIncentivesPercent = convertAmountToDecimal(
    event.params.tokenIncentivesPercent,
    BigInt.fromI32(18)
  );
  launchEvent.tokenIncentivesBalance = convertAmountToDecimal(
    event.params.tokenIncentives,
    launchEvent.tokenDecimals
  );

  // Use convertAmountToDecimal here as they values are scaled to 1e18
  launchEvent.floorPrice = convertAmountToDecimal(
    event.params.floorPrice,
    BigInt.fromI32(18)
  );
  launchEvent.maxWithdrawPenalty = convertAmountToDecimal(
    event.params.maxWithdrawPenalty,
    BigInt.fromI32(18)
  );
  launchEvent.fixedWithdrawPenalty = convertAmountToDecimal(
    event.params.fixedWithdrawPenalty,
    BigInt.fromI32(18)
  );
  launchEvent.userTimelock = event.params.userTimelock;
  launchEvent.issuerTimelock = event.params.issuerTimelock;
  launchEvent.save();
}

export function handleUserParticipated(event: UserParticipatedEvent): void {
  log.debug("[deposit] from {}", [event.address.toHexString()]);

  // Update launch event
  const launchEvent = LaunchEvent.load(event.address.toHex());
  if (launchEvent === null) {
    log.error("handleUserParticipated couldn't find launch event address: {}", [
      event.address.toHexString(),
    ]);
    return;
  }
  launchEvent.avaxReserve = launchEvent.avaxReserve.plus(
    convertAmountToDecimal(event.params.avaxAmount, BigInt.fromI32(18))
  );
  launchEvent.save();

  // Create a deposit
  let deposit = new Deposit(
    event.params.user.toHex() + "-" + event.block.timestamp.toString()
  );
  deposit.userAddress = event.params.user;
  deposit.amount = convertAmountToDecimal(
    event.params.avaxAmount,
    BigInt.fromI32(18)
  );
  deposit.timestamp = event.block.timestamp;
  deposit.launchEvent = launchEvent.id;
  deposit.save();

  updateLaunchEventFiveMinuteData(event);
}

export function handleUserWithdrawn(event: UserWithdrawnEvent): void {
  log.debug("[withdrawn] from {}", [event.address.toHexString()]);

  // Update launch event
  const launchEvent = LaunchEvent.load(event.address.toHex());
  if (launchEvent === null) {
    log.error("handleUserParticipated couldn't find launch event address: {}", [
      event.address.toHexString(),
    ]);
    return;
  }

  if (event.params.avaxAmount.toBigDecimal() >= launchEvent.avaxReserve) {
    launchEvent.avaxReserve = launchEvent.avaxReserve.minus(
      convertAmountToDecimal(event.params.avaxAmount, BigInt.fromI32(18))
    );
  } else {
    log.warning(
      "handleUserWithdrawn attempted to withdraw amount bigger than reserve: {}",
      [event.address.toHexString()]
    );
    launchEvent.avaxReserve = BIG_DECIMAL_ZERO;
  }
  launchEvent.save();

  // Create a withdraw
  let withdraw = new Withdraw(
    event.params.user.toHex() + "-" + event.block.timestamp.toString()
  );
  withdraw.launchEvent = launchEvent.id;
  withdraw.userAddress = event.params.user;
  withdraw.amount = convertAmountToDecimal(
    event.params.avaxAmount,
    BigInt.fromI32(18)
  );
  withdraw.timestamp = event.block.timestamp;
  withdraw.penaltyAmount = convertAmountToDecimal(
    event.params.penaltyAmount,
    BigInt.fromI32(18)
  );
  withdraw.save();

  updateLaunchEventFiveMinuteData(event);
}

export function handleAvaxEmergencyWithdraw(
  event: AvaxEmergencyWithdrawEvent
): void {
  log.debug("[emergency withdraw] from {}", [event.address.toHexString()]);

  // Update launch event
  const launchEvent = LaunchEvent.load(event.address.toHex());
  if (launchEvent === null) {
    log.error("handleUserParticipated couldn't find launch event address: {}", [
      event.address.toHexString(),
    ]);
    return;
  }

  if (event.params.amount.toBigDecimal() >= launchEvent.avaxReserve) {
    launchEvent.avaxReserve = launchEvent.avaxReserve.minus(
      convertAmountToDecimal(event.params.amount, BigInt.fromI32(18))
    );
  } else {
    log.warning(
      "handleAvaxEmergencyWithdraw attempted to withdraw amount bigger than reserve: {}",
      [event.address.toHexString()]
    );
    launchEvent.avaxReserve = BIG_DECIMAL_ZERO;
  }
  launchEvent.save();

  // Create a withdraw
  let withdraw = new Withdraw(
    event.params.user.toHex() + "-" + event.block.timestamp.toString()
  );
  withdraw.userAddress = event.params.user;
  withdraw.amount = convertAmountToDecimal(
    event.params.amount,
    BigInt.fromI32(18)
  );
  withdraw.timestamp = event.block.timestamp;
  withdraw.launchEvent = launchEvent.id;
  withdraw.penaltyAmount = BIG_DECIMAL_ZERO;
  withdraw.save();

  updateLaunchEventFiveMinuteData(event);
}
