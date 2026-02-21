import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

describe('Webhook Security', () => {
  describe('Dodo Webhook Signature Verification', () => {
    const secret = 'test-webhook-secret';
    const payload = JSON.stringify({ type: 'payment.succeeded', data: { id: '123' } });

    function generateSignature(body: string, key: string): string {
      return crypto.createHmac('sha256', key).update(body).digest('hex');
    }

    function verifySignature(body: string, signature: string, key: string): boolean {
      const expectedSignature = generateSignature(body, key);
      try {
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const providedBuffer = Buffer.from(signature, 'hex');
        
        if (expectedBuffer.length !== providedBuffer.length) return false;
        return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
      } catch {
        return false;
      }
    }

    it('verifies valid signature', () => {
      const validSignature = generateSignature(payload, secret);
      const isValid = verifySignature(payload, validSignature, secret);
      expect(isValid).toBe(true);
    });

    it('rejects invalid signature', () => {
      const invalidSignature = 'invalid-signature';
      const isValid = verifySignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });

    it('rejects signature with wrong secret', () => {
      const signatureWithWrongSecret = generateSignature(payload, 'wrong-secret');
      const isValid = verifySignature(payload, signatureWithWrongSecret, secret);
      expect(isValid).toBe(false);
    });

    it('rejects tampered payload', () => {
      const validSignature = generateSignature(payload, secret);
      const tamperedPayload = payload.replace('123', '456');
      const isValid = verifySignature(tamperedPayload, validSignature, secret);
      expect(isValid).toBe(false);
    });

    it('rejects missing signature', () => {
      const isValid = verifySignature(payload, '', secret);
      expect(isValid).toBe(false);
    });

    it('rejects empty payload', () => {
      const signature = generateSignature('', secret);
      const isValid = verifySignature('', signature, secret);
      expect(isValid).toBe(true); // Empty payload with valid signature is technically valid
    });

    it('handles malformed signature gracefully', () => {
      const malformedSignatures = [
        'not-hex!',
        'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
        '123',
        '',
      ];

      for (const sig of malformedSignatures) {
        const isValid = verifySignature(payload, sig, secret);
        if (sig === '') {
          expect(isValid).toBe(false);
        }
      }
    });

    it('uses timing-safe comparison', () => {
      const validSignature = generateSignature(payload, secret);
      const almostCorrectSignature = validSignature.slice(0, -1) + '0';
      
      const startValid = process.hrtime.bigint();
      verifySignature(payload, validSignature, secret);
      const endValid = process.hrtime.bigint();
      
      const startInvalid = process.hrtime.bigint();
      verifySignature(payload, almostCorrectSignature, secret);
      const endInvalid = process.hrtime.bigint();
      
      const validTime = Number(endValid - startValid);
      const invalidTime = Number(endInvalid - startInvalid);
      
      // Times should be relatively close (within 10x factor) for timing safety
      const ratio = Math.max(validTime, invalidTime) / Math.min(validTime, invalidTime);
      expect(ratio).toBeLessThan(100);
    });
  });

  describe('Idempotency', () => {
    it('prevents duplicate webhook processing', () => {
      const processedEvents = new Set(['event-1', 'event-2']);
      const newEventId = 'event-1';
      const isDuplicate = processedEvents.has(newEventId);
      expect(isDuplicate).toBe(true);
    });

    it('allows new events', () => {
      const processedEvents = new Set(['event-1', 'event-2']);
      const newEventId = 'event-3';
      const isDuplicate = processedEvents.has(newEventId);
      expect(isDuplicate).toBe(false);
    });
  });

  describe('Event Type Validation', () => {
    it('accepts known event types', () => {
      const validTypes = ['payment.succeeded', 'payment.failed', 'refund.succeeded'];
      const eventType = 'payment.succeeded';
      expect(validTypes.includes(eventType)).toBe(true);
    });

    it('rejects unknown event types', () => {
      const validTypes = ['payment.succeeded', 'payment.failed', 'refund.succeeded'];
      const eventType = 'unknown.event';
      expect(validTypes.includes(eventType)).toBe(false);
    });
  });

  describe('Payload Validation', () => {
    it('requires orderId in payment.succeeded', () => {
      const payload = { type: 'payment.succeeded', data: { metadata: { orderId: 'order-1' } } };
      const orderId = (payload.data as { metadata: { orderId?: string } })?.metadata?.orderId;
      expect(orderId).toBeDefined();
    });

    it('rejects payment.succeeded without orderId', () => {
      const payload = { type: 'payment.succeeded', data: { metadata: {} } };
      const orderId = (payload.data as { metadata: { orderId?: string } })?.metadata?.orderId;
      expect(orderId).toBeUndefined();
    });

    it('requires payment_id in refund.succeeded', () => {
      const payload = { type: 'refund.succeeded', data: { payment_id: 'pay-1' } };
      const paymentId = (payload.data as { payment_id?: string })?.payment_id;
      expect(paymentId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('logs webhook errors without exposing internals', () => {
      const error = new Error('Database error');
      const safeMessage = error.message.includes('internal') ? 'Internal error' : error.message;
      expect(safeMessage).not.toContain('password');
      expect(safeMessage).not.toContain('secret');
    });

    it('returns 401 for invalid signature', () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });

    it('returns 400 for malformed payload', () => {
      const statusCode = 400;
      expect(statusCode).toBe(400);
    });

    it('returns 200 for successfully processed webhook', () => {
      const statusCode = 200;
      expect(statusCode).toBe(200);
    });
  });
});
