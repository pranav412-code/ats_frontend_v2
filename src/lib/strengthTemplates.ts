/**
 * Expand backend's terse strength/weakness lines into descriptive cards.
 * Backend lines look like: "Strong impact metrics" or "Limited project depth".
 * We classify by keyword and surface a "why it matters" sentence plus
 * (for weaknesses) a suggested action.
 */

interface Template {
  match: RegExp;
  body: string;       // "why it matters" body
  suggest?: string;   // suggestion for weaknesses
}

const STRENGTH_TEMPLATES: Template[] = [
  { match: /impact|metric|quantif/i, body: 'Quantified outcomes prove you delivered, not just participated.' },
  { match: /keyword|jd|alignment/i,  body: 'JD alignment increases your chance of passing keyword-driven screens.' },
  { match: /experience|tenure|role/i, body: 'Recency and role progression signal current relevance.' },
  { match: /format|structure|section/i, body: 'Clean structure means every ATS parses your resume the same way.' },
  { match: /consist|narrative|cohere|story/i, body: 'A coherent story between summary and roles holds recruiter attention.' },
  { match: /skill|technol/i, body: 'A focused skill set signals confidence in your toolkit.' },
  { match: /project|portfolio/i, body: 'Substantial projects fill gaps when work history is shorter.' },
  { match: /cert|award/i, body: 'External validation adds credibility beyond self-claims.' },
  { match: /education|degree/i, body: 'Foundational credentials anchor your application.' },
  { match: /action|verb|intensity/i, body: 'Strong action verbs convey ownership and decisiveness.' },
];

const WEAKNESS_TEMPLATES: Template[] = [
  { match: /impact|metric|quantif/i,
    body: 'Recruiters skim for outcomes. Numbers and scope cues stand out.',
    suggest: 'Add 1-2 quantified bullets per role (%, $, counts, or scale signals).' },
  { match: /keyword|jd|alignment/i,
    body: 'Keyword gaps lower your screen-pass rate even when experience matches.',
    suggest: 'Weave missing keywords into existing bullets where truthful.' },
  { match: /experience|tenure|role|seniority/i,
    body: 'Limited recent experience makes role-fit harder to gauge.',
    suggest: 'Pull in any contract, freelance, or significant project work.' },
  { match: /format|structure|section/i,
    body: 'Unclear structure makes ATS misparse fields.',
    suggest: 'Use one standard section per topic, plain bullets, no images.' },
  { match: /consist|narrative|cohere|story/i,
    body: 'A summary disconnected from experience reads as boilerplate.',
    suggest: 'Mirror your latest role\'s tech and scope in the summary.' },
  { match: /skill|technol/i,
    body: 'A thin skill list hurts ATS matching even with strong experience.',
    suggest: 'Add 3-5 role-relevant tools you\'ve actually used.' },
  { match: /project|portfolio/i,
    body: 'Lack of project depth weakens portfolio-driven roles.',
    suggest: 'Add 1 substantive project with measurable scope.' },
  { match: /cert|award/i,
    body: 'External validation can tip close decisions.',
    suggest: 'List any relevant certifications, even in-progress.' },
  { match: /action|verb|intensity/i,
    body: 'Passive phrasing reads as participation rather than ownership.',
    suggest: 'Lead each bullet with a strong action verb.' },
];

export function expandStrength(raw: string): { headline: string; body: string } {
  const tpl = STRENGTH_TEMPLATES.find((t) => t.match.test(raw));
  return {
    headline: raw,
    body: tpl?.body || 'Tightens overall recruiter impression.',
  };
}

export function expandWeakness(raw: string): { headline: string; body: string; suggest: string } {
  const tpl = WEAKNESS_TEMPLATES.find((t) => t.match.test(raw));
  return {
    headline: raw,
    body: tpl?.body || 'A small refinement can sharpen this further.',
    suggest: tpl?.suggest || 'Revisit this area in the editor.',
  };
}
