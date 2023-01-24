import { Account, NetworkType } from 'symbol-sdk';

const main = () => {
  const account = Account.generateNewAccount(NetworkType.TEST_NET);
  console.log(`Private Key: ${account.privateKey}`);
  console.log(`Public Key: ${account.publicKey}`);
  console.log(`Address: ${account.address.plain()}`);
};

main();
