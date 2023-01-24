import { firstValueFrom } from 'rxjs';
import {
  Deadline,
  Account,
  TransactionService,
  RepositoryFactoryHttp,
  AddressAliasTransaction,
  NamespaceId,
  AliasAction,
  MosaicAliasTransaction,
  MosaicId,
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

  const namespaceId = new NamespaceId('daoka.coin');
  const mosaicId = new MosaicId('7870E4A794B191F0');

  const mosaicAliasTransaction = MosaicAliasTransaction.create(
    Deadline.create(epochAdjustment),
    AliasAction.Link,
    namespaceId,
    mosaicId,
    networkType
  ).setMaxFee(100);

  const signedTransaction = account.sign(
    mosaicAliasTransaction,
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
