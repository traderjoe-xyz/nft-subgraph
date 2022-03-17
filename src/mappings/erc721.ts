import { Transfer } from "../../generated/ERC721/ERC721";
import { BIG_INT_ONE } from "../constants";
import { transferBase } from "../entities/nft";

export function handleTransfer(event: Transfer): void {
  transferBase(
    event.address,
    event.params.from,
    event.params.to,
    event.params.id,
    BIG_INT_ONE,
    event.block.timestamp,
    event.transaction.hash
  );
}
