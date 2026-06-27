import type { CreditPack, Entitlement, Subscription } from '../store/useResumeStore';

const PACK_LABELS: Record<string, string> = {
  monthly: 'Job Seeker',
  career_sprint: 'Career Sprint',
};

function packLabel(id: string, creditPacks?: CreditPack[] | null): string {
  return creditPacks?.find((p) => p.id === id)?.label ?? PACK_LABELS[id] ?? id;
}

export interface PlanDisplay {
  loading: boolean;
  isPaid: boolean;
  label: string;
  details: string;
  summary: string;
}

/** Derive plan banner copy from subscription + entitlement (entitlement is the slot source of truth). */
export function resolvePlanDisplay(
  subscription: Subscription | null,
  entitlement: Entitlement | null,
  creditPacks?: CreditPack[] | null,
): PlanDisplay {
  const paidFromEntitlement = !!entitlement?.plan && entitlement.plan !== 'free';
  const paidFromSubscription = subscription?.active === true;
  const isPaid = paidFromSubscription || paidFromEntitlement;
  const loading = subscription === null && !paidFromEntitlement;

  const freeDetails = 'Upgrade for more credits, slots, and priority processing.';

  if (loading) {
    return { loading: true, isPaid: false, label: '…', details: '', summary: '' };
  }

  if (paidFromSubscription && subscription?.label) {
    const summary = `${subscription.credits_per_month} cr/mo · ${subscription.resume_slots} slots`;
    return {
      loading: false,
      isPaid: true,
      label: subscription.label,
      details: `${subscription.credits_per_month} credits/mo · ${subscription.resume_slots} slots · priority`,
      summary,
    };
  }

  if (paidFromEntitlement && entitlement) {
    const pack = creditPacks?.find((p) => p.id === entitlement.plan);
    const label = subscription?.label ?? packLabel(entitlement.plan, creditPacks);
    const summary = pack?.credits_per_month && pack.resume_slots
      ? `${pack.credits_per_month} cr/mo · ${pack.resume_slots} slots`
      : `${entitlement.slot_limit} slots`;
    const details = pack?.credits_per_month && pack.resume_slots
      ? `${pack.credits_per_month} credits/mo · ${pack.resume_slots} slots · priority`
      : `${entitlement.slot_limit} slots${entitlement.priority ? ' · priority' : ''}`;
    return { loading: false, isPaid: true, label, details, summary };
  }

  return { loading: false, isPaid: false, label: 'Free plan', details: freeDetails, summary: '' };
}
