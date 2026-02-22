'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Tag, Save, X, Check } from 'lucide-react';

interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_cents: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface CouponsTableProps {
  initialCoupons: CouponRow[];
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ isActive, validFrom, validUntil }: { isActive: boolean; validFrom: string; validUntil: string | null }) {
  const now = new Date();
  const start = new Date(validFrom);
  const end = validUntil ? new Date(validUntil) : null;

  if (!isActive) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Inactive</span>;
  }
  if (start > now) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Scheduled</span>;
  }
  if (end && end < now) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Expired</span>;
  }
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>;
}

export function CouponsTable({ initialCoupons }: CouponsTableProps) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CouponRow>>({});
  const [saving, setSaving] = useState(false);

  const handleEdit = (coupon: CouponRow) => {
    setEditingId(coupon.id);
    setEditForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_cents: coupon.min_order_cents,
      max_uses: coupon.max_uses,
      is_active: coupon.is_active,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editingId) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/coupons/${editingId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setCoupons(prev => prev.map(c => 
          c.id === editingId ? { ...c, ...editForm } as CouponRow : c
        ));
        setEditingId(null);
        setEditForm({});
      }
    } catch (err) {
      console.error('Failed to save:', err);
    }
    setSaving(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      if (res.ok) {
        setCoupons(prev => prev.map(c => 
          c.id === id ? { ...c, is_active: !currentActive } : c
        ));
      }
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
      {coupons && coupons.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
              <tr>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Discount</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Min. Order</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usage</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valid</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 lg:px-6 py-4">
                    {editingId === coupon.id ? (
                      <input
                        type="text"
                        value={editForm.code ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                        className="px-2 py-1 border rounded text-sm font-mono bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <code className="font-mono font-medium text-blue-600 dark:text-blue-400">{coupon.code}</code>
                      </div>
                    )}
                    {coupon.description && editingId !== coupon.id && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{coupon.description}</p>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {editingId === coupon.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editForm.discount_value ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, discount_value: parseFloat(e.target.value) })}
                          className="w-20 px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                        />
                        <select
                          value={editForm.discount_type ?? 'percentage'}
                          onChange={(e) => setEditForm({ ...editForm, discount_type: e.target.value as 'percentage' | 'fixed' })}
                          className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">$</option>
                        </select>
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}%` 
                          : formatCurrency(coupon.discount_value)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {editingId === coupon.id ? (
                      <input
                        type="number"
                        value={(editForm.min_order_cents ?? 0) / 100}
                        onChange={(e) => setEditForm({ ...editForm, min_order_cents: Math.round(parseFloat(e.target.value) * 100) })}
                        className="w-24 px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      formatCurrency(coupon.min_order_cents)
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {coupon.used_count}
                      {coupon.max_uses !== null && ` / ${coupon.max_uses}`}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span>{formatDate(coupon.valid_from)}</span>
                      {coupon.valid_until && (
                        <>
                          <span className="text-gray-400"> — </span>
                          <span>{formatDate(coupon.valid_until)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                      className="cursor-pointer"
                    >
                      <StatusBadge 
                        isActive={coupon.is_active} 
                        validFrom={coupon.valid_from} 
                        validUntil={coupon.valid_until} 
                      />
                    </button>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-1">
                      {editingId === coupon.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/coupons/${coupon.id}`}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            title="View details"
                          >
                            <Tag className="w-4 h-4" />
                          </Link>
                          <form action={`/api/admin/coupons/${coupon.id}/delete`} method="POST">
                            <button
                              type="submit"
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>No coupons yet</p>
          <Link href="/admin/coupons/new" className="text-blue-600 dark:text-blue-400 hover:underline">
            Create your first coupon
          </Link>
        </div>
      )}
    </div>
  );
}
