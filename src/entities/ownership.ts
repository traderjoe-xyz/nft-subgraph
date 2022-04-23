import { Address, BigInt, Bytes, store } from "@graphprotocol/graph-ts";
import { Ownership } from "../../generated/schema";
import { BIG_INT_ZERO } from "../constants";

export function upsertOwnership(
  nftId: string,
  owner: Address,
  deltaQuantity: BigInt,
  timestamp: BigInt,
  transactionHash: Bytes
): void {
  let ownershipId = nftId + "-" + owner.toHexString();
  let ownership = Ownership.load(ownershipId);

  if (ownership == null) {
    ownership = new Ownership(ownershipId);
    ownership.nft = nftId;
    ownership.owner = owner;
    ownership.quantity = BIG_INT_ZERO;
  }

  let newQuantity = ownership.quantity.plus(deltaQuantity);

  if (newQuantity.le(BIG_INT_ZERO)) {
    store.remove("Ownership", ownershipId);
  } else {
    ownership.quantity = newQuantity;
    ownership.updatedAt = timestamp
    ownership.save();
  }
}
