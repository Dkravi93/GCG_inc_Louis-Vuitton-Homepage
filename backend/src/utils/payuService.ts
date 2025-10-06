import * as crypto from 'crypto';

interface PayUConfig {
  merchantKey: string;
  salt: string;
  environment: 'test' | 'production';
}

interface PaymentData {
  txnid: string;
  productinfo: string;
  amount: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string; // success URL
  furl: string; // failure URL
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export class PayUService {
  private config: PayUConfig;

  constructor() {
    this.config = {
      merchantKey: process.env.PAYU_KEY || process.env.PAYU_MERCHANT_KEY || '',
      salt: process.env.PAYU_SALT || '',
      environment: (process.env.PAYU_MODE as 'test' | 'production') || 'test'
    };

    if (!this.config.merchantKey || !this.config.salt) {
      // Use test credentials for development
      this.config.merchantKey = 'gtKFFx';
      this.config.salt = 'eCwWELxi';
      this.config.environment = 'test';
    }
  }

  /**
   * Generate payment hash for PayU
   */
  generatePaymentHash(paymentData: PaymentData): string {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = ''
    } = paymentData;

    const finalname = firstname.trim();

    // udf1–udf10 → 5 provided, 5 blanks
    const udfValues = [udf1, udf2, udf3, udf4, udf5, '', '', '', '', ''];

    const hashString = [
      this.config.merchantKey,
      txnid,
      amount,
      productinfo,
      finalname,
      email,
      ...udfValues,
      this.config.salt
    ].join('|');

    return crypto.createHash('sha512').update(hashString).digest('hex');
  }


  /**
   * Generate reverse hash for payment verification
   */
generateReverseHash(responseData: any): string {
  const {
    status,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    udf6 = '',
    udf7 = '',
    udf8 = '',
    udf9 = '',
    udf10 = ''
  } = responseData;

  const hashString = `${this.config.salt}|${status}|${udf10}|${udf9}|${udf8}|${udf7}|${udf6}|${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${this.config.merchantKey}`;

  return crypto.createHash('sha512').update(hashString).digest('hex');
}


  /**
   * Verify payment response hash
   */
  verifyPaymentResponse(responseData: any): boolean {
    const receivedHash = responseData.hash;
    const calculatedHash = this.generateReverseHash(responseData);
    return receivedHash === calculatedHash;
  }

  /**
   * Get PayU gateway URL based on environment
   */
  getGatewayUrl(): string {
    return this.config.environment === 'production'
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment';
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId(orderId: string): string {
    const timestamp = Date.now();
    return `TXN_${orderId}_${timestamp}`;
  }

  /**
   * Prepare payment request data
   */
  preparePaymentRequest(orderData: {
    orderId: string;
    amount: number;
    productInfo: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    successUrl: string;
    failureUrl: string;
  }) {
    const txnid = this.generateTransactionId(orderData.orderId);
    
    const paymentData: PaymentData = {
      txnid,
      amount: orderData.amount.toString(), // Convert to string as required by PaymentData interface
      productinfo: orderData.productInfo,
      email: orderData.customerEmail,
      firstname: orderData.customerName,
      surl: orderData.successUrl,
      furl: orderData.failureUrl,
      phone: orderData.customerPhone,
      udf1: orderData.orderId,
    };
    const hash = this.generatePaymentHash(paymentData);

    return {
      key: this.config.merchantKey,
      ...paymentData,
      hash
    };
  }

  /**
   * Parse payment response and extract relevant data
   */
  parsePaymentResponse(responseData: any) {
    return {
      txnid: responseData.txnid,
      amount: parseFloat(responseData.amount),
      productinfo: responseData.productinfo,
      firstname: responseData.firstname,
      email: responseData.email,
      phone: responseData.phone,
      status: responseData.status,
      mihpayid: responseData.mihpayid,
      mode: responseData.mode,
      bankRefNum: responseData.bank_ref_num,
      bankcode: responseData.bankcode,
      udf1: responseData.udf1, // orderId
      udf2: responseData.udf2, // store identifier
      hash: responseData.hash,
      error: responseData.error,
      error_Message: responseData.error_Message,
      addedon: responseData.addedon,
    };
  }

  /**
   * Check if payment was successful
   */
  isPaymentSuccessful(responseData: any): boolean {
    return responseData.status === 'success';
  }

  /**
   * Get payment failure reason
   */
  getFailureReason(responseData: any): string {
    if (responseData.error_Message) {
      return responseData.error_Message;
    }
    
    switch (responseData.status) {
      case 'failure':
        return 'Payment failed due to insufficient funds or other payment issues.';
      case 'cancel':
        return 'Payment was cancelled by the user.';
      case 'pending':
        return 'Payment is pending. Please wait for confirmation.';
      default:
        return 'Payment failed due to unknown error.';
    }
  }

  /**
   * Validate payment amount
   */
  validatePaymentAmount(expectedAmount: number, receivedAmount: number): boolean {
    return Math.abs(expectedAmount - receivedAmount) < 0.01; // Allow for minor floating point differences
  }
}

export const payuService = new PayUService();