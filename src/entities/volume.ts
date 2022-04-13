import { BigInt } from "@graphprotocol/graph-ts";
import { NftContractDayData, NftContractHourData } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

function upsertContractDayVolumeData(
    nftContractId: string,
    value: BigInt,
    timestamp: BigInt
): void {
    const dateEpochTime = timestamp.toI32() / 86400 * 86400; 
    const dayDataId = `${nftContractId}-${dateEpochTime.toString()}`;
    let dayData = NftContractDayData.load(dayDataId);
    if (dayData == null) {
        dayData = new NftContractDayData(dayDataId);
        dayData.contract = nftContractId;
        dayData.dateTime = dateEpochTime;
        dayData.volumeAVAX = BIG_INT_ZERO;
    }
    dayData.volumeAVAX.plus(value);
    dayData.save();
}

function upsertContractHourVolumeData(
    nftContractId: string,
    value: BigInt,
    timestamp: BigInt
): void {
    const hourEpochTime = timestamp.toI32() / 3600 * 3600; 
    const hourDataId = `${nftContractId}-${hourEpochTime.toString()}`;
    let hourData = NftContractHourData.load(hourDataId);
    if (hourData == null) {
        hourData = new NftContractHourData(hourDataId);
        hourData.contract = nftContractId;
        hourData.dateTime = hourEpochTime;
        hourData.volumeAVAX = BIG_INT_ZERO;
    }
    hourData.volumeAVAX.plus(value);
    hourData.save();
}

export function upsertContractVolumeData(
    nftContractId: string,
    value: BigInt,
    timestamp: BigInt
): void {
    upsertContractDayVolumeData(nftContractId, value, timestamp);
    upsertContractHourVolumeData(nftContractId, value, timestamp);
}