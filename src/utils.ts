import { ByteArray, Bytes } from "@graphprotocol/graph-ts";
import { ERC165 } from "../generated/ERC721/ERC165";

export function supportsInterface(
  contract: ERC165,
  interfaceId: string,
  expected: boolean = true
): boolean {
  let supports = contract.try_supportsInterface(
    Bytes.fromHexString(interfaceId)
  );
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
