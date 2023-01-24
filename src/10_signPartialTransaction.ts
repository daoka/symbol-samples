import { firstValueFrom } from 'rxjs';
import {
  CosignatureTransaction,
  RepositoryFactoryHttp,
  TransactionGroup,
  Account,
  AggregateTransaction,
} from 'symbol-sdk';

const cosignerKey =
  'AEEDC4E54E6C561039A677526545C4DD8BCA6C221B61248BFC456C6CBFC5E453';
const targetTxHash =
  '5E2AA29D73EE64EDBC54BE82E7631CBFA77CA8CE39224241AAB55CCDC5FA7277';
const node = 'https://sym-test-04.opening-line.jp:3001';
const repoFactory = new RepositoryFactoryHttp(node);
const transactionHttp = repoFactory.createTransactionRepository();

const main = async () => {
  const networkType = await firstValueFrom(repoFactory.getNetworkType());
  const epochAdjustment = await firstValueFrom(
    repoFactory.getEpochAdjustment()
  );
  const generationHash = await firstValueFrom(repoFactory.getGenerationHash());
  const cosigner = Account.createFromPrivateKey(cosignerKey, networkType);

  const targetTransaction = (await firstValueFrom(
    transactionHttp.getTransaction(targetTxHash, TransactionGroup.Partial)
  )) as AggregateTransaction;
  const cosignatureTx = CosignatureTransaction.create(targetTransaction);
  const signedCosignatureTx =
    cosigner.signCosignatureTransaction(cosignatureTx);
  const result = await firstValueFrom(
    transactionHttp.announceAggregateBondedCosignature(signedCosignatureTx)
  );
  console.log(result);
};

main().then();
