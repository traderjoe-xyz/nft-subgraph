import { Bytes } from "@graphprotocol/graph-ts";
import { ERC721 } from "../../generated/ERC721/ERC721";

export function toBytes(hexString: String): Bytes {
  let result = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    result[i / 2] = parseInt(hexString.substr(i, 2), 16) as u32;
  }
  return result as Bytes;
}

export function supportsInterface(
  contract: ERC721,
  interfaceId: String,
  expected: boolean = true
): boolean {
  let supports = contract.try_supportsInterface(toBytes(interfaceId));
  return !supports.reverted && supports.value == expected;
}

export function setCharAt(str: string, index: i32, char: string): string {
  if (index > str.length - 1) return str;
  return str.substr(0, index) + char + str.substr(index + 1);
}

export function normalize(strValue: string): string {
  if (strValue.length === 1 && strValue.charCodeAt(0) === 0) {
    return "";
  } else {
    for (let i = 0; i < strValue.length; i++) {
      if (strValue.charCodeAt(i) === 0) {
        strValue = setCharAt(strValue, i, "\ufffd"); // graph-node db does not support string with '\u0000'
      }
    }
    return strValue;
  }
}
