import { firstValueFrom } from 'rxjs';
import {
  Deadline,
  Account,
  TransactionService,
  RepositoryFactoryHttp,
  MultisigAccountModificationTransaction,
  AggregateTransaction,
} from 'symbol-sdk';

const node = 'https://sym-test-04.opening-line.jp:3001';
const repoFactory = new RepositoryFactoryHttp(node);
const transactionHttp = repoFactory.createTransactionRepository();
const receiptHttp = repoFactory.createReceiptRepository();
const transactionService = new TransactionService(transactionHttp, receiptHttp);
const listener = repoFactory.createListener();

const multisigAccountKey =
  'E534942B6FBF5871C2F4B5AC2F2FD591BC1CE688F239745909870D1E1264B1B4';
const cosigner1Key =
  'C6354623696897D24CAE41E89DAC832E7731DE98D61A1FD58B180CC0009FC4B0';
const cosigner2Key =
  'AEEDC4E54E6C561039A677526545C4DD8BCA6C221B61248BFC456C6CBFC5E453';
const cosigner3Key =
  '6456E82D3F276B84822B9B504B6DB4A5C560C219F281160DF988E09E79D4C1D1';

const main = async () => {
  const networkType = await firstValueFrom(repoFactory.getNetworkType());
  const epochAdjustment = await firstValueFrom(
    repoFactory.getEpochAdjustment()
  );
  const generationHash = await firstValueFrom(repoFactory.getGenerationHash());

  const multisigAccount = Account.createFromPrivateKey(
    multisigAccountKey,
    networkType
  );
  const cosigner1 = Account.createFromPrivateKey(cosigner1Key, networkType);
  const cosigner2 = Account.createFromPrivateKey(cosigner2Key, networkType);
  const cosigner3 = Account.createFromPrivateKey(cosigner3Key, networkType);

  const multisigModificationTransaction =
    MultisigAccountModificationTransaction.create(
      Deadline.create(epochAdjustment),
      2,
      2,
      [cosigner1.address, cosigner2.address, cosigner3.address],
      [],
      networkType
    );

  const aggregateTransaction = AggregateTransaction.createComplete(
    Deadline.create(epochAdjustment),
    [
      multisigModificationTransaction.toAggregate(
        multisigAccount.publicAccount
      ),
    ],
    networkType,
    []
  ).setMaxFeeForAggregate(100, 4);

  const signedTransaction = multisigAccount.signTransactionWithCosignatories(
    aggregateTransaction,
    [cosigner1, cosigner2, cosigner3],
    generationHash
  );

  console.log(signedTransaction);

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
