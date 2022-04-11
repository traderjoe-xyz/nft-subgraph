import { Address, BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function upsertTransfer(
  nftId: string,
  fromAddress: Address,
  toAddress: Address,
  quantity: BigInt,
  timestamp: BigInt,
  transactionHash: Bytes
): void {
  let transferId =
    nftId +
    "-" +
    fromAddress.toHexString() +
    "-" +
    toAddress.toHexString() +
    "-" +
    transactionHash.toHexString();
  let transfer = Transfer.load(transferId);

  if (transfer == null) {
    transfer = new Transfer(transferId);
    transfer.from = fromAddress;
    transfer.nft = nftId;
    transfer.quantity = BIG_INT_ZERO;
    transfer.timestamp = timestamp;
    transfer.to = toAddress;
    transfer.transactionHash = transactionHash;
  }

  let newQuantity = transfer.quantity.plus(quantity);

  transfer.quantity = newQuantity;
  transfer.save();
}
