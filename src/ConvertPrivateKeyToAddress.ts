import { Account, NetworkType } from 'symbol-sdk';

const main = () => {
  const privateKey =
    'AEEDC4E54E6C561039A677526545C4DD8BCA6C221B61248BFC456C6CBFC5E453';
  const account = Account.createFromPrivateKey(
    privateKey,
    NetworkType.TEST_NET
  );
  console.log(`privateKey ${account.privateKey}`);
  console.log(`publicKey ${account.publicKey}`);
  console.log(`address ${account.address.plain()}`);
};

main();
