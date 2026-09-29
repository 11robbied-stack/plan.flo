export const variationStatuses = ['Draft', 'Pending', 'Approved', 'Rejected'] as const;
export function variationStatus(status: string): string {
  if (status === 'Submitted' || status === 'Under review') return 'Pending';
  if (status === 'Invoiced') return 'Approved';
  return status || 'Draft';
}
// Used on every write path; totals are always calculated from line items, ex GST.
export function variationInput(status: unknown, data: any) {
  if (!variationStatuses.includes(status as any)) throw new Error('Choose Draft, Pending, Approved or Rejected.');
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid variation details.');
  if (data.items !== undefined && (!Array.isArray(data.items) || data.items.length > 200)) throw new Error('Use up to 200 variation items.');
  const items = data.items || [];
  let cents = 0;
  for (const item of items) {
    const quantity = Number(item?.quantity), rate = Number(item?.rate);
    if (!Number.isFinite(quantity) || !Number.isFinite(rate) || quantity < 0 || rate < 0) throw new Error('Enter a valid quantity and rate for every variation item.');
    cents += Math.round(quantity * rate * 100);
  }
  if (!items.length) cents = Math.round(Number(data.amount || 0) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 100000000000000) throw new Error('Enter a valid variation amount.');
  return {...data, status, amount: cents / 100};
}
