// payuPaymentService.ts
import crypto from 'crypto';
import qs from 'querystring';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

type PayUMode = 'sandbox' | 'production';

interface CreatePaymentData {
  txnId?: string;            // optional: we can generate
  amount: number;            // INR, e.g. 499.00
  productInfo: string;       // simple string or JSON string
  firstName: string;
  email: string;
  phone?: string;
  udf?: Record<string, string>;
  successUrl?: string;
  failureUrl?: string;
}

interface PayUConfig {
  key: string;
  salt: string;
  mode: PayUMode;
  successUrl: string;
  failureUrl: string;
}

class PayUPaymentService {
  private config: PayUConfig;
  private paymentEndpoint: string;

  constructor() {
    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_SALT;
    const mode = (process.env.PAYU_MODE as PayUMode) || 'sandbox';
    const successUrl = process.env.PAYU_SUCCESS_URL || '';
    const failureUrl = process.env.PAYU_FAILURE_URL || '';

    if (!key || !salt) {
      throw new Error('PAYU_KEY and PAYU_SALT must be set in env');
    }
    this.config = { key, salt, mode, successUrl, failureUrl };
    this.paymentEndpoint =
      mode === 'sandbox' ? 'https://test.payu.in/_payment' : 'https://secure.payu.in/_payment';
  }

  // simple txn id generator
  private generateTxnId(): string {
    return 'tx_' + crypto.randomBytes(8).toString('hex');
  }

  /**
   * Generate the SHA512 hash for the payment form submission
   * PayU expects: hash = sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
   * Note: number formatting must match (string), amount should be fixed to 2 decimals
   */
  private generateHash(params: {
    key: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
  }): string {
    const {
      key, txnid, amount, productinfo, firstname, email
    } = params;

    // old PayU formula: key|txnid|amount|productinfo|firstname|email|||||||||||salt
    // ensure amount formatting (2 decimals)
    const amountStr = parseFloat(amount).toFixed(2);

      const salt = this.config.salt;

          const udf1 = '';
          const udf2 = '';
          const udf3 = '';
          const udf4 = '';
          const udf5 = '';

    const hashString = `${key}|${txnid}|${amountStr}|${productinfo}|${firstname}|${email}||||||${salt}`;
    
    // Generate SHA-512 hash
    return crypto.createHash('sha512').update(hashString).digest('hex');
  }

  /**
   * Create the payload (form fields) you need to post to PayU
   * You can return the HTML form (auto-submit) or return the fields to client for post.
   */
  public createPaymentPayload(data: CreatePaymentData) {
    const txnid = data.txnId || this.generateTxnId();
    const amountStr = data.amount.toFixed(2);
    const productinfo = data.productInfo;
    const firstname = data.firstName;
    const email = data.email;

    const fields: Record<string, string> = {
      key: this.config.key,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email,
      phone: data.phone || '',
      surl: data.successUrl || this.config.successUrl,
      furl: data.failureUrl || this.config.failureUrl,
      // optional: service_provider might be required sometimes (e.g. 'payu_paisa' historically)
      // service_provider: 'payu_paisa',
    };

    // include udf fields if present
    if (data.udf) {
      Object.keys(data.udf).slice(0, 10).forEach((k, i) => {
        // PayU supports udf1..udf10
        const keyName = `udf${i + 1}`;
        fields[keyName] = data.udf![k] ?? '';
      });
    }

    const hash = this.generateHash({
      key: fields.key,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email
    });

    fields.hash = hash;

    // return the fields and endpoint. You can either return an auto-submit HTML form or JSON.
    const htmlForm = `
      <html>
        <head><meta charset="utf-8"/></head>
        <body onload="document.forms[0].submit()">
          <form action="${this.paymentEndpoint}" method="post">
            ${Object.entries(fields)
              .map(([k, v]) => `<input type="hidden" name="${k}" value="${v || ''}"/>`)
              .join('\n')}
          </form>
        </body>
      </html>
    `;

    return { txnid, fields, htmlForm, endpoint: this.paymentEndpoint };
  }

  /**
   * Verify response postback from PayU
   * PayU returns a hash. To verify, you reconstruct the string:
   * hashSeq = salt|status|||||||||||email|firstname|productinfo|amount|txnid|key
   * then sha512(hashSeq) should equal posted hash.
   */
  public verifyResponseHash(postData: Record<string, any>): boolean {
    const postedHash = postData.hash || postData['hash'];
    const status = postData.status || '';
    const email = postData.email || '';
    const firstname = postData.firstname || '';
    const productinfo = postData.productinfo || '';
    const amount = postData.amount ? parseFloat(postData.amount).toFixed(2) : '';
    const txnid = postData.txnid || '';
    const key = this.config.key;
    const salt = this.config.salt;

    // Build reverse string: salt|status|||||||||||email|firstname|productinfo|amount|txnid|key
    const rev = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = crypto.createHash('sha512').update(rev).digest('hex');

    // PayU posts lowercase hex hash - compare in lowercase
    return calculatedHash === (postedHash || '').toLowerCase();
  }

  /**
   * Handle PayU server->server verify (optional): call PayU 'verify_payment' / postservice
   * Use this for reconciliation or in addition to verifying posted hash.
   * Docs: https://docs.payu.in/reference/verify_payment_api
   */
  public async verifyPaymentServer(var1: string) {
    // var1 is typically txnid or payu's transaction id depending on API
    const endpoint =
      this.config.mode === 'sandbox'
        ? 'https://test.payu.in/merchant/postservice.php?form=2'
        : 'https://info.payu.in/merchant/postservice.php?form=2';

    const body = { key: this.config.key, var1 };

    try {
      const resp = await axios.post(endpoint, qs.stringify(body), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return resp.data;
    } catch (err) {
      console.error('PayU verifyPaymentServer error', err);
      throw err;
    }
  }

  /**
   * Example refund call. PayU provides a refund API (merchant/refund or via Postservice).
   * You must check your PayU merchant panel & docs for exact endpoint and required fields (refund API might require merchant key + signature).
   * This function is a template and may need adjustment depending on your PayU account type.
   */
  public async refund(txnid: string, refundAmount: number, reason?: string) {
    // NOTE: implement per your PayU account's refund API. This is a generic example of calling an API endpoint.
    const endpoint =
      this.config.mode === 'sandbox'
        ? 'https://test.payu.in/merchant/refund.php' // example - check exact path in your docs
        : 'https://secure.payu.in/merchant/refund.php';

    const payload = {
      key: this.config.key,
      command: 'refund_transaction',
      var1: txnid,
      refund_amount: refundAmount.toFixed(2),
      // possibly include additional required fields and signature/hash
    };

    try {
      const resp = await axios.post(endpoint, qs.stringify(payload), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return resp.data;
    } catch (err) {
      console.error('PayU refund error', err);
      throw err;
    }
  }
}

export const payuPaymentService = new PayUPaymentService();
export default PayUPaymentService;
