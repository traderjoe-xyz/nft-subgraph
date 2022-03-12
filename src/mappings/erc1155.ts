import {
  TransferSingle,
  TransferBatch,
  URI,
} from "../../generated/ERC1155/ERC1155";
import { Nft } from "../../generated/schema";
import { transferBase } from "../entities/nft";

export function handleTransferSingle(event: TransferSingle): void {
  transferBase(
    event.address,
    event.params._from,
    event.params._to,
    event.params._id,
    event.params._value,
    event.block.timestamp
  );
}

export function handleTransferBatch(event: TransferBatch): void {
  if (event.params._ids.length != event.params._values.length) {
    throw new Error("Inconsistent arrays length in TransferBatch");
  }

  for (let i = 0; i < event.params._ids.length; i++) {
    let ids = event.params._ids;
    let values = event.params._values;
    transferBase(
      event.address,
      event.params._from,
      event.params._to,
      ids[i],
      values[i],
      event.block.timestamp
    );
  }
}

export function handleURI(event: URI): void {
  let contractAddressHex = event.address.toHexString();
  let id = contractAddressHex + "_" + event.params._id.toString();
  let nft = Nft.load(id);
  if (nft != null) {
    nft.tokenURI = event.params._value;
    nft.save();
  }
}
