import { firstValueFrom } from 'rxjs';
import {
  Deadline,
  Account,
  TransactionService,
  RepositoryFactoryHttp,
  MosaicDefinitionTransaction,
  MosaicNonce,
  MosaicId,
  MosaicFlags,
  UInt64,
  MosaicSupplyChangeTransaction,
  MosaicSupplyChangeAction,
  AggregateTransaction,
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

  const nonce = MosaicNonce.createRandom();

  const supplyMutable = false;
  const transferable = true;
  const restrictable = false;
  const revokable = false;

  const divibility = 2;
  const duration = UInt64.fromUint(0);

  const supply = UInt64.fromUint(1000000);

  const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
    Deadline.create(epochAdjustment),
    nonce,
    MosaicId.createFromNonce(nonce, account.address),
    MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    divibility,
    duration,
    networkType
  );

  const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
    Deadline.create(epochAdjustment),
    mosaicDefinitionTransaction.mosaicId,
    MosaicSupplyChangeAction.Increase,
    supply,
    networkType
  );

  const aggregateTransaction = AggregateTransaction.createComplete(
    Deadline.create(epochAdjustment),
    [
      mosaicDefinitionTransaction.toAggregate(account.publicAccount),
      mosaicSupplyChangeTransaction.toAggregate(account.publicAccount),
    ],
    networkType,
    []
  ).setMaxFeeForAggregate(100, 1);

  const signedTransaction = account.sign(aggregateTransaction, generationHash);

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
