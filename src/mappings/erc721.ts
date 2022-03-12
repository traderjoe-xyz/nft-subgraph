import { Transfer, ERC721 } from "../../generated/ERC721/ERC721";
import { Nft, NftContract, Owner } from "../../generated/schema";
import {
  BIG_INT_ONE,
  BIG_INT_ZERO,
  ERC1155_TYPE,
  ERC721_TYPE,
  ERC_165_IDENTIFIER,
  ERC_721_IDENTIFIER,
  ERC_721_METADATA_IDENTIFIER,
  NULL_IDENTIFIER,
  ZERO_ADDRESS_STRING,
} from "./constants";
import { supportsInterface, normalize } from "./utils";

export function handleTransfer(event: Transfer): void {
  let tokenId = event.params.id;
  let nftId = event.address.toHex() + "_" + tokenId.toString();
  let contractAddress = event.address.toHex();
  let from = event.params.from.toHex();
  let to = event.params.to.toHex();

  let contract = ERC721.bind(event.address);
  let nftContract = NftContract.load(contractAddress);
  if (nftContract == null) {
    let supportsEIP165Identifier = supportsInterface(
      contract,
      ERC_165_IDENTIFIER
    );
    let supportsEIP721Identifier = supportsInterface(
      contract,
      ERC_721_IDENTIFIER
    );
    let supportsNullIdentifierFalse = supportsInterface(
      contract,
      NULL_IDENTIFIER,
      false
    );
    let supportsEIP721 =
      supportsEIP165Identifier &&
      supportsEIP721Identifier &&
      supportsNullIdentifierFalse;

    if (!supportsEIP721) {
      return;
    }

    nftContract = new NftContract(contractAddress);
    nftContract.type = ERC721_TYPE;
    nftContract.supportsMetadata = supportsInterface(
      contract,
      ERC_721_METADATA_IDENTIFIER
    );
    nftContract.numTokens = BIG_INT_ZERO;
    nftContract.numOwners = BIG_INT_ZERO;
    let name = contract.try_name();
    if (!name.reverted) {
      nftContract.name = normalize(name.value);
    }
    let symbol = contract.try_symbol();
    if (!symbol.reverted) {
      nftContract.symbol = normalize(symbol.value);
    }
  }

  if (from != ZERO_ADDRESS_STRING || to != ZERO_ADDRESS_STRING) {
    if (from != ZERO_ADDRESS_STRING) {
      // Is existing NFT
      let currentOwner = Owner.load(from);
      if (currentOwner != null) {
        currentOwner.numTokens = currentOwner.numTokens.minus(BIG_INT_ONE);
        currentOwner.save();
      }
    } // else minting

    let newOwner = Owner.load(to);
    if (newOwner == null) {
      newOwner = new Owner(to);
      newOwner.numTokens = BIG_INT_ZERO;
    }

    let nft = Nft.load(nftId);
    if (nft == null) {
      nft = new Nft(nftId);
      nft.contract = nftContract.id;
      nft.mintedAt = event.block.timestamp;
      nft.ownership = [];
      nft.tokenID = tokenId;
    }
    nft.owner = newOwner.id;

    if (to != ZERO_ADDRESS_STRING) {
      // Either a transfer or mint
      let ownership = nft.ownership;
      ownership.push(event.params.to);
      nft.ownership = ownership;

      // Always perform this check since the tokenURI can change over time
      if (nftContract.supportsERC721Metadata) {
        let metadataURI = contract.try_tokenURI(tokenId);
        if (!metadataURI.reverted) {
          nft.tokenURI = normalize(metadataURI.value);
        }
      }

      if (from == ZERO_ADDRESS_STRING) {
        // Mint
        nftContract.numTokens = nftContract.numTokens.plus(BIG_INT_ONE);
      }

      newOwner.numTokens = newOwner.numTokens.plus(BIG_INT_ONE);
      newOwner.save();
    } else {
      nft.burnedAt = event.block.timestamp;
      nftContract.numTokens = nftContract.numTokens.minus(BIG_INT_ONE);
    }

    nft.save();
  }
  nftContract.save();
}
