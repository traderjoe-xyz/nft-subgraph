import { Address, BigInt, store } from "@graphprotocol/graph-ts";
import { ERC165 } from "../../generated/ERC721/ERC165";
import { ERC721 } from "../../generated/ERC721/ERC721";
import { ERC1155 } from "../../generated/ERC1155/ERC1155";
import { Nft, NftContract, Ownership } from "../../generated/schema";
import {
  BIG_INT_ONE,
  BIG_INT_ZERO,
  ERC1155_TYPE,
  ERC721_TYPE,
  ERC_1155_IDENTIFIER,
  ERC_1155_METADATA_IDENTIFIER,
  ERC_165_IDENTIFIER,
  ERC_721_IDENTIFIER,
  ERC_721_METADATA_IDENTIFIER,
  NULL_IDENTIFIER,
  ZERO_ADDRESS_STRING,
} from "../constants";
import { supportsInterface, normalize } from "../utils";
import { upsertOwnership } from "./ownership";
import { upsertTransfer } from "./transfer";

export function transferBase(
  contractAddress: Address,
  fromAddress: Address,
  toAddress: Address,
  tokenId: BigInt,
  value: BigInt,
  timestamp: BigInt
): void {
  let contractAddressHexString = contractAddress.toHexString();
  let nftId = contractAddressHexString + "_" + tokenId.toString();
  let from = fromAddress.toHex();
  let to = toAddress.toHex();

  let erc165Contract = ERC165.bind(contractAddress);
  let erc721Contract = ERC721.bind(contractAddress);
  let erc1155Contract = ERC1155.bind(contractAddress);

  let nftContract = NftContract.load(contractAddressHexString);
  if (nftContract == null) {
    let supportsERC165Identifier = supportsInterface(
      erc165Contract,
      ERC_165_IDENTIFIER
    );
    let supportsERC721Identifier = supportsInterface(
      erc165Contract,
      ERC_721_IDENTIFIER
    );
    let supportsERC1155Identifier = supportsInterface(
      erc165Contract,
      ERC_1155_IDENTIFIER
    );
    let supportsNullIdentifierFalse = supportsInterface(
      erc165Contract,
      NULL_IDENTIFIER,
      false
    );

    let supportsERC721 =
      supportsERC165Identifier &&
      supportsERC721Identifier &&
      supportsNullIdentifierFalse;
    let supportsERC1155 =
      supportsERC165Identifier &&
      supportsERC1155Identifier &&
      supportsNullIdentifierFalse;

    if (!supportsERC721 && !supportsERC1155) {
      return;
    }

    nftContract = new NftContract(contractAddressHexString);
    nftContract.type = supportsERC721 ? ERC721_TYPE : ERC1155_TYPE;
    nftContract.supportsMetadata = supportsInterface(
      erc165Contract,
      supportsERC721
        ? ERC_721_METADATA_IDENTIFIER
        : ERC_1155_METADATA_IDENTIFIER
    );
    nftContract.numTokens = BIG_INT_ZERO;
    nftContract.numOwners = BIG_INT_ZERO;
    if (supportsERC721 && nftContract.supportsMetadata) {
      let name = erc721Contract.try_name();
      if (!name.reverted) {
        nftContract.name = normalize(name.value);
      }
      let symbol = erc721Contract.try_symbol();
      if (!symbol.reverted) {
        nftContract.symbol = normalize(symbol.value);
      }
    }
  }

  if (from != ZERO_ADDRESS_STRING || to != ZERO_ADDRESS_STRING) {
    let nft = Nft.load(nftId);
    if (nft == null) {
      nft = new Nft(nftId);
      nft.contract = nftContract.id;
      nft.mintedAt = timestamp;
      nft.tokenID = tokenId;
    }

    if (from != ZERO_ADDRESS_STRING) {
      // Is existing NFT
      upsertOwnership(nftId, fromAddress, BIG_INT_ZERO.minus(value));
    } // else minting

    if (to != ZERO_ADDRESS_STRING) {
      // Either a transfer or mint
      upsertOwnership(nftId, toAddress, value);

      // Always perform this check since the tokenURI can change over time
      if (nftContract.supportsMetadata) {
        if (nftContract.type == ERC721_TYPE) {
          let metadataURI = erc721Contract.try_tokenURI(tokenId);
          if (!metadataURI.reverted) {
            nft.tokenURI = normalize(metadataURI.value);
          }
        } else {
          // Must be ERC1155
          let metadataURI = erc1155Contract.try_uri(tokenId);
          if (!metadataURI.reverted) {
            nft.tokenURI = normalize(metadataURI.value);
          }
        }
      }

      if (from == ZERO_ADDRESS_STRING) {
        // Mint
        nftContract.numTokens = nftContract.numTokens.plus(BIG_INT_ONE);
      }
    } else {
      nft.burnedAt = timestamp;
      nftContract.numTokens = nftContract.numTokens.minus(BIG_INT_ONE);
    }
    nft.save();

    upsertTransfer(nftId, fromAddress, toAddress, value, timestamp);
  }
  nftContract.save();
}
