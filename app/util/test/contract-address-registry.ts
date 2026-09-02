/* eslint-disable @typescript-eslint/no-explicit-any -- TODO: Type legacy contract registry fixtures. */
/*
 * Use this class to store pre-deployed smart contract addresses of the contracts deployed to
 * a local blockchain instance.
 */
class ContractAddressRegistry {
  #addresses = {};

  /**
   * Store new contract address in key:value pair.
   *
   * @param contractName
   * @param contractAddress
   */
  storeNewContractAddress(contractName: any, contractAddress: any) {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    this.#addresses[contractName] = contractAddress;
  }

  /**
   * Get deployed contract address by its name (key).
   *
   * @param contractName
   */
  getContractAddress(contractName: any) {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    return this.#addresses[contractName];
  }
}

export default ContractAddressRegistry;
