import { firstValueFrom } from 'rxjs';
import {
  Deadline,
  Account,
  TransactionService,
  RepositoryFactoryHttp,
  NamespaceRegistrationTransaction,
  UInt64,
} from 'symbol-sdk';

const accountPrivateKey =
  'F6DA79662B4A9B4D2538E169DB924769A5C9B3B000A84D4A3654B09F2CDC178B';
const targetAddress = 'TB5SUCCQIOISBCMTSYLYLGGAA3MIMYNC6KMRAHY';
const node = 'https://sym-test-04.opening-line.jp:3001';
const repoFactory = new RepositoryFactoryHttp(node);
const transactionHttp = repoFactory.createTransactionRepository();
const receiptHttp = repoFactory.createReceiptRepository();
const transactionService = new TransactionService(transactionHttp, receiptHttp);
const listener = repoFactory.createListener();

const main = async () => {
  const networkType = await firstValueFrom(repoFactory.getNetworkType());
  const epochAdjustment = await firstValueFrom(
    repoFactory.getEpochAdjustment()
  );
  const generationHash = await firstValueFrom(repoFactory.getGenerationHash());

  const account = Account.createFromPrivateKey(accountPrivateKey, networkType);

  const namespaceName = 'yamada';
  const duration = UInt64.fromUint(2 * 60 * 24 * 365);

  const namespaceCreatetionTransaction =
    NamespaceRegistrationTransaction.createRootNamespace(
      Deadline.create(epochAdjustment),
      namespaceName,
      duration,
      networkType
    ).setMaxFee(100);

  const signedTransaction = account.sign(
    namespaceCreatetionTransaction,
    generationHash
  );

  listener.open().then(() => {
    transactionService.announce(signedTransaction, listener).subscribe({
      next: (x) => {
        console.log(x);
      },
      error: (err) => {
        console.error(err);
      },
      complete: () => {
        listener.close();
      },
    });
  });
};

main().then();
