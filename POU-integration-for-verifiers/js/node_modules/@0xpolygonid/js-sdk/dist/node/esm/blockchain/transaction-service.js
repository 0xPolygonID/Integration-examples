/**
 * Transaction service to provide interaction with blockchain transactions.
 * allows to: get tx receipt by tx id, send and resend transaction with new fees.
 * @class TransactionService
 * @public
 * @implements ITransactionService interface
 */
export class TransactionService {
    /**
     * Creates an instance of TransactionService.
     * @param {JsonRpcProvider} - RPC provider
     */
    constructor(_provider) {
        this._provider = _provider;
    }
    /** {@inheritDoc ITransactionService.getTransactionReceiptAndBlock} */
    async getTransactionReceiptAndBlock(txnHash) {
        const receipt = await this._provider.getTransactionReceipt(txnHash);
        const block = await receipt?.getBlock();
        return { receipt: receipt || undefined, block };
    }
    /** {@inheritDoc ITransactionService.sendTransactionRequest} */
    async sendTransactionRequest(signer, request) {
        const tx = await signer.sendTransaction(request);
        const txnReceipt = await tx.wait();
        if (!txnReceipt) {
            throw new Error(`transaction: ${tx.hash} failed to mined`);
        }
        const status = txnReceipt.status;
        const txnHash = txnReceipt.hash;
        if (!status) {
            throw new Error(`transaction: ${txnHash} failed to mined`);
        }
        return { txnHash, txnReceipt };
    }
    /** {@inheritDoc ITransactionService.resendTransaction} */
    async resendTransaction(signer, request, opts) {
        const feeData = await this._provider.getFeeData();
        let { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = feeData;
        if (opts?.increasedFeesPercentage) {
            const multiplyVal = BigInt((opts.increasedFeesPercentage + 100) / 100);
            maxFeePerGas = maxFeePerGas ? maxFeePerGas * multiplyVal : null;
            maxPriorityFeePerGas = maxPriorityFeePerGas ? maxPriorityFeePerGas * multiplyVal : null;
            gasPrice = gasPrice ? gasPrice * multiplyVal : null;
        }
        request.maxFeePerGas = maxFeePerGas;
        request.maxPriorityFeePerGas = maxPriorityFeePerGas;
        request.gasPrice = gasPrice;
        return this.sendTransactionRequest(signer, request);
    }
}
