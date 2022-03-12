import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from "./const";
import { ERC20 } from "../../generated/RocketJoeFactory/ERC20";
import { LaunchEvent } from "../../generated/schema";

export function getLaunchEvent(
  address: Address,
  block: ethereum.Block = null
): LaunchEvent | null {
  let launchEvent = LaunchEvent.load(address.toHex());

  if (launchEvent === null) {
    launchEvent = new LaunchEvent(address.toHex());

    launchEvent.phaseOneStartTime = BIG_INT_ZERO;
    launchEvent.phaseTwoStartTime = BIG_INT_ZERO;
    launchEvent.phaseThreeStartTime = BIG_INT_ZERO;
    launchEvent.txCount = BIG_INT_ZERO;
    launchEvent.tokenReserve = BIG_DECIMAL_ZERO;
    launchEvent.avaxReserve = BIG_DECIMAL_ZERO;
    launchEvent.volumeToken0 = BIG_DECIMAL_ZERO;
    launchEvent.volumeToken1 = BIG_DECIMAL_ZERO;
    launchEvent.timestamp = block.timestamp;
  }

  return launchEvent as LaunchEvent;
}

export function getDecimals(address: Address): BigInt {
  const contract = ERC20.bind(address);

  // try types uint8 for decimals
  let decimalValue = 0;

  const decimalResult = contract.try_decimals();

  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
  }

  return BigInt.fromI32(decimalValue as i32);
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (
    let i = BigInt.fromI32(0);
    i.lt(decimals as BigInt);
    i = i.plus(BigInt.fromI32(1))
  ) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function convertAmountToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: BigInt
): BigDecimal {
  if (exchangeDecimals == BigInt.fromI32(0)) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function getPenalty(
  currentTimestamp: BigInt,
  launchEvent: LaunchEvent
): BigDecimal {
  // First 24 hours of phase one have 0% withdraw penalty
  const phaseOneWithFeeStartTime = launchEvent.phaseOneStartTime.plus(
    BigInt.fromI32(86400)
  );

  if (currentTimestamp.lt(phaseOneWithFeeStartTime)) {
    return BigDecimal.fromString("0");
  } else if (currentTimestamp.lt(launchEvent.phaseTwoStartTime)) {
    // We subtract the non-fee part of phase one to get the part with withdrawal fees
    const feeDuration = launchEvent.phaseTwoStartTime.minus(
      phaseOneWithFeeStartTime
    );
    // Then we calculate the gradient maxWithdrawPenalty / duration
    const gradient = launchEvent.maxWithdrawPenalty.div(
      feeDuration.toBigDecimal()
    );
    // Then we calculate the time elapsed during the fee duration
    const timeElapsedInFeeDuration = currentTimestamp.minus(
      phaseOneWithFeeStartTime
    );
    // And return the current withrawal penalty
    return gradient.times(timeElapsedInFeeDuration.toBigDecimal());
  } else if (currentTimestamp.lt(launchEvent.phaseThreeStartTime)) {
    return launchEvent.fixedWithdrawPenalty;
  } else {
    return BigDecimal.fromString("0");
  }
}
