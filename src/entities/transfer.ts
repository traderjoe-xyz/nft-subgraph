import { Address, BigInt, store } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function upsertTransfer(
  nftId: string,
  fromAddress: Address,
  toAddress: Address,
  quantity: BigInt,
  timestamp: BigInt
): void {
  let transferId =
    nftId +
    "_" +
    fromAddress.toHexString() +
    "_" +
    toAddress.toHexString() +
    "_" +
    timestamp.toString();
  let transfer = Transfer.load(transferId);

  if (transfer == null) {
    transfer = new Transfer(transferId);
    transfer.from = fromAddress;
    transfer.nft = nftId;
    transfer.quantity = BIG_INT_ZERO;
    transfer.timestamp = timestamp;
    transfer.to = toAddress;
  }

  let newQuantity = transfer.quantity.plus(quantity);

  transfer.quantity = newQuantity;
  transfer.save();
}
