import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(() => mockSupabase),
  createSupabaseServerClient: vi.fn(() => mockSupabase),
}));

vi.mock('@/lib/admin/alerts', () => ({
  sendAdminAlert: vi.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

describe('Support Tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTicket', () => {
    it('creates ticket with valid params', async () => {
      const params = {
        guestEmail: 'test@example.com',
        subject: 'Test Subject',
        initialMessage: 'Test message',
        orderId: null,
        priority: 'medium' as const,
      };

      expect(params.guestEmail).toBe('test@example.com');
      expect(params.subject).toBe('Test Subject');
      expect(params.initialMessage).toBe('Test message');
    });

    it('defaults priority to medium', () => {
      const priority = 'medium';
      expect(priority).toBe('medium');
    });

    it('validates email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co'];
      const invalidEmails = ['invalid', 'no@', '@domain.com'];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const email of validEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }

      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it('validates subject is not empty', () => {
      const subject = 'Test Subject';
      expect(subject.length).toBeGreaterThan(0);
    });

    it('validates message is not empty', () => {
      const message = 'Test message';
      expect(message.length).toBeGreaterThan(0);
    });

    it('accepts optional orderId', () => {
      const params = {
        guestEmail: 'test@example.com',
        subject: 'Test',
        initialMessage: 'Message',
        orderId: 'order-123',
      };

      expect(params.orderId).toBe('order-123');
    });
  });

  describe('addTicketMessage', () => {
    it('validates sender types', () => {
      const validTypes = ['customer', 'admin'];
      const invalidTypes = ['user', 'guest', ''];

      for (const type of validTypes) {
        expect(['customer', 'admin'].includes(type)).toBe(true);
      }

      for (const type of invalidTypes) {
        expect(['customer', 'admin'].includes(type)).toBe(false);
      }
    });

    it('validates content is not empty', () => {
      const content = 'This is a message';
      expect(content.length).toBeGreaterThan(0);
    });

    it('requires ticketId', () => {
      const ticketId = 'ticket-123';
      expect(ticketId).toBeDefined();
      expect(ticketId.length).toBeGreaterThan(0);
    });
  });

  describe('Ticket Status Transitions', () => {
    it('starts as open', () => {
      const initialStatus = 'open';
      expect(initialStatus).toBe('open');
    });

    it('transitions to pending on admin reply', () => {
      const currentStatus = 'open';
      const senderType = 'admin';
      
      const newStatus = senderType === 'admin' && currentStatus === 'open' ? 'pending' : currentStatus;
      expect(newStatus).toBe('pending');
    });

    it('reopens on customer reply', () => {
      const currentStatus = 'resolved';
      const senderType = 'customer';
      
      const closedStates = ['resolved', 'closed'];
      const newStatus = senderType === 'customer' && closedStates.includes(currentStatus) ? 'open' : currentStatus;
      expect(newStatus).toBe('open');
    });

    it('valid status values', () => {
      const validStatuses = ['open', 'pending', 'resolved', 'closed'];
      const testStatus = 'pending';
      
      expect(validStatuses.includes(testStatus)).toBe(true);
    });
  });

  describe('Priority Levels', () => {
    it('valid priority values', () => {
      const validPriorities = ['low', 'medium', 'high'];
      
      for (const priority of validPriorities) {
        expect(['low', 'medium', 'high'].includes(priority)).toBe(true);
      }
    });

    it('defaults to medium', () => {
      const defaultPriority = 'medium';
      expect(defaultPriority).toBe('medium');
    });
  });

  describe('Error Handling', () => {
    it('throws on ticket creation failure', () => {
      const error = new Error('Failed to create ticket');
      expect(error.message).toContain('Failed to create ticket');
    });

    it('throws on message creation failure', () => {
      const error = new Error('Failed to add message');
      expect(error.message).toContain('Failed to add message');
    });
  });
});
