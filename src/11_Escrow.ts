import { firstValueFrom } from 'rxjs';
import {
  TransferTransaction,
  Deadline,
  Address,
  EmptyMessage,
  Account,
  TransactionService,
  RepositoryFactoryHttp,
  NetworkCurrencies,
  PublicAccount,
  AggregateTransaction,
  HashLockTransaction,
  UInt64,
} from 'symbol-sdk';

const initiatorKey =
  'C6354623696897D24CAE41E89DAC832E7731DE98D61A1FD58B180CC0009FC4B0';
const cosignerPublicKey =
  'A685D5945F0819D2EE38B958C9A07DBD488CEBA9F577AC7ECAB75EEA1AF5F1F5';
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

  const initiatorAccount = Account.createFromPrivateKey(
    initiatorKey,
    networkType
  );

  const cosignerPublicAccount = PublicAccount.createFromPublicKey(
    cosignerPublicKey,
    networkType
  );

  const transferTransaction1 = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    Address.createFromRawAddress(cosignerPublicAccount.address.plain()),
    [NetworkCurrencies.PUBLIC.currency.createRelative(10)],
    EmptyMessage,
    networkType
  );

  const transferTransaction2 = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    Address.createFromRawAddress(initiatorAccount.address.plain()),
    [NetworkCurrencies.PUBLIC.currency.createRelative(1)],
    EmptyMessage,
    networkType
  );

  const aggregateTransaction = AggregateTransaction.createBonded(
    Deadline.create(epochAdjustment),
    [
      transferTransaction1.toAggregate(initiatorAccount.publicAccount),
      transferTransaction2.toAggregate(cosignerPublicAccount),
    ],
    networkType
  ).setMaxFeeForAggregate(100, 2);

  const signedTransaction = initiatorAccount.sign(
    aggregateTransaction,
    generationHash
  );

  const duration = UInt64.fromUint(2 * 60 * 24 * 2);

  const hashLockTransaction = HashLockTransaction.create(
    Deadline.create(epochAdjustment),
    NetworkCurrencies.PUBLIC.currency.createRelative(10),
    duration,
    signedTransaction,
    networkType
  ).setMaxFee(100);

  const signedHashlockTransaction = initiatorAccount.sign(
    hashLockTransaction,
    generationHash
  );

  listener.open().then(() => {
    transactionService
      .announceHashLockAggregateBonded(
        signedHashlockTransaction,
        signedTransaction,
        listener
      )
      .subscribe({
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
