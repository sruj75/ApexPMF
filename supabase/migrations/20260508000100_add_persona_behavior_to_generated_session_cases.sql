alter table public.generated_session_cases
  add column if not exists persona_behavior jsonb not null default jsonb_build_object(
    'conversationalFriction',
    jsonb_build_array(
      'hesitation',
      'rambling',
      'vague-answers',
      'mild-discomfort',
      'interruption',
      'questions-back'
    ),
    'weakQuestionSocialSignals',
    jsonb_build_array(
      'politeness',
      'praise',
      'speculation',
      'vague-interest'
    ),
    'strongQuestionTruthAnchors',
    jsonb_build_array('recent-attempt'),
    'trapDelivery',
    'natural-hidden'
  );
